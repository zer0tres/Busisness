from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, date
from app import db
from app.api import api_bp
from app.models.financial import (
    FinancialCategory, 
    Transaction, 
    AccountPayable, 
    AccountReceivable, 
    Invoice
)
from app.models.user import User

def get_user_company_id():
    """Obter company_id do usuário logado"""
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user or not user.company_id:
        return None
    return user.company_id


# ==================== CATEGORIAS FINANCEIRAS ====================

@api_bp.route('/financial/categories', methods=['GET'])
@jwt_required()
def get_financial_categories():
    """Listar categorias financeiras"""
    company_id = get_user_company_id()
    if not company_id:
        return jsonify({'error': 'Usuário sem empresa associada'}), 403
    
    categories = FinancialCategory.query.filter_by(
        company_id=company_id, 
        is_active=True
    ).all()
    
    return jsonify({
        'categories': [cat.to_dict() for cat in categories]
    }), 200


@api_bp.route('/financial/categories', methods=['POST'])
@jwt_required()
def create_financial_category():
    """Criar categoria financeira"""
    company_id = get_user_company_id()
    if not company_id:
        return jsonify({'error': 'Usuário sem empresa associada'}), 403
    
    data = request.get_json()
    
    try:
        category = FinancialCategory(
            company_id=company_id,
            name=data['name'],
            type=data['type'],
            color=data.get('color'),
            icon=data.get('icon')
        )
        
        db.session.add(category)
        db.session.commit()
        
        return jsonify({
            'message': 'Categoria criada com sucesso',
            'category': category.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@api_bp.route('/financial/categories/<int:category_id>', methods=['DELETE'])
@jwt_required()
def delete_financial_category(category_id):
    """Deletar categoria (soft delete)"""
    company_id = get_user_company_id()
    
    category = FinancialCategory.query.filter_by(
        id=category_id, 
        company_id=company_id
    ).first()
    
    if not category:
        return jsonify({'error': 'Categoria não encontrada'}), 404
    
    try:
        category.is_active = False
        db.session.commit()
        return jsonify({'message': 'Categoria desativada com sucesso'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ==================== TRANSAÇÕES (CAIXA) ====================

@api_bp.route('/financial/transactions', methods=['GET'])
@jwt_required()
def get_transactions():
    """Listar transações"""
    company_id = get_user_company_id()
    if not company_id:
        return jsonify({'error': 'Usuário sem empresa associada'}), 403
    
    # Filtros
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    type_filter = request.args.get('type')  # income, expense
    status_filter = request.args.get('status')
    
    query = Transaction.query.filter_by(company_id=company_id)
    
    if start_date:
        query = query.filter(Transaction.transaction_date >= start_date)
    if end_date:
        query = query.filter(Transaction.transaction_date <= end_date)
    if type_filter:
        query = query.filter(Transaction.type == type_filter)
    if status_filter:
        query = query.filter(Transaction.status == status_filter)
    
    transactions = query.order_by(Transaction.transaction_date.desc()).all()
    
    return jsonify({
        'transactions': [t.to_dict() for t in transactions]
    }), 200


@api_bp.route('/financial/transactions', methods=['POST'])
@jwt_required()
def create_transaction():
    """Criar transação"""
    company_id = get_user_company_id()
    if not company_id:
        return jsonify({'error': 'Usuário sem empresa associada'}), 403
    
    data = request.get_json()
    
    try:
        transaction = Transaction(
            company_id=company_id,
            category_id=data.get('category_id'),
            customer_id=data.get('customer_id'),
            appointment_id=data.get('appointment_id'),
            type=data['type'],
            amount=data['amount'],
            description=data.get('description'),
            payment_method=data.get('payment_method'),
            transaction_date=datetime.strptime(data['transaction_date'], '%Y-%m-%d').date(),
            status=data.get('status', 'completed'),
            notes=data.get('notes')
        )
        
        db.session.add(transaction)
        db.session.commit()
        
        return jsonify({
            'message': 'Transação criada com sucesso',
            'transaction': transaction.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@api_bp.route('/financial/transactions/<int:transaction_id>', methods=['PUT'])
@jwt_required()
def update_transaction(transaction_id):
    """Atualizar transação"""
    company_id = get_user_company_id()
    
    transaction = Transaction.query.filter_by(
        id=transaction_id, 
        company_id=company_id
    ).first()
    
    if not transaction:
        return jsonify({'error': 'Transação não encontrada'}), 404
    
    data = request.get_json()
    
    try:
        if 'category_id' in data:
            transaction.category_id = data['category_id']
        if 'amount' in data:
            transaction.amount = data['amount']
        if 'description' in data:
            transaction.description = data['description']
        if 'payment_method' in data:
            transaction.payment_method = data['payment_method']
        if 'status' in data:
            transaction.status = data['status']
        if 'notes' in data:
            transaction.notes = data['notes']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Transação atualizada com sucesso',
            'transaction': transaction.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@api_bp.route('/financial/transactions/<int:transaction_id>', methods=['DELETE'])
@jwt_required()
def delete_transaction(transaction_id):
    """Deletar transação"""
    company_id = get_user_company_id()
    
    transaction = Transaction.query.filter_by(
        id=transaction_id, 
        company_id=company_id
    ).first()
    
    if not transaction:
        return jsonify({'error': 'Transação não encontrada'}), 404
    
    try:
        db.session.delete(transaction)
        db.session.commit()
        return jsonify({'message': 'Transação deletada com sucesso'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ==================== CONTAS A PAGAR ====================

@api_bp.route('/financial/payables', methods=['GET'])
@jwt_required()
def get_payables():
    """Listar contas a pagar"""
    company_id = get_user_company_id()
    if not company_id:
        return jsonify({'error': 'Usuário sem empresa associada'}), 403
    
    status_filter = request.args.get('status')
    
    query = AccountPayable.query.filter_by(company_id=company_id)
    
    if status_filter:
        query = query.filter(AccountPayable.status == status_filter)
    
    # Atualizar status vencidos
    today = date.today()
    overdue = query.filter(
        AccountPayable.due_date < today,
        AccountPayable.status == 'pending'
    ).all()
    
    for account in overdue:
        account.status = 'overdue'
    
    db.session.commit()
    
    payables = query.order_by(AccountPayable.due_date.asc()).all()
    
    return jsonify({
        'payables': [p.to_dict() for p in payables]
    }), 200


@api_bp.route('/financial/payables', methods=['POST'])
@jwt_required()
def create_payable():
    """Criar conta a pagar"""
    company_id = get_user_company_id()
    if not company_id:
        return jsonify({'error': 'Usuário sem empresa associada'}), 403
    
    data = request.get_json()
    
    try:
        payable = AccountPayable(
            company_id=company_id,
            category_id=data.get('category_id'),
            supplier_name=data['supplier_name'],
            description=data['description'],
            amount=data['amount'],
            due_date=datetime.strptime(data['due_date'], '%Y-%m-%d').date(),
            payment_method=data.get('payment_method'),
            notes=data.get('notes'),
            recurrence=data.get('recurrence', 'once')
        )
        
        db.session.add(payable)
        db.session.commit()
        
        return jsonify({
            'message': 'Conta a pagar criada com sucesso',
            'payable': payable.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@api_bp.route('/financial/payables/<int:payable_id>/pay', methods=['POST'])
@jwt_required()
def pay_payable(payable_id):
    """Marcar conta como paga"""
    company_id = get_user_company_id()
    
    payable = AccountPayable.query.filter_by(
        id=payable_id, 
        company_id=company_id
    ).first()
    
    if not payable:
        return jsonify({'error': 'Conta não encontrada'}), 404
    
    data = request.get_json()
    
    try:
        payable.status = 'paid'
        payable.payment_date = datetime.strptime(
            data.get('payment_date', datetime.now().strftime('%Y-%m-%d')), 
            '%Y-%m-%d'
        ).date()
        payable.payment_method = data.get('payment_method')
        
        db.session.commit()
        
        return jsonify({
            'message': 'Conta marcada como paga',
            'payable': payable.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@api_bp.route('/financial/payables/<int:payable_id>', methods=['DELETE'])
@jwt_required()
def delete_payable(payable_id):
    """Deletar conta a pagar"""
    company_id = get_user_company_id()
    
    payable = AccountPayable.query.filter_by(
        id=payable_id, 
        company_id=company_id
    ).first()
    
    if not payable:
        return jsonify({'error': 'Conta não encontrada'}), 404
    
    try:
        db.session.delete(payable)
        db.session.commit()
        return jsonify({'message': 'Conta deletada com sucesso'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ==================== CONTAS A RECEBER ====================

@api_bp.route('/financial/receivables', methods=['GET'])
@jwt_required()
def get_receivables():
    """Listar contas a receber"""
    company_id = get_user_company_id()
    if not company_id:
        return jsonify({'error': 'Usuário sem empresa associada'}), 403
    
    status_filter = request.args.get('status')
    
    query = AccountReceivable.query.filter_by(company_id=company_id)
    
    if status_filter:
        query = query.filter(AccountReceivable.status == status_filter)
    
    # Atualizar status vencidos
    today = date.today()
    overdue = query.filter(
        AccountReceivable.due_date < today,
        AccountReceivable.status == 'pending'
    ).all()
    
    for account in overdue:
        account.status = 'overdue'
    
    db.session.commit()
    
    receivables = query.order_by(AccountReceivable.due_date.asc()).all()
    
    return jsonify({
        'receivables': [r.to_dict() for r in receivables]
    }), 200


@api_bp.route('/financial/receivables', methods=['POST'])
@jwt_required()
def create_receivable():
    """Criar conta a receber"""
    company_id = get_user_company_id()
    if not company_id:
        return jsonify({'error': 'Usuário sem empresa associada'}), 403
    
    data = request.get_json()
    
    try:
        receivable = AccountReceivable(
            company_id=company_id,
            customer_id=data.get('customer_id'),
            category_id=data.get('category_id'),
            description=data['description'],
            amount=data['amount'],
            due_date=datetime.strptime(data['due_date'], '%Y-%m-%d').date(),
            payment_method=data.get('payment_method'),
            notes=data.get('notes'),
            recurrence=data.get('recurrence', 'once')
        )
        
        db.session.add(receivable)
        db.session.commit()
        
        return jsonify({
            'message': 'Conta a receber criada com sucesso',
            'receivable': receivable.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@api_bp.route('/financial/receivables/<int:receivable_id>/receive', methods=['POST'])
@jwt_required()
def receive_receivable(receivable_id):
    """Marcar conta como recebida"""
    company_id = get_user_company_id()
    
    receivable = AccountReceivable.query.filter_by(
        id=receivable_id, 
        company_id=company_id
    ).first()
    
    if not receivable:
        return jsonify({'error': 'Conta não encontrada'}), 404
    
    data = request.get_json()
    
    try:
        receivable.status = 'received'
        receivable.payment_date = datetime.strptime(
            data.get('payment_date', datetime.now().strftime('%Y-%m-%d')), 
            '%Y-%m-%d'
        ).date()
        receivable.payment_method = data.get('payment_method')
        
        db.session.commit()
        
        return jsonify({
            'message': 'Conta marcada como recebida',
            'receivable': receivable.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@api_bp.route('/financial/receivables/<int:receivable_id>', methods=['DELETE'])
@jwt_required()
def delete_receivable(receivable_id):
    """Deletar conta a receber"""
    company_id = get_user_company_id()
    
    receivable = AccountReceivable.query.filter_by(
        id=receivable_id, 
        company_id=company_id
    ).first()
    
    if not receivable:
        return jsonify({'error': 'Conta não encontrada'}), 404
    
    try:
        db.session.delete(receivable)
        db.session.commit()
        return jsonify({'message': 'Conta deletada com sucesso'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ==================== NOTAS FISCAIS ====================

@api_bp.route('/financial/invoices', methods=['GET'])
@jwt_required()
def get_invoices():
    """Listar notas fiscais"""
    company_id = get_user_company_id()
    if not company_id:
        return jsonify({'error': 'Usuário sem empresa associada'}), 403
    
    type_filter = request.args.get('type')
    status_filter = request.args.get('status')
    
    query = Invoice.query.filter_by(company_id=company_id)
    
    if type_filter:
        query = query.filter(Invoice.invoice_type == type_filter)
    if status_filter:
        query = query.filter(Invoice.status == status_filter)
    
    invoices = query.order_by(Invoice.issue_date.desc()).all()
    
    return jsonify({
        'invoices': [inv.to_dict() for inv in invoices]
    }), 200


@api_bp.route('/financial/invoices', methods=['POST'])
@jwt_required()
def create_invoice():
    """Criar nota fiscal"""
    company_id = get_user_company_id()
    if not company_id:
        return jsonify({'error': 'Usuário sem empresa associada'}), 403
    
    data = request.get_json()
    
    try:
        invoice = Invoice(
            company_id=company_id,
            customer_id=data.get('customer_id'),
            transaction_id=data.get('transaction_id'),
            invoice_number=data['invoice_number'],
            invoice_type=data['invoice_type'],
            status=data.get('status', 'pending'),
            issue_date=datetime.strptime(data['issue_date'], '%Y-%m-%d').date(),
            amount=data['amount'],
            tax_amount=data.get('tax_amount'),
            description=data.get('description'),
            access_key=data.get('access_key'),
            notes=data.get('notes')
        )
        
        db.session.add(invoice)
        db.session.commit()
        
        return jsonify({
            'message': 'Nota fiscal criada com sucesso',
            'invoice': invoice.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@api_bp.route('/financial/invoices/<int:invoice_id>', methods=['PUT'])
@jwt_required()
def update_invoice(invoice_id):
    """Atualizar nota fiscal"""
    company_id = get_user_company_id()
    
    invoice = Invoice.query.filter_by(
        id=invoice_id, 
        company_id=company_id
    ).first()
    
    if not invoice:
        return jsonify({'error': 'Nota fiscal não encontrada'}), 404
    
    data = request.get_json()
    
    try:
        if 'status' in data:
            invoice.status = data['status']
        if 'access_key' in data:
            invoice.access_key = data['access_key']
        if 'validation_date' in data:
            invoice.validation_date = datetime.strptime(data['validation_date'], '%Y-%m-%d').date()
        if 'notes' in data:
            invoice.notes = data['notes']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Nota fiscal atualizada com sucesso',
            'invoice': invoice.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@api_bp.route('/financial/invoices/<int:invoice_id>', methods=['DELETE'])
@jwt_required()
def delete_invoice(invoice_id):
    """Deletar nota fiscal"""
    company_id = get_user_company_id()
    
    invoice = Invoice.query.filter_by(
        id=invoice_id, 
        company_id=company_id
    ).first()
    
    if not invoice:
        return jsonify({'error': 'Nota fiscal não encontrada'}), 404
    
    try:
        db.session.delete(invoice)
        db.session.commit()
        return jsonify({'message': 'Nota fiscal deletada com sucesso'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ==================== RELATÓRIOS ====================

@api_bp.route('/financial/reports/summary', methods=['GET'])
@jwt_required()
def financial_summary():
    """Resumo financeiro"""
    company_id = get_user_company_id()
    if not company_id:
        return jsonify({'error': 'Usuário sem empresa associada'}), 403
    
    # Período
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    query = Transaction.query.filter_by(company_id=company_id)
    
    if start_date:
        query = query.filter(Transaction.transaction_date >= start_date)
    if end_date:
        query = query.filter(Transaction.transaction_date <= end_date)
    
    transactions = query.all()
    
    income = sum(float(t.amount) for t in transactions if t.type == 'income')
    expenses = sum(float(t.amount) for t in transactions if t.type == 'expense')
    balance = income - expenses
    
    # Contas a pagar pendentes
    payables_pending = AccountPayable.query.filter_by(
        company_id=company_id, 
        status='pending'
    ).all()
    
    total_payables = sum(float(p.amount) for p in payables_pending)
    
    # Contas a receber pendentes
    receivables_pending = AccountReceivable.query.filter_by(
        company_id=company_id, 
        status='pending'
    ).all()
    
    total_receivables = sum(float(r.amount) for r in receivables_pending)
    
    return jsonify({
        'income': income,
        'expenses': expenses,
        'balance': balance,
        'payables_pending': total_payables,
        'receivables_pending': total_receivables,
        'projected_balance': balance - total_payables + total_receivables
    }), 200