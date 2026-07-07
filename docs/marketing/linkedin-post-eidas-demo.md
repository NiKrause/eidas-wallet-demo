# 🇪🇺 eIDAS 2.0 & EUDI Wallet Demo – LinkedIn Post

**Status:** Final  
**Date:** 2026-07-07  
**Language:** English  
**Platform:** LinkedIn  

---

## Post

🇪🇺 **eIDAS 2.0 & EUDI Wallet: I built an interactive demo to understand where Europe really stands**

Instead of just reading through the eIDAS 2.0 regulation (EU 2024/1183) and the Architecture Reference Framework, I wanted to *experience* what a European Digital Identity Wallet actually does. So I built a fully interactive, browser-based simulation of the entire EUDI Wallet lifecycle.

**What I learned along the way:**

The current state of digital identity in Europe is surprisingly mature in some countries and still evolving in others:

| Country | System | Status |
|---------|--------|--------|
| 🇩🇪 **Germany** | AusweisApp2 (27M eID users) | Production; eID-Wallet planned 2026-27 |
| 🇫🇷 **France** | France Identité (CNIe NFC) | Production |
| 🇧🇪 **Belgium** | Itsme / eID card (11.5M, mandatory since 2004) | Production |
| 🇳🇱 **Netherlands** | DigiD (18M+) + Yivi (OS, zero-knowledge proofs) | Production + Open Source |
| 🇦🇹 **Austria** | ID Austria / eAusweise | Production |
| 🇪🇺 **EU level** | Reference Implementation (Android ★214, iOS ★82) | Pilot / Open Source |

**The demo covers the full credential lifecycle:**

🪪 **Issuance** – Issue PID (digital identity) and QEAA (verified attributes like age, professional license)
👛 **Wallet** – Store and manage credentials
📲 **Selective Disclosure** – Share only *specific* attributes via QR code (not the whole credential)
✅ **Verification** – Validate presentations
📋 **Audit History** – Chronological log of all sharing activities
🏛️ **Revocation** – Authority dashboard that demonstrates what happens when a credential is cancelled

**The most fascinating part:** The tech stack that makes this possible — OpenID4VP, SD-JWT, ISO 18013-7, status list JWT for revocation — is already standardized. The question isn't whether this will work, but when every European citizen will have a wallet in their pocket.

Try it: **https://nikrause.github.io/eidas-wallet-demo/**
Source: **https://github.com/NiKrause/eidas-wallet-demo**

*Built entirely client-side: Svelte 5 + Vite, hash-based routing, QR code generation, full i18n (EN/DE). Orchestrated via Goose (open-source AI agent by AAIF), powered by Claude Sonnet 4 (Anthropic). ~8 hours, 20 commits, 13 E2E tests, all passing ✅*

#eIDAS #EUDI #DigitalIdentity #Svelte #OpenSource #Privacy #Identity #Europe

---

## Draft Info

- **Tone:** Professional, informative, slightly enthusiastic
- **Target audience:** Tech professionals, identity/IAM specialists, EU digital policy followers, recruiters
- **Call to action:** Try the live demo + check the source code
- **Hashtags:** 8 hashtags, mix of broad (#eIDAS, #OpenSource) and specific (#Svelte, #EUDI)
