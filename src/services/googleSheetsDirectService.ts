import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { PetakUkur } from '../types';

export const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
];

// Initialize Firebase App safely (singleton)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => provider.addScope(scope));
provider.setCustomParameters({ prompt: 'select_account' });

// In-memory token caching (MANDATORY: never in localStorage)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // When reloaded, if cachedAccessToken is not present in memory, user can click sign in
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Gagal mendapatkan token akses dari Google.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const logoutGoogle = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

// =========================================================================
// GOOGLE SHEETS & DRIVE API OPERATIONS (Direct with User Account)
// =========================================================================

const SPREADSHEET_TITLE = 'Peta Kinerja Rehabilitasi DAS (Database PU)';
const SHEET_TAB_NAME = 'Petak_Ukur';
const SUMMARY_TAB_NAME = 'Ringkasan_Eksekutif';
const DRIVE_FOLDER_NAME = 'Rehabilitasi DAS - Data & Peta Kinerja (BPDAS)';

const SPREADSHEET_ID_STORAGE_KEY = 'das_direct_gsheet_id_v1';
const SPREADSHEET_URL_STORAGE_KEY = 'das_direct_gsheet_url_v1';
const DRIVE_FOLDER_ID_STORAGE_KEY = 'das_direct_drive_folder_id_v1';
const DRIVE_FOLDER_URL_STORAGE_KEY = 'das_direct_drive_folder_url_v1';

export const getSavedSpreadsheetId = (): string | null => {
  return localStorage.getItem(SPREADSHEET_ID_STORAGE_KEY);
};

export const getSavedSpreadsheetUrl = (): string | null => {
  return localStorage.getItem(SPREADSHEET_URL_STORAGE_KEY);
};

export const setSavedSpreadsheet = (id: string, url: string) => {
  localStorage.setItem(SPREADSHEET_ID_STORAGE_KEY, id);
  localStorage.setItem(SPREADSHEET_URL_STORAGE_KEY, url);
};

export const clearSavedSpreadsheet = () => {
  localStorage.removeItem(SPREADSHEET_ID_STORAGE_KEY);
  localStorage.removeItem(SPREADSHEET_URL_STORAGE_KEY);
};

export const getSavedDriveFolderId = (): string | null => {
  return localStorage.getItem(DRIVE_FOLDER_ID_STORAGE_KEY);
};

export const getSavedDriveFolderUrl = (): string | null => {
  return localStorage.getItem(DRIVE_FOLDER_URL_STORAGE_KEY);
};

export const setSavedDriveFolder = (id: string, url: string) => {
  localStorage.setItem(DRIVE_FOLDER_ID_STORAGE_KEY, id);
  localStorage.setItem(DRIVE_FOLDER_URL_STORAGE_KEY, url);
};

export const clearSavedDriveFolder = () => {
  localStorage.removeItem(DRIVE_FOLDER_ID_STORAGE_KEY);
  localStorage.removeItem(DRIVE_FOLDER_URL_STORAGE_KEY);
};

export const SHEET_COLUMNS = [
  'ID',
  'Kode PU',
  'Sub DAS',
  'Blok',
  'Desa',
  'Kecamatan',
  'Latitude',
  'Longitude',
  'Luas (Ha)',
  'Jenis Tanaman',
  'Tanaman Awal',
  'Tanaman Hidup',
  'Tanaman Merana',
  'Survival Rate (%)',
  'Kategori',
  'Tinggi Rata-rata (cm)',
  'Tutupan Tajuk (%)',
  'Tahun Tanam',
  'Periode Evaluasi',
  'Kesehatan Tanaman',
  'Kebutuhan Penyulaman',
  'Rekomendasi',
  'Tanggal Evaluasi',
  'Evaluator',
  'Catatan',
  'Terakhir Diperbarui',
];

