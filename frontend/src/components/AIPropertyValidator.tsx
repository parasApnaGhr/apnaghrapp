// @ts-nocheck
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, CheckCircle, AlertTriangle, XCircle, 
  Loader2, Home, Building2, Castle, Warehouse, Info
} from 'lucide-react';
import api from '../utils/api';
import { toast } from 'sonner';
import debounce from 'lodash/debounce';

const PROPERTY_TYPES = {
  'apartment': { icon: Building2, label: 'Apartment/Flat', color: 'bg-blue-100 text-blue-700' },
  'house': { icon: Home, label: 'Independent House', color: 'bg-green-100 text-green-700' },
  'villa': { icon: Castle, label: 'Villa', color: 'bg-purple-100 text-purple-700' },
  'studio': { icon: Warehouse, label: 'Studio', color: 'bg-orange-100 text-orange-700' },
  'pg': { icon: Building2, label: 'PG/Hostel', color: 'bg-pink-100 text-pink-700' }
};

const REQUIRED_AMENITIES = {
  'apartment': ['Parking', 'Lift', 'Security', 'Power Backup'],
  'house': ['Parking', 'Garden', 'Security'],
  'villa': ['Parking', 'Garden', 'Swimming Pool', 'Security', 'Power Backup'],
  'studio': ['WiFi', 'AC', 'Furnished'],
  'pg': ['WiFi', 'Meals', 'Laundry', 'Security']
};

