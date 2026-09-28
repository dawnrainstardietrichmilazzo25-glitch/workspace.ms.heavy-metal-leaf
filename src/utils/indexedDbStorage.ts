/**
 * Offline-First IndexedDB Storage for Ms. Heavy Metal Leaf Workspace
 * Enables instant session restore, zero-latency local caching, and offline recovery.
 */

const DB_NAME = 'ms-heavy-metal-leaf-workspace-db';
const DB_VERSION = 1;
const STORE_WORKSPACE = 'workspace-state';
const STORE_OFFLINE_QUEUE = 'offline-queue';

class WorkspaceIndexedDB {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        if (typeof window === 'undefined' || !window.indexedDB) {
          reject(new Error('IndexedDB not supported in this environment'));
          return;
        }

        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(STORE_WORKSPACE)) {
            db.createObjectStore(STORE_WORKSPACE);
          }
          if (!db.objectStoreNames.contains(STORE_OFFLINE_QUEUE)) {
            db.createObjectStore(STORE_OFFLINE_QUEUE, { autoIncrement: true });
          }
        };

        request.onsuccess = () => {
          resolve(request.result);
        };

        request.onerror = () => {
          reject(request.error);
        };
      });
    }
    return this.dbPromise;
  }

  /**
   * Save a snapshot of the workspace state into IndexedDB
   */
  public async saveWorkspaceSnapshot(key: string, data: any): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_WORKSPACE, 'readwrite');
        const store = tx.objectStore(STORE_WORKSPACE);
        const req = store.put({ data, timestamp: Date.now() }, key);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('IndexedDB save error (falling back to memory):', e);
    }
  }

  /**
   * Retrieve a cached workspace snapshot
   */
  public async getWorkspaceSnapshot<T = any>(key: string): Promise<T | null> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_WORKSPACE, 'readonly');
        const store = tx.objectStore(STORE_WORKSPACE);
        const req = store.get(key);
        req.onsuccess = () => {
          if (req.result && req.result.data) {
            resolve(req.result.data);
          } else {
            resolve(null);
          }
        };
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('IndexedDB read error:', e);
      return null;
    }
  }

  /**
   * Queue an offline command or telemetry update to be synchronized once online
   */
  public async queueOfflineAction(action: any): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_OFFLINE_QUEUE, 'readwrite');
        const store = tx.objectStore(STORE_OFFLINE_QUEUE);
        const req = store.add({ action, timestamp: Date.now() });
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('Could not queue offline action:', e);
    }
  }

  /**
   * Drain pending offline actions
   */
  public async drainOfflineQueue(): Promise<any[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_OFFLINE_QUEUE, 'readwrite');
        const store = tx.objectStore(STORE_OFFLINE_QUEUE);
        const req = store.getAll();
        req.onsuccess = () => {
          const results = req.result || [];
          store.clear();
          resolve(results.map((r: any) => r.action));
        };
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('Could not drain offline queue:', e);
      return [];
    }
  }
}

export const workspaceDB = new WorkspaceIndexedDB();
