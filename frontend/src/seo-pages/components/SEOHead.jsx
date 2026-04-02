// SEO Head Component - Meta Tags, Schema Markup
import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEOHead = ({ 
  title, 
  description, 
  canonical,
  image,
  type = 'website',
  schema = null,
  faqSchema = null,
  noindex = false 
}) => {
  const siteUrl = 'https://apnaghrapp.in';
  const fullCanonical = canonical ? `${siteUrl}${canonical}` : siteUrl;
  const defaultImage = `${siteUrl}/og-image.png`;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      
      {/* Canonical */}
      <link rel="canonical" href={fullCanonical} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullCanonical} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image || defaultImage} />
      <meta property="og:site_name" content="ApnaGhr" />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={fullCanonical} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image || defaultImage} />

      {/* Schema.org JSON-LD */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
      
      {faqSchema && (
        <script type="application/ld+json">
          {JSON.stringify(faqSchema)}
        </script>
      )}

      {/* Organization Schema */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "RealEstateAgent",
          "name": "ApnaGhr",
          "description": "India's trusted property visit platform. Find flats, apartments, and homes for rent and sale.",
          "url": siteUrl,
          "logo": `${siteUrl}/logo.png`,
          "sameAs": [
            "https://facebook.com/apnaghr",
            "https://instagram.com/apnaghr",
            "https://twitter.com/apnaghr"
          ],
          "address": {
            "@type": "PostalAddress",
            "addressLocality": "Mohali",
            "addressRegion": "Punjab",
            "addressCountry": "IN"
          }
        })}
      </script>
    </Helmet>
  );
};

export default SEOHead;
