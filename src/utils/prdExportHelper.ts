import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const PRD_METADATA = {
  title: 'Product Requirement Document (PRD)',
  systemName: 'Sistem Informasi Geografis Pemantauan Kinerja Petak Ukur (PU) Rehabilitasi DAS',
  organization: 'PT Adaro Indonesia - Divisi Lingkungan & Reklamasi DAS',
  version: '2.4.0 (Final Release)',
  date: '22 September 2026',
  author: 'Tim Pengembang Sistem Geospasial & Reklamasi Hutan',
};

/**
 * Downloads the PRD as a rich Microsoft Word compatible .doc file
 */
export function exportPrdDoc(): void {
  const docHtml = `
  <html xmlns:o='urn:schemas-microsoft-com:office:office' 
        xmlns:w='urn:schemas-microsoft-com:office:word' 
        xmlns='http://www.w3.org/TR/REC-html40'>
  <head>
    <meta charset="utf-8">
    <title>${PRD_METADATA.title}</title>
    <!--[if gte mso 9]>
    <xml>
      <w:WordDocument>
        <w:View>Print</w:View>
        <w:Zoom>100</w:Zoom>
        <w:DoNotOptimizeForBrowser/>
      </w:WordDocument>
    </xml>
    <![endif]-->
    <style>
      @page {
        size: A4 portrait;
        margin: 20mm 20mm 20mm 20mm;
      }
      body {
        font-family: 'Calibri', 'Segoe UI', Arial, sans-serif;
        font-size: 11pt;
        line-height: 1.5;
        color: #1e293b;
      }
      .header-cover {
        background: #064e3b;
        color: #ffffff;
        padding: 24px;
        border-radius: 6px;
        margin-bottom: 24px;
      }
      .header-cover h1 {
        font-size: 20pt;
        margin: 0 0 6px 0;
        color: #a3e635;
        font-weight: bold;
      }
      .header-cover h2 {
        font-size: 13pt;
        margin: 0 0 12px 0;
        color: #ffffff;
        font-weight: normal;
      }
      .header-cover .meta {
        font-size: 9pt;
        color: #cbd5e1;
        border-top: 1px solid #0f766e;
        padding-top: 8px;
      }
      h2 {
        font-size: 14pt;
        color: #064e3b;
        border-bottom: 2px solid #064e3b;
        padding-bottom: 4px;
        margin-top: 24px;
        margin-bottom: 12px;
      }
      h3 {
        font-size: 12pt;
        color: #0f766e;
        margin-top: 16px;
        margin-bottom: 8px;
      }
      p, li {
        text-align: justify;
        margin-bottom: 6px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 14px 0;
        font-size: 10pt;
      }
      th {
        background-color: #064e3b;
        color: #ffffff;
        font-weight: bold;
        padding: 8px 10px;
        border: 1px solid #064e3b;
        text-align: left;
      }
      td {
        padding: 7px 10px;
        border: 1px solid #cbd5e1;
        vertical-align: top;
      }
      tr:nth-child(even) td {
        background-color: #f8fafc;
      }
      .badge {
        display: inline-block;
        padding: 2px 6px;
        border-radius: 4px;
        font-weight: bold;
        font-size: 8.5pt;
      }
      .badge-black { background-color: #000000; color: #ffffff; }
      .badge-red { background-color: #e11d48; color: #ffffff; }
      .badge-yellow { background-color: #f59e0b; color: #000000; }
      .badge-green { background-color: #10b981; color: #ffffff; }
      .callout {
        background: #f0fdf4;
        border-left: 4px solid #16a34a;
        padding: 12px 14px;
        margin: 12px 0;
        border-radius: 0 6px 6px 0;
      }
      .footer {
        margin-top: 30px;
        font-size: 8.5pt;
        color: #64748b;
        text-align: center;
        border-top: 1px solid #e2e8f0;
        padding-top: 12px;
      }
    </style>
  </head>
  <body>
    <div class="header-cover">
      <h1>${PRD_METADATA.title}</h1>
      <h2>${PRD_METADATA.systemName}</h2>
      <div class="meta">
        <strong>Institusi / Pemilik:</strong> ${PRD_METADATA.organization} | 
        <strong>Versi:</strong> ${PRD_METADATA.version} | 
        <strong>Tanggal Rilis:</strong> ${PRD_METADATA.date}
      </div>
    </div>

    <h2>1. Ringkasan Eksekutif (Executive Summary)</h2>
    <p>
      <strong>Sistem Informasi Geografis (SIG) Pemantauan Kinerja Petak Ukur (PU) Rehabilitasi DAS PT Adaro Indonesia</strong> 
      adalah platform web geospasial dan analitik modern terpadu yang dirancang khusus untuk mengelola, memantau, mengevaluasi, 
      serta melaporkan tingkat keberhasilan pertumbuhan tanaman rehabilitasi Daerah Aliran Sungai (DAS) secara terukur dan presisi. 
      Sistem ini dibangun mengacu pada regulasi Peraturan Menteri Lingkungan Hidup dan Kehutanan (Permen LHK) terkait baku mutu 
      keberhasilan tanaman rehabilitasi DAS dengan ambang kelulusan minimal <em>Survival Rate</em> (persentase hidup tanaman) sebesar &ge;75%.
    </p>
    <div class="callout">
      <strong>Visi Strategis:</strong> Mewujudkan kepatuhan regulasi lingkungan 100%, transparansi data spasial sensus pohon, 
      dan efisiensi alokasi anggaran penyulaman melalui analitik spasial adaptif dan pelaporan otomatis satu klik.
    </div>

    <h2>2. Tujuan & Sasaran Produk (Product Goals & Objectives)</h2>
    <ol>
      <li><strong>Kepatuhan Regulasi (Regulatory Compliance):</strong> Memastikan seluruh petak ukur tanaman memenuhi standar keberhasilan tanaman rehabilitasi DAS (Survival Rate &ge;75%) menjelang evaluasi serah terima kepada pemerintah.</li>
      <li><strong>Visibilitas Spasial 100% (Full Geospatial Visibility):</strong> Menampilkan sebaran 437 titik sampling Petak Ukur (PU) pada 6 Sub-DAS aktif (DAS 1, DAS 3, DAS 4, DAS 7, DAS 9, DAS RT1) di atas citra satelit resolusi tinggi dengan mode fokus layar penuh (Full Screen).</li>
      <li><strong>Analitik Multi-Dimensi Granular:</strong> Memungkinkan penyaringan data secara instan berbasis 16 variabel teknis (DAS, Blok, Petak, Periode, Lokasi, UTM, Tahun Tanam, Kategori, Pengawas, % Hidup, Jarak Tanam, Jenis Pohon, Suhu, Kelembaban, Tipe Tanah, dan pH Tanah) dengan opsi "All" di setiap kriteria.</li>
      <li><strong>Ketepatan Alokasi Bibit Sulam:</strong> Menghitung secara otomatis kebutuhan bibit sulam pada petak berkategori Hitam (0&ndash;40%) dan Merah (&gt;40&ndash;74%) guna mencegah pemborosan bibit dan biaya logistik tanam.</li>
      <li><strong>Kolaborasi Real-time & Otomasi Pelaporan:</strong> Menyediakan saluran ekspor laporan resmi PDF berstandar korporat, sinkronisasi cloud Google Sheets, impor data Excel (.xlsx), serta siaran notifikasi real-time antar staf operasional.</li>
    </ol>

    <h2>3. Persona Pengguna & Matriks Kebutuhan</h2>
    <table>
      <thead>
        <tr>
          <th style="width: 25%;">Persona</th>
          <th style="width: 25%;">Peran Operasional</th>
          <th style="width: 50%;">Kebutuhan & Ekspektasi Utama</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Manajer Lingkungan & Reklamasi DAS</strong></td>
          <td>Pengambil keputusan tingkat korporat</td>
          <td>Memantau KPI makro (Rata-rata SR konsesi, % kelulusan standar, total kebutuhan bibit sulam), mengesahkan laporan PDF resmi, dan memastikan audit KLHK berjalan sukses.</td>
        </tr>
        <tr>
          <td><strong>Pengawas Operasional Lapangan</strong></td>
          <td>Koordinator sensus & verifikasi petak ukur</td>
          <td>Input sensus petak ukur, filter area per blok/pengawas, verifikasi koordinat UTM di lapangan, mencatat kondisi tanah & suhu mikroklimat, serta meninjau rekomendasi teknis silvikultur.</td>
        </tr>
        <tr>
          <td><strong>Spesialis GIS & Data Analis</strong></td>
          <td>Pengelola data spasial & pemetaan</td>
          <td>Mengunggah boundary area SHP/KML, validasi batas delineasi hidrologis DAS, mengevaluasi tutupan kanopi pada citra satelit resolusi tinggi dalam mode full screen.</td>
        </tr>
        <tr>
          <td><strong>Auditor Independen / Tim KLHK</strong></td>
          <td>Penilai keberhasilan tanaman</td>
          <td>Memverifikasi transparansi sampling petak ukur, meninjau persentase kelulusan objektif, dan memeriksa jejak audit data.</td>
        </tr>
      </tbody>
    </table>

    <h2>4. Arsitektur Teknis Sistem</h2>
    <ul>
      <li><strong>Frontend Framework:</strong> React 19 dengan TypeScript dan Vite (SPA performa tinggi).</li>
      <li><strong>Desain & Antarmuka:</strong> Tailwind CSS dengan palet korporat Adaro Forest Emerald & Lime (#09473d, #063931, #a3e635).</li>
      <li><strong>Mesin Geospasial:</strong> Leaflet 1.9 dengan integrasi Esri World Imagery, OpenStreetMap, OpenTopoMap, layer poligon GeoJSON, serta pengontrol Fullscreen hibrida.</li>
      <li><strong>Visualisasi Data:</strong> Recharts (Donut Chart distribusi 4 kategori SR & Adaptive Bar Chart kinerja Sub-DAS/Blok dengan threshold line 75%).</li>
      <li><strong>Sinkronisasi Real-time:</strong> Server-Sent Events (SSE) dengan auto-reconnect dan broadcast notifikasi ke seluruh klien aktif.</li>
      <li><strong>Integrasi Data Cloud:</strong> Google Sheets API v4 (Google Drive/Workspace OAuth 2.0) dan Excel XLSX Importer/Exporter.</li>
      <li><strong>Mesin Cetak PDF:</strong> jsPDF dan jsPDF-AutoTable untuk penerbitan laporan resmi A4 lengkap dengan kop resmi dan tabel evaluasi.</li>
    </ul>

    <h2>5. Spesifikasi Rinci Fitur Aplikasi (Versi Terbaru)</h2>

    <h3>5.1. Peta Kinerja Geospasial & Mode Layar Penuh (Interactive GIS Map)</h3>
    <ul>
      <li><strong>3 Pilihan Basemap:</strong> Citra Satelit Resolusi Tinggi (Esri), Peta Jalan Transportasi (OSM), dan Peta Kontur/Topografi (OpenTopoMap).</li>
      <li><strong>Delineasi Batas Hidrologis:</strong> Toggle layer batas tangkapan air DAS Adaro.</li>
      <li><strong>Pengelola Boundary SHP/KML:</strong> Pengguna dapat mengunggah berkas arsip Shapefile (.zip) atau KML untuk menampilkan batas area konsesi di atas peta.</li>
      <li><strong>Fitur Full Screen (Layar Penuh):</strong>
        <ul>
          <li>Tombol toggle di sudut kanan atas panel kontrol peta dengan ikon <em>Maximize2 / Minimize2</em>.</li>
          <li>Mendukung API Fullscreen browser native dengan fallback viewport penuh (<code>fixed inset-0 z-[99999]</code>).</li>
          <li>Pintasan tombol keyboard <code>ESC</code> untuk keluar secara instan dari mode layar penuh.</li>
          <li>Floating status banner di bagian atas tengah layar ("Fokus Peta Layar Penuh &bull; Tekan ESC untuk keluar").</li>
          <li>Otomasi <code>ResizeObserver</code> dan <code>map.invalidateSize()</code> untuk mencegah area abu-abu (gray tiles) saat transisi layar.</li>
          <li>Floating Mini-Legend di sudut kiri bawah saat mode layar penuh.</li>
        </ul>
      </li>
      <li><strong>Simbolisasi Marker:</strong> 437 titik sampling petak ukur dengan penanda angka SR dan warna kategori KLHK.</li>
      <li><strong>Interactive Hover Card:</strong> Preview melayang saat kursor melintas di atas marker (Kode PU, Blok, SR, Pohon Hidup/Awal, Kebutuhan Sulam, Tutupan Tajuk, dan Rekomendasi).</li>
    </ul>

    <h3>5.2. Panel Filter Multi-Dimensi 16 Variabel (Comprehensive Filter Panel)</h3>
    <p>Sistem menyediakan penyaringan data interaktif dengan opsi <strong>"All" (Semua)</strong> pada setiap parameter:</p>
    <table style="font-size: 9.5pt;">
      <thead>
        <tr>
          <th>No</th>
          <th>Variabel Filter</th>
          <th>Pilihan Opsi yang Disediakan</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>1</td><td><strong>DAS / Sub-DAS</strong></td><td>Semua DAS (All), DAS 1, DAS 3, DAS 4, DAS 7, DAS 9, DAS RT1</td></tr>
        <tr><td>2</td><td><strong>Blok</strong></td><td>Semua Blok (All), Belangian I, Belangian II, Agrabinta, Cidaun, Cikanyere, dll.</td></tr>
        <tr><td>3</td><td><strong>Petak</strong></td><td>Semua Petak (All), P-01 s/d P-10</td></tr>
        <tr><td>4</td><td><strong>Periode Evaluasi</strong></td><td>Semua Periode (All), P0 (Tanam Awal), P1 (Tahun 1), P2 (Tahun 2), Evaluasi Akhir</td></tr>
        <tr><td>5</td><td><strong>Lokasi Daerah</strong></td><td>Semua Lokasi Daerah (All), Belangian, Cianjur Selatan, Tiwingan, dll.</td></tr>
        <tr><td>6</td><td><strong>Titik Koordinat (UTM)</strong></td><td>Semua Titik Koordinat (All) atau koordinat individual Petak Ukur</td></tr>
        <tr><td>7</td><td><strong>Tahun Tanam</strong></td><td>Semua Tahun Tanam (All), 2020 s/d 2026</td></tr>
        <tr><td>8</td><td><strong>Kategori Survival Rate</strong></td><td>Semua Kategori (All), Hitam (0-40%), Merah (>40-74%), Kuning (75-80%), Hijau (>80%)</td></tr>
        <tr><td>9</td><td><strong>Pengawas Lapangan</strong></td><td>Semua Pengawas (All), Ir. Bambang S., Hendra Wijaya, Siti Nurhaliza, dll.</td></tr>
        <tr><td>10</td><td><strong>Persentase Hidup</strong></td><td>Semua Rentang (All), Sangat Kritis (<40%), Kurang (40-74%), Standar (75-80%), Prima (>80%)</td></tr>
        <tr><td>11</td><td><strong>Jarak Tanam</strong></td><td>Semua Jarak Tanam (All), 2x2 m, 3x3 m, 4x4 m, 5x5 m</td></tr>
        <tr><td>12</td><td><strong>Jenis Tanaman</strong></td><td>Semua Jenis Tanaman (All), Mahoni, Sengon, Meranti, Jabon, Trembesi, Gaharu, dll.</td></tr>
        <tr><td>13</td><td><strong>Suhu Lingkungan</strong></td><td>Semua Suhu (All), Sejuk (<26°C), Optimal (26-30°C), Hangat (>30°C)</td></tr>
        <tr><td>14</td><td><strong>Kelembaban Udara</strong></td><td>Semua Kelembaban (All), Kering (<65%), Sedang (65-80%), Lembab (>80%)</td></tr>
        <tr><td>15</td><td><strong>Jenis Tanah</strong></td><td>Semua Jenis Tanah (All), Latosol, Podsolik Merah Kuning, Aluvial, Regosol, Andosol</td></tr>
        <tr><td>16</td><td><strong>pH Tanah</strong></td><td>Semua pH (All), Sangat Asam (<5.0), Asam (5.0-5.9), Netral/Optimal (6.0-7.2), Agak Basa (>7.2)</td></tr>
      </tbody>
    </table>

    <h3>5.3. Dasbor Analitik Kinerja Adaptif (In-Depth Analytics Dashboard)</h3>
    <ul>
      <li><strong>Kartu KPI Cepat:</strong> Menghitung ulang Rata-rata SR, Total PU, Persentase Lulus Standar, dan Total Kebutuhan Sulam sesuai cakupan filter secara instan.</li>
      <li><strong>Scope Indicator Bar:</strong> Menginformasikan jumlah filter aktif dan menyediakan tombol cepat <em>"Kembali ke Seluruh Area"</em>.</li>
      <li><strong>Donut Chart:</strong> Proporsi 4 kategori keberhasilan pada area yang dipilih.</li>
      <li><strong>Adaptive Bar Chart:</strong> Menampilkan rata-rata SR per Sub-DAS (bila melihat makro) dan otomatis beralih menjadi performa per Blok (bila difilter ke 1 Sub-DAS), dilengkapi garis target 75%.</li>
      <li><strong>Tabel Prioritas Tindakan Silvikultur:</strong> Rekomendasi teknis spesifik per petak ukur dengan tombol inspeksi detail agronomi.</li>
    </ul>

    <h3>5.4. Integrasi Korporat & Pelaporan</h3>
    <ul>
      <li><strong>Laporan Resmi PDF:</strong> Pembuatan dokumen A4 resmi lengkap dengan kop PT Adaro Indonesia, ringkasan eksekutif, tabel data petak ukur, dan kolom tanda tangan pengesahan.</li>
      <li><strong>Sinkronisasi Google Sheets:</strong> Menghubungkan basis data dengan spreadsheet korporat secara real-time.</li>
      <li><strong>Impor Excel (.xlsx):</strong> Fasilitas unggah cepat berkas sensus lapangan dengan validasi skema otomatis.</li>
    </ul>

    <h2>6. Matriks Kategori Keberhasilan Tanaman (Standar Permen LHK)</h2>
    <table>
      <thead>
        <tr>
          <th>Kategori</th>
          <th>Kode Warna</th>
          <th>Rentang SR</th>
          <th>Status Kelulusan</th>
          <th>Rekomendasi Tindakan Silvikultur Lapangan</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><span class="badge badge-black">Hitam</span></td>
          <td>#000000</td>
          <td>0% &ndash; 40%</td>
          <td>Sangat Kritis (Gagal)</td>
          <td>Penanaman ulang menyeluruh (replanting), perbaikan drainase & piringan, penambahan mikoriza dan pupuk kandang.</td>
        </tr>
        <tr>
          <td><span class="badge badge-red">Merah</span></td>
          <td>#e11d48</td>
          <td>&gt;40% &ndash; &lt;75%</td>
          <td>Kritis / Kurang</td>
          <td>Penyulaman intensif bibit tinggi &gt;50 cm, pembersihan gulma agresif, pengendalian rayap/hama, pemupukan NPK berimbang.</td>
        </tr>
        <tr>
          <td><span class="badge badge-yellow">Kuning</span></td>
          <td>#f59e0b</td>
          <td>75% &ndash; 80%</td>
          <td>Lolos Standar Minimal</td>
          <td>Penyulaman ringan pada titik mati, pendangiran tanah di sekitar perakaran, pemupukan susulan, persiapan verifikasi KLHK.</td>
        </tr>
        <tr>
          <td><span class="badge badge-green">Hijau</span></td>
          <td>#10b981</td>
          <td>&gt;80% &ndash; 100%</td>
          <td>Sangat Baik (Prima)</td>
          <td>Pemeliharaan berkala, perlindungan dari kebakaran hutan dan perambahan, pengayaan jenis tanaman lokal endemik.</td>
        </tr>
      </tbody>
    </table>

    <h2>7. Kebutuhan Non-Fungsional (Non-Functional Requirements)</h2>
    <ul>
      <li><strong>Kinerja Tinggi:</strong> Pemuatan awal di bawah 1.5 detik dengan bundling optimal esbuild/vite dan kompresi aset.</li>
      <li><strong>Responsif & Adaptif:</strong> Bekerja prima pada resolusi monitor desktop 4K, laptop, tablet survei lapangan, dan ponsel pintar.</li>
      <li><strong>Keamanan & Privasi:</strong> Kunci API dan kredensial OAuth diproses secara aman tanpa membocorkan rahasia ke publik.</li>
      <li><strong>Ketahanan Operasional (High Availability):</strong> Penyimpanan lokal persisten yang tahan terhadap gangguan koneksi internet saat tim berada di pedalaman DAS.</li>
    </ul>

    <div class="footer">
      Dokumen ini diterbitkan secara otomatis oleh Sistem Informasi Geografis Rehabilitasi DAS PT Adaro Indonesia.<br/>
      Hak Cipta &copy; 2026 PT Adaro Indonesia. Seluruh hak cipta dilindungi undang-undang.
    </div>
  </body>
  </html>
  `;

  const blob = new Blob(['\ufeff', docHtml], {
    type: 'application/msword;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'PRD_SIG_Rehabilitasi_DAS_PT_Adaro_Indonesia.doc';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Downloads the PRD as a clean, structured multi-page PDF document
 */
export function exportPrdPdf(): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Header Banner Page 1
  doc.setFillColor(6, 78, 59); // emerald-900 / Adaro Green
  doc.rect(0, 0, pageWidth, 30, 'F');

  doc.setTextColor(163, 230, 53); // lime-400
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('PRODUCT REQUIREMENT DOCUMENT (PRD)', margin, 11);

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Sistem Informasi Geografis & Monitoring Kinerja Petak Ukur (PU) Rehabilitasi DAS', margin, 17);
  doc.setTextColor(203, 213, 225);
  doc.setFontSize(7.5);
  doc.text(`${PRD_METADATA.organization} | Versi: ${PRD_METADATA.version} | Tanggal: ${PRD_METADATA.date}`, margin, 23);

  let currentY = 38;

  // Section 1: Executive Summary
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(6, 78, 59);
  doc.text('1. RINGKASAN EKSEKUTIF (EXECUTIVE SUMMARY)', margin, currentY);
  currentY += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  const summaryText =
    'Sistem Informasi Geografis (SIG) Pemantauan Kinerja Petak Ukur (PU) Rehabilitasi DAS PT Adaro Indonesia adalah platform geospasial dan analitik modern terpadu yang dirancang khusus untuk memonitor, mengevaluasi, dan melaporkan keberhasilan tanaman rehabilitasi DAS secara presisi dan terukur. Sistem ini mengacu pada regulasi Permen LHK dengan standar kelulusan minimal Survival Rate (SR) >= 75%. Sistem mengintegrasikan pemetaan interaktif Leaflet GIS (citra satelit resolusi tinggi, batas SHP/KML, mode layar penuh), filter multi-dimensi 16 parameter, analitik kinerja adaptif, sinkronisasi Google Sheets, dan generator PDF resmi.';
  const summaryLines = doc.splitTextToSize(summaryText, contentWidth);
  doc.text(summaryLines, margin, currentY);
  currentY += summaryLines.length * 4.2 + 4;

  // Section 2: Goals & Objectives
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(6, 78, 59);
  doc.text('2. TUJUAN & SASARAN PRODUK (PRODUCT OBJECTIVES)', margin, currentY);
  currentY += 5;

  const objectives = [
    '• Kepatuhan Regulasi: Memastikan evaluasi survival rate memenuhi standar kelulusan KLHK (>= 75%).',
    '• Visibilitas Spasial: Pemetaan 437 titik sampling PU di 6 Sub-DAS aktif dengan citra satelit & mode full screen.',
    '• Analisis Granular 16 Variabel: Filter spesifik per DAS, Blok, Petak, Koordinat UTM, Tanah, pH, Suhu, dll (dengan opsi All).',
    '• Efisiensi Alokasi Sulam: Perhitungan otomatis kebutuhan bibit sulam pada petak Kritis (Hitam & Merah).',
    '• Kolaborasi Terpadu: Ekspor PDF resmi korporat, sinkronisasi Google Sheets Cloud, dan notifikasi real-time SSE.',
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  doc.setTextColor(30, 41, 59);
  objectives.forEach((obj) => {
    doc.text(obj, margin, currentY);
    currentY += 4.5;
  });
  currentY += 3;

  // Section 3: User Personas Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(6, 78, 59);
  doc.text('3. PERSONA PENGGUNA & PERAN', margin, currentY);
  currentY += 3;

  autoTable(doc, {
    startY: currentY,
    head: [['Persona', 'Peran Operasional', 'Kebutuhan Utama']],
    body: [
      ['Manajer Lingkungan & Reklamasi', 'Pengambil Keputusan Strategis', 'Review KPI makro konsesi, persentase kelulusan standar, pengesahan laporan PDF resmi.'],
      ['Pengawas Operasional Lapangan', 'Verifikator & Surveyor Sensus', 'Input sensus lapangan (P0-P2), inspeksi per blok/petak, analisis tanah & mikroklimat.'],
      ['Spesialis GIS & Data Analis', 'Pengelola Spasial & Pemetaan', 'Unggah boundary SHP/KML, observasi tutupan kanopi citra satelit dalam mode full screen.'],
      ['Auditor Independen / KLHK', 'Penilai Keberhasilan Tanaman', 'Verifikasi independen sampling petak ukur dan transparansi data penilaian keberhasilan.'],
    ],
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 2.2 },
    headStyles: { fillColor: [6, 78, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
    margin: { left: margin, right: margin },
  });

  currentY = (doc as any).lastAutoTable.finalY + 7;

  // Section 4: Standar Kelulusan Permen LHK Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(6, 78, 59);
  doc.text('4. MATRIKS STANDAR KEBERHASILAN (PERMEN LHK)', margin, currentY);
  currentY += 3;

  autoTable(doc, {
    startY: currentY,
    head: [['Kategori', 'Warna', 'Rentang SR', 'Status Kelulusan', 'Rekomendasi Tindakan Silvikultur']],
    body: [
      ['Hitam', '#000000', '0% - 40%', 'Sangat Kritis (Gagal)', 'Penanaman ulang menyeluruh (replanting), perbaikan drainase mikro & piringan.'],
      ['Merah', '#e11d48', '>40% - <75%', 'Kritis / Kurang', 'Penyulaman intensif bibit tinggi >50cm, penyiangan gulma, pemupukan NPK.'],
      ['Kuning', '#f59e0b', '75% - 80%', 'Lolos Standar Minimal', 'Penyulaman ringan titik mati, pendangiran tanah, pemupukan susulan.'],
      ['Hijau', '#10b981', '>80% - 100%', 'Sangat Baik (Prima)', 'Pemeliharaan rutin, perlindungan kebakaran/hama, pengayaan jenis lokal.'],
    ],
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 2.2 },
    headStyles: { fillColor: [6, 78, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
    margin: { left: margin, right: margin },
  });

  // PAGE 2: Features & Details
  doc.addPage();
  currentY = 16;

  // Header Banner Page 2
  doc.setFillColor(6, 78, 59);
  doc.rect(0, 0, pageWidth, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('PRD SPESIFIKASI FITUR - SISTEM INFORMASI GEOGRAFIS REHABILITASI DAS', margin, 8);

  currentY = 20;

  // Section 5: Detailed Feature Specifications
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(6, 78, 59);
  doc.text('5. RINCIAN SPESIFIKASI FITUR (VERSI WEB TERBARU)', margin, currentY);
  currentY += 6;

  const features = [
    {
      title: '5.1 Peta Geospasial Interaktif & Mode Full Screen',
      desc: '• 3 Basemap: Citra Satelit Resolusi Tinggi (Esri World Imagery), Peta Jalan (OSM), Topografi (OpenTopoMap).\n• Mode Full Screen (Layar Penuh): Tombol toggle Maximize/Minimize di kontrol kanan atas, fallback CSS viewport penuh, tombol ESC untuk keluar, floating exit pill di atas tengah, dan penyesuaian otomatis ResizeObserver.\n• Pengelola Boundary SHP/KML: Mendukung unggah berkas Shapefile .zip dan KML batas area konsesi.\n• 437 Marker Petak Ukur dengan kartu ringkasan melayang (Hover Card) seketika.',
    },
    {
      title: '5.2 Panel Filter Multi-Dimensi 16 Parameter (Opsi All)',
      desc: '• 16 Variabel: (1) DAS, (2) Blok, (3) Petak, (4) Periode Evaluasi, (5) Lokasi Daerah, (6) Titik Koordinat UTM, (7) Tahun Tanam, (8) Kategori SR, (9) Pengawas Lapangan, (10) Persentase Hidup, (11) Jarak Tanam, (12) Jenis Tanaman, (13) Suhu, (14) Kelembaban Udara, (15) Jenis Tanah, (16) pH Tanah.\n• Setiap variabel memiliki opsi "All" (Semua) untuk fleksibilitas analisis global vs area spesifik.\n• Scope Indicator Bar & Tombol Reset One-Click untuk kembali ke seluruh 437 PU.',
    },
    {
      title: '5.3 Dasbor Analitik Kinerja Adaptif',
      desc: '• 4 Kartu KPI: Rata-rata SR, Total PU, % Lulus Standar (>=75%), dan Total Kebutuhan Sulam.\n• Donut Chart distribusi 4 kategori keberhasilan.\n• Adaptive Bar Chart: Otomatis menampilkan kinerja per Sub-DAS (skala makro) dan beralih menjadi per Blok bila difilter ke 1 Sub-DAS, lengkap dengan garis target 75%.\n• Tabel Tindakan Silvikultur Prioritas dengan filter tab cepat.',
    },
    {
      title: '5.4 Integrasi Korporat & Pelaporan',
      desc: '• Ekspor Laporan Resmi PDF: Format A4 kop Adaro dengan lembar evaluasi dan kolom tanda tangan pengesahan.\n• Integrasi Google Sheets Cloud: Sinkronisasi dua arah dengan Google Drive / Workspace.\n• Impor Excel (.xlsx): Upload sensus lapangan dengan skema matching otomatis.\n• Sinkronisasi Real-time SSE: Broadcast pembaruan data antar pengguna dengan laci notifikasi.',
    },
  ];

  features.forEach((feat) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 118, 110);
    doc.text(feat.title, margin, currentY);
    currentY += 4.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.8);
    doc.setTextColor(51, 65, 85);
    const lines = doc.splitTextToSize(feat.desc, contentWidth);
    doc.text(lines, margin, currentY);
    currentY += lines.length * 3.8 + 3.5;
  });

  // Section 6: Non-Functional Requirements
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(6, 78, 59);
  doc.text('6. KEBUTUHAN NON-FUNGSIONAL (NFR)', margin, currentY);
  currentY += 5;

  const nfrs = [
    '• Kecepatan & Responsivitas: Pemuatan awal < 1.5 detik, 60 FPS pada interaksi peta Leaflet.',
    '• Multi-Device Support: Optimal pada Desktop PC, Laptop, iPad/Tablet Lapangan, dan Smartphone.',
    '• Keamanan Data: Isolasi token OAuth Google Sheets dan sanitasi data formulir.',
    '• Offline-Resilience: Mekanisme penyimpanan lokal untuk daerah terpencil tanpa koneksi internet.',
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  nfrs.forEach((n) => {
    doc.text(n, margin, currentY);
    currentY += 4.2;
  });

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Dokumen PRD PT Adaro Indonesia - Halaman ${i} dari ${totalPages}`,
      margin,
      290
    );
    doc.text('Sistem Informasi Geografis Rehabilitasi DAS', pageWidth - margin - 55, 290);
  }

  doc.save('PRD_SIG_Rehabilitasi_DAS_PT_Adaro_Indonesia.pdf');
}
