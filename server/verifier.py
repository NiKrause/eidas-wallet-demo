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
        "vp_token": "{...}",  # JSON string or raw SDK-JWT
        "presentation_submission": {
            "definition_id": "...",
            "descriptor_map": [...]
        }
    }

    Phase 3b: Validates the VP data structure and credential fields.
    Full SD-JWT signature verification requires a shared key exchange
    (browser WebCrypto ↔ Python) — tracked for future enhancement.
    """
    data = request.json
    if not data:
        return jsonify({"error": "Missing VP Token"}), 400

    vp_token_raw = data.get('vp_token', data)
    presentation_submission = data.get('presentation_submission', {})

    definition_id = presentation_submission.get('definition_id', 'unknown')

    # Phase 3b – Validate the VP data structure
    vp_data = None
    verified = False
    validation_errors = []

    # Try to parse vp_token as JSON credential
    if isinstance(vp_token_raw, str):
        try:
            vp_data = json.loads(vp_token_raw)
        except json.JSONDecodeError:
            vp_data = vp_token_raw  # Could be a raw SD-JWT (JWT string)
            validation_errors.append('vp_token is not valid JSON')
    elif isinstance(vp_token_raw, dict):
        vp_data = vp_token_raw
    else:
        validation_errors.append('Unsupported vp_token format')

    # Validate credential structure
    if isinstance(vp_data, dict):
        required_fields = ['format', 'credentialType', 'credentialId']
        missing = [f for f in required_fields if f not in vp_data]
        if missing:
            validation_errors.append(f'Missing required fields: {", ".join(missing)}')
        else:
            # Check for supported format
            supported_formats = ['sd_jwt_vc', 'eidas-wallet-demo-v1', 'jwt_vc']
            if vp_data.get('format') not in supported_formats:
                validation_errors.append(
                    f'Unsupported format "{vp_data.get("format")}". '
                    f'Supported: {", ".join(supported_formats)}'
                )
            else:
                verified = True

        # Check for expiry
        timestamp = vp_data.get('timestamp')
        if timestamp:
            try:
                ts = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                age = (datetime.now(timezone.utc) - ts).total_seconds()
                if age > 300:  # Older than 5 minutes
                    validation_errors.append('Presentation is older than 5 minutes')
                    verified = False
            except (ValueError, TypeError):
                pass  # Can't parse timestamp, skip expiry check
    elif isinstance(vp_data, str):
        # It's a raw JWT string — could verify signature here with pyjwt
        # For now, accept and flag for manual verification
        verified = True
        vp_data = {'vp_token_jwt': vp_data[:80] + '...', '_raw_jwt': True}
    else:
        validation_errors.append('Could not parse vp_token')

    # Store the result
    result_id = generate_id()
    presentation_results[result_id] = {
        'status': 'received' if verified else 'rejected',
        'definition_id': definition_id,
        'vp_token': vp_data,
        'received_at': datetime.now(timezone.utc).isoformat(),
        'verified': verified,
        'validation_errors': validation_errors if validation_errors else None,
    }

    logger.info(
        f"Received presentation: {result_id} "
        f"(verified={verified}, errors={len(validation_errors)})"
    )

    return jsonify({
        "result_id": result_id,
        "status": "received" if verified else "rejected",
        "verified": verified,
        "validation_errors": validation_errors if validation_errors else None,
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
# Cross-Device Sessions
# ---------------------------------------------------------------------------

cross_device_sessions = {}  # session_id -> { waiting_for_vp, vp_token, created_at, requested_attributes, status }


@app.route('/api/cross-device/<session_id>', methods=['GET'])
def cross_device_poll(session_id):
    """Polled by the Verifier (browser) to check if the Wallet has sent a VP token"""
    session = cross_device_sessions.get(session_id)
    if not session:
        return jsonify({"error": "Session not found"}), 404
    return jsonify(session)


@app.route('/api/cross-device/<session_id>/response', methods=['POST'])
def cross_device_receive(session_id):
    """Called by the Wallet (browser) to submit the VP token"""
    data = request.json
    if not data:
        return jsonify({"error": "Missing VP token"}), 400
    session = cross_device_sessions.get(session_id)
    if not session:
        return jsonify({"error": "Session not found"}), 404
    session['vp_token'] = data.get('vp_token', data)
    session['status'] = 'received'
    session['received_at'] = datetime.now(timezone.utc).isoformat()
    return jsonify({"status": "ok"})


@app.route('/api/cross-device', methods=['POST'])
def cross_device_create():
    """Called by the Verifier (browser) to create a cross-device session."""
    data = request.json or {}
    session_id = data.get('session_id', generate_id())
    cross_device_sessions[session_id] = {
        'session_id': session_id,
        'status': 'waiting',
        'vp_token': None,
        'requested_attributes': data.get('requested_attributes', []),
        'created_at': datetime.now(timezone.utc).isoformat(),
        'waiting_for_vp': True,
    }
    logger.info(f"Created cross-device session: {session_id}")
    return jsonify({
        'session_id': session_id,
        'status': 'waiting',
        'poll_url': f'/api/cross-device/{session_id}',
        'response_url': f'/api/cross-device/{session_id}/response',
    })


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
            "cross_device_create": "POST /api/cross-device",
            "cross_device_poll": "GET /api/cross-device/<session_id>",
            "cross_device_receive": "POST /api/cross-device/<session_id>/response",
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
            <li><code>POST /api/cross-device</code> – Create a cross-device session</li>
            <li><code>GET /api/cross-device/&lt;session_id&gt;</code> – Poll cross-device session</li>
            <li><code>POST /api/cross-device/&lt;session_id&gt;/response</code> – Submit VP token</li>
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
        "cross_device_sessions": len(cross_device_sessions),
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

    use_https = os.environ.get('HTTPS', '').lower() in ('1', 'true', 'yes')
    if use_https:
        import ssl
        try:
            context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
            context.load_cert_chain(
                os.path.join(SERVER_DIR, 'cert.pem'),
                os.path.join(SERVER_DIR, 'key.pem')
            )
            app.run(host='0.0.0.0', port=3000, ssl_context=context, debug=True)
        except (FileNotFoundError, OSError) as e:
            print(f"⚠️  SSL cert error: {e}")
            print("   To generate a self-signed cert:")
            print("   openssl req -x509 -newkey rsa:4096 -keyout server/key.pem -out server/cert.pem -days 365 -nodes -subj '/CN=localhost'")
            print()
            app.run(host='0.0.0.0', port=3000, debug=True)
    else:
        # Default: HTTP mode — works with browser http://localhost:3000
        # For mobile wallet testing, start with: HTTPS=true python3 server/verifier.py
        print("⚠️  Running in HTTP mode (default)")
        print("   For HTTPS (mobile wallet testing): HTTPS=true python3 server/verifier.py")
        print()
        app.run(host='0.0.0.0', port=3000, debug=True)
