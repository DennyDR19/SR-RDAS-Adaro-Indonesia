import { PetakUkur, AppNotification } from '../types';
import { INITIAL_PETAK_UKUR, INITIAL_NOTIFICATIONS } from '../data/defaultData';
import { calculateSurvivalRate, getCategoryInfo } from '../utils/survivalHelper';

const LOCAL_STORAGE_KEY = 'das_rehabilitasi_pu_v1';
const NOTIF_STORAGE_KEY = 'das_rehabilitasi_notif_v1';

function getLocalPUList(): PetakUkur[] {
  const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {}
  }
  return [...INITIAL_PETAK_UKUR];
}

function saveLocalPUList(list: PetakUkur[]): void {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
}

function getLocalNotifs(): AppNotification[] {
  const cached = localStorage.getItem(NOTIF_STORAGE_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {}
  }
  return [...INITIAL_NOTIFICATIONS];
}

function saveLocalNotifs(notifs: AppNotification[]): void {
  localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(notifs));
}

export class ApiService {
  // Get all PU data from server or fallback to local storage
  static async getPetakUkurList(): Promise<PetakUkur[]> {
    try {
      const res = await fetch('/api/pu');
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.data) && json.data.length > 0) {
          saveLocalPUList(json.data);
          return json.data;
        }
      }
    } catch {
      // server unavailable, use local cache
    }

    return getLocalPUList();
  }

  // Get notifications
  static async getNotifications(): Promise<AppNotification[]> {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.data)) {
          saveLocalNotifs(json.data);
          return json.data;
        }
      }
    } catch {
      // fallback
    }

    return getLocalNotifs();
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
      }
    } catch {
      // Fallback to local storage (e.g. on GitHub Pages static deployment)
    }

    const list = getLocalPUList();
    const tanamanAwal = Number(payload.tanamanAwal) || 50;
    const tanamanHidup = Math.min(Number(payload.tanamanHidup) || 0, tanamanAwal);
    const { rate, category } = calculateSurvivalRate(tanamanHidup, tanamanAwal);
    const catInfo = getCategoryInfo(category);
    const sulam = Math.max(0, tanamanAwal - tanamanHidup);

    const newPu: PetakUkur = {
      id: `pu-${Date.now()}`,
      kodePU: payload.kodePU?.trim() || `PU-${list.length + 1}`,
      subDas: payload.subDas || 'Sub-DAS Citarum Hulu',
      blok: payload.blok || 'Blok Lapangan',
      desa: payload.desa || '-',
      kecamatan: payload.kecamatan || '-',
      latitude: Number(payload.latitude) || -7.15,
      longitude: Number(payload.longitude) || 107.65,
      luasHa: Number(payload.luasHa) || 0.1,
      jenisTanaman: Array.isArray(payload.jenisTanaman) && payload.jenisTanaman.length > 0 ? payload.jenisTanaman : ['Puspa', 'Damar'],
      tanamanAwal,
      tanamanHidup,
      tanamanMerana: Number(payload.tanamanMerana) || 0,
      survivalRate: rate,
      kategori: category,
      tinggiRataRataCm: Number(payload.tinggiRataRataCm) || 120,
      tutupanTajukPersen: Number(payload.tutupanTajukPersen) || 25,
      tahunTanam: Number(payload.tahunTanam) || 2024,
      periodeEvaluasi: payload.periodeEvaluasi || 'P1 (Tahun 1)',
      kesehatanTanaman: payload.kesehatanTanaman || 'Cukup Sehat',
      kebutuhanPenyulaman: sulam,
      rekomendasi: payload.rekomendasi || catInfo.rekomendasiStandar,
      tanggalEvaluasi: payload.tanggalEvaluasi || new Date().toISOString().split('T')[0],
      evaluator: payload.evaluator || 'Tim Surveyor Rehabilitasi DAS',
      catatan: payload.catatan || '',
      updatedAt: new Date().toISOString(),
    };

    saveLocalPUList([newPu, ...list]);

    const notif: AppNotification = {
      id: `notif-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      type: category === 'hitam' ? 'alert' : category === 'merah' ? 'warning' : 'success',
      title: `Petak Ukur Baru: ${newPu.kodePU} (SR ${rate}%)`,
      message: `Tercatat di ${newPu.blok}, ${newPu.subDas}. Status: ${catInfo.name}.`,
      petakUkurId: newPu.id,
      isRead: false,
    };

    const notifs = getLocalNotifs();
    saveLocalNotifs([notif, ...notifs]);

    return { pu: newPu, notification: notif };
  }

  // Update existing PU
  static async updatePetakUkur(id: string, payload: Partial<PetakUkur>): Promise<{ pu: PetakUkur; notification?: AppNotification }> {
    try {
      const res = await fetch(`/api/pu/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const json = await res.json();
        return { pu: json.data, notification: json.notification };
      }
    } catch {
      // Fallback
    }

    const list = getLocalPUList();
    const existing = list.find((p) => p.id === id);
    if (!existing) throw new Error('Petak ukur tidak ditemukan.');

    const tanamanAwal = payload.tanamanAwal !== undefined ? Number(payload.tanamanAwal) : existing.tanamanAwal;
    const tanamanHidup = payload.tanamanHidup !== undefined ? Number(payload.tanamanHidup) : existing.tanamanHidup;
    const { rate, category } = calculateSurvivalRate(tanamanHidup, tanamanAwal);
    const catInfo = getCategoryInfo(category);

    const updatedPu: PetakUkur = {
      ...existing,
      ...payload,
      tanamanAwal,
      tanamanHidup,
      survivalRate: rate,
      kategori: category,
      kebutuhanPenyulaman: Math.max(0, tanamanAwal - tanamanHidup),
      rekomendasi: payload.rekomendasi || catInfo.rekomendasiStandar,
      updatedAt: new Date().toISOString(),
    };

    saveLocalPUList(list.map((p) => (p.id === id ? updatedPu : p)));

    const notif: AppNotification = {
      id: `notif-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      type: category === 'hitam' ? 'alert' : category === 'merah' ? 'warning' : 'info',
      title: `Pembaruan Nilai: ${updatedPu.kodePU} (SR ${rate}%)`,
      message: `Perubahan data evaluasi tersimpan di ${updatedPu.blok}.`,
      petakUkurId: updatedPu.id,
      isRead: false,
    };

    const notifs = getLocalNotifs();
    saveLocalNotifs([notif, ...notifs]);

    return { pu: updatedPu, notification: notif };
  }

  // Delete PU
  static async deletePetakUkur(id: string): Promise<void> {
    try {
      const res = await fetch(`/api/pu/${id}`, { method: 'DELETE' });
      if (res.ok) return;
    } catch {}

    const list = getLocalPUList();
    saveLocalPUList(list.filter((p) => p.id !== id));
  }

  // Reset to default sample
  static async resetData(): Promise<PetakUkur[]> {
    try {
      const res = await fetch('/api/pu/reset', { method: 'POST' });
      if (res.ok) {
        const json = await res.json();
        saveLocalPUList(json.data);
        return json.data;
      }
    } catch {}

    saveLocalPUList([...INITIAL_PETAK_UKUR]);
    saveLocalNotifs([...INITIAL_NOTIFICATIONS]);
    return [...INITIAL_PETAK_UKUR];
  }

  // Mark notification read
  static async markNotificationRead(id: string): Promise<void> {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
    } catch {}

    const notifs = getLocalNotifs();
    saveLocalNotifs(notifs.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  }

  // Mark all notifications read
  static async markAllNotificationsRead(): Promise<void> {
    try {
      await fetch('/api/notifications/read-all', { method: 'POST' });
    } catch {}

    const notifs = getLocalNotifs();
    saveLocalNotifs(notifs.map((n) => ({ ...n, isRead: true })));
  }
}
