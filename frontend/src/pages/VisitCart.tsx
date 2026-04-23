// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Check, Clock, MapPin, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { authAPI, paymentAPI } from "../utils/api";
import { initiateCashfreePayment } from "../utils/cashfree";
import TermsAcceptanceModal from "../components/TermsAcceptanceModal";
import {
  StitchButton,
  StitchCard,
  StitchInput,
  StitchLoadingPage,
  StitchSectionHeader,
  StitchShell,
} from "../stitch/components/StitchPrimitives";
import { formatCurrency, normalizeProperty } from "../stitch/utils";

const packages = [
  { id: "single_visit", visits: 1, price: 200, validity: "3 days" },
  { id: "three_visits", visits: 3, price: 350, validity: "7 days" },
  { id: "five_visits", visits: 5, price: 500, validity: "10 days" },
];

export default function VisitCart() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cart, setCart] = useState<any[]>(() => JSON.parse(localStorage.getItem("visitCart") || "[]"));
  const [bookingData, setBookingData] = useState({
    scheduled_date: "",
    scheduled_time: "",
    pickup_location: "",
    pickup_lat: null,
    pickup_lng: null,
  });
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [checkingTerms, setCheckingTerms] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  const normalizedCart = useMemo(() => cart.map(normalizeProperty), [cart]);
  const selectedPkg = packages.find((item) => item.id === selectedPackage);

  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setBookingData((current) => ({
      ...current,
      scheduled_date: tomorrow.toISOString().split("T")[0],
    }));
  }, []);

  useEffect(() => {
    if (cart.length === 1) setSelectedPackage("single_visit");
    else if (cart.length > 1 && cart.length <= 3) setSelectedPackage("three_visits");
    else if (cart.length > 3) setSelectedPackage("five_visits");
  }, [cart.length]);

  useEffect(() => {
    const checkTerms = async () => {
      try {
        if (user?.terms_accepted) {
          setTermsAccepted(true);
          return;
        }
        const response = await authAPI.getTermsStatus();
        setTermsAccepted(Boolean(response.data?.terms_accepted));
      } catch {
        setTermsAccepted(false);
      } finally {
        setCheckingTerms(false);
      }
    };

    if (user) checkTerms();
    else setCheckingTerms(false);
  }, [user]);

  const persistCart = (nextCart: any[]) => {
    setCart(nextCart);
    localStorage.setItem("visitCart", JSON.stringify(nextCart));
  };

  const removeFromCart = (propertyId: string) => {
    persistCart(cart.filter((item) => item.id !== propertyId));
    toast.success("Removed from cart.");
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported in this browser.");
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setBookingData((current) => ({
          ...current,
          pickup_location: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
          pickup_lat: latitude,
          pickup_lng: longitude,
        }));
        setGettingLocation(false);
        toast.success("Current location captured.");
      },
      () => {
        setGettingLocation(false);
        toast.error("Failed to capture current location.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleCheckout = async () => {
    if (!cart.length) {
      toast.error("Cart is empty.");
      return;
    }
    if (!selectedPackage) {
      toast.error("Select a package first.");
      return;
    }
    if (!bookingData.scheduled_date || !bookingData.scheduled_time || !bookingData.pickup_location) {
      toast.error("Fill schedule and pickup details before continuing.");
      return;
    }
    if (!termsAccepted) {
      setShowTermsModal(true);
      return;
    }

    localStorage.setItem(
      "pendingVisitBooking",
      JSON.stringify({
        property_ids: cart.map((item) => item.id),
        ...bookingData,
      })
    );

    setLoading(true);
    try {
      const originUrl = window.location.origin;
      const response = await paymentAPI.createCheckout(selectedPackage, originUrl, null);
      const returnUrl = `${originUrl}/payment-success?order_id=${response.data.order_id}`;
      if (response.data.payment_session_id) {
        await initiateCashfreePayment(response.data.payment_session_id, returnUrl);
      } else if (response.data.checkout_url) {
        window.location.href = response.data.checkout_url;
      } else {
        throw new Error("Checkout session missing");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.detail || error.message || "Checkout failed.");
      setLoading(false);
    }
  };

  if (checkingTerms) {
    return <StitchLoadingPage label="Checking account terms acceptance and preparing the booking shell." />;
  }

  const estimatedMinutes = normalizedCart.length ? normalizedCart.length * 15 + Math.max(normalizedCart.length - 1, 0) * 20 + 30 : 0;

  return (
    <>
      <StitchShell
        title="Logistics"
        eyebrow="Checkout"
        actions={
          <button onClick={() => navigate("/customer")} className="stitch-button stitch-button-secondary">
            <ArrowLeft className="h-4 w-4" />
            Back to discovery
          </button>
        }
      >
        {!normalizedCart.length ? (
          <div className="flex min-h-[400px] flex-col items-center justify-center border border-dashed border-[var(--stitch-line-strong)] bg-white p-12 text-center">
            <ShoppingCart className="mx-auto h-12 w-12 text-[var(--stitch-muted)]" />
            <h2 className="mt-6 text-2xl font-black uppercase tracking-[-0.03em]">Your cart is empty</h2>
            <p className="mt-2 text-sm text-[var(--stitch-muted)]">Target at least one property to initialize the logistics flow.</p>
            <StitchButton onClick={() => navigate("/customer")} className="mt-8">
              Explore inventory
            </StitchButton>
          </div>
        ) : (
          <div className="flex flex-col gap-16 lg:flex-row lg:items-start">
            <div className="flex-grow space-y-20">
              <section>
                <h2 className="font-headline text-2xl font-black uppercase tracking-[-0.04em] text-black">Target Assets</h2>
                <div className="mt-8 border-t border-[var(--stitch-line)]">
                  {normalizedCart.map((property) => (
                    <div key={property.id} className="flex items-center justify-between border-b border-[var(--stitch-line)] py-6 group">
                      <div className="flex items-center gap-6">
                        <div className="h-20 w-20 overflow-hidden bg-[var(--stitch-soft)]">
                          <img src={property.image} alt={property.title} className="h-full w-full object-cover grayscale transition duration-500 group-hover:grayscale-0" />
                        </div>
                        <div>
                          <h3 className="text-lg font-black uppercase tracking-[-0.02em]">{property.title}</h3>
                          <p className="mt-1 flex items-center gap-1 text-sm text-[var(--stitch-muted)]">
                            <MapPin className="h-3.5 w-3.5" />
                            {property.location}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => removeFromCart(property.id)}
                        className="p-2 text-[var(--stitch-muted)] transition hover:text-black"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="font-headline text-2xl font-black uppercase tracking-[-0.04em] text-black">Visit Allocation</h2>
                <div className="mt-8 grid gap-6 md:grid-cols-3">
                  {packages.map((pkg) => {
                    const disabled = pkg.visits < normalizedCart.length;
                    const isSelected = selectedPackage === pkg.id;
                    return (
                      <button
                        key={pkg.id}
                        disabled={disabled}
                        onClick={() => setSelectedPackage(pkg.id)}
                        className={`relative flex flex-col p-8 transition-all ${
                          isSelected 
                            ? "bg-black text-white ring-4 ring-black ring-offset-4" 
                            : disabled 
                              ? "bg-[var(--stitch-soft)] opacity-40 grayscale" 
                              : "bg-white border border-[var(--stitch-line)] hover:border-black"
                        }`}
                      >
                        <p className={`text-[10px] font-black uppercase tracking-widest ${isSelected ? "text-white/60" : "text-[var(--stitch-muted)]"}`}>
                          {pkg.visits === 1 ? "Base" : pkg.visits === 3 ? "Optimal" : "Maximum"}
                        </p>
                        <div className="mt-4">
                          <p className="text-3xl font-black tracking-tighter">{pkg.visits} VISIT{pkg.visits > 1 ? "S" : ""}</p>
                          <p className={`mt-2 text-xs uppercase tracking-widest ${isSelected ? "text-white/60" : "text-[var(--stitch-muted)]"}`}>
                            Valid {pkg.validity}
                          </p>
                        </div>
                        <div className="mt-10 flex items-baseline justify-between border-t border-current pt-6">
                          <span className="text-[10px] font-black">TOTAL</span>
                          <span className="text-2xl font-black">₹{pkg.price}</span>
                        </div>
                        {isSelected && (
                          <div className="absolute top-4 right-4">
                            <Check className="h-5 w-5" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>

              <section>
                <h2 className="font-headline text-2xl font-black uppercase tracking-[-0.04em] text-black">Deployment Parameters</h2>
                <div className="mt-8 grid gap-10 md:grid-cols-2">
                  <div className="space-y-3">
                    <label className="stitch-eyebrow">Execution Date</label>
                    <input
                      type="date"
                      min={new Date().toISOString().split("T")[0]}
                      value={bookingData.scheduled_date}
                      onChange={(event) => setBookingData((current) => ({ ...current, scheduled_date: event.target.value }))}
                      className="w-full border-0 border-b-2 border-transparent bg-[var(--stitch-soft)] p-5 text-lg font-black transition-colors focus:border-black focus:ring-0"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="stitch-eyebrow">Time Window</label>
                    <select
                      value={bookingData.scheduled_time}
                      onChange={(event) => setBookingData((current) => ({ ...current, scheduled_time: event.target.value }))}
                      className="w-full border-0 border-b-2 border-transparent bg-[var(--stitch-soft)] p-5 text-lg font-black transition-colors focus:border-black focus:ring-0 appearance-none"
                    >
                      <option value="">Select Slot</option>
                      {["09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"].map((time) => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-3 md:col-span-2">
                    <div className="flex items-end justify-between">
                      <label className="stitch-eyebrow">Extraction Point</label>
                      <button onClick={useCurrentLocation} disabled={gettingLocation} className="text-[10px] font-black uppercase tracking-widest text-black hover:underline">
                        {gettingLocation ? "Locating..." : "Use Current GPS"}
                      </button>
                    </div>
                    <input
                      value={bookingData.pickup_location}
                      onChange={(event) =>
                        setBookingData((current) => ({
                          ...current,
                          pickup_location: event.target.value,
                          pickup_lat: null,
                          pickup_lng: null,
                        }))
                      }
                      placeholder="Enter full address or building name"
                      className="w-full border-0 border-b-2 border-transparent bg-[var(--stitch-soft)] p-5 text-lg font-black transition-colors focus:border-black focus:ring-0"
                    />
                  </div>
                </div>
              </section>
            </div>

            <aside className="w-full lg:sticky lg:top-32 lg:w-96">
              <div className="border border-[var(--stitch-line-strong)] bg-white p-8">
                <h2 className="font-headline text-xl font-black uppercase tracking-[-0.04em] text-black">Summary</h2>
                <div className="mt-8 space-y-4 border-b border-[var(--stitch-line)] pb-8">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--stitch-muted)]">Asset Allocation ({normalizedCart.length})</span>
                    <span className="font-black">₹{selectedPkg?.price || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--stitch-muted)]">Logistics Surcharge</span>
                    <span className="font-black">₹0</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--stitch-muted)]">Estimated Duration</span>
                    <span className="font-black">{estimatedMinutes} min</span>
                  </div>
                </div>
                
                <div className="mt-8 flex items-baseline justify-between pb-12">
                  <span className="text-[10px] font-black uppercase tracking-widest">Authorization Total</span>
                  <span className="text-4xl font-black tracking-tighter">₹{selectedPkg?.price || 0}</span>
                </div>

                <div className="space-y-6">
                  <label className="flex cursor-pointer items-start gap-4">
                    <input 
                      type="checkbox" 
                      checked={termsAccepted} 
                      onChange={() => !user?.terms_accepted && setShowTermsModal(true)}
                      className="mt-1 h-5 w-5 border-2 border-black text-black focus:ring-0" 
                    />
                    <span className="text-xs leading-relaxed text-[var(--stitch-muted)]">
                      I confirm the logistics parameters and agree to the <span className="font-black text-black underline">Terms of Engagement</span> and <span className="font-black text-black underline">Cancellation Policy</span>.
                    </span>
                  </label>

                  <button
                    onClick={handleCheckout}
                    disabled={loading || !selectedPackage || !termsAccepted}
                    className="flex w-full items-center justify-center gap-4 bg-black py-6 text-sm font-black uppercase tracking-widest text-white transition-all hover:bg-black/90 active:scale-95 disabled:opacity-30"
                  >
                    {loading ? "Initializing..." : "Initialize Payment"}
                    <ArrowLeft className="h-4 w-4 rotate-180" />
                  </button>
                  
                  <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--stitch-muted)]">
                    <Lock className="h-3 w-3" />
                    256-Bit Encrypted Channel
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}
      </StitchShell>

      <TermsAcceptanceModal
        isOpen={showTermsModal}
        onAccept={async () => {
          try {
            await authAPI.acceptTerms({
              accepted_terms: true,
              accepted_privacy: true,
              accepted_anti_circumvention: true,
            });
            setTermsAccepted(true);
            setShowTermsModal(false);
            toast.success("Terms accepted.");
          } catch {
            toast.error("Failed to save terms acceptance.");
          }
        }}
        onDecline={() => setShowTermsModal(false)}
        userType="customer"
        context="booking"
      />
    </>
  );
}
