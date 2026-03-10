from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.api import api_bp
from app.models.user import User
from app.models.company import Company
import bcrypt

def get_current_user():
    user_id = get_jwt_identity()
    return User.query.get(int(user_id))

# ── Listar funcionários da empresa ──
@api_bp.route('/employees', methods=['GET'])
@jwt_required()
def list_employees():
    user = get_current_user()
    if not user or user.role != 'owner':
        return jsonify({'error': 'Acesso restrito ao patrão'}), 403
    employees = User.query.filter_by(company_id=user.company_id).all()
    return jsonify([e.to_dict() for e in employees]), 200

# ── Criar funcionário ──
@api_bp.route('/employees', methods=['POST'])
@jwt_required()
def create_employee():
    user = get_current_user()
    if not user or user.role != 'owner':
        return jsonify({'error': 'Acesso restrito ao patrão'}), 403
    data = request.get_json()
    if not data.get('name') or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Nome, email e senha são obrigatórios'}), 400
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email já cadastrado'}), 400
    employee = User(
        name=data['name'],
        email=data['email'],
        company_id=user.company_id,
        role='employee',
        is_active=True,
        is_admin=False
    )
    employee.set_password(data['password'])
    db.session.add(employee)
    db.session.commit()
    return jsonify({'message': 'Funcionário criado com sucesso', 'employee': employee.to_dict()}), 201

# ── Atualizar funcionário ──
@api_bp.route('/employees/<int:employee_id>', methods=['PUT'])
@jwt_required()
def update_employee(employee_id):
    user = get_current_user()
    if not user or user.role != 'owner':
        return jsonify({'error': 'Acesso restrito ao patrão'}), 403
    employee = User.query.filter_by(id=employee_id, company_id=user.company_id).first()
    if not employee:
        return jsonify({'error': 'Funcionário não encontrado'}), 404
    data = request.get_json()
    if 'name' in data: employee.name = data['name']
    if 'email' in data: employee.email = data['email']
    if 'password' in data and data['password']: employee.set_password(data['password'])
    if 'is_active' in data: employee.is_active = data['is_active']
    db.session.commit()
    return jsonify({'message': 'Funcionário atualizado', 'employee': employee.to_dict()}), 200

# ── Deletar funcionário ──
@api_bp.route('/employees/<int:employee_id>', methods=['DELETE'])
@jwt_required()
def delete_employee(employee_id):
    user = get_current_user()
    if not user or user.role != 'owner':
        return jsonify({'error': 'Acesso restrito ao patrão'}), 403
    employee = User.query.filter_by(id=employee_id, company_id=user.company_id).first()
    if not employee:
        return jsonify({'error': 'Funcionário não encontrado'}), 404
    if employee.id == user.id:
        return jsonify({'error': 'Não é possível remover a si mesmo'}), 400
    db.session.delete(employee)
    db.session.commit()
    return jsonify({'message': 'Funcionário removido'}), 200

# ── Relatório de comissão ──
@api_bp.route('/employees/commission', methods=['GET'])
@jwt_required()
def commission_report():
    user = get_current_user()
    if not user or user.role != 'owner':
        return jsonify({'error': 'Acesso restrito ao patrão'}), 403
    from app.models.appointment import Appointment
    from sqlalchemy import func
    date_from = request.args.get('date_from')
    date_to = request.args.get('date_to')
    employees = User.query.filter_by(company_id=user.company_id).all()
    report = []
    for emp in employees:
        query = Appointment.query.filter_by(
            company_id=user.company_id,
            employee_id=emp.id,
            status='completed'
        )
        if date_from: query = query.filter(Appointment.appointment_date >= date_from)
        if date_to: query = query.filter(Appointment.appointment_date <= date_to)
        appointments = query.all()
        total = sum(a.service_price or 0 for a in appointments)
        report.append({
            'employee': emp.to_dict(),
            'appointments_count': len(appointments),
            'total_revenue': total,
        })
    return jsonify(report), 200