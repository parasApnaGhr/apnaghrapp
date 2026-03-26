import React, { useState, useEffect } from 'react';
import { Play, Square } from 'lucide-react';

const DutyControl = ({ rider, onToggle }) => {
  const [location, setLocation] = useState(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => console.error('Location error:', error)
      );
    }
  }, []);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'Barlow Condensed' }}>
        DUTY CONTROL
      </h2>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500 mb-1">Current Status</p>
          <p className="text-2xl font-bold">
            {rider.on_duty ? (
              <span className="text-emerald-500">ON DUTY</span>
            ) : (
              <span className="text-slate-400">OFF DUTY</span>
            )}
          </p>
        </div>
        {rider.on_duty ? (
          <button
            onClick={() => onToggle(false, location)}
            data-testid="end-duty-button"
            className="btn-primary bg-red-500 hover:bg-red-600 flex items-center gap-2"
          >
            <Square className="w-4 h-4" />
            End Duty
          </button>
        ) : (
          <button
            onClick={() => onToggle(true, location)}
            data-testid="start-duty-button"
            className="btn-primary flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            Start Duty
          </button>
        )}
      </div>
      {rider.on_duty && location && (
        <div className="mt-4 p-3 bg-slate-50 rounded-lg">
          <p className="text-xs text-slate-500">GPS Tracking Active</p>
          <p className="text-xs font-mono mt-1">
            {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
          </p>
        </div>
      )}
    </div>
  );
};

export default DutyControl;