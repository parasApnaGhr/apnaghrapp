import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { sellerAPI, getMediaUrl } from '../utils/api';
import { 
  Users, Home, DollarSign, LogOut, Share2, MessageCircle, 
  MapPin, Phone, Clock, TrendingUp, Wallet, Search, 
  Filter, Send, X, ExternalLink, CheckCircle, AlertCircle,
  Navigation, RefreshCw, Copy, Eye
} from 'lucide-react';
import { toast } from 'sonner';

const SellerDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  
  // Dashboard data
  const [dashboard, setDashboard] = useState(null);
  
  // Properties
  const [properties, setProperties] = useState([]);
  const [propertyFilters, setPropertyFilters] = useState({ city: '', min_rent: '', max_rent: '', bhk: '' });
  
  // Referrals
  const [referrals, setReferrals] = useState([]);
  
  // Visits
  const [visits, setVisits] = useState([]);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [trackingData, setTrackingData] = useState(null);
  
  // Chat
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showChat, setShowChat] = useState(false);
  const chatEndRef = useRef(null);
  
  // Commissions
  const [commissions, setCommissions] = useState(null);

  // Share modal
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareProperty, setShareProperty] = useState(null);
  const [shareData, setShareData] = useState(null);
  
  useEffect(() => {
    if (user?.approval_status === 'approved') {
      loadDashboard();
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'properties') loadProperties();
    if (activeTab === 'referrals') loadReferrals();
    if (activeTab === 'visits') loadVisits();
    if (activeTab === 'earnings') loadCommissions();
  }, [activeTab]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const response = await sellerAPI.getDashboard();
      setDashboard(response.data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      if (error.response?.status === 403) {
        toast.error('Account pending approval');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadProperties = async () => {
    try {
      const cleanFilters = {};
      if (propertyFilters.city) cleanFilters.city = propertyFilters.city;
      if (propertyFilters.min_rent) cleanFilters.min_rent = propertyFilters.min_rent;
      if (propertyFilters.max_rent) cleanFilters.max_rent = propertyFilters.max_rent;
      if (propertyFilters.bhk) cleanFilters.bhk = propertyFilters.bhk;
      
      const response = await sellerAPI.getProperties(cleanFilters);
      setProperties(response.data || []);
    } catch (error) {
      toast.error('Failed to load properties');
    }
  };

  const loadReferrals = async () => {
    try {
      const response = await sellerAPI.getReferrals();
      setReferrals(response.data || []);
    } catch (error) {
      toast.error('Failed to load referrals');
    }
  };

  const loadVisits = async () => {
    try {
      const response = await sellerAPI.getVisits();
      setVisits(response.data || []);
    } catch (error) {
      toast.error('Failed to load visits');
    }
  };

  const loadCommissions = async () => {
    try {
      const response = await sellerAPI.getCommissions();
      setCommissions(response.data);
    } catch (error) {
      toast.error('Failed to load commissions');
    }
  };

  const handleShareProperty = async (property) => {
    try {
      const response = await sellerAPI.shareProperty({ property_id: property.id });
      setShareData(response.data);
      setShareProperty(property);
      setShowShareModal(true);
    } catch (error) {
      toast.error('Failed to generate share link');
    }
  };

  const openWhatsApp = () => {
    if (shareData) {
      const appUrl = window.location.origin;
      const message = shareData.whatsapp_message.replace('{APP_URL}', appUrl);
      const encoded = encodeURIComponent(message);
      window.open(`https://wa.me/?text=${encoded}`, '_blank');
    }
  };

  const copyShareLink = () => {
    if (shareData && shareProperty) {
      const link = `${window.location.origin}/customer/property/${shareProperty.id}${shareData.share_url}`;
      navigator.clipboard.writeText(link);
      toast.success('Link copied to clipboard!');
    }
  };

  const handleTrackVisit = async (visit) => {
    try {
      setSelectedVisit(visit);
      const response = await sellerAPI.trackVisit(visit.id);
      setTrackingData(response.data);
    } catch (error) {
      toast.error('Failed to load tracking info');
    }
  };

  const openChat = async (visit) => {
    try {
      setSelectedVisit(visit);
      const response = await sellerAPI.getChatMessages(visit.id);
      setChatMessages(response.data || []);
      setShowChat(true);
    } catch (error) {
      toast.error('Failed to load chat');
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedVisit) return;
    
    try {
      await sellerAPI.sendChatMessage(selectedVisit.id, newMessage);
      setChatMessages([...chatMessages, {
        id: Date.now(),
        sender_id: user.id,
        sender_role: 'seller',
        message: newMessage,
        created_at: new Date().toISOString()
      }]);
      setNewMessage('');
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  // Pending approval state
  if (user?.approval_status === 'pending') {
    return (
      <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center p-6">
        <div className="bg-white border border-[#E5E1DB] p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-[#C6A87C] mx-auto mb-4" />
          <h2 className="text-2xl mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>Account Pending Approval</h2>
          <p className="text-[#4A4D53] mb-6">Your seller account is being reviewed by our team. You'll be notified once approved.</p>
          <button onClick={logout} className="btn-secondary">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </button>
        </div>
      </div>
    );
  }

  if (user?.approval_status === 'rejected') {
    return (
      <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center p-6">
        <div className="bg-white border border-[#E5E1DB] p-8 max-w-md text-center">
          <X className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>Account Rejected</h2>
          <p className="text-[#4A4D53] mb-2">Your seller account application was not approved.</p>
          {user.rejection_reason && (
            <p className="text-sm text-red-600 mb-6">Reason: {user.rejection_reason}</p>
          )}
          <button onClick={logout} className="btn-secondary">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB] pb-24">
      {/* Header */}
      <header className="glass-header sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl tracking-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
                Seller Dashboard
              </h1>
              <p className="text-sm text-[#4A4D53]">Welcome, {user?.name}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-3 py-1 bg-[#E6F0EE] text-[#04473C] text-sm font-medium">
                Code: {user?.referral_code || dashboard?.referral_code}
              </div>
              <button onClick={logout} className="btn-secondary flex items-center gap-2" data-testid="logout-button">
                <LogOut className="w-4 h-4" strokeWidth={1.5} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-[#E5E1DB]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1 overflow-x-auto">
            {[
              { id: 'dashboard', label: 'Overview', icon: TrendingUp },
              { id: 'properties', label: 'Properties', icon: Home },
              { id: 'referrals', label: 'My Referrals', icon: Users },
              { id: 'visits', label: 'Client Visits', icon: MapPin },
              { id: 'earnings', label: 'Earnings', icon: Wallet },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-[#04473C] border-b-2 border-[#04473C]'
                    : 'text-[#4A4D53] hover:text-[#1A1C20]'
                }`}
                data-testid={`tab-${tab.id}`}
              >
                <tab.icon className="w-4 h-4" strokeWidth={1.5} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Dashboard Overview */}
        {activeTab === 'dashboard' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {loading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-2 border-[#04473C] border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : dashboard ? (
              <>
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-white border border-[#E5E1DB] p-6">
                    <p className="text-sm text-[#4A4D53] uppercase tracking-wide">Total Referrals</p>
                    <p className="text-3xl font-medium mt-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                      {dashboard.stats?.total_referrals || 0}
                    </p>
                  </div>
                  <div className="bg-white border border-[#E5E1DB] p-6">
                    <p className="text-sm text-[#4A4D53] uppercase tracking-wide">Converted</p>
                    <p className="text-3xl font-medium mt-2 text-[#04473C]" style={{ fontFamily: 'Playfair Display, serif' }}>
                      {dashboard.stats?.converted_referrals || 0}
                    </p>
                  </div>
                  <div className="bg-white border border-[#E5E1DB] p-6">
                    <p className="text-sm text-[#4A4D53] uppercase tracking-wide">Deals Closed</p>
                    <p className="text-3xl font-medium mt-2 text-[#C6A87C]" style={{ fontFamily: 'Playfair Display, serif' }}>
                      {dashboard.stats?.closed_deals || 0}
                    </p>
                  </div>
                  <div className="bg-white border border-[#E5E1DB] p-6">
                    <p className="text-sm text-[#4A4D53] uppercase tracking-wide">Conversion Rate</p>
                    <p className="text-3xl font-medium mt-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                      {dashboard.stats?.conversion_rate || 0}%
                    </p>
                  </div>
                </div>

                {/* Wallet Summary */}
                {dashboard.wallet && (
                  <div className="bg-[#04473C] text-white p-6 mb-8">
                    <h3 className="text-lg mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>Your Earnings</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-white/70">Total Earned</p>
                        <p className="text-2xl font-medium">₹{dashboard.wallet.total_earnings?.toLocaleString() || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-white/70">Pending</p>
                        <p className="text-2xl font-medium text-[#C6A87C]">₹{dashboard.wallet.pending_earnings?.toLocaleString() || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-white/70">Approved</p>
                        <p className="text-2xl font-medium text-green-400">₹{dashboard.wallet.approved_earnings?.toLocaleString() || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-white/70">Paid Out</p>
                        <p className="text-2xl font-medium">₹{dashboard.wallet.paid_earnings?.toLocaleString() || 0}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recent Referrals */}
                <div className="bg-white border border-[#E5E1DB] p-6">
                  <h3 className="text-lg mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>Recent Referrals</h3>
                  {dashboard.recent_referrals?.length > 0 ? (
                    <div className="space-y-3">
                      {dashboard.recent_referrals.slice(0, 5).map((ref) => (
                        <div key={ref.id} className="flex items-center justify-between p-3 bg-[#F5F3F0]">
                          <div>
                            <p className="font-medium">{ref.client_name || 'Pending'}</p>
                            <p className="text-sm text-[#4A4D53]">{ref.property?.title || 'Property'}</p>
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium ${
                            ref.status === 'deal_closed' ? 'bg-green-100 text-green-700' :
                            ref.status === 'booked' ? 'bg-blue-100 text-blue-700' :
                            ref.status === 'registered' ? 'bg-[#C6A87C]/20 text-[#C6A87C]' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {ref.status?.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[#4A4D53] text-center py-8">No referrals yet. Start sharing properties!</p>
                  )}
                </div>
              </>
            ) : null}
          </motion.div>
        )}

        {/* Properties Tab */}
        {activeTab === 'properties' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Filters */}
            <div className="bg-white border border-[#E5E1DB] p-4 mb-6">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <input
                  type="text"
                  placeholder="City"
                  value={propertyFilters.city}
                  onChange={(e) => setPropertyFilters({ ...propertyFilters, city: e.target.value })}
                  className="premium-input py-2 text-sm"
                />
                <input
                  type="number"
                  placeholder="Min Rent"
                  value={propertyFilters.min_rent}
                  onChange={(e) => setPropertyFilters({ ...propertyFilters, min_rent: e.target.value })}
                  className="premium-input py-2 text-sm"
                />
                <input
                  type="number"
                  placeholder="Max Rent"
                  value={propertyFilters.max_rent}
                  onChange={(e) => setPropertyFilters({ ...propertyFilters, max_rent: e.target.value })}
                  className="premium-input py-2 text-sm"
                />
                <select
                  value={propertyFilters.bhk}
                  onChange={(e) => setPropertyFilters({ ...propertyFilters, bhk: e.target.value })}
                  className="premium-input py-2 text-sm"
                >
                  <option value="">All BHK</option>
                  <option value="1BHK">1 BHK</option>
                  <option value="2BHK">2 BHK</option>
                  <option value="3BHK">3 BHK</option>
                </select>
                <button onClick={loadProperties} className="btn-primary py-2 text-sm">
                  <Search className="w-4 h-4 mr-1" /> Search
                </button>
              </div>
            </div>

            {/* Property Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property) => (
                <div key={property.id} className="bg-white border border-[#E5E1DB] overflow-hidden">
                  <div className="aspect-[4/3] bg-[#F5F3F0]">
                    {property.images?.[0] ? (
                      <img
                        src={getMediaUrl(property.images[0])}
                        alt={property.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Home className="w-12 h-12 text-[#D0C9C0]" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-lg mb-1">{property.title}</h3>
                    <p className="text-sm text-[#4A4D53] mb-2">
                      <MapPin className="w-3 h-3 inline mr-1" />
                      {property.area_name}, {property.city}
                    </p>
                    <p className="text-sm text-[#4A4D53] mb-3">
                      {property.bhk} BHK | {property.furnishing}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="price-display">
                        <span className="price-currency text-sm">₹</span>
                        {property.rent?.toLocaleString()}/mo
                      </p>
                      <button
                        onClick={() => handleShareProperty(property)}
                        className="btn-primary py-2 px-4 text-sm flex items-center gap-1"
                        data-testid={`share-${property.id}`}
                      >
                        <Share2 className="w-4 h-4" />
                        Share
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Referrals Tab */}
        {activeTab === 'referrals' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="space-y-4">
              {referrals.length === 0 ? (
                <div className="bg-white border border-[#E5E1DB] p-12 text-center">
                  <Users className="w-12 h-12 text-[#D0C9C0] mx-auto mb-3" />
                  <p className="text-[#4A4D53]">No referrals yet</p>
                  <p className="text-sm text-[#4A4D53] mt-1">Share properties to start tracking referrals</p>
                </div>
              ) : (
                referrals.map((ref) => (
                  <div key={ref.id} className="bg-white border border-[#E5E1DB] p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-[#04473C] text-white flex items-center justify-center font-medium">
                            {ref.client_name?.[0] || '?'}
                          </div>
                          <div>
                            <p className="font-medium">{ref.client_name || 'Pending Conversion'}</p>
                            {ref.client_phone && (
                              <p className="text-sm text-[#4A4D53]">{ref.client_phone}</p>
                            )}
                          </div>
                        </div>
                        {ref.property && (
                          <p className="text-sm text-[#4A4D53] mb-2">
                            <Home className="w-3 h-3 inline mr-1" />
                            {ref.property.title} • ₹{ref.property.rent?.toLocaleString()}/mo
                          </p>
                        )}
                        <p className="text-xs text-[#4A4D53]">
                          <Clock className="w-3 h-3 inline mr-1" />
                          Shared {new Date(ref.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 text-xs font-medium ${
                          ref.status === 'deal_closed' ? 'bg-green-100 text-green-700' :
                          ref.status === 'visited' ? 'bg-blue-100 text-blue-700' :
                          ref.status === 'booked' ? 'bg-[#C6A87C]/20 text-[#C6A87C]' :
                          ref.status === 'registered' ? 'bg-purple-100 text-purple-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {ref.status?.replace('_', ' ').toUpperCase()}
                        </span>
                        {ref.commission_amount && (
                          <p className="text-lg font-medium text-green-600 mt-2">
                            +₹{ref.commission_amount.toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}

        {/* Visits Tab */}
        {activeTab === 'visits' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Client Visits</h3>
              <button onClick={loadVisits} className="p-2 hover:bg-[#F5F3F0]">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-4">
              {visits.length === 0 ? (
                <div className="bg-white border border-[#E5E1DB] p-12 text-center">
                  <MapPin className="w-12 h-12 text-[#D0C9C0] mx-auto mb-3" />
                  <p className="text-[#4A4D53]">No client visits yet</p>
                </div>
              ) : (
                visits.map((visit) => (
                  <div key={visit.id} className="bg-white border border-[#E5E1DB] p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-medium">{visit.customer?.name || 'Client'}</p>
                        <p className="text-sm text-[#4A4D53]">{visit.customer?.phone}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium ${
                        visit.status === 'completed' ? 'bg-green-100 text-green-700' :
                        visit.status === 'at_property' ? 'bg-blue-100 text-blue-700' :
                        visit.status === 'rider_assigned' ? 'bg-[#C6A87C]/20 text-[#C6A87C]' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {visit.status?.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>

                    <div className="text-sm text-[#4A4D53] mb-3">
                      <p><Clock className="w-3 h-3 inline mr-1" /> {visit.scheduled_date} at {visit.scheduled_time}</p>
                      <p><Home className="w-3 h-3 inline mr-1" /> {visit.properties?.length || 0} properties</p>
                    </div>

                    {visit.rider && (
                      <div className="bg-[#F5F3F0] p-3 mb-3">
                        <p className="text-sm font-medium">Rider: {visit.rider.name}</p>
                        <p className="text-xs text-[#4A4D53]">
                          {visit.rider.is_online ? '🟢 Online' : '⚫ Offline'}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleTrackVisit(visit)}
                        className="btn-secondary py-2 px-3 text-sm flex items-center gap-1 flex-1"
                        data-testid={`track-${visit.id}`}
                      >
                        <Navigation className="w-4 h-4" />
                        Track
                      </button>
                      {visit.rider_id && (
                        <button
                          onClick={() => openChat(visit)}
                          className="btn-primary py-2 px-3 text-sm flex items-center gap-1 flex-1"
                          data-testid={`chat-${visit.id}`}
                        >
                          <MessageCircle className="w-4 h-4" />
                          Chat with Rider
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}

        {/* Earnings Tab */}
        {activeTab === 'earnings' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {commissions && (
              <>
                {/* Wallet Card */}
                <div className="bg-[#04473C] text-white p-6 mb-6">
                  <h3 className="text-lg mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>Wallet</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-white/70">Total Earned</p>
                      <p className="text-2xl font-medium">₹{commissions.wallet?.total_earnings?.toLocaleString() || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-white/70">Pending</p>
                      <p className="text-2xl font-medium text-[#C6A87C]">₹{commissions.wallet?.pending_earnings?.toLocaleString() || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-white/70">Approved</p>
                      <p className="text-2xl font-medium text-green-400">₹{commissions.wallet?.approved_earnings?.toLocaleString() || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-white/70">Paid</p>
                      <p className="text-2xl font-medium">₹{commissions.wallet?.paid_earnings?.toLocaleString() || 0}</p>
                    </div>
                  </div>
                </div>

                {/* Commission Structure */}
                <div className="bg-white border border-[#E5E1DB] p-6 mb-6">
                  <h3 className="text-lg mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>Commission Structure</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {commissions.commission_structure?.map((tier, idx) => (
                      <div key={idx} className="p-3 bg-[#F5F3F0] text-center">
                        <p className="text-xs text-[#4A4D53]">₹{tier.min.toLocaleString()} - ₹{tier.max.toLocaleString()}</p>
                        <p className="text-lg font-medium text-[#04473C]">₹{tier.commission.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Commission History */}
                <div className="bg-white border border-[#E5E1DB] p-6">
                  <h3 className="text-lg mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>Commission History</h3>
                  {commissions.commissions?.length > 0 ? (
                    <div className="space-y-3">
                      {commissions.commissions.map((comm) => (
                        <div key={comm.id} className="flex items-center justify-between p-3 bg-[#F5F3F0]">
                          <div>
                            <p className="font-medium">{comm.property?.title || 'Property'}</p>
                            <p className="text-sm text-[#4A4D53]">
                              Brokerage: ₹{comm.brokerage_amount?.toLocaleString()}
                            </p>
                            <p className="text-xs text-[#4A4D53]">
                              {new Date(comm.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-medium text-green-600">
                              +₹{comm.commission_amount?.toLocaleString()}
                            </p>
                            <span className={`text-xs px-2 py-0.5 ${
                              comm.status === 'paid' ? 'bg-green-100 text-green-700' :
                              comm.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                              'bg-[#C6A87C]/20 text-[#C6A87C]'
                            }`}>
                              {comm.status?.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[#4A4D53] text-center py-8">No commissions yet</p>
                  )}
                </div>
              </>
            )}
          </motion.div>
        )}
      </main>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && shareProperty && shareData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowShareModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-[#E5E1DB]">
                <h3 className="text-xl" style={{ fontFamily: 'Playfair Display, serif' }}>Share Property</h3>
              </div>
              <div className="p-6">
                <div className="bg-[#F5F3F0] p-4 mb-4">
                  <p className="font-medium">{shareProperty.title}</p>
                  <p className="text-sm text-[#4A4D53]">{shareProperty.area_name}, {shareProperty.city}</p>
                  <p className="text-sm text-[#4A4D53]">₹{shareProperty.rent?.toLocaleString()}/month</p>
                </div>
                
                <div className="space-y-3">
                  <button
                    onClick={openWhatsApp}
                    className="w-full py-3 bg-[#25D366] text-white font-medium flex items-center justify-center gap-2 hover:bg-[#20bd5a] transition-colors"
                  >
                    <ExternalLink className="w-5 h-5" />
                    Share on WhatsApp
                  </button>
                  
                  <button
                    onClick={copyShareLink}
                    className="w-full py-3 bg-[#04473C] text-white font-medium flex items-center justify-center gap-2 hover:bg-[#03352D] transition-colors"
                  >
                    <Copy className="w-5 h-5" />
                    Copy Link
                  </button>
                </div>
                
                <p className="text-xs text-[#4A4D53] text-center mt-4">
                  Your referral code is automatically included in the link
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Modal */}
      <AnimatePresence>
        {showChat && selectedVisit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50"
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="bg-white w-full md:max-w-md md:mx-4 h-[70vh] md:h-[500px] flex flex-col"
            >
              <div className="p-4 border-b border-[#E5E1DB] flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Chat with Rider</h3>
                  <p className="text-sm text-[#4A4D53]">Visit #{selectedVisit.id.slice(0, 8)}</p>
                </div>
                <button onClick={() => setShowChat(false)} className="p-2 hover:bg-[#F5F3F0]">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`max-w-[80%] p-3 ${
                      msg.sender_role === 'seller'
                        ? 'ml-auto bg-[#04473C] text-white'
                        : 'bg-[#F5F3F0]'
                    }`}
                  >
                    <p className="text-sm">{msg.message}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {new Date(msg.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              
              <div className="p-4 border-t border-[#E5E1DB] flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 premium-input py-2"
                />
                <button onClick={sendMessage} className="btn-primary px-4">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SellerDashboard;
