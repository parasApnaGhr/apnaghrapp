import React, { useState } from 'react';
import { Bike, Star, Ban, DollarSign, MapPin } from 'lucide-react';

const RiderManagementPanel = () => {
  const [riders] = useState([
    {
      id: '1',
      name: 'Aman Singh',
      phone: '9999999991',
      on_duty: true,
      visits_today: 8,
      rating: 4.8,
      earnings_today: 1200,
    },
    {
      id: '2',
      name: 'Rahul Kumar',
      phone: '9999999992',
      on_duty: false,
      visits_today: 0,
      rating: 4.5,
      earnings_today: 0,
    },
  ]);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Outfit' }}>
        Rider Management
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <p className="text-sm text-[#4A626C] mb-1">Total Riders</p>
          <p className="text-3xl font-bold" style={{ fontFamily: 'Outfit' }}>24</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-[#4A626C] mb-1">On Duty</p>
          <p className="text-3xl font-bold text-[#2A9D8F]" style={{ fontFamily: 'Outfit' }}>12</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-[#4A626C] mb-1">Visits Today</p>
          <p className="text-3xl font-bold text-[#E07A5F]" style={{ fontFamily: 'Outfit' }}>47</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-[#4A626C] mb-1">Avg Rating</p>
          <p className="text-3xl font-bold text-[#F4A261]" style={{ fontFamily: 'Outfit' }}>4.6</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#E5E3D8] p-6 mb-6">
        <h3 className="font-bold mb-4">Live Rider Status</h3>
        <div className="space-y-3">
          {riders.map((rider) => (
            <div
              key={rider.id}
              className="border border-[#E5E3D8] rounded-lg p-4"
              data-testid={`rider-${rider.id}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#E07A5F] rounded-full flex items-center justify-center text-white font-bold">
                    {rider.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold">{rider.name}</h4>
                    <p className="text-sm text-[#4A626C]">{rider.phone}</p>
                  </div>
                </div>
                <span className={`badge ${rider.on_duty ? 'badge-success' : 'badge-warning'}`}>
                  {rider.on_duty ? 'On Duty' : 'Off Duty'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-3">
                <div>
                  <p className="text-xs text-[#4A626C]">Visits Today</p>
                  <p className="text-lg font-bold">{rider.visits_today}</p>
                </div>
                <div>
                  <p className="text-xs text-[#4A626C]">Rating</p>
                  <p className="text-lg font-bold flex items-center gap-1">
                    <Star className="w-4 h-4 text-[#F4A261] fill-current" />
                    {rider.rating}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#4A626C]">Today's Earnings</p>
                  <p className="text-lg font-bold text-[#2A9D8F]">₹{rider.earnings_today}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button className="btn-secondary flex-1 flex items-center justify-center gap-2 text-sm">
                  <MapPin className="w-4 h-4" />
                  Track Location
                </button>
                <button className="flex-1 px-4 py-2 border border-[#E5E3D8] rounded-lg hover:bg-[#F3F2EB] flex items-center justify-center gap-2 text-sm">
                  <DollarSign className="w-4 h-4" />
                  Assign Bonus
                </button>
                <button className="px-4 py-2 border border-red-200 rounded-lg hover:bg-red-50 flex items-center gap-2 text-sm text-red-600">
                  <Ban className="w-4 h-4" />
                  Block
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#F0FDF9] rounded-xl p-6 border border-[#2A9D8F]/20">
        <h3 className="font-bold mb-3">Rider Performance Metrics</h3>
        <ul className="space-y-2 text-sm text-[#4A626C]">
          <li>• Average visits per rider: 6.2 per day</li>
          <li>• Peak hours: 2 PM - 6 PM</li>
          <li>• Average visit duration: 18 minutes</li>
          <li>• Customer satisfaction: 92%</li>
        </ul>
      </div>
    </div>
  );
};

export default RiderManagementPanel;