# 🇪🇺 eIDAS 2.0 / EUDI Wallet Demo MVP

**Browser-based simulation of the complete EUDI Wallet lifecycle**

![eIDAS 2.0](https://img.shields.io/badge/eIDAS-2.0-blue)
![Status](https://img.shields.io/badge/Status-Demo/MVP-green)
![Svelte](https://img.shields.io/badge/Svelte-5-orange)

> 🇩🇪 **[Deutsche Version lesen →](README.de.md)**

---

## 🎯 Overview

This project demonstrates the core concepts of **eIDAS 2.0** and the **EUDI Wallet (European Digital Identity Wallet)** through an interactive browser-based simulation.

It runs **entirely client-side** — no server, no installation, just **JavaScript + Svelte 5** (no SvelteKit). The demo simulates the full lifecycle of digital identity credentials:

> **Issuance → Wallet Management → Selective Disclosure → Audit History**

---

## 🗺️ Architecture

### Lifecycle Flow

```mermaid
flowchart LR
    A[<b>Issuance</b><br/>Issue PID / QEAA] --> B[<b>Wallet</b><br/>Store & Manage]
    B --> C[<b>Presentation</b><br/>Selective Disclosure]
    C --> D[<b>Verifier</b><br/>Verify Attributes]
    D --> E[<b>History</b><br/>Audit Log]
    B -.-> A
    E -.-> B
```

### Component Architecture

```mermaid
graph TD
    subgraph "Routes (Pages)"
        ISS[issuance.svelte]
        WAL[wallet.svelte]
        PRE[present.svelte]
        VER[verify.svelte]
        HIS[history.svelte]
    end
    subgraph "Components"
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
    subgraph "Stores & Models"
        CS[(credentialStore<br/>localStorage)]
        HS[(historyStore<br/>localStorage)]
        CM[credential.js<br/>Data Model]
    end
    subgraph "Infrastructure"
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

### Data Flow: Selective Disclosure

```mermaid
sequenceDiagram
    participant U as Wallet User
    participant W as Wallet App
    participant Q as QR Code
    participant V as Verifier
    U->>W: Select credential & attributes
    W->>W: Encode attributes as JSON
    W->>Q: Generate QR code
    Q-->>V: Display QR code
    V->>V: Decode & parse attributes
    V->>V: Verify data integrity
    V-->>U: Show verification result
    W->>W: Log presentation to history
```

---

## 🧱 Tech Stack

| Component         | Technology                              |
| ----------------- | --------------------------------------- |
| **Framework**     | [Svelte 5](https://svelte.dev/) (Runes) |
| **Bundler**       | [Vite 6](https://vitejs.dev/)           |
| **Routing**       | Client-side (custom hash-based router)  |
| **Storage**       | `localStorage` (Web API)                |
| **QR Codes**      | [qrcode](https://www.npmjs.com/package/qrcode) v1.5 |
| **State Mgmt**    | Svelte 5 `$state`, `$derived`, `$effect` Runes |
| **Hosting**       | GitHub Pages / Static                   |

---

## 🚀 Getting Started

```bash
git clone https://github.com/NiKrause/eidas-wallet-demo.git
cd eidas-wallet-demo
npm install
npm run dev
```

Then open `http://localhost:5173`.

```bash
# Production build
npm run build
npm run preview
```

---

## 📚 Background: eIDAS 2.0 & EUDI Wallet

The **eIDAS 2.0 Regulation** (EU 2024/1183) establishes a legal framework for a **harmonized European digital identity**. Each EU member state provides its citizens with an **EUDI Wallet (European Digital Identity Wallet)** — an app that:

1. **Stores PID (Personal Identification Data)** — digital identity credentials
2. **Manages QEAAs (Qualified Electronic Attestations of Attributes)** — verified attributes like `age_over_18`, `diploma`, `professional_license`
3. **Enables selective disclosure** — share only the minimum required data
4. **Uses OpenID4VP** and **ISO 18013-7** as communication protocols

### Key Concepts

| Concept | Description |
|---------|-------------|
| **PID** | Personal Identification Data — core identity (name, date of birth, etc.) |
| **QEAA** | Qualified Electronic Attestation of Attributes — verified claims (e.g. age, diploma) |
| **Selective Disclosure** | Share only specific attributes, not the entire credential |
| **Issuance** | Process of a trusted authority issuing a credential into the wallet |
| **Presentation** | Process of sharing credentials/attributes with a verifier |
| **Verifier** | Entity that requests and verifies credentials |

---

## 📖 References & Resources

### European Regulations & Standards
- [eIDAS 2.0 Regulation (EU 2024/1183)](https://eur-lex.europa.eu/eli/reg/2024/1183)
- [EUDI Wallet Architecture Reference Framework (ARF)](https://digital-strategy.ec.europa.eu/en/library/eudi-wallet-architecture-and-reference-framework)
- [ISO/IEC 18013-7:2024 — mdL/mdoc for digital wallets](https://www.iso.org/standard/82720.html)

### Technical Protocols
- [OpenID4VP — OpenID for Verifiable Presentations](https://openid.net/specs/openid-4-verifiable-presentations-1_0.html)
- [OpenID4VCI — OpenID for Verifiable Credential Issuance](https://openid.net/specs/openid-4-verifiable-credential-issuance-1_0.html)
- [SD-JWT — Selective Disclosure JWT](https://www.ietf.org/archive/id/draft-ietf-oauth-selective-disclosure-jwt-07.html)
- [W3C Verifiable Credentials Data Model](https://www.w3.org/TR/vc-data-model-2.0/)

### Libraries Used
- [Svelte 5](https://svelte.dev/) — UI framework
- [Vite](https://vitejs.dev/) — Build tool
- [qrcode](https://www.npmjs.com/package/qrcode) v1.5 — QR code generation (client-side)
- [@sveltejs/vite-plugin-svelte](https://www.npmjs.com/package/@sveltejs/vite-plugin-svelte) — Svelte integration for Vite

---

## 📄 License

MIT
