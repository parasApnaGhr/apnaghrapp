// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Car, Check, ChevronRight, CreditCard, LogOut, Mail, MapPin, Phone, Save, User2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import {
  StitchButton,
  StitchCard,
  StitchInput,
  StitchSectionHeader,
  StitchSelect,
  StitchShell,
} from "../stitch/components/StitchPrimitives";

export default function RiderProfile() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [bankAccount, setBankAccount] = useState(null);
  const [showBankForm, setShowBankForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    address: "",
    vehicle_type: "",
    vehicle_number: "",
  });
  const [bankData, setBankData] = useState({
    account_holder_name: "",
    account_number: "",
    ifsc_code: "",
    bank_name: "",
    upi_id: "",
  });

  const loadProfile = async () => {
    try {
      const response = await api.get("/rider/profile");
      setProfileData(response.data?.profile);
      setBankAccount(response.data?.bank_account);
      setFormData({
        name: response.data?.profile?.name || "",
        email: response.data?.profile?.email || "",
        address: response.data?.profile?.address || "",
        vehicle_type: response.data?.profile?.vehicle_type || "",
        vehicle_number: response.data?.profile?.vehicle_number || "",
      });

      if (response.data?.bank_account) {
        setBankData({
          account_holder_name: response.data.bank_account.account_holder_name || "",
          account_number: "",
          ifsc_code: response.data.bank_account.ifsc_code || "",
          bank_name: response.data.bank_account.bank_name || "",
          upi_id: response.data.bank_account.upi_id || "",
        });
      }
    } catch {
      toast.error("Failed to load rider profile");
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const initials = useMemo(() => (profileData?.name || "R").slice(0, 1).toUpperCase(), [profileData]);
  const isProfileComplete = profileData?.name && profileData?.vehicle_type && profileData?.vehicle_number;

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      await api.put("/rider/profile", formData);
      toast.success("Profile updated");
      setEditing(false);
      loadProfile();
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBankAccount = async (event) => {
    event.preventDefault();
    if (!bankData.account_holder_name || !bankData.account_number || !bankData.ifsc_code || !bankData.bank_name) {
      toast.error("Complete bank details first");
      return;
    }

    setLoading(true);
    try {
      await api.post("/rider/bank-account", bankData);
      toast.success("Bank account saved");
      setShowBankForm(false);
      loadProfile();
    } catch {
      toast.error("Failed to add bank account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <StitchShell
      title="Profile & Settlements"
      eyebrow="Field operations"
      subtitle="Manage your rider profile, vehicle details, and bank account for payouts."
      actions={
        <div className="flex gap-3">
          <StitchButton variant="secondary" onClick={() => navigate("/rider")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Rider Dashboard
          </StitchButton>
          {editing ? (
            <StitchButton onClick={handleSaveProfile} disabled={loading}>
              <Save className="mr-2 h-4 w-4" />
              {loading ? "Saving" : "Save Profile"}
            </StitchButton>
          ) : (
            <StitchButton onClick={() => setEditing(true)}>
              Edit Profile
            </StitchButton>
          )}
        </div>
      }
    >
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Column: Account Status & Vehicle */}
        <div className="lg:col-span-5 space-y-8">
          <section className="space-y-6">
            <StitchSectionHeader title="Account Status" />
            <StitchCard className="p-8">
              <div className="flex justify-between items-end mb-4">
                <span className="text-sm font-bold uppercase tracking-widest text-[var(--stitch-muted)]">Profile Completion</span>
                <span className="font-headline text-3xl font-black">{isProfileComplete ? "100%" : "80%"}</span>
              </div>
              <div className="w-full h-3 bg-[var(--stitch-line)] rounded-full overflow-hidden mb-8">
                <div 
                  className="h-full bg-[var(--stitch-ink)] transition-all duration-500" 
                  style={{ width: isProfileComplete ? "100%" : "80%" }}
                />
              </div>
              <ul className="space-y-4">
                <li className="flex items-center gap-4">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100">
                    <Check className="h-4 w-4 text-green-700" />
                  </div>
                  <span className="font-medium text-sm">Basic Information</span>
                </li>
                <li className="flex items-center gap-4">
                  <div className={`flex h-6 w-6 items-center justify-center rounded-full ${profileData?.vehicle_number ? 'bg-green-100' : 'bg-[var(--stitch-soft)] border border-[var(--stitch-line)]'}`}>
                    {profileData?.vehicle_number ? <Check className="h-4 w-4 text-green-700" /> : <div className="h-2 w-2 rounded-full bg-[var(--stitch-muted)]" />}
                  </div>
                  <span className={`font-medium text-sm ${!profileData?.vehicle_number ? 'text-[var(--stitch-muted)]' : ''}`}>Vehicle Registration</span>
                </li>
                <li className="flex items-center gap-4">
                  <div className={`flex h-6 w-6 items-center justify-center rounded-full ${bankAccount ? 'bg-green-100' : 'bg-[var(--stitch-soft)] border border-[var(--stitch-line)]'}`}>
                    {bankAccount ? <Check className="h-4 w-4 text-green-700" /> : <div className="h-2 w-2 rounded-full bg-[var(--stitch-muted)]" />}
                  </div>
                  <span className={`font-medium text-sm ${!bankAccount ? 'text-[var(--stitch-muted)]' : ''}`}>Settlement Account</span>
                </li>
              </ul>
            </StitchCard>
          </section>

          <section className="space-y-6">
            <StitchSectionHeader title="Vehicle" />
            <StitchCard className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="stitch-eyebrow">Vehicle Type</label>
                {editing ? (
                  <StitchSelect value={formData.vehicle_type} onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}>
                    <option value="">Select type</option>
                    <option value="Motorcycle">Motorcycle</option>
                    <option value="Scooter">Scooter</option>
                    <option value="Car">Car</option>
                  </StitchSelect>
                ) : (
                  <p className="font-headline text-xl font-black uppercase">{profileData?.vehicle_type || "Not Set"}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="stitch-eyebrow">Plate Number</label>
                {editing ? (
                  <StitchInput value={formData.vehicle_number} onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value.toUpperCase() })} placeholder="e.g. MH 12 AB 3456" />
                ) : (
                  <p className="font-headline text-xl font-black uppercase tracking-widest">{profileData?.vehicle_number || "Not Set"}</p>
                )}
              </div>
            </StitchCard>
          </section>
        </div>

        {/* Right Column: Payouts & Personal Info */}
        <div className="lg:col-span-7 space-y-8">
          <section className="space-y-6">
            <StitchSectionHeader title="Settlement Account" />
            <StitchCard className="p-8">
              {bankAccount ? (
                <div className="space-y-8">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-1 border-b border-[var(--stitch-line)] pb-4">
                      <p className="stitch-eyebrow">Account Number</p>
                      <p className="font-headline text-xl font-black tracking-[0.2em]">{bankAccount.account_number_masked}</p>
                    </div>
                    <div className="space-y-1 border-b border-[var(--stitch-line)] pb-4">
                      <p className="stitch-eyebrow">Bank Name</p>
                      <p className="font-bold">{bankAccount.bank_name}</p>
                    </div>
                    <div className="space-y-1 border-b border-[var(--stitch-line)] pb-4">
                      <p className="stitch-eyebrow">IFSC Code</p>
                      <p className="font-bold">{bankAccount.ifsc_code}</p>
                    </div>
                    <div className="space-y-1 border-b border-[var(--stitch-line)] pb-4">
                      <p className="stitch-eyebrow">UPI ID</p>
                      <p className="font-bold">{bankAccount.upi_id || "Not Set"}</p>
                    </div>
                  </div>

                  <div className="pt-4">
                    <div className="flex justify-between items-end mb-6">
                      <span className="text-sm font-bold uppercase tracking-widest text-[var(--stitch-muted)]">Available Balance</span>
                      <span className="font-headline text-5xl font-black leading-none text-[var(--stitch-ink)]">₹{wallet?.approved_earnings || 0}</span>
                    </div>
                    <StitchButton className="w-full py-6 text-lg justify-center shadow-lg" disabled={!wallet?.approved_earnings}>
                      WITHDRAW TO BANK
                    </StitchButton>
                    <p className="text-[10px] text-center text-[var(--stitch-muted)] uppercase font-bold mt-4 tracking-widest">
                      Standard settlement takes 1-2 business days.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center space-y-6">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[var(--stitch-soft)] text-[var(--stitch-muted)]">
                    <CreditCard className="h-10 w-10" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black uppercase">No Bank Account Linked</h3>
                    <p className="text-sm text-[var(--stitch-muted)] mt-1">Please add your bank details to receive payouts.</p>
                  </div>
                  <StitchButton onClick={() => setShowBankForm(true)}>
                    Link Bank Account
                  </StitchButton>
                </div>
              )}
            </StitchCard>
          </section>

          <section className="space-y-6">
            <StitchSectionHeader title="Personal Information" />
            <StitchCard className="p-8 grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="stitch-eyebrow">Full Name</label>
                {editing ? (
                  <StitchInput value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                ) : (
                  <p className="font-bold text-lg">{profileData?.name}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="stitch-eyebrow">Email Address</label>
                {editing ? (
                  <StitchInput type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                ) : (
                  <p className="font-bold text-lg">{profileData?.email}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="stitch-eyebrow">Mobile Number</label>
                <p className="font-bold text-lg">{profileData?.phone}</p>
              </div>
              <div className="space-y-2">
                <label className="stitch-eyebrow">Address</label>
                {editing ? (
                  <StitchInput value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
                ) : (
                  <p className="font-bold text-lg">{profileData?.address}</p>
                )}
              </div>
            </StitchCard>
          </section>

          <section>
            <StitchButton 
              variant="secondary" 
              className="w-full justify-center border-red-200 text-red-700 py-4"
              onClick={() => {
                logout();
                navigate("/");
              }}
            >
              <LogOut className="mr-2 h-5 w-5" />
              Logout from Device
            </StitchButton>
          </section>
        </div>
      </div>
    </StitchShell>
  );
}
