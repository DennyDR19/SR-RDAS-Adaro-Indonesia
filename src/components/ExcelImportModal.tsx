import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Download,
  X,
  Database,
  ArrowRight,
  Layers,
  MapPin,
  RefreshCw,
  Info
} from 'lucide-react';
import { PetakUkur } from '../types';
import {
  parseExcelDatabaseFile,
  generateExcelTemplate,
  ImportPreviewResult
} from '../utils/excelImporter';
import { CATEGORY_INFO_MAP } from '../utils/survivalHelper';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (importedData: PetakUkur[], mode: 'replace' | 'merge') => void;
  currentCount: number;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
  currentCount,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewResult, setPreviewResult] = useState<ImportPreviewResult | null>(null);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('replace');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (selectedFile: File) => {
    setErrorMsg(null);
    setFile(selectedFile);
    setLoading(true);

    try {
      const result = await parseExcelDatabaseFile(selectedFile);
      setPreviewResult(result);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memproses file Excel.');
      setPreviewResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (
        droppedFile.name.endsWith('.xlsx') ||
        droppedFile.name.endsWith('.xls') ||
        droppedFile.name.endsWith('.csv')
      ) {
        handleFileChange(droppedFile);
      } else {
        setErrorMsg('Format file tidak didukung. Harap upload file .xlsx, .xls, atau .csv.');
      }
    }
  };

  const handleExecuteImport = () => {
    if (!previewResult || previewResult.data.length === 0) return;
    setIsSubmitting(true);
    setTimeout(() => {
      onImportSuccess(previewResult.data, importMode);
      setIsSubmitting(false);
      onClose();
    }, 500);
  };

  const resetUpload = () => {
    setFile(null);
    setPreviewResult(null);
    setErrorMsg(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Stats calculation
  const stats = previewResult
    ? {
        total: previewResult.data.length,
        hijau: previewResult.data.filter((p) => p.kategori === 'hijau').length,
        kuning: previewResult.data.filter((p) => p.kategori === 'kuning').length,
        merah: previewResult.data.filter((p) => p.kategori === 'merah').length,
        hitam: previewResult.data.filter((p) => p.kategori === 'hitam').length,
        avgSr:
          previewResult.data.reduce((acc, p) => acc + (p.survivalRate || 0), 0) /
          (previewResult.data.length || 1),
      }
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#04332b] border border-emerald-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-500/25 bg-[#032e27]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-lime-400/20 border border-lime-400/40 rounded-xl text-lime-300">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Integrasi & Impor Database PU Excel
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-950 border border-lime-400/40 text-lime-300">
                  PT Adaro Indonesia
                </span>
              </h2>
              <p className="text-xs text-emerald-200/80">
                Otomatis membaca data PU, koordinat UTM (Zone M/S) & WGS84, persentase hidup, serta 21 parameter lapangan.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-emerald-300/80 hover:text-white hover:bg-emerald-900/40 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Quick Guide Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl">
            <div className="flex items-start gap-2.5">
              <Info className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-slate-300">
                <span className="font-semibold text-slate-100">Format Anda Langsung Didukung:</span> Kolom seperti{' '}
                <code className="text-cyan-300 bg-slate-800 px-1 py-0.5 rounded">No. PU</code>,{' '}
                <code className="text-cyan-300 bg-slate-800 px-1 py-0.5 rounded">Persentasi Hidup</code>,{' '}
                <code className="text-cyan-300 bg-slate-800 px-1 py-0.5 rounded">Koordinat (50M / 48M)</code>,{' '}
                <code className="text-cyan-300 bg-slate-800 px-1 py-0.5 rounded">DAS</code>,{' '}
                <code className="text-cyan-300 bg-slate-800 px-1 py-0.5 rounded">Blok</code>,{' '}
                <code className="text-cyan-300 bg-slate-800 px-1 py-0.5 rounded">Petak</code> otomatis dipetakan ke sistem.
              </div>
            </div>
            <button
              onClick={generateExcelTemplate}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-medium rounded-lg border border-slate-700 transition-colors whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              Unduh Format Contoh
            </button>
          </div>

          {/* Upload Area */}
          {!previewResult && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-emerald-400 bg-emerald-950/20'
                  : 'border-slate-700 hover:border-slate-500 bg-slate-950/40 hover:bg-slate-950/70'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
              />
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Upload className="w-8 h-8" />
              </div>
              <h3 className="text-base font-semibold text-slate-100 mb-1">
                Tarik & Lepas File Excel Database PU di Sini
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Mendukung file <strong className="text-slate-300">.xlsx</strong>,{' '}
                <strong className="text-slate-300">.xls</strong>, atau{' '}
                <strong className="text-slate-300">.csv</strong> (misal:{' '}
                <em className="text-cyan-300">03. DATABASE PU 2026_toGIS.xlsx</em>)
              </p>
              <button
                type="button"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-emerald-950/50 transition-all inline-flex items-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Pilih File dari Komputer
              </button>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="py-12 text-center">
              <RefreshCw className="w-8 h-8 mx-auto mb-3 text-cyan-400 animate-spin" />
              <p className="text-sm font-medium text-slate-200">Sedang membaca dan memetakan data Excel...</p>
              <p className="text-xs text-slate-400 mt-1">Mengonversi koordinat UTM & menghitung parameter silvikultur</p>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-4 bg-rose-950/40 border border-rose-800 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-rose-300">Gagal Membaca File</p>
                <p className="text-xs text-rose-400/90 mt-0.5">{errorMsg}</p>
                <button
                  onClick={resetUpload}
                  className="mt-2 text-xs font-semibold text-rose-300 hover:underline"
                >
                  Coba pilih file lain
                </button>
              </div>
            </div>
          )}

          {/* Preview State */}
          {previewResult && stats && (
            <div className="space-y-5">
              {/* File Info & Stats Card */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80 mb-3">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <div>
                      <div className="text-sm font-bold text-slate-100 flex items-center gap-2">
                        {previewResult.fileName}
                        <span className="text-[11px] font-normal px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                          {stats.total} Data PU Terdeteksi
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Rata-rata Survival Rate: <span className="font-semibold text-slate-200">{stats.avgSr.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={resetUpload}
                    className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 transition-colors self-start sm:self-auto"
                  >
                    Ganti File
                  </button>
                </div>

                {/* Category Count Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-center">
                    <div className="text-[11px] text-emerald-400 font-medium">Hijau (&gt;80%)</div>
                    <div className="text-base font-bold text-emerald-300">{stats.hijau} PU</div>
                  </div>
                  <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-800/60 text-center">
                    <div className="text-[11px] text-amber-400 font-medium">Kuning (75-80%)</div>
                    <div className="text-base font-bold text-amber-300">{stats.kuning} PU</div>
                  </div>
                  <div className="p-2 rounded-lg bg-rose-950/40 border border-rose-800/60 text-center">
                    <div className="text-[11px] text-rose-400 font-medium">Merah (&gt;40-&lt;75%)</div>
                    <div className="text-base font-bold text-rose-300">{stats.merah} PU</div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-700 text-center">
                    <div className="text-[11px] text-slate-400 font-medium">Hitam (0-40%)</div>
                    <div className="text-base font-bold text-slate-200">{stats.hitam} PU</div>
                  </div>
                </div>
              </div>

              {/* Table Preview (Top 5 rows) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Pratinjau Data (5 Baris Pertama)
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Menampilkan 5 dari {previewResult.data.length} baris
                  </span>
                </div>
                <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950/60">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 text-[11px]">
                      <tr>
                        <th className="py-2.5 px-3">Kode PU</th>
                        <th className="py-2.5 px-3">DAS / Blok</th>
                        <th className="py-2.5 px-3">Petak / Lokasi</th>
                        <th className="py-2.5 px-3">Koordinat (UTM)</th>
                        <th className="py-2.5 px-3 text-center">Persentase</th>
                        <th className="py-2.5 px-3 text-center">Kategori</th>
                        <th className="py-2.5 px-3">Jenis Tanaman</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {previewResult.data.slice(0, 5).map((pu, i) => {
                        const cat = CATEGORY_INFO_MAP[pu.kategori];
                        return (
                          <tr key={i} className="hover:bg-slate-800/30">
                            <td className="py-2.5 px-3 font-bold text-cyan-400 whitespace-nowrap">
                              {pu.kodePU}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-medium text-slate-200">{pu.blok}</div>
                              <div className="text-[10px] text-slate-400">{pu.das}</div>
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="text-slate-200">{pu.petak}</div>
                              <div className="text-[10px] text-slate-400 max-w-[120px] truncate">
                                {pu.lokasiDaerah}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <div className="font-mono text-[11px] text-slate-300 flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                                {pu.koordinatUtm || `${pu.latitude.toFixed(4)}, ${pu.longitude.toFixed(4)}`}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold text-sm" style={{ color: cat.colorHex }}>
                              {pu.survivalRate}%
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span
                                className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                                style={{
                                  backgroundColor: `${cat.colorHex}22`,
                                  color: cat.colorHex,
                                  border: `1px solid ${cat.colorHex}55`,
                                }}
                              >
                                {cat.name}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-300 max-w-[150px] truncate text-[11px]">
                              {pu.jenisTanaman.join(', ')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Import Mode Selection */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <label className="text-xs font-semibold text-slate-200 block">
                  Metode Integrasi ke Database Web:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setImportMode('replace')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      importMode === 'replace'
                        ? 'bg-cyan-950/40 border-cyan-500 shadow-md shadow-cyan-950/30'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-slate-100 font-semibold text-xs mb-1">
                      <input
                        type="radio"
                        checked={importMode === 'replace'}
                        onChange={() => setImportMode('replace')}
                        className="text-cyan-500 focus:ring-cyan-500"
                      />
                      <span>Gantikan Seluruh Database (Rekomendasi)</span>
                    </div>
                    <p className="text-[11px] text-slate-400 pl-5 leading-relaxed">
                      Menghapus {currentCount} data dummy/sebelumnya dan menggantinya penuh dengan {previewResult.data.length} data PU dari Excel Anda.
                    </p>
                  </div>

                  <div
                    onClick={() => setImportMode('merge')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      importMode === 'merge'
                        ? 'bg-cyan-950/40 border-cyan-500 shadow-md shadow-cyan-950/30'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-slate-100 font-semibold text-xs mb-1">
                      <input
                        type="radio"
                        checked={importMode === 'merge'}
                        onChange={() => setImportMode('merge')}
                        className="text-cyan-500 focus:ring-cyan-500"
                      />
                      <span>Gabungkan dengan Data yang Ada (Merge)</span>
                    </div>
                    <p className="text-[11px] text-slate-400 pl-5 leading-relaxed">
                      Menambahkan data baru dan memperbarui data yang memiliki nomor/kode PU yang sama.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-emerald-500/25 bg-[#032e27]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-emerald-300/80 hover:text-white transition-colors"
          >
            Batal
          </button>

          {previewResult && (
            <button
              onClick={handleExecuteImport}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-black/40 border border-lime-400/40 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Mengimpor ke Sistem...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4 text-lime-300" />
                  Impor {previewResult.data.length} Data PU ke Web Sekarang
                  <ArrowRight className="w-4 h-4 ml-1 text-lime-300" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
