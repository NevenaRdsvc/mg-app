export interface Product {
  id: number;
  name: string;
  sku: string;
  description?: string | null;
  price: number;
  stockQuantity: number;
  isActive: boolean;
  createdAt: string;
  modifiedAt?: string | null;
}

export interface ProductUpsert {
  name: string;
  sku: string;
  description?: string | null;
  price: number;
  stockQuantity: number;
  isActive: boolean;
}
