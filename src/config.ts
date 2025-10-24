import { z } from 'zod';

// Environment variables are provided by the MCP client (Claude Desktop)
// No need to load .env file in production

const envSchema = z.object({
  PRESTASHOP_BASE_URL: z.string().url(),
  PRESTASHOP_WS_KEY: z.string().length(32),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export function validateEnvironment(): z.infer<typeof envSchema> {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
    }
    process.exit(1);
  }
}

export const config = {
  prestashop: {
    baseUrl: process.env.PRESTASHOP_BASE_URL!,
    wsKey: process.env.PRESTASHOP_WS_KEY!,
    timeout: 30000,
  },
  mcp: {
    name: 'prestashop-mcp-analytics',
    version: '1.2.0',
  },
  limits: {
    characterLimit: 25000,
    maxProductsPerRequest: 100,
    requestTimeout: 30000,
  },
};
