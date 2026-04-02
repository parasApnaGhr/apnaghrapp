// Sitemap Page - Displays all SEO links for crawlers and users
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Home, MapPin, Building, FileText, ChevronRight, Download, ExternalLink } from 'lucide-react';
import SEOHead from '../components/SEOHead';
import { CITIES, AREAS, PROPERTY_TYPES, LISTING_TYPES } from '../data/seoData';
import { BLOGS, BLOG_CATEGORIES } from '../data/blogData';
import { countTotalPages, generateSitemapXML } from '../utils/sitemapGenerator';

const SitemapPage = () => {
  const [activeTab, setActiveTab] = useState('rent');
  const [expandedCity, setExpandedCity] = useState(null);

  const totalPages = useMemo(() => countTotalPages(), []);

  // Download sitemap.xml
  const handleDownloadSitemap = () => {
    const xml = generateSitemapXML();
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sitemap.xml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <SEOHead
        title="Sitemap - All Property Listings | ApnaGhr"
        description="Browse all property listings across cities in Punjab, Haryana, and Chandigarh. Find flats for rent, apartments for sale, and more."
        canonical="/sitemap"
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

        <main className="max-w-7xl mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Sitemap
            </h1>
            <p className="text-gray-600">
              Browse all {totalPages.toLocaleString()}+ property listing pages
            </p>
            <button
              onClick={handleDownloadSitemap}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download sitemap.xml
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-gray-200">
            {LISTING_TYPES.map(type => (
              <button
                key={type.slug}
                onClick={() => setActiveTab(type.slug)}
                className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === type.slug
                    ? 'border-[#04473C] text-[#04473C]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {type.name}
              </button>
            ))}
            <button
              onClick={() => setActiveTab('blogs')}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'blogs'
                  ? 'border-[#04473C] text-[#04473C]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Blogs
            </button>
          </div>

          {/* Content */}
          {activeTab === 'blogs' ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#04473C]" />
                Blog Articles ({BLOGS.length})
              </h2>

              <div className="space-y-6">
                {BLOG_CATEGORIES.map(category => {
                  const categoryBlogs = BLOGS.filter(b => b.category === category.slug);
                  if (categoryBlogs.length === 0) return null;

                  return (
                    <div key={category.slug}>
                      <h3 className="font-semibold text-gray-700 mb-2">{category.name}</h3>
                      <ul className="space-y-1">
                        {categoryBlogs.map(blog => (
                          <li key={blog.id}>
                            <Link
                              to={`/blogs/${blog.slug}`}
                              className="text-[#04473C] hover:underline text-sm flex items-center gap-1"
                            >
                              <ChevronRight className="w-3 h-3" />
                              {blog.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {CITIES.map(city => (
                <div 
                  key={city.slug}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedCity(expandedCity === city.slug ? null : city.slug)}
                    className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#04473C]/10 rounded-lg flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-[#04473C]" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-gray-900">{city.name}</h3>
                        <p className="text-xs text-gray-500">{city.state}</p>
                      </div>
                    </div>
                    <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${
                      expandedCity === city.slug ? 'rotate-90' : ''
                    }`} />
                  </button>

                  {expandedCity === city.slug && (
                    <div className="border-t border-gray-200 p-4 bg-gray-50 space-y-4">
                      {/* Main city page */}
                      <div>
                        <Link
                          to={`/${activeTab}/flats-in-${city.slug}`}
                          className="text-[#04473C] font-medium hover:underline flex items-center gap-1"
                        >
                          <Building className="w-4 h-4" />
                          All Flats in {city.name}
                        </Link>
                      </div>

                      {/* Property types */}
                      <div>
                        <h4 className="text-xs uppercase text-gray-500 font-semibold mb-2">By Property Type</h4>
                        <ul className="space-y-1">
                          {PROPERTY_TYPES.slice(0, 5).map(propType => (
                            <li key={propType.slug}>
                              <Link
                                to={`/${activeTab}/${propType.slug}-in-${city.slug}`}
                                className="text-sm text-[#04473C] hover:underline flex items-center gap-1"
                              >
                                <ChevronRight className="w-3 h-3" />
                                {propType.name} in {city.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Areas */}
                      {AREAS[city.slug]?.length > 0 && (
                        <div>
                          <h4 className="text-xs uppercase text-gray-500 font-semibold mb-2">By Area</h4>
                          <ul className="space-y-1">
                            {AREAS[city.slug].map(area => (
                              <li key={area.slug}>
                                <Link
                                  to={`/${activeTab}/flats-in-${area.slug}-${city.slug}`}
                                  className="text-sm text-[#04473C] hover:underline flex items-center gap-1"
                                >
                                  <ChevronRight className="w-3 h-3" />
                                  {area.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Quick Links */}
          <section className="mt-12 bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Links</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link
                to="/rent/flats-in-mohali"
                className="p-3 bg-gray-50 rounded-lg hover:bg-[#04473C]/5 transition-colors text-center"
              >
                <span className="block font-medium text-gray-900">Rent in Mohali</span>
              </Link>
              <Link
                to="/buy/flats-in-mohali"
                className="p-3 bg-gray-50 rounded-lg hover:bg-[#04473C]/5 transition-colors text-center"
              >
                <span className="block font-medium text-gray-900">Buy in Mohali</span>
              </Link>
              <Link
                to="/rent/flats-in-chandigarh"
                className="p-3 bg-gray-50 rounded-lg hover:bg-[#04473C]/5 transition-colors text-center"
              >
                <span className="block font-medium text-gray-900">Rent in Chandigarh</span>
              </Link>
              <Link
                to="/blogs"
                className="p-3 bg-gray-50 rounded-lg hover:bg-[#04473C]/5 transition-colors text-center"
              >
                <span className="block font-medium text-gray-900">Real Estate Blog</span>
              </Link>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12 mt-16">
          <div className="max-w-7xl mx-auto px-4 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} ApnaGhr. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </>
  );
};

export default SitemapPage;
