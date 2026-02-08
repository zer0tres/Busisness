from app import db
from datetime import datetime

class Product(db.Model):
    """Modelo de produto/estoque"""
    
    __tablename__ = 'products'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    
    # Controle de estoque
    quantity = db.Column(db.Integer, default=0, nullable=False)
    min_quantity = db.Column(db.Integer, default=5)  # Alerta de estoque baixo
    unit = db.Column(db.String(20), default='un')  # un, kg, L, m, etc
    
    # Preços
    cost_price = db.Column(db.Float)  # Preço de custo
    sale_price = db.Column(db.Float)  # Preço de venda
    
    # Categorização
    category = db.Column(db.String(50))
    sku = db.Column(db.String(50))  # Código do produto
    barcode = db.Column(db.String(50))  # Código de barras
    
    # Relacionamento
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False)
    
    # Status
    is_active = db.Column(db.Boolean, default=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relacionamento com movimentações
    movements = db.relationship('StockMovement', backref='product', lazy=True, cascade='all, delete-orphan')
    
    @property
    def is_low_stock(self):
        """Verificar se está com estoque baixo"""
        return self.quantity <= self.min_quantity
    
    @property
    def stock_value(self):
        """Calcular valor total em estoque"""
        if self.cost_price:
            return self.quantity * self.cost_price
        return 0
    
    def to_dict(self):
        """Converter para dicionário"""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'quantity': self.quantity,
            'min_quantity': self.min_quantity,
            'unit': self.unit,
            'cost_price': self.cost_price,
            'sale_price': self.sale_price,
            'category': self.category,
            'sku': self.sku,
            'barcode': self.barcode,
            'company_id': self.company_id,
            'is_active': self.is_active,
            'is_low_stock': self.is_low_stock,
            'stock_value': self.stock_value,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<Product {self.name}>'