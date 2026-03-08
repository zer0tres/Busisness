from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt_identity
from app.models.user import User
from app.models.company import Company

def subscription_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        user_id = get_jwt_identity()
        user = User.query.get(int(user_id))
        if not user or not user.company_id:
            return jsonify({'error': 'Empresa não encontrada'}), 404
        company = Company.query.get(user.company_id)
        if not company or not company.can_access():
            return jsonify({'error': 'subscription_expired', 'message': 'Periodo de teste encerrado. Assine um plano para continuar.'}), 403
        return f(*args, **kwargs)
    return decorated
