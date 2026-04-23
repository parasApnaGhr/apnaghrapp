// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Image, AlertTriangle, CheckCircle, RefreshCw, X, Plus, Eye, Folder, Video } from 'lucide-react';
import api, { getMediaUrl } from '../utils/api';
import { toast } from 'sonner';

const ImageMigrationTool = ({ onClose }) => {
  const [properties, setProperties] = useState([]);
  const [serverFiles, setServerFiles] = useState({ images: [], videos: [] });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState({});
  const [checking, setChecking] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [showFilePicker, setShowFilePicker] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);

  useEffect(() => {
    fetchProperties();
    fetchServerFiles();
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

  const fetchServerFiles = async () => {
    try {
      const response = await api.get('/admin/server-files');
      setServerFiles(response.data || { images: [], videos: [] });
    } catch (error) {
      console.log('Server files endpoint not available');
      // Fallback - hardcoded list of known files
      setServerFiles({
        images: [
          '/api/uploads/0e5a6efe-dbd5-4883-906e-50c50b29e861.png',
          '/api/uploads/488d5d4a-fdb3-4a83-8b52-a932a4532f46.jpeg',
          '/api/uploads/4ab2ad9f-d6bc-4a3f-a075-a15be5370f57.png',
          '/api/uploads/4d962f81-ecf0-4d6d-bb38-e8d450c769e6.jpg',
          '/api/uploads/59b10994-f834-488a-8368-a57f79cb32a9.jpg',
          '/api/uploads/6c4db423-80f2-4155-880a-d9068e24aa56.png',
          '/api/uploads/829c782f-d852-4a5a-9842-8fc05572e987.png',
          '/api/uploads/aea76eec-0c61-4a71-abc8-2b55185d417d.jpg',
          '/api/uploads/e8b5809c-655c-42d1-b30e-3bf3556a0eba.png',
          '/api/uploads/edaea7c1-53f6-460a-8772-18c59085f176.png'
        ],
        videos: [
          '/api/uploads/77d63aef-40c8-40e8-8e9d-38b8b84cfc21.mp4',
          '/api/uploads/b9b467af-bcee-4a49-b60b-46a241175a17.mp4',
          '/api/uploads/explainer_video.mp4'
        ]
      });
    }
  };

  const checkImageStatus = async (imageUrl) => {
    if (!imageUrl) return false;
    if (imageUrl.startsWith('https://images.unsplash.com')) return true;
    if (imageUrl.startsWith('https://images.pexels.com')) return true;
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
      
      const property = properties.find(p => p.id === propertyId);
      const existingImages = property?.images || [];
      const newImages = [...existingImages, ...uploadedUrls];
      
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

  const addServerFileToProperty = async (propertyId, fileUrl) => {
    try {
      const property = properties.find(p => p.id === propertyId);
      const existingImages = property?.images || [];
      
      // Check if already added
      if (existingImages.includes(fileUrl)) {
        toast.info('Image already added to this property');
        return;
      }
      
      const newImages = [...existingImages, fileUrl];
      
      await api.put(`/admin/properties/${propertyId}`, {
        ...property,
        images: newImages
      });
      
      toast.success('Image added to property');
      fetchProperties();
      setShowFilePicker(false);
      
    } catch (error) {
      toast.error('Failed to add image');
    }
  };

  const setPropertyVideo = async (propertyId, videoUrl) => {
    try {
      const property = properties.find(p => p.id === propertyId);
      
      await api.put(`/admin/properties/${propertyId}`, {
        ...property,
        video_url: videoUrl
      });
      
      toast.success('Video added to property');
      fetchProperties();
      setShowFilePicker(false);
      
    } catch (error) {
      toast.error('Failed to add video');
    }
  };

  const removeImageFromProperty = async (propertyId, imageIndex) => {
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

  const replaceAllWithExternal = async (propertyId) => {
    setUploading(prev => ({ ...prev, [propertyId]: true }));
    
    try {
      const property = properties.find(p => p.id === propertyId);
      const title = (property?.title || '').toLowerCase();
      
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

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-5xl max-h-[90vh] overflow-hidden border border-[var(--stitch-line)]"
      >
        {/* Header */}
        <div className="bg-[var(--stitch-ink)] p-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-medium text-white" >
              Image & Video Manager
            </h2>
            <p className="text-sm text-white/70">Restore your original uploads or add new images</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Server Files Section */}
        <div className="p-4 bg-[var(--stitch-muted)]/10 border-b border-[var(--stitch-line)]">
          <div className="flex items-center gap-2 mb-3">
            <Folder className="w-5 h-5 text-[var(--stitch-muted)]" />
            <h3 className="font-medium text-[var(--stitch-ink)]">Your Original Uploads ({serverFiles.images.length} images, {serverFiles.videos.length} videos)</h3>
          </div>
          <div className="flex gap-2 flex-wrap">
            {serverFiles.images.slice(0, 6).map((img, idx) => (
              <div 
                key={idx}
                className="w-16 h-16 border border-[var(--stitch-line)] overflow-hidden cursor-pointer hover:ring-2 ring-[var(--stitch-ink)] transition-all"
                onClick={() => setPreviewFile({ url: img, type: 'image' })}
              >
                <img 
                  src={getMediaUrl(img)} 
                  alt="" 
                  className="w-full h-full object-cover"
                  onError={(e) => e.target.src = 'https://via.placeholder.com/64?text=?'}
                />
              </div>
            ))}
            {serverFiles.images.length > 6 && (
              <div className="w-16 h-16 bg-[var(--stitch-soft)] border border-[var(--stitch-line)] flex items-center justify-center text-sm font-medium text-[var(--stitch-muted)]">
                +{serverFiles.images.length - 6}
              </div>
            )}
            {serverFiles.videos.map((vid, idx) => (
              <div 
                key={`vid-${idx}`}
                className="w-16 h-16 bg-[var(--stitch-ink)] border border-[var(--stitch-line)] flex items-center justify-center cursor-pointer hover:ring-2 ring-[var(--stitch-ink)] transition-all"
                onClick={() => setPreviewFile({ url: vid, type: 'video' })}
              >
                <Video className="w-6 h-6 text-white" />
              </div>
            ))}
          </div>
          <p className="text-xs text-[var(--stitch-muted)] mt-2">
            Click on any property below, then use "Add from Server" to restore your original images
          </p>
        </div>

        {/* Actions Bar */}
        <div className="p-4 border-b border-[var(--stitch-line)] flex gap-3">
          <button
            onClick={checkAllImages}
            disabled={checking}
            className="stitch-button stitch-button-secondary flex items-center gap-2 text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
            {checking ? 'Checking...' : 'Check Images'}
          </button>
          <button
            onClick={fetchProperties}
            className="px-4 py-2 border border-[var(--stitch-line)] hover:bg-[var(--stitch-soft)] flex items-center gap-2 text-sm font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Properties List */}
        <div className="p-4 overflow-y-auto max-h-[50vh]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-[var(--stitch-ink)]" />
            </div>
          ) : (
            <div className="space-y-4">
              {properties.map((property) => {
                const hasIssues = property.hasBrokenImages || !property.images || property.images.length === 0;
                const isSelected = selectedProperty === property.id;
                
                return (
                  <div
                    key={property.id}
                    className={`p-4 border transition-all cursor-pointer ${
                      isSelected 
                        ? 'border-[var(--stitch-ink)] bg-[var(--stitch-soft)]' 
                        : hasIssues 
                          ? 'border-[var(--stitch-muted)] bg-[var(--stitch-muted)]/5' 
                          : 'border-[var(--stitch-line)] hover:border-[var(--stitch-muted)]'
                    }`}
                    onClick={() => setSelectedProperty(isSelected ? null : property.id)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {hasIssues ? (
                            <AlertTriangle className="w-4 h-4 text-[var(--stitch-muted)]" />
                          ) : (
                            <CheckCircle className="w-4 h-4 text-[var(--stitch-ink)]" />
                          )}
                          <h3 className="font-medium text-[var(--stitch-ink)]">{property.title}</h3>
                          <span className="text-xs text-[var(--stitch-muted)]">({(property.images || []).length} images)</span>
                        </div>
                        
                        {/* Current Images */}
                        <div className="flex flex-wrap gap-2">
                          {(property.images || []).map((img, idx) => {
                            const status = property.imageStatuses?.[idx];
                            const isWorking = status?.working !== false;
                            
                            return (
                              <div
                                key={idx}
                                className={`relative w-14 h-14 overflow-hidden border ${
                                  isWorking ? 'border-[var(--stitch-ink)]' : 'border-[var(--stitch-muted)]'
                                }`}
                              >
                                <img
                                  src={getMediaUrl(img)}
                                  alt=""
                                  className="w-full h-full object-cover"
                                  onError={(e) => e.target.src = 'https://via.placeholder.com/56?text=404'}
                                />
                                {isSelected && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeImageFromProperty(property.id, idx);
                                    }}
                                    className="absolute top-0 right-0 bg-red-500 p-0.5"
                                  >
                                    <X className="w-3 h-3 text-white" />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                          {(!property.images || property.images.length === 0) && (
                            <span className="text-sm text-[var(--stitch-muted)] italic">No images</span>
                          )}
                        </div>
                        
                        {/* Video */}
                        {property.video_url && (
                          <div className="mt-2 flex items-center gap-2 text-xs text-[var(--stitch-muted)]">
                            <Video className="w-3 h-3" />
                            Has video
                          </div>
                        )}
                      </div>

                      {/* Actions - Show when selected */}
                      {isSelected && (
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowFilePicker(true);
                            }}
                            className="stitch-button text-xs px-3 py-2 flex items-center gap-1"
                          >
                            <Folder className="w-3 h-3" />
                            Add from Server
                          </button>
                          
                          <label className="stitch-button stitch-button-secondary text-xs px-3 py-2 flex items-center gap-1 cursor-pointer">
                            <Upload className="w-3 h-3" />
                            {uploading[property.id] ? 'Uploading...' : 'Upload New'}
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              className="hidden"
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleImageUpload(property.id, Array.from(e.target.files));
                              }}
                              disabled={uploading[property.id]}
                            />
                          </label>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              replaceAllWithExternal(property.id);
                            }}
                            disabled={uploading[property.id]}
                            className="text-xs px-3 py-2 border border-[var(--stitch-line)] hover:bg-[var(--stitch-soft)] flex items-center gap-1"
                          >
                            <Image className="w-3 h-3" />
                            Use Stock
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--stitch-line)] bg-[var(--stitch-soft)]">
          <p className="text-xs text-[var(--stitch-muted)]">
            <strong>How to restore:</strong> Click on a property → Click "Add from Server" → Select your original images from the picker
          </p>
        </div>
      </motion.div>

      {/* File Picker Modal */}
      <AnimatePresence>
        {showFilePicker && selectedProperty && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4"
            onClick={() => setShowFilePicker(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white w-full max-w-2xl max-h-[80vh] overflow-hidden border border-[var(--stitch-line)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-[var(--stitch-ink)] p-4 flex items-center justify-between">
                <h3 className="text-lg font-medium text-white">Select from Your Uploads</h3>
                <button onClick={() => setShowFilePicker(false)} className="p-1 hover:bg-white/10">
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
              
              <div className="p-4 overflow-y-auto max-h-[60vh]">
                <h4 className="font-medium text-sm text-[var(--stitch-muted)] mb-3 uppercase tracking-wide">Images</h4>
                <div className="grid grid-cols-4 gap-3 mb-6">
                  {serverFiles.images.map((img, idx) => (
                    <div
                      key={idx}
                      className="aspect-square border border-[var(--stitch-line)] overflow-hidden cursor-pointer hover:ring-2 ring-[var(--stitch-ink)] transition-all group relative"
                      onClick={() => addServerFileToProperty(selectedProperty, img)}
                    >
                      <img 
                        src={getMediaUrl(img)} 
                        alt="" 
                        className="w-full h-full object-cover"
                        onError={(e) => e.target.src = 'https://via.placeholder.com/100?text=?'}
                      />
                      <div className="absolute inset-0 bg-[var(--stitch-ink)]/0 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                        <Plus className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  ))}
                </div>
                
                <h4 className="font-medium text-sm text-[var(--stitch-muted)] mb-3 uppercase tracking-wide">Videos</h4>
                <div className="grid grid-cols-4 gap-3">
                  {serverFiles.videos.map((vid, idx) => (
                    <div
                      key={idx}
                      className="aspect-square bg-[var(--stitch-ink)] border border-[var(--stitch-line)] overflow-hidden cursor-pointer hover:ring-2 ring-[var(--stitch-ink)] transition-all group relative flex items-center justify-center"
                      onClick={() => setPropertyVideo(selectedProperty, vid)}
                    >
                      <Video className="w-8 h-8 text-white" />
                      <div className="absolute inset-0 bg-[var(--stitch-ink)]/0 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                        <Plus className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <span className="absolute bottom-1 left-1 right-1 text-[8px] text-white/70 truncate">
                        {vid.split('/').pop()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewFile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-[70] flex items-center justify-center p-4"
            onClick={() => setPreviewFile(null)}
          >
            <button className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20">
              <X className="w-6 h-6 text-white" />
            </button>
            {previewFile.type === 'image' ? (
              <img 
                src={getMediaUrl(previewFile.url)} 
                alt="" 
                className="max-w-[90vw] max-h-[85vh] object-contain"
              />
            ) : (
              <video 
                src={getMediaUrl(previewFile.url)} 
                controls 
                className="max-w-[90vw] max-h-[85vh]"
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ImageMigrationTool;
