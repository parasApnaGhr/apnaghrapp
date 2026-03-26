import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, Package, Bike, LogOut, Home, DollarSign, TrendingUp } from 'lucide-react';
import CustomerSupportPanel from '../components/CustomerSupportPanel';
import InventoryPanel from '../components/InventoryPanel';
import RiderManagementPanel from '../components/RiderManagementPanel';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [activePanel, setActivePanel] = useState('overview');

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      {/* Header */}
      <header className="bg-white border-b border-[#E5E3D8] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold" style={{ fontFamily: 'Outfit' }}>Admin Control Center</h1>
              <p className="text-sm text-[#4A626C]">ApnaGhr Visit Platform Management</p>
            </div>
            <button
              onClick={logout}
              className="btn-secondary flex items-center gap-2"
              data-testid="logout-button"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-[#E5E3D8]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            <button
              onClick={() => setActivePanel('overview')}
              className={`px-6 py-3 font-medium text-sm transition ${
                activePanel === 'overview'
                  ? 'text-[#E07A5F] border-b-2 border-[#E07A5F]'
                  : 'text-[#4A626C] hover:text-[#264653]'
              }`}
              data-testid="tab-overview"
            >
              Overview
            </button>
            <button
              onClick={() => setActivePanel('support')}
              className={`px-6 py-3 font-medium text-sm transition flex items-center gap-2 ${
                activePanel === 'support'
                  ? 'text-[#E07A5F] border-b-2 border-[#E07A5F]'
                  : 'text-[#4A626C] hover:text-[#264653]'
              }`}
              data-testid="tab-support"
            >
              <Users className="w-4 h-4" />
              Customer Support
            </button>
            <button
              onClick={() => setActivePanel('inventory')}
              className={`px-6 py-3 font-medium text-sm transition flex items-center gap-2 ${
                activePanel === 'inventory'
                  ? 'text-[#E07A5F] border-b-2 border-[#E07A5F]'
                  : 'text-[#4A626C] hover:text-[#264653]'
              }`}
              data-testid="tab-inventory"
            >
              <Package className="w-4 h-4" />
              Inventory
            </button>
            <button
              onClick={() => setActivePanel('riders')}
              className={`px-6 py-3 font-medium text-sm transition flex items-center gap-2 ${
                activePanel === 'riders'
                  ? 'text-[#E07A5F] border-b-2 border-[#E07A5F]'
                  : 'text-[#4A626C] hover:text-[#264653]'
              }`}
              data-testid="tab-riders"
            >
              <Bike className="w-4 h-4" />
              Rider Management
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {activePanel === 'overview' && (
          <div>
            <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Outfit' }}>Platform Overview</h2>
            
            <div className="admin-bento mb-6">
              <div className="stat-card">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-[#4A626C]">Total Properties</p>
                  <Home className="w-5 h-5 text-[#E07A5F]" />
                </div>
                <p className="text-3xl font-bold" style={{ fontFamily: 'Outfit' }}>156</p>
                <p className="text-xs text-[#2A9D8F] mt-1">+12 this week</p>
              </div>

              <div className="stat-card">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-[#4A626C]">Active Riders</p>
                  <Bike className="w-5 h-5 text-[#E07A5F]" />
                </div>
                <p className="text-3xl font-bold" style={{ fontFamily: 'Outfit' }}>24</p>
                <p className="text-xs text-[#2A9D8F] mt-1">12 on duty</p>
              </div>

              <div className="stat-card">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-[#4A626C]">Visits Today</p>
                  <Users className="w-5 h-5 text-[#E07A5F]" />
                </div>
                <p className="text-3xl font-bold" style={{ fontFamily: 'Outfit' }}>47</p>
                <p className="text-xs text-[#2A9D8F] mt-1">+18% vs yesterday</p>
              </div>

              <div className="stat-card">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-[#4A626C]">Revenue Today</p>
                  <DollarSign className="w-5 h-5 text-[#E07A5F]" />
                </div>
                <p className="text-3xl font-bold" style={{ fontFamily: 'Outfit' }}>₹11,400</p>
                <p className="text-xs text-[#2A9D8F] mt-1">+₹2,100</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-[#E5E3D8] p-6">
                <h3 className="font-bold mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-[#F3F2EB] rounded-lg">
                    <div className="w-2 h-2 rounded-full bg-[#2A9D8F]"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">New visit booked</p>
                      <p className="text-xs text-[#4A626C]">2 minutes ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-[#F3F2EB] rounded-lg">
                    <div className="w-2 h-2 rounded-full bg-[#E07A5F]"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Property added</p>
                      <p className="text-xs text-[#4A626C]">15 minutes ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-[#F3F2EB] rounded-lg">
                    <div className="w-2 h-2 rounded-full bg-[#F4A261]"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Rider completed visit</p>
                      <p className="text-xs text-[#4A626C]">28 minutes ago</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-[#E5E3D8] p-6">
                <h3 className="font-bold mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setActivePanel('inventory')}
                    className="btn-primary w-full text-left"
                  >
                    Add New Property
                  </button>
                  <button
                    onClick={() => setActivePanel('support')}
                    className="btn-secondary w-full text-left"
                  >
                    View Pending Visits
                  </button>
                  <button
                    onClick={() => setActivePanel('riders')}
                    className="w-full text-left px-4 py-3 border border-[#E5E3D8] rounded-lg hover:bg-[#F3F2EB] transition"
                  >
                    Manage Riders
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activePanel === 'support' && <CustomerSupportPanel />}
        {activePanel === 'inventory' && <InventoryPanel />}
        {activePanel === 'riders' && <RiderManagementPanel />}
      </main>
    </div>
  );
};

export default AdminDashboard;