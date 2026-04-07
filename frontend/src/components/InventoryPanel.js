import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, CheckCircle, Home, X, Video, Image as ImageIcon, RefreshCw, MapPin, Search, Target, Award, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { propertyAPI, getMediaUrl } from '../utils/api';
import api from '../utils/api';
import FileUploader from './FileUploader';
import AIPropertyValidator from './AIPropertyValidator';

const InventoryPanel = ({ inventorySession }) => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [sessionStats, setSessionStats] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    property_type: 'Apartment',
    bhk: 2,
    rent: '',
    furnishing: 'Semi-Furnished',
    area_name: '',
    city: '',
    exact_address: '',
    latitude: null,
    longitude: null,
    images: [],
    video_url: '',
    amenities: [],
    owner_contact: '',
    owner_name: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const API_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    loadProperties();
  }, []);

  // Fetch session stats for inventory user
  useEffect(() => {
    if (inventorySession?.session_id) {
      fetchSessionStats();
      // Refresh stats every 30 seconds
      const interval = setInterval(fetchSessionStats, 30000);
      return () => clearInterval(interval);
    }
  }, [inventorySession]);

  const fetchSessionStats = async () => {
    if (!inventorySession?.session_id) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/inventory/my-inventory-stats?session_id=${inventorySession.session_id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setSessionStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch session stats:', err);
    }
  };

  const loadProperties = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/properties');
      setProperties(response.data || []);
    } catch (error) {
      console.error('Error loading properties:', error);
      toast.error('Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  // Track property added for inventory user
  const trackPropertyAdded = async (city) => {
    // Try to get session from prop or sessionStorage
    let sessionId = inventorySession?.session_id;
    
    if (!sessionId) {
      const savedSession = sessionStorage.getItem('inventorySession');
      if (savedSession) {
        try {
          const parsed = JSON.parse(savedSession);
          sessionId = parsed.session_id;
        } catch (e) {
          console.error('Failed to parse inventory session:', e);
        }
      }
    }
    
    if (!sessionId) {
      console.log('No inventory session found - skipping tracking');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/inventory/track-property-added?session_id=${sessionId}&city=${encodeURIComponent(city)}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        // Update local session stats immediately
        setSessionStats(prev => ({
          ...prev,
          properties_added: data.properties_added,
          properties_added_by_city: data.city_breakdown,
          points_earned: data.points_earned,
          performance_status: data.performance_status,
          achievement_percentage: prev?.total_target > 0 ? (data.properties_added / prev.total_target * 100) : 0
        }));
        toast.success(`+1 point! Total: ${data.points_earned} points`);
      } else {
        console.error('Track property failed:', data);
      }
    } catch (err) {
      console.error('Failed to track property:', err);
    }
  };

  const handleDelete = async (propertyId) => {
    if (!window.confirm('Are you sure you want to delete this property?')) return;
    
    try {
      await propertyAPI.deleteProperty(propertyId);
      setProperties(properties.filter(p => p.id !== propertyId));
      toast.success('Property deleted successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete property');
    }
  };

  const handleToggleAvailability = async (propertyId, currentStatus) => {
    try {
      await propertyAPI.updateProperty(propertyId, !currentStatus);
      setProperties(properties.map(p => 
        p.id === propertyId ? { ...p, available: !currentStatus } : p
      ));
      toast.success(`Property marked as ${!currentStatus ? 'available' : 'rented out'}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update property');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      property_type: 'Apartment',
      bhk: 2,
      rent: '',
      furnishing: 'Semi-Furnished',
      area_name: '',
      city: '',
      exact_address: '',
      latitude: null,
      longitude: null,
      images: [],
      video_url: '',
      amenities: [],
      owner_contact: '',
      owner_name: '',
    });
    setEditingProperty(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.description || formData.description.length < 50) {
      toast.error('Description must be at least 50 characters');
      return;
    }
    
    const amenitiesArray = Array.isArray(formData.amenities) 
      ? formData.amenities.filter(a => a.trim())
      : formData.amenities.split(',').map(a => a.trim()).filter(a => a);
    
    if (amenitiesArray.length < 3) {
      toast.error('Please add at least 3 amenities');
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Ensure images is always an array
      const safeImages = Array.isArray(formData.images) ? formData.images : [];
      
      const propertyData = {
        ...formData,
        rent: parseFloat(formData.rent) || 0,
        bhk: parseInt(formData.bhk) || 1,
        amenities: amenitiesArray,
        images: safeImages,
      };
      
      if (editingProperty) {
        await api.put(`/admin/properties/${editingProperty.id}`, propertyData);
        toast.success('Property updated successfully!');
      } else {
        await propertyAPI.createProperty(propertyData);
        toast.success('Property added successfully!');
        
        // Track property added for inventory user (checks sessionStorage as fallback)
        await trackPropertyAdded(formData.city || 'Unknown');
      }
      
      setShowAddForm(false);
      resetForm();
      loadProperties();
    } catch (error) {
      console.error('Property save error:', error);
      toast.error(error.response?.data?.detail || 'Failed to save property. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (property) => {
    setFormData({
      title: property.title || '',
      description: property.description || '',
      property_type: property.property_type || 'Apartment',
      bhk: property.bhk || 2,
      rent: property.rent?.toString() || '',
      furnishing: property.furnishing || 'Semi-Furnished',
      area_name: property.area_name || '',
      city: property.city || '',
      exact_address: property.exact_address || '',
      latitude: property.latitude || null,
      longitude: property.longitude || null,
      images: property.images || [],
      video_url: property.video_url || '',
      amenities: property.amenities || [],
      owner_contact: property.owner_contact || '',
      owner_name: property.owner_name || '',
    });
    setEditingProperty(property);
    setShowAddForm(true);
  };

  const removeImage = (index) => {
    const newImages = [...formData.images];
    newImages.splice(index, 1);
    setFormData({ ...formData, images: newImages });
  };

  const removeVideo = () => {
    setFormData({ ...formData, video_url: '' });
  };

  // Stats
  const totalProperties = properties.length;
  const availableCount = properties.filter(p => p.available).length;
  const verifiedCount = properties.filter(p => p.verified_owner).length;
  const premiumCount = properties.filter(p => p.premium_listing).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit' }}>
          Property Inventory
        </h2>
        <div className="flex gap-2">
          <button
            onClick={loadProperties}
            className="p-2 hover:bg-gray-100 rounded-lg"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowAddForm(!showAddForm);
            }}
            className="btn-primary flex items-center gap-2"
            data-testid="add-property-button"
          >
            <Plus className="w-4 h-4" />
            Add Property
          </button>
        </div>
      </div>

      {/* Inventory Session Stats Banner */}
      {inventorySession && sessionStats && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-gradient-to-r from-[#C6A87C] to-[#B8956C] text-white rounded-xl p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <p className="text-white/80 text-xs">Your Session Progress</p>
                <p className="font-semibold">{sessionStats.user_name || inventorySession.user_name}</p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold">{sessionStats.properties_added || 0}</p>
                <p className="text-xs text-white/80">Added</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{sessionStats.total_target || 0}</p>
                <p className="text-xs text-white/80">Target</p>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-1">
                  <Award className="w-4 h-4" />
                  <p className="text-2xl font-bold">{sessionStats.points_earned || 0}</p>
                </div>
                <p className="text-xs text-white/80">Points</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold">{(sessionStats.achievement_percentage || 0).toFixed(0)}%</p>
                <p className="text-xs text-white/80">Complete</p>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                sessionStats.performance_status === 'Good Performance' 
                  ? 'bg-green-500/30 text-white' 
                  : sessionStats.properties_added > 0 
                    ? 'bg-yellow-500/30 text-white'
                    : 'bg-white/20 text-white'
              }`}>
                {sessionStats.performance_status || 'In Progress'}
              </div>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="mt-3">
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(sessionStats.achievement_percentage || 0, 100)}%` }}
                transition={{ duration: 0.5 }}
                className="h-full bg-white rounded-full"
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <p className="text-sm text-[#52525B] mb-1">Total Properties</p>
          <p className="text-3xl font-bold" style={{ fontFamily: 'Outfit' }}>{totalProperties}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-[#52525B] mb-1">Available</p>
          <p className="text-3xl font-bold text-[#4ECDC4]" style={{ fontFamily: 'Outfit' }}>{availableCount}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-[#52525B] mb-1">Verified</p>
          <p className="text-3xl font-bold text-[#FF5A5F]" style={{ fontFamily: 'Outfit' }}>{verifiedCount}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-[#52525B] mb-1">Premium</p>
          <p className="text-3xl font-bold text-[#FFD166]" style={{ fontFamily: 'Outfit' }}>{premiumCount}</p>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="neo-card p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">
              {editingProperty ? 'Edit Property' : 'Add New Property'}
            </h3>
            <button onClick={() => { setShowAddForm(false); resetForm(); }} className="p-2 hover:bg-gray-100 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-[#111111] mb-1">Title *</label>
              <input
                type="text"
                data-testid="property-title-input"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input-field"
                placeholder="e.g., Spacious 2BHK Apartment"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#111111] mb-1">Property Type</label>
              <select
                data-testid="property-type-select"
                value={formData.property_type}
                onChange={(e) => setFormData({ ...formData, property_type: e.target.value })}
                className="input-field"
              >
                <option>Apartment</option>
                <option>Villa</option>
                <option>House</option>
                <option>PG</option>
                <option>Studio</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-[#111111] mb-1">BHK</label>
              <select
                value={formData.bhk}
                onChange={(e) => setFormData({ ...formData, bhk: parseInt(e.target.value) })}
                className="input-field"
              >
                <option value="1">1 BHK</option>
                <option value="2">2 BHK</option>
                <option value="3">3 BHK</option>
                <option value="4">4+ BHK</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-[#111111] mb-1">Monthly Rent (₹) *</label>
              <input
                type="number"
                data-testid="rent-input"
                value={formData.rent}
                onChange={(e) => setFormData({ ...formData, rent: e.target.value })}
                className="input-field"
                placeholder="25000"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#111111] mb-1">Furnishing</label>
              <select
                value={formData.furnishing}
                onChange={(e) => setFormData({ ...formData, furnishing: e.target.value })}
                className="input-field"
              >
                <option>Unfurnished</option>
                <option>Semi-Furnished</option>
                <option>Fully-Furnished</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-[#111111] mb-1">City *</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="input-field"
                placeholder="e.g., Mumbai"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#111111] mb-1">Area Name *</label>
              <input
                type="text"
                placeholder="e.g., Andheri West"
                value={formData.area_name}
                onChange={(e) => setFormData({ ...formData, area_name: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-[#111111] mb-1">Exact Address *</label>
              <textarea
                value={formData.exact_address}
                onChange={(e) => setFormData({ ...formData, exact_address: e.target.value })}
                className="input-field resize-none"
                rows="2"
                placeholder="Full address with landmarks (e.g., House 123, Sector 17, Chandigarh)"
                required
              />
            </div>
            
            {/* GPS Coordinates */}
            <div className="md:col-span-2 bg-[#E6F0EE] p-4 rounded-lg border border-[#04473C]/20">
              <label className="block text-sm font-bold text-[#111111] mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                GPS Location (for Rider Navigation)
              </label>
              
              {/* Auto-Geocode from Address */}
              <div className="mb-4 p-3 bg-white rounded border border-[#04473C]/10">
                <p className="text-sm font-medium text-[#04473C] mb-2">Option 1: Auto-detect from Address</p>
                <button
                  type="button"
                  onClick={async () => {
                    const address = `${formData.exact_address}, ${formData.area_name}, ${formData.city}`.trim();
                    if (!address || address === ', , ') {
                      toast.error('Please enter address, area and city first');
                      return;
                    }
                    toast.loading('Finding location from address...');
                    try {
                      const response = await fetch(
                        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
                      );
                      const data = await response.json();
                      toast.dismiss();
                      if (data && data.length > 0) {
                        setFormData({
                          ...formData,
                          latitude: parseFloat(data[0].lat),
                          longitude: parseFloat(data[0].lon)
                        });
                        toast.success(`Location found: ${data[0].display_name.substring(0, 50)}...`);
                      } else {
                        toast.error('Could not find location. Try adding more details to address.');
                      }
                    } catch (error) {
                      toast.dismiss();
                      toast.error('Failed to geocode address');
                    }
                  }}
                  className="w-full py-2 px-4 bg-[#04473C] text-white rounded hover:bg-[#033530] transition-colors flex items-center justify-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  Get GPS from Address
                </button>
                <p className="text-xs text-[#4A4D53] mt-1">
                  Works best with complete address including city name
                </p>
              </div>
              
              {/* Owner Location Link */}
              {editingProperty && (
                <div className="mb-4 p-3 bg-white rounded border border-[#04473C]/10">
                  <p className="text-sm font-medium text-[#04473C] mb-2">Option 2: Send Link to Owner</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`${window.location.origin}/add-location/${editingProperty.id}`}
                      className="input-field text-xs flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const link = `${window.location.origin}/add-location/${editingProperty.id}`;
                        navigator.clipboard.writeText(link);
                        toast.success('Link copied! Send this to property owner');
                      }}
                      className="px-3 py-2 bg-[#C6A87C] text-white rounded hover:bg-[#b39669] transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="text-xs text-[#4A4D53] mt-1">
                    Owner opens this link on their phone at the property to add GPS location
                  </p>
                </div>
              )}
              
              {/* Manual Entry */}
              <div className="p-3 bg-white rounded border border-[#04473C]/10">
                <p className="text-sm font-medium text-[#04473C] mb-2">Option 3: Manual Entry</p>
                <div className="grid grid-cols-2 gap-4 mb-2">
                  <div>
                    <input
                      type="number"
                      step="0.000001"
                      value={formData.latitude || ''}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value ? parseFloat(e.target.value) : null })}
                      className="input-field"
                      placeholder="Latitude (e.g., 30.7046)"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      step="0.000001"
                      value={formData.longitude || ''}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value ? parseFloat(e.target.value) : null })}
                      className="input-field"
                      placeholder="Longitude (e.g., 76.7179)"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition(
                        (position) => {
                          setFormData({
                            ...formData,
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude
                          });
                          toast.success('GPS location captured!');
                        },
                        (error) => toast.error('Could not get location: ' + error.message)
                      );
                    } else {
                      toast.error('Geolocation not supported');
                    }
                  }}
                  className="text-sm text-[#04473C] hover:underline flex items-center gap-1"
                >
                  <MapPin className="w-3 h-3" /> Use My Current Location
                </button>
              </div>
              
              {/* Status indicator */}
              {formData.latitude && formData.longitude && (
                <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-700">
                    GPS Set: {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
                  </span>
                </div>
              )}
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-[#111111] mb-1">Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-field resize-none"
                rows="3"
                placeholder="Describe the property features, nearby facilities..."
                required
              />
            </div>

            {/* Images Section */}
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-[#111111] mb-2">
                <ImageIcon className="w-4 h-4 inline mr-1" />
                Property Images
              </label>
              
              {/* Existing Images */}
              {formData.images.length > 0 && (
                <div className="flex flex-wrap gap-3 mb-3">
                  {formData.images.map((img, idx) => (
                    <div key={idx} className="relative group">
                      <img 
                        src={getMediaUrl(img)} 
                        alt={`Property ${idx + 1}`} 
                        className="w-24 h-24 object-cover rounded-lg border-2 border-[#111111]"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="%239CA3AF" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-[#FF5A5F] text-white rounded-full border-2 border-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove image"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <FileUploader
                type="image"
                multiple={true}
                label="Upload Images"
                onUploadComplete={(urls) => {
                  const newUrls = Array.isArray(urls) ? urls : [urls];
                  setFormData({ ...formData, images: [...formData.images, ...newUrls] });
                }}
              />
            </div>

            {/* Video Section */}
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-[#111111] mb-2">
                <Video className="w-4 h-4 inline mr-1" />
                Property Video Tour (Optional)
              </label>
              
              {formData.video_url && (
                <div className="mb-3 relative inline-block">
                  <video 
                    src={getMediaUrl(formData.video_url)} 
                    className="w-48 h-32 object-cover rounded-lg border-2 border-[#111111]"
                    controls
                  />
                  <button
                    type="button"
                    onClick={removeVideo}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-[#FF5A5F] text-white rounded-full border-2 border-white flex items-center justify-center"
                    title="Remove video"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              
              {!formData.video_url && (
                <FileUploader
                  type="video"
                  multiple={false}
                  label="Upload Video"
                  onUploadComplete={(url) => {
                    setFormData({ ...formData, video_url: url });
                  }}
                />
              )}
            </div>

            {/* Owner Contact Section - Internal Use Only */}
            <div className="md:col-span-2 p-4 bg-amber-50 border-2 border-amber-300 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-amber-600 font-bold text-sm">🔒 INTERNAL USE ONLY</span>
                <span className="text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded">Not visible to customers/riders</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-[#111111] mb-1">Owner Name</label>
                  <input
                    type="text"
                    placeholder="Property owner's name"
                    value={formData.owner_name}
                    onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                    className="input-field"
                    data-testid="owner-name-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#111111] mb-1">Owner Contact Number</label>
                  <input
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={formData.owner_contact}
                    onChange={(e) => setFormData({ ...formData, owner_contact: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    className="input-field"
                    data-testid="owner-contact-input"
                  />
                </div>
              </div>
              <p className="text-xs text-amber-700 mt-2">
                Use this to verify property availability. This info will NEVER be shown to customers or riders.
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-[#111111] mb-1">Amenities *</label>
              <input
                type="text"
                placeholder="Parking, Gym, Swimming Pool, Security"
                value={Array.isArray(formData.amenities) ? formData.amenities.join(', ') : formData.amenities}
                onChange={(e) => setFormData({ ...formData, amenities: e.target.value.split(',').map(a => a.trim()).filter(a => a) })}
                className="input-field"
                required
              />
              <p className="text-xs text-[#52525B] mt-1">Separate with commas (minimum 3 required)</p>
            </div>

            {/* AI Property Validator */}
            <div className="md:col-span-2">
              <AIPropertyValidator
                propertyData={formData}
                onSuggestionsUpdate={(analysis) => {
                  // Auto-update property type if detected with high confidence
                  if (analysis.detected_type && analysis.type_confidence > 0.7) {
                    const typeMap = {
                      'apartment': 'Apartment',
                      'house': 'House',
                      'villa': 'Villa',
                      'studio': 'Studio',
                      'pg': 'PG'
                    };
                    if (typeMap[analysis.detected_type] && typeMap[analysis.detected_type] !== formData.property_type) {
                      // Don't auto-change, just let the validator show the suggestion
                    }
                  }
                }}
                onTypeDetected={(type) => {
                  // Optional: Could auto-fill type
                }}
                isEditing={!!editingProperty}
              />
            </div>

            <div className="md:col-span-2 flex gap-3 pt-4">
              <button type="submit" className="btn-primary flex-1" disabled={submitting}>
                {submitting ? 'Saving...' : editingProperty ? 'Update Property' : 'Add Property'}
              </button>
              <button
                type="button"
                onClick={() => { setShowAddForm(false); resetForm(); }}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Property List */}
      <div className="neo-card p-6">
        <h3 className="font-bold mb-4">Property List ({properties.length})</h3>
        
        {loading ? (
          <div className="text-center py-12">
            <div className="kinetic-loader mx-auto">
              <span></span><span></span><span></span>
            </div>
            <p className="mt-4 text-[#52525B]">Loading properties...</p>
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-12">
            <Home className="w-12 h-12 text-[#9CA3AF] mx-auto mb-3" />
            <p className="text-[#52525B]">No properties found</p>
            <button onClick={() => setShowAddForm(true)} className="btn-secondary mt-4">
              Add First Property
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {properties.map((property) => (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border-2 border-[#111111] rounded-xl p-4 flex items-center justify-between hover:shadow-[3px_3px_0px_#111111] transition-shadow"
                data-testid={`property-${property.id}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-[#F3F4F6] rounded-lg border-2 border-[#111111] overflow-hidden flex-shrink-0">
                    {property.images?.[0] ? (
                      <img 
                        src={getMediaUrl(property.images[0])} 
                        alt="" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Home className="w-8 h-8 text-[#9CA3AF]" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">{property.title}</h4>
                    <p className="text-sm text-[#52525B]">
                      {property.bhk} BHK • {property.furnishing} • {property.area_name}, {property.city}
                    </p>
                    <p className="text-lg font-bold text-[#FF5A5F]" style={{ fontFamily: 'Outfit' }}>
                      ₹{property.rent?.toLocaleString()}/mo
                    </p>
                    {/* Owner Contact - Admin Only */}
                    {property.owner_contact && (
                      <p className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded mt-1 inline-flex items-center gap-1">
                        🔒 Owner: {property.owner_name || 'N/A'} • <a href={`tel:${property.owner_contact}`} className="font-bold hover:underline">{property.owner_contact}</a>
                      </p>
                    )}
                    <div className="flex gap-2 mt-1">
                      {property.images?.length > 0 && (
                        <span className="text-xs bg-[#F3F4F6] px-2 py-0.5 rounded">
                          {property.images.length} images
                        </span>
                      )}
                      {property.video_url && (
                        <span className="text-xs bg-[#4ECDC4]/20 text-[#4ECDC4] px-2 py-0.5 rounded">
                          Video
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {property.verified_owner && (
                    <span className="badge badge-success flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Verified
                    </span>
                  )}
                  <button
                    onClick={() => handleToggleAvailability(property.id, property.available)}
                    className={`badge cursor-pointer hover:opacity-80 ${
                      property.available ? 'badge-success' : 'badge-warning'
                    }`}
                    data-testid={`toggle-availability-${property.id}`}
                  >
                    {property.available ? 'Available' : 'Rented'}
                  </button>
                  <button 
                    onClick={() => handleEdit(property)}
                    className="p-2 hover:bg-[#F3F4F6] rounded-lg"
                    title="Edit property"
                  >
                    <Edit className="w-4 h-4 text-[#52525B]" />
                  </button>
                  <button 
                    onClick={() => handleDelete(property.id)}
                    className="p-2 hover:bg-red-50 rounded-lg"
                    title="Delete property"
                    data-testid={`delete-property-${property.id}`}
                  >
                    <Trash2 className="w-4 h-4 text-[#FF5A5F]" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryPanel;
