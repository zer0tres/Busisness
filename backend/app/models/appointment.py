from app import db
from datetime import datetime

class Appointment(db.Model):
    """Modelo de agendamento"""
    
    __tablename__ = 'appointments'
    
    id = db.Column(db.Integer, primary_key=True)
    
    # Data e hora
    appointment_date = db.Column(db.Date, nullable=False, index=True)
    appointment_time = db.Column(db.Time, nullable=False)
    duration_minutes = db.Column(db.Integer, default=60)  # Duração padrão: 60 minutos
    
    # Relacionamentos
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id'), nullable=False)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False)
    
    # Informações do serviço
    service_name = db.Column(db.String(100), nullable=False)
    service_price = db.Column(db.Float)
    
    # Observações
    notes = db.Column(db.Text)
    
    # Status do agendamento
    status = db.Column(db.String(20), default='pending', nullable=False)
    # Opções: 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relacionamento com Customer
    customer = db.relationship('Customer', backref='appointments', lazy=True)
    
    def to_dict(self, include_customer=False):
        """Converter para dicionário"""
        data = {
            'id': self.id,
            'appointment_date': self.appointment_date.isoformat() if self.appointment_date else None,
            'appointment_time': self.appointment_time.isoformat() if self.appointment_time else None,
            'duration_minutes': self.duration_minutes,
            'customer_id': self.customer_id,
            'company_id': self.company_id,
            'service_name': self.service_name,
            'service_price': self.service_price,
            'notes': self.notes,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        
        # Incluir dados do cliente se solicitado
        if include_customer and self.customer:
            data['customer'] = {
                'id': self.customer.id,
                'name': self.customer.name,
                'email': self.customer.email,
                'phone': self.customer.phone
            }
        
        return data
    
    def __repr__(self):
        return f'<Appointment {self.id} - {self.appointment_date} {self.appointment_time}>'
        