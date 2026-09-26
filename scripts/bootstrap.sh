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

set -uo pipefail

TEMPLATE="antrop-ab/antrop-prototype-template"
ORG="antrop-ab"
BIN="$HOME/.local/bin"
NODE_DIR="$HOME/.local/node"
PROFILE_MARK="# Antrops prototypmall: Node och GitHub CLI i ~/.local"

NAME=""
PARENT="$HOME/Documents"
HERE=0
PROJECT=1
VERCEL="ask"
BREW_WANTED="ask"
PROFILE_CHANGED=0

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
# hw.optional.arm64 stämmer även om Terminal körs via Rosetta.
if [ "$(sysctl -n hw.optional.arm64 2>/dev/null)" = "1" ]; then
  NODE_ARCH="arm64"; GH_ARCH="arm64"
else
  NODE_ARCH="x64"; GH_ARCH="amd64"
fi

mkdir -p "$BIN"
export PATH="$BIN:$NODE_DIR/bin:$PATH"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

printf '%sAntrops prototypmall: sätter upp din dator%s\n' "$B" "$R"
info "Du kan köra det här igen när som helst. Det som redan är klart hoppas över."

# Laddar ner en fil och kontrollerar den mot en fil med kontrollsummor.
download_verified() { # url checksum-url filnamn
  curl -fsSL "$1" -o "$TMP/$3" && curl -fsSL "$2" -o "$TMP/sums.txt" || return 1
  (cd "$TMP" && grep " $3\$" sums.txt | shasum -a 256 -c - >/dev/null 2>&1)
}

# 1. Homebrew -----------------------------------------------------------------

step "1/7 Homebrew"
brew_path() {
  local p
  for p in /opt/homebrew/bin/brew /usr/local/bin/brew; do
    [ -x "$p" ] && { printf '%s' "$p"; return 0; }
  done
  return 1
}
BREW=""
if BREW="$(brew_path)"; then
  eval "$("$BREW" shellenv)"
  ok "$("$BREW" --version | head -1)"
elif [ "$BREW_WANTED" = "no" ]; then
  info "Hoppade över."
elif ! id -Gn | tr ' ' '\n' | grep -qx admin; then
  info "Ditt konto är inte administratör, så Homebrew går inte att installera. Det gör inget,"
  info "resten fungerar utan. Vill du ha Homebrew senare: fråga IT."
elif [ "$HAS_TTY" = 0 ]; then
  info "Homebrew behöver ditt datorlösenord och kan bara installeras från Terminal. Hoppar över."
else
  info "Homebrew är en app store för utvecklarverktyg. Med den kan Claude senare installera"
  info "till exempel ffmpeg eller en databas åt dig, utan att fråga efter lösenord."
  if yes_answer "$(ask "Installera Homebrew? Det kräver ditt datorlösenord en gång. [J/n]:" "j")"; then
    info "Skriv ditt datorlösenord och tryck Enter. Det syns inte medan du skriver."
    sudo -v </dev/tty || fail "Lösenordet godkändes inte." "Kör skriptet igen, eller lägg till --no-brew för att hoppa över Homebrew."
    info "Installerar Homebrew. Saknas Apples utvecklarverktyg hämtas de också, det kan ta 10 till 20 minuter."
    NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)" </dev/null \
      || fail "Homebrew-installationen misslyckades." "Kör skriptet igen, eller lägg till --no-brew för att hoppa över Homebrew."
    BREW="$(brew_path)" || fail "Homebrew installerades men hittas inte."
    eval "$("$BREW" shellenv)"
    ok "$("$BREW" --version | head -1)"
  else
    info "Hoppade över. Kör skriptet igen om du ändrar dig."
  fi
fi

# Vanligaste Homebrew-felet: raderna i ~/.zprofile kördes aldrig, så Terminal hittar inte brew.
if [ -n "$BREW" ] && ! grep -qF "$BREW shellenv" "$HOME/.zprofile" 2>/dev/null; then
  printf '\neval "$(%s shellenv)"\n' "$BREW" >>"$HOME/.zprofile"
  PROFILE_CHANGED=1
fi

# 2. Git ----------------------------------------------------------------------

