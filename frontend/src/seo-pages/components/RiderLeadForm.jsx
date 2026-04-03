// Rider Lead Capture Component - Informational only, no core transaction logic
import React, { useState } from 'react';
import { Phone, User, MapPin, CheckCircle, Loader2 } from 'lucide-react';

const RiderLeadForm = ({ source = 'seo_page', city = null }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    city: city || '',
    hasVehicle: false,
    hasLicense: false,
  });
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name || !formData.phone || !formData.city) {
      setErrorMsg('Please fill all required fields');
      return;
    }
    
    if (formData.phone.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit phone number');
      return;
    }

    setStatus('loading');
    setErrorMsg('');

    try {
      // Store lead locally (no backend connection as per requirement)
      // In production, this would go to a separate leads API
      const lead = {
        ...formData,
        source,
        timestamp: new Date().toISOString(),
        page: window.location.pathname,
      };
      
      // Store in localStorage for now (isolated from main app)
      const existingLeads = JSON.parse(localStorage.getItem('rider_leads') || '[]');
      existingLeads.push(lead);
      localStorage.setItem('rider_leads', JSON.stringify(existingLeads));
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStatus('success');
    } catch (error) {
      setStatus('error');
      setErrorMsg('Something went wrong. Please try again.');
    }
  };

  if (status === 'success') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-green-800 mb-2">
          Application Received!
        </h3>
        <p className="text-green-700 mb-4">
          Thank you for your interest in becoming a Property Rider. Our team will contact you within 24 hours.
        </p>
        <p className="text-sm text-green-600">
          Reference: #{Date.now().toString(36).toUpperCase()}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
      <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
        Join as Property Rider
      </h3>

      {errorMsg && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {errorMsg}
        </div>
      )}

      <div className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name *
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter your full name"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#04473C] focus:border-transparent"
              required
            />
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number *
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <div className="absolute left-10 top-1/2 -translate-y-1/2 text-gray-500 border-r border-gray-300 pr-2">
              +91
            </div>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
              placeholder="Enter 10-digit number"
              className="w-full pl-24 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#04473C] focus:border-transparent"
              required
            />
          </div>
        </div>

        {/* City */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            City *
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#04473C] focus:border-transparent appearance-none bg-white"
              required
            >
              <option value="">Select your city</option>
              <option value="Mohali">Mohali</option>
              <option value="Chandigarh">Chandigarh</option>
              <option value="Panchkula">Panchkula</option>
              <option value="Zirakpur">Zirakpur</option>
              <option value="Kharar">Kharar</option>
              <option value="Ludhiana">Ludhiana</option>
              <option value="Jalandhar">Jalandhar</option>
              <option value="Amritsar">Amritsar</option>
              <option value="Patiala">Patiala</option>
              <option value="Bathinda">Bathinda</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Checkboxes */}
        <div className="space-y-3 pt-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.hasVehicle}
              onChange={(e) => setFormData({ ...formData, hasVehicle: e.target.checked })}
              className="w-5 h-5 rounded border-gray-300 text-[#04473C] focus:ring-[#04473C]"
            />
            <span className="text-gray-700">I have a two-wheeler (bike/scooter)</span>
          </label>
          
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.hasLicense}
              onChange={(e) => setFormData({ ...formData, hasLicense: e.target.checked })}
              className="w-5 h-5 rounded border-gray-300 text-[#04473C] focus:ring-[#04473C]"
            />
            <span className="text-gray-700">I have a valid driving license</span>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-full py-4 bg-[#04473C] text-white rounded-xl font-bold text-lg hover:bg-[#033530] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {status === 'loading' ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Submitting...
            </>
          ) : (
            'Apply Now - It\'s FREE'
          )}
        </button>

        <p className="text-xs text-center text-gray-500 mt-3">
          By applying, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </form>
  );
};

export default RiderLeadForm;
