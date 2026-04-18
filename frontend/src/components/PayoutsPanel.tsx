// @ts-nocheck
import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { 
  IndianRupee, User, Clock, CheckCircle, AlertCircle, 
  Calendar, TrendingUp, CreditCard, Download
} from 'lucide-react';
import { toast } from 'sonner';

const PayoutsPanel = () => {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingPayout, setProcessingPayout] = useState(false);

  useEffect(() => {
    loadWallets();
  }, []);

  const loadWallets = async () => {
    try {
      const response = await api.get('/admin/riders/wallets');
      setWallets(response.data);
    } catch (error) {
      toast.error('Failed to load wallets');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayouts = async () => {
    if (!window.confirm('Process bi-weekly payouts for all riders with approved earnings?')) {
      return;
    }
    
    setProcessingPayout(true);
    try {
      const response = await api.post('/admin/payouts/process');
      toast.success(`Processed ${response.data.payouts_processed} payouts!`);
      loadWallets();
    } catch (error) {
      toast.error('Failed to process payouts');
    } finally {
      setProcessingPayout(false);
    }
  };

  // Calculate totals
  const totalPending = wallets.reduce((sum, w) => sum + (w.pending_earnings || 0), 0);
  const totalApproved = wallets.reduce((sum, w) => sum + (w.approved_earnings || 0), 0);
  const totalPaid = wallets.reduce((sum, w) => sum + (w.paid_earnings || 0), 0);

  if (loading) {
    return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-[#E07A5F] border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit' }}>Rider Payouts</h2>
        <button
          onClick={handleProcessPayouts}
          disabled={processingPayout || totalApproved === 0}
          className="btn-primary flex items-center gap-2 disabled:opacity-50"
          data-testid="process-payouts-button"
        >
          {processingPayout ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <CreditCard className="w-4 h-4" />
          )}
          Process Bi-Weekly Payouts
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-amber-700">Pending Approval</p>
            <AlertCircle className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-700" style={{ fontFamily: 'Outfit' }}>
            ₹{totalPending.toLocaleString()}
          </p>
          <p className="text-xs text-amber-600 mt-1">Awaiting admin verification</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-blue-700">Ready for Payout</p>
            <CheckCircle className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-blue-700" style={{ fontFamily: 'Outfit' }}>
            ₹{totalApproved.toLocaleString()}
          </p>
          <p className="text-xs text-blue-600 mt-1">Approved, pending payout</p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-green-700">Total Paid</p>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-green-700" style={{ fontFamily: 'Outfit' }}>
            ₹{totalPaid.toLocaleString()}
          </p>
          <p className="text-xs text-green-600 mt-1">All time</p>
        </div>
      </div>

      {/* Next Payout Date */}
      <div className="bg-[#264653] text-white rounded-xl p-4 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="w-6 h-6" />
          <div>
            <p className="text-sm opacity-80">Next Bi-Weekly Payout</p>
            <p className="font-bold">{wallets[0]?.next_payout_date || 'N/A'}</p>
          </div>
        </div>
        <p className="text-sm opacity-80">1st & 15th of each month</p>
      </div>

      {/* Rider Wallets Table */}
      <div className="bg-white rounded-xl border border-[#E5E3D8] overflow-hidden">
        <div className="p-4 border-b border-[#E5E3D8]">
          <h3 className="font-bold">Rider Wallets</h3>
        </div>
        
        {wallets.length === 0 ? (
          <div className="p-8 text-center text-[#4A626C]">
            No rider wallets found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F3F2EB]">
                <tr>
                  <th className="text-left p-3 text-sm font-medium text-[#4A626C]">Rider</th>
                  <th className="text-right p-3 text-sm font-medium text-[#4A626C]">Total Earned</th>
                  <th className="text-right p-3 text-sm font-medium text-[#4A626C]">Pending</th>
                  <th className="text-right p-3 text-sm font-medium text-[#4A626C]">Approved</th>
                  <th className="text-right p-3 text-sm font-medium text-[#4A626C]">Paid Out</th>
                  <th className="text-right p-3 text-sm font-medium text-[#4A626C]">Last Payout</th>
                </tr>
              </thead>
              <tbody>
                {wallets.map(wallet => (
                  <tr key={wallet.rider_id} className="border-b border-[#E5E3D8] hover:bg-[#F3F2EB]/50">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#E07A5F] text-white rounded-full flex items-center justify-center font-bold text-sm">
                          {wallet.rider?.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-medium">{wallet.rider?.name || 'Unknown'}</p>
                          <p className="text-xs text-[#4A626C]">{wallet.rider?.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-right font-medium">
                      ₹{(wallet.total_earnings || 0).toLocaleString()}
                    </td>
                    <td className="p-3 text-right">
                      {wallet.pending_earnings > 0 ? (
                        <span className="text-amber-600 font-medium">₹{wallet.pending_earnings.toLocaleString()}</span>
                      ) : (
                        <span className="text-[#4A626C]">₹0</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      {wallet.approved_earnings > 0 ? (
                        <span className="text-blue-600 font-medium">₹{wallet.approved_earnings.toLocaleString()}</span>
                      ) : (
                        <span className="text-[#4A626C]">₹0</span>
                      )}
                    </td>
                    <td className="p-3 text-right text-green-600 font-medium">
                      ₹{(wallet.paid_earnings || 0).toLocaleString()}
                    </td>
                    <td className="p-3 text-right text-sm text-[#4A626C]">
                      {wallet.last_payout_date ? new Date(wallet.last_payout_date).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PayoutsPanel;
