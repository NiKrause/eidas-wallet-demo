# EUDI Wallet – Präsentations-Flows im Detail

> Basierend auf dem **EUDI Wallet Architecture and Reference Framework (ARF)**  
> und den Standards **ISO 18013-5** (Proximity) und **OpenID4VP** (Remote).

---

## 1. Überblick: Vier Flows

Die EUDI Wallet definiert **vier verschiedene Präsentations-Flows**, je nachdem ob
User und Verifier sich **am selben Ort** (Proximity) oder **entfernt** (Remote) befinden,
und ob sie **dasselbe Gerät** nutzen oder nicht.

```
                 ┌──────────────────────────────────────────┐
                 │         Präsentations-Flows               │
                 ├────────────┬─────────────────────────────┤
                 │  Proximity  │         Remote              │
                 │  (vor Ort)  │       (entfernt)            │
                 ├────────────┼──────────────┬──────────────┤
                 │            │ Same-Device  │ Cross-Device  │
                 │  NFC/BLE   │  DC API      │  CTAP Hybrid  │
                 │  offline   │  online      │  online + BLE │
                 └────────────┴──────────────┴──────────────┘
```

---

## 2. Proximity-Flows (Nahbereich / Vor Ort)

> **Anwendung:** Club-Eingang, Supermarkt-Kasse, Grenzkontrolle, Hotel-Check-in  
> **Standard:** ISO/IEC 18013-5 (mDL – mobile Driving License)  
> **Transport:** NFC, BLE, Wi-Fi Aware  
> **Internet:** Nicht erforderlich – **funktioniert offline**

```
┌─────────────────────┐                    ┌─────────────────────┐
│   Wallet (Handy)    │                    │  Verifier (Kasse)   │
├─────────────────────┤                    ├─────────────────────┤
│ 1. User öffnet App  │                    │                     │
│ 2. Wallet zeigt QR  │── QR-Code ────────→│ 3. Verifier scannt  │
│    (Device Engagement)│                   │    QR-Code          │
│                     │←── NFC/BLE ────────│ 4. Verbindung aufbau│
│                     │    Verbindung       │                     │
│                     │←── Präsentations-  │ 5. Verifier fragt an│
│                     │    anfrage          │    (z.B. age_over_18)│
│ 6. User genehmigt   │                    │                     │
│ 7. Wallet signiert  │── VP Token ────────→│ 8. Verifier prüft  │
│                     │    (SD-JWT)         │    Signatur + Trust │
└─────────────────────┘                    └─────────────────────┘
```

### Offline-Fähigkeit

✅ **Ja, Proximity funktioniert komplett offline.**

- Kein Internet nötig für die **Kommunikation** (NFC/BLE reichen)
- Kein Internet nötig für die **Signaturprüfung**, wenn der Verifier die
  Vertrauensliste (Trust Registry) gecached hat
- Die **Vertrauensliste** wird regelmäßig (z.B. täglich) aktualisiert,
  aber der Verifier kann auch mit einer etwas veralteten Liste prüfen

### Zwei Varianten

| Variante | Beschreibung | Beispiel |
|----------|-------------|----------|
| **Supervised** | Menschlicher Mitarbeiter beaufsichtigt den Vorgang | Club-Eingang, Hotel |
| **Unsupervised** | Automat, keine menschliche Aufsicht | Fahrkartenautomat, Alterskontrollautomat |

---

## 3. Remote Same-Device (Online, ein Gerät)

> **Anwendung:** Online-Shop auf dem Handy, Banking-App  
> **Protokoll:** OpenID4VP über **W3C Digital Credentials API**  
> **Transport:** Internet (kein QR, kein NFC/BLE)  
> **Internet:** ✔️ Erforderlich (online)

```
┌──────────────┐     ┌─────────────┐     ┌──────────────────┐
│ Browser/App  │     │  Wallet     │     │ Verifier-Server  │
│  (Handy)     │     │  (Handy)    │     │   (Internet)     │
├──────────────┤     ├─────────────┤     ├──────────────────┤
│ User klickt  │     │             │     │                  │
│ "Ausweis"    │     │             │     │                  │
│              │────→│ DC API      │     │                  │
│              │     │             │────→│ OpenID4VP Request│
│              │     │             │←────│ Präsentations-   │
│              │     │             │     │ definition       │
│              │     │ User       │     │                  │
│              │     │ genehmigt  │     │                  │
│              │     │             │────→│ VP Token (JWT)   │
│              │←────│ Antwort     │     │                  │
└──────────────┘     └─────────────┘     └──────────────────┘
```

### 🔑 Wichtigster Unterschied zu unserer Demo

**In diesem Flow gibt es keinen QR-Code!**  
Die Kommunikation läuft vollständig über die **W3C Digital Credentials API**,
die der Browser bereitstellt. Der Browser fungiert als Vermittler zwischen
der Website und der Wallet-App.

---

## 4. Remote Cross-Device (Online, zwei Geräte)

> **Anwendung:** Online-Shop am Laptop/PC, Wallet auf dem Handy  
> **Protokoll:** OpenID4VP über **FIDO CTAP Hybrid Flow**  
> **Transport:** Internet + BLE (Proximity-Check)  
> **Internet:** ✔️ Erforderlich (online)

