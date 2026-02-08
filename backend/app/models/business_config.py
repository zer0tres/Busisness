from app import db
from datetime import datetime

class BusinessConfig(db.Model):
    """Configurações específicas do negócio"""
    
    __tablename__ = 'business_configs'
    
    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False, unique=True)
    
    # Módulos habilitados
    module_appointments = db.Column(db.Boolean, default=True)
    module_customers = db.Column(db.Boolean, default=True)
    module_products = db.Column(db.Boolean, default=True)
    module_stock = db.Column(db.Boolean, default=True)
    module_services = db.Column(db.Boolean, default=True)
    module_gallery = db.Column(db.Boolean, default=False)  # Para tattoo
    
    # Configurações de agendamento
    appointment_duration_default = db.Column(db.Integer, default=60)  # minutos
    appointment_interval = db.Column(db.Integer, default=30)  # intervalo entre horários
    appointment_advance_days = db.Column(db.Integer, default=30)  # quantos dias no futuro pode agendar
    allow_online_booking = db.Column(db.Boolean, default=True)  # Cliente pode agendar online
    require_approval = db.Column(db.Boolean, default=False)  # Agendamento precisa aprovação
    
    # Configurações de catálogo
    show_product_prices = db.Column(db.Boolean, default=True)
    show_product_stock = db.Column(db.Boolean, default=False)  # Mostrar qtd em estoque
    allow_product_images = db.Column(db.Boolean, default=True)
    
    # Configurações de serviços
    services_list = db.Column(db.JSON)  # Lista de serviços disponíveis
    # Exemplo: [{"name": "Corte Masculino", "price": 40, "duration": 30}, ...]
    
    # Horário de funcionamento (sobrescreve do Company se necessário)
    business_hours = db.Column(db.JSON)
    # Exemplo: {"monday": {"open": "09:00", "close": "18:00", "lunch_start": "12:00", "lunch_end": "13:00"}}
    
    # Campos customizados para clientes
    customer_fields = db.Column(db.JSON)
    # Exemplo: {"show_birth_date": true, "show_cpf": false, "custom_fields": ["tamanho_camisa"]}
    
    # Notificações
    send_email_confirmation = db.Column(db.Boolean, default=True)
    send_sms_reminder = db.Column(db.Boolean, default=False)
    reminder_hours_before = db.Column(db.Integer, default=24)
    
    # Texto customizado para área pública
    public_welcome_text = db.Column(db.Text)
    public_footer_text = db.Column(db.Text)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        """Converter para dicionário"""
        return {
            'id': self.id,
            'company_id': self.company_id,
            'modules': {
                'appointments': self.module_appointments,
                'customers': self.module_customers,
                'products': self.module_products,
                'stock': self.module_stock,
                'services': self.module_services,
                'gallery': self.module_gallery
            },
            'appointment_settings': {
                'duration_default': self.appointment_duration_default,
                'interval': self.appointment_interval,
                'advance_days': self.appointment_advance_days,
                'allow_online_booking': self.allow_online_booking,
                'require_approval': self.require_approval
            },
            'catalog_settings': {
                'show_prices': self.show_product_prices,
                'show_stock': self.show_product_stock,
                'allow_images': self.allow_product_images
            },
            'services': self.services_list or [],
            'business_hours': self.business_hours or {},
            'customer_fields': self.customer_fields or {},
            'notifications': {
                'email_confirmation': self.send_email_confirmation,
                'sms_reminder': self.send_sms_reminder,
                'reminder_hours_before': self.reminder_hours_before
            },
            'public_text': {
                'welcome': self.public_welcome_text,
                'footer': self.public_footer_text
            },
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<BusinessConfig company_id={self.company_id}>'