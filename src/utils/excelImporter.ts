import * as XLSX from 'xlsx';
import { PetakUkur, SurvivalCategory } from '../types';
import { parseAnyCoordinate, latLonToUtm } from './utmHelper';
import { calculateSurvivalRate, getCategoryInfo } from './survivalHelper';

export interface ImportPreviewResult {
  fileName: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  data: PetakUkur[];
  warnings: string[];
  columnsFound: string[];
}

/**
 * Normalizes header keys (removes spaces, lowercases, strips special characters)
 */
function normalizeKey(key: string): string {
  return String(key || '')
    .toLowerCase()
    .replace(/[._\-/\s()]/g, '');
}

/**
 * Parses date from Excel value (handles Date object, serial number, or string)
 */
function parseExcelDate(val: any): string {
  if (!val) return new Date().toISOString().split('T')[0];

  if (val instanceof Date && !isNaN(val.getTime())) {
    return val.toISOString().split('T')[0];
  }

  // If numeric Excel serial date, e.g. 46028
  if (typeof val === 'number') {
    try {
      const parsed = XLSX.SSF.parse_date_code(val);
      if (parsed) {
        const y = parsed.y;
        const m = String(parsed.m).padStart(2, '0');
        const d = String(parsed.d).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
    } catch {
      // ignore
    }
  }

  const str = String(val).trim();
  // e.g. 06-01-26 or 06/01/2026 or 06-01-2026 (DD-MM-YY or DD-MM-YYYY)
  const ddmmyyMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
  if (ddmmyyMatch) {
    const day = ddmmyyMatch[1].padStart(2, '0');
    const month = ddmmyyMatch[2].padStart(2, '0');
    let year = ddmmyyMatch[3];
    if (year.length === 2) {
      year = parseInt(year, 10) > 50 ? `19${year}` : `20${year}`;
    }
    return `${year}-${month}-${day}`;
  }

  // e.g. 2026-01-06
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  return str;
}

/**
 * Parses survival rate percentage number
 */
function parsePercentage(val: any): number {
  if (val === undefined || val === null || val === '') return 80;
  if (typeof val === 'number') {
    // If entered as decimal fraction, e.g. 0.85 instead of 85
    if (val > 0 && val <= 1) return Number((val * 100).toFixed(2));
    return Number(val.toFixed(2));
  }
  const clean = String(val).replace(/[%,\s]/g, (match) => (match === ',' ? '.' : ''));
  const num = parseFloat(clean);
  if (isNaN(num)) return 80;
  if (num > 0 && num <= 1) return Number((num * 100).toFixed(2));
  return Number(num.toFixed(2));
}

/**
 * Determines Kategori based on string or survival rate
 */
function determineCategory(catStr: any, rate: number): SurvivalCategory {
  if (catStr) {
    const s = String(catStr).toLowerCase();
    if (s.includes('hijau') || s.includes('baik')) return 'hijau';
    if (s.includes('kuning') || s.includes('sedang')) return 'kuning';
    if (s.includes('merah') || s.includes('kurang') || s.includes('rusak')) return 'merah';
    if (s.includes('hitam') || s.includes('kritis') || s.includes('sangat')) return 'hitam';
  }

  if (rate > 80) return 'hijau';
  if (rate >= 75) return 'kuning';
  if (rate > 40) return 'merah';
  return 'hitam';
}

/**
 * Splits comma/semicolon/and separated species names
 */
function parseSpeciesList(val: any): string[] {
  if (!val) return ['Sengon', 'Mahoni'];
  if (Array.isArray(val)) return val;
  const str = String(val).trim();
  if (!str || str === '-') return ['Tanaman Hutan RHL'];
  return str
    .split(/[,;/+&]| dan /i)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Parse an Excel or CSV file buffer into structured PetakUkur[]
 */
export async function parseExcelDatabaseFile(file: File): Promise<ImportPreviewResult> {
  const dataBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(dataBuffer, { type: 'array', cellDates: true });

  // Use the first sheet or find sheet named 'PU Database' / 'DATABASE PU'
  let sheetName = workbook.SheetNames[0];
  const matchedSheet = workbook.SheetNames.find(
    (name) => name.toLowerCase().includes('pu') || name.toLowerCase().includes('database')
  );
  if (matchedSheet) {
    sheetName = matchedSheet;
  }

  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    throw new Error('Tidak ada sheet data yang ditemukan dalam file Excel.');
  }

  // Convert to JSON array of objects
  const rawRows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  if (!rawRows || rawRows.length === 0) {
    throw new Error('File Excel tidak memiliki baris data (kosong).');
  }

  const columnsFound = Object.keys(rawRows[0] || {});
  const puList: PetakUkur[] = [];
  const warnings: string[] = [];

  rawRows.forEach((row, idx) => {
    // Map column keys flexibly
    const normalizedRow: Record<string, any> = {};
    for (const key of Object.keys(row)) {
      normalizedRow[normalizeKey(key)] = row[key];
    }

    // 1. Kode PU
    const rawNoPu =
      normalizedRow['nopu'] ||
      normalizedRow['kodepu'] ||
      normalizedRow['pu'] ||
      normalizedRow['nomorpu'] ||
      normalizedRow['no'] ||
      `PU-${idx + 1}`;

    const kodePUStr = String(rawNoPu).trim();
    const kodePU = kodePUStr.toUpperCase().startsWith('PU')
      ? kodePUStr.toUpperCase()
      : `PU-${kodePUStr}`;

    // 2. Persentase Hidup
    const rawRate =
      normalizedRow['persentasihidup'] ||
      normalizedRow['persentasehidup'] ||
      normalizedRow['survivalrate'] ||
      normalizedRow['sr'] ||
      normalizedRow['persen'] ||
      80;
    const survivalRate = parsePercentage(rawRate);

    // 3. Kategori
    const rawCat =
      normalizedRow['column2'] ||
      normalizedRow['kategori'] ||
      normalizedRow['status'] ||
      '';
    const kategori = determineCategory(rawCat, survivalRate);

    // 4. Tanggal
    const rawDate =
      normalizedRow['tanggal'] ||
      normalizedRow['tanggalsurvei'] ||
      normalizedRow['tanggalevaluasi'] ||
      normalizedRow['tanggalpengambilandata'];
    const tanggalEvaluasi = parseExcelDate(rawDate);

    // 5. DAS
    const rawDas =
      normalizedRow['das'] ||
      normalizedRow['subdas'] ||
      normalizedRow['daerahaliransungai'] ||
      'DAS Citarum';
    const das = String(rawDas).trim().startsWith('DAS') || String(rawDas).trim().startsWith('Sub-DAS')
      ? String(rawDas).trim()
      : `DAS ${rawDas}`;

    // 6. Blok
    const rawBlok = normalizedRow['blok'] || `Blok-${idx + 1}`;
    const blok = String(rawBlok).trim();

    // 7. Petak
    const rawPetak = normalizedRow['petak'] || normalizedRow['nomorpetak'] || '';
    const petak = rawPetak ? (String(rawPetak).toLowerCase().startsWith('petak') ? String(rawPetak).trim() : `Petak ${rawPetak}`) : 'Petak 01';

    // 8. Lokasi
    const rawLokasi = normalizedRow['lokasi'] || normalizedRow['desa'] || normalizedRow['daerah'] || blok;
    const lokasiDaerah = String(rawLokasi).trim();

    // 9. Koordinat (UTM or Lat/Lon)
    const rawCoord =
      normalizedRow['koordinat'] ||
      normalizedRow['titikkoordinat'] ||
      normalizedRow['titikkoordinatutm'] ||
      normalizedRow['utm'] ||
      '';

    let latitude = -7.15 + (idx % 20) * 0.005;
    let longitude = 107.65 + (idx % 20) * 0.005;
    let koordinatUtm = '';
    let utmZone = '48S';
    let utmEasting = 795400;
    let utmNorthing = 9208500;

    if (rawCoord) {
      const parsedCoord = parseAnyCoordinate(rawCoord);
      if (parsedCoord) {
        latitude = parsedCoord.latitude;
        longitude = parsedCoord.longitude;
        koordinatUtm = parsedCoord.formattedUtm;
        utmZone = parsedCoord.utmZone;
        utmEasting = parsedCoord.utmEasting;
        utmNorthing = parsedCoord.utmNorthing;
      } else {
        warnings.push(`Baris ${idx + 2} (${kodePU}): Koordinat '${rawCoord}' disesuaikan.`);
        const fallbackUtm = latLonToUtm(latitude, longitude);
        koordinatUtm = fallbackUtm.formatted;
        utmZone = `${fallbackUtm.zone}${fallbackUtm.hemisphere}`;
        utmEasting = fallbackUtm.easting;
        utmNorthing = fallbackUtm.northing;
      }
    } else {
      const fallbackUtm = latLonToUtm(latitude, longitude);
      koordinatUtm = fallbackUtm.formatted;
      utmZone = `${fallbackUtm.zone}${fallbackUtm.hemisphere}`;
      utmEasting = fallbackUtm.easting;
      utmNorthing = fallbackUtm.northing;
    }

    // 10. Tahun Tanam
    const rawThnTanam = normalizedRow['tahuntanam'] || normalizedRow['tanam'] || 2025;
    let tahunTanam = 2025;
    if (typeof rawThnTanam === 'number') {
      tahunTanam = rawThnTanam;
    } else {
      const yrMatch = String(rawThnTanam).match(/\b(20\d{2})\b/);
      if (yrMatch) tahunTanam = parseInt(yrMatch[1], 10);
    }

    // 11. Jarak Tanam
    const rawJarak = normalizedRow['jaraktanam'] || normalizedRow['jarak'] || '3 x 3 m';
    const jarakTanam = String(rawJarak).trim();

    // 12. Jenis Tanaman
    const rawJenis =
      normalizedRow['jenistanaman'] ||
      normalizedRow['komoditas'] ||
      normalizedRow['spesies'] ||
      'Sengon, Mahoni';
    const jenisTanaman = parseSpeciesList(rawJenis);

    // 13. Suhu
    const rawSuhu = normalizedRow['suhu'] || normalizedRow['suhulingkungan'] || '28°C';
    const suhuLingkungan = String(rawSuhu).includes('°') ? String(rawSuhu).trim() : `${rawSuhu}°C`;

    // 14. Kelembaban Udara
    const rawKelembaban =
      normalizedRow['kelembabanudara'] ||
      normalizedRow['kelembaban'] ||
      normalizedRow['kelembabanpersen'] ||
      '75%';
    const kelembabanUdara = String(rawKelembaban).includes('%') ? String(rawKelembaban).trim() : `${rawKelembaban}%`;

    // 15. Jenis Tanah
    const rawTanah = normalizedRow['jenistanah'] || normalizedRow['tanah'] || 'Gembur';
    const jenisTanah = String(rawTanah).trim();

    // 16. pH Tanah
    const rawPh = normalizedRow['phtanah'] || normalizedRow['ph'] || 6.0;
    const pHTanah = typeof rawPh === 'number' ? rawPh : parseFloat(String(rawPh).replace(',', '.')) || 6.0;

    // 17. Kemiringan Lahan
    const rawKemiringan = normalizedRow['kemiringan'] || normalizedRow['kemiringanlahan'] || 'Landai (8-15%)';
    const kemiringanLahan = String(rawKemiringan).trim();

    // 18. Pengawas Operasional
    const rawPengawas =
      normalizedRow['pengawasoperasional'] ||
      normalizedRow['pengawas'] ||
      normalizedRow['pengawaslapangan'] ||
      'Tim Pengawas Operasional Lapangan';
    const pengawasOperasional = String(rawPengawas).trim();

    // 19. Assessor
    const rawAssessor =
      normalizedRow['assessor'] ||
      normalizedRow['evaluator'] ||
      normalizedRow['petugas'] ||
      normalizedRow['surveyor'] ||
      'Tim Assessor GIS & Evaluasi DAS';
    const assessor = String(rawAssessor).trim();

    // 20. Catatan Tambahan
    const rawCatatan =
      normalizedRow['catatan'] ||
      normalizedRow['catatantambahan'] ||
      normalizedRow['keterangan'] ||
      'Data diimpor dari file Excel Database PU.';
    const catatanTambahan = String(rawCatatan).trim();

    // Calculate plant numbers for compatibility
    const tanamanAwal = 50;
    const tanamanHidup = Math.round((survivalRate / 100) * tanamanAwal);
    const kebutuhanPenyulaman = Math.max(0, tanamanAwal - tanamanHidup);
    const catInfo = getCategoryInfo(kategori);

    const item: PetakUkur = {
      id: `pu-xls-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      tanggalEvaluasi,
      tanggalPengambilanData: tanggalEvaluasi,
      kodePU,
      periodeEvaluasi: 'P1 (Tahun 1)',
      subDas: das,
      das,
      blok,
      petak,
      lokasiDaerah,
      desa: lokasiDaerah,
      kecamatan: lokasiDaerah,
      latitude,
      longitude,
      koordinatUtm,
      utmZone,
      utmEasting,
      utmNorthing,
      tahunTanam,
      kategori,
      pengawasOperasional,
      survivalRate,
      persentaseHidup: survivalRate,
      jarakTanam,
      jenisTanaman,
      suhuLingkungan,
      kelembabanUdara,
      jenisTanah,
      pHTanah,
      kemiringanLahan,
      evaluator: assessor,
      assessor,
      catatan: catatanTambahan,
      catatanTambahan,

      // Compatibility fields
      luasHa: 0.1,
      tanamanAwal,
      tanamanHidup,
      tanamanMerana: 0,
      tinggiRataRataCm: 150,
      tutupanTajukPersen: Math.min(100, Math.round(survivalRate * 0.6)),
      kesehatanTanaman:
        survivalRate >= 80 ? 'Baik & Sehat' : survivalRate >= 75 ? 'Cukup Sehat' : 'Kering/Merana',
      kebutuhanPenyulaman,
      rekomendasi:
        survivalRate >= 75
          ? 'Pertahankan pemeliharaan intensif dan perlindungan tanaman.'
          : 'Segera laksanakan penyulaman bibit dan pembersihan gulma.',
      updatedAt: new Date().toISOString(),
    };

    puList.push(item);
  });

  return {
    fileName: file.name,
    totalRows: rawRows.length,
    validRows: puList.length,
    invalidRows: 0,
    data: puList,
    warnings,
    columnsFound,
  };
}

/**
 * Generates an Excel template with the exact 21 columns
 */
export function generateExcelTemplate(): void {
  const sampleHeaders = [
    'No.',
    'No. PU',
    'Persentasi Hidup',
    'Column2',
    'Tanggal',
    'DAS',
    'Blok',
    'Petak',
    'Lokasi',
    'Koordinat',
    'Tahun Tanam',
    'Jarak Tanam',
    'Jenis Tanaman',
    'Suhu',
    'Kelembaban Udara',
    'Jenis Tanah',
    'PH Tanah',
    'Kemiringan',
    'Pengawas Operasional',
    'Assessor',
    'Catatan Tambahan',
  ];

  const sampleRows = [
    [
      1,
      '480',
      95.54,
      'Hijau',
      '06-01-26',
      '7',
      'Belangian II',
      '8',
      'Belangian',
      '50M 275294 9598293',
      2025,
      '3 x 3',
      'Mente, Mahoni',
      30,
      73.5,
      'Gembur',
      4.7,
      26,
      'Ir. Bambang S.',
      'Tim Assessor GIS',
      'Kondisi tegakan sangat baik',
    ],
    [
      2,
      '447',
      85.71,
      'Hijau',
      '07-01-26',
      '7',
      'Belangian Tanjung',
      '7',
      'Desa Belangian, Kec. Aranio',
      '-3.63733047 114.9622084',
      2025,
      '3 x 3',
      'Mente, Mahoni',
      29.5,
      75.0,
      'Latosol',
      5.8,
      24,
      'Ir. Bambang S.',
      'Tim Assessor GIS',
      'Pertumbuhan seragam',
    ],
    [
      3,
      '10',
      71.56,
      'Merah',
      '07-01-26',
      '3',
      'Agrabinta',
      'Sinarlaur',
      'Jawa Barat',
      '48M 705581 9177828',
      2025,
      '3 x 3',
      'Cemara Udang',
      30,
      72.0,
      'Regosol',
      6.0,
      15,
      'Drs. Haryanto',
      'Tim Assessor GIS',
      'Perlu penyulaman bibit sulam',
    ],
  ];

  const ws = XLSX.utils.aoa_to_sheet([sampleHeaders, ...sampleRows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'PU Database');
  XLSX.writeFile(wb, 'Format_Import_Database_PU.xlsx');
}
