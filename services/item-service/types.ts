export interface Item {
  id: string;
  name: string;
  category: string;
  brand: string;
  unit: string; // "kg", "un", "litro"
  averagePrice: number;
  barcode: string;
  description: string;
  active: boolean;
  createdAt: string;
}

export interface CreateItemRequest {
  name: string;
  category: string;
  brand: string;
  unit: string;
  averagePrice: number;
  barcode?: string;
  description?: string;
}

export interface UpdateItemRequest {
  name?: string;
  category?: string;
  brand?: string;
  unit?: string;
  averagePrice?: number;
  barcode?: string;
  description?: string;
  active?: boolean;
}
