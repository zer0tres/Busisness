from app import create_app, db, register_frontend
from flask_migrate import upgrade, stamp
from sqlalchemy import text
import logging

app = create_app()
register_frontend(app)

with app.app_context():
    try:
        with db.engine.connect() as conn:
            try:
                result = conn.execute(text("SELECT version_num FROM alembic_version")).fetchall()
                has_version = len(result) > 0
            except:
                has_version = False
        
        if not has_version:
            logging.info("Banco sem versao alembic - aplicando stamp head")
            stamp(revision='08f972b57a78')
        
        upgrade()
        logging.info("Migrations aplicadas com sucesso")
    except Exception as e:
        logging.warning(f"Migration warning: {e}")

    # Garantir colunas criadas mesmo se migration falhou
    try:
        with db.engine.connect() as conn:
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'owner'"))
            conn.execute(text("ALTER TABLE appointments ADD COLUMN IF NOT EXISTS employee_id INTEGER REFERENCES users(id)"))
            conn.execute(text("ALTER TABLE companies ADD COLUMN IF NOT EXISTS header_image_url TEXT"))
            conn.commit()
            logging.info("Colunas verificadas/criadas com sucesso")
    except Exception as e:
        logging.warning(f"Colunas ja existem ou erro: {e}")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
