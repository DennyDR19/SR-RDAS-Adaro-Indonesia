# Product Requirement Document (PRD)
## Sistem Informasi Geografis & Monitoring Evaluasi Rehabilitasi Daerah Aliran Sungai (DAS)
**PT Adaro Indonesia**

---

### 1. Ringkasan Eksekutif (Executive Summary)

**Sistem Informasi Geografis (SIG) Pemantauan Kinerja Petak Ukur (PU) Rehabilitasi DAS PT Adaro Indonesia** adalah platform web geospasial dan analitik modern yang dirancang khusus untuk memonitor, mengevaluasi, dan melaporkan keberhasilan tanaman rehabilitasi DAS secara presisi, terukur, dan berbasis standar regulasi Kementerian Lingkungan Hidup dan Kehutanan (Permen LHK).

Aplikasi ini mengintegrasikan pemetaan interaktif Leaflet GIS (dengan citra satelit resolusi tinggi, mode layar penuh, dan dukungan batas area SHP/KML), dasbor analitik kinerja adaptif, filter multi-dimensi 16 parameter, sinkronisasi data real-time via Server-Sent Events (SSE), integrasi Google Sheets & Excel, serta generator laporan resmi PDF berstandar korporat.

---

### 2. Tujuan & Sasaran Produk (Product Goals & Objectives)

1. **Pemantauan Kepatuhan Regulasi (Compliance Monitoring)**
   Memastikan evaluasi survival rate (persentase hidup tanaman) memenuhi ambang batas minimum kelulusan keberhasilan tanaman (≥75%) sesuai standar KLHK.
2. **Visibilitas Spasial Terintegrasi (Spatial Visibility)**
   Menyediakan visualisasi geospasial interaktif 437 titik Petak Ukur (PU) di berbagai Sub-DAS (DAS 1, DAS 3, DAS 4, DAS 7, DAS 9, DAS RT1) dengan layer satelit, jalan, dan topografi serta batas konsesi (SHP/KML).
3. **Analisis Berbasis Wilayah & Karakteristik Tapak (Granular Area Analytics)**
   Memungkinkan pengawas dan manajer lingkungan untuk menganalisis performa baik pada skala makro (seluruh area konsesi) maupun mikro (per Sub-DAS, blok, petak, jenis tanaman, elevasi, dan karakteristik tanah).
4. **Perencanaan Intervensi Silvikultur Tepat Sasaran (Targeted Silviculture Intervention)**
   Menghitung secara presisi kebutuhan penyulaman (bibit sulam) pada petak berkategori Hitam (0–40%) dan Merah (>40–74%) guna meminimalkan kerugian investasi rehabilitasi.
5. **Pelaporan & Kolaborasi Cepat (Rapid Reporting & Real-time Collaboration)**
   Mendukung ekspor PDF resmi satu klik, sinkronisasi cloud Google Sheets, serta notifikasi kolaborasi antar pengguna lapangan secara real-time.

---

### 3. Persona Pengguna (User Personas)

| Persona | Peran | Kebutuhan Utama |
| :--- | :--- | :--- |
| **Manajer Lingkungan & Reklamasi DAS** | Pengambil keputusan strategis tingkat korporat | Ringkasan kinerja makro, persentase kelulusan standar, audit kepatuhan KLHK, laporan PDF resmi. |
| **Pengawas Operasional Lapangan (Field Supervisor)** | Verifikator data teknis petak ukur | Input data sensus berkala (P0, P1, P2), analisis mikro per blok/petak, verifikasi titik koordinat UTM, monitoring faktor pembatas tanah & iklim. |
| **GIS & Environmental Data Specialist** | Analis data spasial & pemetaan | Unggah batas area SHP/KML, analisis korelasi topografi dan kesesuaian jenis tanaman, integrasi Google Sheets. |
| **Auditor / Inspektur KLHK** | Penilai independen keberhasilan tanaman | Transparansi data penilaian petak ukur, metodologi sampling berbobot, bukti koordinat spasial. |

---

### 4. Arsitektur Teknis & Spesifikasi Sistem

