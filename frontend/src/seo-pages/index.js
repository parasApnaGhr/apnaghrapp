// SEO Pages Module - Main Export
// This module is completely isolated from the main app

// Pages
export { default as SEOListingPage } from './pages/SEOListingPage';
export { default as BlogListPage } from './pages/BlogListPage';
export { default as BlogPostPage } from './pages/BlogPostPage';
export { default as SitemapPage } from './pages/SitemapPage';

// Components
export { default as SEOHead } from './components/SEOHead';
export { default as SEOPropertyCard } from './components/SEOPropertyCard';
export { default as SEOFAQSection } from './components/SEOFAQSection';
export { default as SEOInternalLinks } from './components/SEOInternalLinks';

// Data
export { 
  CITIES, 
  AREAS, 
  PROPERTY_TYPES, 
  LISTING_TYPES, 
  BUDGET_RANGES,
  COMMERCIAL_TYPES,
  SERVICE_TYPES,
  generateAllSEORoutes 
} from './data/seoData';

export { 
  BLOGS, 
  BLOG_CATEGORIES,
  getBlogBySlug,
  getBlogsByCategory,
  getFeaturedBlogs,
  getRecentBlogs,
  getRelatedBlogs
} from './data/blogData';

// Utilities
export * from './utils/seoUtils';
export * from './utils/contentCache';
export * from './utils/sitemapGenerator';
