// @ts-nocheck
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Check, Eye, EyeOff, KeyRound, Lock, LogOut, Shield, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import {
  StitchButton,
  StitchCard,
  StitchInput,
  StitchSectionHeader,
  StitchShell,
} from "../stitch/components/StitchPrimitives";

export default function CustomerPrivacy() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const privacySettings = [
    {
      icon: Shield,
      title: "Terms accepted",
      description: user?.terms_accepted ? "Accepted" : "Pending",
      active: Boolean(user?.terms_accepted),
      action: () => navigate("/legal"),
    },
    {
      icon: Lock,
      title: "Account security",
      description: "Protected",
      active: true,
    },
    {
      icon: Smartphone,
      title: "Phone verified",
      description: user?.phone || "Not set",
      active: true,
    },
  ];

  const handleChangePassword = async (event) => {
    event.preventDefault();

    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error("Passwords do not match");
      return;
    }

    if (passwordData.new_password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/change-password", {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      });
      toast.success("Password changed");
      setShowPasswordForm(false);
      setPasswordData({ current_password: "", new_password: "", confirm_password: "" });
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <StitchShell
      title="Privacy"
      eyebrow="Security"
      actions={
        <button onClick={() => navigate("/customer/profile")} className="stitch-button stitch-button-secondary">
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
        <div className="space-y-6">
          <StitchCard className="p-6">
            <StitchSectionHeader title="Status" />
            <div className="mt-6 space-y-3">
              {privacySettings.map((item) => (
                <button
                  key={item.title}
                  onClick={item.action}
                  className={`flex w-full items-center gap-4 rounded-[26px] border p-4 text-left ${
                    item.active ? "border-[var(--stitch-line)] bg-[var(--stitch-soft)]" : "border-amber-300 bg-amber-50"
                  }`}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-black uppercase tracking-[0.08em]">{item.title}</p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-[var(--stitch-muted)]">{item.description}</p>
                  </div>
                  {item.active ? <Check className="h-4 w-4 text-green-700" /> : <AlertTriangle className="h-4 w-4 text-amber-700" />}
                </button>
              ))}
            </div>
          </StitchCard>

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

        <StitchCard className="p-6 md:p-8">
          <StitchSectionHeader title="Change password" />
          {!showPasswordForm ? (
            <div className="mt-6 rounded-[28px] border border-[var(--stitch-line)] bg-[var(--stitch-soft)] p-6">
              <p className="text-sm text-[var(--stitch-muted)]">Use a strong password for this account.</p>
              <StitchButton onClick={() => setShowPasswordForm(true)} className="mt-5">
                <KeyRound className="h-4 w-4" />
                Open form
              </StitchButton>
            </div>
          ) : (
            <form onSubmit={handleChangePassword} className="mt-6 grid gap-4">
              <div className="relative">
                <StitchInput
                  type={showPassword ? "text" : "password"}
                  value={passwordData.current_password}
                  onChange={(event) => setPasswordData((current) => ({ ...current, current_password: event.target.value }))}
                  placeholder="Current password"
                  className="pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--stitch-muted)]"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <StitchInput
                type="password"
                minLength={6}
                value={passwordData.new_password}
                onChange={(event) => setPasswordData((current) => ({ ...current, new_password: event.target.value }))}
                placeholder="New password"
              />
              <StitchInput
                type="password"
                value={passwordData.confirm_password}
                onChange={(event) => setPasswordData((current) => ({ ...current, confirm_password: event.target.value }))}
                placeholder="Confirm password"
              />
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordForm(false);
                    setPasswordData({ current_password: "", new_password: "", confirm_password: "" });
                  }}
                  className="stitch-button stitch-button-secondary"
                >
                  Cancel
                </button>
                <StitchButton type="submit" disabled={loading}>
                  {loading ? "Updating" : "Update password"}
                </StitchButton>
              </div>
            </form>
          )}
        </StitchCard>
      </div>
    </StitchShell>
  );
}
