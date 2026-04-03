import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import api from '../utils/api';
import {
  Building2, Plus, Eye, MousePointer, Users, Calendar, TrendingUp,
  MapPin, Phone, Mail, Image, FileText, Calculator, ChevronRight,
  ChevronDown, Edit2, Trash2, Clock, CheckCircle, XCircle, 
  IndianRupee, Filter, Search, BarChart3, Target, Briefcase,
  Home, LogOut, Settings, Star, Upload, X, Save
} from 'lucide-react';

// EMI Calculator Component
const EMICalculator = ({ minPrice, maxPrice }) => {
  const [principal, setPrincipal] = useState(minPrice || 5000000);
  const [rate, setRate] = useState(8.5);
  const [tenure, setTenure] = useState(20);
  
  const calculateEMI = () => {
    const monthlyRate = rate / 12 / 100;
    const months = tenure * 12;
    const emi = principal * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1);
    return Math.round(emi);
  };
  
  const emi = calculateEMI();
  const totalAmount = emi * tenure * 12;
  const totalInterest = totalAmount - principal;
  
  return (
    <div className="bg-gradient-to-br from-[#04473C] to-[#065f4e] text-white p-6 rounded-xl">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Calculator className="w-5 h-5" />
        EMI Calculator
      </h3>
      
      <div className="space-y-4">
        <div>
          <label className="text-sm text-white/70">Loan Amount</label>
          <input
            type="range"
            min={minPrice || 1000000}
            max={maxPrice || 50000000}
            step={100000}
            value={principal}
            onChange={(e) => setPrincipal(Number(e.target.value))}
            className="w-full mt-1"
          />
          <div className="text-xl font-bold">₹{(principal/100000).toFixed(1)} Lakh</div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-white/70">Interest Rate (%)</label>
            <input
              type="number"
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              className="w-full mt-1 px-3 py-2 bg-white/20 rounded-lg text-white"
              step="0.1"
            />
          </div>
          <div>
            <label className="text-sm text-white/70">Tenure (Years)</label>
            <input
              type="number"
              value={tenure}
              onChange={(e) => setTenure(Number(e.target.value))}
              className="w-full mt-1 px-3 py-2 bg-white/20 rounded-lg text-white"
            />
          </div>
        </div>
        
        <div className="border-t border-white/20 pt-4 mt-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-[#C6A87C]">₹{emi.toLocaleString()}</div>
              <div className="text-xs text-white/70">Monthly EMI</div>
            </div>
            <div>
              <div className="text-lg font-bold">₹{(totalInterest/100000).toFixed(1)}L</div>
              <div className="text-xs text-white/70">Total Interest</div>
            </div>
            <div>
              <div className="text-lg font-bold">₹{(totalAmount/100000).toFixed(1)}L</div>
              <div className="text-xs text-white/70">Total Amount</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Project Card Component
const ProjectCard = ({ project, onEdit, onViewLeads }) => {
  const [expanded, setExpanded] = useState(false);
  
  const getPhaseColor = (phase) => {
    switch (phase) {
      case 'pre_pre_launch': return 'bg-purple-100 text-purple-700';
      case 'pre_launch': return 'bg-blue-100 text-blue-700';
      case 'launched': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };
  
  const getPhaseLabel = (phase) => {
    switch (phase) {
      case 'pre_pre_launch': return 'Pre-Pre Launch';
      case 'pre_launch': return 'Pre-Launch';
      case 'launched': return 'Launched';
      default: return phase;
    }
  };
  
  return (
    <motion.div
      layout
      className="bg-white border border-[#E5E1DB] rounded-xl overflow-hidden"
    >
      {/* Project Header */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex gap-4">
            {project.images?.[0] ? (
              <img src={project.images[0]} alt={project.project_name} className="w-24 h-24 object-cover rounded-lg" />
            ) : (
              <div className="w-24 h-24 bg-[#F5F3F0] rounded-lg flex items-center justify-center">
                <Building2 className="w-10 h-10 text-[#D0C9C0]" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPhaseColor(project.phase)}`}>
                  {getPhaseLabel(project.phase)}
                </span>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                  project.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {project.status?.toUpperCase()}
                </span>
              </div>
              <h3 className="text-lg font-bold">{project.project_name}</h3>
              <p className="text-sm text-[#4A4D53] flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {project.locality}, {project.city}
              </p>
              <p className="text-lg font-bold text-[#04473C] mt-1">
                ₹{(project.min_price/100000).toFixed(0)}L - ₹{(project.max_price/100000).toFixed(0)}L
              </p>
            </div>
          </div>
          
          {/* Analytics */}
          <div className="grid grid-cols-4 gap-4 text-center">
            <div className="bg-[#F5F3F0] p-3 rounded-lg">
              <div className="text-xl font-bold text-[#04473C]">{project.total_views || 0}</div>
              <div className="text-xs text-[#4A4D53]">Views</div>
            </div>
            <div className="bg-[#F5F3F0] p-3 rounded-lg">
              <div className="text-xl font-bold text-blue-600">{project.total_clicks || 0}</div>
              <div className="text-xs text-[#4A4D53]">Clicks</div>
            </div>
            <div className="bg-[#F5F3F0] p-3 rounded-lg">
              <div className="text-xl font-bold text-purple-600">{project.total_inquiries || 0}</div>
              <div className="text-xs text-[#4A4D53]">Inquiries</div>
            </div>
            <div className="bg-[#F5F3F0] p-3 rounded-lg">
              <div className="text-xl font-bold text-green-600">{project.total_site_visits || 0}</div>
              <div className="text-xs text-[#4A4D53]">Site Visits</div>
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#E5E1DB]">
          <div className="flex gap-2">
            <button
              onClick={() => onViewLeads(project)}
              className="flex items-center gap-1 px-3 py-1.5 bg-[#04473C] text-white rounded-lg text-sm hover:bg-[#033530]"
            >
              <Users className="w-4 h-4" />
              View Leads
            </button>
            <button
              onClick={() => onEdit(project)}
              className="flex items-center gap-1 px-3 py-1.5 border border-[#E5E1DB] rounded-lg text-sm hover:bg-[#F5F3F0]"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </button>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-sm text-[#4A4D53] hover:text-[#04473C]"
          >
            {expanded ? 'Less Details' : 'More Details'}
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
      
      {/* Expanded Details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-[#E5E1DB] bg-[#F5F3F0]/50"
          >
            <div className="p-4 grid md:grid-cols-2 gap-6">
              {/* Project Details */}
              <div className="space-y-3">
                <h4 className="font-bold text-sm text-[#04473C]">Project Details</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-[#4A4D53]">Type:</span>
                    <span className="ml-2 font-medium">{project.project_type}</span>
                  </div>
                  <div>
                    <span className="text-[#4A4D53]">Units:</span>
                    <span className="ml-2 font-medium">{project.total_units || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[#4A4D53]">Price/sqft:</span>
                    <span className="ml-2 font-medium">₹{project.price_per_sqft?.toLocaleString() || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[#4A4D53]">Possession:</span>
                    <span className="ml-2 font-medium">{project.possession_date || 'N/A'}</span>
                  </div>
                  {project.rera_number && (
                    <div className="col-span-2">
                      <span className="text-[#4A4D53]">RERA:</span>
                      <span className="ml-2 font-medium">{project.rera_number}</span>
                    </div>
                  )}
                </div>
                
                {/* Unit Types */}
                {project.unit_types?.length > 0 && (
                  <div>
                    <span className="text-[#4A4D53] text-sm">Unit Types:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {project.unit_types.map((type, i) => (
                        <span key={i} className="px-2 py-1 bg-white border border-[#E5E1DB] rounded text-xs">
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Amenities */}
                {project.amenities?.length > 0 && (
                  <div>
                    <span className="text-[#4A4D53] text-sm">Amenities:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {project.amenities.slice(0, 6).map((amenity, i) => (
                        <span key={i} className="px-2 py-1 bg-[#04473C]/10 text-[#04473C] rounded text-xs">
                          {amenity}
                        </span>
                      ))}
                      {project.amenities.length > 6 && (
                        <span className="px-2 py-1 text-[#4A4D53] text-xs">+{project.amenities.length - 6} more</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* EMI Calculator */}
              <EMICalculator minPrice={project.min_price} maxPrice={project.max_price} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Add Project Modal
const AddProjectModal = ({ isOpen, onClose, onSubmit, editProject }) => {
  const [formData, setFormData] = useState({
    project_name: '',
    project_type: 'residential',
    phase: 'launched',
    description: '',
    city: '',
    locality: '',
    full_address: '',
    total_units: '',
    unit_types: [],
    min_price: '',
    max_price: '',
    price_per_sqft: '',
    possession_date: '',
    rera_number: '',
    land_area_acres: '',
    expected_clu_date: '',
    investment_start_amount: '',
    expected_returns_percent: '',
    clu_status: '',
    clu_number: '',
    booking_amount: '',
    images: [],
    amenities: []
  });
  
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (editProject) {
      setFormData({
        ...editProject,
        total_units: editProject.total_units?.toString() || '',
        min_price: editProject.min_price?.toString() || '',
        max_price: editProject.max_price?.toString() || '',
        price_per_sqft: editProject.price_per_sqft?.toString() || '',
        land_area_acres: editProject.land_area_acres?.toString() || '',
        investment_start_amount: editProject.investment_start_amount?.toString() || '',
        expected_returns_percent: editProject.expected_returns_percent?.toString() || '',
        booking_amount: editProject.booking_amount?.toString() || ''
      });
    }
  }, [editProject]);
  
  const unitTypeOptions = ['1 BHK', '2 BHK', '3 BHK', '4 BHK', '5+ BHK', 'Villa', 'Plot', 'Penthouse', 'Studio', 'Duplex'];
  const amenityOptions = ['Swimming Pool', 'Gym', 'Clubhouse', 'Garden', 'Play Area', 'Security', 'Parking', 'Power Backup', 'Lift', 'Community Hall', 'Tennis Court', 'Basketball Court', 'Jogging Track', 'Shopping Complex'];
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const submitData = {
      ...formData,
      total_units: formData.total_units ? parseInt(formData.total_units) : null,
      min_price: formData.min_price ? parseFloat(formData.min_price) : null,
      max_price: formData.max_price ? parseFloat(formData.max_price) : null,
      price_per_sqft: formData.price_per_sqft ? parseFloat(formData.price_per_sqft) : null,
      land_area_acres: formData.land_area_acres ? parseFloat(formData.land_area_acres) : null,
      investment_start_amount: formData.investment_start_amount ? parseFloat(formData.investment_start_amount) : null,
      expected_returns_percent: formData.expected_returns_percent ? parseFloat(formData.expected_returns_percent) : null,
      booking_amount: formData.booking_amount ? parseFloat(formData.booking_amount) : null
    };
    
    await onSubmit(submitData);
    setLoading(false);
  };
  
  const getPackageInfo = () => {
    if (formData.phase === 'pre_pre_launch') {
      return { price: '₹35,000', description: 'Investor events + Lead generation', period: 'annually' };
    }
    return { price: '₹16,799', description: 'Direct client visits + Lead generation', period: 'annually' };
  };
  
  const packageInfo = getPackageInfo();
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white border-b border-[#E5E1DB] p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">{editProject ? 'Edit Project' : 'Add New Project'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-[#F5F3F0] rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Phase Selection with Pricing */}
          <div className="bg-gradient-to-r from-[#04473C] to-[#065f4e] text-white p-4 rounded-xl">
            <h3 className="font-bold mb-3">Select Project Phase</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'pre_pre_launch', label: 'Pre-Pre Launch', price: '₹35,000/year', desc: 'Land acquired, seeking investors' },
                { value: 'pre_launch', label: 'Pre-Launch', price: '₹16,799/year', desc: 'CLU approved/pending' },
                { value: 'launched', label: 'Launched', price: '₹16,799/year', desc: 'Ready for booking' }
              ].map((option) => (
                <div
                  key={option.value}
                  onClick={() => setFormData({ ...formData, phase: option.value })}
                  className={`p-4 rounded-lg cursor-pointer border-2 transition-all ${
                    formData.phase === option.value 
                      ? 'border-[#C6A87C] bg-white/20' 
                      : 'border-white/20 hover:border-white/40'
                  }`}
                >
                  <div className="font-bold">{option.label}</div>
                  <div className="text-[#C6A87C] font-bold text-lg">{option.price}</div>
                  <div className="text-xs text-white/70">{option.desc}</div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Basic Info */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Project Name *</label>
              <input
                type="text"
                value={formData.project_name}
                onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
                className="w-full px-4 py-2 border border-[#E5E1DB] rounded-lg focus:ring-2 focus:ring-[#04473C]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Project Type *</label>
              <select
                value={formData.project_type}
                onChange={(e) => setFormData({ ...formData, project_type: e.target.value })}
                className="w-full px-4 py-2 border border-[#E5E1DB] rounded-lg focus:ring-2 focus:ring-[#04473C]"
              >
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="mixed">Mixed Use</option>
                <option value="plots">Plots</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-[#E5E1DB] rounded-lg focus:ring-2 focus:ring-[#04473C]"
              rows={3}
              required
            />
          </div>
          
          {/* Location */}
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">City *</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-2 border border-[#E5E1DB] rounded-lg focus:ring-2 focus:ring-[#04473C]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Locality *</label>
              <input
                type="text"
                value={formData.locality}
                onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
                className="w-full px-4 py-2 border border-[#E5E1DB] rounded-lg focus:ring-2 focus:ring-[#04473C]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Full Address</label>
              <input
                type="text"
                value={formData.full_address}
                onChange={(e) => setFormData({ ...formData, full_address: e.target.value })}
                className="w-full px-4 py-2 border border-[#E5E1DB] rounded-lg focus:ring-2 focus:ring-[#04473C]"
              />
            </div>
          </div>
          
          {/* Pricing */}
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Min Price (₹)</label>
              <input
                type="number"
                value={formData.min_price}
                onChange={(e) => setFormData({ ...formData, min_price: e.target.value })}
                className="w-full px-4 py-2 border border-[#E5E1DB] rounded-lg focus:ring-2 focus:ring-[#04473C]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Max Price (₹)</label>
              <input
                type="number"
                value={formData.max_price}
                onChange={(e) => setFormData({ ...formData, max_price: e.target.value })}
                className="w-full px-4 py-2 border border-[#E5E1DB] rounded-lg focus:ring-2 focus:ring-[#04473C]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Price/Sqft (₹)</label>
              <input
                type="number"
                value={formData.price_per_sqft}
                onChange={(e) => setFormData({ ...formData, price_per_sqft: e.target.value })}
                className="w-full px-4 py-2 border border-[#E5E1DB] rounded-lg focus:ring-2 focus:ring-[#04473C]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Total Units</label>
              <input
                type="number"
                value={formData.total_units}
                onChange={(e) => setFormData({ ...formData, total_units: e.target.value })}
                className="w-full px-4 py-2 border border-[#E5E1DB] rounded-lg focus:ring-2 focus:ring-[#04473C]"
              />
            </div>
          </div>
          
          {/* Pre-Pre Launch Specific */}
          {formData.phase === 'pre_pre_launch' && (
            <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
              <h4 className="font-bold text-purple-800 mb-3">Pre-Pre Launch Details</h4>
              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Land Area (Acres)</label>
                  <input
                    type="number"
                    value={formData.land_area_acres}
                    onChange={(e) => setFormData({ ...formData, land_area_acres: e.target.value })}
                    className="w-full px-4 py-2 border border-[#E5E1DB] rounded-lg"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Expected CLU Date</label>
                  <input
                    type="date"
                    value={formData.expected_clu_date}
                    onChange={(e) => setFormData({ ...formData, expected_clu_date: e.target.value })}
                    className="w-full px-4 py-2 border border-[#E5E1DB] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Min Investment (₹)</label>
                  <input
                    type="number"
                    value={formData.investment_start_amount}
                    onChange={(e) => setFormData({ ...formData, investment_start_amount: e.target.value })}
                    className="w-full px-4 py-2 border border-[#E5E1DB] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Expected Returns (%)</label>
                  <input
                    type="number"
                    value={formData.expected_returns_percent}
                    onChange={(e) => setFormData({ ...formData, expected_returns_percent: e.target.value })}
                    className="w-full px-4 py-2 border border-[#E5E1DB] rounded-lg"
                    step="0.1"
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Pre-Launch Specific */}
          {formData.phase === 'pre_launch' && (
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
              <h4 className="font-bold text-blue-800 mb-3">Pre-Launch Details</h4>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">CLU Status</label>
                  <select
                    value={formData.clu_status}
                    onChange={(e) => setFormData({ ...formData, clu_status: e.target.value })}
                    className="w-full px-4 py-2 border border-[#E5E1DB] rounded-lg"
                  >
                    <option value="">Select Status</option>
                    <option value="pending">Pending</option>
                    <option value="in_process">In Process</option>
                    <option value="approved">Approved</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">CLU Number</label>
                  <input
                    type="text"
                    value={formData.clu_number}
                    onChange={(e) => setFormData({ ...formData, clu_number: e.target.value })}
                    className="w-full px-4 py-2 border border-[#E5E1DB] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Booking Amount (₹)</label>
                  <input
                    type="number"
                    value={formData.booking_amount}
                    onChange={(e) => setFormData({ ...formData, booking_amount: e.target.value })}
                    className="w-full px-4 py-2 border border-[#E5E1DB] rounded-lg"
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Unit Types */}
          <div>
            <label className="block text-sm font-medium mb-2">Unit Types</label>
            <div className="flex flex-wrap gap-2">
              {unitTypeOptions.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    const types = formData.unit_types.includes(type)
                      ? formData.unit_types.filter(t => t !== type)
                      : [...formData.unit_types, type];
                    setFormData({ ...formData, unit_types: types });
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                    formData.unit_types.includes(type)
                      ? 'bg-[#04473C] text-white border-[#04473C]'
                      : 'bg-white border-[#E5E1DB] hover:border-[#04473C]'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          
          {/* Amenities */}
          <div>
            <label className="block text-sm font-medium mb-2">Amenities</label>
            <div className="flex flex-wrap gap-2">
              {amenityOptions.map((amenity) => (
                <button
                  key={amenity}
                  type="button"
                  onClick={() => {
                    const amenities = formData.amenities.includes(amenity)
                      ? formData.amenities.filter(a => a !== amenity)
                      : [...formData.amenities, amenity];
                    setFormData({ ...formData, amenities });
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                    formData.amenities.includes(amenity)
                      ? 'bg-[#04473C] text-white border-[#04473C]'
                      : 'bg-white border-[#E5E1DB] hover:border-[#04473C]'
                  }`}
                >
                  {amenity}
                </button>
              ))}
            </div>
          </div>
          
          {/* Additional Info */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Possession Date</label>
              <input
                type="date"
                value={formData.possession_date}
                onChange={(e) => setFormData({ ...formData, possession_date: e.target.value })}
                className="w-full px-4 py-2 border border-[#E5E1DB] rounded-lg focus:ring-2 focus:ring-[#04473C]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">RERA Number</label>
              <input
                type="text"
                value={formData.rera_number}
                onChange={(e) => setFormData({ ...formData, rera_number: e.target.value })}
                className="w-full px-4 py-2 border border-[#E5E1DB] rounded-lg focus:ring-2 focus:ring-[#04473C]"
              />
            </div>
          </div>
          
          {/* Package Summary */}
          <div className="bg-[#C6A87C]/20 p-4 rounded-xl border border-[#C6A87C]">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-[#04473C]">Selected Package: {formData.phase.replace(/_/g, ' ').toUpperCase()}</h4>
                <p className="text-sm text-[#4A4D53]">{packageInfo.description}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-[#04473C]">{packageInfo.price}</div>
                <div className="text-sm text-[#4A4D53]">{packageInfo.period}</div>
              </div>
            </div>
          </div>
          
          {/* Submit Buttons */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-[#E5E1DB] rounded-lg hover:bg-[#F5F3F0]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-[#04473C] text-white rounded-lg hover:bg-[#033530] disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? 'Saving...' : <><Save className="w-4 h-4" /> {editProject ? 'Update Project' : 'Create Project'}</>}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// Leads Modal
const LeadsModal = ({ isOpen, onClose, project }) => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (isOpen && project) {
      fetchLeads();
    }
  }, [isOpen, project]);
  
  const fetchLeads = async () => {
    try {
      const response = await api.get(`/builder/projects/${project.id}/leads`);
      setLeads(response.data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const updateLeadStatus = async (leadId, status) => {
    try {
      await api.patch(`/builder/projects/${project.id}/leads/${leadId}`, { status });
      fetchLeads();
      toast.success('Lead status updated');
    } catch (error) {
      toast.error('Failed to update lead');
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white border-b border-[#E5E1DB] p-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Project Leads</h2>
            <p className="text-sm text-[#4A4D53]">{project?.project_name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#F5F3F0] rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4">
          {loading ? (
            <div className="text-center py-12 text-[#4A4D53]">Loading leads...</div>
          ) : leads.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-[#D0C9C0] mx-auto mb-3" />
              <p className="text-[#4A4D53]">No leads yet</p>
              <p className="text-sm text-[#4A4D53]">Leads will appear here when people inquire about your project</p>
            </div>
          ) : (
            <div className="space-y-3">
              {leads.map((lead) => (
                <div key={lead.id} className="bg-[#F5F3F0] p-4 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold">{lead.name}</div>
                      <div className="flex items-center gap-4 text-sm text-[#4A4D53]">
                        <a href={`tel:${lead.phone}`} className="flex items-center gap-1 hover:text-[#04473C]">
                          <Phone className="w-3 h-3" />
                          {lead.phone}
                        </a>
                        {lead.email && (
                          <a href={`mailto:${lead.email}`} className="flex items-center gap-1 hover:text-[#04473C]">
                            <Mail className="w-3 h-3" />
                            {lead.email}
                          </a>
                        )}
                      </div>
                      {lead.interested_unit_type && (
                        <p className="text-sm text-[#4A4D53] mt-1">Interested in: {lead.interested_unit_type}</p>
                      )}
                      {lead.budget_range && (
                        <p className="text-sm text-[#4A4D53]">Budget: {lead.budget_range}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <select
                        value={lead.status}
                        onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                        className="px-3 py-1.5 text-sm border border-[#E5E1DB] rounded-lg"
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="interested">Interested</option>
                        <option value="site_visit">Site Visit</option>
                        <option value="negotiation">Negotiation</option>
                        <option value="converted">Converted</option>
                        <option value="lost">Lost</option>
                      </select>
                      <span className="text-xs text-[#4A4D53]">
                        {new Date(lead.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// Main Builder Dashboard
const BuilderDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [showLeadsModal, setShowLeadsModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [filterPhase, setFilterPhase] = useState('all');
  
  useEffect(() => {
    fetchDashboardData();
  }, []);
  
  const fetchDashboardData = async () => {
    try {
      const [projectsRes, statsRes] = await Promise.all([
        api.get('/builder/projects'),
        api.get('/builder/dashboard/stats')
      ]);
      setProjects(projectsRes.data || []);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreateProject = async (projectData) => {
    try {
      if (editProject) {
        await api.put(`/builder/projects/${editProject.id}`, projectData);
        toast.success('Project updated successfully');
      } else {
        await api.post('/builder/projects', projectData);
        toast.success('Project created successfully');
      }
      setShowAddModal(false);
      setEditProject(null);
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to save project');
    }
  };
  
  const handleEditProject = (project) => {
    setEditProject(project);
    setShowAddModal(true);
  };
  
  const handleViewLeads = (project) => {
    setSelectedProject(project);
    setShowLeadsModal(true);
  };
  
  const filteredProjects = filterPhase === 'all' 
    ? projects 
    : projects.filter(p => p.phase === filterPhase);
  
  return (
    <div className="min-h-screen bg-[#FDFCFB]">
      {/* Header */}
      <header className="bg-white border-b border-[#E5E1DB] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#04473C] rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#111111]">Builder Dashboard</h1>
                <p className="text-sm text-[#4A4D53]">{user?.name || user?.company_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => { setEditProject(null); setShowAddModal(true); }}
                className="flex items-center gap-2 px-4 py-2 bg-[#04473C] text-white rounded-lg hover:bg-[#033530]"
              >
                <Plus className="w-4 h-4" />
                Add Project
              </button>
              <button
                onClick={logout}
                className="p-2 hover:bg-[#F5F3F0] rounded-lg"
              >
                <LogOut className="w-5 h-5 text-[#4A4D53]" />
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-white border border-[#E5E1DB] p-4 rounded-xl">
              <div className="text-3xl font-bold text-[#04473C]">{stats.projects?.total || 0}</div>
              <div className="text-sm text-[#4A4D53]">Total Projects</div>
            </div>
            <div className="bg-white border border-[#E5E1DB] p-4 rounded-xl">
              <div className="text-3xl font-bold text-purple-600">{stats.projects?.pre_pre_launch || 0}</div>
              <div className="text-sm text-[#4A4D53]">Pre-Pre Launch</div>
            </div>
            <div className="bg-white border border-[#E5E1DB] p-4 rounded-xl">
              <div className="text-3xl font-bold text-blue-600">{stats.projects?.pre_launch || 0}</div>
              <div className="text-sm text-[#4A4D53]">Pre-Launch</div>
            </div>
            <div className="bg-white border border-[#E5E1DB] p-4 rounded-xl">
              <div className="text-3xl font-bold text-green-600">{stats.projects?.launched || 0}</div>
              <div className="text-sm text-[#4A4D53]">Launched</div>
            </div>
            <div className="bg-white border border-[#E5E1DB] p-4 rounded-xl">
              <div className="text-3xl font-bold text-[#C6A87C]">{stats.leads?.total || 0}</div>
              <div className="text-sm text-[#4A4D53]">Total Leads</div>
            </div>
            <div className="bg-white border border-[#E5E1DB] p-4 rounded-xl">
              <div className="text-3xl font-bold text-orange-600">{stats.analytics?.total_views || 0}</div>
              <div className="text-sm text-[#4A4D53]">Total Views</div>
            </div>
          </div>
        )}
        
        {/* Pricing Banner */}
        <div className="bg-gradient-to-r from-[#04473C] to-[#065f4e] text-white p-6 rounded-xl mb-8">
          <h2 className="text-xl font-bold mb-4">Our Packages</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20">
              <div className="flex items-center justify-between mb-2">
                <span className="px-3 py-1 bg-purple-500/30 text-purple-200 rounded-full text-sm font-medium">Pre-Pre Launch</span>
                <span className="text-2xl font-bold">₹35,000<span className="text-sm font-normal">/year</span></span>
              </div>
              <ul className="space-y-2 text-sm text-white/80">
                <li>• Organize investor events in your target cities</li>
                <li>• We bring investors to your events</li>
                <li>• Lead generation + Brokerage on deals</li>
                <li>• Event promotion on our platform</li>
              </ul>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20">
              <div className="flex items-center justify-between mb-2">
                <span className="px-3 py-1 bg-green-500/30 text-green-200 rounded-full text-sm font-medium">Pre-Launch & Launched</span>
                <span className="text-2xl font-bold">₹16,799<span className="text-sm font-normal">/year</span></span>
              </div>
              <ul className="space-y-2 text-sm text-white/80">
                <li>• Direct client visits via our riders</li>
                <li>• Full lead management dashboard</li>
                <li>• EMI calculator for customers</li>
                <li>• Commission on successful sales</li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Phase Filter */}
        <div className="flex items-center gap-4 mb-6">
          <span className="text-sm text-[#4A4D53]">Filter by Phase:</span>
          <div className="flex gap-2">
            {['all', 'pre_pre_launch', 'pre_launch', 'launched'].map((phase) => (
              <button
                key={phase}
                onClick={() => setFilterPhase(phase)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filterPhase === phase 
                    ? 'bg-[#04473C] text-white' 
                    : 'bg-white border border-[#E5E1DB] hover:border-[#04473C]'
                }`}
              >
                {phase === 'all' ? 'All' : phase.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </button>
            ))}
          </div>
        </div>
        
        {/* Projects List */}
        {loading ? (
          <div className="text-center py-12 text-[#4A4D53]">Loading projects...</div>
        ) : filteredProjects.length === 0 ? (
          <div className="bg-white border border-[#E5E1DB] rounded-xl p-12 text-center">
            <Building2 className="w-16 h-16 text-[#D0C9C0] mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No Projects Yet</h3>
            <p className="text-[#4A4D53] mb-6">Add your first project to start generating leads</p>
            <button
              onClick={() => { setEditProject(null); setShowAddModal(true); }}
              className="flex items-center gap-2 px-6 py-3 bg-[#04473C] text-white rounded-lg hover:bg-[#033530] mx-auto"
            >
              <Plus className="w-5 h-5" />
              Add Your First Project
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onEdit={handleEditProject}
                onViewLeads={handleViewLeads}
              />
            ))}
          </div>
        )}
      </main>
      
      {/* Modals */}
      <AddProjectModal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); setEditProject(null); }}
        onSubmit={handleCreateProject}
        editProject={editProject}
      />
      
      <LeadsModal
        isOpen={showLeadsModal}
        onClose={() => { setShowLeadsModal(false); setSelectedProject(null); }}
        project={selectedProject}
      />
    </div>
  );
};

export default BuilderDashboard;
