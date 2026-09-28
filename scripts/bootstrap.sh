#!/usr/bin/env bash
# Sätter upp en Mac för Antrops prototypmall, från tom dator till körbar prototyp.
#
#   curl -fsSL https://raw.githubusercontent.com/antrop-ab/antrop-prototype-template/main/scripts/bootstrap.sh | bash
#
# Är Antroparen administratör installeras Homebrew först (lösenordet behövs en
# gång, sedan kan kodagenten själv installera till exempel ffmpeg eller en databas
# med brew). Annars hamnar Node och GitHub CLI i ~/.local, utan lösenord.
# Skriptet kan köras om hur många gånger som helst, det som redan är klart hoppas
# över. Det Antroparen själv gör:
#   - skriver sitt datorlösenord för Homebrew, eller klickar Installera i rutan
#     för Apples utvecklarverktyg (ger git) om Homebrew hoppas över
#   - godkänner GitHub, och Vercel om hen vill dela, i webbläsaren
#
# Val (skrivs efter `| bash -s --`):
#   --name <namn>   prototypens namn, blir både repo och mapp (annars frågar skriptet)
#   --dir <mapp>    var prototypen hamnar (standard: ~/Documents)
#   --here          lägg prototypen i mappen du står i (den måste vara tom)
#   --no-project    bara verktyg och inloggning, ingen prototyp
#   --vercel        koppla till Vercel på slutet utan att fråga
#   --no-vercel     hoppa över Vercel
#   --no-brew       hoppa över Homebrew
#
# Körs skriptet utan terminal (till exempel av en kodagent) frågar det ingenting.
# Inloggningen på GitHub skriver då ut en engångskod som Antroparen klistrar in i
# webbläsaren.

# Verktygen och inloggningen sköts av https://github.com/antrop-ab/antrop-setup (gemensamt för
# Antrops mallar). Det här skriptet gör sedan det som är unikt för mallen.

set -uo pipefail

TEMPLATE="antrop-ab/antrop-prototype-template"
ORG="antrop-ab"

NAME=""
PARENT="$HOME/Documents"
HERE=0
PROJECT=1
VERCEL="ask"
BREW_WANTED="ask"

while [ $# -gt 0 ]; do
  case "$1" in
    --name) NAME="${2:-}"; shift 2 ;;
    --dir) PARENT="${2:-}"; shift 2 ;;
    --here) HERE=1; shift ;;
    --no-project) PROJECT=0; shift ;;
    --vercel) VERCEL="yes"; shift ;;
    --no-vercel) VERCEL="no"; shift ;;
    --no-brew) BREW_WANTED="no"; shift ;;
    *) printf 'Okänt val: %s\n' "$1" >&2; exit 2 ;;
  esac
done

if [ -t 1 ]; then B=$'\033[1m'; R=$'\033[0m'; else B=""; R=""; fi
step() { printf '\n%s==> %s%s\n' "$B" "$1" "$R"; }
ok() { printf '    Klart: %s\n' "$1"; }
info() { printf '    %s\n' "$1"; }
fail() {
  printf '\n%sStopp:%s %s\n' "$B" "$R" "$1" >&2
  [ -n "${2:-}" ] && printf '       %s\n' "$2" >&2
  exit 1
}

# /dev/tty finns även när skriptet kommer via `curl | bash`, men inte när en kodagent kör det.
if ( : </dev/tty ) 2>/dev/null; then HAS_TTY=1; else HAS_TTY=0; fi
ask() {
  local answer=""
  if [ "$HAS_TTY" = 1 ]; then
    printf '    %s ' "$1" >/dev/tty
    read -r answer </dev/tty || true
  fi
  printf '%s' "${answer:-$2}"
}
yes_answer() { case "$1" in j|J|ja|Ja|y|Y|yes) return 0 ;; *) return 1 ;; esac; }

# Gamla eller felaktiga tokens och andra GitHub-värdar går annars före
# inloggningen på github.com. Gäller bara det här skriptet.
unset GH_HOST GH_TOKEN GITHUB_TOKEN GH_ENTERPRISE_TOKEN

[ "$(uname -s)" = "Darwin" ] || fail "Skriptet är gjort för Mac." "På Windows: följ docs/kom-igang.md."

export PATH="$HOME/.local/bin:$HOME/.local/node/bin:$PATH"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# Verktyg och inloggning -------------------------------------------------------

# Homebrew, git, GitHub CLI och inloggningen är gemensamma för Antrops mallar och sköts av
# https://github.com/antrop-ab/antrop-setup. Rätta där, inte här.
SETUP_URL="${ANTROP_SETUP_URL:-https://raw.githubusercontent.com/antrop-ab/antrop-setup/main/setup.sh}"
curl -fsSL "$SETUP_URL" -o "$TMP/setup.sh" \
  || fail "Kunde inte hämta Antrops setup-skript." "Kolla internetuppkopplingen och kör skriptet igen."
setup_args=(--title "Antrops prototypmall" --node --org "$ORG" --gh-scopes workflow --brew-default j)
[ "$BREW_WANTED" = "no" ] && setup_args+=(--no-brew)
# stdin från /dev/null: skriptet kan komma via `curl | bash`, och då får setup inte läsa resten av det.
bash "$TMP/setup.sh" "${setup_args[@]}" </dev/null || exit 1
for brew in /opt/homebrew/bin/brew /usr/local/bin/brew; do
  [ -x "$brew" ] && { eval "$("$brew" shellenv)"; break; }
