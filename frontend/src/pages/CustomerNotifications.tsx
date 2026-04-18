// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { 
  ArrowLeft, Bell, Check, Calendar, MapPin, 
  CreditCard, User, AlertTriangle, Trash2
} from 'lucide-react';
import { toast } from 'sonner';

const CustomerNotifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unread_count || 0);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/mark-read');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark notifications as read');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'visit_booked':
      case 'visit_scheduled':
        return <Calendar className="w-5 h-5 text-[#04473C]" />;
      case 'rider_assigned':
      case 'rider_arriving':
        return <MapPin className="w-5 h-5 text-blue-600" />;
      case 'payment_success':
      case 'payout_processed':
        return <CreditCard className="w-5 h-5 text-green-600" />;
      case 'visit_completed':
        return <Check className="w-5 h-5 text-green-600" />;
      case 'admin_notification':
        return <User className="w-5 h-5 text-purple-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      default:
        return <Bell className="w-5 h-5 text-[#04473C]" />;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short'
    });
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] pb-24">
      {/* Header */}
      <header className="glass-header sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/customer/profile')}
                className="p-2 hover:bg-[#F5F3F0] transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-[#1A1C20]" strokeWidth={1.5} />
              </button>
              <div>
                <h1 className="text-xl font-medium" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Notifications
                </h1>
                <p className="text-sm text-[#4A4D53]">
                  {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                </p>
              </div>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[#04473C] text-sm font-medium hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#04473C] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 mx-auto mb-6 bg-[#F5F3F0] flex items-center justify-center">
              <Bell className="w-10 h-10 text-[#D0C9C0]" strokeWidth={1} />
            </div>
            <h2 className="text-xl mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
              No notifications
            </h2>
            <p className="text-[#4A4D53]">You're all caught up!</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification, index) => (
              <motion.div
                key={notification.id || index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                className={`bg-white border p-4 flex gap-4 ${
                  notification.read ? 'border-[#E5E1DB]' : 'border-[#04473C] bg-[#F8FAF9]'
                }`}
              >
                <div className={`w-10 h-10 flex items-center justify-center flex-shrink-0 ${
                  notification.read ? 'bg-[#F5F3F0]' : 'bg-[#E6F0EE]'
                }`}>
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`font-medium ${notification.read ? 'text-[#4A4D53]' : 'text-[#1A1C20]'}`}>
                      {notification.title}
                    </p>
                    <span className="text-xs text-[#9A9A9A] whitespace-nowrap">
                      {formatDate(notification.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-[#4A4D53] mt-1">{notification.message}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default CustomerNotifications;
