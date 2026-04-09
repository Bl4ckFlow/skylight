export interface User {
  id: string;
  email: string;
  role: 'Admin' | 'Employé' | 'SuperAdmin';
  company_id: string;
  must_change_password: boolean;
}

export interface Product {
  id: string;
  company_id: string;
  name: string;
  stock_quantity: number;
  buy_price: number;
  sell_price: number;
  category?: string;
  low_stock_threshold: number;
  created_at: string;
}

export interface Client {
  id: string;
  company_id: string;
  full_name: string;
  phone?: string;
  email?: string;
  address?: string;
  created_at: string;
}

export interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
}

export interface Order {
  id: string;
  company_id: string;
  client_id: string;
  client_name: string;
  status: 'En attente' | 'En cours' | 'Livrée';
  total_amount: number;
  notes?: string;
  created_at: string;
  items?: OrderItem[];
}

export interface Invoice {
  id: string;
  company_id: string;
  order_id: string;
  payment_status: 'Payé' | 'Non Payé';
  pdf_url?: string;
  created_at: string;
  total_amount: number;
  client_name: string;
  order_date: string;
}
