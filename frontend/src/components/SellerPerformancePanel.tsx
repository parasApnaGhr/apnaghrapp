// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Trophy, TrendingUp, Target, Calendar, Star,
  Award, Zap, ArrowUp, ChevronRight, RefreshCw,
  Share2, Phone, Handshake, Clock
} from 'lucide-react';
import api from '../utils/api';
import { toast } from 'sonner';

const PERFORMANCE_TAGS = {
  'Top Performer': { color: 'bg-gradient-to-r from-yellow-400 to-yellow-500', icon: Trophy, textColor: 'text-yellow-900' },
  'Good': { color: 'bg-gradient-to-r from-green-400 to-green-500', icon: Star, textColor: 'text-green-900' },
  'Average': { color: 'bg-gradient-to-r from-blue-400 to-blue-500', icon: Target, textColor: 'text-blue-900' },
  'Low': { color: 'bg-gradient-to-r from-gray-400 to-gray-500', icon: TrendingUp, textColor: 'text-gray-900' }
};

const SellerPerformancePanel = () => {
  const [performance, setPerformance] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadPerformance();
    loadHistory();
  }, []);

  const loadPerformance = async () => {
    try {
      const response = await api.get('/seller-performance/my-performance');
      setPerformance(response.data);
    } catch (error) {
      console.error('Failed to load performance:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const response = await api.get('/seller-performance/my-activity-history?limit=10');
      setHistory(response.data);
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <RefreshCw className="w-8 h-8 text-[#04473C] animate-spin" />
      </div>
    );
  }

  const tagConfig = PERFORMANCE_TAGS[performance?.monthly?.performance_tag] || PERFORMANCE_TAGS['Low'];
  const TagIcon = tagConfig.icon;

  return (
    <div className="space-y-6">
      {/* Performance Header */}
      <div className="bg-gradient-to-br from-[#04473C] to-[#065f4e] rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">My Performance</h2>
            <p className="text-white/70 text-sm">Track your daily & monthly progress</p>
          </div>
          <div className={`px-4 py-2 rounded-full ${tagConfig.color} ${tagConfig.textColor} font-semibold flex items-center gap-2`}>
            <TagIcon className="w-4 h-4" />
            {performance?.monthly?.performance_tag || 'Start Today!'}
          </div>
        </div>

        {/* Rank */}
        <div className="flex items-center gap-4">
          <div className="bg-white/10 rounded-xl p-4 flex-1">
            <p className="text-white/70 text-sm">Your Rank</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">#{performance?.rank || '-'}</span>
              <span className="text-white/50">of {performance?.total_sellers || 0}</span>
            </div>
          </div>
          <div className="bg-white/10 rounded-xl p-4 flex-1">
            <p className="text-white/70 text-sm">Monthly Score</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">{performance?.monthly?.score || 0}</span>
              <span className="text-white/50">points</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { id: 'overview', label: 'Overview', icon: TrendingUp },
          { id: 'today', label: "Today's Stats", icon: Calendar },
          { id: 'earnings', label: 'Earnings', icon: Award },
          { id: 'history', label: 'History', icon: Clock }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-[#04473C] text-white'
                : 'bg-[#E5E1DB] text-[#4A4D53] hover:bg-[#d5d1cb]'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <StatCard
            icon={Share2}
            label="Properties Shared"
            value={performance?.monthly?.properties_shared || 0}
            target={600}
            color="blue"
          />
          <StatCard
            icon={Calendar}
            label="Visits Booked"
            value={performance?.monthly?.visits_booked || 0}
            target={150}
            color="green"
          />
          <StatCard
            icon={Handshake}
            label="Deals Closed"
            value={performance?.monthly?.deals || 0}
            target={10}
            color="purple"
          />
          <StatCard
            icon={Clock}
            label="Login Days"
            value={performance?.monthly?.login_days || 0}
            target={25}
            color="orange"
          />
        </motion.div>
      )}

      {activeTab === 'today' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="bg-white rounded-xl border border-[#E5E1DB] p-6">
            <h3 className="font-semibold text-[#1A1C20] mb-4">Today's Progress</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-[#04473C]/5 rounded-xl">
                <p className="text-3xl font-bold text-[#04473C]">{performance?.today?.score || 0}</p>
                <p className="text-sm text-[#4A4D53]">Today's Score</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <p className="text-3xl font-bold text-blue-600">{performance?.today?.properties_shared || 0}</p>
                <p className="text-sm text-blue-500">Shared</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <p className="text-3xl font-bold text-green-600">{performance?.today?.visits_booked || 0}</p>
                <p className="text-sm text-green-500">Visits</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-xl">
                <p className="text-3xl font-bold text-purple-600">{performance?.today?.deals_closed || 0}</p>
                <p className="text-sm text-purple-500">Deals</p>
              </div>
            </div>
          </div>

          {/* Scoring Formula */}
          <div className="bg-gradient-to-br from-[#C6A87C]/10 to-[#04473C]/5 rounded-xl p-4 border border-[#C6A87C]/20">
            <h4 className="font-semibold text-[#1A1C20] mb-2">How Score is Calculated:</h4>
            <div className="space-y-1 text-sm text-[#4A4D53]">
              <p>• Properties Shared × 1 point</p>
              <p>• Visits Booked × 5 points</p>
              <p>• Deals Closed × 20 points</p>
              <p className="text-green-600">• 20+ shares: +10 bonus | 5+ visits: +15 bonus | 1+ deal: +25 bonus</p>
              <p className="text-red-600">• &lt;20 shares: -10 penalty | Late login (after 11 AM): -10 penalty</p>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'earnings' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="bg-white rounded-xl border border-[#E5E1DB] p-6">
            <h3 className="font-semibold text-[#1A1C20] mb-4">Earnings This Month</h3>
            
            <div className="space-y-4">
              {/* Performance Bonus */}
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Zap className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-[#1A1C20]">Performance Bonus</p>
                    <p className="text-sm text-[#4A4D53]">100 points = ₹50</p>
                  </div>
                </div>
                <p className="text-xl font-bold text-green-600">
                  ₹{(performance?.monthly?.performance_bonus || 0).toLocaleString()}
                </p>
              </div>

              {/* High Performer Bonus */}
              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Award className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-[#1A1C20]">High Performer Bonus</p>
                    <p className="text-sm text-[#4A4D53]">
                      {performance?.monthly?.deals >= 20 ? '20+ deals' :
                       performance?.monthly?.deals >= 15 ? '15+ deals' :
                       performance?.monthly?.deals >= 10 ? '10+ deals' : 'Reach 10 deals'}
                    </p>
                  </div>
                </div>
                <p className="text-xl font-bold text-purple-600">
                  ₹{(performance?.monthly?.high_performer_bonus || 0).toLocaleString()}
                </p>
              </div>

              {/* Total */}
              <div className="flex items-center justify-between p-4 bg-[#04473C] rounded-xl text-white">
                <p className="font-semibold">Total Bonus Earnings</p>
                <p className="text-2xl font-bold">
                  ₹{((performance?.monthly?.performance_bonus || 0) + (performance?.monthly?.high_performer_bonus || 0)).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Predictions */}
          {performance?.predictions?.length > 0 && (
            <div className="bg-gradient-to-br from-[#C6A87C]/10 to-[#04473C]/5 rounded-xl p-4 border border-[#C6A87C]/20">
              <h4 className="font-semibold text-[#1A1C20] mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#C6A87C]" />
                Earnings Prediction
              </h4>
              <div className="space-y-2">
                {performance.predictions.map((pred, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <ArrowUp className="w-4 h-4 text-green-500" />
                    <span className="text-[#4A4D53]">{pred.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Commission Structure */}
          <div className="bg-white rounded-xl border border-[#E5E1DB] p-4">
            <h4 className="font-semibold text-[#1A1C20] mb-3">Commission Structure (Per Deal)</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              {[
                { range: '₹10k-15k', commission: '₹500' },
                { range: '₹15k-20k', commission: '₹780' },
                { range: '₹20k-25k', commission: '₹1,000' },
                { range: '₹25k-30k', commission: '₹1,300' },
                { range: '₹31k-35k', commission: '₹2,000' },
                { range: '₹35k-40k', commission: '₹2,200' },
                { range: '₹41k-45k', commission: '₹2,500' },
                { range: '₹46k-49k', commission: '₹2,700' },
                { range: '₹50k-70k', commission: '₹5,000' },
                { range: '₹71k-1L', commission: '₹8,000' },
                { range: '₹1.05L-1.5L', commission: '₹10,000' },
              ].map((item, idx) => (
                <div key={idx} className="flex justify-between p-2 bg-gray-50 rounded-lg">
                  <span className="text-[#4A4D53]">{item.range}</span>
                  <span className="font-semibold text-[#04473C]">{item.commission}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'history' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          {history.length === 0 ? (
            <div className="text-center py-8 text-[#4A4D53]">
              No activity history yet
            </div>
          ) : (
            history.map((activity, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl border border-[#E5E1DB] p-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-[#1A1C20]">{activity.date}</p>
                  <div className="flex gap-4 text-sm text-[#4A4D53] mt-1">
                    <span>📤 {activity.properties_shared || 0} shared</span>
                    <span>📅 {activity.visits_booked || 0} visits</span>
                    <span>🤝 {activity.deals_closed || 0} deals</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-xl font-bold ${
                    activity.daily_score >= 100 ? 'text-green-600' : 
                    activity.daily_score >= 50 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {activity.daily_score || 0}
                  </p>
                  <p className="text-xs text-[#4A4D53]">points</p>
                </div>
              </div>
            ))
          )}
        </motion.div>
      )}
    </div>
  );
};

// Helper component for stat cards
const StatCard = ({ icon: Icon, label, value, target, color }) => {
  const percentage = Math.min(100, Math.round((value / target) * 100));
  const colors = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', bar: 'bg-blue-500' },
    green: { bg: 'bg-green-50', text: 'text-green-600', bar: 'bg-green-500' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', bar: 'bg-purple-500' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-600', bar: 'bg-orange-500' }
  };
  const c = colors[color] || colors.blue;

  return (
    <div className={`${c.bg} rounded-xl p-4`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${c.text}`} />
        <span className="text-sm text-[#4A4D53]">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${c.text}`}>{value}</p>
      <div className="mt-2">
        <div className="h-1.5 bg-white rounded-full overflow-hidden">
          <div className={`h-full ${c.bar} rounded-full transition-all`} style={{ width: `${percentage}%` }} />
        </div>
        <p className="text-xs text-[#4A4D53] mt-1">{percentage}% of target ({target})</p>
      </div>
    </div>
  );
};

export default SellerPerformancePanel;
