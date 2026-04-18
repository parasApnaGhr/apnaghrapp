// @ts-nocheck
import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Bell, Check, Clock, MapPin, IndianRupee, X } from 'lucide-react';
import { toast } from 'sonner';

const NotificationsDropdown = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data.notifications);
      setUnreadCount(response.data.unread_count);
    } catch (error) {
      console.error('Failed to load notifications');
    }
  };

  const markAllRead = async () => {
    try {
      await api.post('/notifications/mark-read');
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'ride_update':
      case 'ride_started':
      case 'ride_completed':
        return <MapPin className="w-4 h-4 text-blue-500" />;
      case 'task_started':
      case 'task_completed':
      case 'task_approved':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'visit_approved':
      case 'payout_processed':
        return <IndianRupee className="w-4 h-4 text-emerald-500" />;
      // Seller performance notification types
      case 'daily_start':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'daily_score':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'milestone_approaching':
        return <Bell className="w-4 h-4 text-yellow-500" />;
      case 'milestone_reached':
        return <IndianRupee className="w-4 h-4 text-green-500" />;
      case 'rank_change':
        return <Bell className="w-4 h-4 text-purple-500" />;
      case 'performance_warning':
        return <Bell className="w-4 h-4 text-red-500" />;
      default:
        return <Bell className="w-4 h-4 text-[#E07A5F]" />;
    }
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-[#F3F2EB] rounded-lg transition"
        data-testid="notifications-button"
      >
        <Bell className="w-6 h-6 text-[#4A626C]" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-[#E07A5F] text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-[#E5E3D8] z-50 overflow-hidden">
            {/* Header */}
            <div className="p-3 border-b border-[#E5E3D8] flex items-center justify-between">
              <h3 className="font-bold">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-[#2A9D8F] hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-[#4A626C]">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                notifications.slice(0, 10).map(notification => (
                  <div
                    key={notification.id}
                    className={`p-3 border-b border-[#E5E3D8] last:border-0 hover:bg-[#F3F2EB] transition ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{notification.title}</p>
                        <p className="text-xs text-[#4A626C] mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-[#4A626C] mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(notification.created_at)}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 10 && (
              <div className="p-2 border-t border-[#E5E3D8] text-center">
                <button className="text-sm text-[#E07A5F] hover:underline">
                  View all notifications
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationsDropdown;
