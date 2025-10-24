import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { OrdersService } from '../services/orders.service.js';
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

    // 2. Récupérer les stats
    const stats = await ordersService.getProductSalesStats(
      validated.product_id,
      validated.date_from,
      validated.date_to,
      validated.order_states
    );

    // 3. Formater selon le format demandé
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

Args:
  - product_id (number): PrestaShop product ID (e.g., 42)
  - date_from (string): Start date in YYYY-MM-DD format (e.g., '2024-01-01')
  - date_to (string): End date in YYYY-MM-DD format (e.g., '2024-12-31')
  - order_states (number[], optional): Filter by order states (e.g., [2, 3, 4, 5] for paid/processing/shipped/delivered). If not provided, ALL states are included.
  - response_format ('json' | 'markdown'): Output format (default: 'markdown')

Returns:
  For JSON format: Structured data with complete schema
  For Markdown format: Human-readable report with sections

Examples:
  - Use when: "How many units of product #42 sold in September 2024?"
  - Use when: "Show me revenue for product 'T-shirt Red' this quarter"
  - Don't use when: You need to compare multiple products (use get_top_products instead)

Error Handling:
  - Returns "Product not found" if product_id doesn't exist
  - Returns "Invalid date range" if date_from > date_to or range > 2 years
  - Returns truncation warning if response > 25,000 characters

Note: This is a READ-ONLY tool. It does not modify any data.`,
  inputSchema: zodToMcpJsonSchema(ProductSalesStatsInputSchema, 'ProductSalesStatsInput'),
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true,
  },
};
