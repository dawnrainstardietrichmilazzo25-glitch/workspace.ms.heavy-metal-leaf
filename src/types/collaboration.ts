import { LeafTelemetry } from './bioBot';

export interface Operator {
  id: string;
  name: string;
  role: string;
  color: string;
  joinedAt: number;
}

export interface ActivityLogItem {
  id: string;
  timestamp: string;
  operatorName: string;
  operatorColor: string;
  actionType: 'actuator' | 'telemetry' | 'acoustic' | 'remediation' | 'presence';
  detail: string;
}

export interface RoomChatMessage {
  id: string;
  userId: string;
  senderName: string;
  role: string;
  avatarColor: string;
  text: string;
  timestamp: string;
}

export interface SharedWorkspaceState {
  telemetry: LeafTelemetry;
  activeZoneId: string;
  isExtracting: boolean;
  currentPpm: number;
  acousticResonanceHz: number;
  distortionGain: number;
  isRhythmPlaying: boolean;
  chatHistory: RoomChatMessage[];
  updatedAt: number;
}
