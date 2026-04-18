// @ts-nocheck
// SEO Utilities - Content Generation, Schema Markup, Meta Tags
// Read-only utility functions for SEO pages

import { CITIES, AREAS, PROPERTY_TYPES, BUDGET_RANGES, SERVICE_TYPES } from '../data/seoData';

// Parse URL slug to extract location and property info
export const parseSlug = (slug) => {
  const parts = slug.split('-in-');
  if (parts.length < 2) return null;
  
  const propertyPart = parts[0];
  const locationPart = parts[1];
  
  // Parse location (area-city or just city)
  let city = null;
  let area = null;
  
  // Check if it's area-city format
  for (const c of CITIES) {
    if (locationPart.endsWith(c.slug)) {
      city = c;
      const areaSlug = locationPart.replace(`-${c.slug}`, '').replace(c.slug, '');
      if (areaSlug) {
        const cityAreas = AREAS[c.slug] || [];
        area = cityAreas.find(a => a.slug === areaSlug);
      }
      break;
    }
  }
  
  // Parse property type
  let propertyType = PROPERTY_TYPES.find(p => propertyPart.includes(p.slug));
  
  // Parse budget
  let budget = null;
  const allBudgets = [...(BUDGET_RANGES.rent || []), ...(BUDGET_RANGES.buy || [])];
  for (const b of allBudgets) {
    if (propertyPart.includes(b.slug)) {
      budget = b;
      break;
    }
  }
  
  return { city, area, propertyType, budget, raw: { propertyPart, locationPart } };
};

// Generate dynamic meta title
export const generateMetaTitle = (listingType, parsedSlug) => {
  const { city, area, propertyType, budget } = parsedSlug || {};
  
  let title = '';
  
  if (propertyType) {
    title += `${propertyType.name} `;
  } else {
    title += 'Flats & Apartments ';
  }
  
  title += `for ${listingType === 'rent' ? 'Rent' : listingType === 'buy' ? 'Sale' : 'PG'} `;
  
  if (budget) {
    title += `${budget.name} `;
  }
  
  if (area) {
    title += `in ${area.name}, `;
  }
  
  if (city) {
    title += city.name;
  }
  
  title += ' | ApnaGhr';
  
  return title.substring(0, 60);
};

// Generate meta description
export const generateMetaDescription = (listingType, parsedSlug, propertyCount = 0) => {
  const { city, area, propertyType, budget } = parsedSlug || {};
  
  let desc = `Find `;
  
  if (propertyCount > 0) {
    desc += `${propertyCount}+ verified `;
  }
  
  if (propertyType) {
    desc += `${propertyType.name} `;
  } else {
    desc += 'flats & apartments ';
  }
  
  desc += `for ${listingType === 'rent' ? 'rent' : listingType === 'buy' ? 'sale' : 'PG'} `;
  
  if (budget) {
    desc += `${budget.name} `;
  }
  
  if (area) {
    desc += `in ${area.name}, `;
  }
  
  if (city) {
    desc += `${city.name}. `;
  }
  
  desc += 'Book guided property visits with ApnaGhr. Verified listings, no brokerage hassle.';
  
  return desc.substring(0, 160);
};

// Generate H1 heading
export const generateH1 = (listingType, parsedSlug) => {
  const { city, area, propertyType, budget } = parsedSlug || {};
  
  let h1 = '';
  
  if (propertyType) {
    h1 += `${propertyType.name} `;
  } else {
    h1 += 'Flats & Apartments ';
  }
  
  h1 += `for ${listingType === 'rent' ? 'Rent' : listingType === 'buy' ? 'Sale' : 'PG'} `;
  
  if (budget) {
    h1 += `${budget.name} `;
  }
  
  if (area) {
    h1 += `in ${area.name}, `;
  }
  
  if (city) {
    h1 += city.name;
  }
  
  return h1;
};

