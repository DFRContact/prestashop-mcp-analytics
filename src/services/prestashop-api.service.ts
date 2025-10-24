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
  [key: string]: unknown;
}

export class PrestashopApiService {
  private client: AxiosInstance;

  constructor(baseUrl: string, wsKey: string) {
    this.client = axios.create({
      baseURL: `${baseUrl}/api`,
      timeout: REQUEST_TIMEOUT,
      auth: {
        username: wsKey,
        password: '',
      },
      params: {
        output_format: 'JSON',
      },
    });

    // Interceptor pour logging
    this.client.interceptors.request.use((config) => {
      console.error(`[API] ${config.method?.toUpperCase() ?? 'UNKNOWN'} ${config.url ?? 'unknown'}`);
      return config;
    });

    this.client.interceptors.response.use(
      (response) => {
        console.error(`[API] Response: ${String(response.status)}`);
        return response;
      },
      (error: AxiosError) => {
        console.error(`[API] Error: ${error.message}`);
        throw error;
      }
    );
  }

  /**
   * Récupère les commandes avec filtres optionnels
   */
  async getOrders(filters: OrderFilters = {}): Promise<PrestashopOrder[]> {
    try {
      const params: Record<string, string> = {
        display: 'full',
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

      const response = await this.client.get<{ orders?: ApiOrderResponse | ApiOrderResponse[] }>('/orders', { params });

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
        display: 'full',
        limit: `${String(offset)},${String(limit)}`,
      };

      if (filters.id_order) {
        params['filter[id_order]'] = String(filters.id_order);
      }

      if (filters.product_id) {
        params['filter[product_id]'] = String(filters.product_id);
      }

      const response = await this.client.get<{ order_details?: ApiOrderDetailResponse | ApiOrderDetailResponse[] }>('/order_details', { params });

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
      const response = await this.client.get<ApiProductResponse>(`/products/${String(productId)}`, {
        params: { display: 'full' },
      });

      const product = response.data.product;
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
