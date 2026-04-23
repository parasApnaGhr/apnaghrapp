// @ts-nocheck
import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Briefcase, ChevronRight, Eye, EyeOff, KeyRound, Lock, Mail, Phone, User } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import api, { authAPI, sellerAPI } from "../utils/api";
import TermsAcceptanceModal from "../components/TermsAcceptanceModal";
import {
  StitchButton,
  StitchCard,
  StitchInput,
  StitchSectionHeader,
  StitchShell,
} from "../stitch/components/StitchPrimitives";
import { getGreeting } from "../stitch/utils";

const baseForm = {
  name: "",
  phone: "",
  email: "",
  password: "",
  role: "customer",
  city: "",
};

const baseForgot = {
  phone: "",
  otp: "",
  newPassword: "",
  confirmPassword: "",
  method: "sms",
};

const roleOptions = [
  { value: "customer", label: "Find a home", detail: "Book guided visits" },
  { value: "seller", label: "Join as seller", detail: "Share properties and earn" },
  { value: "advertiser", label: "Advertise", detail: "Promote your business" },
  { value: "builder", label: "Builder", detail: "List and manage inventory" },
];

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [formData, setFormData] = useState(baseForm);
  const [forgotData, setForgotData] = useState(baseForgot);
  const [pendingUser, setPendingUser] = useState(null);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [searchParams] = useSearchParams();

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const redirectUrl = searchParams.get("redirect");
  const greeting = useMemo(() => getGreeting(), []);

  const validatePhone = (phone: string) => /^[6-9]\d{9}$/.test(phone);
  const validatePassword = (password: string) => password.length >= 6;

  const normalizePhone = (value: string) => {
    let clean = value.replace(/\D/g, "");
    if (clean.startsWith("91") && clean.length > 10) clean = clean.slice(2);
    return clean.slice(0, 10);
  };

  const navigateAfterLogin = (user: any) => {
    if (redirectUrl && ["customer", "advertiser", "builder"].includes(user.role)) {
      navigate(redirectUrl);
      return;
    }

    if (user.role === "rider") navigate("/rider");
    else if (user.role === "seller") navigate("/seller");
    else if (["admin", "support_admin", "inventory_admin", "rider_admin"].includes(user.role)) navigate("/admin");
    else if (user.role === "builder") navigate("/builder");
    else navigate("/customer");
  };

  const handleTermsAccepted = async () => {
    try {
      await authAPI.acceptTerms({
        accepted_terms: true,
        accepted_privacy: true,
        accepted_anti_circumvention: true,
      });
      setShowTermsModal(false);
      if (pendingUser) {
        navigateAfterLogin(pendingUser);
        setPendingUser(null);
      }
      toast.success("Terms accepted.");
    } catch {
      toast.error("Failed to save terms acceptance.");
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validatePhone(formData.phone)) {
      toast.error("Enter a valid 10-digit Indian mobile number.");
      return;
    }

    if (!validatePassword(formData.password)) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    if (isRegister && !formData.name.trim()) {
      toast.error("Full name is required.");
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        if (formData.role === "seller") {
          const response = await sellerAPI.register({
            name: formData.name,
            phone: formData.phone,
            email: formData.email,
            password: formData.password,
            city: formData.city || "",
            experience_years: 0,
          });
          toast.success(response.data.message || "Seller registration submitted for approval.");
        } else {
          await register(formData);
          toast.success("Account created. Sign in to continue.");
        }
        setFormData(baseForm);
        setIsRegister(false);
        return;
      }

      const user = await login(formData.phone, formData.password);
      if ((user.role === "customer" || user.role === "rider") && !user.terms_accepted) {
        setPendingUser(user);
        setShowTermsModal(true);
        toast.info("Accept terms to continue.");
        return;
      }

      navigateAfterLogin(user);
      toast.success(`Welcome back, ${user.name || "User"}.`);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  const requestOtp = async () => {
    if (!validatePhone(forgotData.phone)) {
      toast.error("Enter a valid phone number.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/auth/forgot-password", {
        phone: forgotData.phone,
        method: forgotData.method,
      });
      if (response.data?.otp_for_testing) {
        toast.success(`OTP sent. Dev OTP: ${response.data.otp_for_testing}`);
      } else {
        toast.success("OTP sent.");
      }
      setForgotStep(2);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setLoading(true);
    try {
      await api.post("/auth/verify-otp", {
        phone: forgotData.phone,
        otp: forgotData.otp,
      });
      toast.success("OTP verified.");
      setForgotStep(3);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "OTP verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!validatePassword(forgotData.newPassword)) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    if (forgotData.newPassword !== forgotData.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/reset-password", {
        phone: forgotData.phone,
        otp: forgotData.otp,
        new_password: forgotData.newPassword,
      });
      toast.success("Password reset. Sign in with the new password.");
      setForgotMode(false);
      setForgotStep(1);
      setForgotData(baseForgot);
      setFormData((current) => ({ ...current, phone: forgotData.phone, password: "" }));
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  const heroStats = [
    { label: "Cities", value: "60+" },
    { label: "Riders", value: "500+" },
    { label: "Daily potential", value: "₹2000" },
  ];

  return (
    <>
      <StitchShell
        title={forgotMode ? "Recover Access" : isRegister ? "Create Account" : "Sign In"}
        eyebrow={greeting}
        actions={
          <div className="flex gap-2">
            <Link to="/join-as-rider" className="stitch-button stitch-button-secondary">
              Become a Rider
            </Link>
            <Link to="/earn-money-by-visiting-properties" className="stitch-button stitch-button-ghost">
              Learn more
            </Link>
          </div>
        }
      >
        <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <StitchCard className="grid gap-6 overflow-hidden p-6 md:grid-cols-[1.2fr_0.8fr] md:p-8">
            <div className="flex flex-col justify-between gap-8">
              <div className="space-y-3">
                <p className="stitch-eyebrow">Property visit platform</p>
                <h2 className="font-headline text-4xl font-black uppercase leading-none tracking-[-0.08em] md:text-6xl">
                  Find your
                  <br />
                  next move
                  <br />
                  faster.
                </h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {heroStats.map((stat) => (
                  <div key={stat.label} className="rounded-[24px] border border-[var(--stitch-line)] bg-[var(--stitch-soft)] p-4">
                    <p className="text-3xl font-black tracking-[-0.06em]">{stat.value}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--stitch-muted)]">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-4">
              <div className="relative overflow-hidden rounded-[28px] border border-[var(--stitch-line)] bg-black p-5 text-white">
                <p className="stitch-eyebrow !text-white/60">Live ops</p>
                <p className="mt-2 text-2xl font-black uppercase tracking-[-0.04em]">Seller approvals. rider ops. visit tracking.</p>
                <div className="mt-6 h-44 rounded-[20px] bg-[url('https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1200&q=80')] bg-cover bg-center grayscale" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[24px] border border-[var(--stitch-line)] bg-white p-4">
                  <p className="stitch-eyebrow">Role aware</p>
                  <p className="mt-2 text-sm text-[var(--stitch-muted)]">Role-based sign in.</p>
                </div>
                <div className="rounded-[24px] border border-[var(--stitch-line)] bg-white p-4">
                  <p className="stitch-eyebrow">Resilient</p>
                  <p className="mt-2 text-sm text-[var(--stitch-muted)]">OTP, terms, and approvals stay connected.</p>
                </div>
              </div>
            </div>
          </StitchCard>

          <StitchCard className="p-6 md:p-8">
            <AnimatePresence mode="wait">
              {forgotMode ? (
                <motion.div
                  key={`forgot-${forgotStep}`}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  className="space-y-6"
                >
                  <button
                    onClick={() => {
                      setForgotMode(false);
                      setForgotStep(1);
                    }}
                    className="flex items-center gap-2 text-sm text-[var(--stitch-muted)]"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to sign in
                  </button>

                  <StitchSectionHeader
                    eyebrow="Recovery"
                    title={forgotStep === 1 ? "Request OTP" : forgotStep === 2 ? "Verify code" : "Set new password"}
                  />

                  {forgotStep === 1 ? (
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-bold uppercase tracking-[0.16em]">Phone number</label>
                        <div className="relative">
                          <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--stitch-muted)]" />
                          <StitchInput
                            value={forgotData.phone}
                            onChange={(event) => setForgotData((current) => ({ ...current, phone: normalizePhone(event.target.value) }))}
                            placeholder="Enter registered mobile number"
                            className="pl-11"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {["sms", "email"].map((method) => (
                          <button
                            key={method}
                            type="button"
                            onClick={() => setForgotData((current) => ({ ...current, method }))}
                            className={`rounded-[22px] border px-4 py-3 text-sm font-bold uppercase tracking-[0.16em] ${
                              forgotData.method === method
                                ? "border-black bg-black text-white"
                                : "border-[var(--stitch-line)] bg-white"
                            }`}
                          >
                            {method}
                          </button>
                        ))}
                      </div>
                      <StitchButton onClick={requestOtp} disabled={loading} className="w-full">
                        <KeyRound className="h-4 w-4" />
                        {loading ? "Sending" : "Send OTP"}
                      </StitchButton>
                    </div>
                  ) : null}

                  {forgotStep === 2 ? (
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-bold uppercase tracking-[0.16em]">OTP</label>
                        <StitchInput
                          value={forgotData.otp}
                          onChange={(event) => setForgotData((current) => ({ ...current, otp: event.target.value.replace(/\D/g, "").slice(0, 6) }))}
                          placeholder="000000"
                          className="text-center text-2xl tracking-[0.5em]"
                        />
                      </div>
                      <StitchButton onClick={verifyOtp} disabled={loading} className="w-full">
                        {loading ? "Verifying" : "Verify OTP"}
                      </StitchButton>
                    </div>
                  ) : null}

                  {forgotStep === 3 ? (
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-bold uppercase tracking-[0.16em]">New password</label>
                        <StitchInput
                          type="password"
                          value={forgotData.newPassword}
                          onChange={(event) => setForgotData((current) => ({ ...current, newPassword: event.target.value }))}
                          placeholder="Minimum 6 characters"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase tracking-[0.16em]">Confirm password</label>
                        <StitchInput
                          type="password"
                          value={forgotData.confirmPassword}
                          onChange={(event) => setForgotData((current) => ({ ...current, confirmPassword: event.target.value }))}
                          placeholder="Repeat new password"
                        />
                      </div>
                      <StitchButton onClick={resetPassword} disabled={loading} className="w-full">
                        {loading ? "Saving" : "Reset password"}
                      </StitchButton>
                    </div>
                  ) : null}
                </motion.div>
              ) : (
                <motion.form
                  key={isRegister ? "register" : "login"}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  onSubmit={handleSubmit}
                  className="space-y-5"
                >
                  <StitchSectionHeader
                    eyebrow={isRegister ? "Registration" : "Access"}
                    title={isRegister ? "Create your workspace" : "Sign in to continue"}
                  />

                  {isRegister ? (
                    <div>
                      <label className="text-xs font-bold uppercase tracking-[0.16em]">Full name</label>
                      <div className="relative">
                        <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--stitch-muted)]" />
                        <StitchInput
                          value={formData.name}
                          onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))}
                          placeholder="Your full name"
                          className="pl-11"
                        />
                      </div>
                    </div>
                  ) : null}

                  <div>
                    <label className="text-xs font-bold uppercase tracking-[0.16em]">Phone number</label>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--stitch-muted)]" />
                      <StitchInput
                        value={formData.phone}
                        onChange={(event) => setFormData((current) => ({ ...current, phone: normalizePhone(event.target.value) }))}
                        placeholder="Enter mobile number"
                        className="pl-11"
                      />
                    </div>
                  </div>

                  {isRegister ? (
                    <div>
                      <label className="text-xs font-bold uppercase tracking-[0.16em]">Email</label>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--stitch-muted)]" />
                        <StitchInput
                          value={formData.email}
                          onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))}
                          placeholder="Optional email"
                          className="pl-11"
                        />
                      </div>
                    </div>
                  ) : null}

                  {isRegister ? (
                    <div>
                      <label className="text-xs font-bold uppercase tracking-[0.16em]">Role</label>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {roleOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setFormData((current) => ({ ...current, role: option.value }))}
                            className={`rounded-[24px] border p-4 text-left transition ${
                              formData.role === option.value ? "border-black bg-black text-white" : "border-[var(--stitch-line)] bg-white"
                            }`}
                          >
                            <p className="text-sm font-black uppercase tracking-[0.12em]">{option.label}</p>
                            <p className={`mt-2 text-xs ${formData.role === option.value ? "text-white/70" : "text-[var(--stitch-muted)]"}`}>{option.detail}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {isRegister && formData.role === "seller" ? (
                    <div>
                      <label className="text-xs font-bold uppercase tracking-[0.16em]">Seller city</label>
                      <StitchInput
                        value={formData.city}
                        onChange={(event) => setFormData((current) => ({ ...current, city: event.target.value }))}
                        placeholder="City used for seller approval"
                      />
                    </div>
                  ) : null}

                  <div>
                    <label className="text-xs font-bold uppercase tracking-[0.16em]">Password</label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--stitch-muted)]" />
                      <StitchInput
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(event) => setFormData((current) => ({ ...current, password: event.target.value }))}
                        placeholder={isRegister ? "Create a password" : "Enter your password"}
                        className="pl-11 pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((current) => !current)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--stitch-muted)]"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <StitchButton type="submit" disabled={loading} className="w-full">
                    {loading ? "Working" : isRegister ? "Create account" : "Sign in"}
                    <ChevronRight className="h-4 w-4" />
                  </StitchButton>

                  <div className="flex flex-col gap-3 border-t border-[var(--stitch-line)] pt-4 text-sm text-[var(--stitch-muted)]">
                    {!isRegister ? (
                      <button type="button" onClick={() => setForgotMode(true)} className="text-left">
                        Forgot password?
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => {
                        setIsRegister((current) => !current);
                        setFormData(baseForm);
                      }}
                      className="text-left font-semibold text-[var(--stitch-ink)]"
                    >
                      {isRegister ? "Already have an account? Sign in" : "Need an account? Register"}
                    </button>
                    <p>
                      By continuing you agree to the <Link to="/legal" className="font-semibold text-[var(--stitch-ink)]">terms and privacy policy</Link>.
                    </p>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </StitchCard>
        </div>
      </StitchShell>

      <TermsAcceptanceModal
        isOpen={showTermsModal}
        onAccept={handleTermsAccepted}
        onDecline={() => {
          setShowTermsModal(false);
          toast.error("You must accept the terms to continue.");
        }}
        userType={formData.role}
        context={isRegister ? "registration" : "login"}
      />
    </>
  );
}
