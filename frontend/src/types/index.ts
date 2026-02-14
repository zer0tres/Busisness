export interface User {
  id: number;
  email: string;
  name: string;
  is_active: boolean;
  is_admin: boolean;
  company_id: number;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: number;
  name: string;
  slug: string;
  business_type: string;
  email: string;
  phone: string;
  address: string;
  primary_color: string;
  logo_url: string | null;
  is_active: boolean;
  subscription_status: string;
  created_at: string;
  updated_at: string;
}

export interface LoginResponse {
  message: string;
  user: User;
  company: Company;
  access_token: string;
  refresh_token: string;
}

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  cpf?: string;
  address?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: number;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  customer_id: number;
  service_name: string;
  service_price: number;
  status: string;
  notes?: string;
  customer?: {
    id: number;
    name: string;
    email: string;
    phone: string;
  };
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  quantity: number;
  min_quantity: number;
  unit: string;
  cost_price?: number;
  sale_price?: number;
  category?: string;
  sku?: string;
  barcode?: string;
  is_low_stock: boolean;
  stock_value: number;
}