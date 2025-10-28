# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**PrestaShop MCP Analytics Server** - A read-only MCP server that enables LLMs to query PrestaShop product sales statistics through natural language. Provides secure access to sales data, best-seller identification, and revenue analytics via the PrestaShop Webservice API.

**Version:** 1.0
**Status:** In Development

> 📘 **For detailed implementation guidance:** See [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) for a comprehensive day-by-day development plan with complete code examples.

## Quick Start

### For Developers Starting Fresh

```bash
# 1. Clone and setup
git clone <repo-url>
cd prestashop-mcp-analytics
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your PrestaShop credentials

# 3. Build and test
npm run build
npm test

# 4. Run the server
npm start
```

### For Claude Code Working on This Project

When implementing features, follow this order:
1. **Read this file (CLAUDE.md)** for architecture and requirements
2. **Check [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)** for detailed code examples
3. **Start with tests** (TDD approach)
4. **Implement incrementally** following the sprint structure
5. **Validate at checkpoints** as defined in the implementation plan

## Project Goals

Enable e-commerce managers, business analysts, and store owners to query their PrestaShop sales data conversationally through LLM interfaces. The server provides:
- Product sales statistics over custom date ranges
- **Product search by name** (natural language queries) - NEW in v1.3
- Best-seller identification by quantity or revenue
- Detailed order-level data with aggregations
- Multi-format responses (JSON/Markdown)

## Scope

### ✅ In Scope
- Read-only operations on sales data
- Product sales statistics retrieval
- Best-seller identification
- Date range filtering
- JSON and Markdown output formats
- Strict input validation
- Educational error messages

### ❌ Out of Scope
- Write operations (create/update/delete)
- Stock management
- Customer management
- File exports
- Integration with other platforms
- Multi-store support (post-MVP)

## Technology Stack

### Core
- **Runtime:** Node.js 18+
- **Language:** TypeScript 5.x (strict mode)
- **MCP SDK:** `@modelcontextprotocol/sdk` (latest)
- **Validation:** Zod 3.x
- **HTTP Client:** Axios 1.x

### Development Tools
- **Build:** TypeScript Compiler (`tsc`)
- **Linting:** ESLint (strict config)
- **Formatting:** Prettier

## Project Structure

```
src/
├── index.ts                    # Entry point + MCP server setup
├── config.ts                   # Configuration & environment variables
├── types.ts                    # TypeScript interfaces
├── constants.ts                # Constants (CHARACTER_LIMIT, etc.)
├── schemas/
│   ├── product-sales-stats.schema.ts
│   └── top-products.schema.ts
├── services/
│   ├── prestashop-api.service.ts    # API client wrapper
│   ├── orders.service.ts            # Orders business logic
│   └── products.service.ts          # Products business logic
├── formatters/
│   ├── markdown.formatter.ts
│   └── json.formatter.ts
├── tools/
│   ├── get-product-sales-stats.tool.ts
│   └── get-top-products.tool.ts
└── utils/
    ├── date.utils.ts
    ├── error.utils.ts
    └── validation.utils.ts
```

## MCP Tools to Implement

### Tool 1: `prestashop_get_product_sales_stats`

Retrieves detailed sales statistics for a specific product over a date range.

**Parameters (Zod Schema):**
```typescript
{
  product_id: z.number().int().positive().optional(),  // Required if product_name not provided
  product_name: z.string().min(2).max(255).optional(),  // Required if product_id not provided
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),  // YYYY-MM-DD
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  order_states: z.array(z.number().int().positive()).optional(),  // Filter by order states
  response_format: z.enum(['json', 'markdown']).default('markdown')
}
// With validation: Either product_id OR product_name must be provided
```

> **New in v1.3:** `product_name` parameter for natural language product search (case-insensitive, partial match, multi-language)
>
> **New in v1.1:** `order_states` parameter for flexible filtering by order status (e.g., `[4, 5]` for Shipped+Delivered)

