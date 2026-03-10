from app import create_app, db, register_frontend
from flask_migrate import upgrade
import logging

app = create_app()
register_frontend(app)

with app.app_context():
    try:
        upgrade()
        logging.info("Migrations aplicadas com sucesso")
    except Exception as e:
        logging.warning(f"Migration warning (nao critico): {e}")

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
