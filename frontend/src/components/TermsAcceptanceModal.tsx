// @ts-nocheck
// Terms Acceptance Modal Component
// Shows at login/registration and visit booking

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, FileText, AlertTriangle, CheckCircle, 
  X, ChevronDown, ChevronUp, ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';

const TermsAcceptanceModal = ({ 
  isOpen, 
  onAccept, 
  onDecline,
  userType = 'customer', // 'customer', 'rider', 'seller'
  context = 'login' // 'login', 'booking', 'registration'
}) => {
  const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false);
  const [checkboxes, setCheckboxes] = useState({
    terms: false,
    privacy: false,
    antiCircumvention: false
  });
  const [showFullTerms, setShowFullTerms] = useState(false);

  const allChecked = checkboxes.terms && checkboxes.privacy && checkboxes.antiCircumvention;

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollTop + clientHeight >= scrollHeight - 20) {
      setHasScrolledToEnd(true);
    }
  };

  const toggleCheckbox = (key) => {
    setCheckboxes(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getContextTitle = () => {
    switch (context) {
      case 'booking':
        return 'Accept Terms to Book Visit';
      case 'registration':
        return 'Accept Terms to Register';
      default:
        return 'Accept Terms to Continue';
    }
  };

  const getUserTypeWarning = () => {
    switch (userType) {
      case 'rider':
        return (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-800">Agent Agreement</p>
                <p className="text-sm text-amber-700 mt-1">
                  As a field agent, you agree to:
                </p>
                <ul className="text-sm text-amber-700 mt-2 space-y-1">
                  <li>• NO direct dealing with customers</li>
                  <li>• NO sharing personal number for private deals</li>
                  <li>• NO accepting cash outside platform</li>
                  <li>• Real-time location tracking during visits</li>
                </ul>
                <p className="text-sm text-amber-800 font-medium mt-2">
                  Violation: Fine up to ₹1,00,000 + Termination
                </p>
              </div>
            </div>
          </div>
        );
      case 'customer':
        return (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-800">Customer Agreement</p>
                <p className="text-sm text-blue-700 mt-1">
                  All bookings and deals must be through ApnaGhr. Direct dealing 
                  with agents/owners outside platform is prohibited.
                </p>
                <p className="text-sm text-blue-800 font-medium mt-2">
                  Violation: Penalty up to ₹50,000 + Legal action
                </p>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="bg-[var(--stitch-ink)] text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-semibold">{getContextTitle()}</h2>
                <p className="text-sm text-white/80">ApnaGhr Legal Terms</p>
              </div>
            </div>
            {onDecline && (
              <button
                onClick={onDecline}
                className="p-2 hover:bg-white/10 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Content */}
          <div 
            className="flex-1 overflow-y-auto p-4"
            onScroll={handleScroll}
          >
            {/* User Type Warning */}
            {getUserTypeWarning()}

            {/* Anti-Circumvention Highlight */}
            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-red-600 mt-0.5" />
                <div>
                  <p className="font-bold text-red-800 text-lg">
                    Anti-Circumvention Policy
                  </p>
                  <p className="text-sm text-red-700 mt-2">
                    You <strong>SHALL NOT</strong>:
                  </p>
                  <ul className="text-sm text-red-700 mt-1 space-y-1">
                    <li>• Contact property owners/clients directly outside platform</li>
                    <li>• Negotiate or finalize deals without ApnaGhr</li>
                    <li>• Share contact details to bypass commissions</li>
                  </ul>
                  <div className="mt-3 p-2 bg-red-100 rounded">
                    <p className="text-sm font-bold text-red-800">
                      PENALTY: Minimum ₹50,000 or 2X deal value
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Expandable Full Terms */}
            <button
              onClick={() => setShowFullTerms(!showFullTerms)}
              className="w-full flex items-center justify-between p-3 bg-[var(--stitch-soft)] rounded-lg mb-4"
            >
              <span className="text-sm font-medium text-[var(--stitch-ink)]">
                View Full Terms & Conditions
              </span>
              {showFullTerms ? (
                <ChevronUp className="w-5 h-5 text-[var(--stitch-muted)]" />
              ) : (
                <ChevronDown className="w-5 h-5 text-[var(--stitch-muted)]" />
              )}
            </button>

            {showFullTerms && (
              <div className="bg-[var(--stitch-soft)] rounded-lg p-4 mb-4 text-sm text-[var(--stitch-muted)] space-y-3">
                <p><strong>1. Privacy Policy:</strong> We collect name, phone, email, location data for service delivery and tracking.</p>
                <p><strong>2. Terms:</strong> All deals must happen through ApnaGhr. Bypassing is prohibited.</p>
                <p><strong>3. Location Tracking:</strong> Agents are tracked in real-time. Customers can view agent ETA.</p>
                <p><strong>4. Data Protection:</strong> We don't sell data. Stored securely.</p>
                <p><strong>5. Liability:</strong> ApnaGhr connects users. We don't guarantee deal closure.</p>
                <p><strong>6. Jurisdiction:</strong> Chandigarh / Mohali courts.</p>
                
                <Link 
                  to="/legal" 
                  target="_blank"
                  className="flex items-center gap-2 text-[var(--stitch-ink)] hover:underline font-medium"
                >
                  Read Complete Policies <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            )}

            {/* Checkboxes */}
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checkboxes.terms}
                  onChange={() => toggleCheckbox('terms')}
                  className="mt-1 w-5 h-5 rounded border-gray-300 text-[var(--stitch-ink)] focus:ring-[var(--stitch-ink)]"
                />
                <span className="text-sm text-[var(--stitch-muted)]">
                  I have read and agree to the <strong>Terms & Conditions</strong>
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checkboxes.privacy}
                  onChange={() => toggleCheckbox('privacy')}
                  className="mt-1 w-5 h-5 rounded border-gray-300 text-[var(--stitch-ink)] focus:ring-[var(--stitch-ink)]"
                />
                <span className="text-sm text-[var(--stitch-muted)]">
                  I consent to <strong>location tracking</strong> and <strong>data collection</strong> as per Privacy Policy
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer bg-red-50 p-3 rounded-lg border border-red-200">
                <input
                  type="checkbox"
                  checked={checkboxes.antiCircumvention}
                  onChange={() => toggleCheckbox('antiCircumvention')}
                  className="mt-1 w-5 h-5 rounded border-red-300 text-red-600 focus:ring-red-500"
                />
                <span className="text-sm text-red-800">
                  I understand and accept the <strong>Anti-Circumvention Policy</strong> and agree to pay penalties (₹50,000+) if violated
                </span>
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-[var(--stitch-line)] bg-[var(--stitch-soft)]">
            <button
              onClick={onAccept}
              disabled={!allChecked}
              className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors ${
                allChecked
                  ? 'bg-[var(--stitch-ink)] text-white hover:bg-[#033830]'
                  : 'bg-gray-300 text-[var(--stitch-muted)] cursor-not-allowed'
              }`}
            >
              <CheckCircle className="w-5 h-5" />
              I Accept All Terms
            </button>
            
            {!allChecked && (
              <p className="text-xs text-center text-[var(--stitch-muted)] mt-2">
                Please check all boxes to continue
              </p>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TermsAcceptanceModal;
