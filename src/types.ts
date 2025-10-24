// Interfaces globales pour PrestaShop API
export interface PrestashopOrder {
  id: number;
  id_customer: number;
  date_add: string;
  total_paid_tax_incl: string;
  total_paid_tax_excl: string;
  current_state: number;
}

export interface PrestashopOrderDetail {
  id: number;
  id_order: number;
  product_id: number;
  product_name: string;
  product_quantity: number;
  product_price: string;
  unit_price_tax_incl: string;
  unit_price_tax_excl: string;
  total_price_tax_incl: string;
  total_price_tax_excl: string;
  product_reference: string;
  date_add: string;
}

export interface PrestashopProduct {
  id: number;
  name: string | Array<{ value: string }>;
  reference: string;
  active: boolean;
}

// Output types
export interface ProductSalesStats {
  product_id: number;
  product_name: string;
  product_reference: string;
  period: {
    from: string;
    to: string;
  };
  sales: {
    total_quantity_sold: number;
    total_revenue_excl_tax: number;
    total_revenue_incl_tax: number;
    average_unit_price: number;
    number_of_orders: number;
  };
  orders: OrderSummary[];
  truncated: boolean;
  truncation_message?: string;
}

export interface OrderSummary {
  order_id: number;
  date: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface TopProduct {
  rank: number;
  product_id: number;
  product_name: string;
  product_reference: string;
  total_quantity_sold: number;
  total_revenue_incl_tax: number;
  number_of_orders: number;
  average_unit_price: number;
}

export interface TopProductsResult {
  period: {
    from: string;
    to: string;
  };
  sort_by: 'quantity' | 'revenue';
  total_products_found: number;
  products: TopProduct[];
  has_more: boolean;
  next_limit?: number;
}
