// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Wand2, Download, Trash2, RefreshCw, 
  Building2, Palette, Type, Megaphone, Share2,
  Image, FileImage, LayoutGrid, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { advertisingAPI } from '../utils/api';

const AIAdGenerator = () => {
  const [generating, setGenerating] = useState(false);
  const [generatedAds, setGeneratedAds] = useState([]);
  const [loadingAds, setLoadingAds] = useState(true);
  const [formData, setFormData] = useState({
    company_name: '',
    business_type: 'packers_movers',
    tagline: '',
    color_scheme: '',
    style: 'modern',
    ad_type: 'poster',
    include_contact: true,
    contact_info: ''
  });
  const [generatedImage, setGeneratedImage] = useState(null);

  const businessTypes = [
    { value: 'packers_movers', label: 'Packers & Movers' },
    { value: 'real_estate', label: 'Real Estate Broker' },
    { value: 'furniture', label: 'Furniture Store' },
    { value: 'home_decor', label: 'Home Decor' },
    { value: 'interior_design', label: 'Interior Design' },
    { value: 'cleaning_services', label: 'Cleaning Services' },
    { value: 'electrician', label: 'Electrician Services' },
    { value: 'plumber', label: 'Plumbing Services' },
    { value: 'painting', label: 'Painting Services' },
    { value: 'construction', label: 'Construction/Builder' },
    { value: 'other', label: 'Other' }
  ];

  const styleOptions = [
    { value: 'modern', label: 'Modern & Clean', icon: '✨' },
    { value: 'traditional', label: 'Traditional Indian', icon: '🏛️' },
    { value: 'playful', label: 'Playful & Fun', icon: '🎨' },
    { value: 'professional', label: 'Professional', icon: '💼' }
  ];

  const adTypes = [
    { value: 'poster', label: 'Poster', icon: Image, desc: 'Vertical poster for app display' },
    { value: 'banner', label: 'Banner', icon: FileImage, desc: 'Wide banner for headers' },
    { value: 'social', label: 'Social Media', icon: Share2, desc: 'Square format for social' }
  ];

  useEffect(() => {
    loadGeneratedAds();
  }, []);

  const loadGeneratedAds = async () => {
    try {
      const response = await advertisingAPI.getGeneratedAds();
      setGeneratedAds(response.data.ads || []);
    } catch (error) {
      console.error('Failed to load generated ads');
    } finally {
      setLoadingAds(false);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    
    if (!formData.company_name.trim()) {
      toast.error('Please enter your company name');
      return;
    }

    setGenerating(true);
    setGeneratedImage(null);

    try {
      toast.info('AI is creating your ad... This may take up to 60 seconds', { duration: 5000 });
      
      const response = await advertisingAPI.generateAd(formData);
      
      if (response.data.success && response.data.image_base64) {
        setGeneratedImage(response.data.image_base64);
        toast.success('Your AI-generated ad is ready!');
        loadGeneratedAds(); // Refresh the list
      }
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Failed to generate ad. Please try again.';
      toast.error(errorMsg);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${generatedImage}`;
    link.download = `${formData.company_name.replace(/\s+/g, '_')}_ad.png`;
    link.click();
    toast.success('Image downloaded!');
  };

  const handleDeleteAd = async (adId) => {
    try {
      await advertisingAPI.deleteGeneratedAd(adId);
      setGeneratedAds(prev => prev.filter(ad => ad.id !== adId));
      toast.success('Ad deleted');
    } catch (error) {
      toast.error('Failed to delete ad');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[var(--stitch-muted)] to-[var(--stitch-ink)] rounded-2xl mb-4">
          <Wand2 className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-black mb-2" style={{ fontFamily: 'Outfit' }}>
          AI Ad Generator
        </h2>
        <p className="text-[var(--stitch-muted)] max-w-md mx-auto">
          Create stunning advertisement posters instantly using AI. Just tell us about your business!
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Generator Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl border border-[var(--stitch-line)] shadow-[4px_4px_0px_var(--stitch-ink)] p-6"
        >
          <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[var(--stitch-muted)]" />
            Create Your Ad
          </h3>

          <form onSubmit={handleGenerate} className="space-y-5">
            {/* Company Name */}
            <div>
              <label className="block text-sm font-bold mb-2">
                <Building2 className="w-4 h-4 inline mr-1" />
                Company Name *
              </label>
              <input
                type="text"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                placeholder="e.g., Quick Movers India"
                className="w-full px-4 py-3 border border-[var(--stitch-line)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--stitch-muted)]"
                data-testid="ai-company-name-input"
                required
              />
            </div>

            {/* Business Type */}
            <div>
              <label className="block text-sm font-bold mb-2">
                <Megaphone className="w-4 h-4 inline mr-1" />
                Business Type
              </label>
              <select
                value={formData.business_type}
                onChange={(e) => setFormData({ ...formData, business_type: e.target.value })}
                className="w-full px-4 py-3 border border-[var(--stitch-line)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--stitch-muted)] bg-white"
                data-testid="ai-business-type-select"
              >
                {businessTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            {/* Tagline */}
            <div>
              <label className="block text-sm font-bold mb-2">
                <Type className="w-4 h-4 inline mr-1" />
                Tagline (optional)
              </label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                placeholder="e.g., Your trusted moving partner"
                className="w-full px-4 py-3 border border-[var(--stitch-line)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--stitch-muted)]"
                data-testid="ai-tagline-input"
              />
            </div>

            {/* Style Selection */}
            <div>
              <label className="block text-sm font-bold mb-2">
                <Palette className="w-4 h-4 inline mr-1" />
                Design Style
              </label>
              <div className="grid grid-cols-2 gap-2">
                {styleOptions.map(style => (
                  <button
                    key={style.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, style: style.value })}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      formData.style === style.value
                        ? 'border-[var(--stitch-ink)] bg-[var(--stitch-muted)]/20 shadow-[2px_2px_0px_var(--stitch-ink)]'
                        : 'border-[var(--stitch-line)] hover:border-[var(--stitch-ink)]'
                    }`}
                    data-testid={`ai-style-${style.value}`}
                  >
                    <span className="text-xl mr-2">{style.icon}</span>
                    <span className="font-medium">{style.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Ad Type */}
            <div>
              <label className="block text-sm font-bold mb-2">
                <LayoutGrid className="w-4 h-4 inline mr-1" />
                Ad Format
              </label>
              <div className="grid grid-cols-3 gap-2">
                {adTypes.map(type => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, ad_type: type.value })}
                      className={`p-3 rounded-xl border-2 text-center transition-all ${
                        formData.ad_type === type.value
                          ? 'border-[var(--stitch-ink)] bg-[var(--stitch-ink)]/20 shadow-[2px_2px_0px_var(--stitch-ink)]'
                          : 'border-[var(--stitch-line)] hover:border-[var(--stitch-ink)]'
                      }`}
                      data-testid={`ai-type-${type.value}`}
                    >
                      <Icon className="w-6 h-6 mx-auto mb-1" />
                      <span className="font-medium text-sm">{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color Scheme */}
            <div>
              <label className="block text-sm font-bold mb-2">
                Color Preference (optional)
              </label>
              <input
                type="text"
                value={formData.color_scheme}
                onChange={(e) => setFormData({ ...formData, color_scheme: e.target.value })}
                placeholder="e.g., Blue and Orange, Earthy tones"
                className="w-full px-4 py-3 border border-[var(--stitch-line)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--stitch-muted)]"
                data-testid="ai-color-input"
              />
            </div>

            {/* Contact Info */}
            <div className="flex items-start gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.include_contact}
                  onChange={(e) => setFormData({ ...formData, include_contact: e.target.checked })}
                  className="w-5 h-5 rounded border border-[var(--stitch-line)]"
                  data-testid="ai-include-contact"
                />
                <span className="font-medium">Include Contact Info</span>
              </label>
            </div>
            
            {formData.include_contact && (
              <input
                type="text"
                value={formData.contact_info}
                onChange={(e) => setFormData({ ...formData, contact_info: e.target.value })}
                placeholder="e.g., Call: 98765-43210"
                className="w-full px-4 py-3 border border-[var(--stitch-line)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--stitch-muted)]"
                data-testid="ai-contact-input"
              />
            )}

            {/* Generate Button */}
            <motion.button
              type="submit"
              disabled={generating}
              whileHover={{ scale: generating ? 1 : 1.02 }}
              whileTap={{ scale: generating ? 1 : 0.98 }}
              className="stitch-button w-full flex items-center justify-center gap-2"
              data-testid="ai-generate-button"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating Your Ad...
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5" />
                  Generate AI Ad
                </>
              )}
            </motion.button>
          </form>
        </motion.div>

        {/* Preview / Generated Image */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl border border-[var(--stitch-line)] shadow-[4px_4px_0px_var(--stitch-ink)] p-6"
        >
          <h3 className="font-bold text-lg mb-6">Generated Ad Preview</h3>

          <AnimatePresence mode="wait">
            {generating ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="aspect-[3/4] bg-gradient-to-br from-[var(--stitch-soft)] to-[var(--stitch-muted)]/20 rounded-xl flex flex-col items-center justify-center"
              >
                <div className="w-20 h-20 relative mb-4">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 border-4 border-[var(--stitch-muted)] border-t-transparent rounded-full"
                  />
                  <Wand2 className="absolute inset-0 m-auto w-8 h-8 text-[var(--stitch-ink)]" />
                </div>
                <p className="font-bold text-[var(--stitch-ink)]">AI is working its magic...</p>
                <p className="text-sm text-[var(--stitch-muted)] mt-1">This may take up to 60 seconds</p>
              </motion.div>
            ) : generatedImage ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="rounded-xl overflow-hidden border-2 border-[var(--stitch-line)]">
                  <img
                    src={`data:image/png;base64,${generatedImage}`}
                    alt="Generated Ad"
                    className="w-full h-auto"
                    data-testid="ai-generated-image"
                  />
                </div>
                
                <div className="flex gap-3">
                  <motion.button
                    onClick={handleDownload}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 stitch-button stitch-button-secondary flex items-center justify-center gap-2"
                    data-testid="ai-download-button"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </motion.button>
                  <motion.button
                    onClick={() => setGeneratedImage(null)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 stitch-button stitch-button-secondary flex items-center justify-center gap-2"
                    data-testid="ai-regenerate-button"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Generate New
                  </motion.button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="aspect-[3/4] bg-[var(--stitch-soft)] rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-[var(--stitch-line)]"
              >
                <div className="w-16 h-16 bg-[var(--stitch-muted)]/20 rounded-full flex items-center justify-center mb-4">
                  <Image className="w-8 h-8 text-[var(--stitch-muted)]" />
                </div>
                <p className="font-medium text-[var(--stitch-muted)]">Your AI-generated ad will appear here</p>
                <p className="text-sm text-[var(--stitch-muted)]/70 mt-1">Fill the form and click Generate</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Previously Generated Ads */}
      {generatedAds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-[var(--stitch-line)] shadow-[4px_4px_0px_var(--stitch-ink)] p-6"
        >
          <h3 className="font-bold text-lg mb-4">Your Generated Ads</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {generatedAds.map((ad) => (
              <div key={ad.id} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden border-2 border-[var(--stitch-line)]">
                  <img
                    src={`data:image/png;base64,${ad.image_base64}`}
                    alt={ad.company_name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                  <button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = `data:image/png;base64,${ad.image_base64}`;
                      link.download = `${ad.company_name}_ad.png`;
                      link.click();
                    }}
                    className="p-2 bg-white rounded-full"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteAd(ad.id)}
                    className="p-2 bg-red-500 text-white rounded-full"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs font-medium mt-1 truncate">{ad.company_name}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default AIAdGenerator;
