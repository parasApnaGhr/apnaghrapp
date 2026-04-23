// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Bell, Calendar, CheckCircle2, CreditCard, MapPin, User2 } from "lucide-react";
import { toast } from "sonner";
import api from "../utils/api";
import { StitchCard, StitchLoadingPage, StitchSectionHeader, StitchShell } from "../stitch/components/StitchPrimitives";

const typeIcons = {
  visit_booked: Calendar,
  visit_scheduled: Calendar,
  rider_assigned: MapPin,
  rider_arriving: MapPin,
  payment_success: CreditCard,
  payout_processed: CreditCard,
  visit_completed: CheckCircle2,
  admin_notification: User2,
  warning: AlertTriangle,
};

const formatTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

export default function CustomerNotifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const response = await api.get("/notifications");
        setNotifications(response.data?.notifications || []);
        setUnreadCount(response.data?.unread_count || 0);
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, []);

  const groups = useMemo(() => {
    return notifications.reduce((acc, notification) => {
      const key = notification.read ? "Earlier" : "Unread";
      acc[key] = acc[key] || [];
      acc[key].push(notification);
      return acc;
    }, {});
  }, [notifications]);

  const markAllAsRead = async () => {
    try {
      await api.post("/notifications/mark-read");
      setNotifications((current) => current.map((item) => ({ ...item, read: true })));
      setUnreadCount(0);
      toast.success("Marked all as read");
    } catch {
      toast.error("Failed to update notifications");
    }
  };

  if (loading) {
    return <StitchLoadingPage label="Loading notifications" />;
  }

  return (
    <StitchShell
      title="Notifications"
      eyebrow="Inbox"
      actions={
        <>
          <button onClick={() => navigate("/customer/profile")} className="stitch-button stitch-button-secondary">
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          {unreadCount > 0 ? (
            <button onClick={markAllAsRead} className="stitch-button stitch-button-ghost">
              Mark all read
            </button>
          ) : null}
        </>
      }
    >
      <div className="mx-auto w-full max-w-4xl">
        <StitchCard className="p-6 md:p-8">
          <StitchSectionHeader title={unreadCount > 0 ? `${unreadCount} unread` : "All caught up"} />
          {notifications.length === 0 ? (
            <div className="mt-8 rounded-[28px] border border-dashed border-[var(--stitch-line-strong)] p-10 text-center">
              <Bell className="mx-auto h-8 w-8 text-[var(--stitch-muted)]" />
              <p className="mt-4 text-sm text-[var(--stitch-muted)]">No notifications.</p>
            </div>
          ) : (
            <div className="mt-6 space-y-8">
              {Object.entries(groups).map(([label, items]) => (
                <div key={label}>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--stitch-muted)]">{label}</p>
                  <div className="mt-3 space-y-3">
                    {items.map((notification, index) => {
                      const Icon = typeIcons[notification.type] || Bell;
                      return (
                        <div
                          key={notification.id || index}
                          className={`rounded-[28px] border p-5 ${notification.read ? "border-[var(--stitch-line)] bg-white" : "border-black bg-[var(--stitch-soft)]"}`}
                        >
                          <div className="flex gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white">
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <p className="text-base font-black uppercase tracking-[0.08em]">{notification.title}</p>
                                <span className="shrink-0 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--stitch-muted)]">
                                  {formatTime(notification.created_at)}
                                </span>
                              </div>
                              <p className="mt-2 text-sm leading-7 text-[var(--stitch-muted)]">{notification.message}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </StitchCard>
      </div>
    </StitchShell>
  );
}
