from app import db
from datetime import datetime, timedelta

class Company(db.Model):
    """Modelo de empresa/negócio"""
    
    __tablename__ = 'companies'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    slug = db.Column(db.String(100), unique=True, nullable=False, index=True)
    
    # Tipo de negócio
    business_type = db.Column(db.String(50), nullable=False)
    # Opções: 'restaurant', 'barbershop', 'tattoo', 'distributor', 'other'
    
    # Informações de contato
    email = db.Column(db.String(120))
    phone = db.Column(db.String(20))
    address = db.Column(db.String(200))
    
    # Customização
    primary_color = db.Column(db.String(7), default='#3B82F6')  # Azul padrão
    logo_url = db.Column(db.String(255))
    
    # Google OAuth / Calendar
    google_refresh_token = db.Column(db.Text, nullable=True)
    
    # Configurações de funcionamento
    opening_hours = db.Column(db.JSON)  # {"monday": {"open": "09:00", "close": "18:00"}, ...}
    
    # Status
    is_active = db.Column(db.Boolean, default=True)
    subscription_status = db.Column(db.String(20), default='trial')
    # Opções: 'trial', 'active', 'suspended', 'cancelled'
    
    # Relacionamentos
    users = db.relationship('User', backref='company', lazy=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        """Converter para dicionário (para JSON)"""
        return {
            'id': self.id,
            'name': self.name,
            'slug': self.slug,
            'business_type': self.business_type,
            'email': self.email,
            'phone': self.phone,
            'address': self.address,
            'primary_color': self.primary_color,
            'logo_url': self.logo_url,
            'opening_hours': self.opening_hours,
            'is_active': self.is_active,
            'subscription_status': self.subscription_status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'trial_days_remaining': self.trial_days_remaining(),
            'can_access': self.can_access()
        }
    
    def trial_days_remaining(self):
        if not self.created_at:
            return 0
        delta = timedelta(days=30) - (datetime.utcnow() - self.created_at)
        return max(0, delta.days)

    def is_trial_expired(self):
        return self.subscription_status == 'trial' and self.trial_days_remaining() == 0

    def can_access(self):
        if self.subscription_status == 'active':
            return True
        if self.subscription_status == 'trial' and self.trial_days_remaining() > 0:
            return True
        return False

    def __repr__(self):
        return f'<Company {self.name}>'