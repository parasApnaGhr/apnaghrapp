import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Check, Navigation, Clock, Search, X } from 'lucide-react';
import { toast } from 'sonner';

const RECENT_LOCATIONS_KEY = 'recentPickupLocations';
const MAX_RECENT = 5;

const loadRecent = () => {
  try {
    const raw = localStorage.getItem(RECENT_LOCATIONS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveRecent = (entry) => {
  if (!entry || !entry.label) return;
  try {
    const current = loadRecent().filter(r => r.label !== entry.label);
    const next = [entry, ...current].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_LOCATIONS_KEY, JSON.stringify(next));
  } catch {
    // ignore storage errors
  }
};

const LocationAutocomplete = ({
  value,
  onChange,
  placeholder = 'Enter your pickup or starting location',
  testId = 'pickup-location-input',
  hasCoords = false,
  countryCode = 'in'
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [recent, setRecent] = useState(() => loadRecent());
  const [focused, setFocused] = useState(false);
  const [searching, setSearching] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [highlight, setHighlight] = useState(-1);

  const abortRef = useRef(null);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const onDocClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setFocused(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const fetchSuggestions = useCallback(async (query) => {
    if (!query || query.trim().length < 3) {
      setSuggestions([]);
      setSearching(false);
      return;
    }

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setSearching(true);
    try {
      const params = new URLSearchParams({
        format: 'json',
        q: query,
        addressdetails: '1',
        limit: '6'
      });
      if (countryCode) params.append('countrycodes', countryCode);

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${params.toString()}`,
        { signal: controller.signal, headers: { 'Accept-Language': 'en' } }
      );
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      const mapped = (data || []).map((item) => ({
        label: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon)
      }));
      setSuggestions(mapped);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setSuggestions([]);
      }
    } finally {
      setSearching(false);
    }
  }, [countryCode]);

  const handleInputChange = (e) => {
    const text = e.target.value;
    onChange({ label: text, lat: null, lng: null });
    setHighlight(-1);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(text);
    }, 300);
  };

  const selectSuggestion = (s) => {
    onChange({ label: s.label, lat: s.lat ?? null, lng: s.lng ?? null });
    saveRecent(s);
    setRecent(loadRecent());
    setSuggestions([]);
    setFocused(false);
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await response.json();
          const address = data.display_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          const entry = { label: address, lat: latitude, lng: longitude };
          onChange(entry);
          saveRecent(entry);
          setRecent(loadRecent());
          toast.success('Location captured successfully!');
        } catch {
          const entry = {
            label: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
            lat: latitude,
            lng: longitude
          };
          onChange(entry);
          saveRecent(entry);
          setRecent(loadRecent());
          toast.success('Location coordinates captured');
        }
        setGettingLocation(false);
        setFocused(false);
      },
      (error) => {
        setGettingLocation(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast.error('Please allow location access to use this feature');
            break;
          case error.POSITION_UNAVAILABLE:
            toast.error('Location information unavailable');
            break;
          case error.TIMEOUT:
            toast.error('Location request timed out');
            break;
          default:
            toast.error('Unable to get your location');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const clearInput = () => {
    onChange({ label: '', lat: null, lng: null });
    setSuggestions([]);
  };

  const showDropdown = focused && (suggestions.length > 0 || recent.length > 0 || searching);

  // Build a flat list for keyboard navigation
  const flatOptions = [
    ...suggestions.map(s => ({ ...s, type: 'suggestion' })),
    ...(suggestions.length === 0 ? recent.map(r => ({ ...r, type: 'recent' })) : [])
  ];

  const handleKeyDown = (e) => {
    if (!showDropdown || flatOptions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => (h + 1) % flatOptions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => (h <= 0 ? flatOptions.length - 1 : h - 1));
    } else if (e.key === 'Enter' && highlight >= 0) {
      e.preventDefault();
      selectSuggestion(flatOptions[highlight]);
    } else if (e.key === 'Escape') {
      setFocused(false);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A4D53] pointer-events-none" />
          <input
            type="text"
            value={value || ''}
            onChange={handleInputChange}
            onFocus={() => setFocused(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="premium-input w-full pl-10 pr-10"
            data-testid={testId}
            autoComplete="off"
          />
          {value && (
            <button
              type="button"
              onClick={clearInput}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#4A4D53] hover:text-[#1A1C20]"
              tabIndex={-1}
              aria-label="Clear location"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={getCurrentLocation}
          disabled={gettingLocation}
          className="px-4 py-2 bg-[#04473C] text-white text-sm font-medium hover:bg-[#033530] transition-colors flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
          data-testid="use-location-button"
        >
          {gettingLocation ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Getting...
            </>
          ) : (
            <>
              <Navigation className="w-4 h-4" />
              Use Current
            </>
          )}
        </button>
      </div>

      {hasCoords && (
        <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
          <Check className="w-3 h-3" /> GPS coordinates captured
        </p>
      )}

      {showDropdown && (
        <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-[#E5E1DB] shadow-lg max-h-72 overflow-y-auto">
          {searching && (
            <div className="px-4 py-2 text-xs text-[#4A4D53] flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-[#04473C] border-t-transparent rounded-full animate-spin" />
              Searching locations...
            </div>
          )}

          {!searching && suggestions.length > 0 && (
            <>
              <div className="px-4 py-1 text-[10px] uppercase tracking-wide text-[#4A4D53] bg-[#F5F3F0]">
                Suggestions
              </div>
              {suggestions.map((s, idx) => (
                <button
                  key={`s-${idx}`}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectSuggestion(s)}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-[#F5F3F0] flex items-start gap-2 ${
                    highlight === idx ? 'bg-[#F5F3F0]' : ''
                  }`}
                >
                  <MapPin className="w-4 h-4 text-[#04473C] flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                  <span className="text-[#1A1C20] leading-snug">{s.label}</span>
                </button>
              ))}
            </>
          )}

          {!searching && suggestions.length === 0 && recent.length > 0 && (
            <>
              <div className="px-4 py-1 text-[10px] uppercase tracking-wide text-[#4A4D53] bg-[#F5F3F0]">
                Recent locations
              </div>
              {recent.map((r, idx) => (
                <button
                  key={`r-${idx}`}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectSuggestion(r)}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-[#F5F3F0] flex items-start gap-2 ${
                    highlight === idx ? 'bg-[#F5F3F0]' : ''
                  }`}
                >
                  <Clock className="w-4 h-4 text-[#4A4D53] flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                  <span className="text-[#1A1C20] leading-snug">{r.label}</span>
                </button>
              ))}
            </>
          )}

          {!searching && suggestions.length === 0 && recent.length === 0 && (
            <div className="px-4 py-3 text-xs text-[#4A4D53]">
              Start typing an address, or tap "Use Current" to auto-fill your location.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LocationAutocomplete;
