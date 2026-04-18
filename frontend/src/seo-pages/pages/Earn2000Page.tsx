// @ts-nocheck
// Earn ₹2000 Per Day Landing Page - /earn-2000-per-day-real-estate
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Home, Wallet, Clock, MapPin, Shield, Users, Star, 
  ChevronRight, Check, TrendingUp, Banknote, Target,
  Zap, Award, Calculator, IndianRupee
} from 'lucide-react';
import SEOHead from '../components/SEOHead';
import SEOFAQSection from '../components/SEOFAQSection';
import RiderLeadForm from '../components/RiderLeadForm';
import EarningsCalculator from '../components/EarningsCalculator';
import { 
  EARNING_STATS, 
  RIDER_TESTIMONIALS, 
  RIDER_FAQS,
  CITIES_FOR_RIDERS,
  HOW_IT_WORKS
} from '../data/riderEarningData';

const Earn2000Page = () => {
  const dailyTarget = 2000;
  const visitsNeeded = Math.ceil(dailyTarget / 150);
  const monthlyEarning = dailyTarget * 26;

  const schema = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    "title": "Earn ₹2000 Per Day - Real Estate Property Visits",
    "description": "Earn ₹2000+ per day visiting properties with ApnaGhr. Complete 12-14 visits daily and earn ₹60,000+ monthly. Flexible hours, instant payments.",
    "employmentType": "CONTRACTOR",
    "hiringOrganization": {
      "@type": "Organization",
      "name": "ApnaGhr",
      "sameAs": "https://apnaghrapp.in"
    },
    "baseSalary": {
      "@type": "MonetaryAmount",
      "currency": "INR",
      "value": {
        "@type": "QuantitativeValue",
        "value": 2000,
        "unitText": "DAY"
      }
    }
  };

  const earningBreakdown = [
    { time: '9 AM - 11 AM', visits: 3, earnings: '₹450' },
    { time: '11 AM - 1 PM', visits: 3, earnings: '₹450' },
    { time: '2 PM - 4 PM', visits: 3, earnings: '₹450' },
    { time: '4 PM - 6 PM', visits: 3, earnings: '₹450' },
    { time: 'Bonus/Tips', visits: '-', earnings: '₹200+' },
  ];

  const proTips = [
    { 
      title: 'Choose High-Density Areas',
      description: 'Work in areas with more property listings to minimize travel time between visits.',
      icon: MapPin
    },
    { 
      title: 'Accept Batch Visits',
      description: 'When customers book 2-3 properties together, you earn more per trip.',
      icon: Target
    },
    { 
      title: 'Peak Hours Strategy',
      description: 'Focus on 10 AM - 7 PM when most visits are scheduled. Plan your day accordingly.',
      icon: Clock
    },
    { 
      title: 'Build Customer Relations',
      description: 'Good service leads to tips and repeat customers who request you specifically.',
      icon: Users
    },
    { 
      title: 'Complete Verification',
      description: 'Fully verified riders get priority in visit assignments.',
      icon: Shield
    },
    { 
      title: 'Stay Available',
      description: 'Keep the app active and notifications on to never miss a visit request.',
      icon: Zap
    },
  ];

  return (
    <>
      <SEOHead
        title="Earn ₹2000 Per Day in Real Estate | Property Visit Jobs | ApnaGhr"
        description="Earn ₹2000+ daily visiting properties. Complete 12-14 visits and earn ₹60,000+ monthly. Join 500+ riders. No experience needed. Instant payments!"
        canonical="/earn-2000-per-day-real-estate"
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
                Start Earning
              </a>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-yellow-500 via-orange-500 to-red-500 text-white overflow-hidden">
          <div className="absolute inset-0 bg-black/20" />
          
          <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full text-sm mb-6 backdrop-blur-sm">
                  <Award className="w-4 h-4" />
                  <span>Top Earner Category</span>
                </div>
                
                <h1 className="text-4xl md:text-5xl lg:text-7xl font-black mb-6 leading-tight">
                  Earn<br />
                  <span className="text-yellow-300">₹2,000+</span><br />
                  Per Day
                </h1>
                
                <p className="text-xl text-white/90 mb-8 max-w-lg">
                  In Real Estate Property Visits. No office. No boss. No fixed hours. 
                  Just you, your bike, and unlimited earning potential.
                </p>

                <div className="flex flex-wrap gap-4 mb-8">
                  <div className="bg-white/20 backdrop-blur-sm px-4 py-3 rounded-xl">
                    <div className="text-2xl font-bold">₹{monthlyEarning.toLocaleString()}</div>
                    <div className="text-sm text-white/80">Monthly Potential</div>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm px-4 py-3 rounded-xl">
                    <div className="text-2xl font-bold">{visitsNeeded}</div>
                    <div className="text-sm text-white/80">Visits/Day</div>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm px-4 py-3 rounded-xl">
                    <div className="text-2xl font-bold">₹150</div>
                    <div className="text-sm text-white/80">Per Visit</div>
                  </div>
                </div>

                <a
                  href="#apply"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white text-orange-600 rounded-xl font-bold text-lg hover:bg-gray-100 transition-colors"
                >
                  Join & Earn ₹2000/Day
                  <ChevronRight className="w-5 h-5" />
                </a>
              </div>

              <div className="hidden lg:block">
                {/* Daily Breakdown Card */}
                <div className="bg-white rounded-2xl p-6 text-gray-900 shadow-2xl">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Calculator className="w-6 h-6 text-orange-500" />
                    Daily Earning Breakdown
                  </h3>
                  
                  <div className="space-y-3">
                    {earningBreakdown.map((slot, index) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                        <div>
                          <span className="font-medium">{slot.time}</span>
                          {slot.visits !== '-' && (
                            <span className="text-gray-500 text-sm ml-2">({slot.visits} visits)</span>
                          )}
                        </div>
                        <span className="font-bold text-green-600">{slot.earnings}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t-2 border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold">Daily Total</span>
                      <span className="text-2xl font-black text-orange-600">₹2,000+</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* The Math Section */}
        <section className="py-16 md:py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                The Simple Math to ₹2000/Day
              </h2>
              <p className="text-xl text-gray-600">
                It's not magic, it's just numbers
              </p>
            </div>

            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-2xl p-8 border border-orange-200">
              <div className="grid md:grid-cols-3 gap-8 text-center">
                <div>
                  <div className="w-20 h-20 bg-orange-500 text-white rounded-2xl flex items-center justify-center text-3xl font-bold mx-auto mb-4">
                    ₹150
                  </div>
                  <div className="text-gray-900 font-bold text-lg">Per Visit Earning</div>
                  <div className="text-gray-600 text-sm">Average earning per property visit</div>
                </div>
                
                <div className="flex items-center justify-center">
                  <span className="text-4xl font-bold text-gray-400">×</span>
                </div>
                
                <div>
                  <div className="w-20 h-20 bg-green-500 text-white rounded-2xl flex items-center justify-center text-3xl font-bold mx-auto mb-4">
                    13
                  </div>
                  <div className="text-gray-900 font-bold text-lg">Visits Per Day</div>
                  <div className="text-gray-600 text-sm">Complete 13 visits to hit target</div>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-orange-200 text-center">
                <div className="text-5xl md:text-6xl font-black text-orange-600 mb-2">
                  = ₹1,950 - ₹2,000+
                </div>
                <div className="text-gray-600">Daily earnings (excluding tips & bonuses)</div>
              </div>
            </div>
          </div>
        </section>

        {/* How to Hit ₹2000 */}
        <section className="py-16 md:py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Pro Tips to Earn ₹2000+ Daily
              </h2>
              <p className="text-xl text-gray-600">
                Strategies used by our top earners
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {proTips.map((tip, index) => (
                <div key={index} className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                    <tip.icon className="w-6 h-6 text-orange-600" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{tip.title}</h3>
                  <p className="text-gray-600 text-sm">{tip.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Success Stories */}
        <section className="py-16 md:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Riders Who Hit ₹2000/Day
              </h2>
              <p className="text-xl text-gray-600">
                Real stories, real earnings
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {RIDER_TESTIMONIALS.filter(t => parseInt(t.earnings.replace(/[₹,]/g, '')) >= 40000).slice(0, 3).map((testimonial) => (
                <div key={testimonial.id} className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl p-6 border border-orange-200">
                  <div className="flex items-center gap-4 mb-4">
                    <img
                      src={testimonial.photo}
                      alt={testimonial.name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-orange-400"
                    />
                    <div>
                      <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                      <p className="text-sm text-gray-600">{testimonial.city} • {testimonial.duration}</p>
                      <div className="flex items-center gap-1 mt-1">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-700 italic mb-4">"{testimonial.quote}"</p>
                  <div className="bg-orange-500 text-white rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold">{testimonial.earnings}</div>
                    <div className="text-sm text-orange-100">Monthly Earnings</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Calculator Section */}
        <section className="py-16 md:py-20 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Calculate Your Earnings
              </h2>
            </div>
            <EarningsCalculator />
          </div>
        </section>

        {/* Cities */}
        <section className="py-16 md:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Earn ₹2000/Day in Your City
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {CITIES_FOR_RIDERS.slice(0, 6).map((city) => (
                <Link
                  key={city.slug}
                  to={`/become-property-rider/${city.slug}`}
                  className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:border-orange-400 hover:bg-orange-50 transition-all text-center"
                >
                  <h3 className="font-bold text-gray-900">{city.name}</h3>
                  <p className="text-sm text-orange-600 font-medium">{city.avgEarnings}/mo</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 md:py-20 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Frequently Asked Questions
              </h2>
            </div>
            <SEOFAQSection faqs={RIDER_FAQS.slice(0, 6)} title="" />
          </div>
        </section>

        {/* Apply Form */}
        <section id="apply" className="py-16 md:py-24 bg-gradient-to-br from-orange-600 to-red-600">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="text-white">
                <h2 className="text-3xl md:text-5xl font-black mb-6">
                  Ready to Earn<br />₹2000/Day?
                </h2>
                <p className="text-xl text-white/90 mb-8">
                  Join thousands of riders who are already hitting this target daily. Your bike + our platform = unlimited earning potential.
                </p>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      <Check className="w-5 h-5" />
                    </div>
                    <span className="text-lg">Complete 13 visits → Earn ₹2000</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      <Check className="w-5 h-5" />
                    </div>
                    <span className="text-lg">26 days/month → Earn ₹52,000+</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      <Check className="w-5 h-5" />
                    </div>
                    <span className="text-lg">Instant payments to your bank</span>
                  </div>
                </div>
              </div>

              <div>
                <RiderLeadForm source="earn_2000_page" />
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

export default Earn2000Page;