**Returns:**
- Total quantity sold
- Total revenue (excl/incl tax)
- Average unit price
- Number of orders
- Order-level details (with truncation if > 100 orders)

**Annotations:**
```typescript
{ readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
```

### Tool 2: `prestashop_get_top_products`

Identifies best-selling products over a date range, sorted by quantity or revenue.

**Parameters (Zod Schema):**
```typescript
{
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  limit: z.number().int().min(1).max(100).default(10),
  sort_by: z.enum(['quantity', 'revenue']).default('quantity'),
  order_states: z.array(z.number().int().positive()).optional(),  // Filter by order states
  response_format: z.enum(['json', 'markdown']).default('markdown')
}
```

> **New in v1.1:** `order_states` parameter for flexible filtering by order status

**Returns:**
- Ranked list of products
- Quantity sold and revenue for each
- Number of orders per product
- Average unit price

**Annotations:**
```typescript
{ readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
```

## Order States Filtering (New in v1.1)

Both tools now support filtering by order states to match specific business requirements:

### Common PrestaShop Order States

| Code | State Name | Description | Recommended for Stats |
|------|------------|-------------|----------------------|
| 1 | Awaiting check payment | Payment pending | ❌ No |
| 2 | Payment accepted | Payment received | ✅ Yes |
| 3 | Processing in progress | Being prepared | ⚠️ Optional |
| 4 | Shipped | En route to customer | ✅ Yes |
| 5 | Delivered | Received by customer | ✅ Yes |
| 6 | Canceled | Order canceled | ❌ No |
| 7 | Refunded | Money returned | ❌ No |
| 8 | Payment error | Payment failed | ❌ No |

### Usage Examples

```typescript
// Match PrestaShop backoffice statistics (excludes Processing + Refunded)
{
  product_id: 13557,
  date_from: "2025-01-01",
  date_to: "2025-01-31",
  order_states: [4, 5]  // Shipped + Delivered only
}

// Include all "valid" orders (paid through delivered)
{
  product_id: 13557,
  date_from: "2025-01-01",
  date_to: "2025-01-31",
  order_states: [2, 3, 4, 5]  // Payment accepted through Delivered
}

// All states (default behavior when parameter omitted)
{
  product_id: 13557,
  date_from: "2025-01-01",
  date_to: "2025-01-31"
  // No order_states = includes ALL states
}
```

### Backoffice Parity

**Problem:** API may return different quantities than PrestaShop backoffice.

**Solution:** PrestaShop backoffice typically excludes:
- State 3 (Processing in progress)
- State 7 (Refunded)

To match backoffice exactly, use: `order_states: [4, 5]`

## Development Commands

### Setup
```bash
npm install
cp .env.example .env
# Edit .env with your PrestaShop credentials
```

### Build
```bash
npm run build          # Compile TypeScript to dist/
```

### Development
```bash
npm run dev            # Watch mode with auto-rebuild
```

### Testing
```bash
npm test               # Run all tests
npm run test:watch     # Watch mode
npm run test:coverage  # Generate coverage report (target: >80%)
```

### Linting & Formatting
```bash
npm run lint           # ESLint check
npm run lint:fix       # Auto-fix issues
npm run format         # Prettier check
npm run format:fix     # Auto-format code
```

### Running the MCP Server
```bash
node dist/index.js     # Production
```

## Development Workflow

### Creating a New Feature

```bash
# 1. Create feature branch
git checkout -b feature/your-feature-name

# 2. Write tests first (TDD)
touch tests/unit/services/your-feature.test.ts

# 3. Implement feature
# Follow the patterns in IMPLEMENTATION_PLAN.md

# 4. Run tests continuously
npm run test:watch

# 5. Before committing
npm run build && npm test && npm run lint

# 6. Commit with conventional commits
git commit -m "feat: add your feature description"
```

### Code Review Checklist

