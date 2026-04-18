// @ts-nocheck
// Sitemap Generator Utility - Generates XML sitemap for SEO pages
// This is a client-side utility that outputs sitemap XML string

import { CITIES, AREAS, PROPERTY_TYPES, LISTING_TYPES, BUDGET_RANGES } from '../data/seoData';
import { BLOGS } from '../data/blogData';
import { CITIES_FOR_RIDERS } from '../data/riderEarningData';

const SITE_URL = 'https://apnaghrapp.in';

/**
 * Generate XML sitemap string
 */
export const generateSitemapXML = () => {
  const urls = [];
  const now = new Date().toISOString().split('T')[0];

  // Static pages
  const staticPages = [
    { url: '/', priority: '1.0', changefreq: 'daily' },
    { url: '/blogs', priority: '0.9', changefreq: 'daily' },
    { url: '/legal', priority: '0.3', changefreq: 'monthly' },
    // Rider Earning Pages
    { url: '/earn-money-by-visiting-properties', priority: '0.9', changefreq: 'weekly' },
    { url: '/earn-2000-per-day-real-estate', priority: '0.9', changefreq: 'weekly' },
  ];

  staticPages.forEach(page => {
    urls.push({
      loc: `${SITE_URL}${page.url}`,
      lastmod: now,
      changefreq: page.changefreq,
      priority: page.priority
    });
  });

  // Rider city pages
  CITIES_FOR_RIDERS.forEach(city => {
    urls.push({
      loc: `${SITE_URL}/become-property-rider/${city.slug}`,
      lastmod: now,
      changefreq: 'weekly',
      priority: '0.8'
    });
  });

  // Generate listing type pages for each city
  CITIES.forEach(city => {
    LISTING_TYPES.forEach(listing => {
      // City-level pages
      urls.push({
        loc: `${SITE_URL}/${listing.slug}/flats-in-${city.slug}`,
        lastmod: now,
        changefreq: 'weekly',
        priority: '0.8'
      });

      // Property type pages
      PROPERTY_TYPES.forEach(propType => {
        urls.push({
          loc: `${SITE_URL}/${listing.slug}/${propType.slug}-in-${city.slug}`,
          lastmod: now,
          changefreq: 'weekly',
          priority: '0.7'
        });
      });

      // Budget range pages
      const budgets = BUDGET_RANGES[listing.slug] || [];
      budgets.forEach(budget => {
        urls.push({
          loc: `${SITE_URL}/${listing.slug}/flats-${budget.slug}-in-${city.slug}`,
          lastmod: now,
          changefreq: 'weekly',
          priority: '0.6'
        });
      });

      // Area-level pages
      const cityAreas = AREAS[city.slug] || [];
      cityAreas.forEach(area => {
        urls.push({
          loc: `${SITE_URL}/${listing.slug}/flats-in-${area.slug}-${city.slug}`,
          lastmod: now,
          changefreq: 'weekly',
          priority: '0.7'
        });

        // Property type + area combinations
        PROPERTY_TYPES.slice(0, 4).forEach(propType => {
          urls.push({
            loc: `${SITE_URL}/${listing.slug}/${propType.slug}-in-${area.slug}-${city.slug}`,
            lastmod: now,
            changefreq: 'weekly',
            priority: '0.6'
          });
        });
      });
    });
  });

  // Blog pages
  BLOGS.forEach(blog => {
    urls.push({
      loc: `${SITE_URL}/blogs/${blog.slug}`,
      lastmod: blog.publishedAt,
      changefreq: 'monthly',
      priority: '0.7'
    });
  });

  // Build XML
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  urls.forEach(url => {
    xml += '  <url>\n';
    xml += `    <loc>${url.loc}</loc>\n`;
    xml += `    <lastmod>${url.lastmod}</lastmod>\n`;
    xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
    xml += `    <priority>${url.priority}</priority>\n`;
    xml += '  </url>\n';
  });

  xml += '</urlset>';

  return xml;
};

/**
 * Generate sitemap index for large sitemaps
 */
export const generateSitemapIndex = () => {
  const now = new Date().toISOString().split('T')[0];
  
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  // Main sitemap
  xml += '  <sitemap>\n';
  xml += `    <loc>${SITE_URL}/sitemap.xml</loc>\n`;
  xml += `    <lastmod>${now}</lastmod>\n`;
  xml += '  </sitemap>\n';
  
  // Blog sitemap
  xml += '  <sitemap>\n';
  xml += `    <loc>${SITE_URL}/sitemap-blogs.xml</loc>\n`;
  xml += `    <lastmod>${now}</lastmod>\n`;
  xml += '  </sitemap>\n';
  
  xml += '</sitemapindex>';
  
  return xml;
};

/**
 * Count total SEO pages
 */
export const countTotalPages = () => {
  let total = 5; // Static pages (home, blogs, legal, earn-money, earn-2000)
  
  // Rider city pages
  total += CITIES_FOR_RIDERS.length;
  
  CITIES.forEach(city => {
    LISTING_TYPES.forEach(listing => {
      total += 1; // City page
      total += PROPERTY_TYPES.length; // Property types
      total += (BUDGET_RANGES[listing.slug] || []).length; // Budget ranges
      
      const cityAreas = AREAS[city.slug] || [];
      total += cityAreas.length; // Area pages
      total += cityAreas.length * 4; // Area + property type (top 4)
    });
  });
  
  total += BLOGS.length; // Blog pages
  
  return total;
};

/**
 * Get all SEO URLs as array
 */
export const getAllSEOUrls = () => {
  const urls = [];
  
  CITIES.forEach(city => {
    LISTING_TYPES.forEach(listing => {
      urls.push(`/${listing.slug}/flats-in-${city.slug}`);
      
      PROPERTY_TYPES.forEach(propType => {
        urls.push(`/${listing.slug}/${propType.slug}-in-${city.slug}`);
      });
      
      const cityAreas = AREAS[city.slug] || [];
      cityAreas.forEach(area => {
        urls.push(`/${listing.slug}/flats-in-${area.slug}-${city.slug}`);
      });
    });
  });
  
  BLOGS.forEach(blog => {
    urls.push(`/blogs/${blog.slug}`);
  });
  
  return urls;
};

export default {
  generateSitemapXML,
  generateSitemapIndex,
  countTotalPages,
  getAllSEOUrls
};
