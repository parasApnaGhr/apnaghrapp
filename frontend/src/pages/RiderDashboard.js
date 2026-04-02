import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { visitAPI, riderAPI, getMediaUrl, authAPI } from '../utils/api';
import api from '../utils/api';
import VisitProofUpload from '../components/VisitProofUpload';
import MultiVisitRoute from '../components/MultiVisitRoute';
import RiderLocationTracker from '../components/RiderLocationTracker';
import TermsAcceptanceModal from '../components/TermsAcceptanceModal';
import { 
  MapPin, Clock, CheckCircle, Phone, Camera, Navigation, 
  Home, User, ArrowRight, IndianRupee, Power, Wallet, 
  ClipboardList, FileText, LogOut, RefreshCw, Upload, X, Image, Trash2, Route,
  Locate, AlertTriangle, Shield, XCircle
} from 'lucide-react';
import { toast } from 'sonner';

const RiderDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('visits');
  const [isOnline, setIsOnline] = useState(user?.is_online || false);
  const [shiftLoading, setShiftLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Terms state
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(user?.terms_accepted || false);
  
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
  
  // Multi-visit route map
  const [showRouteMap, setShowRouteMap] = useState(false);

  // Exciting Accept Animation State
  const [showAcceptAnimation, setShowAcceptAnimation] = useState(false);
  const [acceptedVisitData, setAcceptedVisitData] = useState(null);
  const [acceptAnimationStep, setAcceptAnimationStep] = useState(0);

  // Compliance check state (after each property visit)
  const [showComplianceModal, setShowComplianceModal] = useState(false);
  const [complianceAnswers, setComplianceAnswers] = useState({
    with_client_all_time: null,
    client_shared_contact: null,
    helped_negotiations: null
  });
  const [pendingAction, setPendingAction] = useState(null);
  const [complianceViolation, setComplianceViolation] = useState(false);

  // Auto-show map when accepting visit
  const [showVisitMap, setShowVisitMap] = useState(false);

  // Check terms acceptance on mount
  useEffect(() => {
    const checkTerms = async () => {
      if (!user?.terms_accepted) {
        try {
          const response = await authAPI.getTermsStatus();
          if (!response.data.terms_accepted) {
            setShowTermsModal(true);
          } else {
            setTermsAccepted(true);
          }
        } catch (error) {
          console.error('Error checking terms:', error);
          setShowTermsModal(true);
        }
      } else {
        setTermsAccepted(true);
      }
    };
    checkTerms();
  }, [user]);

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
      // Show exciting acceptance animation immediately
      setShowAcceptAnimation(true);
      setAcceptAnimationStep(1); // "Accepting..."
      
      const response = await visitAPI.acceptVisit(visitId);
      
      // Store the accepted visit data
      setAcceptedVisitData(response.data);
      setAvailableVisits([]);
      
      // Progress through animation steps
      setTimeout(() => setAcceptAnimationStep(2), 800);  // "Accepted!"
      setTimeout(() => setAcceptAnimationStep(3), 1800); // Show earnings
      setTimeout(() => setAcceptAnimationStep(4), 3000); // Show customer info
      setTimeout(() => setAcceptAnimationStep(5), 4200); // "Starting navigation..."
      
      // After animation, set active visit and open navigation
      setTimeout(() => {
        setActiveVisit(response.data);
        setShowAcceptAnimation(false);
        setAcceptAnimationStep(0);
        
        // Auto-open Google Maps navigation
        const pickupLocation = response.data.visit?.pickup_location;
        const pickupLat = response.data.visit?.pickup_lat;
        const pickupLng = response.data.visit?.pickup_lng;
        const customerName = response.data.visit?.customer_name || 'Customer';
        
        openNavigationToPickup(pickupLat, pickupLng, pickupLocation, customerName);
      }, 5500);
      
    } catch (error) {
      setShowAcceptAnimation(false);
      setAcceptAnimationStep(0);
      toast.error(error.response?.data?.detail || 'Failed to accept visit');
    }
  };

  // Open Google Maps navigation to pickup location (Uber-like)
  const openNavigationToPickup = (lat, lng, address, customerName) => {
    let navigationUrl;
    
    if (lat && lng) {
      // If we have coordinates, use them for precise navigation
      navigationUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
    } else if (address) {
      // Fallback to address-based navigation
      const encodedAddress = encodeURIComponent(address);
      navigationUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}&travelmode=driving`;
    } else {
      toast.info('Pickup location not available. Please contact customer for directions.');
      return;
    }
    
    // Show a toast with navigation info
    toast.success(
      `Navigating to ${customerName}'s pickup location`,
      { 
        duration: 4000,
        icon: '🧭'
      }
    );
    
    // Open Google Maps in new tab (works on both mobile and desktop)
    window.open(navigationUrl, '_blank');
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
    
    // If completing a property, show compliance questions first
    if (action === 'complete_property' || action === 'complete_visit') {
      setPendingAction(action);
      setShowComplianceModal(true);
      return;
    }
    
    await executeStepUpdate(action);
  };

  const executeStepUpdate = async (action) => {
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
      
      // After accepting visit, show map automatically
      if (action === 'start_pickup') {
        setShowVisitMap(true);
      }
      
      if (action === 'complete_visit' || response.data.status === 'completed') {
        setActiveVisit(null);
        setShowVisitMap(false);
        loadAvailableVisits();
        loadWallet();
      }
    } catch (error) {
      toast.error('Failed to update progress');
    }
  };

  const handleComplianceSubmit = async () => {
    // Check for violations
    const { with_client_all_time, client_shared_contact, helped_negotiations } = complianceAnswers;
    
    if (with_client_all_time === null || client_shared_contact === null || helped_negotiations === null) {
      toast.error('Please answer all compliance questions');
      return;
    }
    
    // If client shared contact or rider helped in negotiations - VIOLATION
    if (client_shared_contact === true || helped_negotiations === true) {
      setComplianceViolation(true);
      
      // Report violation to backend
      try {
        await api.post(`/visits/${activeVisit.visit.id}/report-violation`, {
          violation_type: client_shared_contact ? 'contact_shared' : 'negotiation_help',
          rider_report: true,
          details: {
            with_client_all_time,
            client_shared_contact,
            helped_negotiations
          }
        });
      } catch (error) {
        console.error('Failed to report violation:', error);
      }
      
      toast.error('Terms violation detected! This visit is being flagged.');
      
      // End the visit as terminated
      try {
        await api.post(`/visits/${activeVisit.visit.id}/terminate`, {
          reason: 'terms_violation',
          violation_details: complianceAnswers
        });
        setActiveVisit(null);
        setShowComplianceModal(false);
        setShowVisitMap(false);
        loadAvailableVisits();
      } catch (error) {
        console.error('Failed to terminate visit:', error);
      }
      
      return;
    }
    
    // No violation - proceed with completing the property/visit
    setShowComplianceModal(false);
    setComplianceViolation(false);
    
    // Save compliance record (silent - no toast)
    try {
      await api.post(`/visits/${activeVisit.visit.id}/compliance-check`, {
        property_id: activeVisit.properties?.[activeVisit.visit?.current_property_index]?.id,
        answers: complianceAnswers
      });
    } catch (error) {
      console.error('Failed to save compliance:', error);
      // Continue anyway - don't block the flow
    }
    
    // Reset answers for next property
    setComplianceAnswers({
      with_client_all_time: null,
      client_shared_contact: null,
      helped_negotiations: null
    });
    
    // Execute the pending action and wait for it to complete
    if (pendingAction) {
      try {
        await executeStepUpdate(pendingAction);
      } catch (error) {
        console.error('Step update error:', error);
      }
      setPendingAction(null);
    }
  };

  const openNavigation = (address, lat, lng) => {
    let navigationUrl;
    
    if (lat && lng) {
      // Precise navigation with coordinates + driving mode
      navigationUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
    } else if (address) {
      // Address-based navigation
      navigationUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}&travelmode=driving`;
    } else {
      toast.error('Location not available');
      return;
    }
    
    // Open Google Maps
    window.open(navigationUrl, '_blank');
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
    const customer = activeVisit.customer;
    const step = visit.current_step || 'go_to_customer';
    
    if (step === 'go_to_customer') {
      // Use pickup location if available, otherwise fall back to customer address or first property
      let pickupLocation = visit.pickup_location;
      let pickupLat = visit.pickup_lat;
      let pickupLng = visit.pickup_lng;
      
      // Fallback 1: Customer's address
      if (!pickupLocation && customer?.address) {
        pickupLocation = customer.address;
        pickupLat = customer.address_lat;
        pickupLng = customer.address_lng;
      }
      
      // Fallback 2: First property location (for manual visits without any pickup info)
      if (!pickupLocation && currentProperty) {
        pickupLocation = currentProperty.exact_address || currentProperty.address || 
          `${currentProperty.area_name}, ${currentProperty.city}`;
        pickupLat = currentProperty.latitude;
        pickupLng = currentProperty.longitude;
      }
      
      return {
        title: 'Go to Customer',
        subtitle: pickupLocation ? 'Navigate to pickup location' : 'Contact customer for pickup location',
        location: pickupLocation || `Contact: ${customer?.phone || visit.customer_phone || 'Customer'}`,
        lat: pickupLat,
        lng: pickupLng,
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
            <div className="flex items-center gap-4">
              {/* Branded Rider Photo */}
              <div className="relative">
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[#C6A87C] shadow-lg">
                  <img 
                    src={user?.profile_photo || `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop`}
                    alt={user?.name || 'Rider'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'R')}&background=04473C&color=fff&size=100`;
                    }}
                  />
                </div>
                {/* ApnaGhr Badge */}
                <div className="absolute -bottom-1 -right-1 bg-[#04473C] text-white text-[8px] font-bold px-1.5 py-0.5 rounded-sm shadow-md">
                  AG
                </div>
                {/* Online Indicator */}
                {isOnline && (
                  <div className="absolute top-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full animate-pulse" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-medium" style={{ fontFamily: 'Playfair Display, serif' }}>
                    Apna<span className="text-[#04473C]">Ghr</span>
                  </h1>
                  <span className="text-[10px] bg-[#04473C] text-white px-2 py-0.5 tracking-wider">RIDER</span>
                </div>
                <p className="text-sm text-[#4A4D53]">Welcome, <span className="font-medium text-[#04473C]">{user?.name}</span></p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => navigate('/rider/profile')}
                className="p-2 hover:bg-[#F5F3F0] transition-colors rounded-full"
                data-testid="profile-button"
                title="Profile & Bank Account"
              >
                <User className="w-5 h-5 text-[#04473C]" strokeWidth={1.5} />
              </button>
              <button 
                onClick={logout}
                className="p-2 hover:bg-[#F5F3F0] transition-colors rounded-full"
                data-testid="logout-button"
              >
                <LogOut className="w-5 h-5 text-[#4A4D53]" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-6">
        {/* ApnaGhr Promotional Banner with Image */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden mb-4 rounded-lg"
        >
          <img 
            src="https://customer-assets.emergentagent.com/job_field-rider-ops/artifacts/0c2eghg4_IMG_7401.jpeg"
            alt="ApnaGhr Rider"
            className="w-full h-40 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#04473C]/90 to-[#04473C]/60 flex items-center justify-between p-5">
            <div className="text-white">
              <p className="text-xs text-white/70 tracking-wider uppercase">Your Earnings Potential</p>
              <motion.p 
                className="text-xl font-semibold mt-1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                ₹150<span className="text-sm font-normal">/visit</span> • Daily Payouts
              </motion.p>
            </div>
            <div className="text-right text-white">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-[#C6A87C] text-[#1A1C20] px-3 py-1.5 text-xs font-bold tracking-wide"
              >
                10 visits = ₹2000
              </motion.div>
              <p className="text-[10px] text-white/60 mt-2 flex items-center justify-end gap-1">
                <span className="inline-block w-1 h-1 bg-[#C6A87C] rounded-full animate-pulse"></span>
                Powered by ApnaGhr
              </p>
            </div>
          </div>
        </motion.div>

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
                  {isOnline ? 'Accepting new requests' : 'Go online to start earning ₹150/visit'}
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
            { id: 'tracking', label: 'GPS Track', icon: Locate },
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
                  {/* Location with prominent NAVIGATE button - Uber Style */}
                  {stepInfo.location && (
                    <div className="bg-gradient-to-r from-[#1a73e8] to-[#4285f4] rounded-xl p-4 text-white">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-5 h-5" strokeWidth={2} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white/70 uppercase tracking-wider mb-1">
                            {stepInfo.title === 'Go to Customer' ? 'Pickup Location' : 'Navigate To'}
                          </p>
                          <p className="font-medium text-white leading-tight">{stepInfo.location}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          openNavigation(stepInfo.location, stepInfo.lat, stepInfo.lng);
                          toast.success('Opening Google Maps...', { icon: '🧭', duration: 2000 });
                        }}
                        className="w-full py-3 bg-white text-[#1a73e8] rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-white/90 transition-colors"
                        data-testid="navigate-button"
                      >
                        <Navigation className="w-5 h-5" strokeWidth={2} />
                        NAVIGATE IN GOOGLE MAPS
                      </button>
                    </div>
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

                  {/* Multi-Property Route View */}
                  {activeVisit.properties?.length > 1 && (
                    <div className="pt-4 border-t border-[#E5E1DB]">
                      <button
                        onClick={() => setShowRouteMap(true)}
                        className="w-full p-3 bg-[#04473C]/10 border border-[#04473C] rounded-lg flex items-center justify-center gap-2 text-[#04473C] hover:bg-[#04473C]/20 transition-colors"
                      >
                        <Route className="w-5 h-5" />
                        <span className="font-medium">View Optimized Route ({activeVisit.properties.length} Properties)</span>
                      </button>
                      
                      {activeVisit.optimized_route && (
                        <div className="mt-3 grid grid-cols-2 gap-3 text-center">
                          <div className="bg-[#F5F3F0] p-3 rounded-lg">
                            <p className="text-2xl font-bold text-[#04473C]">{activeVisit.optimized_route.total_distance_km}</p>
                            <p className="text-xs text-[#4A4D53]">Total km</p>
                          </div>
                          <div className="bg-[#F5F3F0] p-3 rounded-lg">
                            <p className="text-2xl font-bold text-[#04473C]">{Math.round(activeVisit.optimized_route.estimated_time_minutes)} min</p>
                            <p className="text-xs text-[#4A4D53]">Est. Time</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
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
                        {/* Header with Property Count & Earnings */}
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-lg text-[#1A1C20]">
                                {(visit.property_ids?.length || 1) === 1 
                                  ? 'Single Property Visit' 
                                  : `${visit.property_ids?.length || 1} Properties to Visit`}
                              </h4>
                              {(visit.property_ids?.length || 1) > 1 && (
                                <span className="bg-[#FF5A5F] text-white text-xs px-2 py-0.5 rounded-full font-medium">
                                  Multi-Stop
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-[#4A4D53]">
                              {visit.estimated_duration || `~${(visit.property_ids?.length || 1) * 30} mins`}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="badge badge-warning">Pending</span>
                            {visit.distance_km !== null && visit.distance_km !== undefined && (
                              <span className="text-xs font-medium text-[#04473C] bg-[#E6F0EE] px-2 py-1 rounded">
                                {visit.distance_km} km
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Earnings Banner */}
                        <div className="bg-gradient-to-r from-[#04473C] to-[#065f4e] rounded-lg p-4 mb-4">
                          <div className="flex items-center justify-between text-white">
                            <div>
                              <p className="text-xs text-white/70 uppercase tracking-wider">You'll Earn</p>
                              <div className="flex items-center gap-1">
                                <IndianRupee className="w-6 h-6" />
                                <span className="text-3xl font-bold">
                                  {visit.total_earnings || (visit.property_ids?.length || 1) * 100}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-white/70">
                                ₹100 × {visit.property_ids?.length || 1} {(visit.property_ids?.length || 1) === 1 ? 'property' : 'properties'}
                              </p>
                              {(visit.property_ids?.length || 1) > 1 && (
                                <p className="text-sm text-[#4ECDC4] font-medium mt-1">
                                  +Bonus for multi-stop!
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* All Property Locations */}
                        <div className="space-y-2 mb-4">
                          <p className="text-xs text-[#6B7280] uppercase tracking-wider font-medium mb-2">
                            {(visit.property_ids?.length || 1) === 1 ? 'Property Location' : 'All Locations'}
                          </p>
                          {visit.properties?.map((prop, idx) => (
                            <div key={prop.id} className="flex items-center gap-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-3">
                              <div className="w-8 h-8 bg-[#FF5A5F] text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                                {idx + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-[#1A1C20] truncate">{prop.title}</p>
                                <p className="text-sm text-[#6B7280] truncate">{prop.location || prop.area_name}</p>
                              </div>
                              {idx < (visit.properties?.length || 1) - 1 && (
                                <div className="text-xs text-[#9CA3AF]">→</div>
                              )}
                            </div>
                          ))}
                          {/* If no properties array, show basic info */}
                          {(!visit.properties || visit.properties.length === 0) && (
                            <div className="flex items-center gap-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-3">
                              <div className="w-8 h-8 bg-[#FF5A5F] text-white rounded-full flex items-center justify-center font-bold text-sm">
                                1
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-[#1A1C20] truncate">{visit.property_title || 'Property Visit'}</p>
                                <p className="text-sm text-[#6B7280] truncate">{visit.property_location || visit.pickup_location || 'Location details available after accepting'}</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Schedule & Customer Info */}
                        <div className="flex items-center justify-between py-3 border-y border-[#E5E7EB] mb-4">
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="w-4 h-4 text-[#52525B]" />
                            <span>{visit.scheduled_date || 'Flexible'} {visit.scheduled_time ? `at ${visit.scheduled_time}` : ''}</span>
                          </div>
                          <div className="text-sm text-[#6B7280]">
                            Customer: {visit.customer_name || 'Available after accept'}
                          </div>
                        </div>

                        {/* Accept Button */}
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleAcceptVisit(visit.id)}
                            className="btn-primary flex-1 flex items-center justify-center gap-2 py-4 text-lg"
                            data-testid={`accept-visit-${visit.id}`}
                          >
                            <CheckCircle className="w-6 h-6" />
                            ACCEPT & Earn ₹{visit.total_earnings || (visit.property_ids?.length || 1) * 100}
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

        {/* GPS Tracking Tab */}
        {activeTab === 'tracking' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-[#1A1C20]" style={{ fontFamily: 'Playfair Display, serif' }}>
                Live GPS Tracking
              </h3>
            </div>

            {!isOnline ? (
              <div className="bg-white border border-[#E5E1DB] p-12 text-center">
                <Power className="w-12 h-12 text-[#D0C9C0] mx-auto mb-3" strokeWidth={1} />
                <p className="text-[#4A4D53]">Go online to enable GPS tracking</p>
                <p className="text-sm text-[#4A4D53] mt-2">Your location will be shared with customers</p>
              </div>
            ) : (
              <RiderLocationTracker
                riderId={user?.id}
                riderName={user?.name}
                assignedVisits={activeVisit ? [{
                  id: activeVisit.visit?.id,
                  properties: activeVisit.properties,
                  ...activeVisit.visit
                }] : []}
                onVisitStatusChange={(visitId, status) => {
                  console.log('Visit status changed:', visitId, status);
                  if (status === 'completed') {
                    loadAvailableVisits();
                    loadWallet();
                  }
                }}
              />
            )}

            {/* Instructions */}
            <div className="mt-6 p-4 bg-[#E6F0EE] border border-[#04473C]/20 rounded-lg">
              <h4 className="font-medium text-[#04473C] mb-2">How GPS Tracking Works</h4>
              <ul className="text-sm text-[#4A4D53] space-y-2">
                <li>• Click "Start" to begin sharing your location</li>
                <li>• Customers will see your live position on the map</li>
                <li>• ETA is automatically calculated using real road distances</li>
                <li>• System detects when you reach within 100m of property</li>
                <li>• Keep this tab open while on duty for best tracking</li>
              </ul>
            </div>
          </div>
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
              <div className="bg-white border border-[#E5E1DB] p-12 text-center">
                <Power className="w-12 h-12 text-[#D0C9C0] mx-auto mb-3" strokeWidth={1} />
                <p className="text-[#4A4D53]">Go online to see available tasks</p>
              </div>
            ) : availableTasks.length === 0 ? (
              <div className="bg-white border border-[#E5E1DB] p-12 text-center">
                <ClipboardList className="w-12 h-12 text-[#D0C9C0] mx-auto mb-3" strokeWidth={1} />
                <p className="text-[#4A4D53]">No ToLet tasks available</p>
                <p className="text-sm text-[#4A4D53] mt-2">Check back later</p>
              </div>
            ) : (
              <div className="space-y-4">
                {availableTasks.map((task) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-[#E5E1DB] p-6 hover:shadow-lg transition-shadow"
                    data-testid={`task-${task.id}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-[#1A1C20]">{task.title}</h4>
                        <p className="text-sm text-[#4A4D53] flex items-center gap-1">
                          <MapPin className="w-3 h-3" strokeWidth={1.5} />
                          {task.location}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-[#E6F0EE] text-[#04473C] text-xs font-medium">{task.status}</span>
                    </div>
                    <p className="text-sm text-[#4A4D53] mb-4">{task.description}</p>
                    <div className="flex items-center justify-between py-3 border-y border-[#E5E1DB] mb-4">
                      <span className="text-sm text-[#4A4D53]">Est. Boards: {task.estimated_boards}</span>
                      <span className="price-display">
                        <span className="price-currency text-sm">₹</span>
                        {(task.rate_per_board * task.estimated_boards).toFixed(0)}
                      </span>
                    </div>
                    <button
                      onClick={() => handleAcceptTask(task.id)}
                      className="btn-secondary w-full flex items-center justify-center gap-2"
                      data-testid={`accept-task-${task.id}`}
                    >
                      <CheckCircle className="w-5 h-5" strokeWidth={1.5} />
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
              <h3 className="text-lg font-medium text-[#1A1C20]" style={{ fontFamily: 'Playfair Display, serif' }}>My Wallet</h3>
              <button onClick={loadWallet} className="p-2 hover:bg-[#F5F3F0] transition-colors">
                <RefreshCw className="w-4 h-4 text-[#4A4D53]" strokeWidth={1.5} />
              </button>
            </div>

            {/* Wallet Summary */}
            <div className="bg-white border border-[#E5E1DB] p-6 mb-6">
              <div className="text-center mb-6">
                <p className="text-sm text-[#4A4D53] uppercase tracking-wide mb-1">Total Earnings</p>
                <p className="price-display text-4xl">
                  <span className="price-currency text-xl">₹</span>
                  {wallet?.total_earnings?.toLocaleString() || 0}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-[#C6A87C]/10 border border-[#C6A87C]/30">
                  <p className="text-xs text-[#4A4D53] uppercase">Pending</p>
                  <p className="text-lg font-medium text-[#1A1C20]">₹{wallet?.pending_earnings || 0}</p>
                </div>
                <div className="text-center p-3 bg-[#E6F0EE] border border-[#04473C]/20">
                  <p className="text-xs text-[#4A4D53] uppercase">Approved</p>
                  <p className="text-lg font-medium text-[#04473C]">₹{wallet?.approved_earnings || 0}</p>
                </div>
                <div className="text-center p-3 bg-[#04473C] border border-[#04473C]">
                  <p className="text-xs text-white/80 uppercase">Paid Out</p>
                  <p className="text-lg font-medium text-white">₹{wallet?.paid_earnings || 0}</p>
                </div>
              </div>

              {wallet?.next_payout_date && (
                <div className="mt-4 pt-4 border-t border-[#E5E1DB] text-center">
                  <p className="text-sm text-[#4A4D53]">
                    Next payout: <span className="font-medium text-[#1A1C20]">{wallet.next_payout_date}</span>
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

      {/* Route Map Modal */}
      <AnimatePresence>
        {showRouteMap && activeVisit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
            onClick={() => setShowRouteMap(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-4 border-b border-[#E5E1DB] flex items-center justify-between">
                <h3 className="text-xl font-bold text-[#04473C]" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Optimized Visit Route
                </h3>
                <button
                  onClick={() => setShowRouteMap(false)}
                  className="p-2 hover:bg-[#F5F3F0] rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4">
                <MultiVisitRoute
                  visit={activeVisit.visit}
                  properties={activeVisit.properties}
                  optimizedRoute={activeVisit.optimized_route}
                  customer={activeVisit.customer}
                  currentStep={activeVisit.visit?.current_step}
                  onStartVisit={() => handleUpdateStep('start_visit')}
                  onCompleteProperty={(propId, index) => {
                    // Handle completing individual property
                    console.log('Complete property:', propId, index);
                  }}
                  onViewMap={() => {
                    // Open external map with route
                    if (activeVisit.optimized_route?.visits) {
                      const firstVisit = activeVisit.optimized_route.visits[0];
                      if (firstVisit) {
                        window.open(`https://www.google.com/maps/dir/?api=1&destination=${firstVisit.lat},${firstVisit.lng}`, '_blank');
                      }
                    }
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Terms Acceptance Modal - Blocks dashboard until accepted */}
      <TermsAcceptanceModal
        isOpen={showTermsModal}
        onAccept={async () => {
          try {
            await authAPI.acceptTerms({
              accepted_terms: true,
              accepted_privacy: true,
              accepted_anti_circumvention: true
            });
            setTermsAccepted(true);
            setShowTermsModal(false);
            toast.success('Terms accepted! You can now use the platform.');
          } catch (error) {
            toast.error('Failed to save terms. Please try again.');
          }
        }}
        onDecline={() => {
          toast.error('You must accept terms to continue. Logging out...');
          logout();
        }}
        userType="rider"
        context="dashboard"
      />

      {/* Compliance Check Modal - After Each Property Visit */}
      <AnimatePresence>
        {showComplianceModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-lg rounded-lg overflow-hidden"
            >
              <div className="p-4 bg-[#04473C] text-white">
                <div className="flex items-center gap-3">
                  <Shield className="w-6 h-6" />
                  <div>
                    <h3 className="font-semibold text-lg">Compliance Check</h3>
                    <p className="text-sm text-white/80">Answer honestly - violations will be penalized</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Question 1 */}
                <div className="space-y-3">
                  <p className="font-medium text-[#1A1C20]">
                    1. Were you with the client the entire time during this property visit?
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setComplianceAnswers(prev => ({ ...prev, with_client_all_time: true }))}
                      className={`flex-1 py-3 border-2 font-medium transition-colors ${
                        complianceAnswers.with_client_all_time === true
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-[#E5E1DB] hover:border-green-300'
                      }`}
                    >
                      <CheckCircle className={`w-5 h-5 mx-auto mb-1 ${complianceAnswers.with_client_all_time === true ? 'text-green-600' : 'text-[#9CA3AF]'}`} />
                      Yes
                    </button>
                    <button
                      onClick={() => setComplianceAnswers(prev => ({ ...prev, with_client_all_time: false }))}
                      className={`flex-1 py-3 border-2 font-medium transition-colors ${
                        complianceAnswers.with_client_all_time === false
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-[#E5E1DB] hover:border-red-300'
                      }`}
                    >
                      <XCircle className={`w-5 h-5 mx-auto mb-1 ${complianceAnswers.with_client_all_time === false ? 'text-red-600' : 'text-[#9CA3AF]'}`} />
                      No
                    </button>
                  </div>
                </div>

                {/* Question 2 - CRITICAL */}
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                    <p className="font-medium text-[#1A1C20]">
                      2. Did the client share their contact number with the property owner?
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setComplianceAnswers(prev => ({ ...prev, client_shared_contact: true }))}
                      className={`flex-1 py-3 border-2 font-medium transition-colors ${
                        complianceAnswers.client_shared_contact === true
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-[#E5E1DB] hover:border-red-300'
                      }`}
                    >
                      <AlertTriangle className={`w-5 h-5 mx-auto mb-1 ${complianceAnswers.client_shared_contact === true ? 'text-red-600' : 'text-[#9CA3AF]'}`} />
                      Yes (Violation!)
                    </button>
                    <button
                      onClick={() => setComplianceAnswers(prev => ({ ...prev, client_shared_contact: false }))}
                      className={`flex-1 py-3 border-2 font-medium transition-colors ${
                        complianceAnswers.client_shared_contact === false
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-[#E5E1DB] hover:border-green-300'
                      }`}
                    >
                      <CheckCircle className={`w-5 h-5 mx-auto mb-1 ${complianceAnswers.client_shared_contact === false ? 'text-green-600' : 'text-[#9CA3AF]'}`} />
                      No
                    </button>
                  </div>
                </div>

                {/* Question 3 - CRITICAL */}
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                    <p className="font-medium text-[#1A1C20]">
                      3. Did you help the client in direct negotiations with the owner?
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setComplianceAnswers(prev => ({ ...prev, helped_negotiations: true }))}
                      className={`flex-1 py-3 border-2 font-medium transition-colors ${
                        complianceAnswers.helped_negotiations === true
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-[#E5E1DB] hover:border-red-300'
                      }`}
                    >
                      <AlertTriangle className={`w-5 h-5 mx-auto mb-1 ${complianceAnswers.helped_negotiations === true ? 'text-red-600' : 'text-[#9CA3AF]'}`} />
                      Yes (Violation!)
                    </button>
                    <button
                      onClick={() => setComplianceAnswers(prev => ({ ...prev, helped_negotiations: false }))}
                      className={`flex-1 py-3 border-2 font-medium transition-colors ${
                        complianceAnswers.helped_negotiations === false
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-[#E5E1DB] hover:border-green-300'
                      }`}
                    >
                      <CheckCircle className={`w-5 h-5 mx-auto mb-1 ${complianceAnswers.helped_negotiations === false ? 'text-green-600' : 'text-[#9CA3AF]'}`} />
                      No
                    </button>
                  </div>
                </div>

                {/* Warning */}
                {(complianceAnswers.client_shared_contact === true || complianceAnswers.helped_negotiations === true) && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-6 h-6 text-red-600 mt-0.5" />
                      <div>
                        <p className="font-semibold text-red-800">Terms Violation Detected!</p>
                        <p className="text-sm text-red-700 mt-1">
                          This visit will be terminated and flagged for review. 
                          Penalties may include fines up to ₹1,00,000 and account termination.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-[#E5E1DB] flex gap-3">
                <button
                  onClick={() => {
                    setShowComplianceModal(false);
                    setPendingAction(null);
                    setComplianceAnswers({
                      with_client_all_time: null,
                      client_shared_contact: null,
                      helped_negotiations: null
                    });
                  }}
                  className="flex-1 py-3 border border-[#E5E1DB] text-[#4A4D53] hover:bg-[#F5F3F0] transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleComplianceSubmit}
                  disabled={
                    complianceAnswers.with_client_all_time === null ||
                    complianceAnswers.client_shared_contact === null ||
                    complianceAnswers.helped_negotiations === null
                  }
                  className={`flex-1 py-3 font-medium transition-colors ${
                    complianceAnswers.client_shared_contact === true || complianceAnswers.helped_negotiations === true
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-[#04473C] hover:bg-[#033830] text-white'
                  } disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed`}
                  data-testid="compliance-submit-btn"
                >
                  {complianceAnswers.client_shared_contact === true || complianceAnswers.helped_negotiations === true
                    ? 'Report Violation & End Visit'
                    : 'Submit & Complete Property'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exciting Accept Animation Modal - Uber Style */}
      <AnimatePresence>
        {showAcceptAnimation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[#04473C] flex items-center justify-center overflow-hidden"
          >
            {/* Animated Background Circles */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full bg-white/5"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ 
                    scale: [0, 2, 2.5],
                    opacity: [0, 0.3, 0],
                  }}
                  transition={{
                    duration: 3,
                    delay: i * 0.5,
                    repeat: Infinity,
                    ease: "easeOut"
                  }}
                  style={{
                    width: '300px',
                    height: '300px',
                    left: `${20 + i * 15}%`,
                    top: `${30 + (i % 3) * 20}%`,
                  }}
                />
              ))}
            </div>

            {/* Confetti Effect */}
            {acceptAnimationStep >= 2 && (
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(30)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-3 h-3"
                    initial={{ 
                      y: -20,
                      x: Math.random() * window.innerWidth,
                      rotate: 0,
                      opacity: 1
                    }}
                    animate={{ 
                      y: window.innerHeight + 100,
                      rotate: 360 * (Math.random() > 0.5 ? 1 : -1),
                      opacity: [1, 1, 0]
                    }}
                    transition={{
                      duration: 3 + Math.random() * 2,
                      delay: Math.random() * 0.5,
                      ease: "linear"
                    }}
                    style={{
                      backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'][i % 6],
                      borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                    }}
                  />
                ))}
              </div>
            )}

            {/* Main Content */}
            <div className="relative z-10 text-center px-8 max-w-md mx-auto">
              
              {/* Step 1: Accepting... */}
              <AnimatePresence mode="wait">
                {acceptAnimationStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="text-white"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-20 h-20 border-4 border-white/30 border-t-white rounded-full mx-auto mb-6"
                    />
                    <p className="text-2xl font-medium">Accepting Visit...</p>
                  </motion.div>
                )}

                {/* Step 2: Accepted! */}
                {acceptAnimationStep === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, y: -50 }}
                    className="text-white"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: [0, 1.3, 1] }}
                      transition={{ duration: 0.5, times: [0, 0.6, 1] }}
                      className="w-24 h-24 bg-[#4ECDC4] rounded-full mx-auto mb-6 flex items-center justify-center"
                    >
                      <CheckCircle className="w-14 h-14 text-white" strokeWidth={2.5} />
                    </motion.div>
                    <motion.h2
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-4xl font-bold mb-2"
                    >
                      ACCEPTED!
                    </motion.h2>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="text-white/80 text-lg"
                    >
                      You got a new ride!
                    </motion.p>
                  </motion.div>
                )}

                {/* Step 3: Show Earnings */}
                {acceptAnimationStep === 3 && acceptedVisitData && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -30 }}
                    className="text-white"
                  >
                    {/* Money Rain Effect */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                      {[...Array(15)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute text-4xl"
                          initial={{ 
                            y: -50,
                            x: Math.random() * 300 + 50,
                            rotate: 0,
                            opacity: 1
                          }}
                          animate={{ 
                            y: 800,
                            rotate: 360,
                            opacity: [1, 1, 0]
                          }}
                          transition={{
                            duration: 3,
                            delay: i * 0.2,
                            ease: "linear"
                          }}
                        >
                          💰
                        </motion.div>
                      ))}
                    </div>
                    
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: [0.8, 1.1, 1] }}
                      className="mb-6"
                    >
                      <motion.div
                        animate={{ 
                          scale: [1, 1.05, 1],
                        }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                        className="inline-block"
                      >
                        <p className="text-xl text-[#4ECDC4] uppercase tracking-wider mb-3 font-bold">💵 You'll Earn 💵</p>
                      </motion.div>
                      <div className="flex items-center justify-center gap-2">
                        <motion.span
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="text-6xl font-bold text-[#FFD700]"
                        >
                          ₹
                        </motion.span>
                        <motion.span
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                          className="text-8xl font-black text-white"
                          style={{ textShadow: '0 0 30px rgba(78, 205, 196, 0.5)' }}
                        >
                          {acceptedVisitData.visit?.total_earnings || (acceptedVisitData.properties?.length || 1) * 100}
                        </motion.span>
                      </div>
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="text-[#4ECDC4] mt-2 text-lg"
                      >
                        Cash in your pocket! 🎉
                      </motion.p>
                    </motion.div>
                    
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="flex items-center justify-center gap-4 text-white/80"
                    >
                      <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
                        <Home className="w-5 h-5" />
                        <span>{acceptedVisitData.properties?.length || 1} {(acceptedVisitData.properties?.length || 1) === 1 ? 'Property' : 'Properties'}</span>
                      </div>
                      {acceptedVisitData.optimized_route && (
                        <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
                          <Navigation className="w-5 h-5" />
                          <span>{acceptedVisitData.optimized_route.total_distance_km} km</span>
                        </div>
                      )}
                    </motion.div>
                  </motion.div>
                )}

                {/* Step 4: Customer Info */}
                {acceptAnimationStep === 4 && acceptedVisitData && (
                  <motion.div
                    key="step4"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -30 }}
                    className="text-white"
                  >
                    {/* Pulsing rings around avatar */}
                    <div className="relative mx-auto w-28 h-28 mb-6">
                      <motion.div
                        className="absolute inset-0 rounded-full border-2 border-[#4ECDC4]"
                        animate={{ scale: [1, 1.5, 1.5], opacity: [0.5, 0, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      <motion.div
                        className="absolute inset-0 rounded-full border-2 border-[#4ECDC4]"
                        animate={{ scale: [1, 1.3, 1.3], opacity: [0.5, 0, 0] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                      />
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-28 h-28 bg-gradient-to-br from-[#4ECDC4] to-[#44A08D] rounded-full flex items-center justify-center shadow-lg"
                      >
                        <User className="w-14 h-14" />
                      </motion.div>
                    </div>
                    
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-[#4ECDC4] uppercase tracking-wider mb-2 font-medium"
                    >
                      🎯 Your Customer
                    </motion.p>
                    
                    <motion.h3
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-4xl font-bold mb-4"
                    >
                      {acceptedVisitData.customer?.name || acceptedVisitData.visit?.customer_name || 'Customer'}
                    </motion.h3>
                    
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 }}
                      className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 mt-4 border border-white/20"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-[#FF5A5F] rounded-full flex items-center justify-center">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <p className="text-sm text-white/70 uppercase tracking-wider">Pickup Location</p>
                      </div>
                      <p className="text-lg text-left">
                        {acceptedVisitData.visit?.pickup_location || 'Location will be shown after navigation starts'}
                      </p>
                    </motion.div>
                    
                    {/* Phone Number */}
                    {(acceptedVisitData.customer?.phone || acceptedVisitData.visit?.customer_phone) && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="mt-4 flex items-center justify-center gap-2 text-[#4ECDC4]"
                      >
                        <Phone className="w-5 h-5" />
                        <span className="text-lg">{acceptedVisitData.customer?.phone || acceptedVisitData.visit?.customer_phone}</span>
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {/* Step 5: Starting Navigation */}
                {acceptAnimationStep === 5 && (
                  <motion.div
                    key="step5"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-white"
                  >
                    <motion.div
                      animate={{ 
                        scale: [1, 1.2, 1],
                        rotate: [0, 10, -10, 0]
                      }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                      className="w-24 h-24 bg-[#1a73e8] rounded-full mx-auto mb-6 flex items-center justify-center"
                    >
                      <Navigation className="w-12 h-12" />
                    </motion.div>
                    
                    <motion.h2
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-2xl font-bold mb-2"
                    >
                      Opening Google Maps...
                    </motion.h2>
                    
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="text-white/80"
                    >
                      Get ready to drive!
                    </motion.p>
                    
                    {/* Animated dots */}
                    <div className="flex justify-center gap-2 mt-4">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-3 h-3 bg-white rounded-full"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{
                            duration: 1,
                            delay: i * 0.2,
                            repeat: Infinity,
                          }}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RiderDashboard;
