# Sahjo

Sistema SaaS de gestão para pequenos negócios — barbearias, estúdios de tatuagem, restaurantes e distribuidoras.

🌐 **Produção:** [www.sahjo.com.br](https://www.sahjo.com.br)

## 🚀 Funcionalidades

- Gestão de clientes
- Agendamento de horários
- Controle de estoque e produtos
- Módulo financeiro (receitas, despesas, contas a pagar/receber)
- Página pública de agendamento por slug (`/book/nome-da-empresa`)
- Notificações por email (cliente e lojista)
- Login com Google OAuth + Google Calendar
- Multi-tenant (cada lojista tem dados isolados)
- Sistema de assinaturas via Mercado Pago
- Trial gratuito de 30 dias

## 🛠️ Tecnologias

- **Backend:** Python 3.12 + Flask + SQLAlchemy + JWT + Gunicorn
- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS
- **Database:** PostgreSQL (produção) / SQLite (desenvolvimento)
- **Infra:** Railway (deploy automático via GitHub)
- **Pagamentos:** Mercado Pago Checkout Pro
- **Email:** Resend
- **Auth:** Google OAuth 2.0

## 📦 Setup Desenvolvimento

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python run.py
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## 🚢 Deploy

Deploy automático no Railway a cada push na branch `main`.
```bash
cd frontend && npm run build
cp -r dist/* ../backend/frontend_dist/
git add -A && git commit -m "mensagem" && git push
```

## 📝 Licença

MIT License