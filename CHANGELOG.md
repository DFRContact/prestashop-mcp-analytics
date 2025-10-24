# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
