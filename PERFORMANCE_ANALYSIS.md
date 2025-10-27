# Performance Analysis & API Optimization

## Executive Summary

**Problem**: Current implementation uses sequential batch processing, causing long execution times for large datasets.

**Impact**: Product 13557 audit (1,528 orders) requires ~77 sequential API calls, potentially taking several minutes.

**Solution**: Implement parallel batch processing with concurrency control, reducing execution time by up to 5x.

---

## Current Architecture

### Data Flow

```
User Request
   ↓
MCP Tool Handler (get-product-sales-stats.tool.ts)
   ↓
OrdersService.getProductSalesStats()
   ├─ 1. Get product info (1 API call)
   ├─ 2. Get all orders in date range (N paginated calls)
   ├─ 3. Batch order IDs into groups of 20
   └─ 4. FOR EACH BATCH (SEQUENTIAL):
         └─ getAllOrderDetails() with filter[id_order]=[id1|id2|...|id20]
            └─ Paginated requests (100 details per page, max 1000)
   ↓
Aggregate & Format Results
```

### Key Bottleneck: Sequential Batch Processing

**Location**: `src/services/orders.service.ts:171-183`

```typescript
// Current implementation - SEQUENTIAL
const batchSize = 20;
for (let i = 0; i < orderIds.length; i += batchSize) {
  const batch = orderIds.slice(i, i + batchSize);
  const orderFilter = `[${batch.join('|')}]`;

  const details = await this.apiService.getAllOrderDetails({
    id_order: orderFilter,
    product_id: productId,
  });

  allDetails.push(...details);
}
```

---

## Performance Analysis: Audit Dataset

### Dataset Characteristics (Product 13557 - DJI O4 Air Unit Pro)

- **Period**: 2025-01-01 to 2025-12-31
- **Total Orders**: 1,528 orders
- **Order Details**: 1,528 line items (one product per order)
- **Quarterly Distribution**:
  - Q1: 365 orders
  - Q2: 382 orders
  - Q3: 390 orders
  - Q4: 391 orders

### Current Performance Metrics

| Metric | Value | Calculation |
|--------|-------|-------------|
| Batch Size | 20 orders | Hardcoded in orders.service.ts:171 |
| Number of Batches | 77 batches | ⌈1528 / 20⌉ = 77 |
| Execution Pattern | Sequential | `for` loop with `await` |
| API Calls per Batch | 1-10 calls | Depends on order details pagination |
| **Estimated Total Time** | **2-5 minutes** | 77 batches × (network latency + processing) |

### Performance Calculation

```
Sequential Time = Σ(batch_time) for each batch
                = num_batches × (avg_network_latency + avg_processing_time)
                = 77 × (500ms + 300ms)  // Conservative estimate
                = 77 × 800ms
                = ~62 seconds minimum

With pagination overhead and API variability: 2-5 minutes realistic
```

---

## Root Cause Analysis

### 1. Sequential Processing Bottleneck

**Code Location**: `src/services/orders.service.ts:171-183`

**Problem**: Each batch waits for the previous batch to complete before starting.

**Impact**:
- Linear time complexity: O(n) where n = number of batches
- No utilization of network/CPU idle time
- Single-threaded execution despite async/await capability

### 2. Conservative Batch Size

**Current**: 20 orders per batch
**Limitation**: PrestaShop API can handle much larger filter arrays

**Example**: `filter[id_order]=[1|2|3|...|100]` works fine

**Impact**:
- More batches = more overhead
- Each batch has fixed costs (HTTP handshake, auth, parsing)
- Suboptimal utilization of API capacity

### 3. No Concurrency Control

**Missing**: Rate limiting for parallel requests
**Risk**: Without limits, parallel implementation could overwhelm PrestaShop server

**Best Practice**: Limit concurrent requests (e.g., max 5 parallel)

### 4. No Progress Reporting

**Current**: Silent execution for long operations
**User Experience**: No feedback during 2-5 minute wait

**MCP Capability**: Protocol supports progress notifications

---

## Proposed Optimizations

