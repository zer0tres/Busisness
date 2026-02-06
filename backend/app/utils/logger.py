import logging
import os
from logging.handlers import RotatingFileHandler

def setup_logger(app):
    """Configurar sistema de logs"""
    
    # Criar pasta de logs se não existir
    if not os.path.exists('logs'):
        os.mkdir('logs')
    
    # Configurar handler de arquivo
    file_handler = RotatingFileHandler(
        'logs/business_suite.log',
        maxBytes=10240000,  # 10MB
        backupCount=10
    )
    
    file_handler.setFormatter(logging.Formatter(
        '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
    ))
    
    file_handler.setLevel(logging.INFO)
    app.logger.addHandler(file_handler)
    app.logger.setLevel(logging.INFO)
    app.logger.info('Business Suite startup')