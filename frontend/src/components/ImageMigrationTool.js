import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, Image, AlertTriangle, CheckCircle, RefreshCw, Trash2, Plus, X } from 'lucide-react';
import api, { getMediaUrl } from '../utils/api';
import { toast } from 'sonner';

const ImageMigrationTool = ({ onClose }) => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState({});
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/properties');
      setProperties(response.data || []);
    } catch (error) {
      toast.error('Failed to fetch properties');
    } finally {
      setLoading(false);
    }
  };

  const checkImageStatus = async (imageUrl) => {
    if (!imageUrl) return false;
    if (imageUrl.startsWith('https://images.unsplash.com')) return true;
    if (imageUrl.startsWith('http')) return true;
    
    try {
      const fullUrl = getMediaUrl(imageUrl);
      const response = await fetch(fullUrl, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  };

  const checkAllImages = async () => {
    setChecking(true);
    const updatedProperties = await Promise.all(
      properties.map(async (prop) => {
        const imageStatuses = await Promise.all(
          (prop.images || []).map(async (img) => ({
            url: img,
            working: await checkImageStatus(img)
          }))
        );
        return {
          ...prop,
          imageStatuses,
          hasBrokenImages: imageStatuses.some(s => !s.working)
        };
      })
    );
    setProperties(updatedProperties);
    setChecking(false);
    
    const broken = updatedProperties.filter(p => p.hasBrokenImages).length;
    if (broken > 0) {
      toast.warning(`${broken} properties have broken images`);
    } else {
      toast.success('All images are working!');
    }
  };

  const handleImageUpload = async (propertyId, files) => {
    setUploading(prev => ({ ...prev, [propertyId]: true }));
    
    try {
      const uploadedUrls = [];
      
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await api.post('/upload/image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        uploadedUrls.push(response.data.url);
      }
      
      // Get current property
      const property = properties.find(p => p.id === propertyId);
      const existingImages = property?.images || [];
      
      // Filter out broken images and add new ones
      const workingImages = existingImages.filter(img => 
        img.startsWith('https://') || img.startsWith('/api/images/')
      );
      const newImages = [...workingImages, ...uploadedUrls];
      
      // Update property
      await api.put(`/admin/properties/${propertyId}`, {
        ...property,
        images: newImages
      });
      
      toast.success(`Uploaded ${uploadedUrls.length} images`);
      fetchProperties();
      
    } catch (error) {
      toast.error('Failed to upload images');
      console.error(error);
    } finally {
      setUploading(prev => ({ ...prev, [propertyId]: false }));
    }
  };

  const replaceAllWithExternal = async (propertyId) => {
    setUploading(prev => ({ ...prev, [propertyId]: true }));
    
    try {
      const property = properties.find(p => p.id === propertyId);
      const title = (property?.title || '').toLowerCase();
      
      // Select appropriate placeholder based on property type
      let placeholderImages;
      if (title.includes('1bhk') || title.includes('1 bhk')) {
        placeholderImages = [
          'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
          'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800'
        ];
      } else if (title.includes('2bhk') || title.includes('2 bhk')) {
        placeholderImages = [
          'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=800',
          'https://images.unsplash.com/photo-1565182999561-18d7dc61c393?w=800',
          'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800'
        ];
      } else if (title.includes('3bhk') || title.includes('3 bhk')) {
        placeholderImages = [
          'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
          'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
          'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800'
        ];
      } else {
        placeholderImages = [
          'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
          'https://images.unsplash.com/photo-1484154218962-a197022b25ba?w=800',
          'https://images.unsplash.com/photo-1560184897-ae75f418493e?w=800'
        ];
      }
      
      await api.put(`/admin/properties/${propertyId}`, {
        ...property,
        images: placeholderImages
      });
      
      toast.success('Replaced with stock images');
      fetchProperties();
      
    } catch (error) {
      toast.error('Failed to update images');
    } finally {
      setUploading(prev => ({ ...prev, [propertyId]: false }));
    }
  };

  const propertiesWithIssues = properties.filter(p => 
    p.hasBrokenImages || 
    !p.images || 
    p.images.length === 0 ||
    p.images.some(img => img.includes('/uploads/') && !img.includes('/api/images/'))
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl border-3 border-black w-full max-w-4xl max-h-[90vh] overflow-hidden"
        style={{ boxShadow: '8px 8px 0px 0px rgba(0,0,0,1)' }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-400 to-orange-500 p-4 border-b-3 border-black flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-black">Image Migration Tool</h2>
            <p className="text-sm text-black/70">Fix broken images in your properties</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-black/10 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Actions Bar */}
        <div className="p-4 border-b-2 border-gray-200 flex gap-3">
          <button
            onClick={checkAllImages}
            disabled={checking}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg font-bold border-2 border-black disabled:opacity-50"
            style={{ boxShadow: '3px 3px 0px 0px rgba(0,0,0,1)' }}
          >
            <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
            {checking ? 'Checking...' : 'Check All Images'}
          </button>
          <button
            onClick={fetchProperties}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 rounded-lg font-bold border-2 border-black"
            style={{ boxShadow: '3px 3px 0px 0px rgba(0,0,0,1)' }}
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-green-100 p-4 rounded-xl border-2 border-green-500">
                  <div className="text-2xl font-black text-green-700">{properties.length}</div>
                  <div className="text-sm text-green-600">Total Properties</div>
                </div>
                <div className="bg-red-100 p-4 rounded-xl border-2 border-red-500">
                  <div className="text-2xl font-black text-red-700">{propertiesWithIssues.length}</div>
                  <div className="text-sm text-red-600">Need Attention</div>
                </div>
                <div className="bg-blue-100 p-4 rounded-xl border-2 border-blue-500">
                  <div className="text-2xl font-black text-blue-700">
                    {properties.length - propertiesWithIssues.length}
                  </div>
                  <div className="text-sm text-blue-600">Images OK</div>
                </div>
              </div>

              {/* Properties List */}
              <div className="space-y-4">
                {properties.map((property) => {
                  const hasIssues = property.hasBrokenImages || 
                    !property.images || 
                    property.images.length === 0 ||
                    property.images.some(img => img.includes('/uploads/') && !img.includes('/api/images/'));
                  
                  return (
                    <div
                      key={property.id}
                      className={`p-4 rounded-xl border-2 ${
                        hasIssues ? 'border-red-400 bg-red-50' : 'border-green-400 bg-green-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {hasIssues ? (
                              <AlertTriangle className="w-5 h-5 text-red-500" />
                            ) : (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            )}
                            <h3 className="font-bold">{property.title}</h3>
                          </div>
                          
                          {/* Current Images */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            {(property.images || []).map((img, idx) => {
                              const status = property.imageStatuses?.[idx];
                              const isWorking = status?.working !== false;
                              
                              return (
                                <div
                                  key={idx}
                                  className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 ${
                                    isWorking ? 'border-green-400' : 'border-red-400'
                                  }`}
                                >
                                  <img
                                    src={getMediaUrl(img)}
                                    alt=""
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.target.src = 'https://via.placeholder.com/64?text=404';
                                    }}
                                  />
                                  {!isWorking && (
                                    <div className="absolute inset-0 bg-red-500/50 flex items-center justify-center">
                                      <AlertTriangle className="w-4 h-4 text-white" />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                            {(!property.images || property.images.length === 0) && (
                              <div className="text-sm text-gray-500 italic">No images</div>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2">
                          <label className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg font-bold text-sm cursor-pointer border-2 border-black hover:bg-blue-600 transition-colors">
                            <Upload className="w-4 h-4" />
                            {uploading[property.id] ? 'Uploading...' : 'Upload'}
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleImageUpload(property.id, Array.from(e.target.files))}
                              disabled={uploading[property.id]}
                            />
                          </label>
                          
                          <button
                            onClick={() => replaceAllWithExternal(property.id)}
                            disabled={uploading[property.id]}
                            className="flex items-center gap-2 px-3 py-2 bg-amber-500 text-black rounded-lg font-bold text-sm border-2 border-black hover:bg-amber-600 transition-colors disabled:opacity-50"
                          >
                            <Image className="w-4 h-4" />
                            Use Stock
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t-2 border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600">
            <strong>Tip:</strong> Click "Check All Images" to scan for broken images. Then either upload new images or use stock photos.
            All uploaded images are now stored permanently in MongoDB.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default ImageMigrationTool;
