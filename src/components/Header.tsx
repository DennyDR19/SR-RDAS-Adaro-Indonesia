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
} from 'lucide-react';

interface HeaderProps {
  currentView: 'map' | 'analytics';
  onChangeView: (view: 'map' | 'analytics') => void;
  onOpenAddModal: () => void;
  onExportPdf: () => void;
  onOpenShareModal: () => void;
  onOpenNotifications: () => void;
  unreadNotifCount: number;
  isRealtimeConnected: boolean;
  activeClientsCount: number;
  onResetData: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onChangeView,
  onOpenAddModal,
  onExportPdf,
  onOpenShareModal,
  onOpenNotifications,
  unreadNotifCount,
  isRealtimeConnected,
  activeClientsCount,
  onResetData,
}) => {
  return (
    <header className="w-full bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-3 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Branding & Subtitle */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-lg shadow-emerald-950/50 shrink-0">
            <Map className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base md:text-lg font-black text-slate-100 tracking-tight">
                Peta Kinerja Rehabilitasi DAS
              </h1>
              {/* Realtime Live Indicator */}
              <div
                title={isRealtimeConnected ? 'Koneksi real-time aktif via SSE' : 'Mencoba menghubungkan kembali...'}
                className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-[10px] font-semibold"
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isRealtimeConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                  }`}
                />
                <span className={isRealtimeConnected ? 'text-emerald-400' : 'text-amber-400'}>
                  {isRealtimeConnected ? 'Real-Time Sync' : 'Menghubungkan'}
                </span>
                {activeClientsCount > 0 && (
                  <span className="text-slate-400 flex items-center gap-0.5 ml-0.5 pl-1 border-l border-slate-800">
                    <Users className="w-2.5 h-2.5" />
                    {activeClientsCount} tim
                  </span>
                )}
              </div>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Pemantauan Geospasial Survival Rate Petak Ukur (PU) &bull; Evaluasi Berkala Kehutanan
            </p>
          </div>
        </div>

        {/* Center/Right: View Switcher & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle: Peta vs Analitik */}
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1 text-xs">
            <button
              id="view-toggle-map-btn"
              onClick={() => onChangeView('map')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                currentView === 'map'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
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
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
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
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-emerald-950 transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ Input Nilai PU</span>
          </button>

          {/* Export PDF Button */}
          <button
            id="header-export-pdf-btn"
            onClick={onExportPdf}
            title="Download Laporan Format PDF Resmi"
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <FileDown className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Laporan PDF</span>
          </button>

          {/* Share Social & Team Button */}
          <button
            id="header-share-btn"
            onClick={onOpenShareModal}
            title="Bagikan Ringkasan ke Media Sosial & Tim"
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Bagikan</span>
          </button>

          {/* Notification Bell */}
          <button
            id="header-notifications-btn"
            onClick={onOpenNotifications}
            title="Buka Riwayat Notifikasi Otomatis"
            className="relative p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
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
              if (confirm('Reset seluruh data ke dataset standar acuan BPDAS?')) {
                onResetData();
              }
            }}
            title="Reset ke Data Sampel Default"
            className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