function puToRowValues(pu: PetakUkur): any[] {
  const jenis = Array.isArray(pu.jenisTanaman) ? pu.jenisTanaman.join(', ') : pu.jenisTanaman || '';
  return [
    pu.id,
    pu.kodePU,
    pu.subDas,
    pu.blok,
    pu.desa || '-',
    pu.kecamatan || '-',
    pu.latitude,
    pu.longitude,
    pu.luasHa,
    jenis,
    pu.tanamanAwal,
    pu.tanamanHidup,
    pu.tanamanMerana,
    pu.survivalRate,
    pu.kategori.toUpperCase(),
    pu.tinggiRataRataCm,
    pu.tutupanTajukPersen,
    pu.tahunTanam,
    pu.periodeEvaluasi,
    pu.kesehatanTanaman,
    pu.kebutuhanPenyulaman,
    pu.rekomendasi,
    pu.tanggalEvaluasi,
    pu.evaluator,
    pu.catatan || '',
    pu.updatedAt || new Date().toISOString(),
  ];
}

function rowValuesToPu(row: any[]): PetakUkur {
  const jenisStr = String(row[9] || '');
  const jenis = jenisStr.split(',').map((s) => s.trim()).filter(Boolean);

  return {
    id: String(row[0] || `pu-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`),
    kodePU: String(row[1] || 'PU-?'),
    subDas: String(row[2] || '-'),
    blok: String(row[3] || '-'),
    desa: String(row[4] || '-'),
    kecamatan: String(row[5] || '-'),
    latitude: Number(row[6]) || 0,
    longitude: Number(row[7]) || 0,
    luasHa: Number(row[8]) || 0.1,
    jenisTanaman: jenis.length > 0 ? jenis : ['Sengon'],
    tanamanAwal: Number(row[10]) || 0,
    tanamanHidup: Number(row[11]) || 0,
    tanamanMerana: Number(row[12]) || 0,
    survivalRate: Number(row[13]) || 0,
    kategori: (String(row[14] || 'hitam').toLowerCase() as any),
    tinggiRataRataCm: Number(row[15]) || 0,
    tutupanTajukPersen: Number(row[16]) || 0,
    tahunTanam: Number(row[17]) || 2024,
    periodeEvaluasi: (String(row[18] || 'P1 (Tahun 1)') as any),
    kesehatanTanaman: (String(row[19] || 'Cukup Sehat') as any),
    kebutuhanPenyulaman: Number(row[20]) || 0,
    rekomendasi: String(row[21] || '-'),
    tanggalEvaluasi: String(row[22] || new Date().toISOString().split('T')[0]),
    evaluator: String(row[23] || '-'),
    catatan: String(row[24] || ''),
    updatedAt: String(row[25] || new Date().toISOString()),
  };
}

/**
 * Find existing or create dedicated Folder in Google Drive for DAS Rehabilitation
 */
export const findOrCreateDriveFolder = async (
  token: string
): Promise<{ folderId: string; folderUrl: string; folderName: string; isNew: boolean }> => {
  const savedFolderId = getSavedDriveFolderId();
  if (savedFolderId) {
    try {
      const checkRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${savedFolderId}?fields=id,name,webViewLink,trashed`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (checkRes.ok) {
        const checkJson = await checkRes.json();
        if (!checkJson.trashed) {
          const folderUrl = checkJson.webViewLink || `https://drive.google.com/drive/folders/${checkJson.id}`;
          setSavedDriveFolder(checkJson.id, folderUrl);
          return {
            folderId: checkJson.id,
            folderUrl,
            folderName: checkJson.name || DRIVE_FOLDER_NAME,
            isNew: false,
          };
        }
      }
    } catch {
      // search
    }
  }

  // 1. Search in Drive
  const query = encodeURIComponent(
    `name = '${DRIVE_FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
  );
  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink)`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (searchRes.ok) {
    const searchData = await searchRes.json();
    if (searchData.files && searchData.files.length > 0) {
      const folder = searchData.files[0];
      const folderUrl = folder.webViewLink || `https://drive.google.com/drive/folders/${folder.id}`;
      setSavedDriveFolder(folder.id, folderUrl);
      return {
        folderId: folder.id,
        folderUrl,
        folderName: folder.name,
        isNew: false,
      };
    }
  }

  // 2. Create New Folder in Drive
  const createRes = await fetch(
    'https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: DRIVE_FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
        description: 'Folder resmi penyimpanan database Petak Ukur (PU) dan pemantauan kinerja Rehabilitasi DAS (BPDAS).',
      }),
    }
  );

  if (!createRes.ok) {
    const errJson = await createRes.json();
    throw new Error(errJson.error?.message || 'Gagal membuat folder di Google Drive.');
  }

  const newFolder = await createRes.json();
  const folderUrl = newFolder.webViewLink || `https://drive.google.com/drive/folders/${newFolder.id}`;
  setSavedDriveFolder(newFolder.id, folderUrl);

  return {
    folderId: newFolder.id,
    folderUrl,
    folderName: newFolder.name || DRIVE_FOLDER_NAME,
    isNew: true,
  };
};