- **Frontend Core**: React 18+ dengan TypeScript dan Vite (SPA).
- **Styling & UI**: Tailwind CSS dengan skema warna korporat emerald & lime (Adaro Green Palette) dengan kontras tinggi WCAG AA.
- **Geospatial Engine**: Leaflet 1.9 dengan kustom marker HTML, polyline hydrologic delineations, GeoJSON boundary rendering, dan Fullscreen Controller.
- **Chart & Data Visualization**: Recharts (Donut Chart proporsi kategori & Bar Chart adaptif Sub-DAS/Blok dengan threshold line).
- **State Management & Persistence**: Client-side Reactive State dengan sinkronisasi REST API dan SSE real-time fallback.
- **Document Generation**: jsPDF & jsPDF-AutoTable untuk cetak dokumen resmi berformat A4 lengkap dengan kop surat dan tanda tangan pengesahan.
- **Data Integrations**: 
  - Google Sheets API v4 (OAuth 2.0 Client + Service Endpoint).
  - Excel Importer (xlsx parser dengan schema matching).
  - Shapefile (.shp in .zip) & KML Boundary Parser.

---

### 5. Rincian Fitur Utama (Detailed Feature Specifications)

#### 5.1. Peta Geospasial Interaktif (Interactive GIS Map)
- **Tiga Pilihan Basemap**:
  - *Citra Satelit Resolusi Tinggi* (Esri World Imagery) untuk observasi tutupan tajuk kanopi.
  - *Peta Jalan / Transportasi* (OpenStreetMap) untuk perencanaan rute tim survei lapangan.
  - *Peta Kontur & Topografi* (OpenTopoMap) untuk evaluasi kelerengan dan elevasi.
- **Delineasi Batas Hidrologis DAS**: Layer poligon batas tangkapan air yang dapat diaktifkan/dinonaktifkan.
- **Modul Kelola Boundary Area (SHP / KML)**:
  - Unggah berkas Shapefile (.zip) atau KML batas blok/konsesi.
  - Parsing otomatis menjadi GeoJSON poligon interaktif.
  - Fitur kontrol visibilitas (toggle on/off) dan *Zoom to Boundary*.
- **Mode Layar Penuh (Full Screen Map)**:
  - Tombol toggle di sudut kanan atas panel kontrol (`Maximize2` / `Minimize2`).
  - Mendukung Fullscreen API browser native dengan fallback viewport penuh (`fixed inset-0 z-[99999]`).
  - Dilengkapi tombol pintas keyboard `ESC` dan floating exit banner di atas tengah peta.
  - Dilengkapi `ResizeObserver` dan `invalidateSize()` otomatis anti-*gray tiles*.
  - Mini-legend kategori SR di sudut kiri bawah saat mode layar penuh.
- **Simbolisasi Marker Kategori Keberhasilan**:
  - `Hitam` (0 – 40%): Kondisi Sangat Kritis, rekomendasi penanaman ulang total.
  - `Merah` (>40 – <75%): Kondisi Kurang/Kritis, rekomendasi penyulaman intensif dan perbaikan piringan.
  - `Kuning` (75 – 80%): Memenuhi Standar Minimal, rekomendasi penyiangan dan pemupukan NPK.
  - `Hijau` (>80%): Kondisi Sangat Baik/Prima, rekomendasi pengayaan jenis endemik dan pemeliharaan rutin.
- **Fitur Interaksi Marker**:
  - Kartu preview melayang (*Hover Card*) yang menampilkan ringkasan seketika (Kode PU, Survival Rate, Pohon Hidup vs Awal, Kebutuhan Sulam, Tutupan Tajuk, Rekomendasi).
  - Popup interaktif dengan tombol "Lihat Detail Lengkap".

---

#### 5.2. Panel Filter Multi-Dimensi 16 Parameter (Comprehensive Area Filter)
Sistem menyediakan kontrol penyaringan data dengan opsi **"All" (Semua)** pada seluruh parameter berikut:

