// ============================================================
// ZYNQ — Offline Queue (IndexedDB)
// Stores failed write operations for replay when back online.
// Uses the `idb` library for a clean Promise-based API.
// ============================================================

import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface QueuedAction {
  id?: number; // Auto-incremented by IndexedDB
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body: any;
  timestamp: number;
  retries: number;
}

interface ZynqOfflineDB extends DBSchema {
  'offline-queue': {
    key: number;
    value: QueuedAction;
    indexes: {
      'by-timestamp': number;
    };
  };
}

const DB_NAME = 'zynq-offline';
const DB_VERSION = 1;
const STORE_NAME = 'offline-queue';

let dbInstance: IDBPDatabase<ZynqOfflineDB> | null = null;

async function getDB(): Promise<IDBPDatabase<ZynqOfflineDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<ZynqOfflineDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('by-timestamp', 'timestamp');
      }
    },
  });

  return dbInstance;
}

/**
 * Enqueue a failed write action for later replay.
 */
export async function enqueueAction(action: Omit<QueuedAction, 'id' | 'retries'>): Promise<number> {
  const db = await getDB();
  const id = await db.add(STORE_NAME, {
    ...action,
    retries: 0,
  } as QueuedAction);
  return id;
}

/**
 * Get all queued actions, ordered by timestamp (oldest first).
 */
export async function getQueuedActions(): Promise<QueuedAction[]> {
  const db = await getDB();
  return db.getAllFromIndex(STORE_NAME, 'by-timestamp');
}

/**
 * Get the count of queued actions.
 */
export async function getQueueCount(): Promise<number> {
  const db = await getDB();
  return db.count(STORE_NAME);
}

/**
 * Remove a successfully synced action from the queue.
 */
export async function removeAction(id: number): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_NAME, id);
}

/**
 * Increment the retry count for a failed action.
 */
export async function incrementRetry(id: number): Promise<void> {
  const db = await getDB();
  const action = await db.get(STORE_NAME, id);
  if (action) {
    action.retries += 1;
    await db.put(STORE_NAME, action);
  }
}

/**
 * Clear the entire queue (e.g., after user logout).
 */
export async function clearQueue(): Promise<void> {
  const db = await getDB();
  await db.clear(STORE_NAME);
}
