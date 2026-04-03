// Privacy Policy Pages - Role-specific privacy policies
import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { Home, Shield, ChevronRight, ArrowLeft } from 'lucide-react';

// Privacy policy content for different roles
const PRIVACY_POLICIES = {
  riders: {
    title: 'Privacy Policy for Riders',
    lastUpdated: 'April 2026',
    sections: [
      {
        title: 'Information We Collect',
        content: `As a Property Rider on ApnaGhr, we collect the following information:

**Personal Information:**
- Full name, phone number, and WhatsApp number
- City and preferred work areas
- Profile photo (selfie)

**Identity Verification (KYC):**
- Aadhaar Card
- PAN Card (optional)
- Driving License (if applicable)

**Work & Payment Information:**
- Vehicle details
- UPI ID and bank account details
- Work availability preferences

**Activity Data:**
- Visit completion records
- GPS location during active visits
- Customer ratings and feedback
- Earnings and transaction history`
      },
      {
        title: 'How We Use Your Information',
        content: `Your information is used for:

- **Account Verification:** To verify your identity and eligibility to work as a rider
- **Visit Assignment:** To match you with property visits based on your location and availability
- **Payment Processing:** To process your earnings and withdrawals
- **Communication:** To send visit requests, updates, and important notifications
- **Quality Assurance:** To maintain service quality through ratings and feedback
- **Compliance Monitoring:** To ensure adherence to platform policies and legal requirements
- **Anti-Bypass Protection:** To monitor for unauthorized direct dealings outside the platform`
      },
      {
        title: 'Data Security',
        content: `We implement industry-standard security measures:

- All data is encrypted in transit and at rest
- KYC documents are stored securely and access-restricted
- Regular security audits are conducted
- Access to personal data is limited to authorized personnel only
- We comply with applicable data protection regulations`
      },
      {
        title: 'Data Sharing',
        content: `We may share your information with:

- **Customers:** Your name, photo, and contact number are shared with customers for visit coordination
- **Service Providers:** Payment processors and cloud service providers
- **Legal Authorities:** When required by law or to protect our rights

We DO NOT sell your personal information to third parties for marketing purposes.`
      },
      {
        title: 'Activity Monitoring',
        content: `**Important Notice for Riders:**

As part of our commitment to platform integrity:

- Your location is tracked during active visits for customer safety
- Visit completion patterns are monitored
- Communication through the platform may be reviewed
- Suspicious activities that suggest bypassing the platform are flagged

Violations of platform policies, including direct dealings outside ApnaGhr, may result in:
- Temporary or permanent account suspension
- Forfeiture of pending earnings
- Legal action as per the agreements you accepted`
      },
      {
        title: 'Your Rights',
        content: `You have the right to:

- Access your personal data
- Request correction of inaccurate data
- Request deletion of your account (subject to pending obligations)
- Withdraw consent for optional data processing
- Lodge a complaint with relevant data protection authorities

To exercise these rights, contact us at privacy@apnaghrapp.in`
      },
      {
        title: 'Data Retention',
        content: `We retain your data:

- **Active Accounts:** For the duration of your engagement
- **Closed Accounts:** Up to 7 years for legal and tax compliance
- **KYC Documents:** As required by applicable regulations

You may request deletion of your account, but certain data may be retained for legal compliance.`
      }
    ]
  },
  customers: {
    title: 'Privacy Policy for Customers',
    lastUpdated: 'April 2026',
    sections: [
      {
        title: 'Information We Collect',
        content: `As a Customer on ApnaGhr, we collect:

**Personal Information:**
- Name and phone number
- Email address (optional)
- Preferred locations and property preferences

**Visit Information:**
- Properties you've shown interest in
- Visit history and feedback
- Payment information for bookings`
      },
      {
        title: 'How We Use Your Information',
        content: `Your information is used for:

- **Property Matching:** To show relevant properties based on your preferences
- **Visit Coordination:** To arrange and manage property visits
- **Payment Processing:** To process visit booking payments
- **Communication:** To send booking confirmations and updates
- **Service Improvement:** To enhance our platform based on feedback`
      },
      {
        title: 'Information Sharing',
        content: `Your contact information is shared with:

- **Assigned Riders:** Your name and phone number for visit coordination
- **Property Owners/Agents:** Only when necessary for visit arrangement

We DO NOT share your information with unauthorized third parties or use it for unsolicited marketing.`
      },
      {
        title: 'Data Security',
        content: `We protect your data through:

- Encryption of sensitive information
- Secure payment processing (PCI-DSS compliant)
- Regular security assessments
- Access controls for personnel`
      },
      {
        title: 'Your Rights',
        content: `You have the right to:

- Access your personal data
- Update your preferences
- Delete your account
- Opt-out of marketing communications

Contact us at privacy@apnaghrapp.in for any data-related requests.`
      }
    ]
  },
  sellers: {
    title: 'Privacy Policy for Property Sellers',
    lastUpdated: 'April 2026',
    sections: [
      {
        title: 'Information We Collect',
        content: `As a Property Seller on ApnaGhr, we collect:

**Personal Information:**
- Name, phone number, and email
- Identification documents for verification

**Property Information:**
- Property details, photos, and videos
- Location and address information
- Pricing and availability

**Business Information:**
- Transaction history
- Customer inquiry records`
      },
      {
        title: 'How We Use Your Information',
        content: `Your information is used for:

- **Property Listing:** To display your properties on the platform
- **Lead Management:** To route potential customer inquiries
- **Verification:** To verify property ownership and legitimacy
- **Communication:** To provide updates and platform notifications
- **Analytics:** To provide insights on property performance`
      },
      {
        title: 'Property Data Display',
        content: `Your property information is displayed on:

- ApnaGhr website and mobile app
- SEO pages for property discovery
- Marketing materials (with consent)

You control what information is publicly visible through your dashboard settings.`
      },
      {
        title: 'Lead Management',
        content: `**Important Notice:**

- All customer leads are routed through the ApnaGhr platform
- Direct contact with customers outside the platform is monitored
- Circumventing the platform for deals may result in penalties
- Leads and inquiries are tracked for quality assurance`
      },
      {
        title: 'Your Rights',
        content: `You have the right to:

- Access and update your property listings
- Modify your personal information
- Request removal of listings
- Access lead and inquiry data

Contact support@apnaghrapp.in for assistance.`
      }
    ]
  },
  builders: {
    title: 'Privacy Policy for Builders & Developers',
    lastUpdated: 'April 2026',
    sections: [
      {
        title: 'Information We Collect',
        content: `As a Builder/Developer on ApnaGhr, we collect:

**Business Information:**
- Company name and registration details
- Authorized representative information
- Contact details

**Project Information:**
- Project details, brochures, and media
- Pricing and inventory
- Location and amenities
- RERA registration details`
      },
      {
        title: 'How We Use Your Information',
        content: `Your information is used for:

- **Project Marketing:** To showcase your projects to potential buyers
- **Lead Generation:** To route interested customers to your sales team
- **Verification:** To verify project legitimacy and RERA compliance
- **Analytics:** To provide insights on project visibility and leads`
      },
      {
        title: 'Marketing & Display',
        content: `Your project data is used for:

- Listing on ApnaGhr platform
- SEO pages for organic discovery
- Featured promotions (as per your subscription)
- Email campaigns to interested users (with opt-in)`
      },
      {
        title: 'Lead Routing',
        content: `**Important Notice:**

- All leads are routed through the ApnaGhr system
- Lead tracking and attribution is maintained
- Attempts to bypass the platform may result in contract termination
- Lead quality and conversion are tracked`
      },
      {
        title: 'Data Security',
        content: `We ensure:

- Secure storage of business documents
- Controlled access to project data
- Regular security assessments
- Compliance with data protection regulations`
      }
    ]
  },
  advertisers: {
    title: 'Privacy Policy for Advertisers',
    lastUpdated: 'April 2026',
    sections: [
      {
        title: 'Information We Collect',
        content: `As an Advertiser on ApnaGhr, we collect:

**Business Information:**
- Company/individual name
- Contact details
- Business category

**Advertising Data:**
- Ad creatives and content
- Target audience preferences
- Campaign performance metrics`
      },
      {
        title: 'How We Use Your Information',
        content: `Your information is used for:

- **Ad Delivery:** To display your advertisements on the platform
- **Targeting:** To show ads to relevant audiences
- **Reporting:** To provide campaign performance analytics
- **Billing:** To process advertising payments`
      },
      {
        title: 'Ad Performance Tracking',
        content: `We track:

- Impressions and clicks
- User engagement metrics
- Conversion tracking (with proper setup)
- Audience demographics (aggregated)

This data is used to optimize ad delivery and provide you with performance reports.`
      },
      {
        title: 'Content Guidelines',
        content: `**Important Notice:**

- All advertisements are reviewed before publication
- Misleading or false advertisements are not allowed
- Ads must comply with applicable advertising standards
- Violations may result in ad removal and account suspension`
      },
      {
        title: 'Data Security',
        content: `We protect your advertising data through:

- Secure account access
- Encrypted data transmission
- Regular security audits
- Access controls for platform personnel`
      },
      {
        title: 'Your Rights',
        content: `You have the right to:

- Access your campaign data
- Modify or pause advertisements
- Request deletion of your advertiser account
- Export your performance data

Contact advertising@apnaghrapp.in for support.`
      }
    ]
  }
};

