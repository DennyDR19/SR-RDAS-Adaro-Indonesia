import { PetakUkur, PuFilterCriteria, DEFAULT_PU_FILTER } from '../types';

/**
 * Normalizes Jarak Tanam string for consistent grouping
 * e.g., '3X3 m', '3x3 m', '3 x 3 m' -> '3 x 3 m'
 */
export function normalizeJarakTanam(val?: string): string {
  if (!val) return '';
  const clean = val.toLowerCase().replace(/\s+/g, '');
  if (clean.startsWith('3x3')) return '3 x 3 m';
  if (clean.startsWith('5x5')) return '5 x 5 m';
  if (clean.startsWith('2x3')) return '2 x 3 m';
  if (clean.startsWith('4x4')) return '4 x 4 m';
  return val.trim();
}

/**
 * Extracts numeric value from string (e.g. '28.5°C' -> 28.5, '85%' -> 85)
 */
export function parseNumericVal(val?: string | number): number | null {
  if (val === undefined || val === null || val === '') return null;
  if (typeof val === 'number') return isNaN(val) ? null : val;
  const match = val.replace(',', '.').match(/[-+]?[0-9]*\.?[0-9]+/);
  if (!match) return null;
  const num = parseFloat(match[0]);
  return isNaN(num) ? null : num;
}

/**
 * Checks whether any filter criteria is active (different from 'all' / empty)
 */
export function countActiveFilters(filters: PuFilterCriteria): number {
  let count = 0;
  const keys: (keyof PuFilterCriteria)[] = [
    'das',
    'blok',
    'petak',
    'periodeEvaluasi',
    'lokasiDaerah',
    'titikKoordinatUtm',
    'tahunTanam',
    'kategori',
    'pengawasOperasional',
    'persentaseHidup',
    'jarakTanam',
    'jenisTanaman',
    'suhuLingkungan',
    'kelembabanUdara',
    'jenisTanah',
    'pHTanah',
  ];

  for (const k of keys) {
    if (filters[k] && filters[k] !== 'all') {
      count++;
    }
  }
  if (filters.searchQuery && filters.searchQuery.trim() !== '') {
    count++;
  }
  return count;
}

/**
 * Filters petak ukur array against user criteria
 */
