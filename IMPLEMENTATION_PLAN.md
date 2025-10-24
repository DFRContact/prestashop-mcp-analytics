# Plan d'Implémentation - PrestaShop MCP Analytics

> **Document complémentaire à CLAUDE.md**
> Ce fichier contient le plan d'implémentation détaillé jour par jour avec exemples de code complets.

## 📋 Vue d'ensemble

**Durée estimée:** 11 jours (4 sprints)
**Approche:** Bottom-up (infrastructure → services → tools → polish)
**Méthodologie:** Test-driven development avec validations incrémentales

---

## 📁 Structure de dossiers complète

```
prestashop-mcp-analytics/
│
├── .github/
│   └── workflows/
│       └── ci.yml                          # CI/CD pipeline
│
├── src/
│   ├── index.ts                            # ⭐ Entry point + server setup
│   ├── config.ts                           # Configuration & env validation
│   ├── constants.ts                        # Constants (limits, defaults)
│   ├── types.ts                            # TypeScript interfaces globales
│   │
│   ├── schemas/                            # Zod validation schemas
│   │   ├── index.ts                        # Barrel export
│   │   ├── product-sales-stats.schema.ts   # Tool 1 input schema
│   │   ├── top-products.schema.ts          # Tool 2 input schema
│   │   └── common.schema.ts                # Schémas partagés (dates, etc.)
│   │
│   ├── services/                           # Business logic layer
│   │   ├── index.ts                        # Barrel export
│   │   ├── prestashop-api.service.ts       # ⭐ HTTP client wrapper
│   │   ├── orders.service.ts               # Agrégation des commandes
│   │   └── products.service.ts             # Logic produits
│   │
│   ├── formatters/                         # Output formatting
│   │   ├── index.ts                        # Barrel export
│   │   ├── markdown.formatter.ts           # Markdown output
│   │   └── json.formatter.ts               # JSON output + truncation
│   │
│   ├── tools/                              # MCP tool handlers
│   │   ├── index.ts                        # Barrel export
│   │   ├── get-product-sales-stats.tool.ts # ⭐ Tool 1 implementation
│   │   └── get-top-products.tool.ts        # ⭐ Tool 2 implementation
│   │
│   └── utils/                              # Utilities
│       ├── index.ts                        # Barrel export
│       ├── date.utils.ts                   # Date validation & formatting
│       ├── error.utils.ts                  # Error handling & mapping
│       ├── truncation.utils.ts             # Response truncation logic
│       └── validation.utils.ts             # Custom validators
│
├── tests/                                  # Tests (mirror de src/)
│   ├── unit/
│   │   ├── services/
│   │   ├── formatters/
│   │   └── utils/
│   ├── integration/
│   │   └── tools/
│   └── fixtures/
│       ├── orders.json                     # Mock data
│       └── products.json
│
├── docs/                                   # Documentation
│   ├── API.md                              # API reference
│   └── EXAMPLES.md                         # Usage examples
│
├── .env.example                            # Environment variables template
├── .gitignore
├── .prettierrc                             # Code formatting
├── eslint.config.js                        # Linting rules
├── package.json                            # Dependencies & scripts
├── tsconfig.json                           # TypeScript configuration
├── CLAUDE.md                               # Project documentation (reference)
├── IMPLEMENTATION_PLAN.md                  # This file
└── README.md                               # ⭐ Main documentation
```

---

## 📝 Liste exhaustive des fichiers à créer

### Phase 1: Infrastructure (Sprint 1)

#### 1.1 Configuration de base
```
✓ package.json
✓ tsconfig.json
✓ eslint.config.js
✓ .prettierrc
✓ .env.example
✓ .gitignore
✓ README.md (structure de base)
```

#### 1.2 Types & Constants
```
✓ src/types.ts
✓ src/constants.ts
✓ src/config.ts
```

#### 1.3 Utilities de base
```
✓ src/utils/date.utils.ts
✓ src/utils/validation.utils.ts
✓ src/utils/error.utils.ts
✓ src/utils/index.ts
```

#### 1.4 Tests utilities
```
✓ tests/unit/utils/date.utils.test.ts
✓ tests/unit/utils/validation.utils.test.ts
✓ tests/unit/utils/error.utils.test.ts
```

### Phase 2: Services Layer (Sprint 1-2)

#### 2.1 API Client
```
✓ src/services/prestashop-api.service.ts
✓ tests/unit/services/prestashop-api.service.test.ts
✓ tests/fixtures/orders.json
✓ tests/fixtures/products.json
```

#### 2.2 Business Services
```
✓ src/services/orders.service.ts
✓ src/services/products.service.ts
✓ src/services/index.ts
✓ tests/unit/services/orders.service.test.ts
✓ tests/unit/services/products.service.test.ts
```

### Phase 3: Schemas & Formatters (Sprint 2)

#### 3.1 Zod Schemas
```
✓ src/schemas/common.schema.ts
✓ src/schemas/product-sales-stats.schema.ts
✓ src/schemas/top-products.schema.ts
✓ src/schemas/index.ts
```

