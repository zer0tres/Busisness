from flask import Flask, request, make_response, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from config import config

# Inicializar extensões
db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()

def create_app(config_name='default'):
    """Factory para criar a aplicação Flask"""
    
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024
    
    # Inicializar extensões
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    
    # ✅ CORS - Configuração máxima permissiva
    CORS(app, 
         resources={r"/*": {
             "origins": "*",
             "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
             "allow_headers": ["Content-Type", "Authorization"],
             "expose_headers": ["Content-Type", "Authorization"],
             "supports_credentials": True
         }})
    
    # Configurar logging
    if config_name != 'testing':
        try:
            from app.utils.logger import setup_logger
            setup_logger(app)
        except:
            pass
    
    # ✅ INTERCEPTAR TODAS AS REQUISIÇÕES OPTIONS ANTES DE PROCESSAR
    @app.before_request
    def handle_preflight():
        if request.method == "OPTIONS":
            response = make_response('', 200)
            response.headers['Access-Control-Allow-Origin'] = '*'
            response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
            response.headers['Access-Control-Max-Age'] = '3600'
            return response
    
    # Registrar blueprints
    from app.api import api_bp
    app.register_blueprint(api_bp, url_prefix='/api')

    from app.api.google_auth import google_auth_bp
    app.register_blueprint(google_auth_bp, url_prefix='/api')
    
    # Rota de health check
    @app.route('/health')
    def health():
        return {'status': 'ok', 'message': 'Business API is running'}, 200
    
    # ✅ ADICIONAR HEADERS CORS EM TODAS AS RESPOSTAS
    @app.after_request
    def after_request(response):
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        return response
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Recurso não encontrado'}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return jsonify({'error': 'Erro interno do servidor'}), 500
    
    @jwt.unauthorized_loader
    def unauthorized_callback(error):
        return jsonify({'error': 'Token de autenticação não fornecido'}), 401
    
    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({'error': 'Token inválido'}), 401
    
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({'error': 'Token expirado'}), 401
    
    return app
# Importar ao final para evitar circular imports
def register_frontend(app):
    import os
    from flask import send_from_directory, send_file
    
    frontend_dist = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend_dist')
    frontend_dist = os.path.abspath(frontend_dist)
    
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_frontend(path):
        if path.startswith('api/'):
            return jsonify({'error': 'Recurso não encontrado'}), 404
        full_path = os.path.join(frontend_dist, path)
        if path and os.path.exists(full_path):
            return send_from_directory(frontend_dist, path)
        return send_file(os.path.join(frontend_dist, 'index.html'))
