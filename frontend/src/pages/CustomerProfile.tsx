// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, Calendar, Check, ChevronRight, CreditCard, HelpCircle, Home, LocateFixed, LogOut, Mail, MapPin, Megaphone, Phone, Save, Shield, ShoppingCart, User2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
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
import { formatCurrency } from "../stitch/utils";

const navItems = [
  { label: "Home", to: "/customer", icon: Home },
  { label: "Visits", to: "/customer/bookings", icon: Calendar },
  { label: "Cart", to: "/customer/cart", icon: ShoppingCart },
  { label: "Ads", to: "/customer/advertise", icon: Megaphone },
  { label: "Profile", to: "/customer/profile", icon: User2 },
];

const menuItems = [
  { icon: Calendar, label: "My Bookings", path: "/customer/bookings" },
  { icon: CreditCard, label: "Payment History", path: "/customer/payments" },
  { icon: Bell, label: "Notifications", path: "/customer/notifications" },
  { icon: HelpCircle, label: "Help", path: "/customer/support" },
  { icon: Shield, label: "Privacy", path: "/customer/privacy" },
];

export default function CustomerProfile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [stats, setStats] = useState({
    total_visits: 0,
    total_spent: 0,
    properties_viewed: 0,
    visits_available: 0,
  });
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    address: user?.address || "",
    address_lat: user?.address_lat || null,
    address_lng: user?.address_lng || null,
  });

  useEffect(() => {
    setFormData({
      name: user?.name || "",
      email: user?.email || "",
      address: user?.address || "",
      address_lat: user?.address_lat || null,
      address_lng: user?.address_lng || null,
    });
  }, [user]);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await api.get("/customer/wallet");
        setStats({
          total_visits: response.data?.total_visits || 0,
          total_spent: response.data?.total_spent || 0,
          properties_viewed: response.data?.properties_viewed || 0,
          visits_available: response.data?.visits_available || 0,
        });
      } catch {
        toast.error("Failed to load profile stats");
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const initials = useMemo(() => {
    const source = (formData.name || user?.name || "U").trim();
    return source.slice(0, 1).toUpperCase();
  }, [formData.name, user?.name]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await api.put("/customer/profile", formData);
      setFormData({
        name: response.data?.user?.name || formData.name,
        email: response.data?.user?.email || formData.email,
        address: response.data?.user?.address || formData.address,
        address_lat: response.data?.user?.address_lat ?? formData.address_lat,
        address_lng: response.data?.user?.address_lng ?? formData.address_lng,
      });
      setEditing(false);
      toast.success("Profile updated");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const latitude = coords.latitude;
        const longitude = coords.longitude;

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          setFormData((current) => ({
            ...current,
            address: data.display_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
            address_lat: latitude,
            address_lng: longitude,
          }));
          toast.success("Location captured");
        } catch {
          setFormData((current) => ({
            ...current,
            address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
            address_lat: latitude,
            address_lng: longitude,
          }));
          toast.success("Coordinates captured");
        } finally {
          setGettingLocation(false);
        }
      },
      () => {
        setGettingLocation(false);
        toast.error("Unable to get location");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  if (loading) {
    return <StitchLoadingPage label="Loading profile" />;
  }

  return (
    <>
      <StitchShell
        title="Profile"
        eyebrow="Account"
        actions={
          <>
            <button onClick={() => navigate("/customer")} className="stitch-button stitch-button-secondary">
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            {editing ? (
              <StitchButton onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4" />
                {saving ? "Saving" : "Save"}
              </StitchButton>
            ) : (
              <button onClick={() => setEditing(true)} className="stitch-button stitch-button-ghost">
                Edit
              </button>
            )}
          </>
        }
      >
        <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
          <div className="space-y-6">
            <StitchCard className="p-6 md:p-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-center">
                <div className="flex h-24 w-24 items-center justify-center rounded-[28px] bg-black text-4xl font-black text-white">
                  {initials}
                </div>
                <div className="space-y-2">
                  <p className="stitch-eyebrow">Member</p>
                  <h2 className="font-headline text-3xl font-black uppercase tracking-[-0.05em]">
                    {formData.name || user?.name || "User"}
                  </h2>
                  <p className="text-sm font-bold uppercase tracking-[0.16em] text-[var(--stitch-muted)]">
                    {user?.role || "customer"}
                  </p>
                </div>
              </div>
            </StitchCard>

            <div className="grid gap-4 sm:grid-cols-2">
              <StitchKpi label="Completed visits" value={String(stats.total_visits)} />
              <StitchKpi label="Credits left" value={String(stats.visits_available)} />
              <StitchKpi label="Spent" value={`Rs ${formatCurrency(stats.total_spent)}`} />
              <StitchKpi label="Bookings" value={String(stats.properties_viewed)} />
            </div>

            <StitchCard className="p-6">
              <button
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                className="stitch-button stitch-button-secondary w-full justify-center border-red-200 text-red-700"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </StitchCard>
          </div>

          <div className="space-y-6">
            <StitchCard className="p-6 md:p-8">
              <StitchSectionHeader title="Details" />
              <div className="mt-6 grid gap-4">
                <div className="rounded-[26px] border border-[var(--stitch-line)] bg-[var(--stitch-soft)] p-4">
                  <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[var(--stitch-muted)]">
                    <User2 className="h-4 w-4" />
                    Name
                  </div>
                  {editing ? (
                    <StitchInput
                      value={formData.name}
                      onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))}
                      placeholder="Name"
                    />
                  ) : (
                    <p className="text-lg font-black">{formData.name || "-"}</p>
                  )}
                </div>

                <div className="rounded-[26px] border border-[var(--stitch-line)] bg-[var(--stitch-soft)] p-4">
                  <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[var(--stitch-muted)]">
                    <Phone className="h-4 w-4" />
                    Phone
                  </div>
                  <p className="text-lg font-black">{user?.phone || "-"}</p>
                </div>

                <div className="rounded-[26px] border border-[var(--stitch-line)] bg-[var(--stitch-soft)] p-4">
                  <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[var(--stitch-muted)]">
                    <Mail className="h-4 w-4" />
                    Email
                  </div>
                  {editing ? (
                    <StitchInput
                      type="email"
                      value={formData.email}
                      onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))}
                      placeholder="Email"
                    />
                  ) : (
                    <p className="text-lg font-black">{formData.email || "-"}</p>
                  )}
                </div>

                <div className="rounded-[26px] border border-[var(--stitch-line)] bg-[var(--stitch-soft)] p-4">
                  <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[var(--stitch-muted)]">
                    <MapPin className="h-4 w-4" />
                    Address
                  </div>
                  {editing ? (
                    <div className="space-y-3">
                      <StitchInput
                        value={formData.address}
                        onChange={(event) =>
                          setFormData((current) => ({
                            ...current,
                            address: event.target.value,
                            address_lat: null,
                            address_lng: null,
                          }))
                        }
                        placeholder="Address"
                      />
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={getCurrentLocation}
                          disabled={gettingLocation}
                          className="stitch-button stitch-button-secondary"
                        >
                          <LocateFixed className="h-4 w-4" />
                          {gettingLocation ? "Locating" : "Use current location"}
                        </button>
                        {formData.address_lat ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-[0.16em] text-green-700">
                            <Check className="h-3.5 w-3.5" />
                            GPS saved
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ) : (
                    <p className="text-base font-bold leading-7">{formData.address || "-"}</p>
                  )}
                </div>
              </div>
            </StitchCard>

            <StitchCard className="p-6 md:p-8">
              <StitchSectionHeader title="Links" />
              <div className="mt-4">
                {menuItems.map((item, index) => (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`flex w-full items-center justify-between gap-4 px-1 py-4 text-left ${
                      index !== menuItems.length - 1 ? "border-b border-[var(--stitch-line)]" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--stitch-line)] bg-[var(--stitch-soft)]">
                        <item.icon className="h-4.5 w-4.5" />
                      </div>
                      <span className="text-sm font-black uppercase tracking-[0.08em]">{item.label}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-[var(--stitch-muted)]" />
                  </button>
                ))}
              </div>
            </StitchCard>
          </div>
        </div>
      </StitchShell>

      <StitchBottomDock items={navItems} />
    </>
  );
}
