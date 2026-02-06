from flask import Flask
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
    
    # Inicializar extensões com a app
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    CORS(app)

    # ✨ NOVO: Configurar logging
    if config_name != 'testing':
        from app.utils.logger import setup_logger
        setup_logger(app)
    
    # Registrar blueprints (rotas)
    from app.api import api_bp
    app.register_blueprint(api_bp, url_prefix='/api')
    
    # Rota de health check
    @app.route('/health')
    def health():
        return {'status': 'ok', 'message': 'Business Suite API is running'}, 200
    
    # ✨ NOVO: Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return {'error': 'Recurso não encontrado'}, 404
    
    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return {'error': 'Erro interno do servidor'}, 500
    
    @jwt.unauthorized_loader
    def unauthorized_callback(error):
        return {'error': 'Token de autenticação não fornecido'}, 401
    
    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return {'error': 'Token inválido'}, 401
    
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return {'error': 'Token expirado'}, 401
    
    return app