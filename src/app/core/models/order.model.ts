export type OrderStatus = 'Pending' | 'Confirmed' | 'Shipped' | 'Delivered' | 'Cancelled';

export const ORDER_STATUSES: OrderStatus[] = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];

/** Mirrors the allowed transitions in the backend OrderManager. */
export const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  Pending: ['Confirmed', 'Cancelled'],
  Confirmed: ['Shipped', 'Cancelled'],
  Shipped: ['Delivered'],
  Delivered: [],
  Cancelled: [],
};

export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Order {
  id: number;
  orderNumber: string;
  customerId: number;
  customerName: string;
  status: OrderStatus;
  totalAmount: number;
  note?: string | null;
  createdAt: string;
  modifiedAt?: string | null;
  items: OrderItem[];
}

export interface OrderCreate {
  customerId: number;
  note?: string | null;
  items: { productId: number; quantity: number }[];
}

export interface OrderFilter {
  status?: OrderStatus | null;
  customerId?: number | null;
  page: number;
  pageSize: number;
}
