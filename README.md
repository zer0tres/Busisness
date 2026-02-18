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

## ________________EM DESENVOLVIMENTO________________

- Módulo Financeiro

.Registrar vendas/caixa
.Contas a pagar/receber
.Relatório financeiro
.Gráfico de faturamento mensal

- Área Pública para Clientes

.Landing page com catálogo
.Agendamento online (sem login)
.Galeria de trabalhos (portfólio)
.Página pública da empresa

- PWA + Recursos Mobile

.Progressive Web App (funciona offline)
.Instalável no celular
.Notificações push
.Integração WhatsApp

- Segurança e Controle

.Permissões de usuário (Admin vs Funcionário)
.Auditoria de ações
.Log de alterações
.Backup automático

- Deploy em Produção

.Deploy do backend (Heroku/Railway/Render)
.Deploy do frontend (Vercel/Netlify)
.Domain customizado
.CI/CD com GitHub Actions

- Melhorias Específicas

.Calendário visual de agendamentos
.Exportar relatórios (PDF/Excel)
Dark mode
Mais gráficos no dashboard
Sistema de notificações por email