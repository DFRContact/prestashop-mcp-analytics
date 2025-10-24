import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { OrdersService } from '../services/orders.service.js';
import {
  TopProductsInput,
  TopProductsInputSchema,
} from '../schemas/top-products.schema.js';
import { handleApiError } from '../utils/error.utils.js';
import {
  formatTopProductsJson,
  formatTopProductsMarkdown,
} from '../formatters/index.js';
import { TopProductsResult } from '../types.js';

export async function getTopProductsTool(
  ordersService: OrdersService,
  params: TopProductsInput
): Promise<CallToolResult> {
  try {
    const validated = TopProductsInputSchema.parse(params);

    const result = await ordersService.getTopProducts(
      validated.date_from,
      validated.date_to,
      validated.limit,
      validated.sort_by,
      validated.order_states
    );

    const output: TopProductsResult = {
      period: {
        from: validated.date_from,
        to: validated.date_to,
      },
      sort_by: validated.sort_by,
      total_products_found: result.total_found,
      products: result.products,
      has_more: result.total_found > validated.limit,
      next_limit:
        result.total_found > validated.limit ? validated.limit * 2 : undefined,
    };

    const formatted =
      validated.response_format === 'json'
        ? formatTopProductsJson(output)
        : formatTopProductsMarkdown(output);

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

export const getTopProductsToolDefinition = {
  title: 'Get Top Selling Products',
  description: `Identify best-selling products over a date range, sorted by quantity sold or revenue.

This tool analyzes all orders to rank products by:
- Total quantity sold (units)
- Total revenue generated (sales amount)

Args:
  - date_from (string): Start date in YYYY-MM-DD format
  - date_to (string): End date in YYYY-MM-DD format
  - limit (number): Number of products to return, 1-100 (default: 10)
  - sort_by ('quantity' | 'revenue'): Sort criterion (default: 'quantity')
  - order_states (number[], optional): Filter by order states (e.g., [2, 3, 4, 5] for paid/processing/shipped/delivered). If not provided, ALL states are included.
  - response_format ('json' | 'markdown'): Output format (default: 'markdown')

Returns:
  Ranked list of products with:
  - Rank position
  - Product name, ID, reference
  - Total quantity sold
  - Total revenue
  - Number of orders
  - Average unit price

Examples:
  - Use when: "What are my top 5 products this month?"
  - Use when: "Show me top 10 products by revenue in Q4 2024"
  - Use when: "Which products are my best-sellers this week?"
  - Don't use when: You need detailed stats for a single product (use get_product_sales_stats)

Error Handling:
  - Returns empty list if no sales in period
  - Returns warning if date range > 2 years
  - Truncates if response > 25,000 characters

Note: This is a READ-ONLY tool. Maximum 100 products per request.`,
  inputSchema: TopProductsInputSchema,
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true,
  },
};
