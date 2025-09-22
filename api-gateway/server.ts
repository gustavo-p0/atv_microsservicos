import express from 'express';
import cors from 'cors';
import axios from 'axios';
import { serviceRegistry } from '../shared/serviceRegistry';

class APIGateway {
  private app: express.Application;
  private port: number = 3000;
  private circuitBreakers: Map<string, { failures: number; isOpen: boolean; lastFailure: number }> = new Map();

  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.startHealthChecks();
  }

  private setupMiddleware(): void {
    this.app.use(cors());
    this.app.use(express.json());
    
    // Request logging
    this.app.use((req, res, next) => {
      console.log(`${req.method} ${req.originalUrl} - ${req.ip}`);
      next();
    });
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      const services = serviceRegistry.listServices();
      res.json({
        service: 'api-gateway',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        architecture: 'Microservices with NoSQL',
        services: services,
        serviceCount: Object.keys(services).length
      });
    });

    // Service registry endpoint
    this.app.get('/registry', (req, res) => {
      const services = serviceRegistry.listServices();
      res.json({
        success: true,
        services: services,
        count: Object.keys(services).length,
        timestamp: new Date().toISOString()
      });
    });

    // User Service routes
    this.app.use('/api/auth', (req, res, next) => {
      this.proxyRequest('user-service', req, res, next);
    });

    this.app.use('/api/users', (req, res, next) => {
      this.proxyRequest('user-service', req, res, next);
    });

    // Item Service routes
    this.app.use('/api/items', (req, res, next) => {
      this.proxyRequest('item-service', req, res, next);
    });

    this.app.use('/api/products', (req, res, next) => {
      this.proxyRequest('item-service', req, res, next);
    });

    // List Service routes
    this.app.use('/api/lists', (req, res, next) => {
      this.proxyRequest('list-service', req, res, next);
    });

    // Endpoints agregados
    this.app.get('/api/dashboard', this.getDashboard.bind(this));
    this.app.get('/api/search', this.globalSearch.bind(this));
  }

  private async proxyRequest(serviceName: string, req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
    try {
      // Verificar circuit breaker
      if (this.isCircuitOpen(serviceName)) {
        res.status(503).json({
          success: false,
          message: `Serviço ${serviceName} temporariamente indisponível`,
          service: serviceName
        });
        return;
      }

      // Descobrir serviço
      const service = serviceRegistry.discover(serviceName);
      
      // Construir URL de destino
      const originalPath = req.originalUrl;
      let targetPath = '';
      
      if (serviceName === 'user-service') {
        // /api/users/auth/login -> /auth/login
        // /api/users/123 -> /users/123
        targetPath = originalPath.replace('/api/users', '');
        if (targetPath.startsWith('/auth')) {
          targetPath = targetPath.replace('/api', '');
        }
        if (!targetPath.startsWith('/')) {
          targetPath = '/' + targetPath;
        }
        if (targetPath === '/' || targetPath === '') {
          targetPath = '/users';
        }
      } else if (serviceName === 'item-service') {
        // /api/items -> /items
        targetPath = originalPath.replace('/api/items', '');
        if (!targetPath.startsWith('/')) {
          targetPath = '/' + targetPath;
        }
        if (targetPath === '/' || targetPath === '') {
          targetPath = '/items';
        }
      } else if (serviceName === 'list-service') {
        // /api/lists -> /lists
        targetPath = originalPath.replace('/api/lists', '');
        if (!targetPath.startsWith('/')) {
          targetPath = '/' + targetPath;
        }
        if (targetPath === '/' || targetPath === '') {
          targetPath = '/lists';
        }
      }
      
      const targetUrl = `${service.url}${targetPath}`;
      
      // Configurar requisição
      const config = {
        method: req.method,
        url: targetUrl,
        headers: { ...req.headers },
        timeout: 10000,
        validateStatus: (status: number) => status < 500
      };

      // Adicionar body para requisições POST/PUT/PATCH
      if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        (config as any).data = req.body;
      }

      // Adicionar query parameters
      if (Object.keys(req.query).length > 0) {
        (config as any).params = req.query;
      }

      // Remover headers problemáticos
      delete config.headers.host;
      delete config.headers['content-length'];

      // Fazer requisição
      const response = await axios(config);
      
      // Resetar circuit breaker em caso de sucesso
      this.resetCircuitBreaker(serviceName);
      
      // Retornar resposta
      res.status(response.status).json(response.data);

    } catch (error: any) {
      // Registrar falha
      this.recordFailure(serviceName);
      
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        res.status(503).json({
          success: false,
          message: `Serviço ${serviceName} indisponível`,
          service: serviceName,
          error: error.code
        });
      } else if (error.response) {
        // Encaminhar resposta de erro do serviço
        res.status(error.response.status).json(error.response.data);
      } else {
        res.status(500).json({
          success: false,
          message: 'Erro interno do gateway',
          service: 'api-gateway',
          error: error.message
        });
      }
    }
  }

  // Circuit Breaker
  private isCircuitOpen(serviceName: string): boolean {
    const breaker = this.circuitBreakers.get(serviceName);
    if (!breaker) return false;

    const now = Date.now();
    
    // Verificar se o circuito deve ser meio-aberto
    if (breaker.isOpen && (now - breaker.lastFailure) > 30000) { // 30 segundos
      breaker.isOpen = false;
      console.log(`Circuit breaker half-open for ${serviceName}`);
      return false;
    }

    return breaker.isOpen;
  }

  private recordFailure(serviceName: string): void {
    let breaker = this.circuitBreakers.get(serviceName) || {
      failures: 0,
      isOpen: false,
      lastFailure: 0
    };

    breaker.failures++;
    breaker.lastFailure = Date.now();

    // Abrir circuito após 3 falhas
    if (breaker.failures >= 3) {
      breaker.isOpen = true;
      console.log(`Circuit breaker opened for ${serviceName}`);
    }

    this.circuitBreakers.set(serviceName, breaker);
  }

  private resetCircuitBreaker(serviceName: string): void {
    const breaker = this.circuitBreakers.get(serviceName);
    if (breaker) {
      breaker.failures = 0;
      breaker.isOpen = false;
    }
  }

  // Dashboard agregado
  private async getDashboard(req: express.Request, res: express.Response): Promise<void> {
    try {
      const authHeader = req.header('Authorization');
      
      if (!authHeader) {
        res.status(401).json({
          success: false,
          message: 'Token de autenticação obrigatório'
        });
        return;
      }

      // Buscar dados de múltiplos serviços
      const [userResponse, itemsResponse, categoriesResponse] = await Promise.allSettled([
        this.callService('user-service', '/users', 'GET', authHeader),
        this.callService('item-service', '/items', 'GET', null, { limit: '10' }),
        this.callService('item-service', '/categories', 'GET', null, {})
      ]);

      const dashboard = {
        timestamp: new Date().toISOString(),
        architecture: 'Microservices with NoSQL',
        database_approach: 'Database per Service',
        services_status: serviceRegistry.listServices(),
        data: {
          users: {
            available: userResponse.status === 'fulfilled',
            data: userResponse.status === 'fulfilled' ? userResponse.value : null,
            error: userResponse.status === 'rejected' ? userResponse.reason.message : null
          },
          items: {
            available: itemsResponse.status === 'fulfilled',
            data: itemsResponse.status === 'fulfilled' ? itemsResponse.value : null,
            error: itemsResponse.status === 'rejected' ? itemsResponse.reason.message : null
          },
          categories: {
            available: categoriesResponse.status === 'fulfilled',
            data: categoriesResponse.status === 'fulfilled' ? categoriesResponse.value : null,
            error: categoriesResponse.status === 'rejected' ? categoriesResponse.reason.message : null
          }
        }
      };

      res.json({
        success: true,
        data: dashboard
      });

    } catch (error) {
      console.error('Erro no dashboard:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao agregar dados do dashboard'
      });
    }
  }

  // Busca global entre serviços
  private async globalSearch(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { q } = req.query;

      if (!q) {
        res.status(400).json({
          success: false,
          message: 'Parâmetro de busca "q" é obrigatório'
        });
        return;
      }

      // Buscar em itens
      const itemResults = await this.callService('item-service', '/search', 'GET', null, { q });

      const results = {
        query: q,
        items: {
          available: true,
          results: itemResults.data?.results || [],
          count: itemResults.data?.count || 0
        }
      };

      res.json({
        success: true,
        data: results
      });

    } catch (error) {
      console.error('Erro na busca global:', error);
      res.status(500).json({
        success: false,
        message: 'Erro na busca'
      });
    }
  }

  // Helper para chamar serviços
  private async callService(serviceName: string, path: string, method: string = 'GET', authHeader: string | null = null, params: any = {}): Promise<any> {
    const service = serviceRegistry.discover(serviceName);
    
    const config: any = {
      method,
      url: `${service.url}${path}`,
      timeout: 5000
    };

    if (authHeader) {
      config.headers = { Authorization: authHeader };
    }

    if (method === 'GET' && Object.keys(params).length > 0) {
      config.params = params;
    }

    const response = await axios(config);
    return response.data;
  }

  // Health checks para serviços registrados
  private startHealthChecks(): void {
    setInterval(async () => {
      const services = serviceRegistry.listServices();
      
      for (const [serviceName, serviceInfo] of Object.entries(services)) {
        try {
          await axios.get(`${serviceInfo.url}/health`, { timeout: 5000 });
          serviceRegistry.updateHealth(serviceName, true);
        } catch (error) {
          console.error(`Health check falhou para ${serviceName}:`, error);
          serviceRegistry.updateHealth(serviceName, false);
        }
      }
    }, 30000); // A cada 30 segundos
  }

  public start(): void {
    this.app.listen(this.port, () => {
      console.log('=====================================');
      console.log(`🚪 API Gateway iniciado na porta ${this.port}`);
      console.log(`🔗 URL: http://localhost:${this.port}`);
      console.log(`❤️  Health: http://localhost:${this.port}/health`);
      console.log(`📋 Registry: http://localhost:${this.port}/registry`);
      console.log(`📊 Dashboard: http://localhost:${this.port}/api/dashboard`);
      console.log('=====================================');
      console.log('Rotas disponíveis:');
      console.log('   POST /api/auth/register');
      console.log('   POST /api/auth/login');
      console.log('   GET  /api/users/:id');
      console.log('   GET  /api/items');
      console.log('   GET  /api/lists');
      console.log('   GET  /api/search?q=termo');
      console.log('   GET  /api/dashboard');
      console.log('=====================================');
    });
  }
}

// Start gateway
if (require.main === module) {
  const gateway = new APIGateway();
  gateway.start();

  // Graceful shutdown
  process.on('SIGTERM', () => process.exit(0));
  process.on('SIGINT', () => process.exit(0));
}

export default APIGateway;
