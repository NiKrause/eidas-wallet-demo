# 🇪🇺 EUDI Wallet Issuance – Country Details

> Shared reference for [`README.md`](../README.md) and [`README.de.md`](../README.de.md).
> Describes how each EU member state issues PID and QEAA credentials in the real world.

---

## 🇩🇪 Germany – Issuance

| Credential | Issuing Authority | Interface | How It Works |
|---|---|---|---|
| **PID** | **Federal Ministry of the Interior (BMI)** via **Bundesdruckerei** | The **AusweisApp2** or the wallet's built-in eID function | Citizens scan their **nPA (neuer Personalausweis)** or **eAT (electronic residence permit)** via NFC. The chip contains the identity data. The wallet reads it locally — no data is sent to a server. The PID credential is then derived from this. |
| **QEAA: Age Verification** | **Local Bürgeramt / Citizen's Office** or the **Federal Identity Authority** | In-person visit to Bürgeramt OR fully online | Using the PID, the wallet can derive `age_over_18` / `age_over_21` as a self-issued or authority-signed attestation. Some QEAAs require a visit to the Bürgeramt. |
| **QEAA: Professional License** | **IHK (Chamber of Industry and Commerce)**, **Handwerkskammer**, or **Anwaltskammer (Bar Association)** | IHK online portal or in-person | The chamber signs your professional status. The wallet receives a QEAA via OpenID4VCI. Testing is available via the **IHK Wallet Sandbox**. |
| **QEAA: Educational Attestation** | **Hochschulen (Universities)** via **HIS / S3** systems | University portal or campus card system | Universities issue digital degree attestations. The wallet requests the QEAA via a link from the university's portal. |

In Germany, the **national eID** (nPA, 27 million active eID users) serves as the foundation. The **BMJ (Ministry of Justice)** is tasked with the rollout of the EUDI Wallet, with **Bundesdruckerei** as the technical provider. The German wallet implementation is called **"eID-Wallet"** (formerly "ID Wallet").

**Key URLs:**
- [AusweisApp2](https://www.ausweisapp.bund.de/) — the current eID client
- [Bundesdruckerei eID](https://www.bundesdruckerei.de/de/innovationen/eid) — provider of the eID infrastructure
- [BMJ EUDI Wallet Information](https://www.bmj.de/DE/themen/digitales/eudi_wallet/eudi_wallet_node.html)

---

## 🇫🇷 France – Issuance

| Credential | Issuing Authority | Interface | How It Works |
|---|---|---|---|
| **PID** | **ANTS (Agence Nationale des Titres Sécurisés)** via **France Identité** | **France Identité** app (iOS/Android) | The **Carte Nationale d'Identité Électronique (CNIe)** contains an NFC chip. Citizens scan it with the **France Identité** app. The PID is created from the chip data. A **L'Identité Numérique (LID)** is provided as a digital proof. |
| **QEAA: Age Verification** | **ANSSI** or certified QEAA providers | France Identité app or partner apps | Similar to Germany, age attestations are derived from the PID. |
| **QEAA: Professional** | **Ordre des Médecins, Ordre des Avocats** etc. | Professional council portals | Professional orders issue digital attestations to their members. |

France already has a **production-ready digital identity** system called **France Identité**. The French **CNIe (new electronic ID card, ~15 million cards)** supports NFC-based reading. France was among the first EU countries to deploy a live wallet.

**Key URLs:**
- [France Identité](https://france-identite.gouv.fr/) — the official digital identity app
- [ANTS](https://ants.gouv.fr/) — national secure documents agency
- [France Connect](https://franceconnect.gouv.fr/) — existing identity federation (precursor to the EUDI Wallet)

---

## 🇧🇪 Belgium – Issuance

| Credential | Issuing Authority | Interface | How It Works |
|---|---|---|---|
| **PID** | **FPS BOSA (Federal Public Service Policy & Support)** via **eID system** | **Itsme** app or **eID card reader** | Belgium's **eID card** (mandatory for all citizens, 11.5 million cards) is the most established in Europe. Citizens use a card reader or NFC. The **Itsme** app provides a mobile eID. The EUDI Wallet PID will be derived from the existing eID infrastructure. |
| **QEAA: Age Verification** | **BOSA / eID system** | Itsme app | Derived from the eID, Belgium already provides age verification services commercially. |
| **QEAA: Professional** | **Kruispuntbank (Crossroads Bank)** for various professions | Professional registry portals | Belgium's central registries (BCE/KBO) can issue professional attestations. |

Belgium has the **highest adoption of digital identity in Europe**: the **eID card** has been mandatory since 2004, and **Itsme** has over 4.5 million active users. The EUDI Wallet in Belgium builds on this proven infrastructure.

**Key URLs:**
- [Itsme](https://www.itsme.be/) — Belgium's mobile identity app
- [BOSA eID](https://eid.belgium.be/) — official eID portal
- [CSAM](https://www.csam.be/) — public sector identity gateway

---

## 🇳🇱 Netherlands – Issuance

| Credential | Issuing Authority | Interface | How It Works |
|---|---|---|---|
| **PID (EUDI)** | **Ministry of the Interior and Kingdom Relations (BZK)** via **Logius** | **DigiD** app or **Yivi** | The Netherlands already has a mature digital identity infrastructure. **DigiD** (18M+ users) handles authentication for 800+ government services. For the EUDI Wallet, the PID will be derived from the existing DigiD identity verification. Logius is responsible for the Dutch EUDI Wallet implementation. |
| **QEAA: Age Verification** | **DigiD** / **Yivi** | DigiD app or Yivi app | Both DigiD and Yivi already support attribute-based disclosure. Age verification (`age_over_18`) is a common use case for alcohol/age-restricted purchases. |
| **QEAA: Professional** | **Kamer van Koophandel (KvK)** — Chamber of Commerce | KvK online portal | The Dutch Business Register can issue professional attestations. Also via **eHerkenning** (business identity system). |
| **Attribute-based Identity** | **Yivi** (formerly **IRMA**) | Yivi app | Yivi is an open source, privacy-preserving attribute-based identity system developed by **Privacy by Design Foundation**. It was selected as a foundational technology for the Dutch EUDI Wallet pilot. Yivi uses **Idemix** (IBM) for cryptographic zero-knowledge proofs. |

The Netherlands has a unique two-track approach:
- **DigiD** — the existing government authentication system, which will evolve into the EUDI Wallet
- **Yivi (IRMA)** — the open source attribute-based identity system that proved selective disclosure in practice

**Key URLs:**
- [DigiD](https://www.digid.nl/) — Dutch digital identity portal
- [Yivi](https://yivi.app/) — open source attribute-based identity app
- [Logius](https://www.logius.nl/) — Dutch government digital services agency
- [EWR (European Wallet Reference)](https://ewr-nederland.nl/) — Dutch EUDI Wallet pilot program
- [Privacy by Design Foundation](https://privacybydesign.foundation/) — creators of Yivi/IRMA

---

## The PID is the Foundation

The **PID (Personal Identification Data)** is the **root credential** in the EUDI Wallet ecosystem:

```
PID (issued once by government)
   ├── Basis for QEAA Age Verification
   ├── Basis for QEAA Professional License
   ├── Basis for QEAA Educational Attestation
   └── Basis for any future QEAA
```

Without a PID, no QEAA can be obtained. The PID represents the **government-verified identity** of the holder. All QEAAs are **linked to the PID** and inherit their trust from the PID's issuance process.
