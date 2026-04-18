// @ts-nocheck
// SEO Data - Cities, Areas, Property Types, Budget Ranges
// This is static data used for generating SEO pages

export const CITIES = [
  // Metro Cities
  { slug: 'delhi', name: 'Delhi', state: 'Delhi' },
  { slug: 'mumbai', name: 'Mumbai', state: 'Maharashtra' },
  { slug: 'bangalore', name: 'Bangalore', state: 'Karnataka' },
  { slug: 'hyderabad', name: 'Hyderabad', state: 'Telangana' },
  { slug: 'chennai', name: 'Chennai', state: 'Tamil Nadu' },
  { slug: 'kolkata', name: 'Kolkata', state: 'West Bengal' },
  { slug: 'pune', name: 'Pune', state: 'Maharashtra' },
  { slug: 'ahmedabad', name: 'Ahmedabad', state: 'Gujarat' },
  // NCR Region
  { slug: 'noida', name: 'Noida', state: 'Uttar Pradesh' },
  { slug: 'gurgaon', name: 'Gurgaon', state: 'Haryana' },
  { slug: 'ghaziabad', name: 'Ghaziabad', state: 'Uttar Pradesh' },
  { slug: 'faridabad', name: 'Faridabad', state: 'Haryana' },
  // Gujarat
  { slug: 'surat', name: 'Surat', state: 'Gujarat' },
  { slug: 'vadodara', name: 'Vadodara', state: 'Gujarat' },
  { slug: 'rajkot', name: 'Rajkot', state: 'Gujarat' },
  // Rajasthan
  { slug: 'jaipur', name: 'Jaipur', state: 'Rajasthan' },
  { slug: 'ajmer', name: 'Ajmer', state: 'Rajasthan' },
  { slug: 'alwar', name: 'Alwar', state: 'Rajasthan' },
  // Uttar Pradesh
  { slug: 'lucknow', name: 'Lucknow', state: 'Uttar Pradesh' },
  { slug: 'agra', name: 'Agra', state: 'Uttar Pradesh' },
  { slug: 'kanpur', name: 'Kanpur', state: 'Uttar Pradesh' },
  { slug: 'varanasi', name: 'Varanasi', state: 'Uttar Pradesh' },
  { slug: 'meerut', name: 'Meerut', state: 'Uttar Pradesh' },
  // Madhya Pradesh
  { slug: 'indore', name: 'Indore', state: 'Madhya Pradesh' },
  { slug: 'bhopal', name: 'Bhopal', state: 'Madhya Pradesh' },
  { slug: 'ujjain', name: 'Ujjain', state: 'Madhya Pradesh' },
  { slug: 'gwalior', name: 'Gwalior', state: 'Madhya Pradesh' },
  // Punjab
  { slug: 'chandigarh', name: 'Chandigarh', state: 'Chandigarh' },
  { slug: 'mohali', name: 'Mohali', state: 'Punjab' },
  { slug: 'zirakpur', name: 'Zirakpur', state: 'Punjab' },
  { slug: 'jalandhar', name: 'Jalandhar', state: 'Punjab' },
  { slug: 'ludhiana', name: 'Ludhiana', state: 'Punjab' },
  { slug: 'amritsar', name: 'Amritsar', state: 'Punjab' },
  { slug: 'bathinda', name: 'Bathinda', state: 'Punjab' },
  { slug: 'patiala', name: 'Patiala', state: 'Punjab' },
  { slug: 'kharar', name: 'Kharar', state: 'Punjab' },
  { slug: 'derabassi', name: 'Dera Bassi', state: 'Punjab' },
  { slug: 'panchkula', name: 'Panchkula', state: 'Haryana' },
  // Haryana
  { slug: 'hisar', name: 'Hisar', state: 'Haryana' },
  { slug: 'rohtak', name: 'Rohtak', state: 'Haryana' },
  { slug: 'panipat', name: 'Panipat', state: 'Haryana' },
  { slug: 'karnal', name: 'Karnal', state: 'Haryana' },
  { slug: 'ambala', name: 'Ambala', state: 'Haryana' },
  // Uttarakhand
  { slug: 'dehradun', name: 'Dehradun', state: 'Uttarakhand' },
  { slug: 'haldwani', name: 'Haldwani', state: 'Uttarakhand' },
  { slug: 'haridwar', name: 'Haridwar', state: 'Uttarakhand' },
  // Maharashtra
  { slug: 'nagpur', name: 'Nagpur', state: 'Maharashtra' },
  { slug: 'nashik', name: 'Nashik', state: 'Maharashtra' },
  { slug: 'aurangabad', name: 'Aurangabad', state: 'Maharashtra' },
  // Tamil Nadu
  { slug: 'coimbatore', name: 'Coimbatore', state: 'Tamil Nadu' },
  { slug: 'trichy', name: 'Trichy', state: 'Tamil Nadu' },
  { slug: 'madurai', name: 'Madurai', state: 'Tamil Nadu' },
  // Karnataka
  { slug: 'mysore', name: 'Mysore', state: 'Karnataka' },
  // Andhra Pradesh & Telangana
  { slug: 'vijayawada', name: 'Vijayawada', state: 'Andhra Pradesh' },
  { slug: 'visakhapatnam', name: 'Visakhapatnam', state: 'Andhra Pradesh' },
  // Eastern India
  { slug: 'patna', name: 'Patna', state: 'Bihar' },
  { slug: 'ranchi', name: 'Ranchi', state: 'Jharkhand' },
  { slug: 'bhubaneswar', name: 'Bhubaneswar', state: 'Odisha' },
  { slug: 'guwahati', name: 'Guwahati', state: 'Assam' },
  { slug: 'siliguri', name: 'Siliguri', state: 'West Bengal' },
  // Chhattisgarh
  { slug: 'raipur', name: 'Raipur', state: 'Chhattisgarh' },
  { slug: 'bilaspur', name: 'Bilaspur', state: 'Chhattisgarh' },
  { slug: 'durg', name: 'Durg', state: 'Chhattisgarh' },
  // Jammu & Kashmir
  { slug: 'jammu', name: 'Jammu', state: 'Jammu & Kashmir' },
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
  // Metro Cities
  delhi: [
    { slug: 'dwarka', name: 'Dwarka' },
    { slug: 'rohini', name: 'Rohini' },
    { slug: 'saket', name: 'Saket' },
    { slug: 'vasant-kunj', name: 'Vasant Kunj' },
    { slug: 'pitampura', name: 'Pitampura' },
    { slug: 'janakpuri', name: 'Janakpuri' },
    { slug: 'laxmi-nagar', name: 'Laxmi Nagar' },
    { slug: 'mayur-vihar', name: 'Mayur Vihar' },
    { slug: 'south-extension', name: 'South Extension' },
    { slug: 'greater-kailash', name: 'Greater Kailash' },
  ],
  mumbai: [
    { slug: 'andheri', name: 'Andheri' },
    { slug: 'bandra', name: 'Bandra' },
    { slug: 'powai', name: 'Powai' },
    { slug: 'goregaon', name: 'Goregaon' },
    { slug: 'malad', name: 'Malad' },
    { slug: 'borivali', name: 'Borivali' },
    { slug: 'thane', name: 'Thane' },
    { slug: 'navi-mumbai', name: 'Navi Mumbai' },
    { slug: 'worli', name: 'Worli' },
    { slug: 'juhu', name: 'Juhu' },
  ],
  bangalore: [
    { slug: 'whitefield', name: 'Whitefield' },
    { slug: 'electronic-city', name: 'Electronic City' },
    { slug: 'koramangala', name: 'Koramangala' },
    { slug: 'hsr-layout', name: 'HSR Layout' },
    { slug: 'marathahalli', name: 'Marathahalli' },
    { slug: 'btm-layout', name: 'BTM Layout' },
    { slug: 'indiranagar', name: 'Indiranagar' },
    { slug: 'jayanagar', name: 'Jayanagar' },
    { slug: 'sarjapur', name: 'Sarjapur' },
    { slug: 'hebbal', name: 'Hebbal' },
  ],
  hyderabad: [
    { slug: 'gachibowli', name: 'Gachibowli' },
    { slug: 'hitech-city', name: 'Hitech City' },
    { slug: 'madhapur', name: 'Madhapur' },
    { slug: 'kondapur', name: 'Kondapur' },
    { slug: 'banjara-hills', name: 'Banjara Hills' },
    { slug: 'jubilee-hills', name: 'Jubilee Hills' },
    { slug: 'kukatpally', name: 'Kukatpally' },
    { slug: 'miyapur', name: 'Miyapur' },
    { slug: 'secunderabad', name: 'Secunderabad' },
  ],
  chennai: [
    { slug: 'anna-nagar', name: 'Anna Nagar' },
    { slug: 'velachery', name: 'Velachery' },
    { slug: 'omr', name: 'OMR' },
    { slug: 'porur', name: 'Porur' },
    { slug: 'tambaram', name: 'Tambaram' },
    { slug: 'adyar', name: 'Adyar' },
    { slug: 'sholinganallur', name: 'Sholinganallur' },
    { slug: 't-nagar', name: 'T Nagar' },
  ],
  kolkata: [
    { slug: 'salt-lake', name: 'Salt Lake' },
    { slug: 'new-town', name: 'New Town' },
    { slug: 'rajarhat', name: 'Rajarhat' },
    { slug: 'garia', name: 'Garia' },
    { slug: 'jadavpur', name: 'Jadavpur' },
    { slug: 'ballygunge', name: 'Ballygunge' },
    { slug: 'howrah', name: 'Howrah' },
  ],
  pune: [
    { slug: 'hinjewadi', name: 'Hinjewadi' },
    { slug: 'kharadi', name: 'Kharadi' },
    { slug: 'wakad', name: 'Wakad' },
    { slug: 'baner', name: 'Baner' },
    { slug: 'viman-nagar', name: 'Viman Nagar' },
    { slug: 'hadapsar', name: 'Hadapsar' },
    { slug: 'kothrud', name: 'Kothrud' },
    { slug: 'aundh', name: 'Aundh' },
  ],
  noida: [
    { slug: 'sector-62', name: 'Sector 62' },
    { slug: 'sector-63', name: 'Sector 63' },
    { slug: 'sector-128', name: 'Sector 128' },
    { slug: 'sector-137', name: 'Sector 137' },
    { slug: 'sector-150', name: 'Sector 150' },
    { slug: 'greater-noida', name: 'Greater Noida' },
    { slug: 'noida-extension', name: 'Noida Extension' },
  ],
  gurgaon: [
    { slug: 'dlf-phase-1', name: 'DLF Phase 1' },
    { slug: 'dlf-phase-2', name: 'DLF Phase 2' },
    { slug: 'sector-49', name: 'Sector 49' },
    { slug: 'sohna-road', name: 'Sohna Road' },
    { slug: 'golf-course-road', name: 'Golf Course Road' },
    { slug: 'mg-road', name: 'MG Road' },
    { slug: 'cyber-city', name: 'Cyber City' },
  ],
  ahmedabad: [
    { slug: 'sg-highway', name: 'SG Highway' },
    { slug: 'satellite', name: 'Satellite' },
    { slug: 'prahlad-nagar', name: 'Prahlad Nagar' },
    { slug: 'vastrapur', name: 'Vastrapur' },
    { slug: 'bopal', name: 'Bopal' },
    { slug: 'thaltej', name: 'Thaltej' },
  ],
  jaipur: [
    { slug: 'mansarovar', name: 'Mansarovar' },
    { slug: 'vaishali-nagar', name: 'Vaishali Nagar' },
    { slug: 'malviya-nagar', name: 'Malviya Nagar' },
    { slug: 'raja-park', name: 'Raja Park' },
    { slug: 'tonk-road', name: 'Tonk Road' },
    { slug: 'jagatpura', name: 'Jagatpura' },
  ],
  lucknow: [
    { slug: 'gomti-nagar', name: 'Gomti Nagar' },
    { slug: 'hazratganj', name: 'Hazratganj' },
    { slug: 'aliganj', name: 'Aliganj' },
    { slug: 'indira-nagar', name: 'Indira Nagar' },
    { slug: 'vikas-nagar', name: 'Vikas Nagar' },
  ],
  indore: [
    { slug: 'vijay-nagar', name: 'Vijay Nagar' },
    { slug: 'palasia', name: 'Palasia' },
    { slug: 'ab-road', name: 'AB Road' },
    { slug: 'bhawarkuan', name: 'Bhawarkuan' },
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
