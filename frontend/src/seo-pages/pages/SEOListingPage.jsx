// SEO Property Listing Page - Dynamic SEO-optimized page
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal, ChevronRight, Home, MapPin, ArrowLeft, Grid, List } from 'lucide-react';
import SEOHead from '../components/SEOHead';
import SEOPropertyCard from '../components/SEOPropertyCard';
import SEOFAQSection from '../components/SEOFAQSection';
import SEOInternalLinks from '../components/SEOInternalLinks';
import { 
  parseSlug, 
  generateMetaTitle, 
  generateMetaDescription, 
  generateH1, 
  generateAreaContent,
  generateFAQs,
  generateListingSchema,
  generateFAQSchema,
  generateRelatedLinks,
  getNearbyLocations
} from '../utils/seoUtils';
import { CITIES, AREAS, PROPERTY_TYPES, BUDGET_RANGES } from '../data/seoData';
import api from '../../utils/api';

const SEOListingPage = ({ listingType = 'rent' }) => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Parse the URL slug
  const parsedSlug = parseSlug(slug);
  
  // Generate SEO content
  const metaTitle = generateMetaTitle(listingType, parsedSlug);
  const metaDescription = generateMetaDescription(listingType, parsedSlug, properties.length);
  const h1Title = generateH1(listingType, parsedSlug);
  const areaContent = generateAreaContent(listingType, parsedSlug);
  const faqs = generateFAQs(listingType, parsedSlug);
  const relatedLinks = generateRelatedLinks(listingType, parsedSlug);
  const nearbyLocations = parsedSlug?.city ? getNearbyLocations(parsedSlug.city.slug) : [];

  // Fetch properties (read-only)
  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      try {
        // Build query params based on parsed slug
        const params = new URLSearchParams();
        
        if (parsedSlug?.city) {
          params.append('city', parsedSlug.city.name);
        }
        if (parsedSlug?.area) {
          params.append('area', parsedSlug.area.name);
        }
        if (parsedSlug?.propertyType?.bedrooms !== undefined) {
          params.append('bedrooms', parsedSlug.propertyType.bedrooms);
        }
        if (parsedSlug?.budget) {
          params.append('min_price', parsedSlug.budget.min);
          params.append('max_price', parsedSlug.budget.max);
        }
        params.append('listing_type', listingType);
        
        const response = await api.get(`/seo/properties?${params.toString()}`);
        setProperties(response.data || []);
      } catch (error) {
        console.log('Properties not available, showing content only');
        setProperties([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [slug, listingType, parsedSlug?.city?.slug, parsedSlug?.area?.slug]);

  // Pagination
  const totalPages = Math.ceil(properties.length / itemsPerPage);
  const paginatedProperties = properties.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Schema markup
  const listingSchema = generateListingSchema(paginatedProperties, listingType, parsedSlug);
  const faqSchema = generateFAQSchema(faqs);

  return (
    <>
      <SEOHead
        title={metaTitle}
        description={metaDescription}
        canonical={`/${listingType}/${slug}`}
        schema={listingSchema}
        faqSchema={faqSchema}
      />

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link to="/" className="flex items-center gap-2">
                <Home className="w-6 h-6 text-[#04473C]" />
                <span className="font-bold text-xl text-[#04473C]">ApnaGhr</span>
              </Link>
              
              <nav className="hidden md:flex items-center gap-6">
                <Link to="/rent/flats-in-mohali" className="text-gray-600 hover:text-[#04473C]">Rent</Link>
                <Link to="/buy/flats-in-mohali" className="text-gray-600 hover:text-[#04473C]">Buy</Link>
                <Link to="/pg/pg-in-mohali" className="text-gray-600 hover:text-[#04473C]">PG</Link>
                <Link to="/blogs" className="text-gray-600 hover:text-[#04473C]">Blog</Link>
              </nav>

              <Link
                to="/"
                className="px-4 py-2 bg-[#04473C] text-white rounded-lg text-sm font-medium hover:bg-[#033530]"
              >
                Book Visit
              </Link>
            </div>
          </div>
        </header>

        {/* Breadcrumb */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <nav className="flex items-center gap-2 text-sm text-gray-600">
              <Link to="/" className="hover:text-[#04473C]">Home</Link>
              <ChevronRight className="w-4 h-4" />
              <Link to={`/${listingType}/flats-in-mohali`} className="hover:text-[#04473C] capitalize">{listingType}</Link>
              {parsedSlug?.city && (
                <>
                  <ChevronRight className="w-4 h-4" />
                  <Link 
                    to={`/${listingType}/flats-in-${parsedSlug.city.slug}`}
                    className="hover:text-[#04473C]"
                  >
                    {parsedSlug.city.name}
                  </Link>
                </>
              )}
              {parsedSlug?.area && (
                <>
                  <ChevronRight className="w-4 h-4" />
                  <span className="text-gray-900">{parsedSlug.area.name}</span>
                </>
              )}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 py-8">
          {/* H1 Title */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              {h1Title}
            </h1>
            <p className="text-gray-600">
              {properties.length > 0 
                ? `${properties.length} properties available`
                : 'Explore available properties in this area'}
            </p>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-3 mb-6 p-4 bg-white rounded-xl border border-gray-200">
            {/* Property Type Filter */}
            <select 
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:border-[#04473C] focus:ring-1 focus:ring-[#04473C]"
              onChange={(e) => {
                if (e.target.value && parsedSlug?.city) {
                  navigate(`/${listingType}/${e.target.value}-in-${parsedSlug.city.slug}`);
                }
              }}
              defaultValue=""
            >
              <option value="">All Types</option>
              {PROPERTY_TYPES.map(pt => (
                <option key={pt.slug} value={pt.slug}>{pt.name}</option>
              ))}
            </select>

            {/* Budget Filter */}
            <select 
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:border-[#04473C] focus:ring-1 focus:ring-[#04473C]"
              onChange={(e) => {
                if (e.target.value && parsedSlug?.city) {
                  navigate(`/${listingType}/flats-${e.target.value}-in-${parsedSlug.city.slug}`);
                }
              }}
              defaultValue=""
            >
              <option value="">Any Budget</option>
              {(BUDGET_RANGES[listingType] || []).map(b => (
                <option key={b.slug} value={b.slug}>{b.name}</option>
              ))}
            </select>

            {/* City Filter */}
            <select 
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:border-[#04473C] focus:ring-1 focus:ring-[#04473C]"
              onChange={(e) => {
                if (e.target.value) {
                  navigate(`/${listingType}/flats-in-${e.target.value}`);
                }
              }}
              value={parsedSlug?.city?.slug || ''}
            >
              <option value="">Select City</option>
              {CITIES.map(city => (
                <option key={city.slug} value={city.slug}>{city.name}</option>
              ))}
            </select>

            <div className="flex-1" />

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Property Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
                  <div className="h-48 bg-gray-200" />
                  <div className="p-4 space-y-3">
                    <div className="h-6 bg-gray-200 rounded w-1/2" />
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : paginatedProperties.length > 0 ? (
            <div className={`grid gap-6 ${
              viewMode === 'grid' 
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                : 'grid-cols-1'
            }`}>
              {paginatedProperties.map(property => (
                <SEOPropertyCard 
                  key={property.id} 
                  property={property} 
                  listingType={listingType}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
              <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Properties Listed Yet
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                We're expanding our listings in this area. Meanwhile, explore nearby locations or check back soon.
              </p>
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#04473C] text-white rounded-lg font-medium hover:bg-[#033530]"
              >
                <Home className="w-5 h-5" />
                Explore All Properties
              </Link>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-4 py-2 rounded-lg ${
                      currentPage === pageNum
                        ? 'bg-[#04473C] text-white'
                        : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}

          {/* Area Content */}
          {areaContent && (
            <section className="mt-12 prose prose-lg max-w-none">
              <div 
                className="bg-white rounded-xl border border-gray-200 p-6 md:p-8"
                dangerouslySetInnerHTML={{ __html: areaContent.replace(/\n/g, '<br/>') }}
              />
            </section>
          )}

          {/* FAQ Section */}
          <SEOFAQSection faqs={faqs} />

          {/* Internal Links */}
          <SEOInternalLinks 
            links={relatedLinks} 
            nearbyLocations={nearbyLocations}
          />

          {/* CTA Section */}
          <section className="mt-12 bg-gradient-to-r from-[#04473C] to-[#065f4e] rounded-2xl p-8 md:p-12 text-white text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Ready to Find Your Perfect Home?
            </h2>
            <p className="text-white/80 mb-6 max-w-2xl mx-auto">
              Book a guided property visit with ApnaGhr. Our verified riders will accompany you to multiple properties in a single trip.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[#04473C] rounded-xl font-bold hover:bg-gray-100 transition-colors"
            >
              <Home className="w-5 h-5" />
              Book Property Visit Now
            </Link>
          </section>
        </main>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12 mt-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div>
                <h3 className="font-bold text-lg mb-4">Popular Cities</h3>
                <ul className="space-y-2 text-gray-400">
                  {CITIES.slice(0, 5).map(city => (
                    <li key={city.slug}>
                      <Link to={`/rent/flats-in-${city.slug}`} className="hover:text-white">
                        Properties in {city.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-4">Property Types</h3>
                <ul className="space-y-2 text-gray-400">
                  {PROPERTY_TYPES.slice(0, 5).map(pt => (
                    <li key={pt.slug}>
                      <Link to={`/rent/${pt.slug}-in-mohali`} className="hover:text-white">
                        {pt.name} for Rent
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-4">Resources</h3>
                <ul className="space-y-2 text-gray-400">
                  <li><Link to="/blogs" className="hover:text-white">Blog</Link></li>
                  <li><Link to="/blogs/first-time-home-buyer-guide-india" className="hover:text-white">Buying Guide</Link></li>
                  <li><Link to="/blogs/rental-agreement-checklist-india" className="hover:text-white">Rental Guide</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-4">Company</h3>
                <ul className="space-y-2 text-gray-400">
                  <li><Link to="/" className="hover:text-white">About Us</Link></li>
                  <li><Link to="/" className="hover:text-white">Contact</Link></li>
                  <li><Link to="/" className="hover:text-white">Privacy Policy</Link></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
              <p>&copy; {new Date().getFullYear()} ApnaGhr. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default SEOListingPage;
