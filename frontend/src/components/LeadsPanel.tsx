// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, Phone, Mail, Home, Eye, MousePointer, Calendar, 
  Share2, Filter, Search, ChevronDown, ChevronUp, Clock,
  CheckCircle, XCircle, MessageSquare, TrendingUp, UserPlus,
  ExternalLink, Trash2, Edit2, Save, X
} from 'lucide-react';
import api from '../utils/api';

const LeadsPanel = () => {
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ source: '', status: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedLead, setExpandedLead] = useState(null);
  const [editingLead, setEditingLead] = useState(null);
  const [editForm, setEditForm] = useState({});

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter.source) params.append('source', filter.source);
      if (filter.status) params.append('status', filter.status);
      
      const response = await api.get(`/admin/leads?${params.toString()}`);
      setLeads(response.data.leads || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get('/admin/leads/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
    fetchStats();
  }, [fetchLeads, fetchStats]);

  const updateLead = async (leadId, data) => {
    try {
      await api.patch(`/admin/leads/${leadId}`, data);
      fetchLeads();
      fetchStats();
      setEditingLead(null);
    } catch (error) {
      console.error('Error updating lead:', error);
    }
  };

  const deleteLead = async (leadId) => {
    if (!window.confirm('Are you sure you want to delete this lead?')) return;
    try {
      await api.delete(`/admin/leads/${leadId}`);
      fetchLeads();
      fetchStats();
    } catch (error) {
      console.error('Error deleting lead:', error);
    }
  };

  const getSourceIcon = (source) => {
    switch (source) {
      case 'app_visit': return <Eye className="w-4 h-4" />;
      case 'property_view': return <Home className="w-4 h-4" />;
      case 'property_click': 
      case 'image_click': return <MousePointer className="w-4 h-4" />;
      case 'visit_booking': return <Calendar className="w-4 h-4" />;
      case 'seller_referral': return <Share2 className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  const getSourceLabel = (source) => {
    const labels = {
      'app_visit': 'App Visit',
      'property_view': 'Property View',
      'property_click': 'Property Click',
      'image_click': 'Image Click',
      'visit_booking': 'Visit Booking',
      'seller_referral': 'Seller Referral'
    };
    return labels[source] || source;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-700';
      case 'contacted': return 'bg-yellow-100 text-yellow-700';
      case 'interested': return 'bg-green-100 text-green-700';
      case 'not_interested': return 'bg-red-100 text-red-700';
      case 'converted': return 'bg-purple-100 text-purple-700';
      case 'closed': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const filteredLeads = leads.filter(lead => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      lead.name?.toLowerCase().includes(query) ||
      lead.phone?.includes(query) ||
      lead.property_title?.toLowerCase().includes(query) ||
      lead.referred_by_seller_name?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white border border-[#E5E1DB] p-4 text-center">
            <div className="text-3xl font-bold text-[#04473C]">{stats.total || 0}</div>
            <div className="text-xs text-[#4A4D53]">Total Leads</div>
          </div>
          <div className="bg-white border border-[#E5E1DB] p-4 text-center">
            <div className="text-3xl font-bold text-blue-600">{stats.today || 0}</div>
            <div className="text-xs text-[#4A4D53]">Today</div>
          </div>
          <div className="bg-white border border-[#E5E1DB] p-4 text-center">
            <div className="text-3xl font-bold text-green-600">{stats.by_status?.interested || 0}</div>
            <div className="text-xs text-[#4A4D53]">Interested</div>
          </div>
          <div className="bg-white border border-[#E5E1DB] p-4 text-center">
            <div className="text-3xl font-bold text-purple-600">{stats.by_status?.converted || 0}</div>
            <div className="text-xs text-[#4A4D53]">Converted</div>
          </div>
          <div className="bg-white border border-[#E5E1DB] p-4 text-center">
            <div className="text-3xl font-bold text-[#C6A87C]">{stats.seller_referrals || 0}</div>
            <div className="text-xs text-[#4A4D53]">Seller Referrals</div>
          </div>
        </div>
      )}

      {/* Source Breakdown */}
      {stats?.by_source && (
        <div className="bg-white border border-[#E5E1DB] p-4">
          <h3 className="font-bold mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#04473C]" />
            Lead Sources
          </h3>
          <div className="flex flex-wrap gap-3">
            {Object.entries(stats.by_source).map(([source, count]) => (
              <div 
                key={source}
                onClick={() => setFilter({...filter, source: filter.source === source ? '' : source})}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all ${
                  filter.source === source ? 'bg-[#04473C] text-white' : 'bg-[#F5F3F0] hover:bg-[#E5E1DB]'
                }`}
              >
                {getSourceIcon(source)}
                <span className="text-sm font-medium">{getSourceLabel(source)}</span>
                <span className="text-sm font-bold">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters & Search */}
      <div className="bg-white border border-[#E5E1DB] p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, phone, property, or seller..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#E5E1DB] rounded-lg focus:ring-2 focus:ring-[#04473C] focus:border-transparent"
            />
          </div>
          <select
            value={filter.status}
            onChange={(e) => setFilter({...filter, status: e.target.value})}
            className="px-4 py-2 border border-[#E5E1DB] rounded-lg focus:ring-2 focus:ring-[#04473C]"
          >
            <option value="">All Status</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="interested">Interested</option>
            <option value="not_interested">Not Interested</option>
            <option value="converted">Converted</option>
            <option value="closed">Closed</option>
          </select>
          <button
            onClick={() => { setFilter({ source: '', status: '' }); setSearchQuery(''); }}
            className="px-4 py-2 text-[#04473C] hover:bg-[#F5F3F0] rounded-lg"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Leads List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12 text-[#4A4D53]">Loading leads...</div>
        ) : filteredLeads.length === 0 ? (
          <div className="bg-white border border-[#E5E1DB] p-12 text-center">
            <Users className="w-12 h-12 text-[#D0C9C0] mx-auto mb-3" />
            <p className="text-[#4A4D53]">No leads found</p>
          </div>
        ) : (
          filteredLeads.map((lead) => (
            <motion.div
              key={lead.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-[#E5E1DB] overflow-hidden"
            >
              {/* Lead Header */}
              <div 
                className="p-4 cursor-pointer hover:bg-[#F5F3F0]/50"
                onClick={() => setExpandedLead(expandedLead === lead.id ? null : lead.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Source Badge */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      lead.source === 'seller_referral' ? 'bg-[#C6A87C]/20 text-[#C6A87C]' :
                      lead.source === 'visit_booking' ? 'bg-green-100 text-green-600' :
                      'bg-[#04473C]/10 text-[#04473C]'
                    }`}>
                      {getSourceIcon(lead.source)}
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg">{lead.name || 'Unknown'}</span>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(lead.status)}`}>
                          {lead.status?.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-[#4A4D53]">
                        {lead.phone && (
                          <a href={`tel:${lead.phone}`} className="flex items-center gap-1 hover:text-[#04473C]">
                            <Phone className="w-3 h-3" />
                            {lead.phone}
                          </a>
                        )}
                        <span className="flex items-center gap-1">
                          {getSourceIcon(lead.source)}
                          {getSourceLabel(lead.source)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {/* Seller Referral Badge */}
                    {lead.referred_by_seller_name && (
                      <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-[#C6A87C]/20 rounded-lg">
                        <Share2 className="w-4 h-4 text-[#C6A87C]" />
                        <span className="text-sm font-medium text-[#8B6914]">
                          via {lead.referred_by_seller_name}
                        </span>
                      </div>
                    )}
                    
                    <div className="text-right text-xs text-[#4A4D53]">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {new Date(lead.created_at).toLocaleDateString()}
                    </div>
                    
                    {expandedLead === lead.id ? 
                      <ChevronUp className="w-5 h-5 text-gray-400" /> : 
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    }
                  </div>
                </div>
              </div>
              
              {/* Expanded Details */}
              {expandedLead === lead.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="border-t border-[#E5E1DB] p-4 bg-[#F5F3F0]/30"
                >
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Lead Details */}
                    <div className="space-y-4">
                      <h4 className="font-bold text-sm text-[#04473C]">Lead Details</h4>
                      
                      {lead.property_title && (
                        <div className="bg-white p-3 rounded-lg border border-[#E5E1DB]">
                          <div className="flex items-center gap-2 text-sm">
                            <Home className="w-4 h-4 text-[#04473C]" />
                            <span className="font-medium">{lead.property_title}</span>
                          </div>
                          {lead.property_city && (
                            <p className="text-xs text-[#4A4D53] mt-1">{lead.property_city}</p>
                          )}
                        </div>
                      )}
                      
                      {lead.referred_by_seller_name && (
                        <div className="bg-[#C6A87C]/10 p-3 rounded-lg border border-[#C6A87C]/30">
                          <div className="flex items-center gap-2 text-sm">
                            <Share2 className="w-4 h-4 text-[#C6A87C]" />
                            <span className="font-medium">Referred by: {lead.referred_by_seller_name}</span>
                          </div>
                          {lead.seller_referral_code && (
                            <p className="text-xs text-[#4A4D53] mt-1">Code: {lead.seller_referral_code}</p>
                          )}
                        </div>
                      )}
                      
                      {lead.visit_id && (
                        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-green-600" />
                            <span className="font-medium">Visit Booked</span>
                          </div>
                          {lead.visit_date && (
                            <p className="text-xs text-[#4A4D53] mt-1">Date: {lead.visit_date}</p>
                          )}
                          {lead.visit_status && (
                            <p className="text-xs text-green-600 mt-1">Status: {lead.visit_status}</p>
                          )}
                        </div>
                      )}
                      
                      <div className="text-xs text-[#4A4D53] space-y-1">
                        {lead.device_info && <p>Device: {lead.device_info}</p>}
                        {lead.page_url && <p>Page: {lead.page_url}</p>}
                        {lead.ip_address && <p>IP: {lead.ip_address}</p>}
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="space-y-4">
                      <h4 className="font-bold text-sm text-[#04473C]">Actions</h4>
                      
                      {editingLead === lead.id ? (
                        <div className="space-y-3">
                          <input
                            type="text"
                            placeholder="Name"
                            value={editForm.name || ''}
                            onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                            className="w-full px-3 py-2 border border-[#E5E1DB] rounded-lg"
                          />
                          <input
                            type="tel"
                            placeholder="Phone"
                            value={editForm.phone || ''}
                            onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                            className="w-full px-3 py-2 border border-[#E5E1DB] rounded-lg"
                          />
                          <textarea
                            placeholder="Notes"
                            value={editForm.notes || ''}
                            onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                            className="w-full px-3 py-2 border border-[#E5E1DB] rounded-lg"
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => updateLead(lead.id, editForm)}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#04473C] text-white rounded-lg hover:bg-[#033530]"
                            >
                              <Save className="w-4 h-4" /> Save
                            </button>
                            <button
                              onClick={() => setEditingLead(null)}
                              className="px-4 py-2 border border-[#E5E1DB] rounded-lg hover:bg-[#F5F3F0]"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Status Update Buttons */}
                          <div className="flex flex-wrap gap-2">
                            {['contacted', 'interested', 'not_interested', 'converted', 'closed'].map((status) => (
                              <button
                                key={status}
                                onClick={() => updateLead(lead.id, { status })}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                                  lead.status === status 
                                    ? getStatusColor(status)
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                              >
                                {status.replace('_', ' ').toUpperCase()}
                              </button>
                            ))}
                          </div>
                          
                          {/* Quick Actions */}
                          <div className="flex gap-2">
                            {lead.phone && (
                              <a
                                href={`tel:${lead.phone}`}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                              >
                                <Phone className="w-4 h-4" /> Call
                              </a>
                            )}
                            {lead.phone && (
                              <a
                                href={`https://wa.me/91${lead.phone}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                              >
                                <MessageSquare className="w-4 h-4" /> WhatsApp
                              </a>
                            )}
                          </div>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setEditingLead(lead.id);
                                setEditForm({ name: lead.name, phone: lead.phone, notes: lead.notes });
                              }}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-[#E5E1DB] rounded-lg hover:bg-[#F5F3F0]"
                            >
                              <Edit2 className="w-4 h-4" /> Edit
                            </button>
                            <button
                              onClick={() => deleteLead(lead.id)}
                              className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          
                          {/* Notes */}
                          {lead.notes && (
                            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                              <p className="text-sm text-yellow-800">{lead.notes}</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default LeadsPanel;
