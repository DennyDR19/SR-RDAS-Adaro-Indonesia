import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PetakUkur } from '../types';
import { computeDasMetrics, CATEGORY_INFO_MAP } from './survivalHelper';

export function exportDasReportPdf(puList: PetakUkur[], title = 'Laporan Kinerja Rehabilitasi DAS') {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const metrics = computeDasMetrics(puList);
  const nowStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 32, 'F');

  // Institution text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text('SISTEM INFORMASI GEOGRAFIS REHABILITASI DAS', 14, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('Balai Pengelolaan Daerah Aliran Sungai (BPDAS) & Rehabilitasi Hutan', 14, 18);
  doc.text(`Dicetak pada: ${nowStr} | Total Petak Ukur Dievaluasi: ${metrics.totalPU} PU`, 14, 24);

  // Document Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42);
  doc.text('LAPORAN HASIL EVALUASI KINERJA PETAK UKUR (PU)', 14, 42);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    'Evaluasi tingkat kelangsungan hidup (survival rate) tanaman rehabilitasi hutan dan lahan pada petak-petak ukur sampling DAS.',
    14,
    48
  );

  // Summary Metrics Cards (drawn as tables/boxes)
  const boxY = 54;
  const boxWidth = 43;
  const boxHeight = 22;

  // 1. Rata-rata Survival Rate
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, boxY, boxWidth, boxHeight, 2, 2, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('RATA-RATA SURVIVAL RATE', 17, boxY + 6);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(metrics.rataRataSurvivalRate >= 75 ? 22 : 185, metrics.rataRataSurvivalRate >= 75 ? 163 : 28, metrics.rataRataSurvivalRate >= 75 ? 74 : 28);
  doc.text(`${metrics.rataRataSurvivalRate}%`, 17, boxY + 14);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(metrics.rataRataSurvivalRate >= 75 ? 'Memenuhi Standar Minimal' : 'Perlu Peningkatan Sulam', 17, boxY + 19);

  // 2. Pohon Hidup / Awal
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(61, boxY, boxWidth, boxHeight, 2, 2, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('POHON HIDUP / AWAL', 64, boxY + 6);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(`${metrics.totalPohonHidup.toLocaleString()} / ${metrics.totalPohonAwal.toLocaleString()}`, 64, boxY + 14);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`Rasio Hidup: ${Math.round((metrics.totalPohonHidup / (metrics.totalPohonAwal || 1)) * 100)}%`, 64, boxY + 19);

  // 3. Kebutuhan Sulam
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(108, boxY, boxWidth, boxHeight, 2, 2, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('KEBUTUHAN PENYULAMAN', 111, boxY + 6);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(220, 38, 38);
  doc.text(`${metrics.totalKebutuhanSulam.toLocaleString()} btg`, 111, boxY + 14);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Bibit Pengganti Dibutuhkan', 111, boxY + 19);

  // 4. Lulus Standar (>=75%)
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(155, boxY, boxWidth, boxHeight, 2, 2, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('PU LOLOS STANDAR (>=75%)', 158, boxY + 6);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(16, 185, 129);
  doc.text(`${metrics.persentaseLulusStandar}%`, 158, boxY + 14);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`Kategori Kuning & Hijau`, 158, boxY + 19);

  // Section: Kriteria Survival Rate
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('1. REKAPITULASI BERDASARKAN KRITERIA KINERJA SURVIVAL RATE', 14, 85);

  const kriteriaTableBody = [
    [
      '0 - 40% (Hitam)',
      `${metrics.countByKategori.hitam} PU (${Math.round((metrics.countByKategori.hitam / (metrics.totalPU || 1)) * 100)}%)`,
      'Kritis / Sangat Kurang',
      'Wajib Penyulaman Total (100%) dan investigasi media tanam.',
    ],
    [
      '>40 - <75% (Merah)',
      `${metrics.countByKategori.merah} PU (${Math.round((metrics.countByKategori.merah / (metrics.totalPU || 1)) * 100)}%)`,
      'Kurang / Di Bawah Standar',
      'Penyulaman intensif bibit pengganti dan penyiangan gulma liar.',
    ],
    [
      '75 - 80% (Kuning)',
      `${metrics.countByKategori.kuning} PU (${Math.round((metrics.countByKategori.kuning / (metrics.totalPU || 1)) * 100)}%)`,
      'Sedang / Ambang Batas Minimal',
      'Penyulaman ringan pada titik mati dan pemeliharaan lanjutan.',
    ],
    [
      '>80% (Hijau)',
      `${metrics.countByKategori.hijau} PU (${Math.round((metrics.countByKategori.hijau / (metrics.totalPU || 1)) * 100)}%)`,
      'Baik / Berhasil',
      'Pemeliharaan tanaman lanjutan dan pencegahan kebakaran.',
    ],
  ];

  autoTable(doc, {
    startY: 89,
    head: [['Rentang Survival Rate & Warna', 'Jumlah Petak Ukur', 'Status Kinerja', 'Rekomendasi Tindak Lanjut']],
    body: kriteriaTableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { cellWidth: 42, fontStyle: 'bold' },
      1: { cellWidth: 32 },
      2: { cellWidth: 42 },
      3: { cellWidth: 'auto' },
    },
  });

  // Section: Detail Seluruh Petak Ukur
  const lastY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('2. TABEL DATA DETAIL PETAK UKUR (PU)', 14, lastY);

  const puRows = puList.map((pu, index) => {
    return [
      pu.kodePU,
      `${pu.blok}\n(${pu.subDas})`,
      `${pu.latitude.toFixed(4)}, ${pu.longitude.toFixed(4)}`,
      `${pu.tanamanHidup} / ${pu.tanamanAwal}`,
      `${pu.survivalRate}%`,
      pu.kategori.toUpperCase(),
      `${pu.kebutuhanPenyulaman} btg`,
      pu.rekomendasi,
    ];
  });

  autoTable(doc, {
    startY: lastY + 4,
    head: [['Kode PU', 'Lokasi & Sub-DAS', 'Koordinat', 'Hidup/Awal', 'SR (%)', 'Kategori', 'Sulam', 'Rekomendasi Teknis']],
    body: puRows,
    theme: 'striped',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [51, 65, 85],
    },
    didParseCell: function (data) {
      if (data.section === 'body' && data.column.index === 5) {
        const val = data.cell.raw as string;
        if (val === 'HITAM') {
          data.cell.styles.fillColor = [24, 24, 27];
          data.cell.styles.textColor = [255, 255, 255];
          data.cell.styles.fontStyle = 'bold';
        } else if (val === 'MERAH') {
          data.cell.styles.fillColor = [239, 68, 68];
          data.cell.styles.textColor = [255, 255, 255];
          data.cell.styles.fontStyle = 'bold';
        } else if (val === 'KUNING') {
          data.cell.styles.fillColor = [234, 179, 8];
          data.cell.styles.textColor = [0, 0, 0];
          data.cell.styles.fontStyle = 'bold';
        } else if (val === 'HIJAU') {
          data.cell.styles.fillColor = [34, 197, 94];
          data.cell.styles.textColor = [255, 255, 255];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
  });

  // Footer / Signature Section
  const finalY = (doc as any).lastAutoTable.finalY + 12;
  const pageCount = doc.getNumberOfPages();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Dokumen Resmi Sistem Pemantauan Petak Ukur (PU) Rehabilitasi DAS - Halaman ${i} dari ${pageCount}`,
      14,
      290
    );
  }

  // Save / Download PDF
  const filename = `Laporan_Kinerja_Rehabilitasi_DAS_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}
