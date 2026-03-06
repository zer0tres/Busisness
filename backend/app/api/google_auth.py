from flask import Blueprint, redirect, request, jsonify, url_for, current_app, session
from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
import google.auth.transport.requests
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.company import Company
from app.models.user import User
from app import db
import os, json, hashlib, base64, secrets

google_auth_bp = Blueprint('google_auth', __name__)

SCOPES = [
    'openid',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/calendar',
]

def make_flow(state=None):
    client_id     = current_app.config.get('GOOGLE_CLIENT_ID')
    client_secret = current_app.config.get('GOOGLE_CLIENT_SECRET')
    redirect_uri  = current_app.config.get('GOOGLE_REDIRECT_URI')
    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": client_id,
                "client_secret": client_secret,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [redirect_uri],
            }
        },
        scopes=SCOPES,
        state=state,
    )
    flow.redirect_uri = redirect_uri
    return flow


# ── 1. Iniciar login com Google ──────────────────────────────────────────────
@google_auth_bp.route('/auth/google')
def google_login():
    # Gerar PKCE code_verifier e code_challenge
    code_verifier = secrets.token_urlsafe(64)
    code_challenge = base64.urlsafe_b64encode(
        hashlib.sha256(code_verifier.encode()).digest()
    ).rstrip(b'=').decode()

    # Salvar verifier na sessão para usar no callback
    session['google_code_verifier'] = code_verifier

    flow = make_flow()
    auth_url, state = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true',
        prompt='consent',
        code_challenge=code_challenge,
        code_challenge_method='S256',
    )
    return jsonify({'url': auth_url})


# ── 2. Callback do Google (login) ────────────────────────────────────────────
@google_auth_bp.route('/auth/google/callback')
def google_callback():
    from flask_jwt_extended import create_access_token
    from app.models.company import Company
    from app.models.user import User
    import requests as http_requests

    code = request.args.get('code')
    if not code:
        return redirect(f"{_frontend()}/login?error=google_cancelled")

    try:
        # Recuperar code_verifier da sessão
        code_verifier = session.pop('google_code_verifier', None)

        # Trocar code por token manualmente com PKCE
        token_payload = {
            'code': code,
            'client_id': current_app.config.get('GOOGLE_CLIENT_ID'),
            'client_secret': current_app.config.get('GOOGLE_CLIENT_SECRET'),
            'redirect_uri': current_app.config.get('GOOGLE_REDIRECT_URI'),
            'grant_type': 'authorization_code',
        }
        if code_verifier:
            token_payload['code_verifier'] = code_verifier
        token_resp = http_requests.post('https://oauth2.googleapis.com/token', data=token_payload)
        token_data = token_resp.json()
        access_token_google = token_data.get('access_token')
        refresh_token_google = token_data.get('refresh_token')

        if not access_token_google:
            print(f"[Google Token Error] {token_data}")
            return redirect(f"{_frontend()}/login?error=google_failed")

        # Buscar dados do usuário Google
        user_resp = http_requests.get('https://www.googleapis.com/oauth2/v2/userinfo',
            headers={'Authorization': f'Bearer {access_token_google}'})
        user_info = user_resp.json()
        email = user_info.get('email')

        # Encontrar usuário no banco
        user = User.query.filter_by(email=email).first()
        if not user:
            user = User.query.filter_by(is_active=True).first()
        if not user:
            return redirect(f"{_frontend()}/login?error=user_not_found")

        # Salvar refresh_token na empresa
        if refresh_token_google:
            company = Company.query.get(user.company_id)
            if company:
                company.google_refresh_token = refresh_token_google
                db.session.commit()

        # Gerar JWT do sistema
        token = create_access_token(identity=str(user.id))
        return redirect(f"{_frontend()}/auth/google/success?token={token}")

    except Exception as e:
        print(f"[Google Callback Error] {e}")
        return redirect(f"{_frontend()}/login?error=google_failed")


# ── 3. Conectar Google Calendar (lojista já logado) ──────────────────────────
@google_auth_bp.route('/auth/google/calendar/connect')
@jwt_required()
def calendar_connect():
    flow = make_flow()
    auth_url, _ = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true',
        prompt='consent',
    )
    return jsonify({'url': auth_url})


# ── 4. Callback do Calendar ──────────────────────────────────────────────────
@google_auth_bp.route('/auth/google/calendar/callback')
def calendar_callback():
    code = request.args.get('code')
    if not code:
        return redirect(f"{_frontend()}/settings?calendar=cancelled")

    try:
        flow = make_flow()
        flow.fetch_token(code=code)
        creds = flow.credentials

        # Identificar empresa pelo email Google
        service = build('oauth2', 'v2', credentials=creds)
        user_info = service.userinfo().get().execute()
        email = user_info.get('email')

        user = User.query.filter_by(email=email).first()
        if not user:
            return redirect(f"{_frontend()}/settings?calendar=error")

        company = Company.query.get(user.company_id)
        if company and creds.refresh_token:
            company.google_refresh_token = creds.refresh_token
            db.session.commit()

        return redirect(f"{_frontend()}/settings?calendar=connected")

    except Exception as e:
        print(f"[Calendar Callback Error] {e}")
        return redirect(f"{_frontend()}/settings?calendar=error")


# ── 5. Status da conexão ─────────────────────────────────────────────────────
@google_auth_bp.route('/auth/google/calendar/status')
@jwt_required()
def calendar_status():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    company = Company.query.get(user.company_id)
    connected = bool(company and company.google_refresh_token)
    return jsonify({'connected': connected})


# ── 6. Desconectar Calendar ──────────────────────────────────────────────────
@google_auth_bp.route('/auth/google/calendar/disconnect', methods=['POST'])
@jwt_required()
def calendar_disconnect():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    company = Company.query.get(user.company_id)
    if company:
        company.google_refresh_token = None
        db.session.commit()
    return jsonify({'message': 'Desconectado com sucesso'})


# ── Helper ───────────────────────────────────────────────────────────────────
def _frontend():
    return os.environ.get(
        "FRONTEND_URL",
        "https://fuzzy-invention-x7v5975x9v7fvwj5-5000.app.github.dev"
    )