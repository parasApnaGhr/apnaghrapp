// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { 
  ArrowLeft, CreditCard, Check, Clock, X, IndianRupee,
  Calendar, Receipt, ChevronRight
} from 'lucide-react';

const CustomerPayments = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      const response = await api.get('/customer/payments');
      setPayments(response.data || []);
    } catch (error) {
      console.error('Error loading payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
      case 'success':
        return <Check className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-amber-600" />;
      case 'failed':
        return <X className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
      case 'success':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'failed':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] pb-24">
      {/* Header */}
      <header className="glass-header sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/customer/profile')}
              className="p-2 hover:bg-[#F5F3F0] transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-[#1A1C20]" strokeWidth={1.5} />
            </button>
            <div>
              <h1 className="text-xl font-medium" style={{ fontFamily: 'Playfair Display, serif' }}>
                Payment History
              </h1>
              <p className="text-sm text-[#4A4D53]">{payments.length} transactions</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#04473C] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : payments.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 mx-auto mb-6 bg-[#F5F3F0] flex items-center justify-center">
              <Receipt className="w-10 h-10 text-[#D0C9C0]" strokeWidth={1} />
            </div>
            <h2 className="text-xl mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
              No payments yet
            </h2>
            <p className="text-[#4A4D53] mb-6">Your payment history will appear here</p>
            <button 
              onClick={() => navigate('/customer')} 
              className="btn-primary"
            >
              Browse Properties
            </button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {payments.map((payment, index) => (
              <motion.div
                key={payment.id || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white border border-[#E5E1DB] p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#04473C] flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-white" strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="font-medium text-[#1A1C20]">
                        {payment.payment_method === 'cashfree' ? 'Online Payment' : 
                         payment.payment_method === 'cash' ? 'Cash Payment' : 
                         payment.payment_method || 'Payment'}
                      </p>
                      <p className="text-xs text-[#4A4D53]">
                        {payment.payment_reference || payment.cf_order_id || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-medium text-[#04473C] flex items-center gap-1">
                      <IndianRupee className="w-4 h-4" />
                      {payment.amount || 0}
                    </p>
                    <span className={`text-xs px-2 py-0.5 border inline-flex items-center gap-1 ${getStatusColor(payment.status)}`}>
                      {getStatusIcon(payment.status)}
                      {payment.status || 'pending'}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm text-[#4A4D53] pt-3 border-t border-[#E5E1DB]">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatDate(payment.created_at)}
                  </span>
                  {payment.package_id && (
                    <span className="text-xs bg-[#F5F3F0] px-2 py-1">
                      Package: {payment.visits || 'N/A'} visits
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default CustomerPayments;
