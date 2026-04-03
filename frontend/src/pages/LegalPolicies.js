// Legal Policies Page - All ApnaGhr Terms & Policies
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Shield, FileText, Users, UserCheck, 
  Building2, AlertTriangle, Scale, MapPin, ChevronDown, ChevronUp, ExternalLink
} from 'lucide-react';

const LegalPolicies = () => {
  const navigate = useNavigate();
  const [expandedSection, setExpandedSection] = useState(null);

  const lastUpdated = "April 2026";
  const jurisdiction = "Bathinda, Punjab";

  const sections = [
    {
      id: 'privacy',
      title: '1. Privacy Policy',
      icon: Shield,
      content: `
ApnaGhr.com ("Company") respects your privacy.

**We collect the following data:**
• Name, phone number, email
• Location data (for real-time tracking and visit coordination)
• Device information
• Communication data (calls, messages within platform)

**Purpose of data collection:**
• Assign property visits
• Track field agents in real-time
• Improve service efficiency
• Prevent fraud and misuse

**Location Tracking:**
• Agents are tracked in real-time during active visits
• Customers may view agent location for ETA purposes
• Background location may be used for operational efficiency

**Data Protection:**
• We do not sell personal data
• Data is stored securely
• Only authorized personnel can access data

By using ApnaGhr, you consent to this data usage.
      `
    },
    {
      id: 'terms',
      title: '2. Terms & Conditions',
      icon: FileText,
      content: `
By using ApnaGhr.com, you agree:

• All property visits, negotiations, and deals must happen through the platform
• Users must not misuse contact details shared within the platform
• Any attempt to bypass the platform is strictly prohibited

**Platform Role:**
• ApnaGhr acts as a facilitator connecting customers, property owners, and riders
• The platform is not party to any rental or sale transaction
• All transactions should go through the system for proper tracking

**Strict Anti-Bypass Policy:**
• All communication regarding properties must go through ApnaGhr
• Direct dealing outside the platform is a breach of contract
• Platform reserves the right to monitor communications for compliance

**Account Suspension:**
• The Company reserves the right to suspend accounts for violations
• Suspension can occur without prior notice for serious violations
• All pending earnings may be forfeited upon violation

**The Company reserves the right to:**
• Suspend or terminate accounts
• Block access without notice
• Take legal action for violations
      `
    },
    {
      id: 'anti-circumvention',
      title: '3. Anti-Circumvention Policy (CORE CLAUSE)',
      icon: AlertTriangle,
      highlight: true,
      content: `
**This is a legally binding clause.**

Users (Customers, Agents, Dealers) agree:

**You SHALL NOT:**
• Contact property owners/clients directly outside the platform
• Negotiate or finalize deals without ApnaGhr involvement
• Share contact details to bypass platform commissions

**If any user attempts to bypass:**

**PENALTIES:**
• Immediate account suspension
• Permanent blacklisting
• Legal action under applicable laws
• Financial penalty: Minimum ₹50,000 or 2X the deal value (whichever is higher)

**COMPENSATION:**
• User must pay full brokerage/commission due to ApnaGhr
• Additional damages for business loss

**TRACKING & EVIDENCE:**
The Company may use:
• Call logs
• Visit data
• GPS tracking
• Chat records

These will be valid proof in legal proceedings.
      `
    },
    {
      id: 'agent',
      title: '4. Agent / Rider Agreement',
      icon: UserCheck,
      content: `
All field agents agree:

**DUTIES:**
• Attend assigned visits
• Maintain professionalism
• Update visit status honestly

**STRICT RULES:**
• No direct dealing with customers
• No sharing personal number for private deals
• No accepting cash outside platform

**If violated:**

**PENALTIES:**
• Immediate termination
• Forfeiture of earnings
• Fine up to ₹1,00,000
• Legal action for breach of contract

**NON-COMPETE / NON-CIRCUMVENT:**
• Agent cannot use ApnaGhr leads for personal benefit
• Any deal closed from ApnaGhr lead belongs to the Company
      `
    },
    {
      id: 'customer',
      title: '5. Customer Agreement',
      icon: Users,
      content: `
Customers agree:

• All bookings must be through ApnaGhr
• Direct dealing with agents/owners outside platform is prohibited

**If violated:**

**PENALTIES:**
• Account suspension
• Legal notice
• Compensation: Full brokerage + penalty up to ₹50,000+
      `
    },
    {
      id: 'dealer',
      title: '6. Dealer / Broker Policy',
      icon: Building2,
      content: `
Dealers agree:

• Leads provided by ApnaGhr are exclusive
• Cannot reuse leads outside platform

**Violation results in:**
• Blacklisting across network
• Legal recovery of losses
• Penalty up to ₹2,00,000+
      `
    },
    {
      id: 'liability',
      title: '7. Liability Disclaimer',
      icon: Scale,
      content: `
ApnaGhr is a platform connecting users.

• We do not guarantee deal closure
• We are not responsible for disputes between parties
• Users act at their own risk
      `
    },
    {
      id: 'jurisdiction',
      title: '8. Legal Jurisdiction',
      icon: MapPin,
      content: `
All disputes are subject to jurisdiction of:
**${jurisdiction}**

Any legal proceedings will be conducted under the laws applicable in this jurisdiction.

**Dispute Resolution:**
• Parties agree to first attempt amicable resolution
• If unresolved, matter shall be referred to courts in Bathinda, Punjab
• Indian laws shall govern all agreements
      `
    }
  ];

  // Privacy policy links for different roles
  const privacyLinks = [
    { role: 'riders', label: 'Riders', path: '/privacy-policy-riders' },
    { role: 'customers', label: 'Customers', path: '/privacy-policy-customers' },
    { role: 'sellers', label: 'Sellers', path: '/privacy-policy-sellers' },
    { role: 'builders', label: 'Builders', path: '/privacy-policy-builders' },
    { role: 'advertisers', label: 'Advertisers', path: '/privacy-policy-advertisers' },
  ];

  const toggleSection = (id) => {
    setExpandedSection(expandedSection === id ? null : id);
  };

  const formatContent = (content) => {
    return content.split('\n').map((line, idx) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return <p key={idx} className="font-bold text-[#04473C] mt-3 mb-1">{line.replace(/\*\*/g, '')}</p>;
      }
      if (line.startsWith('•')) {
        return <p key={idx} className="ml-4 text-[#4A4D53]">{line}</p>;
      }
      return <p key={idx} className="text-[#4A4D53]">{line}</p>;
    });
  };

  return (
    <div className="min-h-screen bg-[#F5F3F0]">
      {/* Header */}
      <div className="bg-[#04473C] text-white py-8">
        <div className="max-w-4xl mx-auto px-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>
            Legal Policies & Terms
          </h1>
          <p className="text-white/80 mt-2">
            ApnaGhr.com - Complete Legal Documentation
          </p>
          <p className="text-sm text-[#C6A87C] mt-2">
            Last Updated: {lastUpdated}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Quick Summary */}
        <div className="bg-white rounded-xl p-6 mb-6 border border-[#E5E1DB]">
          <h2 className="text-lg font-semibold text-[#04473C] mb-3">Important Notice</h2>
          <p className="text-[#4A4D53]">
            By using ApnaGhr.com, you agree to all terms and policies outlined below. 
            Please read carefully, especially the <strong>Anti-Circumvention Policy</strong> which 
            carries significant financial and legal penalties for violations.
          </p>
        </div>

        {/* Policy Sections */}
        <div className="space-y-4">
          {sections.map((section) => {
            const Icon = section.icon;
            const isExpanded = expandedSection === section.id;
            
            return (
              <motion.div
                key={section.id}
                layout
                className={`bg-white rounded-xl border ${
                  section.highlight ? 'border-red-300 shadow-red-100' : 'border-[#E5E1DB]'
                } overflow-hidden`}
              >
                <button
                  onClick={() => toggleSection(section.id)}
                  className={`w-full p-4 flex items-center justify-between text-left ${
                    section.highlight ? 'bg-red-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      section.highlight ? 'bg-red-500' : 'bg-[#04473C]'
                    }`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className={`font-semibold ${
                      section.highlight ? 'text-red-700' : 'text-[#04473C]'
                    }`}>
                      {section.title}
                    </span>
                    {section.highlight && (
                      <span className="text-xs bg-red-500 text-white px-2 py-1 rounded">
                        IMPORTANT
                      </span>
                    )}
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-[#4A4D53]" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-[#4A4D53]" />
                  )}
                </button>
                
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="px-4 pb-4 border-t border-[#E5E1DB]"
                  >
                    <div className="pt-4 space-y-1">
                      {formatContent(section.content)}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Modifications Notice */}
        <div className="mt-8 bg-[#04473C]/10 rounded-xl p-6 border border-[#04473C]/20">
          <h3 className="font-semibold text-[#04473C] mb-2">9. Modifications</h3>
          <p className="text-[#4A4D53]">
            ApnaGhr reserves the right to update policies anytime without prior notice.
            Continued use = acceptance of updated terms.
          </p>
        </div>

        {/* Role-Specific Privacy Policies */}
        <div className="mt-8 bg-white rounded-xl p-6 border border-[#E5E1DB]">
          <h3 className="font-semibold text-[#04473C] mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Role-Specific Privacy Policies
          </h3>
          <p className="text-[#4A4D53] mb-4">
            We have detailed privacy policies for each user type. Please review the policy applicable to you:
          </p>
          <div className="flex flex-wrap gap-3">
            {privacyLinks.map((link) => (
              <Link
                key={link.role}
                to={link.path}
                className="flex items-center gap-2 px-4 py-2 bg-[#04473C]/10 text-[#04473C] rounded-lg hover:bg-[#04473C]/20 transition-colors"
              >
                {link.label}
                <ExternalLink className="w-4 h-4" />
              </Link>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-[#4A4D53]">
          <p>© 2026 ApnaGhr.com. All Rights Reserved.</p>
          <p className="mt-1">For queries: support@apnaghr.com</p>
        </div>
      </div>
    </div>
  );
};

export default LegalPolicies;
