# Sistema de Listas de Compras - Microsserviços

Sistema distribuído para gerenciamento de listas de compras utilizando arquitetura de microsserviços com TypeScript.

## 🏗️ Arquitetura

- **User Service** (porta 3001) - Gerenciamento de usuários e autenticação JWT
- **Item Service** (porta 3002) - Catálogo de itens/produtos com 25+ itens
- **List Service** (porta 3003) - Gerenciamento de listas de compras
- **API Gateway** (porta 3000) - Ponto único de entrada com roteamento

## 🚀 Como Executar

### 1. Instalar dependências

```bash
npm run install:all
```

### 2. Executar todos os serviços

```bash
npm start
```

### 3. Em outro terminal, executar demonstração

```bash
npm run demo
```

## 📋 Execução Manual (Desenvolvimento)

```bash
# Terminal 1 - User Service
cd services/user-service && npm start

# Terminal 2 - Item Service  
cd services/item-service && npm start

# Terminal 3 - List Service
cd services/list-service && npm start

# Terminal 4 - API Gateway
cd api-gateway && npm start

# Terminal 5 - Cliente Demo
node client-demo.js
```

## 🔍 Testes com cURL

```bash
# Health Check
curl http://localhost:3000/health

# Service Registry
curl http://localhost:3000/registry

# Registrar usuário
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "123456",
    "firstName": "Test",
    "lastName": "User"
  }'

# Listar itens
curl http://localhost:3000/api/items

# Buscar itens
curl "http://localhost:3000/api/search?q=arroz"
```

## 📊 Endpoints Principais

### User Service
- `POST /api/auth/register` - Cadastro de usuário
- `POST /api/auth/login` - Login
- `GET /api/users/:id` - Buscar usuário

### Item Service
- `GET /api/items` - Listar itens
- `GET /api/items/:id` - Buscar item específico
- `GET /api/items/categories` - Listar categorias
- `GET /api/search?q=termo` - Buscar itens

### List Service
- `POST /api/lists` - Criar lista
- `GET /api/lists` - Listar listas do usuário
- `POST /api/lists/:id/items` - Adicionar item à lista
- `GET /api/lists/:id/summary` - Resumo da lista

### API Gateway
- `GET /api/dashboard` - Dashboard agregado
- `GET /health` - Status de todos os serviços
- `GET /registry` - Lista de serviços registrados

## 🛠️ Tecnologias

- **Node.js** + **TypeScript**
- **Express.js** para APIs REST
- **JSON NoSQL** - Bancos baseados em arquivos
- **JWT** para autenticação
- **Service Discovery** via arquivo compartilhado
- **Circuit Breaker** para resiliência

## 📁 Estrutura do Projeto

```
lista-compras-microservices/
├── package.json
├── tsconfig.json
├── client-demo.js
├── shared/
│   ├── JsonDatabase.ts
│   └── serviceRegistry.ts
├── services/
│   ├── user-service/
│   ├── item-service/
│   └── list-service/
└── api-gateway/
```

## 🎯 Funcionalidades Demonstradas

- ✅ Registro e login de usuário
- ✅ Catálogo de itens com 25+ produtos
- ✅ Criação e gerenciamento de listas
- ✅ Adição de itens às listas
- ✅ Busca de itens no catálogo
- ✅ Dashboard agregado
- ✅ Health checks automáticos
- ✅ Service Discovery
- ✅ Circuit Breaker
- ✅ Autenticação JWT distribuída

## 🔧 Troubleshooting

Se algum serviço não estiver funcionando:

1. Verifique se todas as portas estão livres
2. Execute `npm run install:all` para instalar dependências
3. Verifique os logs de cada serviço
4. Teste a saúde: `curl http://localhost:3000/health`