#### 3.2 Formatters
```
✓ src/formatters/json.formatter.ts
✓ src/formatters/markdown.formatter.ts
✓ src/formatters/index.ts
✓ src/utils/truncation.utils.ts
✓ tests/unit/formatters/json.formatter.test.ts
✓ tests/unit/formatters/markdown.formatter.test.ts
```

### Phase 4: Tools Implementation (Sprint 2-3)

#### 4.1 Tool Handlers
```
✓ src/tools/get-product-sales-stats.tool.ts
✓ src/tools/get-top-products.tool.ts
✓ src/tools/index.ts
```

#### 4.2 Integration Tests
```
✓ tests/integration/tools/get-product-sales-stats.test.ts
✓ tests/integration/tools/get-top-products.test.ts
```

### Phase 5: Server & Polish (Sprint 3-4)

#### 5.1 Server Setup
```
✓ src/index.ts
```

#### 5.2 Documentation
```
✓ README.md (complet)
✓ docs/API.md
✓ docs/EXAMPLES.md
```

#### 5.3 CI/CD
```
✓ .github/workflows/ci.yml
```

---

## 🚀 Ordre de développement détaillé

### **SPRINT 1: Core Infrastructure (3 jours)**

#### Jour 1 - Setup & Configuration

**Matin: Initialisation projet**

```bash
# 1. Créer le projet
mkdir prestashop-mcp-analytics && cd prestashop-mcp-analytics
npm init -y

# 2. Installer dépendances
npm install @modelcontextprotocol/sdk zod axios
npm install -D typescript @types/node tsx jest @types/jest ts-jest
npm install -D eslint prettier @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

**Fichiers à créer (ordre):**

##### 1️⃣ **tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

##### 2️⃣ **package.json** (scripts section)

```json
{
  "name": "prestashop-mcp-analytics",
  "version": "1.0.0",
  "description": "MCP server for PrestaShop sales analytics",
  "type": "module",
  "main": "dist/index.js",
  "bin": {
    "prestashop-mcp": "dist/index.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsx watch src/index.ts",
    "start": "node dist/index.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src/**/*.ts",
    "lint:fix": "eslint src/**/*.ts --fix",
    "format": "prettier --check src/**/*.ts",
    "format:fix": "prettier --write src/**/*.ts"
  },
  "keywords": ["mcp", "prestashop", "analytics", "llm"],
  "author": "Your Name",
  "license": "MIT"
}
```

##### 3️⃣ **.env.example**

```bash
# PrestaShop Configuration
PRESTASHOP_BASE_URL=https://your-prestashop-store.com
PRESTASHOP_WS_KEY=YOUR_32_CHARACTER_WEBSERVICE_KEY_HERE

# Environment
NODE_ENV=development
LOG_LEVEL=info
```

##### 4️⃣ **.gitignore**

```
# Dependencies
node_modules/

# Build outputs
dist/
*.tsbuildinfo

# Environment
.env
.env.local

# Testing
coverage/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
```

##### 5️⃣ **.prettierrc**

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 90,
  "tabWidth": 2,
  "useTabs": false
}
```

##### 6️⃣ **eslint.config.js**

```javascript
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/no-explicit-any': 'error',
    },
  }
);
```

##### 7️⃣ **jest.config.js**

```javascript
export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      useESM: true,
    }],
  },
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts', // Entry point excluded
  ],
};
```

##### 8️⃣ **src/types.ts**

```typescript
// Interfaces globales pour PrestaShop API
export interface PrestashopOrder {
  id: number;
  id_customer: number;
  date_add: string;
  total_paid_tax_incl: string;
  total_paid_tax_excl: string;
  current_state: number;
}

export interface PrestashopOrderDetail {
  id: number;
  id_order: number;
  product_id: number;
  product_name: string;
  product_quantity: number;
  product_price: string;
  unit_price_tax_incl: string;
  unit_price_tax_excl: string;
  total_price_tax_incl: string;
  total_price_tax_excl: string;
  product_reference: string;
  date_add: string;
}

export interface PrestashopProduct {
  id: number;
  name: string | Array<{ value: string }>;
  reference: string;
  active: boolean;
}

// Output types
export interface ProductSalesStats {
  product_id: number;
  product_name: string;
  product_reference: string;
  period: {
    from: string;
    to: string;
  };
  sales: {
    total_quantity_sold: number;
    total_revenue_excl_tax: number;
    total_revenue_incl_tax: number;
    average_unit_price: number;
    number_of_orders: number;
  };
  orders: OrderSummary[];
  truncated: boolean;
  truncation_message?: string;
}

export interface OrderSummary {
  order_id: number;
  date: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface TopProduct {
  rank: number;
  product_id: number;
  product_name: string;
  product_reference: string;
  total_quantity_sold: number;
  total_revenue_incl_tax: number;
  number_of_orders: number;
  average_unit_price: number;
}

export interface TopProductsResult {
  period: {
    from: string;
    to: string;
  };
  sort_by: 'quantity' | 'revenue';
  total_products_found: number;
  products: TopProduct[];
  has_more: boolean;
  next_limit?: number;
}
```

