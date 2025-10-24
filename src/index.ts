#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { validateEnvironment, config } from './config.js';
import { PrestashopApiService } from './services/prestashop-api.service.js';
import { OrdersService } from './services/orders.service.js';
import {
  getProductSalesStatsTool,
  getProductSalesStatsToolDefinition,
} from './tools/get-product-sales-stats.tool.js';
import {
  getTopProductsTool,
  getTopProductsToolDefinition,
} from './tools/get-top-products.tool.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Validation environnement
const env = validateEnvironment();

// Initialiser services
const apiService = new PrestashopApiService(
  env.PRESTASHOP_BASE_URL,
  env.PRESTASHOP_WS_KEY
);
const ordersService = new OrdersService(apiService);

// Créer serveur MCP
const server = new Server(
  {
    name: config.mcp.name,
    version: config.mcp.version,
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handler pour list_tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'prestashop_get_product_sales_stats',
        description: getProductSalesStatsToolDefinition.description,
        inputSchema: getProductSalesStatsToolDefinition.inputSchema,
        annotations: getProductSalesStatsToolDefinition.annotations,
      },
      {
        name: 'prestashop_get_top_products',
        description: getTopProductsToolDefinition.description,
        inputSchema: getTopProductsToolDefinition.inputSchema,
        annotations: getTopProductsToolDefinition.annotations,
      },
    ],
  };
});

// Handler pour call_tool
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'prestashop_get_product_sales_stats':
      return await getProductSalesStatsTool(ordersService, args as any);

    case 'prestashop_get_top_products':
      return await getTopProductsTool(ordersService, args as any);

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// Fonction principale
async function main(): Promise<void> {
  console.error('🚀 Starting PrestaShop MCP Analytics Server...');
  console.error(`📊 Version: ${config.mcp.version}`);
  console.error(`🔗 PrestaShop URL: ${env.PRESTASHOP_BASE_URL}`);
  console.error('✅ Environment validated');

  // Créer transport stdio
  const transport = new StdioServerTransport();

  // Connecter serveur au transport
  await server.connect(transport);

  console.error('✨ PrestaShop MCP Analytics Server running via stdio');
  console.error('📋 Available tools:');
  console.error('  - prestashop_get_product_sales_stats');
  console.error('  - prestashop_get_top_products');
}

// Lancer serveur
main().catch((error) => {
  console.error('❌ Server error:', error);
  process.exit(1);
});