Before submitting PR, ensure:
- [ ] All tests pass (`npm test`)
- [ ] Coverage remains > 80% (`npm run test:coverage`)
- [ ] No TypeScript errors (`npm run build`)
- [ ] No lint errors (`npm run lint`)
- [ ] No security vulnerabilities (`npm audit`)
- [ ] JSDoc comments on public functions
- [ ] Error handling with educational messages
- [ ] Input validation with Zod schemas
- [ ] No secrets in code or logs

### Testing Strategy

**Unit Tests:**
- Services layer: Mock API responses
- Formatters: Test with sample data
- Utils: Test edge cases

**Integration Tests:**
- Tools: Test complete workflows
- Use fixtures for consistent data

**Example Test Structure:**
```typescript
describe('OrdersService', () => {
  describe('getProductSalesStats', () => {
    it('should aggregate sales correctly', async () => {
      // Arrange: Mock API responses
      // Act: Call service method
      // Assert: Verify aggregation
    });

    it('should handle empty results', async () => {
      // Test edge case
    });

    it('should throw on invalid date range', async () => {
      // Test error handling
    });
  });
});
```

## Architecture & Data Flow

```
LLM/User
   │
   ↓ (MCP Protocol via stdio)
MCP Server (index.ts)
   ├─ Tool registration
   └─ Transport setup
   │
   ↓
Tool Handler
   ├─ Zod validation
   └─ Error handling
   │
   ↓
Service Layer
   ├─ API requests
   ├─ Data aggregation
   └─ Business logic
   │
   ↓
PrestaShop API
   └─ /api/orders, /api/order_details, /api/products
```

## Key Technical Considerations

### PrestaShop API Integration
- Use `output_format=JSON` parameter (API defaults to XML)
- Authentication: Basic auth with WS_KEY as username, empty password
- No native pagination metadata - implement offset-based fetching with safety limits
- Product filtering requires multiple calls: fetch orders → filter order_details by product_id
- All aggregation must happen server-side

### Data Aggregation Pattern

**Conceptual Flow:**
```typescript
// 1. Fetch all orders in date range
// 2. For each order, fetch order_details
// 3. Filter order_details by product_id
// 4. Aggregate quantities and revenue
// 5. Apply truncation if needed (CHARACTER_LIMIT = 25,000)
```

**Implementation Example:**
```typescript
async getProductSalesStats(productId: number, dateFrom: string, dateTo: string) {
  // Step 1: Validate inputs
  validateDateRange(dateFrom, dateTo);

  // Step 2: Fetch product metadata
  const product = await this.apiService.getProduct(productId);

  // Step 3: Get all order_details for this product
  const orderDetails = await this.apiService.getAllOrderDetails({
    product_id: productId
  });

  // Step 4: Filter by date range (server-side filtering)
  const filtered = orderDetails.filter(detail => {
    const orderDate = new Date(detail.date_add);
    return orderDate >= new Date(dateFrom) && orderDate <= new Date(dateTo);
  });

  // Step 5: Aggregate data
  const stats = filtered.reduce((acc, detail) => {
    acc.totalQuantity += Number(detail.product_quantity);
    acc.totalRevenue += Number(detail.total_price_tax_incl);
    return acc;
  }, { totalQuantity: 0, totalRevenue: 0 });

  return stats;
}
```

### Response Truncation
- **Limit:** 25,000 characters (~5,000 tokens)
- **Strategy:** Intelligent truncation with clear messaging
- **Message:** Include suggestion to use more specific filters

### Error Handling
All errors must return educational messages:
- `401 Unauthorized` → "Authentication failed. Verify your PRESTASHOP_WS_KEY."
- `404 Not Found` → "Product not found. Check the product_id parameter."
- `ECONNABORTED` → "Request timeout. Try reducing the date range or limit."
- Never expose internal errors or stack traces to LLM

### Performance Targets
| Operation | Target | Max |
|-----------|--------|-----|
| Single product stats (1 month) | < 2s | 5s |
| Top 10 products (1 month) | < 3s | 8s |
| Top 100 products (3 months) | < 10s | 30s |

## Security Requirements

