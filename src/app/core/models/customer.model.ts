export interface Customer {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  createdAt: string;
  modifiedAt?: string | null;
}

export interface CustomerUpsert {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  address?: string | null;
}
