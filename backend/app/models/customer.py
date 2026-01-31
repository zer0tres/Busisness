from app import db
from datetime import datetime

class Customer(db.Model):
    """Modelo de cliente"""
    
    __tablename__ = 'customers'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), index=True)
    phone = db.Column(db.String(20), nullable=False)
    
    # Informações adicionais
    cpf = db.Column(db.String(14))
    birth_date = db.Column(db.Date)
    address = db.Column(db.String(200))
    notes = db.Column(db.Text)
    
    # Relacionamento com empresa
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False)
    
    # Status
    is_active = db.Column(db.Boolean, default=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        """Converter para dicionário"""
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'phone': self.phone,
            'cpf': self.cpf,
            'birth_date': self.birth_date.isoformat() if self.birth_date else None,
            'address': self.address,
            'notes': self.notes,
            'company_id': self.company_id,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<Customer {self.name}>'