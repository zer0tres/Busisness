from app import create_app, db, register_frontend
from flask_migrate import upgrade

app = create_app()
register_frontend(app)

with app.app_context():
    upgrade()  # roda todas as migrations pendentes automaticamente

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)