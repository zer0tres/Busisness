from flask import jsonify, request
from app.api import api_bp
from app.models.company import Company
from app.models.appointment import Appointment
from app.models.customer import Customer
from app.models.product import Product
from app.models.business_config import BusinessConfig
from app import db
from datetime import datetime, date, timedelta


# ─── Página pública da empresa ───────────────────────────────────────────────

@api_bp.route('/public/<slug>', methods=['GET'])
def get_public_company(slug):
    """Retorna dados públicos da empresa pelo slug"""
    company = Company.query.filter_by(slug=slug, is_active=True).first()
    if not company:
        return jsonify({'error': 'Empresa não encontrada'}), 404

    # Buscar configurações
    config = BusinessConfig.query.filter_by(company_id=company.id).first()

    # Buscar serviços disponíveis
    services = []
    if config and config.services_list:
        services = config.services_list

    # Buscar produtos ativos (vitrine)
    products = Product.query.filter_by(
        company_id=company.id, is_active=True
    ).order_by(Product.name).all()

    return jsonify({
        'company': {
            'id': company.id,
            'name': company.name,
            'slug': company.slug,
            'business_type': company.business_type,
            'email': company.email,
            'phone': company.phone,
            'address': company.address,
            'primary_color': company.primary_color,
            'logo_url': company.logo_url,
            'opening_hours': company.opening_hours,
        },
        'services': services,
        'products': [
            {
                'id': p.id,
                'name': p.name,
                'description': p.description,
                'price': p.price,
                'image_url': getattr(p, 'image_url', None),
                'category': p.category,
            }
            for p in products
        ]
    }), 200


# ─── Disponibilidade de horários ─────────────────────────────────────────────

@api_bp.route('/public/<slug>/availability', methods=['GET'])
def get_availability(slug):
    """Retorna horários disponíveis para uma data"""
    company = Company.query.filter_by(slug=slug, is_active=True).first()
    if not company:
        return jsonify({'error': 'Empresa não encontrada'}), 404

    date_str = request.args.get('date')
    service_duration = int(request.args.get('duration', 60))

    if not date_str:
        return jsonify({'error': 'Data obrigatória'}), 400

    try:
        target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'error': 'Data inválida'}), 400

    # Não permitir datas passadas
    if target_date < date.today():
        return jsonify({'slots': [], 'message': 'Data no passado'}), 200

    # Verificar horário de funcionamento
    day_names = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    day_name = day_names[target_date.weekday()]
    opening_hours = company.opening_hours or {}
    day_config = opening_hours.get(day_name, {})

    if not day_config or not day_config.get('open'):
        return jsonify({'slots': [], 'message': 'Estabelecimento fechado neste dia'}), 200

    open_time_str = day_config.get('open', '09:00')
    close_time_str = day_config.get('close', '18:00')

    open_h, open_m = map(int, open_time_str.split(':'))
    close_h, close_m = map(int, close_time_str.split(':'))

    # Gerar todos os slots possíveis
    slots = []
    current = datetime.combine(target_date, datetime.min.time()).replace(hour=open_h, minute=open_m)
    end = datetime.combine(target_date, datetime.min.time()).replace(hour=close_h, minute=close_m)

    while current + timedelta(minutes=service_duration) <= end:
        slots.append(current.strftime('%H:%M'))
        current += timedelta(minutes=30)

    # Buscar agendamentos já existentes na data
    existing = Appointment.query.filter_by(
        company_id=company.id,
        appointment_date=target_date
    ).filter(
        Appointment.status.notin_(['cancelled'])
    ).all()

    # Remover slots ocupados
    occupied = set()
    for appt in existing:
        appt_start = datetime.combine(target_date, appt.appointment_time)
        appt_end = appt_start + timedelta(minutes=appt.duration_minutes or 60)
        t = appt_start
        while t < appt_end:
            occupied.add(t.strftime('%H:%M'))
            t += timedelta(minutes=30)

    available_slots = [s for s in slots if s not in occupied]

    return jsonify({'slots': available_slots, 'date': date_str}), 200


# ─── Criar agendamento público ────────────────────────────────────────────────

@api_bp.route('/public/<slug>/book', methods=['POST'])
def book_appointment(slug):
    """Cria um agendamento público (sem login)"""
    company = Company.query.filter_by(slug=slug, is_active=True).first()
    if not company:
        return jsonify({'error': 'Empresa não encontrada'}), 404

    data = request.get_json()
    required = ['name', 'email', 'phone', 'service_name', 'date', 'time']
    for field in required:
        if not data.get(field):
            return jsonify({'error': f'Campo obrigatório: {field}'}), 400

    try:
        appt_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        appt_time = datetime.strptime(data['time'], '%H:%M').time()
    except ValueError:
        return jsonify({'error': 'Data ou hora inválida'}), 400

    if appt_date < date.today():
        return jsonify({'error': 'Não é possível agendar em datas passadas'}), 400

    # Buscar ou criar cliente
    customer = Customer.query.filter_by(
        email=data['email'],
        company_id=company.id
    ).first()

    if not customer:
        customer = Customer(
            name=data['name'],
            email=data['email'],
            phone=data['phone'],
            company_id=company.id
        )
        db.session.add(customer)
        db.session.flush()

    # Verificar conflito de horário
    duration = int(data.get('duration', 60))
    new_start = datetime.combine(appt_date, appt_time)
    new_end = new_start + timedelta(minutes=duration)

    conflicts = Appointment.query.filter_by(
        company_id=company.id,
        appointment_date=appt_date
    ).filter(Appointment.status.notin_(['cancelled'])).all()

    for appt in conflicts:
        ex_start = datetime.combine(appt_date, appt.appointment_time)
        ex_end = ex_start + timedelta(minutes=appt.duration_minutes or 60)
        if new_start < ex_end and new_end > ex_start:
            return jsonify({'error': 'Horário não disponível'}), 409

    # Criar agendamento
    appointment = Appointment(
        company_id=company.id,
        customer_id=customer.id,
        appointment_date=appt_date,
        appointment_time=appt_time,
        duration_minutes=duration,
        service_name=data['service_name'],
        service_price=data.get('service_price'),
        notes=data.get('notes', ''),
        status='pending'
    )
    db.session.add(appointment)
    db.session.commit()

    return jsonify({
        'message': 'Agendamento realizado com sucesso!',
        'appointment': {
            'id': appointment.id,
            'date': appt_date.isoformat(),
            'time': appt_time.strftime('%H:%M'),
            'service': data['service_name'],
            'status': 'pending',
            'customer': {
                'name': customer.name,
                'email': customer.email,
            }
        }
    }), 201