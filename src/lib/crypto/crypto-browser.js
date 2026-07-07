/**
 * Browser-compatible crypto utilities.
 *
 * Polyfills / normalizes browser-specific behaviors.
 * In modern browsers (Chrome 60+, Firefox 54+, Safari 11+), WebCrypto is
 * fully available. This module just ensures consistent access.
 */

/**
 * Get the browser's Crypto object (global crypto or webcrypto).
 */
export function getBrowserCrypto() {
  if (typeof crypto !== 'undefined') return crypto;
  if (typeof window !== 'undefined' && window.crypto) return window.crypto;
  // Fallback for insecure contexts (local dev without HTTPS)
  console.warn('WebCrypto not available in this context. Using fallback.');
  return null;
}

/**
 * Check if WebCrypto SubtleCrypto is available.
 */
export function isCryptoAvailable() {
  const c = getBrowserCrypto();
  return c && typeof c.subtle !== 'undefined';
}

export const browserCrypto = {
  get: getBrowserCrypto,
  isAvailable: isCryptoAvailable,
};
