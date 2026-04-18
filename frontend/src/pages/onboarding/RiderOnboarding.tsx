// @ts-nocheck
// Rider Onboarding Page - Multi-step form for new rider applications
import React, { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Home, User, Phone, MapPin, FileText, Camera, Car, Wallet,
  ChevronRight, ChevronLeft, Check, Upload, Loader2, Shield,
  AlertTriangle, CheckCircle2, Building
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../utils/api';

// Cities list
const CITIES = [
  'Delhi', 'Mumbai', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad',
  'Noida', 'Gurgaon', 'Ghaziabad', 'Faridabad',
  'Chandigarh', 'Mohali', 'Zirakpur', 'Ludhiana', 'Jalandhar', 'Amritsar', 'Patiala', 'Bathinda',
  'Panchkula', 'Hisar', 'Rohtak', 'Panipat', 'Karnal', 'Ambala',
  'Jaipur', 'Ajmer', 'Alwar',
  'Lucknow', 'Agra', 'Kanpur', 'Varanasi', 'Meerut',
  'Indore', 'Bhopal', 'Ujjain', 'Gwalior',
  'Surat', 'Vadodara', 'Rajkot',
  'Nagpur', 'Nashik', 'Aurangabad',
  'Coimbatore', 'Trichy', 'Madurai',
  'Mysore', 'Vijayawada', 'Visakhapatnam',
  'Dehradun', 'Haldwani', 'Haridwar',
  'Patna', 'Ranchi', 'Bhubaneswar', 'Guwahati', 'Siliguri',
  'Raipur', 'Bilaspur', 'Durg', 'Jammu'
].sort();

// Areas by city (sample - can be extended)
const AREAS_BY_CITY = {
  'Mohali': ['Sector 70', 'Sector 71', 'Sector 79', 'Sector 80', 'Sector 82', 'Phase 5', 'Phase 7', 'Aerocity', 'IT City'],
  'Chandigarh': ['Sector 17', 'Sector 22', 'Sector 35', 'Sector 43', 'Sector 44', 'Manimajra'],
  'Delhi': ['Dwarka', 'Rohini', 'Saket', 'Vasant Kunj', 'Pitampura', 'Janakpuri', 'Laxmi Nagar', 'Mayur Vihar'],
  'Mumbai': ['Andheri', 'Bandra', 'Powai', 'Goregaon', 'Malad', 'Borivali', 'Thane', 'Navi Mumbai'],
  'Bangalore': ['Whitefield', 'Electronic City', 'Koramangala', 'HSR Layout', 'Marathahalli', 'BTM Layout', 'Indiranagar'],
  'Noida': ['Sector 62', 'Sector 63', 'Sector 128', 'Sector 137', 'Sector 150', 'Greater Noida'],
  'Gurgaon': ['DLF Phase 1', 'DLF Phase 2', 'Sector 49', 'Sohna Road', 'Golf Course Road', 'MG Road'],
};

const STEPS = [
  { id: 1, title: 'Basic Details', icon: User },
  { id: 2, title: 'KYC Verification', icon: FileText },
  { id: 3, title: 'Work Details', icon: Car },
  { id: 4, title: 'Payment Details', icon: Wallet },
  { id: 5, title: 'Legal Agreements', icon: Shield },
  { id: 6, title: 'Submit', icon: Check },
];

const RiderOnboarding = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    // Basic Details
    full_name: '',
    mobile: '',
    whatsapp: '',
    city: '',
    areas: [],
    // KYC
    aadhaar_url: '',
    pan_url: '',
    selfie_url: '',
    // Work Details
    has_vehicle: false,
    driving_license_url: '',
    experience: '',
    availability: 'full_time',
    // Payment
    upi_id: '',
    bank_name: '',
    account_number: '',
    ifsc_code: '',
    account_holder_name: '',
    // Legal
    non_circumvention: false,
    commission_protection: false,
    penalty_clause: false,
    work_compliance: false,
    payment_terms: false,
  });

  const [errors, setErrors] = useState({});

  // Handle input change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Handle area selection
  const handleAreaToggle = (area) => {
    setFormData(prev => ({
      ...prev,
      areas: prev.areas.includes(area)
        ? prev.areas.filter(a => a !== area)
        : [...prev.areas, area]
    }));
  };

  // File upload handler
  const handleFileUpload = useCallback(async (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPG, PNG, WebP, and PDF files are allowed');
      return;
    }

    setUploadingFile(fieldName);

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('type', 'rider_document');

      const response = await api.post('/upload', formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setFormData(prev => ({
        ...prev,
        [fieldName]: response.data.url
      }));
      toast.success('File uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file');
    } finally {
      setUploadingFile(null);
    }
  }, []);

  // Validate current step
  const validateStep = () => {
    const newErrors = {};

    switch (currentStep) {
      case 1:
        if (!formData.full_name.trim()) newErrors.full_name = 'Full name is required';
        if (!formData.mobile.trim()) newErrors.mobile = 'Mobile number is required';
        else if (!/^\d{10}$/.test(formData.mobile)) newErrors.mobile = 'Enter valid 10-digit mobile number';
        if (!formData.city) newErrors.city = 'City is required';
        break;
      case 2:
        if (!formData.aadhaar_url) newErrors.aadhaar_url = 'Aadhaar Card is required';
        if (!formData.selfie_url) newErrors.selfie_url = 'Selfie is required';
        break;
      case 3:
        if (formData.has_vehicle && !formData.driving_license_url) {
          newErrors.driving_license_url = 'Driving license is required if you have a vehicle';
        }
        break;
      case 4:
        if (!formData.upi_id.trim()) newErrors.upi_id = 'UPI ID is required';
        else if (!formData.upi_id.includes('@')) newErrors.upi_id = 'Enter valid UPI ID (e.g., name@upi)';
        break;
      case 5:
        if (!formData.non_circumvention) newErrors.non_circumvention = 'This agreement is required';
        if (!formData.commission_protection) newErrors.commission_protection = 'This agreement is required';
        if (!formData.penalty_clause) newErrors.penalty_clause = 'This agreement is required';
        if (!formData.work_compliance) newErrors.work_compliance = 'This agreement is required';
        if (!formData.payment_terms) newErrors.payment_terms = 'This agreement is required';
        break;
      default:
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Next step
  const nextStep = () => {
    if (validateStep()) {
      setCurrentStep(prev => Math.min(prev + 1, 6));
    }
  };

  // Previous step
  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Submit application
  const handleSubmit = async () => {
    if (!validateStep()) return;

    setLoading(true);
    try {
      // Check if application already exists
      const checkResponse = await api.get(`/rider-applications/check/${formData.mobile}`);
      if (checkResponse.data.exists) {
        toast.error(`You already have a ${checkResponse.data.status} application`);
        setLoading(false);
        return;
      }

      // Submit application
      await api.post('/rider-applications', formData);
      setSubmitted(true);
      toast.success('Application submitted successfully!');
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(error.response?.data?.detail || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  // Render success state
  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h1>
          <p className="text-gray-600 mb-6">
            Thank you for applying to join ApnaGhr as a Property Rider. Our team will review your application and activate your account within 24-48 hours.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            You will receive an SMS on <strong>{formData.mobile}</strong> once your application is approved.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#04473C] text-white rounded-xl font-medium hover:bg-[#033530]"
          >
            <Home className="w-5 h-5" />
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Basic Details</h2>
            <p className="text-gray-600">Let's start with your personal information</p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#04473C] focus:border-transparent ${errors.full_name ? 'border-red-500' : 'border-gray-300'}`}
                />
              </div>
              {errors.full_name && <p className="text-red-500 text-sm mt-1">{errors.full_name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number *</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <span className="absolute left-10 top-1/2 -translate-y-1/2 text-gray-500 border-r border-gray-300 pr-2">+91</span>
                <input
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={(e) => handleChange({ target: { name: 'mobile', value: e.target.value.replace(/\D/g, '').slice(0, 10) } })}
                  placeholder="Enter 10-digit number"
                  className={`w-full pl-24 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#04473C] focus:border-transparent ${errors.mobile ? 'border-red-500' : 'border-gray-300'}`}
                />
              </div>
              {errors.mobile && <p className="text-red-500 text-sm mt-1">{errors.mobile}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number (Optional)</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  name="whatsapp"
                  value={formData.whatsapp}
                  onChange={(e) => handleChange({ target: { name: 'whatsapp', value: e.target.value.replace(/\D/g, '').slice(0, 10) } })}
                  placeholder="Same as mobile if empty"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#04473C] focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  name="city"
                  value={formData.city}
                  onChange={(e) => {
                    handleChange(e);
                    setFormData(prev => ({ ...prev, areas: [] })); // Reset areas
                  }}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#04473C] focus:border-transparent appearance-none bg-white ${errors.city ? 'border-red-500' : 'border-gray-300'}`}
                >
                  <option value="">Select your city</option>
                  {CITIES.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
              {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
            </div>

            {formData.city && AREAS_BY_CITY[formData.city] && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Areas (Optional)</label>
                <div className="flex flex-wrap gap-2">
                  {AREAS_BY_CITY[formData.city].map(area => (
                    <button
                      key={area}
                      type="button"
                      onClick={() => handleAreaToggle(area)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        formData.areas.includes(area)
                          ? 'bg-[#04473C] text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {area}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">KYC Verification</h2>
            <p className="text-gray-600">Upload your identity documents for verification</p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Aadhaar Card *</label>
              <div className={`border-2 border-dashed rounded-xl p-6 text-center ${formData.aadhaar_url ? 'border-green-500 bg-green-50' : errors.aadhaar_url ? 'border-red-500' : 'border-gray-300'}`}>
                {formData.aadhaar_url ? (
                  <div className="flex items-center justify-center gap-2 text-green-600">
                    <CheckCircle2 className="w-6 h-6" />
                    <span>Aadhaar Card Uploaded</span>
                  </div>
                ) : uploadingFile === 'aadhaar_url' ? (
                  <div className="flex items-center justify-center gap-2 text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Uploading...</span>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <span className="text-gray-600">Click to upload Aadhaar Card</span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileUpload(e, 'aadhaar_url')}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              {errors.aadhaar_url && <p className="text-red-500 text-sm mt-1">{errors.aadhaar_url}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">PAN Card (Optional)</label>
              <div className={`border-2 border-dashed rounded-xl p-6 text-center ${formData.pan_url ? 'border-green-500 bg-green-50' : 'border-gray-300'}`}>
                {formData.pan_url ? (
                  <div className="flex items-center justify-center gap-2 text-green-600">
                    <CheckCircle2 className="w-6 h-6" />
                    <span>PAN Card Uploaded</span>
                  </div>
                ) : uploadingFile === 'pan_url' ? (
                  <div className="flex items-center justify-center gap-2 text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Uploading...</span>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <span className="text-gray-600">Click to upload PAN Card</span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileUpload(e, 'pan_url')}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Selfie Photo *</label>
              <div className={`border-2 border-dashed rounded-xl p-6 text-center ${formData.selfie_url ? 'border-green-500 bg-green-50' : errors.selfie_url ? 'border-red-500' : 'border-gray-300'}`}>
                {formData.selfie_url ? (
                  <div className="flex items-center justify-center gap-2 text-green-600">
                    <CheckCircle2 className="w-6 h-6" />
                    <span>Selfie Uploaded</span>
                  </div>
                ) : uploadingFile === 'selfie_url' ? (
                  <div className="flex items-center justify-center gap-2 text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Uploading...</span>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <span className="text-gray-600">Click to upload a clear selfie</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'selfie_url')}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              {errors.selfie_url && <p className="text-red-500 text-sm mt-1">{errors.selfie_url}</p>}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Work Details</h2>
            <p className="text-gray-600">Tell us about your work preferences</p>

            <div>
              <label className="flex items-center gap-3 cursor-pointer p-4 border border-gray-300 rounded-xl hover:bg-gray-50">
                <input
                  type="checkbox"
                  name="has_vehicle"
                  checked={formData.has_vehicle}
                  onChange={handleChange}
                  className="w-5 h-5 rounded border-gray-300 text-[#04473C] focus:ring-[#04473C]"
                />
                <div>
                  <span className="font-medium text-gray-900">I have a two-wheeler (bike/scooter)</span>
                  <p className="text-sm text-gray-500">Required for property visits</p>
                </div>
              </label>
            </div>

            {formData.has_vehicle && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Driving License *</label>
                <div className={`border-2 border-dashed rounded-xl p-6 text-center ${formData.driving_license_url ? 'border-green-500 bg-green-50' : errors.driving_license_url ? 'border-red-500' : 'border-gray-300'}`}>
                  {formData.driving_license_url ? (
                    <div className="flex items-center justify-center gap-2 text-green-600">
                      <CheckCircle2 className="w-6 h-6" />
                      <span>Driving License Uploaded</span>
                    </div>
                  ) : uploadingFile === 'driving_license_url' ? (
                    <div className="flex items-center justify-center gap-2 text-gray-500">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span>Uploading...</span>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <span className="text-gray-600">Click to upload Driving License</span>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileUpload(e, 'driving_license_url')}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                {errors.driving_license_url && <p className="text-red-500 text-sm mt-1">{errors.driving_license_url}</p>}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Experience (Optional)</label>
              <textarea
                name="experience"
                value={formData.experience}
                onChange={handleChange}
                placeholder="Any relevant experience in real estate, customer service, delivery, etc."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#04473C] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Availability</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { value: 'full_time', label: 'Full Time', desc: '8+ hours/day' },
                  { value: 'part_time', label: 'Part Time', desc: '4-6 hours/day' },
                  { value: 'weekends', label: 'Weekends Only', desc: 'Sat-Sun' },
                ].map(option => (
                  <label
                    key={option.value}
                    className={`cursor-pointer p-4 border rounded-xl text-center transition-colors ${
                      formData.availability === option.value
                        ? 'border-[#04473C] bg-[#04473C]/5'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="availability"
                      value={option.value}
                      checked={formData.availability === option.value}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <span className="font-medium text-gray-900 block">{option.label}</span>
                    <span className="text-sm text-gray-500">{option.desc}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Payment Details</h2>
            <p className="text-gray-600">How would you like to receive your earnings?</p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">UPI ID *</label>
              <div className="relative">
                <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="upi_id"
                  value={formData.upi_id}
                  onChange={handleChange}
                  placeholder="yourname@upi"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#04473C] focus:border-transparent ${errors.upi_id ? 'border-red-500' : 'border-gray-300'}`}
                />
              </div>
              {errors.upi_id && <p className="text-red-500 text-sm mt-1">{errors.upi_id}</p>}
            </div>

            <div className="border-t border-gray-200 pt-4">
              <p className="text-sm text-gray-500 mb-4">Bank Details (Optional - for larger withdrawals)</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                  <input
                    type="text"
                    name="bank_name"
                    value={formData.bank_name}
                    onChange={handleChange}
                    placeholder="e.g., HDFC Bank"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#04473C] focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                  <input
                    type="text"
                    name="account_number"
                    value={formData.account_number}
                    onChange={handleChange}
                    placeholder="Enter account number"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#04473C] focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
                  <input
                    type="text"
                    name="ifsc_code"
                    value={formData.ifsc_code}
                    onChange={handleChange}
                    placeholder="e.g., HDFC0001234"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#04473C] focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Holder Name</label>
                  <input
                    type="text"
                    name="account_holder_name"
                    value={formData.account_holder_name}
                    onChange={handleChange}
                    placeholder="As per bank records"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#04473C] focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Legal Agreements</h2>
            <p className="text-gray-600">Please read and accept the following agreements to continue</p>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-yellow-800">Important Notice</h3>
                  <p className="text-sm text-yellow-700">
                    By accepting these agreements, you commit to following ApnaGhr's policies. 
                    Violation may result in permanent ban and legal action.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer ${formData.non_circumvention ? 'border-[#04473C] bg-[#04473C]/5' : errors.non_circumvention ? 'border-red-500' : 'border-gray-300'}`}>
                <input
                  type="checkbox"
                  name="non_circumvention"
                  checked={formData.non_circumvention}
                  onChange={handleChange}
                  className="w-5 h-5 mt-0.5 rounded border-gray-300 text-[#04473C] focus:ring-[#04473C]"
                />
                <div>
                  <span className="font-medium text-gray-900">Non-Circumvention Agreement *</span>
                  <p className="text-sm text-gray-600 mt-1">
                    I agree not to directly deal with any customer, property owner, or builder outside the platform.
                  </p>
                </div>
              </label>

              <label className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer ${formData.commission_protection ? 'border-[#04473C] bg-[#04473C]/5' : errors.commission_protection ? 'border-red-500' : 'border-gray-300'}`}>
                <input
                  type="checkbox"
                  name="commission_protection"
                  checked={formData.commission_protection}
                  onChange={handleChange}
                  className="w-5 h-5 mt-0.5 rounded border-gray-300 text-[#04473C] focus:ring-[#04473C]"
                />
                <div>
                  <span className="font-medium text-gray-900">Commission Protection *</span>
                  <p className="text-sm text-gray-600 mt-1">
                    All deals and earnings must go through ApnaGhr only. I will not accept direct payments from customers.
                  </p>
                </div>
              </label>

              <label className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer ${formData.penalty_clause ? 'border-[#04473C] bg-[#04473C]/5' : errors.penalty_clause ? 'border-red-500' : 'border-gray-300'}`}>
                <input
                  type="checkbox"
                  name="penalty_clause"
                  checked={formData.penalty_clause}
                  onChange={handleChange}
                  className="w-5 h-5 mt-0.5 rounded border-gray-300 text-[#04473C] focus:ring-[#04473C]"
                />
                <div>
                  <span className="font-medium text-gray-900">Penalty Clause *</span>
                  <p className="text-sm text-gray-600 mt-1">
                    I understand that violation may result in permanent ban and penalty up to ₹50,000+ with legal action.
                  </p>
                </div>
              </label>

              <label className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer ${formData.work_compliance ? 'border-[#04473C] bg-[#04473C]/5' : errors.work_compliance ? 'border-red-500' : 'border-gray-300'}`}>
                <input
                  type="checkbox"
                  name="work_compliance"
                  checked={formData.work_compliance}
                  onChange={handleChange}
                  className="w-5 h-5 mt-0.5 rounded border-gray-300 text-[#04473C] focus:ring-[#04473C]"
                />
                <div>
                  <span className="font-medium text-gray-900">Work Compliance *</span>
                  <p className="text-sm text-gray-600 mt-1">
                    I agree to follow company rules and visit guidelines, maintain professionalism, and provide quality service.
                  </p>
                </div>
              </label>

              <label className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer ${formData.payment_terms ? 'border-[#04473C] bg-[#04473C]/5' : errors.payment_terms ? 'border-red-500' : 'border-gray-300'}`}>
                <input
                  type="checkbox"
                  name="payment_terms"
                  checked={formData.payment_terms}
                  onChange={handleChange}
                  className="w-5 h-5 mt-0.5 rounded border-gray-300 text-[#04473C] focus:ring-[#04473C]"
                />
                <div>
                  <span className="font-medium text-gray-900">Payment Terms *</span>
                  <p className="text-sm text-gray-600 mt-1">
                    I understand payments are based on per visit or per deal basis as defined by the platform.
                  </p>
                </div>
              </label>
            </div>

            <div className="flex gap-2 text-sm text-gray-500">
              <span>By continuing, you also agree to our</span>
              <Link to="/privacy-policy-riders" className="text-[#04473C] underline">Privacy Policy</Link>
              <span>and</span>
              <Link to="/legal" className="text-[#04473C] underline">Terms of Service</Link>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Review & Submit</h2>
            <p className="text-gray-600">Please review your information before submitting</p>

            <div className="bg-gray-50 rounded-xl p-6 space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Basic Details</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-gray-500">Name:</span>
                  <span className="text-gray-900">{formData.full_name}</span>
                  <span className="text-gray-500">Mobile:</span>
                  <span className="text-gray-900">+91 {formData.mobile}</span>
                  <span className="text-gray-500">City:</span>
                  <span className="text-gray-900">{formData.city}</span>
                  {formData.areas.length > 0 && (
                    <>
                      <span className="text-gray-500">Areas:</span>
                      <span className="text-gray-900">{formData.areas.join(', ')}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="font-semibold text-gray-900 mb-2">Documents</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-gray-500">Aadhaar:</span>
                  <span className={formData.aadhaar_url ? 'text-green-600' : 'text-red-600'}>
                    {formData.aadhaar_url ? '✓ Uploaded' : '✗ Missing'}
                  </span>
                  <span className="text-gray-500">PAN:</span>
                  <span className={formData.pan_url ? 'text-green-600' : 'text-gray-500'}>
                    {formData.pan_url ? '✓ Uploaded' : 'Not provided'}
                  </span>
                  <span className="text-gray-500">Selfie:</span>
                  <span className={formData.selfie_url ? 'text-green-600' : 'text-red-600'}>
                    {formData.selfie_url ? '✓ Uploaded' : '✗ Missing'}
                  </span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="font-semibold text-gray-900 mb-2">Work & Payment</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-gray-500">Vehicle:</span>
                  <span className="text-gray-900">{formData.has_vehicle ? 'Yes' : 'No'}</span>
                  <span className="text-gray-500">Availability:</span>
                  <span className="text-gray-900">{formData.availability.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                  <span className="text-gray-500">UPI ID:</span>
                  <span className="text-gray-900">{formData.upi_id}</span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="font-semibold text-gray-900 mb-2">Legal Agreements</h3>
                <div className="flex flex-wrap gap-2">
                  {formData.non_circumvention && <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Non-Circumvention ✓</span>}
                  {formData.commission_protection && <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Commission Protection ✓</span>}
                  {formData.penalty_clause && <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Penalty Clause ✓</span>}
                  {formData.work_compliance && <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Work Compliance ✓</span>}
                  {formData.payment_terms && <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Payment Terms ✓</span>}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <Home className="w-6 h-6 text-[#04473C]" />
              <span className="font-bold text-xl text-[#04473C]">ApnaGhr</span>
            </Link>
            <span className="text-sm text-gray-500">Rider Application</span>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    currentStep > step.id
                      ? 'bg-green-500 text-white'
                      : currentStep === step.id
                      ? 'bg-[#04473C] text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {currentStep > step.id ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <step.icon className="w-5 h-5" />
                    )}
                  </div>
                  <span className={`text-xs mt-2 hidden md:block ${currentStep >= step.id ? 'text-gray-900' : 'text-gray-500'}`}>
                    {step.title}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 ${currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
          {renderStepContent()}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium ${
                currentStep === 1
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
              Previous
            </button>

            {currentStep < 6 ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex items-center gap-2 px-6 py-3 bg-[#04473C] text-white rounded-xl font-medium hover:bg-[#033530]"
              >
                Next
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-8 py-3 bg-[#04473C] text-white rounded-xl font-medium hover:bg-[#033530] disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Application
                    <Check className="w-5 h-5" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiderOnboarding;
