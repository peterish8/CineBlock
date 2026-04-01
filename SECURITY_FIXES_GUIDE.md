# CineBlock Security Fixes - Implementation Guide

## ✅ COMPLETED FIXES

### 1. NPM Vulnerabilities - FIXED ✓
```bash
npm audit fix  # Fixed all 4 vulnerabilities
npm audit      # Verified: found 0 vulnerabilities
```
- ✅ flatted (Prototype Pollution) - FIXED
- ✅ picomatch (ReDoS) - FIXED  
- ✅ brace-expansion - FIXED
- ✅ Next.js vulnerabilities - FIXED

### 2. CSP Nonce Implementation - READY ✓
**Status**: Code updated, needs integration

**Files Created:**
- ✅ `src/middleware.ts` - Generates nonce per request
- ✅ `src/hooks/useNonce.ts` - Utility to access nonce
- ✅ `next.config.mjs` - Updated with nonce-based CSP
- ✅ `CSP_NONCE_IMPLEMENTATION.md` - Detailed guide

**Next Step**: Update `src/app/layout.tsx` - Add meta tag for nonce access
See `CSP_NONCE_IMPLEMENTATION.md` for exact code to add.

---

## 🚀 TO DO: Persistent Rate Limiting

### Current Issue
Rate limits stored in memory - lost on server restart, doesn't work across multiple instances.

### Solution: Upstash Redis (FREE TIER AVAILABLE)

#### Step 1: Create Upstash Account
1. Go to https://upstash.com
2. Sign up (free tier: 100 commands/day included)
3. Create a Redis database
4. Copy credentials (REST URL and TOKEN)

#### Step 2: Add Environment Variables
In `.env.local`, add:
```env
UPSTASH_REDIS_REST_URL=https://[your-endpoint].upstash.io
UPSTASH_REDIS_REST_TOKEN=A...yourtoken...
```

#### Step 3: Install Dependencies
```bash
npm install @upstash/ratelimit @upstash/redis
```

#### Step 4: Update API Route
Reference implementation ready in:
- ✅ `src/lib/rateLimiter.ts` - Rate limiter utilities
- ✅ `src/app/api/find-movie/route-UPDATED.ts` - How to use it

To apply:
1. Copy the imports from `route-UPDATED.ts`
2. Replace the old rate limiting code in `src/app/api/find-movie/route.ts`
3. Replace `isRateLimited()` function with the new one

**Old Code** (REMOVE):
```typescript
const rateLimitMap = new Map<string, number[]>();
function isRateLimited(request: NextRequest): boolean {
  // old logic...
}
```

**New Code** (REPLACE WITH):
```typescript
import { checkRateLimitManual, getClientIP } from "@/lib/rateLimiter";

async function isRateLimited(request: NextRequest) {
  const ip = getClientIP(request);
  const result = await checkRateLimitManual(ip, 10, 60);
  return { limited: !result.success, resetAfter: result.resetAfter };
}
```

---

## 🚀 TO DO: API Key Validation

### Current Issue
TMDB API key not validated on startup - could fail silently if expired.

### Solution: Add Startup Health Check

**Create**: `src/lib/tmdb.ts` (if doesn't exist) or add to existing:

```typescript
/**
 * Validate TMDB API key on startup
 */
export async function validateTMDBKey(): Promise<boolean> {
  const apiKey = process.env.TMDB_API_KEY;

  if (!apiKey) {
    console.error('❌ TMDB_API_KEY not found in environment');
    return false;
  }

  try {
    const response = await fetch('https://api.themoviedb.org/3/configuration', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`❌ TMDB API key validation failed: ${response.status} ${response.statusText}`);
      return false;
    }

    console.log('✅ TMDB API key validated successfully');
    return true;
  } catch (error) {
    console.error('❌ TMDB API key validation error:', error);
    return false;
  }
}
```

**In your root layout** (`src/app/layout.tsx`), add validation on app start:

```typescript
// Add at the top of the file
import { validateTMDBKey } from '@/lib/tmdb';

// In a useEffect or server component initialization
useEffect(() => {
  validateTMDBKey().catch(console.error);
}, []);
```

**Or** create a route handler to check on demand:
```typescript
// src/app/api/health/route.ts
import { validateTMDBKey } from '@/lib/tmdb';

export async function GET() {
  const isValid = await validateTMDBKey();
  
  return Response.json(
    { 
      status: isValid ? 'healthy' : 'degraded',
      tmdbValid: isValid,
    },
    { status: isValid ? 200 : 503 }
  );
}
```

---

## 📋 Summary of All Changes

| Fix | Status | Effort | Impact |
|-----|--------|--------|--------|
| NPM Vulnerabilities | ✅ DONE | ✓ Done | HIGH - Blocks exploits |
| CSP Nonce | ⚠️ Ready | 20 min | HIGH - Prevents XSS |
| Rate Limiting | 📝 TO DO | 30 min | MEDIUM - DDoS protection |
| API Key Validation | 📝 TO DO | 15 min | MEDIUM - Reliability |
| CORS Headers | ✅ DONE | ✓ Done | MEDIUM - Cross-origin safety |

---

## Testing Each Fix

### Test NPM Vulnerabilities
```bash
npm audit  # Should show: found 0 vulnerabilities
```

### Test CSP Nonce
1. After updating `layout.tsx`, run dev server: `npm run dev`
2. Open DevTools → Console tab
3. Check for any CSP errors (should be none)
4. Check Network tab → Response Headers for CSP policy

### Test Rate Limiting
```bash
# Make 11+ requests to /api/find-movie in quick succession
# The 11th+ request should return 429 status code
curl -X POST http://localhost:3000/api/find-movie \
  -H "Content-Type: application/json" \
  -d '{"languages":["en"],"yearFrom":2020,"yearTo":2024}'
```

### Test CORS Headers
```bash
# Check response headers
curl -I https://cineblock.in
# Look for: Access-Control-Allow-Origin, Access-Control-Allow-Methods
```

---

## Questions?

- **CSP Nonce**: See `CSP_NONCE_IMPLEMENTATION.md`
- **Rate Limiting**: See `src/lib/rateLimiter.ts` for utility functions
- **NPM**: Run `npm audit fix` to auto-resolve vulnerabilities
- **Upstash**: Get free tier account at https://upstash.com

All code is well-commented. Feel free to ask for clarification!
