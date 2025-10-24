import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  PrestashopOrder,
  PrestashopOrderDetail,
  PrestashopProduct,
} from '../types.js';
import { PrestashopError } from '../utils/error.utils.js';
import { REQUEST_TIMEOUT } from '../constants.js';

export interface OrderFilters {
  date_add?: string; // Format: [date_from,date_to]
  current_state?: number;
  id_customer?: number;
}

export interface OrderDetailFilters {
  id_order?: number;
  product_id?: number;
}

interface ApiOrderResponse {
  order?: PrestashopOrder;
  [key: string]: unknown;
}

interface ApiOrderDetailResponse {
  order_detail?: PrestashopOrderDetail;
  [key: string]: unknown;
}

interface ApiProductResponse {
  product?: PrestashopProduct;
  products?: PrestashopProduct[];
  [key: string]: unknown;
}

export class PrestashopApiService {
  private baseUrl: string;
  private wsKey: string;

  constructor(baseUrl: string, wsKey: string) {
    this.baseUrl = `${baseUrl}/api`;
    this.wsKey = wsKey;
  }

  /**
   * Récupère les commandes avec filtres optionnels
   */
  async getOrders(filters: OrderFilters = {}): Promise<PrestashopOrder[]> {
    try {
      const params: Record<string, string> = {
        output_format: 'JSON',
        display: 'full',
        limit: '100',
      };

      if (filters.date_add) {
        params['filter[date_add]'] = filters.date_add;
        params['date'] = '1';
      }

      if (filters.current_state) {
        params['filter[current_state]'] = String(filters.current_state);
      }

      if (filters.id_customer) {
        params['filter[id_customer]'] = String(filters.id_customer);
      }

      const response = await axios.get<{ orders?: ApiOrderResponse | ApiOrderResponse[] }>(`${this.baseUrl}/orders`, {
        params,
        auth: { username: this.wsKey, password: '' },
        timeout: REQUEST_TIMEOUT,
      });

      if (!response.data.orders) {
        return [];
      }

      // API PrestaShop retourne soit un objet unique soit un array
      const orders = Array.isArray(response.data.orders)
        ? response.data.orders
        : [response.data.orders];

      return orders.map((o: ApiOrderResponse) => o.order || (o as unknown as PrestashopOrder));
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return []; // Aucune commande trouvée
      }
      throw error;
    }
  }

  /**
   * Récupère les détails de commande avec pagination
   */
  async getOrderDetails(
    filters: OrderDetailFilters = {},
    limit = 100,
    offset = 0
  ): Promise<PrestashopOrderDetail[]> {
    try {
      const params: Record<string, string> = {
        output_format: 'JSON',
        display: 'full',
        limit: `${String(offset)},${String(limit)}`,
      };

      if (filters.id_order) {
        params['filter[id_order]'] = String(filters.id_order);
      }

      if (filters.product_id) {
        params['filter[product_id]'] = String(filters.product_id);
      }

      const response = await axios.get<{ order_details?: ApiOrderDetailResponse | ApiOrderDetailResponse[] }>(`${this.baseUrl}/order_details`, {
        params,
        auth: { username: this.wsKey, password: '' },
        timeout: REQUEST_TIMEOUT,
      });

      if (!response.data.order_details) {
        return [];
      }

      const details = Array.isArray(response.data.order_details)
        ? response.data.order_details
        : [response.data.order_details];

      return details.map((d: ApiOrderDetailResponse) => d.order_detail || (d as unknown as PrestashopOrderDetail));
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return [];
      }
      throw error;
    }
  }

  /**
   * Récupère un produit par ID
   */
  async getProduct(productId: number): Promise<PrestashopProduct> {
    try {
      const response = await axios.get<ApiProductResponse>(`${this.baseUrl}/products/${String(productId)}`, {
        params: { output_format: 'JSON', display: 'full' },
        auth: { username: this.wsKey, password: '' },
        timeout: REQUEST_TIMEOUT,
      });

      // PrestaShop peut retourner soit {product: {...}} soit {products: [{...}]}
      let product: PrestashopProduct | undefined;

      if (response.data.products && Array.isArray(response.data.products) && response.data.products.length > 0) {
        product = response.data.products[0];
      } else if (response.data.product) {
        product = response.data.product;
      }

      if (!product) {
        throw new PrestashopError(
          'PRODUCT_NOT_FOUND',
          `Product with ID ${String(productId)} not found`,
          'Verify the product_id parameter exists in your PrestaShop catalog'
        );
      }

      return product;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        throw new PrestashopError(
          'PRODUCT_NOT_FOUND',
          `Product with ID ${String(productId)} not found`,
          'Verify the product_id parameter exists in your PrestaShop catalog'
        );
      }
      throw error;
    }
  }

  /**
   * Fetch all order details avec pagination automatique
   */
  async getAllOrderDetails(
    filters: OrderDetailFilters = {}
  ): Promise<PrestashopOrderDetail[]> {
    const allDetails: PrestashopOrderDetail[] = [];
    let offset = 0;
    const batchSize = 100;
    const maxResults = 1000; // Safety limit

    for (;;) {
      const batch = await this.getOrderDetails(filters, batchSize, offset);

      if (batch.length === 0) {
        break;
      }

      allDetails.push(...batch);
      offset += batchSize;

      if (allDetails.length >= maxResults) {
        console.warn(`Reached maximum of ${String(maxResults)} order details`);
        break;
      }

      if (batch.length < batchSize) {
        break; // Last page
      }
    }

    return allDetails;
  }
}