### Optimization 1: Parallel Batch Processing ⭐ **HIGH IMPACT**

**Implementation**:

```typescript
// OPTIMIZED: Parallel processing with concurrency limit
async getProductSalesStats(
  productId: number,
  dateFrom: string,
  dateTo: string,
  orderStates?: number[]
): Promise<ProductSalesStats> {
  // ... (existing product and orders fetch)

  const orderIds = orders.map((o) => Number(o.id));

  // Configuration
  const batchSize = 50;        // Increased from 20
  const maxConcurrent = 5;     // Limit concurrent requests

  // Create all batches
  const batches: number[][] = [];
  for (let i = 0; i < orderIds.length; i += batchSize) {
    batches.push(orderIds.slice(i, i + batchSize));
  }

  const allDetails: PrestashopOrderDetail[] = [];

  // Process batches in parallel with concurrency limit
  for (let i = 0; i < batches.length; i += maxConcurrent) {
    const concurrentBatches = batches.slice(i, i + maxConcurrent);

    // Execute up to 5 batches in parallel
    const promises = concurrentBatches.map(async (batch) => {
      const orderFilter = `[${batch.join('|')}]`;
      return this.apiService.getAllOrderDetails({
        id_order: orderFilter,
        product_id: productId,
      });
    });

    const results = await Promise.all(promises);

    // Flatten results
    results.forEach((details) => allDetails.push(...details));
  }

  // ... (rest of aggregation logic)
}
```

**Expected Performance Gain**:

```
Parallel Time = ⌈num_batches / max_concurrent⌉ × avg_batch_time
              = ⌈31 / 5⌉ × 800ms  // 31 batches with size 50
              = 7 × 800ms
              = ~5.6 seconds

Speedup: 62s / 5.6s = ~11x faster
Real-world estimate: 5-8x faster (accounting for overhead)
```

### Optimization 2: Adaptive Batch Sizing

**Dynamic Sizing Logic**:

```typescript
function calculateOptimalBatchSize(totalOrders: number): number {
  if (totalOrders <= 100) return totalOrders;  // Single batch
  if (totalOrders <= 500) return 50;
  if (totalOrders <= 2000) return 100;
  return 150;  // Max for very large datasets
}
```

**Benefits**:
- Small queries: Single request (no batching overhead)
- Medium queries: Balanced batching (50-100 per batch)
- Large queries: Maximum efficiency (100-150 per batch)

### Optimization 3: Progress Reporting (MCP Notifications)

**Implementation**:

```typescript
// Emit progress notifications during long operations
for (let i = 0; i < batches.length; i += maxConcurrent) {
  const progress = Math.round((i / batches.length) * 100);

  // MCP progress notification (if supported by client)
  console.error(`Progress: ${progress}% (${i}/${batches.length} batches)`);

  // ... execute batch
}
```

**User Experience**:
- Visible progress during long waits
- Better perception of responsiveness
- Ability to estimate completion time

### Optimization 4: Error Handling with Partial Results

**Current Behavior**: Single batch failure aborts entire operation

**Proposed**:

```typescript
const results = await Promise.allSettled(promises);

results.forEach((result, index) => {
  if (result.status === 'fulfilled') {
    allDetails.push(...result.value);
  } else {
    console.error(`Batch ${i + index} failed:`, result.reason);
    // Continue with other batches
  }
});

// Return partial results with warning
if (failedBatches > 0) {
  console.warn(`⚠️  ${failedBatches} batches failed. Results may be incomplete.`);
}
```

**Benefits**:
- Resilience to transient failures
- Partial results better than no results
- Clear error reporting

---

## Impact Analysis: Audit Dataset

### Current vs Optimized Performance

| Metric | Current | Optimized | Improvement |
|--------|---------|-----------|-------------|
| **Batch Size** | 20 | 50 | 2.5x |
| **Number of Batches** | 77 | 31 | 2.5x fewer |
| **Execution Pattern** | Sequential | Parallel (max 5) | 5x concurrency |
| **API Calls** | 77 sequential | 7 parallel rounds | 11x reduction |
| **Estimated Time** | 60-120s | 8-15s | **5-8x faster** |
| **Progress Feedback** | None | Real-time | ✅ |
| **Error Handling** | Fail-fast | Partial results | ✅ |