step "2/7 Git"
# Utan utvecklarverktyg är /usr/bin/git bara en platshållare. Kör den inte innan
# verktygen finns, den öppnar i så fall installationsrutan på egen hand.
git_works() { git --version >/dev/null 2>&1; }
if xcode-select -p >/dev/null 2>&1 || { gitpath="$(command -v git)" && [ "$gitpath" != "/usr/bin/git" ]; }; then
  if ! git_works; then
    if git --version 2>&1 | grep -qi license; then
      fail "Xcode är installerat men licensen är inte godkänd, så git fungerar inte." \
        "Öppna Xcode en gång och godkänn licensen (eller be IT), och kör sedan skriptet igen."
    fi
    fail "Git finns men fungerar inte: $(git --version 2>&1 | head -1)" "Be Claude eller IT om hjälp."
  fi
  ok "$(git --version)"
else
  info "Git följer med Apples utvecklarverktyg (Command Line Tools)."
  info "En ruta öppnas nu. Klicka Installera och vänta, det tar 5 till 15 minuter."
  info "Frågar rutan efter ett administratörslösenord som du inte har: installera"
  info "Command Line Tools via Self Service eller be IT, och kör sedan skriptet igen."
  xcode-select --install >/dev/null 2>&1 || true
  waited=0
  until xcode-select -p >/dev/null 2>&1; do
    sleep 10
    waited=$((waited + 10))
    [ "$waited" -ge 3600 ] && fail "Utvecklarverktygen blev inte klara inom en timme." "Kör skriptet igen när installationen är klar."
  done
  git_works || fail "Utvecklarverktygen är installerade men git svarar inte." "Kör skriptet igen, eller be Claude om hjälp."
  ok "$(git --version)"
fi

# 2. Node.js ------------------------------------------------------------------

step "3/7 Node.js"
node_major() { node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0; }
if [ "$(node_major)" -ge 20 ]; then
  ok "Node $(node --version)"
elif [ -n "$BREW" ]; then
  info "Installerar Node med Homebrew"
  "$BREW" install node >/dev/null || fail "Homebrew kunde inte installera Node." "Kör skriptet igen."
  hash -r
  ok "Node $(node --version)"
else
  # Senaste LTS-versionen: första raden i listan som har ett LTS-namn.
  curl -fsSL https://nodejs.org/dist/index.json -o "$TMP/index.json" \
    || fail "Kunde inte hämta Nodes versionslista." "Kolla internetuppkopplingen och kör skriptet igen."
  version="$(grep '"lts":"' "$TMP/index.json" | head -1 | sed -E 's/.*"version":"(v[0-9.]+)".*/\1/')"
  [ -n "$version" ] || fail "Kunde inte hämta Nodes versionslista." "Kolla internetuppkopplingen och kör skriptet igen."
  file="node-$version-darwin-$NODE_ARCH.tar.gz"
  info "Hämtar Node $version till ~/.local/node"
  download_verified "https://nodejs.org/dist/$version/$file" "https://nodejs.org/dist/$version/SHASUMS256.txt" "$file" \
    || fail "Nedladdningen av Node misslyckades eller blev fel." "Kör skriptet igen."
  mkdir -p "$TMP/node"
  tar -xzf "$TMP/$file" -C "$TMP/node" --strip-components 1 || fail "Kunde inte packa upp Node."
  rm -rf "$NODE_DIR" && mv "$TMP/node" "$NODE_DIR"
  hash -r
  ok "Node $(node --version)"
fi

# 3. GitHub CLI ---------------------------------------------------------------

step "4/7 GitHub CLI"
if command -v gh >/dev/null 2>&1; then
  ok "$(gh --version | head -1)"
elif [ -n "$BREW" ]; then
  info "Installerar GitHub CLI med Homebrew"
  "$BREW" install gh >/dev/null || fail "Homebrew kunde inte installera GitHub CLI." "Kör skriptet igen."
  hash -r
  ok "$(gh --version | head -1)"