##### 9️⃣ **src/constants.ts**

```typescript
export const CHARACTER_LIMIT = 25000;
export const MAX_PRODUCTS_PER_REQUEST = 100;
export const REQUEST_TIMEOUT = 30000; // 30s
export const MAX_ORDERS_TO_FETCH = 1000;
export const MAX_DATE_RANGE_DAYS = 730; // 2 years
export const MAX_CONCURRENT_REQUESTS = 5;

export const PRESTASHOP_ERROR_CODES = {
  AUTH_FAILED: 'AUTH_FAILED',
  PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
  INVALID_DATE_RANGE: 'INVALID_DATE_RANGE',
  API_RATE_LIMIT: 'RATE_LIMIT',
  NETWORK_TIMEOUT: 'TIMEOUT',
  RESPONSE_TOO_LARGE: 'RESPONSE_TOO_LARGE',
} as const;
```

##### 🔟 **src/config.ts**

```typescript
import { z } from 'zod';

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
    version: '1.0.0',
  },
  limits: {
    characterLimit: 25000,
    maxProductsPerRequest: 100,
    requestTimeout: 30000,
  },
};
```

**✅ Point de validation Jour 1 (matin):**
```bash
npm run build  # Doit compiler sans erreur
npm run lint   # Pas d'erreurs de linting
```

---

**Après-midi: Utilities de base**

##### 1️⃣1️⃣ **src/utils/date.utils.ts**

```typescript
import { MAX_DATE_RANGE_DAYS } from '../constants.js';

export function validateDateFormat(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

export function validateDateRange(dateFrom: string, dateTo: string): void {
  const from = new Date(dateFrom);
  const to = new Date(dateTo);

  if (isNaN(from.getTime())) {
    throw new Error(`Invalid date_from format: ${dateFrom}`);
  }

  if (isNaN(to.getTime())) {
    throw new Error(`Invalid date_to format: ${dateTo}`);
  }

  if (from > to) {
    throw new Error('date_from must be before date_to');
  }

  const daysDiff = (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24);
  if (daysDiff > MAX_DATE_RANGE_DAYS) {
    throw new Error(
      `Date range exceeds maximum of ${MAX_DATE_RANGE_DAYS} days (${Math.floor(
        daysDiff
      )} days requested)`
    );
  }
}

export function formatDateForDisplay(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
```

##### 1️⃣2️⃣ **src/utils/error.utils.ts**

```typescript
import { AxiosError } from 'axios';
import { PRESTASHOP_ERROR_CODES } from '../constants.js';

export class PrestashopError extends Error {
  constructor(
    public code: keyof typeof PRESTASHOP_ERROR_CODES,
    message: string,
    public suggestion?: string
  ) {
    super(message);
    this.name = 'PrestashopError';
  }
}

export function handleApiError(error: unknown): {
  isError: true;
  content: Array<{ type: 'text'; text: string }>;
} {
  if (error instanceof PrestashopError) {
    let text = `Error: ${error.message}`;
    if (error.suggestion) {
      text += `\n\nSuggestion: ${error.suggestion}`;
    }
    return {
      isError: true,
      content: [{ type: 'text', text }],
    };
  }

  if (error instanceof AxiosError) {
    if (error.response?.status === 401) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: 'Authentication failed. Verify your PRESTASHOP_WS_KEY environment variable.',
          },
        ],
      };
    }

    if (error.response?.status === 404) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: 'Resource not found. Check the product_id or order_id parameter.',
          },
        ],
      };
    }

    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: 'Request timeout. Try reducing the date range or limit parameter.',
          },
        ],
      };
    }

    if (error.response?.status === 429) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: 'Rate limit exceeded. Please wait before making more requests.',
          },
        ],
      };
    }
  }

  console.error('Unexpected error:', error);
  return {
    isError: true,
    content: [
      {
        type: 'text',
        text: 'An unexpected error occurred. Please try again later.',
      },
    ],
  };
}
```

##### 1️⃣3️⃣ **src/utils/validation.utils.ts**

```typescript
export function sanitizeUrl(url: string): string {
  // Remove ws_key from URL for logging
  return url.replace(/ws_key=[^&]+/, 'ws_key=***');
}

export function isValidProductId(id: number): boolean {
  return Number.isInteger(id) && id > 0;
}
```

##### 1️⃣4️⃣ **src/utils/index.ts**

```typescript
export * from './date.utils.js';
export * from './error.utils.js';
export * from './validation.utils.js';
```

**✅ Point de validation Jour 1 (fin):**
- Tests unitaires des utils (créer fichiers test basiques)
- Toutes les validations passent
- Build successful

---

#### Jour 2 - Services Layer (PrestaShop API Client)

##### 1️⃣5️⃣ **src/services/prestashop-api.service.ts** (CRITIQUE)

