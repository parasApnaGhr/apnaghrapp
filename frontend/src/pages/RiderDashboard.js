import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { visitAPI, riderAPI, getMediaUrl } from '../utils/api';
import api from '../utils/api';
import VisitProofUpload from '../components/VisitProofUpload';
import { 
  MapPin, Clock, CheckCircle, Phone, Camera, Navigation, 
  Home, User, ArrowRight, IndianRupee, Power, Wallet, 
  ClipboardList, FileText, LogOut, RefreshCw, Upload, X, Image, Trash2
} from 'lucide-react';
import { toast } from 'sonner';

const RiderDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('visits');
  const [isOnline, setIsOnline] = useState(user?.is_online || false);
  const [shiftLoading, setShiftLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Visits state
  const [availableVisits, setAvailableVisits] = useState([]);
  const [activeVisit, setActiveVisit] = useState(null);
  
  // ToLet Tasks state
  const [availableTasks, setAvailableTasks] = useState([]);
  const [activeTask, setActiveTask] = useState(null);
  const [taskCompletion, setTaskCompletion] = useState({
    boardsCollected: 1,
    proofImages: [],
    uploading: false,
    notes: ''
  });
  const taskFileInputRef = useRef(null);
  
  // Wallet state
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  
  // Proof upload modal
  const [showProofUpload, setShowProofUpload] = useState(false);
  const [currentProofPropertyId, setCurrentProofPropertyId] = useState(null);

  useEffect(() => {
    if (isOnline) {
      loadAvailableVisits();
      loadAvailableTasks();
    }
    loadWallet();
  }, [isOnline]);

  const loadAvailableVisits = async () => {
    try {
      setLoading(true);
      const response = await visitAPI.getAvailableVisits();
      const visits = response.data.available || response.data || [];
      setAvailableVisits(visits);
      
      // Check for active visit
      if (response.data.active) {
        setActiveVisit(response.data.active);
      }
    } catch (error) {
      console.error('Error loading visits:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableTasks = async () => {
    try {
      const response = await riderAPI.getAvailableTasks();
      setAvailableTasks(response.data || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const loadWallet = async () => {
    try {
      const [walletRes, transactionsRes] = await Promise.all([
        riderAPI.getWallet(),
        riderAPI.getTransactions()
      ]);
      setWallet(walletRes.data);
      setTransactions(transactionsRes.data || []);
    } catch (error) {
      console.error('Error loading wallet:', error);
    }
  };

  const toggleOnlineStatus = async () => {
    setShiftLoading(true);
    try {
      // Get current location
      let lat = null, lng = null;
      if (navigator.geolocation) {
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
          });
          lat = position.coords.latitude;
          lng = position.coords.longitude;
        } catch (e) {
          console.log('Could not get location');
        }
      }
      
      await riderAPI.updateShift({ 
        is_online: !isOnline,
        current_lat: lat,
        current_lng: lng
      });
      
      setIsOnline(!isOnline);
      toast.success(isOnline ? 'You are now offline' : 'You are now online! Waiting for requests...');
      
      if (!isOnline) {
        loadAvailableVisits();
        loadAvailableTasks();
      }
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setShiftLoading(false);
    }
  };

  const handleAcceptVisit = async (visitId) => {
    try {
      const response = await visitAPI.acceptVisit(visitId);
      setActiveVisit(response.data);
      setAvailableVisits([]);
      toast.success('Visit accepted! Navigate to customer pickup location');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to accept visit');
    }
  };

  const handleAcceptTask = async (taskId) => {
    try {
      await riderAPI.acceptTask(taskId);
      const task = availableTasks.find(t => t.id === taskId);
      setActiveTask(task);
      setAvailableTasks(availableTasks.filter(t => t.id !== taskId));
      toast.success('Task accepted!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to accept task');
    }
  };

  const handleUpdateStep = async (action) => {
    if (!activeVisit) return;
    
    try {
      const response = await visitAPI.updateVisitStep(activeVisit.visit.id, action);
      setActiveVisit(prev => ({ ...prev, visit: response.data }));
      
      const messages = {
        start_pickup: 'Started! Navigate to customer',
        arrived_customer: 'Arrived at customer. Verify OTP',
        start_property: 'OTP verified! Navigate to property',
        arrived_property: 'Arrived at property',
        complete_property: 'Property visit completed!',
        complete_visit: 'Visit completed! Great job!'
      };
      
      toast.success(messages[action] || 'Progress updated');
      
      if (action === 'complete_visit' || response.data.status === 'completed') {
        setActiveVisit(null);
        loadAvailableVisits();
        loadWallet(); // Refresh wallet after completing visit
      }
    } catch (error) {
      toast.error('Failed to update progress');
    }
  };

  const openNavigation = (address, lat, lng) => {
    if (lat && lng) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
    } else {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`, '_blank');
    }
  };

  // ToLet Task Photo Upload handlers
  const handleTaskPhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setTaskCompletion(prev => ({ ...prev, uploading: true }));
    
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select only image files');
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image must be less than 10MB');
        continue;
      }

      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        setTaskCompletion(prev => ({
          ...prev,
          proofImages: [...prev.proofImages, response.data.url]
        }));
        toast.success('Photo uploaded!');
      } catch (error) {
        toast.error('Failed to upload photo');
      }
    }
    
    setTaskCompletion(prev => ({ ...prev, uploading: false }));
    if (taskFileInputRef.current) taskFileInputRef.current.value = '';
  };

  const removeTaskPhoto = (index) => {
    setTaskCompletion(prev => ({
      ...prev,
      proofImages: prev.proofImages.filter((_, i) => i !== index)
    }));
  };

  const handleCompleteTask = async () => {
    if (taskCompletion.proofImages.length < taskCompletion.boardsCollected) {
      toast.error(`Please upload at least ${taskCompletion.boardsCollected} photos (one per board)`);
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(`/tolet-tasks/${activeTask.id}/complete`, {
        boards_collected: taskCompletion.boardsCollected,
        proof_images: taskCompletion.proofImages,
        notes: taskCompletion.notes
      });
      
      toast.success('Task submitted for verification! Admin will review your photos.');
      setActiveTask(null);
      setTaskCompletion({ boardsCollected: 1, proofImages: [], uploading: false, notes: '' });
      loadWallet();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to complete task');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentStepInfo = () => {
    if (!activeVisit?.visit) return null;
    
    const visit = activeVisit.visit;
    const properties = activeVisit.properties || [];
    const currentIdx = visit.current_property_index || 0;
    const currentProperty = properties[currentIdx];
    const step = visit.current_step || 'go_to_customer';
    
    if (step === 'go_to_customer') {
      return {
        title: 'Go to Customer',
        subtitle: 'Navigate to pickup location',
        location: visit.pickup_location,
        lat: visit.pickup_lat,
        lng: visit.pickup_lng,
        action: 'arrived_customer',
        actionText: 'Arrived at Customer',
        icon: User
      };
    }
    
    if (step === 'at_customer') {
      return {
        title: 'At Customer Location',
        subtitle: 'Verify OTP with customer',
        showOTP: true,
        otp: visit.otp,
        action: 'start_property',
        actionText: 'OTP Verified - Start Tour',
        icon: CheckCircle
      };
    }
    
    if (step.startsWith('go_to_property_')) {
      return {
        title: `Navigate to Property ${currentIdx + 1}`,
        subtitle: currentProperty?.title || 'Property',
        location: currentProperty?.exact_address,
        lat: currentProperty?.latitude,
        lng: currentProperty?.longitude,
        property: currentProperty,
        action: 'arrived_property',
        actionText: 'Arrived at Property',
        icon: Home
      };
    }
    
    if (step.startsWith('at_property_')) {
      return {
        title: `At Property ${currentIdx + 1}`,
        subtitle: currentProperty?.title || 'Property',
        property: currentProperty,
        showUploadProof: true,
        action: 'complete_property',
        actionText: currentIdx < properties.length - 1 ? 'Complete & Next Property' : 'Complete Visit',
        icon: Camera
      };
    }
    
    return null;
  };

  const stepInfo = getCurrentStepInfo();

  return (
    <div className="min-h-screen bg-[#FDFCFB] pb-24">
      {/* Premium Header */}
      <header className="glass-header sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-medium" style={{ fontFamily: 'Playfair Display, serif' }}>
                Rider Dashboard
              </h1>
              <p className="text-sm text-[#4A4D53]">Welcome, {user?.name}</p>
            </div>
            <button 
              onClick={logout}
              className="p-2 hover:bg-[#F5F3F0] transition-colors"
              data-testid="logout-button"
            >
              <LogOut className="w-5 h-5 text-[#4A4D53]" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-6">
        {/* Online/Offline Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`bg-white border p-6 mb-6 ${isOnline ? 'border-[#04473C] bg-[#E6F0EE]' : 'border-[#E5E1DB]'}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 flex items-center justify-center ${
                isOnline ? 'bg-[#04473C]' : 'bg-[#F5F3F0]'
              }`}>
                <Power className={`w-6 h-6 ${isOnline ? 'text-white' : 'text-[#4A4D53]'}`} strokeWidth={1.5} />
              </div>
              <div>
                <p className="font-medium text-lg text-[#1A1C20]">{isOnline ? 'You are Online' : 'You are Offline'}</p>
                <p className="text-sm text-[#4A4D53]">
                  {isOnline ? 'Accepting new requests' : 'Go online to receive requests'}
                </p>
              </div>
            </div>
            <button
              onClick={toggleOnlineStatus}
              disabled={shiftLoading}
              className={`px-6 py-3 font-medium tracking-wide transition-all ${
                isOnline 
                  ? 'bg-[#8F2727] text-white hover:bg-[#7a2121]' 
                  : 'bg-[#04473C] text-white hover:bg-[#03352D]'
              }`}
              data-testid="toggle-online-button"
            >
              {shiftLoading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : isOnline ? 'Go Offline' : 'Go Online'}
            </button>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 hide-scrollbar">
          {[
            { id: 'visits', label: 'Visits', icon: Navigation },
            { id: 'tasks', label: 'ToLet Tasks', icon: ClipboardList },
            { id: 'wallet', label: 'Wallet', icon: Wallet }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 border font-medium text-sm tracking-wide transition-all whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'bg-[#04473C] text-white border-[#04473C]' 
                  : 'bg-white border-[#E5E1DB] hover:border-[#D0C9C0] text-[#1A1C20]'
              }`}
              data-testid={`tab-${tab.id}`}
            >
              <tab.icon className="w-4 h-4" strokeWidth={1.5} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Visits Tab */}
        {activeTab === 'visits' && (
          <>
            {/* Active Visit */}
            {activeVisit && stepInfo && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white border border-[#E5E1DB] mb-6 overflow-hidden"
              >
                <div className="bg-[#04473C] text-white p-5">
                  <div className="flex items-center gap-4">
                    <stepInfo.icon className="w-8 h-8" strokeWidth={1.5} />
                    <div>
                      <h2 className="font-medium text-lg">{stepInfo.title}</h2>
                      <p className="text-sm opacity-80">{stepInfo.subtitle}</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  {/* Location */}
                  {stepInfo.location && (
                    <button
                      onClick={() => openNavigation(stepInfo.location, stepInfo.lat, stepInfo.lng)}
                      className="w-full p-4 bg-[#F5F3F0] flex items-center justify-between hover:bg-[#E5E1DB] transition-colors"
                      data-testid="navigate-button"
                    >
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-[#04473C]" strokeWidth={1.5} />
                        <span className="text-left text-[#1A1C20]">{stepInfo.location}</span>
                      </div>
                      <Navigation className="w-5 h-5 text-[#04473C]" strokeWidth={1.5} />
                    </button>
                  )}

                  {/* OTP */}
                  {stepInfo.showOTP && (
                    <div className="text-center p-6 bg-[#C6A87C]/10 border border-[#C6A87C]">
                      <p className="text-sm font-medium mb-2 text-[#4A4D53] uppercase tracking-wide">Customer OTP</p>
                      <p className="text-4xl font-bold tracking-widest text-[#1A1C20]" style={{ fontFamily: 'Playfair Display, serif' }}>
                        {stepInfo.otp}
                      </p>
                    </div>
                  )}

                  {/* Upload Proof */}
                  {stepInfo.showUploadProof && (
                    <button
                      onClick={() => {
                        setCurrentProofPropertyId(stepInfo.property?.id);
                        setShowProofUpload(true);
                      }}
                      className="w-full p-4 bg-[#E6F0EE] flex items-center justify-center gap-2 hover:bg-[#d0e5e1] border border-dashed border-[#04473C] transition-colors"
                      data-testid="upload-proof-button"
                    >
                      <Camera className="w-5 h-5 text-[#04473C]" strokeWidth={1.5} />
                      <span className="text-[#04473C] font-medium">Upload Selfie & Video Proof</span>
                    </button>
                  )}

                  {/* Customer Call */}
                  {activeVisit.customer && (
                    <button
                      onClick={() => window.open(`tel:${activeVisit.customer.phone}`, '_self')}
                      className="w-full p-4 bg-white flex items-center justify-center gap-2 border border-[#E5E1DB] hover:border-[#04473C] transition-colors"
                      data-testid="call-customer-button"
                    >
                      <Phone className="w-5 h-5 text-[#04473C]" strokeWidth={1.5} />
                      <span className="text-[#1A1C20]">Call Customer ({activeVisit.customer.phone})</span>
                    </button>
                  )}

                  {/* Action Button */}
                  <button
                    onClick={() => handleUpdateStep(stepInfo.action)}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                    data-testid="step-action-button"
                  >
                    {stepInfo.actionText}
                    <ArrowRight className="w-5 h-5" strokeWidth={1.5} />
                  </button>

                  {/* Progress Bar */}
                  <div className="pt-4 border-t border-[#E5E1DB]">
                    <p className="text-sm text-[#4A4D53] mb-2 uppercase tracking-wide">Progress</p>
                    <div className="flex gap-2">
                      {activeVisit.properties?.map((prop, idx) => (
                        <div
                          key={prop.id}
                          className={`flex-1 h-2 ${
                            (activeVisit.visit.properties_completed || []).includes(prop.id)
                              ? 'bg-[#04473C]'
                              : idx === activeVisit.visit.current_property_index
                              ? 'bg-[#C6A87C]'
                              : 'bg-[#E5E1DB]'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Available Visits */}
            {isOnline && !activeVisit && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-[#1A1C20]" style={{ fontFamily: 'Playfair Display, serif' }}>Available Visits ({availableVisits.length})</h3>
                  <button onClick={loadAvailableVisits} className="p-2 hover:bg-[#F5F3F0] transition-colors">
                    <RefreshCw className="w-4 h-4 text-[#4A4D53]" strokeWidth={1.5} />
                  </button>
                </div>

                {loading ? (
                  <div className="text-center py-12">
                    <div className="w-8 h-8 border-2 border-[#04473C] border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="mt-4 text-[#4A4D53]">Loading visits...</p>
                  </div>
                ) : availableVisits.length === 0 ? (
                  <div className="bg-white border border-[#E5E1DB] p-12 text-center">
                    <Clock className="w-12 h-12 text-[#D0C9C0] mx-auto mb-3" strokeWidth={1} />
                    <p className="text-[#4A4D53]">No visits available right now</p>
                    <p className="text-sm text-[#4A4D53] mt-2">New requests will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {availableVisits.map((visit) => (
                      <motion.div
                        key={visit.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white border border-[#E5E1DB] p-6 hover:shadow-lg transition-shadow"
                        data-testid={`visit-request-${visit.id}`}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="font-medium text-lg text-[#1A1C20]">Multi-Property Visit</h4>
                            <p className="text-sm text-[#4A4D53]">
                              {visit.property_ids?.length || 1} properties · {visit.estimated_duration || '~1hr'}
                            </p>
                          </div>
                          <span className="badge badge-warning">Pending</span>
                        </div>

                        <div className="space-y-2 mb-4">
                          {visit.properties?.slice(0, 3).map((prop, idx) => (
                            <div key={prop.id} className="flex items-center gap-3 bg-[#F3F4F6] rounded-lg p-3">
                              <div className="w-8 h-8 bg-[#FF5A5F] text-white rounded-full flex items-center justify-center font-bold text-sm">
                                {idx + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{prop.title}</p>
                                <p className="text-xs text-[#52525B]">{prop.area_name}</p>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center justify-between py-3 border-y border-[#E5E7EB] mb-4">
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="w-4 h-4 text-[#52525B]" />
                            <span>{visit.scheduled_date} at {visit.scheduled_time}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[#4ECDC4] font-bold">
                            <IndianRupee className="w-4 h-4" />
                            <span>{visit.total_earnings || (visit.property_ids?.length || 1) * 100}</span>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <button
                            onClick={() => handleAcceptVisit(visit.id)}
                            className="btn-primary flex-1 flex items-center justify-center gap-2"
                            data-testid={`accept-visit-${visit.id}`}
                          >
                            <CheckCircle className="w-5 h-5" />
                            Accept
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!isOnline && (
              <div className="neo-card p-12 text-center">
                <Power className="w-12 h-12 text-[#9CA3AF] mx-auto mb-3" />
                <p className="text-[#52525B]">Go online to see available visits</p>
              </div>
            )}
          </>
        )}

        {/* ToLet Tasks Tab */}
        {activeTab === 'tasks' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">ToLet Board Tasks ({availableTasks.length})</h3>
              <button onClick={loadAvailableTasks} className="p-2 hover:bg-gray-100 rounded-full">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* Active Task */}
            {activeTask && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="neo-card p-6 mb-6 bg-[#4ECDC4]/10"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-[#4ECDC4] text-white rounded-full flex items-center justify-center">
                    <ClipboardList className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold">{activeTask.title}</h4>
                    <p className="text-sm text-[#52525B]">{activeTask.location}</p>
                  </div>
                </div>
                <p className="text-sm mb-4">{activeTask.description}</p>
                <div className="flex items-center justify-between py-3 border-y mb-4">
                  <span className="text-sm">Est. Boards: {activeTask.estimated_boards}</span>
                  <span className="font-bold text-[#4ECDC4]">₹{activeTask.rate_per_board}/board</span>
                </div>

                {/* Task Completion Form */}
                <div className="space-y-4">
                  {/* Boards Collected */}
                  <div>
                    <label className="block text-sm font-bold mb-2">Boards Collected *</label>
                    <input
                      type="number"
                      min="1"
                      max={activeTask.estimated_boards * 2}
                      value={taskCompletion.boardsCollected}
                      onChange={(e) => setTaskCompletion({ 
                        ...taskCompletion, 
                        boardsCollected: parseInt(e.target.value) || 1 
                      })}
                      className="w-full px-4 py-3 border-2 border-[#111111] rounded-xl"
                      data-testid="boards-collected-input"
                    />
                    <p className="text-xs text-[#52525B] mt-1">
                      Estimated earnings: ₹{(taskCompletion.boardsCollected * activeTask.rate_per_board).toLocaleString()}
                    </p>
                  </div>

                  {/* Photo Upload */}
                  <div>
                    <label className="block text-sm font-bold mb-2">
                      <Camera className="w-4 h-4 inline mr-1" />
                      Upload Board Photos * (one per board)
                    </label>
                    
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {taskCompletion.proofImages.map((url, index) => (
                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden border-2 border-[#E5E3D8]">
                          <img 
                            src={url} 
                            alt={`Board ${index + 1}`} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80';
                            }}
                          />
                          <button
                            onClick={() => removeTaskPhoto(index)}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <span className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-2 py-0.5 rounded">
                            #{index + 1}
                          </span>
                        </div>
                      ))}
                      
                      {/* Upload Button */}
                      <button
                        onClick={() => taskFileInputRef.current?.click()}
                        disabled={taskCompletion.uploading}
                        className="aspect-square rounded-lg border-2 border-dashed border-[#4ECDC4] bg-[#4ECDC4]/10 flex flex-col items-center justify-center hover:bg-[#4ECDC4]/20 transition-colors"
                        data-testid="upload-task-photo-button"
                      >
                        {taskCompletion.uploading ? (
                          <div className="w-6 h-6 border-2 border-[#4ECDC4] border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <Upload className="w-6 h-6 text-[#4ECDC4] mb-1" />
                            <span className="text-xs text-[#4ECDC4] font-medium">Add Photo</span>
                          </>
                        )}
                      </button>
                    </div>
                    
                    <input
                      ref={taskFileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleTaskPhotoUpload}
                      className="hidden"
                    />
                    
                    {taskCompletion.proofImages.length < taskCompletion.boardsCollected && (
                      <p className="text-xs text-[#FF5A5F] mt-1">
                        ⚠️ Upload {taskCompletion.boardsCollected - taskCompletion.proofImages.length} more photo(s)
                      </p>
                    )}
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-bold mb-2">Notes (optional)</label>
                    <textarea
                      value={taskCompletion.notes}
                      onChange={(e) => setTaskCompletion({ ...taskCompletion, notes: e.target.value })}
                      placeholder="Any additional notes..."
                      className="w-full px-4 py-3 border-2 border-[#111111] rounded-xl resize-none"
                      rows={2}
                    />
                  </div>

                  {/* Submit Button */}
                  <motion.button
                    onClick={handleCompleteTask}
                    disabled={loading || taskCompletion.proofImages.length < taskCompletion.boardsCollected}
                    whileHover={{ scale: loading ? 1 : 1.02 }}
                    whileTap={{ scale: loading ? 1 : 0.98 }}
                    className={`w-full py-4 rounded-xl font-bold text-white transition-all ${
                      taskCompletion.proofImages.length >= taskCompletion.boardsCollected
                        ? 'bg-[#4ECDC4] shadow-[3px_3px_0px_#111111]'
                        : 'bg-gray-400 cursor-not-allowed'
                    }`}
                    data-testid="complete-task-button"
                  >
                    {loading ? 'Submitting...' : 'Submit for Verification'}
                  </motion.button>
                  
                  <p className="text-xs text-center text-[#52525B]">
                    Your photos will be reviewed by admin before payout
                  </p>
                </div>
              </motion.div>
            )}

            {!isOnline ? (
              <div className="neo-card p-12 text-center">
                <Power className="w-12 h-12 text-[#9CA3AF] mx-auto mb-3" />
                <p className="text-[#52525B]">Go online to see available tasks</p>
              </div>
            ) : availableTasks.length === 0 ? (
              <div className="neo-card p-12 text-center">
                <ClipboardList className="w-12 h-12 text-[#9CA3AF] mx-auto mb-3" />
                <p className="text-[#52525B]">No ToLet tasks available</p>
                <p className="text-sm text-[#9CA3AF] mt-2">Check back later</p>
              </div>
            ) : (
              <div className="space-y-4">
                {availableTasks.map((task) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="neo-card p-6"
                    data-testid={`task-${task.id}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-bold">{task.title}</h4>
                        <p className="text-sm text-[#52525B] flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {task.location}
                        </p>
                      </div>
                      <span className="badge badge-info">{task.status}</span>
                    </div>
                    <p className="text-sm text-[#52525B] mb-4">{task.description}</p>
                    <div className="flex items-center justify-between py-3 border-y mb-4">
                      <span className="text-sm">Est. Boards: {task.estimated_boards}</span>
                      <span className="font-bold text-[#4ECDC4]">
                        ₹{(task.rate_per_board * task.estimated_boards).toFixed(0)} total
                      </span>
                    </div>
                    <button
                      onClick={() => handleAcceptTask(task.id)}
                      className="btn-secondary w-full flex items-center justify-center gap-2"
                      data-testid={`accept-task-${task.id}`}
                    >
                      <CheckCircle className="w-5 h-5" />
                      Accept Task
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Wallet Tab */}
        {activeTab === 'wallet' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">My Wallet</h3>
              <button onClick={loadWallet} className="p-2 hover:bg-gray-100 rounded-full">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* Wallet Summary */}
            <div className="neo-card p-6 mb-6 bg-gradient-to-r from-[#FFD166]/20 to-white">
              <div className="text-center mb-6">
                <p className="text-sm text-[#52525B] mb-1">Total Earnings</p>
                <p className="text-4xl font-black" style={{ fontFamily: 'Outfit' }}>
                  ₹{wallet?.total_earnings?.toLocaleString() || 0}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-[#FFD166]/30 rounded-xl">
                  <p className="text-xs text-[#52525B]">Pending</p>
                  <p className="text-lg font-bold">₹{wallet?.pending_earnings || 0}</p>
                </div>
                <div className="text-center p-3 bg-[#4ECDC4]/30 rounded-xl">
                  <p className="text-xs text-[#52525B]">Approved</p>
                  <p className="text-lg font-bold text-[#4ECDC4]">₹{wallet?.approved_earnings || 0}</p>
                </div>
                <div className="text-center p-3 bg-[#C1F5C3] rounded-xl">
                  <p className="text-xs text-[#52525B]">Paid Out</p>
                  <p className="text-lg font-bold text-green-700">₹{wallet?.paid_earnings || 0}</p>
                </div>
              </div>

              {wallet?.next_payout_date && (
                <div className="mt-4 pt-4 border-t text-center">
                  <p className="text-sm text-[#52525B]">
                    Next payout: <span className="font-bold">{wallet.next_payout_date}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Transactions */}
            <h4 className="font-bold mb-3">Transaction History</h4>
            {transactions.length === 0 ? (
              <div className="neo-card p-8 text-center">
                <FileText className="w-10 h-10 text-[#9CA3AF] mx-auto mb-2" />
                <p className="text-[#52525B]">No transactions yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((tx) => (
                  <div key={tx.id} className="neo-card p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{tx.description}</p>
                      <p className="text-xs text-[#52525B]">{tx.created_at?.split('T')[0]}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${tx.type === 'payout' ? 'text-green-600' : 'text-[#111111]'}`}>
                        {tx.type === 'payout' ? '-' : '+'}₹{tx.amount}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        tx.status === 'paid' ? 'bg-green-100 text-green-700' :
                        tx.status === 'approved' ? 'bg-[#4ECDC4]/20 text-[#4ECDC4]' :
                        'bg-[#FFD166]/20 text-yellow-700'
                      }`}>
                        {tx.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Proof Upload Modal */}
      {showProofUpload && activeVisit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4">Upload Visit Proof</h3>
              <VisitProofUpload
                visitId={activeVisit.visit?.id}
                propertyId={currentProofPropertyId}
                onComplete={() => {
                  toast.success('Proof uploaded successfully!');
                  setShowProofUpload(false);
                }}
                onCancel={() => setShowProofUpload(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiderDashboard;
