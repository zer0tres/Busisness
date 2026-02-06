#  API Documentation - Business Suite

Documentação completa de todos os endpoints da API.

**Base URL:** `http://localhost:5000/api`

---

##  Autenticação

Todos os endpoints protegidos requerem um token JWT no header:
```
Authorization: Bearer SEU_TOKEN_AQUI
```

---

##  Auth - Autenticação

### POST /auth/register
Registrar novo usuário e empresa.

**Request:**
```json
{
  "email": "usuario@email.com",
  "password": "senha123",
  "name": "Nome do Usuário",
  "company_name": "Minha Empresa",
  "business_type": "barbershop"
}
```

**Response (201):**
```json
{
  "message": "Usuário criado com sucesso",
  "user": { ... },
  "company": { ... },
  "access_token": "eyJ...",
  "refresh_token": "eyJ..."
}
```

---

### POST /auth/login
Fazer login no sistema.

**Request:**
```json
{
  "email": "admin@business.com",
  "password": "admin123"
}
```

**Response (200):**
```json
{
  "message": "Login realizado com sucesso",
  "user": {
    "id": 1,
    "email": "admin@business.com",
    "name": "Administrador",
    "is_admin": true,
    "company_id": 1
  },
  "company": { ... },
  "access_token": "eyJ...",
  "refresh_token": "eyJ..."
}
```

---

### GET /auth/me
Obter dados do usuário logado.

**Headers:** `Authorization: Bearer TOKEN`

**Response (200):**
```json
{
  "user": { ... },
  "company": { ... }
}
```

---

##  Customers - Clientes

### GET /customers
Listar clientes da empresa (com paginação e busca).

**Headers:** `Authorization: Bearer TOKEN`

**Query Params:**
- `page` (opcional): Número da página (padrão: 1)
- `per_page` (opcional): Itens por página (padrão: 20)
- `search` (opcional): Buscar por nome, email ou telefone

**Exemplos:**
```bash
# Listar todos
GET /customers

# Buscar por nome
GET /customers?search=João

# Página 2, 10 itens
GET /customers?page=2&per_page=10
```

**Response (200):**
```json
{
  "customers": [
    {
      "id": 1,
      "name": "João Silva",
      "email": "joao@email.com",
      "phone": "(41) 98765-4321",
      "cpf": "123.456.789-00",
      "address": "Rua das Flores, 123",
      "notes": null,
      "is_active": true,
      "created_at": "2026-01-31T14:08:50",
      "updated_at": "2026-01-31T14:08:50"
    }
  ],
  "total": 1,
  "page": 1,
  "per_page": 20,
  "pages": 1
}
```

---

### POST /customers
Criar novo cliente.

**Headers:** `Authorization: Bearer TOKEN`

**Request:**
```json
{
  "name": "João Silva",
  "email": "joao@email.com",
  "phone": "(41) 98765-4321",
  "cpf": "123.456.789-00",
  "address": "Rua das Flores, 123 - Curitiba/PR",
  "notes": "Cliente preferencial"
}
```

**Campos obrigatórios:**
- `name` (min: 3 caracteres)
- `phone`

**Response (201):**
```json
{
  "message": "Cliente criado com sucesso",
  "customer": { ... }
}
```

---

### GET /customers/:id
Obter detalhes de um cliente específico.

**Headers:** `Authorization: Bearer TOKEN`

**Response (200):**
```json
{
  "id": 1,
  "name": "João Silva",
  ...
}
```

**Errors:**
- `404`: Cliente não encontrado

---

### PUT /customers/:id
Atualizar dados de um cliente.

**Headers:** `Authorization: Bearer TOKEN`

**Request:**
```json
{
  "name": "João Silva Santos",
  "notes": "Cliente VIP"
}
```

**Response (200):**
```json
{
  "message": "Cliente atualizado com sucesso",
  "customer": { ... }
}
```

---

### DELETE /customers/:id
Deletar um cliente.

**Headers:** `Authorization: Bearer TOKEN`

**Response (200):**
```json
{
  "message": "Cliente deletado com sucesso"
}
```
---

## 📅 Appointments - Agendamentos

### GET /appointments
Listar agendamentos da empresa (com paginação e filtros).

**Headers:** `Authorization: Bearer TOKEN`

