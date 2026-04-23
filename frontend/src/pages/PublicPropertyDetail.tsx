// @ts-nocheck
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, BedDouble, Calendar, ChevronLeft, ChevronRight, Copy, Home, MapPin, Share2, Sofa, User2, ZoomIn } from "lucide-react";
import { toast } from "sonner";
import { getMediaUrl } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import {
  StitchButton,
  StitchCard,
  StitchLoadingPage,
  StitchModal,
  StitchSectionHeader,
  StitchShell,
} from "../stitch/components/StitchPrimitives";
import { formatCurrency, normalizeProperty } from "../stitch/utils";

const API_URL = import.meta.env.VITE_BACKEND_URL || "";

export default function PublicPropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  const refCode = searchParams.get("ref");
  const customerRedirect = `/customer/property/${id}${refCode ? `?ref=${refCode}` : ""}`;

  const loadProperty = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/public/property/${id}`);
      if (!response.ok) throw new Error("Property not found");
      const data = await response.json();
      setProperty(data);
    } catch (error) {
      console.error("Failed to load property:", error);
      toast.error("Failed to load property");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadProperty();
  }, [loadProperty]);

  const normalized = useMemo(() => (property ? normalizeProperty(property) : null), [property]);
  const imageUrls = useMemo(
    () => (Array.isArray(property?.images) ? property.images.map((image) => getMediaUrl(image, "property")) : []),
    [property]
  );
  const activeImage = imageUrls[selectedImage] || normalized?.image;

  const handleBookVisit = () => {
    if (!user) {
      setShowAuthPrompt(true);
      localStorage.setItem(
        "pendingBookProperty",
        JSON.stringify({
          propertyId: id,
          refCode,
        })
      );
      return;
    }

    navigate(customerRedirect);
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/property/${id}${refCode ? `?ref=${refCode}` : ""}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: normalized?.title || "Property on ApnaGhr",
          text: normalized ? `${normalized.bhk || ""} BHK in ${normalized.location}`.trim() : "Property on ApnaGhr",
          url: shareUrl,
        });
        return;
      } catch {
        // fall through to clipboard
      }
    }

    await navigator.clipboard.writeText(shareUrl);
    toast.success("Link copied");
  };

  const stepImage = (direction) => {
    if (!imageUrls.length) return;
    setSelectedImage((current) => (current + direction + imageUrls.length) % imageUrls.length);
  };

  if (loading) {
    return <StitchLoadingPage label="Loading property" />;
  }

  if (!property || !normalized) {
    return (
      <StitchShell
        title="Property"
        actions={
          <button onClick={() => navigate("/")} className="stitch-button stitch-button-secondary">
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        }
        compact
      >
        <StitchCard className="p-8 text-center">
          <Home className="mx-auto h-10 w-10 text-[var(--stitch-muted)]" />
          <p className="mt-4 text-sm text-[var(--stitch-muted)]">Property not found.</p>
        </StitchCard>
      </StitchShell>
    );
  }

  return (
    <>
      <StitchShell
        title="Property"
        eyebrow="Public listing"
        actions={
          <>
            <button onClick={() => navigate("/")} className="stitch-button stitch-button-secondary">
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <button onClick={handleShare} className="stitch-button stitch-button-ghost">
              <Share2 className="h-4 w-4" />
              Share
            </button>
          </>
        }
      >
        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="space-y-6">
            <StitchCard className="overflow-hidden p-3 md:p-4">
              <div
                className="group relative aspect-[16/10] overflow-hidden rounded-[28px] bg-[var(--stitch-soft)]"
                onClick={() => imageUrls.length > 0 && setShowLightbox(true)}
              >
                <img src={activeImage} alt={normalized.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />
                <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                  {normalized.hot ? <span className="rounded-full bg-black px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white">Hot</span> : null}
                  {normalized.verified ? <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em]">Verified</span> : null}
                </div>
                <div className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full bg-black/70 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-white">
                  <ZoomIn className="h-3.5 w-3.5" />
                  {imageUrls.length || 1}
                </div>
              </div>

              {imageUrls.length > 1 ? (
                <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
                  {imageUrls.map((image, index) => (
                    <button
                      key={image + index}
                      onClick={() => setSelectedImage(index)}
                      className={`h-20 w-24 flex-none overflow-hidden rounded-[20px] border transition ${
                        index === selectedImage ? "border-black shadow-[0_0_0_1px_rgba(0,0,0,0.85)]" : "border-[var(--stitch-line)] opacity-70"
                      }`}
                    >
                      <img src={image} alt={`${normalized.title} ${index + 1}`} className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              ) : null}
            </StitchCard>

            <StitchCard className="p-6 md:p-8">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-3">
                  <div>
                    <h2 className="font-headline text-3xl font-black uppercase tracking-[-0.05em] md:text-5xl">{normalized.title}</h2>
                    <div className="mt-3 flex items-center gap-2 text-sm text-[var(--stitch-muted)]">
                      <MapPin className="h-4 w-4" />
                      <span>{normalized.location}</span>
                    </div>
                  </div>
                  <div className="inline-flex rounded-[24px] bg-black px-5 py-4 text-white">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/55">Rent</p>
                      <p className="mt-2 text-3xl font-black tracking-[-0.05em]">Rs {formatCurrency(normalized.rent)}</p>
                    </div>
                  </div>
                </div>
                <div className="grid w-full gap-3 sm:grid-cols-3 md:max-w-[440px]">
                  <div className="rounded-[26px] border border-[var(--stitch-line)] bg-[var(--stitch-soft)] p-4">
                    <BedDouble className="h-5 w-5" />
                    <p className="mt-4 text-2xl font-black">{normalized.bhk || "-"}</p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-[var(--stitch-muted)]">BHK</p>
                  </div>
                  <div className="rounded-[26px] border border-[var(--stitch-line)] bg-[var(--stitch-soft)] p-4">
                    <Sofa className="h-5 w-5" />
                    <p className="mt-4 text-lg font-black">{normalized.furnishing}</p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-[var(--stitch-muted)]">Furnishing</p>
                  </div>
                  <div className="rounded-[26px] border border-[var(--stitch-line)] bg-[var(--stitch-soft)] p-4">
                    <Home className="h-5 w-5" />
                    <p className="mt-4 text-lg font-black">{normalized.propertyType}</p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-[var(--stitch-muted)]">Type</p>
                  </div>
                </div>
              </div>
            </StitchCard>

            {normalized.description ? (
              <StitchCard className="p-6 md:p-8">
                <StitchSectionHeader title="Overview" />
                <p className="mt-5 text-sm leading-7 text-[var(--stitch-muted)] md:text-base">{normalized.description}</p>
              </StitchCard>
            ) : null}

            {normalized.amenities.length > 0 ? (
              <StitchCard className="p-6 md:p-8">
                <StitchSectionHeader title="Amenities" />
                <div className="mt-5 flex flex-wrap gap-3">
                  {normalized.amenities.map((amenity) => (
                    <span key={amenity} className="rounded-full border border-[var(--stitch-line)] bg-[var(--stitch-soft)] px-4 py-2 text-xs font-bold uppercase tracking-[0.16em]">
                      {amenity}
                    </span>
                  ))}
                </div>
              </StitchCard>
            ) : null}

            {property.video_url ? (
              <StitchCard className="p-6 md:p-8">
                <StitchSectionHeader title="Video" />
                <div className="mt-5 overflow-hidden rounded-[28px] bg-black">
                  <video
                    src={getMediaUrl(property.video_url)}
                    controls
                    className="aspect-video w-full"
                    poster={activeImage}
                  />
                </div>
              </StitchCard>
            ) : null}
          </div>

          <div className="space-y-6 xl:sticky xl:top-28 xl:self-start">
            <StitchCard className="p-6">
              <StitchSectionHeader eyebrow="Visit" title="Book this property" />
              <div className="mt-6 space-y-4">
                <div className="rounded-[26px] bg-black p-5 text-white">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/55">Shared listing</p>
                  <p className="mt-3 text-2xl font-black uppercase tracking-[-0.04em]">Continue to schedule</p>
                </div>
                <StitchButton onClick={handleBookVisit} className="w-full justify-center">
                  <Calendar className="h-4 w-4" />
                  Book Visit
                </StitchButton>
              </div>
            </StitchCard>

            <StitchCard className="p-6">
              <StitchSectionHeader eyebrow="Location" title="Exact address is locked" />
              <div className="mt-5 overflow-hidden rounded-[28px] border border-[var(--stitch-line)] bg-[linear-gradient(135deg,rgba(0,0,0,0.08),rgba(0,0,0,0.02))] p-6">
                <div className="grid gap-2 opacity-60">
                  <div className="h-14 rounded-[18px] border border-dashed border-[var(--stitch-line-strong)]" />
                  <div className="grid grid-cols-3 gap-2">
                    <div className="h-20 rounded-[18px] border border-dashed border-[var(--stitch-line)]" />
                    <div className="h-20 rounded-[18px] border border-dashed border-[var(--stitch-line)]" />
                    <div className="h-20 rounded-[18px] border border-dashed border-[var(--stitch-line)]" />
                  </div>
                </div>
                <div className="mt-6 rounded-[24px] bg-white/85 p-5 backdrop-blur">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--stitch-muted)]">Area</p>
                  <p className="mt-2 text-xl font-black uppercase tracking-[-0.04em]">{normalized.location}</p>
                </div>
              </div>
            </StitchCard>
          </div>
        </div>
      </StitchShell>

      <StitchModal open={showAuthPrompt}>
        <div className="space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="stitch-eyebrow">Sign in required</p>
              <h3 className="font-headline text-3xl font-black uppercase tracking-[-0.05em]">Continue to book</h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--stitch-line)] bg-[var(--stitch-soft)]">
              <User2 className="h-5 w-5" />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <StitchButton
              onClick={() => navigate(`/login?redirect=${encodeURIComponent(customerRedirect)}`)}
              className="justify-center"
            >
              <Calendar className="h-4 w-4" />
              Sign in
            </StitchButton>
            <button onClick={() => setShowAuthPrompt(false)} className="stitch-button stitch-button-secondary justify-center">
              Continue browsing
            </button>
          </div>
        </div>
      </StitchModal>

      <StitchModal open={showLightbox}>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h3 className="font-headline text-2xl font-black uppercase tracking-[-0.05em]">{normalized.title}</h3>
            <div className="flex items-center gap-2">
              <button onClick={() => navigator.clipboard.writeText(window.location.href).then(() => toast.success("Link copied"))} className="stitch-button stitch-button-ghost">
                <Copy className="h-4 w-4" />
                Copy link
              </button>
              <button onClick={() => setShowLightbox(false)} className="stitch-button stitch-button-secondary">
                Close
              </button>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-[28px] bg-[var(--stitch-soft)]">
            <img src={activeImage} alt={normalized.title} className="max-h-[72vh] w-full object-contain" />
            {imageUrls.length > 1 ? (
              <>
                <button onClick={() => stepImage(-1)} className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/70 p-3 text-white">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button onClick={() => stepImage(1)} className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/70 p-3 text-white">
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            ) : null}
          </div>
          {imageUrls.length > 1 ? (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {imageUrls.map((image, index) => (
                <button
                  key={image + index}
                  onClick={() => setSelectedImage(index)}
                  className={`h-20 w-24 flex-none overflow-hidden rounded-[20px] border ${
                    index === selectedImage ? "border-black shadow-[0_0_0_1px_rgba(0,0,0,0.85)]" : "border-[var(--stitch-line)]"
                  }`}
                >
                  <img src={image} alt={`${normalized.title} ${index + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </StitchModal>

      <div className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-1.5rem)] max-w-xl -translate-x-1/2 md:bottom-6">
        <div className="stitch-panel flex items-center justify-between gap-4 p-3 md:p-4">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--stitch-muted)]">Rent</p>
            <p className="truncate text-xl font-black tracking-[-0.04em] md:text-2xl">Rs {formatCurrency(normalized.rent)}</p>
          </div>
          <StitchButton onClick={handleBookVisit} className="shrink-0">
            <Calendar className="h-4 w-4" />
            Book Visit
          </StitchButton>
        </div>
      </div>
    </>
  );
}
