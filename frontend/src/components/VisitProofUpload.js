import React, { useState } from 'react';
import { Camera, Video, Upload, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const VisitProofUpload = ({ visitId, onComplete }) => {
  const [uploading, setUploading] = useState(false);
  const [selfiePreview, setSelfiePreview] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [selfieFile, setSelfieFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  const handleSelfieSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelfieFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setSelfiePreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      toast.error('Please select an image file');
    }
  };

  const handleVideoSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setVideoPreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      toast.error('Please select a video file');
    }
  };

  const handleUpload = async () => {
    if (!selfieFile || !videoFile) {
      toast.error('Please capture both selfie and property video');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('selfie', selfieFile);
      formData.append('video', videoFile);

      const token = localStorage.getItem('token');
      await axios.post(
        `${BACKEND_URL}/api/visits/${visitId}/upload-proof`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success('Visit proof uploaded successfully!');
      if (onComplete) onComplete();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold" style={{ fontFamily: 'Outfit' }}>
        Upload Visit Proof
      </h3>

      {/* Selfie Upload */}
      <div>
        <label className="block text-sm font-medium text-[#264653] mb-2">
          Selfie with Customer
        </label>
        <div className="proof-upload">
          <input
            type="file"
            accept="image/*"
            capture="user"
            onChange={handleSelfieSelect}
            className="hidden"
            id="selfie-input"
          />
          {selfiePreview ? (
            <div className="relative">
              <img
                src={selfiePreview}
                alt="Selfie preview"
                className="w-full h-48 object-cover rounded-lg"
              />
              <label
                htmlFor="selfie-input"
                className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition cursor-pointer"
              >
                <Camera className="w-8 h-8 text-white" />
              </label>
            </div>
          ) : (
            <label htmlFor="selfie-input" className="cursor-pointer block">
              <div className="flex flex-col items-center py-8">
                <Camera className="w-12 h-12 text-[#E07A5F] mb-3" />
                <p className="text-sm font-medium text-[#264653]">Take Selfie with Customer</p>
                <p className="text-xs text-[#4A626C] mt-1">Tap to open camera</p>
              </div>
            </label>
          )}
        </div>
      </div>

      {/* Video Upload */}
      <div>
        <label className="block text-sm font-medium text-[#264653] mb-2">
          Property Video (10-15 seconds)
        </label>
        <div className="proof-upload">
          <input
            type="file"
            accept="video/*"
            capture="environment"
            onChange={handleVideoSelect}
            className="hidden"
            id="video-input"
          />
          {videoPreview ? (
            <div className="relative">
              <video
                src={videoPreview}
                controls
                className="w-full h-48 object-cover rounded-lg"
              />
              <label
                htmlFor="video-input"
                className="absolute top-2 right-2 bg-white/90 p-2 rounded-lg cursor-pointer"
              >
                <Video className="w-5 h-5 text-[#E07A5F]" />
              </label>
            </div>
          ) : (
            <label htmlFor="video-input" className="cursor-pointer block">
              <div className="flex flex-col items-center py-8">
                <Video className="w-12 h-12 text-[#E07A5F] mb-3" />
                <p className="text-sm font-medium text-[#264653]">Record Property Video</p>
                <p className="text-xs text-[#4A626C] mt-1">10-15 seconds walkthrough</p>
              </div>
            </label>
          )}
        </div>
      </div>

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={uploading || !selfieFile || !videoFile}
        className="btn-primary w-full flex items-center justify-center gap-2"
        data-testid="upload-proof-button"
      >
        {uploading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Uploading...
          </>
        ) : (
          <>
            <CheckCircle className="w-5 h-5" />
            Upload Proof & Complete Visit
          </>
        )}
      </button>

      <div className="bg-[#FFF5F2] rounded-lg p-4 text-sm text-[#4A626C]">
        <p className="font-medium text-[#E07A5F] mb-2">Requirements:</p>
        <ul className="space-y-1">
          <li>• Selfie must clearly show you and the customer</li>
          <li>• Video should be 10-15 seconds</li>
          <li>• Show all main areas of the property</li>
          <li>• Ensure good lighting</li>
        </ul>
      </div>
    </div>
  );
};

export default VisitProofUpload;
