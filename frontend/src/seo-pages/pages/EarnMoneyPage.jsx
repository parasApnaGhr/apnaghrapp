// Earn Money Landing Page - /earn-money-by-visiting-properties
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Home, Wallet, Clock, MapPin, Shield, Users, Star, 
  ChevronRight, Check, TrendingUp, Banknote, Phone,
  UserPlus, Bell, CheckCircle
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
  BENEFITS,
  CITIES_FOR_RIDERS
} from '../data/riderEarningData';

const EarnMoneyPage = () => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    "title": "Property Visit Rider - Earn Money by Visiting Properties",
    "description": "Join ApnaGhr as a Property Rider. Earn ₹1,500-2,500 daily by accompanying customers on property visits. Flexible hours, instant payments.",
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
        "addressRegion": "Punjab",
        "addressCountry": "IN"
      }
    },
    "baseSalary": {
      "@type": "MonetaryAmount",
      "currency": "INR",
      "value": {
        "@type": "QuantitativeValue",
        "minValue": 25000,
        "maxValue": 75000,
        "unitText": "MONTH"
      }
    }
  };

  return (
    <>
      <SEOHead
        title="Earn Money by Visiting Properties | Property Rider Jobs | ApnaGhr"
        description="Earn ₹1,500-2,500 daily as a Property Rider. Flexible hours, instant payments. Join 500+ riders earning ₹35,000-75,000 monthly. No experience needed. Apply FREE!"
        canonical="/earn-money-by-visiting-properties"
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
              
              <Link
                to="/join-as-rider"
                className="px-6 py-2 bg-[#04473C] text-white rounded-lg font-medium hover:bg-[#033530]"
              >
                Apply Now
              </Link>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-[#04473C] via-[#065f4e] to-[#087f5b] text-white overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1920')] opacity-10 bg-cover bg-center" />
          
          <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full text-sm mb-6">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span>Join {EARNING_STATS.totalRiders}+ Active Riders</span>
                </div>
                
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                  Earn Money by<br />
                  <span className="text-yellow-400">Visiting Properties</span>
                </h1>
                
                <p className="text-xl text-white/80 mb-8 max-w-lg">
                  Become a Property Rider and earn ₹{EARNING_STATS.averageEarningsPerDay.toLocaleString()}+ daily. 
                  Flexible hours, instant payments, no experience needed.
                </p>

                <div className="flex flex-wrap gap-4 mb-8">
                  <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
                    <Wallet className="w-5 h-5 text-yellow-400" />
                    <span>₹{EARNING_STATS.minEarningsPerDay}-{EARNING_STATS.maxEarningsPerDay}/day</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
                    <Clock className="w-5 h-5 text-yellow-400" />
                    <span>Flexible Hours</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
                    <MapPin className="w-5 h-5 text-yellow-400" />
                    <span>{EARNING_STATS.citiesActive} Cities</span>
                  </div>
                </div>

                <Link
                  to="/join-as-rider"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-yellow-400 text-gray-900 rounded-xl font-bold text-lg hover:bg-yellow-300 transition-colors"
                >
                  Start Earning Today
                  <ChevronRight className="w-5 h-5" />
                </Link>
              </div>

              <div className="hidden lg:block">
                <EarningsCalculator />
              </div>
            </div>
          </div>
        </section>

        {/* Stats Bar */}
        <section className="bg-white border-b border-gray-200 py-8">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-3xl md:text-4xl font-bold text-[#04473C]">{EARNING_STATS.totalRiders}+</div>
                <div className="text-gray-600">Active Riders</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold text-[#04473C]">₹{(EARNING_STATS.monthlyPotential/1000).toFixed(0)}K+</div>
                <div className="text-gray-600">Monthly Earnings</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold text-[#04473C]">{EARNING_STATS.citiesActive}</div>
                <div className="text-gray-600">Cities Active</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold text-[#04473C]">{EARNING_STATS.propertiesListed}+</div>
                <div className="text-gray-600">Properties Listed</div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                How It Works
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Start earning in 4 simple steps. No experience or investment required.
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-8">
              {HOW_IT_WORKS.map((step, index) => (
                <div key={step.step} className="relative">
                  {index < HOW_IT_WORKS.length - 1 && (
                    <div className="hidden md:block absolute top-12 left-full w-full h-0.5 bg-gray-200 -translate-x-1/2" />
                  )}
                  <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-xl transition-shadow relative">
                    <div className="w-12 h-12 bg-[#04473C] text-white rounded-xl flex items-center justify-center font-bold text-xl mb-4">
                      {step.step}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                    <p className="text-gray-600">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Earning Tiers */}
        <section className="py-16 md:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Earning Potential
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                The more visits you complete, the more you earn. No cap on earnings!
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {EARNING_TIERS.map((tier) => (
                <div 
                  key={tier.tier}
                  className={`rounded-2xl p-8 border-2 ${
                    tier.tier === 'Pro' 
                      ? 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-orange-50' 
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  {tier.tier === 'Pro' && (
                    <div className="inline-block px-3 py-1 bg-yellow-400 text-yellow-900 rounded-full text-sm font-bold mb-4">
                      MOST POPULAR
                    </div>
                  )}
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{tier.tier}</h3>
                  <p className="text-gray-600 mb-6">{tier.ideal}</p>
                  
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                      <span className="text-gray-600">Visits/Day</span>
                      <span className="font-bold text-gray-900">{tier.visitsPerDay}</span>
                    </div>
                    <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                      <span className="text-gray-600">Daily Earnings</span>
                      <span className="font-bold text-[#04473C]">{tier.dailyEarnings}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Monthly</span>
                      <span className="font-bold text-2xl text-[#04473C]">{tier.monthlyEarnings}</span>
                    </div>
                  </div>

                  <Link
                    to="/join-as-rider"
                    className={`block w-full py-3 rounded-xl font-bold text-center ${
                      tier.tier === 'Pro'
                        ? 'bg-[#04473C] text-white hover:bg-[#033530]'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    Join Now
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-16 md:py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Why Become a Property Rider?
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {BENEFITS.map((benefit) => (
                <div key={benefit.title} className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 bg-[#04473C]/10 rounded-xl flex items-center justify-center mb-4">
                    <Banknote className="w-6 h-6 text-[#04473C]" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">{benefit.title}</h3>
                  <p className="text-gray-600 text-sm">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16 md:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Hear from Our Riders
              </h2>
              <p className="text-xl text-gray-600">
                Real stories from real riders earning with ApnaGhr
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {RIDER_TESTIMONIALS.slice(0, 3).map((testimonial) => (
                <div key={testimonial.id} className="bg-gray-50 rounded-2xl p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <img
                      src={testimonial.photo}
                      alt={testimonial.name}
                      className="w-14 h-14 rounded-full object-cover"
                    />
                    <div>
                      <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                      <p className="text-sm text-gray-600">{testimonial.city} • {testimonial.duration}</p>
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

        {/* Cities */}
        <section className="py-16 md:py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Active in {EARNING_STATS.citiesActive} Cities
              </h2>
              <p className="text-xl text-gray-600">
                Find opportunities near you
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {CITIES_FOR_RIDERS.slice(0, 6).map((city) => (
                <Link
                  key={city.slug}
                  to={`/become-property-rider/${city.slug}`}
                  className="bg-white rounded-xl p-4 border border-gray-200 hover:border-[#04473C] hover:shadow-lg transition-all text-center"
                >
                  <h3 className="font-bold text-gray-900">{city.name}</h3>
                  <p className="text-sm text-gray-500">{city.activeRiders} riders</p>
                  <p className="text-sm text-[#04473C] font-medium">{city.avgEarnings}/mo</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 md:py-24 bg-white">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Frequently Asked Questions
              </h2>
            </div>
            <SEOFAQSection faqs={RIDER_FAQS} title="" />
          </div>
        </section>

        {/* Apply Form */}
        <section id="apply" className="py-16 md:py-24 bg-gradient-to-br from-gray-900 to-gray-800">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="text-white">
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  Ready to Start Earning?
                </h2>
                <p className="text-xl text-white/80 mb-8">
                  Join {EARNING_STATS.totalRiders}+ riders who are already earning ₹{EARNING_STATS.monthlyPotential.toLocaleString()}+ monthly with ApnaGhr.
                </p>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Check className="w-6 h-6 text-green-400" />
                    <span>FREE to join - No deposit required</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-6 h-6 text-green-400" />
                    <span>Get verified in 24 hours</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-6 h-6 text-green-400" />
                    <span>Start earning from Day 1</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-6 h-6 text-green-400" />
                    <span>Instant payments to your bank</span>
                  </div>
                </div>
              </div>

              <div>
                <RiderLeadForm source="earn_money_page" />
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

export default EarnMoneyPage;