// Generate area description content (200-300 words)
export const generateAreaContent = (listingType, parsedSlug) => {
  const { city, area, propertyType } = parsedSlug || {};
  
  if (!city) return '';
  
  const cityName = city.name;
  const areaName = area?.name || '';
  const propType = propertyType?.name || 'properties';
  const action = listingType === 'rent' ? 'renting' : listingType === 'buy' ? 'buying' : 'finding PG';
  
  const content = `
## About ${areaName ? `${areaName}, ` : ''}${cityName}

${areaName || cityName} is one of the most sought-after localities in the ${cityName} region for ${action} ${propType.toLowerCase()}. The area offers excellent connectivity to major IT hubs, educational institutions, and healthcare facilities.

### Why Choose ${areaName || cityName}?

**Connectivity**: Well-connected by road and public transport to Chandigarh, Mohali, and nearby cities. ${cityName === 'Mohali' ? 'The upcoming metro line will further enhance connectivity.' : ''}

**Amenities**: The locality boasts modern amenities including shopping complexes, restaurants, parks, and recreational facilities. Families will appreciate the presence of reputed schools and colleges nearby.

**Infrastructure**: ${areaName || cityName} features well-planned roads, 24/7 water and electricity supply, and reliable internet connectivity making it ideal for working professionals.

**Safety**: The area is known for its peaceful environment and good security, making it a preferred choice for families and working professionals alike.

### Real Estate Trends

Property prices in ${areaName || cityName} have shown consistent appreciation over the past few years. ${listingType === 'rent' ? `Average rental yields range from 2.5% to 4% annually.` : `The average price appreciation has been 5-8% year-over-year.`}

${listingType === 'rent' ? 
`### Rental Market Overview
The rental market in ${areaName || cityName} caters to diverse needs - from affordable 1 BHK apartments for bachelors to spacious 4 BHK flats for large families. Most landlords prefer long-term tenants and offer negotiable terms.` :
`### Investment Potential
${areaName || cityName} presents excellent investment opportunities with upcoming infrastructure projects and commercial developments. RERA-registered projects ensure transparency and timely delivery.`}

Start your property search with ApnaGhr's guided visit service for a hassle-free experience.
  `;
  
  return content.trim();
};

// Generate FAQ content
export const generateFAQs = (listingType, parsedSlug) => {
  const { city, area, propertyType, budget } = parsedSlug || {};
  
  if (!city) return [];
  
  const cityName = city.name;
  const areaName = area?.name || '';
  const location = areaName ? `${areaName}, ${cityName}` : cityName;
  const propType = propertyType?.name || 'flat';
  
  const faqs = [
    {
      question: `What is the average ${listingType === 'rent' ? 'rent' : 'price'} for a ${propType} in ${location}?`,
      answer: listingType === 'rent' 
        ? `The average rent for a ${propType} in ${location} ranges from ₹8,000 to ₹35,000 per month depending on the size, amenities, and exact location within the area.`
        : `The average price for a ${propType} in ${location} ranges from ₹30 Lakh to ₹1.5 Crore depending on the size, amenities, builder reputation, and exact location.`
    },
    {
      question: `Is ${location} a good area for ${listingType === 'rent' ? 'renting' : 'buying'} a home?`,
      answer: `Yes, ${location} is an excellent choice with good connectivity, modern amenities, reputed schools, hospitals, and a peaceful environment. The area has seen consistent development and appreciation.`
    },
    {
      question: `How can I book a property visit in ${location}?`,
      answer: `You can book a guided property visit through ApnaGhr. Our verified riders will accompany you to multiple properties in a single trip, saving your time and ensuring a safe experience.`
    },
    {
      question: `What documents do I need for ${listingType === 'rent' ? 'renting' : 'buying'} a property in ${location}?`,
      answer: listingType === 'rent'
        ? `For renting, you typically need ID proof (Aadhaar/PAN), address proof, passport photos, and employment/income proof. The landlord will provide the rental agreement.`
        : `For buying, you need ID proof, address proof, PAN card, income documents for loan, and the seller needs to provide title deed, encumbrance certificate, approved plans, and other property documents.`
    },
    {
      question: `Are there any upcoming infrastructure projects near ${location}?`,
      answer: `${cityName} is witnessing rapid infrastructure development including ${cityName === 'Mohali' ? 'metro rail project, airport expansion, and new IT parks' : 'improved road connectivity, commercial hubs, and residential townships'}. These developments are expected to boost property values.`
    },
  ];
  
  return faqs;
};

