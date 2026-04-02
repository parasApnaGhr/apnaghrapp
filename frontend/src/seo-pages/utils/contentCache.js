// Content Cache Utility - Caches generated SEO content without touching DB
// Uses localStorage for persistence across sessions

const CACHE_PREFIX = 'seo_content_';
const CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// In-memory cache for faster access
const memoryCache = new Map();

/**
 * Generate a cache key from page parameters
 */
export const generateCacheKey = (listingType, city, area, propertyType, budget) => {
  const parts = [listingType, city, area, propertyType, budget].filter(Boolean);
  return `${CACHE_PREFIX}${parts.join('_')}`;
};

/**
 * Get cached content
 */
export const getCachedContent = (key) => {
  // Check memory cache first
  if (memoryCache.has(key)) {
    const cached = memoryCache.get(key);
    if (Date.now() < cached.expiry) {
      return cached.data;
    }
    memoryCache.delete(key);
  }

  // Check localStorage
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Date.now() < parsed.expiry) {
        // Restore to memory cache
        memoryCache.set(key, parsed);
        return parsed.data;
      }
      // Expired, remove it
      localStorage.removeItem(key);
    }
  } catch (error) {
    console.error('Cache read error:', error);
  }

  return null;
};

/**
 * Set cached content
 */
export const setCachedContent = (key, data, expiryMs = CACHE_EXPIRY_MS) => {
  const cacheEntry = {
    data,
    expiry: Date.now() + expiryMs,
    timestamp: Date.now()
  };

  // Set in memory cache
  memoryCache.set(key, cacheEntry);

  // Persist to localStorage
  try {
    localStorage.setItem(key, JSON.stringify(cacheEntry));
  } catch (error) {
    console.error('Cache write error:', error);
    // If storage is full, clear old cache entries
    clearExpiredCache();
  }
};

/**
 * Clear expired cache entries
 */
export const clearExpiredCache = () => {
  const now = Date.now();

  // Clear from memory
  for (const [key, value] of memoryCache.entries()) {
    if (now >= value.expiry) {
      memoryCache.delete(key);
    }
  }

  // Clear from localStorage
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(CACHE_PREFIX)) {
        try {
          const stored = JSON.parse(localStorage.getItem(key));
          if (now >= stored.expiry) {
            keysToRemove.push(key);
          }
        } catch {
          keysToRemove.push(key);
        }
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.error('Cache clear error:', error);
  }
};

/**
 * Clear all SEO cache
 */
export const clearAllCache = () => {
  memoryCache.clear();

  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(CACHE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.error('Cache clear error:', error);
  }
};

/**
 * Get cache statistics
 */
export const getCacheStats = () => {
  let totalEntries = 0;
  let totalSize = 0;

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(CACHE_PREFIX)) {
        totalEntries++;
        totalSize += localStorage.getItem(key)?.length || 0;
      }
    }
  } catch (error) {
    console.error('Cache stats error:', error);
  }

  return {
    entries: totalEntries,
    memoryEntries: memoryCache.size,
    approximateSize: `${(totalSize / 1024).toFixed(2)} KB`
  };
};

export default {
  generateCacheKey,
  getCachedContent,
  setCachedContent,
  clearExpiredCache,
  clearAllCache,
  getCacheStats
};
