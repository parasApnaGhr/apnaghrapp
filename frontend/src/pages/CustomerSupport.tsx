// @ts-nocheck
import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ExternalLink, FileText, HelpCircle, Mail, MessageCircle, Phone } from "lucide-react";
import { StitchCard, StitchSectionHeader, StitchShell } from "../stitch/components/StitchPrimitives";

const faqItems = [
  {
    question: "How do I book a property visit?",
    answer: "Browse properties, add them to cart, choose a package, schedule a slot, and complete payment.",
  },
  {
    question: "How do I track my rider?",
    answer: "Open My Bookings after a rider is assigned to view live tracking and status updates.",
  },
  {
    question: "Can I cancel or reschedule a visit?",
    answer: "Modify plans before the rider starts. If that window has passed, contact support.",
  },
  {
    question: "What payment methods are accepted?",
    answer: "UPI, cards, net banking, and wallets are supported through Cashfree.",
  },
  {
    question: "What is the anti-circumvention policy?",
    answer: "Property visits and follow-up dealing must stay inside ApnaGhr workflows.",
  },
];

const contactOptions = [
  {
    icon: Phone,
    title: "Call",
    subtitle: "+91 98150-87635",
    action: () => window.open("tel:+919815087635", "_self"),
  },
  {
    icon: MessageCircle,
    title: "WhatsApp",
    subtitle: "Fastest response",
    action: () => window.open("https://wa.me/919815087635?text=Hi, I need help with ApnaGhr", "_blank"),
  },
  {
    icon: Mail,
    title: "Email",
    subtitle: "support@apnaghr.in",
    action: () => window.open("mailto:support@apnaghr.in", "_blank"),
  },
];

export default function CustomerSupport() {
  const navigate = useNavigate();

  return (
    <StitchShell
      title="Support"
      eyebrow="Help center"
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
            <StitchSectionHeader title="Contact" />
            <div className="mt-6 grid gap-3">
              {contactOptions.map((option) => (
                <button
                  key={option.title}
                  onClick={option.action}
                  className="flex items-center gap-4 rounded-[26px] border border-[var(--stitch-line)] bg-[var(--stitch-soft)] p-4 text-left transition hover:bg-white"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white">
                    <option.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.08em]">{option.title}</p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-[var(--stitch-muted)]">{option.subtitle}</p>
                  </div>
                </button>
              ))}
            </div>
          </StitchCard>

          <StitchCard className="p-6">
            <button
              onClick={() => navigate("/legal")}
              className="flex w-full items-center justify-between gap-4 rounded-[26px] border border-[var(--stitch-line)] bg-[var(--stitch-soft)] p-4 text-left"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5" />
                <span className="text-sm font-black uppercase tracking-[0.08em]">Terms and policies</span>
              </div>
              <ExternalLink className="h-4 w-4" />
            </button>
          </StitchCard>
        </div>

        <StitchCard className="p-6 md:p-8">
          <StitchSectionHeader title="FAQ" />
          <div className="mt-6 space-y-3">
            {faqItems.map((item) => (
              <details key={item.question} className="rounded-[26px] border border-[var(--stitch-line)] bg-white p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                  <span className="text-sm font-black uppercase tracking-[0.08em]">{item.question}</span>
                  <HelpCircle className="h-4 w-4 shrink-0" />
                </summary>
                <p className="mt-4 text-sm leading-7 text-[var(--stitch-muted)]">{item.answer}</p>
              </details>
            ))}
          </div>
        </StitchCard>
      </div>
    </StitchShell>
  );
}
