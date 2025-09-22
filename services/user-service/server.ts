import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as path from 'path';
import { JsonDatabase } from '../../shared/JsonDatabase';
import { serviceRegistry } from '../../shared/serviceRegistry';
import { User, CreateUserRequest, LoginRequest, AuthResponse } from './types';

class UserService {
  private app: express.Application;
  private port: number = 3001;
  private usersDb!: JsonDatabase<User>;
  private jwtSecret: string = 'user-service-secret-key';

  constructor() {
    this.app = express();
    this.setupDatabase();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupDatabase(): void {
    const dbPath = path.join(__dirname, 'database');
    this.usersDb = new JsonDatabase<User>(dbPath, 'users');
    console.log('📊 User Service: Banco NoSQL inicializado');
  }

  private setupMiddleware(): void {
    this.app.use(cors());
    this.app.use(express.json());
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', async (req, res) => {
      try {
        const userCount = await this.usersDb.count();
        res.json({
          service: 'user-service',
          status: 'healthy',
          timestamp: new Date().toISOString(),
          database: { userCount }
        });
      } catch (error) {
        res.status(503).json({
          service: 'user-service',
          status: 'unhealthy',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Auth routes
    this.app.post('/auth/register', this.register.bind(this));
    this.app.post('/auth/login', this.login.bind(this));
    this.app.post('/auth/validate', this.validateToken.bind(this));

    // User routes
    this.app.get('/users/:id', this.authMiddleware.bind(this), this.getUser.bind(this));
    this.app.put('/users/:id', this.authMiddleware.bind(this), this.updateUser.bind(this));
  }

  private authMiddleware(req: express.Request & { user?: any }, res: express.Response, next: express.NextFunction): void {
    const authHeader = req.header('Authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Token obrigatório'
      });
      return;
    }

    const token = authHeader.replace('Bearer ', '');
    
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as any;
      req.user = decoded;
      next();
    } catch (error) {
      res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }
  }

  private async register(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { email, username, password, firstName, lastName, preferences }: CreateUserRequest = req.body;

      // Validações básicas
      if (!email || !username || !password || !firstName || !lastName) {
        res.status(400).json({
          success: false,
          message: 'Todos os campos são obrigatórios'
        });
        return;
      }

      // Verificar se usuário já existe
      const existingEmail = await this.usersDb.find({ email: email.toLowerCase() });
      const existingUsername = await this.usersDb.find({ username: username.toLowerCase() });

      if (existingEmail.length > 0) {
        res.status(409).json({
          success: false,
          message: 'Email já está em uso'
        });
        return;
      }

      if (existingUsername.length > 0) {
        res.status(409).json({
          success: false,
          message: 'Username já está em uso'
        });
        return;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Criar usuário
      const newUser = await this.usersDb.create({
        email: email.toLowerCase(),
        username: username.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
        preferences: {
          defaultStore: preferences?.defaultStore || 'Supermercado Padrão',
          currency: preferences?.currency || 'BRL'
        }
      });

      const { password: _, ...userWithoutPassword } = newUser;

      const token = jwt.sign(
        { 
          id: newUser.id, 
          email: newUser.email, 
          username: newUser.username
        },
        this.jwtSecret,
        { expiresIn: '24h' }
      );

      const response: AuthResponse = {
        success: true,
        message: 'Usuário criado com sucesso',
        data: { user: userWithoutPassword, token }
      };

      res.status(201).json(response);
    } catch (error) {
      console.error('Erro no registro:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  private async login(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { identifier, password }: LoginRequest = req.body;

      if (!identifier || !password) {
        res.status(400).json({
          success: false,
          message: 'Identificador e senha obrigatórios'
        });
        return;
      }

      // Buscar usuário por email ou username
      const users = await this.usersDb.find();
      const user = users.find(u => 
        u.email === identifier.toLowerCase() || 
        u.username === identifier.toLowerCase()
      );

      if (!user || !await bcrypt.compare(password, user.password)) {
        res.status(401).json({
          success: false,
          message: 'Credenciais inválidas'
        });
        return;
      }

      const { password: _, ...userWithoutPassword } = user;
      
      const token = jwt.sign(
        { 
          id: user.id, 
          email: user.email, 
          username: user.username
        },
        this.jwtSecret,
        { expiresIn: '24h' }
      );

      const response: AuthResponse = {
        success: true,
        message: 'Login realizado com sucesso',
        data: { user: userWithoutPassword, token }
      };

      res.json(response);
    } catch (error) {
      console.error('Erro no login:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  private async validateToken(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { token } = req.body;

      if (!token) {
        res.status(400).json({
          success: false,
          message: 'Token obrigatório'
        });
        return;
      }

      const decoded = jwt.verify(token, this.jwtSecret) as any;
      const user = await this.usersDb.findById(decoded.id);

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Usuário não encontrado'
        });
        return;
      }

      const { password: _, ...userWithoutPassword } = user;

      res.json({
        success: true,
        message: 'Token válido',
        data: { user: userWithoutPassword }
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }
  }

  private async getUser(req: express.Request & { user?: any }, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = await this.usersDb.findById(id);

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
        return;
      }

      // Verificar permissão
      if (req.user.id !== id) {
        res.status(403).json({
          success: false,
          message: 'Acesso negado'
        });
        return;
      }

      const { password, ...userWithoutPassword } = user;

      res.json({
        success: true,
        data: userWithoutPassword
      });
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  private async updateUser(req: express.Request & { user?: any }, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;
      const { firstName, lastName, preferences } = req.body;

      // Verificar permissão
      if (req.user.id !== id) {
        res.status(403).json({
          success: false,
          message: 'Acesso negado'
        });
        return;
      }

      const user = await this.usersDb.findById(id);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
        return;
      }

      const updates: Partial<User> = {};
      if (firstName) updates.firstName = firstName;
      if (lastName) updates.lastName = lastName;
      if (preferences) {
        updates.preferences = {
          ...user.preferences,
          ...preferences
        };
      }

      const updatedUser = await this.usersDb.update(id, updates);
      const { password, ...userWithoutPassword } = updatedUser!;

      res.json({
        success: true,
        message: 'Usuário atualizado com sucesso',
        data: userWithoutPassword
      });
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  public start(): void {
    this.app.listen(this.port, () => {
      console.log('=====================================');
      console.log(`👤 User Service iniciado na porta ${this.port}`);
      console.log(`🔗 URL: http://localhost:${this.port}`);
      console.log(`❤️  Health: http://localhost:${this.port}/health`);
      console.log('=====================================');
      
      // Registrar no service registry
      serviceRegistry.register('user-service', {
        url: `http://localhost:${this.port}`,
        version: '1.0.0'
      });
    });
  }
}

// Start service
if (require.main === module) {
  const userService = new UserService();
  userService.start();

  // Graceful shutdown
  process.on('SIGTERM', () => {
    serviceRegistry.unregister('user-service');
    process.exit(0);
  });
  process.on('SIGINT', () => {
    serviceRegistry.unregister('user-service');
    process.exit(0);
  });
}

export default UserService;
