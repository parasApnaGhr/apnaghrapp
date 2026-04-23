// @ts-nocheck
import React from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ChevronRight, Shield } from "lucide-react";
import { StitchCard, StitchSectionHeader, StitchShell } from "../stitch/components/StitchPrimitives";

const PRIVACY_POLICIES = {
  riders: {
    title: "Privacy Policy for Riders",
    lastUpdated: "April 2026",
    sections: [
      { title: "Information We Collect", content: ["Personal details, KYC documents, vehicle details, payout data, work activity, and GPS during active visits."] },
      { title: "How We Use It", content: ["Identity verification, visit assignment, payouts, communication, quality assurance, and compliance monitoring."] },
      { title: "Monitoring", content: ["Location, visits, and platform communication may be reviewed to detect bypass or misuse."] },
      { title: "Your Rights", content: ["You can request access, correction, account deletion, or consent withdrawal where applicable."] },
    ],
  },
  customers: {
    title: "Privacy Policy for Customers",
    lastUpdated: "April 2026",
    sections: [
      { title: "Information We Collect", content: ["Name, phone, email, visit history, property preferences, and payment data."] },
      { title: "How We Use It", content: ["Property matching, visit coordination, payment processing, notifications, and service improvement."] },
      { title: "Sharing", content: ["Relevant contact details may be shared with assigned riders or property stakeholders for visit coordination only."] },
      { title: "Your Rights", content: ["You can access, update, or delete your account data and opt out of non-essential communication."] },
    ],
  },
  sellers: {
    title: "Privacy Policy for Sellers",
    lastUpdated: "April 2026",
    sections: [
      { title: "Information We Collect", content: ["Identity details, property media, pricing, listing data, and inquiry history."] },
      { title: "How We Use It", content: ["Listing display, lead routing, verification, communication, and analytics."] },
      { title: "Lead Management", content: ["Customer leads remain platform-routed and are tracked for compliance and performance."] },
      { title: "Your Rights", content: ["You can update listing data, account information, and request listing removal."] },
    ],
  },
  builders: {
    title: "Privacy Policy for Builders",
    lastUpdated: "April 2026",
    sections: [
      { title: "Information We Collect", content: ["Business identity, authorized contacts, project media, pricing, amenities, and compliance data such as RERA."] },
      { title: "How We Use It", content: ["Project marketing, lead generation, project verification, and performance analytics."] },
      { title: "Lead Routing", content: ["Leads are routed and attributed through ApnaGhr systems."] },
      { title: "Security", content: ["Business documents and project records are stored with controlled access."] },
    ],
  },
  advertisers: {
    title: "Privacy Policy for Advertisers",
    lastUpdated: "April 2026",
    sections: [
      { title: "Information We Collect", content: ["Business identity, campaign creatives, targeting preferences, and performance metrics."] },
      { title: "How We Use It", content: ["Ad delivery, audience targeting, reporting, and billing."] },
      { title: "Performance Tracking", content: ["We track impressions, clicks, engagement, and campaign analytics."] },
      { title: "Your Rights", content: ["You can access campaign data, modify ads, pause campaigns, and request account deletion."] },
    ],
  },
};

export default function PrivacyPolicyPage({ role }) {
  const { role: paramRole } = useParams();
  const policyRole = role || paramRole || "customers";
  const policy = PRIVACY_POLICIES[policyRole] || PRIVACY_POLICIES.customers;

  return (
    <StitchShell
      title="Privacy"
      eyebrow="Policy"
      subtitle={`Last updated ${policy.lastUpdated}`}
      actions={
        <Link to="/legal" className="stitch-button stitch-button-secondary">
          <ArrowLeft className="h-4 w-4" />
          All policies
        </Link>
      }
    >
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <StitchCard className="p-6 md:p-8">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black text-white">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-3xl font-black uppercase tracking-[-0.05em]">{policy.title}</h2>
              <p className="mt-1 text-sm text-[var(--stitch-muted)]">{policy.lastUpdated}</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {Object.keys(PRIVACY_POLICIES).map((key) => (
              <Link
                key={key}
                to={`/privacy-policy-${key}`}
                className={`rounded-full px-4 py-3 text-xs font-black uppercase tracking-[0.16em] ${
                  policyRole === key ? "bg-black text-white" : "border border-[var(--stitch-line)] bg-[var(--stitch-soft)]"
                }`}
              >
                {key}
              </Link>
            ))}
          </div>
        </StitchCard>

        {policy.sections.map((section) => (
          <StitchCard key={section.title} className="p-6 md:p-8">
            <StitchSectionHeader title={section.title} />
            <div className="mt-5 space-y-3 text-sm leading-7 text-[var(--stitch-muted)]">
              {section.content.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </StitchCard>
        ))}

        <StitchCard className="p-6">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[var(--stitch-muted)]">
            <Link to="/" className="hover:text-black">Home</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link to="/legal" className="hover:text-black">Legal</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span>{policyRole}</span>
          </div>
        </StitchCard>
      </div>
    </StitchShell>
  );
}
