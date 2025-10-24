import { z } from 'zod';
import { dateSchema, responseFormatSchema } from './common.schema.js';

export const ProductSalesStatsInputSchema = z
  .object({
    product_id: z
      .number()
      .int('Product ID must be an integer')
      .positive('Product ID must be positive')
      .describe('PrestaShop product ID (e.g., 42)'),

    date_from: dateSchema.describe("Start date of the period (e.g., '2024-01-01')"),

    date_to: dateSchema.describe("End date of the period (e.g., '2024-12-31')"),

    order_states: z
      .array(z.number().int().positive())
      .optional()
      .describe(
        'Filter by order states (e.g., [2, 3, 4, 5] for paid/processing/shipped/delivered). ' +
        'If not provided, ALL order states are included. ' +
        'Common states: 2=Payment accepted, 3=Processing, 4=Shipped, 5=Delivered, 6=Canceled, 7=Refunded'
      ),

    response_format: responseFormatSchema,
  })
  .strict();

export type ProductSalesStatsInput = z.infer<typeof ProductSalesStatsInputSchema>;
