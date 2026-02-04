from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta, time
from app import db
from app.api import api_bp
from app.models.appointment import Appointment
from app.models.customer import Customer
from app.models.user import User
from app.schemas.appointment import AppointmentSchema

def get_user_company_id():
    """Obter company_id do usuário logado"""
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user or not user.company_id:
        return None
    return user.company_id

@api_bp.route('/appointments', methods=['GET'])
@jwt_required()
def list_appointments():
    """Listar agendamentos da empresa"""
    company_id = get_user_company_id()
    if not company_id:
        return jsonify({'error': 'Usuário sem empresa associada'}), 403
    
    # Parâmetros de query
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    date_filter = request.args.get('date')  # YYYY-MM-DD
    status_filter = request.args.get('status')
    customer_id = request.args.get('customer_id', type=int)
    
    # Query base
    query = Appointment.query.filter_by(company_id=company_id)
    
    # Filtros
    if date_filter:
        try:
            date_obj = datetime.fromisoformat(date_filter).date()
            query = query.filter(Appointment.appointment_date == date_obj)
        except ValueError:
            return jsonify({'error': 'Data inválida. Use formato YYYY-MM-DD'}), 400
    
    if status_filter:
        query = query.filter(Appointment.status == status_filter)
    
    if customer_id:
        query = query.filter(Appointment.customer_id == customer_id)
    
    # Ordenar por data e hora
    query = query.order_by(
        Appointment.appointment_date.desc(),
        Appointment.appointment_time.desc()
    )
    
    # Paginação
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'appointments': [a.to_dict(include_customer=True) for a in pagination.items],
        'total': pagination.total,
        'page': page,
        'per_page': per_page,
        'pages': pagination.pages
    }), 200

@api_bp.route('/appointments/today', methods=['GET'])
@jwt_required()
def appointments_today():
    """Listar agendamentos de hoje"""
    company_id = get_user_company_id()
    if not company_id:
        return jsonify({'error': 'Usuário sem empresa associada'}), 403
    
    today = datetime.now().date()
    
    appointments = Appointment.query.filter_by(
        company_id=company_id,
        appointment_date=today
    ).order_by(Appointment.appointment_time).all()
    
    return jsonify({
        'date': today.isoformat(),
        'appointments': [a.to_dict(include_customer=True) for a in appointments],
        'total': len(appointments)
    }), 200

@api_bp.route('/appointments/availability', methods=['GET'])
@jwt_required()
def check_availability():
    """Verificar horários disponíveis em uma data"""
    company_id = get_user_company_id()
    if not company_id:
        return jsonify({'error': 'Usuário sem empresa associada'}), 403
    
    date_str = request.args.get('date')
    if not date_str:
        return jsonify({'error': 'Parâmetro "date" é obrigatório'}), 400
    
    try:
        check_date = datetime.fromisoformat(date_str).date()
    except ValueError:
        return jsonify({'error': 'Data inválida. Use formato YYYY-MM-DD'}), 400
    
    # Buscar agendamentos do dia
    appointments = Appointment.query.filter_by(
        company_id=company_id,
        appointment_date=check_date
    ).filter(
        Appointment.status.in_(['pending', 'confirmed', 'in_progress'])
    ).all()
    
    # Horários ocupados
    busy_slots = []
    for apt in appointments:
        apt_time = datetime.combine(check_date, apt.appointment_time)
        end_time = apt_time + timedelta(minutes=apt.duration_minutes)
        busy_slots.append({
            'start': apt.appointment_time.isoformat(),
            'end': end_time.time().isoformat(),
            'appointment_id': apt.id
        })
    
    # Gerar horários disponíveis (exemplo: 9h às 18h, intervalos de 30min)
    available_slots = []
    current_time = time(9, 0)  # Início: 9h
    end_of_day = time(18, 0)   # Fim: 18h
    
    while current_time < end_of_day:
        # Verificar se o horário está ocupado
        is_available = True
        for busy in busy_slots:
            busy_start = datetime.strptime(busy['start'], '%H:%M:%S').time()
            busy_end = datetime.strptime(busy['end'], '%H:%M:%S').time()
            
            if busy_start <= current_time < busy_end:
                is_available = False
                break
        
        if is_available:
            available_slots.append(current_time.isoformat())
        
        # Próximo slot (30 minutos depois)
        dt = datetime.combine(check_date, current_time)
        dt += timedelta(minutes=30)
        current_time = dt.time()
    
    return jsonify({
        'date': check_date.isoformat(),
        'available_slots': available_slots,
        'busy_slots': busy_slots
    }), 200