```typescript
import axios, { AxiosInstance, AxiosError } from 'axios';
import { config } from '../config.js';
import {
  PrestashopOrder,
  PrestashopOrderDetail,
  PrestashopProduct,
} from '../types.js';
import { PrestashopError } from '../utils/error.utils.js';
import { PRESTASHOP_ERROR_CODES, REQUEST_TIMEOUT } from '../constants.js';

export interface OrderFilters {
  date_add?: string; // Format: [date_from,date_to]
  current_state?: number;
  id_customer?: number;
}

export interface OrderDetailFilters {
  id_order?: number;
  product_id?: number;
}

export class PrestashopApiService {
  private client: AxiosInstance;

  constructor(baseUrl: string, wsKey: string) {
    this.client = axios.create({
      baseURL: `${baseUrl}/api`,
      timeout: REQUEST_TIMEOUT,
      auth: {
        username: wsKey,
        password: '',
      },
      params: {
        output_format: 'JSON',
      },
    });

    // Interceptor pour logging
    this.client.interceptors.request.use((config) => {
      console.error(`[API] ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    });

    this.client.interceptors.response.use(
      (response) => {
        console.error(`[API] Response: ${response.status}`);
        return response;
      },
      (error: AxiosError) => {
        console.error(`[API] Error: ${error.message}`);
        throw error;
      }
    );
  }

  /**
   * Récupère les commandes avec filtres optionnels
   */
  async getOrders(filters: OrderFilters = {}): Promise<PrestashopOrder[]> {
    try {
      const params: Record<string, string> = {
        display: 'full',
      };

      if (filters.date_add) {
        params['filter[date_add]'] = filters.date_add;
        params['date'] = '1';
      }

      if (filters.current_state) {
        params['filter[current_state]'] = String(filters.current_state);
      }

      if (filters.id_customer) {
        params['filter[id_customer]'] = String(filters.id_customer);
      }

      const response = await this.client.get('/orders', { params });

      if (!response.data?.orders) {
        return [];
      }

      // API PrestaShop retourne soit un objet unique soit un array
      const orders = Array.isArray(response.data.orders)
        ? response.data.orders
        : [response.data.orders];

      return orders.map((o: any) => o.order || o);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return []; // Aucune commande trouvée
      }
      throw error;
    }
  }

  /**
   * Récupère les détails de commande avec pagination
   */
  async getOrderDetails(
    filters: OrderDetailFilters = {},
    limit = 100,
    offset = 0
  ): Promise<PrestashopOrderDetail[]> {
    try {
      const params: Record<string, string> = {
        display: 'full',
        limit: `${offset},${limit}`,
      };

      if (filters.id_order) {
        params['filter[id_order]'] = String(filters.id_order);
      }

      if (filters.product_id) {
        params['filter[product_id]'] = String(filters.product_id);
      }

      const response = await this.client.get('/order_details', { params });

      if (!response.data?.order_details) {
        return [];
      }

      const details = Array.isArray(response.data.order_details)
        ? response.data.order_details
        : [response.data.order_details];

      return details.map((d: any) => d.order_detail || d);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return [];
      }
      throw error;
    }
  }

  /**
   * Récupère un produit par ID
   */
  async getProduct(productId: number): Promise<PrestashopProduct> {
    try {
      const response = await this.client.get(`/products/${productId}`, {
        params: { display: 'full' },
      });

      const product = response.data?.product;
      if (!product) {
        throw new PrestashopError(
          'PRODUCT_NOT_FOUND',
          `Product with ID ${productId} not found`,
          'Verify the product_id parameter exists in your PrestaShop catalog'
        );
      }

      return product;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        throw new PrestashopError(
          'PRODUCT_NOT_FOUND',
          `Product with ID ${productId} not found`,
          'Verify the product_id parameter exists in your PrestaShop catalog'
        );
      }
      throw error;
    }
  }

  /**
   * Fetch all order details avec pagination automatique
   */
  async getAllOrderDetails(
    filters: OrderDetailFilters = {}
  ): Promise<PrestashopOrderDetail[]> {
    const allDetails: PrestashopOrderDetail[] = [];
    let offset = 0;
    const batchSize = 100;
    const maxResults = 1000; // Safety limit

    while (true) {
      const batch = await this.getOrderDetails(filters, batchSize, offset);

      if (batch.length === 0) break;

      allDetails.push(...batch);
      offset += batchSize;

      if (allDetails.length >= maxResults) {
        console.warn(`Reached maximum of ${maxResults} order details`);
        break;
      }

      if (batch.length < batchSize) break; // Last page
    }

    return allDetails;
  }
}
```

**✅ Point de validation Jour 2:**
- Mock tests du API service
- Tester avec vrai PrestaShop (optionnel)
- Vérifier gestion erreurs 401/404/timeout

---

#### Jour 3 - Business Services & Aggregation

##### 1️⃣6️⃣ **src/services/orders.service.ts**

```typescript
import { PrestashopApiService } from './prestashop-api.service.js';
import { ProductSalesStats, TopProduct, OrderSummary } from '../types.js';
import { validateDateRange } from '../utils/date.utils.js';

