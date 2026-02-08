class ProductSchema:
    """Schema para validar dados de produto"""
    
    @staticmethod
    def validate(data, is_update=False):
        errors = {}
        
        # Nome obrigatório (apenas em criação)
        if not is_update and not data.get('name'):
            errors['name'] = 'Nome é obrigatório'
        elif data.get('name') and len(data['name']) < 3:
            errors['name'] = 'Nome deve ter pelo menos 3 caracteres'
        
        # Validar quantidade se fornecida
        if data.get('quantity') is not None:
            try:
                quantity = int(data['quantity'])
                if quantity < 0:
                    errors['quantity'] = 'Quantidade não pode ser negativa'
            except (ValueError, TypeError):
                errors['quantity'] = 'Quantidade deve ser um número'
        
        # Validar min_quantity se fornecida
        if data.get('min_quantity') is not None:
            try:
                min_qty = int(data['min_quantity'])
                if min_qty < 0:
                    errors['min_quantity'] = 'Quantidade mínima não pode ser negativa'
            except (ValueError, TypeError):
                errors['min_quantity'] = 'Quantidade mínima deve ser um número'
        
        # Validar preços se fornecidos
        if data.get('cost_price') is not None:
            try:
                price = float(data['cost_price'])
                if price < 0:
                    errors['cost_price'] = 'Preço de custo não pode ser negativo'
            except (ValueError, TypeError):
                errors['cost_price'] = 'Preço de custo deve ser um número'
        
        if data.get('sale_price') is not None:
            try:
                price = float(data['sale_price'])
                if price < 0:
                    errors['sale_price'] = 'Preço de venda não pode ser negativo'
            except (ValueError, TypeError):
                errors['sale_price'] = 'Preço de venda deve ser um número'
        
        return errors

class StockMovementSchema:
    """Schema para validar movimentação de estoque"""
    
    @staticmethod
    def validate(data):
        errors = {}
        
        # Produto obrigatório
        if not data.get('product_id'):
            errors['product_id'] = 'Produto é obrigatório'
        
        # Tipo de movimentação obrigatório
        if not data.get('movement_type'):
            errors['movement_type'] = 'Tipo de movimentação é obrigatório'
        elif data['movement_type'] not in ['entrada', 'saida']:
            errors['movement_type'] = 'Tipo deve ser "entrada" ou "saida"'
        
        # Quantidade obrigatória
        if not data.get('quantity'):
            errors['quantity'] = 'Quantidade é obrigatória'
        else:
            try:
                quantity = int(data['quantity'])
                if quantity <= 0:
                    errors['quantity'] = 'Quantidade deve ser maior que zero'
            except (ValueError, TypeError):
                errors['quantity'] = 'Quantidade deve ser um número'
        
        # Motivo obrigatório
        if not data.get('reason'):
            errors['reason'] = 'Motivo é obrigatório'
        
        return errors