const AIPropertyValidator = ({ 
  propertyData, 
  onSuggestionsUpdate, 
  onTypeDetected,
  isEditing = false 
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [validationScore, setValidationScore] = useState(0);
  const lastAnalyzedDataRef = useRef('');

  // Simple property type detection
  const detectPropertyType = useCallback((data) => {
    const text = `${data.title || ''} ${data.description || ''}`.toLowerCase();
    
    if (text.includes('villa')) return 'villa';
    if (text.includes('house') || text.includes('kothi') || text.includes('independent')) return 'house';
    if (text.includes('studio')) return 'studio';
    if (text.includes('pg') || text.includes('paying guest') || text.includes('hostel')) return 'pg';
    if (text.includes('flat') || text.includes('apartment')) return 'apartment';
    
    // Default based on BHK
    if (data.bhk >= 4) return 'house';
    return 'apartment';
  }, []);

  // Evaluate description quality
  const evaluateDescription = useCallback((description) => {
    if (!description) return 'poor';
    const length = description.length;
    if (length >= 200) return 'excellent';
    if (length >= 100) return 'good';
    if (length >= 50) return 'fair';
    return 'poor';
  }, []);

  // Local fallback validation
  const performLocalValidation = useCallback((data) => {
    const result = {
      detected_type: detectPropertyType(data),
      type_confidence: 0.6,
      description_quality: evaluateDescription(data.description),
      missing_amenities: [],
      suggestions: [],
      issues: []
    };
    
    // Check description length
    if (!data.description || data.description.length < 50) {
      result.issues.push('Description is too short. Add more details about the property.');
      result.description_quality = 'poor';
    }
    
    // Check amenities
    const requiredForType = REQUIRED_AMENITIES[result.detected_type] || [];
    const currentAmenities = (data.amenities || []).map(a => a.toLowerCase());
    result.missing_amenities = requiredForType.filter(
      a => !currentAmenities.some(ca => ca.includes(a.toLowerCase()))
    );
    
    // Generate suggestions
    if (result.missing_amenities.length > 0) {
      result.suggestions.push(`Consider adding: ${result.missing_amenities.join(', ')}`);
    }
    
    if (!data.title || data.title.length < 10) {
      result.suggestions.push('Add a descriptive title with property type and location');
    }
    
    setAnalysis(result);
    
    let score = 0;
    if (result.type_confidence > 0.5) score += 25;
    if (result.description_quality !== 'poor') score += 25;
    if (result.missing_amenities.length <= 2) score += 25;
    if (result.issues.length === 0) score += 25;
    setValidationScore(score);
  }, [detectPropertyType, evaluateDescription]);

  // Debounced analysis function
  const analyzeProperty = useMemo(() =>
    debounce(async (data) => {
      if (!data.title && !data.description) return;
      
      const dataHash = JSON.stringify({
        title: data.title,
        description: data.description,
        property_type: data.property_type,
        amenities: data.amenities
      });
      
      if (dataHash === lastAnalyzedDataRef.current) return;
      
      setIsAnalyzing(true);
      
      try {
        const response = await api.post('/admin/property/ai-validate', {
          title: data.title || '',
          description: data.description || '',
          property_type: data.property_type || '',
          amenities: data.amenities || [],
          bhk: data.bhk,
          rent: data.rent,
          city: data.city,
          area_name: data.area_name
        });
        
        const result = response.data;
        setAnalysis(result);
        lastAnalyzedDataRef.current = dataHash;
        
        // Calculate validation score
        let score = 0;
        if (result.type_confidence > 0.7) score += 25;
        if (result.description_quality >= 'good') score += 25;
        if (result.missing_amenities?.length === 0) score += 25;
        if (result.suggestions?.length === 0) score += 25;
        setValidationScore(score);
        
        // Notify parent of detected type
        if (result.detected_type && onTypeDetected) {
          onTypeDetected(result.detected_type);
        }
        
        // Notify parent of suggestions
        if (onSuggestionsUpdate) {
          onSuggestionsUpdate(result);
        }
        
      } catch (error) {
        console.error('AI validation error:', error);
        // Fallback to local validation if API fails
        performLocalValidation(data);
      } finally {
        setIsAnalyzing(false);
      }
    }, 1000),
    [onTypeDetected, onSuggestionsUpdate, performLocalValidation]
  );

  // Trigger analysis when property data changes
  useEffect(() => {
    if (propertyData && (propertyData.title || propertyData.description)) {
      analyzeProperty(propertyData);
    }
  }, [propertyData, analyzeProperty]);

  useEffect(() => {
    return () => analyzeProperty.cancel();
  }, [analyzeProperty]);

  const getScoreColor = () => {
    if (validationScore >= 75) return 'text-green-600';
    if (validationScore >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getQualityBadge = (quality) => {
    const badges = {
      'excellent': { color: 'bg-green-100 text-green-700', icon: CheckCircle },
      'good': { color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
      'fair': { color: 'bg-yellow-100 text-yellow-700', icon: AlertTriangle },
      'poor': { color: 'bg-red-100 text-red-700', icon: XCircle }
    };
    return badges[quality] || badges['fair'];
  };

  if (!propertyData?.title && !propertyData?.description) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-[#04473C]/5 to-[#C6A87C]/10 rounded-xl p-4 border border-[#04473C]/20"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#C6A87C]" />
          <span className="font-semibold text-[#04473C]">AI Property Analysis</span>
        </div>
        
        {isAnalyzing ? (
          <div className="flex items-center gap-2 text-sm text-[#4A4D53]">
            <Loader2 className="w-4 h-4 animate-spin" />
            Analyzing...
          </div>
        ) : (
          <div className={`text-lg font-bold ${getScoreColor()}`}>
            {validationScore}% Ready
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {analysis && !isAnalyzing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {/* Detected Property Type */}
            {analysis.detected_type && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#4A4D53]">Detected Type:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${PROPERTY_TYPES[analysis.detected_type]?.color || 'bg-gray-100 text-gray-700'}`}>
                  {PROPERTY_TYPES[analysis.detected_type]?.icon && 
                    React.createElement(PROPERTY_TYPES[analysis.detected_type].icon, { className: 'w-3 h-3' })}
                  {PROPERTY_TYPES[analysis.detected_type]?.label || analysis.detected_type}
                </span>
                {analysis.type_confidence && (
                  <span className="text-xs text-[#8A8D91]">
                    ({Math.round(analysis.type_confidence * 100)}% confident)
                  </span>
                )}
              </div>
            )}

            {/* Description Quality */}
            {analysis.description_quality && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#4A4D53]">Description:</span>
                {(() => {
                  const badge = getQualityBadge(analysis.description_quality);
                  return (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${badge.color}`}>
                      <badge.icon className="w-3 h-3" />
                      {analysis.description_quality.charAt(0).toUpperCase() + analysis.description_quality.slice(1)}
                    </span>
                  );
                })()}
              </div>
            )}

            {/* Missing Amenities */}
            {analysis.missing_amenities?.length > 0 && (
              <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                <div className="flex items-center gap-2 text-yellow-700 text-sm font-medium mb-1">
                  <AlertTriangle className="w-4 h-4" />
                  Suggested Amenities
                </div>
                <div className="flex flex-wrap gap-1">
                  {analysis.missing_amenities.map((amenity, idx) => (
                    <span 
                      key={idx}
                      className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded text-xs"
                    >
                      + {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Issues */}
            {analysis.issues?.length > 0 && (
              <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                <div className="flex items-center gap-2 text-red-700 text-sm font-medium mb-1">
                  <XCircle className="w-4 h-4" />
                  Issues to Fix
                </div>
                <ul className="text-xs text-red-600 space-y-1">
                  {analysis.issues.map((issue, idx) => (
                    <li key={idx}>• {issue}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suggestions */}
            {analysis.suggestions?.length > 0 && (
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <div className="flex items-center gap-2 text-blue-700 text-sm font-medium mb-1">
                  <Info className="w-4 h-4" />
                  Suggestions
                </div>
                <ul className="text-xs text-blue-600 space-y-1">
                  {analysis.suggestions.map((suggestion, idx) => (
                    <li key={idx}>• {suggestion}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* All Good */}
            {validationScore >= 75 && (
              <div className="bg-green-50 rounded-lg p-3 border border-green-200 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm text-green-700 font-medium">
                  Property listing looks great! Ready to publish.
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AIPropertyValidator;
