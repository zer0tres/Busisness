from app import db
from datetime import datetime

class Subscription(db.Model):
    """Modelo de assinatura do lojista"""
    
    __tablename__ = 'subscriptions'
    
    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False, unique=True)
    
    # Plano
    plan = db.Column(db.String(20), default='trial')
    # Opções: 'trial', 'basic', 'professional', 'premium'
    
    # Status
    status = db.Column(db.String(20), default='active')
    # Opções: 'active', 'cancelled', 'past_due', 'trialing'
    
    # Mercado Pago
    mp_subscription_id = db.Column(db.String(100))
    mp_payer_id = db.Column(db.String(100))
    
    # Datas
    trial_ends_at = db.Column(db.DateTime)
    current_period_start = db.Column(db.DateTime)
    current_period_end = db.Column(db.DateTime)
    cancelled_at = db.Column(db.DateTime)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relacionamento
    company = db.relationship('Company', backref='subscription', uselist=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'company_id': self.company_id,
            'plan': self.plan,
            'status': self.status,
            'mp_subscription_id': self.mp_subscription_id,
            'trial_ends_at': self.trial_ends_at.isoformat() if self.trial_ends_at else None,
            'current_period_start': self.current_period_start.isoformat() if self.current_period_start else None,
            'current_period_end': self.current_period_end.isoformat() if self.current_period_end else None,
            'cancelled_at': self.cancelled_at.isoformat() if self.cancelled_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
    
    def __repr__(self):
        return f'<Subscription company_id={self.company_id} plan={self.plan}>'