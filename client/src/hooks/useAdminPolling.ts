/**
 * Global admin polling coordination hook
 * Prevents multiple admin pages from making redundant API calls
 */

import { useEffect, useRef } from 'react';

// Global state to track active admin polling
let globalAdminPolling = {
  activeInstances: 0,
  shouldPoll: true,
  lastPollTime: 0,
  minInterval: 60000, // Minimum 60 seconds between polls
};

export function useAdminPolling(endpoint: string, interval: number = 60000) {
  const instanceId = useRef(Math.random().toString(36));
  
  useEffect(() => {
    // Register this instance
    globalAdminPolling.activeInstances++;
    
    return () => {
      // Unregister this instance
      globalAdminPolling.activeInstances--;
    };
  }, []);

  const shouldPoll = () => {
    // Only poll if page is visible
    if (document.visibilityState !== 'visible') {
      return false;
    }
    
    // Rate limit based on global state
    const now = Date.now();
    if (now - globalAdminPolling.lastPollTime < globalAdminPolling.minInterval) {
      return false;
    }
    
    globalAdminPolling.lastPollTime = now;
    return interval;
  };

  return {
    refetchInterval: shouldPoll,
    refetchOnWindowFocus: false,
    enabled: document.visibilityState === 'visible',
  };
}