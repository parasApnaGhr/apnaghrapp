// @ts-nocheck
import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { motion } from 'framer-motion';
import { 
  Gift, Users, Bike, Store, Percent, IndianRupee, Calendar,
  Check, AlertCircle, Plus, Trash2, Edit2, Save, X
} from 'lucide-react';
import { toast } from 'sonner';

const PromotionsPanel = () => {
  const [promotions, setPromotions] = useState({
    // Rider Offers
    rider_per_visit_bonus: 0,
    rider_bonus_after_visits: 10,
    rider_bonus_amount: 500,
    rider_referral_bonus: 200,
    rider_promotion_message: '',
    rider_promotion_active: false,
    
    // Seller Offers
    seller_commission_percent: 5,
    seller_bonus_on_first_deal: 1000,
    seller_referral_bonus: 300,
    seller_promotion_message: '',
    seller_promotion_active: false,
    
    // Customer Offers
    customer_first_visit_discount: 0,
    customer_referral_credit: 100,
    customer_loyalty_discount: 0,
    customer_promotion_message: '',
    customer_promotion_active: false,
  });
  
  const [customOffers, setCustomOffers] = useState([]);
  const [newOffer, setNewOffer] = useState({
    target: 'customer',
    title: '',
    description: '',
    discount_type: 'percent',
    discount_value: 0,
    min_order: 0,
    valid_until: '',
    code: '',
    active: true
  });
  const [showAddOffer, setShowAddOffer] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPromotions();
  }, []);

  const loadPromotions = async () => {
    try {
      const response = await api.get('/admin/promotions');
      if (response.data) {
        setPromotions(prev => ({ ...prev, ...response.data.settings }));
        setCustomOffers(response.data.custom_offers || []);
      }
    } catch (error) {
      console.log('Using default promotions');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePromotions = async () => {
    setSaving(true);
    try {
      await api.post('/admin/promotions', {
        settings: promotions,
        custom_offers: customOffers
      });
      toast.success('Promotions saved successfully!');
    } catch (error) {
      toast.error('Failed to save promotions');
    } finally {
      setSaving(false);
    }
  };

  const handleAddCustomOffer = () => {
    if (!newOffer.title || !newOffer.code) {
      toast.error('Please fill in offer title and code');
      return;
    }
    
    const offer = {
      ...newOffer,
      id: `offer_${Date.now()}`,
      created_at: new Date().toISOString()
    };
    
    setCustomOffers([...customOffers, offer]);
    setNewOffer({
      target: 'customer',
      title: '',
      description: '',
      discount_type: 'percent',
      discount_value: 0,
      min_order: 0,
      valid_until: '',
      code: '',
      active: true
    });
    setShowAddOffer(false);
    toast.success('Offer added! Remember to save changes.');
  };

  const handleDeleteOffer = (offerId) => {
    setCustomOffers(customOffers.filter(o => o.id !== offerId));
    toast.success('Offer removed! Remember to save changes.');
  };

  const toggleOfferStatus = (offerId) => {
    setCustomOffers(customOffers.map(o => 
      o.id === offerId ? { ...o, active: !o.active } : o
    ));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border border-[var(--stitch-line)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold" >
          Promotions & Offers Management
        </h2>
        <motion.button
          onClick={handleSavePromotions}
          disabled={saving}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="stitch-button flex items-center gap-2"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save All Changes
        </motion.button>
      </div>

      {/* Rider Promotions */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-[var(--stitch-line)] p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-[var(--stitch-ink)] flex items-center justify-center">
            <Bike className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg">Rider Incentives</h3>
            <p className="text-sm text-[var(--stitch-muted)]">Set bonuses and commissions for field riders</p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <div className={`w-12 h-7 rounded-full transition-colors relative ${
              promotions.rider_promotion_active ? 'bg-[var(--stitch-ink)]' : 'bg-[var(--stitch-line)]'
            }`}>
              <input
                type="checkbox"
                checked={promotions.rider_promotion_active}
                onChange={(e) => setPromotions({ ...promotions, rider_promotion_active: e.target.checked })}
                className="sr-only"
              />
              <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                promotions.rider_promotion_active ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </div>
            <span className="text-sm font-medium">{promotions.rider_promotion_active ? 'Active' : 'Inactive'}</span>
          </label>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Extra Bonus Per Visit (₹)</label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--stitch-muted)]" />
              <input
                type="number"
                min="0"
                value={promotions.rider_per_visit_bonus}
                onChange={(e) => setPromotions({ ...promotions, rider_per_visit_bonus: parseInt(e.target.value) || 0 })}
                className="stitch-input pl-9"
                placeholder="0"
              />
            </div>
            <p className="text-xs text-[var(--stitch-muted)] mt-1">Added to base ₹150/visit</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Bonus After X Visits</label>
            <input
              type="number"
              min="1"
              value={promotions.rider_bonus_after_visits}
              onChange={(e) => setPromotions({ ...promotions, rider_bonus_after_visits: parseInt(e.target.value) || 10 })}
              className="stitch-input"
              placeholder="10"
            />
            <p className="text-xs text-[var(--stitch-muted)] mt-1">Milestone visits count</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Milestone Bonus (₹)</label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--stitch-muted)]" />
              <input
                type="number"
                min="0"
                value={promotions.rider_bonus_amount}
                onChange={(e) => setPromotions({ ...promotions, rider_bonus_amount: parseInt(e.target.value) || 0 })}
                className="stitch-input pl-9"
                placeholder="500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Referral Bonus (₹)</label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--stitch-muted)]" />
              <input
                type="number"
                min="0"
                value={promotions.rider_referral_bonus}
                onChange={(e) => setPromotions({ ...promotions, rider_referral_bonus: parseInt(e.target.value) || 0 })}
                className="stitch-input pl-9"
                placeholder="200"
              />
            </div>
            <p className="text-xs text-[var(--stitch-muted)] mt-1">Per referred rider</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Promotion Message (shown in Rider Dashboard)</label>
          <input
            type="text"
            value={promotions.rider_promotion_message}
            onChange={(e) => setPromotions({ ...promotions, rider_promotion_message: e.target.value })}
            className="stitch-input"
            placeholder="e.g., Complete 20 visits this week and earn ₹1000 bonus!"
          />
        </div>
      </motion.div>

      {/* Seller Promotions */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white border border-[var(--stitch-line)] p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-[var(--stitch-muted)] flex items-center justify-center">
            <Store className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg">Seller (Calling Agent) Incentives</h3>
            <p className="text-sm text-[var(--stitch-muted)]">Set commissions and bonuses for sellers</p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <div className={`w-12 h-7 rounded-full transition-colors relative ${
              promotions.seller_promotion_active ? 'bg-[var(--stitch-muted)]' : 'bg-[var(--stitch-line)]'
            }`}>
              <input
                type="checkbox"
                checked={promotions.seller_promotion_active}
                onChange={(e) => setPromotions({ ...promotions, seller_promotion_active: e.target.checked })}
                className="sr-only"
              />
              <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                promotions.seller_promotion_active ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </div>
            <span className="text-sm font-medium">{promotions.seller_promotion_active ? 'Active' : 'Inactive'}</span>
          </label>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Commission Rate (%)</label>
            <div className="relative">
              <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--stitch-muted)]" />
              <input
                type="number"
                min="0"
                max="50"
                value={promotions.seller_commission_percent}
                onChange={(e) => setPromotions({ ...promotions, seller_commission_percent: parseInt(e.target.value) || 0 })}
                className="stitch-input pl-9"
                placeholder="5"
              />
            </div>
            <p className="text-xs text-[var(--stitch-muted)] mt-1">% of deal brokerage</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">First Deal Bonus (₹)</label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--stitch-muted)]" />
              <input
                type="number"
                min="0"
                value={promotions.seller_bonus_on_first_deal}
                onChange={(e) => setPromotions({ ...promotions, seller_bonus_on_first_deal: parseInt(e.target.value) || 0 })}
                className="stitch-input pl-9"
                placeholder="1000"
              />
            </div>
            <p className="text-xs text-[var(--stitch-muted)] mt-1">One-time bonus</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Referral Bonus (₹)</label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--stitch-muted)]" />
              <input
                type="number"
                min="0"
                value={promotions.seller_referral_bonus}
                onChange={(e) => setPromotions({ ...promotions, seller_referral_bonus: parseInt(e.target.value) || 0 })}
                className="stitch-input pl-9"
                placeholder="300"
              />
            </div>
            <p className="text-xs text-[var(--stitch-muted)] mt-1">Per referred seller</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Promotion Message (shown in Seller Dashboard)</label>
          <input
            type="text"
            value={promotions.seller_promotion_message}
            onChange={(e) => setPromotions({ ...promotions, seller_promotion_message: e.target.value })}
            className="stitch-input"
            placeholder="e.g., Close 5 deals this month and get 2% extra commission!"
          />
        </div>
      </motion.div>

      {/* Customer Promotions */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white border border-[var(--stitch-line)] p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-[var(--stitch-ink)] flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg">Customer Offers</h3>
            <p className="text-sm text-[var(--stitch-muted)]">Set discounts and credits for customers</p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <div className={`w-12 h-7 rounded-full transition-colors relative ${
              promotions.customer_promotion_active ? 'bg-[var(--stitch-ink)]' : 'bg-[var(--stitch-line)]'
            }`}>
              <input
                type="checkbox"
                checked={promotions.customer_promotion_active}
                onChange={(e) => setPromotions({ ...promotions, customer_promotion_active: e.target.checked })}
                className="sr-only"
              />
              <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                promotions.customer_promotion_active ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </div>
            <span className="text-sm font-medium">{promotions.customer_promotion_active ? 'Active' : 'Inactive'}</span>
          </label>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">First Visit Discount (%)</label>
            <div className="relative">
              <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--stitch-muted)]" />
              <input
                type="number"
                min="0"
                max="50"
                value={promotions.customer_first_visit_discount}
                onChange={(e) => setPromotions({ ...promotions, customer_first_visit_discount: parseInt(e.target.value) || 0 })}
                className="stitch-input pl-9"
                placeholder="10"
              />
            </div>
            <p className="text-xs text-[var(--stitch-muted)] mt-1">New customer discount</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Referral Credit (₹)</label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--stitch-muted)]" />
              <input
                type="number"
                min="0"
                value={promotions.customer_referral_credit}
                onChange={(e) => setPromotions({ ...promotions, customer_referral_credit: parseInt(e.target.value) || 0 })}
                className="stitch-input pl-9"
                placeholder="100"
              />
            </div>
            <p className="text-xs text-[var(--stitch-muted)] mt-1">Per referred customer</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Loyalty Discount (%)</label>
            <div className="relative">
              <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--stitch-muted)]" />
              <input
                type="number"
                min="0"
                max="30"
                value={promotions.customer_loyalty_discount}
                onChange={(e) => setPromotions({ ...promotions, customer_loyalty_discount: parseInt(e.target.value) || 0 })}
                className="stitch-input pl-9"
                placeholder="5"
              />
            </div>
            <p className="text-xs text-[var(--stitch-muted)] mt-1">After 3+ bookings</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Promotion Message (shown in Customer App)</label>
          <input
            type="text"
            value={promotions.customer_promotion_message}
            onChange={(e) => setPromotions({ ...promotions, customer_promotion_message: e.target.value })}
            className="stitch-input"
            placeholder="e.g., Refer a friend and get ₹100 credit on your next booking!"
          />
        </div>
      </motion.div>

      {/* Custom Promo Codes */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white border border-[var(--stitch-line)] p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[var(--stitch-ink)] to-[var(--stitch-muted)] flex items-center justify-center">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Custom Promo Codes</h3>
              <p className="text-sm text-[var(--stitch-muted)]">Create special offer codes for campaigns</p>
            </div>
          </div>
          <motion.button
            onClick={() => setShowAddOffer(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="stitch-button stitch-button-secondary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Code
          </motion.button>
        </div>

        {/* Add New Offer Form */}
        {showAddOffer && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-[var(--stitch-soft)] p-4 mb-4 border border-[var(--stitch-line)]"
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium">New Promo Code</h4>
              <button onClick={() => setShowAddOffer(false)} className="p-1 hover:bg-[var(--stitch-line)] rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Target Audience</label>
                <select
                  value={newOffer.target}
                  onChange={(e) => setNewOffer({ ...newOffer, target: e.target.value })}
                  className="stitch-input"
                >
                  <option value="customer">Customers</option>
                  <option value="rider">Riders</option>
                  <option value="seller">Sellers</option>
                  <option value="all">Everyone</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Promo Code</label>
                <input
                  type="text"
                  value={newOffer.code}
                  onChange={(e) => setNewOffer({ ...newOffer, code: e.target.value.toUpperCase() })}
                  className="stitch-input uppercase"
                  placeholder="HOLI2026"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Discount Type</label>
                <select
                  value={newOffer.discount_type}
                  onChange={(e) => setNewOffer({ ...newOffer, discount_type: e.target.value })}
                  className="stitch-input"
                >
                  <option value="percent">Percentage (%)</option>
                  <option value="flat">Flat Amount (₹)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Discount Value</label>
                <input
                  type="number"
                  min="0"
                  value={newOffer.discount_value}
                  onChange={(e) => setNewOffer({ ...newOffer, discount_value: parseInt(e.target.value) || 0 })}
                  className="stitch-input"
                  placeholder="10"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Offer Title</label>
                <input
                  type="text"
                  value={newOffer.title}
                  onChange={(e) => setNewOffer({ ...newOffer, title: e.target.value })}
                  className="stitch-input"
                  placeholder="Holi Special Discount"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Valid Until</label>
                <input
                  type="date"
                  value={newOffer.valid_until}
                  onChange={(e) => setNewOffer({ ...newOffer, valid_until: e.target.value })}
                  className="stitch-input"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Description (optional)</label>
              <input
                type="text"
                value={newOffer.description}
                onChange={(e) => setNewOffer({ ...newOffer, description: e.target.value })}
                className="stitch-input"
                placeholder="Get 10% off on your first visit booking!"
              />
            </div>

            <motion.button
              onClick={handleAddCustomOffer}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="stitch-button flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Promo Code
            </motion.button>
          </motion.div>
        )}

        {/* Existing Codes List */}
        {customOffers.length > 0 ? (
          <div className="space-y-3">
            {customOffers.map((offer) => (
              <div 
                key={offer.id} 
                className={`flex items-center justify-between p-4 border ${
                  offer.active ? 'border-[var(--stitch-ink)] bg-[var(--stitch-soft)]' : 'border-[var(--stitch-line)] bg-[var(--stitch-soft)]'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`px-3 py-1 font-mono font-bold text-sm ${
                    offer.active ? 'bg-[var(--stitch-ink)] text-white' : 'bg-[var(--stitch-line)] text-[var(--stitch-muted)]'
                  }`}>
                    {offer.code}
                  </div>
                  <div>
                    <p className="font-medium">{offer.title}</p>
                    <p className="text-sm text-[var(--stitch-muted)]">
                      {offer.discount_type === 'percent' ? `${offer.discount_value}% off` : `₹${offer.discount_value} off`}
                      {' • '}
                      {offer.target === 'all' ? 'Everyone' : `${offer.target.charAt(0).toUpperCase() + offer.target.slice(1)}s`}
                      {offer.valid_until && ` • Until ${new Date(offer.valid_until).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleOfferStatus(offer.id)}
                    className={`px-3 py-1 text-sm font-medium transition-colors ${
                      offer.active 
                        ? 'bg-[var(--stitch-ink)] text-white hover:bg-[#033430]' 
                        : 'bg-[var(--stitch-line)] text-[var(--stitch-muted)] hover:bg-[var(--stitch-muted)]'
                    }`}
                  >
                    {offer.active ? 'Active' : 'Inactive'}
                  </button>
                  <button
                    onClick={() => handleDeleteOffer(offer.id)}
                    className="p-2 text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-[var(--stitch-muted)]">
            <Gift className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>No custom promo codes yet</p>
            <p className="text-sm">Create your first promo code above</p>
          </div>
        )}
      </motion.div>

      {/* Info Box */}
      <div className="bg-[var(--stitch-soft)] border border-[var(--stitch-ink)]/20 p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-[var(--stitch-ink)] flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-[var(--stitch-ink)]">How Promotions Work:</p>
          <ul className="text-[var(--stitch-muted)] mt-1 space-y-1">
            <li>• <strong>Rider Incentives:</strong> Displayed in Rider Dashboard earnings section</li>
            <li>• <strong>Seller Incentives:</strong> Applied to commission calculations and shown in Seller Dashboard</li>
            <li>• <strong>Customer Offers:</strong> Applied at checkout when promo codes are entered</li>
            <li>• <strong>Custom Codes:</strong> Can be shared via marketing campaigns for targeted discounts</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PromotionsPanel;
