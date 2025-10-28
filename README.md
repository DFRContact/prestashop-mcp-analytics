# PrestaShop MCP Analytics

> **MCP server for read-only PrestaShop sales analytics via LLM interfaces.**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![MCP](https://img.shields.io/badge/MCP-1.0-orange.svg)](https://modelcontextprotocol.io/)

## 🎯 Features

- 📊 **Product Sales Statistics** - Detailed sales breakdown by product
- 🔍 **Product Search by Name** - Find products using natural language search (NEW in v1.3)
- 🏆 **Top Selling Products** - Best-sellers by quantity or revenue
- 📅 **Flexible Date Ranges** - Query any period (up to 2 years)
- 🎨 **Multiple Output Formats** - JSON for APIs, Markdown for humans
- 🔒 **Secure & Read-Only** - No write operations, environment-based auth
- ⚡ **Efficient Pagination** - Handles large datasets with automatic pagination
- 🎯 **Order State Filtering** - Filter by order status for accurate reporting

## 📋 Prerequisites

- **Node.js** 18+
- **PrestaShop** 1.7.x or 8.x with Webservice enabled
- **API Key** with read permissions on `orders`, `order_details`, `products`

## 🚀 Installation

### 1. Install from npm

```bash
npm install @dfr_contact/prestashop-mcp-analytics
```

Or clone and install for development:

```bash
git clone <repository-url>
cd prestashop-mcp-analytics
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your PrestaShop credentials
```

**Required variables:**
```bash
PRESTASHOP_BASE_URL=https://your-prestashop-store.com
PRESTASHOP_WS_KEY=YOUR_32_CHARACTER_WEBSERVICE_KEY
```

### 3. Build

```bash
npm run build
```

### 4. Run

```bash
npm start
```

## 🔧 PrestaShop Setup

1. Go to **Advanced Parameters > Webservice**
2. **Enable webservice**
3. Create a new API key:
   - Click "Add new webservice key"
   - Generate a 32-character key
   - Enable the key (status: Yes)
   - Grant **GET** permissions on:
     - `orders`
     - `order_details`
     - `products`
   - Save

## 🛠️ Usage

### With Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "prestashop-analytics": {
      "command": "npx",
      "args": ["-y", "@dfr_contact/prestashop-mcp-analytics"],
      "env": {
        "PRESTASHOP_BASE_URL": "https://your-store.com",
        "PRESTASHOP_WS_KEY": "your_32_character_key_here"
      }
    }
  }
}
```

Or if installed globally:

```json
{
  "mcpServers": {
    "prestashop-analytics": {
      "command": "node",
      "args": ["/absolute/path/to/node_modules/@dfr_contact/prestashop-mcp-analytics/dist/index.js"],
      "env": {
        "PRESTASHOP_BASE_URL": "https://your-store.com",
        "PRESTASHOP_WS_KEY": "your_32_character_key_here"
      }
    }
  }
}
```

### Example Queries

**Get product sales statistics (by ID or name):**
```
"How many units of product ID 42 were sold in September 2024?"
"Show me revenue for product #15 this quarter"
"What are the sales for 'DJI O4 Air Unit' last month?"
"Get stats for 'Condensateur Panasonic' this week"
```

**Get top products:**
```
"What are my top 5 products this month?"
"Show me top 10 products by revenue in Q4 2024"
```

### 🔍 Product Search by Name (NEW in v1.3)

You can now search for products using their name instead of ID:

**Direct product name:**
```json
{
  "product_name": "DJI O4 Air Unit",
  "date_from": "2025-01-01",
  "date_to": "2025-01-31"
}
```

**Partial match (case-insensitive):**
```json
{
  "product_name": "motor",
  "date_from": "2025-01-01",
  "date_to": "2025-01-31"
}
```

**Features:**
- ✅ **Case-insensitive** partial matching
- ✅ **Multi-language** support (searches in all languages)
- ✅ **Fast performance** (~200-350ms for 500 products)
- ✅ **Smart handling**:
  - 0 results → helpful error message
  - 1 result → automatic selection
  - Multiple results → interactive list to choose from

**Example conversation:**
```
User: "Show me sales for Condensateur Panasonic last week"
Assistant: Found 2 products:
  1. Condensateur Panasonic Low ESR 680uF 35V (ID: 2557)
  2. Condensateur Panasonic Low ESR 1000uF 35V (ID: 3249)

