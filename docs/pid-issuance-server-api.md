# eIDAS PID Issuance Server API

> **Server:** `server/issuer.py` — Port 3001  
> **Protokoll:** REST/JSON  
> **Signatur:** ECDSA P-256 (ES256), JWT-kodiertes SD-JWT

---

## Start

```bash
pip install flask flask-cors cryptography
python3 server/issuer.py
# → http://localhost:3001
```

Der Schlüssel wird beim ersten Start generiert und in `server/issuer_key.pem` / `server/issuer_pub.pem` gespeichert.

---

## Endpoints

### `GET /api/info`

Server-Metadaten abrufen.

```json
{
  "name": "eIDAS PID Issuer",
  "issuer": "National Identity Authority",
  "algorithm": "ES256",
  "curve": "P-256",
  "endpoints": { ... }
}
```

---

### `GET /api/issuer/public-key`

Öffentlichen Schlüssel des Issuers abrufen (SPKI PEM-Format, kompatibel mit `crypto.subtle.importKey`).

```json
{
  "publicKeyPem": "-----BEGIN PUBLIC KEY-----\nMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAECb0kKmW...",
  "algorithm": "ES256",
  "curve": "P-256",
  "issuer": "National Identity Authority"
}
```

---

### `POST /api/issue/credential`

Ein SD-JWT-signiertes Verifiable Credential ausstellen.

**Request:**

```json
{
  "type": "PID",
  "attributes": {
    "given_name": "Jane",
    "family_name": "Smith",
    "birth_date": "1990-06-15"
  },
  "issuer": "National Identity Authority"
}
```

**Response:**

```json
{
  "credential": {
    "id": "68243497-...",
    "sdjwt": "eyJhbGciOiJFUzI1NiIs...",
    "format": "sd_jwt_vc",
    "type": "PID",
    "attributes": { ... },
    "issuer": "National Identity Authority",
    "publicKeyPem": "-----BEGIN PUBLIC KEY-----..."
  }
}
```

Das `sdjwt`-Feld enthält ein vollständiges JWT mit W3C-VC-Payload:

```json
{
  "iss": "National Identity Authority",
  "sub": "urn:eidas:wallet:68243497",
  "iat": 1783430462,
  "exp": 1814966462,
  "jti": "68243497-...",
  "vc": {
    "@context": [
      "https://www.w3.org/2018/credentials/v1",
      "https://europa.eu/eidas/2024/credentials/v1"
    ],
    "type": ["VerifiableCredential", "EUDIWalletCredential", "PID"],
    "credentialSubject": {
      "id": "urn:eidas:wallet:68243497",
      "given_name": "Jane",
      ...
    }
  }
}
```

---

### `POST /api/issue/status`

Credential-Status aktualisieren.

**Request:**
```json
{
  "credentialId": "68243497-...",
  "status": "revoked"
}
```

Mögliche Stati: `active`, `revoked`, `suspended`

**Response:**
```json
{
  "credentialId": "68243497-...",
  "status": "revoked",
  "updated": true
}
```

---

### `GET /api/issuer/status/<credential_id>`

Status eines Credentials abfragen.

```json
{
  "credentialId": "68243497-...",
  "status": "active"
}
```

---

## Integration in die Demo

Der Issuance-Tab (`IssuanceForm.svelte`) kann wählen zwischen:

1. **Browser-local** (aktuell) — Schlüssel in localStorage, Signatur via WebCrypto
2. **Server-issued** — POST an `http://localhost:3001/api/issue/credential`

Beide Optionen erzeugen ein SD-JWT im selben Format, signiert mit ECDSA P-256.

Der Verifier (`VerifierView.svelte`) kann gegen den Issuer-Public-Key prüfen
(statt gegen den localStorage-Key) — dafür den Server-Endpoint
`GET /api/issuer/public-key` abfragen.

---

## Test

```bash
# Server starten
python3 server/issuer.py

# Credential ausstellen
curl -X POST http://localhost:3001/api/issue/credential \
  -H 'Content-Type: application/json' \
  -d '{"type":"PID","attributes":{"given_name":"Jane","family_name":"Smith"},"issuer":"National Identity Authority"}'

# Public Key abrufen
curl http://localhost:3001/api/issuer/public-key
```
