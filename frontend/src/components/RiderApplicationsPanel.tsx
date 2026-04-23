// @ts-nocheck
// Rider Applications Panel - Admin component for managing rider applications
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, Search, Filter, Eye, Check, X, Ban, 
  Phone, MapPin, FileText, Camera, Car, Wallet,
  ChevronDown, ChevronUp, Loader2, Download, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../utils/api';

const RiderApplicationsPanel = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  // Fetch applications
  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('status', filter);
      if (cityFilter) params.append('city', cityFilter);
      
      const response = await api.get(`/admin/rider-applications?${params.toString()}`);
      setApplications(response.data.applications || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  }, [filter, cityFilter]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get('/admin/rider-applications/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
    fetchStats();
  }, [fetchApplications, fetchStats]);

  // Review application
  const handleReview = async (appId, status, rejectionReason = null) => {
    setActionLoading(appId);
    try {
      await api.patch(`/admin/rider-applications/${appId}/review`, {
        status,
        rejection_reason: rejectionReason
      });
      toast.success(`Application ${status}`);
      fetchApplications();
      fetchStats();
      setSelectedApp(null);
    } catch (error) {
      console.error('Error reviewing application:', error);
      toast.error('Failed to review application');
    } finally {
      setActionLoading(null);
    }
  };

  // Ban rider
  const handleBan = async (appId) => {
    if (!window.confirm('Are you sure you want to ban this rider? This action cannot be undone.')) {
      return;
    }
    setActionLoading(appId);
    try {
      await api.patch(`/admin/rider-applications/${appId}/ban`, {
        reason: 'Policy violation'
      });
      toast.success('Rider banned successfully');
      fetchApplications();
      fetchStats();
      setSelectedApp(null);
    } catch (error) {
      console.error('Error banning rider:', error);
      toast.error('Failed to ban rider');
    } finally {
      setActionLoading(null);
    }
  };

  // Filter applications by search
  const filteredApps = applications.filter(app => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      app.full_name?.toLowerCase().includes(query) ||
      app.mobile?.includes(query) ||
      app.city?.toLowerCase().includes(query)
    );
  });

  // Status badge
  const StatusBadge = ({ status }) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      under_review: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      banned: 'bg-gray-800 text-white'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100'}`}>
        {status?.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="text-2xl font-bold text-[var(--stitch-ink)]">{stats?.total || 0}</div>
          <div className="text-sm text-[var(--stitch-muted)]">Total Applications</div>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
          <div className="text-2xl font-bold text-yellow-700">{stats?.by_status?.pending || 0}</div>
          <div className="text-sm text-yellow-600">Pending</div>
        </div>
        <div className="bg-green-50 rounded-xl p-4 border border-green-200">
          <div className="text-2xl font-bold text-green-700">{stats?.by_status?.approved || 0}</div>
          <div className="text-sm text-green-600">Approved</div>
        </div>
        <div className="bg-red-50 rounded-xl p-4 border border-red-200">
          <div className="text-2xl font-bold text-red-700">{stats?.by_status?.rejected || 0}</div>
          <div className="text-sm text-red-600">Rejected</div>
        </div>
        <div className="bg-gray-100 rounded-xl p-4 border border-gray-300">
          <div className="text-2xl font-bold text-gray-700">{stats?.by_status?.banned || 0}</div>
          <div className="text-sm text-[var(--stitch-muted)]">Banned</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, phone, city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--stitch-ink)] focus:border-transparent"
              />
            </div>
          </div>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--stitch-ink)] bg-white"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="under_review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="banned">Banned</option>
          </select>

          <input
            type="text"
            placeholder="Filter by city"
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--stitch-ink)] w-40"
          />

          <button
            onClick={() => { fetchApplications(); fetchStats(); }}
            className="p-2 text-[var(--stitch-muted)] hover:bg-gray-100 rounded-lg"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Applications List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--stitch-ink)]" />
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="text-center py-12 text-[var(--stitch-muted)]">
            No applications found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--stitch-soft)] border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Applicant</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Contact</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">City</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Vehicle</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Applied</th>
                  <th className="text-right px-4 py-3 text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredApps.map((app) => (
                  <tr key={app.id} className="hover:bg-[var(--stitch-soft)]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {app.selfie_url ? (
                          <img
                            src={app.selfie_url}
                            alt={app.full_name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <Users className="w-5 h-5 text-[var(--stitch-muted)]" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-[var(--stitch-ink)]">{app.full_name}</div>
                          <div className="text-sm text-[var(--stitch-muted)]">{app.availability?.replace('_', ' ')}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-[var(--stitch-ink)]">+91 {app.mobile}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-sm text-gray-700">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        {app.city}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm ${app.has_vehicle ? 'text-green-600' : 'text-[var(--stitch-muted)]'}`}>
                        {app.has_vehicle ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--stitch-muted)]">
                      {new Date(app.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedApp(app)}
                          className="p-2 text-[var(--stitch-muted)] hover:bg-gray-100 rounded-lg"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {app.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleReview(app.id, 'approved')}
                              disabled={actionLoading === app.id}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                              title="Approve"
                            >
                              {actionLoading === app.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Check className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleReview(app.id, 'rejected', 'Does not meet requirements')}
                              disabled={actionLoading === app.id}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              title="Reject"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {app.status !== 'banned' && (
                          <button
                            onClick={() => handleBan(app.id)}
                            disabled={actionLoading === app.id}
                            className="p-2 text-[var(--stitch-muted)] hover:bg-gray-100 rounded-lg"
                            title="Ban Rider"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Application Detail Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-[var(--stitch-ink)]">Application Details</h2>
              <button
                onClick={() => setSelectedApp(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-center gap-4">
                {selectedApp.selfie_url ? (
                  <img
                    src={selectedApp.selfie_url}
                    alt={selectedApp.full_name}
                    className="w-20 h-20 rounded-xl object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gray-200 rounded-xl flex items-center justify-center">
                    <Camera className="w-10 h-10 text-gray-400" />
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold text-[var(--stitch-ink)]">{selectedApp.full_name}</h3>
                  <p className="text-[var(--stitch-muted)]">{selectedApp.city}</p>
                  <StatusBadge status={selectedApp.status} />
                </div>
              </div>

              {/* Contact */}
              <div className="bg-[var(--stitch-soft)] rounded-xl p-4">
                <h4 className="font-semibold text-[var(--stitch-ink)] mb-3">Contact Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-[var(--stitch-muted)]">Mobile:</span>
                    <span className="ml-2 text-[var(--stitch-ink)]">+91 {selectedApp.mobile}</span>
                  </div>
                  <div>
                    <span className="text-[var(--stitch-muted)]">WhatsApp:</span>
                    <span className="ml-2 text-[var(--stitch-ink)]">{selectedApp.whatsapp || 'Same as mobile'}</span>
                  </div>
                  <div>
                    <span className="text-[var(--stitch-muted)]">City:</span>
                    <span className="ml-2 text-[var(--stitch-ink)]">{selectedApp.city}</span>
                  </div>
                  <div>
                    <span className="text-[var(--stitch-muted)]">Areas:</span>
                    <span className="ml-2 text-[var(--stitch-ink)]">{selectedApp.areas?.join(', ') || 'All areas'}</span>
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div className="bg-[var(--stitch-soft)] rounded-xl p-4">
                <h4 className="font-semibold text-[var(--stitch-ink)] mb-3">Documents</h4>
                <div className="grid grid-cols-2 gap-4">
                  {selectedApp.aadhaar_url && (
                    <a
                      href={selectedApp.aadhaar_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-100"
                    >
                      <FileText className="w-5 h-5 text-blue-600" />
                      <span>Aadhaar Card</span>
                      <Download className="w-4 h-4 ml-auto" />
                    </a>
                  )}
                  {selectedApp.pan_url && (
                    <a
                      href={selectedApp.pan_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-100"
                    >
                      <FileText className="w-5 h-5 text-green-600" />
                      <span>PAN Card</span>
                      <Download className="w-4 h-4 ml-auto" />
                    </a>
                  )}
                  {selectedApp.driving_license_url && (
                    <a
                      href={selectedApp.driving_license_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-100"
                    >
                      <Car className="w-5 h-5 text-purple-600" />
                      <span>Driving License</span>
                      <Download className="w-4 h-4 ml-auto" />
                    </a>
                  )}
                  {selectedApp.selfie_url && (
                    <a
                      href={selectedApp.selfie_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-100"
                    >
                      <Camera className="w-5 h-5 text-orange-600" />
                      <span>Selfie Photo</span>
                      <Download className="w-4 h-4 ml-auto" />
                    </a>
                  )}
                </div>
              </div>

              {/* Work Details */}
              <div className="bg-[var(--stitch-soft)] rounded-xl p-4">
                <h4 className="font-semibold text-[var(--stitch-ink)] mb-3">Work Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-[var(--stitch-muted)]">Vehicle:</span>
                    <span className={`ml-2 ${selectedApp.has_vehicle ? 'text-green-600' : 'text-[var(--stitch-ink)]'}`}>
                      {selectedApp.has_vehicle ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--stitch-muted)]">Availability:</span>
                    <span className="ml-2 text-[var(--stitch-ink)]">
                      {selectedApp.availability?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </div>
                  {selectedApp.experience && (
                    <div className="col-span-2">
                      <span className="text-[var(--stitch-muted)]">Experience:</span>
                      <p className="mt-1 text-[var(--stitch-ink)]">{selectedApp.experience}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Details */}
              <div className="bg-[var(--stitch-soft)] rounded-xl p-4">
                <h4 className="font-semibold text-[var(--stitch-ink)] mb-3">Payment Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-[var(--stitch-muted)]">UPI ID:</span>
                    <span className="ml-2 text-[var(--stitch-ink)]">{selectedApp.upi_id}</span>
                  </div>
                  {selectedApp.bank_name && (
                    <div>
                      <span className="text-[var(--stitch-muted)]">Bank:</span>
                      <span className="ml-2 text-[var(--stitch-ink)]">{selectedApp.bank_name}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Legal Agreements */}
              <div className="bg-[var(--stitch-soft)] rounded-xl p-4">
                <h4 className="font-semibold text-[var(--stitch-ink)] mb-3">Legal Agreements</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedApp.legal_agreements?.non_circumvention && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Non-Circumvention ✓</span>
                  )}
                  {selectedApp.legal_agreements?.commission_protection && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Commission Protection ✓</span>
                  )}
                  {selectedApp.legal_agreements?.penalty_clause && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Penalty Clause ✓</span>
                  )}
                  {selectedApp.legal_agreements?.work_compliance && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Work Compliance ✓</span>
                  )}
                  {selectedApp.legal_agreements?.payment_terms && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Payment Terms ✓</span>
                  )}
                </div>
                {selectedApp.legal_agreements?.agreed_at && (
                  <p className="text-xs text-[var(--stitch-muted)] mt-2">
                    Agreed on: {new Date(selectedApp.legal_agreements.agreed_at).toLocaleString()}
                  </p>
                )}
              </div>

              {/* Actions */}
              {selectedApp.status === 'pending' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleReview(selectedApp.id, 'approved')}
                    disabled={actionLoading === selectedApp.id}
                    className="flex-1 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {actionLoading === selectedApp.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Check className="w-5 h-5" />
                        Approve
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleReview(selectedApp.id, 'rejected', 'Does not meet requirements')}
                    disabled={actionLoading === selectedApp.id}
                    className="flex-1 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <X className="w-5 h-5" />
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiderApplicationsPanel;
