// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { MapPin, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '../utils/api';

const AddPropertyLocation = () => {
  const { propertyId } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [location, setLocation] = useState({ latitude: null, longitude: null });
  const [status, setStatus] = useState('idle'); // idle, capturing, success, error
  const [error, setError] = useState('');

  const loadProperty = useCallback(async () => {
    try {
      const response = await api.get(`/property/${propertyId}/public`);
      setProperty(response.data);
      if (response.data.latitude && response.data.longitude) {
        setLocation({
          latitude: response.data.latitude,
          longitude: response.data.longitude
        });
        setStatus('success');
      }
    } catch (error) {
      setError('Property not found or link expired');
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    loadProperty();
  }, [loadProperty]);

  const captureLocation = () => {
    if (!navigator.geolocation) {
      toast.error('GPS not supported on this device');
      return;
    }

    setStatus('capturing');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setStatus('captured');
        toast.success('Location captured! Click Save to confirm.');
      },
      (error) => {
        setStatus('error');
        let message = 'Could not get location';
        if (error.code === 1) message = 'Please allow location access in your browser settings';
        if (error.code === 2) message = 'Location unavailable. Please try again.';
        if (error.code === 3) message = 'Location request timed out. Please try again.';
        toast.error(message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const saveLocation = async () => {
    if (!location.latitude || !location.longitude) {
      toast.error('Please capture your location first');
      return;
    }

    setSaving(true);
    try {
      await api.put(`/property/${propertyId}/location`, {
        latitude: location.latitude,
        longitude: location.longitude
      });
      setStatus('success');
      toast.success('Location saved successfully! Thank you.');
    } catch (error) {
      toast.error('Failed to save location. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#04473C]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-[#1A1C20] mb-2">Link Invalid</h1>
          <p className="text-[#4A4D53]">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB]">
      {/* Header */}
      <header className="bg-[#04473C] text-white py-6 px-4">
        <div className="max-w-lg mx-auto text-center">
          <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>
            ApnaGhr
          </h1>
          <p className="text-[#C6A87C]">Add Property Location</p>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4">
        {/* Property Info */}
        {property && (
          <div className="bg-white rounded-lg shadow-sm border border-[#E5E1DB] p-4 mb-6">
            <h2 className="font-bold text-[#1A1C20] mb-1">{property.title}</h2>
            <p className="text-sm text-[#4A4D53]">{property.exact_address}</p>
            <p className="text-sm text-[#4A4D53]">{property.area_name}, {property.city}</p>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-[#FFF8E7] border border-[#C6A87C] rounded-lg p-4 mb-6">
          <h3 className="font-bold text-[#1A1C20] mb-2">Instructions</h3>
          <ol className="text-sm text-[#4A4D53] space-y-2">
            <li>1. Go to the property location</li>
            <li>2. Click "Capture My Location" button below</li>
            <li>3. Allow location access when prompted</li>
            <li>4. Click "Save Location" to confirm</li>
          </ol>
        </div>

        {/* Location Capture */}
        <div className="bg-white rounded-lg shadow-sm border border-[#E5E1DB] p-6">
          {status === 'success' ? (
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-[#1A1C20] mb-2">Location Saved!</h3>
              <p className="text-[#4A4D53] mb-4">
                GPS: {location.latitude?.toFixed(6)}, {location.longitude?.toFixed(6)}
              </p>
              <p className="text-sm text-green-600">
                Thank you! The rider can now navigate to this property.
              </p>
            </div>
          ) : (
            <>
              {/* Capture Button */}
              <button
                onClick={captureLocation}
                disabled={status === 'capturing'}
                className="w-full py-4 bg-[#04473C] text-white rounded-lg font-bold text-lg flex items-center justify-center gap-3 hover:bg-[#033530] transition-colors disabled:opacity-50"
              >
                {status === 'capturing' ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Capturing Location...
                  </>
                ) : (
                  <>
                    <MapPin className="w-6 h-6" />
                    Capture My Location
                  </>
                )}
              </button>

              {/* Location Preview */}
              {location.latitude && location.longitude && status === 'captured' && (
                <div className="mt-4 p-4 bg-[#E6F0EE] rounded-lg">
                  <p className="text-sm font-medium text-[#04473C] mb-2">Location Captured:</p>
                  <p className="text-sm text-[#4A4D53]">
                    Latitude: {location.latitude.toFixed(6)}
                  </p>
                  <p className="text-sm text-[#4A4D53]">
                    Longitude: {location.longitude.toFixed(6)}
                  </p>
                  
                  <button
                    onClick={saveLocation}
                    disabled={saving}
                    className="w-full mt-4 py-3 bg-[#C6A87C] text-white rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-[#b39669] transition-colors disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Save Location
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Help Text */}
              <p className="mt-4 text-xs text-[#4A4D53] text-center">
                Make sure you are at the exact property location for accurate GPS coordinates.
              </p>
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-sm text-[#4A4D53]">
        <p>Powered by ApnaGhr</p>
      </footer>
    </div>
  );
};

export default AddPropertyLocation;