### Environment Variables
```bash
# Required
PRESTASHOP_BASE_URL=https://your-store.com
PRESTASHOP_WS_KEY=YOUR_32_CHAR_WEBSERVICE_KEY_HERE

# Optional
NODE_ENV=production
LOG_LEVEL=info
```

**Critical:** Validate environment variables at startup. Exit with error code 1 if missing.

### Security Checklist
- ✅ Never log API keys or secrets
- ✅ Use Zod `.strict()` mode on all schemas
- ✅ Validate date ranges (date_from < date_to, max 2 years)
- ✅ Enforce read-only operations (GET/HEAD only)
- ✅ Set request timeout (30s)
- ✅ Limit concurrent requests (max 5 parallel)
- ✅ Sanitize URLs in logs (remove ws_key parameter)
- ✅ Use HTTPS for PrestaShop URL (warn if HTTP)

### Read-Only Enforcement
All tools must have these annotations:
```typescript
{
  readOnlyHint: true,        // No modifications
  destructiveHint: false,    // Non-destructive
  idempotentHint: true,      // Can be repeated safely
  openWorldHint: true        // External API
}
```

Only allow HTTP methods: `GET`, `HEAD`

## Limitations & Constraints

### Technical Limits
- **Date range:** Max 730 days (2 years) per query
- **Top products limit:** 1-100 products (default: 10)
- **Orders per product:** Max 1,000 (safety limit for aggregation)
- **Response size:** 25,000 characters (truncated with message)
- **Request timeout:** 30 seconds
- **Concurrent requests:** Max 5 parallel

### PrestaShop Requirements
- **Version:** PrestaShop 1.7.x or 8.x
- **Webservice:** Must be enabled (Advanced Parameters > Webservice)
- **Permissions:** Read access on `orders`, `order_details`, `products`
- **CGI Mode:** May need to be enabled depending on hosting

## Implementation Phases

> 📘 **Detailed Implementation Guide:** For complete code examples, file-by-file implementation order, and validation checkpoints, see [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md).

### Phase 1: Core Infrastructure (3 days)
- Setup TypeScript project with MCP SDK
- Environment configuration and validation
- PrestaShop API service (HTTP client)
- Zod schemas for both tools
- Unit tests for services

**Key Deliverables:**
- `src/config.ts`, `src/types.ts`, `src/constants.ts`
- `src/utils/` (date, error, validation)
- `src/services/prestashop-api.service.ts`

**Checkpoint:** Project compiles, config validated, API service mocked and tested

### Phase 2: Tool Implementation (4 days)
- Implement `prestashop_get_product_sales_stats`
- Implement `prestashop_get_top_products`
- JSON and Markdown formatters
- Complete error handling
- Integration tests

**Key Deliverables:**
- `src/services/orders.service.ts` (business logic)
- `src/schemas/` (Zod validation)
- `src/formatters/` (JSON/Markdown output)
- `src/tools/` (MCP tool handlers)

**Checkpoint:** Both tools registered, schemas validated, formatters produce correct output

### Phase 3: Polish & Security (2 days)
- Truncation logic implementation
- Strict input validation
- Security audit
- Performance profiling
- Complete README documentation

**Key Deliverables:**
- `src/utils/truncation.utils.ts`
- Security checklist completed
- README.md finalized
- Performance benchmarks documented

**Checkpoint:** Server runs end-to-end, no secrets exposed, tests pass

### Phase 4: Testing & Release (2 days)
- End-to-end testing
- Test with 10+ realistic user scenarios
- CI/CD pipeline setup
- Release v1.0.0

**Key Deliverables:**
- `.github/workflows/ci.yml`
- Test coverage > 80%
- Claude Desktop integration tested
- v1.0.0 release tag

**Checkpoint:** CI passing, documentation complete, ready for production

## Common User Questions (Examples)

**Simple (by ID):**
- "How many units of product ID 42 were sold this month?"
- "Show me my top 5 products this week"

