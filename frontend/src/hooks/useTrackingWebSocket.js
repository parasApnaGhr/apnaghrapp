// WebSocket Hook for Real-Time Tracking
import { useState, useEffect, useCallback, useRef } from 'react';

const WS_BASE_URL = process.env.REACT_APP_BACKEND_URL?.replace('https://', 'wss://').replace('http://', 'ws://') || 'ws://localhost:8001';

export const useTrackingWebSocket = (type, userId, userName = 'User') => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const [riderLocations, setRiderLocations] = useState({});
  const [visitStatuses, setVisitStatuses] = useState({});
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const getWebSocketUrl = useCallback(() => {
    switch (type) {
      case 'rider':
        return `${WS_BASE_URL}/api/tracking/rider/${userId}?name=${encodeURIComponent(userName)}`;
      case 'customer':
        return `${WS_BASE_URL}/api/tracking/customer/${userId}`;
      case 'admin':
        return `${WS_BASE_URL}/api/tracking/admin`;
      default:
        return null;
    }
  }, [type, userId, userName]);

  const connect = useCallback(() => {
    const url = getWebSocketUrl();
    if (!url || !userId) return;

    try {
      const ws = new WebSocket(url);

      ws.onopen = () => {
        console.log(`[WebSocket] Connected as ${type}`);
        setIsConnected(true);
        reconnectAttempts.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastMessage(data);

          // Handle different message types
          switch (data.type) {
            case 'initial_state':
              // Admin receives all rider statuses
              const ridersMap = {};
              data.riders?.forEach(rider => {
                ridersMap[rider.rider_id] = rider;
              });
              setRiderLocations(ridersMap);
              break;

            case 'location_update':
              // Update specific rider location
              setRiderLocations(prev => ({
                ...prev,
                [data.rider_id]: {
                  ...prev[data.rider_id],
                  location: data.location
                }
              }));
              break;

            case 'rider_location':
              // Customer receives rider location
              setRiderLocations(prev => ({
                ...prev,
                [data.rider_id]: {
                  rider_id: data.rider_id,
                  rider_name: data.rider_name,
                  location: data.location,
                  status: data.status
                }
              }));
              break;

            case 'visit_status_update':
              setVisitStatuses(prev => ({
                ...prev,
                [data.visit_id]: {
                  status: data.status,
                  rider_id: data.rider_id,
                  timestamp: data.timestamp
                }
              }));
              break;

            case 'rider_connected':
            case 'rider_disconnected':
              // Handle rider connection changes
              break;

            default:
              break;
          }
        } catch (e) {
          console.error('[WebSocket] Parse error:', e);
        }
      };

      ws.onclose = () => {
        console.log('[WebSocket] Disconnected');
        setIsConnected(false);

        // Attempt to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current += 1;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          console.log(`[WebSocket] Reconnecting in ${delay}ms...`);
          reconnectTimeoutRef.current = setTimeout(connect, delay);
        }
      };

      ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('[WebSocket] Connection error:', error);
    }
  }, [getWebSocketUrl, type, userId]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const sendMessage = useCallback((message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  // Rider-specific: Send location update
  const sendLocation = useCallback((lat, lng, speed = null, heading = null) => {
    sendMessage({
      type: 'location',
      lat,
      lng,
      speed,
      heading
    });
  }, [sendMessage]);

  // Rider-specific: Update status
  const updateStatus = useCallback((status, visitId = null) => {
    sendMessage({
      type: 'status',
      status,
      visit_id: visitId
    });
  }, [sendMessage]);

  // Rider-specific: Update visit status
  const updateVisitStatus = useCallback((visitId, status) => {
    sendMessage({
      type: 'visit_update',
      visit_id: visitId,
      status
    });
  }, [sendMessage]);

  // Customer-specific: Start tracking a visit
  const trackVisit = useCallback((visitId) => {
    sendMessage({
      type: 'track_visit',
      visit_id: visitId
    });
  }, [sendMessage]);

  // Customer-specific: Stop tracking a visit
  const stopTrackingVisit = useCallback((visitId) => {
    sendMessage({
      type: 'stop_tracking',
      visit_id: visitId
    });
  }, [sendMessage]);

  useEffect(() => {
    if (userId) {
      connect();
    }
    return () => disconnect();
  }, [userId, connect, disconnect]);

  return {
    isConnected,
    lastMessage,
    riderLocations,
    visitStatuses,
    sendMessage,
    sendLocation,
    updateStatus,
    updateVisitStatus,
    trackVisit,
    stopTrackingVisit,
    reconnect: connect
  };
};

export default useTrackingWebSocket;
