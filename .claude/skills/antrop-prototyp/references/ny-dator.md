# Första gången på en ny dator (Mac)

`scripts/bootstrap.sh` tar datorn från tom till körbar prototyp: Homebrew (om Antroparen är administratör), git, Node, GitHub CLI, inloggning på GitHub, en ny prototyp från mallen, `npm run setup` och valfritt Vercel. Det kan köras om, klara steg hoppas över. Verktygen och inloggningen (Homebrew, git, Node, GitHub CLI, GitHub-inloggning) sköts av det gemensamma skriptet [antrop-setup](https://github.com/antrop-ab/antrop-setup), som bootstrap hämtar och kör först. Fel där rättas i antrop-setup, inte här.

- **Enklast:** be Antroparen öppna *Terminal* och klistra in raden nedan. Då fungerar alla frågor och inloggningar.

  ```bash
  curl -fsSL https://raw.githubusercontent.com/antrop-ab/antrop-prototype-template/main/scripts/bootstrap.sh | bash
  ```

- **Kör du det själv** (Antroparen har öppnat en tom mapp i Claude-appen): lägg till `-s -- --here --no-vercel` efter `bash`. Kör i bakgrunden och läs utskriften. Vid GitHub-inloggningen skrivs en engångskod ut: ge den till Antroparen direkt. Homebrew och Vercel kräver ett Terminal-fönster och hoppas över.
- **Prototypen ska ligga i ett repo som redan finns** (tomt, kanske på ett eget konto): stå i repots mapp och hämta mallen utan dess git-historik, sedan `npm run setup` och en första commit. `curl -fsSL https://github.com/antrop-ab/antrop-prototype-template/archive/refs/heads/main.tar.gz | tar xz --strip-components=1`. Bootstrap behövs inte då, men `npm run ship` utgår från `antrop-ab`: publicera med Vercels egen koppling till repot i stället.
- Mallen är publik, men varje prototyp blir ett privat repo i `antrop-ab`. Antroparen behöver därför vara medlem i organisationen på GitHub. `npm run doctor` kollar det.
- **Om `gh` säger att inloggningen misslyckats** fast Antroparen loggat in: en gammal `GH_TOKEN` i miljön går före. Kör `env -u GH_TOKEN -u GITHUB_TOKEN gh auth status`. Mallens skript tar bort den själva.
