// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Check, ChevronRight, Crown, MapPin, Package, Phone, Shield, Truck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { initiateCashfreePayment } from "../utils/cashfree";
import api from "../utils/api";
import {
  StitchButton,
  StitchCard,
  StitchInput,
  StitchLoadingPage,
  StitchSectionHeader,
  StitchShell,
  StitchTextarea,
} from "../stitch/components/StitchPrimitives";
import { formatCurrency } from "../stitch/utils";

const packageIcons = {
  basic: Package,
  standard: Truck,
  premium: Shield,
  elite: Crown,
  intercity: MapPin,
};

export default function PackersMovers() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [addOns, setAddOns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    from_address: "",
    to_address: "",
    from_city: "",
    to_city: "",
    scheduled_date: "",
    contact_phone: user?.phone || "",
    items_description: "",
    add_ons: [],
  });

  useEffect(() => {
    const loadPackages = async () => {
      try {
        const response = await api.get("/packers/packages");
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

  const estimate = useMemo(() => {
    if (!selectedPackage) return "0";
    return `${formatCurrency(selectedPackage.price_min)} - ${formatCurrency(selectedPackage.price_max)}`;
  }, [selectedPackage]);

  const toggleAddOn = (id) => {
    setFormData((current) => ({
      ...current,
      add_ons: current.add_ons.includes(id) ? current.add_ons.filter((item) => item !== id) : [...current.add_ons, id],
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedPackage) return;

    setSubmitting(true);
    try {
      const bookingResponse = await api.post("/packers/book", {
        ...formData,
        package_tier: selectedPackage.tier,
      });

      const booking = bookingResponse.data?.booking;
      const paymentResponse = await api.post("/packers/pay", {
        booking_id: booking.id,
        origin_url: window.location.origin,
      });

      const paymentSessionId = paymentResponse.data?.payment_session_id;
      const returnUrl = `${window.location.origin}/payment-success?order_id=${paymentResponse.data?.order_id}`;

      if (paymentSessionId) {
        try {
          await initiateCashfreePayment(paymentSessionId, returnUrl);
        } catch {
          if (paymentResponse.data?.checkout_url) {
            window.location.href = paymentResponse.data.checkout_url;
          }
        }
      } else if (paymentResponse.data?.checkout_url) {
        window.location.href = paymentResponse.data.checkout_url;
      } else {
        toast.success("Booking created");
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to submit booking");
      setSubmitting(false);
    }
  };

  if (loading) {
    return <StitchLoadingPage label="Loading relocation packages" />;
  }

  return (
    <StitchShell
      title="Packers"
      eyebrow="Relocation"
      actions={
        <button onClick={() => navigate("/customer")} className="stitch-button stitch-button-secondary">
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <StitchCard className="p-6 md:p-8">
            <StitchSectionHeader title="Packages" />
            <div className="mt-6 grid gap-4">
              {packages.map((pkg) => {
                const Icon = packageIcons[pkg.tier] || Package;
                return (
                  <button
                    key={pkg.id}
                    onClick={() => {
                      setSelectedPackage(pkg);
                      setShowBookingForm(true);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className={`rounded-[28px] border p-5 text-left transition ${
                      selectedPackage?.tier === pkg.tier ? "border-black bg-[var(--stitch-soft)] shadow-xl" : "border-[var(--stitch-line)] bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--stitch-soft)]">
                        <Icon className="h-5 w-5" />
                      </div>
                      {pkg.tier === "standard" ? (
                        <span className="rounded-full bg-black px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-white">Popular</span>
                      ) : null}
                    </div>
                    <h3 className="mt-5 text-2xl font-black uppercase tracking-[-0.04em]">{pkg.name}</h3>
                    <p className="mt-3 text-sm font-bold uppercase tracking-[0.16em] text-[var(--stitch-muted)]">
                      Rs {formatCurrency(pkg.price_min)} - {formatCurrency(pkg.price_max)}
                    </p>
                    <div className="mt-5 space-y-2">
                      {pkg.includes.slice(0, 4).map((item) => (
                        <div key={item} className="flex items-start gap-2 text-sm text-[var(--stitch-muted)]">
                          <Check className="mt-0.5 h-4 w-4 text-black" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </StitchCard>
        </div>

        <div className="space-y-6">
          {showBookingForm && selectedPackage ? (
            <StitchCard className="p-6 md:p-8">
              <StitchSectionHeader title={selectedPackage.name} />
              <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <StitchInput
                    required
                    placeholder="From city"
                    value={formData.from_city}
                    onChange={(event) => setFormData((current) => ({ ...current, from_city: event.target.value }))}
                  />
                  <StitchInput
                    required
                    placeholder="To city"
                    value={formData.to_city}
                    onChange={(event) => setFormData((current) => ({ ...current, to_city: event.target.value }))}
                  />
                </div>
                <StitchTextarea
                  required
                  rows={3}
                  placeholder="Pickup address"
                  value={formData.from_address}
                  onChange={(event) => setFormData((current) => ({ ...current, from_address: event.target.value }))}
                />
                <StitchTextarea
                  required
                  rows={3}
                  placeholder="Delivery address"
                  value={formData.to_address}
                  onChange={(event) => setFormData((current) => ({ ...current, to_address: event.target.value }))}
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="relative">
                    <Calendar className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--stitch-muted)]" />
                    <StitchInput
                      type="date"
                      required
                      value={formData.scheduled_date}
                      onChange={(event) => setFormData((current) => ({ ...current, scheduled_date: event.target.value }))}
                      className="pl-11"
                    />
                  </div>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--stitch-muted)]" />
                    <StitchInput
                      type="tel"
                      required
                      placeholder="Contact phone"
                      value={formData.contact_phone}
                      onChange={(event) => setFormData((current) => ({ ...current, contact_phone: event.target.value }))}
                      className="pl-11"
                    />
                  </div>
                </div>
                <StitchTextarea
                  rows={3}
                  placeholder="Items description"
                  value={formData.items_description}
                  onChange={(event) => setFormData((current) => ({ ...current, items_description: event.target.value }))}
                />
                <div>
                  <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-[var(--stitch-muted)]">Add-ons</p>
                  <div className="flex flex-wrap gap-2">
                    {addOns.map((addon) => (
                      <button
                        key={addon.id}
                        type="button"
                        onClick={() => toggleAddOn(addon.id)}
                        className={`rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.16em] ${
                          formData.add_ons.includes(addon.id) ? "border-black bg-black text-white" : "border-[var(--stitch-line)] bg-[var(--stitch-soft)]"
                        }`}
                      >
                        {addon.name}
                      </button>
                    ))}
                  </div>
                </div>
                <StitchButton type="submit" disabled={submitting} className="justify-center">
                  {submitting ? "Submitting" : "Continue to payment"}
                  <ChevronRight className="h-4 w-4" />
                </StitchButton>
              </form>
            </StitchCard>
          ) : (
            <StitchCard className="p-8 text-center">
              <Package className="mx-auto h-8 w-8 text-[var(--stitch-muted)]" />
              <p className="mt-4 text-sm text-[var(--stitch-muted)]">Select a package to start your relocation request.</p>
            </StitchCard>
          )}

          <StitchCard className="p-6">
            <StitchSectionHeader title="Estimate" />
            <div className="mt-6 rounded-[26px] bg-black p-5 text-white">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/55">Range</p>
              <p className="mt-3 text-4xl font-black tracking-[-0.05em]">Rs {estimate}</p>
            </div>
          </StitchCard>
        </div>
      </div>
    </StitchShell>
  );
}
