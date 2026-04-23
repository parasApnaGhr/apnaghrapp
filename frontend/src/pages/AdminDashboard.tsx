// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { 
  Users, Package, Bike, LogOut, Home, DollarSign, 
  Settings, MapPin, CheckSquare, CreditCard, BarChart3, Image, Upload, UserPlus, Gift, QrCode, ClipboardList, Target, Trophy, Shield, RefreshCw
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
import LeadsPanel from '../components/LeadsPanel';
import AdminPerformancePanel from '../components/AdminPerformancePanel';
import AccessTypeModal from '../components/AccessTypeModal';
import InventoryLoginModal from '../components/InventoryLoginModal';
import InventoryUserDashboard from '../components/InventoryUserDashboard';
import InventoryTeamPerformance from '../components/InventoryTeamPerformance';
import {
  StitchShell,
  StitchCard,
  StitchButton,
  StitchKpi,
  StitchSectionHeader,
  StitchSkeleton,
  StitchModal,
} from '../stitch/components/StitchPrimitives';

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
    { id: 'overview', label: 'Overview', icon: Home },
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

  return (
    <StitchShell
      title="Admin"
      eyebrow="Operations"
      subtitle={
        accessType === 'inventory' && inventorySession
          ? `Inventory User • ${inventorySession.user_name}`
          : `Platform Management • ${user?.name}`
      }
      actions={
        <div className="flex items-center gap-3">
          {accessType === 'admin' && (
            <>
              <StitchButton variant="ghost" onClick={handleSwitchAccess}>
                <RefreshCw className="h-4 w-4" />
                Switch
              </StitchButton>
              <NotificationsDropdown />
            </>
          )}
          <StitchButton
            variant="ghost"
            onClick={handleFullLogout}
            className="text-red-600"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </StitchButton>
        </div>
      }
      compact
    >
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

      {/* Tab Navigation */}
      {!showAccessModal && !showInventoryLoginModal && (
        <div className="overflow-x-auto rounded-[28px] border border-[var(--stitch-line)] bg-white p-2">
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActivePanel(tab.id)}
                className={`flex items-center gap-2 whitespace-nowrap rounded-[20px] px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] transition ${
                  activePanel === tab.id
                    ? 'bg-[var(--stitch-ink)] text-[var(--stitch-bg)]'
                    : 'text-[var(--stitch-muted)] hover:bg-[var(--stitch-soft)]'
                }`}
                data-testid={`tab-${tab.id}`}
              >
                {tab.icon && <tab.icon className="h-4 w-4" />}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      {!showAccessModal && !showInventoryLoginModal && (
        <div>
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
              className="space-y-8"
            >
              {/* Welcome Banner */}
              <StitchCard className="overflow-hidden p-0">
                <div className="bg-[var(--stitch-ink)] p-8 text-[var(--stitch-bg)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Shield className="h-5 w-5 opacity-50" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.18em] opacity-50">Full Admin Access</span>
                      </div>
                      <h2 className="font-headline text-3xl font-black uppercase tracking-[-0.04em]">
                        Welcome, {user?.name?.split(' ')[0] || 'Admin'}
                      </h2>
                      <p className="mt-2 text-sm opacity-60">Manage your platform, track visits, and grow your business.</p>
                    </div>
                    <div className="hidden md:block text-right">
                      <p className="font-headline text-3xl font-black uppercase tracking-[-0.04em]">ApnaGhr</p>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] opacity-40">Premium Property Platform</p>
                    </div>
                  </div>
                </div>
              </StitchCard>

              {/* Stats Grid */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StitchKpi label="Total Properties" value="156" detail="+12 this week" icon={Home} />
                <StitchKpi label="Active Riders" value="24" detail="12 on duty" icon={Bike} />
                <StitchKpi label="Visits Today" value="47" detail="+18% vs yesterday" icon={Users} />
                <StitchKpi label="Revenue Today" value="₹11,400" detail="+₹2,100" icon={DollarSign} />
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                {/* Quick Actions */}
                <StitchCard className="p-6">
                  <StitchSectionHeader title="Quick Actions" />
                  <div className="mt-6 space-y-3">
                    <StitchButton onClick={() => setActivePanel('tracking')} className="w-full justify-start">
                      <MapPin className="h-4 w-4" />
                      View Live Tracking
                    </StitchButton>
                    <StitchButton variant="secondary" onClick={() => setActivePanel('approvals')} className="w-full justify-start">
                      <CheckSquare className="h-4 w-4" />
                      Review Pending Visits
                    </StitchButton>
                    <StitchButton variant="secondary" onClick={() => setActivePanel('inventory-team')} className="w-full justify-start">
                      <Users className="h-4 w-4" />
                      View Inventory Team
                    </StitchButton>
                    <StitchButton variant="secondary" onClick={() => setActivePanel('tolet')} className="w-full justify-start">
                      <Home className="h-4 w-4" />
                      Create ToLet Task
                    </StitchButton>
                    <StitchButton variant="secondary" onClick={() => setActivePanel('payouts')} className="w-full justify-start">
                      <CreditCard className="h-4 w-4" />
                      Process Payouts
                    </StitchButton>
                    <StitchButton variant="ghost" onClick={() => setShowImageTool(true)} className="w-full justify-start" data-testid="image-migration-btn">
                      <Image className="h-4 w-4" />
                      Fix Broken Images
                    </StitchButton>
                    <StitchButton onClick={() => setShowBulkUploader(true)} className="w-full justify-start" data-testid="bulk-upload-btn">
                      <Upload className="h-4 w-4" />
                      Upload Property Photos (Bulk)
                    </StitchButton>
                  </div>
                </StitchCard>

                {/* Recent Activity */}
                <StitchCard className="p-6">
                  <StitchSectionHeader title="Recent Activity" />
                  <div className="mt-6 space-y-3">
                    {[
                      { text: 'New visit booked', time: '2 minutes ago' },
                      { text: 'Rider completed visit', time: '15 minutes ago' },
                      { text: 'ToLet task created', time: '28 minutes ago' }
                    ].map((activity, idx) => (
                      <div key={idx} className="flex items-center gap-4 rounded-[22px] border border-[var(--stitch-line)] bg-[var(--stitch-soft)] p-4">
                        <div className="h-2 w-2 rounded-full bg-[var(--stitch-ink)]" />
                        <div className="flex-1">
                          <p className="text-sm font-bold">{activity.text}</p>
                          <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-[var(--stitch-muted)]">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </StitchCard>
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
              {activePanel === 'riders' && <RiderManagementPanel />}
              {activePanel === 'sellers' && <SellerManagementPanel />}
              {activePanel === 'support' && <CustomerSupportPanel />}
              {activePanel === 'settings' && <AppSettingsPanel />}
            </>
          )}

          {/* Shared panels (both admin and inventory can access) */}
          {activePanel === 'inventory' && <InventoryPanel inventorySession={accessType === 'inventory' ? inventorySession : null} />}
          {activePanel === 'analytics' && <PropertyAnalyticsPanel />}
        </div>
      )}
      
      {/* Image Migration Tool Modal */}
      <StitchModal open={showImageTool}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-headline text-xl font-black uppercase">Fix Broken Images</h3>
            <StitchButton variant="ghost" onClick={() => setShowImageTool(false)}>Close</StitchButton>
          </div>
          <ImageMigrationTool onClose={() => setShowImageTool(false)} />
        </div>
      </StitchModal>
      
      {/* Bulk Image Uploader Modal */}
      <StitchModal open={showBulkUploader}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-headline text-xl font-black uppercase">Bulk Upload</h3>
            <StitchButton variant="ghost" onClick={() => setShowBulkUploader(false)}>Close</StitchButton>
          </div>
          <BulkImageUploader onClose={() => setShowBulkUploader(false)} />
        </div>
      </StitchModal>
    </StitchShell>
  );
};

export default AdminDashboard;
