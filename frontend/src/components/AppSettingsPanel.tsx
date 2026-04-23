// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Video, Upload, Check, Trash2, AlertCircle, Settings, 
  Sparkles, Calendar, Gift, Palette, Sun, Moon, PartyPopper,
  Heart, Flower2, Star, Zap, Crown, Flame, Snowflake
} from 'lucide-react';
import { toast } from 'sonner';

const AppSettingsPanel = () => {
  const [explainerVideo, setExplainerVideo] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [appSettings, setAppSettings] = useState({
    seasonal_theme: 'none',
    seasonal_banner_text: '',
    seasonal_discount_percent: 0,
    seasonal_active: false,
    homepage_highlight: '',
    accent_color: 'var(--stitch-ink)',
    enable_animations: true,
    show_offers_badge: false
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const fileInputRef = useRef(null);

  const seasonalThemes = [
    { id: 'none', label: 'No Theme', icon: Settings, color: 'var(--stitch-muted)', description: 'Standard platform appearance', defaultBanner: '' },
    { id: 'holi', label: 'Holi Festival', icon: Palette, color: 'var(--stitch-ink)', description: 'Colorful Holi celebrations with splash effects', defaultBanner: '🎨 Happy Holi! Splash into savings - Book visits at special rates!' },
    { id: 'diwali', label: 'Diwali', icon: Sparkles, color: 'var(--stitch-muted)', description: 'Festive lights and diyas', defaultBanner: '🪔 Diwali Dhamaka! Light up your new home search with festive discounts!' },
    { id: 'new_year', label: 'New Year', icon: PartyPopper, color: 'var(--stitch-ink)', description: 'Celebrate the new year', defaultBanner: '🎉 New Year, New Home! Start 2026 with amazing property deals!' },
    { id: 'valentine', label: "Valentine's Day", icon: Heart, color: 'var(--stitch-ink)', description: 'Love is in the air', defaultBanner: '💕 Fall in love with your dream home this Valentine\'s!' },
    { id: 'summer', label: 'Summer Sale', icon: Sun, color: 'var(--stitch-muted)', description: 'Hot summer deals', defaultBanner: '☀️ Summer Sale! Hot deals on property visits - Beat the heat!' },
    { id: 'monsoon', label: 'Monsoon Offers', icon: Flower2, color: 'var(--stitch-ink)', description: 'Rainy season specials', defaultBanner: '🌧️ Monsoon Magic! Rainy season discounts on all visits!' },
    { id: 'christmas', label: 'Christmas', icon: Gift, color: 'var(--stitch-ink)', description: 'Holiday season magic', defaultBanner: '🎄 Christmas Special! Gift yourself a new home this holiday!' },
    { id: 'independence', label: 'Independence Day', icon: Star, color: 'var(--stitch-muted)', description: 'Patriotic celebrations', defaultBanner: '🇮🇳 Azadi Sale! Freedom to find your dream home at best prices!' },
    { id: 'navratri', label: 'Navratri', icon: Crown, color: 'var(--stitch-ink)', description: 'Nine nights of celebration', defaultBanner: '🙏 Navratri Special! 9 days of divine deals on property visits!' },
    { id: 'winter', label: 'Winter Warmth', icon: Snowflake, color: 'var(--stitch-ink)', description: 'Cozy winter deals', defaultBanner: '❄️ Winter Warmth! Cozy up to great deals on your new home!' }
  ];

  useEffect(() => {
    loadExplainerVideo();
    loadAppSettings();
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

  const loadAppSettings = async () => {
    try {
      const response = await api.get('/settings/app-customization');
      if (response.data) {
        setAppSettings(prev => ({ ...prev, ...response.data }));
      }
    } catch (error) {
      console.log('Using default app settings');
    }
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast.error('Please select a video file');
      return;
    }

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
    try {
      await api.post('/settings/explainer-video', { video_url: null });
      setExplainerVideo(null);
      toast.success('Video removed');
    } catch (error) {
      setExplainerVideo(null);
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await api.post('/settings/app-customization', appSettings);
      toast.success('App customization settings saved!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleThemeSelect = (themeId) => {
    const theme = seasonalThemes.find(t => t.id === themeId);
    setAppSettings(prev => ({
      ...prev,
      seasonal_theme: themeId,
      seasonal_active: themeId !== 'none',
      seasonal_banner_text: theme?.defaultBanner || '',
      accent_color: theme?.color || 'var(--stitch-ink)'
    }));
  };

  const getActiveTheme = () => seasonalThemes.find(t => t.id === appSettings.seasonal_theme);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit' }}>App Settings & Customization</h2>

      {/* Seasonal Theme Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-[var(--stitch-line)] shadow-[4px_4px_0px_var(--stitch-ink)] p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-[var(--stitch-muted)] to-[var(--stitch-ink)] rounded-xl flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Seasonal Customization</h3>
            <p className="text-sm text-[var(--stitch-muted)]">Transform the app for festivals & special occasions</p>
          </div>
          {appSettings.seasonal_active && (
            <span className="ml-auto px-3 py-1 bg-[var(--stitch-ink)] text-white text-xs font-bold rounded-full animate-pulse">
              LIVE
            </span>
          )}
        </div>

        {/* Theme Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
          {seasonalThemes.map((theme) => {
            const Icon = theme.icon;
            const isSelected = appSettings.seasonal_theme === theme.id;
            return (
              <motion.button
                key={theme.id}
                onClick={() => handleThemeSelect(theme.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  isSelected
                    ? 'border-[var(--stitch-ink)] shadow-[3px_3px_0px_var(--stitch-ink)]'
                    : 'border-[var(--stitch-line)] hover:border-[var(--stitch-ink)]'
                }`}
                style={{ backgroundColor: isSelected ? `${theme.color}20` : 'white' }}
                data-testid={`theme-${theme.id}`}
              >
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-2"
                  style={{ backgroundColor: `${theme.color}20` }}
                >
                  <Icon className="w-5 h-5" style={{ color: theme.color }} />
                </div>
                <div className="font-bold text-sm">{theme.label}</div>
                <div className="text-xs text-[var(--stitch-muted)] mt-1 line-clamp-2">{theme.description}</div>
                {isSelected && (
                  <div className="mt-2 flex items-center gap-1 text-xs font-medium" style={{ color: theme.color }}>
                    <Check className="w-3 h-3" />
                    Active
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Theme Settings */}
        <AnimatePresence>
          {appSettings.seasonal_theme !== 'none' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-[var(--stitch-line)] pt-6 space-y-4"
            >
              <div className="grid md:grid-cols-2 gap-4">
                {/* Banner Text */}
                <div>
                  <label className="block text-sm font-bold mb-2">
                    <Gift className="w-4 h-4 inline mr-1" />
                    Banner Message
                  </label>
                  <input
                    type="text"
                    value={appSettings.seasonal_banner_text}
                    onChange={(e) => setAppSettings({ ...appSettings, seasonal_banner_text: e.target.value })}
                    placeholder={`e.g., "Happy ${getActiveTheme()?.label || 'Festival'}! Special offers inside"`}
                    className="w-full px-4 py-3 border border-[var(--stitch-line)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--stitch-muted)]"
                    data-testid="banner-text-input"
                  />
                </div>

                {/* Discount Percent */}
                <div>
                  <label className="block text-sm font-bold mb-2">
                    <Zap className="w-4 h-4 inline mr-1" />
                    Special Discount (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={appSettings.seasonal_discount_percent}
                    onChange={(e) => setAppSettings({ ...appSettings, seasonal_discount_percent: parseInt(e.target.value) || 0 })}
                    placeholder="e.g., 10"
                    className="w-full px-4 py-3 border border-[var(--stitch-line)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--stitch-muted)]"
                    data-testid="discount-input"
                  />
                </div>
              </div>

              {/* Homepage Highlight */}
              <div>
                <label className="block text-sm font-bold mb-2">
                  <Star className="w-4 h-4 inline mr-1" />
                  Homepage Highlight Text
                </label>
                <input
                  type="text"
                  value={appSettings.homepage_highlight}
                  onChange={(e) => setAppSettings({ ...appSettings, homepage_highlight: e.target.value })}
                  placeholder="e.g., 'Book visits at just ₹180 this Holi!'"
                  className="w-full px-4 py-3 border border-[var(--stitch-line)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--stitch-muted)]"
                  data-testid="highlight-input"
                />
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className={`w-12 h-7 rounded-full transition-colors relative ${
                    appSettings.enable_animations ? 'bg-[var(--stitch-ink)]' : 'bg-[var(--stitch-line)]'
                  }`}>
                    <input
                      type="checkbox"
                      checked={appSettings.enable_animations}
                      onChange={(e) => setAppSettings({ ...appSettings, enable_animations: e.target.checked })}
                      className="sr-only"
                      data-testid="animations-toggle"
                    />
                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      appSettings.enable_animations ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </div>
                  <span className="font-medium">Festive Animations</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <div className={`w-12 h-7 rounded-full transition-colors relative ${
                    appSettings.show_offers_badge ? 'bg-[var(--stitch-ink)]' : 'bg-[var(--stitch-line)]'
                  }`}>
                    <input
                      type="checkbox"
                      checked={appSettings.show_offers_badge}
                      onChange={(e) => setAppSettings({ ...appSettings, show_offers_badge: e.target.checked })}
                      className="sr-only"
                      data-testid="offers-badge-toggle"
                    />
                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      appSettings.show_offers_badge ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </div>
                  <span className="font-medium">Show Offers Badge</span>
                </label>
              </div>

              {/* Preview */}
              <div className="bg-[var(--stitch-soft)] rounded-xl p-4 border border-[var(--stitch-line)]">
                <p className="text-sm font-bold mb-2">Preview:</p>
                <div 
                  className="rounded-lg p-4 text-white text-center font-bold"
                  style={{ backgroundColor: getActiveTheme()?.color || 'var(--stitch-ink)' }}
                >
                  {appSettings.seasonal_banner_text || `🎉 ${getActiveTheme()?.label || 'Festival'} Special - Book Now!`}
                  {appSettings.seasonal_discount_percent > 0 && (
                    <span className="ml-2 bg-white/20 px-2 py-1 rounded text-sm">
                      {appSettings.seasonal_discount_percent}% OFF
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Save Button */}
        <div className="mt-6 pt-4 border-t border-[var(--stitch-line)]">
          <motion.button
            onClick={handleSaveSettings}
            disabled={savingSettings}
            whileHover={{ scale: savingSettings ? 1 : 1.02 }}
            whileTap={{ scale: savingSettings ? 1 : 0.98 }}
            className="stitch-button w-full flex items-center justify-center gap-2"
            data-testid="save-settings-button"
          >
            {savingSettings ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                Save Customization Settings
              </>
            )}
          </motion.button>
        </div>
      </motion.div>

      {/* Explainer Video Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl border border-[var(--stitch-line)] shadow-[4px_4px_0px_var(--stitch-ink)] p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-[var(--stitch-ink)]/10 rounded-lg flex items-center justify-center">
            <Video className="w-5 h-5 text-[var(--stitch-ink)]" />
          </div>
          <div>
            <h3 className="font-bold">How It Works Video</h3>
            <p className="text-sm text-[var(--stitch-muted)]">This video appears on property detail pages</p>
          </div>
        </div>

        {explainerVideo ? (
          <div className="space-y-4">
            <div className="bg-black rounded-xl overflow-hidden aspect-video">
              <video 
                controls 
                className="w-full h-full"
                src={explainerVideo}
              >
                Your browser does not support the video tag.
              </video>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 stitch-button stitch-button-secondary flex items-center justify-center gap-2"
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

            <div className="flex items-center gap-2 text-sm text-[var(--stitch-ink)]">
              <Check className="w-4 h-4" />
              Video is live and visible to customers
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div 
              onClick={() => !uploading && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition ${
                uploading 
                  ? 'border-[var(--stitch-ink)] bg-[var(--stitch-soft)]' 
                  : 'border-[var(--stitch-line)] hover:border-[var(--stitch-ink)] hover:bg-[var(--stitch-soft)]'
              }`}
              data-testid="upload-video-area"
            >
              {uploading ? (
                <div>
                  <div className="w-16 h-16 mx-auto mb-4 relative">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="32" cy="32" r="28" stroke="var(--stitch-line)" strokeWidth="4" fill="none" />
                      <circle
                        cx="32" cy="32" r="28"
                        stroke="var(--stitch-ink)" strokeWidth="4" fill="none"
                        strokeDasharray={`${uploadProgress * 1.76} 176`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-[var(--stitch-ink)]">
                      {uploadProgress}%
                    </span>
                  </div>
                  <p className="font-medium text-[var(--stitch-ink)]">Uploading video...</p>
                  <p className="text-sm text-[var(--stitch-muted)] mt-1">Please wait</p>
                </div>
              ) : (
                <div>
                  <div className="w-16 h-16 bg-[var(--stitch-ink)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-8 h-8 text-[var(--stitch-ink)]" />
                  </div>
                  <p className="font-medium text-[var(--stitch-ink)]">Click to upload explainer video</p>
                  <p className="text-sm text-[var(--stitch-muted)] mt-1">MP4, MOV, or WebM • Max 100MB</p>
                </div>
              )}
            </div>

            <div className="bg-[var(--stitch-soft)] rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[var(--stitch-ink)] flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-[var(--stitch-ink)]">Video Recommendations:</p>
                <ul className="text-[var(--stitch-muted)] mt-1 space-y-1">
                  <li>• 16:9 aspect ratio (landscape)</li>
                  <li>• 1-2 minutes duration</li>
                  <li>• Explain visit booking, OTP verification, and rider role</li>
                  <li>• Mention that negotiations are handled by ApnaGhr team</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleVideoUpload}
          className="hidden"
          data-testid="video-file-input"
        />
      </motion.div>
    </div>
  );
};

export default AppSettingsPanel;
