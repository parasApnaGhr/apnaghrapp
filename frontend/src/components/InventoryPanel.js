import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, CheckCircle, Home, X, Video, Image as ImageIcon, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { propertyAPI, getMediaUrl } from '../utils/api';
import api from '../utils/api';
import FileUploader from './FileUploader';

const InventoryPanel = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
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
    images: [],
    video_url: '',
    amenities: [],
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadProperties();
  }, []);

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
      images: [],
      video_url: '',
      amenities: [],
    });
    setEditingProperty(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const propertyData = {
        ...formData,
        rent: parseFloat(formData.rent),
        bhk: parseInt(formData.bhk),
        amenities: Array.isArray(formData.amenities) 
          ? formData.amenities.filter(a => a.trim())
          : formData.amenities.split(',').map(a => a.trim()).filter(a => a),
      };
      
      if (editingProperty) {
        await api.put(`/admin/properties/${editingProperty.id}`, propertyData);
        toast.success('Property updated successfully!');
      } else {
        await propertyAPI.createProperty(propertyData);
        toast.success('Property added successfully!');
      }
      
      setShowAddForm(false);
      resetForm();
      loadProperties();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save property');
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
      images: property.images || [],
      video_url: property.video_url || '',
      amenities: property.amenities || [],
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
                placeholder="Full address with landmarks"
                required
              />
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

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-[#111111] mb-1">Amenities</label>
              <input
                type="text"
                placeholder="Parking, Gym, Swimming Pool, Security"
                value={Array.isArray(formData.amenities) ? formData.amenities.join(', ') : formData.amenities}
                onChange={(e) => setFormData({ ...formData, amenities: e.target.value.split(',').map(a => a.trim()).filter(a => a) })}
                className="input-field"
              />
              <p className="text-xs text-[#52525B] mt-1">Separate with commas</p>
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
                      <img src={getMediaUrl(property.images[0])} alt="" className="w-full h-full object-cover" />
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