@api_bp.route('/appointments', methods=['POST'])
@jwt_required()
def create_appointment():
    """Criar novo agendamento"""
    company_id = get_user_company_id()
    if not company_id:
        return jsonify({'error': 'Usuário sem empresa associada'}), 403
    
    data = request.get_json()
    
    # Validar dados
    errors = AppointmentSchema.validate(data)
    if errors:
        return jsonify({'errors': errors}), 400
    
    # Verificar se cliente existe e pertence à empresa
    customer = Customer.query.filter_by(
        id=data['customer_id'],
        company_id=company_id
    ).first()
    
    if not customer:
        return jsonify({'error': 'Cliente não encontrado'}), 404
    
    try:
        # Converter data e hora
        appointment_date = datetime.fromisoformat(data['appointment_date']).date()
        appointment_time = time.fromisoformat(data['appointment_time'])
        
        # Verificar conflito de horário
        duration = data.get('duration_minutes', 60)
        end_time = datetime.combine(appointment_date, appointment_time) + timedelta(minutes=duration)
        
        conflicts = Appointment.query.filter_by(
            company_id=company_id,
            appointment_date=appointment_date
        ).filter(
            Appointment.status.in_(['pending', 'confirmed', 'in_progress'])
        ).all()
        
        for conflict in conflicts:
            conflict_start = datetime.combine(appointment_date, conflict.appointment_time)
            conflict_end = conflict_start + timedelta(minutes=conflict.duration_minutes)
            
            new_start = datetime.combine(appointment_date, appointment_time)
            
            # Verificar sobreposição
            if (new_start < conflict_end and end_time > conflict_start):
                return jsonify({
                    'error': 'Conflito de horário',
                    'conflict_with': conflict.to_dict(include_customer=True)
                }), 409
        
        # Criar agendamento
        appointment = Appointment(
            appointment_date=appointment_date,
            appointment_time=appointment_time,
            duration_minutes=duration,
            customer_id=data['customer_id'],
            company_id=company_id,
            service_name=data['service_name'],
            service_price=data.get('service_price'),
            notes=data.get('notes'),
            status=data.get('status', 'pending')
        )
        
        db.session.add(appointment)
        db.session.commit()
        
        return jsonify({
            'message': 'Agendamento criado com sucesso',
            'appointment': appointment.to_dict(include_customer=True)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Erro ao criar agendamento: {str(e)}'}), 500

@api_bp.route('/appointments/<int:appointment_id>', methods=['GET'])
@jwt_required()
def get_appointment(appointment_id):
    """Obter detalhes de um agendamento"""
    company_id = get_user_company_id()
    if not company_id:
        return jsonify({'error': 'Usuário sem empresa associada'}), 403
    
    appointment = Appointment.query.filter_by(
        id=appointment_id,
        company_id=company_id
    ).first()
    
    if not appointment:
        return jsonify({'error': 'Agendamento não encontrado'}), 404
    
    return jsonify(appointment.to_dict(include_customer=True)), 200

@api_bp.route('/appointments/<int:appointment_id>', methods=['PUT'])
@jwt_required()
def update_appointment(appointment_id):
    """Atualizar agendamento"""
    company_id = get_user_company_id()
    if not company_id:
        return jsonify({'error': 'Usuário sem empresa associada'}), 403
    
    appointment = Appointment.query.filter_by(
        id=appointment_id,
        company_id=company_id
    ).first()
    
    if not appointment:
        return jsonify({'error': 'Agendamento não encontrado'}), 404
    
    data = request.get_json()
    
    # Validar dados
    errors = AppointmentSchema.validate(data, is_update=True)
    if errors:
        return jsonify({'errors': errors}), 400
    
    try:
        # Atualizar campos
        if 'appointment_date' in data:
            appointment.appointment_date = datetime.fromisoformat(data['appointment_date']).date()
        
        if 'appointment_time' in data:
            appointment.appointment_time = time.fromisoformat(data['appointment_time'])
        
        if 'duration_minutes' in data:
            appointment.duration_minutes = data['duration_minutes']
        
        if 'service_name' in data:
            appointment.service_name = data['service_name']
        
        if 'service_price' in data:
            appointment.service_price = data['service_price']
        
        if 'notes' in data:
            appointment.notes = data['notes']
        
        if 'status' in data:
            appointment.status = data['status']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Agendamento atualizado com sucesso',
            'appointment': appointment.to_dict(include_customer=True)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Erro ao atualizar agendamento: {str(e)}'}), 500

@api_bp.route('/appointments/<int:appointment_id>', methods=['DELETE'])
@jwt_required()
def delete_appointment(appointment_id):
    """Deletar agendamento"""
    company_id = get_user_company_id()
    if not company_id:
        return jsonify({'error': 'Usuário sem empresa associada'}), 403
    
    appointment = Appointment.query.filter_by(
        id=appointment_id,
        company_id=company_id
    ).first()
    
    if not appointment:
        return jsonify({'error': 'Agendamento não encontrado'}), 404
    
    try:
        db.session.delete(appointment)
        db.session.commit()
        
        return jsonify({'message': 'Agendamento deletado com sucesso'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Erro ao deletar agendamento: {str(e)}'}), 500