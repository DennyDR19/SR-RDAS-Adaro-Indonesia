import { PetakUkur } from '../types';

export const GSHEET_STORAGE_KEY = 'das_gsheet_backend_url_v1';
export const GSHEET_LAST_SYNC_KEY = 'das_gsheet_last_sync_v1';

export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * =========================================================================
 * BACKEND GOOGLE SHEETS UNTUK APLIKASI EVALUASI REHABILITASI DAS
 * Sesuai Standar Perdirjen BPDAS - Penilaian Survival Rate Petak Ukur (PU)
 * =========================================================================
 * 
 * PANDUAN PEMASANGAN (HANYA 1 MENIT):
 * 1. Buat Spreadsheet baru di Google Sheets (sheets.new)
 * 2. Klik menu "Ekstensi" (Extensions) -> "Apps Script"
 * 3. Hapus semua kode yang ada di editor, lalu TEMPELKAN seluruh kode ini
 * 4. Klik tombol "Deploy" (di kanan atas) -> "New deployment"
 * 5. Klik ikon gerigi (Select type) -> pilih "Web app"
 * 6. Atur:
 *    - Description: "Backend Rehabilitasi DAS"
 *    - Execute as: "Me" (email Anda)
 *    - Who has access: "Anyone" (Siapa saja)
 * 7. Klik "Deploy", izinkan hak akses (Review Permissions -> Lanjutkan)
 * 8. Salin "Web App URL" yang diberikan, lalu masukkan ke aplikasi!
 */

const SHEET_NAME = "Database_Petak_Ukur";

const HEADERS = [
  "ID",
  "Kode PU",
  "Sub DAS",
  "Blok",
  "Desa",
  "Kecamatan",
  "Latitude",
  "Longitude",
  "Luas (Ha)",
  "Jenis Tanaman",
  "Tanaman Awal",
  "Tanaman Hidup",
  "Tanaman Merana",
  "Survival Rate (%)",
  "Kategori",
  "Tinggi Rata-rata (cm)",
  "Tutupan Tajuk (%)",
  "Tahun Tanam",
  "Periode Evaluasi",
  "Kesehatan Tanaman",
  "Kebutuhan Penyulaman",
  "Rekomendasi",
  "Tanggal Evaluasi",
  "Evaluator",
  "Catatan",
  "Terakhir Diperbarui"
];

function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    
    // Format Header Baris 1
    const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
    headerRange.setBackground("#065F46"); // Emerald gelap
    headerRange.setFontColor("#FFFFFF");
    headerRange.setFontWeight("bold");
    headerRange.setHorizontalAlignment("center");
    sheet.setFrozenRows(1);
    
    // Auto-fit kolom
    for (let i = 1; i <= HEADERS.length; i++) {
      sheet.autoResizeColumn(i);
    }
  }
  return sheet;
}

function puToRow(pu) {
  const jenis = Array.isArray(pu.jenisTanaman) ? pu.jenisTanaman.join(", ") : (pu.jenisTanaman || "");
  return [
    pu.id || "pu-" + new Date().getTime(),
    pu.kodePU || "-",
    pu.subDas || "-",
    pu.blok || "-",
    pu.desa || "-",
    pu.kecamatan || "-",
    pu.latitude || 0,
    pu.longitude || 0,
    pu.luasHa || 0.1,
    jenis,
    pu.tanamanAwal || 0,
    pu.tanamanHidup || 0,
    pu.tanamanMerana || 0,
    pu.survivalRate || 0,
    pu.kategori || "-",
    pu.tinggiRataRataCm || 0,
    pu.tutupanTajukPersen || 0,
    pu.tahunTanam || 2024,
    pu.periodeEvaluasi || "P1",
    pu.kesehatanTanaman || "-",
    pu.kebutuhanPenyulaman || 0,
    pu.rekomendasi || "-",
    pu.tanggalEvaluasi || new Date().toISOString().split("T")[0],
    pu.evaluator || "-",
    pu.catatan || "",
    pu.updatedAt || new Date().toISOString()
  ];
}