### Real-World Scenarios

#### Scenario 1: Small Query (50 orders)
- **Current**: 3 batches × 800ms = 2.4s
- **Optimized**: 1 batch × 800ms = 0.8s
- **Gain**: 3x faster

#### Scenario 2: Medium Query (500 orders)
- **Current**: 25 batches × 800ms = 20s
- **Optimized**: 2 parallel rounds (10 batches) × 800ms = 1.6s
- **Gain**: 12x faster

#### Scenario 3: Large Query (1,528 orders - Audit)
- **Current**: 77 batches × 800ms = 62s
- **Optimized**: 7 parallel rounds (31 batches) × 800ms = 5.6s
- **Gain**: 11x faster

---

## Implementation Plan

### Phase 1: Core Parallel Processing (Priority: HIGH)

**Tasks**:
1. ✅ Create performance analysis document (this file)
2. ⬜ Implement parallel batch processing in `OrdersService.getProductSalesStats()`
3. ⬜ Implement parallel batch processing in `OrdersService.getTopProducts()`
4. ⬜ Add configuration for `maxConcurrent` (default: 5)
5. ⬜ Add unit tests for parallel execution
6. ⬜ Test with audit dataset (1,528 orders)

**Estimated Time**: 4-6 hours
**Expected Gain**: 5-8x performance improvement

### Phase 2: Adaptive Batching (Priority: MEDIUM)

**Tasks**:
1. ⬜ Implement `calculateOptimalBatchSize()` function
2. ⬜ Replace hardcoded `batchSize = 20` with adaptive sizing
3. ⬜ Add tests for various dataset sizes
4. ⬜ Document batch size recommendations

**Estimated Time**: 2-3 hours
**Expected Gain**: 10-20% additional improvement for varied workloads

### Phase 3: Progress Reporting (Priority: MEDIUM)

**Tasks**:
1. ⬜ Research MCP progress notification support
2. ⬜ Implement progress reporting via `console.error` (visible to MCP clients)
3. ⬜ Add progress percentage calculation
4. ⬜ Test with Claude Desktop

**Estimated Time**: 2-3 hours
**Expected Gain**: Better UX, no performance change

### Phase 4: Enhanced Error Handling (Priority: LOW)

**Tasks**:
1. ⬜ Implement `Promise.allSettled` for partial results
2. ⬜ Add warning messages for failed batches
3. ⬜ Add retry logic for transient failures (optional)
4. ⬜ Document error scenarios

**Estimated Time**: 3-4 hours
**Expected Gain**: Better reliability and user feedback

---

## Configuration Recommendations

### Proposed Constants (src/constants.ts)

```typescript
export const BATCH_CONFIG = {
  // Parallel processing
  MAX_CONCURRENT_BATCHES: 5,        // Limit concurrent API requests

  // Batch sizing
  BATCH_SIZE_SMALL: 50,              // For < 500 orders
  BATCH_SIZE_MEDIUM: 100,            // For 500-2000 orders
  BATCH_SIZE_LARGE: 150,             // For > 2000 orders

  // Safety limits
  MAX_ORDERS_PER_BATCH: 200,         // PrestaShop URL limit safety
  MAX_RETRIES: 2,                    // Retry failed batches
  RETRY_DELAY_MS: 1000,              // Delay between retries
};
```

### PrestaShop API Considerations

**URL Length Limit**: ~8000 characters
**Max Order IDs in Filter**: ~200 IDs (conservative, depends on ID length)
**Rate Limiting**: No documented limit, but conservative approach recommended

**Recommendation**: Start with `maxConcurrent = 5` and monitor server response times.

---

## Risk Assessment

### Risk 1: PrestaShop Server Overload
- **Probability**: Low-Medium
- **Impact**: High (503 errors, slow responses)
- **Mitigation**: Conservative `maxConcurrent = 5`, configurable limit
- **Monitoring**: Log response times, add timeout handling

