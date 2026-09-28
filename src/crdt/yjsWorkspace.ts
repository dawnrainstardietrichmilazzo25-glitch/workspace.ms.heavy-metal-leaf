/**
 * Yjs CRDT State Engine for Ms. Heavy Metal Leaf Collaborative Workspace
 * Provides deterministic, conflict-free state synchronization between operators.
 */

import * as Y from 'yjs';
import { LeafTelemetry } from '../types/bioBot';
import { RoomChatMessage, ActivityLogItem } from '../types/collaboration';

// Binary/Base64 serialization helpers for WebSocket transmission
export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export class YjsWorkspaceManager {
  public doc: Y.Doc;
  public yTelemetry: Y.Map<any>;
  public yRoomState: Y.Map<any>;
  public yChatMessages: Y.Array<RoomChatMessage>;
  public yActivityLog: Y.Array<ActivityLogItem>;

  private onUpdateCallbacks: Set<(updateBase64: string, origin: any) => void> = new Set();

  constructor() {
    this.doc = new Y.Doc();
    this.yTelemetry = this.doc.getMap('telemetry');
    this.yRoomState = this.doc.getMap('roomState');
    this.yChatMessages = this.doc.getArray('chatMessages');
    this.yActivityLog = this.doc.getArray('activityLog');

    // Subscribe to internal Yjs document updates
    this.doc.on('update', (update: Uint8Array, origin: any) => {
      // Avoid re-broadcasting updates received from remote
      if (origin === 'remote') return;

      const base64Update = uint8ArrayToBase64(update);
      this.onUpdateCallbacks.forEach((cb) => cb(base64Update, origin));
    });
  }

  /**
   * Register a listener for local CRDT state changes to broadcast over WebSocket
   */
  public onLocalUpdate(callback: (updateBase64: string, origin: any) => void): () => void {
    this.onUpdateCallbacks.add(callback);
    return () => {
      this.onUpdateCallbacks.delete(callback);
    };
  }

  /**
   * Apply a remote CRDT update received over WebSocket
   */
  public applyRemoteUpdate(base64Update: string): void {
    try {
      const update = base64ToUint8Array(base64Update);
      Y.applyUpdate(this.doc, update, 'remote');
    } catch (e) {
      console.error('Failed to apply remote Yjs CRDT update:', e);
    }
  }

  /**
   * Encode the full current document state as a binary base64 update
   */
  public getFullStateUpdateBase64(): string {
    const fullState = Y.encodeStateAsUpdate(this.doc);
    return uint8ArrayToBase64(fullState);
  }

  /**
   * Update telemetry deterministically via CRDT
   */
  public updateTelemetry(patch: Partial<LeafTelemetry>): void {
    this.doc.transact(() => {
      Object.entries(patch).forEach(([key, val]) => {
        if (val !== undefined) {
          this.yTelemetry.set(key, val);
        }
      });
    }, 'local');
  }

  /**
   * Update room metadata (zoneId, extraction status, audio resonance)
   */
  public updateRoomState(patch: Record<string, any>): void {
    this.doc.transact(() => {
      Object.entries(patch).forEach(([key, val]) => {
        if (val !== undefined) {
          this.yRoomState.set(key, val);
        }
      });
    }, 'local');
  }

  /**
   * Append a chat message to the shared CRDT array
   */
  public addChatMessage(msg: RoomChatMessage): void {
    this.doc.transact(() => {
      // Keep chat history bounded to recent 100 items
      if (this.yChatMessages.length >= 100) {
        this.yChatMessages.delete(0, 1);
      }
      this.yChatMessages.push([msg]);
    }, 'local');
  }

  /**
   * Prepend an activity log item
   */
  public addActivityItem(item: ActivityLogItem): void {
    this.doc.transact(() => {
      if (this.yActivityLog.length >= 60) {
        this.yActivityLog.delete(this.yActivityLog.length - 1, 1);
      }
      this.yActivityLog.insert(0, [item]);
    }, 'local');
  }

  /**
   * Read snapshot of telemetry from Yjs
   */
  public getTelemetrySnapshot(): Partial<LeafTelemetry> {
    const obj: any = {};
    this.yTelemetry.forEach((val, key) => {
      obj[key] = val;
    });
    return obj;
  }
}

export const crdtWorkspace = new YjsWorkspaceManager();
