from flask import Blueprint, redirect, request, jsonify, url_for
from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
import google.auth.transport.requests
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.company import Company
from app.models.user import User
from app import db
import os, json

google_auth_bp = Blueprint('google_auth', __name__)

SCOPES = [
    'openid',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/calendar',
]

def make_flow(state=None):
    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": os.environ.get("GOOGLE_CLIENT_ID"),
                "client_secret": os.environ.get("GOOGLE_CLIENT_SECRET"),
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [os.environ.get("GOOGLE_REDIRECT_URI")],
            }
        },
        scopes=SCOPES,
        state=state,
    )
    flow.redirect_uri = os.environ.get("GOOGLE_REDIRECT_URI")
    return flow


# ── 1. Iniciar login com Google ──────────────────────────────────────────────
@google_auth_bp.route('/auth/google')
def google_login():
    flow = make_flow()
    auth_url, state = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true',
        prompt='consent',
    )
    return jsonify({'url': auth_url})


# ── 2. Callback do Google (login) ────────────────────────────────────────────
@google_auth_bp.route('/auth/google/callback')
def google_callback():
    from flask_jwt_extended import create_access_token
    from app.models.company import Company
    from app.models.user import User

    code = request.args.get('code')
    if not code:
        return redirect(f"{_frontend()}/login?error=google_cancelled")

    try:
        flow = make_flow()
        flow.fetch_token(code=code)
        creds = flow.credentials

        # Buscar dados do usuário Google
        service = build('oauth2', 'v2', credentials=creds)
        user_info = service.userinfo().get().execute()

        email = user_info.get('email')
        name  = user_info.get('name', email)

        # Encontrar usuário no banco pelo email
        user = User.query.filter_by(email=email).first()
        if not user:
            return redirect(f"{_frontend()}/login?error=user_not_found")

        # Salvar refresh_token na empresa para uso futuro no Calendar
        if creds.refresh_token:
            company = Company.query.get(user.company_id)
            if company:
                company.google_refresh_token = creds.refresh_token
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
        "https://fuzzy-invention-x7v5975x9v7fvwj5-5173.app.github.dev"
    )