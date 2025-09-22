import express from 'express';
import cors from 'cors';
import * as path from 'path';
import { JsonDatabase } from '../../shared/JsonDatabase';
import { serviceRegistry } from '../../shared/serviceRegistry';
import { Item, CreateItemRequest, UpdateItemRequest } from './types';
import { seedItems } from './seedData';

class ItemService {
  private app: express.Application;
  private port: number = 3002;
  private itemsDb!: JsonDatabase<Item>;

  constructor() {
    this.app = express();
    this.setupDatabase();
    this.setupMiddleware();
    this.setupRoutes();
    this.seedData();
  }

  private setupDatabase(): void {
    const dbPath = path.join(__dirname, 'database');
    this.itemsDb = new JsonDatabase<Item>(dbPath, 'items');
    console.log('📊 Item Service: Banco NoSQL inicializado');
  }

  private setupMiddleware(): void {
    this.app.use(cors());
    this.app.use(express.json());
  }

  private async seedData(): Promise<void> {
    setTimeout(async () => {
      try {
        const existingItems = await this.itemsDb.find();
        
        if (existingItems.length === 0) {
          console.log('🌱 Populando banco com dados iniciais...');
          
          for (const itemData of seedItems) {
            await this.itemsDb.create(itemData);
          }
          
          console.log(`✅ ${seedItems.length} itens criados no banco de dados`);
        } else {
          console.log(`📦 Banco já possui ${existingItems.length} itens`);
        }
      } catch (error) {
        console.error('❌ Erro ao popular banco:', error);
      }
    }, 1000);
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', async (req, res) => {
      try {
        const itemCount = await this.itemsDb.count();
        const activeItems = await this.itemsDb.count({ active: true });
        
        res.json({
          service: 'item-service',
          status: 'healthy',
          timestamp: new Date().toISOString(),
          database: { 
            itemCount,
            activeItems
          }
        });
      } catch (error) {
        res.status(503).json({
          service: 'item-service',
          status: 'unhealthy',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Item routes
    this.app.get('/items', this.getItems.bind(this));
    this.app.get('/items/:id', this.getItem.bind(this));
    this.app.post('/items', this.createItem.bind(this));
    this.app.put('/items/:id', this.updateItem.bind(this));
    this.app.delete('/items/:id', this.deleteItem.bind(this));
    
    // Category routes
    this.app.get('/categories', this.getCategories.bind(this));
    
    // Search route
    this.app.get('/search', this.searchItems.bind(this));
  }

  private async getItems(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { category, name, limit = '50' } = req.query;
      
      let filter: Partial<Item> = {};
      
      if (category) {
        filter.category = category as string;
      }
      
      let items = await this.itemsDb.find(filter);
      
      // Filtrar por nome se fornecido
      if (name) {
        const searchTerm = (name as string).toLowerCase();
        items = items.filter(item => 
          item.name.toLowerCase().includes(searchTerm)
        );
      }
      
      // Aplicar limite
      const limitNum = parseInt(limit as string);
      items = items.slice(0, limitNum);
      
      res.json({
        success: true,
        data: items,
        count: items.length
      });
    } catch (error) {
      console.error('Erro ao buscar itens:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  private async getItem(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;
      const item = await this.itemsDb.findById(id);

      if (!item) {
        res.status(404).json({
          success: false,
          message: 'Item não encontrado'
        });
        return;
      }

      res.json({
        success: true,
        data: item
      });
    } catch (error) {
      console.error('Erro ao buscar item:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  private async createItem(req: express.Request, res: express.Response): Promise<void> {
    try {
      const itemData: CreateItemRequest = req.body;

      if (!itemData.name || !itemData.category || !itemData.brand || !itemData.unit || !itemData.averagePrice) {
        res.status(400).json({
          success: false,
          message: 'Nome, categoria, marca, unidade e preço são obrigatórios'
        });
        return;
      }

      const newItem = await this.itemsDb.create({
        ...itemData,
        barcode: itemData.barcode || '',
        description: itemData.description || '',
        active: true
      });

      res.status(201).json({
        success: true,
        message: 'Item criado com sucesso',
        data: newItem
      });
    } catch (error) {
      console.error('Erro ao criar item:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  private async updateItem(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates: UpdateItemRequest = req.body;

      const item = await this.itemsDb.findById(id);
      if (!item) {
        res.status(404).json({
          success: false,
          message: 'Item não encontrado'
        });
        return;
      }

      const updatedItem = await this.itemsDb.update(id, updates);

      res.json({
        success: true,
        message: 'Item atualizado com sucesso',
        data: updatedItem
      });
    } catch (error) {
      console.error('Erro ao atualizar item:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  private async deleteItem(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;

      const item = await this.itemsDb.findById(id);
      if (!item) {
        res.status(404).json({
          success: false,
          message: 'Item não encontrado'
        });
        return;
      }

      // Soft delete - marcar como inativo
      await this.itemsDb.update(id, { active: false });

      res.json({
        success: true,
        message: 'Item removido com sucesso'
      });
    } catch (error) {
      console.error('Erro ao deletar item:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  private async getCategories(req: express.Request, res: express.Response): Promise<void> {
    try {
      const items = await this.itemsDb.find({ active: true });
      
      // Extrair categorias únicas
      const categories = [...new Set(items.map(item => item.category))]
        .map(category => ({
          name: category,
          itemCount: items.filter(item => item.category === category).length
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
      
      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  private async searchItems(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { q, limit = '20' } = req.query;

      if (!q) {
        res.status(400).json({
          success: false,
          message: 'Parâmetro de busca "q" é obrigatório'
        });
        return;
      }

      const searchTerm = q as string;
      const limitNum = parseInt(limit as string);
      
      // Buscar em nome, descrição e categoria
      const items = await this.itemsDb.search(searchTerm, ['name', 'description', 'category']);
      
      // Filtrar apenas itens ativos e aplicar limite
      const activeItems = items
        .filter(item => item.active)
        .slice(0, limitNum);

      res.json({
        success: true,
        data: {
          query: searchTerm,
          results: activeItems,
          count: activeItems.length
        }
      });
    } catch (error) {
      console.error('Erro na busca:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  public start(): void {
    this.app.listen(this.port, () => {
      console.log('=====================================');
      console.log(`🛒 Item Service iniciado na porta ${this.port}`);
      console.log(`🔗 URL: http://localhost:${this.port}`);
      console.log(`❤️  Health: http://localhost:${this.port}/health`);
      console.log('=====================================');
      
      // Registrar no service registry
      serviceRegistry.register('item-service', {
        url: `http://localhost:${this.port}`,
        version: '1.0.0'
      });
    });
  }
}

// Start service
if (require.main === module) {
  const itemService = new ItemService();
  itemService.start();

  // Graceful shutdown
  process.on('SIGTERM', () => {
    serviceRegistry.unregister('item-service');
    process.exit(0);
  });
  process.on('SIGINT', () => {
    serviceRegistry.unregister('item-service');
    process.exit(0);
  });
}

export default ItemService;
