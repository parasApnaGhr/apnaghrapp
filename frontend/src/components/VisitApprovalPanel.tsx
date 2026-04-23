// @ts-nocheck
import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { 
  CheckCircle, XCircle, AlertCircle, Eye, Video, Image, 
  User, MapPin, Clock, IndianRupee, Play
} from 'lucide-react';
import { toast } from 'sonner';

const VisitApprovalPanel = () => {
  const [visits, setPendingVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    loadPendingVisits();
  }, []);

  const loadPendingVisits = async () => {
    try {
      const response = await api.get('/admin/visits/pending-approval');
      setPendingVisits(response.data);
    } catch (error) {
      toast.error('Failed to load visits');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (visitId) => {
    try {
      await api.post(`/admin/visits/${visitId}/approve`, { approved: true });
      toast.success('Visit approved! Earnings credited to rider');
      loadPendingVisits();
      setSelectedVisit(null);
    } catch (error) {
      toast.error('Failed to approve visit');
    }
  };

  const handleReject = async (visitId) => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    try {
      await api.post(`/admin/visits/${visitId}/approve`, { 
        approved: false, 
        rejection_reason: rejectionReason 
      });
      toast.success('Visit rejected');
      loadPendingVisits();
      setSelectedVisit(null);
      setRejectionReason('');
    } catch (error) {
      toast.error('Failed to reject visit');
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-[var(--stitch-ink)] border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Outfit' }}>
        Visit Approvals
        {visits.length > 0 && (
          <span className="ml-2 bg-amber-500 text-white text-sm px-2 py-1 rounded-full">
            {visits.length} pending
          </span>
        )}
      </h2>

      {visits.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-[var(--stitch-line)]">
          <CheckCircle className="w-12 h-12 text-[var(--stitch-ink)] mx-auto mb-3" />
          <p className="text-[var(--stitch-muted)]">All visits have been reviewed!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {visits.map(visit => (
            <div key={visit.id} className="bg-white rounded-xl border border-[var(--stitch-line)] overflow-hidden">
              <div className="p-4 border-b border-[var(--stitch-line)]">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-lg">
                      Visit - {visit.property_ids?.length || 1} Properties
                    </h3>
                    <p className="text-sm text-[var(--stitch-muted)]">
                      {visit.scheduled_date} • Completed {visit.visit_end_time ? new Date(visit.visit_end_time).toLocaleTimeString() : 'N/A'}
                    </p>
                  </div>
                  <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium">
                    Needs Review
                  </span>
                </div>
              </div>

              <div className="p-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-[#F3F2EB] rounded-lg p-3">
                    <p className="text-xs text-[var(--stitch-muted)] mb-1">Customer</p>
                    <p className="font-medium">{visit.customer?.name}</p>
                    <p className="text-sm text-[var(--stitch-muted)]">{visit.customer?.phone}</p>
                  </div>
                  <div className="bg-[#F3F2EB] rounded-lg p-3">
                    <p className="text-xs text-[var(--stitch-muted)] mb-1">Rider</p>
                    <p className="font-medium">{visit.rider?.name}</p>
                    <p className="text-sm text-[var(--stitch-muted)]">{visit.rider?.phone}</p>
                  </div>
                </div>

                {/* Properties */}
                <div className="mb-4">
                  <p className="text-sm font-medium mb-2">Properties Visited:</p>
                  <div className="space-y-2">
                    {visit.properties?.map((prop, idx) => (
                      <div key={prop.id} className="flex items-center gap-3 bg-[var(--stitch-soft)] rounded-lg p-2">
                        <div className="w-6 h-6 bg-[var(--stitch-ink)] text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{prop.title}</p>
                          <p className="text-xs text-[var(--stitch-muted)]">{prop.area_name}</p>
                        </div>
                        <CheckCircle className="w-5 h-5 text-[var(--stitch-ink)]" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Proofs */}
                <div className="mb-4">
                  <p className="text-sm font-medium mb-2">Visit Proofs:</p>
                  <div className="flex gap-3">
                    {visit.visit_proof_selfie && (
                      <a 
                        href={visit.visit_proof_selfie} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-sm"
                      >
                        <Image className="w-4 h-4" />
                        View Selfie
                      </a>
                    )}
                    {visit.visit_proof_video && (
                      <a 
                        href={visit.visit_proof_video} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-purple-50 text-purple-700 px-3 py-2 rounded-lg text-sm"
                      >
                        <Video className="w-4 h-4" />
                        View Video
                      </a>
                    )}
                    {!visit.visit_proof_selfie && !visit.visit_proof_video && (
                      <span className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        No proofs uploaded
                      </span>
                    )}
                  </div>
                </div>

                {/* Earnings */}
                <div className="bg-[var(--stitch-soft)] rounded-lg p-3 mb-4 flex items-center justify-between">
                  <span className="text-sm">Rider Earnings (Pending)</span>
                  <span className="text-xl font-bold text-[var(--stitch-ink)]">₹{visit.total_earnings || 0}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedVisit(visit)}
                    className="stitch-button stitch-button-secondary flex-1 flex items-center justify-center gap-2"
                    data-testid={`review-visit-${visit.id}`}
                  >
                    <Eye className="w-4 h-4" />
                    Review & Decide
                  </button>
                  <button
                    onClick={() => handleApprove(visit.id)}
                    className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 flex items-center gap-2"
                    data-testid={`quick-approve-${visit.id}`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {selectedVisit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4">Review Visit</h3>

              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-[var(--stitch-muted)]">Customer</p>
                    <p className="font-medium">{selectedVisit.customer?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--stitch-muted)]">Rider</p>
                    <p className="font-medium">{selectedVisit.rider?.name}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-[var(--stitch-muted)] mb-2">Properties ({selectedVisit.properties?.length})</p>
                  {selectedVisit.properties?.map((prop, idx) => (
                    <div key={prop.id} className="p-2 bg-[#F3F2EB] rounded-lg mb-2">
                      <p className="font-medium">{idx + 1}. {prop.title}</p>
                      <p className="text-sm text-[var(--stitch-muted)]">{prop.exact_address}</p>
                    </div>
                  ))}
                </div>

                <div>
                  <p className="text-sm text-[var(--stitch-muted)] mb-2">Verification Checklist</p>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="rounded" defaultChecked={!!selectedVisit.visit_proof_selfie} />
                      <span className="text-sm">Selfie proof uploaded</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="rounded" defaultChecked={!!selectedVisit.visit_proof_video} />
                      <span className="text-sm">Video proof uploaded</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="rounded" defaultChecked={selectedVisit.properties_completed?.length === selectedVisit.property_ids?.length} />
                      <span className="text-sm">All properties visited</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">OTP verified with customer</span>
                    </label>
                  </div>
                </div>

                <div className="bg-[var(--stitch-soft)] rounded-lg p-4">
                  <p className="text-sm text-[var(--stitch-muted)] mb-1">Earnings to Credit</p>
                  <p className="text-2xl font-bold text-[var(--stitch-ink)]">₹{selectedVisit.total_earnings || 0}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Rejection Reason (if rejecting)</label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Enter reason for rejection..."
                    className="input-field"
                    rows={2}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => { setSelectedVisit(null); setRejectionReason(''); }} className="stitch-button stitch-button-secondary flex-1">
                  Cancel
                </button>
                <button
                  onClick={() => handleReject(selectedVisit.id)}
                  className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 flex items-center gap-2"
                  data-testid="reject-visit-button"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
                <button
                  onClick={() => handleApprove(selectedVisit.id)}
                  className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 flex items-center gap-2"
                  data-testid="approve-visit-button"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisitApprovalPanel;
