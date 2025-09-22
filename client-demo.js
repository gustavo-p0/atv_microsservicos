const axios = require('axios');

class MicroservicesClient {
  constructor(gatewayUrl = 'http://localhost:3000') {
    this.gatewayUrl = gatewayUrl;
    this.authToken = null;
    this.user = null;
    
    this.api = axios.create({
      baseURL: gatewayUrl,
      timeout: 10000
    });

    // Interceptor para adicionar token automaticamente
    this.api.interceptors.request.use(config => {
      if (this.authToken) {
        config.headers.Authorization = `Bearer ${this.authToken}`;
      }
      return config;
    });
  }

  // Registrar usuário
  async register(userData) {
    try {
      console.log('\n📝 Registrando usuário...');
      const response = await this.api.post('/api/auth/register', userData);
      
      if (response.data.success) {
        this.authToken = response.data.data.token;
        this.user = response.data.data.user;
        console.log(`✅ Usuário registrado: ${this.user.username}`);
        return response.data;
      } else {
        throw new Error(response.data.message || 'Falha no registro');
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      console.log(`❌ Erro no registro: ${message}`);
      throw error;
    }
  }

  // Fazer login
  async login(credentials) {
    try {
      console.log('\n🔐 Fazendo login...');
      const response = await this.api.post('/api/auth/login', credentials);
      
      if (response.data.success) {
        this.authToken = response.data.data.token;
        this.user = response.data.data.user;
        console.log(`✅ Login realizado: ${this.user.username}`);
        return response.data;
      } else {
        throw new Error(response.data.message || 'Falha no login');
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      console.log(`❌ Erro no login: ${message}`);
      throw error;
    }
  }

  // Buscar itens
  async getItems(filters = {}) {
    try {
      console.log('\n🛒 Buscando itens...');
      const response = await this.api.get('/api/items', { params: filters });
      
      if (response.data.success) {
        const items = response.data.data;
        console.log(`✅ Encontrados ${items.length} itens`);
        items.slice(0, 5).forEach((item, index) => {
          console.log(`   ${index + 1}. ${item.name} - R$ ${item.averagePrice} (${item.category})`);
        });
        return response.data;
      } else {
        console.log('❌ Resposta inválida do servidor');
        return { data: [] };
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      console.log(`❌ Erro ao buscar itens: ${message}`);
      return { data: [] };
    }
  }

  // Buscar categorias
  async getCategories() {
    try {
      console.log('\n📂 Buscando categorias...');
      const response = await this.api.get('/api/items/categories');
      
      if (response.data.success) {
        const categories = response.data.data;
        console.log(`✅ Encontradas ${categories.length} categorias`);
        categories.forEach((category, index) => {
          console.log(`   ${index + 1}. ${category.name} - ${category.itemCount} itens`);
        });
        return response.data;
      } else {
        console.log('❌ Resposta inválida do servidor');
        return { data: [] };
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      console.log(`❌ Erro ao buscar categorias: ${message}`);
      return { data: [] };
    }
  }

  // Criar lista de compras
  async createList(listData) {
    try {
      console.log('\n📝 Criando lista de compras...');
      
      if (!this.authToken) {
        throw new Error('Token de autenticação necessário');
      }

      const response = await this.api.post('/api/lists', listData);
      
      if (response.data.success) {
        console.log(`✅ Lista criada: ${response.data.data.name}`);
        return response.data;
      } else {
        throw new Error(response.data.message || 'Falha na criação da lista');
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      console.log(`❌ Erro ao criar lista: ${message}`);
      throw error;
    }
  }

  // Adicionar item à lista
  async addItemToList(listId, itemId, quantity = 1) {
    try {
      console.log(`\n➕ Adicionando item à lista ${listId}...`);
      
      if (!this.authToken) {
        throw new Error('Token de autenticação necessário');
      }

      const response = await this.api.post(`/api/lists/${listId}/items`, {
        itemId,
        quantity
      });
      
      if (response.data.success) {
        console.log(`✅ Item adicionado à lista`);
        return response.data;
      } else {
        throw new Error(response.data.message || 'Falha ao adicionar item');
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      console.log(`❌ Erro ao adicionar item: ${message}`);
      throw error;
    }
  }

  // Buscar listas do usuário
  async getLists() {
    try {
      console.log('\n📋 Buscando listas do usuário...');
      
      if (!this.authToken) {
        throw new Error('Token de autenticação necessário');
      }

      const response = await this.api.get('/api/lists');
      
      if (response.data.success) {
        const lists = response.data.data;
        console.log(`✅ Encontradas ${lists.length} listas`);
        lists.forEach((list, index) => {
          console.log(`   ${index + 1}. ${list.name} - ${list.summary.totalItems} itens (${list.status})`);
        });
        return response.data;
      } else {
        throw new Error(response.data.message || 'Falha ao buscar listas');
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      console.log(`❌ Erro ao buscar listas: ${message}`);
      throw error;
    }
  }

  // Dashboard agregado
  async getDashboard() {
    try {
      console.log('\n📊 Buscando dashboard...');
      
      if (!this.authToken) {
        throw new Error('Token de autenticação necessário para o dashboard');
      }

      const response = await this.api.get('/api/dashboard');
      
      if (response.data.success) {
        const dashboard = response.data.data;
        console.log('✅ Dashboard carregado:');
        console.log(`   Timestamp: ${dashboard.timestamp}`);
        console.log(`   Arquitetura: ${dashboard.architecture}`);
        console.log(`   Banco de Dados: ${dashboard.database_approach}`);
        console.log(`   Status dos Serviços:`);
        
        if (dashboard.services_status) {
          Object.entries(dashboard.services_status).forEach(([serviceName, serviceInfo]) => {
            const status = serviceInfo.healthy ? '✅ SAUDÁVEL' : '❌ INDISPONÍVEL';
            console.log(`     ${serviceName}: ${status}`);
          });
        }

        console.log(`   Usuários disponíveis: ${dashboard.data?.users?.available ? 'Sim' : 'Não'}`);
        console.log(`   Itens disponíveis: ${dashboard.data?.items?.available ? 'Sim' : 'Não'}`);
        console.log(`   Categorias disponíveis: ${dashboard.data?.categories?.available ? 'Sim' : 'Não'}`);
        
        return response.data;
      } else {
        throw new Error(response.data.message || 'Falha ao carregar dashboard');
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      console.log(`❌ Erro ao buscar dashboard: ${message}`);
      throw error;
    }
  }

  // Busca global
  async search(query) {
    try {
      console.log(`\n🔍 Buscando por: "${query}"`);
      const response = await this.api.get('/api/search', { params: { q: query } });
      
      if (response.data.success) {
        const results = response.data.data;
        console.log(`✅ Resultados para "${results.query}":`);
        
        if (results.items?.available) {
          console.log(`   Itens encontrados: ${results.items.count}`);
          results.items.results.slice(0, 3).forEach((item, index) => {
            console.log(`     ${index + 1}. ${item.name} - R$ ${item.averagePrice} (${item.category})`);
          });
        } else {
          console.log('   Serviço de itens indisponível');
        }
        
        return response.data;
      } else {
        throw new Error(response.data.message || 'Falha na busca');
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      console.log(`❌ Erro na busca: ${message}`);
      throw error;
    }
  }

  // Verificar saúde dos serviços
  async checkHealth() {
    try {
      console.log('\n❤️  Verificando saúde dos serviços...');
      
      const [gatewayHealth, registryInfo] = await Promise.allSettled([
        this.api.get('/health'),
        this.api.get('/registry')
      ]);

      if (gatewayHealth.status === 'fulfilled') {
        const health = gatewayHealth.value.data;
        console.log('✅ API Gateway: healthy');
        console.log(`   Arquitetura: ${health.architecture}`);
        
        if (registryInfo.status === 'fulfilled') {
          const services = registryInfo.value.data.services;
          console.log('   Serviços registrados:');
          
          Object.entries(services).forEach(([name, info]) => {
            const status = info.healthy ? '✅ SAUDÁVEL' : '❌ INDISPONÍVEL';
            console.log(`     ${name}: ${status} (${info.url})`);
          });
        } else {
          console.log('   ❌ Erro ao buscar registry:', registryInfo.reason?.message);
        }
      } else {
        console.log('❌ API Gateway indisponível:', gatewayHealth.reason?.message);
      }
      
      return { gatewayHealth, registryInfo };
    } catch (error) {
      console.log(`❌ Erro ao verificar saúde: ${error.message}`);
      throw error;
    }
  }

  // Demonstração completa
  async runDemo() {
    console.log('=====================================');
    console.log('🎯 Demo: Sistema de Listas de Compras');
    console.log('   Microsserviços com TypeScript');
    console.log('=====================================');

    try {
      // 1. Verificar saúde dos serviços
      await this.checkHealth();
      await this.delay(2000);

      // 2. Registrar usuário
      const uniqueId = Date.now();
      const userData = {
        email: `demo${uniqueId}@microservices.com`,
        username: `demo${uniqueId}`,
        password: 'demo123456',
        firstName: 'Demo',
        lastName: 'User',
        preferences: {
          defaultStore: 'Supermercado Demo',
          currency: 'BRL'
        }
      };

      let authSuccessful = false;
      try {
        await this.register(userData);
        authSuccessful = true;
      } catch (error) {
        console.log('\n🔄 Tentando login com usuário existente...');
        try {
          await this.login({
            identifier: userData.email,
            password: userData.password
          });
          authSuccessful = true;
        } catch (loginError) {
          console.log('❌ Login falhou, continuando sem autenticação...');
          authSuccessful = false;
        }
      }

      await this.delay(1000);

      // 3. Buscar itens
      await this.getItems({ limit: '10' });
      await this.delay(1000);

      // 4. Buscar categorias
      await this.getCategories();
      await this.delay(1000);

      // 5. Fazer busca
      await this.search('arroz');
      await this.delay(1000);

      // 6. Se autenticado, fazer operações que requerem auth
      if (authSuccessful && this.authToken) {
        // Buscar dashboard
        try {
          await this.getDashboard();
          await this.delay(1000);
        } catch (error) {
          console.log('❌ Dashboard não disponível:', error.message);
        }

        // Criar lista de compras
        try {
          const newList = await this.createList({
            name: 'Lista Demo',
            description: 'Lista de demonstração do sistema'
          });

          if (newList.success) {
            const listId = newList.data.id;
            console.log(`📝 Lista criada com ID: ${listId}`);
            
            // Adicionar alguns itens à lista
            await this.delay(1000);
            
            try {
              // Buscar alguns itens para adicionar
              const itemsResponse = await this.getItems({ limit: '3' });
              if (itemsResponse.data && itemsResponse.data.length > 0) {
                for (let i = 0; i < Math.min(2, itemsResponse.data.length); i++) {
                  const item = itemsResponse.data[i];
                  await this.addItemToList(listId, item.id, 1);
                  await this.delay(500);
                }
              }
            } catch (error) {
              console.log('❌ Erro ao adicionar itens:', error.message);
            }
          }
        } catch (error) {
          console.log('❌ Criação de lista falhou:', error.message);
        }

        // Buscar listas do usuário
        try {
          await this.getLists();
        } catch (error) {
          console.log('❌ Busca de listas falhou:', error.message);
        }
      } else {
        console.log('\n⚠️  Operações autenticadas puladas (sem token válido)');
      }

      console.log('\n=====================================');
      console.log('🎉 Demonstração concluída com sucesso!');
      console.log('=====================================');
      console.log('Padrões demonstrados:');
      console.log('   ✅ Service Discovery via Registry');
      console.log('   ✅ API Gateway com roteamento');
      console.log('   ✅ Circuit Breaker pattern');
      console.log('   ✅ Comunicação inter-service');
      console.log('   ✅ Endpoints agregados');
      console.log('   ✅ Health checks distribuídos');
      console.log('   ✅ Database per Service (NoSQL)');
      console.log('   ✅ JSON-based document storage');
      console.log('   ✅ TypeScript em todos os serviços');
      console.log('   ✅ Autenticação JWT distribuída');

    } catch (error) {
      console.error('❌ Erro na demonstração:', error.message);
      console.log('\n🔧 Verifique se todos os serviços estão rodando:');
      console.log('   User Service: http://localhost:3001/health');
      console.log('   Item Service: http://localhost:3002/health');
      console.log('   List Service: http://localhost:3003/health');
      console.log('   API Gateway: http://localhost:3000/health');
    }
  }

  // Helper para delay
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Executar demonstração
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log('Uso: node client-demo.js [opções]');
    console.log('');
    console.log('Opções:');
    console.log('  --health    Verificar apenas saúde dos serviços');
    console.log('  --items     Listar apenas itens');
    console.log('  --search    Fazer busca (requer termo: --search=termo)');
    console.log('  --help      Mostrar esta ajuda');
    console.log('');
    console.log('Sem argumentos: Executar demonstração completa');
    return;
  }

  const client = new MicroservicesClient();
  
  try {
    if (args.includes('--health')) {
      await client.checkHealth();
    } else if (args.includes('--items')) {
      await client.getItems();
    } else if (args.some(arg => arg.startsWith('--search'))) {
      const searchArg = args.find(arg => arg.startsWith('--search'));
      const searchTerm = searchArg.includes('=') ? searchArg.split('=')[1] : 'arroz';
      await client.search(searchTerm);
    } else {
      // Demonstração completa
      await client.runDemo();
    }
  } catch (error) {
    console.error('❌ Erro na execução:', error.message);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Erro crítico:', error.message);
    process.exit(1);
  });
}

module.exports = MicroservicesClient;
