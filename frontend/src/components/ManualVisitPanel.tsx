// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, User, Phone, MapPin, Home, Calendar, Clock,
  IndianRupee, Check, X, Bike, AlertCircle, QrCode, CreditCard
} from 'lucide-react';
import { toast } from 'sonner';

const ManualVisitPanel = () => {
  const [properties, setProperties] = useState([]);
  const [riders, setRiders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchCustomer, setSearchCustomer] = useState('');
  const [searchProperty, setSearchProperty] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [recentVisits, setRecentVisits] = useState([]);
  
  const [formData, setFormData] = useState({
    customer_phone: '',
    customer_name: '',
    customer_id: '',
    property_ids: [],
    preferred_date: '',
    preferred_time: '10:00',
    payment_method: 'qr_code',
    payment_amount: '',
    payment_reference: '',
    assigned_rider_id: '',
    notes: '',
    pickup_location: '',
    pickup_lat: null,
    pickup_lng: null
  });

  const loadRecentManualVisits = useCallback(async () => {
    try {
      const response = await api.get('/admin/manual-visits');
      setRecentVisits(response.data || []);
    } catch (error) {
      console.log('No manual visits endpoint yet');
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [propRes, riderRes] = await Promise.all([
        api.get('/properties'),
        api.get('/admin/riders')
      ]);
      setProperties(propRes.data || []);
      setRiders((riderRes.data || []).filter(r => r.is_active));
      loadRecentManualVisits();
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }, [loadRecentManualVisits]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const searchCustomerByPhone = async (phone) => {
    if (phone.length < 5) return;
    try {
      const response = await api.get(`/admin/search-customer?phone=${phone}`);
      if (response.data) {
        setCustomers(Array.isArray(response.data) ? response.data : [response.data]);
      }
    } catch (error) {
      setCustomers([]);
    }
  };

  const selectCustomer = (customer) => {
    setFormData({
      ...formData,
      customer_id: customer.id,
      customer_phone: customer.phone,
      customer_name: customer.name
    });
    setCustomers([]);
    setSearchCustomer('');
  };

  const togglePropertySelection = (propertyId) => {
    const current = formData.property_ids;
    if (current.includes(propertyId)) {
      setFormData({ ...formData, property_ids: current.filter(id => id !== propertyId) });
    } else if (current.length < 5) {
      setFormData({ ...formData, property_ids: [...current, propertyId] });
    } else {
      toast.error('Maximum 5 properties per visit');
    }
  };

  const calculateAmount = () => {
    const count = formData.property_ids.length;
    if (count === 0) return 0;
    // Pricing: 1 property = 199, 2 = 349, 3 = 499, 4 = 599, 5 = 699
    const prices = { 1: 199, 2: 349, 3: 499, 4: 599, 5: 699 };
    return prices[count] || 699;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.customer_phone || !formData.customer_name) {
      toast.error('Please enter customer details');
      return;
    }
    
    if (formData.property_ids.length === 0) {
      toast.error('Please select at least one property');
      return;
    }
    
    if (!formData.preferred_date) {
      toast.error('Please select a visit date');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        payment_amount: formData.payment_amount || calculateAmount(),
        property_count: formData.property_ids.length
      };
      
      const response = await api.post('/admin/create-manual-visit', payload);
      
      toast.success('Visit created successfully! Customer can now track their visit.');
      setShowCreateForm(false);
      setFormData({
        customer_phone: '',
        customer_name: '',
        customer_id: '',
        property_ids: [],
        preferred_date: '',
        preferred_time: '10:00',
        payment_method: 'qr_code',
        payment_amount: '',
        payment_reference: '',
        assigned_rider_id: '',
        notes: ''
      });
      loadRecentManualVisits();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create visit');
    } finally {
      setLoading(false);
    }
  };

  const filteredProperties = properties.filter(p => 
    p.title?.toLowerCase().includes(searchProperty.toLowerCase()) ||
    p.area_name?.toLowerCase().includes(searchProperty.toLowerCase()) ||
    p.city?.toLowerCase().includes(searchProperty.toLowerCase())
  );

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" >
            Manual Visit Creation
          </h2>
          <p className="text-sm text-[var(--stitch-muted)]">Create visits for customers who paid via QR code or cash</p>
        </div>
        <motion.button
          onClick={() => setShowCreateForm(true)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="stitch-button flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create New Visit
        </motion.button>
      </div>

      {/* Info Banner */}
      <div className="bg-[var(--stitch-soft)] border border-[var(--stitch-ink)]/20 p-4 flex items-start gap-3">
        <QrCode className="w-6 h-6 text-[var(--stitch-ink)] flex-shrink-0" />
        <div className="text-sm">
          <p className="font-medium text-[var(--stitch-ink)]">QR Code / Offline Payment Flow:</p>
          <ol className="text-[var(--stitch-muted)] mt-1 list-decimal list-inside space-y-1">
            <li>Customer pays via QR code or cash and shares payment screenshot</li>
            <li>Admin creates visit here with customer details and selected properties</li>
            <li>Customer receives SMS/notification and can track rider in their app</li>
            <li>Rider gets assigned and completes visits as usual</li>
          </ol>
        </div>
      </div>

      {/* Create Visit Modal */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={(e) => e.target === e.currentTarget && setShowCreateForm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-white border-b border-[var(--stitch-line)] p-6 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold" >
                    Create Manual Visit
                  </h3>
                  <p className="text-sm text-[var(--stitch-muted)]">For QR code or cash payments</p>
                </div>
                <button onClick={() => setShowCreateForm(false)} className="p-2 hover:bg-[var(--stitch-soft)]">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Customer Details */}
                <div className="bg-[var(--stitch-soft)] p-4 space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <User className="w-4 h-4 text-[var(--stitch-ink)]" />
                    Customer Details
                  </h4>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="relative">
                      <label className="block text-sm font-medium mb-1">Phone Number *</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--stitch-muted)]" />
                        <input
                          type="tel"
                          value={formData.customer_phone}
                          onChange={(e) => {
                            const phone = e.target.value.replace(/\D/g, '').slice(0, 10);
                            setFormData({ ...formData, customer_phone: phone });
                            if (phone.length >= 5) searchCustomerByPhone(phone);
                          }}
                          className="stitch-input pl-10"
                          placeholder="10 digit mobile number"
                          required
                        />
                      </div>
                      
                      {/* Customer Search Results */}
                      {customers.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-[var(--stitch-line)] shadow-lg max-h-40 overflow-y-auto">
                          {customers.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => selectCustomer(c)}
                              className="w-full p-3 text-left hover:bg-[var(--stitch-soft)] flex items-center gap-3"
                            >
                              <div className="w-8 h-8 bg-[var(--stitch-ink)] text-white flex items-center justify-center text-sm font-medium">
                                {c.name?.[0] || '?'}
                              </div>
                              <div>
                                <p className="font-medium text-sm">{c.name}</p>
                                <p className="text-xs text-[var(--stitch-muted)]">{c.phone}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Customer Name *</label>
                      <input
                        type="text"
                        value={formData.customer_name}
                        onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                        className="stitch-input"
                        placeholder="Full name"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Pickup Location */}
                <div className="bg-[var(--stitch-soft)] p-4 space-y-4 border border-[var(--stitch-ink)]/20">
                  <h4 className="font-medium flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[var(--stitch-ink)]" />
                    Pickup Location (for GPS Navigation)
                  </h4>
                  <div>
                    <input
                      type="text"
                      value={formData.pickup_location}
                      onChange={(e) => setFormData({ ...formData, pickup_location: e.target.value })}
                      className="stitch-input"
                      placeholder="Enter customer pickup address (e.g., Sector 17, Chandigarh)"
                    />
                    <p className="text-xs text-[var(--stitch-muted)] mt-1">
                      If left empty, rider will navigate to the first property address
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(
                          (position) => {
                            setFormData({
                              ...formData,
                              pickup_lat: position.coords.latitude,
                              pickup_lng: position.coords.longitude,
                              pickup_location: formData.pickup_location || 'Current Location (GPS)'
                            });
                            toast.success('GPS location captured!');
                          },
                          (error) => toast.error('Could not get location: ' + error.message)
                        );
                      }
                    }}
                    className="text-sm text-[var(--stitch-ink)] hover:underline flex items-center gap-1"
                  >
                    <MapPin className="w-3 h-3" /> Use Current Location
                  </button>
                </div>

                {/* Property Selection */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium flex items-center gap-2">
                      <Home className="w-4 h-4 text-[var(--stitch-ink)]" />
                      Select Properties ({formData.property_ids.length}/5)
                    </h4>
                    <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--stitch-muted)]" />
                      <input
                        type="text"
                        value={searchProperty}
                        onChange={(e) => setSearchProperty(e.target.value)}
                        className="stitch-input pl-10 py-2 text-sm"
                        placeholder="Search properties..."
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-60 overflow-y-auto p-1">
                    {filteredProperties.slice(0, 20).map((property) => {
                      const isSelected = formData.property_ids.includes(property.id);
                      return (
                        <motion.button
                          key={property.id}
                          type="button"
                          onClick={() => togglePropertySelection(property.id)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`p-3 text-left border transition-all ${
                            isSelected 
                              ? 'border-[var(--stitch-ink)] bg-[var(--stitch-soft)]' 
                              : 'border-[var(--stitch-line)] hover:border-[var(--stitch-ink)]/50'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{property.title}</p>
                              <p className="text-xs text-[var(--stitch-muted)] truncate">{property.area_name}, {property.city}</p>
                              <p className="text-xs font-medium text-[var(--stitch-ink)]">₹{property.rent?.toLocaleString()}/mo</p>
                            </div>
                            {isSelected && (
                              <Check className="w-5 h-5 text-[var(--stitch-ink)] flex-shrink-0" />
                            )}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                  
                  {formData.property_ids.length > 0 && (
                    <div className="bg-[var(--stitch-ink)] text-white p-3 flex items-center justify-between">
                      <span>{formData.property_ids.length} properties selected</span>
                      <span className="font-bold">Amount: ₹{calculateAmount()}</span>
                    </div>
                  )}
                </div>

                {/* Schedule & Payment */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Schedule */}
                  <div className="bg-[var(--stitch-soft)] p-4 space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[var(--stitch-ink)]" />
                      Visit Schedule
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Date *</label>
                        <input
                          type="date"
                          value={formData.preferred_date}
                          onChange={(e) => setFormData({ ...formData, preferred_date: e.target.value })}
                          min={getMinDate()}
                          className="stitch-input"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Time Slot *</label>
                        <select
                          value={formData.preferred_time}
                          onChange={(e) => setFormData({ ...formData, preferred_time: e.target.value })}
                          className="stitch-input"
                        >
                          <option value="09:00">9:00 AM - 11:00 AM</option>
                          <option value="11:00">11:00 AM - 1:00 PM</option>
                          <option value="14:00">2:00 PM - 4:00 PM</option>
                          <option value="16:00">4:00 PM - 6:00 PM</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Payment */}
                  <div className="bg-[var(--stitch-soft)] p-4 space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-[var(--stitch-ink)]" />
                      Payment Details
                    </h4>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Payment Method</label>
                        <select
                          value={formData.payment_method}
                          onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                          className="stitch-input"
                        >
                          <option value="qr_code">QR Code Payment</option>
                          <option value="cash">Cash</option>
                          <option value="bank_transfer">Bank Transfer</option>
                          <option value="upi">UPI Direct</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Amount Received (₹)</label>
                        <div className="relative">
                          <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--stitch-muted)]" />
                          <input
                            type="number"
                            value={formData.payment_amount || calculateAmount()}
                            onChange={(e) => setFormData({ ...formData, payment_amount: e.target.value })}
                            className="stitch-input pl-10"
                            placeholder={calculateAmount().toString()}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Reference/Transaction ID</label>
                        <input
                          type="text"
                          value={formData.payment_reference}
                          onChange={(e) => setFormData({ ...formData, payment_reference: e.target.value })}
                          className="stitch-input"
                          placeholder="UPI ref or receipt number"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rider Assignment (Optional) */}
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Bike className="w-4 h-4 text-[var(--stitch-ink)]" />
                    Assign Rider (Optional)
                  </h4>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, assigned_rider_id: '' })}
                      className={`p-3 border text-center transition-all ${
                        !formData.assigned_rider_id 
                          ? 'border-[var(--stitch-ink)] bg-[var(--stitch-soft)]' 
                          : 'border-[var(--stitch-line)] hover:border-[var(--stitch-ink)]/50'
                      }`}
                    >
                      <p className="font-medium text-sm">Auto Assign</p>
                      <p className="text-xs text-[var(--stitch-muted)]">System will assign</p>
                    </button>
                    
                    {riders.slice(0, 7).map((rider) => (
                      <button
                        key={rider.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, assigned_rider_id: rider.id })}
                        className={`p-3 border text-left transition-all ${
                          formData.assigned_rider_id === rider.id 
                            ? 'border-[var(--stitch-ink)] bg-[var(--stitch-soft)]' 
                            : 'border-[var(--stitch-line)] hover:border-[var(--stitch-ink)]/50'
                        }`}
                      >
                        <p className="font-medium text-sm truncate">{rider.name}</p>
                        <p className="text-xs text-[var(--stitch-muted)]">{rider.phone}</p>
                        <p className="text-xs text-green-600">● Online</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium mb-1">Admin Notes (Optional)</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="stitch-input"
                    rows={2}
                    placeholder="Any special instructions or notes..."
                  />
                </div>

                {/* Submit */}
                <div className="flex items-center justify-between pt-4 border-t border-[var(--stitch-line)]">
                  <div className="text-sm text-[var(--stitch-muted)]">
                    <AlertCircle className="w-4 h-4 inline mr-1" />
                    Customer will receive SMS notification after creation
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="stitch-button stitch-button-secondary"
                    >
                      Cancel
                    </button>
                    <motion.button
                      type="submit"
                      disabled={loading}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="stitch-button flex items-center gap-2"
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      Create Visit
                    </motion.button>
                  </div>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recent Manual Visits */}
      <div className="bg-white border border-[var(--stitch-line)]">
        <div className="p-4 border-b border-[var(--stitch-line)]">
          <h3 className="font-medium">Recent Manual Visits</h3>
        </div>
        
        {recentVisits.length > 0 ? (
          <div className="divide-y divide-[var(--stitch-line)]">
            {recentVisits.map((visit) => (
              <div key={visit.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[var(--stitch-ink)] text-white flex items-center justify-center font-medium">
                    {visit.customer_name?.[0] || '?'}
                  </div>
                  <div>
                    <p className="font-medium">{visit.customer_name}</p>
                    <p className="text-sm text-[var(--stitch-muted)]">
                      {visit.property_count} properties • {visit.preferred_date}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-[var(--stitch-ink)]">₹{visit.payment_amount}</p>
                  <p className={`text-xs ${
                    visit.status === 'completed' ? 'text-green-600' :
                    visit.status === 'assigned' ? 'text-blue-600' : 'text-orange-600'
                  }`}>
                    {visit.status?.toUpperCase()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-[var(--stitch-muted)]">
            <QrCode className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>No manual visits created yet</p>
            <p className="text-sm">Create visits for QR code payments here</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManualVisitPanel;
