import { LoanRequest, AppNotification, UserProfile } from '../types';
import { Equipment } from '../data/equipment';

export type RealtimeEventType = 
  | 'LOANS_UPDATED' 
  | 'EQUIPMENT_UPDATED' 
  | 'NOTIFICATIONS_UPDATED' 
  | 'ADMIN_EMAILS_UPDATED' 
  | 'USER_UPDATED' 
  | 'EMAIL_LOGS_UPDATED'
  | 'FULL_SYNC';

export interface RealtimeDbMessage {
  type: RealtimeEventType;
  payload?: any;
  timestamp: string;
  sourceId: string;
}

// Generate unique client instance ID
const INSTANCE_ID = `client-${Math.random().toString(36).substring(2, 9)}-${Date.now()}`;

// BroadcastChannel instance
let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel('vet_lab_realtime_db_channel');
  }
} catch (e) {
  console.warn('BroadcastChannel not supported or restricted, falling back to storage events', e);
}

// Global subscribers set
type RealtimeCallback = (message: RealtimeDbMessage) => void;
const subscribers = new Set<RealtimeCallback>();

// Internal handler for incoming messages
function handleIncomingMessage(message: RealtimeDbMessage) {
  // Prevent echo back to same sender instance if not full sync
  if (message.sourceId === INSTANCE_ID && message.type !== 'FULL_SYNC') {
    return;
  }
  subscribers.forEach(cb => {
    try {
      cb(message);
    } catch (err) {
      console.error('Error in realtime subscriber callback:', err);
    }
  });
}

// Initialize listeners
if (typeof window !== 'undefined') {
  // 1. BroadcastChannel listener
  if (broadcastChannel) {
    broadcastChannel.onmessage = (event: MessageEvent<RealtimeDbMessage>) => {
      if (event.data && event.data.type) {
        handleIncomingMessage(event.data);
      }
    };
  }

  // 2. Window Storage Event listener (Cross-tab sync fallback)
  window.addEventListener('storage', (event: StorageEvent) => {
    if (!event.key) return;
    
    let eventType: RealtimeEventType | null = null;
    let payload: any = null;

    try {
      if (event.newValue) {
        payload = JSON.parse(event.newValue);
      }
    } catch {
      payload = event.newValue;
    }

    if (event.key === 'vet_equipment_loans') {
      eventType = 'LOANS_UPDATED';
    } else if (event.key === 'vet_equipment_list') {
      eventType = 'EQUIPMENT_UPDATED';
    } else if (event.key === 'vet_notifications') {
      eventType = 'NOTIFICATIONS_UPDATED';
    } else if (event.key === 'vet_admin_emails') {
      eventType = 'ADMIN_EMAILS_UPDATED';
    } else if (event.key === 'vet_current_user') {
      eventType = 'USER_UPDATED';
    }

    if (eventType) {
      handleIncomingMessage({
        type: eventType,
        payload,
        timestamp: new Date().toISOString(),
        sourceId: 'storage-event'
      });
    }
  });

  // 3. Custom in-app event listener (Same-tab instant sync)
  window.addEventListener('vet_lab_realtime_event', ((e: CustomEvent<RealtimeDbMessage>) => {
    if (e.detail) {
      handleIncomingMessage(e.detail);
    }
  }) as EventListener);
}

/**
 * Broadcast an update event to all active views and tabs
 */
export function broadcastRealtimeChange(type: RealtimeEventType, payload?: any): void {
  const message: RealtimeDbMessage = {
    type,
    payload,
    timestamp: new Date().toISOString(),
    sourceId: INSTANCE_ID
  };

  // 1. Post to BroadcastChannel
  try {
    if (broadcastChannel) {
      broadcastChannel.postMessage(message);
    }
  } catch (err) {
    console.warn('Failed to broadcast message via BroadcastChannel:', err);
  }

  // 2. Dispatch in-app CustomEvent
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('vet_lab_realtime_event', { detail: message }));
    }
  } catch (err) {
    console.warn('Failed to dispatch CustomEvent:', err);
  }
}

/**
 * Subscribe to real-time database changes
 */
export function subscribeToRealtimeDatabase(callback: RealtimeCallback): () => void {
  subscribers.add(callback);
  return () => {
    subscribers.delete(callback);
  };
}

/**
 * Broadcast loan changes
 */
export function broadcastLoansUpdate(loans: LoanRequest[]): void {
  broadcastRealtimeChange('LOANS_UPDATED', loans);
}

/**
 * Broadcast equipment catalog changes
 */
export function broadcastEquipmentUpdate(equipment: Equipment[]): void {
  broadcastRealtimeChange('EQUIPMENT_UPDATED', equipment);
}

/**
 * Broadcast notifications changes
 */
export function broadcastNotificationsUpdate(notifications: AppNotification[]): void {
  broadcastRealtimeChange('NOTIFICATIONS_UPDATED', notifications);
}

/**
 * Broadcast admin emails list changes
 */
export function broadcastAdminEmailsUpdate(emails: string[]): void {
  broadcastRealtimeChange('ADMIN_EMAILS_UPDATED', emails);
}

/**
 * Broadcast current user profile changes
 */
export function broadcastCurrentUserUpdate(user: UserProfile): void {
  broadcastRealtimeChange('USER_UPDATED', user);
}

/**
 * Force a full database re-sync across all components
 */
export function forceRealtimeSync(): void {
  broadcastRealtimeChange('FULL_SYNC', { forcedAt: new Date().toISOString() });
}
