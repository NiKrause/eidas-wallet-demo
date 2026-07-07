#!/usr/bin/env python3
"""
eIDAS Wallet Demo — PID Issuance Server (SD-JWT Issuer)
=======================================================
A Flask-based PID Provider that issues SD-JWT Verifiable Credentials
using ECDSA P-256 signing via the `cryptography` library.

Runs on port 3001 (separate from the verifier on port 3000).
"""

import json
import os
import uuid
import time
import base64
import struct

from flask import Flask, request, jsonify, make_response
from flask_cors import CORS

from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import ec, utils
from cryptography.hazmat.primitives.serialization import (
    Encoding,
    PrivateFormat,
    PublicFormat,
    NoEncryption,
    load_pem_private_key,
)

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
HOST = "0.0.0.0"
PORT = 3001
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
KEY_DIR = BASE_DIR  # we store keys alongside issuer.py

PRIV_KEY_PATH = os.path.join(KEY_DIR, "issuer_key.pem")
PUB_KEY_PATH = os.path.join(KEY_DIR, "issuer_pub.pem")

ISSUER_NAME = "National Identity Authority"
CREDENTIAL_EXPIRY_SECONDS = 365 * 24 * 3600  # 1 year

app = Flask(__name__)
CORS(app)

# In-memory credential status store (for demo purposes)
credential_status_store: dict[str, str] = {}

# ---------------------------------------------------------------------------
# ECDSA P-256 helpers
# ---------------------------------------------------------------------------

def _base64url_encode(data: bytes) -> str:
    """Standard base64url-encode without padding."""
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _base64url_decode(s: str) -> bytes:
    """Standard base64url-decode, re-adding any missing padding."""
    s = s.encode("ascii")
    pad = 4 - len(s) % 4
    if pad != 4:
        s += b"=" * pad
    return base64.urlsafe_b64decode(s)


def generate_or_load_keypair():
    """Generate a new ECDSA P-256 key pair or load existing one from disk."""
    if os.path.exists(PRIV_KEY_PATH) and os.path.exists(PUB_KEY_PATH):
        with open(PRIV_KEY_PATH, "rb") as f:
            private_key = load_pem_private_key(f.read(), password=None)
        with open(PUB_KEY_PATH, "rb") as f:
            public_key_pem = f.read()
        print(f"[issuer] Loaded existing key pair from {PRIV_KEY_PATH}")
        return private_key, public_key_pem

    print("[issuer] Generating new ECDSA P-256 key pair …")
    private_key = ec.generate_private_key(ec.SECP256R1())

    # Serialize private key
    priv_pem = private_key.private_bytes(
        encoding=Encoding.PEM,
        format=PrivateFormat.PKCS8,
        encryption_algorithm=NoEncryption(),
    )
    # Serialize public key as SPKI PEM (compatible with crypto.subtle.importKey)
    pub_pem = private_key.public_key().public_bytes(
        encoding=Encoding.PEM,
        format=PublicFormat.SubjectPublicKeyInfo,
    )

    os.makedirs(KEY_DIR, exist_ok=True)
    with open(PRIV_KEY_PATH, "wb") as f:
        f.write(priv_pem)
    with open(PUB_KEY_PATH, "wb") as f:
        f.write(pub_pem)

    print(f"[issuer] Saved key pair to {PRIV_KEY_PATH}")
    return private_key, pub_pem


def der_to_raw_sig(der_sig: bytes, key_order: int) -> bytes:
    """
    Convert a DER-encoded ECDSA signature to raw r||s format (concatenated
    big-endian integers, each of `key_order` bytes length).
    """
    r, s = utils.decode_dss_signature(der_sig)
    # Convert to fixed-length byte strings
    r_bytes = r.to_bytes(key_order, byteorder="big")
    s_bytes = s.to_bytes(key_order, byteorder="big")
    return r_bytes + s_bytes


def sign_jwt_payload(private_key, header: dict, payload: dict) -> str:
    """
    Build a compact-serialized JWT using ECDSA P-256 signing.
    Returns the complete JWT string: header.payload.signature  (base64url encoded).
    """
    header_b64 = _base64url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    payload_b64 = _base64url_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")

    # Sign with ECDSA P-256 and SHA-256
    signature_der = private_key.sign(signing_input, ec.ECDSA(hashes.SHA256()))

    # Convert DER signature to raw r||s format (32 bytes each for P-256)
    key_size = private_key.curve.key_size  # 256 bits → 32 bytes
    key_order = (key_size + 7) // 8  # 32
    raw_sig = der_to_raw_sig(signature_der, key_order)

    sig_b64 = _base64url_encode(raw_sig)
    return f"{header_b64}.{payload_b64}.{sig_b64}"


# ---------------------------------------------------------------------------
# Flask routes
# ---------------------------------------------------------------------------

PRIVATE_KEY, PUBLIC_KEY_PEM = generate_or_load_keypair()