export class OrdersService {
  constructor(private apiService: PrestashopApiService) {}

  /**
   * Agrège les statistiques de vente pour un produit
   */
  async getProductSalesStats(
    productId: number,
    dateFrom: string,
    dateTo: string
  ): Promise<ProductSalesStats> {
    // 1. Validation
    validateDateRange(dateFrom, dateTo);

    // 2. Récupérer le produit
    const product = await this.apiService.getProduct(productId);

    // 3. Récupérer tous les order_details pour ce produit
    const allOrderDetails = await this.apiService.getAllOrderDetails({
      product_id: productId,
    });

    // 4. Filtrer par date (API PrestaShop ne supporte pas filter date sur order_details)
    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    const filteredDetails = allOrderDetails.filter((detail) => {
      const orderDate = new Date(detail.date_add);
      return orderDate >= from && orderDate <= to;
    });

    // 5. Agréger les stats
    let totalQuantity = 0;
    let totalRevenueExcl = 0;
    let totalRevenueIncl = 0;
    const orderMap = new Map<number, OrderSummary>();

    for (const detail of filteredDetails) {
      totalQuantity += Number(detail.product_quantity);
      totalRevenueExcl += Number(detail.total_price_tax_excl);
      totalRevenueIncl += Number(detail.total_price_tax_incl);

      if (!orderMap.has(detail.id_order)) {
        orderMap.set(detail.id_order, {
          order_id: detail.id_order,
          date: detail.date_add,
          quantity: Number(detail.product_quantity),
          unit_price: Number(detail.unit_price_tax_incl),
          total_price: Number(detail.total_price_tax_incl),
        });
      } else {
        const existing = orderMap.get(detail.id_order)!;
        existing.quantity += Number(detail.product_quantity);
        existing.total_price += Number(detail.total_price_tax_incl);
      }
    }

    const orders = Array.from(orderMap.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Extract product name
    let productName = 'Unknown';
    if (typeof product.name === 'string') {
      productName = product.name;
    } else if (Array.isArray(product.name) && product.name.length > 0) {
      productName = product.name[0].value;
    }

    return {
      product_id: productId,
      product_name: productName,
      product_reference: product.reference,
      period: {
        from: dateFrom,
        to: dateTo,
      },
      sales: {
        total_quantity_sold: totalQuantity,
        total_revenue_excl_tax: totalRevenueExcl,
        total_revenue_incl_tax: totalRevenueIncl,
        average_unit_price:
          totalQuantity > 0 ? totalRevenueIncl / totalQuantity : 0,
        number_of_orders: orders.length,
      },
      orders,
      truncated: false,
    };
  }

  /**
   * Récupère les produits best-sellers
   */
  async getTopProducts(
    dateFrom: string,
    dateTo: string,
    limit: number,
    sortBy: 'quantity' | 'revenue'
  ): Promise<{ products: TopProduct[]; total_found: number }> {
    validateDateRange(dateFrom, dateTo);

    // Récupérer TOUS les order_details de la période
    const allOrderDetails = await this.apiService.getAllOrderDetails();

    // Filtrer par date
    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    const filteredDetails = allOrderDetails.filter((detail) => {
      const orderDate = new Date(detail.date_add);
      return orderDate >= from && orderDate <= to;
    });

    // Agréger par product_id
    const productMap = new Map<
      number,
      {
        quantity: number;
        revenue: number;
        orders: Set<number>;
        name: string;
        reference: string;
      }
    >();

    for (const detail of filteredDetails) {
      const pid = Number(detail.product_id);
      if (!productMap.has(pid)) {
        productMap.set(pid, {
          quantity: 0,
          revenue: 0,
          orders: new Set(),
          name: detail.product_name,
          reference: detail.product_reference,
        });
      }

      const stats = productMap.get(pid)!;
      stats.quantity += Number(detail.product_quantity);
      stats.revenue += Number(detail.total_price_tax_incl);
      stats.orders.add(detail.id_order);
    }

    // Convertir en array et trier
    let productsArray = Array.from(productMap.entries()).map(([id, stats]) => ({
      product_id: id,
      product_name: stats.name,
      product_reference: stats.reference,
      total_quantity_sold: stats.quantity,
      total_revenue_incl_tax: stats.revenue,
      number_of_orders: stats.orders.size,
      average_unit_price: stats.quantity > 0 ? stats.revenue / stats.quantity : 0,
    }));

    // Trier
    if (sortBy === 'quantity') {
      productsArray.sort((a, b) => b.total_quantity_sold - a.total_quantity_sold);
    } else {
      productsArray.sort((a, b) => b.total_revenue_incl_tax - a.total_revenue_incl_tax);
    }

    const totalFound = productsArray.length;

    // Limiter et ajouter rank
    const topProducts = productsArray.slice(0, limit).map((p, index) => ({
      rank: index + 1,
      ...p,
    }));

    return {
      products: topProducts,
      total_found: totalFound,
    };
  }
}
```

##### 1️⃣7️⃣ **src/services/index.ts**

```typescript
export * from './prestashop-api.service.js';
export * from './orders.service.js';
```

**✅ Point de validation Jour 3:**
```bash
npm run build     # Doit compiler
npm run test      # Tests services passent (si créés)
```

---

### **SPRINT 2: Schemas & Tools (4 jours)**

#### Jour 4 - Zod Schemas

##### 1️⃣8️⃣ **src/schemas/common.schema.ts**

```typescript
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
```

##### 1️⃣9️⃣ **src/schemas/product-sales-stats.schema.ts**

```typescript
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