function rowToPu(row) {
  const jenisStr = String(row[9] || "");
  const jenisArray = jenisStr.split(",").map(function(s) { return s.trim(); }).filter(Boolean);

  return {
    id: String(row[0] || ""),
    kodePU: String(row[1] || ""),
    subDas: String(row[2] || ""),
    blok: String(row[3] || ""),
    desa: String(row[4] || ""),
    kecamatan: String(row[5] || ""),
    latitude: Number(row[6]) || 0,
    longitude: Number(row[7]) || 0,
    luasHa: Number(row[8]) || 0.1,
    jenisTanaman: jenisArray.length > 0 ? jenisArray : ["Sengon"],
    tanamanAwal: Number(row[10]) || 0,
    tanamanHidup: Number(row[11]) || 0,
    tanamanMerana: Number(row[12]) || 0,
    survivalRate: Number(row[13]) || 0,
    kategori: String(row[14] || "hitam").toLowerCase(),
    tinggiRataRataCm: Number(row[15]) || 0,
    tutupanTajukPersen: Number(row[16]) || 0,
    tahunTanam: Number(row[17]) || 2024,
    periodeEvaluasi: String(row[18] || "P1"),
    kesehatanTanaman: String(row[19] || "-"),
    kebutuhanPenyulaman: Number(row[20]) || 0,
    rekomendasi: String(row[21] || ""),
    tanggalEvaluasi: String(row[22] || ""),
    evaluator: String(row[23] || ""),
    catatan: String(row[24] || ""),
    updatedAt: String(row[25] || new Date().toISOString())
  };
}

