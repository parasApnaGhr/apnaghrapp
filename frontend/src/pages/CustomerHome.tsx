// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, Calendar, Home, LogOut, MapPin, Megaphone, Mic, Search, ShoppingCart, Sparkles, Truck, User } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { advertisingAPI, authAPI, propertyAPI, visitAPI } from "../utils/api";
import AIChatbot from "../components/AIChatbot";
import TermsAcceptanceModal from "../components/TermsAcceptanceModal";
import VoiceSearch from "../components/VoiceSearch";
import {
  StitchBottomDock,
  StitchButton,
  StitchCard,
  StitchInput,
  StitchKpi,
  StitchLoadingPage,
  StitchSectionHeader,
  StitchShell,
} from "../stitch/components/StitchPrimitives";
import { formatCurrency, getGreeting, normalizeProperty } from "../stitch/utils";

const navItems = [
  { label: "Home", to: "/customer", icon: Home },
  { label: "Visits", to: "/customer/bookings", icon: Calendar },
  { label: "Cart", to: "/customer/cart", icon: ShoppingCart },
  { label: "Ads", to: "/customer/advertise", icon: Megaphone },
  { label: "Profile", to: "/customer/profile", icon: User },
];

export default function CustomerHome() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [ads, setAds] = useState([]);
  const [filters, setFilters] = useState({
    city: "",
    min_rent: "",
    max_rent: "",
    bhk: "",
  });
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  const greeting = useMemo(() => getGreeting(), []);

  const syncCartCount = () => {
    const cart = JSON.parse(localStorage.getItem("visitCart") || "[]");
    setCartCount(cart.length);
  };

  const loadData = async (customFilters = filters) => {
    setLoading(true);
    try {
      const cleanFilters = Object.fromEntries(
        Object.entries(customFilters).filter(([, value]) => value !== "" && value != null)
      );

      const [propertyResponse, bookingsResponse, adsResponse] = await Promise.allSettled([
        propertyAPI.getProperties(cleanFilters),
        visitAPI.getMyBookings(),
        advertisingAPI.getActiveAds("home"),
      ]);

      if (propertyResponse.status === "fulfilled") {
        const list = Array.isArray(propertyResponse.value.data) ? propertyResponse.value.data : [];
        setProperties(list.map(normalizeProperty));
      }

      if (bookingsResponse.status === "fulfilled") {
        const allBookings = Array.isArray(bookingsResponse.value.data) ? bookingsResponse.value.data : [];
        setBookings(allBookings.filter((booking) => !["completed", "cancelled"].includes(booking.status)).slice(0, 3));
      }

      if (adsResponse.status === "fulfilled") {
        setAds(Array.isArray(adsResponse.value.data) ? adsResponse.value.data : []);
      }
    } catch {
      toast.error("Failed to load customer dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    syncCartCount();
  }, []);

  useEffect(() => {
    const checkTerms = async () => {
      if (!user?.terms_accepted) {
        try {
          const response = await authAPI.getTermsStatus();
          if (!response.data?.terms_accepted) setShowTermsModal(true);
        } catch {
          setShowTermsModal(true);
        }
      }
    };

    if (user) checkTerms();
  }, [user]);

  if (loading) {
    return <StitchLoadingPage label="Loading discovery feed, active visits, and partner placements." />;
  }

  return (
    <>
      <StitchShell
        title="Discovery"
        eyebrow={greeting}
        actions={
          <>
            <Link to="/customer/notifications" className="stitch-button stitch-button-secondary">
              <Bell className="h-4 w-4" />
              Notifications
            </Link>
            <button onClick={logout} className="stitch-button stitch-button-ghost">
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </>
        }
      >
        <div className="grid gap-6">
          <section className="flex flex-col gap-10 pt-4 md:pt-12">
            <h1 className="font-headline text-[3.5rem] font-black uppercase leading-[1] tracking-[-0.04em] text-[var(--stitch-ink)] md:text-[5rem]">
              Find your <br />
              space. fast.
            </h1>
            
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-grow">
                <Search className="absolute left-6 top-1/2 h-6 w-6 -translate-y-1/2 text-[var(--stitch-muted)]" />
                <input
                  type="text"
                  value={filters.city}
                  onChange={(event) => setFilters((current) => ({ ...current, city: event.target.value }))}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") loadData();
                  }}
                  placeholder="Enter locality, landmark or project"
                  className="w-full border-0 border-b-2 border-transparent bg-white px-16 py-6 text-lg font-bold text-[var(--stitch-ink)] transition-colors placeholder:text-[var(--stitch-muted)] focus:border-black focus:ring-0"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <VoiceSearch
                    onSearch={(voiceFilters) => {
                      const nextFilters = {
                        ...filters,
                        city: voiceFilters.city || filters.city,
                        min_rent: voiceFilters.min_rent || filters.min_rent,
                        max_rent: voiceFilters.max_rent || filters.max_rent,
                        bhk: voiceFilters.bhk || filters.bhk,
                      };
                      setFilters(nextFilters);
                      loadData(nextFilters);
                    }}
                  />
                </div>
              </div>
              <button 
                onClick={() => loadData()}
                className="flex items-center justify-center gap-2 bg-black px-12 py-6 text-xs font-black uppercase tracking-widest text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Search
                <Sparkles className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex flex-col gap-2">
                <label className="stitch-eyebrow ml-1">Min Rent</label>
                <StitchInput
                  type="number"
                  value={filters.min_rent}
                  onChange={(event) => setFilters((current) => ({ ...current, min_rent: event.target.value }))}
                  placeholder="₹ Min"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="stitch-eyebrow ml-1">Max Rent</label>
                <StitchInput
                  type="number"
                  value={filters.max_rent}
                  onChange={(event) => setFilters((current) => ({ ...current, max_rent: event.target.value }))}
                  placeholder="₹ Max"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="stitch-eyebrow ml-1">Configuration</label>
                <StitchInput
                  value={filters.bhk}
                  onChange={(event) => setFilters((current) => ({ ...current, bhk: event.target.value }))}
                  placeholder="BHK"
                />
              </div>
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-8">
              {bookings[0] ? (
                <section className="w-full">
                  <div className="flex flex-col gap-6 border-l-4 border-black bg-white p-6 md:p-8">
                    <div className="flex items-center justify-between border-b border-[var(--stitch-line)] pb-4">
                      <h3 className="stitch-eyebrow">Current Visit</h3>
                      <span className="bg-black px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">
                        {bookings[0].status.replaceAll("_", " ")}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-6 pt-2">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--stitch-soft)]">
                        <User className="h-8 w-8 text-black" />
                      </div>
                      <div className="flex-grow">
                        <h4 className="text-xl font-black uppercase tracking-[-0.02em]">
                          {bookings[0].rider_id ? "Rider is assigned" : "Finding your rider"}
                        </h4>
                        <p className="mt-1 text-sm text-[var(--stitch-muted)]">
                          {bookings[0].pickup_location || "Coordinating logistics..."}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-black tracking-[-0.05em]">12<span className="text-lg">min</span></p>
                        <p className="stitch-eyebrow">ETA</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <StitchButton variant="secondary" onClick={() => navigate("/customer/bookings")} className="flex-1">
                        View Tracker
                      </StitchButton>
                      <StitchButton onClick={() => navigate("/customer/bookings")} className="flex-1">
                        Open Bookings
                      </StitchButton>
                    </div>
                  </div>
                </section>
              ) : (
                <StitchCard className="flex flex-col items-center justify-center p-12 text-center">
                  <Calendar className="h-10 w-10 text-[var(--stitch-muted)]" />
                  <p className="mt-4 text-sm font-black uppercase tracking-widest text-[var(--stitch-muted)]">No active visits</p>
                  <StitchButton variant="ghost" onClick={() => navigate("/customer/bookings")} className="mt-2">
                    View History
                  </StitchButton>
                </StitchCard>
              )}
            </div>
            
            <div className="grid gap-4 sm:grid-cols-3 lg:col-span-4 lg:grid-cols-1">
              <StitchKpi label="Listings" value={String(properties.length)} icon={Home} />
              <StitchKpi label="Cart" value={String(cartCount)} icon={ShoppingCart} />
              <StitchKpi label="Active" value={String(bookings.length)} icon={Truck} />
            </div>
          </div>
        </div>

        {ads.length > 0 ? (
          <section className="flex flex-col gap-8">
            <StitchSectionHeader
              eyebrow="Featured"
              title="Partners"
            />
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {ads.slice(0, 4).map((ad, index) => (
                <button
                  key={ad.id || index}
                  onClick={() => ad.redirect_url && window.open(ad.redirect_url, "_blank")}
                  className="group overflow-hidden rounded-[2px] bg-white text-left transition hover:shadow-2xl"
                >
                  <div className="h-48 overflow-hidden bg-[var(--stitch-soft)]">
                    <img
                      src={ad.image_url || ad.banner_image || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=80"}
                      alt={ad.company_name || ad.business_name || "Partner banner"}
                      className="h-full w-full object-cover grayscale transition duration-700 group-hover:scale-105 group-hover:grayscale-0"
                    />
                  </div>
                  <div className="p-6">
                    <p className="stitch-eyebrow">Sponsored</p>
                    <p className="mt-2 text-lg font-black uppercase tracking-[-0.03em]">
                      {ad.company_name || ad.business_name || "ApnaGhr partner"}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        <section className="flex flex-col gap-8">
          <div className="flex items-end justify-between">
            <StitchSectionHeader
              eyebrow="Inventory"
              title="Discover"
            />
            <div className="flex gap-2">
              <button className="flex h-10 w-10 items-center justify-center border border-black bg-black text-white">
                <Home className="h-4 w-4" />
              </button>
              <button className="flex h-10 w-10 items-center justify-center border border-[var(--stitch-line)] bg-white text-[var(--stitch-muted)]">
                <MapPin className="h-4 w-4" />
              </button>
            </div>
          </div>

          {properties.length === 0 ? (
            <div className="border border-dashed border-[var(--stitch-line-strong)] p-20 text-center">
              <Home className="mx-auto h-12 w-12 text-[var(--stitch-muted)]" />
              <p className="mt-4 text-sm font-black uppercase tracking-widest text-[var(--stitch-muted)]">No properties found</p>
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
              {properties.map((property) => (
                <article
                  key={property.id}
                  className="group cursor-pointer bg-white"
                  onClick={() => navigate(`/customer/property/${property.id}`)}
                >
                  <div className="relative h-72 overflow-hidden bg-[var(--stitch-soft)]">
                    <img 
                      src={property.image} 
                      alt={property.title} 
                      className="h-full w-full object-cover grayscale transition duration-700 group-hover:scale-105 group-hover:grayscale-0" 
                    />
                    <div className="absolute left-4 top-4 flex gap-2">
                      {property.hot ? <span className="bg-black px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">Featured</span> : null}
                    </div>
                    <div className="absolute bottom-4 right-4 bg-white/90 px-4 py-2 text-xl font-black tracking-tighter backdrop-blur-sm">
                      ₹{formatCurrency(property.rent)}<span className="ml-1 text-xs font-normal text-[var(--stitch-muted)]">/mo</span>
                    </div>
                  </div>
                  <div className="space-y-4 p-6">
                    <div>
                      <h3 className="text-xl font-black uppercase tracking-[-0.04em]">{property.title}</h3>
                      <p className="mt-1 text-sm text-[var(--stitch-muted)]">{property.location}</p>
                    </div>
                    <div className="flex gap-4 border-t border-[var(--stitch-line)] pt-4 text-xs font-bold uppercase tracking-widest text-[var(--stitch-muted)]">
                      <span className="flex items-center gap-1">
                        <Home className="h-3 w-3" />
                        {property.bhk ? `${property.bhk} BHK` : property.propertyType}
                      </span>
                      <span className="flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        {property.furnishing}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
          
          <div className="flex justify-center pt-8">
            <button className="rounded-full border-2 border-black px-12 py-4 text-xs font-black uppercase tracking-widest transition-colors hover:bg-black hover:text-white">
              Load More
            </button>
          </div>
        </section>

        <div className="grid gap-4 xl:grid-cols-2">
          <StitchCard className="p-6">
            <p className="stitch-eyebrow">Packers</p>
            <p className="mt-3 text-3xl font-black tracking-[-0.06em]">Live</p>
            <div className="mt-4">
              <Link to="/customer/packers" className="stitch-button stitch-button-secondary">
                <Truck className="h-4 w-4" />
                Open packers
              </Link>
            </div>
          </StitchCard>
          <StitchCard className="bg-black p-6 text-white">
            <p className="stitch-eyebrow !text-white/60">Trust signal</p>
            <p className="mt-3 text-3xl font-black uppercase tracking-[-0.06em]">Guided visits. verified inventory. smooth checkout.</p>
            <div className="mt-5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-white/60">Powered by ApnaGhr</div>
          </StitchCard>
        </div>
      </StitchShell>

      <StitchBottomDock items={navItems} />

      <AIChatbot />

      <TermsAcceptanceModal
        isOpen={showTermsModal}
        onAccept={async () => {
          try {
            await authAPI.acceptTerms({
              accepted_terms: true,
              accepted_privacy: true,
              accepted_anti_circumvention: true,
            });
            setShowTermsModal(false);
            toast.success("Terms accepted.");
          } catch {
            toast.error("Failed to save terms acceptance.");
          }
        }}
        onDecline={() => {
          setShowTermsModal(false);
          logout();
        }}
        userType="customer"
        context="dashboard"
      />
    </>
  );
}