/**
 * Move or attach a spreadsheet to a specific Google Drive folder
 */
export const moveSpreadsheetToFolder = async (
  token: string,
  spreadsheetId: string,
  folderId: string
): Promise<void> => {
  try {
    await fetch(
      `https://www.googleapis.com/drive/v3/files/${spreadsheetId}?addParents=${folderId}&fields=id,parents`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  } catch (err) {
    console.warn('Pemindahan file ke folder Drive dilewati:', err);
  }
};

/**
 * Find existing or create new Google Spreadsheet in the user's Google Drive
 */
export const findOrCreateSpreadsheet = async (
  token: string,
  targetFolderId?: string
): Promise<{ spreadsheetId: string; webViewLink: string; isNew: boolean }> => {
  // Ensure folder exists
  let folderId = targetFolderId || getSavedDriveFolderId();
  if (!folderId) {
    try {
      const folderInfo = await findOrCreateDriveFolder(token);
      folderId = folderInfo.folderId;
    } catch (e) {
      console.warn('Gagal menyiapkan folder Drive, membuat spreadsheet di root Drive:', e);
    }
  }

  // Check if saved ID still exists and is accessible
  const savedId = getSavedSpreadsheetId();
  if (savedId) {
    try {
      const checkRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${savedId}?fields=spreadsheetId,spreadsheetUrl`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (checkRes.ok) {
        const checkJson = await checkRes.json();
        const webViewLink = checkJson.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${checkJson.spreadsheetId}/edit`;
        
        // Ensure parent folder link if folder exists
        if (folderId) {
          await moveSpreadsheetToFolder(token, checkJson.spreadsheetId, folderId);
        }

        return {
          spreadsheetId: checkJson.spreadsheetId,
          webViewLink,
          isNew: false,
        };
      }
    } catch {
      // Ignore and search Drive
    }
  }

  // 1. Search in Drive
  const query = encodeURIComponent(
    `name = '${SPREADSHEET_TITLE}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`
  );
  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink,parents)`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (searchRes.ok) {
    const searchData = await searchRes.json();
    if (searchData.files && searchData.files.length > 0) {
      const file = searchData.files[0];
      setSavedSpreadsheet(file.id, file.webViewLink);
      
      if (folderId && (!file.parents || !file.parents.includes(folderId))) {
        await moveSpreadsheetToFolder(token, file.id, folderId);
      }

      return {
        spreadsheetId: file.id,
        webViewLink: file.webViewLink,
        isNew: false,
      };
    }
  }

  // 2. Create New Spreadsheet
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: SPREADSHEET_TITLE,
      },
      sheets: [
        {
          properties: {
            title: SHEET_TAB_NAME,
            gridProperties: {
              frozenRowCount: 1,
            },
          },
        },
      ],
    }),
  });

  if (!createRes.ok) {
    const errJson = await createRes.json();
    throw new Error(errJson.error?.message || 'Gagal membuat Google Spreadsheet baru.');
  }

  const newSheet = await createRes.json();
  const spreadsheetId = newSheet.spreadsheetId;
  const webViewLink = newSheet.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
  setSavedSpreadsheet(spreadsheetId, webViewLink);

  // If we have a folder, move into it
  if (folderId) {
    await moveSpreadsheetToFolder(token, spreadsheetId, folderId);
  }

  // Initialize Header row and formatting
  await initializeSheetHeader(token, spreadsheetId);

  return { spreadsheetId, webViewLink, isNew: true };
};

/**
 * Format header row with emerald background, white text, and auto column widths
 */
async function initializeSheetHeader(token: string, spreadsheetId: string) {
  // 1. Set Header values
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${SHEET_TAB_NAME}!A1:Z1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [SHEET_COLUMNS],
      }),
    }
  );

  // 2. Style Header (Dark Green #065F46, White bold font)
  try {
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              repeatCell: {
                range: {
                  sheetId: 0,
                  startRowIndex: 0,
                  endRowIndex: 1,
                  startColumnIndex: 0,
                  endColumnIndex: SHEET_COLUMNS.length,
                },
                cell: {
                  userEnteredFormat: {
                    backgroundColor: { red: 0.024, green: 0.373, blue: 0.275 }, // #065F46
                    textFormat: {
                      foregroundColor: { red: 1, green: 1, blue: 1 },
                      bold: true,
                      fontSize: 10,
                    },
                    horizontalAlignment: 'CENTER',
                  },
                },
                fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
              },
            },
            {
              autoResizeDimensions: {
                dimensions: {
                  sheetId: 0,
                  dimension: 'COLUMNS',
                  startIndex: 0,
                  endIndex: SHEET_COLUMNS.length,
                },
              },
            },
          ],
        }),
      }
    );
  } catch (e) {
    console.warn('Formatting header styling skipped:', e);
  }
}

/**
 * Read all PU records from the Google Sheet
 */
export const fetchPUsFromGoogleSheet = async (
  token: string,
  spreadsheetId: string
): Promise<PetakUkur[]> => {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${SHEET_TAB_NAME}!A2:Z`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) {
    throw new Error('Gagal membaca data dari Google Sheets.');
  }

  const json = await res.json();
  const rows: any[][] = json.values || [];
  return rows.filter((r) => r.length > 0 && r[0]).map(rowValuesToPu);
};

