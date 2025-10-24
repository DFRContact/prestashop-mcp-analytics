# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Performance
- **Parallel Batch Processing**: Implement concurrent API request batching for significant performance gains
  - Replace sequential batch processing with parallel execution (max 5 concurrent requests)
  - Increase batch size from 20 to 50 orders per batch for better efficiency
  - Add performance logging via stderr for monitoring: `[PERF] Processing N orders in M batches`
  - Real-world performance: ~5x faster for large datasets (tested with 38,503 orders in 112s vs estimated 560s sequential)
  - New `BATCH_CONFIG` constants for configurable batch sizing and concurrency control
  - Affects both `prestashop_get_product_sales_stats` and `prestashop_get_top_products` tools
  - Maintains full backward compatibility - same results, just faster execution

### Fixed
- **Data Type Conversion Bug**: Fix string concatenation bug in quantity aggregation (src/services/orders.service.ts:80,244)
  - PrestaShop API returns numeric fields as strings despite TypeScript type definitions
  - Previous code used `+=` operator which concatenated strings instead of adding numbers
  - Resulted in `total_quantity_sold` being "0111511..." instead of proper sum (e.g., 654)
  - Fixed by explicit numeric conversion using unary `+` operator on `product_quantity`, `product_id`, and `id_order`
  - Affects both `getProductSalesStats` and `getTopProducts` methods
  - No regression: 100% test success rate (14/14 integration tests + 4/4 regression tests passed)

## [1.1.5] - 2025-01-24

### Fixed
- **Input Schema Format**: Convert JSON Schema to flat structure expected by MCP SDK
  - MCP SDK requires `inputSchema` with flat structure: `{type: "object", properties: {...}, required: [...]}`
  - Previous versions used `$ref` and `definitions` which Claude Desktop couldn't parse
  - New `zodToMcpJsonSchema` utility recursively resolves all `$ref` references
  - Removes `$schema`, `$ref`, and `definitions` from root level
  - This is the definitive fix for the gray toggle issue in Claude Desktop

## [1.1.4] - 2025-01-24

### Fixed
- **Tool Annotations**: Include annotations in tools/list response
  - Adds readOnlyHint, destructiveHint, idempotentHint, and openWorldHint annotations
  - Provides additional metadata for MCP clients to properly handle tools
  - May resolve gray toggle issue in Claude Desktop

## [1.1.3] - 2025-01-24

### Fixed
- **Tool Schemas**: Convert Zod schemas to JSON Schema for MCP client compatibility
  - Fixes tools not appearing in Claude Desktop (gray toggle issue)
  - Add `zod-to-json-schema` dependency for proper schema conversion
  - Clients now receive valid JSON Schema instead of Zod internal objects
  - Enables tool visibility and activation in Claude Desktop

## [1.1.2] - 2025-01-24

### Fixed
- **Dependencies**: Move dotenv from dependencies to devDependencies
  - Fixes "Unexpected token 'd', '[dotenv@17...'" error in Claude Desktop
  - Environment variables are provided by MCP client, not loaded from .env file
  - Reduces package size and prevents npm install messages on stdout

## [1.1.1] - 2025-01-24

### Fixed
- **Binary Name**: Rename bin from `prestashop-mcp` to `prestashop-mcp-analytics` to match package name
  - Fixes confusion in Claude Desktop and other MCP client configurations
  - Usage: `npx -y prestashop-mcp-analytics` now works correctly

## [1.1.0] - 2025-01-24

### Added
- **Order States Filtering**: New optional `order_states` parameter for both MCP tools
  - Filter statistics by specific PrestaShop order states (e.g., `[4, 5]` for Shipped + Delivered)
  - Support for single or multiple states with OR logic
  - Enables backoffice parity (excludes Processing and Refunded states)
  - Comprehensive documentation of common PrestaShop states and recommended filters
- Integration tests with real PrestaShop data validation
- Environment variable support via dotenv
- `.gitignore` entries for test/demo files

### Fixed
- **Backoffice Discrepancy**: Resolved +7 unit difference between API and PrestaShop backoffice
  - Root cause: API included Processing (state 3) and Refunded (state 7) orders
  - Solution: Use `order_states: [4, 5]` to match backoffice exactly
- API service now supports array of states with pipe operator (`[1|2|3]` format)

### Changed
- Updated all schemas with optional `order_states` parameter
- Enhanced tool descriptions with state filtering examples
- Updated `OrderFilters` interface to accept `number | number[]`

## [1.0.0] - 2025-01-15

### Added
- Initial MCP PrestaShop Analytics Server implementation
- Two MCP tools:
  - `prestashop_get_product_sales_stats`: Get detailed sales statistics for a specific product
  - `prestashop_get_top_products`: Identify best-selling products by quantity or revenue
- Read-only PrestaShop Webservice API integration
- Support for JSON and Markdown response formats
- Strict input validation with Zod schemas
- Date range filtering with 2-year maximum limit
- Intelligent response truncation (25,000 character limit)
- Comprehensive error handling with educational messages
- TypeScript strict mode implementation
- ESLint strict type-checking
- GitHub Actions CI/CD pipeline
- Automated npm publishing on version tags

### Security
- Read-only operations only (GET/HEAD)
- Environment variable validation at startup
- Request timeout protection (30s)
- Secure credential handling via Basic Auth
- No sensitive data logging

## [1.0.0] - TBD

### Added
- Initial release
- Core MCP server functionality
- PrestaShop sales analytics tools
- Comprehensive documentation

[Unreleased]: https://github.com/DFRContact/prestashop-mcp-analytics/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/DFRContact/prestashop-mcp-analytics/releases/tag/v1.0.0
