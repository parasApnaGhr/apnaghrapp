import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { paymentAPI } from '../utils/api';
import { CheckCircle, Loader, XCircle } from 'lucide-react';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('checking');
  const [transaction, setTransaction] = useState(null);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      pollPaymentStatus();
    }
  }, [sessionId]);

  const pollPaymentStatus = async (attempts = 0) => {
    const maxAttempts = 5;

    if (attempts >= maxAttempts) {
      setStatus('timeout');
      return;
    }

    try {
      const response = await paymentAPI.getPaymentStatus(sessionId);
      setTransaction(response.data);

      if (response.data.payment_status === 'paid') {
        setStatus('success');
      } else {
        setTimeout(() => pollPaymentStatus(attempts + 1), 2000);
      }
    } catch (error) {
      setTimeout(() => pollPaymentStatus(attempts + 1), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {status === 'checking' && (
          <div className="bg-white rounded-2xl border border-[#E5E3D8] p-8 text-center">
            <Loader className="w-16 h-16 text-[#E07A5F] mx-auto mb-4 animate-spin" />
            <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Outfit' }}>
              Processing Payment
            </h2>
            <p className="text-[#4A626C]">Please wait while we verify your payment...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="bg-white rounded-2xl border border-[#E5E3D8] p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Outfit' }}>
              Payment Successful!
            </h2>
            <p className="text-[#4A626C] mb-6">
              {transaction?.package_type === 'single_visit'
                ? 'You can now book your property visit'
                : transaction?.package_type === 'five_visits'
                ? 'Your 5-visit package is now active'
                : 'Property locked successfully'}
            </p>
            <button
              onClick={() => navigate('/customer')}
              className="btn-primary w-full"
              data-testid="continue-button"
            >
              Continue Browsing
            </button>
          </div>
        )}

        {status === 'timeout' && (
          <div className="bg-white rounded-2xl border border-[#E5E3D8] p-8 text-center">
            <XCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Outfit' }}>
              Payment Verification Timeout
            </h2>
            <p className="text-[#4A626C] mb-6">
              We're still processing your payment. Please check your bookings in a few minutes.
            </p>
            <button onClick={() => navigate('/customer')} className="btn-primary w-full">
              Go to Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;