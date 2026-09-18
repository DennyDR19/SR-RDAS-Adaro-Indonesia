import { PetakUkur, AppNotification } from '../types';
import { INITIAL_PETAK_UKUR, INITIAL_NOTIFICATIONS } from '../data/defaultData';

const LOCAL_STORAGE_KEY = 'das_rehabilitasi_pu_v1';
const NOTIF_STORAGE_KEY = 'das_rehabilitasi_notif_v1';

export class ApiService {
  // Get all PU data from server or fallback to local storage
  static async getPetakUkurList(): Promise<PetakUkur[]> {
    try {
      const res = await fetch('/api/pu');
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.data) && json.data.length > 0) {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(json.data));
          return json.data;
        }
      }
    } catch {
      // server unavailable, use local cache
    }

    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        // ignore error
      }
    }

    return INITIAL_PETAK_UKUR;
  }

  // Get notifications
  static async getNotifications(): Promise<AppNotification[]> {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.data)) {
          localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(json.data));
          return json.data;
        }
      }
    } catch {
      // fallback
    }

    const cached = localStorage.getItem(NOTIF_STORAGE_KEY);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        // ignore
      }
    }

    return INITIAL_NOTIFICATIONS;
  }

  // Save new PU
  static async createPetakUkur(payload: Partial<PetakUkur>): Promise<{ pu: PetakUkur; notification?: AppNotification }> {
    try {
      const res = await fetch('/api/pu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const json = await res.json();
        return { pu: json.data, notification: json.notification };
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Gagal menyimpan data ke server.');
      }
    } catch (err: any) {
      // Offline fallback handling
      console.warn('Saving locally due to API failure:', err);
      throw err;
    }
  }

  // Update existing PU
  static async updatePetakUkur(id: string, payload: Partial<PetakUkur>): Promise<{ pu: PetakUkur; notification?: AppNotification }> {
    const res = await fetch(`/api/pu/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const json = await res.json();
      return { pu: json.data, notification: json.notification };
    } else {
      const err = await res.json();
      throw new Error(err.error || 'Gagal memperbarui data.');
    }
  }

  // Delete PU
  static async deletePetakUkur(id: string): Promise<void> {
    const res = await fetch(`/api/pu/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Gagal menghapus data.');
    }
  }

  // Reset to default sample
  static async resetData(): Promise<PetakUkur[]> {
    const res = await fetch('/api/pu/reset', {
      method: 'POST',
    });
    if (res.ok) {
      const json = await res.json();
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(json.data));
      return json.data;
    }
    throw new Error('Gagal mereset data.');
  }

  // Mark notification read
  static async markNotificationRead(id: string): Promise<void> {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
    } catch {
      // ignore
    }
  }

  // Mark all notifications read
  static async markAllNotificationsRead(): Promise<void> {
    try {
      await fetch('/api/notifications/read-all', { method: 'POST' });
    } catch {
      // ignore
    }
  }
}
