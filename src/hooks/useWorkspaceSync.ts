import { useState, useEffect, useRef, useCallback } from 'react';
import { LeafTelemetry } from '../types/bioBot';
import { Operator, ActivityLogItem, SharedWorkspaceState, RoomChatMessage } from '../types/collaboration';
import { crdtWorkspace } from '../crdt/yjsWorkspace';
import { workspaceDB } from '../utils/indexedDbStorage';

interface UseWorkspaceSyncProps {
  operatorName: string;
  operatorRole: string;
  operatorColor: string;
  onRemoteTelemetry?: (telemetry: LeafTelemetry, operatorName: string) => void;
  onRemoteActuator?: (action: string, operatorName: string) => void;
  onRemoteChord?: (chordName: string, freq: number, gain?: number, operatorName?: string) => void;
  onRemoteRhythm?: (isPlaying: boolean, operatorName: string) => void;
  onRemoteRemediation?: (data: { zoneId?: string; isExtracting?: boolean; currentPpm?: number; operatorName: string }) => void;
}

export function useWorkspaceSync({
  operatorName,
  operatorRole,
  operatorColor,
  onRemoteTelemetry,
  onRemoteActuator,
  onRemoteChord,
  onRemoteRhythm,
  onRemoteRemediation,
}: UseWorkspaceSyncProps) {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isCrdtSynced, setIsCrdtSynced] = useState<boolean>(true);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLogItem[]>([]);
  const [chatMessages, setChatMessages] = useState<RoomChatMessage[]>([]);
  const [initialStateLoaded, setInitialStateLoaded] = useState<boolean>(false);
  const [initialWorkspaceState, setInitialWorkspaceState] = useState<SharedWorkspaceState | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const shouldConnectRef = useRef<boolean>(true);
  const throttledSaveTimeout = useRef<NodeJS.Timeout | null>(null);

  // Keep latest callbacks in refs to avoid reconnection loops
  const callbacksRef = useRef({
    onRemoteTelemetry,
    onRemoteActuator,
    onRemoteChord,
    onRemoteRhythm,
    onRemoteRemediation,
  });

  useEffect(() => {
    callbacksRef.current = {
      onRemoteTelemetry,
      onRemoteActuator,
      onRemoteChord,
      onRemoteRhythm,
      onRemoteRemediation,
    };
  }, [onRemoteTelemetry, onRemoteActuator, onRemoteChord, onRemoteRhythm, onRemoteRemediation]);

  // Offline-First Restore from IndexedDB on initial load
  useEffect(() => {
    let isCancelled = false;
    workspaceDB.getWorkspaceSnapshot('ms-heavy-metal-workspace').then((cached: any) => {
      if (!isCancelled && cached) {
        if (cached.chatMessages && cached.chatMessages.length > 0) {
          setChatMessages(cached.chatMessages);
        }
        if (cached.activityLog && cached.activityLog.length > 0) {
          setActivityLog(cached.activityLog);
        }
        if (cached.telemetry && callbacksRef.current.onRemoteTelemetry) {
          callbacksRef.current.onRemoteTelemetry(cached.telemetry, 'INDEXEDDB_CACHE');
        }
      }
    });

    return () => {
      isCancelled = true;
    };
  }, []);

  // Throttled 1-second auto-save to IndexedDB
  const scheduleIndexedDBSave = useCallback((data: any) => {
    if (throttledSaveTimeout.current) return;
    throttledSaveTimeout.current = setTimeout(() => {
      throttledSaveTimeout.current = null;
      workspaceDB.saveWorkspaceSnapshot('ms-heavy-metal-workspace', data);
    }, 1000);
  }, []);

  // Subscribe to local Yjs CRDT changes to broadcast over WebSocket
  useEffect(() => {
    const unsubscribe = crdtWorkspace.onLocalUpdate((updateBase64) => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({
          type: 'crdt_sync',
          update: updateBase64,
        }));
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const connect = useCallback(() => {
    if (!operatorName.trim()) return;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = async () => {
        setIsConnected(true);
        setIsCrdtSynced(true);

        // Send Join payload
        ws.send(JSON.stringify({
          type: 'join',
          name: operatorName,
          role: operatorRole,
          color: operatorColor,
        }));

        // Send full CRDT state synchronization vector
        const crdtState = crdtWorkspace.getFullStateUpdateBase64();
        if (crdtState) {
          ws.send(JSON.stringify({
            type: 'crdt_sync',
            update: crdtState,
          }));
        }

        // Drain any pending actions recorded while offline
        const pending = await workspaceDB.drainOfflineQueue();
        if (pending && pending.length > 0) {
          pending.forEach((item) => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify(item));
            }
          });
        }
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === 'init') {
            setInitialStateLoaded(true);
            if (msg.workspaceState) {
              setInitialWorkspaceState(msg.workspaceState);
              if (callbacksRef.current.onRemoteTelemetry && msg.workspaceState.telemetry) {
                callbacksRef.current.onRemoteTelemetry(msg.workspaceState.telemetry, 'SERVER_INIT');
              }
            }
            if (msg.operators) setOperators(msg.operators);
            if (msg.activityHistory) {
              setActivityLog(msg.activityHistory);
              scheduleIndexedDBSave({ activityLog: msg.activityHistory });
            }
            if (msg.chatHistory) {
              setChatMessages(msg.chatHistory);
              scheduleIndexedDBSave({ chatMessages: msg.chatHistory });
            }
          }

          else if (msg.type === 'crdt_sync') {
            if (msg.update) {
              crdtWorkspace.applyRemoteUpdate(msg.update);
              setIsCrdtSynced(true);
            }
          }

          else if (msg.type === 'operators_update') {
            setOperators(msg.operators || []);
          }

          else if (msg.type === 'activity_broadcast') {
            if (msg.activity) {
              setActivityLog((prev) => {
                const updated = [msg.activity, ...prev.slice(0, 59)];
                scheduleIndexedDBSave({ activityLog: updated });
                return updated;
              });
            }
          }

          else if (msg.type === 'chat_broadcast') {
            if (msg.message) {
              setChatMessages((prev) => {
                const updated = [...prev.slice(-99), msg.message];
                scheduleIndexedDBSave({ chatMessages: updated });
                return updated;
              });
            }
          }

          else if (msg.type === 'telemetry_sync') {
            if (callbacksRef.current.onRemoteTelemetry && msg.telemetry) {
              callbacksRef.current.onRemoteTelemetry(msg.telemetry, msg.operatorName);
              crdtWorkspace.updateTelemetry(msg.telemetry);
              scheduleIndexedDBSave({ telemetry: msg.telemetry });
            }
          }

          else if (msg.type === 'actuator_broadcast') {
            if (callbacksRef.current.onRemoteActuator && msg.action) {
              callbacksRef.current.onRemoteActuator(msg.action, msg.operatorName);
            }
          }

          else if (msg.type === 'acoustic_broadcast') {
            if (callbacksRef.current.onRemoteChord) {
              callbacksRef.current.onRemoteChord(msg.chordName, msg.freq, msg.gain, msg.operatorName);
            }
          }

          else if (msg.type === 'rhythm_broadcast') {
            if (callbacksRef.current.onRemoteRhythm) {
              callbacksRef.current.onRemoteRhythm(msg.isPlaying, msg.operatorName);
            }
          }

          else if (msg.type === 'remediation_broadcast') {
            if (callbacksRef.current.onRemoteRemediation) {
              callbacksRef.current.onRemoteRemediation({
                zoneId: msg.zoneId,
                isExtracting: msg.isExtracting,
                currentPpm: msg.currentPpm,
                operatorName: msg.operatorName,
              });
            }
          }
        } catch (e) {
          console.error('Error decoding incoming WebSocket payload:', e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        setIsCrdtSynced(false);
        if (shouldConnectRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 2500);
        }
      };

      ws.onerror = (e) => {
        console.warn('WebSocket connection error:', e);
        ws.close();
      };
    } catch (err) {
      console.error('Failed to instantiate WebSocket:', err);
    }
  }, [operatorName, operatorRole, operatorColor, scheduleIndexedDBSave]);

  useEffect(() => {
    shouldConnectRef.current = true;
    connect();

    return () => {
      shouldConnectRef.current = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connect]);

  // Outgoing broadcast helper functions
  const broadcastUserNameChange = useCallback((name: string, role: string, color: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'user_name_change',
        name,
        role,
        color,
      }));
    }
  }, []);

  const broadcastChatMessage = useCallback((text: string) => {
    const payload = {
      type: 'chat_message',
      text,
      senderName: operatorName,
      role: operatorRole,
      avatarColor: operatorColor,
    };

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(payload));
    } else {
      // Offline fallback: queue action locally in IndexedDB
      workspaceDB.queueOfflineAction(payload);
    }
  }, [operatorName, operatorRole, operatorColor]);

  const broadcastTelemetry = useCallback((patch: Partial<LeafTelemetry>) => {
    // Record in local Yjs CRDT for deterministic merging
    crdtWorkspace.updateTelemetry(patch);

    const payload = {
      type: 'telemetry_patch',
      patch,
    };

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(payload));
    } else {
      workspaceDB.queueOfflineAction(payload);
    }
  }, []);

  const broadcastActuator = useCallback((action: string) => {
    const payload = {
      type: 'actuator_trigger',
      action,
    };

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(payload));
    } else {
      workspaceDB.queueOfflineAction(payload);
    }
  }, []);

  const broadcastChord = useCallback((chordName: string, freq: number, gain?: number) => {
    const payload = {
      type: 'acoustic_chord',
      chordName,
      freq,
      gain,
    };

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(payload));
    } else {
      workspaceDB.queueOfflineAction(payload);
    }
  }, []);

  const broadcastRhythm = useCallback((isPlaying: boolean) => {
    const payload = {
      type: 'rhythm_toggle',
      isPlaying,
    };

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(payload));
    } else {
      workspaceDB.queueOfflineAction(payload);
    }
  }, []);

  const broadcastRemediation = useCallback((data: { zoneId?: string; isExtracting?: boolean; currentPpm?: number; actionDesc?: string }) => {
    const payload = {
      type: 'remediation_change',
      ...data,
    };

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(payload));
    } else {
      workspaceDB.queueOfflineAction(payload);
    }
  }, []);

  return {
    isConnected,
    isCrdtSynced,
    operators,
    activityLog,
    chatMessages,
    initialStateLoaded,
    initialWorkspaceState,
    broadcastUserNameChange,
    broadcastChatMessage,
    broadcastTelemetry,
    broadcastActuator,
    broadcastChord,
    broadcastRhythm,
    broadcastRemediation,
  };
}
