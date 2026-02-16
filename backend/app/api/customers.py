from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.api import api_bp
from app.models.customer import Customer
from app.models.user import User
from app.schemas.customer import CustomerSchema

def get_user_company_id():
    """Obter company_id do usuário logado"""
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))  
    
    if not user or not user.company_id:
        return None
    return user.company_id

@api_bp.route('/customers', methods=['GET'])
@jwt_required()
def get_customers():
    """Listar clientes da empresa (apenas ativos)"""
    company_id = get_user_company_id()
    if not company_id:
        return jsonify({'error': 'Usuário sem empresa associada'}), 403
    
    # Parâmetros de busca
    search = request.args.get('search', '')
    
    # Query base - APENAS CLIENTES ATIVOS
    query = Customer.query.filter_by(company_id=company_id, is_active=True)
    
    # Busca por nome, email ou telefone
    if search:
        query = query.filter(
            db.or_(
                Customer.name.ilike(f'%{search}%'),
                Customer.email.ilike(f'%{search}%'),
                Customer.phone.ilike(f'%{search}%')
            )
        )
    
    customers = query.order_by(Customer.created_at.desc()).all()
    
    return jsonify({
        'customers': [customer.to_dict() for customer in customers]
    }), 200

@api_bp.route('/customers', methods=['POST'])
@jwt_required()
def create_customer():
    """Criar novo cliente"""
    company_id = get_user_company_id()
    if not company_id:
        return jsonify({'error': 'Usuário sem empresa associada'}), 403
    
    data = request.get_json()
    
    # Validar dados
    errors = CustomerSchema.validate(data)
    if errors:
        return jsonify({'errors': errors}), 400
    
    try:
        customer = Customer(
            name=data['name'],
            email=data.get('email'),
            phone=data['phone'],
            cpf=data.get('cpf'),
            address=data.get('address'),
            notes=data.get('notes'),
            company_id=company_id
        )
        
        db.session.add(customer)
        db.session.commit()
        
        return jsonify({
            'message': 'Cliente criado com sucesso',
            'customer': customer.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Erro ao criar cliente: {str(e)}'}), 500

@api_bp.route('/customers/<int:customer_id>', methods=['GET'])
@jwt_required()
def get_customer(customer_id):
    """Obter detalhes de um cliente"""
    company_id = get_user_company_id()
    if not company_id:
        return jsonify({'error': 'Usuário sem empresa associada'}), 403
    
    customer = Customer.query.filter_by(
        id=customer_id,
        company_id=company_id,
        is_active=True
    ).first()
    
    if not customer:
        return jsonify({'error': 'Cliente não encontrado'}), 404
    
    return jsonify({
        'customer': customer.to_dict()
    }), 200

@api_bp.route('/customers/<int:customer_id>', methods=['PUT'])
@jwt_required()
def update_customer(customer_id):
    """Atualizar cliente"""
    company_id = get_user_company_id()
    if not company_id:
        return jsonify({'error': 'Usuário sem empresa associada'}), 403
    
    customer = Customer.query.filter_by(
        id=customer_id,
        company_id=company_id
    ).first()
    
    if not customer:
        return jsonify({'error': 'Cliente não encontrado'}), 404
    
    data = request.get_json()
    
    # Validar dados
    errors = CustomerSchema.validate(data, is_update=True)
    if errors:
        return jsonify({'errors': errors}), 400
    
    try:
        # Atualizar campos
        if 'name' in data:
            customer.name = data['name']
        if 'email' in data:
            customer.email = data['email']
        if 'phone' in data:
            customer.phone = data['phone']
        if 'cpf' in data:
            customer.cpf = data['cpf']
        if 'address' in data:
            customer.address = data['address']
        if 'notes' in data:
            customer.notes = data['notes']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Cliente atualizado com sucesso',
            'customer': customer.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Erro ao atualizar cliente: {str(e)}'}), 500

@api_bp.route('/customers/<int:customer_id>', methods=['DELETE'])
@jwt_required()
def delete_customer(customer_id):
    """Deletar cliente (soft delete)"""
    company_id = get_user_company_id()
    if not company_id:
        return jsonify({'error': 'Usuário sem empresa associada'}), 403
    
    customer = Customer.query.filter_by(
        id=customer_id, 
        company_id=company_id
    ).first()
    
    if not customer:
        return jsonify({'error': 'Cliente não encontrado'}), 404
    
    try:
        # Soft delete - marca como inativo
        customer.is_active = False
        db.session.commit()
        
        return jsonify({
            'message': 'Cliente desativado com sucesso'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Erro ao desativar cliente: {str(e)}'}), 500