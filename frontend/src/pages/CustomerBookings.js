import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { visitAPI } from '../utils/api';
import { ArrowLeft, Calendar, MapPin, User, Clock } from 'lucide-react';
import { toast } from 'sonner';

const CustomerBookings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      const response = await visitAPI.getMyBookings();
      setBookings(response.data);
    } catch (error) {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge badge-warning',
      rider_assigned: 'badge badge-info',
      in_progress: 'badge badge-info',
      completed: 'badge badge-success',
    };
    return badges[status] || 'badge';
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <header className="bg-white border-b border-[#E5E3D8] sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate('/customer')}
            className="p-2 hover:bg-[#F3F2EB] rounded-lg"
            data-testid="back-button"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-bold text-lg">My Visits</h1>
            <p className="text-sm text-[#4A626C]">Track your property visits</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-[#E07A5F] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-[#4A626C]">Loading bookings...</p>
            </div>
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-20">
            <Calendar className="w-16 h-16 text-[#4A626C] mx-auto mb-4 opacity-50" />
            <p className="text-[#4A626C] mb-4">No visits booked yet</p>
            <button onClick={() => navigate('/customer')} className="btn-primary">
              Browse Properties
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white rounded-xl border border-[#E5E3D8] p-6"
                data-testid={`booking-${booking.id}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-lg mb-1">Property Visit</h3>
                    <p className="text-sm text-[#4A626C]">Property ID: {booking.property_id.substring(0, 8)}...</p>
                  </div>
                  <span className={getStatusBadge(booking.status)}>
                    {booking.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-[#4A626C]" />
                    <span>{booking.scheduled_date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-[#4A626C]" />
                    <span>{booking.scheduled_time}</span>
                  </div>
                  {booking.rider_id && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-[#4A626C]" />
                      <span>Rider assigned</span>
                    </div>
                  )}
                </div>

                {booking.status === 'pending' && (
                  <div className="mt-4 p-3 bg-[#FFF5F2] rounded-lg">
                    <p className="text-sm text-[#E07A5F] font-medium">
                      Waiting for rider assignment...
                    </p>
                  </div>
                )}

                {booking.status === 'rider_assigned' && booking.otp && (
                  <div className="mt-4 p-3 bg-[#F0FDF9] rounded-lg">
                    <p className="text-sm font-medium mb-1">Visit OTP:</p>
                    <p className="text-2xl font-bold text-[#2A9D8F]" style={{ fontFamily: 'Outfit' }}>
                      {booking.otp}
                    </p>
                    <p className="text-xs text-[#4A626C] mt-1">
                      Share this OTP with the rider to start visit
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default CustomerBookings;