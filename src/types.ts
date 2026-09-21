export type SurvivalCategory = 'hitam' | 'merah' | 'kuning' | 'hijau';

export interface PetakUkur {
  id: string;
  // 1. Tanggal pengambilan data
  tanggalEvaluasi: string; // YYYY-MM-DD
  tanggalPengambilanData?: string; // alias
  // 2. Kode Nomor Petak Ukur
  kodePU: string; // misal PU-01, PU-02
  // 3. Periode Evaluasi
  periodeEvaluasi: 'P0 (Tanam Awal)' | 'P1 (Tahun 1)' | 'P2 (Tahun 2)' | 'P3 (Penyerahan)' | string;
  // 4. DAS
  subDas: string; // misal Sub-DAS Citarum Hulu, Sub-DAS Cikapundung
  das?: string; // alias
  // 5. Blok
  blok: string; // misal Blok Pasir Bintang
  // 6. Petak
  petak?: string; // misal Petak 12, Petak 04B
  // 7. Lokasi Daerah
  lokasiDaerah?: string; // misal Desa Sukaluyu, Pangalengan
  desa?: string;
  kecamatan?: string;
  // 8. Titik Koordinat (UTM) & Geographic
  latitude: number;
  longitude: number;
  koordinatUtm?: string; // e.g. 48S X: 795400 Y: 9208500
  utmZone?: string;
  utmEasting?: number;
  utmNorthing?: number;
  // 9. Tahun Tanam
  tahunTanam: number;
  // 10. Kategori
  kategori: SurvivalCategory;
  // 11. Pengawas Operasional Lapangan
  pengawasOperasional?: string;
  // 12. Persentase Hidup Tanaman
  survivalRate: number; // (tanamanHidup / tanamanAwal) * 100
  persentaseHidup?: number; // alias
  // 13. Jarak Tanam
  jarakTanam?: string; // misal 3 x 3 m, 2 x 3 m
  // 14. Jenis Tanaman
  jenisTanaman: string[]; // misal ['Sengon', 'Mahoni', 'Alpukat']
  // 15. Suhu Lingkungan
  suhuLingkungan?: string | number; // misal 24°C atau 24
  // 16. Kelembaban Udara
  kelembabanUdara?: string | number; // misal 78%
  // 17. Jenis Tanah
  jenisTanah?: string; // misal Andosol, Latosol
  // 18. pH Tanah
  pHTanah?: number | string; // misal 6.2
  // 19. Kemiringan Lahan
  kemiringanLahan?: string; // misal Curam (25-45%), Landai (8-15%)
  // 20. Assessor
  evaluator: string; // Petugas/Tim/Assessor
  assessor?: string; // alias
  // 21. Catatan Tambahan
  catatan?: string;
  catatanTambahan?: string; // alias

  // Optional legacy fields for backward compatibility
  luasHa?: number;
  tanamanAwal?: number;
  tanamanHidup?: number;
  tanamanMerana?: number;
  tinggiRataRataCm?: number;
  tutupanTajukPersen?: number;
  kesehatanTanaman?: 'Baik & Sehat' | 'Cukup Sehat' | 'Terserang Hama/Gulma' | 'Kering/Merana' | string;
  kebutuhanPenyulaman?: number;
  rekomendasi?: string;
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

export interface CustomBoundary {
  id: string;
  name: string;
  fileName: string;
  fileType: 'shp' | 'kml' | 'kmz' | 'geojson';
  color: string;
  fillColor: string;
  fillOpacity: number;
  weight: number;
  dashArray?: string;
  visible: boolean;
  featureCount: number;
  uploadedAt: string;
  data: any; // GeoJSON FeatureCollection
}
