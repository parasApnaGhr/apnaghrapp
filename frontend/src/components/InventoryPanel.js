import React, { useState } from 'react';
import { Plus, Edit, Trash2, CheckCircle, Home } from 'lucide-react';
import { toast } from 'sonner';
import { propertyAPI } from '../utils/api';
import FileUploader from './FileUploader';

const InventoryPanel = () => {
  const [properties] = useState([
    {
      id: '1',
      title: 'Modern 2BHK Apartment',
      area: 'Sector 70, Mohali',
      rent: 25000,
      available: true,
      verified: true,
    },
    {
      id: '2',
      title: 'Spacious 3BHK Villa',
      area: 'Zirakpur',
      rent: 45000,
      available: true,
      verified: false,
    },
  ]);

  const handleDelete = async (propertyId) => {
    if (!window.confirm('Are you sure you want to delete this property?')) return;
    
    try {
      await propertyAPI.deleteProperty(propertyId);
      toast.success('Property deleted successfully!');
      window.location.reload();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete property');
    }
  };

  const handleToggleAvailability = async (propertyId, currentStatus) => {
    try {
      await propertyAPI.updateProperty(propertyId, !currentStatus);
      toast.success(`Property marked as ${!currentStatus ? 'available' : 'rented out'}`);
      window.location.reload();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update property');
    }
  };

  const [showAddForm, setShowAddForm] = useState(false);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const propertyData = {
        ...formData,
        rent: parseFloat(formData.rent),
        bhk: parseInt(formData.bhk),
        amenities: formData.amenities.filter(a => a.trim()),
      };
      
      await propertyAPI.createProperty(propertyData);
      toast.success('Property added successfully!');
      setShowAddForm(false);
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
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add property');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit' }}>
          Property Inventory
        </h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-primary flex items-center gap-2"
          data-testid="add-property-button"
        >
          <Plus className="w-4 h-4" />
          Add Property
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <p className="text-sm text-[#4A626C] mb-1">Total Properties</p>
          <p className="text-3xl font-bold" style={{ fontFamily: 'Outfit' }}>156</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-[#4A626C] mb-1">Available</p>
          <p className="text-3xl font-bold text-[#2A9D8F]" style={{ fontFamily: 'Outfit' }}>142</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-[#4A626C] mb-1">Verified</p>
          <p className="text-3xl font-bold text-[#E07A5F]" style={{ fontFamily: 'Outfit' }}>98</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-[#4A626C] mb-1">Premium</p>
          <p className="text-3xl font-bold text-[#F4A261]" style={{ fontFamily: 'Outfit' }}>32</p>
        </div>
      </div>

      {showAddForm && (
        <div className="bg-white rounded-xl border border-[#E5E3D8] p-6 mb-6">
          <h3 className="font-bold mb-4">Add New Property</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#264653] mb-1">Title</label>
              <input
                type="text"
                data-testid="property-title-input"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#264653] mb-1">Property Type</label>
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
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#264653] mb-1">BHK</label>
              <select
                value={formData.bhk}
                onChange={(e) => setFormData({ ...formData, bhk: parseInt(e.target.value) })}
                className="input-field"
              >
                <option value="1">1 BHK</option>
                <option value="2">2 BHK</option>
                <option value="3">3 BHK</option>
                <option value="4">4 BHK</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#264653] mb-1">Monthly Rent (₹)</label>
              <input
                type="number"
                data-testid="rent-input"
                value={formData.rent}
                onChange={(e) => setFormData({ ...formData, rent: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#264653] mb-1">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#264653] mb-1">Area Name</label>
              <input
                type="text"
                placeholder="e.g., Sector 70"
                value={formData.area_name}
                onChange={(e) => setFormData({ ...formData, area_name: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[#264653] mb-1">Exact Address</label>
              <textarea
                value={formData.exact_address}
                onChange={(e) => setFormData({ ...formData, exact_address: e.target.value })}
                className="input-field"
                rows="2"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[#264653] mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-field"
                rows="3"
                required
              />
            </div>
            <div className="md:col-span-2">
              <FileUploader
                type="image"
                multiple={true}
                label="Property Images"
                onUploadComplete={(urls) => {
                  setFormData({ ...formData, images: Array.isArray(urls) ? urls : [urls] });
                }}
              />
            </div>
            <div className="md:col-span-2">
              <FileUploader
                type="video"
                multiple={false}
                label="Property Video Tour (Optional)"
                onUploadComplete={(url) => {
                  setFormData({ ...formData, video_url: url });
                }}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[#264653] mb-1">Amenities (comma-separated)</label>
              <input
                type="text"
                placeholder="Parking, Gym, Swimming Pool"
                value={formData.amenities.join(', ')}
                onChange={(e) => setFormData({ ...formData, amenities: e.target.value.split(',').map(a => a.trim()).filter(a => a) })}
                className="input-field"
              />
            </div>

            <div className="md:col-span-2 flex gap-3">
              <button type="submit" className="btn-primary">
                Add Property
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-[#E5E3D8] p-6">
        <h3 className="font-bold mb-4">Property List</h3>
        <div className="space-y-3">
          {properties.map((property) => (
            <div
              key={property.id}
              className="border border-[#E5E3D8] rounded-lg p-4 flex items-center justify-between"
              data-testid={`property-${property.id}`}
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-[#F3F2EB] rounded-lg flex items-center justify-center">
                  <Home className="w-8 h-8 text-[#4A626C]" />
                </div>
                <div>
                  <h4 className="font-bold">{property.title}</h4>
                  <p className="text-sm text-[#4A626C]">{property.area}</p>
                  <p className="text-sm font-bold text-[#E07A5F]">₹{property.rent.toLocaleString()}/mo</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {property.verified && (
                  <span className="badge badge-success">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Verified
                  </span>
                )}
                <button
                  onClick={() => handleToggleAvailability(property.id, property.available)}
                  className={`badge ${property.available ? 'badge-success' : 'badge-warning'} cursor-pointer hover:opacity-80`}
                  data-testid={`toggle-availability-${property.id}`}
                >
                  {property.available ? 'Available' : 'Rented Out'}
                </button>
                <button 
                  className="p-2 hover:bg-[#F3F2EB] rounded-lg"
                  title="Edit property"
                >
                  <Edit className="w-4 h-4 text-[#4A626C]" />
                </button>
                <button 
                  onClick={() => handleDelete(property.id)}
                  className="p-2 hover:bg-red-50 rounded-lg"
                  title="Delete property"
                  data-testid={`delete-property-${property.id}`}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InventoryPanel;