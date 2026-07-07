# 🇪🇺 eIDAS 2.0 / EUDI Wallet Demo MVP

**Browser-basierte Simulation des gesamten Lebenszyklus einer EUDI Wallet**

![eIDAS 2.0](https://img.shields.io/badge/eIDAS-2.0-blue)
![Status](https://img.shields.io/badge/Status-Demo/MVP-green)
![Svelte](https://img.shields.io/badge/Svelte-5-orange)

🔗 **Live-Demo:** [**nikrause.github.io/eidas-wallet-demo/**](https://nikrause.github.io/eidas-wallet-demo/)

---

## 🎯 Überblick

Dieses Projekt demonstriert die Kernkonzepte von **eIDAS 2.0** und der **EUDI Wallet (European Digital Identity Wallet)** in einer interaktiven, browser-basierten Simulation.

Die Demo läuft als **clientseitige Svelte-5-App** (ohne SvelteKit) mit optionalem **OpenID4VP Verifier Server** (`server/verifier.py`). Credentials werden kryptografisch via **SD-JWT** (ECDSA P-256) signiert. Sie simuliert den gesamten Lebenszyklus digitaler Identitätsdaten:

> **Ausstellung (Issuance) → Verwaltung (Wallet) → Selektive Offenlegung (Presentation) → Prüfverlauf (History)**

---

## 🗺️ Architektur

### Lebenszyklus

```mermaid
flowchart LR
    A[<b>Issuance</b><br/>PID / QEAA ausstellen] --> B[<b>Wallet</b><br/>Speichern & Verwalten]
    B --> C[<b>Presentation</b><br/>Selektive Offenlegung]
    C --> D[<b>Verifier</b><br/>Attribute prüfen]
    D --> E[<b>History</b><br/>Prüfverlauf]
    B -.-> A
    E -.-> B
```

### Komponenten-Architektur

```mermaid
graph TD
    subgraph "Routes (Seiten)"
        ISS[issuance.svelte]
        WAL[wallet.svelte]
        PRE[present.svelte]
        VER[verify.svelte]
        HIS[history.svelte]
    end
    subgraph "Komponenten"
        IF[IssuanceForm]
        IS[IssuanceSuccess]
        WD[WalletDashboard]
        CC[CredentialCard]
        CD[CredentialDetail]
        AS[AttributeSelector]
        QD[QRDisplay]
        VV[VerifierView]
        VR[VerificationResult]
        HL[HistoryList]
        HD[HistoryDetail]
    end
    subgraph "SD-JWT Crypto"
        SJ[sdjwt.js<br/>Ausstellen / Verifizieren]
        CB[crypto-browser.js<br/>WebCrypto Wrapper]
    end
    subgraph "Stores & Modelle"
        CS[(credentialStore<br/>localStorage)]
        HS[(historyStore<br/>localStorage)]
        RS[(revocationStore<br/>localStorage)]
        CM[credential.js<br/>Datenmodell]
    end
    subgraph "Infrastruktur"
        RT[Hash Router]
        BN[BottomNav]
    end
    ISS --> IF --> CM --> CS
    ISS --> IF --> SJ
    ISS --> IS
    WAL --> WD --> CC --> CS
    CC --> CD --> CS
    PRE --> AS --> CS
    PRE --> QD
    QD --> SJ
    VER --> VV --> VR
    VV --> SJ
    HIS --> HL --> HS
    HL --> HD
    RT --> ISS & WAL & PRE & VER & HIS
    BN --> RT
```

---

## 🔐 Ausstellung in der Realität

### Ausstellungsablauf (Issuance Flow)

```mermaid
sequenceDiagram
    participant Buerger as Bürger:in
    participant Wallet as EUDI Wallet App
    participant PIDStelle as PID-Stelle<br/>(z.B. Bundesdruckerei)
    participant QEAAStelle as QEAA-Stelle<br/>(z.B. Bürgeramt, Anwaltskammer)
    participant Registry as Vertrauensliste<br/>(EU Trusted Lists)

    Note over Buerger,Registry: PID-Ausstellung (der digitale Ausweis)

    Buerger->>Wallet: Wallet öffnen & PID beantragen
    Wallet->>Wallet: Schlüsselpaar erzeugen
    Wallet->>PIDStelle: Öffentlichen Schlüssel + Identität senden<br/>(via eID-Funktion / NFC / AusweisApp2)
    PIDStelle->>Buerger: Identität prüfen (persönlich oder<br/>via bestehendem eID-Ausweis)
    PIDStelle->>PIDStelle: PID Credential erstellen (signiert)
    PIDStelle->>Wallet: PID als SD-JWT oder CWT ausstellen
    Wallet->>Wallet: PID sicher speichern
    Buerger->>Wallet: ✅ PID sichtbar (Name, Geburtsdatum, etc.)

    Note over Buerger,Registry: QEAA-Ausstellung (bestätigte Eigenschaften)

    Buerger->>Wallet: QEAA beantragen (z.B. age_over_18)
    Wallet->>QEAAStelle: QEAA anfordern (PID als Grundlage)
    QEAAStelle->>Registry: Signaturschlüssel der PID-Stelle prüfen
    Registry->>QEAAStelle: ✅ Schlüssel ist vertrauenswürdig
    QEAAStelle->>Wallet: QEAA ausstellen (signierte Bescheinigung)
    Wallet->>Wallet: QEAA speichern
    Buerger->>Wallet: ✅ QEAA jetzt im Wallet verfügbar
```

### 🇩🇪 Deutschland – Ausstellung

| Credential | Ausstellende Stelle | Schnittstelle | Ablauf |
|---|---|---|---|
| **PID** | **Bundesministerium des Innern (BMI)** via **Bundesdruckerei** | **AusweisApp2** oder eID-Funktion im Wallet | Bürger:innen scannen ihren **neuen Personalausweis (nPA)** oder **elektronischen Aufenthaltstitel (eAT)** per NFC. Der Chip enthält die Identitätsdaten. Die Wallet liest diese lokal – keine Daten werden an einen Server gesendet. Das PID-Credential wird daraus abgeleitet. |
| **QEAA: Altersbestätigung** | **Bürgeramt** vor Ort oder **BMI** online | Persönlicher Besuch oder online via PID | Aus der PID können `age_over_18` / `age_over_21` als selbstausgestellte oder behördlich signierte Bescheinigung abgeleitet werden. Einige QEAAs erfordern einen Besuch im Bürgeramt. |
| **QEAA: Berufszulassung** | **IHK (Industrie- und Handelskammer)**, **Handwerkskammer** oder **Rechtsanwaltskammer** | IHK-Onlineportal oder persönlich | Die Kammer signiert den Berufsstatus. Die Wallet erhält das QEAA via OpenID4VCI. |
| **QEAA: Bildungsabschluss** | **Hochschulen (Universitäten)** via HIS/S3-Systeme | Hochschulportal oder Campus-Karte | Hochschulen stellen digitale Abschlussbescheinigungen aus. |

In Deutschland dient die **eID-Funktion des Personalausweises** (nPA, 27 Mio. aktive eID-Nutzer) als Grundlage. Das **BMJ (Bundesministerium der Justiz)** ist für die Einführung der EUDI Wallet zuständig, mit der **Bundesdruckerei** als technischem Dienstleister. Die deutsche Wallet-Implementierung heißt **"eID-Wallet"** (ehemals "ID Wallet").

**Wichtige URLs:**
- [AusweisApp2](https://www.ausweisapp.bund.de/) — der aktuelle eID-Client
- [Bundesdruckerei eID](https://www.bundesdruckerei.de/de/innovationen/eid) — Betreiber der eID-Infrastruktur
- [BMJ EUDI Wallet](https://www.bmj.de/DE/themen/digitales/eudi_wallet/eudi_wallet_node.html)

### 🇫🇷 Frankreich – Ausstellung

| Credential | Ausstellende Stelle | Schnittstelle | Ablauf |
|---|---|---|---|
| **PID** | **ANTS (Agence Nationale des Titres Sécurisés)** via **France Identité** | **France Identité** App (iOS/Android) | Die **Carte Nationale d'Identité Électronique (CNIe)** enthält einen NFC-Chip. Bürger:innen scannen sie mit der **France Identité** App. Das PID wird aus den Chip-Daten erstellt. |
| **QEAA: Altersbestätigung** | **ANSSI** oder zertifizierte QEAA-Anbieter | France Identité App | Altersbescheinigungen werden aus dem PID abgeleitet. |
| **QEAA: Beruf** | **Ordre des Médecins, Ordre des Avocats** etc. | Portale der Berufskammern | Berufsständische Kammern stellen digitale Bescheinigungen aus. |

Frankreich hat mit **France Identité** bereits ein produktives digitales Identitätssystem. Die **CNIe** (neuer elektronischer Personalausweis, ~15 Mio. Karten) unterstützt NFC-Auslesen.

**Wichtige URLs:**
- [France Identité](https://france-identite.gouv.fr/) — offizielle digitale Identitäts-App
- [ANTS](https://ants.gouv.fr/) — nationale Agentur für Sicherheitsdokumente
- [France Connect](https://franceconnect.gouv.fr/) — bestehender Identitätsverbund

### 🇧🇪 Belgien – Ausstellung

| Credential | Ausstellende Stelle | Schnittstelle | Ablauf |
|---|---|---|---|
| **PID** | **FPS BOSA (Federal Public Service Policy & Support)** via **eID-System** | **Itsme** App oder **eID-Kartenleser** | Der belgische **eID-Ausweis** (seit 2004 für alle Bürger, 11,5 Mio. Karten) ist der etablierteste in Europa. Bürger nutzen einen Kartenleser oder NFC. Die **Itsme** App bietet eine mobile eID. Künftig wird die EUDI Wallet PID aus der bestehenden eID-Infrastruktur abgeleitet. |
| **QEAA: Altersbestätigung** | **BOSA / eID-System** | Itsme App | Belgien bietet bereits kommerziell Altersverifikationsdienste an. |
| **QEAA: Beruf** | **Kruispuntbank (Crossroads Bank)** | Berufsregister-Portale | Belgiens zentrale Register (BCE/KBO) können Berufsbescheinigungen ausstellen. |

Belgien hat die **höchste Akzeptanz digitaler Identitäten in Europa**: Der **eID-Ausweis** ist seit 2004 Pflicht, und **Itsme** hat über 4,5 Mio. aktive Nutzer.

**Wichtige URLs:**
- [Itsme](https://www.itsme.be/) — Belgiens mobile Identitäts-App
- [BOSA eID](https://eid.belgium.be/) — offizielles eID-Portal
- [CSAM](https://www.csam.be/) — Zugangsgateway für den öffentlichen Sektor

---

### Die PID als Fundament

Die **PID (Personal Identification Data)** ist das **Wurzel-Credential** im EUDI-Wallet-Ökosystem:

```
PID (einmalig vom Staat ausgestellt)
   ├── Grundlage für QEAA Altersbestätigung
   ├── Grundlage für QEAA Berufszulassung
   ├── Grundlage für QEAA Bildungsabschluss
   └── Grundlage für jedes zukünftige QEAA
```

Ohne PID kann kein QEAA ausgestellt werden. Die PID repräsentiert die **staatlich verifizierte Identität** des Inhabers. Alle QEAAs sind **mit der PID verknüpft** und erben ihre Vertrauenswürdigkeit vom Ausstellungsprozess der PID.

---

## 🧱 Technologie-Stack

| Komponente        | Technologie                                  |
| ----------------- | -------------------------------------------- |
| **Framework**     | [Svelte 5](https://svelte.dev/) (Runes)      |
| **Bundler**       | [Vite 6](https://vitejs.dev/)                |
| **Routing**       | Client-seitig (Hash-basiert)                 |
| **Speicher**      | `localStorage` (Web API)                     |
| **QR-Codes**      | [qrcode](https://www.npmjs.com/package/qrcode) v1.5 |
| **State Mgmt**    | Svelte 5 `$state`, `$derived`, `$effect` Runes |
| **Hosting**       | GitHub Pages / Static                        |

---

## 🚀 Entwicklung starten

```bash
git clone https://github.com/NiKrause/eidas-wallet-demo.git
cd eidas-wallet-demo
npm install
npm run dev
```

Dann `http://localhost:5173` öffnen.

```bash
# Produktions-Build
npm run build
npm run preview
```

### 🚀 Automatisches Deployment

Bei jedem Push auf `main` baut ein **GitHub Actions Workflow** das Projekt automatisch und deployed es auf **GitHub Pages**.

Der Workflow:
1. Checkt das Repository aus
2. Installiert Abhängigkeiten (`npm ci`)
3. Baut das Projekt (`npm run build`)
4. Lädt den `dist/` Ordner als Pages-Artifact hoch
5. Deployt auf `https://nikrause.github.io/eidas-wallet-demo/`

Manuelles Deployment kann über den [Actions Tab](https://github.com/NiKrause/eidas-wallet-demo/actions/workflows/deploy.yml) ausgelöst werden.

### 🧪 E2E-Tests ausführen

```bash
npm test
```

Insgesamt **8 End-to-End-Tests** mit [Playwright](https://playwright.dev/), die den gesamten EUDI-Wallet-Lebenszyklus simulieren:

| # | Test | Was wird geprüft |
|---|------|------------------|
| 1 | **PID ausstellen** | Formular ausfüllen, PID Credential erstellen, Speicherung in `localStorage` prüfen |
| 2 | **QEAA ausstellen** | Altersverifikations-Credential ausstellen, Boolean-Felder und Persistenz prüfen |
| 3 | **Wallet Dashboard** | Credential einspielen, in der Wallet anzeigen, Detail-Modal öffnen und schließen |
| 4 | **Credential löschen** | Über Karte hover, Löschen klicken, Dialog bestätigen, Empty State prüfen |
| 5 | **Presentation & QR** | Credential auswählen, Attribute selektieren, QR-Code generieren, History-Eintrag prüfen |
| 6 | **Verifier** | Beispiel-JSON laden, Verifizieren klicken, Ergebnis inspizieren |
| 7 | **History** | Eintrag vorbelegen, in der Timeline anzeigen, Detail öffnen, alle Einträge löschen |
| 8 | **Full Flow** | PID ausstellen → QEAA ausstellen → Beide in Wallet anzeigen → Selektiv teilen → Verifizieren → History prüfen |

Alle Tests laufen headless in Chromium. Es werden keine Screenshots erstellt. Der Testzustand wird über `localStorage`-Injektion und UI-Interaktion gesteuert.

---

## 📚 Hintergrund: eIDAS 2.0 & EUDI Wallet

Die **eIDAS 2.0-Verordnung** (EU 2024/1183) schafft den Rechtsrahmen für eine **europaweit einheitliche digitale Identität**. Jeder EU-Mitgliedstaat stellt seinen Bürgern eine **EUDI Wallet (European Digital Identity Wallet)** zur Verfügung – eine App, die:

1. **PID (Personal Identification Data)** speichert – die digitalen Ausweisdaten
2. **QEAAs (Qualified Electronic Attestations of Attributes)** verwaltet – qualifizierte Attributsbescheinigungen wie `age_over_18`, `diploma`, `professional_license`
3. **Selektive Offenlegung** ermöglicht – nur die minimal nötigen Daten teilen
4. **OpenID4VP** und **ISO 18013-7** als Protokolle nutzt

### Schlüsselkonzepte

| Konzept | Beschreibung |
|---------|-------------|
| **PID** | Personal Identification Data – Kernidentität (Name, Geburtsdatum, etc.) |
| **QEAA** | Qualified Electronic Attestation of Attributes – bestätigte Eigenschaften (z. B. Alter, Diplom) |
| **PID-Provider** | Staatliche Stelle, die das PID ausstellt (z. B. Bundesdruckerei, ANTS, BOSA) |
| **Selektive Offenlegung** | Nur bestimmte Attribute teilen, nicht das gesamte Credential |
| **Issuance** | Prozess der Ausstellung eines Credentials durch eine vertrauenswürdige Stelle |
| **Presentation** | Prozess der Weitergabe von Credentials/Attributen an einen Verifier |
| **Verifier** | Prüfstelle, die Credentials anfordert und verifiziert |

---

---

## 🏛️ Credential-Widerruf (Revocation)

Eine Kernfunktion jedes Identitätssystems ist die Möglichkeit, Credentials zu **widerrufen**, wenn sie nicht mehr gültig sind – z. B. bei Diebstahl, Namensänderung oder Betrug.

### Wie es in dieser Demo funktioniert

Das **Behörden-Dashboard** (🏛️) simuliert eine ausstellende Behörde. Es zeigt alle ausgestellten Credentials und erlaubt:

1. **Widerruf** mit Grund (gestohlen, verloren, Identitätsänderung, abgelaufen, etc.)
2. **Wiederherstellung** eines zuvor widerrufenen Credentials

### Was passiert beim Widerruf

```
                    ┌──────────────────────┐
                    │  Behörden-Dashboard   │
                    │  🔴 Widerrufen        │
                    └────────┬─────────────┘
                             │
                             ▼
              Status des Credentials → 'revoked'
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
       ┌──────────┐  ┌────────────┐  ┌──────────┐
       │  Wallet  │  │  Teilen    │  │ Verifier │
       │ WIDERRUF.│  │  Blockiert │  │ 🔴 FEHLG │
       │   Badge  │  │  Warnung   │  │ schlagen │
       └──────────┘  └────────────┘  └──────────┘
```

| Ansicht | Wirkung |
|---------|---------|
| **Wallet** | Credential-Karte zeigt **WIDERRUFEN**-Badge mit roter Markierung. Detailansicht zeigt Grund und Datum. Löschen-Button ausgeblendet. |
| **Teilen** | Widerrufene Credentials können **nicht geteilt** werden. Statt der Attributauswahl erscheint eine rote Warnung. |
| **Verifier** | Wenn ein Verifier QR-Daten eines widerrufenen Credentials erhält, schlägt die Prüfung **fehl** mit rotem "Credential widerrufen"-Bildschirm. |

### 🇳🇱 Niederlande – Ausstellung

| Credential | Ausstellende Stelle | Schnittstelle | Ablauf |
|---|---|---|---|
| **PID (EUDI)** | **Ministerie van BZK (Innenministerium)** via **Logius** | **DigiD** App oder **Yivi** | Die Niederlande haben bereits eine ausgereifte digitale Identitätsinfrastruktur. **DigiD** (18 Mio.+ Nutzer) authentisiert für 800+ Behördendienste. Für die EUDI Wallet wird die PID aus der bestehenden DigiD-Identitätsverifikation abgeleitet. Logius ist für die niederländische EUDI-Wallet-Implementierung zuständig. |
| **QEAA: Altersbestätigung** | **DigiD** / **Yivi** | DigiD App oder Yivi App | Sowohl DigiD als auch Yivi unterstützen bereits attributbasierte Datenweitergabe. Altersbestätigung (`age_over_18`) ist ein häufiger Anwendungsfall. |
| **QEAA: Berufsbescheinigung** | **Kamer van Koophandel (KvK)** — Handelskammer | KvK Online-Portal | Das niederländische Handelsregister kann Berufsbescheinigungen ausstellen. Auch via **eHerkenning** (Geschäftskunden-Identitätssystem). |
| **Attribute-based Identity** | **Yivi** (ehemals **IRMA**) | Yivi App | Yivi ist ein Open-Source-, datenschutzfreundliches, attributbasiertes Identitätssystem, entwickelt von der **Privacy by Design Foundation**. Es wurde als Basistechnologie für die niederländische EUDI-Wallet-Pilotierung ausgewählt. Yivi nutzt **Idemix** (IBM) für kryptografische Zero-Knowledge-Proofs. |

Die Niederlande verfolgen einen **Zwei-Spur-Ansatz**:
- **DigiD** — das bestehende Behördendientifikationssystem, das zur EUDI Wallet weiterentwickelt wird
- **Yivi (IRMA)** — das Open-Source-attributbasierte Identitätssystem, das Selective Disclosure in der Praxis bewiesen hat

**Wichtige Websites:**
- [DigiD](https://www.digid.nl/) — Niederländisches Identitätsportal
- [Yivi](https://yivi.app/) — Open-Source-Attribut-basierte Identitäts-App
- [Logius](https://www.logius.nl/) — Behörde für digitale Dienstleistungen
- [EWR (European Wallet Reference)](https://ewr-nederland.nl/) — Niederländische EUDI-Wallet-Pilot
- [Privacy by Design Foundation](https://privacybydesign.foundation/) — Entwickler von Yivi/IRMA

---

### 🇧🇪 Belgien – Ausstellung (aktualisiert)

| Credential | Ausstellende Stelle | Schnittstelle | Ablauf |
|---|---|---|---|
| **PID** | **FPS BOSA** via **eID-System** | **Itsme** App oder **eID-Kartenleser** | Der belgische **eID-Ausweis** (seit 2004 Pflicht, 11,5 Mio. Karten) ist der etablierteste in Europa. Bürger nutzen Kartenleser oder NFC. Die **Itsme** App bietet eine mobile eID. Die EUDI-Wallet-PID wird aus der bestehenden eID-Infrastruktur abgeleitet. |
| **QEAA: Altersbestätigung** | **BOSA / eID-System** | Itsme App | Belgien bietet bereits kommerziell Altersverifikationsdienste an. |
| **QEAA: Beruf** | **Kruispuntbank (Crossroads Bank)** | Berufsregister-Portale | Belgiens zentrale Register (BCE/KBO) können Berufsbescheinigungen ausstellen. |

Belgien hat die **höchste Akzeptanz digitaler Identitäten in Europa**: Der **eID-Ausweis** ist seit 2004 Pflicht, und **Itsme** hat über 4,5 Mio. aktive Nutzer.

**Wichtige URLs:**
- [Itsme](https://www.itsme.be/) — Belgiens mobile Identitäts-App
- [BOSA eID](https://eid.belgium.be/) — offizielles eID-Portal
- [CSAM](https://www.csam.be/) — Zugangsgateway für den öffentlichen Sektor

---

### In der Praxis

| Mechanismus | Beschreibung |
|-------------|-------------|
| **CRL** (Certificate Revocation List) | Behörde veröffentlicht regelmäßig aktualisierte Liste widerrufener Credential-IDs. Wallets und Verifier laden sie herunter. |
| **OCSP** (Online Certificate Status Protocol) | Echtzeit-Abfrage: Der Verifier fragt "ist dieses Credential noch gültig?" im Moment der Präsentation. |
| **Status List JWT** (RFC 9576) | Aussteller bettet einen Status-Listen-Verweis ins Credential ein. Der Verifier lädt ein kleines JWT zur Statusprüfung. |

### E2E-Tests

```bash
# Nur Revocation-Tests ausführen
npx playwright test revocation.spec.js

# Alle Tests (13 gesamt)
npm test
```

---

## 🔬 Echte OpenID4VP-Integration

Dieses Repository enthält einen **Feature-Branch** `feature/real-openid4vp` (gemerged in `main`), der die Demo
von simuliertem JSON zu **SD-JWT-signierten Credentials** mit ECDSA-Kryptografie weiterentwickelt.

**Phase 1 (SD-JWT-Signierung) ist abgeschlossen** und in `main` gemerged. Der nächste Schritt ist **Phase 2**:
Echte `openid4vp://authorize`-URIs im QR-Code, damit echte Wallet-Apps diese scannen können.

📖 **[Integrationsleitfaden →](docs/real-openid4vp-integration.md)

---

### In dieser Demo (`feature/real-openid4vp` / `main`)

Der QR-Code verwendet jetzt ein **signiertes SD-JWT-Format** (`sd_jwt_vc`) mit ECDSA-P-256-Signaturen. In der Demo ausgestellte Credentials werden kryptografisch signiert und können im Browser verifiziert werden. Zum Testen im selben Browser einfach den **"Verifier öffnen"**-Button auf der QR-Seite klicken.

Die Demo enthält außerdem einen **OpenID4VP Verifier Server** (`server/verifier.py` — Flask) für Tests mit echten Wallet-Apps.

> ⚠️ **Wichtig:** Die QR-Codes dieser Demo verwenden ein **eigenes JSON-Format** um den SD-JWT, keine vollständige `openid4vp://authorize`-URI. Echte nationale Apps wie die **AusweisApp Bund** (Deutschland), **France Identité** oder **Itsme** (Belgien) benötigen das standardisierte OpenID4VP-Protokoll. Dies ist der nächste Meilenstein (Phase 2).

Wer den QR-Code mit einem externen Gerät scannen möchte, kann jede **QR-Code-Scanner-App** verwenden, die Rohtext auslesen kann. Das JSON-Payload wird unter dem QR-Code zur manuellen Kopie angezeigt.

### In der Praxis (Echte EUDI Wallet)

In einer Produktionsumgebung würde der QR-Code eine **OpenID4VP Authorization Request** kodieren – ein standardisiertes Protokoll für verifiable Presentations. Diese QR-Codes müssen mit einer App gescannt werden, die OpenID4VP unterstützt.

#### 🇪🇺 EUDI Wallet Apps & QR-Scanner-Apps

Eine vollständige Tabelle mit nationalen Wallet-Apps (AusweisApp Bund, France Identité, Itsme, Yivi, DigiD, etc.) sowie QR-Scanner-Apps findest du in **[Kompatible Wallet-Apps →](docs/compatible-wallet-apps.md)**. Dort sind auch Verfügbarkeit, Open-Source-Status und Produktionsreife pro EU-Mitgliedstaat aufgeführt.

---

## 📖 Referenzen & Ressourcen

### Europäische Verordnungen & Standards
- [eIDAS 2.0 Verordnung (EU 2024/1183)](https://eur-lex.europa.eu/eli/reg/2024/1183)
- [EUDI Wallet Architecture Reference Framework (ARF)](https://digital-strategy.ec.europa.eu/en/library/eudi-wallet-architecture-and-reference-framework)
- [ISO/IEC 18013-7:2024 — mdL/mdoc für digitale Wallets](https://www.iso.org/standard/82720.html)

### Technische Protokolle
- [OpenID4VP — OpenID for Verifiable Presentations](https://openid.net/specs/openid-4-verifiable-presentations-1_0.html)
- [OpenID4VCI — OpenID for Verifiable Credential Issuance](https://openid.net/specs/openid-4-verifiable-credential-issuance-1_0.html)
- [SD-JWT — Selective Disclosure JWT](https://www.ietf.org/archive/id/draft-ietf-oauth-selective-disclosure-jwt-07.html)
- [W3C Verifiable Credentials Data Model](https://www.w3.org/TR/vc-data-model-2.0/)

### Nationale Umsetzungen
- 🇩🇪 [eID-Wallet / AusweisApp2](https://www.ausweisapp.bund.de/) — Deutschland
- 🇫🇷 [France Identité](https://france-identite.gouv.fr/) — Frankreich
- 🇧🇪 [Itsme](https://www.itsme.be/) — Belgien

### Verwendete Bibliotheken
- [Svelte 5](https://svelte.dev/) — UI-Framework
- [Vite](https://vitejs.dev/) — Build-Tool
- [qrcode](https://www.npmjs.com/package/qrcode) v1.5 — QR-Code Generierung (clientseitig)
- [jose](https://www.npmjs.com/package/jose) v6 — JWT Signierung & Verifikation (SD-JWT via WebCrypto)
- [@sveltejs/vite-plugin-svelte](https://www.npmjs.com/package/@sveltejs/vite-plugin-svelte) — Svelte-Integration für Vite
- [Flask](https://flask.palletsprojects.com/) — OpenID4VP Verifier Server (`server/verifier.py`)
- [Playwright](https://playwright.dev/) — E2E-Testing

---

## 📄 Lizenz

MIT
