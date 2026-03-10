from app import create_app, db, register_frontend
from flask_migrate import upgrade, stamp
from sqlalchemy import text
import logging

app = create_app()
register_frontend(app)

with app.app_context():
    try:
        # Verificar se alembic_version existe e está vazia
        with db.engine.connect() as conn:
            try:
                result = conn.execute(text("SELECT version_num FROM alembic_version")).fetchall()
                has_version = len(result) > 0
            except:
                has_version = False
        
        if not has_version:
            # Banco sem histórico: marcar estado atual como base
            logging.info("Banco sem versao alembic - aplicando stamp head")
            stamp(revision='08f972b57a78')
        
        upgrade()
        logging.info("Migrations aplicadas com sucesso")
    except Exception as e:
        logging.warning(f"Migration warning: {e}")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
