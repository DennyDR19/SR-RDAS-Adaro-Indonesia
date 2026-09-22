import { PetakUkur, AppNotification } from '../types';
import { PETAK_UKUR_2026 } from './pu2026Data';

export const INITIAL_PETAK_UKUR: PetakUkur[] = PETAK_UKUR_2026;

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    timestamp: '2026-09-18 09:00',
    type: 'info',
    title: 'Database PU Tahun 2026 Berhasil Dimuat',
    message: 'Sebanyak 437 data Petak Ukur (PU) evaluasi rehabilitasi DAS tahun 2026 berhasil diintegrasikan ke sistem pemantauan.',
    isRead: false,
  },
  {
    id: 'notif-2',
    timestamp: '2026-09-17 14:30',
    type: 'alert',
    title: 'Perhatian: Petak Ukur Kategori Hitam & Merah Terdeteksi',
    message: 'Terdapat sejumlah petak ukur dengan survival rate di bawah standar evaluasi (≤40% dan 40-75%) yang memerlukan jadwal penyulaman bibit intensif.',
    isRead: false,
  },
  {
    id: 'notif-3',
    timestamp: '2026-09-16 11:15',
    type: 'success',
    title: 'Capaian Kategori Hijau Optimal (>80%)',
    message: 'Mayoritas petak ukur di wilayah rehabilitasi menunjukkan pertumbuhan tajuk dan persentase hidup melampaui batas standar keberhasilan tanaman.',
    isRead: false,
  },
  {
    id: 'notif-4',
    timestamp: '2026-09-15 10:00',
    type: 'info',
    title: 'Sinkronisasi Lapangan Multi-Wilayah Terhubung',
    message: 'Data sebaran koordinat UTM & geografis untuk seluruh blok rehabilitasi (DAS 7, DAS 9, DAS 3, DAS 4, DAS RT1, DAS 1) siap dianalisis.',
    isRead: true,
  },
];
