from datetime import datetime
from app import db

class FinancialCategory(db.Model):
    __tablename__ = 'financial_categories'
    
    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    type = db.Column(db.String(20), nullable=False)  # income, expense
    color = db.Column(db.String(7))
    icon = db.Column(db.String(50))
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)
    
    # Relacionamentos
    company = db.relationship('Company', backref='financial_categories')
    
    def to_dict(self):
        return {
            'id': self.id,
            'company_id': self.company_id,
            'name': self.name,
            'type': self.type,
            'color': self.color,
            'icon': self.icon,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class Transaction(db.Model):
    __tablename__ = 'transactions'
    
    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('financial_categories.id'))
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id'))
    appointment_id = db.Column(db.Integer, db.ForeignKey('appointments.id'))
    type = db.Column(db.String(20), nullable=False)  # income, expense
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    description = db.Column(db.Text)
    payment_method = db.Column(db.String(50))  # cash, card, pix, transfer
    transaction_date = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(20), default='completed')  # pending, completed, cancelled
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)
    
    # Relacionamentos
    company = db.relationship('Company', backref='transactions')
    category = db.relationship('FinancialCategory', backref='transactions')
    customer = db.relationship('Customer', backref='transactions')
    appointment = db.relationship('Appointment', backref='transactions')
    
    def to_dict(self):
        return {
            'id': self.id,
            'company_id': self.company_id,
            'category_id': self.category_id,
            'customer_id': self.customer_id,
            'appointment_id': self.appointment_id,
            'type': self.type,
            'amount': float(self.amount),
            'description': self.description,
            'payment_method': self.payment_method,
            'transaction_date': self.transaction_date.isoformat() if self.transaction_date else None,
            'status': self.status,
            'notes': self.notes,
            'category': self.category.to_dict() if self.category else None,
            'customer': self.customer.to_dict() if self.customer else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class AccountPayable(db.Model):
    __tablename__ = 'accounts_payable'
    
    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('financial_categories.id'))
    supplier_name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    due_date = db.Column(db.Date, nullable=False)
    payment_date = db.Column(db.Date)
    status = db.Column(db.String(20), default='pending')  # pending, paid, overdue, cancelled
    payment_method = db.Column(db.String(50))
    notes = db.Column(db.Text)
    recurrence = db.Column(db.String(20))  # once, monthly, yearly
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)
    
    # Relacionamentos
    company = db.relationship('Company', backref='accounts_payable')
    category = db.relationship('FinancialCategory', backref='accounts_payable')
    
    def to_dict(self):
        return {
            'id': self.id,
            'company_id': self.company_id,
            'category_id': self.category_id,
            'supplier_name': self.supplier_name,
            'description': self.description,
            'amount': float(self.amount),
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'payment_date': self.payment_date.isoformat() if self.payment_date else None,
            'status': self.status,
            'payment_method': self.payment_method,
            'notes': self.notes,
            'recurrence': self.recurrence,
            'category': self.category.to_dict() if self.category else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class AccountReceivable(db.Model):
    __tablename__ = 'accounts_receivable'
    
    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False)
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id'))
    category_id = db.Column(db.Integer, db.ForeignKey('financial_categories.id'))
    description = db.Column(db.Text, nullable=False)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    due_date = db.Column(db.Date, nullable=False)
    payment_date = db.Column(db.Date)
    status = db.Column(db.String(20), default='pending')  # pending, received, overdue, cancelled
    payment_method = db.Column(db.String(50))
    notes = db.Column(db.Text)
    recurrence = db.Column(db.String(20))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)
    
    # Relacionamentos
    company = db.relationship('Company', backref='accounts_receivable')
    customer = db.relationship('Customer', backref='accounts_receivable')
    category = db.relationship('FinancialCategory', backref='accounts_receivable')
    
    def to_dict(self):
        return {
            'id': self.id,
            'company_id': self.company_id,
            'customer_id': self.customer_id,
            'category_id': self.category_id,
            'description': self.description,
            'amount': float(self.amount),
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'payment_date': self.payment_date.isoformat() if self.payment_date else None,
            'status': self.status,
            'payment_method': self.payment_method,
            'notes': self.notes,
            'recurrence': self.recurrence,
            'customer': self.customer.to_dict() if self.customer else None,
            'category': self.category.to_dict() if self.category else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class Invoice(db.Model):
    __tablename__ = 'invoices'
    
    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False)
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id'))
    transaction_id = db.Column(db.Integer, db.ForeignKey('transactions.id'))
    invoice_number = db.Column(db.String(100), nullable=False)
    invoice_type = db.Column(db.String(50), nullable=False)  # nfe, nfse, nfce, receipt
    status = db.Column(db.String(50), nullable=False)  # issued, received, validated, cancelled, pending
    issue_date = db.Column(db.Date, nullable=False)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    tax_amount = db.Column(db.Numeric(10, 2))
    description = db.Column(db.Text)
    access_key = db.Column(db.String(100))  # Chave de acesso NFe
    file_path = db.Column(db.String(500))
    file_name = db.Column(db.String(255))
    validation_date = db.Column(db.Date)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)
    
    # Relacionamentos
    company = db.relationship('Company', backref='invoices')
    customer = db.relationship('Customer', backref='invoices')
    transaction = db.relationship('Transaction', backref='invoice', uselist=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'company_id': self.company_id,
            'customer_id': self.customer_id,
            'transaction_id': self.transaction_id,
            'invoice_number': self.invoice_number,
            'invoice_type': self.invoice_type,
            'status': self.status,
            'issue_date': self.issue_date.isoformat() if self.issue_date else None,
            'amount': float(self.amount),
            'tax_amount': float(self.tax_amount) if self.tax_amount else None,
            'description': self.description,
            'access_key': self.access_key,
            'file_path': self.file_path,
            'file_name': self.file_name,
            'validation_date': self.validation_date.isoformat() if self.validation_date else None,
            'notes': self.notes,
            'customer': self.customer.to_dict() if self.customer else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }