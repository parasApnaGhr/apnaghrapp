import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { riderAPI, siteVisitAPI, notificationAPI } from '../utils/api';
import { Home, MapPin, Camera, Briefcase, Bell, Award } from 'lucide-react';
import { toast } from 'sonner';
import DutyControl from '../components/DutyControl';
import TaskOverview from '../components/TaskOverview';
import SiteVisits from '../components/SiteVisits';
import AddBoard from '../components/AddBoard';
import BrokerVisits from '../components/BrokerVisits';
import Earnings from '../components/Earnings';

const RiderDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [rider, setRider] = useState(null);
  const [stats, setStats] = useState(null);
  const [visits, setVisits] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRiderData();
  }, []);

  const loadRiderData = async () => {
    try {
      const ridersResponse = await riderAPI.getRiders();
      const myRider = ridersResponse.data.find((r) => r.user_id === user.id);

      if (myRider) {
        setRider(myRider);
        const [statsResponse, visitsResponse, notifsResponse] = await Promise.all([
          riderAPI.getStats(myRider.id),
          siteVisitAPI.getSiteVisits({ rider_id: myRider.id }),
          notificationAPI.getNotifications(),
        ]);
        setStats(statsResponse.data);
        setVisits(visitsResponse.data);
        setNotifications(notifsResponse.data);
      }
    } catch (error) {
      toast.error('Failed to load rider data');
    } finally {
      setLoading(false);
    }
  };

  const handleDutyToggle = async (onDuty, location) => {
    if (!rider) return;
    try {
      await riderAPI.toggleDuty(rider.id, {
        on_duty: onDuty,
        lat: location?.lat,
        lng: location?.lng,
      });
      toast.success(onDuty ? 'Duty started!' : 'Duty ended!');
      loadRiderData();
    } catch (error) {
      toast.error('Failed to toggle duty');
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="space-y-6">
            {rider && <DutyControl rider={rider} onToggle={handleDutyToggle} />}
            {stats && <TaskOverview stats={stats} />}
          </div>
        );
      case 'visits':
        return <SiteVisits visits={visits} riderId={rider?.id} onUpdate={loadRiderData} />;
      case 'boards':
        return <AddBoard riderId={rider?.id} city={rider?.city} onSuccess={loadRiderData} />;
      case 'brokers':
        return <BrokerVisits riderId={rider?.id} city={rider?.city} onSuccess={loadRiderData} />;
      case 'earnings':
        return <Earnings riderId={rider?.id} stats={stats} />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black" style={{ fontFamily: 'Barlow Condensed' }}>
              {user?.name}
            </h1>
            <p className="text-sm text-slate-500">{rider?.city}</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2" data-testid="notifications-button">
              <Bell className="w-5 h-5 text-slate-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="p-4">{renderContent()}</main>

      <div className="floating-nav">
        <button
          className={activeTab === 'home' ? 'active' : ''}
          onClick={() => setActiveTab('home')}
          data-testid="nav-home"
        >
          <Home className="w-5 h-5" />
        </button>
        <button
          className={activeTab === 'visits' ? 'active' : ''}
          onClick={() => setActiveTab('visits')}
          data-testid="nav-visits"
        >
          <MapPin className="w-5 h-5" />
        </button>
        <button
          className={activeTab === 'boards' ? 'active' : ''}
          onClick={() => setActiveTab('boards')}
          data-testid="nav-boards"
        >
          <Camera className="w-5 h-5" />
        </button>
        <button
          className={activeTab === 'brokers' ? 'active' : ''}
          onClick={() => setActiveTab('brokers')}
          data-testid="nav-brokers"
        >
          <Briefcase className="w-5 h-5" />
        </button>
        <button
          className={activeTab === 'earnings' ? 'active' : ''}
          onClick={() => setActiveTab('earnings')}
          data-testid="nav-earnings"
        >
          <Award className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default RiderDashboard;