**Query Params:**
- `page` (opcional): Número da página (padrão: 1)
- `per_page` (opcional): Itens por página (padrão: 20)
- `date` (opcional): Filtrar por data (formato: YYYY-MM-DD)
- `status` (opcional): Filtrar por status (pending, confirmed, etc)
- `customer_id` (opcional): Filtrar por cliente

**Exemplos:**
```bash
# Listar todos
GET /appointments

# Filtrar por data
GET /appointments?date=2026-02-05

# Filtrar por status
GET /appointments?status=confirmed

# Combinar filtros
GET /appointments?date=2026-02-05&status=pending
```

**Response (200):**
```json
{
  "appointments": [
    {
      "id": 1,
      "appointment_date": "2026-02-05",
      "appointment_time": "14:00:00",
      "duration_minutes": 60,
      "service_name": "Corte de Cabelo",
      "service_price": 50.0,
      "status": "confirmed",
      "notes": "Cliente prefere tesoura",
      "customer": {
        "id": 2,
        "name": "Maria Santos",
        "email": "maria@email.com",
        "phone": "(41) 99876-5432"
      }
    }
  ],
  "total": 1,
  "page": 1,
  "per_page": 20,
  "pages": 1
}
```

---

### GET /appointments/today
Listar agendamentos de hoje.

**Headers:** `Authorization: Bearer TOKEN`

**Response (200):**
```json
{
  "date": "2026-02-05",
  "appointments": [...],
  "total": 3
}
```

---

### GET /appointments/availability
Verificar horários disponíveis em uma data.

**Headers:** `Authorization: Bearer TOKEN`

**Query Params:**
- `date` (obrigatório): Data para verificar (YYYY-MM-DD)

**Exemplo:**
```bash
GET /appointments/availability?date=2026-02-05
```

**Response (200):**
```json
{
  "date": "2026-02-05",
  "available_slots": [
    "09:00:00",
    "09:30:00",
    "10:00:00",
    "15:00:00",
    "15:30:00"
  ],
  "busy_slots": [
    {
      "start": "14:00:00",
      "end": "15:00:00",
      "appointment_id": 1
    }
  ]
}
```

---

### POST /appointments
Criar novo agendamento.

**Headers:** `Authorization: Bearer TOKEN`

**Request:**
```json
{
  "customer_id": 2,
  "appointment_date": "2026-02-05",
  "appointment_time": "14:00",
  "duration_minutes": 60,
  "service_name": "Corte de Cabelo",
  "service_price": 50.00,
  "notes": "Cliente prefere tesoura"
}
```

**Campos obrigatórios:**
- `customer_id`
- `appointment_date` (formato: YYYY-MM-DD)
- `appointment_time` (formato: HH:MM)
- `service_name`

**Response (201):**
```json
{
  "message": "Agendamento criado com sucesso",
  "appointment": { ... }
}
```

**Errors:**
- `404`: Cliente não encontrado
- `409`: Conflito de horário

---

### PUT /appointments/:id
Atualizar agendamento.

**Headers:** `Authorization: Bearer TOKEN`

**Request:**
```json
{
  "status": "confirmed",
  "notes": "Cliente confirmou por WhatsApp"
}
```

**Status disponíveis:**
- `pending`: Pendente
- `confirmed`: Confirmado
- `in_progress`: Em andamento
- `completed`: Concluído
- `cancelled`: Cancelado
- `no_show`: Cliente não compareceu

**Response (200):**
```json
{
  "message": "Agendamento atualizado com sucesso",
  "appointment": { ... }
}
```

---

### DELETE /appointments/:id
Deletar agendamento.

**Headers:** `Authorization: Bearer TOKEN`

**Response (200):**
```json
{
  "message": "Agendamento deletado com sucesso"
}
```

---
````

---

## ⚠️ Códigos de Erro

| Código | Significado |
|--------|-------------|
| 200 | Sucesso |
| 201 | Criado com sucesso |
| 400 | Dados inválidos |
| 401 | Não autenticado |
| 403 | Sem permissão |
| 404 | Não encontrado |
| 409 | Conflito (ex: email já existe) |
| 500 | Erro interno |

---

##  Testando com cURL
```bash
# 1. Fazer login e salvar token
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@business.com", "password": "admin123"}' \
  | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

# 2. Usar o token em requisições
curl -X GET http://localhost:5000/api/customers \
  -H "Authorization: Bearer $TOKEN"