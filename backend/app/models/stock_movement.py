from app import db
from datetime import datetime

class StockMovement(db.Model):
    """Modelo de movimentação de estoque"""
    
    __tablename__ = 'stock_movements'
    
    id = db.Column(db.Integer, primary_key=True)
    
    # Relacionamentos
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Tipo de movimentação
    movement_type = db.Column(db.String(20), nullable=False)
    # Opções: 'entrada' (compra, devolução), 'saida' (venda, uso, perda)
    
    # Quantidade
    quantity = db.Column(db.Integer, nullable=False)
    
    # Valor unitário no momento da movimentação
    unit_price = db.Column(db.Float)
    
    # Motivo/Observação
    reason = db.Column(db.String(100))
    notes = db.Column(db.Text)
    
    # Timestamp
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relacionamento com User
    user = db.relationship('User', backref='stock_movements', lazy=True)
    
    def to_dict(self, include_product=False, include_user=False):
        """Converter para dicionário"""
        data = {
            'id': self.id,
            'product_id': self.product_id,
            'movement_type': self.movement_type,
            'quantity': self.quantity,
            'unit_price': self.unit_price,
            'reason': self.reason,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        
        # Incluir dados do produto se solicitado
        if include_product and self.product:
            data['product'] = {
                'id': self.product.id,
                'name': self.product.name,
                'sku': self.product.sku,
                'unit': self.product.unit
            }
        
        # Incluir dados do usuário se solicitado
        if include_user and self.user:
            data['user'] = {
                'id': self.user.id,
                'name': self.user.name,
                'email': self.user.email
            }
        
        return data
    
    def __repr__(self):
        return f'<StockMovement {self.movement_type} - {self.quantity}>'