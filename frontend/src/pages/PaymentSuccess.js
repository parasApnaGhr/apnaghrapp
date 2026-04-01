import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { paymentAPI, visitAPI } from '../utils/api';
import { CheckCircle, Loader, XCircle, Home, Package, Megaphone, ArrowRight, Calendar } from 'lucide-react';
import { toast } from 'sonner';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('checking');
  const [transaction, setTransaction] = useState(null);
  const [visitBooked, setVisitBooked] = useState(false);
  const [bookingDetails, setBookingDetails] = useState(null);
  
  const orderId = searchParams.get('order_id') || searchParams.get('session_id');
  const paymentType = searchParams.get('type');

  useEffect(() => {
    if (orderId) {
      pollPaymentStatus();
    } else {
      setStatus('error');
    }
  }, [orderId]);

  // Auto-book visit after payment success
  const autoBookVisit = async () => {
    const pendingBookingStr = localStorage.getItem('pendingVisitBooking');
    if (!pendingBookingStr) {
      console.log('No pending booking found in localStorage');
      return;
    }

    try {
      const pendingBooking = JSON.parse(pendingBookingStr);
      console.log('Attempting to auto-book visit:', pendingBooking);
      
      // Small delay to ensure package is created
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create the visit booking
      const response = await visitAPI.bookVisit({
        property_ids: pendingBooking.property_ids,
        scheduled_date: pendingBooking.scheduled_date,
        scheduled_time: pendingBooking.scheduled_time,
        pickup_location: pendingBooking.pickup_location,
        pickup_lat: pendingBooking.pickup_lat,
        pickup_lng: pendingBooking.pickup_lng
      });

      console.log('Visit booked successfully:', response.data);
      setVisitBooked(true);
      setBookingDetails(response.data);
      
      // Clear pending booking and cart
      localStorage.removeItem('pendingVisitBooking');
      localStorage.removeItem('visitCart');
      
      toast.success('Visit scheduled successfully!');
    } catch (error) {
      console.error('Auto-book visit error:', error);
      const errorMsg = error.response?.data?.detail || error.message;
      
      // If no credits, it's still a success - just need to book separately
      if (errorMsg?.includes('No available visit credits')) {
        toast.info('Payment successful! Visit package added. You can now book your visit.');
        localStorage.removeItem('visitCart');
      } else {
        toast.error('Payment successful! Please book your visit from My Bookings.');
      }
    }
  };

  const pollPaymentStatus = async (attempts = 0) => {
    const maxAttempts = 20;

    if (attempts >= maxAttempts) {
      setStatus('timeout');
      return;
    }

    try {
      const response = await paymentAPI.getPaymentStatus(orderId);
      setTransaction(response.data);
      
      const paymentStatus = response.data.payment_status?.toLowerCase();
      console.log(`Payment status check #${attempts + 1}: ${paymentStatus}`);

      if (paymentStatus === 'paid' || paymentStatus === 'success') {
        setStatus('success');
        // Auto-book visit if pending
        await autoBookVisit();
      } else if (paymentStatus === 'failed' || paymentStatus === 'cancelled' || paymentStatus === 'expired') {
        setStatus('error');
      } else {
        // Still pending - keep polling
        setTimeout(() => pollPaymentStatus(attempts + 1), 2000);
      }
    } catch (error) {
      console.error('Payment status check error:', error);
      // On error, keep trying
      setTimeout(() => pollPaymentStatus(attempts + 1), 2000);
    }
  };

  const getSuccessMessage = () => {
    const type = transaction?.metadata?.type || paymentType;
    const packageType = transaction?.package_type;
    
    if (type === 'packers' || packageType?.startsWith('packers_')) {
      return {
        title: 'Booking Confirmed!',
        message: 'Your packers & movers booking is confirmed. Our team will contact you shortly.',
        icon: Package,
        buttonText: 'View Bookings',
        redirectTo: '/customer/packers'
      };
    }
    
    if (type === 'advertising' || packageType?.startsWith('ads_')) {
      return {
        title: 'Campaign Submitted!',
        message: 'Your ad campaign is now active. Track impressions in your dashboard.',
        icon: Megaphone,
        buttonText: 'View Ads',
        redirectTo: '/customer/advertise'
      };
    }
    
    if (packageType === 'single_visit') {
      if (visitBooked && bookingDetails) {
        return {
          title: 'Visit Scheduled!',
          message: `Your property visit is confirmed for ${bookingDetails.scheduled_date} at ${bookingDetails.scheduled_time}. A rider will pick you up.`,
          icon: Calendar,
          buttonText: 'View My Bookings',
          redirectTo: '/customer/bookings'
        };
      }
      return {
        title: 'Payment Successful!',
        message: 'You can now book 1 property visit.',
        icon: Home,
        buttonText: 'Browse Properties',
        redirectTo: '/customer'
      };
    }
    if (packageType === 'three_visits') {
      if (visitBooked && bookingDetails) {
        return {
          title: 'Visit Scheduled!',
          message: `Your property visit is confirmed for ${bookingDetails.scheduled_date} at ${bookingDetails.scheduled_time}. You have ${2} more visits remaining.`,
          icon: Calendar,
          buttonText: 'View My Bookings',
          redirectTo: '/customer/bookings'
        };
      }
      return {
        title: 'Payment Successful!',
        message: 'Your 3-visit package is now active. Valid for 7 days.',
        icon: Home,
        buttonText: 'Browse Properties',
        redirectTo: '/customer'
      };
    }
    if (packageType === 'five_visits') {
      if (visitBooked && bookingDetails) {
        return {
          title: 'Visit Scheduled!',
          message: `Your property visit is confirmed for ${bookingDetails.scheduled_date} at ${bookingDetails.scheduled_time}. You have ${4} more visits remaining.`,
          icon: Calendar,
          buttonText: 'View My Bookings',
          redirectTo: '/customer/bookings'
        };
      }
      return {
        title: 'Payment Successful!',
        message: 'Your 5-visit package is now active. Valid for 10 days.',
        icon: Home,
        buttonText: 'Browse Properties',
        redirectTo: '/customer'
      };
    }
    if (packageType === 'property_lock') {
      return {
        title: 'Property Locked!',
        message: 'This property is now reserved for you. Contact support to finalize.',
        icon: Home,
        buttonText: 'View Locked Property',
        redirectTo: '/customer/bookings'
      };
    }
    
    return {
      title: 'Payment Successful!',
      message: 'Your payment has been processed successfully.',
      icon: Home,
      buttonText: 'Continue',
      redirectTo: '/customer'
    };
  };

  const successInfo = getSuccessMessage();
  const SuccessIcon = successInfo.icon;

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        {status === 'checking' && (
          <div className="bg-white border border-[#E5E1DB] p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-[#C6A87C]/20 flex items-center justify-center">
              <Loader className="w-10 h-10 text-[#C6A87C] animate-spin" strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl mb-3" style={{ fontFamily: 'Playfair Display, serif' }}>
              Processing Payment
            </h2>
            <p className="text-[#4A4D53]">Please wait while we verify your payment...</p>
            <div className="mt-6 flex justify-center gap-1">
              {[0, 1, 2].map(i => (
                <motion.span
                  key={i}
                  className="w-2 h-2 bg-[#04473C] rounded-full"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
                />
              ))}
            </div>
          </div>
        )}

        {status === 'success' && (
          <motion.div 
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-white border border-[#E5E1DB] p-8 text-center"
          >
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="w-20 h-20 mx-auto mb-6 bg-[#04473C] flex items-center justify-center"
            >
              <CheckCircle className="w-10 h-10 text-white" strokeWidth={1.5} />
            </motion.div>
            <h2 className="text-3xl mb-3" style={{ fontFamily: 'Playfair Display, serif' }}>
              {successInfo.title}
            </h2>
            <p className="text-[#4A4D53] mb-6">
              {successInfo.message}
            </p>
            
            {transaction && (
              <div className="bg-[#F5F3F0] p-4 mb-6 border border-[#E5E1DB]">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#4A4D53] uppercase tracking-wide">Amount Paid</span>
                  <span className="price-display text-xl">
                    <span className="price-currency text-base">₹</span>
                    {transaction.amount?.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
            
            <button
              onClick={() => navigate(successInfo.redirectTo)}
              className="btn-primary w-full flex items-center justify-center gap-2"
              data-testid="continue-button"
            >
              {successInfo.buttonText}
              <ArrowRight className="w-5 h-5" strokeWidth={1.5} />
            </button>
          </motion.div>
        )}

        {status === 'timeout' && (
          <div className="bg-white border border-[#E5E1DB] p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-[#C6A87C]/20 flex items-center justify-center">
              <Loader className="w-10 h-10 text-[#C6A87C]" strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl mb-3" style={{ fontFamily: 'Playfair Display, serif' }}>
              Still Processing
            </h2>
            <p className="text-[#4A4D53] mb-6">
              Your payment is being processed. Please check your bookings in a few minutes.
            </p>
            <button 
              onClick={() => navigate('/customer')} 
              className="btn-secondary w-full"
            >
              Go to Home
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-white border border-[#E5E1DB] p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-[#8F2727]/10 flex items-center justify-center">
              <XCircle className="w-10 h-10 text-[#8F2727]" strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl mb-3" style={{ fontFamily: 'Playfair Display, serif' }}>
              Payment Failed
            </h2>
            <p className="text-[#4A4D53] mb-6">
              Something went wrong with your payment. Please try again.
            </p>
            <button 
              onClick={() => navigate('/customer')} 
              className="btn-primary w-full"
            >
              Try Again
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default PaymentSuccess;
