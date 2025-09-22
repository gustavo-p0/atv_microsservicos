export interface ListItem {
  itemId: string;
  itemName: string; // cache do nome
  quantity: number;
  unit: string;
  estimatedPrice: number;
  purchased: boolean;
  notes?: string;
  addedAt: string;
}

export interface ListSummary {
  totalItems: number;
  purchasedItems: number;
  estimatedTotal: number;
}

export interface ShoppingList {
  id: string;
  userId: string;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'archived';
  items: ListItem[];
  summary: ListSummary;
  createdAt: string;
  updatedAt: string;
}

export interface CreateListRequest {
  name: string;
  description?: string;
}

export interface UpdateListRequest {
  name?: string;
  description?: string;
  status?: 'active' | 'completed' | 'archived';
}

export interface AddItemRequest {
  itemId: string;
  quantity: number;
  notes?: string;
}

export interface UpdateListItemRequest {
  quantity?: number;
  purchased?: boolean;
  notes?: string;
}
