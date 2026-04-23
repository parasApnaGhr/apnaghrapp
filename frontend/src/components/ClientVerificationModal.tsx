// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, CheckCircle, XCircle, Clock, User, Phone, 
  Home, Calendar, ChevronRight, Lock, MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';

const ClientVerificationModal = ({ isOpen, onComplete, onClose }) => {
  const [pendingClients, setPendingClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const API_URL = import.meta.env.VITE_BACKEND_URL;

  const fetchPendingVerifications = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/seller-verification/pending-verifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.status === 423) {
        const data = await response.json();
        toast.error(data.detail?.message || 'Account locked');
        onClose?.();
        return;
      }
      
      const data = await response.json();
      if (data.pending_verifications && data.pending_verifications.length > 0) {
        setPendingClients(data.pending_verifications);
      } else {
        onComplete?.();
      }
    } catch (err) {
      console.error('Failed to fetch pending verifications:', err);
      toast.error('Failed to load pending verifications');
    } finally {
      setLoading(false);
    }
  }, [API_URL, onClose, onComplete]);

  useEffect(() => {
    if (isOpen) {
      fetchPendingVerifications();
    }
  }, [isOpen, fetchPendingVerifications]);

  const handleVerify = async () => {
    if (!selectedStatus) {
      toast.error('Please select a status');
      return;
    }
    
    if (selectedStatus === 'in_progress' && !notes.trim()) {
      toast.error('Please provide notes for "Still in Progress"');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const currentClient = pendingClients[currentIndex];
      
      const response = await fetch(`${API_URL}/api/seller-verification/verify-client`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          referral_id: currentClient.id,
          status: selectedStatus,
          notes: notes || null
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        if (data.account_locked) {
          toast.error('Your account has been locked. Contact admin.');
          onClose?.();
          return;
        }
        
        toast.success('Verification saved!');
        
        // Move to next client or complete
        if (currentIndex < pendingClients.length - 1) {
          setCurrentIndex(prev => prev + 1);
          setSelectedStatus(null);
          setNotes('');
        } else {
          toast.success('All verifications complete! Share is now unlocked.');
          onComplete?.();
        }
      } else {
        toast.error(data.detail || 'Failed to save verification');
      }
    } catch (err) {
      console.error('Verification error:', err);
      toast.error('Connection error');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  const currentClient = pendingClients[currentIndex];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold" >
                  Client Verification Required
                </h2>
                <p className="text-white/80 text-sm">
                  Verify {pendingClients.length} client(s) to unlock sharing
                </p>
              </div>
            </div>
            
            {/* Progress */}
            {pendingClients.length > 0 && (
              <div className="mt-4">
                <div className="flex justify-between text-sm text-white/80 mb-2">
                  <span>Progress</span>
                  <span>{currentIndex + 1} of {pendingClients.length}</span>
                </div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentIndex) / pendingClients.length) * 100}%` }}
                    className="h-full bg-white rounded-full"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-3 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
              </div>
            ) : currentClient ? (
              <div className="space-y-4">
                {/* Client Info Card */}
                <div className="bg-[var(--stitch-soft)] rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--stitch-ink)] flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[var(--stitch-ink)]">{currentClient.client_name}</h3>
                      <div className="flex items-center gap-2 text-sm text-[var(--stitch-muted)] mt-1">
                        <Phone className="w-3.5 h-3.5" />
                        {currentClient.client_phone}
                      </div>
                      {currentClient.property_title && (
                        <div className="flex items-center gap-2 text-sm text-[var(--stitch-muted)] mt-1">
                          <Home className="w-3.5 h-3.5" />
                          {currentClient.property_title}
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs text-[var(--stitch-muted)] mt-2">
                        <Calendar className="w-3.5 h-3.5" />
                        Referred: {formatDate(currentClient.referred_at)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Selection */}
                <div>
                  <label className="block text-sm font-medium text-[var(--stitch-ink)] mb-3">
                    What's the status of this client?
                  </label>
                  
                  <div className="space-y-2">
                    {/* Closed Won */}
                    <button
                      onClick={() => setSelectedStatus('closed_won')}
                      className={`w-full p-3 rounded-lg border-2 transition-all flex items-center gap-3 text-left ${
                        selectedStatus === 'closed_won'
                          ? 'border-green-500 bg-green-50'
                          : 'border-[var(--stitch-line)] hover:border-green-300'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        selectedStatus === 'closed_won' ? 'bg-green-500' : 'bg-green-100'
                      }`}>
                        <CheckCircle className={`w-4 h-4 ${
                          selectedStatus === 'closed_won' ? 'text-white' : 'text-green-600'
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium text-[var(--stitch-ink)]">Closed Won</p>
                        <p className="text-xs text-[var(--stitch-muted)]">Deal successful - Client converted</p>
                      </div>
                    </button>

                    {/* Closed Lost */}
                    <button
                      onClick={() => setSelectedStatus('closed_lost')}
                      className={`w-full p-3 rounded-lg border-2 transition-all flex items-center gap-3 text-left ${
                        selectedStatus === 'closed_lost'
                          ? 'border-red-500 bg-red-50'
                          : 'border-[var(--stitch-line)] hover:border-red-300'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        selectedStatus === 'closed_lost' ? 'bg-red-500' : 'bg-red-100'
                      }`}>
                        <XCircle className={`w-4 h-4 ${
                          selectedStatus === 'closed_lost' ? 'text-white' : 'text-red-600'
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium text-[var(--stitch-ink)]">Closed Lost</p>
                        <p className="text-xs text-[var(--stitch-muted)]">Client not interested / Deal lost</p>
                      </div>
                    </button>

                    {/* Still in Progress */}
                    <button
                      onClick={() => setSelectedStatus('in_progress')}
                      className={`w-full p-3 rounded-lg border-2 transition-all flex items-center gap-3 text-left ${
                        selectedStatus === 'in_progress'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-[var(--stitch-line)] hover:border-blue-300'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        selectedStatus === 'in_progress' ? 'bg-blue-500' : 'bg-blue-100'
                      }`}>
                        <Clock className={`w-4 h-4 ${
                          selectedStatus === 'in_progress' ? 'text-white' : 'text-blue-600'
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium text-[var(--stitch-ink)]">Still in Progress</p>
                        <p className="text-xs text-[var(--stitch-muted)]">Following up - Not decided yet</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Notes for In Progress */}
                {selectedStatus === 'in_progress' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-2"
                  >
                    <label className="block text-sm font-medium text-[var(--stitch-ink)]">
                      <MessageSquare className="w-4 h-4 inline mr-1" />
                      Tell us in a few words (required)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="E.g., Client wants to visit next week, waiting for budget confirmation..."
                      rows={2}
                      className="w-full px-3 py-2 border border-[var(--stitch-line)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm resize-none"
                    />
                  </motion.div>
                )}

                {/* Warning for Closed Lost */}
                {selectedStatus === 'closed_lost' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm"
                  >
                    <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-red-700">
                      <strong>Warning:</strong> More than 10 "Closed Lost" in a week will lock your account.
                    </p>
                  </motion.div>
                )}

                {/* Submit Button */}
                <button
                  onClick={handleVerify}
                  disabled={!selectedStatus || submitting}
                  className="w-full py-3 bg-gradient-to-r from-[var(--stitch-ink)] to-[var(--stitch-ink)] text-white rounded-lg font-medium hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      Verify & Continue
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="text-[var(--stitch-ink)] font-medium">All verifications complete!</p>
                <p className="text-sm text-[var(--stitch-muted)]">Share feature is now unlocked</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ClientVerificationModal;