1. **DAS / Sub-DAS**: Semua DAS (*All*), DAS 1, DAS 3, DAS 4, DAS 7, DAS 9, DAS RT1.
2. **Blok**: Semua Blok (*All*), Belangian I, Belangian II, Agrabinta, Cidaun, Cikanyere, dll.
3. **Petak**: Semua Petak (*All*) serta nomor petak P-01 s/d P-10.
4. **Periode Evaluasi**: Semua Periode (*All*), P0 (Tanam Awal), P1 (Tahun 1), P2 (Tahun 2), Evaluasi Akhir.
5. **Lokasi Daerah**: Semua Lokasi (*All*), Belangian, Cianjur Selatan, Tiwingan, dll.
6. **Titik Koordinat (UTM)**: Semua Titik (*All*) atau koordinat spesifik PU.
7. **Tahun Tanam**: Semua Tahun (*All*), 2020 hingga 2026.
8. **Kategori Survival Rate**: Semua Kategori (*All*), Hitam, Merah, Kuning, Hijau.
9. **Pengawas Operasional Lapangan**: Semua Pengawas (*All*), Ir. Bambang S., Hendra Wijaya, S.Hut., Siti Nurhaliza, M.Si., dll.
10. **Persentase Hidup Tanaman**: Semua Rentang (*All*), <40%, 40–74%, 75–80%, >80%.
11. **Jarak Tanam**: Semua Jarak Tanam (*All*), 2x2 m, 3x3 m, 4x4 m, 5x5 m.
12. **Jenis Tanaman**: Semua Jenis (*All*), Mahoni, Sengon, Meranti, Jabon, Trembesi, Gaharu, dll.
13. **Suhu Lingkungan**: Semua Suhu (*All*), Sejuk (<26°C), Optimal (26–30°C), Hangat (>30°C).
14. **Kelembaban Udara**: Semua Kelembaban (*All*), Kering (<65%), Sedang (65–80%), Lembab (>80%).
15. **Jenis Tanah**: Semua Jenis (*All*), Latosol, Podsolik Merah Kuning, Aluvial, Regosol, Andosol.
16. **pH Tanah**: Semua pH (*All*), Sangat Asam (<5.0), Asam (5.0–5.9), Netral/Optimal (6.0–7.2), Agak Basa (>7.2).

**Perilaku Dinamis Filter**:
- *Scope Indicator Bar*: Menampilkan status analisis aktif (misal *"Area Terfilter: 32 dari 437 Petak Ukur"*).
- *Reset One-Click*: Tombol *"Kembali ke Seluruh Area"* untuk memulihkan seluruh filter ke kondisi awal.
- *Sinkronisasi Otomatis*: Semua kartu KPI, diagram batang, diagram donat, tabel prioritas, dan marker peta langsung bereaksi tanpa reload halaman.

---

#### 5.3. Dasbor Analitik Kinerja Mendalam (In-Depth Analytics Dashboard)
- **Ringkasan Kartu KPI Cepat**:
  - *Rata-Rata Survival Rate (%)\*: Indikator performa berbobot dengan kode warna status.
  - *Total Petak Ukur (PU)\*: Jumlah titik sampel yang sedang dianalisis.
  - *Persentase Lolos Standar (≥75%)\*: Proporsi petak yang memenuhi syarat serah terima KLHK.
  - *Total Kebutuhan Sulam (btg)\*: Akumulasi bibit yang wajib disiapkan tim pembibitan.
- **Diagram Proporsi Kategori (Donut Chart)**:
  - Visualisasi persentase dan jumlah petak dalam 4 kuadran warna.
- **Diagram Kinerja Adaptif (Adaptive Bar Chart)**:
  - Menampilkan rata-rata SR per Sub-DAS saat melihat seluruh area.
  - Otomatis beralih (*breakdown*) menjadi performa per Blok saat filter dipersempit ke 1 Sub-DAS.
  - Memiliki garis referensi putus-putus (*Threshold Line*) pada nilai 75% sebagai penanda batas kelulusan.
- **Tabel Prioritas Intervensi Silvikultur**:
  - Kolom lengkap: Kode PU, Sub-DAS/Blok, Lokasi, Kategori & SR, Tanaman Hidup/Awal, Kebutuhan Sulam, Tutupan Tajuk, dan Rekomendasi Teknis.
  - Tab filter cepat: *Semua*, *Prioritas Sulam*, *Lolos Standar*.
  - Tombol aksi detail untuk inspeksi mendalam parameter agronomi dan lingkungan.

---

#### 5.4. Formulir & Manajemen Petak Ukur (CRUD Data Management)
- **Input Data Lapangan**:
  - Perhitungan otomatis persentase Survival Rate saat memasukkan `Tanaman Hidup` dan `Tanaman Awal`.
  - Penentuan otomatis `Kategori` dan `Kebutuhan Sulam`.
  - Formulir komprehensif mencakup data spasial, data silvikultur, dan data lingkungan (suhu, kelembaban, jenis tanah, pH).
