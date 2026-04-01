import { useCallback } from 'react';

/**
 * Hook to get the CSP nonce for this request
 * Used to safely include inline scripts and styles
 */
export function useNonce(): string {
  return useCallback(() => {
    // In client-side rendered content, the nonce is passed via meta tag
    const nonceElement = document.querySelector('meta[property="csp-nonce"]');
    return nonceElement?.getAttribute('content') || '';
  }, [])();
}

/**
 * Get nonce from meta tag (for use in server components or static pages)
 */
export function getNonceFromMeta(): string {
  if (typeof document === 'undefined') return '';
  const nonceElement = document.querySelector('meta[property="csp-nonce"]');
  return nonceElement?.getAttribute('content') || '';
}
