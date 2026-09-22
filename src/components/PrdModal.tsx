import React, { useState } from 'react';
import {
  FileText,
  Download,
  X,
  FileCheck,
  ExternalLink,
  BookOpen,
  CheckCircle2,
  Layers,
  SlidersHorizontal,
  BarChart2,
  Maximize2,
  FileSpreadsheet,
} from 'lucide-react';
import { exportPrdDoc, exportPrdPdf, PRD_METADATA } from '../utils/prdExportHelper';

interface PrdModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrdModal: React.FC<PrdModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'features' | 'matrix' | 'nfr'>('overview');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingDoc, setIsExportingDoc] = useState(false);

  if (!isOpen) return null;

  const handleDownloadPdf = () => {
    setIsExportingPdf(true);
    try {
      exportPrdPdf();
    } catch (e) {
      console.error(e);
      // Fallback: direct download link
      window.open('/PRD_SIG_Rehabilitasi_DAS_PT_Adaro_Indonesia.pdf', '_blank');
    } finally {
      setTimeout(() => setIsExportingPdf(false), 800);
    }
  };

  const handleDownloadDoc = () => {
    setIsExportingDoc(true);
    try {
      exportPrdDoc();
    } catch (e) {
      console.error(e);
      // Fallback: direct download link
      window.open('/PRD_SIG_Rehabilitasi_DAS_PT_Adaro_Indonesia.doc', '_blank');
    } finally {
      setTimeout(() => setIsExportingDoc(false), 800);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-4xl max-h-[92vh] bg-slate-900 border border-emerald-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#063f35] to-[#042822] px-6 py-4 border-b border-emerald-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-lime-400/20 border border-lime-400/40 flex items-center justify-center text-lime-300">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Product Requirement Document (PRD)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-lime-400/20 text-lime-300 border border-lime-400/30">
                  {PRD_METADATA.version}
                </span>
              </div>
              <p className="text-xs text-emerald-300/80">
                {PRD_METADATA.organization} &bull; Rilis {PRD_METADATA.date}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Download Bar */}
        <div className="bg-slate-800/80 px-6 py-3 border-b border-slate-700/60 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Tersedia untuk diunduh dalam dua format dokumen resmi:</span>
          </div>

          <div className="flex items-center gap-2">
            {/* DOC Download Button */}
            <button
              onClick={handleDownloadDoc}
              disabled={isExportingDoc}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExportingDoc ? 'Menyiapkan...' : 'Download DOC (Word)'}</span>
            </button>

            {/* PDF Download Button */}
            <button
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExportingPdf ? 'Menyiapkan...' : 'Download PDF'}</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 px-6 bg-slate-900/60 text-xs font-medium text-slate-400 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2.5 px-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-lime-400 text-lime-300 font-semibold'
                : 'border-transparent hover:text-slate-200'
            }`}
          >
            1. Ringkasan & Tujuan
          </button>
          <button
            onClick={() => setActiveTab('features')}
            className={`py-2.5 px-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'features'
                ? 'border-lime-400 text-lime-300 font-semibold'
                : 'border-transparent hover:text-slate-200'
            }`}
          >
            2. Fitur Baru & Peta Fullscreen
          </button>
          <button
            onClick={() => setActiveTab('matrix')}
            className={`py-2.5 px-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'matrix'
                ? 'border-lime-400 text-lime-300 font-semibold'
                : 'border-transparent hover:text-slate-200'
            }`}
          >
            3. Standar Permen LHK
          </button>
          <button
            onClick={() => setActiveTab('nfr')}
            className={`py-2.5 px-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'nfr'
                ? 'border-lime-400 text-lime-300 font-semibold'
                : 'border-transparent hover:text-slate-200'
            }`}
          >
            4. Arsitektur & NFR
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto max-h-[58vh] space-y-4 text-xs text-slate-300 leading-relaxed">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/20 text-slate-200">
                <h4 className="text-sm font-bold text-lime-400 mb-1.5">
                  Ringkasan Eksekutif & Latar Belakang
                </h4>
                <p>
                  Sistem Informasi Geografis (SIG) Pemantauan Kinerja Petak Ukur (PU) Rehabilitasi DAS PT Adaro Indonesia
                  merupakan platform evaluasi tanaman berbasis geospasial real-time yang dirancang mengacu pada standar
                  Peraturan Menteri Lingkungan Hidup dan Kehutanan (Permen LHK). Sistem ini memastikan seluruh kewajiban
                  penanaman rehabilitasi DAS mencapai tingkat kelulusan minimal <strong>Survival Rate (SR) &ge; 75%</strong>.
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">
                  5 Sasaran Utama Produk
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-lg bg-slate-800/70 border border-slate-700/60">
                    <span className="font-semibold text-emerald-300 flex items-center gap-1.5 mb-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-lime-400" /> Kepatuhan Standar KLHK
                    </span>
                    Memastikan survival rate memenuhi ambang batas serah terima &ge;75% dengan perhitungan berbobot.
                  </div>
                  <div className="p-3 rounded-lg bg-slate-800/70 border border-slate-700/60">
                    <span className="font-semibold text-emerald-300 flex items-center gap-1.5 mb-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-lime-400" /> Visibilitas Spasial 437 PU
                    </span>
                    Pemetaan titik sampling di 6 Sub-DAS aktif dengan citra satelit resolusi tinggi dan mode fullscreen.
                  </div>
                  <div className="p-3 rounded-lg bg-slate-800/70 border border-slate-700/60">
                    <span className="font-semibold text-emerald-300 flex items-center gap-1.5 mb-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-lime-400" /> Filter Multi-Dimensi 16 Parameter
                    </span>
                    Kemampuan penyaringan area mikro hingga makro dengan opsi "All" di setiap kriteria evaluasi.
                  </div>
                  <div className="p-3 rounded-lg bg-slate-800/70 border border-slate-700/60">
                    <span className="font-semibold text-emerald-300 flex items-center gap-1.5 mb-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-lime-400" /> Presisi Alokasi Bibit Sulam
                    </span>
                    Otomasi perhitungan bibit sulam untuk petak kritis (Hitam & Merah) untuk optimalisasi biaya tanam.
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'features' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-emerald-500/30">
                <div className="flex items-center gap-2 text-lime-300 font-bold mb-1">
                  <Maximize2 className="w-4 h-4" />
                  <span>Fitur Peta Layar Penuh (Full Screen Mode)</span>
                </div>
                <p className="text-slate-300 mb-2">
                  Didesain untuk memudahkan tim teknis dan pengambil keputusan saat fokus menginspeksi tutupan tajuk
                  pada citra satelit dan sebaran titik petak ukur:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-300">
                  <li><strong>Tombol Kontrol Kanan Atas:</strong> Ikon Maximize/Minimize dengan tooltip status interaktif.</li>
                  <li><strong>Pintasan Keyboard ESC:</strong> Keluar dari layar penuh secara instan kapan saja.</li>
                  <li><strong>Floating Exit Banner:</strong> Pill melayang di bagian atas tengah layar untuk kemudahan navigasi.</li>
                  <li><strong>ResizeObserver & InvalidateSize:</strong> Menghilangkan ubin abu-abu saat ukuran jendela berubah.</li>
                  <li><strong>Mini-Legend Khusus:</strong> Kategori warna SR tetap terlihat di kiri bawah saat layar penuh.</li>
                </ul>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-emerald-500/30">
                <div className="flex items-center gap-2 text-lime-300 font-bold mb-1">
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>Panel Filter 16 Variabel dengan Opsi "All"</span>
                </div>
                <p className="text-slate-300 mb-2">
                  Mendukung analisis komparatif dari skala makro konsesi hingga mikro per tapak:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'DAS / Sub-DAS',
                    'Blok',
                    'Petak',
                    'Periode Evaluasi',
                    'Lokasi Daerah',
                    'Koordinat UTM',
                    'Tahun Tanam',
                    'Kategori SR',
                    'Pengawas Lapangan',
                    'Persentase Hidup',
                    'Jarak Tanam',
                    'Jenis Tanaman',
                    'Suhu Lingkungan',
                    'Kelembaban Udara',
                    'Jenis Tanah',
                    'pH Tanah',
                  ].map((item, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-700/50 text-[11px]"
                    >
                      {idx + 1}. {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'matrix' && (
            <div className="space-y-3">
              <p>
                Penetapan kategori keberhasilan tanaman petak ukur mengacu pada regulasi baku mutu KLHK:
              </p>
              <div className="overflow-x-auto rounded-lg border border-slate-700">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-slate-800 text-slate-200">
                      <th className="p-2 border-b border-slate-700">Kategori</th>
                      <th className="p-2 border-b border-slate-700">Rentang SR</th>
                      <th className="p-2 border-b border-slate-700">Status Kelulusan</th>
                      <th className="p-2 border-b border-slate-700">Rekomendasi Silvikultur</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    <tr className="hover:bg-slate-800/40">
                      <td className="p-2 font-bold text-white flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-black border border-slate-600" />
                        Hitam
                      </td>
                      <td className="p-2 font-mono">0% – 40%</td>
                      <td className="p-2 text-rose-400 font-semibold">Sangat Kritis (Gagal)</td>
                      <td className="p-2">Penanaman ulang total (replanting), perbaikan drainase & piringan.</td>
                    </tr>
                    <tr className="hover:bg-slate-800/40">
                      <td className="p-2 font-bold text-rose-400 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                        Merah
                      </td>
                      <td className="p-2 font-mono">&gt;40% – &lt;75%</td>
                      <td className="p-2 text-amber-400 font-semibold">Kritis / Kurang</td>
                      <td className="p-2">Penyulaman intensif bibit tinggi &gt;50 cm, pembersihan gulma, pupuk NPK.</td>
                    </tr>
                    <tr className="hover:bg-slate-800/40">
                      <td className="p-2 font-bold text-amber-400 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        Kuning
                      </td>
                      <td className="p-2 font-mono">75% – 80%</td>
                      <td className="p-2 text-lime-400 font-semibold">Lulus Standar Minimal</td>
                      <td className="p-2">Penyulaman ringan pada lubang mati, pendangiran, pemupukan susulan.</td>
                    </tr>
                    <tr className="hover:bg-slate-800/40">
                      <td className="p-2 font-bold text-emerald-400 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        Hijau
                      </td>
                      <td className="p-2 font-mono">&gt;80% – 100%</td>
                      <td className="p-2 text-emerald-400 font-semibold">Sangat Baik (Prima)</td>
                      <td className="p-2">Pemeliharaan rutin, perlindungan dari kebakaran/hama, pengayaan jenis lokal.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'nfr' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-slate-800/70 border border-slate-700/60">
                  <h5 className="font-bold text-white mb-1">Arsitektur & Tech Stack</h5>
                  <p className="text-slate-300">
                    React 19 + Vite + TypeScript, Leaflet 1.9 dengan Esri World Imagery & Topo basemaps, Recharts,
                    Tailwind CSS v4, Express SSE untuk sync real-time, jsPDF untuk cetak laporan resmi.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/70 border border-slate-700/60">
                  <h5 className="font-bold text-white mb-1">Performa & Kecepatan</h5>
                  <p className="text-slate-300">
                    Pemuatan 437 titik marker dioptimasi dengan SVG/Canvas layer, rendering 60 FPS tanpa jeda saat zoom
                    dan pan, bundle server di-build dengan esbuild.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/70 border border-slate-700/60">
                  <h5 className="font-bold text-white mb-1">Integrasi Eksternal</h5>
                  <p className="text-slate-300">
                    Google Sheets API v4 untuk backup database cloud, parser Shapefile (.zip) & KML untuk boundary peta,
                    serta pembacaan lembar Excel (.xlsx).
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/70 border border-slate-700/60">
                  <h5 className="font-bold text-white mb-1">Keandalan Lapangan (Offline Mode)</h5>
                  <p className="text-slate-300">
                    Penyimpanan lokal pada browser memastikan tim survei lapangan tetap dapat melakukan sensus petak
                    ukur meskipun berada di titik blank spot tanpa koneksi seluler.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-900 px-6 py-3 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            File lokal juga dapat diakses langsung di folder <code className="text-lime-400">/public</code>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadDoc}
              className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
            >
              Unduh .DOC
            </button>
            <button
              onClick={handleDownloadPdf}
              className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
            >
              Unduh .PDF
            </button>
            <button
              onClick={onClose}
              className="px-3.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
