// @ts-nocheck
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Phone, Calendar, Handshake, Share2, ArrowRight,
  CheckCircle, AlertTriangle, Trophy, TrendingUp
} from 'lucide-react';
import api from '../utils/api';
import { toast } from 'sonner';

const DailyEndModal = ({ 
  isOpen, 
  onComplete, 
  isPending = false,
  pendingDate = null 
}) => {
  const [formData, setFormData] = useState({
    clients_called: 0,
    visits_booked: 0,
    deals_closed: 0,
    properties_shared: 0,
    tomorrow_visits: 0
  });
  const [submitting, setSubmitting] = useState(false);
  const [scoreResult, setScoreResult] = useState(null);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Ensure all values are integers
      const submitData = {
        clients_called: parseInt(formData.clients_called) || 0,
        visits_booked: parseInt(formData.visits_booked) || 0,
        deals_closed: parseInt(formData.deals_closed) || 0,
        properties_shared: parseInt(formData.properties_shared) || 0,
        tomorrow_visits: parseInt(formData.tomorrow_visits) || 0
      };
      
      console.log('Submitting data:', submitData, 'isPending:', isPending, 'date:', pendingDate);
      
      let response;
      if (isPending && pendingDate) {
        response = await api.post(`/seller-performance/submit-pending-logout?date=${pendingDate}`, submitData);
      } else {
        response = await api.post('/seller-performance/daily-end', submitData);
      }
      
      console.log('Response:', response.data);
      setScoreResult(response.data.score);
      
      // Show result for 3 seconds then close
      setTimeout(() => {
        toast.success('Daily report submitted successfully!');
        setSubmitting(false);
        onComplete();
      }, 3000);
      
    } catch (error) {
      console.error('Submit error:', error.response?.data || error);
      const errorMsg = error.response?.data?.detail || 'Failed to submit report. Please try again.';
      toast.error(errorMsg);
      setSubmitting(false);
    }
  };

  const handleDismiss = async () => {
    if (!isPending || !pendingDate) return;
    
    setSubmitting(true);
    try {
      await api.post(`/seller-performance/dismiss-pending-logout?date=${pendingDate}`);
      toast.success('Report skipped. A penalty has been applied.');
      onComplete();
    } catch (error) {
      console.error('Dismiss error:', error.response?.data || error);
      toast.error('Failed to skip report. Please try again.');
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
          <div className={`p-6 text-white rounded-t-2xl ${
            isPending 
              ? 'bg-gradient-to-r from-orange-500 to-orange-600'
              : 'bg-gradient-to-r from-[var(--stitch-ink)] to-[var(--stitch-ink)]'
          }`}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                {isPending ? <AlertTriangle className="w-6 h-6" /> : <TrendingUp className="w-6 h-6" />}
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  {isPending ? 'Pending Report' : 'End of Day Report'}
                </h2>
                <p className="text-white/80 text-sm">
                  {isPending 
                    ? `Please submit report for ${pendingDate}`
                    : "Let's capture today's achievements"
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {scoreResult ? (
              /* Score Result View */
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6"
              >
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-[var(--stitch-ink)] to-[var(--stitch-ink)] flex items-center justify-center">
                  <Trophy className="w-12 h-12 text-[var(--stitch-muted)]" />
                </div>
                <h3 className="text-2xl font-bold text-[var(--stitch-ink)] mb-2">
                  Today's Score: {scoreResult.final_score}
                </h3>
                
                <div className="grid grid-cols-3 gap-4 mt-6 text-sm">
                  <div className="bg-blue-50 p-3 rounded-xl">
                    <p className="text-blue-600 font-semibold">{scoreResult.base_score}</p>
                    <p className="text-blue-500 text-xs">Base Score</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-xl">
                    <p className="text-green-600 font-semibold">+{scoreResult.bonus}</p>
                    <p className="text-green-500 text-xs">Bonus</p>
                  </div>
                  <div className="bg-red-50 p-3 rounded-xl">
                    <p className="text-red-600 font-semibold">-{scoreResult.penalty}</p>
                    <p className="text-red-500 text-xs">Penalty</p>
                  </div>
                </div>

                {scoreResult.final_score >= 100 ? (
                  <p className="text-green-600 mt-4 font-medium">
                    Great work today! Keep it up! 🎉
                  </p>
                ) : (
                  <p className="text-orange-600 mt-4 font-medium">
                    Tomorrow is a new opportunity! 💪
                  </p>
                )}
              </motion.div>
            ) : (
              /* Form View */
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-5"
              >
                {isPending && (
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4">
                    <p className="text-orange-700 text-sm">
                      <AlertTriangle className="w-4 h-4 inline mr-1" />
                      You didn't submit yesterday's report. A -50 point penalty will be applied.
                    </p>
                  </div>
                )}

                {/* Clients Called */}
                <div>
                  <label className="block text-sm font-semibold text-[var(--stitch-ink)] mb-2">
                    <Phone className="w-4 h-4 inline mr-1" />
                    Clients Called
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.clients_called}
                    onChange={(e) => setFormData({ ...formData, clients_called: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border border-[var(--stitch-line)] rounded-xl focus:ring-2 focus:ring-[var(--stitch-ink)]/20"
                    placeholder="How many clients did you call?"
                  />
                  {formData.clients_called < 60 && formData.clients_called > 0 && (
                    <p className="text-orange-500 text-xs mt-1">⚠️ Target: 60+ calls daily</p>
                  )}
                </div>

                {/* Properties Shared */}
                <div>
                  <label className="block text-sm font-semibold text-[var(--stitch-ink)] mb-2">
                    <Share2 className="w-4 h-4 inline mr-1" />
                    Properties Shared/Referred
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.properties_shared}
                    onChange={(e) => setFormData({ ...formData, properties_shared: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border border-[var(--stitch-line)] rounded-xl focus:ring-2 focus:ring-[var(--stitch-ink)]/20"
                    placeholder="Properties shared via referral links"
                  />
                  {formData.properties_shared < 20 && formData.properties_shared > 0 && (
                    <p className="text-orange-500 text-xs mt-1">⚠️ Target: 20+ shares daily for bonus</p>
                  )}
                </div>

                {/* Visits Booked */}
                <div>
                  <label className="block text-sm font-semibold text-[var(--stitch-ink)] mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Visits Booked Today
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.visits_booked}
                    onChange={(e) => setFormData({ ...formData, visits_booked: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border border-[var(--stitch-line)] rounded-xl focus:ring-2 focus:ring-[var(--stitch-ink)]/20"
                    placeholder="Site visits you scheduled"
                  />
                  {formData.visits_booked >= 5 && (
                    <p className="text-green-500 text-xs mt-1">✓ +15 bonus points!</p>
                  )}
                </div>

                {/* Deals Closed */}
                <div>
                  <label className="block text-sm font-semibold text-[var(--stitch-ink)] mb-2">
                    <Handshake className="w-4 h-4 inline mr-1" />
                    Deals Closed Today
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.deals_closed}
                    onChange={(e) => setFormData({ ...formData, deals_closed: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border border-[var(--stitch-line)] rounded-xl focus:ring-2 focus:ring-[var(--stitch-ink)]/20"
                    placeholder="Deals finalized today"
                  />
                  {formData.deals_closed >= 1 && (
                    <p className="text-green-500 text-xs mt-1">✓ +25 bonus points!</p>
                  )}
                </div>

                {/* Tomorrow's Planned Visits */}
                <div>
                  <label className="block text-sm font-semibold text-[var(--stitch-ink)] mb-2">
                    <ArrowRight className="w-4 h-4 inline mr-1" />
                    Tomorrow's Planned Visits
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.tomorrow_visits}
                    onChange={(e) => setFormData({ ...formData, tomorrow_visits: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border border-[var(--stitch-line)] rounded-xl focus:ring-2 focus:ring-[var(--stitch-ink)]/20"
                    placeholder="Visits scheduled for tomorrow"
                  />
                </div>

                {/* Live Score Preview */}
                <div className="bg-black/5 rounded-xl p-4">
                  <p className="text-sm font-semibold text-[var(--stitch-ink)] mb-2">Estimated Score Preview</p>
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-2xl font-bold text-[var(--stitch-ink)]">
                        {(formData.properties_shared * 1) + (formData.visits_booked * 5) + (formData.deals_closed * 20)}
                      </span>
                      <span className="text-sm text-[var(--stitch-muted)] ml-1">base</span>
                    </div>
                    {formData.properties_shared >= 20 && (
                      <span className="text-green-600 text-sm">+10</span>
                    )}
                    {formData.visits_booked >= 5 && (
                      <span className="text-green-600 text-sm">+15</span>
                    )}
                    {formData.deals_closed >= 1 && (
                      <span className="text-green-600 text-sm">+25</span>
                    )}
                    {formData.properties_shared < 20 && (
                      <span className="text-red-600 text-sm">-10</span>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full py-4 bg-gradient-to-r from-[var(--stitch-ink)] to-[var(--stitch-ink)] text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Calculating Score...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Submit & End Day
                    </>
                  )}
                </button>

                {/* Skip Button for Pending Reports */}
                {isPending && (
                  <button
                    onClick={handleDismiss}
                    disabled={submitting}
                    className="w-full py-3 mt-2 border border-gray-300 text-[var(--stitch-muted)] rounded-xl font-medium hover:bg-[var(--stitch-soft)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Skip (Apply -100 penalty)
                  </button>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DailyEndModal;
