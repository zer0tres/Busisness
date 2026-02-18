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

// ==================== TIPOS FINANCEIROS ====================

export interface FinancialCategory {
  id: number;
  company_id: number;
  name: string;
  type: 'income' | 'expense';
  color?: string;
  icon?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Transaction {
  id: number;
  company_id: number;
  category_id?: number;
  customer_id?: number;
  appointment_id?: number;
  type: 'income' | 'expense';
  amount: number;
  description?: string;
  payment_method?: string;
  transaction_date: string;
  status: 'pending' | 'completed' | 'cancelled';
  notes?: string;
  category?: FinancialCategory;
  customer?: Customer;
  created_at: string;
  updated_at?: string;
}

export interface AccountPayable {
  id: number;
  company_id: number;
  category_id?: number;
  supplier_name: string;
  description: string;
  amount: number;
  due_date: string;
  payment_date?: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  payment_method?: string;
  notes?: string;
  recurrence?: string;
  category?: FinancialCategory;
  created_at: string;
  updated_at?: string;
}

export interface AccountReceivable {
  id: number;
  company_id: number;
  customer_id?: number;
  category_id?: number;
  description: string;
  amount: number;
  due_date: string;
  payment_date?: string;
  status: 'pending' | 'received' | 'overdue' | 'cancelled';
  payment_method?: string;
  notes?: string;
  recurrence?: string;
  customer?: Customer;
  category?: FinancialCategory;
  created_at: string;
  updated_at?: string;
}

export interface Invoice {
  id: number;
  company_id: number;
  customer_id?: number;
  transaction_id?: number;
  invoice_number: string;
  invoice_type: 'nfe' | 'nfse' | 'nfce' | 'receipt';
  status: 'issued' | 'received' | 'validated' | 'cancelled' | 'pending';
  issue_date: string;
  amount: number;
  tax_amount?: number;
  description?: string;
  access_key?: string;
  file_path?: string;
  file_name?: string;
  validation_date?: string;
  notes?: string;
  customer?: Customer;
  created_at: string;
  updated_at?: string;
}

export interface FinancialSummary {
  income: number;
  expenses: number;
  balance: number;
  payables_pending: number;
  receivables_pending: number;
  projected_balance: number;
}