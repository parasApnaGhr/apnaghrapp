import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { propertyAPI } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal, Home, User, Heart, Calendar, LogOut } from 'lucide-react';
import { toast } from 'sonner';

const CustomerHome = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    city: '',
    min_rent: '',
    max_rent: '',
    bhk: '',
    furnishing: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState('home');

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      const response = await propertyAPI.getProperties(filters);
      setProperties(response.data);
    } catch (error) {
      toast.error('Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setLoading(true);
    loadProperties();
  };

  if (activeTab === 'bookings') {
    navigate('/customer/bookings');
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="bg-white border-b border-[#E5E3D8] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold" style={{ fontFamily: 'Outfit' }}>ApnaGhr</h1>
              <p className="text-sm text-[#4A626C]">Find your perfect home</p>
            </div>
            <button
              onClick={logout}
              className="p-2 hover:bg-[#F3F2EB] rounded-lg"
              data-testid="logout-button"
            >
              <LogOut className="w-5 h-5 text-[#4A626C]" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-[#4A626C] absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                data-testid="search-input"
                placeholder="Search city or locality..."
                value={filters.city}
                onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="input-field pl-10"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              data-testid="filter-button"
              className="btn-primary px-4"
            >
              <SlidersHorizontal className="w-5 h-5" />
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 p-4 bg-[#F3F2EB] rounded-lg grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#264653] mb-1">Min Rent</label>
                <input
                  type="number"
                  data-testid="min-rent-input"
                  placeholder="₹10,000"
                  value={filters.min_rent}
                  onChange={(e) => setFilters({ ...filters, min_rent: e.target.value })}
                  className="input-field py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#264653] mb-1">Max Rent</label>
                <input
                  type="number"
                  data-testid="max-rent-input"
                  placeholder="₹50,000"
                  value={filters.max_rent}
                  onChange={(e) => setFilters({ ...filters, max_rent: e.target.value })}
                  className="input-field py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#264653] mb-1">BHK</label>
                <select
                  data-testid="bhk-select"
                  value={filters.bhk}
                  onChange={(e) => setFilters({ ...filters, bhk: e.target.value })}
                  className="input-field py-2 text-sm"
                >
                  <option value="">Any</option>
                  <option value="1">1 BHK</option>
                  <option value="2">2 BHK</option>
                  <option value="3">3 BHK</option>
                  <option value="4">4 BHK+</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#264653] mb-1">Furnishing</label>
                <select
                  data-testid="furnishing-select"
                  value={filters.furnishing}
                  onChange={(e) => setFilters({ ...filters, furnishing: e.target.value })}
                  className="input-field py-2 text-sm"
                >
                  <option value="">Any</option>
                  <option value="Unfurnished">Unfurnished</option>
                  <option value="Semi-Furnished">Semi-Furnished</option>
                  <option value="Fully-Furnished">Fully-Furnished</option>
                </select>
              </div>
              <div className="col-span-2 md:col-span-4">
                <button
                  onClick={handleSearch}
                  data-testid="apply-filters-button"
                  className="btn-primary w-full"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Properties Grid */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-[#E07A5F] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-[#4A626C]">Loading properties...</p>
            </div>
          </div>
        ) : (
          <div className="property-grid">
            {properties.map((property) => (
              <div
                key={property.id}
                className="property-card"
                onClick={() => navigate(`/customer/property/${property.id}`)}
                data-testid={`property-card-${property.id}`}
              >
                <div className="relative h-48 bg-[#F3F2EB]">
                  {property.images && property.images[0] ? (
                    <img
                      src={property.images[0]}
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Home className="w-12 h-12 text-[#4A626C]" />
                    </div>
                  )}
                  {property.premium_listing && (
                    <span className="absolute top-2 left-2 badge badge-warning">Premium</span>
                  )}
                  {property.verified_owner && (
                    <span className="absolute top-2 right-2 badge badge-success">Verified</span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1">{property.title}</h3>
                  <p className="text-sm text-[#4A626C] mb-2">
                    {property.bhk} BHK • {property.furnishing}
                  </p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-[#E07A5F]" style={{ fontFamily: 'Outfit' }}>
                        ₹{property.rent.toLocaleString()}
                      </p>
                      <p className="text-xs text-[#4A626C]">{property.area_name}</p>
                    </div>
                    <span className="badge badge-info">📍 Hidden until paid</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && properties.length === 0 && (
          <div className="text-center py-20">
            <Home className="w-16 h-16 text-[#4A626C] mx-auto mb-4 opacity-50" />
            <p className="text-[#4A626C]">No properties found</p>
            <button onClick={() => setFilters({ city: '', min_rent: '', max_rent: '', bhk: '', furnishing: '' })} className="btn-primary mt-4">
              Clear Filters
            </button>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <div className="bottom-nav">
        <div className="flex max-w-md mx-auto">
          <button
            className={activeTab === 'home' ? 'active' : ''}
            onClick={() => setActiveTab('home')}
            data-testid="nav-home"
          >
            <Home className="w-5 h-5" />
            <span>Home</span>
          </button>
          <button
            className={activeTab === 'bookings' ? 'active' : ''}
            onClick={() => setActiveTab('bookings')}
            data-testid="nav-bookings"
          >
            <Calendar className="w-5 h-5" />
            <span>My Visits</span>
          </button>
          <button
            className={activeTab === 'saved' ? 'active' : ''}
            onClick={() => setActiveTab('saved')}
            data-testid="nav-saved"
          >
            <Heart className="w-5 h-5" />
            <span>Saved</span>
          </button>
          <button
            className={activeTab === 'profile' ? 'active' : ''}
            onClick={() => setActiveTab('profile')}
            data-testid="nav-profile"
          >
            <User className="w-5 h-5" />
            <span>Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerHome;