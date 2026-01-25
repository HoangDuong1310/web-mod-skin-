# Prisma Connection Pool Fix

This document describes the changes made to fix the Prisma connection pool exhaustion issue.

## Problem

The application was experiencing connection pool exhaustion with the following errors:
- `Timed out fetching a new connection from the connection pool`
- `Current connection pool timeout: 10, connection limit: 5`

This was caused by:
1. Middleware calling `/api/maintenance` on every request, creating new database connections
2. No caching for frequently accessed settings
3. Default connection limit of 5 being too low for production traffic

## Changes Made

### 1. Middleware Optimization (`middleware.ts`)
- Removed the `/api/maintenance` fetch call from the hot path
- Added in-memory caching for maintenance mode check
- Added support for `MAINTENANCE_MODE` environment variable

### 2. Settings Caching (`lib/settings.ts`)
- Added in-memory cache for `getSettings()` with 1-minute TTL
- Added in-memory cache for `getSetting()` with 30-second TTL
- Cache is automatically cleared when settings are saved

### 3. Prisma Configuration (`lib/prisma.ts`)
- Added graceful shutdown handling to release connections properly
- Added connection pool configuration comments

### 4. Schema Documentation (`prisma/schema.prisma`)
- Added comments about connection pool configuration

### 5. Maintenance API (`app/api/maintenance/route.ts`)
- Added cache synchronization for middleware

## Required Action: Update DATABASE_URL

To fix the connection pool exhaustion, you need to update your `DATABASE_URL` with connection pool parameters:

### For MySQL:
```
DATABASE_URL="mysql://username:password@host:3306/database?connection_limit=10&pool_timeout=20"
```

### Parameter Explanation:
- `connection_limit`: Maximum number of connections (recommended: 10-20 for medium traffic, 50+ for high traffic)
- `pool_timeout`: Maximum time to wait for a connection in milliseconds (recommended: 20000 for 20 seconds)

### Example for Production:
```
DATABASE_URL="mysql://myuser:mypassword@db.example.com:3306/webmodskin?connection_limit=20&pool_timeout=30000"
```

## Optional: Set Maintenance Mode via Environment Variable

To avoid database queries for maintenance mode checking, you can set:
```
MAINTENANCE_MODE=true
```

This is useful for quick maintenance mode toggling without database access.

## Testing the Fix

1. Update your `DATABASE_URL` with connection pool parameters
2. Restart your PM2 process:
   ```bash
   pm2 restart web-mod-skin
   ```
3. Monitor the logs:
   ```bash
   pm2 logs web-mod-skin --lines 100
   ```

## Additional Recommendations

### For High Traffic Sites:
Consider using Prisma Accelerate or PgBouncer for connection pooling:

**Prisma Accelerate:**
```env
DATABASE_URL="mysql://...&connection_limit=10"
# Enable Prisma Accelerate extension
```

**PgBouncer:**
```env
DATABASE_URL="mysql://...&socket_path=/var/run/pgbouncer/pgbouncer.sock"
```

### Monitor Connection Pool:
Add monitoring to your application to detect connection pool issues early:
```typescript
// Log when connections are waiting too long
prisma.$on('query', (e) => {
  if (e.queryExecutionTime > 5000) {
    console.warn('Slow query detected:', e.query)
  }
})
```

## Files Modified

- `middleware.ts` - Optimized maintenance mode checking
- `lib/settings.ts` - Added settings caching
- `lib/prisma.ts` - Added graceful shutdown
- `prisma/schema.prisma` - Added documentation
- `app/api/maintenance/route.ts` - Added cache sync
