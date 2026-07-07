# W3C Digital Credentials API – Integration Guide

> **Status:** Draft – API ist noch in Entwicklung (W3C Working Draft)  
> **Ziel:** Beschreibt, wie die EUDI Wallet Demo die zukünftige **W3C Digital Credentials API** nutzen kann

---

## 1. Was ist die W3C Digital Credentials API?

Die **Digital Credentials API (DC API)** ist ein browser-native Standard (W3C Working Draft), der Websites erlaubt, **Verifiable Credentials** direkt mit einer Wallet-App auszutauschen – **ohne QR-Code, ohne manuelles Kopieren**.

Sie erweitert die bestehende **Credential Management API** (die auch von WebAuthn/Passkeys genutzt wird).

**Status:** [W3C Working Draft](https://w3c.github.io/digital-credentials/) – noch nicht als Recommendation veröffentlicht. Noch nicht von allen Browsern implementiert.

---

## 2. Wozu ist sie da?

Die DC API löst mehrere Probleme der aktuellen Flows:

| Problem | Aktuell (unsere Demo) | Mit DC API |
|---------|----------------------|------------|
| **Wallet-Auswahl** | User muss manuell Wallet öffnen | Browser fragt OS, welches Wallet zuständig ist |
| **QR-Code** | Nötig für Cross-Device (PC→Handy) | Nicht nötig – Browser vermittelt direkt |
| **Phishing-Schutz** | Kein Origin-Check | Browser garantiert korrekte `client_id` (Origin) |
| **Session-Binding** | Manuelles Einfügen | Browser bindet Session automatisch |
| **Benutzererfahrung** | Kopieren/Einfügen | Ein Klick: "Mit Wallet bestätigen" |

---

## 3. Der Flow mit DC API

```
┌─────────────────────┐     ┌─────────────────────┐     ┌──────────────────┐
│ Browser (Website)   │     │ Wallet (OS/App)     │     │ Verifier-Server  │
├─────────────────────┤     ├─────────────────────┤     ├──────────────────┤
│ User klickt         │     │                     │     │                  │
│ "Mit Wallet        │     │                     │     │                  │
│  bestätigen"        │     │                     │     │                  │
│                     │     │                     │     │                  │
│ navigator.credentials│     │                     │     │                  │
│  .get({             │     │                     │     │                  │
│    digital: {       │     │                     │     │                  │
│      requests: [{   │     │                     │     │                  │
│        protocol:    │     │                     │     │                  │
│          "openid4vp",│     │                     │     │                  │
│        data: {...}  │────→│ Wallet auswählen    │     │                  │
│      }]             │     │  (OS-API)           │     │                  │
│    }                │     │                     │     │                  │
│  })                 │     │                     │     │                  │
│                     │     │ User genehmigt      │     │                  │
│                     │←────│ VP Token zurück     │     │                  │
│                     │     │                     │     │                  │
│ Website erhält      │     │                     │     │                  │
│ VP Token            │────→│ POST /api/response ─│────→│ Validation       │
│                     │     │                     │     │                  │
│ Ergebnis anzeigen   │     │                     │     │                  │
└─────────────────────┘     └─────────────────────┘     └──────────────────┘
```

---

## 4. Technische Spezifikation

### Request (Browser → Wallet)

```javascript
const credential = await navigator.credentials.get({
  digital: {
    requests: [{
      protocol: "openid4vp",
      data: {
        // OpenID4VP Authorization Request (JSON)
        response_type: "vp_token",
        response_mode: "direct_post",
        client_id: "https://verifier.example.com",
        presentation_definition: {
          id: "pd-1",
          input_descriptors: [{
            id: "pid",
            name: "Personal Identification Data",
            format: {
              "sd_jwt_vc": {
                alg: ["ES256"]
              }
            },
            constraints: {
              fields: [{
                path: ["$.vc.type"],
                filter: {
                  type: "string",
                  pattern: "PID"
                }
              }]
            }
          }]
        },
        nonce: "abc123",
        state: "xyz789"
      }
    }]
  }
});
```

### Response (Wallet → Browser)

```javascript
// credential ist ein DigitalCredential Objekt
console.log(credential.rawId);    // UUID der Wallet-Instanz
console.log(credential.type);     // "digital"
console.log(credential.data);     // { protocol: "openid4vp", response: { ... VP Token ... } }
```

---

## 5. Integration in unsere Demo

### Same-Device Flow (Browser + Wallet auf einem Gerät)

Der Browser ruft `navigator.credentials.get()` auf. Das OS zeigt eine Wallet-Auswahl.
User wählt die EUDI Wallet → bestätigt → VP Token kommt zurück.

**In unserer Demo:** Der Verify-Tab könnte einen Button "Mit Wallet bestätigen" haben,
der diesen API-Aufruf macht.

```svelte
<button onclick={requestViaDCApi}>
  🪪 Mit Wallet bestätigen (DC API)
</button>

<script>
  async function requestViaDCApi() {
    if (!navigator.credentials?.get) {
      error = 'DC API nicht verfügbar – QR-Code verwenden';
      return;
    }

    try {
      const credential = await navigator.credentials.get({
        digital: {
          requests: [{
            protocol: 'openid4vp',
            data: {
              client_id: window.location.origin,
              response_type: 'vp_token',
              response_mode: 'direct_post',
              presentation_definition: { ... },
              nonce: crypto.randomUUID(),
            }
          }]
        }
      });

      const vpToken = credential.data.response;
      await verifyVP(vpToken);
    } catch (e) {
      error = `DC API Fehler: ${e.message}`;
    }
  }
</script>
```

### Cross-Device Flow (Browser auf PC, Wallet auf Handy)

Browser zeigt QR-Code (wie Phase 5). Zusätzlich **CTAP Hybrid Flow** (FIDO2/Passkeys):
1. Browser zeigt QR mit Tunnel-Endpoint
2. Handy scannt QR → **BLE Advertisement** als Proximity-Check
3. Tunnel wird aufgebaut
4. OpenID4VP Request/Response über Tunnel

**In unserer Demo:** Der Cross-Device QR enthält bereits die richtige `openid4vp://` URI.
Der nächste Schritt wäre, einen **CTAP-Hybrid-ähnlichen Tunnel** zu implementieren.

---

## 6. Einschränkungen & aktuelle Probleme

| Problem | Beschreibung | Status |
|---------|-------------|--------|
| **Nicht standardisiert** | DC API ist erst W3C Working Draft | ⏳ In Entwicklung |
| **Browser-Support** | Bisher nur Chromium (Chrome Canary) mit Flag | ⏳ Experimentell |
| **Kein Custom Protocol** | Nur `openid4vp` ist als Protocol erlaubt | ⏳ W3C Diskussion |
| **Android/iOS** | OS-Integration nötig für Wallet-Auswahl | ⏳ Plattformabhängig |
| **Cross-Device** | CTAP Hybrid Flow ist komplex | ⏳ FIDO2/Passkeys |

### Browser-Kompatibilität (Stand Juli 2026)

| Browser | DC API | Status |
|---------|--------|--------|
| Chrome | ✅ (ab 130+, Flag) | Experimentell |
| Edge | ✅ (Chromium-basiert) | Experimentell |
| Firefox | ❌ Nicht implementiert | Wird diskutiert |
| Safari | ❌ Nicht implementiert | Unklar |
| Samsung Internet | ❌ Nicht implementiert | Unklar |

---

## 7. Empfehlungen für die Demo

1. **Feature-Detection** – Prüfen ob `navigator.credentials.get` existiert
2. **Graceful Fallback** – Wenn DC API nicht verfügbar: QR-Code anzeigen (wie bisher)
3. **OpenID4VP-kompatibel bleiben** – Die Payloads sind identisch, egal ob via QR, DC API oder Server
4. **`client_id` und `origin` korrekt setzen** – Der Browser prüft die Herkunft
5. **`nonce` zufällig generieren** – Schutz vor Replay-Angriffen

### Architektur-Empfehlung

```
┌────────────────────────────────────────────┐
│            VerifierView                     │
├──────────┬──────────┬─────────────────────┤
│ Standard │ Cross-   │ DC API              │
│ (JSON)   │ Device   │ (Zukunft)           │
│          │ (QR)     │                     │
├──────────┴──────────┴─────────────────────┤
│           Einheitliche VP-Validierung      │
│           (VerifierView.verifyVP)          │
└────────────────────────────────────────────┘
```

---

## 8. Quellen

- [W3C Digital Credentials API – Working Draft](https://w3c.github.io/digital-credentials/)
- [WICG Digital Credentials – GitHub](https://github.com/WICG/digital-credentials)
- [OpenID4VP Profil für W3C DC API](https://openid.net/specs/openid-4-verifiable-presentations-1_0.html)
- [Chrome Platform Status – Digital Credentials](https://chromestatus.com/feature/5149285092122624)
- [EUDI Wallet ARF – Kapitel 4.4.3 (Remote Presentation Flows)](https://github.com/eu-digital-identity-wallet/eudi-doc-architecture-and-reference-framework)
- [Topic F: Digital Credentials API (ARF Discussion Paper)](https://github.com/eu-digital-identity-wallet/eudi-doc-architecture-and-reference-framework/blob/main/docs/discussion-topics/f-digital-credential-api.md)
