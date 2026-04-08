# ApnaGhr Performance Guide

## Why Slowness Happens (Root Cause Analysis)

### The N+1 Query Problem
The #1 cause of API slowness in this app has been the **N+1 query problem**:

```python
# BAD: N+1 queries (if 10 sellers, this makes 40 DB calls)
sellers = await db.users.find({"role": "seller"}).to_list(100)
for seller in sellers:
    stats = await db.referrals.count_documents({"seller_id": seller["id"]})  # 1 query per seller
    wallet = await db.wallets.find_one({"seller_id": seller["id"]})  # 1 query per seller
```

```python
# GOOD: Batch queries (only 3 DB calls regardless of seller count)
sellers = await db.users.find({"role": "seller"}).to_list(100)
seller_ids = [s["id"] for s in sellers]

# Single aggregation for all stats
stats = await db.referrals.aggregate([
    {"$match": {"seller_id": {"$in": seller_ids}}},
    {"$group": {"_id": "$seller_id", "count": {"$sum": 1}}}
]).to_list(None)

# Single query for all wallets
wallets = await db.wallets.find({"seller_id": {"$in": seller_ids}}).to_list(None)
```

### MongoDB Atlas Network Latency
Each query to Atlas has ~100-300ms network latency. With N+1 patterns:
- 10 sellers × 4 queries × 200ms = **8 seconds**
- With batching: 3 queries × 200ms = **0.6 seconds**

## Fixed Endpoints (April 8, 2026)

| Endpoint | Before | After | Fix Applied |
|----------|--------|-------|-------------|
| `/api/admin/sellers` | 8.3s | 1.1s | Batch aggregation for stats |
| `/api/visits/my-bookings` | 3.2s | 0.8s | Batch fetch riders/properties |
| `/api/seller/followups` | 1.6s | 0.08s | Single aggregation for stats |
| `/api/seller/referrals` | ~2s | 0.3s | Batch fetch properties/clients |
| `/api/seller/visits` | ~3s | 0.5s | Batch fetch users/properties |
| `/api/seller/commissions` | ~1s | 0.2s | Batch fetch properties |
| `/api/admin/riders/online` | ~2s | 0.3s | Batch fetch active visits/tasks |
| `/api/admin/properties` | 1.4s | 0.09s | Pagination + field projection |
| `/api/seller/dashboard` | 1.7s | 0.15s | Single aggregation for stats |

## Database Indexes Added

```python
# User queries
db.users.create_index([("role", 1), ("is_online", 1)])  # Online riders

# Visit queries  
db.visit_bookings.create_index("referred_by")  # Seller referrals
db.visit_bookings.create_index([("rider_id", 1), ("status", 1)])  # Active visits

# Seller queries
db.seller_referrals.create_index("seller_id")
db.seller_followups.create_index([("seller_id", 1), ("is_closed", 1)])
db.seller_followups.create_index([("seller_id", 1), ("status", 1)])

# Task queries
db.tolet_tasks.create_index([("rider_id", 1), ("status", 1)])

# Wallet queries
db.seller_wallets.create_index("seller_id")
db.rider_wallets.create_index("rider_id")
```

## Prevention Rules for Future Development

### Rule 1: Never query in loops
```python
# NEVER DO THIS
for item in items:
    related = await db.collection.find_one({"item_id": item["id"]})
```

### Rule 2: Use $in for batch fetches
```python
# ALWAYS DO THIS
item_ids = [i["id"] for i in items]
related_items = await db.collection.find({"item_id": {"$in": item_ids}}).to_list(None)
related_map = {r["item_id"]: r for r in related_items}
```

### Rule 3: Use aggregation for counts/stats
```python
# Instead of multiple count_documents() calls
stats = await db.collection.aggregate([
    {"$match": {"user_id": {"$in": user_ids}}},
    {"$group": {
        "_id": "$user_id",
        "total": {"$sum": 1},
        "active": {"$sum": {"$cond": [{"$eq": ["$status", "active"]}, 1, 0]}}
    }}
]).to_list(None)
```

### Rule 4: Add indexes for frequently queried fields
- Any field used in `find()` queries
- Any field used in `$match` stages
- Compound indexes for multi-field queries

## Monitoring Commands

```bash
# Test endpoint performance
API="https://field-rider-ops.preview.emergentagent.com"
time curl -s "$API/api/admin/sellers" -H "Authorization: Bearer $TOKEN" > /dev/null

# Check backend logs for slow queries
tail -f /var/log/supervisor/backend.err.log | grep -i "slow\|timeout\|error"
```

## Target Performance

| Endpoint Type | Target Response Time |
|---------------|---------------------|
| Health check | < 500ms |
| List endpoints (50 items) | < 2s |
| Single item endpoints | < 500ms |
| Complex aggregations | < 3s |

---

## Production Resilience Features

The system is hardened for production with these features:

### 1. Connection Pooling (100 connections)
```python
client = AsyncIOMotorClient(
    mongo_url,
    maxPoolSize=100,       # 100 concurrent connections
    minPoolSize=20,        # Keep 20 warm
    waitQueueTimeoutMS=5000,
    retryWrites=True,
    retryReads=True
)
```

### 2. Rate Limiting
- 100 requests per 60 seconds per user/IP
- Returns HTTP 429 if exceeded
- Prevents one user from overwhelming the system

### 3. Circuit Breaker
- Opens after 5 consecutive DB failures
- Auto-recovers after 30 seconds
- Returns HTTP 503 when open (graceful degradation)

### 4. Request Timeouts
- Global request timeout: 30 seconds
- Auth lookup timeout: 5 seconds
- DB query timeout: 8 seconds
- Returns HTTP 504 on timeout

### 5. Error Isolation
- Each request runs in isolated try/catch
- One user's error doesn't crash the server
- Errors logged but contained

### 6. Health Check with Status
```json
GET /api/health
{
  "status": "healthy",
  "database": "connected",
  "circuit_breaker": "CLOSED",
  "pool_size": 100
}
```

### Load Test Results (50 concurrent users)
- Success rate: 100% (50/50)
- All requests HTTP 200
- No connection pool exhaustion

---
*Last updated: April 8, 2026*
