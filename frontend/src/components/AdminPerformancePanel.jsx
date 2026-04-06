import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Trophy, TrendingUp, Clock, Calendar, AlertTriangle,
  CheckCircle, XCircle, DollarSign, Eye, RefreshCw, Search,
  Award, Target, Zap, ChevronDown, ChevronRight, Plus, Edit,
  Trash2, MessageCircle
} from 'lucide-react';
import api from '../utils/api';
import { toast } from 'sonner';

const AdminPerformancePanel = () => {
  const [activeTab, setActiveTab] = useState('tracking');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [trackingData, setTrackingData] = useState([]);
  const [leaderboard, setLeaderboard] = useState({ daily: [], monthly: [] });
  const [earnings, setEarnings] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [sellerDetail, setSellerDetail] = useState(null);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [newQuote, setNewQuote] = useState({ quote: '', author: '', date: '' });

  useEffect(() => {
    loadData();
  }, [selectedDate, selectedMonth]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [trackingRes, dailyLB, monthlyLB, earningsRes, quotesRes] = await Promise.all([
        api.get(`/seller-performance/admin/sellers-tracking?date=${selectedDate}`),
        api.get('/seller-performance/admin/leaderboard?period=daily'),
        api.get('/seller-performance/admin/leaderboard?period=monthly'),
        api.get(`/seller-performance/admin/earnings?month=${selectedMonth}`),
        api.get('/seller-performance/admin/motivation-quotes')
      ]);
      
      setTrackingData(trackingRes.data);
      setLeaderboard({
        daily: dailyLB.data.leaderboard || [],
        monthly: monthlyLB.data.leaderboard || []
      });
      setEarnings(earningsRes.data);
      setQuotes(quotesRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load performance data');
    } finally {
      setLoading(false);
    }
  };

  const loadSellerDetail = async (sellerId) => {
    try {
      const response = await api.get(`/seller-performance/admin/seller-detail/${sellerId}?month=${selectedMonth}`);
      setSellerDetail(response.data);
      setSelectedSeller(sellerId);
    } catch (error) {
      toast.error('Failed to load seller details');
    }
  };

  const markAsPaid = async (sellerIds) => {
    try {
      await api.post('/seller-performance/admin/mark-paid', sellerIds, {
        params: { month: selectedMonth }
      });
      toast.success('Marked as paid');
      loadData();
    } catch (error) {
      toast.error('Failed to mark as paid');
    }
  };

  const addQuote = async () => {
    if (!newQuote.quote) {
      toast.error('Please enter a quote');
      return;
    }
    try {
      await api.post('/seller-performance/admin/motivation-quote', null, {
        params: newQuote
      });
      toast.success('Quote added');
      setShowQuoteModal(false);
      setNewQuote({ quote: '', author: '', date: '' });
      loadData();
    } catch (error) {
      toast.error('Failed to add quote');
    }
  };

  const deleteQuote = async (quoteId) => {
    try {
      await api.delete(`/seller-performance/admin/motivation-quote/${quoteId}`);
      toast.success('Quote deleted');
      loadData();
    } catch (error) {
      toast.error('Failed to delete quote');
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const getAttendanceStatus = (activity) => {
    if (activity.no_login) return { status: 'absent', color: 'bg-red-100 text-red-700' };
    if (!activity.login_time) return { status: 'not logged in', color: 'bg-gray-100 text-gray-600' };
    
    const loginHour = new Date(activity.login_time).getHours();
    if (loginHour >= 11) return { status: 'late', color: 'bg-yellow-100 text-yellow-700' };
    return { status: 'on time', color: 'bg-green-100 text-green-700' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#1A1C20]">Seller Performance Management</h2>
          <p className="text-[#4A4D53]">Track, score, and manage seller activities</p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 bg-[#04473C] text-white rounded-lg hover:bg-[#065f4e]"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#E5E1DB] pb-2">
        {[
          { id: 'tracking', label: 'Daily Tracking', icon: Clock },
          { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
          { id: 'earnings', label: 'Earnings & Payout', icon: DollarSign },
          { id: 'quotes', label: 'Motivation Quotes', icon: MessageCircle }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-[#04473C] text-white'
                : 'bg-[#F5F3F0] text-[#4A4D53] hover:bg-[#E5E1DB]'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'tracking' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Date Selector */}
          <div className="flex items-center gap-4 mb-4">
            <label className="text-sm font-medium text-[#4A4D53]">Date:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 border border-[#E5E1DB] rounded-lg"
            />
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-green-50 rounded-xl p-4">
              <p className="text-green-600 text-sm">On Time</p>
              <p className="text-2xl font-bold text-green-700">
                {trackingData.filter(t => !t.no_login && t.login_time && new Date(t.login_time).getHours() < 11).length}
              </p>
            </div>
            <div className="bg-yellow-50 rounded-xl p-4">
              <p className="text-yellow-600 text-sm">Late Login</p>
              <p className="text-2xl font-bold text-yellow-700">
                {trackingData.filter(t => !t.no_login && t.login_time && new Date(t.login_time).getHours() >= 11).length}
              </p>
            </div>
            <div className="bg-red-50 rounded-xl p-4">
              <p className="text-red-600 text-sm">Absent</p>
              <p className="text-2xl font-bold text-red-700">
                {trackingData.filter(t => t.no_login).length}
              </p>
            </div>
            <div className="bg-orange-50 rounded-xl p-4">
              <p className="text-orange-600 text-sm">Warnings</p>
              <p className="text-2xl font-bold text-orange-700">
                {trackingData.filter(t => t.warning_flag).length}
              </p>
            </div>
          </div>

          {/* Tracking Table */}
          <div className="bg-white rounded-xl border border-[#E5E1DB] overflow-hidden">
            <table className="w-full">
              <thead className="bg-[#F5F3F0]">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[#1A1C20]">Seller</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[#1A1C20]">Login</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[#1A1C20]">Logout</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[#1A1C20]">Hours</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[#1A1C20]">Calls</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[#1A1C20]">Shared</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[#1A1C20]">Visits</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[#1A1C20]">Deals</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[#1A1C20]">Score</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[#1A1C20]">Status</th>
                </tr>
              </thead>
              <tbody>
                {trackingData.map((activity, idx) => {
                  const attendance = getAttendanceStatus(activity);
                  return (
                    <tr key={idx} className="border-t border-[#E5E1DB] hover:bg-[#F5F3F0]">
                      <td className="px-4 py-3">
                        <button
                          onClick={() => loadSellerDetail(activity.seller_id)}
                          className="text-[#04473C] hover:underline font-medium"
                        >
                          {activity.seller_name || 'Unknown'}
                        </button>
                        <p className="text-xs text-[#4A4D53]">{activity.seller_phone}</p>
                      </td>
                      <td className="px-4 py-3 text-sm">{formatTime(activity.login_time)}</td>
                      <td className="px-4 py-3 text-sm">{formatTime(activity.logout_time)}</td>
                      <td className="px-4 py-3 text-sm">{activity.working_hours?.toFixed(1) || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-sm ${activity.clients_called < 60 ? 'text-red-600' : 'text-green-600'}`}>
                          {activity.clients_called || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm ${activity.properties_shared < 20 ? 'text-red-600' : 'text-green-600'}`}>
                          {activity.properties_shared || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{activity.visits_booked || 0}</td>
                      <td className="px-4 py-3 text-sm font-medium">{activity.deals_closed || 0}</td>
                      <td className="px-4 py-3">
                        <span className={`font-bold ${
                          activity.daily_score >= 100 ? 'text-green-600' : 
                          activity.daily_score >= 50 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {activity.daily_score || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${attendance.color}`}>
                          {attendance.status}
                        </span>
                        {activity.warning_flag && (
                          <AlertTriangle className="w-4 h-4 text-orange-500 inline ml-1" />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {activeTab === 'leaderboard' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid md:grid-cols-2 gap-6">
          {/* Daily Leaderboard */}
          <div className="bg-white rounded-xl border border-[#E5E1DB] overflow-hidden">
            <div className="bg-gradient-to-r from-[#04473C] to-[#065f4e] p-4 text-white">
              <h3 className="font-semibold flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Today's Leaderboard
              </h3>
            </div>
            <div className="p-4 space-y-3">
              {leaderboard.daily.length === 0 ? (
                <p className="text-center text-[#4A4D53] py-4">No data for today</p>
              ) : (
                leaderboard.daily.slice(0, 10).map((seller, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      idx < 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200' : 'bg-[#F5F3F0]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        idx === 0 ? 'bg-yellow-400 text-yellow-900' :
                        idx === 1 ? 'bg-gray-300 text-gray-700' :
                        idx === 2 ? 'bg-orange-400 text-orange-900' :
                        'bg-[#E5E1DB] text-[#4A4D53]'
                      }`}>
                        {idx + 1}
                      </span>
                      <div>
                        <p className="font-medium text-[#1A1C20]">{seller.seller_name}</p>
                        <p className="text-xs text-[#4A4D53]">{seller.deals} deals • {seller.properties_shared} shared</p>
                      </div>
                    </div>
                    <span className="text-xl font-bold text-[#04473C]">{seller.score}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Monthly Leaderboard */}
          <div className="bg-white rounded-xl border border-[#E5E1DB] overflow-hidden">
            <div className="bg-gradient-to-r from-[#C6A87C] to-[#a8895e] p-4 text-white">
              <h3 className="font-semibold flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Monthly Leaderboard
              </h3>
            </div>
            <div className="p-4 space-y-3">
              {leaderboard.monthly.length === 0 ? (
                <p className="text-center text-[#4A4D53] py-4">No data this month</p>
              ) : (
                leaderboard.monthly.slice(0, 10).map((seller, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      idx < 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200' : 'bg-[#F5F3F0]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        idx === 0 ? 'bg-yellow-400 text-yellow-900' :
                        idx === 1 ? 'bg-gray-300 text-gray-700' :
                        idx === 2 ? 'bg-orange-400 text-orange-900' :
                        'bg-[#E5E1DB] text-[#4A4D53]'
                      }`}>
                        {idx + 1}
                      </span>
                      <div>
                        <p className="font-medium text-[#1A1C20]">{seller.seller_name}</p>
                        <p className="text-xs text-[#4A4D53]">
                          {seller.deals} deals • {seller.login_days} days • 
                          <span className={`ml-1 ${
                            seller.performance_tag === 'Top Performer' ? 'text-yellow-600' :
                            seller.performance_tag === 'Good' ? 'text-green-600' :
                            seller.performance_tag === 'Average' ? 'text-blue-600' : 'text-gray-600'
                          }`}>{seller.performance_tag}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-bold text-[#04473C]">{seller.score}</span>
                      <p className="text-xs text-green-600">+₹{(seller.performance_bonus + seller.high_performer_bonus).toLocaleString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'earnings' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Month Selector */}
          <div className="flex items-center gap-4 mb-4">
            <label className="text-sm font-medium text-[#4A4D53]">Month:</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 border border-[#E5E1DB] rounded-lg"
            />
            <button
              onClick={() => {
                const pendingIds = earnings.filter(e => e.payout_status === 'pending').map(e => e.seller_id);
                if (pendingIds.length > 0) {
                  markAsPaid(pendingIds);
                }
              }}
              className="ml-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Mark All Pending as Paid
            </button>
          </div>

          {/* Earnings Table */}
          <div className="bg-white rounded-xl border border-[#E5E1DB] overflow-hidden">
            <table className="w-full">
              <thead className="bg-[#F5F3F0]">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[#1A1C20]">Seller</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[#1A1C20]">Login Days</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[#1A1C20]">Score</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[#1A1C20]">Deals</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[#1A1C20]">Perf. Bonus</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[#1A1C20]">High Perf.</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[#1A1C20]">Total Bonus</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[#1A1C20]">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[#1A1C20]">Action</th>
                </tr>
              </thead>
              <tbody>
                {earnings.map((seller, idx) => (
                  <tr key={idx} className="border-t border-[#E5E1DB] hover:bg-[#F5F3F0]">
                    <td className="px-4 py-3">
                      <p className="font-medium text-[#1A1C20]">{seller.seller_name}</p>
                      <p className="text-xs text-[#4A4D53]">{seller.seller_phone}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={seller.login_days >= 25 ? 'text-green-600' : 'text-red-600'}>
                        {seller.login_days}/25
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">{seller.total_score}</td>
                    <td className="px-4 py-3">{seller.total_deals}</td>
                    <td className="px-4 py-3 text-green-600">₹{seller.performance_bonus?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-purple-600">₹{seller.high_performer_bonus?.toLocaleString()}</td>
                    <td className="px-4 py-3 font-bold text-[#04473C]">₹{seller.total_bonus?.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        seller.payout_status === 'paid' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {seller.payout_status === 'paid' ? 'Paid' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {seller.payout_status !== 'paid' && (
                        <button
                          onClick={() => markAsPaid([seller.seller_id])}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                        >
                          Mark Paid
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {activeTab === 'quotes' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-[#1A1C20]">Motivation Quotes</h3>
            <button
              onClick={() => setShowQuoteModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#04473C] text-white rounded-lg hover:bg-[#065f4e]"
            >
              <Plus className="w-4 h-4" />
              Add Quote
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {quotes.map((quote, idx) => (
              <div key={idx} className="bg-white rounded-xl border border-[#E5E1DB] p-4">
                <p className="text-[#1A1C20] italic mb-2">"{quote.quote}"</p>
                {quote.author && <p className="text-sm text-[#4A4D53]">— {quote.author}</p>}
                {quote.date && <p className="text-xs text-[#8A8D91] mt-1">For: {quote.date}</p>}
                <div className="flex justify-end mt-2">
                  <button
                    onClick={() => deleteQuote(quote.id)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add Quote Modal */}
          <AnimatePresence>
            {showQuoteModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                onClick={() => setShowQuoteModal(false)}
              >
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.9 }}
                  className="bg-white rounded-xl p-6 max-w-md w-full mx-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 className="text-lg font-semibold mb-4">Add Motivation Quote</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Quote *</label>
                      <textarea
                        value={newQuote.quote}
                        onChange={(e) => setNewQuote({ ...newQuote, quote: e.target.value })}
                        className="w-full px-4 py-2 border border-[#E5E1DB] rounded-lg"
                        rows={3}
                        placeholder="Enter motivational quote..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Author</label>
                      <input
                        type="text"
                        value={newQuote.author}
                        onChange={(e) => setNewQuote({ ...newQuote, author: e.target.value })}
                        className="w-full px-4 py-2 border border-[#E5E1DB] rounded-lg"
                        placeholder="Quote author (optional)"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Specific Date (optional)</label>
                      <input
                        type="date"
                        value={newQuote.date}
                        onChange={(e) => setNewQuote({ ...newQuote, date: e.target.value })}
                        className="w-full px-4 py-2 border border-[#E5E1DB] rounded-lg"
                      />
                      <p className="text-xs text-[#8A8D91] mt-1">Leave empty to show randomly</p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowQuoteModal(false)}
                        className="flex-1 px-4 py-2 border border-[#E5E1DB] rounded-lg hover:bg-[#F5F3F0]"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={addQuote}
                        className="flex-1 px-4 py-2 bg-[#04473C] text-white rounded-lg hover:bg-[#065f4e]"
                      >
                        Add Quote
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Seller Detail Modal */}
      <AnimatePresence>
        {selectedSeller && sellerDetail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedSeller(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-[#E5E1DB]">
                <h3 className="text-xl font-semibold">{sellerDetail.seller?.name}</h3>
                <p className="text-[#4A4D53]">{sellerDetail.seller?.phone}</p>
              </div>
              <div className="p-6">
                {/* Stats */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="bg-green-50 p-3 rounded-lg text-center">
                    <p className="text-2xl font-bold text-green-600">{sellerDetail.stats?.login_days || 0}</p>
                    <p className="text-xs text-green-500">Login Days</p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg text-center">
                    <p className="text-2xl font-bold text-blue-600">{sellerDetail.stats?.attendance_percentage || 0}%</p>
                    <p className="text-xs text-blue-500">Attendance</p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg text-center">
                    <p className="text-2xl font-bold text-purple-600">{sellerDetail.performance?.total_score || 0}</p>
                    <p className="text-xs text-purple-500">Total Score</p>
                  </div>
                  <div className={`p-3 rounded-lg text-center ${sellerDetail.stats?.is_at_risk ? 'bg-red-50' : 'bg-gray-50'}`}>
                    <p className={`text-2xl font-bold ${sellerDetail.stats?.is_at_risk ? 'text-red-600' : 'text-gray-600'}`}>
                      {sellerDetail.stats?.is_at_risk ? 'At Risk' : 'OK'}
                    </p>
                    <p className="text-xs text-gray-500">Status</p>
                  </div>
                </div>

                {/* Activity History */}
                <h4 className="font-semibold mb-3">Recent Activity</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {sellerDetail.activities?.slice(0, 10).map((activity, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-[#F5F3F0] rounded-lg">
                      <div>
                        <p className="font-medium">{activity.date}</p>
                        <p className="text-xs text-[#4A4D53]">
                          {formatTime(activity.login_time)} - {formatTime(activity.logout_time)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[#04473C]">{activity.daily_score || 0} pts</p>
                        <p className="text-xs text-[#4A4D53]">
                          {activity.properties_shared} shared • {activity.visits_booked} visits • {activity.deals_closed} deals
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 border-t border-[#E5E1DB]">
                <button
                  onClick={() => setSelectedSeller(null)}
                  className="w-full py-2 border border-[#E5E1DB] rounded-lg hover:bg-[#F5F3F0]"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminPerformancePanel;