export function filterPetakUkurList(
  puList: PetakUkur[],
  filters: PuFilterCriteria
): PetakUkur[] {
  return puList.filter((pu) => {
    // 1. DAS
    if (filters.das !== 'all') {
      const dasVal = pu.das || pu.subDas || '';
      if (dasVal.toLowerCase() !== filters.das.toLowerCase()) return false;
    }

    // 2. Blok
    if (filters.blok !== 'all') {
      if ((pu.blok || '').toLowerCase() !== filters.blok.toLowerCase()) return false;
    }

    // 3. Petak
    if (filters.petak !== 'all') {
      if ((pu.petak || '').toLowerCase() !== filters.petak.toLowerCase()) return false;
    }

    // 4. Periode Evaluasi
    if (filters.periodeEvaluasi !== 'all') {
      if ((pu.periodeEvaluasi || '').toLowerCase() !== filters.periodeEvaluasi.toLowerCase()) return false;
    }

    // 5. Lokasi Daerah
    if (filters.lokasiDaerah !== 'all') {
      const loc = (pu.lokasiDaerah || pu.desa || pu.kecamatan || '').toLowerCase();
      if (!loc.includes(filters.lokasiDaerah.toLowerCase())) return false;
    }

    // 6. Titik Koordinat (UTM)
    if (filters.titikKoordinatUtm !== 'all') {
      const target = filters.titikKoordinatUtm.toLowerCase();
      const zone = (pu.utmZone || '').toLowerCase();
      const coord = (pu.koordinatUtm || '').toLowerCase();
      if (!zone.includes(target) && !coord.includes(target)) {
        return false;
      }
    }

    // 7. Tahun Tanam
    if (filters.tahunTanam !== 'all') {
      if (String(pu.tahunTanam) !== filters.tahunTanam) return false;
    }

    // 8. Kategori
    if (filters.kategori !== 'all') {
      if (pu.kategori.toLowerCase() !== filters.kategori.toLowerCase()) return false;
    }

    // 9. Pengawas Operasional Lapangan
    if (filters.pengawasOperasional !== 'all') {
      const p = (pu.pengawasOperasional || pu.evaluator || '').toLowerCase();
      if (p !== filters.pengawasOperasional.toLowerCase()) return false;
    }

    // 10. Persentase Hidup Tanaman
    if (filters.persentaseHidup !== 'all') {
      const sr = pu.survivalRate;
      if (filters.persentaseHidup === '>80') {
        if (!(sr > 80)) return false;
      } else if (filters.persentaseHidup === '75-80') {
        if (!(sr >= 75 && sr <= 80)) return false;
      } else if (filters.persentaseHidup === '40-75') {
        if (!(sr > 40 && sr < 75)) return false;
      } else if (filters.persentaseHidup === '<=40') {
        if (!(sr <= 40)) return false;
      } else {
        // Direct value match if specified
        const num = parseFloat(filters.persentaseHidup);
        if (!isNaN(num) && Math.abs(sr - num) > 0.5) return false;
      }
    }

    // 11. Jarak Tanam
    if (filters.jarakTanam !== 'all') {
      const norm = normalizeJarakTanam(pu.jarakTanam);
      if (norm.toLowerCase() !== filters.jarakTanam.toLowerCase()) return false;
    }

    // 12. Jenis Tanaman
    if (filters.jenisTanaman !== 'all') {
      const targetPlant = filters.jenisTanaman.toLowerCase();
      const hasPlant = (pu.jenisTanaman || []).some((j) =>
        j.toLowerCase().includes(targetPlant)
      );
      if (!hasPlant) return false;
    }

    // 13. Suhu Lingkungan
    if (filters.suhuLingkungan !== 'all') {
      const temp = parseNumericVal(pu.suhuLingkungan);
      if (filters.suhuLingkungan === '<28') {
        if (temp === null || temp >= 28) return false;
      } else if (filters.suhuLingkungan === '28-30') {
        if (temp === null || temp < 28 || temp > 30) return false;
      } else if (filters.suhuLingkungan === '>30') {
        if (temp === null || temp <= 30) return false;
      } else {
        if (String(pu.suhuLingkungan || '').trim() !== filters.suhuLingkungan) return false;
      }
    }

    // 14. Kelembaban Udara
    if (filters.kelembabanUdara !== 'all') {
      const hum = parseNumericVal(pu.kelembabanUdara);
      if (filters.kelembabanUdara === '<70') {
        if (hum === null || hum >= 70) return false;
      } else if (filters.kelembabanUdara === '70-80') {
        if (hum === null || hum < 70 || hum > 80) return false;
      } else if (filters.kelembabanUdara === '>80') {
        if (hum === null || hum <= 80) return false;
      } else {
        if (String(pu.kelembabanUdara || '').trim() !== filters.kelembabanUdara) return false;
      }
    }

    // 15. Jenis Tanah
    if (filters.jenisTanah !== 'all') {
      if ((pu.jenisTanah || '').toLowerCase() !== filters.jenisTanah.toLowerCase()) return false;
    }

    // 16. pH Tanah
    if (filters.pHTanah !== 'all') {
      const ph = parseNumericVal(pu.pHTanah);
      if (filters.pHTanah === '<5') {
        if (ph === null || ph >= 5.0) return false;
      } else if (filters.pHTanah === '5-6') {
        if (ph === null || ph < 5.0 || ph > 6.0) return false;
      } else if (filters.pHTanah === '6-7') {
        if (ph === null || ph < 6.0 || ph > 7.0) return false;
      } else if (filters.pHTanah === '>7') {
        if (ph === null || ph <= 7.0) return false;
      } else {
        if (String(pu.pHTanah || '').trim() !== filters.pHTanah) return false;
      }
    }

    // Free Text Search
    if (filters.searchQuery && filters.searchQuery.trim() !== '') {
      const q = filters.searchQuery.toLowerCase().trim();
      const match =
        pu.kodePU.toLowerCase().includes(q) ||
        pu.blok.toLowerCase().includes(q) ||
        (pu.petak || '').toLowerCase().includes(q) ||
        (pu.das || pu.subDas || '').toLowerCase().includes(q) ||
        (pu.lokasiDaerah || pu.desa || '').toLowerCase().includes(q) ||
        (pu.pengawasOperasional || pu.evaluator || '').toLowerCase().includes(q) ||
        (pu.koordinatUtm || '').toLowerCase().includes(q) ||
        (pu.jenisTanaman || []).some((j) => j.toLowerCase().includes(q));
      if (!match) return false;
    }

    return true;
  });
}

/**
 * Computes unique option lists and counts for each of the 16 filter dimensions
 */
