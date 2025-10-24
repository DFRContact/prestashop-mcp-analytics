import { PrestashopApiService } from './prestashop-api.service.js';
import { ProductSalesStats, TopProduct, OrderSummary } from '../types.js';
import { validateDateRange } from '../utils/date.utils.js';

export class OrdersService {
  constructor(private apiService: PrestashopApiService) {}

  /**
   * Agrège les statistiques de vente pour un produit
   */
  async getProductSalesStats(
    productId: number,
    dateFrom: string,
    dateTo: string
  ): Promise<ProductSalesStats> {
    // 1. Validation
    validateDateRange(dateFrom, dateTo);

    // 2. Récupérer le produit
    const product = await this.apiService.getProduct(productId);

    // 3. Récupérer tous les order_details pour ce produit
    const allOrderDetails = await this.apiService.getAllOrderDetails({
      product_id: productId,
    });

    // 4. Filtrer par date (API PrestaShop ne supporte pas filter date sur order_details)
    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    const filteredDetails = allOrderDetails.filter((detail) => {
      const orderDate = new Date(detail.date_add);
      return orderDate >= from && orderDate <= to;
    });

    // 5. Agréger les stats
    let totalQuantity = 0;
    let totalRevenueExcl = 0;
    let totalRevenueIncl = 0;
    const orderMap = new Map<number, OrderSummary>();

    for (const detail of filteredDetails) {
      totalQuantity += detail.product_quantity;
      totalRevenueExcl += Number(detail.total_price_tax_excl);
      totalRevenueIncl += Number(detail.total_price_tax_incl);

      if (!orderMap.has(detail.id_order)) {
        orderMap.set(detail.id_order, {
          order_id: detail.id_order,
          date: detail.date_add,
          quantity: detail.product_quantity,
          unit_price: Number(detail.unit_price_tax_incl),
          total_price: Number(detail.total_price_tax_incl),
        });
      } else {
        const existing = orderMap.get(detail.id_order);
        if (existing) {
          existing.quantity += detail.product_quantity;
          existing.total_price += Number(detail.total_price_tax_incl);
        }
      }
    }

    const orders = Array.from(orderMap.values()).sort(
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
        number_of_orders: orders.length,
      },
      orders,
      truncated: false,
    };
  }

  /**
   * Récupère les produits best-sellers
   */
  async getTopProducts(
    dateFrom: string,
    dateTo: string,
    limit: number,
    sortBy: 'quantity' | 'revenue'
  ): Promise<{ products: TopProduct[]; total_found: number }> {
    validateDateRange(dateFrom, dateTo);

    // Récupérer TOUS les order_details de la période
    const allOrderDetails = await this.apiService.getAllOrderDetails();

    // Filtrer par date
    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    const filteredDetails = allOrderDetails.filter((detail) => {
      const orderDate = new Date(detail.date_add);
      return orderDate >= from && orderDate <= to;
    });

    // Agréger par product_id
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

    for (const detail of filteredDetails) {
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
        stats.quantity += detail.product_quantity;
        stats.revenue += Number(detail.total_price_tax_incl);
        stats.orders.add(detail.id_order);
      }
    }

    // Convertir en array et trier
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
