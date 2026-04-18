// @ts-nocheck
// Multi-Visit Route Display Component
// Shows optimized route for multiple property visits

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Navigation, MapPin, Clock, ChevronRight, 
  CheckCircle, Circle, Play, Phone, Home,
  Route, ArrowRight, Timer
} from 'lucide-react';
import LiveTrackingMap from './LiveTrackingMap';

const MultiVisitRoute = ({ 
  visit,
  properties,
  optimizedRoute,
  customer,
  currentStep,
  onStartVisit,
  onCompleteProperty,
  onViewMap
}) => {
  const [expandedProperty, setExpandedProperty] = useState(null);
  const [completedProperties, setCompletedProperties] = useState(
    visit?.completed_properties || []
  );

  // Get the ordered properties based on optimized route
  const orderedProperties = optimizedRoute?.visits 
    ? optimizedRoute.visits.map(v => {
        const prop = properties.find(p => p.id === v.id);
        return { ...prop, order: v.order };
      }).filter(Boolean)
    : properties.map((p, idx) => ({ ...p, order: idx + 1 }));

  const currentPropertyIndex = visit?.current_property_index || 0;
  const totalProperties = orderedProperties.length;
  const isMultiVisit = totalProperties > 1;

  const getPropertyStatus = (propId, index) => {
    if (completedProperties.includes(propId)) return 'completed';
    if (index === currentPropertyIndex) return 'current';
    if (index < currentPropertyIndex) return 'completed';
    return 'pending';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-500 text-white';
      case 'current': return 'bg-[#04473C] text-white animate-pulse';
      default: return 'bg-gray-200 text-gray-500';
    }
  };

  const formatTime = (minutes) => {
    if (minutes < 60) return `${Math.round(minutes)} min`;
    const hrs = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hrs}h ${mins}m`;
  };

  return (
    <div className="space-y-4">
      {/* Route Summary Card */}
      {isMultiVisit && optimizedRoute && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-[#04473C] to-[#065446] text-white rounded-xl p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Route className="w-5 h-5" />
              <span className="font-semibold">Optimized Route</span>
            </div>
            <span className="text-sm bg-white/20 px-2 py-1 rounded">
              {totalProperties} Properties
            </span>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{optimizedRoute.total_distance_km}</p>
              <p className="text-xs opacity-80">Total km</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{formatTime(optimizedRoute.estimated_time_minutes)}</p>
              <p className="text-xs opacity-80">Est. Time</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{currentPropertyIndex + 1}/{totalProperties}</p>
              <p className="text-xs opacity-80">Progress</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 bg-white/20 rounded-full h-2 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${((currentPropertyIndex) / totalProperties) * 100}%` }}
              className="h-full bg-[#C6A87C]"
              transition={{ duration: 0.5 }}
            />
          </div>
        </motion.div>
      )}

      {/* Customer Info */}
      {customer && (
        <div className="bg-white rounded-lg border border-[#E5E1DB] p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#04473C] rounded-full flex items-center justify-center text-white font-medium text-lg">
                {customer.name?.[0] || 'C'}
              </div>
              <div>
                <p className="font-medium text-[#04473C]">{customer.name}</p>
                <p className="text-sm text-[#4A4D53]">Customer</p>
              </div>
            </div>
            <a
              href={`tel:${customer.phone}`}
              className="w-10 h-10 bg-[#04473C] rounded-full flex items-center justify-center text-white hover:bg-[#033830] transition-colors"
            >
              <Phone className="w-5 h-5" />
            </a>
          </div>
        </div>
      )}

      {/* Route Timeline */}
      <div className="bg-white rounded-lg border border-[#E5E1DB] overflow-hidden">
        <div className="p-4 border-b border-[#E5E1DB] flex items-center justify-between">
          <h3 className="font-semibold text-[#04473C]">Visit Route</h3>
          {onViewMap && (
            <button
              onClick={onViewMap}
              className="text-sm text-[#04473C] hover:underline flex items-center gap-1"
            >
              <Navigation className="w-4 h-4" />
              View Map
            </button>
          )}
        </div>

        <div className="divide-y divide-[#E5E1DB]">
          {orderedProperties.map((property, index) => {
            const status = getPropertyStatus(property.id, index);
            const isExpanded = expandedProperty === property.id;
            const isCurrent = index === currentPropertyIndex;

            return (
              <motion.div
                key={property.id}
                layout
                className={`${isCurrent ? 'bg-[#F5F3F0]' : ''}`}
              >
                <div
                  className="p-4 cursor-pointer hover:bg-[#F5F3F0] transition-colors"
                  onClick={() => setExpandedProperty(isExpanded ? null : property.id)}
                >
                  <div className="flex items-start gap-4">
                    {/* Order Number with Status */}
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${getStatusColor(status)}`}>
                        {status === 'completed' ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          property.order || index + 1
                        )}
                      </div>
                      {index < orderedProperties.length - 1 && (
                        <div className={`w-0.5 h-8 mt-2 ${
                          status === 'completed' ? 'bg-green-500' : 'bg-gray-200'
                        }`} />
                      )}
                    </div>

                    {/* Property Details */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-[#04473C]">{property.title}</p>
                          <div className="flex items-center gap-2 text-sm text-[#4A4D53] mt-1">
                            <Home className="w-4 h-4" />
                            <span>{property.bhk_type} • {property.furnishing}</span>
                          </div>
                        </div>
                        <ChevronRight className={`w-5 h-5 text-[#4A4D53] transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      </div>

                      {/* Status Badge */}
                      <div className="mt-2 flex items-center gap-2">
                        {status === 'current' && (
                          <span className="text-xs px-2 py-1 bg-[#04473C] text-white rounded-full animate-pulse">
                            Current Stop
                          </span>
                        )}
                        {status === 'completed' && (
                          <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                            Completed
                          </span>
                        )}
                        {status === 'pending' && (
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded-full">
                            Upcoming
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pl-18 ml-14">
                        <div className="bg-[#F5F3F0] rounded-lg p-4 space-y-3">
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-[#C6A87C] mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">Address</p>
                              <p className="text-sm text-[#4A4D53]">{property.address}, {property.city}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Home className="w-4 h-4 text-[#C6A87C]" />
                            <div>
                              <p className="text-sm font-medium">Rent</p>
                              <p className="text-sm text-[#4A4D53]">₹{property.rent?.toLocaleString()}/month</p>
                            </div>
                          </div>

                          {/* Action Button for Current Property */}
                          {isCurrent && status !== 'completed' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onCompleteProperty && onCompleteProperty(property.id, index);
                              }}
                              className="w-full mt-2 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Mark as Completed
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Start/Complete Visit Button */}
      {currentStep === 'go_to_customer' && (
        <button
          onClick={onStartVisit}
          className="w-full py-4 bg-[#04473C] text-white rounded-xl font-semibold hover:bg-[#033830] transition-colors flex items-center justify-center gap-2"
        >
          <Play className="w-5 h-5" />
          Start Visit Route
        </button>
      )}

      {/* Summary when all completed */}
      {completedProperties.length === totalProperties && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-green-50 border border-green-200 rounded-xl p-6 text-center"
        >
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-green-700">All Visits Completed!</h3>
          <p className="text-green-600 mt-1">
            You've completed all {totalProperties} property visits.
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default MultiVisitRoute;
