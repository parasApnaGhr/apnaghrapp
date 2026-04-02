// Blog Data - Static blog content for SEO
// This does not modify any existing database

export const BLOG_CATEGORIES = [
  { slug: 'buying-guide', name: 'Buying Guide', icon: 'Home' },
  { slug: 'renting-tips', name: 'Renting Tips', icon: 'Key' },
  { slug: 'investment', name: 'Real Estate Investment', icon: 'TrendingUp' },
  { slug: 'home-decor', name: 'Home Decor', icon: 'Palette' },
  { slug: 'vastu-tips', name: 'Vastu Tips', icon: 'Compass' },
  { slug: 'legal-advice', name: 'Legal Advice', icon: 'Scale' },
  { slug: 'locality-guide', name: 'Locality Guide', icon: 'MapPin' },
  { slug: 'market-trends', name: 'Market Trends', icon: 'BarChart2' },
];

export const BLOGS = [
  {
    id: 1,
    slug: 'how-to-find-perfect-rental-home-mohali',
    title: 'How to Find the Perfect Rental Home in Mohali: Complete Guide 2025',
    excerpt: 'Discover the best areas, price ranges, and tips for finding your ideal rental property in Mohali. Expert advice for first-time renters and families.',
    category: 'renting-tips',
    author: 'ApnaGhr Team',
    publishedAt: '2025-01-15',
    readTime: '8 min read',
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
    featured: true,
    content: `
# How to Find the Perfect Rental Home in Mohali

Finding the perfect rental home in Mohali can be an exciting yet challenging journey. With the city's rapid development and growing real estate market, knowing where to look and what to consider is essential.

## Best Areas for Renting in Mohali

### Sector 70-80
These sectors are perfect for families looking for spacious apartments with modern amenities. Average rent ranges from ₹15,000 to ₹30,000 for 2-3 BHK flats.

### Aerocity & IT City
Ideal for IT professionals working in the nearby tech parks. Offers excellent connectivity and modern housing options.

### Phase 5-11
The older, more established areas with good markets, schools, and healthcare facilities nearby.

## Tips for First-Time Renters

1. **Set a Budget**: Keep your rent within 30% of your monthly income
2. **Visit Multiple Properties**: Don't settle for the first option
3. **Check Documentation**: Verify the landlord's ownership papers
4. **Negotiate Terms**: Rent, maintenance, and deposit are all negotiable
5. **Read the Agreement**: Understand all clauses before signing

## Average Rental Prices in Mohali (2025)

| Property Type | Average Rent |
|---------------|--------------|
| 1 BHK | ₹8,000 - ₹15,000 |
| 2 BHK | ₹12,000 - ₹25,000 |
| 3 BHK | ₹20,000 - ₹40,000 |
| 4 BHK | ₹35,000 - ₹60,000 |

## Conclusion

Mohali offers excellent rental options for all budgets. Use ApnaGhr's guided visit service to explore properties safely and efficiently.
    `,
    tags: ['mohali', 'rental', 'guide', 'tips'],
    faqs: [
      { q: 'What is the average rent for a 2BHK in Mohali?', a: 'Average rent for a 2BHK in Mohali ranges from ₹12,000 to ₹25,000 depending on the sector and amenities.' },
      { q: 'Which sector is best for families in Mohali?', a: 'Sectors 70-80 are excellent for families due to schools, parks, and peaceful environment.' },
      { q: 'Is Mohali good for rental investment?', a: 'Yes, Mohali has consistent rental demand due to IT companies and educational institutions.' },
    ],
  },
  {
    id: 2,
    slug: 'top-10-localities-chandigarh-tricity-2025',
    title: 'Top 10 Localities in Chandigarh Tricity for Property Investment 2025',
    excerpt: 'Comprehensive guide to the best localities in Chandigarh, Mohali, and Panchkula for property investment with price trends and future growth potential.',
    category: 'investment',
    author: 'ApnaGhr Team',
    publishedAt: '2025-01-10',
    readTime: '12 min read',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
    featured: true,
    content: `
# Top 10 Localities in Chandigarh Tricity for Property Investment

The Chandigarh Tricity region comprising Chandigarh, Mohali, and Panchkula is witnessing unprecedented growth in real estate.

## 1. Aerocity, Mohali
**Price Range**: ₹5,500 - ₹7,000 per sq.ft.
**Why Invest**: Proximity to airport, IT parks, and excellent connectivity.

## 2. Sector 82, Mohali
**Price Range**: ₹4,500 - ₹6,000 per sq.ft.
**Why Invest**: Upcoming metro connectivity, affordable prices, modern townships.

## 3. Zirakpur
**Price Range**: ₹4,000 - ₹5,500 per sq.ft.
**Why Invest**: Excellent connectivity to both Chandigarh and Mohali, commercial growth.

## 4. New Chandigarh (Mullanpur)
**Price Range**: ₹5,000 - ₹7,500 per sq.ft.
**Why Invest**: Planned development, upcoming infrastructure, capital appreciation potential.

## 5. IT City, Mohali
**Price Range**: ₹5,000 - ₹6,500 per sq.ft.
**Why Invest**: Tech hub, young working population, high rental demand.

## Investment Tips

- Buy near upcoming metro stations
- Look for RERA-registered projects
- Consider rental yield potential
- Check developer track record

## Future Growth Drivers

1. Metro Rail Project
2. International Airport Expansion
3. IT Sector Growth
4. Educational Institutions
    `,
    tags: ['investment', 'chandigarh', 'mohali', 'tricity'],
    faqs: [
      { q: 'Is Mohali good for property investment?', a: 'Yes, Mohali is excellent for investment due to IT growth, infrastructure development, and appreciation potential.' },
      { q: 'What is the price trend in Zirakpur?', a: 'Zirakpur has seen 8-12% annual appreciation over the last 5 years.' },
    ],
  },
  {
    id: 3,
    slug: 'vastu-tips-new-home-buyers',
    title: 'Essential Vastu Tips for New Home Buyers: Complete Shastra Guide',
    excerpt: 'Learn important Vastu Shastra principles to consider when buying or renting a new home. Expert tips for positive energy and prosperity.',
    category: 'vastu-tips',
    author: 'ApnaGhr Team',
    publishedAt: '2025-01-05',
    readTime: '10 min read',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
    featured: false,
    content: `
# Essential Vastu Tips for New Home Buyers

Vastu Shastra is an ancient Indian science of architecture that ensures harmony between nature and living spaces.

## Main Entrance Direction

The main entrance is the "mouth" of the home through which energy enters.

### Best Directions for Main Door:
- **North**: Prosperity and career growth
- **East**: Health and family well-being
- **North-East**: Most auspicious, brings positive energy

### Avoid:
- South-West facing entrance
- Doors directly facing stairs

## Kitchen Vastu

- **Ideal Location**: South-East corner (Agni corner)
- **Cooking Direction**: Face East while cooking
- **Avoid**: Kitchen under or above bathroom

## Bedroom Vastu

- **Master Bedroom**: South-West for stability
- **Bed Position**: Head towards South or East
- **Avoid**: Mirror facing the bed

## Bathroom Vastu

- **Location**: North-West or West
- **Toilet Seat**: Face North or South
- **Avoid**: Bathroom in North-East

## Living Room

- **Location**: North or East
- **Heavy Furniture**: South or West walls
- **TV/Electronics**: South-East

## Common Vastu Defects to Avoid

1. Cut corners in North-East
2. Toilet in North-East
3. Staircase in center of house
4. Underground water tank in South
5. Kitchen and toilet sharing wall
    `,
    tags: ['vastu', 'home-buying', 'tips'],
    faqs: [
      { q: 'Which direction is best for main door?', a: 'North and East facing doors are considered most auspicious in Vastu.' },
      { q: 'Can Vastu defects be corrected?', a: 'Yes, many Vastu defects can be remedied using colors, mirrors, and placement changes.' },
    ],
  },
  {
    id: 4,
    slug: 'rental-agreement-checklist-india',
    title: 'Rental Agreement Checklist: What Every Tenant Must Know in India',
    excerpt: 'Complete guide to rental agreements in India. Learn about essential clauses, legal requirements, and how to protect yourself as a tenant.',
    category: 'legal-advice',
    author: 'ApnaGhr Team',
    publishedAt: '2024-12-28',
    readTime: '7 min read',
    image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800',
    featured: false,
    content: `
# Rental Agreement Checklist for Tenants in India

A well-drafted rental agreement protects both landlord and tenant. Here's everything you need to know.

## Essential Clauses in Rental Agreement

### 1. Parties' Details
- Full names and addresses
- ID proof references
- Contact numbers

### 2. Property Details
- Complete address
- Property description
- Furnishing status

### 3. Financial Terms
- Monthly rent amount
- Security deposit
- Maintenance charges
- Payment due date
- Mode of payment

### 4. Duration and Renewal
- Lease start and end date
- Lock-in period
- Renewal terms
- Notice period (usually 1-2 months)

### 5. Responsibilities
- Maintenance responsibilities
- Utility bill payments
- Repairs and damages

## Documents Required

**From Tenant:**
- ID Proof (Aadhaar/PAN)
- Address Proof
- Passport photos
- Employment proof

**From Landlord:**
- Property ownership documents
- ID Proof
- Previous electricity bills

## Legal Requirements

- Stamp paper value varies by state
- Registration mandatory for agreements > 11 months
- Two witnesses required

## Red Flags to Watch

1. No lock-in period mentioned
2. Unclear maintenance terms
3. Arbitrary eviction clauses
4. No inventory list
5. Verbal promises not in writing
    `,
    tags: ['rental', 'legal', 'agreement', 'tenant'],
    faqs: [
      { q: 'Is rental agreement registration mandatory?', a: 'Yes, for agreements exceeding 11 months, registration is mandatory under law.' },
      { q: 'What is standard security deposit in India?', a: 'Usually 2-3 months rent, but can vary by city and landlord.' },
    ],
  },
  {
    id: 5,
    slug: 'first-time-home-buyer-guide-india',
    title: 'First Time Home Buyer Guide India 2025: Step-by-Step Process',
    excerpt: 'Complete guide for first-time home buyers in India covering budget planning, home loans, legal checks, and registration process.',
    category: 'buying-guide',
    author: 'ApnaGhr Team',
    publishedAt: '2024-12-20',
    readTime: '15 min read',
    image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800',
    featured: true,
    content: `
# First Time Home Buyer Guide India 2025

Buying your first home is a significant milestone. This comprehensive guide will help you navigate the process.

## Step 1: Financial Planning

### Assess Your Budget
- Calculate affordable EMI (not more than 40% of income)
- Factor in down payment (usually 20%)
- Include stamp duty and registration (5-7%)
- Additional costs: Interior, maintenance, society charges

### Check Your Credit Score
- Score above 750 ensures better interest rates
- Check for any errors in credit report
- Pay off existing loans if possible

## Step 2: Home Loan Pre-Approval

### Documents Required
- Salary slips (6 months)
- Bank statements (6 months)
- IT Returns (2-3 years)
- Employment certificate
- ID and address proofs

### Compare Loan Options
- Fixed vs Floating rate
- Processing fees
- Prepayment charges
- Insurance requirements

## Step 3: Property Search

### Location Factors
- Commute to workplace
- Schools and hospitals
- Future development plans
- Resale value potential

### RERA Verification
- Check RERA registration number
- Verify project approvals
- Review completion timeline

## Step 4: Legal Due Diligence

### Documents to Verify
- Title deed
- Encumbrance certificate
- Approved building plan
- Occupancy certificate
- NOC from relevant authorities

## Step 5: Registration Process

1. Pay stamp duty
2. Execute sale deed
3. Register at Sub-Registrar office
4. Mutation of property
5. Update property records

## Government Schemes for First-Time Buyers

- PMAY (Pradhan Mantri Awas Yojana)
- Credit-Linked Subsidy Scheme
- State housing schemes
    `,
    tags: ['buying', 'guide', 'first-time', 'home-loan'],
    faqs: [
      { q: 'What is the minimum down payment for home loan?', a: 'Most banks require 10-20% down payment. For loans above ₹75 lakh, 25% is standard.' },
      { q: 'How to check if property is RERA registered?', a: 'Visit your state RERA website and search using project name or registration number.' },
    ],
  },
];

export const getBlogBySlug = (slug) => {
  return BLOGS.find(blog => blog.slug === slug);
};

export const getBlogsByCategory = (category) => {
  return BLOGS.filter(blog => blog.category === category);
};

export const getFeaturedBlogs = () => {
  return BLOGS.filter(blog => blog.featured);
};

export const getRecentBlogs = (limit = 5) => {
  return [...BLOGS]
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    .slice(0, limit);
};

export const getRelatedBlogs = (currentSlug, limit = 3) => {
  const currentBlog = getBlogBySlug(currentSlug);
  if (!currentBlog) return [];
  
  return BLOGS
    .filter(blog => blog.slug !== currentSlug && blog.category === currentBlog.category)
    .slice(0, limit);
};

export default {
  BLOG_CATEGORIES,
  BLOGS,
  getBlogBySlug,
  getBlogsByCategory,
  getFeaturedBlogs,
  getRecentBlogs,
  getRelatedBlogs,
};
