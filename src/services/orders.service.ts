import { PrestashopApiService } from './prestashop-api.service.js';
import { ProductSalesStats, TopProduct, OrderSummary } from '../types.js';
import { validateDateRange } from '../utils/date.utils.js';
import { safeParseFloat } from '../utils/validation.utils.js';

export class OrdersService {
  constructor(private apiService: PrestashopApiService) {}

  /**
   * Agrège les statistiques de vente pour un produit
   * OPTIMISÉ: Filtre les commandes par date d'abord, puis récupère les order_details
   */
  async getProductSalesStats(
    productId: number,
    dateFrom: string,
    dateTo: string,
    orderStates?: number[]
  ): Promise<ProductSalesStats> {
    // 1. Validation
    validateDateRange(dateFrom, dateTo);

    // 2. Récupérer le produit
    const product = await this.apiService.getProduct(productId);

    // 3. Récupérer SEULEMENT les commandes de la période (OPTIMISATION)
    const orders = await this.apiService.getAllOrders({
      date_add: `[${dateFrom},${dateTo}]`,
      current_state: orderStates,
    });

    if (orders.length === 0) {
      // Aucune commande dans la période - retour rapide
      return this.buildEmptyStats(productId, product, dateFrom, dateTo);
    }

    // 4. Récupérer les order_details pour ce produit dans ces commandes
    const orderIds = orders.map((o) => o.id);
    const allDetails: typeof orders extends Array<infer T> ? any[] : never = [];

    // Traiter par batch de 20 commandes (évite les URLs trop longues)
    const batchSize = 20;
    for (let i = 0; i < orderIds.length; i += batchSize) {
      const batch = orderIds.slice(i, i + batchSize);
      const orderFilter = `[${batch.join('|')}]`; // Opérateur OR de PrestaShop

      const details = await this.apiService.getAllOrderDetails({
        id_order: orderFilter,
        product_id: productId,
      });

      allDetails.push(...details);
    }

    // 5. Agréger les stats
    let totalQuantity = 0;
    let totalRevenueExcl = 0;
    let totalRevenueIncl = 0;
    const orderMap = new Map<number, OrderSummary>();

    for (const detail of allDetails) {
      totalQuantity += Number(detail.product_quantity);
      totalRevenueExcl += safeParseFloat(detail.total_price_tax_excl, 'total_price_tax_excl');
      totalRevenueIncl += safeParseFloat(detail.total_price_tax_incl, 'total_price_tax_incl');

      if (!orderMap.has(detail.id_order)) {
        orderMap.set(detail.id_order, {
          order_id: detail.id_order,
          date: detail.date_add,
          quantity: Number(detail.product_quantity),
          unit_price: safeParseFloat(detail.unit_price_tax_incl, 'unit_price_tax_incl'),
          total_price: safeParseFloat(detail.total_price_tax_incl, 'total_price_tax_incl'),
        });
      } else {
        const existing = orderMap.get(detail.id_order);
        if (existing) {
          existing.quantity += Number(detail.product_quantity);
          existing.total_price += safeParseFloat(detail.total_price_tax_incl, 'total_price_tax_incl');
        }
      }
    }

    const ordersList = Array.from(orderMap.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Extract product name
    let productName = 'Unknown';
    if (typeof product.name === 'string') {
      productName = product.name;
    } else if (Array.isArray(product.name) && product.name.length > 0) {
      productName = product.name[0].value;
    }

    return {
      product_id: productId,
      product_name: productName,
      product_reference: product.reference,
      period: {
        from: dateFrom,
        to: dateTo,
      },
      sales: {
        total_quantity_sold: totalQuantity,
        total_revenue_excl_tax: totalRevenueExcl,
        total_revenue_incl_tax: totalRevenueIncl,
        average_unit_price:
          totalQuantity > 0 ? totalRevenueIncl / totalQuantity : 0,
        number_of_orders: ordersList.length,
      },
      orders: ordersList,
      truncated: false,
    };
  }

  /**
   * Helper pour créer des stats vides
   */
  private buildEmptyStats(
    productId: number,
    product: any,
    dateFrom: string,
    dateTo: string
  ): ProductSalesStats {
    let productName = 'Unknown';
    if (typeof product.name === 'string') {
      productName = product.name;
    } else if (Array.isArray(product.name) && product.name.length > 0) {
      productName = product.name[0].value;
    }

    return {
      product_id: productId,
      product_name: productName,
      product_reference: product.reference,
      period: {
        from: dateFrom,
        to: dateTo,
      },
      sales: {
        total_quantity_sold: 0,
        total_revenue_excl_tax: 0,
        total_revenue_incl_tax: 0,
        average_unit_price: 0,
        number_of_orders: 0,
      },
      orders: [],
      truncated: false,
    };
  }

  /**
   * Récupère les produits best-sellers
   * OPTIMISÉ: Filtre les commandes par date d'abord, puis récupère les order_details
   */
  async getTopProducts(
    dateFrom: string,
    dateTo: string,
    limit: number,
    sortBy: 'quantity' | 'revenue',
    orderStates?: number[]
  ): Promise<{ products: TopProduct[]; total_found: number }> {
    validateDateRange(dateFrom, dateTo);

    // 1. Récupérer SEULEMENT les commandes de la période (OPTIMISATION)
    const orders = await this.apiService.getAllOrders({
      date_add: `[${dateFrom},${dateTo}]`,
      current_state: orderStates,
    });

    if (orders.length === 0) {
      return { products: [], total_found: 0 };
    }

    // 2. Récupérer les order_details pour ces commandes par batch
    const orderIds = orders.map((o) => o.id);
    const allDetails: any[] = [];

    // Traiter par batch de 20 commandes (évite les URLs trop longues)
    const batchSize = 20;
    for (let i = 0; i < orderIds.length; i += batchSize) {
      const batch = orderIds.slice(i, i + batchSize);
      const orderFilter = `[${batch.join('|')}]`; // Opérateur OR de PrestaShop

      const details = await this.apiService.getAllOrderDetails({
        id_order: orderFilter,
      });

      allDetails.push(...details);
    }

    // 3. Agréger par product_id
    const productMap = new Map<
      number,
      {
        quantity: number;
        revenue: number;
        orders: Set<number>;
        name: string;
        reference: string;
      }
    >();

    for (const detail of allDetails) {
      const pid = detail.product_id;
      if (!productMap.has(pid)) {
        productMap.set(pid, {
          quantity: 0,
          revenue: 0,
          orders: new Set(),
          name: detail.product_name,
          reference: detail.product_reference,
        });
      }

      const stats = productMap.get(pid);
      if (stats) {
        stats.quantity += Number(detail.product_quantity);
        stats.revenue += safeParseFloat(detail.total_price_tax_incl, 'total_price_tax_incl');
        stats.orders.add(detail.id_order);
      }
    }

    // 4. Convertir en array et trier
    const productsArray = Array.from(productMap.entries()).map(([id, stats]) => ({
      product_id: id,
      product_name: stats.name,
      product_reference: stats.reference,
      total_quantity_sold: stats.quantity,
      total_revenue_incl_tax: stats.revenue,
      number_of_orders: stats.orders.size,
      average_unit_price: stats.quantity > 0 ? stats.revenue / stats.quantity : 0,
    }));

    // Trier
    if (sortBy === 'quantity') {
      productsArray.sort((a, b) => b.total_quantity_sold - a.total_quantity_sold);
    } else {
      productsArray.sort((a, b) => b.total_revenue_incl_tax - a.total_revenue_incl_tax);
    }

    const totalFound = productsArray.length;

    // Limiter et ajouter rank
    const topProducts = productsArray.slice(0, limit).map((p, index) => ({
      rank: index + 1,
      ...p,
    }));

    return {
      products: topProducts,
      total_found: totalFound,
    };
  }
}
