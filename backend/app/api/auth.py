from flask import request, jsonify
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from app import db
from app.api import api_bp
from app.models.user import User
from app.models.company import Company
from app.schemas.auth import RegisterSchema, LoginSchema

@api_bp.route('/auth/register', methods=['POST', 'OPTIONS'])
def register():
    """Registrar novo usuário"""
    
    # Responder ao preflight CORS
    if request.method == 'OPTIONS':
        return '', 200
    
    data = request.get_json()
    
    # Validar dados
    errors = RegisterSchema.validate(data)
    if errors:
        return jsonify({'errors': errors}), 400
    
    # Verificar se email já existe
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email já cadastrado'}), 409
    
    try:
        # Criar empresa se fornecida
        company = None
        if data.get('company_name'):
            slug = data['company_name'].lower().replace(' ', '-')
            
            counter = 1
            original_slug = slug
            while Company.query.filter_by(slug=slug).first():
                slug = f"{original_slug}-{counter}"
                counter += 1
            
            company = Company(
                name=data['company_name'],
                slug=slug,
                business_type=data.get('business_type', 'other')
            )
            db.session.add(company)
            db.session.flush()
        
        # Criar usuário
        user = User(
            email=data['email'],
            name=data['name'],
            company_id=company.id if company else None
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.commit()
        
        # Gerar tokens
        access_token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=str(user.id))
        
        return jsonify({
            'message': 'Usuário criado com sucesso',
            'user': user.to_dict(),
            'company': company.to_dict() if company else None,
            'access_token': access_token,
            'refresh_token': refresh_token
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Erro ao criar usuário: {str(e)}'}), 500

@api_bp.route('/auth/login', methods=['POST', 'OPTIONS'])
def login():
    """Login de usuário"""
    
    # ✅ Responder ao preflight CORS
    if request.method == 'OPTIONS':
        return '', 200
    
    data = request.get_json()
    
    # Validar dados
    errors = LoginSchema.validate(data)
    if errors:
        return jsonify({'errors': errors}), 400
    
    # Buscar usuário
    user = User.query.filter_by(email=data['email']).first()
    
    # Verificar se existe e senha está correta
    if not user or not user.check_password(data['password']):
        return jsonify({'error': 'Email ou senha incorretos'}), 401
    
    # Verificar se está ativo
    if not user.is_active:
        return jsonify({'error': 'Usuário inativo'}), 403
    
    # Gerar tokens
    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))
    
    # Buscar empresa
    company = Company.query.get(user.company_id) if user.company_id else None
    
    return jsonify({
        'message': 'Login realizado com sucesso',
        'user': user.to_dict(),
        'company': company.to_dict() if company else None,
        'access_token': access_token,
        'refresh_token': refresh_token
    }), 200

@api_bp.route('/auth/me', methods=['GET', 'OPTIONS'])
@jwt_required()
def get_current_user():
    """Obter dados do usuário logado"""
    
    if request.method == 'OPTIONS':
        return '', 200
    
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    
    if not user:
        return jsonify({'error': 'Usuário não encontrado'}), 404
    
    company = Company.query.get(user.company_id) if user.company_id else None
    
    return jsonify({
        'user': user.to_dict(),
        'company': company.to_dict() if company else None
    }), 200

@api_bp.route('/auth/refresh', methods=['POST', 'OPTIONS'])
@jwt_required(refresh=True)
def refresh():
    """Renovar access token"""
    
    if request.method == 'OPTIONS':
        return '', 200
    
    user_id = get_jwt_identity()
    access_token = create_access_token(identity=user_id)
    
    return jsonify({
        'access_token': access_token
    }), 200