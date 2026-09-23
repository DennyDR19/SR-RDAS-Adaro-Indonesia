import { PetakUkur, AppNotification } from '../types';
import { INITIAL_PETAK_UKUR, INITIAL_NOTIFICATIONS } from '../data/defaultData';
import { calculateSurvivalRate, getCategoryInfo } from '../utils/survivalHelper';
import { GoogleSheetsBackend } from './googleSheetsBackend';
import {
  getAccessToken,
  getSavedSpreadsheetId,
  saveSinglePUToGoogleSheet,
  fetchPUsFromGoogleSheet,
} from './googleSheetsDirectService';

const LOCAL_STORAGE_KEY = 'das_rehabilitasi_pu_2026_v2';
const NOTIF_STORAGE_KEY = 'das_rehabilitasi_notif_2026_v2';

function getLocalPUList(): PetakUkur[] {
  const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length >= 100) {
        return parsed;
      }
    } catch {}
  }
  const initial = [...INITIAL_PETAK_UKUR];
  saveLocalPUList(initial);
  return initial;
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
  // Get all PU data from server, Google Sheets, or fallback to local storage
  static async getPetakUkurList(): Promise<PetakUkur[]> {
    // 1. Try Google Sheets if configured
    if (GoogleSheetsBackend.isConnected()) {
      try {
        const sheetData = await GoogleSheetsBackend.fetchFromSheet();
        if (Array.isArray(sheetData) && sheetData.length > 0) {
          saveLocalPUList(sheetData);
          return sheetData;
        }
      } catch (err) {
        console.warn('Google Sheets fetch failed, falling back:', err);
      }
    }

    // 2. Try Node/Express backend server
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
    let savedPu: PetakUkur | null = null;
    let savedNotif: AppNotification | undefined = undefined;

    try {
      const res = await fetch('/api/pu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const json = await res.json();
        savedPu = json.data;
        savedNotif = json.notification;
      }
    } catch {
      // Fallback to local storage (e.g. on GitHub Pages static deployment)
    }

    if (!savedPu) {
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

      savedPu = newPu;
      savedNotif = notif;
    }

    // Auto-sync to Google Sheet if connected (Webhook)
    if (GoogleSheetsBackend.isConnected() && savedPu) {
      GoogleSheetsBackend.savePU(savedPu).catch((e) => console.warn('Sync to Google Sheets Webhook failed:', e));
    }

    // Auto-sync to Direct Google Account Sheets
    const directToken = getAccessToken();
    const sheetId = getSavedSpreadsheetId();
    if (directToken && sheetId && savedPu) {
      saveSinglePUToGoogleSheet(directToken, sheetId, savedPu).catch((e) =>
        console.warn('Sync to Direct Google Sheet failed:', e)
      );
    }

    return { pu: savedPu, notification: savedNotif };
  }

  // Update existing PU
  static async updatePetakUkur(id: string, payload: Partial<PetakUkur>): Promise<{ pu: PetakUkur; notification?: AppNotification }> {
    let updatedPu: PetakUkur | null = null;
    let updatedNotif: AppNotification | undefined = undefined;

    try {
      const res = await fetch(`/api/pu/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const json = await res.json();
        updatedPu = json.data;
        updatedNotif = json.notification;
      }
    } catch {
      // Fallback
    }

    if (!updatedPu) {
      const list = getLocalPUList();
      const existing = list.find((p) => p.id === id);
      if (!existing) throw new Error('Petak ukur tidak ditemukan.');

      const tanamanAwal: number =
        payload.tanamanAwal !== undefined
          ? Number(payload.tanamanAwal)
          : existing.tanamanAwal ?? 50;
      const tanamanHidup: number =
        payload.tanamanHidup !== undefined
          ? Number(payload.tanamanHidup)
          : existing.tanamanHidup ??
            Math.round(((payload.survivalRate || payload.persentaseHidup || existing.survivalRate || 0) / 100) * tanamanAwal);
      const { rate, category } = calculateSurvivalRate(tanamanHidup, tanamanAwal);
      const finalCategory = payload.kategori || category;
      const catInfo = getCategoryInfo(finalCategory);

      const puObj: PetakUkur = {
        ...existing,
        ...payload,
        tanamanAwal,
        tanamanHidup,
        survivalRate: payload.survivalRate !== undefined ? Number(payload.survivalRate) : rate,
        kategori: finalCategory,
        kebutuhanPenyulaman: Math.max(0, tanamanAwal - tanamanHidup),
        rekomendasi: payload.rekomendasi || catInfo.rekomendasiStandar,
        updatedAt: new Date().toISOString(),
      };

      saveLocalPUList(list.map((p) => (p.id === id ? puObj : p)));

      const notif: AppNotification = {
        id: `notif-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        type: category === 'hitam' ? 'alert' : category === 'merah' ? 'warning' : 'info',
        title: `Pembaruan Nilai: ${puObj.kodePU} (SR ${rate}%)`,
        message: `Perubahan data evaluasi tersimpan di ${puObj.blok}.`,
        petakUkurId: puObj.id,
        isRead: false,
      };

      const notifs = getLocalNotifs();
      saveLocalNotifs([notif, ...notifs]);

      updatedPu = puObj;
      updatedNotif = notif;
    }

    // Auto-sync to Google Sheet if connected (Webhook)
    if (GoogleSheetsBackend.isConnected() && updatedPu) {
      GoogleSheetsBackend.savePU(updatedPu).catch((e) => console.warn('Sync to Google Sheets Webhook failed:', e));
    }

    // Auto-sync to Direct Google Account Sheets
    const directToken = getAccessToken();
    const sheetId = getSavedSpreadsheetId();
    if (directToken && sheetId && updatedPu) {
      saveSinglePUToGoogleSheet(directToken, sheetId, updatedPu).catch((e) =>
        console.warn('Sync to Direct Google Sheet failed:', e)
      );
    }

    return { pu: updatedPu, notification: updatedNotif };
  }

  // Delete PU
  static async deletePetakUkur(id: string): Promise<void> {
    try {
      const res = await fetch(`/api/pu/${id}`, { method: 'DELETE' });
      if (res.ok) {
        if (GoogleSheetsBackend.isConnected()) {
          GoogleSheetsBackend.deletePU(id).catch(() => {});
        }
        return;
      }
    } catch {}

    const list = getLocalPUList();
    saveLocalPUList(list.filter((p) => p.id !== id));

    if (GoogleSheetsBackend.isConnected()) {
      GoogleSheetsBackend.deletePU(id).catch(() => {});
    }
  }

  // Bulk Delete multiple Petak Ukur (e.g. checked items or filtered list)
  static async bulkDeletePetakUkur(
    ids: string[]
  ): Promise<{ count: number; notification?: AppNotification }> {
    if (!ids || ids.length === 0) return { count: 0 };

    let deletedCount = ids.length;
    let notif: AppNotification | undefined = undefined;

    try {
      const res = await fetch('/api/pu/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      if (res.ok) {
        const json = await res.json();
        deletedCount = json.count ?? ids.length;
        notif = json.notification;
      }
    } catch {
      // server unavailable, proceed to local sync
    }

    const idSet = new Set(ids);
    const list = getLocalPUList();
    const filtered = list.filter((p) => !idSet.has(p.id));
    saveLocalPUList(filtered);

    if (!notif) {
      notif = {
        id: `notif-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        type: 'warning',
        title: `Hapus Massal (${deletedCount} PU)`,
        message: `Sebanyak ${deletedCount} data Petak Ukur berhasil dihapus dari sistem.`,
        isRead: false,
      };
      const notifs = getLocalNotifs();
      saveLocalNotifs([notif, ...notifs]);
    }

    return { count: deletedCount, notification: notif };
  }

  // Clear all Petak Ukur (Empty whole database)
  static async clearAllPetakUkur(): Promise<{ count: number; notification?: AppNotification }> {
    let deletedCount = 0;
    let notif: AppNotification | undefined = undefined;

    try {
      const res = await fetch('/api/pu/clear-all', { method: 'POST' });
      if (res.ok) {
        const json = await res.json();
        deletedCount = json.count ?? 0;
        notif = json.notification;
      }
    } catch {
      // fallback
    }

    const current = getLocalPUList();
    if (deletedCount === 0) deletedCount = current.length;
    saveLocalPUList([]);

    if (!notif) {
      notif = {
        id: `notif-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        type: 'warning',
        title: `Database PU Dikosongkan (${deletedCount} Titik)`,
        message: `Seluruh data Petak Ukur telah berhasil dikosongkan.`,
        isRead: false,
      };
      const notifs = getLocalNotifs();
      saveLocalNotifs([notif, ...notifs]);
    }

    return { count: deletedCount, notification: notif };
  }

  // Bulk import multiple Petak Ukur (e.g. from Excel / CSV)
  static async bulkImportPetakUkur(
    items: PetakUkur[],
    mode: 'replace' | 'merge' = 'merge'
  ): Promise<{ data: PetakUkur[]; count: number; notification?: AppNotification }> {
    let resultData: PetakUkur[] | null = null;
    let resultNotif: AppNotification | undefined = undefined;

    try {
      const res = await fetch('/api/pu/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, mode }),
      });
      if (res.ok) {
        const json = await res.json();
        resultData = json.data;
        resultNotif = json.notification;
        if (Array.isArray(resultData)) {
          saveLocalPUList(resultData);
        }
      }
    } catch {
      // server unavailable, fallback to local
    }

    if (!resultData) {
      if (mode === 'replace') {
        resultData = [...items];
      } else {
        const current = getLocalPUList();
        const existingCodes = new Set(current.map((p) => p.kodePU.toUpperCase()));
        const toAdd: PetakUkur[] = [];
        for (const it of items) {
          const code = (it.kodePU || '').toUpperCase();
          if (existingCodes.has(code)) {
            const idx = current.findIndex((p) => p.kodePU.toUpperCase() === code);
            if (idx !== -1) {
              current[idx] = { ...current[idx], ...it };
            }
          } else {
            toAdd.push(it);
          }
        }
        resultData = [...toAdd, ...current];
      }
      saveLocalPUList(resultData);

      const notif: AppNotification = {
        id: `notif-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        type: 'success',
        title: `Impor Excel Berhasil (${items.length} PU)`,
        message: `Database PU diperbarui sebanyak ${items.length} titik petak ukur.`,
        isRead: false,
      };
      const notifs = getLocalNotifs();
      saveLocalNotifs([notif, ...notifs]);
      resultNotif = notif;
    }

    return {
      data: resultData,
      count: items.length,
      notification: resultNotif,
    };
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