const PrivacyPolicyPage = ({ role }) => {
  const { role: paramRole } = useParams();
  const policyRole = role || paramRole || 'customers';
  const policy = PRIVACY_POLICIES[policyRole] || PRIVACY_POLICIES.customers;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <Home className="w-6 h-6 text-[#04473C]" />
              <span className="font-bold text-xl text-[#04473C]">ApnaGhr</span>
            </Link>
            <Link
              to="/legal"
              className="text-sm text-gray-600 hover:text-[#04473C] flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              All Policies
            </Link>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-600">
            <Link to="/" className="hover:text-[#04473C]">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <Link to="/legal" className="hover:text-[#04473C]">Legal</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900">Privacy Policy - {policyRole.charAt(0).toUpperCase() + policyRole.slice(1)}</span>
          </nav>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-10">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-200">
            <div className="w-14 h-14 bg-[#04473C]/10 rounded-xl flex items-center justify-center">
              <Shield className="w-7 h-7 text-[#04473C]" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{policy.title}</h1>
              <p className="text-gray-600">Last Updated: {policy.lastUpdated}</p>
            </div>
          </div>

          {/* Role Navigation */}
          <div className="mb-8 flex flex-wrap gap-2">
            {Object.keys(PRIVACY_POLICIES).map((key) => (
              <Link
                key={key}
                to={`/privacy-policy-${key}`}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  policyRole === key
                    ? 'bg-[#04473C] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </Link>
            ))}
          </div>

          {/* Content */}
          <div className="space-y-8">
            {policy.sections.map((section, index) => (
              <section key={index}>
                <h2 className="text-xl font-bold text-gray-900 mb-4">{section.title}</h2>
                <div className="prose prose-gray max-w-none">
                  {section.content.split('\n\n').map((paragraph, pIndex) => (
                    <div key={pIndex} className="mb-4">
                      {paragraph.split('\n').map((line, lIndex) => {
                        if (line.startsWith('**') && line.endsWith('**')) {
                          return <h3 key={lIndex} className="font-semibold text-gray-800 mt-4 mb-2">{line.replace(/\*\*/g, '')}</h3>;
                        }
                        if (line.startsWith('- ')) {
                          return <li key={lIndex} className="text-gray-700 ml-4">{line.substring(2)}</li>;
                        }
                        return <p key={lIndex} className="text-gray-700">{line}</p>;
                      })}
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {/* Contact */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-gray-700 mb-4">
              If you have any questions about this Privacy Policy, please contact us:
            </p>
            <ul className="text-gray-700 space-y-2">
              <li><strong>Email:</strong> privacy@apnaghrapp.in</li>
              <li><strong>Support:</strong> support@apnaghrapp.in</li>
              <li><strong>Address:</strong> ApnaGhr, Bathinda, Punjab, India</li>
            </ul>
          </div>

          {/* Jurisdiction */}
          <div className="mt-8 p-4 bg-gray-50 rounded-xl">
            <p className="text-sm text-gray-600">
              <strong>Jurisdiction:</strong> This Privacy Policy is governed by the laws of India. 
              Any disputes shall be subject to the exclusive jurisdiction of the courts in Bathinda, Punjab.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="max-w-4xl mx-auto px-4 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} ApnaGhr. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPolicyPage;
