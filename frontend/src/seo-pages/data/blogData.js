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
  {
    id: 6,
    slug: 'best-areas-mohali-it-professionals',
    title: 'Best Areas in Mohali for IT Professionals: Where to Live Near Tech Parks',
    excerpt: 'Guide to finding the perfect accommodation near IT companies in Mohali. Compare areas by commute time, amenities, and rental prices.',
    category: 'locality-guide',
    author: 'ApnaGhr Team',
    publishedAt: '2024-12-15',
    readTime: '9 min read',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
    featured: false,
    content: `
# Best Areas in Mohali for IT Professionals

Mohali has emerged as a major IT hub in North India, housing offices of Infosys, TCS, Quark, and numerous startups. Finding the right place to live is crucial for work-life balance.

## Top Areas Near IT Parks

### 1. Sector 82 - The IT Corridor
**Commute Time**: 5-10 minutes to IT City
**Rent Range**: ₹12,000 - ₹25,000 for 2BHK

Best for: Young professionals, couples
Pros: Close to offices, modern apartments, good restaurants

### 2. Sector 91 - Airport Road
**Commute Time**: 10-15 minutes
**Rent Range**: ₹10,000 - ₹20,000 for 2BHK

Best for: Budget-conscious professionals
Pros: Airport connectivity, developing infrastructure

### 3. Aerocity
**Commute Time**: 8-12 minutes
**Rent Range**: ₹15,000 - ₹30,000 for 2BHK

Best for: Senior professionals, families
Pros: Premium apartments, excellent amenities

### 4. Phase 7
**Commute Time**: 15-20 minutes
**Rent Range**: ₹10,000 - ₹18,000 for 2BHK

Best for: Those preferring established areas
Pros: Markets, schools, hospitals nearby

## Factors to Consider

1. **Commute Time**: Factor in both morning and evening traffic
2. **Public Transport**: Check auto/cab availability
3. **Food Options**: Tiffin services, restaurants, cafes
4. **Gym/Sports**: Fitness facilities for after-work activities
5. **Internet**: High-speed broadband availability

## Pro Tips for IT Professionals

- **Negotiate Longer Leases**: Get better rates with 11-month agreements
- **Check WiFi Speed**: Test internet before finalizing
- **Look for Furnished Options**: Save on setup costs
- **Join Community Groups**: Facebook groups for flatmate searches
    `,
    tags: ['mohali', 'it-professionals', 'rental', 'locality'],
    faqs: [
      { q: 'Which sector is closest to IT City Mohali?', a: 'Sector 82 and Sector 74A are closest, with 5-10 minute commute times.' },
      { q: 'What is average rent near IT parks in Mohali?', a: 'Average rent for a 2BHK near IT parks ranges from ₹12,000 to ₹25,000 per month.' },
    ],
  },
  {
    id: 7,
    slug: 'property-rates-chandigarh-2025',
    title: 'Property Rates in Chandigarh 2025: Complete Price Guide by Sector',
    excerpt: 'Detailed analysis of property prices across different sectors in Chandigarh. Compare rates for flats, plots, and independent houses.',
    category: 'market-trends',
    author: 'ApnaGhr Team',
    publishedAt: '2024-12-10',
    readTime: '11 min read',
    image: 'https://images.unsplash.com/photo-1560520653-9e0e4c89eb11?w=800',
    featured: false,
    content: `
# Property Rates in Chandigarh 2025

Chandigarh remains one of India's most sought-after cities for real estate investment due to its planned infrastructure and high quality of life.

## Sector-wise Price Analysis

### Premium Sectors (Sector 8-11)
- **Flats**: ₹15,000 - ₹25,000 per sq.ft.
- **Plots**: ₹1.5 - ₹3 Crore per kanal
- **Independent Houses**: ₹5 - ₹15 Crore

### Mid-Range Sectors (Sector 40-50)
- **Flats**: ₹8,000 - ₹14,000 per sq.ft.
- **Plots**: ₹80 Lakh - ₹1.5 Crore per kanal
- **Independent Houses**: ₹2 - ₹5 Crore

### Budget Sectors (Sector 51-63)
- **Flats**: ₹5,500 - ₹9,000 per sq.ft.
- **Plots**: ₹50 - ₹90 Lakh per kanal
- **Independent Houses**: ₹1 - ₹3 Crore

## Rental Yields by Area

| Sector Range | Avg. Yield | Best For |
|--------------|------------|----------|
| 8-20 | 2-2.5% | Capital appreciation |
| 35-45 | 2.5-3% | Balanced returns |
| 45+ | 3-4% | Rental income |

## Price Trends

- **2023-2024**: 5-7% appreciation
- **2024-2025 (Expected)**: 6-8% growth
- **Key Drivers**: Limited supply, high demand, infrastructure

## Investment Recommendations

1. **For End-Use**: Sectors 40-50 offer best value
2. **For Investment**: Sectors near IT City, Aerocity
3. **For Rental Income**: Sectors 35, 43, 44 near commercial areas
    `,
    tags: ['chandigarh', 'property-rates', 'investment', 'market-trends'],
    faqs: [
      { q: 'Which is the cheapest sector in Chandigarh?', a: 'Sectors 51-56 and Manimajra offer relatively affordable options compared to premium sectors.' },
      { q: 'Is Chandigarh property a good investment?', a: 'Yes, Chandigarh has shown consistent 5-8% annual appreciation with stable demand.' },
    ],
  },
  {
    id: 8,
    slug: 'rent-vs-buy-india-calculator',
    title: 'Rent vs Buy in India: Complete Calculator Guide for 2025',
    excerpt: 'Should you rent or buy a home in India? Use our detailed analysis and calculator methodology to make the right financial decision.',
    category: 'buying-guide',
    author: 'ApnaGhr Team',
    publishedAt: '2024-12-05',
    readTime: '13 min read',
    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800',
    featured: true,
    content: `
# Rent vs Buy in India: The Complete Guide

One of the biggest financial decisions you'll make is whether to rent or buy a home. Let's break down the math.

## The Basic Formula

**Price-to-Rent Ratio** = Property Price ÷ (Annual Rent)

| Ratio | Recommendation |
|-------|----------------|
| Below 15 | Buying is favorable |
| 15-20 | Either option works |
| Above 20 | Renting is better |

## Real Example: Mohali

**2BHK Flat in Sector 70**
- Purchase Price: ₹60 Lakh
- Monthly Rent: ₹15,000
- Annual Rent: ₹1,80,000
- Ratio: 33 (Renting preferred!)

## True Cost of Buying

### Upfront Costs
- Down Payment: 20% = ₹12 Lakh
- Stamp Duty: 6% = ₹3.6 Lakh
- Registration: 1% = ₹60,000
- GST (if new): 5% = ₹3 Lakh
- **Total Upfront**: ~₹19.2 Lakh

### Monthly Costs
- EMI (20 years, 8.5%): ₹41,500
- Maintenance: ₹3,000
- Insurance: ₹1,000
- **Total Monthly**: ₹45,500

## True Cost of Renting

- Rent: ₹15,000
- Maintenance: Included or ₹1,500
- Renters Insurance: ₹500
- **Total Monthly**: ~₹17,000

## The Investment Angle

If you invest the difference (₹28,500/month) at 12% returns:
- After 20 years: ~₹3.5 Crore
- Property value (7% appreciation): ~₹2.3 Crore

**Renting + Investing wins by ₹1.2 Crore!**

## When Buying Makes Sense

1. **You'll stay 7+ years** in same location
2. **Rent is high** relative to EMI
3. **Emotional security** matters more than returns
4. **Property has development potential**
5. **You have excess funds** beyond down payment

## When Renting Makes Sense

1. **Job requires mobility**
2. **Property prices are inflated**
3. **You're building a business**
4. **Better investment options available**
5. **You're young** and exploring careers
    `,
    tags: ['rent-vs-buy', 'investment', 'calculator', 'financial-planning'],
    faqs: [
      { q: 'Is it better to rent or buy in India 2025?', a: 'It depends on the price-to-rent ratio in your city. In most metro cities, renting and investing the difference often yields better returns.' },
      { q: 'What is a good price-to-rent ratio?', a: 'A ratio below 15 favors buying, while above 20 favors renting. Between 15-20, either option works.' },
    ],
  },
  {
    id: 9,
    slug: 'home-loan-tips-first-time-buyers',
    title: 'Home Loan Tips for First-Time Buyers: Get the Best Interest Rate',
    excerpt: 'Expert tips to secure the lowest home loan interest rate. Learn about credit scores, documentation, and negotiation strategies.',
    category: 'buying-guide',
    author: 'ApnaGhr Team',
    publishedAt: '2024-11-28',
    readTime: '8 min read',
    image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800',
    featured: false,
    content: `
# Home Loan Tips for First-Time Buyers

Getting the best home loan rate can save you lakhs over the loan tenure. Here's how to optimize your application.

## Improve Your Credit Score

### Quick Score Boosters
- Pay credit card bills on time
- Keep credit utilization below 30%
- Don't apply for multiple loans
- Maintain old credit accounts

### Score Impact on Rates
| Score | Typical Rate |
|-------|--------------|
| 750+ | 8.35% - 8.5% |
| 700-749 | 8.6% - 9% |
| 650-699 | 9.5% - 10% |
| Below 650 | Loan difficult |

## Documentation Checklist

### Salaried Employees
- 6 months salary slips
- 6 months bank statements
- Form 16 / IT Returns (2 years)
- Employment letter
- ID & Address proof

### Self-Employed
- 3 years IT Returns
- Business financials
- CA-certified statements
- GST returns
- Business proof

## Negotiation Tips

1. **Compare Multiple Banks**: Get at least 3 quotes
2. **Use Job Strength**: Stable employment = better rates
3. **Higher Down Payment**: 30%+ down can reduce rates
4. **Relationship Benefits**: Existing account holders get 0.1-0.2% off
5. **Festive Offers**: Banks offer special rates during Diwali, New Year

## Hidden Costs to Watch

- Processing Fee: 0.5-1%
- Legal Charges: ₹5,000-15,000
- Technical Valuation: ₹3,000-10,000
- Insurance Premium: Often bundled
- Prepayment Charges: Check if floating rate

## EMI vs Tenure Trade-off

For a ₹50 Lakh loan at 8.5%:
| Tenure | EMI | Total Interest |
|--------|-----|----------------|
| 15 years | ₹49,236 | ₹38.6 Lakh |
| 20 years | ₹43,391 | ₹54.1 Lakh |
| 25 years | ₹40,260 | ₹70.8 Lakh |

**Tip**: Start with longer tenure, prepay when possible.
    `,
    tags: ['home-loan', 'interest-rate', 'credit-score', 'tips'],
    faqs: [
      { q: 'What credit score is needed for home loan?', a: 'A score of 750+ gets you the best rates. Most banks require minimum 650 for approval.' },
      { q: 'Can I negotiate home loan interest rate?', a: 'Yes! Banks have flexibility of 0.2-0.5% for good profiles. Always negotiate with multiple quotes in hand.' },
    ],
  },
  {
    id: 10,
    slug: 'zirakpur-real-estate-guide-2025',
    title: 'Zirakpur Real Estate Guide 2025: Best Areas, Prices & Investment Tips',
    excerpt: 'Complete guide to buying and renting in Zirakpur. Compare areas like VIP Road, Patiala Road, and Baltana with price analysis.',
    category: 'locality-guide',
    author: 'ApnaGhr Team',
    publishedAt: '2024-11-20',
    readTime: '10 min read',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800',
    featured: false,
    content: `
# Zirakpur Real Estate Guide 2025

Zirakpur has transformed from a small town to a bustling real estate hub, offering affordable alternatives to Chandigarh and Mohali.

## Area-wise Analysis

### VIP Road
**Property Type**: High-rise apartments, commercial
**Price Range**: ₹4,500 - ₹6,000 per sq.ft.
**Rental Range**: ₹12,000 - ₹22,000 for 2BHK

**Pros**: Excellent connectivity, shopping malls, hospitals
**Cons**: Traffic congestion, noise

### Patiala Road
**Property Type**: Mixed development
**Price Range**: ₹3,800 - ₹5,500 per sq.ft.
**Rental Range**: ₹10,000 - ₹18,000 for 2BHK

**Pros**: Wider roads, newer projects, better planning
**Cons**: Far from Chandigarh center

### Baltana
**Property Type**: Budget apartments, plots
**Price Range**: ₹3,200 - ₹4,500 per sq.ft.
**Rental Range**: ₹8,000 - ₹14,000 for 2BHK

**Pros**: Most affordable, good for first-time buyers
**Cons**: Developing infrastructure

### Dhakoli
**Property Type**: Independent houses, plots
**Price Range**: ₹3,500 - ₹5,000 per sq.ft.
**Rental Range**: ₹9,000 - ₹16,000 for 2BHK

**Pros**: Peaceful, larger spaces
**Cons**: Limited public transport

## Investment Potential

### Growth Drivers
1. PR-7 Road widening
2. Metro connectivity (proposed)
3. Airport proximity
4. IT company expansions

### Expected Appreciation
- Short-term (1-2 years): 5-7%
- Medium-term (3-5 years): 8-12%
- Long-term (5+ years): 10-15%

## Tips for Buyers

1. **Verify Builder**: Check RERA registration
2. **Road Width**: Ensure minimum 30ft road
3. **Water Source**: Confirm water supply
4. **Future Plans**: Check master plan for area
5. **Resale Value**: Prefer known developers
    `,
    tags: ['zirakpur', 'real-estate', 'investment', 'locality-guide'],
    faqs: [
      { q: 'Is Zirakpur a good place to invest?', a: 'Yes, Zirakpur offers good appreciation potential due to its strategic location between Chandigarh, Mohali, and Panchkula.' },
      { q: 'What is property rate in Zirakpur?', a: 'Property rates range from ₹3,200 to ₹6,000 per sq.ft. depending on location and project quality.' },
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
