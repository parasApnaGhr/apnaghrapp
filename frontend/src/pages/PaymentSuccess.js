import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { paymentAPI } from '../utils/api';
import { CheckCircle, Loader, XCircle, Home, Package, Megaphone, ArrowRight } from 'lucide-react';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('checking');
  const [transaction, setTransaction] = useState(null);
  
  // Support both Cashfree (order_id) and legacy (session_id)
  const orderId = searchParams.get('order_id') || searchParams.get('session_id');
  const paymentType = searchParams.get('type');

  useEffect(() => {
    if (orderId) {
      pollPaymentStatus();
    } else {
      setStatus('error');
    }
  }, [orderId]);

  const pollPaymentStatus = async (attempts = 0) => {
    const maxAttempts = 15;  // Increased attempts

    if (attempts >= maxAttempts) {
      setStatus('timeout');
      return;
    }

    try {
      const response = await paymentAPI.getPaymentStatus(orderId);
      setTransaction(response.data);
      
      const paymentStatus = response.data.payment_status?.toLowerCase();

      if (paymentStatus === 'paid' || paymentStatus === 'success') {
        setStatus('success');
      } else if (paymentStatus === 'failed' || paymentStatus === 'cancelled' || paymentStatus === 'expired') {
        setStatus('error');
      } else {
        // Still pending, check again
        setTimeout(() => pollPaymentStatus(attempts + 1), 2000);
      }
    } catch (error) {
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
    
    // Default: visit packages
    if (packageType === 'single_visit') {
      return {
        title: 'Payment Successful!',
        message: 'You can now book 1 property visit.',
        icon: Home,
        buttonText: 'Browse Properties',
        redirectTo: '/customer'
      };
    }
    if (packageType === 'three_visits') {
      return {
        title: 'Payment Successful!',
        message: 'Your 3-visit package is now active. Valid for 7 days.',
        icon: Home,
        buttonText: 'Browse Properties',
        redirectTo: '/customer'
      };
    }
    if (packageType === 'five_visits') {
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
    <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        {status === 'checking' && (
          <div className="neo-card p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#FFD166] border-2 border-[#111111] flex items-center justify-center">
              <Loader className="w-10 h-10 animate-spin" />
            </div>
            <h2 className="text-2xl font-black mb-3" style={{ fontFamily: 'Outfit' }}>
              Processing Payment
            </h2>
            <p className="text-[#52525B]">Please wait while we verify your payment...</p>
            <div className="mt-6 flex justify-center">
              <div className="kinetic-loader">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}

        {status === 'success' && (
          <motion.div 
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="neo-card p-8 text-center bg-gradient-to-br from-[#C1F5C3]/30 to-white"
          >
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#4ECDC4] border-2 border-[#111111] shadow-[4px_4px_0px_#111111] flex items-center justify-center"
            >
              <CheckCircle className="w-10 h-10 text-white" />
            </motion.div>
            <h2 className="text-3xl font-black mb-3" style={{ fontFamily: 'Outfit' }}>
              {successInfo.title}
            </h2>
            <p className="text-[#52525B] mb-6">
              {successInfo.message}
            </p>
            
            {transaction && (
              <div className="bg-[#F3F4F6] rounded-xl p-4 mb-6 border-2 border-[#111111]/10">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#52525B]">Amount Paid</span>
                  <span className="text-xl font-black text-[#111111]" style={{ fontFamily: 'Outfit' }}>
                    ₹{transaction.amount?.toLocaleString()}
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
              <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}

        {status === 'timeout' && (
          <div className="neo-card p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#FFD166] border-2 border-[#111111] shadow-[4px_4px_0px_#111111] flex items-center justify-center">
              <Loader className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black mb-3" style={{ fontFamily: 'Outfit' }}>
              Still Processing
            </h2>
            <p className="text-[#52525B] mb-6">
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
          <div className="neo-card p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#FF5A5F] border-2 border-[#111111] shadow-[4px_4px_0px_#111111] flex items-center justify-center">
              <XCircle className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-black mb-3" style={{ fontFamily: 'Outfit' }}>
              Payment Failed
            </h2>
            <p className="text-[#52525B] mb-6">
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
