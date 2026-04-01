# CSP Nonce Implementation Guide

## What Changed
Your Content Security Policy has been updated to use **nonce-based security** instead of `'unsafe-inline'`. This prevents XSS attacks while allowing necessary inline styles.

## Files Modified
1. ✅ `next.config.mjs` - Updated CSP to use nonce
2. ✅ `src/middleware.ts` - Created new file to generate nonce per request
3. ✅ `src/hooks/useNonce.ts` - Created utility to access nonce in components

## Implementation Steps

### Step 1: Update Root Layout
In `src/app/layout.tsx`, add the nonce meta tag to the `<head>`:

```tsx
import { headers } from 'next/headers';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const nonce = headersList.get('x-nonce') || '';

  return (
    <ConvexAuthNextjsServerProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          {/* Add this meta tag - it stores the nonce for client-side access */}
          <meta property="csp-nonce" content={nonce} />
        </head>
        <body className="min-h-screen bg-bg antialiased" suppressHydrationWarning>
          {/* ...rest of your layout */}
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}
```

### Step 2: For Any Inline Styles
If you have inline styles in components, add the nonce attribute:

**BEFORE (unsafe):**
```tsx
<style>{`
  .my-class {
    color: red;
  }
`}</style>
```

**AFTER (safe):**
```tsx
import { getNonceFromMeta } from '@/hooks/useNonce';

export function MyComponent() {
  const nonce = getNonceFromMeta();
  
  return (
    <style nonce={nonce}>{`
      .my-class {
        color: red;
      }
    `}</style>
  );
}
```

### Step 3: For Any Inline Scripts
If you have inline `<script>` tags, add the nonce attribute:

**BEFORE (unsafe):**
```tsx
<script>{`console.log('hello')`}</script>
```

**AFTER (safe):**
```tsx
import { getNonceFromMeta } from '@/hooks/useNonce';

export function MyComponent() {
  const nonce = getNonceFromMeta();
  
  return (
    <script nonce={nonce}>{`console.log('hello')`}</script>
  );
}
```

## How It Works

1. **Middleware generates nonce**: Each HTTP request gets a unique 32-character random nonce
2. **Nonce added to headers**: The nonce is included in response headers (`x-nonce`)
3. **Root layout exposes nonce**: Meta tag `<meta property="csp-nonce" content={nonce} />` stores it
4. **Components access nonce**: Use `getNonceFromMeta()` hook to safely use inline styles/scripts
5. **CSP validates**: The browser only allows inline code that has the matching nonce

## Security Benefits

✅ **XSS Prevention**: Inline code without the nonce is blocked  
✅ **No unsafe-inline**: More restrictive, less exploitable  
✅ **Per-request nonce**: Nonce changes with every page load  
✅ **Browser enforced**: CSP violations are logged to console  

## Testing

To verify it's working:

1. Open browser DevTools (F12)
2. Go to Console tab
3. Check for CSP warnings (there should be none if implemented correctly)
4. Try injecting inline script: `<script>alert('xss')</script>` → Should be blocked ✓

## Rollback (if needed)

If you need to revert:
```bash
git checkout next.config.mjs
rm src/middleware.ts
rm src/hooks/useNonce.ts
```

## Questions?
- CSP violations appear in browser console
- Check `next.config.mjs` for the full CSP policy
- Middleware config in `src/middleware.ts` controls nonce generation
