import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { visitAPI } from '../utils/api';
import { ArrowLeft, Calendar, MapPin, User, Clock, Home, Phone, Navigation } from 'lucide-react';
import { toast } from 'sonner';

const CustomerBookings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    loadBookings();
    const interval = setInterval(loadBookings, 15000); // Refresh every 15 seconds
    return () => clearInterval(interval);
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

  const loadBookingDetails = async (bookingId) => {
    try {
      const response = await visitAPI.getVisitDetails(bookingId);
      setSelectedBooking(response.data);
    } catch (error) {
      toast.error('Failed to load booking details');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { class: 'bg-amber-100 text-amber-800', text: 'Waiting for Rider' },
      rider_assigned: { class: 'bg-blue-100 text-blue-800', text: 'Rider Assigned' },
      pickup_started: { class: 'bg-purple-100 text-purple-800', text: 'Rider on the Way' },
      at_customer: { class: 'bg-indigo-100 text-indigo-800', text: 'Rider Arrived' },
      navigating: { class: 'bg-cyan-100 text-cyan-800', text: 'En Route to Property' },
      at_property: { class: 'bg-teal-100 text-teal-800', text: 'At Property' },
      completed: { class: 'bg-green-100 text-green-800', text: 'Completed' },
      cancelled: { class: 'bg-red-100 text-red-800', text: 'Cancelled' },
    };
    return badges[status] || { class: 'bg-gray-100 text-gray-800', text: status };
  };

  const getStepProgress = (booking) => {
    const steps = [
      'pending',
      'rider_assigned',
      'pickup_started',
      'at_customer',
      'navigating',
      'at_property',
      'completed'
    ];
    const currentIndex = steps.indexOf(booking.status);
    return Math.max(0, currentIndex);
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
            {bookings.map((booking) => {
              const statusInfo = getStatusBadge(booking.status);
              const numProperties = booking.property_ids?.length || 1;
              const numCompleted = booking.properties_completed?.length || 0;
              
              return (
                <div
                  key={booking.id}
                  className="bg-white rounded-xl border border-[#E5E3D8] overflow-hidden"
                  data-testid={`booking-${booking.id}`}
                >
                  {/* Header */}
                  <div className="p-4 border-b border-[#E5E3D8]">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-lg">
                          {numProperties > 1 ? `Multi-Property Visit (${numProperties})` : 'Property Visit'}
                        </h3>
                        <p className="text-sm text-[#4A626C]">
                          {booking.scheduled_date} at {booking.scheduled_time}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.class}`}>
                        {statusInfo.text}
                      </span>
                    </div>
                    
                    {/* Progress Bar */}
                    {booking.status !== 'completed' && booking.status !== 'cancelled' && numProperties > 1 && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-[#4A626C] mb-1">
                          <span>Properties Visited</span>
                          <span>{numCompleted} / {numProperties}</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[#2A9D8F] transition-all"
                            style={{ width: `${(numCompleted / numProperties) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    {/* RIDER INFO - Uber Style */}
                    {booking.rider_id && (
                      <div className="bg-gradient-to-r from-[#04473C] to-[#065f4e] rounded-xl p-4 mb-4 text-white">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
                            <User className="w-7 h-7" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-white/70 uppercase tracking-wider">Your Rider</p>
                            <p className="font-bold text-lg">{booking.rider_name || 'Assigned Rider'}</p>
                            {booking.rider_is_online && (
                              <span className="inline-flex items-center gap-1 text-xs bg-green-500 px-2 py-0.5 rounded-full mt-1">
                                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                                Online
                              </span>
                            )}
                          </div>
                          {booking.rider_phone && (
                            <a
                              href={`tel:${booking.rider_phone}`}
                              className="w-12 h-12 bg-white rounded-full flex items-center justify-center"
                              data-testid="call-rider-btn"
                            >
                              <Phone className="w-5 h-5 text-[#04473C]" />
                            </a>
                          )}
                        </div>
                        
                        {/* ETA Section - if rider is on the way */}
                        {['pickup_started', 'navigating'].includes(booking.status) && booking.rider_lat && booking.rider_lng && (
                          <div className="mt-4 pt-4 border-t border-white/20">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Navigation className="w-4 h-4" />
                                <span className="text-sm">Rider is on the way</span>
                              </div>
                              <button
                                onClick={() => {
                                  window.open(`https://www.google.com/maps?q=${booking.rider_lat},${booking.rider_lng}`, '_blank');
                                }}
                                className="text-xs bg-white/20 px-3 py-1 rounded-full hover:bg-white/30 transition-colors"
                              >
                                View on Map
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* No Rider Yet */}
                    {!booking.rider_id && booking.status === 'pending' && (
                      <div className="bg-amber-50 rounded-xl p-4 mb-4 border border-amber-200">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                            <Clock className="w-5 h-5 text-amber-600" />
                          </div>
                          <div>
                            <p className="font-medium text-amber-800">Finding a Rider</p>
                            <p className="text-sm text-amber-600">We'll notify you when a rider accepts</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Pickup Location */}
                    {booking.pickup_location && (
                      <div className="flex items-start gap-3 mb-4 pb-4 border-b border-[#E5E3D8]">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Pickup Location</p>
                          <p className="text-sm text-[#4A626C]">{booking.pickup_location}</p>
                        </div>
                      </div>
                    )}

                    {/* Property IDs Preview */}
                    <div className="space-y-2 mb-4">
                      {booking.property_ids?.slice(0, 3).map((propId, idx) => (
                        <div 
                          key={propId} 
                          className={`flex items-center gap-3 p-2 rounded-lg ${
                            booking.properties_completed?.includes(propId)
                              ? 'bg-green-50'
                              : 'bg-[#F3F2EB]'
                          }`}
                        >
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            booking.properties_completed?.includes(propId)
                              ? 'bg-green-500 text-white'
                              : 'bg-[#E07A5F] text-white'
                          }`}>
                            {booking.properties_completed?.includes(propId) ? '✓' : idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">Property {idx + 1}</p>
                            <p className="text-xs text-[#4A626C]">ID: {propId.substring(0, 8)}...</p>
                          </div>
                        </div>
                      ))}
                      {booking.property_ids?.length > 3 && (
                        <p className="text-sm text-[#4A626C] text-center">
                          +{booking.property_ids.length - 3} more properties
                        </p>
                      )}
                    </div>

                    {/* OTP Section */}
                    {['rider_assigned', 'pickup_started', 'at_customer'].includes(booking.status) && booking.otp && (
                      <div className="bg-[#F0FDF9] rounded-xl p-4 mb-4">
                        <p className="text-sm font-medium mb-1">Your Visit OTP:</p>
                        <p className="text-3xl font-bold text-[#2A9D8F] tracking-widest" style={{ fontFamily: 'Outfit' }}>
                          {booking.otp}
                        </p>
                        <p className="text-xs text-[#4A626C] mt-2">
                          Share this OTP with the rider to start your visit
                        </p>
                      </div>
                    )}

                    {/* Estimated Duration */}
                    {booking.estimated_duration && (
                      <div className="flex items-center gap-2 text-sm text-[#4A626C] mb-4">
                        <Clock className="w-4 h-4" />
                        <span>Estimated Duration: {booking.estimated_duration}</span>
                      </div>
                    )}

                    {/* View Details Button */}
                    <button
                      onClick={() => loadBookingDetails(booking.id)}
                      className="w-full bg-[#F3F2EB] text-[#264653] px-4 py-3 rounded-lg hover:bg-[#E5E3D8] font-medium"
                      data-testid={`view-details-${booking.id}`}
                    >
                      View Full Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Details Modal */}
        {selectedBooking && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold">Visit Details</h3>
                  <button
                    onClick={() => setSelectedBooking(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                {/* Rider Info */}
                {selectedBooking.rider && (
                  <div className="bg-[#F3F2EB] rounded-xl p-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-[#E07A5F] rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold">{selectedBooking.rider.name}</p>
                        <p className="text-sm text-[#4A626C]">Your Rider</p>
                      </div>
                      <a
                        href={`tel:${selectedBooking.rider.phone}`}
                        className="bg-[#2A9D8F] text-white p-3 rounded-full"
                      >
                        <Phone className="w-5 h-5" />
                      </a>
                    </div>
                  </div>
                )}

                {/* Properties */}
                <div className="space-y-3">
                  <h4 className="font-bold">Properties to Visit</h4>
                  {selectedBooking.properties?.map((prop, idx) => (
                    <div key={prop.id} className="bg-[#FFF5F2] rounded-xl p-4">
                      <div className="flex gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                          selectedBooking.visit.properties_completed?.includes(prop.id)
                            ? 'bg-green-500'
                            : 'bg-[#E07A5F]'
                        }`}>
                          {selectedBooking.visit.properties_completed?.includes(prop.id) ? '✓' : idx + 1}
                        </div>
                        <div className="flex-1">
                          <h5 className="font-bold">{prop.title}</h5>
                          <p className="text-sm text-[#4A626C]">
                            {prop.bhk} BHK • {prop.furnishing}
                          </p>
                          <p className="text-sm text-[#4A626C]">{prop.area_name}</p>
                          <p className="text-[#E07A5F] font-bold mt-1">
                            ₹{prop.rent?.toLocaleString()}/mo
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setSelectedBooking(null)}
                  className="w-full mt-6 bg-[#264653] text-white px-4 py-3 rounded-xl font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CustomerBookings;
