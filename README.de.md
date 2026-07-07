# 🇪🇺 eIDAS 2.0 / EUDI Wallet Demo MVP

**Browser-basierte Simulation des gesamten Lebenszyklus einer EUDI Wallet**

![eIDAS 2.0](https://img.shields.io/badge/eIDAS-2.0-blue)
![Status](https://img.shields.io/badge/Status-Demo/MVP-green)
![Svelte](https://img.shields.io/badge/Svelte-5-orange)

---

## 🎯 Überblick

Dieses Projekt demonstriert die Kernkonzepte von **eIDAS 2.0** und der **EUDI Wallet (European Digital Identity Wallet)** in einer interaktiven, browser-basierten Simulation.

Die Demo läuft **vollständig clientseitig** – kein Server, keine Installation, nur **JavaScript + Svelte 5** (ohne SvelteKit). Sie simuliert den gesamten Lebenszyklus digitaler Identitätsdaten:

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
    subgraph "Stores & Modelle"
        CS[(credentialStore<br/>localStorage)]
        HS[(historyStore<br/>localStorage)]
        CM[credential.js<br/>Datenmodell]
    end
    subgraph "Infrastruktur"
        RT[Hash Router]
        BN[BottomNav]
    end
    ISS --> IF --> CM --> CS
    ISS --> IS
    WAL --> WD --> CC --> CS
    CC --> CD --> CS
    PRE --> AS --> CS
    PRE --> QD
    VER --> VV --> VR
    HIS --> HL --> HS
    HL --> HD
    RT --> ISS & WAL & PRE & VER & HIS
    BN --> RT
```

### Datenfluss: Selektive Offenlegung

```mermaid
sequenceDiagram
    participant U as Wallet Nutzer
    participant W as Wallet App
    participant Q as QR Code
    participant V as Verifier
    U->>W: Credential & Attribute auswählen
    W->>W: Attribute als JSON kodieren
    W->>Q: QR-Code generieren
    Q-->>V: QR-Code anzeigen
    V->>V: Dekodieren & parsen
    V->>V: Datenintegrität prüfen
    V-->>U: Ergebnis anzeigen
    W->>W: Präsentation im Verlauf loggen
```

---

## 🧱 Technologie-Stack

| Komponente        | Technologie                                  |
| ----------------- | -------------------------------------------- |
| **Framework**     | [Svelte 5](https://svelte.dev/) (Runes)      |
| **Bundler**       | [Vite 6](https://vitejs.dev/)                |
| **Routing**       | Client-seitig (eigener Hash-basierter Router)|
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
| **Selektive Offenlegung** | Nur bestimmte Attribute teilen, nicht das gesamte Credential |
| **Issuance** | Prozess der Ausstellung eines Credentials durch eine vertrauenswürdige Stelle |
| **Presentation** | Prozess der Weitergabe von Credentials/Attributen an einen Verifier |
| **Verifier** | Prüfstelle, die Credentials anfordert und verifiziert |

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

### Verwendete Bibliotheken
- [Svelte 5](https://svelte.dev/) — UI-Framework
- [Vite](https://vitejs.dev/) — Build-Tool
- [qrcode](https://www.npmjs.com/package/qrcode) v1.5 — QR-Code Generierung (clientseitig)
- [@sveltejs/vite-plugin-svelte](https://www.npmjs.com/package/@sveltejs/vite-plugin-svelte) — Svelte-Integration für Vite

---

## 📄 Lizenz

MIT
