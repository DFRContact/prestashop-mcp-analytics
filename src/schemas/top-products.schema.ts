import { z } from 'zod';
import { dateSchema, responseFormatSchema } from './common.schema.js';
import { MAX_PRODUCTS_PER_REQUEST } from '../constants.js';

export const TopProductsInputSchema = z
  .object({
    date_from: dateSchema.describe('Start date of the period'),

    date_to: dateSchema.describe('End date of the period'),

    limit: z
      .number()
      .int()
      .min(1, 'Minimum 1 product')
      .max(
        MAX_PRODUCTS_PER_REQUEST,
        `Maximum ${String(MAX_PRODUCTS_PER_REQUEST)} products`
      )
      .default(10)
      .describe('Number of products to return (default: 10)'),

    sort_by: z
      .enum(['quantity', 'revenue'])
      .default('quantity')
      .describe("Sort by: 'quantity' (units sold) or 'revenue' (total sales)"),

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

export type TopProductsInput = z.infer<typeof TopProductsInputSchema>;
