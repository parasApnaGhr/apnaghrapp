import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
  Users, Package, Bike, LogOut, Home, DollarSign,
  Settings, MapPin, CheckSquare, CreditCard, BarChart3, Image, Upload, UserPlus, Gift, QrCode, ClipboardList, Target, Trophy, Shield, RefreshCw, Store
} from 'lucide-react';
import CustomerSupportPanel from '../components/CustomerSupportPanel';
import InventoryPanel from '../components/InventoryPanel';
import RiderManagementPanel from '../components/RiderManagementPanel';
import SellerManagementPanel from '../components/SellerManagementPanel';
import AppSettingsPanel from '../components/AppSettingsPanel';
import PromotionsPanel from '../components/PromotionsPanel';
import ManualVisitPanel from '../components/ManualVisitPanel';
import ToLetTasksPanel from '../components/ToLetTasksPanel';
import VisitApprovalPanel from '../components/VisitApprovalPanel';
import PayoutsPanel from '../components/PayoutsPanel';
import LiveTrackingPanel from '../components/LiveTrackingPanel';
import PropertyAnalyticsPanel from '../components/PropertyAnalyticsPanel';
import NotificationsDropdown from '../components/NotificationsDropdown';
import ImageMigrationTool from '../components/ImageMigrationTool';
import BulkImageUploader from '../components/BulkImageUploader';
import RiderApplicationsPanel from '../components/RiderApplicationsPanel';
import VendorManagementPanel from '../components/VendorManagementPanel';
import LeadsPanel from '../components/LeadsPanel';
import AdminPerformancePanel from '../components/AdminPerformancePanel';
import AccessTypeModal from '../components/AccessTypeModal';
import InventoryLoginModal from '../components/InventoryLoginModal';
import InventoryUserDashboard from '../components/InventoryUserDashboard';
import InventoryTeamPerformance from '../components/InventoryTeamPerformance';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [activePanel, setActivePanel] = useState('overview');
  const [showImageTool, setShowImageTool] = useState(false);
  const [showBulkUploader, setShowBulkUploader] = useState(false);
  
  // Access Type State
  const [accessType, setAccessType] = useState(null); // 'admin' or 'inventory'
  const [showAccessModal, setShowAccessModal] = useState(true);
  const [showInventoryLoginModal, setShowInventoryLoginModal] = useState(false);
  const [inventorySession, setInventorySession] = useState(null);

  // Check for existing session on mount
  useEffect(() => {
    const savedAccessType = sessionStorage.getItem('adminAccessType');
    const savedInventorySession = sessionStorage.getItem('inventorySession');
    
    if (savedAccessType) {
      setAccessType(savedAccessType);
      setShowAccessModal(false);
      
      if (savedAccessType === 'inventory' && savedInventorySession) {
        setInventorySession(JSON.parse(savedInventorySession));
        setActivePanel('inventory-dashboard');
      }
    }
  }, []);

  // Handle access granted
  const handleAccessGranted = (type) => {
    setAccessType(type);
    setShowAccessModal(false);
    
    if (type === 'inventory') {
      setShowInventoryLoginModal(true);
    }
  };

  // Handle inventory session started
  const handleInventorySessionStarted = (sessionData) => {
    setInventorySession(sessionData);
    sessionStorage.setItem('inventorySession', JSON.stringify(sessionData));
    setShowInventoryLoginModal(false);
    setActivePanel('inventory-dashboard');
  };

  // Handle inventory logout
  const handleInventoryLogout = () => {
    setInventorySession(null);
    sessionStorage.removeItem('inventorySession');
    sessionStorage.removeItem('adminAccessType');
    setAccessType(null);
    setShowAccessModal(true);
  };

  // Handle full logout
  const handleFullLogout = () => {
    sessionStorage.removeItem('adminAccessType');
    sessionStorage.removeItem('inventorySession');
    logout();
  };

  // Switch access type (for admin)
  const handleSwitchAccess = () => {
    sessionStorage.removeItem('adminAccessType');
    sessionStorage.removeItem('inventorySession');
    setAccessType(null);
    setInventorySession(null);
    setShowAccessModal(true);
    setActivePanel('overview');
  };

  // All tabs (full admin access)
  const allTabs = [
    { id: 'overview', label: 'Overview', icon: null },
    { id: 'leads', label: 'Leads', icon: Target },
    { id: 'seller-performance', label: 'Seller Performance', icon: Trophy },
    { id: 'inventory-team', label: 'Inventory Team', icon: Users },
    { id: 'tracking', label: 'Live Tracking', icon: MapPin },
    { id: 'approvals', label: 'Visit Approvals', icon: CheckSquare },
    { id: 'manual-visit', label: 'Create Visit', icon: QrCode },
    { id: 'tolet', label: 'ToLet Tasks', icon: Home },
    { id: 'payouts', label: 'Payouts', icon: CreditCard },
    { id: 'promotions', label: 'Promotions', icon: Gift },
    { id: 'analytics', label: 'Property Analytics', icon: BarChart3 },
    { id: 'rider-applications', label: 'Rider Applications', icon: ClipboardList },
    { id: 'vendors', label: 'Vendors', icon: Store },
    { id: 'riders', label: 'Riders', icon: Bike },
    { id: 'sellers', label: 'Sellers', icon: UserPlus },
    { id: 'support', label: 'Support', icon: Users },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  // Inventory-only tabs
  const inventoryTabs = [
    { id: 'inventory-dashboard', label: 'My Dashboard', icon: Home },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'analytics', label: 'Property Analytics', icon: BarChart3 }
  ];

  // Get current tabs based on access type
  const tabs = accessType === 'inventory' ? inventoryTabs : allTabs;

  // Determine badge text
  const accessBadgeText = accessType === 'admin' ? 'ADMIN' : accessType === 'inventory' ? 'INVENTORY' : 'ADMIN';
  const accessBadgeColor = accessType === 'inventory' ? 'bg-[#C6A87C]' : 'bg-[#C6A87C]';

  return (
    <div className="min-h-screen bg-[#FDFCFB]">
      {/* Access Type Selection Modal */}
      <AccessTypeModal 
        isOpen={showAccessModal} 
        onAccessGranted={handleAccessGranted} 
      />

      {/* Inventory Login Modal */}
      <InventoryLoginModal 
        isOpen={showInventoryLoginModal} 
        onSessionStarted={handleInventorySessionStarted} 
      />

      {/* Premium Header */}
      <header className="glass-header sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Admin Avatar */}
              <div className="relative">
                <div className={`w-12 h-12 rounded-full overflow-hidden border-2 shadow-lg flex items-center justify-center ${
                  accessType === 'inventory' 
                    ? 'border-[#C6A87C] bg-gradient-to-br from-[#C6A87C] to-[#B8956C]'
                    : 'border-[#04473C] bg-gradient-to-br from-[#04473C] to-[#065F4E]'
                }`}>
                  <span className="text-white font-bold text-lg">
                    {accessType === 'inventory' && inventorySession 
                      ? inventorySession.user_name?.[0] 
                      : user?.name?.[0] || 'A'}
                  </span>
                </div>
                <div className={`absolute -bottom-1 -right-1 ${accessBadgeColor} text-[#1A1C20] text-[7px] font-bold px-1.5 py-0.5 rounded-sm shadow-md`}>
                  {accessBadgeText}
                </div>
              </div>
              <div>
                <h1 className="text-xl tracking-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Apna<span className="text-[#04473C]">Ghr</span>
                  <span className={`ml-2 text-[10px] text-white px-2 py-0.5 tracking-wider align-middle ${
                    accessType === 'inventory' ? 'bg-[#C6A87C]' : 'bg-[#04473C]'
                  }`}>
                    {accessType === 'inventory' ? 'INVENTORY MODE' : 'CONTROL CENTER'}
                  </span>
                </h1>
                <p className="text-sm text-[#4A4D53]">
                  {accessType === 'inventory' && inventorySession 
                    ? `Inventory User • ${inventorySession.user_name}`
                    : `Platform Management • ${user?.name}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {accessType === 'admin' && (
                <>
                  <button
                    onClick={handleSwitchAccess}
                    className="px-3 py-1.5 text-xs font-medium text-[#4A4D53] hover:text-[#1A1C20] hover:bg-[#F5F3F0] rounded-lg transition-colors flex items-center gap-1.5"
                    title="Switch Access Type"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Switch
                  </button>
                  <NotificationsDropdown />
                </>
              )}
              <button
                onClick={handleFullLogout}
                className="p-2 hover:bg-[#F5F3F0] transition-colors rounded-full"
                data-testid="logout-button"
              >
                <LogOut className="w-5 h-5 text-[#4A4D53]" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      {!showAccessModal && !showInventoryLoginModal && (
        <div className="bg-white border-b border-[#E5E1DB]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-wrap gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActivePanel(tab.id)}
                  className={`px-4 py-3 text-sm font-medium transition-all flex items-center gap-2 ${
                    activePanel === tab.id
                      ? accessType === 'inventory' 
                        ? 'text-[#C6A87C] border-b-2 border-[#C6A87C]'
                        : 'text-[#04473C] border-b-2 border-[#04473C]'
                      : 'text-[#4A4D53] hover:text-[#1A1C20]'
                  }`}
                  data-testid={`tab-${tab.id}`}
                >
                  {tab.icon && <tab.icon className="w-4 h-4" strokeWidth={1.5} />}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {!showAccessModal && !showInventoryLoginModal && (
        <main className="max-w-7xl mx-auto px-6 py-8">
          {/* Inventory User Dashboard */}
          {accessType === 'inventory' && activePanel === 'inventory-dashboard' && inventorySession && (
            <InventoryUserDashboard 
              sessionId={inventorySession.session_id} 
              onLogout={handleInventoryLogout}
            />
          )}

          {/* Admin Overview */}
          {accessType === 'admin' && activePanel === 'overview' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Admin Welcome Banner */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-r from-[#04473C] via-[#065F4E] to-[#04473C] text-white p-6 mb-8 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
                <div className="relative z-10 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-5 h-5 text-[#C6A87C]" />
                      <span className="text-xs text-[#C6A87C] font-medium tracking-wider">FULL ADMIN ACCESS</span>
                    </div>
                    <h2 className="text-2xl mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                      Welcome back, {user?.name?.split(' ')[0] || 'Admin'}!
                    </h2>
                    <p className="text-white/80 text-sm">Manage your platform, track visits, and grow your business.</p>
                  </div>
                  <div className="text-right hidden md:block">
                    <p className="text-3xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>ApnaGhr</p>
                    <p className="text-xs text-[#C6A87C] tracking-widest">PREMIUM PROPERTY PLATFORM</p>
                  </div>
                </div>
              </motion.div>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[
                  { label: 'Total Properties', value: '156', change: '+12 this week', icon: Home, color: '#04473C' },
                  { label: 'Active Riders', value: '24', change: '12 on duty', icon: Bike, color: '#C6A87C' },
                  { label: 'Visits Today', value: '47', change: '+18% vs yesterday', icon: Users, color: '#04473C' },
                  { label: 'Revenue Today', value: '₹11,400', change: '+₹2,100', icon: DollarSign, color: '#C6A87C' }
                ].map((stat, idx) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    whileHover={{ y: -5, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
                    className="bg-white border border-[#E5E1DB] p-6 transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm text-[#4A4D53] tracking-wide uppercase">{stat.label}</p>
                      <motion.div 
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className="w-10 h-10 flex items-center justify-center" 
                        style={{ backgroundColor: `${stat.color}15` }}
                      >
                        <stat.icon className="w-5 h-5" style={{ color: stat.color }} strokeWidth={1.5} />
                      </motion.div>
                    </div>
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.1 + 0.2 }}
                      className="price-display text-3xl"
                    >
                      {stat.value}
                    </motion.p>
                    <p className="text-xs text-[#04473C] mt-2 flex items-center gap-1">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500"></span>
                      {stat.change}
                    </p>
                  </motion.div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Quick Actions */}
                <div className="bg-white border border-[#E5E1DB] p-6">
                  <h3 className="text-lg mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>Quick Actions</h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => setActivePanel('tracking')}
                      className="btn-primary w-full text-left flex items-center gap-2"
                    >
                      <MapPin className="w-4 h-4" strokeWidth={1.5} />
                      View Live Tracking
                    </button>
                    <button
                      onClick={() => setActivePanel('approvals')}
                      className="btn-secondary w-full text-left flex items-center gap-2"
                    >
                      <CheckSquare className="w-4 h-4" strokeWidth={1.5} />
                      Review Pending Visits
                    </button>
                    <button
                      onClick={() => setActivePanel('inventory-team')}
                      className="w-full text-left px-4 py-3 border border-[#C6A87C] bg-[#C6A87C]/10 hover:bg-[#C6A87C]/20 transition-all flex items-center gap-2"
                    >
                      <Users className="w-4 h-4 text-[#C6A87C]" strokeWidth={1.5} />
                      <span className="text-[#1A1C20] font-medium">View Inventory Team</span>
                    </button>
                    <button
                      onClick={() => setActivePanel('tolet')}
                      className="w-full text-left px-4 py-3 border border-[#E5E1DB] hover:border-[#D0C9C0] hover:bg-[#F5F3F0] transition-all flex items-center gap-2"
                    >
                      <Home className="w-4 h-4" strokeWidth={1.5} />
                      Create ToLet Task
                    </button>
                    <button
                      onClick={() => setActivePanel('payouts')}
                      className="w-full text-left px-4 py-3 border border-[#E5E1DB] hover:border-[#D0C9C0] hover:bg-[#F5F3F0] transition-all flex items-center gap-2"
                    >
                      <CreditCard className="w-4 h-4" strokeWidth={1.5} />
                      Process Payouts
                    </button>
                    <button
                      onClick={() => setShowImageTool(true)}
                      className="w-full text-left px-4 py-3 bg-[#C6A87C]/10 border border-[#C6A87C] hover:bg-[#C6A87C]/20 transition-all flex items-center gap-2"
                      data-testid="image-migration-btn"
                    >
                      <Image className="w-4 h-4 text-[#C6A87C]" strokeWidth={1.5} />
                      <span className="text-[#1A1C20] font-medium">Fix Broken Images</span>
                    </button>
                    <button
                      onClick={() => setShowBulkUploader(true)}
                      className="w-full text-left px-4 py-3 bg-[#04473C] text-white hover:bg-[#03352D] transition-all flex items-center gap-2"
                      data-testid="bulk-upload-btn"
                    >
                      <Upload className="w-4 h-4" strokeWidth={1.5} />
                      <span className="font-medium">Upload Property Photos (Bulk)</span>
                    </button>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white border border-[#E5E1DB] p-6">
                  <h3 className="text-lg mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>Recent Activity</h3>
                  <div className="space-y-3">
                    {[
                      { text: 'New visit booked', time: '2 minutes ago', color: '#04473C' },
                      { text: 'Rider completed visit', time: '15 minutes ago', color: '#C6A87C' },
                      { text: 'ToLet task created', time: '28 minutes ago', color: '#04473C' }
                    ].map((activity, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-4 bg-[#F5F3F0]">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: activity.color }}></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-[#1A1C20]">{activity.text}</p>
                          <p className="text-xs text-[#4A4D53]">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Admin-only panels */}
          {accessType === 'admin' && (
            <>
              {activePanel === 'leads' && <LeadsPanel />}
              {activePanel === 'seller-performance' && <AdminPerformancePanel />}
              {activePanel === 'inventory-team' && <InventoryTeamPerformance />}
              {activePanel === 'tracking' && <LiveTrackingPanel />}
              {activePanel === 'approvals' && <VisitApprovalPanel />}
              {activePanel === 'manual-visit' && <ManualVisitPanel />}
              {activePanel === 'tolet' && <ToLetTasksPanel />}
              {activePanel === 'payouts' && <PayoutsPanel />}
              {activePanel === 'promotions' && <PromotionsPanel />}
              {activePanel === 'rider-applications' && <RiderApplicationsPanel />}
              {activePanel === 'vendors' && <VendorManagementPanel />}
              {activePanel === 'riders' && <RiderManagementPanel />}
              {activePanel === 'sellers' && <SellerManagementPanel />}
              {activePanel === 'support' && <CustomerSupportPanel />}
              {activePanel === 'settings' && <AppSettingsPanel />}
            </>
          )}

          {/* Shared panels (both admin and inventory can access) */}
          {activePanel === 'inventory' && <InventoryPanel inventorySession={accessType === 'inventory' ? inventorySession : null} />}
          {activePanel === 'analytics' && <PropertyAnalyticsPanel />}
        </main>
      )}
      
      {/* Image Migration Tool Modal */}
      {showImageTool && (
        <ImageMigrationTool onClose={() => setShowImageTool(false)} />
      )}
      
      {/* Bulk Image Uploader Modal */}
      {showBulkUploader && (
        <BulkImageUploader onClose={() => setShowBulkUploader(false)} />
      )}
    </div>
  );
};

export default AdminDashboard;
