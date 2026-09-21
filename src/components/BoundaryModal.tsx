import React, { useState, useRef } from 'react';
import {
  X,
  UploadCloud,
  FileCode,
  Layers,
  Eye,
  EyeOff,
  Trash2,
  Maximize2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Info,
  FolderArchive,
  RefreshCw,
  Palette,
} from 'lucide-react';
import { CustomBoundary } from '../types';
import {
  parseBoundaryFile,
  BOUNDARY_PALETTE,
  getSampleBoundaries,
} from '../utils/boundaryParser';

interface BoundaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  boundaries: CustomBoundary[];
  onAddBoundary: (boundary: CustomBoundary) => void;
  onUpdateBoundary: (updated: CustomBoundary) => void;
  onRemoveBoundary: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onFocusBoundary: (boundary: CustomBoundary) => void;
  onShowToast: (title: string, desc: string, type: 'success' | 'alert' | 'info') => void;
}

export const BoundaryModal: React.FC<BoundaryModalProps> = ({
  isOpen,
  onClose,
  boundaries,
  onAddBoundary,
  onUpdateBoundary,
  onRemoveBoundary,
  onToggleVisibility,
  onFocusBoundary,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'list'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customName, setCustomName] = useState<string>('');
  const [selectedPaletteIndex, setSelectedPaletteIndex] = useState<number>(0);
  const [opacity, setOpacity] = useState<number>(0.2);
  const [weight, setWeight] = useState<number>(2.5);
  const [dashArray, setDashArray] = useState<string>('5, 5');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    const validExts = ['zip', 'kml', 'kmz', 'geojson', 'json'];

    if (!ext || !validExts.includes(ext)) {
      onShowToast(
        'Format File Tidak Didukung',
        'Harap unggah Shapefile (.zip), KML (.kml), KMZ (.kmz), atau GeoJSON (.geojson).',
        'alert'
      );
      return;
    }

    setSelectedFile(file);
    const suggestedName = file.name
      .replace(/\.(zip|kml|kmz|geojson|json)$/i, '')
      .replace(/[-_]/g, ' ');
    setCustomName(suggestedName);

    // Pick a distinct palette color based on current boundary count
    const nextColorIndex = boundaries.length % BOUNDARY_PALETTE.length;
    setSelectedPaletteIndex(nextColorIndex);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleProcessUpload = async () => {
    if (!selectedFile) {
      onShowToast('Pilih File', 'Silakan pilih atau seret file SHP (.zip) atau KML terlebih dahulu.', 'info');
      return;
    }

    setIsProcessing(true);
    try {
      const palette = BOUNDARY_PALETTE[selectedPaletteIndex];
      const newBoundary = await parseBoundaryFile(selectedFile, customName, {
        color: palette.color,
        fill: palette.fill,
      });

      // Apply chosen styling
      newBoundary.fillOpacity = opacity;
      newBoundary.weight = weight;
      newBoundary.dashArray = dashArray;

      onAddBoundary(newBoundary);
      onShowToast(
        'Boundary Berhasil Ditambahkan',
        `Layer "${newBoundary.name}" (${newBoundary.featureCount} fitur) kini aktif di peta.`,
        'success'
      );

      // Reset upload form & switch to list tab
      setSelectedFile(null);
      setCustomName('');
      setActiveTab('list');
      onFocusBoundary(newBoundary);
    } catch (err: any) {
      console.error('Error uploading boundary:', err);
      onShowToast(
        'Gagal Membaca File Spasial',
        err.message || 'Terjadi kesalahan saat mengekstrak geometri layer.',
        'alert'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadSample = (sampleIndex: number) => {
    const samples = getSampleBoundaries();
    const sample = samples[sampleIndex];
    if (!sample) return;

    // Check if already loaded
    const exists = boundaries.some((b) => b.name === sample.name);
    if (exists) {
      onShowToast('Sampel Sudah Ada', `Layer "${sample.name}" sudah ada dalam daftar.`, 'info');
      setActiveTab('list');
      return;
    }

    onAddBoundary(sample);
    onShowToast(
      'Sampel Boundary Dimuat',
      `Layer "${sample.name}" berhasil ditambahkan ke peta.`,
      'success'
    );
    setActiveTab('list');
    onFocusBoundary(sample);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center text-white shadow-lg shadow-cyan-950/50">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
                Boundary & Delineasi Area Peta
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  SHP & KML
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Unggah Shapefile (.zip) atau KML untuk menampilkan batas petak ukur, blok RHL, & batas Sub-DAS
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 pt-2">
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'upload'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Unggah File Spasial</span>
          </button>

          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'list'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Daftar Boundary Aktif</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono">
              {boundaries.length}
            </span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[72vh] overflow-y-auto space-y-5">
          {activeTab === 'upload' ? (
            <div className="space-y-5">
              {/* Drag and drop upload zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center ${
                  isDragOver
                    ? 'border-cyan-400 bg-cyan-950/20 scale-[0.99]'
                    : selectedFile
                    ? 'border-emerald-500/60 bg-emerald-950/10'
                    : 'border-slate-700 bg-slate-950/40 hover:border-slate-500 hover:bg-slate-950/70'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".zip,.kml,.kmz,.geojson,.json"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFileSelect(e.target.files[0]);
                    }
                  }}
                />

                {selectedFile ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-100">{selectedFile.name}</div>
                      <div className="text-xs text-slate-400">
                        {(selectedFile.size / 1024).toFixed(1)} KB • Format:{' '}
                        <span className="uppercase text-emerald-400 font-mono font-semibold">
                          {selectedFile.name.split('.').pop()}
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] text-cyan-400 hover:underline mt-1">
                      Klik untuk mengganti file
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2.5">
                    <div className="w-12 h-12 rounded-xl bg-slate-800 text-cyan-400 border border-slate-700 flex items-center justify-center">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-200">
                        Klik atau seret file spasial ke sini
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        Mendukung: <b className="text-slate-300">Shapefile (.zip)</b>, <b className="text-slate-300">KML (.kml)</b>, <b className="text-slate-300">KMZ (.kmz)</b>, atau <b className="text-slate-300">GeoJSON</b>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 pt-1">
                      <FolderArchive className="w-3.5 h-3.5 text-amber-400" />
                      <span>Untuk Shapefile: arsipkan file (.shp, .shx, .dbf, .prj) ke dalam 1 file .ZIP</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Form Settings if file selected */}
              {selectedFile && (
                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-4 animate-in fade-in duration-150">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      Nama Layer Boundary
                    </label>
                    <input
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="Contoh: Batas Blok Penanaman RHL 2024"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  {/* Palette Selector */}
                  <div>
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-2">
                      <Palette className="w-3.5 h-3.5 text-cyan-400" />
                      Warna Garis & Arsiran
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {BOUNDARY_PALETTE.map((pal, idx) => (
                        <button
                          key={pal.name}
                          type="button"
                          onClick={() => setSelectedPaletteIndex(idx)}
                          className={`p-2 rounded-lg border text-left flex items-center gap-2 transition-all ${
                            selectedPaletteIndex === idx
                              ? 'border-cyan-400 bg-cyan-950/30'
                              : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                          }`}
                        >
                          <span
                            className="w-4 h-4 rounded-full border border-white/20 shrink-0"
                            style={{ backgroundColor: pal.color }}
                          />
                          <span className="text-[11px] font-medium text-slate-300 truncate">
                            {pal.name.split('/')[0]}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Opacity & Style Settings */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">
                        Transparansi Isian ({Math.round(opacity * 100)}%)
                      </label>
                      <input
                        type="range"
                        min="0.05"
                        max="0.6"
                        step="0.05"
                        value={opacity}
                        onChange={(e) => setOpacity(parseFloat(e.target.value))}
                        className="w-full accent-cyan-400 cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">
                        Ketebalan Garis ({weight}px)
                      </label>
                      <select
                        value={weight}
                        onChange={(e) => setWeight(parseFloat(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                      >
                        <option value="1.5">Tipis (1.5 px)</option>
                        <option value="2.5">Standar (2.5 px)</option>
                        <option value="4">Tebal (4 px)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">
                        Model Garis
                      </label>
                      <select
                        value={dashArray}
                        onChange={(e) => setDashArray(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                      >
                        <option value="none">Garis Penuh (Solid)</option>
                        <option value="5, 5">Putus-putus (Dashed)</option>
                        <option value="2, 6">Titik-titik (Dotted)</option>
                        <option value="8, 4, 2, 4">Dash-Dot (Batas Administrasi)</option>
                      </select>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="px-3.5 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-800 transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleProcessUpload}
                      disabled={isProcessing}
                      className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Mengekstrak Geometri Spasial...</span>
                        </>
                      ) : (
                        <>
                          <Layers className="w-3.5 h-3.5" />
                          <span>Tambahkan ke Peta</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Sample Preset Section */}
              <div className="p-4 bg-slate-950/40 border border-slate-800/80 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Belum Punya File SHP/KML? Coba Sampel Boundary:</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    onClick={() => handleLoadSample(0)}
                    className="p-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-xl text-left transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <div className="text-xs font-semibold text-emerald-300 group-hover:text-emerald-200">
                        Blok RHL Pasir Bintang
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Format KML • Poligon Blok Penanaman
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-slate-400 group-hover:text-cyan-400">
                      Muat +
                    </span>
                  </button>

                  <button
                    onClick={() => handleLoadSample(1)}
                    className="p-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-xl text-left transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <div className="text-xs font-semibold text-sky-300 group-hover:text-sky-200">
                        Delineasi Sub-DAS Cisangkuy
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Format SHP (.zip) • Wilayah Hidrologis
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-slate-400 group-hover:text-cyan-400">
                      Muat +
                    </span>
                  </button>
                </div>
              </div>

              {/* Informational Guidance Box */}
              <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl text-[11px] text-slate-400 space-y-1.5">
                <div className="flex items-center gap-1.5 font-semibold text-slate-300">
                  <Info className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Petunjuk Format File Spasial:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
                  <li>
                    <b className="text-slate-300">Shapefile (ESRI):</b> Simpan komponen <code className="text-cyan-300">.shp</code>, <code className="text-cyan-300">.shx</code>, <code className="text-cyan-300">.dbf</code>, dan <code className="text-cyan-300">.prj</code> dalam satu arsip ZIP.
                  </li>
                  <li>
                    <b className="text-slate-300">KML / KMZ:</b> File ekspor langsung dari Google Earth, ArcGIS, atau QGIS (format WGS84).
                  </li>
                  <li>
                    Layer boundary tersimpan secara lokal dan otomatis diproyeksikan di atas citra satelit dan sebaran Petak Ukur (PU).
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            /* TAB 2: LIST OF ACTIVE BOUNDARIES */
            <div className="space-y-4">
              {boundaries.length === 0 ? (
                <div className="py-12 px-4 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-950/40 space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 text-slate-500 mx-auto flex items-center justify-center">
                    <Layers className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-300">
                      Belum Ada Boundary Kustom
                    </h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                      Unggah file Shapefile (.zip) atau KML Anda untuk mulai menambahkan batas wilayah ke peta interaktif.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('upload')}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>Unggah File Sekarang</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
                    <span>
                      Total <b className="text-slate-200">{boundaries.length}</b> boundary area aktif
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Klik ikon mata untuk menampilkan/menyembunyikan
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {boundaries.map((b) => (
                      <div
                        key={b.id}
                        className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          b.visible
                            ? 'bg-slate-950/70 border-slate-700/80'
                            : 'bg-slate-950/30 border-slate-800 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {/* Toggle visibility */}
                          <button
                            onClick={() => onToggleVisibility(b.id)}
                            title={b.visible ? 'Sembunyikan dari Peta' : 'Tampilkan di Peta'}
                            className={`p-2 rounded-lg transition-colors ${
                              b.visible
                                ? 'bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20'
                                : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
                            }`}
                          >
                            {b.visible ? (
                              <Eye className="w-4 h-4" />
                            ) : (
                              <EyeOff className="w-4 h-4" />
                            )}
                          </button>

                          {/* Color bar */}
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0"
                            style={{ backgroundColor: b.color }}
                          />

                          <div>
                            <div className="text-xs font-bold text-slate-100 flex items-center gap-2">
                              <span>{b.name}</span>
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono uppercase bg-slate-800 text-slate-300">
                                {b.fileType}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                              <span>{b.fileName}</span>
                              <span>•</span>
                              <span>{b.featureCount} Fitur Geometri</span>
                            </div>
                          </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <button
                            onClick={() => {
                              onFocusBoundary(b);
                              onClose();
                            }}
                            title="Fokuskan Peta ke Area Ini (Zoom)"
                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-700"
                          >
                            <Maximize2 className="w-3 h-3 text-cyan-400" />
                            <span>Fokus</span>
                          </button>

                          <button
                            onClick={() => {
                              const confirmDel = window.confirm(
                                `Hapus layer boundary "${b.name}" dari peta?`
                              );
                              if (confirmDel) {
                                onRemoveBoundary(b.id);
                              }
                            }}
                            title="Hapus Layer Boundary"
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <button
                      onClick={() => setActiveTab('upload')}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
                    >
                      <UploadCloud className="w-3.5 h-3.5 text-cyan-400" />
                      <span>+ Tambah Boundary Baru</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Leaflet Spatial Boundary Engine</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium transition-colors border border-slate-700"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
