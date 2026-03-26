import React from 'react';
import { DollarSign, TrendingUp } from 'lucide-react';

const Earnings = ({ riderId, stats }) => {
  const kmAllowance = (stats?.boards_today || 0) * 2;
  const brokerCommission = 0;
  const dailyIncentive = stats?.boards_today >= 70 && stats?.brokers_today >= 10 && stats?.visits_today >= 5 ? 500 : 0;
  const totalEarnings = kmAllowance + brokerCommission + dailyIncentive;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-6 h-6 text-emerald-500" />
          <h2 className="text-xl font-bold" style={{ fontFamily: 'Barlow Condensed' }}>
            TODAY'S EARNINGS
          </h2>
        </div>

        <div className="mb-6">
          <p className="text-sm text-slate-500 mb-2">Total Earnings</p>
          <p className="text-4xl font-black text-emerald-500" style={{ fontFamily: 'Barlow Condensed' }}>
            ₹{totalEarnings}
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <span className="text-sm text-slate-600">KM Allowance</span>
            <span className="font-bold text-slate-900">₹{kmAllowance}</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <span className="text-sm text-slate-600">Broker Sales Commission</span>
            <span className="font-bold text-slate-900">₹{brokerCommission}</span>
          </div>

          {dailyIncentive > 0 && (
            <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <span className="text-sm text-emerald-700 font-medium">Daily Target Incentive</span>
              <span className="font-bold text-emerald-700">₹{dailyIncentive}</span>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-6 h-6 text-indigo-600" />
          <h2 className="text-xl font-bold" style={{ fontFamily: 'Barlow Condensed' }}>
            PERFORMANCE BONUS
          </h2>
        </div>

        <div className="space-y-3">
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-600 mb-2">Daily Target Completion</p>
            <p className="text-xs text-slate-500">Complete 70 boards, 10 brokers, and 5 visits</p>
            <p className="text-lg font-bold text-indigo-600 mt-2">Bonus: ₹500</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg opacity-60">
            <p className="text-sm text-slate-600 mb-2">Weekly Top Performer</p>
            <p className="text-xs text-slate-500">Rank #1 in your city</p>
            <p className="text-lg font-bold text-orange-500 mt-2">Bonus: ₹2000</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg opacity-60">
            <p className="text-sm text-slate-600 mb-2">Package Sales</p>
            <p className="text-xs text-slate-500">Per broker package sold</p>
            <p className="text-lg font-bold text-emerald-500 mt-2">Commission: ₹1000</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Earnings;