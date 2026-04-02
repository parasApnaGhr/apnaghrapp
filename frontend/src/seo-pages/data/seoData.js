// SEO Data - Cities, Areas, Property Types, Budget Ranges
// This is static data used for generating SEO pages

export const CITIES = [
  { slug: 'mohali', name: 'Mohali', state: 'Punjab' },
  { slug: 'chandigarh', name: 'Chandigarh', state: 'Chandigarh' },
  { slug: 'panchkula', name: 'Panchkula', state: 'Haryana' },
  { slug: 'kharar', name: 'Kharar', state: 'Punjab' },
  { slug: 'zirakpur', name: 'Zirakpur', state: 'Punjab' },
  { slug: 'derabassi', name: 'Dera Bassi', state: 'Punjab' },
  { slug: 'ludhiana', name: 'Ludhiana', state: 'Punjab' },
  { slug: 'jalandhar', name: 'Jalandhar', state: 'Punjab' },
  { slug: 'amritsar', name: 'Amritsar', state: 'Punjab' },
  { slug: 'bathinda', name: 'Bathinda', state: 'Punjab' },
  { slug: 'patiala', name: 'Patiala', state: 'Punjab' },
];

export const AREAS = {
  mohali: [
    { slug: 'sector-70', name: 'Sector 70' },
    { slug: 'sector-71', name: 'Sector 71' },
    { slug: 'sector-79', name: 'Sector 79' },
    { slug: 'sector-80', name: 'Sector 80' },
    { slug: 'sector-82', name: 'Sector 82' },
    { slug: 'sector-91', name: 'Sector 91' },
    { slug: 'sector-66', name: 'Sector 66' },
    { slug: 'sector-67', name: 'Sector 67' },
    { slug: 'sector-68', name: 'Sector 68' },
    { slug: 'phase-5', name: 'Phase 5' },
    { slug: 'phase-7', name: 'Phase 7' },
    { slug: 'phase-8', name: 'Phase 8' },
    { slug: 'phase-10', name: 'Phase 10' },
    { slug: 'phase-11', name: 'Phase 11' },
    { slug: 'aerocity', name: 'Aerocity' },
    { slug: 'it-city', name: 'IT City' },
  ],
  chandigarh: [
    { slug: 'sector-17', name: 'Sector 17' },
    { slug: 'sector-22', name: 'Sector 22' },
    { slug: 'sector-35', name: 'Sector 35' },
    { slug: 'sector-43', name: 'Sector 43' },
    { slug: 'sector-44', name: 'Sector 44' },
    { slug: 'sector-45', name: 'Sector 45' },
    { slug: 'manimajra', name: 'Manimajra' },
    { slug: 'industrial-area', name: 'Industrial Area' },
  ],
  panchkula: [
    { slug: 'sector-4', name: 'Sector 4' },
    { slug: 'sector-9', name: 'Sector 9' },
    { slug: 'sector-12', name: 'Sector 12' },
    { slug: 'sector-20', name: 'Sector 20' },
    { slug: 'sector-21', name: 'Sector 21' },
  ],
  kharar: [
    { slug: 'kharar-main', name: 'Kharar Main' },
    { slug: 'sunny-enclave', name: 'Sunny Enclave' },
    { slug: 'greater-mohali', name: 'Greater Mohali' },
    { slug: 'landran', name: 'Landran' },
    { slug: 'balongi', name: 'Balongi' },
  ],
  zirakpur: [
    { slug: 'zirakpur-main', name: 'Zirakpur Main' },
    { slug: 'vip-road', name: 'VIP Road' },
    { slug: 'patiala-road', name: 'Patiala Road' },
    { slug: 'baltana', name: 'Baltana' },
    { slug: 'dhakoli', name: 'Dhakoli' },
    { slug: 'lohgarh', name: 'Lohgarh' },
    { slug: 'gazipur', name: 'Gazipur' },
  ],
  derabassi: [
    { slug: 'derabassi-main', name: 'Dera Bassi Main' },
    { slug: 'barwala', name: 'Barwala' },
    { slug: 'palheri', name: 'Palheri' },
  ],
  ludhiana: [
    { slug: 'model-town', name: 'Model Town' },
    { slug: 'sarabha-nagar', name: 'Sarabha Nagar' },
    { slug: 'brs-nagar', name: 'BRS Nagar' },
    { slug: 'pakhowal-road', name: 'Pakhowal Road' },
    { slug: 'dugri', name: 'Dugri' },
    { slug: 'civil-lines', name: 'Civil Lines' },
  ],
  jalandhar: [
    { slug: 'model-town-jalandhar', name: 'Model Town' },
    { slug: 'urban-estate', name: 'Urban Estate' },
    { slug: 'new-jalandhar', name: 'New Jalandhar' },
    { slug: 'basti-bawa-khel', name: 'Basti Bawa Khel' },
  ],
  amritsar: [
    { slug: 'ranjit-avenue', name: 'Ranjit Avenue' },
    { slug: 'lawrence-road', name: 'Lawrence Road' },
    { slug: 'white-avenue', name: 'White Avenue' },
    { slug: 'majitha-road', name: 'Majitha Road' },
  ],
};

