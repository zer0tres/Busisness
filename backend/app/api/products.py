from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.api import api_bp
from app.models.product import Product
from app.models.stock_movement import StockMovement
from app.models.user import User
from app.schemas.product import ProductSchema, StockMovementSchema

def get_user_company_id():
    """Obter company_id do usuário logado"""
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user or not user.company_id:
        return None
    return user.company_id

@api_bp.route('/products', methods=['GET'])
@jwt_required()
def list_products():
    """Listar produtos da empresa"""
    company_id = get_user_company_id()
    if not company_id:
        return jsonify({'error': 'Usuário sem empresa associada'}), 403
    
    # Parâmetros de query
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    search = request.args.get('search', '')
    category = request.args.get('category')
    low_stock = request.args.get('low_stock', type=bool)
    
    # Query base
    query = Product.query.filter_by(company_id=company_id, is_active=True)
    
    # Filtros
    if search:
        query = query.filter(
            db.or_(
                Product.name.ilike(f'%{search}%'),
                Product.sku.ilike(f'%{search}%'),
                Product.barcode.ilike(f'%{search}%')
            )
        )
    
    if category:
        query = query.filter(Product.category == category)
    
    if low_stock:
        query = query.filter(Product.quantity <= Product.min_quantity)
    
    # Paginação
    pagination = query.order_by(Product.name).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    return jsonify({
        'products': [p.to_dict() for p in pagination.items],
        'total': pagination.total,
        'page': page,
        'per_page': per_page,
        'pages': pagination.pages
    }), 200

@api_bp.route('/products/low-stock', methods=['GET'])
@jwt_required()
def low_stock_products():
    """Listar produtos com estoque baixo"""
    company_id = get_user_company_id()
    if not company_id:
        return jsonify({'error': 'Usuário sem empresa associada'}), 403
    
    products = Product.query.filter_by(
        company_id=company_id,
        is_active=True
    ).filter(
        Product.quantity <= Product.min_quantity
    ).order_by(Product.quantity).all()
    
    return jsonify({
        'products': [p.to_dict() for p in products],
        'total': len(products)
    }), 200