export function extractFilterOptions(puList: PetakUkur[]) {
  const dasMap = new Map<string, number>();
  const blokMap = new Map<string, number>();
  const petakMap = new Map<string, number>();
  const periodeMap = new Map<string, number>();
  const lokasiMap = new Map<string, number>();
  const utmMap = new Map<string, number>();
  const tahunMap = new Map<string, number>();
  const kategoriMap = new Map<string, number>();
  const pengawasMap = new Map<string, number>();
  const jarakMap = new Map<string, number>();
  const tanamanMap = new Map<string, number>();
  const tanahMap = new Map<string, number>();

  for (const p of puList) {
    // DAS
    const das = p.das || p.subDas;
    if (das) dasMap.set(das, (dasMap.get(das) || 0) + 1);

    // Blok
    if (p.blok) blokMap.set(p.blok, (blokMap.get(p.blok) || 0) + 1);

    // Petak
    if (p.petak) petakMap.set(p.petak, (petakMap.get(p.petak) || 0) + 1);

    // Periode
    if (p.periodeEvaluasi) periodeMap.set(p.periodeEvaluasi, (periodeMap.get(p.periodeEvaluasi) || 0) + 1);

    // Lokasi
    const loc = p.lokasiDaerah || p.desa;
    if (loc) lokasiMap.set(loc, (lokasiMap.get(loc) || 0) + 1);

    // UTM Zone
    const utm = p.utmZone || (p.koordinatUtm ? p.koordinatUtm.split(' ')[0] : undefined);
    if (utm) utmMap.set(utm, (utmMap.get(utm) || 0) + 1);

    // Tahun Tanam
    if (p.tahunTanam) {
      const y = String(p.tahunTanam);
      tahunMap.set(y, (tahunMap.get(y) || 0) + 1);
    }

    // Kategori
    if (p.kategori) kategoriMap.set(p.kategori, (kategoriMap.get(p.kategori) || 0) + 1);

    // Pengawas
    const pgw = p.pengawasOperasional || p.evaluator;
    if (pgw) pengawasMap.set(pgw, (pengawasMap.get(pgw) || 0) + 1);

    // Jarak Tanam
    const jrk = normalizeJarakTanam(p.jarakTanam);
    if (jrk) jarakMap.set(jrk, (jarakMap.get(jrk) || 0) + 1);

    // Tanaman
    if (p.jenisTanaman) {
      for (const t of p.jenisTanaman) {
        const cleanT = t.trim();
        if (cleanT) tanamanMap.set(cleanT, (tanamanMap.get(cleanT) || 0) + 1);
      }
    }

    // Tanah
    if (p.jenisTanah) tanahMap.set(p.jenisTanah, (tanahMap.get(p.jenisTanah) || 0) + 1);
  }

  const sortMapByCountOrName = (map: Map<string, number>, byAlpha = true) => {
    return Array.from(map.entries())
      .sort((a, b) => (byAlpha ? a[0].localeCompare(b[0]) : b[1] - a[1]))
      .map(([value, count]) => ({ value, count }));
  };

  return {
    dasOptions: sortMapByCountOrName(dasMap, true),
    blokOptions: sortMapByCountOrName(blokMap, true),
    petakOptions: sortMapByCountOrName(petakMap, true),
    periodeOptions: sortMapByCountOrName(periodeMap, true),
    lokasiOptions: sortMapByCountOrName(lokasiMap, true),
    utmOptions: sortMapByCountOrName(utmMap, true),
    tahunOptions: sortMapByCountOrName(tahunMap, false),
    kategoriOptions: [
      { value: 'hijau', label: 'Hijau (>80% - Sangat Baik)', count: kategoriMap.get('hijau') || 0 },
      { value: 'kuning', label: 'Kuning (75-80% - Standar)', count: kategoriMap.get('kuning') || 0 },
      { value: 'merah', label: 'Merah (>40-<75% - Perlu Sulam)', count: kategoriMap.get('merah') || 0 },
      { value: 'hitam', label: 'Hitam (0-40% - Kritis)', count: kategoriMap.get('hitam') || 0 },
    ],
    pengawasOptions: sortMapByCountOrName(pengawasMap, true),
    persentaseHidupOptions: [
      { value: '>80', label: '> 80% (Sangat Baik / Hijau)' },
      { value: '75-80', label: '75% - 80% (Standar / Kuning)' },
      { value: '40-75', label: '> 40% - < 75% (Perlu Sulam / Merah)' },
      { value: '<=40', label: '0% - 40% (Kritis / Hitam)' },
    ],
    jarakTanamOptions: sortMapByCountOrName(jarakMap, true),
    tanamanOptions: sortMapByCountOrName(tanamanMap, true),
    suhuOptions: [
      { value: '<28', label: '< 28°C (Sejuk / Pegunungan)' },
      { value: '28-30', label: '28°C - 30°C (Normal / Optimal)' },
      { value: '>30', label: '> 30°C (Hangat / Dataran Rendah)' },
    ],
    kelembabanOptions: [
      { value: '<70', label: '< 70% (Kering)' },
      { value: '70-80', label: '70% - 80% (Sedang / Normal)' },
      { value: '>80', label: '> 80% (Tinggi / Lembab)' },
    ],
    tanahOptions: sortMapByCountOrName(tanahMap, true),
    phOptions: [
      { value: '<5', label: '< 5.0 (Sangat Masam)' },
      { value: '5-6', label: '5.0 - 6.0 (Masam)' },
      { value: '6-7', label: '6.0 - 7.0 (Agak Masam / Netral)' },
      { value: '>7', label: '> 7.0 (Alkali / Basa)' },
    ],
  };
}
