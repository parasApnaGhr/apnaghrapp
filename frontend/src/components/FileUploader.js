import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Video, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

// Compress image before upload
const compressImage = (file, maxWidth = 1920, quality = 0.8) => {
  return new Promise((resolve) => {
    // Skip if file is small (under 500KB) or not an image
    if (file.size < 500 * 1024 || !file.type.startsWith('image/')) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Resize if too large
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            console.log(`Compressed: ${(file.size/1024).toFixed(0)}KB -> ${(compressedFile.size/1024).toFixed(0)}KB`);
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};

const FileUploader = ({ type = 'image', multiple = false, onUploadComplete, label }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [preview, setPreview] = useState([]);
  const fileInputRef = useRef(null);
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);
    const uploadedUrls = [];
    let completed = 0;

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

        // Compress image before upload
        let fileToUpload = file;
        if (type === 'image') {
          toast.info(`Compressing ${file.name}...`);
          fileToUpload = await compressImage(file);
        }

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreview((prev) => [...prev, { url: e.target.result, name: file.name }]);
        };
        reader.readAsDataURL(fileToUpload);

        // Upload to server with timeout and progress
        const formData = new FormData();
        formData.append('file', fileToUpload);

        const endpoint = type === 'image' ? '/api/upload/image' : '/api/upload/video';
        const token = localStorage.getItem('token');

        try {
          const response = await axios.post(`${BACKEND_URL}${endpoint}`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
              Authorization: `Bearer ${token}`,
            },
            timeout: 120000, // 2 minute timeout
            onUploadProgress: (progressEvent) => {
              const percentCompleted = Math.round(
                ((completed + progressEvent.loaded / progressEvent.total) / files.length) * 100
              );
              setUploadProgress(percentCompleted);
            },
          });

          const fullUrl = `${BACKEND_URL}${response.data.url}`;
          uploadedUrls.push(fullUrl);
          completed++;
          toast.success(`Uploaded ${file.name}`);
        } catch (uploadError) {
          console.error('Upload error:', uploadError);
          if (uploadError.code === 'ECONNABORTED') {
            toast.error(`Upload timeout for ${file.name}. Try a smaller image.`);
          } else {
            toast.error(`Failed to upload ${file.name}`);
          }
        }
      }

      if (uploadedUrls.length > 0) {
        if (onUploadComplete) {
          onUploadComplete(multiple ? uploadedUrls : uploadedUrls[0]);
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
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
            <div className="w-12 h-12 border-4 border-[#04473C] border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-sm text-[#4A626C] mb-2">Uploading... {uploadProgress}%</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-[#04473C] h-2 rounded-full transition-all duration-300" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-xs text-[#4A626C] mt-2">Please wait, do not close this page</p>
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