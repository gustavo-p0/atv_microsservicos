import express from 'express';
import cors from 'cors';
import axios from 'axios';
import * as path from 'path';
import { JsonDatabase } from '../../shared/JsonDatabase';
import { serviceRegistry } from '../../shared/serviceRegistry';
import { ShoppingList, ListItem, CreateListRequest, UpdateListRequest, AddItemRequest, UpdateListItemRequest } from './types';

class ListService {
  private app: express.Application;
  private port: number = 3003;
  private listsDb!: JsonDatabase<ShoppingList>;

  constructor() {
    this.app = express();
    this.setupDatabase();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupDatabase(): void {
    const dbPath = path.join(__dirname, 'database');
    this.listsDb = new JsonDatabase<ShoppingList>(dbPath, 'lists');
    console.log('📊 List Service: Banco NoSQL inicializado');
  }

  private setupMiddleware(): void {
    this.app.use(cors());
    this.app.use(express.json());
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', async (req, res) => {
      try {
        const listCount = await this.listsDb.count();
        const activeLists = await this.listsDb.count({ status: 'active' });
        
        res.json({
          service: 'list-service',
          status: 'healthy',
          timestamp: new Date().toISOString(),
          database: { 
            listCount,
            activeLists
          }
        });
      } catch (error) {
        res.status(503).json({
          service: 'list-service',
          status: 'unhealthy',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // List routes
    this.app.post('/lists', this.authMiddleware.bind(this), this.createList.bind(this));
    this.app.get('/lists', this.authMiddleware.bind(this), this.getLists.bind(this));
    this.app.get('/lists/:id', this.authMiddleware.bind(this), this.getList.bind(this));
    this.app.put('/lists/:id', this.authMiddleware.bind(this), this.updateList.bind(this));
    this.app.delete('/lists/:id', this.authMiddleware.bind(this), this.deleteList.bind(this));
    
    // List items routes
    this.app.post('/lists/:id/items', this.authMiddleware.bind(this), this.addItemToList.bind(this));
    this.app.put('/lists/:id/items/:itemId', this.authMiddleware.bind(this), this.updateListItem.bind(this));
    this.app.delete('/lists/:id/items/:itemId', this.authMiddleware.bind(this), this.removeItemFromList.bind(this));
    
    // Summary route
    this.app.get('/lists/:id/summary', this.authMiddleware.bind(this), this.getListSummary.bind(this));
  }

  private async authMiddleware(req: express.Request & { user?: any }, res: express.Response, next: express.NextFunction): Promise<void> {
    const authHeader = req.header('Authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Token obrigatório'
      });
      return;
    }

    try {
      // Validar token com User Service
      const userService = serviceRegistry.discover('user-service');
      const response = await axios.post(`${userService.url}/auth/validate`, {
        token: authHeader.replace('Bearer ', '')
      }, { timeout: 5000 });

      if (response.data.success) {
        req.user = response.data.data.user;
        next();
      } else {
        res.status(401).json({
          success: false,
          message: 'Token inválido'
        });
      }
    } catch (error) {
      console.error('Erro na validação do token:', error);
      res.status(503).json({
        success: false,
        message: 'Serviço de autenticação indisponível'
      });
    }
  }

  private async createList(req: express.Request & { user?: any }, res: express.Response): Promise<void> {
    try {
      const { name, description }: CreateListRequest = req.body;

      if (!name) {
        res.status(400).json({
          success: false,
          message: 'Nome da lista é obrigatório'
        });
        return;
      }

      const newList = await this.listsDb.create({
        userId: req.user.id,
        name,
        description: description || '',
        status: 'active',
        items: [],
        summary: {
          totalItems: 0,
          purchasedItems: 0,
          estimatedTotal: 0
        }
      });

      res.status(201).json({
        success: true,
        message: 'Lista criada com sucesso',
        data: newList
      });
    } catch (error) {
      console.error('Erro ao criar lista:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  private async getLists(req: express.Request & { user?: any }, res: express.Response): Promise<void> {
    try {
      const lists = await this.listsDb.find({ userId: req.user.id });
      
      res.json({
        success: true,
        data: lists
      });
    } catch (error) {
      console.error('Erro ao buscar listas:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  private async getList(req: express.Request & { user?: any }, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;
      const list = await this.listsDb.findById(id);

      if (!list) {
        res.status(404).json({
          success: false,
          message: 'Lista não encontrada'
        });
        return;
      }

      // Verificar se a lista pertence ao usuário
      if (list.userId !== req.user.id) {
        res.status(403).json({
          success: false,
          message: 'Acesso negado'
        });
        return;
      }

      res.json({
        success: true,
        data: list
      });
    } catch (error) {
      console.error('Erro ao buscar lista:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  private async updateList(req: express.Request & { user?: any }, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates: UpdateListRequest = req.body;

      const list = await this.listsDb.findById(id);
      if (!list) {
        res.status(404).json({
          success: false,
          message: 'Lista não encontrada'
        });
        return;
      }

      // Verificar se a lista pertence ao usuário
      if (list.userId !== req.user.id) {
        res.status(403).json({
          success: false,
          message: 'Acesso negado'
        });
        return;
      }

      const updatedList = await this.listsDb.update(id, updates);

      res.json({
        success: true,
        message: 'Lista atualizada com sucesso',
        data: updatedList
      });
    } catch (error) {
      console.error('Erro ao atualizar lista:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  private async deleteList(req: express.Request & { user?: any }, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;

      const list = await this.listsDb.findById(id);
      if (!list) {
        res.status(404).json({
          success: false,
          message: 'Lista não encontrada'
        });
        return;
      }

      // Verificar se a lista pertence ao usuário
      if (list.userId !== req.user.id) {
        res.status(403).json({
          success: false,
          message: 'Acesso negado'
        });
        return;
      }

      await this.listsDb.delete(id);

      res.json({
        success: true,
        message: 'Lista removida com sucesso'
      });
    } catch (error) {
      console.error('Erro ao deletar lista:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  private async addItemToList(req: express.Request & { user?: any }, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;
      const { itemId, quantity, notes }: AddItemRequest = req.body;

      if (!itemId || !quantity) {
        res.status(400).json({
          success: false,
          message: 'ID do item e quantidade são obrigatórios'
        });
        return;
      }

      const list = await this.listsDb.findById(id);
      if (!list) {
        res.status(404).json({
          success: false,
          message: 'Lista não encontrada'
        });
        return;
      }

      // Verificar se a lista pertence ao usuário
      if (list.userId !== req.user.id) {
        res.status(403).json({
          success: false,
          message: 'Acesso negado'
        });
        return;
      }

      // Buscar dados do item no Item Service
      let itemData;
      try {
        const itemService = serviceRegistry.discover('item-service');
        const itemResponse = await axios.get(`${itemService.url}/items/${itemId}`, { timeout: 5000 });
        
        if (!itemResponse.data.success) {
          res.status(404).json({
            success: false,
            message: 'Item não encontrado'
          });
          return;
        }
        
        itemData = itemResponse.data.data;
      } catch (error) {
        res.status(503).json({
          success: false,
          message: 'Serviço de itens indisponível'
        });
        return;
      }

      // Verificar se item já existe na lista
      const existingItemIndex = list.items.findIndex(item => item.itemId === itemId);
      
      if (existingItemIndex >= 0) {
        // Atualizar quantidade do item existente
        list.items[existingItemIndex].quantity += quantity;
      } else {
        // Adicionar novo item
        const newListItem: ListItem = {
          itemId,
          itemName: itemData.name,
          quantity,
          unit: itemData.unit,
          estimatedPrice: itemData.averagePrice,
          purchased: false,
          notes: notes || '',
          addedAt: new Date().toISOString()
        };
        
        list.items.push(newListItem);
      }

      // Recalcular resumo
      this.calculateSummary(list);

      const updatedList = await this.listsDb.update(id, {
        items: list.items,
        summary: list.summary
      });

      res.json({
        success: true,
        message: 'Item adicionado à lista com sucesso',
        data: updatedList
      });
    } catch (error) {
      console.error('Erro ao adicionar item:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  private async updateListItem(req: express.Request & { user?: any }, res: express.Response): Promise<void> {
    try {
      const { id, itemId } = req.params;
      const updates: UpdateListItemRequest = req.body;

      const list = await this.listsDb.findById(id);
      if (!list) {
        res.status(404).json({
          success: false,
          message: 'Lista não encontrada'
        });
        return;
      }

      // Verificar se a lista pertence ao usuário
      if (list.userId !== req.user.id) {
        res.status(403).json({
          success: false,
          message: 'Acesso negado'
        });
        return;
      }

      const itemIndex = list.items.findIndex(item => item.itemId === itemId);
      if (itemIndex === -1) {
        res.status(404).json({
          success: false,
          message: 'Item não encontrado na lista'
        });
        return;
      }

      // Atualizar item
      if (updates.quantity !== undefined) {
        list.items[itemIndex].quantity = updates.quantity;
      }
      if (updates.purchased !== undefined) {
        list.items[itemIndex].purchased = updates.purchased;
      }
      if (updates.notes !== undefined) {
        list.items[itemIndex].notes = updates.notes;
      }

      // Recalcular resumo
      this.calculateSummary(list);

      const updatedList = await this.listsDb.update(id, {
        items: list.items,
        summary: list.summary
      });

      res.json({
        success: true,
        message: 'Item atualizado com sucesso',
        data: updatedList
      });
    } catch (error) {
      console.error('Erro ao atualizar item:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  private async removeItemFromList(req: express.Request & { user?: any }, res: express.Response): Promise<void> {
    try {
      const { id, itemId } = req.params;

      const list = await this.listsDb.findById(id);
      if (!list) {
        res.status(404).json({
          success: false,
          message: 'Lista não encontrada'
        });
        return;
      }

      // Verificar se a lista pertence ao usuário
      if (list.userId !== req.user.id) {
        res.status(403).json({
          success: false,
          message: 'Acesso negado'
        });
        return;
      }

      const itemIndex = list.items.findIndex(item => item.itemId === itemId);
      if (itemIndex === -1) {
        res.status(404).json({
          success: false,
          message: 'Item não encontrado na lista'
        });
        return;
      }

      // Remover item
      list.items.splice(itemIndex, 1);

      // Recalcular resumo
      this.calculateSummary(list);

      const updatedList = await this.listsDb.update(id, {
        items: list.items,
        summary: list.summary
      });

      res.json({
        success: true,
        message: 'Item removido da lista com sucesso',
        data: updatedList
      });
    } catch (error) {
      console.error('Erro ao remover item:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  private async getListSummary(req: express.Request & { user?: any }, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;

      const list = await this.listsDb.findById(id);
      if (!list) {
        res.status(404).json({
          success: false,
          message: 'Lista não encontrada'
        });
        return;
      }

      // Verificar se a lista pertence ao usuário
      if (list.userId !== req.user.id) {
        res.status(403).json({
          success: false,
          message: 'Acesso negado'
        });
        return;
      }

      res.json({
        success: true,
        data: list.summary
      });
    } catch (error) {
      console.error('Erro ao buscar resumo:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  private calculateSummary(list: ShoppingList): void {
    const totalItems = list.items.length;
    const purchasedItems = list.items.filter(item => item.purchased).length;
    const estimatedTotal = list.items.reduce((total, item) => {
      return total + (item.estimatedPrice * item.quantity);
    }, 0);

    list.summary = {
      totalItems,
      purchasedItems,
      estimatedTotal: Math.round(estimatedTotal * 100) / 100
    };
  }

  public start(): void {
    this.app.listen(this.port, () => {
      console.log('=====================================');
      console.log(`📝 List Service iniciado na porta ${this.port}`);
      console.log(`🔗 URL: http://localhost:${this.port}`);
      console.log(`❤️  Health: http://localhost:${this.port}/health`);
      console.log('=====================================');
      
      // Registrar no service registry
      serviceRegistry.register('list-service', {
        url: `http://localhost:${this.port}`,
        version: '1.0.0'
      });
    });
  }
}

// Start service
if (require.main === module) {
  const listService = new ListService();
  listService.start();

  // Graceful shutdown
  process.on('SIGTERM', () => {
    serviceRegistry.unregister('list-service');
    process.exit(0);
  });
  process.on('SIGINT', () => {
    serviceRegistry.unregister('list-service');
    process.exit(0);
  });
}

export default ListService;