    response_format: responseFormatSchema,
  })
  .strict();

export type ProductSalesStatsInput = z.infer<typeof ProductSalesStatsInputSchema>;
```

##### 2️⃣0️⃣ **src/schemas/top-products.schema.ts**

```typescript
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
        `Maximum ${MAX_PRODUCTS_PER_REQUEST} products`
      )
      .default(10)
      .describe('Number of products to return (default: 10)'),

    sort_by: z
      .enum(['quantity', 'revenue'])
      .default('quantity')
      .describe("Sort by: 'quantity' (units sold) or 'revenue' (total sales)"),

    response_format: responseFormatSchema,
  })
  .strict();

export type TopProductsInput = z.infer<typeof TopProductsInputSchema>;
```

##### 2️⃣1️⃣ **src/schemas/index.ts**

```typescript
export * from './common.schema.js';
export * from './product-sales-stats.schema.js';
export * from './top-products.schema.js';
```

---

#### Jour 5 - Formatters

##### 2️⃣2️⃣ **src/utils/truncation.utils.ts**

```typescript
import { CHARACTER_LIMIT } from '../constants.js';

export interface TruncationResult {
  truncated: boolean;
  data: string;
  message?: string;
}

export function applyTruncation(content: string): TruncationResult {
  if (content.length <= CHARACTER_LIMIT) {
    return { truncated: false, data: content };
  }

  const keepSize = Math.floor(CHARACTER_LIMIT / 2);
  const truncatedContent =
    content.slice(0, keepSize) +
    '\n\n[... RESPONSE TRUNCATED ...]\n\n' +
    content.slice(-keepSize);

  return {
    truncated: true,
    data: truncatedContent,
    message: `⚠️ Response truncated from ${content.length} to ${CHARACTER_LIMIT} characters. Use more specific filters (reduce date range or limit) to reduce data volume.`,
  };
}
```

##### 2️⃣3️⃣ **src/formatters/json.formatter.ts**

```typescript
import { ProductSalesStats, TopProductsResult } from '../types.js';
import { applyTruncation } from '../utils/truncation.utils.js';

export function formatProductSalesStatsJson(stats: ProductSalesStats): string {
  const json = JSON.stringify(stats, null, 2);
  const result = applyTruncation(json);

  if (result.truncated) {
    stats.truncated = true;
    stats.truncation_message = result.message;
    return result.data;
  }

  return json;
}

export function formatTopProductsJson(data: TopProductsResult): string {
  const json = JSON.stringify(data, null, 2);
  const result = applyTruncation(json);
  return result.truncated ? result.data : json;
}
```

##### 2️⃣4️⃣ **src/formatters/markdown.formatter.ts**

```typescript
import { ProductSalesStats, TopProductsResult } from '../types.js';
import { formatDateForDisplay } from '../utils/date.utils.js';
import { applyTruncation } from '../utils/truncation.utils.js';

export function formatProductSalesStatsMarkdown(
  stats: ProductSalesStats
): string {
  const lines: string[] = [];

  lines.push(`# Statistiques de vente - ${stats.product_name}`);
  lines.push('');
  lines.push(`**Produit ID:** ${stats.product_id}`);
  lines.push(`**Référence:** ${stats.product_reference}`);
  lines.push(
    `**Période:** ${formatDateForDisplay(stats.period.from)} - ${formatDateForDisplay(
      stats.period.to
    )}`
  );
  lines.push('');

  lines.push('## 📊 Résumé des ventes');
  lines.push('');
  lines.push(`- **Quantité totale vendue:** ${stats.sales.total_quantity_sold} unités`);
  lines.push(
    `- **Revenu total (HT):** ${stats.sales.total_revenue_excl_tax.toFixed(2)} €`
  );
  lines.push(
    `- **Revenu total (TTC):** ${stats.sales.total_revenue_incl_tax.toFixed(2)} €`
  );
  lines.push(
    `- **Prix moyen unitaire:** ${stats.sales.average_unit_price.toFixed(2)} €`
  );
  lines.push(`- **Nombre de commandes:** ${stats.sales.number_of_orders}`);
  lines.push('');

  if (stats.orders.length > 0) {
    lines.push('## 📦 Détails des commandes');
    lines.push('');

    const displayOrders = stats.orders.slice(0, 50); // Limite affichage
    for (const order of displayOrders) {
      lines.push(
        `### Commande #${order.order_id} - ${formatDateForDisplay(order.date)}`
      );
      lines.push(`- Quantité: ${order.quantity} unités`);
      lines.push(`- Prix unitaire: ${order.unit_price.toFixed(2)} €`);
      lines.push(`- Total: ${order.total_price.toFixed(2)} €`);
      lines.push('');
    }

    if (stats.orders.length > 50) {
      lines.push(
        `*... et ${stats.orders.length - 50} autres commandes (affichage limité à 50)*`
      );
      lines.push('');
    }
  } else {
    lines.push('## 📦 Aucune commande');
    lines.push('');
    lines.push('Aucune vente enregistrée pour ce produit sur la période sélectionnée.');
  }

  const markdown = lines.join('\n');
  const result = applyTruncation(markdown);

  if (result.truncated && result.message) {
    return result.data + '\n\n---\n\n' + result.message;
  }

  return markdown;
}