- **Modal Detail Petak Ukur**:
  - Tab 1: *Informasi Umum & Spasial* (Koordinat UTM, Desa, Blok, Pengawas).
  - Tab 2: *Pertumbuhan & Silvikultur* (Tinggi rata-rata, diameter rata-rata, kesehatan tajuk, bibit sulam).
  - Tab 3: *Kondisi Tanah & Mikroklimat* (pH, tipe tanah, suhu, kelembaban).
  - Tab 4: *Rekomendasi Tindakan Teknis*.

---

#### 5.5. Pelaporan & Kolaborasi Korporat (Reporting & Integrations)
- **Ekspor Laporan PDF Resmi**:
  - Kop resmi PT Adaro Indonesia Divisi Lingkungan & Reklamasi DAS.
  - Lembar ringkasan eksekutif, tabel data petak ukur terfilter, dan analisis kebutuhan sulam.
  - Kolom pengesahan tanda tangan Pengawas Operasional Lapangan & Manajer Lingkungan.
- **Integrasi Google Sheets Cloud**:
  - Sinkronisasi dua arah dengan Google Drive / Sheets API.
  - Opsi simpan konfigurasi Spreadsheet ID untuk update berkala.
- **Impor Berkas Excel (.xlsx)**:
  - Drag-and-drop unggah file hasil sensus lapangan.
  - Preview data tabel dan validasi kolom sebelum integrasi ke sistem.
- **Notifikasi Real-time Multi-Client (SSE)**:
  - Broadcast notifikasi ke seluruh tim saat ada perubahan data petak ukur secara langsung.
  - Laci riwayat notifikasi (*Notification Drawer*) dengan filter unread/read.
- **Bagikan Aplikasi (Share Modal)**:
  - Tautan URL langsung dan QR Code interaktif untuk akses cepat tim pengawas lapangan via smartphone/tablet.

---

### 6. Matriks Kategori Keberhasilan Berdasarkan Standar Permen LHK

| Kategori | Warna | Rentang SR (%) | Status Evaluasi | Rekomendasi Silvikultur |
| :--- | :--- | :--- | :--- | :--- |
| **Hitam** | `#000000` | 0% – 40% | Sangat Kritis (Gagal) | Olah tanah ulang, perbaikan drainase mikro, penanaman ulang menyeluruh dengan jenis pionir kokoh. |
| **Merah** | `#e11d48` | >40% – <74% | Kritis / Kurang | Penyulaman intensif bibit siap tanam (>50 cm), pembersihan gulma agresif, pemupukan dasar NPK. |
| **Kuning** | `#f59e0b` | 75% – 80% | Lulus Standar Minimal | Penyulaman ringan pada lubang mati, penyiangan piringan, pemeliharaan intensif menjelang serah terima. |
| **Hijau** | `#10b981` | >80% – 100% | Sangat Baik / Prima | Perlindungan dari hama/penyakit, pengayaan jenis klimaks lokal, monitoring tutupan kanopi berkala. |

---

### 7. Non-Functional Requirements (NFR)

1. **Responsivitas & Fleksibilitas Perangkat**:
   - Mendukung resolusi layar desktop (1920x1080), laptop (1366x768), tablet lapangan (iPad/Galaxy Tab), hingga mobile responsive.
2. **Kinerja Pemuatan Data (Performance)**:
   - Rendering 437 titik marker Leaflet dengan optimasi `LayerGroup` dan `canvas`/`svg` marker untuk menjaga 60 FPS saat panning/zooming.
   - Pemuatan ubin citra satelit dengan caching browser dan multi-domain subdomains.
3. **Keandalan & Ketahanan Data (Reliability)**:
   - Mekanisme fallback client-side database jika koneksi server sedang dalam mode offline di daerah terpencil.
4. **Keamanan & Standar Akses**:
   - Isolasi kredensial Google API pada layer server/OAuth token.
   - Validasi data input sanitasi pada formulir Petak Ukur.

---

### 8. Roadmap Pengembangan Selanjutnya (Future Enhancements)

- **Tahap 1**: Integrasi data drone orthophoto (GeoTIFF) resolusi sub-desimeter untuk evaluasi tajuk pohon otomatis via computer vision.
- **Tahap 2**: Offline-first Mobile Field App (PWA) dengan perekaman titik GPS berakurasi tinggi (RTK) langsung di area tanpa sinyal seluler.
- **Tahap 3**: Model prediktif AI untuk estimasi serapan karbon (Carbon Stock Estimation) per hektar berdasarkan biomassa tegakan pohon yang hidup.