Please specify which product you want by using the product_id.
```

### 🎯 Order State Filtering (NEW in v1.1)

Both tools support filtering by PrestaShop order states for precise reporting:

**Match PrestaShop backoffice statistics:**
```json
{
  "product_id": 42,
  "date_from": "2025-01-01",
  "date_to": "2025-01-31",
  "order_states": [4, 5]
}
```

**Common PrestaShop States:**
- `1` - Awaiting check payment
- `2` - Payment accepted
- `3` - Processing in progress
- `4` - Shipped
- `5` - Delivered
- `6` - Canceled
- `7` - Refunded
- `8` - Payment error

**Recommended filters:**
- **Backoffice parity**: `[4, 5]` (Shipped + Delivered only)
- **All valid orders**: `[2, 3, 4, 5]` (Payment accepted through Delivered)
- **All states**: Omit parameter (default behavior)

> 💡 **Tip:** PrestaShop backoffice typically excludes Processing (3) and Refunded (7) states from statistics. Use `order_states: [4, 5]` to match exactly.

## 🧪 Development

### Commands

```bash
npm run build          # Compile TypeScript
npm run dev            # Watch mode with auto-rebuild
npm test               # Run tests
npm run test:watch     # Tests in watch mode
npm run test:coverage  # Generate coverage report
npm run lint           # Check code quality
npm run lint:fix       # Auto-fix linting issues
npm run format         # Check code formatting
npm run format:fix     # Auto-format code
```

### Project Structure

```
src/
├── index.ts                    # Entry point + MCP server setup
├── config.ts                   # Configuration & environment
├── types.ts                    # TypeScript interfaces
├── constants.ts                # Global constants
├── schemas/                    # Zod validation schemas
│   ├── common.schema.ts
│   ├── product-sales-stats.schema.ts
│   └── top-products.schema.ts
├── services/                   # Business logic
│   ├── prestashop-api.service.ts
│   └── orders.service.ts
├── formatters/                 # Output formatting
│   ├── json.formatter.ts
│   └── markdown.formatter.ts
├── tools/                      # MCP tool handlers
│   ├── get-product-sales-stats.tool.ts
│   └── get-top-products.tool.ts
└── utils/                      # Utilities
    ├── date.utils.ts
    ├── error.utils.ts
    ├── validation.utils.ts
    └── truncation.utils.ts
```

## 📚 Documentation

- **[CLAUDE.md](./CLAUDE.md)** - Complete project architecture and specifications
- **[IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)** - Day-by-day implementation guide

## 🔒 Security

- ✅ Read-only operations only (GET requests)
- ✅ Environment-based authentication
- ✅ Strict input validation with Zod
- ✅ Request timeouts (30s)
- ✅ Response size limiting (25,000 chars)
- ✅ No secrets in logs

## ⚠️ Limitations

- **Date range:** Max 730 days (2 years) per query
- **Products limit:** 1-100 products per request
- **Response size:** Truncated at 25,000 characters
- **Orders:** Max 1,000 orders processed per query
- **Operations:** Read-only, no write support

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details

## 🆘 Support

For issues and questions:
- Check [CLAUDE.md](./CLAUDE.md) troubleshooting section
- Open an issue on GitHub

## 🎉 Acknowledgments

Built with:
- [Model Context Protocol SDK](https://github.com/modelcontextprotocol/sdk)
- [Zod](https://zod.dev) for validation
- [Axios](https://axios-http.com) for HTTP requests