done
hash -r

# 6. Prototypen ---------------------------------------------------------------

if [ "$PROJECT" = 0 ]; then
  step "Klart"
  info "Verktygen och inloggningen är på plats."
  exit 0
fi

step "Din prototyp"
[ "$(gh api "user/memberships/orgs/$ORG" --jq .state 2>/dev/null)" = "active" ] \
  || fail "Ditt GitHub-konto är inte medlem i $ORG, så mallen syns inte för dig." \
    "Be någon på Antrop bjuda in $(gh api user --jq .login) till https://github.com/$ORG och kör skriptet igen."
if [ "$HERE" = 1 ]; then
  target="$PWD"
  [ -n "$NAME" ] || NAME="$(basename "$PWD" | tr '[:upper:] ' '[:lower:]-')"
else
  [ -n "$NAME" ] || NAME="$(ask "Vad ska prototypen heta? Gärna kund och ämne, små bokstäver och bindestreck [min-prototyp]:" "min-prototyp")"
  target="$PARENT/$NAME"
fi
[[ "$NAME" =~ ^[a-z0-9][a-z0-9._-]*$ ]] || fail "\"$NAME\" går inte att använda som namn." "Använd små bokstäver a till z, siffror och bindestreck, till exempel --name kund-bokning."

if git -C "$target" rev-parse -q --verify HEAD >/dev/null 2>&1 && [ -d "$target/.git" ]; then
  ok "Prototypen finns redan i $target"
else
  # .DS_Store och en .claude som Claude-appen skapat får finnas kvar, allt annat stoppar.
  if [ -d "$target" ] && [ -n "$(ls -A "$target" | grep -vxE '\.DS_Store|\.claude')" ]; then
    if [ "$HERE" = 1 ]; then hint="Skapa en tom mapp och kör skriptet där."; else hint="Välj ett annat namn med --name."; fi
    fail "Mappen $target är inte tom." "$hint"
  fi
  if gh repo view "$ORG/$NAME" >/dev/null 2>&1; then
    info "Repot $ORG/$NAME finns redan på GitHub. Hämtar det."
  else
    info "Skapar det privata repot $ORG/$NAME från mallen"
    gh repo create "$ORG/$NAME" --template "$TEMPLATE" --private >/dev/null || fail "Kunde inte skapa repot på GitHub."
    # GitHub fyller det nya repot från mallen i bakgrunden. Vänta tills main finns.
    for _ in $(seq 1 30); do
      git ls-remote --exit-code "https://github.com/$ORG/$NAME.git" main >/dev/null 2>&1 && break
      sleep 2
    done
  fi
  # init och fetch i stället för clone, så att det fungerar i en mapp som inte är helt tom.
  mkdir -p "$target"
  { git -C "$target" init -q -b main \
    && git -C "$target" remote add origin "https://github.com/$ORG/$NAME.git" \
    && git -C "$target" fetch -q origin main \
    && git -C "$target" checkout -q -f -B main --track origin/main; } \
    || fail "Kunde inte hämta repot $ORG/$NAME."
  ok "Prototypen ligger i $target"
fi

cd "$target" || fail "Kunde inte öppna $target."
info "Installerar paket och hämtar senaste shadcn-komponenterna och skills. Det tar några minuter."
npm run setup || fail "npm run setup stötte på problem." "Öppna mappen i Claude-appen och skriv: \"Hjälp mig få igång npm run setup\"."

# 7. Vercel -------------------------------------------------------------------

step "Vercel: publicering och AI (valfritt)"
if [ "$VERCEL" = "ask" ]; then
  if yes_answer "$(ask "Koppla till Vercel nu? Då kan Claude publicera länkar och använda AI direkt. [J/n]:" "j")"; then VERCEL="yes"; else VERCEL="no"; fi
fi
if [ "$VERCEL" = "yes" ] && [ "$HAS_TTY" = 0 ]; then
  info "Inloggningen på Vercel behöver ett Terminal-fönster. Kör skriptet igen i Terminal med --vercel."
  VERCEL="no"
elif [ "$VERCEL" = "yes" ]; then
  if ! npx -y vercel@latest whoami >/dev/null 2>&1; then
    info "Webbläsaren öppnas. Välj Continue with GitHub och godkänn."
    npx -y vercel@latest login </dev/tty || fail "Inloggningen på Vercel blev inte klar." "Kör skriptet igen med --vercel."
  fi
  npm run vercel:link </dev/tty || info "Kopplingen blev inte klar. Claude kan göra den senare med npm run vercel:link."
  ok "Kopplad. Säg \"publicera\" till Claude när du vill ha en länk att dela."
fi
[ "$VERCEL" = "no" ] && info "Hoppade över. Claude hjälper dig första gången du vill publicera."

# Klart -----------------------------------------------------------------------

step "Allt är klart"
info "1. Öppna Claude-appen, gå till fliken Code och starta en ny chatt."
info "2. Välj mappen $target."
info "3. Skriv vad du vill bygga, till exempel:"
info "   \"Kunden är ett försäkringsbolag med huvudfärgen #0B5FFF. Gör en vy där man anmäler en skada.\""
exit 0
