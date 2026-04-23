// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Building2, Check, ChevronRight, Crown, Eye, Megaphone, MousePointer, Sparkles, Star, TrendingUp, User, Wand2, Zap } from "lucide-react";
import { toast } from "sonner";
import AIAdGenerator from "../components/AIAdGenerator";
import { useAuth } from "../context/AuthContext";
import { initiateCashfreePayment } from "../utils/cashfree";
import api from "../utils/api";
import {
  StitchButton,
  StitchCard,
  StitchInput,
  StitchLoadingPage,
  StitchSectionHeader,
  StitchSelect,
  StitchShell,
  StitchTextarea,
} from "../stitch/components/StitchPrimitives";
import { formatCurrency } from "../stitch/utils";

const packageIcons = {
  starter: Zap,
  growth: TrendingUp,
  premium: Star,
  elite: Crown,
};

const tabClasses = (active) =>
  `rounded-full px-5 py-3 text-xs font-black uppercase tracking-[0.18em] transition ${
    active ? "bg-black text-white" : "bg-[var(--stitch-soft)] text-[var(--stitch-muted)]"
  }`;

export default function AdvertiseWithUs() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [addOns, setAddOns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [step, setStep] = useState(1);
  const [activeTab, setActiveTab] = useState("packages");
  const [submitting, setSubmitting] = useState(false);
  const [profileData, setProfileData] = useState({
    company_name: "",
    business_type: "",
    contact_email: "",
    contact_phone: user?.phone || "",
    gst_number: "",
    address: "",
  });
  const [adData, setAdData] = useState({
    description: "",
    target_url: "",
    placement: ["home"],
    start_date: "",
    end_date: "",
  });

  useEffect(() => {
    const loadPackages = async () => {
      try {
        const response = await api.get("/advertising/packages");
        setPackages(response.data?.packages || []);
        setAddOns(response.data?.add_ons || []);
      } catch {
        toast.error("Failed to load packages");
      } finally {
        setLoading(false);
      }
    };

    loadPackages();
  }, []);

  const selectedTotal = useMemo(() => {
    if (!selectedPackage) return "0";
    return formatCurrency(selectedPackage.price_monthly || 0);
  }, [selectedPackage]);

  const handleSelectPackage = (pkg) => {
    setSelectedPackage(pkg);
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      await api.post("/advertising/profile", profileData);
      setStep(3);
      toast.success("Profile saved");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to save profile");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const adResponse = await api.post("/advertising/ads", {
        company_name: profileData.company_name,
        package_tier: selectedPackage.tier,
        poster_images: [],
        ...adData,
      });

      const ad = adResponse.data?.ad;
      const paymentResponse = await api.post("/advertising/pay", {
        ad_id: ad.id,
        origin_url: window.location.origin,
      });

      const paymentSessionId = paymentResponse.data?.payment_session_id;
      const returnUrl = `${window.location.origin}/payment-success?order_id=${paymentResponse.data?.order_id}`;

      if (paymentSessionId) {
        try {
          await initiateCashfreePayment(paymentSessionId, returnUrl);
        } catch (sdkError) {
          console.warn("Cashfree SDK fallback:", sdkError);
          if (paymentResponse.data?.checkout_url) {
            window.location.href = paymentResponse.data.checkout_url;
          }
        }
      } else if (paymentResponse.data?.checkout_url) {
        window.location.href = paymentResponse.data.checkout_url;
      } else {
        toast.success("Campaign submitted");
        setSubmitting(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to submit ad");
      setSubmitting(false);
    }
  };

  const togglePlacement = (placement) => {
    setAdData((current) => ({
      ...current,
      placement: current.placement.includes(placement)
        ? current.placement.filter((item) => item !== placement)
        : [...current.placement, placement],
    }));
  };

  if (loading) {
    return <StitchLoadingPage label="Loading ad packages" />;
  }

  return (
    <StitchShell
      title="Advertising"
      eyebrow="Partner tools"
      actions={
        <>
          <button
            onClick={() => {
              if (step > 1) {
                setStep(step - 1);
              } else {
                navigate("/customer");
              }
            }}
            className="stitch-button stitch-button-secondary"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          {selectedPackage ? (
            <div className="rounded-full bg-black px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-white">
              {selectedPackage.name}
            </div>
          ) : null}
        </>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="space-y-6">
          <StitchCard className="overflow-hidden p-6 md:p-8">
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-4">
                <p className="stitch-eyebrow">Campaign setup</p>
                <h2 className="font-headline text-4xl font-black uppercase leading-none tracking-[-0.07em] md:text-6xl">
                  Reach active
                  <br />
                  home seekers
                </h2>
                <div className="flex flex-wrap gap-3 pt-2">
                  <button className={tabClasses(activeTab === "packages")} onClick={() => setActiveTab("packages")}>
                    <Megaphone className="mr-2 inline h-4 w-4" />
                    Packages
                  </button>
                  <button className={tabClasses(activeTab === "ai-generator")} onClick={() => setActiveTab("ai-generator")}>
                    <Wand2 className="mr-2 inline h-4 w-4" />
                    AI Generator
                  </button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                {[
                  { icon: User, value: "10,000+", label: "Monthly users" },
                  { icon: Eye, value: "50,000+", label: "Impressions" },
                  { icon: MousePointer, value: "8%", label: "Average CTR" },
                ].map((item) => (
                  <div key={item.label} className="rounded-[26px] border border-[var(--stitch-line)] bg-[var(--stitch-soft)] p-4">
                    <item.icon className="h-5 w-5" />
                    <p className="mt-5 text-3xl font-black tracking-[-0.05em]">{item.value}</p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-[var(--stitch-muted)]">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </StitchCard>

          {activeTab === "packages" ? (
            <>
              <StitchCard className="p-6 md:p-8">
                <StitchSectionHeader title={step === 1 ? "Choose a package" : step === 2 ? "Business profile" : "Campaign details"} />
                {step > 1 ? (
                  <div className="mt-5 flex items-center gap-3">
                    {[1, 2, 3].map((item) => (
                      <div
                        key={item}
                        className={`flex h-10 w-10 items-center justify-center rounded-full border text-xs font-black ${
                          step >= item ? "border-black bg-black text-white" : "border-[var(--stitch-line)] bg-[var(--stitch-soft)]"
                        }`}
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                ) : null}

                {step === 1 ? (
                  <div className="mt-6 grid gap-4 xl:grid-cols-2">
                    {packages.map((pkg) => {
                      const Icon = packageIcons[pkg.tier] || Zap;
                      return (
                        <button
                          key={pkg.id}
                          onClick={() => handleSelectPackage(pkg)}
                          className="rounded-[30px] border border-[var(--stitch-line)] bg-white p-6 text-left transition hover:-translate-y-1 hover:shadow-xl"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--stitch-soft)]">
                              <Icon className="h-5 w-5" />
                            </div>
                            {pkg.tier === "growth" ? (
                              <span className="rounded-full bg-black px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-white">
                                Popular
                              </span>
                            ) : null}
                          </div>
                          <h3 className="mt-6 text-2xl font-black uppercase tracking-[-0.04em]">{pkg.name}</h3>
                          <p className="mt-3 text-4xl font-black tracking-[-0.06em]">Rs {formatCurrency(pkg.price_monthly)}</p>
                          <div className="mt-5 space-y-3">
                            {pkg.includes.map((item) => (
                              <div key={item} className="flex items-start gap-3 text-sm text-[var(--stitch-muted)]">
                                <Check className="mt-0.5 h-4 w-4 text-black" />
                                <span>{item}</span>
                              </div>
                            ))}
                          </div>
                          <div className="mt-6 flex items-center justify-between border-t border-[var(--stitch-line)] pt-4">
                            <span className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--stitch-muted)]">
                              {Array.isArray(pkg.best_for) ? pkg.best_for.join(", ") : ""}
                            </span>
                            <ChevronRight className="h-4 w-4" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : null}

                {step === 2 && selectedPackage ? (
                  <form onSubmit={handleProfileSubmit} className="mt-6 grid gap-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <StitchInput
                        required
                        placeholder="Company name"
                        value={profileData.company_name}
                        onChange={(event) => setProfileData((current) => ({ ...current, company_name: event.target.value }))}
                      />
                      <StitchSelect
                        required
                        value={profileData.business_type}
                        onChange={(event) => setProfileData((current) => ({ ...current, business_type: event.target.value }))}
                      >
                        <option value="">Business type</option>
                        <option value="packers_movers">Packers & movers</option>
                        <option value="furniture">Furniture</option>
                        <option value="broker">Broker</option>
                        <option value="builder">Builder</option>
                        <option value="home_services">Home services</option>
                        <option value="other">Other</option>
                      </StitchSelect>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <StitchInput
                        type="email"
                        required
                        placeholder="Email"
                        value={profileData.contact_email}
                        onChange={(event) => setProfileData((current) => ({ ...current, contact_email: event.target.value }))}
                      />
                      <StitchInput
                        type="tel"
                        required
                        placeholder="Phone"
                        value={profileData.contact_phone}
                        onChange={(event) => setProfileData((current) => ({ ...current, contact_phone: event.target.value }))}
                      />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <StitchInput
                        placeholder="GST number"
                        value={profileData.gst_number}
                        onChange={(event) => setProfileData((current) => ({ ...current, gst_number: event.target.value }))}
                      />
                      <StitchInput
                        placeholder="Address"
                        value={profileData.address}
                        onChange={(event) => setProfileData((current) => ({ ...current, address: event.target.value }))}
                      />
                    </div>
                    <StitchButton type="submit" disabled={submitting} className="justify-center">
                      <Building2 className="h-4 w-4" />
                      {submitting ? "Saving" : "Continue"}
                    </StitchButton>
                  </form>
                ) : null}

                {step === 3 && selectedPackage ? (
                  <form onSubmit={handleAdSubmit} className="mt-6 grid gap-4">
                    <StitchTextarea
                      required
                      rows={4}
                      placeholder="Campaign description"
                      value={adData.description}
                      onChange={(event) => setAdData((current) => ({ ...current, description: event.target.value }))}
                    />
                    <StitchInput
                      type="url"
                      placeholder="Website URL"
                      value={adData.target_url}
                      onChange={(event) => setAdData((current) => ({ ...current, target_url: event.target.value }))}
                    />
                    <div>
                      <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-[var(--stitch-muted)]">Placement</p>
                      <div className="flex flex-wrap gap-2">
                        {["home", "property_detail", "featured"].map((placement) => (
                          <button
                            key={placement}
                            type="button"
                            onClick={() => togglePlacement(placement)}
                            className={`rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.16em] transition ${
                              adData.placement.includes(placement)
                                ? "border-black bg-black text-white"
                                : "border-[var(--stitch-line)] bg-[var(--stitch-soft)]"
                            }`}
                          >
                            {placement.replace("_", " ")}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <StitchInput
                        type="date"
                        required
                        value={adData.start_date}
                        onChange={(event) => setAdData((current) => ({ ...current, start_date: event.target.value }))}
                      />
                      <StitchInput
                        type="date"
                        required
                        value={adData.end_date}
                        onChange={(event) => setAdData((current) => ({ ...current, end_date: event.target.value }))}
                      />
                    </div>
                    <StitchButton type="submit" disabled={submitting} className="justify-center">
                      <Sparkles className="h-4 w-4" />
                      {submitting ? "Submitting" : "Submit and pay"}
                    </StitchButton>
                  </form>
                ) : null}
              </StitchCard>

              {step === 1 && addOns.length > 0 ? (
                <StitchCard className="p-6 md:p-8">
                  <StitchSectionHeader title="Add-ons" />
                  <div className="mt-5 grid gap-4 md:grid-cols-3">
                    {addOns.map((item) => (
                      <div key={item.id} className="rounded-[24px] border border-[var(--stitch-line)] bg-[var(--stitch-soft)] p-4">
                        <p className="text-sm font-black uppercase tracking-[0.08em]">{item.name}</p>
                        <p className="mt-3 text-xs font-bold uppercase tracking-[0.16em] text-[var(--stitch-muted)]">
                          {item.price ? `Rs ${formatCurrency(item.price)}` : `Rs ${formatCurrency(item.price_min)} - ${formatCurrency(item.price_max)}`}
                        </p>
                      </div>
                    ))}
                  </div>
                </StitchCard>
              ) : null}
            </>
          ) : (
            <StitchCard className="p-2 md:p-4">
              <AIAdGenerator />
            </StitchCard>
          )}
        </div>

        <div className="space-y-6 xl:sticky xl:top-28 xl:self-start">
          <StitchCard className="p-6">
            <StitchSectionHeader eyebrow="Summary" title={selectedPackage ? selectedPackage.name : "Select a package"} />
            <div className="mt-6 space-y-4">
              <div className="rounded-[26px] bg-black p-5 text-white">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/55">Monthly total</p>
                <p className="mt-3 text-4xl font-black tracking-[-0.06em]">Rs {selectedTotal}</p>
              </div>
              <div className="grid gap-3">
                <div className="rounded-[22px] border border-[var(--stitch-line)] bg-[var(--stitch-soft)] p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--stitch-muted)]">Step</p>
                  <p className="mt-2 text-lg font-black">{step}/3</p>
                </div>
                <div className="rounded-[22px] border border-[var(--stitch-line)] bg-[var(--stitch-soft)] p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--stitch-muted)]">Placements</p>
                  <p className="mt-2 text-lg font-black">{adData.placement.length}</p>
                </div>
              </div>
            </div>
          </StitchCard>

          <StitchCard className="p-6">
            <StitchSectionHeader eyebrow="Placement" title="Where ads can appear" />
            <div className="mt-5 grid gap-3">
              {[
                "Home feed",
                "Property detail",
                "Featured strip",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-[22px] border border-[var(--stitch-line)] bg-[var(--stitch-soft)] p-4">
                  <Check className="h-4 w-4" />
                  <span className="text-sm font-black uppercase tracking-[0.08em]">{item}</span>
                </div>
              ))}
            </div>
          </StitchCard>
        </div>
      </div>
    </StitchShell>
  );
}
