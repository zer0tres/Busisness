# Busisness

Sistema de gestão multi-negócio para pequenas empresas (restaurantes, barbearias, estúdios de tatuagem, distribuidoras).

## 🚀 Funcionalidades

- ✅ Gestão de clientes
- ✅ Agendamento de horários
- ✅ Controle de estoque
- ✅ Área pública para clientes agendarem (sem app)
- ✅ Customizável por tipo de negócio

## 🛠️ Tecnologias

- **Backend**: Python 3.11 + Flask + SQLAlchemy + JWT
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Database**: PostgreSQL 15 + Redis
- **Infra**: Docker + Docker Compose

## 📦 Setup Desenvolvimento



### Pré-requisitos

- Python 3.11+
- Node.js 18+
- Docker Desktop



### Backend

cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
cp .env.example .env


### Frontend

cd frontend
npm install


### Docker

docker-compose up -d


## 📝 Licença

MIT License
