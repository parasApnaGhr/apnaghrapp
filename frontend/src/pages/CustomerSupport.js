import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, HelpCircle, MessageCircle, Phone, Mail,
  FileText, ChevronRight, ExternalLink
} from 'lucide-react';

const CustomerSupport = () => {
  const navigate = useNavigate();

  const faqItems = [
    {
      question: 'How do I book a property visit?',
      answer: 'Browse properties, add them to your cart, select a visit package, choose date/time, and complete payment. Our rider will pick you up at the scheduled time.'
    },
    {
      question: 'What is the Anti-Circumvention Policy?',
      answer: 'To protect all parties, direct dealing with property owners/agents outside ApnaGhr is prohibited. Violation may result in penalties up to ₹50,000 or 2X the deal value.'
    },
    {
      question: 'How do I track my rider?',
      answer: 'Once a rider accepts your visit, you can track their real-time location from the My Bookings page. You\'ll also receive notifications as they approach.'
    },
    {
      question: 'Can I cancel or reschedule a visit?',
      answer: 'Yes, you can modify visit details before the rider starts the journey. Contact support for cancellations and refunds.'
    },
    {
      question: 'What payment methods are accepted?',
      answer: 'We accept UPI, Credit/Debit Cards, Net Banking, and Wallets through our secure Cashfree payment gateway.'
    }
  ];

  const contactOptions = [
    {
      icon: Phone,
      title: 'Call Us',
      subtitle: '+91 98150-87635',
      action: () => window.open('tel:+919815087635', '_self')
    },
    {
      icon: MessageCircle,
      title: 'WhatsApp',
      subtitle: 'Quick response',
      action: () => window.open('https://wa.me/919815087635?text=Hi, I need help with ApnaGhr', '_blank')
    },
    {
      icon: Mail,
      title: 'Email',
      subtitle: 'support@apnaghr.in',
      action: () => window.open('mailto:support@apnaghr.in', '_blank')
    }
  ];

  return (
    <div className="min-h-screen bg-[#FDFCFB] pb-24">
      {/* Header */}
      <header className="glass-header sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/customer/profile')}
              className="p-2 hover:bg-[#F5F3F0] transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-[#1A1C20]" strokeWidth={1.5} />
            </button>
            <h1 className="text-xl font-medium" style={{ fontFamily: 'Playfair Display, serif' }}>
              Help & Support
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        {/* Contact Options */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-3 gap-4 mb-8"
        >
          {contactOptions.map((option, index) => (
            <button
              key={index}
              onClick={option.action}
              className="bg-white border border-[#E5E1DB] p-4 text-center hover:border-[#04473C] transition-colors"
            >
              <div className="w-12 h-12 mx-auto mb-3 bg-[#E6F0EE] flex items-center justify-center">
                <option.icon className="w-6 h-6 text-[#04473C]" strokeWidth={1.5} />
              </div>
              <p className="font-medium text-[#1A1C20] text-sm">{option.title}</p>
              <p className="text-xs text-[#4A4D53] mt-1">{option.subtitle}</p>
            </button>
          ))}
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-lg font-medium mb-4 flex items-center gap-2" style={{ fontFamily: 'Playfair Display, serif' }}>
            <HelpCircle className="w-5 h-5 text-[#04473C]" />
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-3">
            {faqItems.map((faq, index) => (
              <details
                key={index}
                className="bg-white border border-[#E5E1DB] group"
              >
                <summary className="p-4 cursor-pointer flex items-center justify-between list-none">
                  <span className="font-medium text-[#1A1C20] pr-4">{faq.question}</span>
                  <ChevronRight className="w-5 h-5 text-[#4A4D53] transition-transform group-open:rotate-90 flex-shrink-0" />
                </summary>
                <div className="px-4 pb-4 text-sm text-[#4A4D53] border-t border-[#E5E1DB] pt-3">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </motion.div>

        {/* Legal Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8"
        >
          <button
            onClick={() => navigate('/legal')}
            className="w-full bg-white border border-[#E5E1DB] p-4 flex items-center justify-between hover:border-[#04473C] transition-colors"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-[#04473C]" />
              <span className="font-medium text-[#1A1C20]">Terms & Policies</span>
            </div>
            <ExternalLink className="w-4 h-4 text-[#4A4D53]" />
          </button>
        </motion.div>
      </main>
    </div>
  );
};

export default CustomerSupport;
