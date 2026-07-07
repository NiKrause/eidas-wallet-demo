# 🇪🇺 eIDAS 2.0 & EUDI Wallet Demo – LinkedIn Post

**Status:** Final  
**Date:** 2026-07-07  
**Language:** English / German  
**Platform:** LinkedIn  

---

## English Version

🇪🇺 **eIDAS 2.0 & EUDI Wallet: I built an interactive demo with real SD-JWT cryptography and an OpenID4VP server**

Instead of just reading through the eIDAS 2.0 regulation (EU 2024/1183) and the Architecture Reference Framework, I wanted to *experience* what a European Digital Identity Wallet actually does. So I built a fully interactive, browser-based simulation of the entire EUDI Wallet lifecycle.

**What started as a simple JSON demo evolved into something real:**

The latest feature branch adds **full SD-JWT (Selective Disclosure JWT) support** with ECDSA P-256 signatures, plus a **Flask-based OpenID4VP Verifier Server** that can serve QR codes in the standardized `openid4vp://authorize` format — scannable by real wallet apps like the EU Reference Wallet or Itsme.

**What the demo covers:**

🪪 **SD-JWT Issuance** – Issue cryptographically signed PID and QEAA credentials via WebCrypto API
👛 **Wallet** – Store and manage credentials with revocation state
📲 **Selective Disclosure** – Share only *specific* attributes via QR code (SD-JWT format)
✅ **SD-JWT Verification** – Same-browser + server-side signature validation
📋 **Audit History** – Chronological log of all sharing activities
🏛️ **Revocation** – Authority dashboard with CRL-inspired lifecycle simulation
🔐 **OpenID4VP Integration** – QR can encode proper `openid4vp://` URI when server is running

**Current state of digital identity in Europe:**

| Country | System | Status |
|---------|--------|--------|
| 🇩🇪 **Germany** | AusweisApp2 (27M eID users) | Production; eID-Wallet planned 2026-27 |
| 🇫🇷 **France** | France Identité (CNIe NFC) | Production |
| 🇧🇪 **Belgium** | Itsme / eID card (11.5M, mandatory since 2004) | Production |
| 🇳🇱 **Netherlands** | DigiD (18M+) + Yivi (OS, zero-knowledge proofs) | Production + Open Source |
| 🇦🇹 **Austria** | ID Austria / eAusweise | Production |
| 🇪🇺 **EU level** | Reference Implementation | Pilot / Open Source |

**What's next:** Phase 2 will encode proper `openid4vp://authorize` URIs in QR codes so real wallet apps can scan them directly.

Try it: **https://nikrause.github.io/eidas-wallet-demo/**
Source: **https://github.com/NiKrause/eidas-wallet-demo**

*Tech: Svelte 5 + Vite, jose (WebCrypto ECDSA), Flask (OpenID4VP server), Playwright (19 E2E tests), full i18n (EN/DE). Orchestrated via Goose (open-source AI agent by AAIF), powered by DeepSeek. ~50 commits, 19 E2E tests (13 browser + 6 server API), all passing ✅*

#eIDAS #EUDI #DigitalIdentity #Svelte #OpenSource #Privacy #SDJWT #OpenID4VP #Cybersecurity

---

## Deutsche Version

🇪🇺 **eIDAS 2.0 & EUDI Wallet: Ich habe einen interaktiven Demo-Wallet mit echter SD-JWT-Kryptografie und OpenID4VP-Server gebaut**

Statt nur die eIDAS 2.0-Verordnung (EU 2024/1183) und das Architecture Reference Framework zu lesen, wollte ich *erleben*, was eine European Digital Identity Wallet tatsächlich kann. Also habe ich eine vollständig interaktive, browser-basierte Simulation des gesamten EUDI-Wallet-Lebenszyklus gebaut.

**Was als einfache JSON-Demo begann, ist jetzt realer geworden:**

Der aktuelle Stand enthält **vollständige SD-JWT-Unterstützung** mit ECDSA-P-256-Signaturen sowie einen **Flask-basierten OpenID4VP-Verifier-Server**. Die QR-Codes werden im standardisierten `openid4vp://authorize`-Format ausgeliefert – scannbar durch echte Wallet-Apps wie die EU Reference Wallet oder Itsme.

**Die Demo im Überblick:**

🪪 **SD-JWT-Ausstellung** – Kryptografisch signierte PID- und QEAA-Credentials via WebCrypto-API
👛 **Wallet** – Credentials verwalten mit Widerrufsstatus (revocation)
📲 **Selektive Offenlegung** – Nur *bestimmte* Attribute via QR-Code teilen (SD-JWT-Format)
✅ **SD-JWT-Verifikation** – Im Browser + serverseitig prüfbar
📋 **Prüfverlauf** – Chronologisches Log aller Teilvorgänge
🏛️ **Widerruf** – Behörden-Dashboard mit CRL-inspiriertem Lebenszyklus
🔐 **OpenID4VP-Integration** – QR-Code enthält `openid4vp://`-URI (wenn Server läuft)

**Aktueller Stand der digitalen Identität in Europa:**

| Land | System | Status |
|------|--------|--------|
| 🇩🇪 **Deutschland** | AusweisApp2 (27 Mio. eID-Nutzer) | Produktiv; eID-Wallet geplant 2026-27 |
| 🇫🇷 **Frankreich** | France Identité (CNIe NFC) | Produktiv |
| 🇧🇪 **Belgien** | Itsme / eID-Karte (11,5 Mio., Pflicht seit 2004) | Produktiv |
| 🇳🇱 **Niederlande** | DigiD (18 Mio.+) + Yivi (Zero-Knowledge-Proofs) | Produktiv + Open Source |
| 🇦🇹 **Österreich** | ID Austria / eAusweise | Produktiv |
| 🇪🇺 **EU-Ebene** | Referenzimplementierung | Pilot / Open Source |

**Nächster Schritt:** Der QR-Code soll bald von echten Wallet-Apps wie der AusweisApp Bund oder Itsme gescannt werden können – dafür muss der `openid4vp://`-URI standardkonform sein.

Zum Ausprobieren: **https://nikrause.github.io/eidas-wallet-demo/**
Quellcode: **https://github.com/NiKrause/eidas-wallet-demo**

*Technik: Svelte 5 + Vite, jose (WebCrypto ECDSA), Flask (OpenID4VP-Server), Playwright (19 E2E-Tests), vollständig zweisprachig (EN/DE). Orchestriert via Goose (Open-Source AI Agent by AAIF), unterstützt durch DeepSeek. ~50 Commits, 19 E2E-Tests (13 Browser + 6 Server-API), alle grün ✅*

#eIDAS #EUDI #DigitaleIdentität #Svelte #OpenSource #Privacy #SDJWT #OpenID4VP #Cybersecurity

---

## Draft Info

- **Tone:** Professional, informative, slightly enthusiastic
- **Target audience:** Tech professionals, identity/IAM specialists, EU digital policy followers, recruiters
- **Call to action:** Try the live demo + check the source code
- **Hashtags:** 9 hashtags, mix of broad (#eIDAS, #OpenSource) and specific (#Svelte, #EUDI, #SDJWT, #OpenID4VP)