@app.route("/")
def root():
    """Simple HTML status page."""
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>eIDAS PID Issuer</title>
  <style>
    body {{ font-family: -apple-system, sans-serif; max-width: 640px; margin: 40px auto; }}
    .ok {{ color: green; }}
  </style>
</head>
<body>
  <h1>🇪🇺 eIDAS PID Issuer</h1>
  <p class="ok">✓ Server is running</p>
  <p><strong>Algorithm:</strong> ES256 (ECDSA P-256)</p>
  <p><strong>Issuer:</strong> {ISSUER_NAME}</p>
  <hr>
  <h3>Available endpoints</h3>
  <ul>
    <li><code>GET /api/info</code> — Server info</li>
    <li><code>GET /api/issuer/public-key</code> — Public key (PEM)</li>
    <li><code>POST /api/issue/credential</code> — Issue an SD-JWT credential</li>
    <li><code>POST /api/issue/status</code> — Update credential status</li>
    <li><code>GET /api/issuer/status/&lt;credential_id&gt;</code> — Check status</li>
  </ul>
</body>
</html>"""
    return html


@app.route("/api/info")
def api_info():
    """Return server info."""
    return jsonify({
        "name": "eIDAS PID Issuer",
        "issuer": ISSUER_NAME,
        "algorithm": "ES256",
        "curve": "P-256",
        "endpoints": {
            "issue": "/api/issue/credential",
            "publicKey": "/api/issuer/public-key",
            "statusUpdate": "/api/issue/status",
            "statusCheck": "/api/issuer/status/<credential_id>",
            "info": "/api/info",
        },
    })


@app.route("/api/issuer/public-key")
def api_public_key():
    """Return the issuer's public key in PEM format."""
    return jsonify({
        "publicKeyPem": PUBLIC_KEY_PEM.decode("utf-8"),
        "algorithm": "ES256",
        "curve": "P-256",
        "issuer": ISSUER_NAME,
    })


@app.route("/api/issue/credential", methods=["POST"])
def api_issue_credential():
    """
    Accept a credential request and return an SD-JWT-signed Verifiable Credential.
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body must be JSON"}), 400

    cred_type = data.get("type", "PID")
    attributes = data.get("attributes", {})
    issuer = data.get("issuer", ISSUER_NAME)

    if not attributes:
        return jsonify({"error": "'attributes' object is required"}), 400

    credential_id = str(uuid.uuid4())
    short_id = credential_id[:8]

    # Build JWT header
    header = {
        "alg": "ES256",
        "typ": "sd-jwt",
    }

    # Build JWT payload with W3C VC structure
    now = int(time.time())
    payload = {
        "iss": issuer,
        "sub": f"urn:eidas:wallet:{short_id}",
        "iat": now,
        "exp": now + CREDENTIAL_EXPIRY_SECONDS,
        "jti": credential_id,
        "vc": {
            "@context": [
                "https://www.w3.org/2018/credentials/v1",
                "https://europa.eu/eidas/2024/credentials/v1",
            ],
            "type": ["VerifiableCredential", "EUDIWalletCredential", cred_type],
            "credentialSubject": {
                "id": f"urn:eidas:wallet:{short_id}",
                **attributes,
            },
        },
    }

    # Sign the JWT
    sdjwt = sign_jwt_payload(PRIVATE_KEY, header, payload)

    # Store credential as active by default
    credential_status_store[credential_id] = "active"

    return jsonify({
        "credential": {
            "id": credential_id,
            "sdjwt": sdjwt,
            "format": "sd_jwt_vc",
            "type": cred_type,
            "attributes": attributes,
            "issuer": issuer,
            "publicKeyPem": PUBLIC_KEY_PEM.decode("utf-8"),
        }
    })


@app.route("/api/issue/status", methods=["POST"])
def api_update_status():
    """
    Update the status of a credential (active / revoked / suspended).
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body must be JSON"}), 400

    credential_id = data.get("credentialId")
    status = data.get("status")

    if not credential_id:
        return jsonify({"error": "'credentialId' is required"}), 400
    if status not in ("active", "revoked", "suspended"):
        return jsonify({"error": "'status' must be 'active', 'revoked', or 'suspended'"}), 400

    credential_status_store[credential_id] = status
    return jsonify({
        "credentialId": credential_id,
        "status": status,
        "updated": True,
    })


@app.route("/api/issuer/status/<credential_id>")
def api_check_status(credential_id):
    """Check the status of a credential."""
    status = credential_status_store.get(credential_id)
    if status is None:
        return jsonify({"error": "Credential not found", "credentialId": credential_id}), 404

    return jsonify({
        "credentialId": credential_id,
        "status": status,
    })


# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    print(f"[issuer] eIDAS PID Issuer starting on http://{HOST}:{PORT}")
    print(f"[issuer] Using ECDSA P-256  —  keys at {PRIV_KEY_PATH}")
    app.run(host=HOST, port=PORT, debug=True)
