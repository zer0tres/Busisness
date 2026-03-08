"""Script para criar tabelas em producao"""
import os
os.environ['DATABASE_URL'] = 'postgresql://postgres:RZSifmyFreMJqQBfzQRscjwWoWuIzXnN@postgres.railway.internal:5432/railway'

from app import create_app, db
app = create_app()
with app.app_context():
    db.create_all()
    print('✅ Tabelas criadas!')
    
    # Criar empresa e usuário admin
    from app.models.company import Company
    from app.models.user import User
    
    if not Company.query.first():
        company = Company(name='Empresa Demo', slug='empresa-demo', business_type='outros', email='admin@busisness.com')
        db.session.add(company)
        db.session.flush()
        
        user = User(name='Admin', email='admin@busisness.com', company_id=company.id, is_admin=True)
        user.set_password('admin123')
        db.session.add(user)
        db.session.commit()
        print('✅ Admin criado!')
    else:
        print('ℹ️ Dados já existem')
