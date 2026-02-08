from flask import Blueprint

# Criar blueprint da API
api_bp = Blueprint('api', __name__)

# Importar rotas
from app.api import routes, auth, customers, appointments, products, config