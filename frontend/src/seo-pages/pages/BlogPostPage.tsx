// @ts-nocheck
// Blog Post Page - Individual Blog Article with SEO
import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Calendar, Clock, ChevronRight, Home, ArrowLeft, User, Tag, Share2, Facebook, Twitter, Linkedin, Copy } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import SEOHead from '../components/SEOHead';
import SEOFAQSection from '../components/SEOFAQSection';
import { getBlogBySlug, getRelatedBlogs, BLOG_CATEGORIES } from '../data/blogData';
import { generateArticleSchema } from '../utils/seoUtils';

const BlogPostPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const blog = getBlogBySlug(slug);
  const relatedBlogs = getRelatedBlogs(slug, 3);

  // Copy URL to clipboard
  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // If blog not found, show 404-like page
  if (!blog) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center px-4">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Article Not Found</h1>
          <p className="text-gray-600 mb-6">The article you're looking for doesn't exist or has been moved.</p>
          <Link
            to="/blogs"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#04473C] text-white rounded-lg font-medium hover:bg-[#033530]"
          >
            <ArrowLeft className="w-5 h-5" />
            Browse All Articles
          </Link>
        </div>
      </div>
    );
  }

  const articleSchema = generateArticleSchema(blog);
  const category = BLOG_CATEGORIES.find(c => c.slug === blog.category);

  return (
    <>
      <SEOHead
        title={`${blog.title} | ApnaGhr Blog`}
        description={blog.excerpt}
        canonical={`/blogs/${blog.slug}`}
        image={blog.image}
        type="article"
        schema={articleSchema}
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
                <Link to="/blogs" className="text-[#04473C] font-medium">Blog</Link>
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
          <div className="max-w-4xl mx-auto px-4 py-3">
            <nav className="flex items-center gap-2 text-sm text-gray-600">
              <Link to="/" className="hover:text-[#04473C]">Home</Link>
              <ChevronRight className="w-4 h-4" />
              <Link to="/blogs" className="hover:text-[#04473C]">Blog</Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-gray-900 line-clamp-1">{blog.title}</span>
            </nav>
          </div>
        </div>

        <main className="max-w-4xl mx-auto px-4 py-8">
          {/* Article Header */}
          <article itemScope itemType="https://schema.org/Article">
            <header className="mb-8">
              {/* Category */}
              <Link
                to={`/blogs?category=${blog.category}`}
                className="inline-flex items-center gap-2 px-3 py-1 bg-[#04473C]/10 text-[#04473C] rounded-full text-sm font-medium mb-4 hover:bg-[#04473C]/20 transition-colors"
              >
                <Tag className="w-4 h-4" />
                {category?.name}
              </Link>

              {/* Title */}
              <h1 
                className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight"
                itemProp="headline"
              >
                {blog.title}
              </h1>

              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-4 text-gray-600 mb-6">
                <div className="flex items-center gap-2" itemProp="author" itemScope itemType="https://schema.org/Organization">
                  <div className="w-10 h-10 bg-[#04473C] rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <span className="font-medium text-gray-900" itemProp="name">{blog.author}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <time 
                    dateTime={blog.publishedAt}
                    itemProp="datePublished"
                  >
                    {new Date(blog.publishedAt).toLocaleDateString('en-IN', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </time>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{blog.readTime}</span>
                </div>
              </div>

              {/* Share Buttons */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">Share:</span>
                <button 
                  onClick={handleShare}
                  className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                  title="Copy link"
                >
                  <Copy className="w-4 h-4 text-gray-600" />
                </button>
                <a 
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 bg-[#1877F2] rounded-full flex items-center justify-center hover:opacity-90 transition-opacity"
                >
                  <Facebook className="w-4 h-4 text-white" />
                </a>
                <a 
                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(blog.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 bg-black rounded-full flex items-center justify-center hover:opacity-90 transition-opacity"
                >
                  <Twitter className="w-4 h-4 text-white" />
                </a>
                <a 
                  href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(window.location.href)}&title=${encodeURIComponent(blog.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 bg-[#0A66C2] rounded-full flex items-center justify-center hover:opacity-90 transition-opacity"
                >
                  <Linkedin className="w-4 h-4 text-white" />
                </a>
              </div>
            </header>

            {/* Featured Image */}
            <div className="mb-8 rounded-2xl overflow-hidden">
              <img
                src={blog.image}
                alt={blog.title}
                className="w-full h-64 md:h-96 object-cover"
                itemProp="image"
                loading="lazy"
              />
            </div>

            {/* Article Content */}
            <div 
              className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-[#04473C] prose-strong:text-gray-900 prose-ul:text-gray-700 prose-ol:text-gray-700 prose-li:text-gray-700"
              itemProp="articleBody"
            >
              <ReactMarkdown>{blog.content}</ReactMarkdown>
            </div>

            {/* Tags */}
            {blog.tags && blog.tags.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex items-center flex-wrap gap-2">
                  <span className="text-sm text-gray-500">Tags:</span>
                  {blog.tags.map((tag, index) => (
                    <span 
                      key={index}
                      className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </article>

          {/* FAQs */}
          {blog.faqs && blog.faqs.length > 0 && (
            <div className="mt-12">
              <SEOFAQSection faqs={blog.faqs} />
            </div>
          )}

          {/* CTA Banner */}
          <section className="mt-12 bg-gradient-to-r from-[#04473C] to-[#065f4e] rounded-2xl p-6 md:p-8 text-white">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="text-xl md:text-2xl font-bold mb-2">
                  Looking for Your Dream Property?
                </h2>
                <p className="text-white/80">
                  Book a guided visit and explore verified properties in your area.
                </p>
              </div>
              <Link
                to="/"
                className="px-6 py-3 bg-white text-[#04473C] rounded-xl font-bold hover:bg-gray-100 transition-colors whitespace-nowrap"
              >
                Book Property Visit
              </Link>
            </div>
          </section>

          {/* Related Articles */}
          {relatedBlogs.length > 0 && (
            <section className="mt-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Articles</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {relatedBlogs.map(relatedBlog => (
                  <Link
                    key={relatedBlog.id}
                    to={`/blogs/${relatedBlog.slug}`}
                    className="bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow group"
                  >
                    <div className="h-40 overflow-hidden">
                      <img
                        src={relatedBlog.image}
                        alt={relatedBlog.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-[#04473C] transition-colors">
                        {relatedBlog.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-2">{relatedBlog.readTime}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Back to Blog */}
          <div className="mt-12 text-center">
            <Link
              to="/blogs"
              className="inline-flex items-center gap-2 text-[#04473C] font-medium hover:underline"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to All Articles
            </Link>
          </div>
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

export default BlogPostPage;
