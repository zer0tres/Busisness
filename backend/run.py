from app import create_app
from flask import send_from_directory
import os

app = create_app('development')

frontend_folder = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'dist')

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    # Deixa o Flask resolver rotas /api/ normalmente
    # Só serve o frontend para rotas que NÃO são /api/
    if path.startswith('api/'):
        from flask import abort
        abort(404)
    
    if path and os.path.exists(os.path.join(frontend_folder, path)):
        return send_from_directory(frontend_folder, path)
    
    return send_from_directory(frontend_folder, 'index.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)