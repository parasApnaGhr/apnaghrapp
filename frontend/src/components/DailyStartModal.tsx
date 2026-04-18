// @ts-nocheck
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, Upload, Target, Calendar, Sparkles, 
  CheckCircle, AlertTriangle, X, Image as ImageIcon
} from 'lucide-react';
import api from '../utils/api';
import { toast } from 'sonner';

const DailyStartModal = ({ isOpen, onComplete, warnings = [], motivationQuote, quoteAuthor }) => {
  const [step, setStep] = useState(warnings.length > 0 ? 0 : 1); // 0 = warnings, 1 = form
  const [formData, setFormData] = useState({
    image_base64: null,
    today_plan: '',
    planned_visits: 0,
    expected_deals: 0
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result.split(',')[1];
        setFormData({ ...formData, image_base64: base64 });
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!formData.today_plan.trim()) {
      toast.error("Please enter today's plan");
      return;
    }
    
    setSubmitting(true);
    try {
      await api.post('/seller-performance/daily-start', formData);
      // Mark that we showed the modal today
      const today = new Date().toISOString().split('T')[0];
      sessionStorage.setItem('dailyStartShown', today);
      toast.success('Daily start report submitted! Have a productive day!');
      onComplete();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#04473C] to-[#065f4e] p-6 text-white rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Good Morning!</h2>
                <p className="text-white/80 text-sm">Let's make today count</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Step 0: Warnings */}
            {step === 0 && warnings.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-2 text-yellow-700 font-semibold mb-3">
                    <AlertTriangle className="w-5 h-5" />
                    Performance Alerts
                  </div>
                  <ul className="space-y-2">
                    {warnings.map((warning, idx) => (
                      <li key={idx} className="text-yellow-800 text-sm flex items-start gap-2">
                        <span className="text-yellow-500">•</span>
                        {warning}
                      </li>
                    ))}
                  </ul>
                </div>
                <button
                  onClick={() => setStep(1)}
                  className="w-full py-3 bg-[#04473C] text-white rounded-xl font-semibold hover:bg-[#065f4e] transition-colors"
                >
                  I Understand, Continue
                </button>
              </motion.div>
            )}

            {/* Step 1: Daily Start Form */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-5"
              >
                {/* Motivation Quote */}
                {motivationQuote && (
                  <div className="bg-gradient-to-br from-[#C6A87C]/10 to-[#04473C]/5 rounded-xl p-4 border border-[#C6A87C]/20">
                    <p className="text-[#1A1C20] italic text-center">"{motivationQuote}"</p>
                    {quoteAuthor && (
                      <p className="text-[#4A4D53] text-sm text-center mt-2">— {quoteAuthor}</p>
                    )}
                  </div>
                )}

                {/* Office Selfie */}
                <div>
                  <label className="block text-sm font-semibold text-[#1A1C20] mb-2">
                    <Camera className="w-4 h-4 inline mr-1" />
                    Office Selfie (Optional)
                  </label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-[#E5E1DB] rounded-xl p-6 text-center cursor-pointer hover:border-[#04473C] transition-colors"
                  >
                    {imagePreview ? (
                      <div className="relative">
                        <img src={imagePreview} alt="Preview" className="max-h-40 mx-auto rounded-lg" />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setImagePreview(null);
                            setFormData({ ...formData, image_base64: null });
                          }}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-[#4A4D53] mx-auto mb-2" />
                        <p className="text-sm text-[#4A4D53]">Click to upload photo</p>
                      </>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="user"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>

                {/* Today's Plan */}
                <div>
                  <label className="block text-sm font-semibold text-[#1A1C20] mb-2">
                    <Target className="w-4 h-4 inline mr-1" />
                    Today's Plan *
                  </label>
                  <textarea
                    value={formData.today_plan}
                    onChange={(e) => setFormData({ ...formData, today_plan: e.target.value })}
                    placeholder="What do you plan to achieve today?"
                    rows={3}
                    className="w-full px-4 py-3 border border-[#E5E1DB] rounded-xl focus:ring-2 focus:ring-[#04473C]/20 focus:border-[#04473C]"
                    required
                  />
                </div>

                {/* Planned Visits & Expected Deals */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#1A1C20] mb-2">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Planned Visits
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.planned_visits}
                      onChange={(e) => setFormData({ ...formData, planned_visits: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-3 border border-[#E5E1DB] rounded-xl focus:ring-2 focus:ring-[#04473C]/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#1A1C20] mb-2">
                      <Sparkles className="w-4 h-4 inline mr-1" />
                      Expected Deals
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.expected_deals}
                      onChange={(e) => setFormData({ ...formData, expected_deals: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-3 border border-[#E5E1DB] rounded-xl focus:ring-2 focus:ring-[#04473C]/20"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !formData.today_plan.trim()}
                  className="w-full py-4 bg-gradient-to-r from-[#04473C] to-[#065f4e] text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Start My Day
                    </>
                  )}
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DailyStartModal;
