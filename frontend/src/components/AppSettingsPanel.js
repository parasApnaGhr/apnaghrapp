import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import { Video, Upload, Check, Trash2, Play, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const AppSettingsPanel = () => {
  const [explainerVideo, setExplainerVideo] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadExplainerVideo();
  }, []);

  const loadExplainerVideo = async () => {
    try {
      const response = await api.get('/settings/explainer-video');
      if (response.data.video_url) {
        setExplainerVideo(response.data.video_url);
      }
    } catch (error) {
      console.log('No explainer video set');
    }
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast.error('Please select a video file');
      return;
    }

    // Validate file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      toast.error('Video must be less than 100MB');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/upload/explainer-video', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        }
      });

      setExplainerVideo(response.data.url);
      toast.success('Explainer video uploaded successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to upload video');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemoveVideo = async () => {
    // For now, just clear the UI - in production you'd also delete from storage
    try {
      await api.post('/settings/explainer-video', { video_url: null });
      setExplainerVideo(null);
      toast.success('Video removed');
    } catch (error) {
      // Even if API fails, clear UI
      setExplainerVideo(null);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Outfit' }}>App Settings</h2>

      {/* Explainer Video Section */}
      <div className="bg-white rounded-xl border border-[#E5E3D8] p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-[#E07A5F]/10 rounded-lg flex items-center justify-center">
            <Video className="w-5 h-5 text-[#E07A5F]" />
          </div>
          <div>
            <h3 className="font-bold">How It Works Video</h3>
            <p className="text-sm text-[#4A626C]">This video appears on property detail pages</p>
          </div>
        </div>

        {explainerVideo ? (
          <div className="space-y-4">
            {/* Video Preview */}
            <div className="bg-black rounded-xl overflow-hidden aspect-video">
              <video 
                controls 
                className="w-full h-full"
                src={explainerVideo}
              >
                Your browser does not support the video tag.
              </video>
            </div>

            {/* Video Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 btn-secondary flex items-center justify-center gap-2"
                data-testid="replace-video-button"
              >
                <Upload className="w-4 h-4" />
                Replace Video
              </button>
              <button
                onClick={handleRemoveVideo}
                className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 flex items-center gap-2"
                data-testid="remove-video-button"
              >
                <Trash2 className="w-4 h-4" />
                Remove
              </button>
            </div>

            <div className="flex items-center gap-2 text-sm text-[#2A9D8F]">
              <Check className="w-4 h-4" />
              Video is live and visible to customers
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Upload Area */}
            <div 
              onClick={() => !uploading && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition ${
                uploading 
                  ? 'border-[#E07A5F] bg-[#FFF5F2]' 
                  : 'border-[#E5E3D8] hover:border-[#E07A5F] hover:bg-[#FFF5F2]'
              }`}
              data-testid="upload-video-area"
            >
              {uploading ? (
                <div>
                  <div className="w-16 h-16 mx-auto mb-4 relative">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="#E5E3D8"
                        strokeWidth="4"
                        fill="none"
                      />
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="#E07A5F"
                        strokeWidth="4"
                        fill="none"
                        strokeDasharray={`${uploadProgress * 1.76} 176`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-[#E07A5F]">
                      {uploadProgress}%
                    </span>
                  </div>
                  <p className="font-medium text-[#264653]">Uploading video...</p>
                  <p className="text-sm text-[#4A626C] mt-1">Please wait</p>
                </div>
              ) : (
                <div>
                  <div className="w-16 h-16 bg-[#E07A5F]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-8 h-8 text-[#E07A5F]" />
                  </div>
                  <p className="font-medium text-[#264653]">Click to upload explainer video</p>
                  <p className="text-sm text-[#4A626C] mt-1">MP4, MOV, or WebM • Max 100MB</p>
                </div>
              )}
            </div>

            {/* Info Box */}
            <div className="bg-[#F0FDF9] rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[#2A9D8F] flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-[#264653]">Video Recommendations:</p>
                <ul className="text-[#4A626C] mt-1 space-y-1">
                  <li>• 16:9 aspect ratio (landscape)</li>
                  <li>• 1-2 minutes duration</li>
                  <li>• Explain visit booking, OTP verification, and rider role</li>
                  <li>• Mention that negotiations are handled by ApnaGhr team</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleVideoUpload}
          className="hidden"
          data-testid="video-file-input"
        />
      </div>

      {/* Other Settings Placeholder */}
      <div className="bg-white rounded-xl border border-[#E5E3D8] p-6">
        <h3 className="font-bold mb-4">Other Settings</h3>
        <p className="text-[#4A626C] text-sm">More settings coming soon...</p>
      </div>
    </div>
  );
};

export default AppSettingsPanel;