@api_bp.route('/products', methods=['POST'])
@jwt_required()
def create_product():
    """Criar novo produto"""
    company_id = get_user_company_id()
    if not company_id:
        return jsonify({'error': 'Usuário sem empresa associada'}), 403
    
    data = request.get_json()
    
    # Validar dados
    errors = ProductSchema.validate(data)
    if errors:
        return jsonify({'errors': errors}), 400
    
    try:
        product = Product(
            name=data['name'],
            description=data.get('description'),
            quantity=data.get('quantity', 0),
            min_quantity=data.get('min_quantity', 5),
            unit=data.get('unit', 'un'),
            cost_price=data.get('cost_price'),
            sale_price=data.get('sale_price'),
            category=data.get('category'),
            sku=data.get('sku'),
            barcode=data.get('barcode'),
            company_id=company_id
        )
        
        db.session.add(product)
        db.session.commit()
        
        return jsonify({
            'message': 'Produto criado com sucesso',
            'product': product.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Erro ao criar produto: {str(e)}'}), 500

@api_bp.route('/products/<int:product_id>', methods=['GET'])
@jwt_required()
def get_product(product_id):
    """Obter detalhes de um produto"""
    company_id = get_user_company_id()
    if not company_id:
        return jsonify({'error': 'Usuário sem empresa associada'}), 403
    
    product = Product.query.filter_by(
        id=product_id,
        company_id=company_id
    ).first()
    
    if not product:
        return jsonify({'error': 'Produto não encontrado'}), 404
    
    return jsonify(product.to_dict()), 200

@api_bp.route('/products/<int:product_id>', methods=['PUT'])
@jwt_required()
def update_product(product_id):
    """Atualizar produto"""
    company_id = get_user_company_id()
    if not company_id:
        return jsonify({'error': 'Usuário sem empresa associada'}), 403
    
    product = Product.query.filter_by(
        id=product_id,
        company_id=company_id
    ).first()
    
    if not product:
        return jsonify({'error': 'Produto não encontrado'}), 404
    
    data = request.get_json()
    
    # Validar dados
    errors = ProductSchema.validate(data, is_update=True)
    if errors:
        return jsonify({'errors': errors}), 400
    
    try:
        # Atualizar campos
        if 'name' in data:
            product.name = data['name']
        if 'description' in data:
            product.description = data['description']
        if 'min_quantity' in data:
            product.min_quantity = data['min_quantity']
        if 'unit' in data:
            product.unit = data['unit']
        if 'cost_price' in data:
            product.cost_price = data['cost_price']
        if 'sale_price' in data:
            product.sale_price = data['sale_price']
        if 'category' in data:
            product.category = data['category']
        if 'sku' in data:
            product.sku = data['sku']
        if 'barcode' in data:
            product.barcode = data['barcode']
        if 'is_active' in data:
            product.is_active = data['is_active']
        
        # NÃO permitir alterar quantidade diretamente
        # Use movimentações para isso
        
        db.session.commit()
        
        return jsonify({
            'message': 'Produto atualizado com sucesso',
            'product': product.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Erro ao atualizar produto: {str(e)}'}), 500

@api_bp.route('/products/<int:product_id>', methods=['DELETE'])
@jwt_required()
def delete_product(product_id):
    """Deletar produto (soft delete)"""
    company_id = get_user_company_id()
    if not company_id:
        return jsonify({'error': 'Usuário sem empresa associada'}), 403
    
    product = Product.query.filter_by(
        id=product_id,
        company_id=company_id
    ).first()
    
    if not product:
        return jsonify({'error': 'Produto não encontrado'}), 404
    
    try:
        # Soft delete - apenas marcar como inativo
        product.is_active = False
        db.session.commit()
        
        return jsonify({'message': 'Produto deletado com sucesso'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Erro ao deletar produto: {str(e)}'}), 500

# MOVIMENTAÇÕES DE ESTOQUE

@api_bp.route('/stock-movements', methods=['POST'])
@jwt_required()
def create_stock_movement():
    """Criar movimentação de estoque (entrada/saída)"""
    company_id = get_user_company_id()
    user_id = int(get_jwt_identity())
    
    if not company_id:
        return jsonify({'error': 'Usuário sem empresa associada'}), 403
    
    data = request.get_json()
    
    # Validar dados
    errors = StockMovementSchema.validate(data)
    if errors:
        return jsonify({'errors': errors}), 400
    
    # Verificar se produto existe
    product = Product.query.filter_by(
        id=data['product_id'],
        company_id=company_id
    ).first()
    
    if not product:
        return jsonify({'error': 'Produto não encontrado'}), 404
    
    try:
        quantity = int(data['quantity'])
        movement_type = data['movement_type']
        
        # Verificar estoque suficiente para saída
        if movement_type == 'saida' and product.quantity < quantity:
            return jsonify({
                'error': 'Estoque insuficiente',
                'available': product.quantity,
                'requested': quantity
            }), 400
        
        # Criar movimentação
        movement = StockMovement(
            product_id=product.id,
            company_id=company_id,
            user_id=user_id,
            movement_type=movement_type,
            quantity=quantity,
            unit_price=data.get('unit_price'),
            reason=data['reason'],
            notes=data.get('notes')
        )
        
        # Atualizar quantidade do produto
        if movement_type == 'entrada':
            product.quantity += quantity
        else:  # saida
            product.quantity -= quantity
        
        db.session.add(movement)
        db.session.commit()
        
        return jsonify({
            'message': 'Movimentação registrada com sucesso',
            'movement': movement.to_dict(include_product=True, include_user=True),
            'product': product.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Erro ao registrar movimentação: {str(e)}'}), 500

@api_bp.route('/products/<int:product_id>/movements', methods=['GET'])
@jwt_required()
def product_movements(product_id):
    """Listar movimentações de um produto"""
    company_id = get_user_company_id()
    if not company_id:
        return jsonify({'error': 'Usuário sem empresa associada'}), 403
    
    # Verificar se produto existe
    product = Product.query.filter_by(
        id=product_id,
        company_id=company_id
    ).first()
    
    if not product:
        return jsonify({'error': 'Produto não encontrado'}), 404
    
    # Parâmetros
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    # Buscar movimentações
    pagination = StockMovement.query.filter_by(
        product_id=product_id,
        company_id=company_id
    ).order_by(StockMovement.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    return jsonify({
        'product': product.to_dict(),
        'movements': [m.to_dict(include_user=True) for m in pagination.items],
        'total': pagination.total,
        'page': page,
        'per_page': per_page,
        'pages': pagination.pages
    }), 200