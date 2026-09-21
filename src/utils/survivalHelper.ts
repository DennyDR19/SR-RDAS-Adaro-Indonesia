import { SurvivalCategory, PetakUkur } from '../types';

export interface CategoryInfo {
  category: SurvivalCategory;
  name: string;
  rangeLabel: string;
  colorHex: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  markerBorderColor: string;
  statusKinerja: string;
  rekomendasiStandar: string;
  deskripsi: string;
}

export const CATEGORY_INFO_MAP: Record<SurvivalCategory, CategoryInfo> = {
  hitam: {
    category: 'hitam',
    name: 'Kritis / Sangat Kurang',
    rangeLabel: '0 - 40%',
    colorHex: '#18181b', // Hitam / Black Slate
    badgeBg: 'bg-zinc-950/80',
    badgeBorder: 'border-zinc-700',
    badgeText: 'text-zinc-200',
    markerBorderColor: '#52525b',
    statusKinerja: 'Gagal / Kritis',
    rekomendasiStandar: 'Wajib Re-evaluasi menyeluruh dan Penyulaman Total (100%) dengan perbaikan media tanam & drainase.',
    deskripsi: 'Persentase kelangsungan hidup sangat rendah. Memerlukan penanaman ulang bibit baru secara penuh.',
  },
  merah: {
    category: 'merah',
    name: 'Kurang / Di Bawah Standar',
    rangeLabel: '>40 - <75%',
    colorHex: '#ef4444', // Merah
    badgeBg: 'bg-red-950/80',
    badgeBorder: 'border-red-600',
    badgeText: 'text-red-400',
    markerBorderColor: '#b91c1c',
    statusKinerja: 'Kurang Berhasil',
    rekomendasiStandar: 'Penyulaman intensif bibit pengganti, penyiangan gulma pengganggu, dan penambahan pupuk organik.',
    deskripsi: 'Survival rate di bawah target teknis rehabilitasi DAS (<75%). Diperlukan penyulaman segera.',
  },
  kuning: {
    category: 'kuning',
    name: 'Sedang / Ambang Minimal',
    rangeLabel: '75 - 80%',
    colorHex: '#eab308', // Kuning / Amber
    badgeBg: 'bg-amber-950/80',
    badgeBorder: 'border-amber-500',
    badgeText: 'text-amber-300',
    markerBorderColor: '#ca8a04',
    statusKinerja: 'Cukup / Memenuhi Standar Minimal',
    rekomendasiStandar: 'Penyulaman ringan pada titik mati, pembersihan piringan tanaman, dan pencegahan hama/ternak.',
    deskripsi: 'Memenuhi ambang batas minimal keberhasilan, perlu pemeliharaan agar tidak turun ke zona merah.',
  },
  hijau: {
    category: 'hijau',
    name: 'Baik / Sangat Berhasil',
    rangeLabel: '>80%',
    colorHex: '#22c55e', // Hijau
    badgeBg: 'bg-emerald-950/80',
    badgeBorder: 'border-emerald-500',
    badgeText: 'text-emerald-300',
    markerBorderColor: '#15803d',
    statusKinerja: 'Sangat Baik / Berhasil',
    rekomendasiStandar: 'Pemeliharaan tahunan lanjutan, perlindungan kebakaran hutan, dan monitoring tutupan kanopi.',
    deskripsi: 'Tingkat keberhasilan prima melampaui target nasional rehabilitasi DAS (>80%). Sangat memuaskan.',
  },
};

/**
 * Menghitung dan mengelompokkan Survival Rate sesuai instruksi pengguna:
 * - 0 - 40% berwarna hitam
 * - >40 - <75% berwarna merah
 * - 75 - 80% berwarna kuning
 * - >80% berwarna hijau
 */
export function calculateSurvivalRate(tanamanHidup: number, tanamanAwal: number): {
  rate: number;
  category: SurvivalCategory;
} {
  if (tanamanAwal <= 0) {
    return { rate: 0, category: 'hitam' };
  }
  const rawRate = (tanamanHidup / tanamanAwal) * 100;
  const rate = Math.round(rawRate * 10) / 10; // 1 decimal place

  if (rate <= 40) {
    return { rate, category: 'hitam' };
  } else if (rate < 75) {
    return { rate, category: 'merah' };
  } else if (rate <= 80) {
    return { rate, category: 'kuning' };
  } else {
    return { rate, category: 'hijau' };
  }
}

export function getCategoryInfo(category: SurvivalCategory): CategoryInfo {
  return CATEGORY_INFO_MAP[category] || CATEGORY_INFO_MAP.hitam;
}

export function computeDasMetrics(puList: PetakUkur[]) {
  const totalPU = puList.length;
  if (totalPU === 0) {
    return {
      totalPU: 0,
      rataRataSurvivalRate: 0,
      totalPohonAwal: 0,
      totalPohonHidup: 0,
      totalKebutuhanSulam: 0,
      persentaseLulusStandar: 0,
      countByKategori: { hitam: 0, merah: 0, kuning: 0, hijau: 0 },
      distribusiSubDas: [],
    };
  }

  let totalAwal = 0;
  let totalHidup = 0;
  let totalSulam = 0;
  let totalSRSum = 0;
  let countLulus = 0;

  const countByKategori = { hitam: 0, merah: 0, kuning: 0, hijau: 0 };
  const subDasMap: Record<string, { count: number; sumSR: number; hidup: number; awal: number }> = {};

  puList.forEach((pu) => {
    const awal = pu.tanamanAwal || 50;
    const hidup =
      pu.tanamanHidup !== undefined
        ? pu.tanamanHidup
        : Math.round(((pu.survivalRate || 0) / 100) * awal);
    const sulam =
      pu.kebutuhanPenyulaman !== undefined
        ? pu.kebutuhanPenyulaman
        : Math.max(0, awal - hidup);
    const sr = pu.persentaseHidup !== undefined ? pu.persentaseHidup : pu.survivalRate || 0;
    const sDas = pu.das || pu.subDas || 'Sub-DAS Citarum';

    totalAwal += awal;
    totalHidup += hidup;
    totalSulam += sulam;
    totalSRSum += sr;
    countByKategori[pu.kategori]++;

    if (sr >= 75) {
      countLulus++;
    }

    if (!subDasMap[sDas]) {
      subDasMap[sDas] = { count: 0, sumSR: 0, hidup: 0, awal: 0 };
    }
    subDasMap[sDas].count++;
    subDasMap[sDas].sumSR += sr;
    subDasMap[sDas].hidup += hidup;
    subDasMap[sDas].awal += awal;
  });

  const distribusiSubDas = Object.keys(subDasMap).map((subDas) => {
    const data = subDasMap[subDas];
    return {
      subDas,
      totalPU: data.count,
      rataRataSR: Math.round((data.sumSR / data.count) * 10) / 10,
      pohonHidup: data.hidup,
      pohonAwal: data.awal,
    };
  });

  return {
    totalPU,
    rataRataSurvivalRate: Math.round((totalSRSum / totalPU) * 10) / 10,
    totalPohonAwal: totalAwal,
    totalPohonHidup: totalHidup,
    totalKebutuhanSulam: totalSulam,
    persentaseLulusStandar: Math.round((countLulus / totalPU) * 100),
    countByKategori,
    distribusiSubDas,
  };
}
