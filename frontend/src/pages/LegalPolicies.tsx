// @ts-nocheck
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Building2, ChevronDown, ChevronUp, ExternalLink, FileText, MapPin, Scale, Shield, UserCheck, Users } from "lucide-react";
import { StitchCard, StitchSectionHeader, StitchShell } from "../stitch/components/StitchPrimitives";

const lastUpdated = "April 2026";
const jurisdiction = "Bathinda, Punjab";

const sections = [
  {
    id: "privacy",
    title: "Privacy Policy",
    icon: Shield,
    content: [
      "We collect name, phone, email, device data, communication records, and operational location data where needed for visits and tracking.",
      "Data is used for visit assignment, service operations, fraud prevention, compliance, and platform quality.",
      "We do not sell personal data. Access is limited to authorized personnel.",
    ],
  },
  {
    id: "terms",
    title: "Terms and Conditions",
    icon: FileText,
    content: [
      "Property visits, negotiations, and deal flows must remain inside platform workflows.",
      "ApnaGhr acts as a facilitator and may suspend or terminate accounts for violations.",
      "Direct off-platform dealing is treated as a contract breach.",
    ],
  },
  {
    id: "anti-circumvention",
    title: "Anti-Circumvention Policy",
    icon: AlertTriangle,
    highlight: true,
    content: [
      "Users must not contact owners or clients directly to bypass the platform.",
      "Violations can lead to suspension, blacklisting, legal action, and financial penalties.",
      "Call logs, GPS records, visit data, and platform chat may be used as evidence.",
    ],
  },
  {
    id: "agent",
    title: "Agent and Rider Agreement",
    icon: UserCheck,
    content: [
      "Riders must attend assigned visits, update status honestly, and avoid private dealing.",
      "Cash collection or personal side deals are prohibited.",
      "Violations may lead to termination, loss of earnings, and fines.",
    ],
  },
  {
    id: "customer",
    title: "Customer Agreement",
    icon: Users,
    content: [
      "Customers agree to book and coordinate through ApnaGhr.",
      "Direct off-platform dealing may result in suspension, legal notice, and compensation claims.",
    ],
  },
  {
    id: "dealer",
    title: "Dealer and Broker Policy",
    icon: Building2,
    content: [
      "ApnaGhr leads are exclusive to the platform workflow.",
      "Reusing or diverting leads outside the system can result in blacklisting and recovery action.",
    ],
  },
  {
    id: "liability",
    title: "Liability Disclaimer",
    icon: Scale,
    content: [
      "ApnaGhr connects users but does not guarantee deal closure.",
      "Users remain responsible for their own conduct and external disputes.",
    ],
  },
  {
    id: "jurisdiction",
    title: "Legal Jurisdiction",
    icon: MapPin,
    content: [
      `All disputes are subject to ${jurisdiction}.`,
      "Indian law governs the platform terms and related disputes.",
    ],
  },
];

const privacyLinks = [
  { role: "riders", label: "Riders", path: "/privacy-policy-riders" },
  { role: "customers", label: "Customers", path: "/privacy-policy-customers" },
  { role: "sellers", label: "Sellers", path: "/privacy-policy-sellers" },
  { role: "builders", label: "Builders", path: "/privacy-policy-builders" },
  { role: "advertisers", label: "Advertisers", path: "/privacy-policy-advertisers" },
];

export default function LegalPolicies() {
  const navigate = useNavigate();
  const [expandedSection, setExpandedSection] = useState("anti-circumvention");

  return (
    <StitchShell
      title="Legal"
      eyebrow="Policies"
      subtitle={`Last updated ${lastUpdated}`}
      actions={
        <button onClick={() => navigate(-1)} className="stitch-button stitch-button-secondary">
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      }
    >
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <StitchCard className="p-6 md:p-8">
          <StitchSectionHeader title="Important Notice" />
          <p className="mt-5 text-sm leading-7 text-[var(--stitch-muted)]">
            Using ApnaGhr means you agree to the policy set below. The anti-circumvention clause is a core operational term.
          </p>
        </StitchCard>

        <div className="space-y-4">
          {sections.map((section) => {
            const Icon = section.icon;
            const isOpen = expandedSection === section.id;

            return (
              <StitchCard
                key={section.id}
                className={`overflow-hidden p-0 ${section.highlight ? "border-red-300 shadow-[0_0_0_1px_rgba(220,38,38,0.15)]" : ""}`}
              >
                <button
                  onClick={() => setExpandedSection(isOpen ? null : section.id)}
                  className={`flex w-full items-center justify-between gap-4 px-5 py-5 text-left ${section.highlight ? "bg-red-50" : ""}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-full ${section.highlight ? "bg-red-600 text-white" : "bg-black text-white"}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-black uppercase tracking-[0.08em]">{section.title}</span>
                      {section.highlight ? (
                        <span className="rounded-full bg-red-600 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-white">
                          Important
                        </span>
                      ) : null}
                    </div>
                  </div>
                  {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>

                {isOpen ? (
                  <div className="border-t border-[var(--stitch-line)] px-5 py-5">
                    <div className="space-y-3 text-sm leading-7 text-[var(--stitch-muted)]">
                      {section.content.map((line) => (
                        <p key={line}>{line}</p>
                      ))}
                    </div>
                  </div>
                ) : null}
              </StitchCard>
            );
          })}
        </div>

        <StitchCard className="p-6 md:p-8">
          <StitchSectionHeader title="Role-Specific Privacy Policies" />
          <div className="mt-5 flex flex-wrap gap-3">
            {privacyLinks.map((link) => (
              <Link
                key={link.role}
                to={link.path}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--stitch-line)] bg-[var(--stitch-soft)] px-4 py-3 text-xs font-black uppercase tracking-[0.16em] transition hover:bg-white"
              >
                {link.label}
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            ))}
          </div>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-[var(--stitch-muted)]">
            Jurisdiction: {jurisdiction}
          </p>
        </StitchCard>
      </div>
    </StitchShell>
  );
}
