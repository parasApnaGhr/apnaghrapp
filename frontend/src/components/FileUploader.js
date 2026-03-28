import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Video } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const FileUploader = ({ type = 'image', multiple = false, onUploadComplete, label }) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState([]);
  const fileInputRef = useRef(null);
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    const uploadedUrls = [];

    try {
      for (const file of files) {
        // Validate file type
        if (type === 'image' && !file.type.startsWith('image/')) {
          toast.error(`${file.name} is not an image file`);
          continue;
        }
        if (type === 'video' && !file.type.startsWith('video/')) {
          toast.error(`${file.name} is not a video file`);
          continue;
        }

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreview((prev) => [...prev, { url: e.target.result, name: file.name }]);
        };
        reader.readAsDataURL(file);

        // Upload to server
        const formData = new FormData();
        formData.append('file', file);

        const endpoint = type === 'image' ? '/api/upload/image' : '/api/upload/video';
        const token = localStorage.getItem('token');

        const response = await axios.post(`${BACKEND_URL}${endpoint}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        });

        const fullUrl = `${BACKEND_URL}${response.data.url}`;
        uploadedUrls.push(fullUrl);
      }

      toast.success(`${files.length} file(s) uploaded successfully!`);
      if (onUploadComplete) {
        onUploadComplete(multiple ? uploadedUrls : uploadedUrls[0]);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const removePreview = (index) => {
    setPreview((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-[#264653] mb-1.5">{label}</label>

      <div
        onClick={() => fileInputRef.current?.click()}
        className="proof-upload cursor-pointer"
        data-testid="file-upload-area"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={type === 'image' ? 'image/*' : 'video/*'}
          multiple={multiple}
          onChange={handleFileSelect}
          className="hidden"
        />

        {uploading ? (
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-[#E07A5F] border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-sm text-[#4A626C]">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            {type === 'image' ? (
              <ImageIcon className="w-12 h-12 text-[#E07A5F] mb-3" />
            ) : (
              <Video className="w-12 h-12 text-[#E07A5F] mb-3" />
            )}
            <p className="text-sm font-medium text-[#264653] mb-1">
              {type === 'image' ? 'Add Photos' : 'Add Video'}
            </p>
            <p className="text-xs text-[#4A626C]">
              Choose from gallery or camera
            </p>
          </div>
        )}
      </div>

      {preview.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {preview.map((item, index) => (
            <div key={index} className="relative group">
              {type === 'image' ? (
                <img
                  src={item.url}
                  alt={item.name}
                  className="w-full h-24 object-cover rounded-lg"
                />
              ) : (
                <video src={item.url} className="w-full h-24 object-cover rounded-lg" />
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removePreview(index);
                }}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUploader;