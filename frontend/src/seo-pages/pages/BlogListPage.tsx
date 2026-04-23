// @ts-nocheck
// Blog Listing Page - SEO Optimized
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, ChevronRight, Home, Search, Tag, User, ArrowRight } from 'lucide-react';
import SEOHead from '../components/SEOHead';
import { BLOGS, BLOG_CATEGORIES, getFeaturedBlogs, getRecentBlogs } from '../data/blogData';

const BlogListPage = () => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const featuredBlogs = getFeaturedBlogs();
  
  // Filter blogs
  const filteredBlogs = BLOGS.filter(blog => {
    const matchesCategory = !selectedCategory || blog.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      blog.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <>
      <SEOHead
        title="Real Estate Blog - Home Buying, Renting & Investment Tips | ApnaGhr"
        description="Expert advice on buying, renting, and investing in real estate. Tips on home loans, Vastu, legal matters, and locality guides for Chandigarh Tricity region."
        canonical="/blogs"
        type="blog"
      />

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link to="/" className="flex items-center gap-2">
                <Home className="w-6 h-6 text-[var(--stitch-ink)]" />
                <span className="font-bold text-xl text-[var(--stitch-ink)]">ApnaGhr</span>
              </Link>
              
              <nav className="hidden md:flex items-center gap-6">
                <Link to="/rent/flats-in-mohali" className="text-gray-600 hover:text-[var(--stitch-ink)]">Rent</Link>
                <Link to="/buy/flats-in-mohali" className="text-gray-600 hover:text-[var(--stitch-ink)]">Buy</Link>
                <Link to="/blogs" className="text-[var(--stitch-ink)] font-medium">Blog</Link>
              </nav>

              <Link
                to="/"
                className="px-4 py-2 bg-[var(--stitch-ink)] text-white rounded-lg text-sm font-medium hover:bg-[var(--stitch-ink)]"
              >
                Book Visit
              </Link>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="bg-gradient-to-br from-[var(--stitch-ink)] to-[var(--stitch-ink)] text-white py-16">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              ApnaGhr Real Estate Blog
            </h1>
            <p className="text-xl text-white/80 max-w-2xl mx-auto mb-8">
              Expert tips on buying, renting, and investing in properties. Your guide to making smart real estate decisions.
            </p>
            
            {/* Search */}
            <div className="max-w-xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="bg-white border-b border-gray-200 py-4 sticky top-[73px] z-30">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  !selectedCategory 
                    ? 'bg-[var(--stitch-ink)] text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Articles
              </button>
              {BLOG_CATEGORIES.map(cat => (
                <button
                  key={cat.slug}
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === cat.slug 
                      ? 'bg-[var(--stitch-ink)] text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </section>

        <main className="max-w-7xl mx-auto px-4 py-12">
          {/* Featured Posts */}
          {!selectedCategory && !searchQuery && featuredBlogs.length > 0 && (
            <section className="mb-16">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Articles</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {featuredBlogs.slice(0, 2).map(blog => (
                  <Link
                    key={blog.id}
                    to={`/blogs/${blog.slug}`}
                    className="group bg-white rounded-2xl overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow"
                  >
                    <div className="h-56 overflow-hidden">
                      <img
                        src={blog.image}
                        alt={blog.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-6">
                      <span className="inline-block px-3 py-1 bg-[var(--stitch-ink)]/10 text-[var(--stitch-ink)] rounded-full text-sm font-medium mb-3">
                        {BLOG_CATEGORIES.find(c => c.slug === blog.category)?.name}
                      </span>
                      <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-[var(--stitch-ink)] transition-colors">
                        {blog.title}
                      </h3>
                      <p className="text-gray-600 line-clamp-2 mb-4">{blog.excerpt}</p>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(blog.publishedAt).toLocaleDateString('en-IN', { 
                              day: 'numeric', 
                              month: 'short', 
                              year: 'numeric' 
                            })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {blog.readTime}
                          </span>
                        </div>
                        <ArrowRight className="w-5 h-5 text-[var(--stitch-ink)] group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* All Posts */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {selectedCategory 
                ? BLOG_CATEGORIES.find(c => c.slug === selectedCategory)?.name 
                : searchQuery 
                  ? `Search Results for "${searchQuery}"` 
                  : 'All Articles'}
              <span className="text-gray-400 font-normal ml-2">({filteredBlogs.length})</span>
            </h2>

            {filteredBlogs.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBlogs.map(blog => (
                  <article 
                    key={blog.id}
                    className="bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow group"
                  >
                    <Link to={`/blogs/${blog.slug}`}>
                      <div className="h-48 overflow-hidden">
                        <img
                          src={blog.image}
                          alt={blog.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      </div>
                    </Link>
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                          {BLOG_CATEGORIES.find(c => c.slug === blog.category)?.name}
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">{blog.readTime}</span>
                      </div>
                      <Link to={`/blogs/${blog.slug}`}>
                        <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-[var(--stitch-ink)] transition-colors">
                          {blog.title}
                        </h3>
                      </Link>
                      <p className="text-gray-600 text-sm line-clamp-2 mb-4">{blog.excerpt}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {new Date(blog.publishedAt).toLocaleDateString('en-IN', { 
                            day: 'numeric', 
                            month: 'short', 
                            year: 'numeric' 
                          })}
                        </span>
                        <Link 
                          to={`/blogs/${blog.slug}`}
                          className="text-[var(--stitch-ink)] text-sm font-medium flex items-center gap-1 hover:underline"
                        >
                          Read More <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No articles found</h3>
                <p className="text-gray-600 mb-6">Try adjusting your search or filter</p>
                <button
                  onClick={() => { setSelectedCategory(null); setSearchQuery(''); }}
                  className="px-6 py-3 bg-[var(--stitch-ink)] text-white rounded-lg font-medium hover:bg-[var(--stitch-ink)]"
                >
                  View All Articles
                </button>
              </div>
            )}
          </section>

          {/* Newsletter CTA */}
          <section className="mt-16 bg-gradient-to-r from-[var(--stitch-ink)] to-[var(--stitch-ink)] rounded-2xl p-8 md:p-12 text-white">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                Stay Updated with Real Estate Insights
              </h2>
              <p className="text-white/80 mb-6">
                Get the latest property tips, market trends, and expert advice delivered to your inbox.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none"
                />
                <button className="px-6 py-3 bg-white text-[var(--stitch-ink)] rounded-lg font-bold hover:bg-gray-100 transition-colors">
                  Subscribe
                </button>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} ApnaGhr. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </>
  );
};

export default BlogListPage;