```
┌──────────────┐        ┌─────────────┐        ┌──────────────────┐
│ Browser (PC) │        │ Wallet      │        │ Verifier-Server  │
│              │        │ (Handy)     │        │   (Internet)     │
├──────────────┤        ├─────────────┤        ├──────────────────┤
│ 1. User      │        │             │        │                  │
│    loggt ein │        │             │        │                  │
│              │        │             │        │                  │
│ 2. PC zeigt  │        │             │        │                  │
│    QR-Code ──│───────→│ 3. Handy    │        │                  │
│    (CTAP)    │        │    scannt   │        │                  │
│              │        │    QR       │        │                  │
│              │←──BLE──│ 4. BLE-     │        │                  │
│              │   Adv. │    Werbung  │        │                  │
│              │        │             │        │                  │
│ 5. Tunnel    │────────│─ via Tunnel─│────────│                  │
│    aufbauen  │        │  Server     │        │                  │
│              │        │             │        │                  │
│              │───────→│ OpenID4VP   │        │                  │
│              │ (Tunnel)│  Request   │        │                  │
│              │        │             │        │                  │
│              │        │ 6. User     │        │                  │
│              │        │    genehmigt│        │                  │
│              │        │             │        │                  │
│              │←───────│ 7. VP Token │        │                  │
│              │ (Tunnel)│  (signiert)│        │                  │
│              │        │             │───────→│ 8. Verifikation  │
└──────────────┘        └─────────────┘        └──────────────────┘
```

### 🔑 Der QR-Code kommt vom **VERIFIER** (Browser auf PC)

Dies ist der entscheidende Unterschied zu unserer Demo:

| Flow | Wer zeigt QR? | Wer scannt? |
|------|--------------|-------------|
| **Proximity** (ISO 18013-5) | **Wallet** (Handy) | Verifier (Scanner) |
| **Cross-Device Remote** (CTAP) | **Verifier** (PC) | Wallet (Handy) |

---

## 5. Vergleich: Offline vs. Online

| Flow | Internet nötig? | QR-Code? | Typische Geräte |
|------|----------------|----------|-----------------|
| **Proximity** | ❌ **Nein** (offline) | ✅ Wallet zeigt QR | Handy (Wallet) ↔ Scanner (Kasse) |
| **Remote Same-Device** | ✅ **Ja** (online) | ❌ Nein (DC API) | Handy (Browser + Wallet) |
| **Remote Cross-Device** | ✅ **Ja** (online) | ✅ **Verifier zeigt QR** | PC (Browser) ↔ Handy (Wallet) |
| **In-App** (native) | ✅ **Ja** (online) | ❌ Nein (OS-API) | Handy (App ↔ Wallet) |

### Kann Verifikation offline funktionieren?

**Ja, aber nur im Proximity-Flow (ISO 18013-5).**  
Und auch dann nur, wenn:

1. Der Verifier die **aktuelle Vertrauensliste (Trust Registry)** gecached hat
2. Die **Certificiate Revocation List (CRL)** oder **Status List JWT** aktuell ist
3. Die Wallet den **privaten Schlüssel** lokal (auf dem Gerät) hat (WSCD)

**Nein, Remote-Flows benötigen immer Internet**, weil der Verifier-Server
online erreichbar sein muss.

---

## 6. Was bedeutet das für unsere Demo?

### Korrekt ✅

| Aspekt | Status |
|--------|--------|
| Wallet zeigt QR (Present-Tab) | ✅ Richtig für **Proximity**-Flow |
| OpenID4VP als Protokoll | ✅ Richtig für **Remote**-Flows |
| SD-JWT Signatur | ✅ Richtig für alle Flows |
| Server-Validierung | ✅ Richtig für Remote-Flows |
| Selektive Offenlegung | ✅ Richtig für alle Flows |

### Fehlt / müsste ergänzt werden ⬜

| Feature | Relevanz | Aufwand |
|---------|----------|---------|
| **Verifier zeigt QR (Cross-Device)** | 🔴 Wichtig für PC→Handy Flow | Mittel |
| **BLE Proximity-Check** | 🟡 Nice-to-have (echte Geräte) | Hoch |
| **NFC-Transport** | 🟡 Nice-to-have (echte Geräte) | Hoch |
| **Offline-Modus** | 🟢 Weniger kritisch (Demo-Browser) | Gering |
| **Proximity Unsupervised** | 🟢 Selbes wie Proximity supervised | Gering |
| **W3C Digital Credentials API** | 🔴 Browser-API noch nicht standardisiert | Kann warten |

---

## 7. Quellen

- [EUDI Wallet Architecture and Reference Framework (ARF)](https://github.com/eu-digital-identity-wallet/eudi-doc-architecture-and-reference-framework)
  - Kapitel 4.4: Data Presentation Flows
  - Kapitel 4.4.2: Proximity Presentation Flows
  - Kapitel 4.4.3: Remote Presentation Transaction Flows
- [ISO/IEC 18013-5:2021 — Personal identification — ISO-compliant driving licence](https://www.iso.org/standard/82720.html)
- [OpenID4VP — OpenID for Verifiable Presentations](https://openid.net/specs/openid-4-verifiable-presentations-1_0.html)
- [W3C Digital Credentials API](https://w3c.github.io/digital-credentials/)
- [CIR 2024/2982 — Protocols and Interfaces](https://data.europa.eu/eli/reg_impl/2024/2982/oj)
