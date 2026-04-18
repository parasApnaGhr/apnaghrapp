// @ts-nocheck
// Earnings Calculator Component - Informational tool
import React, { useState } from 'react';
import { Calculator, TrendingUp, Calendar, Wallet } from 'lucide-react';

const EarningsCalculator = () => {
  const [visitsPerDay, setVisitsPerDay] = useState(8);
  const [daysPerWeek, setDaysPerWeek] = useState(6);
  const [earningPerVisit] = useState(150);

  const dailyEarnings = visitsPerDay * earningPerVisit;
  const weeklyEarnings = dailyEarnings * daysPerWeek;
  const monthlyEarnings = weeklyEarnings * 4;
  const yearlyEarnings = monthlyEarnings * 12;

  return (
    <div className="bg-gradient-to-br from-[#04473C] to-[#065f4e] rounded-2xl p-6 md:p-8 text-white">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
          <Calculator className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xl font-bold">Earnings Calculator</h3>
          <p className="text-white/70 text-sm">Estimate your potential income</p>
        </div>
      </div>

      {/* Sliders */}
      <div className="space-y-6 mb-8">
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-sm text-white/80">Visits per day</label>
            <span className="font-bold">{visitsPerDay} visits</span>
          </div>
          <input
            type="range"
            min="1"
            max="20"
            value={visitsPerDay}
            onChange={(e) => setVisitsPerDay(parseInt(e.target.value))}
            className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
          />
          <div className="flex justify-between text-xs text-white/50 mt-1">
            <span>1</span>
            <span>10</span>
            <span>20</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between mb-2">
            <label className="text-sm text-white/80">Days per week</label>
            <span className="font-bold">{daysPerWeek} days</span>
          </div>
          <input
            type="range"
            min="1"
            max="7"
            value={daysPerWeek}
            onChange={(e) => setDaysPerWeek(parseInt(e.target.value))}
            className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
          />
          <div className="flex justify-between text-xs text-white/50 mt-1">
            <span>1</span>
            <span>4</span>
            <span>7</span>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 text-white/70 text-sm mb-1">
            <Wallet className="w-4 h-4" />
            Daily
          </div>
          <div className="text-2xl font-bold">₹{dailyEarnings.toLocaleString()}</div>
        </div>
        
        <div className="bg-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 text-white/70 text-sm mb-1">
            <Calendar className="w-4 h-4" />
            Weekly
          </div>
          <div className="text-2xl font-bold">₹{weeklyEarnings.toLocaleString()}</div>
        </div>
        
        <div className="bg-white/20 rounded-xl p-4 col-span-2">
          <div className="flex items-center gap-2 text-white/70 text-sm mb-1">
            <TrendingUp className="w-4 h-4" />
            Monthly Potential
          </div>
          <div className="text-4xl font-bold">₹{monthlyEarnings.toLocaleString()}</div>
          <p className="text-white/60 text-sm mt-1">
            Yearly: ₹{yearlyEarnings.toLocaleString()}
          </p>
        </div>
      </div>

      <p className="text-xs text-white/50 mt-4 text-center">
        * Based on ₹{earningPerVisit} average earning per visit. Actual earnings may vary.
      </p>
    </div>
  );
};

export default EarningsCalculator;
