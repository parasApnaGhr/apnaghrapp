// @ts-nocheck
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, MapPin, Shield, Star, Wallet, Building2, Map } from 'lucide-react';
import { StitchButton, StitchCard, StitchSectionHeader, pageTransition } from '../stitch/components/StitchPrimitives';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const { user } = useAuth();

  const getDashboardLink = () => {
    if (!user) return '/login';
    if (['customer', 'advertiser'].includes(user.role)) return '/customer';
    if (user.role === 'builder') return '/builder';
    if (user.role === 'rider') return '/rider';
    if (user.role === 'seller') return '/seller';
    return '/admin';
  };
  return (
    <div className="min-h-screen bg-[var(--stitch-bg)] text-[var(--stitch-ink)] selection:bg-[var(--stitch-ink)] selection:text-white">
      {/* Background patterns */}
      <div className="pointer-events-none fixed inset-0 opacity-70">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(0,0,0,0.06),_transparent_35%),radial-gradient(circle_at_bottom_left,_rgba(0,0,0,0.04),_transparent_30%)]" />
        <div className="absolute inset-0 [background-image:linear-gradient(rgba(15,15,15,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(15,15,15,0.04)_1px,transparent_1px)] [background-size:28px_28px]" />
      </div>

      <motion.div
        variants={pageTransition}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="relative z-10 mx-auto w-full max-w-[1440px] px-4 pb-24 pt-4 md:px-8"
      >
        {/* Header */}
        <header className="stitch-panel sticky top-4 z-40 flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="text-xl font-black tracking-[-0.12em] md:text-2xl">APNAGHR</span>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <Link to={getDashboardLink()}>
                <StitchButton>Go to Dashboard</StitchButton>
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-sm font-bold uppercase tracking-[0.16em] hover:opacity-70 transition hidden sm:block">
                  Sign In
                </Link>
                <Link to="/login?mode=register">
                  <StitchButton>Get Started</StitchButton>
                </Link>
              </>
            )}
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative mt-12 grid gap-12 lg:grid-cols-2 lg:items-center xl:mt-24">
          <div className="max-w-2xl space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--stitch-line)] bg-white/50 px-4 py-2 backdrop-blur-md">
              <span className="flex h-2 w-2 rounded-full bg-green-500" />
              <span className="text-xs font-bold uppercase tracking-[0.16em]">Live in 60+ Indian Cities</span>
            </div>
            
            <h1 className="font-headline text-5xl font-black uppercase leading-[0.9] tracking-[-0.04em] sm:text-6xl xl:text-8xl">
              Find your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-500">perfect home</span> <br />
              instantly.
            </h1>
            
            <p className="max-w-xl text-lg leading-relaxed text-[var(--stitch-muted)] sm:text-xl">
              Book verified property visits with zero broker fees. Professional riders guide you to properties with real-time tracking and completely transparent pricing.
            </p>
            
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link to="/login">
                <StitchButton className="w-full sm:w-auto px-8 py-5 text-lg">
                  Explore Properties <ArrowRight className="ml-2 h-5 w-5" />
                </StitchButton>
              </Link>
              <Link to="/login?redirect=/seller">
                <StitchButton variant="secondary" className="w-full sm:w-auto px-8 py-5 text-lg bg-white">
                  Start Earning
                </StitchButton>
              </Link>
            </div>

            <div className="flex items-center gap-6 pt-4">
              <div className="flex -space-x-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 w-12 rounded-full border-2 border-[var(--stitch-bg)] bg-[var(--stitch-soft)] overflow-hidden">
                    <img src={`https://images.unsplash.com/photo-${1500000000000 + i}?w=100&q=80`} alt="User" className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
              <div className="space-y-1">
                <div className="flex text-yellow-500">
                  {[1, 2, 3, 4, 5].map(i => <Star key={i} className="h-4 w-4 fill-current" />)}
                </div>
                <p className="text-sm font-medium">Trusted by 10,000+ users</p>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[40px] lg:aspect-[3/4]">
            <img 
              src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80" 
              alt="Premium Home" 
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            
            {/* Floating Card */}
            <div className="absolute bottom-8 left-8 right-8">
              <StitchCard className="backdrop-blur-xl bg-white/90 border-white/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
                      <Shield className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold uppercase tracking-[0.16em]">100% Verified</p>
                      <p className="text-sm text-[var(--stitch-muted)]">No fake listings or hidden charges</p>
                    </div>
                  </div>
                  <CheckCircle2 className="h-6 w-6 text-green-500 hidden sm:block" />
                </div>
              </StitchCard>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="mt-32 space-y-16">
          <StitchSectionHeader 
            eyebrow="The ApnaGhr Advantage" 
            title="Redefining Real Estate"
            copy="We've completely removed the friction from finding your next home. No more fake listings, unreliable brokers, or wasted weekends."
          />
          
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: MapPin,
                title: "Guided Property Visits",
                desc: "Book a slot and our professional field riders will pick you up and guide you through multiple properties in one trip. Track them live."
              },
              {
                icon: Shield,
                title: "Zero Broker Fees",
                desc: "We don't charge hefty commissions. Our transparent pricing model means you only pay for what you use, saving you thousands."
              },
              {
                icon: Building2,
                title: "Verified Inventory",
                desc: "Every single property on ApnaGhr is physically verified by our team. What you see in the photos is exactly what you get."
              }
            ].map((feature, i) => (
              <StitchCard key={i} className="flex flex-col gap-6 p-8 transition-transform hover:-translate-y-2">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--stitch-ink)] text-white">
                  <feature.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="mb-3 text-xl font-black uppercase tracking-[-0.04em]">{feature.title}</h3>
                  <p className="leading-relaxed text-[var(--stitch-muted)]">{feature.desc}</p>
                </div>
              </StitchCard>
            ))}
          </div>
        </section>

        {/* Earning Opportunities */}
        <section className="mt-32 rounded-[40px] bg-[var(--stitch-ink)] px-6 py-20 text-white md:px-16 lg:py-32">
          <div className="mx-auto max-w-4xl text-center space-y-6">
            <span className="inline-block rounded-full bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em]">
              Partner With Us
            </span>
            <h2 className="font-headline text-4xl font-black uppercase leading-[1.1] tracking-[-0.04em] sm:text-5xl md:text-6xl">
              Turn your time into <br className="hidden sm:block" />
              <span className="text-gray-400">unlimited earnings.</span>
            </h2>
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-2 max-w-5xl mx-auto">
            <div className="rounded-[32px] bg-white/5 p-8 backdrop-blur-md border border-white/10">
              <Wallet className="h-10 w-10 text-gray-300 mb-6" />
              <h3 className="text-2xl font-black uppercase tracking-[-0.04em] mb-2">Become a Rider</h3>
              <p className="text-gray-400 mb-8 leading-relaxed">
                Join our fleet of professional property guides. Set your own hours, show properties to clients, and earn ₹2,000+ per day with weekly payouts directly to your bank.
              </p>
              <Link to="/login?redirect=/rider">
                <StitchButton className="w-full bg-white text-black hover:bg-gray-200">
                  Apply as Rider
                </StitchButton>
              </Link>
            </div>

            <div className="rounded-[32px] bg-white/5 p-8 backdrop-blur-md border border-white/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Star className="h-32 w-32" />
              </div>
              <Map className="h-10 w-10 text-gray-300 mb-6 relative z-10" />
              <h3 className="text-2xl font-black uppercase tracking-[-0.04em] mb-2 relative z-10">Become a Seller</h3>
              <p className="text-gray-400 mb-8 leading-relaxed relative z-10">
                Are you a networking pro? Share property links, refer clients, and earn massive commissions ranging from ₹5,000 to ₹10,000 per successful deal closure.
              </p>
              <Link to="/login?redirect=/seller">
                <StitchButton className="w-full bg-transparent border border-white/20 text-white hover:bg-white/10 relative z-10">
                  Join Sales Team
                </StitchButton>
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-32 border-t border-[var(--stitch-line)] pt-12 pb-8">
          <div className="grid gap-12 md:grid-cols-4 lg:gap-8">
            <div className="md:col-span-2 space-y-4">
              <span className="text-2xl font-black tracking-[-0.12em]">APNAGHR</span>
              <p className="max-w-xs text-sm text-[var(--stitch-muted)]">
                The modern way to discover, visit, and rent properties across India. No hassle, no brokers, just your perfect home.
              </p>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-[0.16em]">Company</h4>
              <ul className="space-y-3 text-sm text-[var(--stitch-muted)]">
                <li><Link to="/legal" className="hover:text-[var(--stitch-ink)]">About Us</Link></li>
                <li><Link to="/customer/advertise" className="hover:text-[var(--stitch-ink)]">Advertise</Link></li>
                <li><Link to="/legal" className="hover:text-[var(--stitch-ink)]">Careers</Link></li>
                <li><Link to="/legal" className="hover:text-[var(--stitch-ink)]">Contact Support</Link></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-[0.16em]">Legal</h4>
              <ul className="space-y-3 text-sm text-[var(--stitch-muted)]">
                <li><Link to="/legal" className="hover:text-[var(--stitch-ink)]">Privacy Policy</Link></li>
                <li><Link to="/legal" className="hover:text-[var(--stitch-ink)]">Terms of Service</Link></li>
                <li><Link to="/legal" className="hover:text-[var(--stitch-ink)]">Rider Agreement</Link></li>
                <li><Link to="/legal" className="hover:text-[var(--stitch-ink)]">Anti-Circumvention</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-20 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[var(--stitch-muted)]">
            <p>© 2026 ApnaGhr Technologies. All rights reserved.</p>
            <p>Made with precision in Punjab, India.</p>
          </div>
        </footer>
      </motion.div>
    </div>
  );
}