### Risk 2: Network Errors in Parallel Execution
- **Probability**: Medium
- **Impact**: Medium (partial failures)
- **Mitigation**: `Promise.allSettled`, retry logic, partial results
- **Monitoring**: Error logging, failed batch counter

### Risk 3: Memory Usage with Large Datasets
- **Probability**: Low
- **Impact**: Medium (Node.js memory limits)
- **Mitigation**: Process in rounds (not all batches at once), existing safety limits
- **Monitoring**: Monitor memory usage in tests

### Risk 4: Breaking Changes
- **Probability**: Low
- **Impact**: High (existing functionality broken)
- **Mitigation**: Comprehensive unit tests, integration tests with real data
- **Rollback Plan**: Feature flag to toggle parallel processing

---

## Testing Strategy

### Unit Tests

```typescript
describe('OrdersService - Parallel Processing', () => {
  test('should process batches in parallel', async () => {
    // Mock API calls with delays
    // Verify parallel execution (time < sequential time)
  });

  test('should respect maxConcurrent limit', async () => {
    // Verify max 5 concurrent calls
  });

  test('should handle partial failures gracefully', async () => {
    // Mock some batch failures
    // Verify partial results returned
  });
});
```

### Integration Tests

1. **Small Dataset** (50 orders): Verify single-batch optimization
2. **Medium Dataset** (500 orders): Verify parallel efficiency
3. **Large Dataset** (1,528 orders): Benchmark against audit data
4. **Error Scenarios**: Network timeouts, API errors, partial failures

### Benchmark Script

```javascript
// benchmark-parallel-vs-sequential.js
const { performance } = require('perf_hooks');

async function benchmark(orderCount, mode) {
  const start = performance.now();

  if (mode === 'sequential') {
    // Current implementation
  } else {
    // Optimized parallel implementation
  }

  const end = performance.now();
  return end - start;
}

// Run for 50, 500, 1528 orders
// Compare sequential vs parallel
```

---

## Monitoring & Metrics

### Performance Metrics to Track

```typescript
interface PerformanceMetrics {
  totalOrders: number;
  batchSize: number;
  numBatches: number;
  maxConcurrent: number;
  executionTimeMs: number;
  apiCalls: number;
  failedBatches: number;
  partialResults: boolean;
}
```

### Logging Strategy

```typescript
console.error(`[PERF] Processing ${totalOrders} orders in ${numBatches} batches (size=${batchSize}, concurrent=${maxConcurrent})`);
// ... during execution
console.error(`[PERF] Completed in ${executionTimeMs}ms (${apiCalls} API calls, ${failedBatches} failures)`);
```

---

## Conclusion

### Key Findings

1. **Current bottleneck**: Sequential batch processing in `orders.service.ts:171-183`
2. **Impact**: 1,528 orders take 60-120 seconds (77 sequential API calls)
3. **Solution**: Parallel batch processing with concurrency limit
4. **Expected gain**: **5-8x performance improvement**

### Recommended Next Steps

1. ✅ **Immediate**: Implement Phase 1 (Parallel Processing) - highest ROI
2. ⬜ **Short-term**: Add Phase 2 (Adaptive Batching) - marginal gains
3. ⬜ **Medium-term**: Add Phase 3 (Progress Reporting) - UX improvement
4. ⬜ **Long-term**: Add Phase 4 (Enhanced Error Handling) - reliability

### Success Criteria

- [ ] Audit dataset (1,528 orders) completes in < 15 seconds
- [ ] No regression in accuracy (same results as current)
- [ ] Graceful handling of API errors (partial results)
- [ ] Progress feedback for operations > 5 seconds
- [ ] Configurable concurrency limit
- [ ] Comprehensive test coverage (>80%)

---

**Document Version**: 1.0
**Date**: 2025-01-24
**Author**: Performance Analysis for @dfr_contact/prestashop-mcp-analytics
**Related Issue**: API call methodology optimization