/**
 * Overwrite / Sync all PU records to Google Sheet and update Executive Summary tab
 */
export const syncAllPUsToGoogleSheet = async (
  token: string,
  spreadsheetId: string,
  puList: PetakUkur[]
): Promise<void> => {
  // 1. Clear existing rows starting from row 2
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${SHEET_TAB_NAME}!A2:Z:clear`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  // 2. Ensure header exists
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${SHEET_TAB_NAME}!A1:Z1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [SHEET_COLUMNS] }),
    }
  );

  if (puList.length > 0) {
    // 3. Write all rows to Petak_Ukur
    const rows = puList.map(puToRowValues);
    const writeRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${SHEET_TAB_NAME}!A2:Z${rows.length + 1}?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values: rows }),
      }
    );

    if (!writeRes.ok) {
      const err = await writeRes.json();
      throw new Error(err.error?.message || 'Gagal menulis data ke Google Sheets.');
    }
  }

  // 4. Update Ringkasan Eksekutif Tab
  try {
    await updateExecutiveSummarySheet(token, spreadsheetId, puList);
  } catch (summaryErr) {
    console.warn('Pembaruan lembar ringkasan eksekutif dilewati:', summaryErr);
  }
};

/**
 * Ensure Ringkasan_Eksekutif sheet exists and populate executive metrics
 */
export const updateExecutiveSummarySheet = async (
  token: string,
  spreadsheetId: string,
  puList: PetakUkur[]
): Promise<void> => {
  // 1. Check if summary tab exists
  const metaRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets(properties(sheetId,title))`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!metaRes.ok) return;

  const metaJson = await metaRes.json();
  const sheets = metaJson.sheets || [];
  let summarySheet = sheets.find(
    (s: any) => s.properties?.title === SUMMARY_TAB_NAME
  );

  if (!summarySheet) {
    // Add sheet tab
    const addRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              addSheet: {
                properties: {
                  title: SUMMARY_TAB_NAME,
                  gridProperties: {
                    rowCount: 60,
                    columnCount: 10,
                    frozenRowCount: 2,
                  },
                  tabColor: { red: 0.024, green: 0.373, blue: 0.275 },
                },
              },
            },
          ],
        }),
      }
    );

    if (addRes.ok) {
      const addJson = await addRes.json();
      summarySheet = addJson.replies?.[0]?.addSheet;
    }
  }

  // 2. Calculate summary statistics
  const totalPU = puList.length;
  const totalAwal = puList.reduce((acc, p) => acc + (p.tanamanAwal || 0), 0);
  const totalHidup = puList.reduce((acc, p) => acc + (p.tanamanHidup || 0), 0);
  const totalMerana = puList.reduce((acc, p) => acc + (p.tanamanMerana || 0), 0);
  const totalSulam = puList.reduce((acc, p) => acc + (p.kebutuhanPenyulaman || 0), 0);
  const totalLuas = puList.reduce((acc, p) => acc + (p.luasHa || 0), 0);
  const avgSR = totalPU > 0 ? puList.reduce((acc, p) => acc + (p.survivalRate || 0), 0) / totalPU : 0;

  const countHijau = puList.filter((p) => p.kategori === 'hijau').length;
  const countKuning = puList.filter((p) => p.kategori === 'kuning').length;
  const countMerah = puList.filter((p) => p.kategori === 'merah').length;
  const countHitam = puList.filter((p) => p.kategori === 'hitam').length;

  // Sub-DAS Grouping
  const subDasMap: Record<string, { count: number; hidup: number; srSum: number; sulam: number }> = {};
  puList.forEach((p) => {
    const s = p.subDas || 'Lainnya';
    if (!subDasMap[s]) {
      subDasMap[s] = { count: 0, hidup: 0, srSum: 0, sulam: 0 };
    }
    subDasMap[s].count += 1;
    subDasMap[s].hidup += p.tanamanHidup || 0;
    subDasMap[s].srSum += p.survivalRate || 0;
    subDasMap[s].sulam += p.kebutuhanPenyulaman || 0;
  });

  const subDasRows = Object.entries(subDasMap).map(([name, stat]) => [
    name,
    stat.count,
    stat.hidup,
    (stat.srSum / stat.count).toFixed(1) + '%',
    stat.sulam,
  ]);

  const summaryValues: any[][] = [
    ['LAPORAN REKAPITULASI KINERJA REHABILITASI DAERAH ALIRAN SUNGAI (DAS)'],
    [`Database Resmi Petak Ukur (PU) - BPDAS | Terakhir Disinkronkan: ${new Date().toLocaleString('id-ID')}`],
    [],
    ['=== INDIKATOR KINERJA UTAMA (IKU) KEHUTANAN ===', '', '', ''],
    ['Parameter', 'Nilai', 'Satuan', 'Keterangan Teknis'],
    ['Total Petak Ukur (PU)', totalPU, 'Titik PU', 'Titik sensus permanen terpantau di lapangan'],
    ['Total Tanaman Awal', totalAwal, 'Batang', 'Target populasi penanaman awal'],
    ['Total Tanaman Hidup', totalHidup, 'Batang', 'Populasi tanaman sehat & lulus tumbuh'],
    ['Total Tanaman Merana', totalMerana, 'Batang', 'Tanaman kerdil/merana memerlukan tindakan'],
    ['Rata-rata Survival Rate (SR)', `${avgSR.toFixed(2)}%`, 'Persen (%)', 'Persentase keberhasilan tumbuh rata-rata'],
    ['Total Kebutuhan Penyulaman', totalSulam, 'Bibit', 'Alokasi bibit sulaman tahun pemeliharaan'],
    ['Total Luas Terpantau', `${totalLuas.toFixed(2)} Ha`, 'Hektar', 'Kumulatif luas sampel intensif'],
    [],
    ['=== DISTRIBUSI KELAS KINERJA (STANDAR BPDAS) ===', '', '', ''],
    ['Kategori Warna', 'Kriteria Persentase Hidup', 'Jumlah PU', 'Proporsi (%)', 'Rekomendasi Tindakan'],
    ['HIJAU (Berhasil)', '> 80.0%', countHijau, totalPU ? `${((countHijau / totalPU) * 100).toFixed(1)}%` : '0%', 'Pertahankan & Lanjutkan Pemeliharaan'],
    ['KUNING (Cukup)', '75.0% - 80.0%', countKuning, totalPU ? `${((countKuning / totalPU) * 100).toFixed(1)}%` : '0%', 'Lakukan Penyulaman Terarah'],
    ['MERAH (Kurang)', '40.0% - <75.0%', countMerah, totalPU ? `${((countMerah / totalPU) * 100).toFixed(1)}%` : '0%', 'Penyulaman Intensif & Penyiangan Gulma'],
    ['HITAM (Kritis/Puso)', '< 40.0%', countHitam, totalPU ? `${((countHitam / totalPU) * 100).toFixed(1)}%` : '0%', 'Evaluasi Khusus & Penanaman Ulang'],
    [],
    ['=== REKAPITULASI KINERJA PER SUB-DAS ===', '', '', ''],
    ['Nama Sub-DAS', 'Jumlah PU', 'Total Tanaman Hidup', 'Rata-rata SR (%)', 'Kebutuhan Penyulaman'],
    ...subDasRows,
    [],
    ['Sumber Data:', 'Peta Kinerja & Pemantauan Spasial Rehabilitasi DAS'],
    ['Penanggung Jawab:', 'Tim Monitoring & Evaluasi Lapangan (BPDAS)'],
  ];

  // 3. Clear existing summary rows
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${SUMMARY_TAB_NAME}!A1:E50:clear`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  // 4. Write summary data
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${SUMMARY_TAB_NAME}!A1:E${summaryValues.length}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: summaryValues }),
    }
  );
};

/**
 * High-level one-click initialization of both Google Drive Folder & Real Google Sheets Data
 */
export const initializeRealGoogleDriveAndSheets = async (
  token: string,
  puList: PetakUkur[]
): Promise<{
  folderId: string;
  folderUrl: string;
  folderName: string;
  spreadsheetId: string;
  spreadsheetUrl: string;
  puCount: number;
  timestamp: string;
}> => {
  // 1. Ensure folder exists in Drive
  const folderInfo = await findOrCreateDriveFolder(token);

  // 2. Ensure spreadsheet exists and is moved into that folder
  const sheetInfo = await findOrCreateSpreadsheet(token, folderInfo.folderId);

  // 3. Overwrite & populate all real PU data and Executive Summary
  await syncAllPUsToGoogleSheet(token, sheetInfo.spreadsheetId, puList);

  return {
    folderId: folderInfo.folderId,
    folderUrl: folderInfo.folderUrl,
    folderName: folderInfo.folderName,
    spreadsheetId: sheetInfo.spreadsheetId,
    spreadsheetUrl: sheetInfo.webViewLink,
    puCount: puList.length,
    timestamp: new Date().toLocaleString('id-ID'),
  };
};

/**
 * Append or update single PU in Google Sheet
 */
export const saveSinglePUToGoogleSheet = async (
  token: string,
  spreadsheetId: string,
  pu: PetakUkur
): Promise<void> => {
  // 1. Read existing rows to check if PU exists
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${SHEET_TAB_NAME}!A2:B`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) return;

  const json = await res.json();
  const rows: any[][] = json.values || [];
  let rowIndex = -1;

  for (let i = 0; i < rows.length; i++) {
    const rowId = rows[i][0];
    const rowKode = rows[i][1];
    if (rowId === pu.id || rowKode === pu.kodePU) {
      rowIndex = i + 2; // 1-indexed and header is row 1
      break;
    }
  }

  const values = [puToRowValues(pu)];

  if (rowIndex > 0) {
    // Update existing row
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${SHEET_TAB_NAME}!A${rowIndex}:Z${rowIndex}?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values }),
      }
    );
  } else {
    // Append new row
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${SHEET_TAB_NAME}!A:Z:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values }),
      }
    );
  }
};
