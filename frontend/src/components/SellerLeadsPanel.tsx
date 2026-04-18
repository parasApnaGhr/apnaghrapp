// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserPlus, Phone, Mail, MapPin, Calendar, Clock, 
  CheckCircle, XCircle, MessageCircle, ExternalLink,
  Filter, Search, RefreshCw, Bell, BellOff, Settings,
  ChevronDown, ChevronRight, Building2, IndianRupee
} from 'lucide-react';
import api from '../utils/api';
import { toast } from 'sonner';

const LEAD_STATUSES = [
  { value: 'new', label: 'New', color: 'bg-blue-100 text-blue-700' },
  { value: 'contacted', label: 'Contacted', color: 'bg-purple-100 text-purple-700' },
  { value: 'interested', label: 'Interested', color: 'bg-green-100 text-green-700' },
  { value: 'site_visit', label: 'Site Visit', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'negotiating', label: 'Negotiating', color: 'bg-orange-100 text-orange-700' },
  { value: 'converted', label: 'Converted', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'lost', label: 'Lost', color: 'bg-red-100 text-red-700' }
];

const SellerLeadsPanel = ({ sellerId }) => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [leadSettings, setLeadSettings] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [filter, setFilter] = useState({ status: '', search: '' });
  const [selectedLead, setSelectedLead] = useState(null);
  const [stats, setStats] = useState({ total: 0, new: 0, converted: 0 });

  useEffect(() => {
    loadLeads();
    loadLeadSettings();
  }, []);

  const loadLeads = async () => {
    try {
      setLoading(true);
      const response = await api.get('/seller/leads');
      setLeads(response.data.leads || []);
      setStats(response.data.stats || { total: 0, new: 0, converted: 0 });
    } catch (error) {
      console.error('Error loading leads:', error);
      if (error.response?.status !== 403) {
        toast.error('Failed to load leads');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadLeadSettings = async () => {
    try {
      const response = await api.get('/seller/lead-settings');
      setLeadSettings(response.data);
    } catch (error) {
      console.error('Error loading lead settings:', error);
    }
  };

  const updateLeadStatus = async (leadId, newStatus, notes = '') => {
    try {
      await api.patch(`/seller/leads/${leadId}`, { 
        status: newStatus,
        notes: notes 
      });
      toast.success('Lead status updated');
      loadLeads();
    } catch (error) {
      toast.error('Failed to update lead');
    }
  };

  const toggleLeadReceiving = async () => {
    try {
      const response = await api.patch('/seller/lead-settings', {
        can_receive_leads: !leadSettings?.can_receive_leads
      });
      setLeadSettings(response.data);
      toast.success(response.data.can_receive_leads ? 'Now receiving leads' : 'Lead receiving paused');
    } catch (error) {
      toast.error('Failed to update settings');
    }
  };

  const updateLeadAreas = async (areas) => {
    try {
      await api.patch('/seller/lead-settings', { lead_areas: areas });
      toast.success('Lead areas updated');
      loadLeadSettings();
    } catch (error) {
      toast.error('Failed to update areas');
    }
  };

  const filteredLeads = leads.filter(lead => {
    if (filter.status && lead.status !== filter.status) return false;
    if (filter.search) {
      const search = filter.search.toLowerCase();
      return (
        lead.name?.toLowerCase().includes(search) ||
        lead.phone?.includes(search) ||
        lead.property_title?.toLowerCase().includes(search) ||
        lead.city?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const getStatusBadge = (status) => {
    const statusConfig = LEAD_STATUSES.find(s => s.value === status);
    return statusConfig || { label: status, color: 'bg-gray-100 text-gray-700' };
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Check if seller can receive leads
  if (leadSettings && !leadSettings.can_receive_leads && !leadSettings.admin_enabled) {
    return (
      <div className="bg-gradient-to-br from-[#04473C]/5 to-[#C6A87C]/10 rounded-xl p-8 text-center">
        <BellOff className="w-12 h-12 text-[#4A4D53] mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-[#1A1C20] mb-2">Lead Receiving Not Enabled</h3>
        <p className="text-[#4A4D53] mb-4">
          Contact admin to enable lead receiving for your account.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#1A1C20]">My Leads</h2>
          <p className="text-sm text-[#4A4D53]">Leads assigned to you by admin</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Stats Cards */}
          <div className="flex gap-2">
            <div className="bg-blue-50 px-3 py-2 rounded-lg">
              <div className="text-lg font-bold text-blue-700">{stats.total}</div>
              <div className="text-xs text-blue-600">Total</div>
            </div>
            <div className="bg-green-50 px-3 py-2 rounded-lg">
              <div className="text-lg font-bold text-green-700">{stats.new}</div>
              <div className="text-xs text-green-600">New</div>
            </div>
            <div className="bg-purple-50 px-3 py-2 rounded-lg">
              <div className="text-lg font-bold text-purple-700">{stats.converted}</div>
              <div className="text-xs text-purple-600">Converted</div>
            </div>
          </div>
          
          {/* Toggle Receiving */}
          <button
            onClick={toggleLeadReceiving}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              leadSettings?.can_receive_leads
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {leadSettings?.can_receive_leads ? (
              <>
                <Bell className="w-4 h-4" />
                Receiving
              </>
            ) : (
              <>
                <BellOff className="w-4 h-4" />
                Paused
              </>
            )}
          </button>
          
          {/* Settings */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Settings className="w-5 h-5 text-[#4A4D53]" />
          </button>
          
          {/* Refresh */}
          <button
            onClick={loadLeads}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-5 h-5 text-[#4A4D53] ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-white rounded-xl border border-[#E5E1DB] p-4 overflow-hidden"
          >
            <h3 className="font-semibold text-[#1A1C20] mb-3">Lead Preferences</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-[#4A4D53] mb-1 block">Preferred Areas (for auto-assignment)</label>
                <input
                  type="text"
                  placeholder="e.g., Patiala, Chandigarh, Mohali"
                  defaultValue={leadSettings?.lead_areas?.join(', ') || ''}
                  onBlur={(e) => {
                    const areas = e.target.value.split(',').map(a => a.trim()).filter(Boolean);
                    updateLeadAreas(areas);
                  }}
                  className="w-full px-4 py-2 border border-[#E5E1DB] rounded-lg focus:ring-2 focus:ring-[#04473C]/20"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8D91]" />
          <input
            type="text"
            placeholder="Search leads..."
            value={filter.search}
            onChange={(e) => setFilter({ ...filter, search: e.target.value })}
            className="w-full pl-10 pr-4 py-2 border border-[#E5E1DB] rounded-lg focus:ring-2 focus:ring-[#04473C]/20"
          />
        </div>
        
        <select
          value={filter.status}
          onChange={(e) => setFilter({ ...filter, status: e.target.value })}
          className="px-4 py-2 border border-[#E5E1DB] rounded-lg focus:ring-2 focus:ring-[#04473C]/20"
        >
          <option value="">All Status</option>
          {LEAD_STATUSES.map(status => (
            <option key={status.value} value={status.value}>{status.label}</option>
          ))}
        </select>
      </div>

      {/* Leads List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <RefreshCw className="w-8 h-8 text-[#04473C] animate-spin" />
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-8 text-center">
          <UserPlus className="w-12 h-12 text-[#4A4D53] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[#1A1C20] mb-2">No Leads Yet</h3>
          <p className="text-[#4A4D53]">
            {leadSettings?.can_receive_leads 
              ? 'New leads will appear here when assigned by admin'
              : 'Enable lead receiving to start getting leads'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLeads.map((lead) => (
            <motion.div
              key={lead.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border border-[#E5E1DB] p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-[#1A1C20]">{lead.name || 'Unknown'}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(lead.status).color}`}>
                      {getStatusBadge(lead.status).label}
                    </span>
                    {lead.is_hot && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                        🔥 Hot Lead
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-[#4A4D53]">
                    {lead.phone && (
                      <a href={`tel:${lead.phone}`} className="flex items-center gap-1 hover:text-[#04473C]">
                        <Phone className="w-3 h-3" />
                        {lead.phone}
                      </a>
                    )}
                    {lead.city && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {lead.city}
                      </span>
                    )}
                    {lead.budget && (
                      <span className="flex items-center gap-1">
                        <IndianRupee className="w-3 h-3" />
                        {lead.budget}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(lead.created_at)}
                    </span>
                  </div>
                  
                  {lead.property_title && (
                    <div className="mt-2 flex items-center gap-1 text-sm text-[#04473C]">
                      <Building2 className="w-3 h-3" />
                      {lead.property_title}
                    </div>
                  )}
                  
                  {lead.notes && (
                    <p className="mt-2 text-sm text-[#4A4D53] bg-gray-50 p-2 rounded-lg">
                      {lead.notes}
                    </p>
                  )}
                </div>
                
                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <select
                    value={lead.status}
                    onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                    className="px-2 py-1 text-sm border border-[#E5E1DB] rounded-lg"
                  >
                    {LEAD_STATUSES.map(status => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                  
                  {lead.phone && (
                    <a
                      href={`https://wa.me/91${lead.phone}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200"
                    >
                      <MessageCircle className="w-3 h-3" />
                      WhatsApp
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SellerLeadsPanel;
