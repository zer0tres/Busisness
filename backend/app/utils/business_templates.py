"""Templates de configuração por tipo de negócio"""

BUSINESS_TEMPLATES = {
    'barbershop': {
        'name': 'Barbearia',
        'modules': {
            'appointments': True,
            'customers': True,
            'products': True,
            'stock': True,
            'services': True,
            'gallery': False
        },
        'appointment_settings': {
            'duration_default': 30,
            'interval': 30,
            'advance_days': 7,
            'allow_online_booking': True,
            'require_approval': False
        },
        'catalog_settings': {
            'show_prices': True,
            'show_stock': False,
            'allow_images': True
        },
        'services': [
            {'name': 'Corte Masculino', 'price': 40.0, 'duration': 30},
            {'name': 'Barba', 'price': 25.0, 'duration': 20},
            {'name': 'Corte + Barba', 'price': 60.0, 'duration': 45},
            {'name': 'Corte Infantil', 'price': 30.0, 'duration': 25}
        ],
        'business_hours': {
            'monday': {'open': '09:00', 'close': '19:00'},
            'tuesday': {'open': '09:00', 'close': '19:00'},
            'wednesday': {'open': '09:00', 'close': '19:00'},
            'thursday': {'open': '09:00', 'close': '19:00'},
            'friday': {'open': '09:00', 'close': '19:00'},
            'saturday': {'open': '09:00', 'close': '17:00'},
            'sunday': {'open': None, 'close': None}
        },
        'customer_fields': {
            'show_birth_date': False,
            'show_cpf': False,
            'custom_fields': []
        },
        'public_welcome_text': 'Bem-vindo! Agende seu horário online.',
        'public_footer_text': 'Aceitamos dinheiro, cartão e PIX.'
    },
    
    'tattoo': {
        'name': 'Estúdio de Tatuagem',
        'modules': {
            'appointments': True,
            'customers': True,
            'products': True,
            'stock': True,
            'services': True,
            'gallery': True
        },
        'appointment_settings': {
            'duration_default': 120,
            'interval': 60,
            'advance_days': 30,
            'allow_online_booking': True,
            'require_approval': True  # Tatuador precisa aprovar
        },
        'catalog_settings': {
            'show_prices': True,
            'show_stock': False,
            'allow_images': True
        },
        'services': [
            {'name': 'Tatuagem Pequena', 'price': 200.0, 'duration': 60},
            {'name': 'Tatuagem Média', 'price': 400.0, 'duration': 120},
            {'name': 'Tatuagem Grande', 'price': 800.0, 'duration': 240},
            {'name': 'Piercing', 'price': 80.0, 'duration': 30},
            {'name': 'Retoque', 'price': 150.0, 'duration': 60}
        ],
        'business_hours': {
            'monday': {'open': None, 'close': None},
            'tuesday': {'open': '10:00', 'close': '18:00'},
            'wednesday': {'open': '10:00', 'close': '18:00'},
            'thursday': {'open': '10:00', 'close': '18:00'},
            'friday': {'open': '10:00', 'close': '18:00'},
            'saturday': {'open': '10:00', 'close': '16:00'},
            'sunday': {'open': None, 'close': None}
        },
        'customer_fields': {
            'show_birth_date': True,
            'show_cpf': True,
            'custom_fields': ['alergia', 'primeira_tatuagem']
        },
        'public_welcome_text': 'Transforme sua arte em realidade. Veja nosso portfólio e agende sua sessão.',
        'public_footer_text': 'Trabalhamos apenas com agendamento. Entrada proibida para menores de 18 anos.'
    },
    
    'clothing_store': {
        'name': 'Loja de Roupas',
        'modules': {
            'appointments': False,
            'customers': False,
            'products': True,
            'stock': True,
            'services': False,
            'gallery': True
        },
        'appointment_settings': {
            'duration_default': 0,
            'interval': 0,
            'advance_days': 0,
            'allow_online_booking': False,
            'require_approval': False
        },
        'catalog_settings': {
            'show_prices': True,
            'show_stock': True,
            'allow_images': True
        },
        'services': [],
        'business_hours': {
            'monday': {'open': '09:00', 'close': '18:00'},
            'tuesday': {'open': '09:00', 'close': '18:00'},
            'wednesday': {'open': '09:00', 'close': '18:00'},
            'thursday': {'open': '09:00', 'close': '18:00'},
            'friday': {'open': '09:00', 'close': '18:00'},
            'saturday': {'open': '09:00', 'close': '17:00'},
            'sunday': {'open': None, 'close': None}
        },
        'customer_fields': {
            'show_birth_date': False,
            'show_cpf': False,
            'custom_fields': []
        },
        'public_welcome_text': 'Confira nossas novidades! Estoque limitado.',
        'public_footer_text': 'Aceitamos todas as formas de pagamento. Retire na loja ou entrega local.'
    },
    
    'hardware_store': {
        'name': 'Material de Construção',
        'modules': {
            'appointments': False,
            'customers': True,
            'products': True,
            'stock': True,
            'services': False,
            'gallery': True
        },
        'appointment_settings': {
            'duration_default': 0,
            'interval': 0,
            'advance_days': 0,
            'allow_online_booking': False,
            'require_approval': False
        },
        'catalog_settings': {
            'show_prices': True,
            'show_stock': True,
            'allow_images': True
        },
        'services': [],
        'business_hours': {
            'monday': {'open': '07:00', 'close': '18:00'},
            'tuesday': {'open': '07:00', 'close': '18:00'},
            'wednesday': {'open': '07:00', 'close': '18:00'},
            'thursday': {'open': '07:00', 'close': '18:00'},
            'friday': {'open': '07:00', 'close': '18:00'},
            'saturday': {'open': '07:00', 'close': '13:00'},
            'sunday': {'open': None, 'close': None}
        },
        'customer_fields': {
            'show_birth_date': False,
            'show_cpf': True,
            'custom_fields': ['cnpj', 'inscricao_estadual']
        },
        'public_welcome_text': 'Tudo para sua obra. Consulte preços e disponibilidade.',
        'public_footer_text': 'Fazemos orçamentos. Entrega para Curitiba e região.'
    },
    
    'other': {
        'name': 'Outro Tipo de Negócio',
        'modules': {
            'appointments': True,
            'customers': True,
            'products': True,
            'stock': True,
            'services': True,
            'gallery': False
        },
        'appointment_settings': {
            'duration_default': 60,
            'interval': 30,
            'advance_days': 15,
            'allow_online_booking': True,
            'require_approval': False
        },
        'catalog_settings': {
            'show_prices': True,
            'show_stock': False,
            'allow_images': True
        },
        'services': [],
        'business_hours': {
            'monday': {'open': '09:00', 'close': '18:00'},
            'tuesday': {'open': '09:00', 'close': '18:00'},
            'wednesday': {'open': '09:00', 'close': '18:00'},
            'thursday': {'open': '09:00', 'close': '18:00'},
            'friday': {'open': '09:00', 'close': '18:00'},
            'saturday': {'open': '09:00', 'close': '13:00'},
            'sunday': {'open': None, 'close': None}
        },
        'customer_fields': {
            'show_birth_date': False,
            'show_cpf': False,
            'custom_fields': []
        },
        'public_welcome_text': 'Bem-vindo!',
        'public_footer_text': ''
    }
}

def get_template(business_type):
    """Obter template de configuração por tipo de negócio"""
    return BUSINESS_TEMPLATES.get(business_type, BUSINESS_TEMPLATES['other'])