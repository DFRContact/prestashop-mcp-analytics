import { z } from 'zod';

export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .refine((date) => !isNaN(new Date(date).getTime()), 'Invalid date');

export const responseFormatSchema = z
  .enum(['json', 'markdown'])
  .default('markdown')
  .describe(
    "Output format: 'json' for programmatic use or 'markdown' for readability"
  );
