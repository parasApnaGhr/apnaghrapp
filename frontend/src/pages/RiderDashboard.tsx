// @ts-nocheck
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
import { StitchShell } from '../stitch/components/StitchPrimitives';

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
    <StitchShell 
      title="Rider Dashboard" 
      eyebrow="Operations" 
      subtitle={isOnline ? "Active and accepting requests" : "You are currently offline. Go online to start receiving tasks."}
      actions={
        <StitchButton
          onClick={toggleOnlineStatus}
          disabled={shiftLoading}
          variant={isOnline ? "secondary" : "primary"}
          className={isOnline ? "border-red-500 text-red-600" : ""}
        >
          {shiftLoading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : isOnline ? (
            <>
              <Power className="mr-2 h-4 w-4" />
              Go Offline
            </>
          ) : (
            <>
              <Power className="mr-2 h-4 w-4" />
              Go Online
            </>
          )}
        </StitchButton>
      }
    >
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StitchKpi 
          label="Today's Potential" 
          value="₹150" 
          detail="/ per property visit" 
          icon={IndianRupee} 
        />
        <StitchKpi 
          label="Target Bonus" 
          value="₹2000" 
          detail="for 10 visits today" 
          icon={CheckCircle} 
        />
        <StitchKpi 
          label="Wallet Balance" 
          value={`₹${wallet?.approved_earnings || 0}`} 
          detail="Available for withdrawal" 
          icon={Wallet} 
        />
        <StitchKpi 
          label="Current Status" 
          value={isOnline ? "ONLINE" : "OFFLINE"} 
          detail={isOnline ? "Ready for tasks" : "No tasks active"} 
          icon={Power} 
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_350px]">
        <div className="space-y-8">
          {/* Active Tab Content */}
          {activeTab === 'visits' && (
            <div className="space-y-6">
              <StitchSectionHeader 
                title="Property Visits" 
                copy="Manage your active and available property verification tasks."
                action={
                  <StitchButton variant="ghost" onClick={loadAvailableVisits} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  </StitchButton>
                }
              />

              {/* Active Visit */}
              {activeVisit && stepInfo && (
                <StitchCard className="overflow-hidden border border-[var(--stitch-line)]">
                  <div className="bg-[var(--stitch-ink)] p-5 text-[var(--stitch-bg)]">
                    <div className="flex items-center gap-4">
                      <stepInfo.icon className="h-8 w-8" />
                      <div>
                        <p className="stitch-eyebrow text-[var(--stitch-bg)] opacity-70">Current Step</p>
                        <h2 className="font-headline text-xl font-black uppercase">{stepInfo.title}</h2>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    {stepInfo.location && (
                      <div className="rounded-2xl border border-[var(--stitch-line)] bg-[var(--stitch-soft)] p-5">
                        <div className="flex items-start gap-3 mb-4">
                          <MapPin className="mt-1 h-5 w-5 text-[var(--stitch-muted)]" />
                          <div>
                            <p className="stitch-eyebrow">Location</p>
                            <p className="font-bold">{stepInfo.location}</p>
                          </div>
                        </div>
                        <StitchButton 
                          className="w-full justify-center"
                          onClick={() => openNavigation(stepInfo.location, stepInfo.lat, stepInfo.lng)}
                        >
                          <Navigation className="mr-2 h-4 w-4" />
                          Open in Google Maps
                        </StitchButton>
                      </div>
                    )}

                    {stepInfo.showOTP && (
                      <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--stitch-line-strong)] p-8">
                        <p className="stitch-eyebrow mb-2">Customer OTP</p>
                        <p className="font-headline text-5xl font-black tracking-[0.2em]">{stepInfo.otp}</p>
                      </div>
                    )}

                    {stepInfo.showUploadProof && (
                      <StitchButton 
                        variant="secondary"
                        className="w-full justify-center border-dashed"
                        onClick={() => {
                          setCurrentProofPropertyId(stepInfo.property?.id);
                          setShowProofUpload(true);
                        }}
                      >
                        <Camera className="mr-2 h-4 w-4" />
                        Upload Visit Proof
                      </StitchButton>
                    )}

                    <div className="flex flex-col gap-3 sm:flex-row">
                      {activeVisit.customer && (
                        <StitchButton 
                          variant="secondary"
                          className="flex-1 justify-center"
                          onClick={() => window.open(`tel:${activeVisit.customer.phone}`, '_self')}
                        >
                          <Phone className="mr-2 h-4 w-4" />
                          Call Customer
                        </StitchButton>
                      )}
                      <StitchButton 
                        className="flex-1 justify-center"
                        onClick={() => handleUpdateStep(stepInfo.action)}
                      >
                        {stepInfo.actionText}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </StitchButton>
                    </div>

                    {/* Progress */}
                    <div className="space-y-3 pt-4 border-t border-[var(--stitch-line)]">
                      <p className="stitch-eyebrow">Visit Progress</p>
                      <div className="flex gap-2">
                        {activeVisit.properties?.map((prop, idx) => (
                          <div
                            key={prop.id}
                            className={`h-2 flex-1 rounded-full transition-colors ${
                              (activeVisit.visit.properties_completed || []).includes(prop.id)
                                ? 'bg-[var(--stitch-ink)]'
                                : idx === activeVisit.visit.current_property_index
                                ? 'bg-[var(--stitch-line-strong)]'
                                : 'bg-[var(--stitch-line)]'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </StitchCard>
              )}

              {/* Available Visits List */}
              {isOnline && !activeVisit && (
                <div className="space-y-4">
                  {loading ? (
                    <div className="grid gap-4">
                      <StitchSkeleton className="h-48 rounded-[28px]" />
                      <StitchSkeleton className="h-48 rounded-[28px]" />
                    </div>
                  ) : availableVisits.length === 0 ? (
                    <StitchCard className="flex flex-col items-center justify-center p-12 text-center">
                      <Clock className="mb-4 h-12 w-12 text-[var(--stitch-muted)] opacity-20" />
                      <p className="font-bold uppercase tracking-widest text-[var(--stitch-muted)]">No active requests</p>
                      <p className="mt-2 text-sm text-[var(--stitch-muted)]">New property verification tasks will appear here.</p>
                    </StitchCard>
                  ) : (
                    availableVisits.map((visit) => (
                      <StitchCard key={visit.id} className="p-6 transition-transform hover:scale-[1.01] active:scale-[0.99]">
                        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
                          <div className="space-y-4 flex-1">
                            <div>
                              <div className="flex items-center gap-3">
                                <span className="rounded-full bg-[var(--stitch-ink)] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[var(--stitch-bg)]">
                                  {visit.property_ids?.length || 1} Stop{(visit.property_ids?.length || 1) > 1 ? 's' : ''}
                                </span>
                                {visit.distance_km && (
                                  <span className="text-xs font-bold text-[var(--stitch-muted)]">
                                    {visit.distance_km} km away
                                  </span>
                                )}
                              </div>
                              <h3 className="mt-2 font-headline text-2xl font-black uppercase tracking-tight">
                                {visit.property_title || 'Property Visit'}
                              </h3>
                              <p className="text-sm text-[var(--stitch-muted)]">
                                Estimated duration: {visit.estimated_duration || '30-45 mins'}
                              </p>
                            </div>

                            <div className="flex items-center gap-4 rounded-xl bg-[var(--stitch-soft)] p-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--stitch-ink)] text-white">
                                <IndianRupee className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-[var(--stitch-muted)]">Earnings</p>
                                <p className="text-xl font-black">₹{visit.total_earnings || 150}</p>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col gap-3 min-w-[200px]">
                            <StitchButton onClick={() => handleAcceptVisit(visit.id)} className="w-full justify-center">
                              Accept Request
                            </StitchButton>
                            <StitchButton variant="secondary" className="w-full justify-center">
                              Decline
                            </StitchButton>
                          </div>
                        </div>
                      </StitchCard>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'tracking' && (
            <div className="space-y-6">
              <StitchSectionHeader title="Live GPS Tracking" copy="Real-time location sharing for active visits." />
              {!isOnline ? (
                <StitchCard className="p-12 text-center">
                  <Locate className="mx-auto mb-4 h-12 w-12 text-[var(--stitch-muted)] opacity-20" />
                  <p className="text-[var(--stitch-muted)]">Go online to enable live tracking.</p>
                </StitchCard>
              ) : (
                <StitchCard className="overflow-hidden p-0 h-[500px]">
                  <RiderLocationTracker
                    riderId={user?.id}
                    riderName={user?.name}
                    assignedVisits={activeVisit ? [{
                      id: activeVisit.visit?.id,
                      properties: activeVisit.properties,
                      ...activeVisit.visit
                    }] : []}
                    onVisitStatusChange={(visitId, status) => {
                      if (status === 'completed') {
                        loadAvailableVisits();
                        loadWallet();
                      }
                    }}
                  />
                </StitchCard>
              )}
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="space-y-6">
              <StitchSectionHeader 
                title="ToLet Tasks" 
                copy="Earn by collecting ToLet boards in your area." 
                action={
                  <StitchButton variant="ghost" onClick={loadAvailableTasks}>
                    <RefreshCw className="h-4 w-4" />
                  </StitchButton>
                }
              />
              
              {activeTask ? (
                <StitchCard className="p-6 space-y-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-headline text-xl font-black uppercase">{activeTask.title}</h3>
                      <p className="text-sm text-[var(--stitch-muted)]">{activeTask.location}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-[var(--stitch-ink)]">₹{activeTask.rate_per_board}/board</p>
                    </div>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="stitch-eyebrow">Boards Collected</label>
                      <StitchInput 
                        type="number" 
                        value={taskCompletion.boardsCollected}
                        onChange={(e) => setTaskCompletion({ ...taskCompletion, boardsCollected: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="stitch-eyebrow">Proof Photos</label>
                      <div className="flex flex-wrap gap-2">
                        {taskCompletion.proofImages.map((url, i) => (
                          <div key={i} className="relative h-16 w-16 overflow-hidden rounded-lg border border-[var(--stitch-line)]">
                            <img src={url} className="h-full w-full object-cover" />
                            <button 
                              onClick={() => removeTaskPhoto(i)}
                              className="absolute right-0 top-0 bg-red-500 p-0.5 text-white"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                        <button 
                          onClick={() => taskFileInputRef.current?.click()}
                          className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-dashed border-[var(--stitch-line)] hover:bg-[var(--stitch-soft)]"
                        >
                          <Camera className="h-5 w-5 text-[var(--stitch-muted)]" />
                        </button>
                        <input ref={taskFileInputRef} type="file" className="hidden" multiple onChange={handleTaskPhotoUpload} />
                      </div>
                    </div>
                  </div>

                  <StitchButton className="w-full justify-center" onClick={handleCompleteTask} disabled={loading}>
                    {loading ? "Submitting..." : "Complete Task"}
                  </StitchButton>
                </StitchCard>
              ) : (
                <div className="space-y-4">
                  {availableTasks.length === 0 ? (
                    <StitchCard className="p-12 text-center">
                      <ClipboardList className="mx-auto mb-4 h-12 w-12 text-[var(--stitch-muted)] opacity-20" />
                      <p className="text-[var(--stitch-muted)]">No ToLet tasks available.</p>
                    </StitchCard>
                  ) : (
                    availableTasks.map(task => (
                      <StitchCard key={task.id} className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-bold uppercase tracking-tight">{task.title}</h4>
                            <p className="text-xs text-[var(--stitch-muted)]">{task.location}</p>
                          </div>
                          <StitchButton onClick={() => handleAcceptTask(task.id)}>
                            Accept
                          </StitchButton>
                        </div>
                      </StitchCard>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'wallet' && (
            <div className="space-y-6">
              <StitchSectionHeader title="My Wallet" copy="Track your earnings and payment history." />
              <StitchCard className="p-8 text-center">
                <p className="stitch-eyebrow mb-2">Total Earnings</p>
                <p className="font-headline text-6xl font-black tracking-tight">₹{wallet?.total_earnings || 0}</p>
                
                <div className="mt-8 grid grid-cols-3 gap-4">
                  <div className="space-y-1 rounded-2xl bg-[var(--stitch-soft)] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--stitch-muted)]">Pending</p>
                    <p className="font-black">₹{wallet?.pending_earnings || 0}</p>
                  </div>
                  <div className="space-y-1 rounded-2xl bg-[var(--stitch-soft)] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--stitch-muted)]">Approved</p>
                    <p className="font-black text-green-600">₹{wallet?.approved_earnings || 0}</p>
                  </div>
                  <div className="space-y-1 rounded-2xl bg-[var(--stitch-ink)] p-4 text-[var(--stitch-bg)]">
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Paid Out</p>
                    <p className="font-black">₹{wallet?.paid_earnings || 0}</p>
                  </div>
                </div>
              </StitchCard>

              <StitchSectionHeader title="Recent Activity" />
              <div className="overflow-hidden rounded-[28px] border border-[var(--stitch-line)]">
                {transactions.length === 0 ? (
                  <div className="p-12 text-center text-[var(--stitch-muted)]">No transactions yet.</div>
                ) : (
                  transactions.map((tx, i) => (
                    <div key={tx.id} className={`flex items-center justify-between p-5 ${i !== transactions.length - 1 ? 'border-b border-[var(--stitch-line)]' : ''}`}>
                      <div>
                        <p className="font-bold">{tx.description}</p>
                        <p className="text-xs text-[var(--stitch-muted)]">{new Date(tx.created_at).toLocaleDateString()}</p>
                      </div>
                      <p className={`font-black ${tx.type === 'payout' ? 'text-red-500' : 'text-green-600'}`}>
                        {tx.type === 'payout' ? '-' : '+'}₹{tx.amount}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar / Quick Actions */}
        <div className="space-y-6">
          <StitchCard className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 overflow-hidden rounded-[20px] border-2 border-[var(--stitch-line)]">
                <img 
                  src={user?.profile_photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'R')}&background=000&color=fff`} 
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <p className="stitch-eyebrow">Rider Account</p>
                <p className="text-lg font-black uppercase tracking-tight">{user?.name}</p>
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-2">
              <StitchButton variant="secondary" className="justify-center" onClick={() => navigate('/rider/profile')}>
                <User className="mr-2 h-4 w-4" />
                Profile & Bank
              </StitchButton>
              <StitchButton variant="ghost" className="justify-center text-red-600" onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </StitchButton>
            </div>
          </StitchCard>

          <StitchCard className="bg-[var(--stitch-soft)] p-6">
            <h4 className="font-headline text-sm font-black uppercase tracking-widest">Rider Support</h4>
            <p className="mt-2 text-xs text-[var(--stitch-muted)] leading-relaxed">
              Need help with a visit or payment? Our operations team is available 24/7.
            </p>
            <StitchButton variant="secondary" className="mt-4 w-full justify-center">
              <Phone className="mr-2 h-4 w-4" />
              Contact Ops
            </StitchButton>
          </StitchCard>
        </div>
      </div>

      <StitchBottomDock 
        items={[
          { label: 'Visits', to: '#', icon: Navigation },
          { label: 'GPS', to: '#', icon: Locate },
          { label: 'Tasks', to: '#', icon: ClipboardList },
          { label: 'Wallet', to: '#', icon: Wallet },
          { label: 'Profile', to: '/rider/profile', icon: User }
        ]}
      />

      {/* Modals & Overlays (preserve existing logic) */}
      <StitchModal open={showProofUpload}>
        <div className="p-2">
          <StitchSectionHeader title="Upload Visit Proof" copy="Upload a selfie and a short video at the property location." />
          <div className="mt-6">
            <VisitProofUpload
              visitId={activeVisit?.visit?.id}
              propertyId={currentProofPropertyId}
              onComplete={() => {
                toast.success('Proof uploaded!');
                setShowProofUpload(false);
              }}
              onCancel={() => setShowProofUpload(false)}
            />
          </div>
        </div>
      </StitchModal>

      {/* Compliance Modal (Partial Migration) */}
      {showComplianceModal && (
        <StitchModal open={true}>
          <div className="space-y-6">
            <StitchSectionHeader 
              title="Compliance Check" 
              eyebrow="Required" 
              copy="Answer honestly - violations will result in immediate account termination."
            />
            
            <div className="space-y-6">
              <div className="space-y-3">
                <p className="font-bold">1. Were you with the client the entire time?</p>
                <div className="flex gap-3">
                  <StitchButton 
                    variant={complianceAnswers.with_client_all_time === true ? "primary" : "secondary"}
                    className="flex-1 justify-center"
                    onClick={() => setComplianceAnswers(prev => ({ ...prev, with_client_all_time: true }))}
                  >
                    Yes
                  </StitchButton>
                  <StitchButton 
                    variant={complianceAnswers.with_client_all_time === false ? "primary" : "secondary"}
                    className="flex-1 justify-center"
                    onClick={() => setComplianceAnswers(prev => ({ ...prev, with_client_all_time: false }))}
                  >
                    No
                  </StitchButton>
                </div>
              </div>

              <div className="space-y-3">
                <p className="font-bold">2. Did the client share contact with the owner?</p>
                <div className="flex gap-3">
                  <StitchButton 
                    variant={complianceAnswers.client_shared_contact === true ? "primary" : "secondary"}
                    className={`flex-1 justify-center ${complianceAnswers.client_shared_contact === true ? 'bg-red-600 border-red-600' : ''}`}
                    onClick={() => setComplianceAnswers(prev => ({ ...prev, client_shared_contact: true }))}
                  >
                    Yes (Violation)
                  </StitchButton>
                  <StitchButton 
                    variant={complianceAnswers.client_shared_contact === false ? "primary" : "secondary"}
                    className="flex-1 justify-center"
                    onClick={() => setComplianceAnswers(prev => ({ ...prev, client_shared_contact: false }))}
                  >
                    No
                  </StitchButton>
                </div>
              </div>

              <div className="space-y-3">
                <p className="font-bold">3. Did you help in direct negotiations?</p>
                <div className="flex gap-3">
                  <StitchButton 
                    variant={complianceAnswers.helped_negotiations === true ? "primary" : "secondary"}
                    className={`flex-1 justify-center ${complianceAnswers.helped_negotiations === true ? 'bg-red-600 border-red-600' : ''}`}
                    onClick={() => setComplianceAnswers(prev => ({ ...prev, helped_negotiations: true }))}
                  >
                    Yes (Violation)
                  </StitchButton>
                  <StitchButton 
                    variant={complianceAnswers.helped_negotiations === false ? "primary" : "secondary"}
                    className="flex-1 justify-center"
                    onClick={() => setComplianceAnswers(prev => ({ ...prev, helped_negotiations: false }))}
                  >
                    No
                  </StitchButton>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-6 border-t border-[var(--stitch-line)]">
              <StitchButton variant="ghost" onClick={() => setShowComplianceModal(false)}>Cancel</StitchButton>
              <StitchButton 
                className="flex-1 justify-center" 
                onClick={handleComplianceSubmit}
                disabled={complianceAnswers.with_client_all_time === null}
              >
                Submit & Continue
              </StitchButton>
            </div>
          </div>
        </StitchModal>
      )}

      {/* Acceptance Animation Overlay */}
      <AnimatePresence>
        {showAcceptAnimation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[var(--stitch-ink)] flex flex-col items-center justify-center p-8 text-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="space-y-6"
            >
              <div className="flex h-24 w-24 mx-auto items-center justify-center rounded-full bg-[var(--stitch-bg)] text-[var(--stitch-ink)]">
                <CheckCircle className="h-12 w-12" />
              </div>
              <h2 className="font-headline text-4xl font-black uppercase text-[var(--stitch-bg)]">Request Accepted</h2>
              <p className="text-[var(--stitch-bg)] opacity-70">Prepare for navigation to pickup location.</p>
              <div className="rounded-2xl bg-white/10 p-6">
                <p className="text-xs font-bold uppercase tracking-widest text-white/50">Potential Earnings</p>
                <p className="font-headline text-5xl font-black text-white">₹{acceptedVisitData?.visit?.total_earnings || 150}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
            toast.success('Terms accepted!');
          } catch (error) {
            toast.error('Failed to save terms.');
          }
        }}
        onDecline={() => logout()}
        userType="rider"
      />
    </StitchShell>
  );
};

export default RiderDashboard;
