// @ts-nocheck
import React, { useState } from 'react';
import { Phone, MessageCircle, CheckCircle, Clock } from 'lucide-react';
import ChatWindow from './ChatWindow';
import { toast } from 'sonner';

const CustomerSupportPanel = () => {
  const [bookings] = useState([
    {
      id: '1',
      customer: 'Rahul Kumar',
      customerId: 'customer-001',
      customerPhone: '9999999999',
      property: '2BHK Sector 70',
      status: 'in_progress',
      scheduled: '2:00 PM',
    },
    {
      id: '2',
      customer: 'Priya Sharma',
      customerId: 'customer-002',
      customerPhone: '9999999998',
      property: '3BHK Zirakpur',
      status: 'pending',
      scheduled: '4:30 PM',
    },
  ]);

  const [activeChatUser, setActiveChatUser] = useState(null);

  const handleCall = (phone, name) => {
    // Show masked number calling instructions
    toast.info(`Calling ${name} at ${phone}...`, { duration: 3000 });
    // In production, this would use Twilio masked calling
    window.location.href = `tel:${phone}`;
  };

  const handleChat = (customerId, customerName) => {
    setActiveChatUser({ id: customerId, name: customerName });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Outfit' }}>
        Customer Support Panel
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="stat-card">
          <p className="text-sm text-[var(--stitch-muted)] mb-1">Pending Visits</p>
          <p className="text-3xl font-bold text-[#F4A261]" style={{ fontFamily: 'Outfit' }}>8</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-[var(--stitch-muted)] mb-1">In Progress</p>
          <p className="text-3xl font-bold text-[var(--stitch-ink)]" style={{ fontFamily: 'Outfit' }}>3</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-[var(--stitch-muted)] mb-1">Completed Today</p>
          <p className="text-3xl font-bold text-[var(--stitch-ink)]" style={{ fontFamily: 'Outfit' }}>47</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[var(--stitch-line)] p-6">
        <h3 className="font-bold mb-4">Active Bookings</h3>
        <div className="space-y-3">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="border border-[var(--stitch-line)] rounded-lg p-4"
              data-testid={`booking-${booking.id}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-bold">{booking.customer}</h4>
                  <p className="text-sm text-[var(--stitch-muted)]">{booking.property}</p>
                  <p className="text-sm text-[var(--stitch-muted)]">Scheduled: {booking.scheduled}</p>
                </div>
                <span
                  className={`badge ${
                    booking.status === 'in_progress'
                      ? 'badge-info'
                      : 'badge-warning'
                  }`}
                >
                  {booking.status.replace('_', ' ')}
                </span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleCall(booking.customerPhone, booking.customer)}
                  className="stitch-button flex-1 flex items-center justify-center gap-2"
                  data-testid={`call-customer-${booking.id}`}
                >
                  <Phone className="w-4 h-4" />
                  Call Customer
                </button>
                <button 
                  onClick={() => handleChat(booking.customerId, booking.customer)}
                  className="stitch-button stitch-button-secondary flex-1 flex items-center justify-center gap-2"
                  data-testid={`chat-customer-${booking.id}`}
                >
                  <MessageCircle className="w-4 h-4" />
                  Chat
                </button>
                <button className="px-4 py-2 border border-[var(--stitch-line)] rounded-lg hover:bg-[#F3F2EB] flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Close Deal
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 bg-[var(--stitch-soft)] rounded-xl p-6 border border-[var(--stitch-ink)]/20">
        <h3 className="font-bold mb-3">Support Guidelines</h3>
        <ul className="space-y-2 text-sm text-[var(--stitch-muted)]">
          <li>• Follow up within 5 minutes of visit completion</li>
          <li>• Handle all negotiation - riders should not negotiate</li>
          <li>• Use masked calling for customer privacy</li>
          <li>• Update deal status immediately after closing</li>
        </ul>
      </div>

      {activeChatUser && (
        <ChatWindow
          otherUserId={activeChatUser.id}
          otherUserName={activeChatUser.name}
          onClose={() => setActiveChatUser(null)}
        />
      )}
    </div>
  );
};

export default CustomerSupportPanel;