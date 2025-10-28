import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { OrdersService } from '../services/orders.service.js';
import { PrestashopApiService } from '../services/prestashop-api.service.js';
import {
  ProductSalesStatsInput,
  ProductSalesStatsInputSchema,
} from '../schemas/product-sales-stats.schema.js';
import { handleApiError } from '../utils/error.utils.js';
import {
  formatProductSalesStatsJson,
  formatProductSalesStatsMarkdown,
} from '../formatters/index.js';
import { zodToMcpJsonSchema } from '../utils/schema.utils.js';

export async function getProductSalesStatsTool(
  ordersService: OrdersService,
  params: ProductSalesStatsInput
): Promise<CallToolResult> {
  try {
    // 1. Validation Zod
    const validated = ProductSalesStatsInputSchema.parse(params);

    // 2. Déterminer le product_id
    let productId: number;

    if (validated.product_id !== undefined) {
      // Cas simple : ID fourni directement
      productId = validated.product_id;
    } else if (validated.product_name !== undefined) {
      // Cas recherche : chercher le produit par nom
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
      const apiService = (ordersService as any).apiService as PrestashopApiService;
      const products = await apiService.searchProducts(validated.product_name);

      if (products.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `❌ No products found matching "${validated.product_name}"\n\nPlease try:\n- Using a different search term\n- Checking the spelling\n- Using a shorter/more general term`,
            },
          ],
        };
      }

      if (products.length > 1) {
        // Plusieurs résultats : demander à l'utilisateur de choisir
        const productList = products
          .map((p) => {
            // Extraire le nom lisible (gère le format multi-langues)
            let displayName = 'Unknown';
            if (typeof p.name === 'string') {
              displayName = p.name;
            } else if (Array.isArray(p.name) && p.name.length > 0) {
              // Prendre la première langue disponible
              const firstLang = p.name[0];
              if (typeof firstLang === 'object' && 'value' in firstLang) {
                const langValue = firstLang.value;
                displayName = (typeof langValue === 'string' ? langValue : 'Unknown');
              }
            }
            return `- **ID ${String(p.id)}**: ${displayName} (Ref: ${p.reference || 'N/A'})`;
          })
          .join('\n');

        return {
          content: [
            {
              type: 'text',
              text: `🔍 Found ${String(products.length)} products matching "${validated.product_name}":\n\n${productList}\n\n💡 Please specify the exact product using **product_id** instead of product_name.`,
            },
          ],
        };
      }

      // Un seul résultat : utiliser cet ID
      productId = products[0].id;

      // Extraire le nom pour le log
      let displayName = 'Unknown';
      const product = products[0];
      if (typeof product.name === 'string') {
        displayName = product.name;
      } else if (Array.isArray(product.name) && product.name.length > 0) {
        const firstLang = product.name[0];
        if (typeof firstLang === 'object' && 'value' in firstLang) {
          const langValue = firstLang.value;
          displayName = (typeof langValue === 'string' ? langValue : 'Unknown');
        }
      }

      console.error(`✓ Found product: ${displayName} (ID: ${String(productId)})`);
    } else {
      // Ne devrait jamais arriver grâce à la validation Zod
      throw new Error('Either product_id or product_name must be provided');
    }

    // 3. Récupérer les stats
    const stats = await ordersService.getProductSalesStats(
      productId,
      validated.date_from,
      validated.date_to,
      validated.order_states
    );

    // 4. Formater selon le format demandé
    const formatted =
      validated.response_format === 'json'
        ? formatProductSalesStatsJson(stats)
        : formatProductSalesStatsMarkdown(stats);

    return {
      content: [
        {
          type: 'text',
          text: formatted,
        },
      ],
    };
  } catch (error) {
    return handleApiError(error);
  }
}

export const getProductSalesStatsToolDefinition = {
  title: 'Get Product Sales Statistics',
  description: `Retrieve detailed sales statistics for a specific product over a date range.

This tool analyzes order history to provide:
- Total quantity sold
- Revenue (with and without tax)
- Number of orders
- Average unit price
- Individual order details

You can identify the product using either:
- **product_id**: Direct product ID (fastest)
- **product_name**: Product name search (case-insensitive, partial match)

Args:
  - product_id (number, optional): PrestaShop product ID (e.g., 42). Required if product_name not provided.
  - product_name (string, optional): Product name to search (e.g., "KAYOUMINI"). Required if product_id not provided.
  - date_from (string): Start date in YYYY-MM-DD format (e.g., '2024-01-01')
  - date_to (string): End date in YYYY-MM-DD format (e.g., '2024-12-31')
  - order_states (number[], optional): Filter by order states (e.g., [2, 3, 4, 5] for paid/processing/shipped/delivered). If not provided, ALL states are included.
  - response_format ('json' | 'markdown'): Output format (default: 'markdown')

Returns:
  For JSON format: Structured data with complete schema
  For Markdown format: Human-readable report with sections

  If multiple products match the name:
  - Returns a list of matching products with IDs
  - User should then use product_id for precise selection

Examples:
  - Use when: "How many units of product #42 sold in September 2024?"
  - Use when: "Show me revenue for KAYOUMINI this quarter"
  - Use when: "What are the sales stats for 'Wasp Motor'?"
  - Don't use when: You need to compare multiple products (use get_top_products instead)

Error Handling:
  - Returns "Product not found" if product_id doesn't exist or no match for product_name
  - Returns "Invalid date range" if date_from > date_to or range > 2 years
  - Returns truncation warning if response > 25,000 characters
  - Returns list if multiple products match the name

Note: This is a READ-ONLY tool. It does not modify any data.`,
  inputSchema: zodToMcpJsonSchema(ProductSalesStatsInputSchema, 'ProductSalesStatsInput'),
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true,
  },
};
