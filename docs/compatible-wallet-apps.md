# 🇪🇺 EUDI Wallet Apps & QR Scanner Apps – Kompatibilitätsübersicht

> Shared reference for both [`README.md`](../README.md) and [`README.de.md`](../README.de.md).

---

## 🇪🇺 EUDI Wallet Apps

When real EUDI Wallets become mandatory (expected 2026–2027), each EU member state will provide an official wallet app. These will be able to scan OpenID4VP QR codes natively.

| Region | Wallet App | Availability | Open Source | Status |
|--------|-----------|-------------|-------------|--------|
| **Germany** | **AusweisApp Bund** (current eID client, by Governikus) | [Google Play](https://play.google.com/store/apps/details?id=com.governikus.ausweisapp2) · [App Store](https://apps.apple.com/app/ausweisapp-bund/id948660805) | ✅ [GitHub](https://github.com/Governikus/AusweisApp2) | Production |
| **Germany** | **eID-Wallet** (Bundesdruckerei) | not yet released | ❌ | Planned (2026–2027) |
| **France** | **France Identité** | [Google Play](https://play.google.com/store/apps/details?id=com.franceidentite.mobile) · [App Store](https://apps.apple.com/app/france-identit%C3%A9/id1590142959) | ❌ | Production |
| **Belgium** | **Itsme** (pre-EUDI, OpenID4VP compatible) | [Google Play](https://play.google.com/store/apps/details?id=be.bmid.itsme) · [App Store](https://apps.apple.com/app/itsme/id1181309300) | ❌ | Production (4.5M+ users) |
| **Netherlands** | **DigiD** (precursor to EUDI Wallet) | [Google Play](https://play.google.com/store/apps/details?id=nl.rijksoverheid.digid.pub) · [App Store](https://apps.apple.com/app/digid/id1208460960) | ❌ | Production (18M+ users) |
| **Netherlands** | **Yivi** (formerly IRMA — open source attribute-based identity) | [Google Play](https://play.google.com/store/apps/details?id=org.irmacard.cardemu) · [App Store](https://apps.apple.com/app/yivi/id1294092994) | ✅ [GitHub](https://github.com/privacybydesign/) | Production |
| **Netherlands** | **EWR (European Wallet Reference)** — NL pilot | [Official Site](https://ewr-nederland.nl/) | ❌ | Pilot (BZK / Logius) |
| **Austria** | **ID Austria** / eAusweise | [Google Play](https://play.google.com/store/apps/details?id=at.gv.oe.awp.eausweise) · [App Store](https://apps.apple.com/app/eausweise/id1641458335) | ❌ | Production |
| **EU level** | **EUDI Wallet Reference Implementation** | [GitHub](https://github.com/eu-digital-identity-wallet) | ✅ [Android](https://github.com/eu-digital-identity-wallet/eudi-app-android-wallet-ui) & [iOS](https://github.com/eu-digital-identity-wallet/eudi-app-ios-wallet-ui) | Reference Implementation (Pilot) |

> ❌ **Not compatible directly (Phase 2+):** AusweisApp Bund (Germany), France Identité — these use their own protocols and are not OpenID4VP-based wallets. However, once the OpenID4VP QR code is fully implemented, the **EU Reference Wallet** and **Itsme** will be able to scan it.

---

## 📱 Third-party QR Scanner Apps

For testing purposes, any general-purpose QR scanner app can display the raw content:

| App | Platform | Store Link |
|-----|----------|-----------|
| **QR & Barcode Scanner** (by Gamma Play) | Android | [Google Play](https://play.google.com/store/apps/details?id=com.gamma.scan) |
| **QR Code Reader** (by Scan) | iOS | [App Store](https://apps.apple.com/app/qr-code-reader/id1200318119) |
| **Kaspersky QR Scanner** | Both | [Google Play](https://play.google.com/store/apps/details?id=com.kaspersky.qrscanner) · [App Store](https://apps.apple.com/app/kaspersky-qr-scanner/id1544011972) |
