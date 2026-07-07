#!/usr/bin/env python3
"""
OpenID4VP Verifier Server – lightweight Flask endpoint.

This server acts as the Verifier in an OpenID4VP flow:
1. Our Demo generates an OpenID4VP Authorization Request
2. A real wallet app (EU Reference Wallet, Itsme, Yivi) scans the QR code
3. The wallet sends a VP Token (Verifiable Presentation) to this server
4. The server validates the SD-JWT signature and returns the result

Usage:
  python3 server/verifier.py

  Then set the OPENID4VP_VERIFIER_URL in the demo to https://<your-ip>:3000
  (e.g., https://192.168.1.42:3000)

Requirements:
  pip install flask flask-cors pyjwt cryptography
"""

import json
import uuid
import logging
from datetime import datetime, timezone

from flask import Flask, request, jsonify, render_template_string
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('verifier')

# In-memory store for presentation requests and results
# In production, use a database
presentation_requests = {}
presentation_results = {}

# Directory where this script lives
import os
SERVER_DIR = os.path.dirname(os.path.abspath(__file__))


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def generate_nonce():
    return str(uuid.uuid4())

def generate_id():
    return str(uuid.uuid4())


# ---------------------------------------------------------------------------
# POST /api/presentation-request
#
# The demo (Wallet tab) calls this to register what credentials/attributes
# it wants to present. Returns a request_uri that goes into the QR code.
# ---------------------------------------------------------------------------

@app.route('/api/presentation-request', methods=['POST'])
def create_presentation_request():
    """
    Expected body:
    {
        "credentialType": "PID",
        "credentialLabel": "Personal Identification Data",
        "attributes": { "given_name": "Jane", ... },
        "sharedAttributes": ["given_name", "family_name"]
    }

    Returns:
    {
        "request_id": "...",
        "openid4vp_uri": "openid4vp://authorize?response_type=vp_token&...",
        "presentation_definition": { ... },
        "expires_at": "..."
    }
    """
    data = request.json
    if not data:
        return jsonify({"error": "Missing request body"}), 400

    request_id = generate_id()
    nonce = generate_nonce()
    expires_at = datetime.now(timezone.utc).isoformat()

    # Build the presentation_definition (what attributes are requested)
    presentation_definition = {
        "id": request_id,
        "input_descriptors": [{
            "id": data.get('credentialType', 'credential'),
            "name": data.get('credentialLabel', 'Credential'),
            "purpose": "Verify the holder's identity attributes",
            "format": {
                "sd_jwt_vc": {
                    "sd-jwt_alg_values": ["ES256", "EdDSA"]
                }
            },
            "constraints": {
                "fields": [
                    {
                        "path": [f"$.vc.credentialSubject.{attr}"],
                        "purpose": f"Verify {attr}"
                    }
                    for attr in data.get('sharedAttributes', [])
                ]
            }
        }]
    }

    # Store the request for later validation
    presentation_requests[request_id] = {
        'presentation_definition': presentation_definition,
        'nonce': nonce,
        'created_at': expires_at,
        'status': 'pending',
    }

    # Build the OpenID4VP authorization request URI
    # (simplified; a real implementation would use proper encoding)
    client_id = f"https://{request.host}/api/verifier"
    response_uri = f"https://{request.host}/api/response"

    openid4vp_uri = (
        f"openid4vp://authorize?"
        f"response_type=vp_token"
        f"&client_id={client_id}"
        f"&presentation_definition={json.dumps(presentation_definition)}"
        f"&nonce={nonce}"
        f"&response_mode=direct_post"
        f"&response_uri={response_uri}"
    )

    logger.info(f"Created presentation request: {request_id}")

    return jsonify({
        "request_id": request_id,
        "openid4vp_uri": openid4vp_uri,
        "presentation_definition": presentation_definition,
        "nonce": nonce,
        "expires_at": expires_at,
    })


# ---------------------------------------------------------------------------
# POST /api/response
#
# The wallet app posts the VP Token here.
# ---------------------------------------------------------------------------

@app.route('/api/response', methods=['POST'])
def receive_presentation():
    """
    Expected body (from wallet):
    {
        "vp_token": "eyJhbGciOiJFUzI1NiIs...",  # JWT-encoded VP
        "presentation_submission": {
            "definition_id": "...",
            "descriptor_map": [...]
        }
    }

    For the initial demo (Phase 3a), we accept simplified JSON.
    For Phase 3b+, we validate the actual SD-JWT signature.
    """
    data = request.json
    if not data:
        return jsonify({"error": "Missing VP Token"}), 400

    # Phase 3a – Simplified acceptance
    # (accept any well-formed JSON for testing)
    vp_token = data.get('vp_token', data)
    presentation_submission = data.get('presentation_submission', {})

    definition_id = presentation_submission.get('definition_id', 'unknown')

    # Store the result
    result_id = generate_id()
    presentation_results[result_id] = {
        'status': 'received',
        'definition_id': definition_id,
        'vp_token': vp_token,
        'received_at': datetime.now(timezone.utc).isoformat(),
        'verified': True,  # Phase 3a: trust on first use
    }

    logger.info(f"Received presentation: {result_id}")

    return jsonify({
        "result_id": result_id,
        "status": "received",
        "redirect_uri": f"https://{request.host}/result/{result_id}",
    })