export function formatTopProductsMarkdown(data: TopProductsResult): string {
  const lines: string[] = [];

  const sortLabel =
    data.sort_by === 'quantity' ? 'Quantité Vendue' : "Chiffre d'Affaires";
  lines.push(`# 🏆 Top ${data.products.length} Produits - Par ${sortLabel}`);
  lines.push('');
  lines.push(
    `**Période:** ${formatDateForDisplay(data.period.from)} - ${formatDateForDisplay(
      data.period.to
    )}`
  );
  lines.push(`**Critère:** ${sortLabel}`);
  lines.push('');

  lines.push('## Classement');
  lines.push('');

  const medals = ['🥇', '🥈', '🥉'];

  for (const product of data.products) {
    const medal = product.rank <= 3 ? medals[product.rank - 1] + ' ' : '';
    lines.push(
      `### ${medal}#${product.rank} - ${product.product_name} (ID: ${product.product_id})`
    );
    lines.push(`- **Référence:** ${product.product_reference}`);
    lines.push(`- **Quantité vendue:** ${product.total_quantity_sold} unités`);
    lines.push(
      `- **Revenu (TTC):** ${product.total_revenue_incl_tax.toFixed(2)} €`
    );
    lines.push(`- **Commandes:** ${product.number_of_orders}`);
    lines.push(`- **Prix moyen:** ${product.average_unit_price.toFixed(2)} €`);
    lines.push('');
  }

  lines.push('---');
  lines.push(
    `**Total:** ${data.total_products_found} produits trouvés | Affichage des ${data.products.length} premiers`
  );

  if (data.has_more) {
    lines.push('');
    lines.push(`💡 Pour voir plus de résultats, utilisez \`limit=${data.next_limit}\``);
  }

  const markdown = lines.join('\n');
  const result = applyTruncation(markdown);

  return result.truncated ? result.data + '\n\n---\n\n' + result.message! : markdown;
}
```

##### 2️⃣5️⃣ **src/formatters/index.ts**

```typescript
export * from './json.formatter.js';
export * from './markdown.formatter.js';
```

**✅ Point de validation Jour 5:**
- Tests formatters (mock data)
- Vérifier truncation fonctionne
- Valider output Markdown lisible

---

#### Jour 6-7 - Tools Implementation

##### 2️⃣6️⃣ **src/tools/get-product-sales-stats.tool.ts**

```typescript
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
      validated.date_to
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
  inputSchema: ProductSalesStatsInputSchema,
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true,
  },
};
```

##### 2️⃣7️⃣ **src/tools/get-top-products.tool.ts**

```typescript
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
      validated.sort_by
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
```

##### 2️⃣8️⃣ **src/tools/index.ts**

```typescript
export * from './get-product-sales-stats.tool.js';
export * from './get-top-products.tool.js';
```

**✅ Point de validation Jour 6-7:**
- Tests integration des tools
- Validation avec vraies données PrestaShop
- Vérifier tous les cas d'erreur

---

### **SPRINT 3: Server & Polish (2 jours)**

#### Jour 8 - Server Setup

##### 2️⃣9️⃣ **src/index.ts** (ENTRY POINT FINAL)

```typescript
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
      },
      {
        name: 'prestashop_get_top_products',
        description: getTopProductsToolDefinition.description,
        inputSchema: getTopProductsToolDefinition.inputSchema,
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
```

**✅ Point de validation Jour 8:**
- Serveur démarre sans erreur
- Test avec MCP Inspector

---

#### Jour 9 - Documentation Complète

##### 3️⃣0️⃣ **README.md** (voir fichier séparé dans CLAUDE.md section References)

[Contenu déjà défini dans CLAUDE.md]

##### 3️⃣1️⃣ **docs/EXAMPLES.md**

```markdown
# Usage Examples - PrestaShop MCP Analytics

## Example 1: Get Product Sales Stats

**User Query:**
> "How many units of product ID 42 were sold in September 2024?"

**Tool Call:**
```json
{
  "name": "prestashop_get_product_sales_stats",
  "arguments": {
    "product_id": 42,
    "date_from": "2024-09-01",
    "date_to": "2024-09-30",
    "response_format": "markdown"
  }
}
```

**Expected Response:**
```markdown
# Statistiques de vente - T-shirt Bleu

**Produit ID:** 42
**Référence:** TSHIRT-BLUE-001
**Période:** 01/09/2024 - 30/09/2024

## 📊 Résumé des ventes

- **Quantité totale vendue:** 156 unités
- **Revenu total (HT):** 2,340.00 €
- **Revenu total (TTC):** 2,808.00 €
- **Prix moyen unitaire:** 18.00 €
- **Nombre de commandes:** 87

## 📦 Détails des commandes
...
```

## Example 2: Get Top Products by Revenue

**User Query:**
> "Show me the top 10 products by revenue in Q4 2024"

**Tool Call:**
```json
{
  "name": "prestashop_get_top_products",
  "arguments": {
    "date_from": "2024-10-01",
    "date_to": "2024-12-31",
    "limit": 10,
    "sort_by": "revenue",
    "response_format": "json"
  }
}
```

## More Examples

See [CLAUDE.md](../CLAUDE.md#common-user-questions-examples) for additional scenarios.
```

**✅ Point de validation Jour 9:**
- Documentation complète
- README testé avec vraies commandes

---

### **SPRINT 4: Testing & Release (2 jours)**

#### Jour 10 - Tests Finaux

##### 3️⃣2️⃣ **.github/workflows/ci.yml**

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npm run build

      - name: Run tests
        run: npm test

      - name: Check coverage
        run: npm run test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        if: matrix.node-version == '20.x'
        with:
          files: ./coverage/lcov.info
          flags: unittests
          name: codecov-umbrella

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20.x'
      - run: npm audit --production
```

**✅ Point de validation Jour 10:**
- Tous les tests passent
- Coverage > 80%
- Audit sécurité clean

---

#### Jour 11 - Release

**Checklist finale:**

```bash
# 1. Build final
npm run build

# 2. Tous les tests
npm test

# 3. Lint clean
npm run lint

# 4. Audit sécurité
npm audit

# 5. Test avec Claude Desktop
# Ajouter dans claude_desktop_config.json:
{
  "mcpServers": {
    "prestashop-analytics": {
      "command": "node",
      "args": ["/absolute/path/to/dist/index.js"],
      "env": {
        "PRESTASHOP_BASE_URL": "https://your-store.com",
        "PRESTASHOP_WS_KEY": "your_key"
      }
    }
  }
}

# 6. Test end-to-end avec vraies queries
# 7. Tag version
git tag v1.0.0
git push origin v1.0.0
```

---

## 🎯 Points de Validation Critiques

### Checkpoint 1 (Fin Jour 3)
- [ ] Projet compile sans erreur
- [ ] Config environnement validée
- [ ] API service fonctionne (tests mock)
- [ ] Agrégation données correcte

### Checkpoint 2 (Fin Jour 7)
- [ ] 2 tools enregistrés
- [ ] Schémas Zod validés
- [ ] Formatters produisent output correct
- [ ] Tests integration passent

### Checkpoint 3 (Fin Jour 9)
- [ ] Serveur MCP démarre
- [ ] README complet
- [ ] Test end-to-end avec Claude
- [ ] Aucun secret exposé

### Checkpoint 4 (Fin Jour 11)
- [ ] CI/CD configuré
- [ ] Documentation complète
- [ ] Tests passent en CI
- [ ] Release v1.0.0 publiée

---

## 📊 Métriques de Qualité Cibles

| Métrique              | Cible   | Comment Mesurer            |
| --------------------- | ------- | -------------------------- |
| Test Coverage         | > 80%   | `npm run test:coverage`    |
| Build Time            | < 10s   | `time npm run build`       |
| Lint Errors           | 0       | `npm run lint`             |
| TypeScript Errors     | 0       | `tsc --noEmit`             |
| Response Time (P90)   | < 5s    | Manual testing             |
| npm audit             | 0 vulns | `npm audit --production`   |

---

## 🚨 Risques & Mitigation

| Risque                    | Impact          | Mitigation                      |
| ------------------------- | --------------- | ------------------------------- |
| API PrestaShop lente      | Timeouts        | Pagination + timeout 30s        |
| Format API non-standard   | Parsing errors  | Tests avec vraies données       |
| Volume données trop élevé | OOM             | Limite 1000 orders max          |
| Date range invalide       | Mauvais résultats | Validation stricte Zod        |

---

## 🔄 Workflow de Développement Recommandé

```bash
# 1. Créer nouvelle branche
git checkout -b feature/nom-feature

# 2. Développer avec tests en watch mode
npm run test:watch

# 3. Vérifier lint en continu
npm run lint:fix

# 4. Avant commit
npm run build
npm test
npm run lint

# 5. Commit avec message descriptif
git commit -m "feat: add product sales stats tool"

# 6. Push et PR
git push origin feature/nom-feature
```

---

Suivez ce plan jour par jour avec les points de validation, et vous aurez un serveur MCP PrestaShop de qualité production en 11 jours. 🚀
