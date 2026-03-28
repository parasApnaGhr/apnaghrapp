import React, { useState, useEffect } from 'react';
import api, { getMediaUrl } from '../utils/api';
import { 
  Home, TrendingUp, Eye, CheckCircle, AlertCircle, Clock,
  Flame, MapPin, IndianRupee, RefreshCw, XCircle, Search
} from 'lucide-react';
import { toast } from 'sonner';

const PropertyAnalyticsPanel = () => {
  const [analytics, setAnalytics] = useState({ properties: [], summary: {} });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, needs_check, hot, rented
  const [searchTerm, setSearchTerm] = useState('');
  const [verifyingId, setVerifyingId] = useState(null);
  const [statusModal, setStatusModal] = useState(null);
  const [statusNotes, setStatusNotes] = useState('');

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const response = await api.get('/admin/properties/analytics');
      setAnalytics(response.data);
    } catch (error) {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyStatus = async (propertyId, status) => {
    try {
      await api.post(`/admin/properties/${propertyId}/verify-status`, {
        status,
        notes: statusNotes
      });
      toast.success(`Property marked as ${status}`);
      setStatusModal(null);
      setStatusNotes('');
      loadAnalytics();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleToggleHot = async (propertyId, currentHot) => {
    try {
      await api.post(`/admin/properties/${propertyId}/mark-hot`, null, {
        params: { is_hot: !currentHot }
      });
      toast.success(currentHot ? 'Removed hot badge' : 'Marked as hot property!');
      loadAnalytics();
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  const handleAutoMarkHot = async () => {
    try {
      const response = await api.post('/admin/properties/auto-mark-hot');
      toast.success(`Marked ${response.data.hot_properties_count} properties as hot based on visits`);
      loadAnalytics();
    } catch (error) {
      toast.error('Failed to auto-mark');
    }
  };

  const filteredProperties = analytics.properties.filter(prop => {
    const matchesSearch = prop.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prop.area_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    switch (filter) {
      case 'needs_check': return prop.needs_verification;
      case 'hot': return prop.is_hot;
      case 'rented': return prop.status === 'rented';
      case 'available': return prop.status === 'available';
      default: return true;
    }
  });

  const getStatusBadge = (status) => {
    const badges = {
      available: { class: 'bg-green-100 text-green-800', icon: CheckCircle },
      rented: { class: 'bg-red-100 text-red-800', icon: XCircle },
      under_verification: { class: 'bg-amber-100 text-amber-800', icon: Clock },
      inactive: { class: 'bg-gray-100 text-gray-800', icon: XCircle }
    };
    return badges[status] || badges.available;
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-[#E07A5F] border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit' }}>Property Analytics</h2>
        <div className="flex gap-2">
          <button
            onClick={handleAutoMarkHot}
            className="btn-secondary flex items-center gap-2"
            data-testid="auto-mark-hot"
          >
            <Flame className="w-4 h-4" />
            Auto-Mark Hot
          </button>
          <button
            onClick={loadAnalytics}
            className="btn-primary flex items-center gap-2"
            data-testid="refresh-analytics"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-[#E5E3D8] p-4">
          <p className="text-sm text-[#4A626C]">Total Properties</p>
          <p className="text-2xl font-bold" style={{ fontFamily: 'Outfit' }}>{analytics.summary.total_properties || 0}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-sm text-green-700">Available</p>
          <p className="text-2xl font-bold text-green-700">{analytics.summary.available || 0}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-700">Rented</p>
          <p className="text-2xl font-bold text-red-700">{analytics.summary.rented || 0}</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm text-amber-700">Needs Daily Check</p>
          <p className="text-2xl font-bold text-amber-700">{analytics.summary.needs_daily_check || 0}</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <p className="text-sm text-orange-700">Hot Properties</p>
          <p className="text-2xl font-bold text-orange-700">{analytics.summary.hot_properties || 0}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-700">Weekly Visits</p>
          <p className="text-2xl font-bold text-blue-700">{analytics.summary.total_weekly_visits || 0}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A626C]" />
            <input
              type="text"
              placeholder="Search properties..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          {['all', 'needs_check', 'hot', 'available', 'rented'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === f
                  ? 'bg-[#E07A5F] text-white'
                  : 'bg-[#F3F2EB] text-[#4A626C] hover:bg-[#E5E3D8]'
              }`}
            >
              {f === 'needs_check' ? 'Needs Check' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Properties List */}
      <div className="space-y-4">
        {filteredProperties.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-[#E5E3D8]">
            <Home className="w-12 h-12 text-[#4A626C] mx-auto mb-3 opacity-50" />
            <p className="text-[#4A626C]">No properties match the filter</p>
          </div>
        ) : (
          filteredProperties.map(property => {
            const statusInfo = getStatusBadge(property.status);
            const StatusIcon = statusInfo.icon;
            
            return (
              <div 
                key={property.id} 
                className={`bg-white rounded-xl border-2 p-4 ${
                  property.needs_verification ? 'border-amber-300' : 'border-[#E5E3D8]'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Image */}
                  <div className="w-24 h-24 bg-[#F3F2EB] rounded-lg overflow-hidden flex-shrink-0">
                    {property.images?.[0] ? (
                      <img src={getMediaUrl(property.images[0])} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Home className="w-8 h-8 text-[#4A626C]" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg">{property.title}</h3>
                          {property.is_hot && (
                            <span className="flex items-center gap-1 bg-orange-500 text-white px-2 py-0.5 rounded-full text-xs">
                              <Flame className="w-3 h-3" /> Hot
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-[#4A626C] flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {property.area_name}, {property.city}
                        </p>
                      </div>
                      <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${statusInfo.class}`}>
                        <StatusIcon className="w-4 h-4" />
                        {property.status?.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-6 text-sm mb-3">
                      <span className="flex items-center gap-1">
                        <IndianRupee className="w-4 h-4 text-[#E07A5F]" />
                        <strong>₹{property.rent?.toLocaleString()}</strong>/mo
                      </span>
                      <span>{property.bhk} BHK • {property.furnishing}</span>
                    </div>

                    {/* Analytics */}
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded">
                        <Eye className="w-4 h-4" />
                        <span>{property.weekly_visits || 0} visits this week</span>
                      </div>
                      <div className="flex items-center gap-1 bg-purple-50 text-purple-700 px-2 py-1 rounded">
                        <TrendingUp className="w-4 h-4" />
                        <span>{property.visit_count || 0} total visits</span>
                      </div>
                      {property.last_status_check && (
                        <div className="flex items-center gap-1 text-[#4A626C]">
                          <Clock className="w-4 h-4" />
                          <span>Checked: {new Date(property.last_status_check).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => setStatusModal(property)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1 ${
                        property.needs_verification
                          ? 'bg-amber-500 text-white hover:bg-amber-600'
                          : 'bg-[#F3F2EB] text-[#4A626C] hover:bg-[#E5E3D8]'
                      }`}
                      data-testid={`verify-${property.id}`}
                    >
                      <CheckCircle className="w-4 h-4" />
                      {property.needs_verification ? 'Verify Now' : 'Update Status'}
                    </button>
                    <button
                      onClick={() => handleToggleHot(property.id, property.is_hot)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1 ${
                        property.is_hot
                          ? 'bg-orange-500 text-white hover:bg-orange-600'
                          : 'bg-[#F3F2EB] text-[#4A626C] hover:bg-[#E5E3D8]'
                      }`}
                      data-testid={`toggle-hot-${property.id}`}
                    >
                      <Flame className="w-4 h-4" />
                      {property.is_hot ? 'Remove Hot' : 'Mark Hot'}
                    </button>
                  </div>
                </div>

                {/* Warning for needs verification */}
                {property.needs_verification && (
                  <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    <p className="text-sm text-amber-800">
                      This property hasn't been verified in 24+ hours. Please confirm if it's still available.
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Status Update Modal */}
      {statusModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Update Property Status</h3>
            <p className="text-sm text-[#4A626C] mb-4">{statusModal.title}</p>

            <div className="space-y-3 mb-4">
              <button
                onClick={() => handleVerifyStatus(statusModal.id, 'available')}
                className="w-full p-3 border-2 border-green-500 text-green-700 rounded-lg hover:bg-green-50 flex items-center gap-3"
              >
                <CheckCircle className="w-5 h-5" />
                <div className="text-left">
                  <p className="font-medium">Available</p>
                  <p className="text-xs opacity-70">Property is still available for rent</p>
                </div>
              </button>
              
              <button
                onClick={() => handleVerifyStatus(statusModal.id, 'rented')}
                className="w-full p-3 border-2 border-red-500 text-red-700 rounded-lg hover:bg-red-50 flex items-center gap-3"
              >
                <XCircle className="w-5 h-5" />
                <div className="text-left">
                  <p className="font-medium">Rented Out</p>
                  <p className="text-xs opacity-70">Property has been rented, remove from listings</p>
                </div>
              </button>
              
              <button
                onClick={() => handleVerifyStatus(statusModal.id, 'under_verification')}
                className="w-full p-3 border-2 border-amber-500 text-amber-700 rounded-lg hover:bg-amber-50 flex items-center gap-3"
              >
                <Clock className="w-5 h-5" />
                <div className="text-left">
                  <p className="font-medium">Under Verification</p>
                  <p className="text-xs opacity-70">Need to confirm with owner</p>
                </div>
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Notes (optional)</label>
              <textarea
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                placeholder="Add any notes about this verification..."
                className="input-field"
                rows={2}
              />
            </div>

            <button
              onClick={() => { setStatusModal(null); setStatusNotes(''); }}
              className="w-full btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyAnalyticsPanel;