// Endpoint GET: Mengambil seluruh data Petak Ukur (PU)
function doGet(e) {
  try {
    const sheet = getOrCreateSheet();
    const values = sheet.getDataRange().getValues();
    
    const result = [];
    if (values.length > 1) {
      for (let i = 1; i < values.length; i++) {
        if (values[i][0]) { // jika ID tidak kosong
          result.push(rowToPu(values[i]));
        }
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      total: result.length,
      data: result,
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Endpoint POST: Simpan, Sinkronkan, atau Hapus Data Petak Ukur (PU)
function doPost(e) {
  try {
    const sheet = getOrCreateSheet();
    const contents = e.postData ? e.postData.contents : "{}";
    const payload = JSON.parse(contents);
    const action = payload.action || "save_single";

    // 1. SINKRONISASI MASSAL SELURUH DATA
    if (action === "sync_all" && Array.isArray(payload.list)) {
      const currentRows = sheet.getDataRange().getValues();
      if (currentRows.length > 1) {
        sheet.deleteRows(2, currentRows.length - 1);
      }
      
      if (payload.list.length > 0) {
        const newRows = payload.list.map(puToRow);
        sheet.getRange(2, 1, newRows.length, HEADERS.length).setValues(newRows);
      }

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "Berhasil sinkronisasi " + payload.list.length + " data ke Google Sheet.",
        total: payload.list.length
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 2. SIMPAN / UPDATE 1 DATA PETAK UKUR
    if (action === "save_single" && payload.pu) {
      const pu = payload.pu;
      const values = sheet.getDataRange().getValues();
      let rowIndex = -1;
      
      // Cari baris berdasarkan ID atau Kode PU
      for (let i = 1; i < values.length; i++) {
        if (String(values[i][0]) === String(pu.id) || String(values[i][1]) === String(pu.kodePU)) {
          rowIndex = i + 1;
          break;
        }
      }
      
      const newRow = puToRow(pu);
      if (rowIndex > 0) {
        sheet.getRange(rowIndex, 1, 1, HEADERS.length).setValues([newRow]);
      } else {
        sheet.appendRow(newRow);
      }

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "Data " + pu.kodePU + " berhasil tersimpan di Google Sheet.",
        data: pu
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 3. HAPUS DATA
    if (action === "delete" && payload.id) {
      const values = sheet.getDataRange().getValues();
      for (let i = 1; i < values.length; i++) {
        if (String(values[i][0]) === String(payload.id)) {
          sheet.deleteRow(i + 1);
          break;
        }
      }
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "Data berhasil dihapus dari Google Sheet."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: "Aksi tidak dikenal: " + action
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
`;

export class GoogleSheetsBackend {
  static getUrl(): string | null {
    const url = localStorage.getItem(GSHEET_STORAGE_KEY);
    return url && url.trim() ? url.trim() : null;
  }

  static setUrl(url: string | null): void {
    if (!url || !url.trim()) {
      localStorage.removeItem(GSHEET_STORAGE_KEY);
      localStorage.removeItem(GSHEET_LAST_SYNC_KEY);
    } else {
      localStorage.setItem(GSHEET_STORAGE_KEY, url.trim());
    }
  }

  static getLastSync(): string | null {
    return localStorage.getItem(GSHEET_LAST_SYNC_KEY);
  }

  static setLastSync(timeString?: string): void {
    localStorage.setItem(
      GSHEET_LAST_SYNC_KEY,
      timeString || new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
    );
  }

  static isConnected(): boolean {
    const url = this.getUrl();
    return !!(url && url.startsWith('https://script.google.com/'));
  }

  // Uji koneksi ke Web App Google Sheets
  static async testConnection(url: string): Promise<{ success: boolean; message: string; rowCount?: number }> {
    try {
      const cleanUrl = url.trim();
      if (!cleanUrl.startsWith('https://script.google.com/')) {
        return {
          success: false,
          message: 'URL harus diawali dengan https://script.google.com/macros/s/...',
        };
      }

      const res = await fetch(cleanUrl, {
        method: 'GET',
        redirect: 'follow',
      });

      if (!res.ok) {
        return {
          success: false,
          message: `Server merespon dengan status HTTP ${res.status}`,
        };
      }

      const data = await res.json();
      if (data.status === 'success') {
        return {
          success: true,
          message: `Koneksi berhasil! Ditemukan ${data.total || 0} baris data di Google Sheet.`,
          rowCount: data.total || 0,
        };
      } else {
        return {
          success: false,
          message: data.message || 'Respon Google Sheet tidak sesuai.',
        };
      }
    } catch (err: any) {
      return {
        success: false,
        message: `Gagal menghubungi Google Sheet: ${err.message || 'Periksa koneksi atau izin Web App.'}`,
      };
    }
  }

  // Ambil data langsung dari Google Sheet
  static async fetchFromSheet(): Promise<PetakUkur[] | null> {
    const url = this.getUrl();
    if (!url) return null;

    try {
      const res = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
      });
      if (res.ok) {
        const json = await res.json();
        if (json.status === 'success' && Array.isArray(json.data)) {
          this.setLastSync();
          return json.data;
        }
      }
    } catch (err) {
      console.warn('Gagal memuat dari Google Sheets:', err);
    }
    return null;
  }

  // Simpan / update 1 Petak Ukur ke Google Sheet
  static async savePU(pu: PetakUkur): Promise<boolean> {
    const url = this.getUrl();
    if (!url) return false;

    try {
      // Use text/plain to avoid preflight CORS restrictions on Google Apps Script
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'save_single',
          pu,
        }),
        redirect: 'follow',
      });
      this.setLastSync();
      return true;
    } catch (err) {
      console.warn('Gagal mengirim PU ke Google Sheets:', err);
      return false;
    }
  }

  // Hapus data dari Google Sheet
  static async deletePU(id: string): Promise<boolean> {
    const url = this.getUrl();
    if (!url) return false;

    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'delete',
          id,
        }),
        redirect: 'follow',
      });
      this.setLastSync();
      return true;
    } catch (err) {
      console.warn('Gagal menghapus dari Google Sheets:', err);
      return false;
    }
  }

  // Sinkronisasi massal seluruh Petak Ukur ke Google Sheet
  static async syncAllToSheet(list: PetakUkur[]): Promise<{ success: boolean; message: string }> {
    const url = this.getUrl();
    if (!url) {
      return { success: false, message: 'URL Google Sheet belum dikonfigurasi.' };
    }

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'sync_all',
          list,
        }),
        redirect: 'follow',
      });

      const json = await res.json();
      if (json.status === 'success') {
        this.setLastSync();
        return {
          success: true,
          message: json.message || `Berhasil menyinkronkan ${list.length} data ke Google Sheet.`,
        };
      } else {
        return { success: false, message: json.message || 'Gagal menyimpan ke Google Sheet.' };
      }
    } catch (err: any) {
      return { success: false, message: err.message || 'Gagal terhubung ke Google Sheet.' };
    }
  }
}
