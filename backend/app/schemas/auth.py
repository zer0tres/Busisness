from email_validator import validate_email, EmailNotValidError

class RegisterSchema:
    """Schema para validar registro de usuário"""
    
    @staticmethod
    def validate(data):
        errors = {}
        
        # Validar email
        if not data.get('email'):
            errors['email'] = 'Email é obrigatório'
        else:
            try:
                validate_email(data['email'])
            except EmailNotValidError:
                errors['email'] = 'Email inválido'
        
        # Validar senha
        if not data.get('password'):
            errors['password'] = 'Senha é obrigatória'
        elif len(data['password']) < 6:
            errors['password'] = 'Senha deve ter pelo menos 6 caracteres'
        
        # Validar nome
        if not data.get('name'):
            errors['name'] = 'Nome é obrigatório'
        elif len(data['name']) < 3:
            errors['name'] = 'Nome deve ter pelo menos 3 caracteres'
        
        return errors

class LoginSchema:
    """Schema para validar login"""
    
    @staticmethod
    def validate(data):
        errors = {}
        
        # Validar email
        if not data.get('email'):
            errors['email'] = 'Email é obrigatório'
        
        # Validar senha
        if not data.get('password'):
            errors['password'] = 'Senha é obrigatória'
        
        return errors