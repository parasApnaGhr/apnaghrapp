// @ts-nocheck
// SEO FAQ Section Component with Schema Markup
import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const SEOFAQSection = ({ faqs, title = "Frequently Asked Questions" }) => {
  const [openIndex, setOpenIndex] = useState(0);

  if (!faqs || faqs.length === 0) return null;

  return (
    <section className="py-8" itemScope itemType="https://schema.org/FAQPage">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{title}</h2>
      
      <div className="space-y-3">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="border border-gray-200 rounded-lg overflow-hidden"
            itemScope
            itemProp="mainEntity"
            itemType="https://schema.org/Question"
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
              className="w-full px-5 py-4 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors text-left"
              aria-expanded={openIndex === index}
            >
              <span 
                className="font-medium text-gray-900 pr-4"
                itemProp="name"
              >
                {faq.question || faq.q}
              </span>
              {openIndex === index ? (
                <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
              )}
            </button>
            
            {openIndex === index && (
              <div 
                className="px-5 py-4 bg-gray-50 border-t border-gray-200"
                itemScope
                itemProp="acceptedAnswer"
                itemType="https://schema.org/Answer"
              >
                <p className="text-gray-700" itemProp="text">
                  {faq.answer || faq.a}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

export default SEOFAQSection;
