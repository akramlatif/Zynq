// ============================================================
// ZYNQ — Sync Manager
// Replays queued offline actions when connection is restored.
// ============================================================

import {
  getQueuedActions,
  removeAction,
  incrementRetry,
  QueuedAction,
} from './offlineQueue';

const MAX_RETRIES = 3;

export interface SyncResult {
  total: number;
  succeeded: number;
  failed: number;
  results: Array<{
    action: QueuedAction;
    success: boolean;
    error?: string;
  }>;
}

/**
 * Replay all queued offline actions in chronological order.
 * Returns a detailed report of what succeeded/failed.
 */
export async function replayQueue(
  onActionSynced?: (action: QueuedAction, success: boolean, error?: string) => void
): Promise<SyncResult> {
  const actions = await getQueuedActions();

  const result: SyncResult = {
    total: actions.length,
    succeeded: 0,
    failed: 0,
    results: [],
  };

  if (actions.length === 0) return result;

  for (const action of actions) {
    // Skip actions that have exceeded max retries
    if (action.retries >= MAX_RETRIES) {
      console.warn(`[SyncManager] Skipping action ${action.id} — max retries (${MAX_RETRIES}) exceeded`);
      await removeAction(action.id!);
      result.failed++;
      result.results.push({ action, success: false, error: 'Max retries exceeded' });
      onActionSynced?.(action, false, 'Max retries exceeded');
      continue;
    }

    try {
      const response = await fetch(action.endpoint, {
        method: action.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action.body),
      });

      if (response.ok) {
        await removeAction(action.id!);
        result.succeeded++;
        result.results.push({ action, success: true });
        onActionSynced?.(action, true);
      } else {
        // Server rejected — increment retry and keep in queue
        await incrementRetry(action.id!);
        result.failed++;
        const errorText = `Server returned ${response.status}`;
        result.results.push({ action, success: false, error: errorText });
        onActionSynced?.(action, false, errorText);
      }
    } catch (error: any) {
      // Network error — still offline, stop the queue
      console.error(`[SyncManager] Network error during sync:`, error.message);
      await incrementRetry(action.id!);
      result.failed++;
      result.results.push({ action, success: false, error: 'Network error' });
      onActionSynced?.(action, false, 'Network error');
      // Stop processing — we're probably still offline
      break;
    }
  }

  return result;
}

/**
 * Human-readable label for an endpoint action.
 */
export function getActionLabel(action: QueuedAction): string {
  const { endpoint, method } = action;

  if (endpoint.includes('/products') && method === 'POST') return 'Add Product';
  if (endpoint.includes('/products') && method === 'PUT') return 'Update Product';
  if (endpoint.includes('/bills') && method === 'POST') return 'Create Bill';
  if (endpoint.includes('/udhaar') && method === 'POST') return 'Add Udhaar';
  if (endpoint.includes('/udhaar') && method === 'PUT') return 'Update Udhaar';

  return `${method} ${endpoint.split('/').pop()}`;
}
