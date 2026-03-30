import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, Image, X, Plus, Trash2, Check, RefreshCw, 
  ChevronDown, ChevronUp, Video, Camera, FolderOpen,
  AlertCircle, CheckCircle2
} from 'lucide-react';
import api, { getMediaUrl } from '../utils/api';
import { toast } from 'sonner';

const BulkImageUploader = ({ onClose }) => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedProperty, setExpandedProperty] = useState(null);
  const [uploading, setUploading] = useState({});
  const [uploadProgress, setUploadProgress] = useState({});
  const fileInputRef = useRef({});
  const videoInputRef = useRef({});

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

  const handleMultipleImageUpload = async (propertyId, files) => {
    if (!files || files.length === 0) return;
    
    const fileArray = Array.from(files);
    setUploading(prev => ({ ...prev, [propertyId]: true }));
    setUploadProgress(prev => ({ ...prev, [propertyId]: { current: 0, total: fileArray.length } }));
    
    const uploadedUrls = [];
    
    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      
      try {
        setUploadProgress(prev => ({ 
          ...prev, 
          [propertyId]: { current: i + 1, total: fileArray.length, fileName: file.name } 
        }));
        
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await api.post('/upload/image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        uploadedUrls.push(response.data.url);
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
        toast.error(`Failed to upload ${file.name}`);
      }
    }
    
    if (uploadedUrls.length > 0) {
      try {
        const property = properties.find(p => p.id === propertyId);
        const existingImages = property?.images || [];
        const newImages = [...existingImages, ...uploadedUrls];
        
        await api.put(`/admin/properties/${propertyId}`, {
          ...property,
          images: newImages
        });
        
        toast.success(`Uploaded ${uploadedUrls.length} images successfully!`);
        fetchProperties();
      } catch (error) {
        toast.error('Failed to save images to property');
      }
    }
    
    setUploading(prev => ({ ...prev, [propertyId]: false }));
    setUploadProgress(prev => ({ ...prev, [propertyId]: null }));
  };

  const handleVideoUpload = async (propertyId, file) => {
    if (!file) return;
    
    setUploading(prev => ({ ...prev, [`${propertyId}_video`]: true }));
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const property = properties.find(p => p.id === propertyId);
      await api.put(`/admin/properties/${propertyId}`, {
        ...property,
        video_url: response.data.url
      });
      
      toast.success('Video uploaded successfully!');
      fetchProperties();
    } catch (error) {
      toast.error('Failed to upload video');
    } finally {
      setUploading(prev => ({ ...prev, [`${propertyId}_video`]: false }));
    }
  };

  const removeImage = async (propertyId, imageIndex) => {
    try {
      const property = properties.find(p => p.id === propertyId);
      const newImages = [...(property?.images || [])];
      newImages.splice(imageIndex, 1);
      
      await api.put(`/admin/properties/${propertyId}`, {
        ...property,
        images: newImages
      });
      
      toast.success('Image removed');
      fetchProperties();
    } catch (error) {
      toast.error('Failed to remove image');
    }
  };

  const removeVideo = async (propertyId) => {
    try {
      const property = properties.find(p => p.id === propertyId);
      await api.put(`/admin/properties/${propertyId}`, {
        ...property,
        video_url: null
      });
      
      toast.success('Video removed');
      fetchProperties();
    } catch (error) {
      toast.error('Failed to remove video');
    }
  };

  const getPropertyStatus = (property) => {
    const imageCount = (property.images || []).length;
    const hasVideo = !!property.video_url;
    
    if (imageCount >= 10 && hasVideo) return { status: 'complete', color: '#04473C', text: 'Complete' };
    if (imageCount >= 5) return { status: 'good', color: '#C6A87C', text: 'Good' };
    if (imageCount >= 1) return { status: 'partial', color: '#C6A87C', text: 'Needs More' };
    return { status: 'empty', color: '#8F2727', text: 'No Images' };
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="bg-[#04473C] p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-medium text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
                Bulk Image Uploader
              </h2>
              <p className="text-white/70 mt-1">Upload multiple property photos at once</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
          
          {/* Stats */}
          <div className="flex gap-6 mt-4 pt-4 border-t border-white/20">
            <div>
              <p className="text-white/60 text-xs uppercase tracking-wide">Properties</p>
              <p className="text-white text-xl font-medium">{properties.length}</p>
            </div>
            <div>
              <p className="text-white/60 text-xs uppercase tracking-wide">With Images</p>
              <p className="text-white text-xl font-medium">
                {properties.filter(p => (p.images || []).length > 0).length}
              </p>
            </div>
            <div>
              <p className="text-white/60 text-xs uppercase tracking-wide">Complete (10+ imgs)</p>
              <p className="text-white text-xl font-medium">
                {properties.filter(p => (p.images || []).length >= 10).length}
              </p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-[#C6A87C]/10 p-4 border-b border-[#E5E1DB]">
          <div className="flex items-start gap-3">
            <Camera className="w-5 h-5 text-[#C6A87C] mt-0.5" />
            <div>
              <p className="font-medium text-[#1A1C20]">How to upload:</p>
              <p className="text-sm text-[#4A4D53]">
                Click on a property → Click "Upload Images" → Select multiple photos (10-14 recommended per property)
              </p>
            </div>
          </div>
        </div>

        {/* Properties List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-[#04473C]" />
            </div>
          ) : (
            <div className="space-y-3">
              {properties.map((property) => {
                const isExpanded = expandedProperty === property.id;
                const status = getPropertyStatus(property);
                const imageCount = (property.images || []).length;
                const progress = uploadProgress[property.id];
                const isUploading = uploading[property.id];
                
                return (
                  <div
                    key={property.id}
                    className={`border transition-all ${
                      isExpanded ? 'border-[#04473C] bg-[#E6F0EE]' : 'border-[#E5E1DB] hover:border-[#D0C9C0]'
                    }`}
                  >
                    {/* Property Header */}
                    <div
                      className="p-4 cursor-pointer"
                      onClick={() => setExpandedProperty(isExpanded ? null : property.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: status.color }}
                          />
                          <div>
                            <h3 className="font-medium text-[#1A1C20]">{property.title}</h3>
                            <p className="text-sm text-[#4A4D53]">
                              {property.area_name} • {imageCount} images • {property.video_url ? '1 video' : 'No video'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span 
                            className="text-xs font-medium px-2 py-1"
                            style={{ backgroundColor: `${status.color}20`, color: status.color }}
                          >
                            {status.text}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-[#4A4D53]" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-[#4A4D53]" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-4 pt-0 border-t border-[#E5E1DB]">
                            {/* Upload Progress */}
                            {progress && (
                              <div className="mb-4 p-3 bg-[#04473C]/10 border border-[#04473C]/20">
                                <div className="flex items-center gap-2 mb-2">
                                  <RefreshCw className="w-4 h-4 animate-spin text-[#04473C]" />
                                  <span className="text-sm font-medium text-[#04473C]">
                                    Uploading {progress.current}/{progress.total}...
                                  </span>
                                </div>
                                <div className="h-2 bg-[#E5E1DB] overflow-hidden">
                                  <div 
                                    className="h-full bg-[#04473C] transition-all"
                                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                                  />
                                </div>
                                <p className="text-xs text-[#4A4D53] mt-1">{progress.fileName}</p>
                              </div>
                            )}

                            {/* Current Images */}
                            <div className="mb-4">
                              <p className="text-sm font-medium text-[#4A4D53] mb-2 uppercase tracking-wide">
                                Current Images ({imageCount})
                              </p>
                              {imageCount > 0 ? (
                                <div className="grid grid-cols-6 gap-2">
                                  {(property.images || []).map((img, idx) => (
                                    <div key={idx} className="relative aspect-square group">
                                      <img
                                        src={getMediaUrl(img)}
                                        alt=""
                                        className="w-full h-full object-cover border border-[#E5E1DB]"
                                        onError={(e) => e.target.src = 'https://via.placeholder.com/100?text=Error'}
                                      />
                                      <button
                                        onClick={() => removeImage(property.id, idx)}
                                        className="absolute top-1 right-1 p-1 bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        <X className="w-3 h-3 text-white" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-[#4A4D53] italic">No images uploaded yet</p>
                              )}
                            </div>

                            {/* Video */}
                            <div className="mb-4">
                              <p className="text-sm font-medium text-[#4A4D53] mb-2 uppercase tracking-wide">
                                Video
                              </p>
                              {property.video_url ? (
                                <div className="flex items-center gap-3">
                                  <div className="w-24 h-16 bg-[#1A1C20] flex items-center justify-center">
                                    <Video className="w-6 h-6 text-white" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm text-[#1A1C20] truncate">{property.video_url}</p>
                                    <button
                                      onClick={() => removeVideo(property.id)}
                                      className="text-xs text-red-500 hover:underline mt-1"
                                    >
                                      Remove video
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-sm text-[#4A4D53] italic">No video uploaded</p>
                              )}
                            </div>

                            {/* Upload Buttons */}
                            <div className="flex gap-3">
                              <input
                                type="file"
                                ref={el => fileInputRef.current[property.id] = el}
                                multiple
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleMultipleImageUpload(property.id, e.target.files)}
                              />
                              <button
                                onClick={() => fileInputRef.current[property.id]?.click()}
                                disabled={isUploading}
                                className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
                              >
                                {isUploading ? (
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Upload className="w-4 h-4" />
                                )}
                                {isUploading ? 'Uploading...' : 'Upload Images (Select Multiple)'}
                              </button>
                              
                              <input
                                type="file"
                                ref={el => videoInputRef.current[property.id] = el}
                                accept="video/*"
                                className="hidden"
                                onChange={(e) => handleVideoUpload(property.id, e.target.files[0])}
                              />
                              <button
                                onClick={() => videoInputRef.current[property.id]?.click()}
                                disabled={uploading[`${property.id}_video`]}
                                className="btn-secondary flex items-center gap-2 disabled:opacity-50"
                              >
                                <Video className="w-4 h-4" />
                                {uploading[`${property.id}_video`] ? 'Uploading...' : 'Upload Video'}
                              </button>
                            </div>

                            {/* Tip */}
                            <p className="text-xs text-[#4A4D53] mt-3">
                              💡 Tip: Select 10-14 images at once for best results. Hold Ctrl/Cmd to select multiple files.
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E5E1DB] bg-[#F5F3F0] flex justify-between items-center">
          <p className="text-sm text-[#4A4D53]">
            Images are stored permanently in MongoDB GridFS
          </p>
          <button onClick={onClose} className="btn-secondary">
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default BulkImageUploader;