// Generate RealEstateListing Schema
export const generateListingSchema = (properties, listingType, parsedSlug) => {
  if (!properties || properties.length === 0) return null;
  
  const { city, area } = parsedSlug || {};
  
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `${listingType === 'rent' ? 'Rental' : 'Sale'} Properties in ${area?.name || city?.name || 'India'}`,
    "itemListElement": properties.slice(0, 10).map((prop, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "RealEstateListing",
        "name": prop.title,
        "description": prop.description || `${prop.bedrooms || ''} BHK property for ${listingType} in ${prop.location || city?.name}`,
        "url": `https://apnaghrapp.in/property/${prop.id}`,
        "address": {
          "@type": "PostalAddress",
          "addressLocality": area?.name || city?.name,
          "addressRegion": city?.state || "Punjab",
          "addressCountry": "IN"
        },
        "offers": {
          "@type": "Offer",
          "price": prop.price || prop.rent,
          "priceCurrency": "INR"
        }
      }
    }))
  };
};

// Generate FAQ Schema
export const generateFAQSchema = (faqs) => {
  if (!faqs || faqs.length === 0) return null;
  
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
};

// Generate Blog Article Schema
export const generateArticleSchema = (blog) => {
  if (!blog) return null;
  
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": blog.title,
    "description": blog.excerpt,
    "image": blog.image,
    "author": {
      "@type": "Organization",
      "name": blog.author || "ApnaGhr"
    },
    "publisher": {
      "@type": "Organization",
      "name": "ApnaGhr",
      "logo": {
        "@type": "ImageObject",
        "url": "https://apnaghrapp.in/logo.png"
      }
    },
    "datePublished": blog.publishedAt,
    "dateModified": blog.publishedAt
  };
};

// Generate internal links for related pages
export const generateRelatedLinks = (listingType, parsedSlug) => {
  const { city, area, propertyType } = parsedSlug || {};
  
  if (!city) return [];
  
  const links = [];
  
  // Related property types
  PROPERTY_TYPES.slice(0, 4).forEach(pt => {
    if (!propertyType || pt.slug !== propertyType.slug) {
      links.push({
        url: `/${listingType}/${pt.slug}-in-${city.slug}`,
        text: `${pt.name} for ${listingType === 'rent' ? 'Rent' : 'Sale'} in ${city.name}`
      });
    }
  });
  
  // Related areas in same city
  const cityAreas = AREAS[city.slug] || [];
  cityAreas.slice(0, 4).forEach(a => {
    if (!area || a.slug !== area.slug) {
      links.push({
        url: `/${listingType}/flats-in-${a.slug}-${city.slug}`,
        text: `Flats in ${a.name}, ${city.name}`
      });
    }
  });
  
  // Switch listing type
  const otherType = listingType === 'rent' ? 'buy' : 'rent';
  links.push({
    url: `/${otherType}/flats-in-${area ? `${area.slug}-` : ''}${city.slug}`,
    text: `Flats for ${otherType === 'rent' ? 'Rent' : 'Sale'} in ${area?.name || city.name}`
  });
  
  return links.slice(0, 8);
};

// Generate nearby locations
export const getNearbyLocations = (citySlug) => {
  const nearbyMap = {
    mohali: ['chandigarh', 'panchkula', 'kharar', 'zirakpur'],
    chandigarh: ['mohali', 'panchkula', 'zirakpur', 'kharar'],
    panchkula: ['chandigarh', 'mohali', 'zirakpur', 'derabassi'],
    kharar: ['mohali', 'chandigarh', 'zirakpur', 'derabassi'],
    zirakpur: ['mohali', 'chandigarh', 'panchkula', 'kharar'],
  };
  
  const nearby = nearbyMap[citySlug] || [];
  return nearby.map(slug => CITIES.find(c => c.slug === slug)).filter(Boolean);
};

export default {
  parseSlug,
  generateMetaTitle,
  generateMetaDescription,
  generateH1,
  generateAreaContent,
  generateFAQs,
  generateListingSchema,
  generateFAQSchema,
  generateArticleSchema,
  generateRelatedLinks,
  getNearbyLocations,
};
