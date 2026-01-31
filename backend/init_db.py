from app import create_app, db
from app.models import User, Company

def init_database():
    """Inicializar o banco de dados"""
    app = create_app()
    
    with app.app_context():
        # Criar todas as tabelas
        db.create_all()
        print("✅ Tabelas criadas com sucesso!")
        
        # Verificar se já existe um admin
        admin = User.query.filter_by(email='admin@business.com').first()
        
        if not admin:
            # Criar empresa de exemplo
            company = Company(
                name='Empresa Demo',
                slug='empresa-demo',
                business_type='other',
                email='contato@empresademo.com',
                phone='(41) 99999-9999'
            )
            db.session.add(company)
            db.session.commit()
            
            # Criar usuário admin
            admin = User(
                email='admin@business.com',
                name='Administrador',
                is_admin=True,
                company_id=company.id
            )
            admin.set_password('admin123')
            db.session.add(admin)
            db.session.commit()
            
            print("✅ Usuário admin criado!")
            print(f"   Email: admin@business.com")
            print(f"   Senha: admin123")
            print(f"   Empresa: {company.name}")
        else:
            print("ℹ️  Usuário admin já existe")

if __name__ == '__main__':
    init_database()