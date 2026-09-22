import React from 'react';
import {
  Map,
  BarChart3,
  PlusCircle,
  FileDown,
  Share2,
  Bell,
  Radio,
  Users,
  RotateCcw,
  Sparkles,
  FileSpreadsheet,
  Layers,
  HelpCircle,
  BookOpen,
} from 'lucide-react';

interface HeaderProps {
  currentView: 'map' | 'analytics';
  onChangeView: (view: 'map' | 'analytics') => void;
  onOpenAddModal: () => void;
  onOpenExcelImport?: () => void;
  onExportPdf: () => void;
  onOpenShareModal: () => void;
  onOpenNotifications: () => void;
  onOpenGoogleSheets: () => void;
  isGoogleSheetsConnected: boolean;
  unreadNotifCount: number;
  isRealtimeConnected: boolean;
  activeClientsCount: number;
  onResetData: () => void;
  onOpenBoundaryModal?: () => void;
  boundaryCount?: number;
  onOpenPrdModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onChangeView,
  onOpenAddModal,
  onOpenExcelImport,
  onExportPdf,
  onOpenShareModal,
  onOpenNotifications,
  onOpenGoogleSheets,
  isGoogleSheetsConnected,
  unreadNotifCount,
  isRealtimeConnected,
  activeClientsCount,
  onResetData,
  onOpenBoundaryModal,
  boundaryCount = 0,
  onOpenPrdModal,
}) => {
  return (
    <header className="w-full bg-[#063f35]/90 backdrop-blur-md border-b border-emerald-500/25 px-4 py-3 sticky top-0 z-50 shadow-lg shadow-black/20">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: App Title and Icon */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-lg shadow-emerald-950/50 shrink-0 border border-emerald-400/30">
            <Map className="w-5 h-5 text-lime-300" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base md:text-lg font-black text-white tracking-tight flex items-center gap-2">
                Peta Kinerja Rehabilitasi DAS PT Adaro Indonesia
              </h1>

              {/* Realtime Live Indicator */}
              <div
                title={isRealtimeConnected ? 'Koneksi real-time aktif via SSE' : 'Mencoba menghubungkan kembali...'}
                className="hidden lg:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#032922] border border-emerald-500/30 text-[10px] font-semibold"
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isRealtimeConnected ? 'bg-lime-400 animate-pulse' : 'bg-amber-400'
                  }`}
                />
                <span className={isRealtimeConnected ? 'text-lime-300' : 'text-amber-400'}>
                  {isRealtimeConnected ? 'Live Sync' : 'Menghubungkan'}
                </span>
                {activeClientsCount > 0 && (
                  <span className="text-emerald-300/80 flex items-center gap-0.5 ml-0.5 pl-1 border-l border-emerald-800/60">
                    <Users className="w-2.5 h-2.5" />
                    {activeClientsCount} tim
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 mt-0.5">
              <span className="w-6 h-1 bg-gradient-to-r from-lime-400 to-emerald-400 rounded-full" />
              <p className="text-[11px] text-emerald-200/90 font-medium">
                Sistem Evaluasi Geospasial Petak Ukur (PU) &bull; Survival Rate Keberhasilan Rehabilitasi DAS
              </p>
            </div>
          </div>
        </div>

        {/* Center/Right: View Switcher & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle: Peta vs Analitik */}
          <div className="bg-[#032e27] p-1 rounded-xl border border-emerald-500/30 flex items-center gap-1 text-xs">
            <button
              id="view-toggle-map-btn"
              onClick={() => onChangeView('map')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                currentView === 'map'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md border border-emerald-400/30'
                  : 'text-emerald-200 hover:text-white hover:bg-emerald-900/40'
              }`}
            >
              <Map className="w-3.5 h-3.5" />
              Peta GIS
            </button>
            <button
              id="view-toggle-analytics-btn"
              onClick={() => onChangeView('analytics')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                currentView === 'analytics'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md border border-emerald-400/30'
                  : 'text-emerald-200 hover:text-white hover:bg-emerald-900/40'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Dasbor Analitik
            </button>
          </div>

          {/* Input Data PU Button */}
          <button
            id="header-input-pu-btn"
            onClick={onOpenAddModal}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-950/60 border border-emerald-400/40 transition-all hover:scale-[1.02]"
          >
            <PlusCircle className="w-3.5 h-3.5 text-lime-300" />
            <span>+ Input Nilai PU</span>
          </button>

          {/* Import Excel PU Button */}
          {onOpenExcelImport && (
            <button
              id="header-import-excel-btn"
              onClick={onOpenExcelImport}
              title="Impor Database PU sekaligus dari File Excel (.xlsx / .csv)"
              className="px-3 py-1.5 rounded-xl bg-[#007a48] hover:bg-[#009650] text-white text-xs font-bold flex items-center gap-1.5 shadow-md border border-lime-400/30 transition-all hover:scale-[1.02]"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-lime-300" />
              <span>Impor Excel</span>
            </button>
          )}

          {/* Export PDF Button */}
          <button
            id="header-export-pdf-btn"
            onClick={onExportPdf}
            title="Download Laporan Format PDF Resmi"
            className="px-2.5 py-1.5 rounded-xl bg-[#04332b] hover:bg-[#06433a] text-emerald-100 text-xs font-medium border border-emerald-500/30 flex items-center gap-1.5 transition-colors"
          >
            <FileDown className="w-3.5 h-3.5 text-lime-300" />
            <span className="hidden sm:inline">Laporan PDF</span>
          </button>

          {/* Dokumen PRD (DOC & PDF) Button */}
          {onOpenPrdModal && (
            <button
              id="header-prd-btn"
              onClick={onOpenPrdModal}
              title="Lihat & Unduh Dokumen PRD (Format DOC / Word & PDF)"
              className="px-2.5 py-1.5 rounded-xl bg-[#04332b] hover:bg-[#06433a] text-emerald-100 text-xs font-medium border border-emerald-500/30 flex items-center gap-1.5 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5 text-lime-300" />
              <span className="hidden sm:inline">Dokumen PRD</span>
            </button>
          )}

          {/* Boundary Area SHP / KML Button */}
          {onOpenBoundaryModal && (
            <button
              id="header-boundary-btn"
              onClick={onOpenBoundaryModal}
              title="Unggah & Kelola Boundary Area Peta (SHP / KML)"
              className="px-2.5 py-1.5 rounded-xl bg-[#04332b] hover:bg-[#06433a] text-emerald-100 text-xs font-medium border border-emerald-500/30 flex items-center gap-1.5 transition-colors"
            >
              <Layers className="w-3.5 h-3.5 text-lime-300" />
              <span className="hidden sm:inline">Boundary Area</span>
              {boundaryCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-lime-500/20 text-lime-300 font-mono font-bold border border-lime-500/30">
                  {boundaryCount}
                </span>
              )}
            </button>
          )}

          {/* Google Sheets & Drive Backend Button */}
          <button
            id="header-gsheets-btn"
            onClick={onOpenGoogleSheets}
            title="Hubungkan & Sinkronkan ke Google Drive & Google Sheets"
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all shadow-sm ${
              isGoogleSheetsConnected
                ? 'bg-[#032e27] border-emerald-500/50 text-emerald-200 hover:bg-[#05453a]'
                : 'bg-emerald-600/25 hover:bg-emerald-600/40 text-emerald-200 border-emerald-400/40'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-300" />
            <span className="hidden xl:inline">Google Drive & Sheet</span>
            <span className="xl:hidden">Drive</span>
            {isGoogleSheetsConnected ? (
              <span className="w-2 h-2 rounded-full bg-lime-400" />
            ) : (
              <span className="px-1.5 py-0.2 rounded bg-lime-500/20 text-[10px] text-lime-300 border border-lime-500/30 font-bold">
                Hubungkan
              </span>
            )}
          </button>

          {/* Share Social & Team Button */}
          <button
            id="header-share-btn"
            onClick={onOpenShareModal}
            title="Bagikan Ringkasan ke Media Sosial & Tim"
            className="px-2.5 py-1.5 rounded-xl bg-[#04332b] hover:bg-[#06433a] text-emerald-100 text-xs font-medium border border-emerald-500/30 flex items-center gap-1.5 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5 text-lime-300" />
            <span className="hidden sm:inline">Bagikan</span>
          </button>

          {/* Notification Bell */}
          <button
            id="header-notifications-btn"
            onClick={onOpenNotifications}
            title="Buka Riwayat Notifikasi Otomatis"
            className="relative p-2 rounded-xl bg-[#04332b] hover:bg-[#06433a] text-emerald-200 border border-emerald-500/30 transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-bounce">
                {unreadNotifCount}
              </span>
            )}
          </button>

          {/* Reset sample data */}
          <button
            id="header-reset-btn"
            onClick={() => {
              if (confirm('Reset seluruh data ke dataset standar acuan BPDAS PT Adaro Indonesia?')) {
                onResetData();
              }
            }}
            title="Reset ke Data Sampel Default"
            className="p-2 rounded-xl bg-[#04332b]/60 hover:bg-[#04332b] text-emerald-400 hover:text-emerald-200 border border-emerald-500/20 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
