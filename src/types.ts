export type SurvivalCategory = 'hitam' | 'merah' | 'kuning' | 'hijau';

export interface PetakUkur {
  id: string;
  kodePU: string; // misal PU-01, PU-02
  subDas: string; // misal Sub-DAS Citarum Hulu, Sub-DAS Cikapundung
  blok: string; // misal Blok Pasir Bintang
  desa: string; // misal Desa Cibeureum
  kecamatan: string;
  latitude: number;
  longitude: number;
  luasHa: number; // misal 0.1 Ha
  jenisTanaman: string[]; // misal ['Sengon', 'Mahoni', 'Alpukat']
  tanamanAwal: number; // Jumlah pohon awal ditanam
  tanamanHidup: number; // Jumlah pohon hidup
  tanamanMerana: number; // Jumlah pohon sakit/merana
  survivalRate: number; // (tanamanHidup / tanamanAwal) * 100
  kategori: SurvivalCategory;
  tinggiRataRataCm: number; // Tinggi rata-rata tanaman dalam cm
  tutupanTajukPersen: number; // Persentase tutupan tajuk
  tahunTanam: number;
  periodeEvaluasi: 'P0 (Tanam Awal)' | 'P1 (Tahun 1)' | 'P2 (Tahun 2)' | 'P3 (Penyerahan)';
  kesehatanTanaman: 'Baik & Sehat' | 'Cukup Sehat' | 'Terserang Hama/Gulma' | 'Kering/Merana';
  kebutuhanPenyulaman: number; // Jumlah bibit yang perlu disulam
  rekomendasi: string;
  tanggalEvaluasi: string; // YYYY-MM-DD
  evaluator: string; // Petugas/Tim
  catatan?: string;
  fotoUrl?: string;
  updatedAt: string;
}

export interface AppNotification {
  id: string;
  timestamp: string;
  type: 'alert' | 'success' | 'info' | 'warning';
  title: string;
  message: string;
  petakUkurId?: string;
  isRead: boolean;
}

export interface DasSummaryMetrics {
  totalPU: number;
  rataRataSurvivalRate: number;
  totalPohonAwal: number;
  totalPohonHidup: number;
  totalKebutuhanSulam: number;
  persentaseLulusStandar: number; // Persentase PU dengan SR >= 75%
  countByKategori: {
    hitam: number; // 0-40%
    merah: number; // >40-<75%
    kuning: number; // 75-80%
    hijau: number; // >80%
  };
  distribusiSubDas: {
    subDas: string;
    totalPU: number;
    rataRataSR: number;
    pohonHidup: number;
    pohonAwal: number;
  }[];
}
