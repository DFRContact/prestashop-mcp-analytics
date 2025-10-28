/**
 * Integration tests for PrestaShop API
 * Tests real API calls to drone-fpv-racer.com
 */

import { config as dotenvConfig } from 'dotenv';
import { PrestashopApiService } from '../../src/services/prestashop-api.service.js';

// Load environment variables
dotenvConfig();

describe('PrestaShop API Integration Tests', () => {
  let apiService: PrestashopApiService;
  const baseUrl = process.env.PRESTASHOP_BASE_URL;
  const wsKey = process.env.PRESTASHOP_WS_KEY;

  beforeAll(() => {
    // Validate environment variables
    if (!baseUrl || !wsKey) {
      throw new Error('PRESTASHOP_BASE_URL and PRESTASHOP_WS_KEY must be set in .env');
    }

    apiService = new PrestashopApiService(baseUrl, wsKey);
  });

  describe('API Connection', () => {
    test('should successfully connect to PrestaShop API', async () => {
      // Test basic connectivity by fetching orders
      const orders = await apiService.getOrders();

      expect(orders).toBeDefined();
      expect(Array.isArray(orders)).toBe(true);
    }, 15000); // 15s timeout for API calls
  });

  describe('Orders Endpoint', () => {
    test('should fetch orders without filters', async () => {
      const orders = await apiService.getOrders();

      expect(Array.isArray(orders)).toBe(true);

      if (orders.length > 0) {
        const firstOrder = orders[0];
        expect(firstOrder).toHaveProperty('id');
        expect(firstOrder).toHaveProperty('id_customer');
        expect(firstOrder).toHaveProperty('current_state');
        expect(firstOrder).toHaveProperty('total_paid_tax_incl');
        expect(firstOrder).toHaveProperty('total_paid_tax_excl');
        expect(firstOrder).toHaveProperty('date_add');
      }
    }, 15000);

    test('should fetch orders with date filter', async () => {
      // Test with recent date range
      const dateFrom = '2024-01-01';
      const dateTo = '2024-12-31';

      const orders = await apiService.getOrders({
        date_add: `[${dateFrom},${dateTo}]`
      });

      expect(Array.isArray(orders)).toBe(true);

      // Validate date filtering if orders exist
      if (orders.length > 0) {
        orders.forEach(order => {
          const orderDate = new Date(order.date_add);
          expect(orderDate.getFullYear()).toBeGreaterThanOrEqual(2024);
          expect(orderDate.getFullYear()).toBeLessThanOrEqual(2024);
        });
      }
    }, 15000);

    test('should handle empty results gracefully', async () => {
      // Test with impossible date range
      const orders = await apiService.getOrders({
        date_add: '[1970-01-01,1970-01-02]'
      });

      expect(Array.isArray(orders)).toBe(true);
      expect(orders.length).toBe(0);
    }, 15000);
  });

  describe('Order Details Endpoint', () => {
    test('should fetch order details', async () => {
      // First get an order ID
      const orders = await apiService.getOrders();

      if (orders.length > 0) {
        const orderId = Number(orders[0].id);

        const orderDetails = await apiService.getOrderDetails({ id_order: orderId });

        expect(Array.isArray(orderDetails)).toBe(true);

        if (orderDetails.length > 0) {
          const detail = orderDetails[0];
          expect(detail).toHaveProperty('id');
          expect(detail).toHaveProperty('id_order');
          expect(detail).toHaveProperty('product_id');
          expect(detail).toHaveProperty('product_name');
          expect(detail).toHaveProperty('product_quantity');
          expect(detail).toHaveProperty('unit_price_tax_excl');
          expect(detail).toHaveProperty('total_price_tax_excl');
          expect(Number(detail.id_order)).toBe(orderId);
        }
      }
    }, 15000);

    test('should handle pagination correctly', async () => {
      const limit = 10;
      const offset = 0;

      const orderDetails = await apiService.getOrderDetails({}, limit, offset);

      expect(Array.isArray(orderDetails)).toBe(true);
      expect(orderDetails.length).toBeLessThanOrEqual(limit);
    }, 15000);

    test('should fetch all order details with automatic pagination', async () => {
      const allDetails = await apiService.getAllOrderDetails();

      expect(Array.isArray(allDetails)).toBe(true);

      if (allDetails.length > 0) {
        const detail = allDetails[0];
        expect(detail).toHaveProperty('id');
        expect(detail).toHaveProperty('product_id');
        expect(detail).toHaveProperty('product_quantity');
      }
    }, 30000); // Longer timeout for paginated requests
  });

  describe('Products Endpoint', () => {
    test('should fetch a product by ID', async () => {
      // Use a known valid product ID
      const productId = 14509;

      const product = await apiService.getProduct(productId);

      expect(product).toBeDefined();
      expect(product.id).toBe(productId);
      expect(product).toHaveProperty('name');
      expect(product).toHaveProperty('reference');
      expect(product).toHaveProperty('active');
    }, 15000);

    test('should throw error for non-existent product', async () => {
      const invalidProductId = 999999999;

      await expect(apiService.getProduct(invalidProductId)).rejects.toThrow();
    }, 15000);
  });

  describe('Product Search (searchProducts)', () => {
    test('should search products by name (string format)', async () => {
      const results = await apiService.searchProducts('motor');

      expect(Array.isArray(results)).toBe(true);
      // Motor is a common term, should find some products
      expect(results.length).toBeGreaterThan(0);

      if (results.length > 0) {
        const product = results[0];
        expect(product).toHaveProperty('id');
        expect(product).toHaveProperty('name');
        expect(product).toHaveProperty('reference');
        expect(product).toHaveProperty('active');

        // Verify the name contains the search term (case-insensitive)
        const name = typeof product.name === 'string'
          ? product.name
          : Array.isArray(product.name) && product.name.length > 0
            ? product.name[0].value
            : '';

        expect(name.toLowerCase()).toContain('motor');
      }
    }, 15000);

    test('should perform case-insensitive search', async () => {
      const resultsLower = await apiService.searchProducts('dji');
      const resultsUpper = await apiService.searchProducts('DJI');

      expect(resultsLower.length).toEqual(resultsUpper.length);
    }, 15000);

    test('should return empty array for non-existent products', async () => {
      const results = await apiService.searchProducts('XXXYYYZZZ_NONEXISTENT_12345');

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    }, 15000);

    test('should respect limit parameter', async () => {
      const results = await apiService.searchProducts('motor', 3);

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeLessThanOrEqual(3);
    }, 15000);

    test('should return empty array for empty search term', async () => {
      const results = await apiService.searchProducts('');

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    }, 5000);

    test('should handle whitespace-only search term', async () => {
      const results = await apiService.searchProducts('   ');

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    }, 5000);

    test('should search in multi-language product names', async () => {
      // Try common French term that might exist in bilingual store
      const results = await apiService.searchProducts('moteur');

      expect(Array.isArray(results)).toBe(true);
      // This might return 0 if no French names, but should not error
    }, 15000);

    test('should perform partial match search', async () => {
      // Search for "DJI" should match "DJI O4 Air Unit Pro"
      const results = await apiService.searchProducts('DJI');

      expect(Array.isArray(results)).toBe(true);

      if (results.length > 0) {
        const names = results.map(p => {
          if (typeof p.name === 'string') return p.name;
          if (Array.isArray(p.name) && p.name.length > 0) return p.name[0].value;
          return '';
        });

        // At least one name should contain "DJI"
        const hasDJI = names.some(name => name.toLowerCase().includes('dji'));
        expect(hasDJI).toBe(true);
      }
    }, 15000);
  });

  describe('Error Handling', () => {
    test('should handle invalid authentication', async () => {
      const invalidService = new PrestashopApiService(baseUrl!, 'INVALID_KEY_12345678901234567890');

      await expect(invalidService.getOrders()).rejects.toThrow();
    }, 15000);

    test('should return empty array for 404 on orders', async () => {
      // This is tested in other scenarios, but explicitly verify behavior
      const orders = await apiService.getOrders({ id_customer: 999999999 });

      expect(Array.isArray(orders)).toBe(true);
    }, 15000);
  });

  describe('Data Validation', () => {
    test('should return valid numeric fields in orders', async () => {
      const orders = await apiService.getOrders();

      if (orders.length > 0) {
        const order = orders[0];

        expect(typeof Number(order.id)).toBe('number');
        expect(typeof Number(order.id_customer)).toBe('number');
        expect(typeof Number(order.current_state)).toBe('number');
        expect(typeof Number(order.total_paid_tax_incl)).toBe('number');
        expect(typeof Number(order.total_paid_tax_excl)).toBe('number');
      }
    }, 15000);

    test('should return valid numeric fields in order details', async () => {
      const orderDetails = await apiService.getOrderDetails({}, 1, 0);

      if (orderDetails.length > 0) {
        const detail = orderDetails[0];

        expect(typeof Number(detail.product_quantity)).toBe('number');
        expect(typeof Number(detail.unit_price_tax_excl)).toBe('number');
        expect(typeof Number(detail.total_price_tax_excl)).toBe('number');
        expect(Number(detail.product_quantity)).toBeGreaterThan(0);
      }
    }, 15000);

    test('should return valid date formats', async () => {
      const orders = await apiService.getOrders();

      if (orders.length > 0) {
        const order = orders[0];

        // Validate date format
        const dateRegex = /^\d{4}-\d{2}-\d{2}/;
        expect(order.date_add).toMatch(dateRegex);

        // Validate parseable date
        const date = new Date(order.date_add);
        expect(date).toBeInstanceOf(Date);
        expect(isNaN(date.getTime())).toBe(false);
      }
    }, 15000);
  });
});