# ---------------------------------------------------------------------------
# GET /api/result/<result_id>
#
# The demo polls this endpoint to get the verification result.
# ---------------------------------------------------------------------------

@app.route('/api/result/<result_id>', methods=['GET'])
def get_result(result_id):
    result = presentation_results.get(result_id)
    if not result:
        return jsonify({"error": "Result not found"}), 404

    return jsonify(result)


# ---------------------------------------------------------------------------
# GET /api/presentation-request/<request_id>
#
# The demo can check the status of a presentation request.
# ---------------------------------------------------------------------------

@app.route('/api/presentation-request/<request_id>', methods=['GET'])
def get_presentation_request(request_id):
    req = presentation_requests.get(request_id)
    if not req:
        return jsonify({"error": "Request not found"}), 404

    return jsonify(req)


# ---------------------------------------------------------------------------
# GET /api/info
#
# Returns server status for the demo to check connectivity.
# ---------------------------------------------------------------------------

@app.route('/api/info', methods=['GET'])
def info():
    return jsonify({
        "name": "EUDI Wallet Demo – OpenID4VP Verifier",
        "version": "0.1.0",
        "status": "running",
        "supported_formats": ["sd_jwt_vc", "jwt_vc"],
        "endpoints": {
            "create_request": "POST /api/presentation-request",
            "receive_response": "POST /api/response",
            "get_result": "GET /api/result/<id>",
            "get_request": "GET /api/presentation-request/<id>",
        }
    })


# ---------------------------------------------------------------------------
# GET /
#
# Simple status page.
# ---------------------------------------------------------------------------

@app.route('/')
def index():
    return render_template_string("""
    <!DOCTYPE html>
    <html>
    <head>
        <title>EUDI Wallet Demo – Verifier Server</title>
        <style>
            body { font-family: -apple-system, sans-serif; max-width: 640px; margin: 2rem auto; padding: 0 1rem; }
            pre { background: #f5f5f5; padding: 1rem; border-radius: 8px; overflow-x: auto; }
            .status { display: inline-block; background: #e8f5e9; color: #2e7d32; padding: 0.3rem 0.8rem; border-radius: 12px; font-weight: 600; }
        </style>
    </head>
    <body>
        <h1>🔍 EUDI Wallet Demo Verifier</h1>
        <p><span class="status">✅ Running</span></p>
        <p>This server implements an OpenID4VP Verifier endpoint for the eIDAS Wallet Demo.</p>
        <h2>Endpoints</h2>
        <ul>
            <li><code>POST /api/presentation-request</code> – Register a presentation request</li>
            <li><code>POST /api/response</code> – Receive VP Token from wallet</li>
            <li><code>GET /api/result/&lt;id&gt;</code> – Get verification result</li>
        </ul>
        <h2>Current State</h2>
        <pre>{{ state }}</pre>
        <script>
            fetch('/api/info').then(r => r.json()).then(d => {
                document.querySelector('pre').textContent = JSON.stringify(d, null, 2);
            });
        </script>
    </body>
    </html>
    """, state=json.dumps({
        "presentation_requests": len(presentation_requests),
        "results": len(presentation_results),
    }, indent=2))


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

if __name__ == '__main__':
    print("🚀 OpenID4VP Verifier Server starting...")
    print(f"   Local:   http://localhost:3000")
    print()
    print("   To test with your phone:")
    print("   1. Find your local IP: ipconfig getifaddr en0")
    print("   2. Start with: python3 server/verifier.py")
    print("   3. In the demo, enter your IP as the verifier URL")
    print()

    import ssl
    try:
        # Try to create a self-signed cert for HTTPS
        # (required by some wallet apps for direct_post)
        context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        context.load_cert_chain(
            os.path.join(SERVER_DIR, 'cert.pem'),
            os.path.join(SERVER_DIR, 'key.pem')
        )
        app.run(host='0.0.0.0', port=3000, ssl_context=context, debug=True)
    except (FileNotFoundError, OSError):
        # Fall back to HTTP (works for same-network testing)
        print("⚠️  No SSL cert found – running in HTTP mode")
        print("   For mobile wallet testing, generate a self-signed cert:")
        print("   openssl req -x509 -newkey rsa:4096 -keyout server/key.pem -out server/cert.pem -days 365 -nodes -subj '/CN=localhost'")
        print()
        app.run(host='0.0.0.0', port=3000, debug=True)
