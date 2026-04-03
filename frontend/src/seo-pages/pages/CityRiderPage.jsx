// City-specific Rider Landing Page - /become-property-rider/{city}
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Home, Wallet, Clock, MapPin, Shield, Users, Star, 
  ChevronRight, Check, TrendingUp, Banknote, Building,
  Phone, IndianRupee
} from 'lucide-react';
import SEOHead from '../components/SEOHead';
import SEOFAQSection from '../components/SEOFAQSection';
import RiderLeadForm from '../components/RiderLeadForm';
import EarningsCalculator from '../components/EarningsCalculator';
import { 
  EARNING_STATS, 
  EARNING_TIERS, 
  HOW_IT_WORKS, 
  RIDER_TESTIMONIALS, 
  RIDER_FAQS,
  REQUIREMENTS,
  CITIES_FOR_RIDERS
} from '../data/riderEarningData';

const CityRiderPage = () => {
  const { city: citySlug } = useParams();
  
  // Find city data or use default
  const cityData = CITIES_FOR_RIDERS.find(c => c.slug === citySlug) || {
    slug: citySlug || 'mohali',
    name: citySlug ? citySlug.charAt(0).toUpperCase() + citySlug.slice(1).replace(/-/g, ' ') : 'Mohali',
    state: 'Punjab',
    activeRiders: 50,
    avgEarnings: '₹35,000',
  };

  // Get testimonials for this city or nearby
  const cityTestimonials = RIDER_TESTIMONIALS.filter(t => 
    t.city.toLowerCase() === cityData.name.toLowerCase()
  );
  const displayTestimonials = cityTestimonials.length > 0 
    ? cityTestimonials 
    : RIDER_TESTIMONIALS.slice(0, 3);

  // City-specific FAQs
  const cityFaqs = [
    {
      question: `How much can I earn as a Property Rider in ${cityData.name}?`,
      answer: `Property Riders in ${cityData.name} earn an average of ${cityData.avgEarnings} per month. Active riders completing 8-10 visits daily can earn ₹1,500-2,000 per day. Top performers earn up to ₹75,000 monthly.`,
    },
    {
      question: `What areas in ${cityData.name} have the most property visits?`,
      answer: `${cityData.name} has high demand across all major sectors and localities. Areas near IT parks, educational institutions, and new residential developments typically have more visit requests.`,
    },
    ...RIDER_FAQS.slice(2, 8),
  ];

  const schema = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    "title": `Property Visit Rider Jobs in ${cityData.name}`,
    "description": `Join ApnaGhr as a Property Rider in ${cityData.name}. Earn ${cityData.avgEarnings} monthly. Flexible hours, instant payments, free training.`,
    "employmentType": "CONTRACTOR",
    "hiringOrganization": {
      "@type": "Organization",
      "name": "ApnaGhr",
      "sameAs": "https://apnaghrapp.in"
    },
    "jobLocation": {
      "@type": "Place",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": cityData.name,
        "addressRegion": cityData.state,
        "addressCountry": "IN"
      }
    }
  };

  return (
    <>
      <SEOHead
        title={`Become Property Rider in ${cityData.name} | Earn ${cityData.avgEarnings}/Month | ApnaGhr`}
        description={`Property Rider jobs in ${cityData.name}. Earn ${cityData.avgEarnings}+ monthly. Join ${cityData.activeRiders}+ riders. Flexible hours, instant payments. No experience needed. Apply FREE!`}
        canonical={`/become-property-rider/${cityData.slug}`}
        schema={schema}
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
              
              <a
                href="#apply"
                className="px-6 py-2 bg-[#04473C] text-white rounded-lg font-medium hover:bg-[#033530]"
              >
                Apply Now
              </a>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-[#04473C] via-[#065f4e] to-[#087f5b] text-white overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920')] opacity-10 bg-cover bg-center" />
          
          <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full text-sm mb-6">
                  <MapPin className="w-4 h-4" />
                  <span>{cityData.name}, {cityData.state}</span>
                </div>
                
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                  Become a Property<br />
                  <span className="text-yellow-400">Rider in {cityData.name}</span>
                </h1>
                
                <p className="text-xl text-white/80 mb-8 max-w-lg">
                  Join {cityData.activeRiders}+ riders in {cityData.name} earning {cityData.avgEarnings}+ monthly. 
                  Flexible hours, instant payments, no experience needed.
                </p>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-white/10 rounded-xl p-4">
                    <div className="text-3xl font-bold text-yellow-400">{cityData.activeRiders}+</div>
                    <div className="text-white/70 text-sm">Active Riders</div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4">
                    <div className="text-3xl font-bold text-yellow-400">{cityData.avgEarnings}</div>
                    <div className="text-white/70 text-sm">Avg. Monthly</div>
                  </div>
                </div>

                <a
                  href="#apply"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-yellow-400 text-gray-900 rounded-xl font-bold text-lg hover:bg-yellow-300 transition-colors"
                >
                  Join Now in {cityData.name}
                  <ChevronRight className="w-5 h-5" />
                </a>
              </div>

              <div className="hidden lg:block">
                <EarningsCalculator />
              </div>
            </div>
          </div>
        </section>

        {/* Local Stats */}
        <section className="bg-white border-b border-gray-200 py-8">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-[#04473C]">{cityData.activeRiders}+</div>
                <div className="text-gray-600">Riders in {cityData.name}</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-[#04473C]">{cityData.avgEarnings}</div>
                <div className="text-gray-600">Avg. Monthly Earnings</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-[#04473C]">500+</div>
                <div className="text-gray-600">Properties in {cityData.name}</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-[#04473C]">24 hrs</div>
                <div className="text-gray-600">Verification Time</div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                How to Become a Rider in {cityData.name}
              </h2>
            </div>

            <div className="grid md:grid-cols-4 gap-6">
              {HOW_IT_WORKS.map((step) => (
                <div key={step.step} className="bg-white rounded-2xl p-6 border border-gray-200 text-center">
                  <div className="w-12 h-12 bg-[#04473C] text-white rounded-full flex items-center justify-center font-bold text-xl mx-auto mb-4">
                    {step.step}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-600 text-sm">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Requirements */}
        <section className="py-16 md:py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Requirements to Join
              </h2>
              <p className="text-gray-600">
                Simple requirements, quick verification
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {REQUIREMENTS.map((req, index) => (
                <div 
                  key={index}
                  className={`flex items-center gap-3 p-4 rounded-xl ${
                    req.required ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    req.required ? 'bg-green-500 text-white' : 'bg-gray-300 text-white'
                  }`}>
                    <Check className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">{req.item}</span>
                    {req.note && <span className="text-sm text-gray-500 block">{req.note}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Earning Tiers */}
        <section className="py-16 md:py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Earning Potential in {cityData.name}
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {EARNING_TIERS.map((tier) => (
                <div 
                  key={tier.tier}
                  className={`rounded-2xl p-6 border-2 ${
                    tier.tier === 'Pro' 
                      ? 'border-yellow-400 bg-yellow-50' 
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{tier.tier}</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Visits/Day</span>
                      <span className="font-bold">{tier.visitsPerDay}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Daily</span>
                      <span className="font-bold text-[#04473C]">{tier.dailyEarnings}</span>
                    </div>
                    <div className="flex justify-between pt-3 border-t">
                      <span className="text-gray-600">Monthly</span>
                      <span className="font-bold text-xl text-[#04473C]">{tier.monthlyEarnings}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16 md:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Riders from {cityData.name} Region
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {displayTestimonials.map((testimonial) => (
                <div key={testimonial.id} className="bg-gray-50 rounded-2xl p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <img
                      src={testimonial.photo}
                      alt={testimonial.name}
                      className="w-14 h-14 rounded-full object-cover"
                    />
                    <div>
                      <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                      <p className="text-sm text-gray-600">{testimonial.city}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 italic mb-4">"{testimonial.quote}"</p>
                  <div className="flex items-center gap-2 text-[#04473C] font-bold">
                    <Wallet className="w-5 h-5" />
                    {testimonial.earnings}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Other Cities */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">
                Also Hiring in Other Cities
              </h2>
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              {CITIES_FOR_RIDERS.filter(c => c.slug !== cityData.slug).slice(0, 8).map((city) => (
                <Link
                  key={city.slug}
                  to={`/become-property-rider/${city.slug}`}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-full hover:border-[#04473C] hover:bg-[#04473C]/5 transition-colors"
                >
                  {city.name}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 md:py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                FAQs for {cityData.name} Riders
              </h2>
            </div>
            <SEOFAQSection faqs={cityFaqs} title="" />
          </div>
        </section>

        {/* Apply Form */}
        <section id="apply" className="py-16 md:py-24 bg-gradient-to-br from-gray-900 to-gray-800">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="text-white">
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  Start Earning in {cityData.name}
                </h2>
                <p className="text-xl text-white/80 mb-8">
                  Join {cityData.activeRiders}+ riders already earning {cityData.avgEarnings}+ monthly in {cityData.name}.
                </p>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Check className="w-6 h-6 text-green-400" />
                    <span>Local property visits in {cityData.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-6 h-6 text-green-400" />
                    <span>Get verified in 24 hours</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-6 h-6 text-green-400" />
                    <span>Earn {cityData.avgEarnings}+ monthly</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-6 h-6 text-green-400" />
                    <span>Instant payments to bank</span>
                  </div>
                </div>
              </div>

              <div>
                <RiderLeadForm source={`city_page_${cityData.slug}`} city={cityData.name} />
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <Link to="/" className="flex items-center justify-center gap-2 mb-4">
              <Home className="w-6 h-6" />
              <span className="font-bold text-xl">ApnaGhr</span>
            </Link>
            <p className="text-gray-400 mb-4">Premium Property Visits</p>
            <p className="text-gray-500 text-sm">
              &copy; {new Date().getFullYear()} ApnaGhr. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
};

export default CityRiderPage;