export const PROPERTY_TYPES = [
  { slug: '1bhk', name: '1 BHK', bedrooms: 1 },
  { slug: '2bhk', name: '2 BHK', bedrooms: 2 },
  { slug: '3bhk', name: '3 BHK', bedrooms: 3 },
  { slug: '4bhk', name: '4 BHK', bedrooms: 4 },
  { slug: 'studio', name: 'Studio Apartment', bedrooms: 0 },
  { slug: 'villa', name: 'Villa', bedrooms: null },
  { slug: 'penthouse', name: 'Penthouse', bedrooms: null },
  { slug: 'independent-house', name: 'Independent House', bedrooms: null },
  { slug: 'kothi', name: 'Kothi', bedrooms: null },
];

export const LISTING_TYPES = [
  { slug: 'rent', name: 'For Rent', action: 'Rent' },
  { slug: 'buy', name: 'For Sale', action: 'Buy' },
  { slug: 'pg', name: 'PG/Hostel', action: 'PG' },
];

export const BUDGET_RANGES = {
  rent: [
    { slug: 'under-10000', name: 'Under ₹10,000', min: 0, max: 10000 },
    { slug: 'under-15000', name: 'Under ₹15,000', min: 0, max: 15000 },
    { slug: 'under-20000', name: 'Under ₹20,000', min: 0, max: 20000 },
    { slug: 'under-25000', name: 'Under ₹25,000', min: 0, max: 25000 },
    { slug: 'under-30000', name: 'Under ₹30,000', min: 0, max: 30000 },
    { slug: '10000-to-20000', name: '₹10,000 - ₹20,000', min: 10000, max: 20000 },
    { slug: '20000-to-30000', name: '₹20,000 - ₹30,000', min: 20000, max: 30000 },
    { slug: '30000-to-50000', name: '₹30,000 - ₹50,000', min: 30000, max: 50000 },
  ],
  buy: [
    { slug: 'under-25-lakh', name: 'Under ₹25 Lakh', min: 0, max: 2500000 },
    { slug: 'under-50-lakh', name: 'Under ₹50 Lakh', min: 0, max: 5000000 },
    { slug: 'under-75-lakh', name: 'Under ₹75 Lakh', min: 0, max: 7500000 },
    { slug: 'under-1-crore', name: 'Under ₹1 Crore', min: 0, max: 10000000 },
    { slug: '50-lakh-to-1-crore', name: '₹50 Lakh - ₹1 Crore', min: 5000000, max: 10000000 },
    { slug: '1-crore-to-2-crore', name: '₹1 Crore - ₹2 Crore', min: 10000000, max: 20000000 },
  ],
};

export const COMMERCIAL_TYPES = [
  { slug: 'shops', name: 'Shops' },
  { slug: 'office-space', name: 'Office Space' },
  { slug: 'showroom', name: 'Showroom' },
  { slug: 'warehouse', name: 'Warehouse' },
  { slug: 'godown', name: 'Godown' },
  { slug: 'industrial-land', name: 'Industrial Land' },
];

export const SERVICE_TYPES = [
  { slug: 'property-dealers', name: 'Property Dealers', title: 'Top Property Dealers' },
  { slug: 'vastu-consultant', name: 'Vastu Consultants', title: 'Vastu Consultants' },
  { slug: 'interior-designers', name: 'Interior Designers', title: 'Interior Designers' },
  { slug: 'packers-movers', name: 'Packers & Movers', title: 'Packers & Movers' },
  { slug: 'home-loans', name: 'Home Loan Providers', title: 'Home Loan Providers' },
];

// Generate all possible SEO page combinations
export const generateAllSEORoutes = () => {
  const routes = [];
  
  CITIES.forEach(city => {
    // City-level pages
    LISTING_TYPES.forEach(listing => {
      routes.push(`/${listing.slug}/flats-in-${city.slug}`);
      routes.push(`/${listing.slug}/apartments-in-${city.slug}`);
      
      // Property type combinations
      PROPERTY_TYPES.forEach(propType => {
        routes.push(`/${listing.slug}/${propType.slug}-in-${city.slug}`);
      });
      
      // Budget combinations
      const budgets = BUDGET_RANGES[listing.slug] || [];
      budgets.forEach(budget => {
        routes.push(`/${listing.slug}/flats-${budget.slug}-in-${city.slug}`);
      });
    });
    
    // Area-level pages
    const cityAreas = AREAS[city.slug] || [];
    cityAreas.forEach(area => {
      LISTING_TYPES.forEach(listing => {
        routes.push(`/${listing.slug}/flats-in-${area.slug}-${city.slug}`);
        
        PROPERTY_TYPES.forEach(propType => {
          routes.push(`/${listing.slug}/${propType.slug}-in-${area.slug}-${city.slug}`);
        });
      });
    });
    
    // Commercial pages
    COMMERCIAL_TYPES.forEach(comm => {
      routes.push(`/commercial/${comm.slug}-in-${city.slug}`);
    });
    
    // Service pages
    SERVICE_TYPES.forEach(service => {
      routes.push(`/${service.slug}-in-${city.slug}`);
    });
  });
  
  return routes;
};

export default {
  CITIES,
  AREAS,
  PROPERTY_TYPES,
  LISTING_TYPES,
  BUDGET_RANGES,
  COMMERCIAL_TYPES,
  SERVICE_TYPES,
  generateAllSEORoutes,
};
