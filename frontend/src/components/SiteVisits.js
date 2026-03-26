import React from 'react';
import { siteVisitAPI } from '../utils/api';
import { MapPin, Phone, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const SiteVisits = ({ visits, riderId, onUpdate }) => {
  const handleComplete = async (visitId) => {
    try {
      await siteVisitAPI.updateSiteVisit(visitId, { status: 'completed' });
      toast.success('Visit marked as completed!');
      onUpdate();
    } catch (error) {
      toast.error('Failed to update visit');
    }
  };

  const pendingVisits = visits.filter((v) => v.status === 'pending');
  const completedVisits = visits.filter((v) => v.status === 'completed');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'Barlow Condensed' }}>
          PENDING VISITS ({pendingVisits.length})
        </h2>
        <div className="space-y-3">
          {pendingVisits.map((visit) => (
            <div
              key={visit.id}
              className="bg-white rounded-xl border border-slate-200 p-4"
              data-testid={`visit-card-${visit.id}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-lg">{visit.client_name}</h3>
                  <p className="text-sm text-slate-500">{visit.property_type}</p>
                </div>
                <span className="badge-warning">Pending</span>
              </div>
              <div className="flex items-start gap-2 mb-3">
                <MapPin className="w-4 h-4 text-slate-400 mt-1" />
                <p className="text-sm text-slate-600">{visit.property_address}</p>
              </div>
              {visit.scheduled_time && (
                <p className="text-sm text-slate-500 mb-3">Scheduled: {visit.scheduled_time}</p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => handleComplete(visit.id)}
                  data-testid={`complete-visit-${visit.id}`}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark Completed
                </button>
                <button className="btn-secondary">
                  <Phone className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {pendingVisits.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              <p>No pending visits</p>
            </div>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'Barlow Condensed' }}>
          COMPLETED ({completedVisits.length})
        </h2>
        <div className="space-y-3">
          {completedVisits.slice(0, 5).map((visit) => (
            <div
              key={visit.id}
              className="bg-white rounded-xl border border-slate-200 p-4 opacity-60"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold">{visit.client_name}</h3>
                  <p className="text-sm text-slate-500">{visit.property_address}</p>
                </div>
                <span className="badge-success">Completed</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SiteVisits;