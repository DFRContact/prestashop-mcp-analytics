import { z } from 'zod';
import { dateSchema, responseFormatSchema } from './common.schema.js';

export const ProductSalesStatsInputSchema = z
  .object({
    product_id: z
      .number()
      .int('Product ID must be an integer')
      .positive('Product ID must be positive')
      .optional()
      .describe('PrestaShop product ID (e.g., 42). Required if product_name is not provided.'),

    product_name: z
      .string()
      .min(2, 'Product name must be at least 2 characters')
      .max(255, 'Product name must not exceed 255 characters')
      .optional()
      .describe('Product name to search for (e.g., "KAYOUMINI"). Required if product_id is not provided. Case-insensitive partial match.'),

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
  .strict()
  .refine(
    (data) => data.product_id !== undefined || data.product_name !== undefined,
    {
      message: 'Either product_id or product_name must be provided',
      path: ['product_id'],
    }
  );

export type ProductSalesStatsInput = z.infer<typeof ProductSalesStatsInputSchema>;
