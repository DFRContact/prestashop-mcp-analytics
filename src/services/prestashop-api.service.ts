import axios from 'axios';
import {
  PrestashopOrder,
  PrestashopOrderDetail,
  PrestashopProduct,
} from '../types.js';
import { PrestashopError } from '../utils/error.utils.js';
import { REQUEST_TIMEOUT } from '../constants.js';

export interface OrderFilters {
  date_add?: string; // Format: [date_from,date_to]
  current_state?: number | number[]; // Single state or array of states
  id_customer?: number;
}

export interface OrderDetailFilters {
  id_order?: number | string; // Can be number or string like "[1|2|3]" for OR filter
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
  async getOrders(
    filters: OrderFilters = {},
    limit = 100,
    offset = 0
  ): Promise<PrestashopOrder[]> {
    try {
      const params: Record<string, string> = {
        output_format: 'JSON',
        display: '[id,id_customer,date_add,current_state,total_paid_tax_incl,total_paid_tax_excl]',
        limit: offset > 0 ? `${String(offset)},${String(limit)}` : String(limit),
      };

      if (filters.date_add) {
        params['filter[date_add]'] = filters.date_add;
        params['date'] = '1';
      }

      if (filters.current_state) {
        if (Array.isArray(filters.current_state)) {
          // Multiple states: use [state1|state2|state3] format
          params['filter[current_state]'] = `[${filters.current_state.join('|')}]`;
        } else {
          // Single state
          params['filter[current_state]'] = String(filters.current_state);
        }
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
   * Récupère toutes les commandes avec pagination automatique
   */
  async getAllOrders(filters: OrderFilters = {}): Promise<PrestashopOrder[]> {
    const allOrders: PrestashopOrder[] = [];
    let offset = 0;
    const batchSize = 100;

    // Safety limit: higher when date filter is used (more specific query)
    // Without date filter: 10,000 max (all-time orders can be huge)
    // With date filter: 50,000 max (single year should be reasonable)
    const maxResults = filters.date_add ? 50000 : 10000;

    for (;;) {
      const batch = await this.getOrders(filters, batchSize, offset);

      if (batch.length === 0) {
        break;
      }

      allOrders.push(...batch);
      offset += batchSize;

      if (allOrders.length >= maxResults) {
        console.warn(`Reached maximum of ${String(maxResults)} orders${filters.date_add ? ` for period ${filters.date_add}` : ''}`);
        break;
      }

      if (batch.length < batchSize) {
        break; // Last page
      }
    }

    return allOrders;
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
        display: '[id,id_order,product_id,product_name,product_reference,product_quantity,unit_price_tax_incl,unit_price_tax_excl,total_price_tax_incl,total_price_tax_excl]',
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
        params: {
          output_format: 'JSON',
          display: '[id,name,reference,active]'
        },
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
   * Recherche des produits par nom (multi-langues)
   * PrestaShop stocke les noms par langue, donc on récupère et filtre côté serveur
   *
   * Performance: ~200-250ms pour 500 produits sur PrestaShop 1.7
   *
   * @param searchTerm Terme de recherche (case-insensitive, partial match)
   * @param limit Nombre maximum de résultats à retourner (default: 50)
   * @param maxFetch Nombre maximum de produits à récupérer de l'API (default: 500)
   */
  async searchProducts(searchTerm: string, limit = 50, maxFetch = 500): Promise<PrestashopProduct[]> {
    const startTime = Date.now();

    try {
      // Validation du terme de recherche
      if (!searchTerm || searchTerm.trim().length === 0) {
        return [];
      }

      // Normaliser le terme de recherche (minuscules, trim)
      const searchLower = searchTerm.toLowerCase().trim();

      // Optimisation: réduire maxFetch si on cherche peu de résultats
      const optimizedLimit = limit <= 10 ? Math.min(maxFetch, 300) : maxFetch;

      // Récupérer les produits actifs
      const params: Record<string, string> = {
        output_format: 'JSON',
        display: '[id,name,reference,active]', // Minimal fields for performance
        limit: String(optimizedLimit),
        'filter[active]': '1', // Active products only
      };

      const response = await axios.get<{ products?: ApiProductResponse | ApiProductResponse[] }>(`${this.baseUrl}/products`, {
        params,
        auth: { username: this.wsKey, password: '' },
        timeout: REQUEST_TIMEOUT,
      });

      if (!response.data.products) {
        return [];
      }

      const products = Array.isArray(response.data.products)
        ? response.data.products
        : [response.data.products];

      const allProducts = products.map((p: ApiProductResponse) => p.product || (p as unknown as PrestashopProduct));

      // Filtrer par nom côté serveur (in-memory filtering is instant: ~0-1ms)
      const matchingProducts = allProducts.filter((product) => {
        // Le nom peut être un string ou un objet multi-langues
        if (typeof product.name === 'string') {
          return product.name.toLowerCase().includes(searchLower);
        } else if (Array.isArray(product.name)) {
          // Format multi-langues : [{id: '1', value: 'Name EN'}, {id: '2', value: 'Name FR'}]
          return product.name.some((lang: any) =>
            lang.value && lang.value.toLowerCase().includes(searchLower)
          );
        } else if (typeof product.name === 'object' && product.name !== null) {
          // Autre format possible
          return Object.values(product.name).some((val: any) =>
            typeof val === 'string' && val.toLowerCase().includes(searchLower)
          );
        }
        return false;
      });

      const elapsed = Date.now() - startTime;

      // Log de performance (stderr pour ne pas polluer stdout)
      if (process.env.LOG_LEVEL === 'debug') {
        console.error(`[searchProducts] Found ${matchingProducts.length} matches in ${elapsed}ms (scanned ${allProducts.length} products)`);
      }

      // Limiter les résultats
      return matchingProducts.slice(0, limit);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return []; // Aucun produit trouvé
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
