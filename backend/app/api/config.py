from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.api import api_bp
from app.models.business_config import BusinessConfig
from app.models.company import Company
from app.models.user import User
from app.utils.business_templates import get_template, BUSINESS_TEMPLATES

def get_user_company_id():
    """Obter company_id do usuário logado"""
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user or not user.company_id:
        return None
    return user.company_id

@api_bp.route('/config', methods=['GET'])
@jwt_required()
def get_config():
    """Obter configurações da empresa"""
    company_id = get_user_company_id()
    if not company_id:
        return jsonify({'error': 'Usuário sem empresa associada'}), 403
    
    config = BusinessConfig.query.filter_by(company_id=company_id).first()
    
    if not config:
        # Se não existir, criar com template padrão
        company = Company.query.get(company_id)
        template = get_template(company.business_type if company else 'other')
        
        config = BusinessConfig(
            company_id=company_id,
            **_template_to_config(template)
        )
        db.session.add(config)
        db.session.commit()
    
    return jsonify(config.to_dict()), 200

@api_bp.route('/config', methods=['PUT'])
@jwt_required()
def update_config():
    """Atualizar configurações da empresa"""
    company_id = get_user_company_id()
    if not company_id:
        return jsonify({'error': 'Usuário sem empresa associada'}), 403
    
    config = BusinessConfig.query.filter_by(company_id=company_id).first()
    
    if not config:
        return jsonify({'error': 'Configuração não encontrada'}), 404
    
    data = request.get_json()
    
    try:
        # Atualizar módulos
        if 'modules' in data:
            config.module_appointments = data['modules'].get('appointments', config.module_appointments)
            config.module_customers = data['modules'].get('customers', config.module_customers)
            config.module_products = data['modules'].get('products', config.module_products)
            config.module_stock = data['modules'].get('stock', config.module_stock)
            config.module_services = data['modules'].get('services', config.module_services)
            config.module_gallery = data['modules'].get('gallery', config.module_gallery)
        
        # Atualizar configurações de agendamento
        if 'appointment_settings' in data:
            settings = data['appointment_settings']
            config.appointment_duration_default = settings.get('duration_default', config.appointment_duration_default)
            config.appointment_interval = settings.get('interval', config.appointment_interval)
            config.appointment_advance_days = settings.get('advance_days', config.appointment_advance_days)
            config.allow_online_booking = settings.get('allow_online_booking', config.allow_online_booking)
            config.require_approval = settings.get('require_approval', config.require_approval)
        
        # Atualizar configurações de catálogo
        if 'catalog_settings' in data:
            settings = data['catalog_settings']
            config.show_product_prices = settings.get('show_prices', config.show_product_prices)
            config.show_product_stock = settings.get('show_stock', config.show_product_stock)
            config.allow_product_images = settings.get('allow_images', config.allow_product_images)
        
        # Atualizar serviços
        if 'services' in data:
            config.services_list = data['services']
        
        # Atualizar horário de funcionamento
        if 'business_hours' in data:
            config.business_hours = data['business_hours']
        
        # Atualizar campos de cliente
        if 'customer_fields' in data:
            config.customer_fields = data['customer_fields']
        
        # Atualizar notificações
        if 'notifications' in data:
            notif = data['notifications']
            config.send_email_confirmation = notif.get('email_confirmation', config.send_email_confirmation)
            config.send_sms_reminder = notif.get('sms_reminder', config.send_sms_reminder)
            config.reminder_hours_before = notif.get('reminder_hours_before', config.reminder_hours_before)
        
        # Atualizar textos públicos
        if 'public_text' in data:
            text = data['public_text']
            config.public_welcome_text = text.get('welcome', config.public_welcome_text)
            config.public_footer_text = text.get('footer', config.public_footer_text)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Configurações atualizadas com sucesso',
            'config': config.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Erro ao atualizar configurações: {str(e)}'}), 500

@api_bp.route('/config/templates', methods=['GET'])
def list_templates():
    """Listar templates disponíveis por tipo de negócio"""
    templates = {}
    for key, template in BUSINESS_TEMPLATES.items():
        templates[key] = {
            'name': template['name'],
            'modules': template['modules']
        }
    
    return jsonify({'templates': templates}), 200

@api_bp.route('/config/apply-template/<string:business_type>', methods=['POST'])
@jwt_required()
def apply_template(business_type):
    """Aplicar template de configuração"""
    company_id = get_user_company_id()
    if not company_id:
        return jsonify({'error': 'Usuário sem empresa associada'}), 403
    
    template = get_template(business_type)
    if not template:
        return jsonify({'error': 'Template não encontrado'}), 404
    
    config = BusinessConfig.query.filter_by(company_id=company_id).first()
    
    try:
        if config:
            # Atualizar existente
            _update_config_from_template(config, template)
        else:
            # Criar novo
            config = BusinessConfig(
                company_id=company_id,
                **_template_to_config(template)
            )
            db.session.add(config)
        
        db.session.commit()
        
        return jsonify({
            'message': f'Template "{template["name"]}" aplicado com sucesso',
            'config': config.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Erro ao aplicar template: {str(e)}'}), 500

def _template_to_config(template):
    """Converter template para campos de configuração"""
    return {
        'module_appointments': template['modules']['appointments'],
        'module_customers': template['modules']['customers'],
        'module_products': template['modules']['products'],
        'module_stock': template['modules']['stock'],
        'module_services': template['modules']['services'],
        'module_gallery': template['modules']['gallery'],
        'appointment_duration_default': template['appointment_settings']['duration_default'],
        'appointment_interval': template['appointment_settings']['interval'],
        'appointment_advance_days': template['appointment_settings']['advance_days'],
        'allow_online_booking': template['appointment_settings']['allow_online_booking'],
        'require_approval': template['appointment_settings']['require_approval'],
        'show_product_prices': template['catalog_settings']['show_prices'],
        'show_product_stock': template['catalog_settings']['show_stock'],
        'allow_product_images': template['catalog_settings']['allow_images'],
        'services_list': template['services'],
        'business_hours': template['business_hours'],
        'customer_fields': template['customer_fields'],
        'public_welcome_text': template['public_welcome_text'],
        'public_footer_text': template['public_footer_text']
    }

def _update_config_from_template(config, template):
    """Atualizar configuração existente com template"""
    config.module_appointments = template['modules']['appointments']
    config.module_customers = template['modules']['customers']
    config.module_products = template['modules']['products']
    config.module_stock = template['modules']['stock']
    config.module_services = template['modules']['services']
    config.module_gallery = template['modules']['gallery']
    config.appointment_duration_default = template['appointment_settings']['duration_default']
    config.appointment_interval = template['appointment_settings']['interval']
    config.appointment_advance_days = template['appointment_settings']['advance_days']
    config.allow_online_booking = template['appointment_settings']['allow_online_booking']
    config.require_approval = template['appointment_settings']['require_approval']
    config.show_product_prices = template['catalog_settings']['show_prices']
    config.show_product_stock = template['catalog_settings']['show_stock']
    config.allow_product_images = template['catalog_settings']['allow_images']
    config.services_list = template['services']
    config.business_hours = template['business_hours']
    config.customer_fields = template['customer_fields']
    config.public_welcome_text = template['public_welcome_text']
    config.public_footer_text = template['public_footer_text']