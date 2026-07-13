'use client';

import { useOffline } from '@/providers/OfflineProvider';
import { WifiOff, RefreshCw } from 'lucide-react';

export default function OfflineBanner() {
  const { isOnline, queuedCount, triggerSync } = useOffline();

  // Show if offline OR if we're online but still have queued items trying to sync
  if (isOnline && queuedCount === 0) return null;

  return (
    <div className="bg-amber-100 dark:bg-amber-900/40 border-b border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 px-4 py-2 flex items-center justify-between text-sm shadow-sm relative z-50">
      <div className="flex items-center gap-2 font-medium">
        {!isOnline ? (
          <>
            <WifiOff className="w-4 h-4" />
            <span>You are offline.</span>
          </>
        ) : (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Connection restored. Syncing...</span>
          </>
        )}
        
        {queuedCount > 0 && (
          <span className="bg-amber-200 dark:bg-amber-800 px-2 py-0.5 rounded-full text-xs font-bold ml-2">
            {queuedCount} actions queued
          </span>
        )}
      </div>

      {!isOnline && queuedCount > 0 && (
        <span className="text-xs opacity-80 hidden md:inline-block">
          Changes will sync automatically when back online.
        </span>
      )}

      {isOnline && queuedCount > 0 && (
        <button 
          onClick={triggerSync}
          className="text-xs bg-amber-200 hover:bg-amber-300 dark:bg-amber-800 dark:hover:bg-amber-700 px-3 py-1 rounded transition-colors"
        >
          Force Sync
        </button>
      )}
    </div>
  );
}