**Simple (by name - NEW in v1.3):**
- "How many 'DJI O4 Air Unit' were sold this month?"
- "Show me sales for 'Condensateur Panasonic' last week"
- "What are the stats for products with 'motor' in the name?"

**Intermediate:**
- "Compare sales of product 15 between January and February"
- "What are my top 20 best-sellers for the quarter?"
- "Show me revenue for 'T-Motor F80' this quarter"

**Complex:**
- "Analyze sales of product X for the entire year with order details"
- "Which products generated more than €10,000 in Q3?"
- "Compare sales of 'DJI Camera' vs product #123 in Q4"

## Code Quality Standards

- **TypeScript:** Strict mode, no `any` types
- **Test Coverage:** Minimum 80%
- **Linting:** Zero ESLint errors
- **Dependencies:** Zero `npm audit` vulnerabilities
- **Build:** Clean build with no warnings
- **Documentation:** All public functions must have JSDoc comments

## Troubleshooting

### Common Issues

#### 1. Environment Validation Fails

**Error:** `Environment validation failed: PRESTASHOP_WS_KEY: String must contain exactly 32 character(s)`

**Solution:**
```bash
# Check your .env file
cat .env | grep PRESTASHOP_WS_KEY

# Ensure the key is exactly 32 characters
# Generate a new key in PrestaShop: Advanced Parameters > Webservice
```

#### 2. Authentication Failed (401)

**Error:** `Authentication failed. Verify your PRESTASHOP_WS_KEY`

**Checklist:**
- [ ] Webservice is enabled in PrestaShop
- [ ] API key has correct permissions (GET on orders, order_details, products)
- [ ] Key is active (not disabled)
- [ ] CGI mode is enabled if using Apache with CGI

**Test authentication:**
```bash
curl -u "YOUR_WS_KEY:" "https://your-store.com/api/products?output_format=JSON&display=full&limit=1"
```

#### 3. Product Not Found (404)

**Error:** `Product with ID X not found`

**Debugging:**
```typescript
// Check if product exists and is accessible via API
const response = await fetch(
  `https://your-store.com/api/products/${productId}?output_format=JSON`,
  { headers: { Authorization: `Basic ${btoa(wsKey + ':')}` } }
);
```

#### 4. Response Timeout

**Error:** `Request timeout. Try reducing the date range or limit parameter`

**Solutions:**
- Reduce date range (try 1 month instead of 1 year)
- Reduce limit parameter (try 10 instead of 100)
- Check PrestaShop server performance
- Consider implementing caching for frequently accessed data

#### 5. TypeScript Compilation Errors

**Error:** `Cannot find module '@modelcontextprotocol/sdk'`

**Solution:**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Ensure correct Node.js version
node -v  # Should be 18.x or 20.x
```

#### 6. Tests Failing

**Common causes:**
- Outdated fixtures in `tests/fixtures/`
- Missing environment variables in test environment
- API responses changed format

**Debug tests:**
```bash
# Run single test file
npm test -- tests/unit/services/orders.service.test.ts

# Run with verbose output
npm test -- --verbose

# Update snapshots if needed
npm test -- -u
```

### Debugging Tips

**Enable debug logging:**
```bash
# In .env
LOG_LEVEL=debug

# Run server
npm start
```

**Test with MCP Inspector:**
```bash
# Install MCP Inspector
npm install -g @modelcontextprotocol/inspector

# Run inspection
mcp-inspector node dist/index.js
```

**Mock PrestaShop API for local testing:**
```typescript
// tests/mocks/prestashop-api.mock.ts
export const mockOrderDetails = [
  {
    id: 1,
    product_id: 42,
    product_quantity: 2,
    total_price_tax_incl: '36.00',
    date_add: '2024-01-15 10:30:00',
  },
  // ... more mock data
];
```

## References

- [PrestaShop Webservice Documentation](https://devdocs.prestashop.com/8/webservice/)
- [MCP SDK Documentation](https://github.com/modelcontextprotocol/sdk)
- [Zod Documentation](https://zod.dev)
- [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) - Detailed day-by-day implementation guide
