// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { Mic, MicOff, Loader2, X, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const VoiceSearch = ({ onSearch, placeholder = "Try: 'Show Patiala flats' or '2BHK in Chandigarh'" }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    // Check for Web Speech API support
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setIsSupported(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognitionInstance = new SpeechRecognition();
    
    recognitionInstance.continuous = false;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = 'en-IN'; // Indian English for better recognition of city names
    
    recognitionInstance.onstart = () => {
      setIsListening(true);
      setTranscript('');
    };
    
    recognitionInstance.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      
      setTranscript(finalTranscript || interimTranscript);
      
      if (finalTranscript) {
        processVoiceCommand(finalTranscript);
      }
    };
    
    recognitionInstance.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
        toast.error('Microphone access denied. Please enable microphone permissions.');
      } else if (event.error === 'no-speech') {
        toast.info('No speech detected. Please try again.');
      }
    };
    
    recognitionInstance.onend = () => {
      setIsListening(false);
    };
    
    setRecognition(recognitionInstance);
    
    return () => {
      if (recognitionInstance) {
        recognitionInstance.abort();
      }
    };
  }, [processVoiceCommand]);

  const processVoiceCommand = useCallback((command) => {
    setIsProcessing(true);
    
    const lowerCommand = command.toLowerCase().trim();
    
    // Parse the voice command
    const filters = {
      city: '',
      area: '',
      bhk: '',
      min_rent: '',
      max_rent: '',
      property_type: '',
      furnishing: ''
    };
    
    // City detection - Major Punjab/Haryana/Chandigarh cities
    const cities = [
      'patiala', 'chandigarh', 'mohali', 'zirakpur', 'kharar', 'bathinda',
      'ludhiana', 'amritsar', 'jalandhar', 'delhi', 'gurugram', 'noida',
      'faridabad', 'ambala', 'karnal', 'panipat', 'sonipat', 'rohtak',
      'hisar', 'sirsa', 'kurukshetra', 'yamunanagar', 'panchkula'
    ];
    
    for (const city of cities) {
      if (lowerCommand.includes(city)) {
        filters.city = city.charAt(0).toUpperCase() + city.slice(1);
        break;
      }
    }
    
    // Area/Sector detection
    const sectorMatch = lowerCommand.match(/sector\s*(\d+)/i);
    if (sectorMatch) {
      filters.area = `Sector ${sectorMatch[1]}`;
    }
    
    // BHK detection
    const bhkMatch = lowerCommand.match(/(\d)\s*bhk/i);
    if (bhkMatch) {
      filters.bhk = bhkMatch[1];
    }
    
    // Price detection
    const pricePatterns = [
      { pattern: /under\s*(\d+)\s*(k|thousand|lakh|l)?/i, type: 'max' },
      { pattern: /below\s*(\d+)\s*(k|thousand|lakh|l)?/i, type: 'max' },
      { pattern: /above\s*(\d+)\s*(k|thousand|lakh|l)?/i, type: 'min' },
      { pattern: /(\d+)\s*(k|thousand|lakh|l)?\s*to\s*(\d+)\s*(k|thousand|lakh|l)?/i, type: 'range' },
      { pattern: /budget\s*(\d+)\s*(k|thousand|lakh|l)?/i, type: 'max' }
    ];
    
    for (const { pattern, type } of pricePatterns) {
      const match = lowerCommand.match(pattern);
      if (match) {
        const parsePrice = (num, unit) => {
          let value = parseInt(num);
          if (unit === 'k' || unit === 'thousand') value *= 1000;
          if (unit === 'l' || unit === 'lakh') value *= 100000;
          return value;
        };
        
        if (type === 'max') {
          filters.max_rent = parsePrice(match[1], match[2]?.toLowerCase());
        } else if (type === 'min') {
          filters.min_rent = parsePrice(match[1], match[2]?.toLowerCase());
        } else if (type === 'range') {
          filters.min_rent = parsePrice(match[1], match[2]?.toLowerCase());
          filters.max_rent = parsePrice(match[3], match[4]?.toLowerCase());
        }
        break;
      }
    }
    
    // Property type detection
    if (lowerCommand.includes('flat') || lowerCommand.includes('apartment')) {
      filters.property_type = 'apartment';
    } else if (lowerCommand.includes('house') || lowerCommand.includes('kothi')) {
      filters.property_type = 'house';
    } else if (lowerCommand.includes('villa')) {
      filters.property_type = 'villa';
    } else if (lowerCommand.includes('pg') || lowerCommand.includes('paying guest')) {
      filters.property_type = 'pg';
    } else if (lowerCommand.includes('studio')) {
      filters.property_type = 'studio';
    }
    
    // Furnishing detection
    if (lowerCommand.includes('furnished') && !lowerCommand.includes('unfurnished') && !lowerCommand.includes('semi')) {
      filters.furnishing = 'fully_furnished';
    } else if (lowerCommand.includes('semi furnished') || lowerCommand.includes('semi-furnished')) {
      filters.furnishing = 'semi_furnished';
    } else if (lowerCommand.includes('unfurnished')) {
      filters.furnishing = 'unfurnished';
    }
    
    // Clean up empty filters
    const cleanFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, v]) => v !== '')
    );
    
    setTimeout(() => {
      setIsProcessing(false);
      if (Object.keys(cleanFilters).length > 0) {
        toast.success(`Searching for: ${Object.values(cleanFilters).join(', ')}`);
        onSearch(cleanFilters, command);
      } else {
        toast.info('Could not understand. Try: "Show Patiala flats" or "2BHK under 15k"');
      }
    }, 500);
  }, [onSearch]);

  const startListening = () => {
    if (recognition && !isListening) {
      try {
        recognition.start();
        toast.info('Listening... Speak now!');
      } catch (error) {
        console.error('Error starting recognition:', error);
      }
    }
  };

  const stopListening = () => {
    if (recognition && isListening) {
      recognition.stop();
    }
  };

  if (!isSupported) {
    return null; // Don't show if not supported
  }

  return (
    <div className="relative">
      {/* Voice Button */}
      <motion.button
        onClick={isListening ? stopListening : startListening}
        disabled={isProcessing}
        className={`
          relative flex items-center justify-center gap-2 px-4 py-3 rounded-xl
          font-medium transition-all duration-300 shadow-lg
          ${isListening 
            ? 'bg-red-500 text-white animate-pulse' 
            : 'bg-gradient-to-r from-[#04473C] to-[#065f4e] text-white hover:shadow-xl'
          }
          ${isProcessing ? 'opacity-70 cursor-wait' : ''}
        `}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        data-testid="voice-search-button"
      >
        {isProcessing ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : isListening ? (
          <>
            <MicOff className="w-5 h-5" />
            <span className="hidden sm:inline">Stop</span>
          </>
        ) : (
          <>
            <Mic className="w-5 h-5" />
            <span className="hidden sm:inline">Voice Search</span>
          </>
        )}
        
        {/* Listening indicator rings */}
        {isListening && (
          <>
            <span className="absolute inset-0 rounded-xl animate-ping bg-red-400 opacity-30" />
            <span className="absolute inset-0 rounded-xl animate-pulse bg-red-400 opacity-20" />
          </>
        )}
      </motion.button>

      {/* Transcript Popup */}
      <AnimatePresence>
        {(isListening || transcript) && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full left-0 right-0 mt-2 z-50"
          >
            <div className="bg-white rounded-xl shadow-2xl border border-[#E5E1DB] p-4 min-w-[280px]">
              <div className="flex items-center gap-2 mb-2">
                <Volume2 className={`w-4 h-4 ${isListening ? 'text-red-500 animate-pulse' : 'text-[#04473C]'}`} />
                <span className="text-sm font-medium text-[#1A1C20]">
                  {isListening ? 'Listening...' : 'Heard:'}
                </span>
              </div>
              
              <p className="text-[#4A4D53] min-h-[24px]">
                {transcript || (isListening ? 'Speak now...' : '')}
              </p>
              
              <p className="text-xs text-[#8A8D91] mt-2 italic">
                {placeholder}
              </p>
              
              {transcript && !isListening && (
                <button
                  onClick={() => setTranscript('')}
                  className="absolute top-2 right-2 p-1 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VoiceSearch;
