'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { getQueueCount, enqueueAction as idbEnqueue, clearQueue } from '@/lib/offlineQueue';
import { replayQueue, getActionLabel } from '@/lib/syncManager';

interface OfflineContextType {
  isOnline: boolean;
  queuedCount: number;
  enqueueAction: (endpoint: string, method: 'POST' | 'PUT' | 'PATCH' | 'DELETE', body: any) => Promise<boolean>;
  triggerSync: () => Promise<void>;
  clearOfflineData: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  // Default to true during SSR, window availability checked in useEffect
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [queuedCount, setQueuedCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // Refresh queue count
  const refreshQueueCount = useCallback(async () => {
    try {
      const count = await getQueueCount();
      setQueuedCount(count);
    } catch (error) {
      console.error('Failed to get offline queue count', error);
    }
  }, []);

  // Sync background queue
  const triggerSync = useCallback(async () => {
    if (!isOnline || isSyncing) return;
    setIsSyncing(true);

    try {
      const currentCount = await getQueueCount();
      if (currentCount === 0) return;

      toast.loading(`Syncing ${currentCount} offline action(s)...`, { id: 'offline-sync' });

      const result = await replayQueue((action, success, error) => {
        const label = getActionLabel(action);
        if (success) {
          toast.success(`Synced: ${label}`);
        } else {
          toast.error(`Failed to sync: ${label}`);
        }
      });

      if (result.succeeded > 0) {
        toast.success(`Successfully synced ${result.succeeded} actions`, { id: 'offline-sync' });
      } else if (result.failed > 0) {
        toast.error(`${result.failed} actions failed to sync.`, { id: 'offline-sync' });
      } else {
        toast.dismiss('offline-sync');
      }

      await refreshQueueCount();
    } catch (error) {
      console.error('Error during sync replay:', error);
      toast.error('Sync process encountered an error', { id: 'offline-sync' });
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, refreshQueueCount]);

  // Handle online/offline events
  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);
    refreshQueueCount();

    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Back online. Syncing data...');
      triggerSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('You are offline. Changes will be saved locally.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial sync check
    if (navigator.onLine) {
      triggerSync();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [refreshQueueCount, triggerSync]);

  // API to add an action to the queue
  const enqueueAction = async (endpoint: string, method: 'POST' | 'PUT' | 'PATCH' | 'DELETE', body: any) => {
    try {
      await idbEnqueue({ endpoint, method, body, timestamp: Date.now() });
      await refreshQueueCount();
      return true; // Successfully queued
    } catch (error) {
      console.error('Failed to enqueue offline action:', error);
      toast.error('Failed to save offline action.');
      return false;
    }
  };

  const clearOfflineData = async () => {
    await clearQueue();
    await refreshQueueCount();
    toast.success('Offline data cleared');
  };

  return (
    <OfflineContext.Provider value={{ isOnline, queuedCount, enqueueAction, triggerSync, clearOfflineData }}>
      {children}
    </OfflineContext.Provider>
  );
}

export function useOffline() {
  const context = useContext(OfflineContext);
  if (context === undefined) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
}
