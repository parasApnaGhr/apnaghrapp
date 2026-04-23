// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, User, MapPin, Target, Check, AlertCircle, Clock, RefreshCw, Plus, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

const InventoryLoginModal = ({ isOpen, onSessionStarted }) => {
  const [step, setStep] = useState(1); // 1: User Details, 2: Photo Capture, 3: Work Plan
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // User selection
  const [predefinedUsers, setPredefinedUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [showAddName, setShowAddName] = useState(false);
  const [customName, setCustomName] = useState('');
  const [addingName, setAddingName] = useState(false);
  
  // Photo capture
  const [photoBase64, setPhotoBase64] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  
  // Work plan
  const [availableCities, setAvailableCities] = useState([]);
  const [selectedCities, setSelectedCities] = useState([]);
  const [cityTargets, setCityTargets] = useState({});
  const [showAddCity, setShowAddCity] = useState(false);
  const [customCity, setCustomCity] = useState('');
  const [addingCity, setAddingCity] = useState(false);

  const API_URL = import.meta.env.VITE_BACKEND_URL;
  const DEFAULT_CITY_TARGET = 15; // Default target per city

  const fetchPredefinedUsers = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/inventory/predefined-users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.users) {
        setPredefinedUsers(data.users);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  }, [API_URL]);

  const handleAddNewName = async () => {
    if (!customName.trim()) {
      setError('Please enter your name');
      return;
    }
    
    const trimmedName = customName.trim();
    
    if (predefinedUsers.includes(trimmedName)) {
      setError('This name already exists. Please select it from the list.');
      return;
    }
    
    setAddingName(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const updatedUsers = [...predefinedUsers, trimmedName];
      
      const response = await fetch(`${API_URL}/api/inventory/predefined-users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedUsers)
      });
      
      if (response.ok) {
        setPredefinedUsers(updatedUsers);
        setSelectedUser(trimmedName);
        setShowAddName(false);
        setCustomName('');
        toast.success(`Welcome ${trimmedName}! Your name has been added.`);
      } else {
        setError('Failed to add name. Please try again.');
      }
    } catch (err) {
      console.error('Failed to add name:', err);
      setError('Connection error. Please try again.');
    } finally {
      setAddingName(false);
    }
  };

  const fetchAvailableCities = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/inventory/available-cities`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.cities) {
        setAvailableCities(data.cities);
      }
    } catch (err) {
      console.error('Failed to fetch cities:', err);
    }
  }, [API_URL]);

  // Camera functions
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: 640, height: 480 } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch (err) {
      console.error('Camera error:', err);
      toast.error('Could not access camera. Please allow camera permissions.');
    }
  };

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchPredefinedUsers();
      fetchAvailableCities();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, fetchPredefinedUsers, fetchAvailableCities, stopCamera]);

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0);
      const base64 = canvas.toDataURL('image/jpeg', 0.7);
      setPhotoBase64(base64);
      stopCamera();
    }
  };

  const retakePhoto = () => {
    setPhotoBase64(null);
    startCamera();
  };

  // Step navigation
  const handleStep1Next = () => {
    if (!selectedUser) {
      setError('Please select your name');
      return;
    }
    setError('');
    setStep(2);
    setTimeout(() => startCamera(), 100);
  };

  const handleStep2Next = () => {
    // Photo is optional
    stopCamera();
    setStep(3);
  };

  const handleStep2Skip = () => {
    stopCamera();
    setPhotoBase64(null);
    setStep(3);
  };

  const toggleCity = (city) => {
    if (selectedCities.includes(city)) {
      setSelectedCities(selectedCities.filter(c => c !== city));
      const newTargets = { ...cityTargets };
      delete newTargets[city];
      setCityTargets(newTargets);
    } else {
      setSelectedCities([...selectedCities, city]);
      setCityTargets({ ...cityTargets, [city]: DEFAULT_CITY_TARGET }); // Default target 15
    }
  };

  const updateCityTarget = (city, value) => {
    setCityTargets({ ...cityTargets, [city]: parseInt(value) || 0 });
  };

  const handleAddNewCity = async () => {
    if (!customCity.trim()) {
      setError('Please enter a city name');
      return;
    }
    
    const trimmedCity = customCity.trim();
    
    if (availableCities.some(c => c.toLowerCase() === trimmedCity.toLowerCase())) {
      setError('This city already exists. Please select it from the list.');
      return;
    }
    
    setAddingCity(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      
      // Add city to database
      const response = await fetch(`${API_URL}/api/inventory/add-city`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ city: trimmedCity })
      });
      
      if (response.ok) {
        // Add to local list and auto-select
        setAvailableCities([...availableCities, trimmedCity].sort());
        setSelectedCities([...selectedCities, trimmedCity]);
        setCityTargets({ ...cityTargets, [trimmedCity]: DEFAULT_CITY_TARGET });
        setShowAddCity(false);
        setCustomCity('');
        toast.success(`City "${trimmedCity}" added! Target set to ${DEFAULT_CITY_TARGET}.`);
      } else {
        const data = await response.json();
        setError(data.detail || 'Failed to add city. Please try again.');
      }
    } catch (err) {
      console.error('Failed to add city:', err);
      setError('Connection error. Please try again.');
    } finally {
      setAddingCity(false);
    }
  };

  const handleStartSession = async () => {
    if (selectedCities.length === 0) {
      setError('Please select at least one city');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/inventory/inventory-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: selectedUser,
          photo_base64: photoBase64,
          selected_cities: selectedCities,
          city_targets: cityTargets
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store session in sessionStorage
        const sessionData = {
          session_id: data.session_id,
          user_name: selectedUser,
          login_time: data.login_time,
          selected_cities: selectedCities,
          city_targets: cityTargets,
          total_target: data.total_target
        };
        sessionStorage.setItem('inventorySession', JSON.stringify(sessionData));
        
        toast.success(`Welcome ${selectedUser}! Session started.`);
        onSessionStarted(sessionData);
      } else {
        setError(data.detail || 'Failed to start session');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const totalTarget = Object.values(cityTargets).reduce((a, b) => a + b, 0);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        data-testid="inventory-login-modal"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="stitch-panel w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[var(--stitch-muted)] to-[var(--stitch-muted)] text-white p-6 sticky top-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                {step === 1 && <User className="w-5 h-5" />}
                {step === 2 && <Camera className="w-5 h-5" />}
                {step === 3 && <Target className="w-5 h-5" />}
              </div>
              <div>
                <h2 className="text-xl font-semibold" style={{  }}>
                  Inventory Mode Setup
                </h2>
                <p className="text-white/80 text-sm">
                  Step {step} of 3: {step === 1 ? 'User Details' : step === 2 ? 'Login Photo' : 'Work Plan'}
                </p>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="flex gap-2 mt-4">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`flex-1 h-1 rounded-full transition-colors ${
                    s <= step ? 'bg-white' : 'bg-white/30'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="p-6">
            {/* Step 1: User Selection */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <label className="block text-sm font-medium text-[var(--stitch-ink)] mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Select Your Name
                </label>
                
                {!showAddName ? (
                  <>
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                      {predefinedUsers.map((user) => (
                        <button
                          key={user}
                          onClick={() => setSelectedUser(user)}
                          className={`p-3 text-sm rounded-lg border-2 transition-all text-left ${
                            selectedUser === user
                              ? 'border-[var(--stitch-muted)] bg-[var(--stitch-soft)] text-[var(--stitch-ink)] font-medium'
                              : 'border-[var(--stitch-line)] hover:border-[var(--stitch-muted)]/50'
                          }`}
                        >
                          {user}
                        </button>
                      ))}
                    </div>
                    
                    {/* Add Your Name Button */}
                    <button
                      onClick={() => {
                        setShowAddName(true);
                        setSelectedUser('');
                        setError('');
                      }}
                      className="w-full p-3 border-2 border-dashed border-[var(--stitch-muted)] text-[var(--stitch-muted)] rounded-lg hover:bg-[var(--stitch-soft)] transition-all flex items-center justify-center gap-2 text-sm font-medium"
                    >
                      <UserPlus className="w-4 h-4" />
                      My name is not here - Add it
                    </button>
                  </>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <div className="p-4 bg-[var(--stitch-soft)] rounded-lg border border-[var(--stitch-muted)]/30">
                      <p className="text-sm text-[var(--stitch-muted)] mb-3">
                        Enter your full name below. It will be saved for future logins.
                      </p>
                      <input
                        type="text"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        placeholder="Enter your full name"
                        className="w-full px-4 py-3 border border-[var(--stitch-line)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--stitch-muted)]/20 focus:border-[var(--stitch-muted)]"
                        autoFocus
                      />
                    </div>
                    
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setShowAddName(false);
                          setCustomName('');
                          setError('');
                        }}
                        className="flex-1 py-3 border border-[var(--stitch-line)] text-[var(--stitch-muted)] rounded-lg font-medium hover:bg-[var(--stitch-soft)] transition-all"
                      >
                        Back to List
                      </button>
                      <button
                        onClick={handleAddNewName}
                        disabled={addingName || !customName.trim()}
                        className="flex-1 py-3 bg-gradient-to-r from-[var(--stitch-muted)] to-[var(--stitch-muted)] text-white rounded-lg font-medium hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {addingName ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Adding...
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            Add & Select
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm"
                  >
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </motion.div>
                )}

                {!showAddName && (
                  <button
                    onClick={handleStep1Next}
                    disabled={!selectedUser}
                    className="w-full py-3 bg-gradient-to-r from-[var(--stitch-muted)] to-[var(--stitch-muted)] text-white rounded-lg font-medium hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    Continue to Photo
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </motion.div>
            )}

            {/* Step 2: Photo Capture */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="text-center">
                  <p className="text-sm text-[var(--stitch-muted)] mb-4">
                    Take a quick selfie for attendance tracking (optional)
                  </p>
                  
                  <div className="relative aspect-video max-w-sm mx-auto bg-black rounded-lg overflow-hidden mb-4">
                    {!photoBase64 ? (
                      <>
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover"
                        />
                        {!cameraActive && (
                          <div className="absolute inset-0 flex items-center justify-center bg-[var(--stitch-ink)]/80">
                            <button
                              onClick={startCamera}
                              className="px-4 py-2 bg-white text-[var(--stitch-ink)] rounded-lg font-medium flex items-center gap-2"
                            >
                              <Camera className="w-4 h-4" />
                              Start Camera
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <img src={photoBase64} alt="Captured" className="w-full h-full object-cover" />
                    )}
                  </div>

                  <div className="flex gap-3 justify-center">
                    {!photoBase64 && cameraActive && (
                      <button
                        onClick={capturePhoto}
                        className="px-6 py-2 bg-gradient-to-r from-[var(--stitch-muted)] to-[var(--stitch-muted)] text-white rounded-lg font-medium hover:opacity-90 transition-all flex items-center gap-2"
                      >
                        <Camera className="w-4 h-4" />
                        Capture
                      </button>
                    )}
                    
                    {photoBase64 && (
                      <button
                        onClick={retakePhoto}
                        className="px-4 py-2 border border-[var(--stitch-line)] text-[var(--stitch-muted)] rounded-lg font-medium hover:bg-[var(--stitch-soft)] transition-all flex items-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Retake
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleStep2Skip}
                    className="flex-1 py-3 border border-[var(--stitch-line)] text-[var(--stitch-muted)] rounded-lg font-medium hover:bg-[var(--stitch-soft)] transition-all"
                  >
                    Skip
                  </button>
                  <button
                    onClick={handleStep2Next}
                    className="flex-1 py-3 bg-gradient-to-r from-[var(--stitch-muted)] to-[var(--stitch-muted)] text-white rounded-lg font-medium hover:opacity-90 transition-all flex items-center justify-center gap-2"
                  >
                    Continue
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Work Plan */}
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-[var(--stitch-ink)] mb-2">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Select Cities & Set Targets
                    <span className="text-xs text-[var(--stitch-muted)] font-normal ml-2">(Default: {DEFAULT_CITY_TARGET} per city)</span>
                  </label>
                  
                  <div className="space-y-2 max-h-40 overflow-y-auto border border-[var(--stitch-line)] rounded-lg p-3">
                    {availableCities.map((city) => (
                      <div
                        key={city}
                        className={`flex items-center justify-between p-2 rounded-lg transition-all ${
                          selectedCities.includes(city) ? 'bg-[var(--stitch-soft)]' : 'hover:bg-[var(--stitch-soft)]'
                        }`}
                      >
                        <label className="flex items-center gap-2 cursor-pointer flex-1">
                          <input
                            type="checkbox"
                            checked={selectedCities.includes(city)}
                            onChange={() => toggleCity(city)}
                            className="w-4 h-4 accent-[var(--stitch-muted)]"
                          />
                          <span className="text-sm">{city}</span>
                        </label>
                        
                        {selectedCities.includes(city) && (
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={cityTargets[city] || DEFAULT_CITY_TARGET}
                            onChange={(e) => updateCityTarget(city, e.target.value)}
                            className="w-16 px-2 py-1 text-sm border border-[var(--stitch-line)] rounded text-center"
                            placeholder="Target"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* Add City Option */}
                  {!showAddCity ? (
                    <button
                      onClick={() => {
                        setShowAddCity(true);
                        setError('');
                      }}
                      className="w-full mt-2 p-2 border-2 border-dashed border-[var(--stitch-muted)] text-[var(--stitch-muted)] rounded-lg hover:bg-[var(--stitch-soft)] transition-all flex items-center justify-center gap-2 text-sm font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      Add New City
                    </button>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2 p-3 bg-[var(--stitch-soft)] rounded-lg border border-[var(--stitch-muted)]/30"
                    >
                      <p className="text-xs text-[var(--stitch-muted)] mb-2">
                        Enter city name (Target will be set to {DEFAULT_CITY_TARGET})
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={customCity}
                          onChange={(e) => setCustomCity(e.target.value)}
                          placeholder="Enter city name"
                          className="flex-1 px-3 py-2 border border-[var(--stitch-line)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--stitch-muted)]/20 focus:border-[var(--stitch-muted)]"
                          autoFocus
                        />
                        <button
                          onClick={() => {
                            setShowAddCity(false);
                            setCustomCity('');
                            setError('');
                          }}
                          className="px-3 py-2 border border-[var(--stitch-line)] text-[var(--stitch-muted)] rounded-lg hover:bg-white transition-all text-sm"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleAddNewCity}
                          disabled={addingCity || !customCity.trim()}
                          className="px-3 py-2 bg-[var(--stitch-muted)] text-white rounded-lg hover:bg-[var(--stitch-muted)] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center gap-1"
                        >
                          {addingCity ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <>
                              <Plus className="w-3 h-3" />
                              Add
                            </>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Summary */}
                <div className="bg-[var(--stitch-soft)] rounded-lg p-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[var(--stitch-muted)]">Selected Cities:</span>
                    <span className="font-medium text-[var(--stitch-ink)]">{selectedCities.length}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm mt-2">
                    <span className="text-[var(--stitch-muted)]">Total Target:</span>
                    <span className="font-bold text-[var(--stitch-muted)] text-lg">{totalTarget} properties</span>
                  </div>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm"
                  >
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </motion.div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 py-3 border border-[var(--stitch-line)] text-[var(--stitch-muted)] rounded-lg font-medium hover:bg-[var(--stitch-soft)] transition-all"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleStartSession}
                    disabled={loading || selectedCities.length === 0}
                    className="flex-1 py-3 bg-gradient-to-r from-[var(--stitch-muted)] to-[var(--stitch-muted)] text-white rounded-lg font-medium hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    data-testid="start-inventory-session"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Starting...
                      </>
                    ) : (
                      <>
                        <Clock className="w-4 h-4" />
                        Start Session
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default InventoryLoginModal;