else
  # Adressen till senaste versionen slutar på /tag/vX.Y.Z. Undviker GitHubs API-gräns.
  latest="$(curl -fsSLI -o /dev/null -w '%{url_effective}' https://github.com/cli/cli/releases/latest)"
  ver="${latest##*/v}"
  [ -n "$ver" ] && [ "$ver" != "$latest" ] || fail "Kunde inte hitta senaste versionen av GitHub CLI." "Kolla internetuppkopplingen och kör skriptet igen."
  zip="gh_${ver}_macOS_${GH_ARCH}.zip"
  base="https://github.com/cli/cli/releases/download/v$ver"
  info "Hämtar GitHub CLI $ver till ~/.local/bin"
  download_verified "$base/$zip" "$base/gh_${ver}_checksums.txt" "$zip" \
    || fail "Nedladdningen av GitHub CLI misslyckades eller blev fel." "Kör skriptet igen."
  unzip -q -o "$TMP/$zip" -d "$TMP" || fail "Kunde inte packa upp GitHub CLI."
  cp "$TMP/gh_${ver}_macOS_${GH_ARCH}/bin/gh" "$BIN/gh" && chmod +x "$BIN/gh"
  hash -r
  ok "$(gh --version | head -1)"
fi

# Terminal och kodagenten ska hitta det som hamnat i ~/.local även i nästa fönster.
if [ -x "$BIN/gh" ] || [ -x "$NODE_DIR/bin/node" ]; then
  for profile in "$HOME/.zprofile" "$HOME/.bash_profile"; do
    [ "$profile" = "$HOME/.bash_profile" ] && [ ! -f "$profile" ] && continue
    if ! grep -qF "$PROFILE_MARK" "$profile" 2>/dev/null; then
      printf '\n%s\nexport PATH="$HOME/.local/bin:$HOME/.local/node/bin:$PATH"\n' "$PROFILE_MARK" >>"$profile"
      PROFILE_CHANGED=1
    fi
  done
fi

# 4. Logga in på GitHub -------------------------------------------------------

step "5/7 Logga in på GitHub"
if gh auth status --hostname github.com >/dev/null 2>&1; then
  ok "Inloggad som $(gh api user --jq .login)"
else
  info "Du behöver ett GitHub-konto som är medlem i antrop-ab. Har du inget konto:"
  info "skapa ett gratis på https://github.com/signup och be någon på Antrop bjuda in dig."
  info ""
  info "Nu öppnas webbläsaren. Klistra in koden som visas nedanför och klicka Authorize."
  if [ "$HAS_TTY" = 1 ]; then
    gh auth login --hostname github.com --git-protocol https --web --scopes workflow </dev/tty
  else
    # Utan terminal öppnar gh inte webbläsaren själv.
    open "https://github.com/login/device" >/dev/null 2>&1 || true
    gh auth login --hostname github.com --git-protocol https --web --scopes workflow </dev/null
  fi
  gh auth status --hostname github.com >/dev/null 2>&1 || fail "Inloggningen på GitHub blev inte klar." "Kör skriptet igen."
  ok "Inloggad som $(gh api user --jq .login)"
fi
gh auth setup-git --hostname github.com >/dev/null 2>&1 || true

if [ -z "$(git config --global user.name)" ] || [ -z "$(git config --global user.email)" ]; then
  # GitHubs noreply-adress, så att den privata mejladressen inte hamnar i koden.
  gh_name="$(gh api user --jq '.name // .login')"
  gh_email="$(gh api user --jq '"\(.id)+\(.login)@users.noreply.github.com"')"
  [ -n "$(git config --global user.name)" ] || git config --global user.name "$gh_name"
  [ -n "$(git config --global user.email)" ] || git config --global user.email "$gh_email"
fi
ok "Git sparar dina ändringar som $(git config --global user.name) <$(git config --global user.email)>"

# 6. Prototypen ---------------------------------------------------------------

if [ "$PROJECT" = 0 ]; then
  step "Klart"
  info "Verktygen och inloggningen är på plats. Öppna ett nytt Terminal-fönster för att använda dem."
  exit 0
fi

step "6/7 Din prototyp"
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

step "7/7 Vercel: publicering och AI (valfritt)"
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
[ "$PROFILE_CHANGED" = 1 ] && info "" && info "Öppna ett nytt Terminal-fönster om du vill använda node eller gh i Terminal."
exit 0
