// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Home, Lock, MapPin, Play, ShoppingCart, Sparkles, Video } from "lucide-react";
import { toast } from "sonner";
import { paymentAPI, propertyAPI } from "../utils/api";
import { initiateCashfreePayment } from "../utils/cashfree";
import api from "../utils/api";
import {
  StitchButton,
  StitchCard,
  StitchLoadingPage,
  StitchModal,
  StitchSectionHeader,
  StitchShell,
} from "../stitch/components/StitchPrimitives";
import { formatCurrency, normalizeProperty } from "../stitch/utils";

const packages = [
  { id: "single_visit", label: "1 visit", price: 200, detail: "Valid for 3 days" },
  { id: "three_visits", label: "3 visits", price: 350, detail: "Valid for 7 days" },
  { id: "five_visits", label: "5 visits", price: 500, detail: "Valid for 10 days" },
];

export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [explainerVideo, setExplainerVideo] = useState<string | null>(null);
  const [cart, setCart] = useState<any[]>(() => JSON.parse(localStorage.getItem("visitCart") || "[]"));

  const normalized = useMemo(() => (property ? normalizeProperty(property) : null), [property]);
  const isInCart = cart.some((item) => item.id === id);

  const syncCart = (nextCart: any[]) => {
    setCart(nextCart);
    localStorage.setItem("visitCart", JSON.stringify(nextCart));
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [propertyResponse, videoResponse] = await Promise.allSettled([
          propertyAPI.getProperty(id),
          api.get("/settings/explainer-video"),
        ]);

        if (propertyResponse.status === "fulfilled") setProperty(propertyResponse.value.data);
        if (videoResponse.status === "fulfilled" && videoResponse.value.data?.video_url) {
          setExplainerVideo(videoResponse.value.data.video_url);
        }
      } catch {
        toast.error("Failed to load property.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const createCheckout = async (packageId: string) => {
    if (!id) return;
    setProcessingPayment(true);
    try {
      const originUrl = window.location.origin;
      const response = await paymentAPI.createCheckout(packageId, originUrl, id);
      const returnUrl = `${originUrl}/payment-success?order_id=${response.data.order_id}`;

      if (response.data.payment_session_id) {
        await initiateCashfreePayment(response.data.payment_session_id, returnUrl);
      } else if (response.data.checkout_url) {
        window.location.href = response.data.checkout_url;
      } else {
        throw new Error("Checkout URL missing");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Payment initialization failed.");
      setProcessingPayment(false);
    }
  };

  if (loading) {
    return <StitchLoadingPage label="Loading property gallery, pricing, and booking actions." />;
  }

  if (!normalized) {
    return (
      <StitchShell title="Property" eyebrow="Error" subtitle="This property could not be loaded.">
        <StitchCard className="p-10 text-center">
          <Home className="mx-auto h-10 w-10 text-[var(--stitch-muted)]" />
          <p className="mt-4 text-sm text-[var(--stitch-muted)]">Property not found.</p>
        </StitchCard>
      </StitchShell>
    );
  }

  return (
    <>
      <StitchShell
        title="Listing"
        eyebrow={normalized.city || "Property"}
        actions={
          <>
            <button onClick={() => navigate("/customer")} className="stitch-button stitch-button-secondary">
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <button onClick={() => navigate("/customer/cart")} className="stitch-button stitch-button-ghost">
              <ShoppingCart className="h-4 w-4" />
              Cart {cart.length ? `(${cart.length})` : ""}
            </button>
          </>
        }
      >
        <div className="grid gap-10 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <div className="relative overflow-hidden bg-[var(--stitch-soft)]">
              <img
                src={normalized.images[selectedImage] ? normalized.image.replace(normalized.image, normalized.images[selectedImage].startsWith("http") ? normalized.images[selectedImage] : normalized.image) : normalized.image}
                alt={normalized.title}
                className="h-[500px] w-full object-cover grayscale transition duration-700 hover:grayscale-0 md:h-[700px]"
                onClick={() => setShowLightbox(true)}
              />
              <div className="absolute left-6 top-6 flex gap-3">
                {normalized.premium ? <span className="bg-black px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white">Premium Listing</span> : null}
                {normalized.verified ? <span className="bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest">Verified Assets</span> : null}
              </div>
              {normalized.images.length > 1 ? (
                <div className="absolute bottom-6 left-6 flex gap-2">
                  <button
                    onClick={() => setSelectedImage((current) => (current - 1 + normalized.images.length) % normalized.images.length)}
                    className="flex h-12 w-12 items-center justify-center bg-white/90 transition hover:bg-white"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={() => setSelectedImage((current) => (current + 1) % normalized.images.length)}
                    className="flex h-12 w-12 items-center justify-center bg-white/90 transition hover:bg-white"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </div>
              ) : null}
            </div>
            
            {normalized.images.length > 1 ? (
              <div className="grid grid-cols-4 gap-2 md:grid-cols-6">
                {normalized.images.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    onClick={() => setSelectedImage(index)}
                    className={`relative aspect-square overflow-hidden bg-[var(--stitch-soft)] transition-opacity ${selectedImage === index ? "opacity-100 ring-2 ring-black" : "opacity-40 hover:opacity-70"}`}
                  >
                    <img src={image.startsWith("http") ? image : normalized.image} alt="" className="h-full w-full object-cover grayscale" />
                  </button>
                ))}
              </div>
            ) : null}

            <div className="flex flex-col gap-8 pt-6">
              <div className="space-y-4">
                <h1 className="font-headline text-5xl font-black uppercase leading-[1] tracking-[-0.04em] md:text-7xl">
                  {normalized.title}
                </h1>
                <p className="flex items-center gap-2 text-lg font-bold text-[var(--stitch-muted)]">
                  <MapPin className="h-5 w-5" />
                  {normalized.location}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="border border-[var(--stitch-line)] bg-white p-6">
                  <p className="stitch-eyebrow">Monthly Rent</p>
                  <p className="mt-4 text-3xl font-black tracking-[-0.04em]">₹{formatCurrency(normalized.rent)}</p>
                </div>
                <div className="border border-[var(--stitch-line)] bg-white p-6">
                  <p className="stitch-eyebrow">Configuration</p>
                  <p className="mt-4 text-xl font-black uppercase">{normalized.bhk ? `${normalized.bhk} BHK` : normalized.propertyType}</p>
                </div>
                <div className="border border-[var(--stitch-line)] bg-white p-6">
                  <p className="stitch-eyebrow">Furnishing</p>
                  <p className="mt-4 text-xl font-black uppercase">{normalized.furnishing}</p>
                </div>
              </div>

              <div className="space-y-4">
                <p className="stitch-eyebrow">Operational parameters</p>
                <p className="text-lg leading-relaxed text-[var(--stitch-muted)]">
                  {normalized.description}
                </p>
              </div>

              {normalized.amenities.length ? (
                <div className="flex flex-wrap gap-2 pt-4">
                  {normalized.amenities.map((amenity) => (
                    <span key={amenity} className="border border-black bg-black px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white">
                      {amenity}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="space-y-8">
            <section className="sticky top-28 space-y-6">
              <div className="border-l-4 border-black bg-white p-8">
                <StitchSectionHeader
                  eyebrow="Direct Action"
                  title="Deployment"
                />
                
                <div className="mt-8 space-y-4">
                  {isInCart ? (
                    <div className="bg-black p-6 text-white">
                      <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest">
                        <Check className="h-4 w-4" />
                        Added to target list
                      </p>
                      <div className="mt-6 grid gap-2">
                        <StitchButton variant="secondary" onClick={() => navigate("/customer/cart")} className="w-full">
                          Open Cart
                        </StitchButton>
                        <button 
                          onClick={() => {
                            const next = cart.filter((item) => item.id !== id);
                            syncCart(next);
                            toast.success("Removed.");
                          }}
                          className="w-full py-3 text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white"
                        >
                          Remove from list
                        </button>
                      </div>
                    </div>
                  ) : (
                    <StitchButton
                      onClick={() => {
                        const next = [...cart, normalized];
                        syncCart(next);
                        toast.success("Added to cart.");
                      }}
                      className="w-full py-8 text-lg"
                    >
                      <ShoppingCart className="h-5 w-5" />
                      Add to Visit Cart
                    </StitchButton>
                  )}

                  <div className="grid gap-3">
                    <p className="stitch-eyebrow mt-4">Visit Credits</p>
                    {packages.map((pkg) => (
                      <button
                        key={pkg.id}
                        onClick={() => createCheckout(pkg.id)}
                        disabled={processingPayment}
                        className="group flex items-center justify-between border border-[var(--stitch-line)] bg-white p-5 transition hover:border-black"
                      >
                        <div className="text-left">
                          <p className="text-sm font-black uppercase tracking-widest">{pkg.label}</p>
                          <p className="mt-1 text-xs text-[var(--stitch-muted)]">{pkg.detail}</p>
                        </div>
                        <p className="text-2xl font-black tracking-tighter group-hover:scale-110 transition-transform">₹{pkg.price}</p>
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => createCheckout("property_lock")}
                    disabled={processingPayment}
                    className="mt-6 w-full border-2 border-black bg-white p-6 text-left transition hover:bg-black hover:text-white group"
                  >
                    <p className="text-xs font-black uppercase tracking-widest group-hover:text-white">Property Hold</p>
                    <p className="mt-2 text-2xl font-black tracking-tighter group-hover:text-white">₹999</p>
                    <p className="mt-2 text-[10px] uppercase tracking-widest text-[var(--stitch-muted)] group-hover:text-white/60">Lock this asset immediately</p>
                  </button>
                </div>
              </div>

              <div className="bg-[var(--stitch-soft)] p-8 text-center">
                <Lock className="mx-auto h-8 w-8 text-black" />
                <h3 className="mt-4 text-sm font-black uppercase tracking-widest">Location Encrypted</h3>
                <p className="mt-2 text-xs leading-relaxed text-[var(--stitch-muted)]">
                  Exact address is revealed only during a guided tour to maintain owner privacy and security.
                </p>
              </div>

              <div className="bg-white p-8">
                <p className="stitch-eyebrow">Guided flow</p>
                <div className="mt-6 space-y-6">
                  {explainerVideo ? (
                    <video controls className="w-full grayscale transition hover:grayscale-0">
                      <source src={explainerVideo} type="video/mp4" />
                    </video>
                  ) : (
                    <div className="flex h-48 items-center justify-center border border-dashed border-[var(--stitch-line-strong)]">
                      <Video className="h-8 w-8 text-[var(--stitch-muted)]" />
                    </div>
                  )}
                  <div className="grid gap-4">
                    {[
                      "Select targets",
                      "Confirm logistics",
                      "Execute visit",
                    ].map((step, i) => (
                      <div key={step} className="flex items-center gap-4">
                        <span className="font-headline text-2xl font-black opacity-20">0{i+1}</span>
                        <span className="text-xs font-black uppercase tracking-widest">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </StitchShell>

      <StitchModal open={showLightbox}>
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="stitch-eyebrow">Gallery</p>
              <p className="text-lg font-black uppercase tracking-[-0.03em]">{normalized.title}</p>
            </div>
            <button onClick={() => setShowLightbox(false)} className="stitch-button stitch-button-secondary">
              Close
            </button>
          </div>
          <div className="overflow-hidden rounded-[28px] bg-[var(--stitch-soft)]">
            <img src={normalized.image} alt={normalized.title} className="h-[70vh] w-full object-contain" />
          </div>
          <div className="flex gap-3 overflow-auto">
            {normalized.images.map((image, index) => (
              <button
                key={`${image}-${index}-lightbox`}
                onClick={() => setSelectedImage(index)}
                className={`overflow-hidden rounded-[20px] border ${selectedImage === index ? "border-black" : "border-[var(--stitch-line)]"}`}
              >
                <img src={image.startsWith("http") ? image : normalized.image} alt="" className="h-20 w-28 object-cover" />
              </button>
            ))}
          </div>
        </div>
      </StitchModal>
    </>
  );
}
