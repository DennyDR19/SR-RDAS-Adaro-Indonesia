import React, { useState, useEffect, useCallback } from 'react';
import { PetakUkur, AppNotification, CustomBoundary } from './types';
import { ApiService } from './services/apiService';
import { computeDasMetrics } from './utils/survivalHelper';
import { exportDasReportPdf } from './utils/pdfGenerator';
import { Header } from './components/Header';
import { DasMap } from './components/DasMap';
import { LegendWidget } from './components/LegendWidget';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { PuDetailModal } from './components/PuDetailModal';
import { PuFormModal } from './components/PuFormModal';
import { NotificationDrawer } from './components/NotificationDrawer';
import { ShareModal } from './components/ShareModal';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { BoundaryModal } from './components/BoundaryModal';
import { GoogleSheetsBackend } from './services/googleSheetsBackend';
import { getAccessToken } from './services/googleSheetsDirectService';
import {
  getSavedBoundaries,
  saveBoundaries,
  getSampleBoundaries,
} from './utils/boundaryParser';
import {
  Search,
  Filter,
  Layers,
  MapPin,
  TrendingUp,
  AlertCircle,
  Bell,
  CheckCircle2,
  X,
  Radio,
  FileDown,
} from 'lucide-react';

export default function App() {
  const [puList, setPuList] = useState<PetakUkur[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [selectedPu, setSelectedPu] = useState<PetakUkur | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [editingPu, setEditingPu] = useState<PetakUkur | null>(null);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [isGoogleSheetsModalOpen, setIsGoogleSheetsModalOpen] = useState<boolean>(false);
  const [isBoundaryModalOpen, setIsBoundaryModalOpen] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<'map' | 'analytics'>('map');

  // Custom Map Area Boundaries (SHP / KML)
  const [boundaries, setBoundaries] = useState<CustomBoundary[]>(() => {
    const saved = getSavedBoundaries();
    if (saved && saved.length > 0) return saved;
    return getSampleBoundaries();
  });
  const [focusedBoundary, setFocusedBoundary] = useState<CustomBoundary | null>(null);

  // Filters
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [activeSubDasFilter, setActiveSubDasFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Real-time synchronization state
  const [isRealtimeConnected, setIsRealtimeConnected] = useState<boolean>(false);
  const [activeClientsCount, setActiveClientsCount] = useState<number>(1);
  const [toastMessage, setToastMessage] = useState<{ title: string; desc: string; type: string } | null>(null);

  // Load initial data
  const loadData = useCallback(async () => {
    try {
      const [list, notifs] = await Promise.all([
        ApiService.getPetakUkurList(),
        ApiService.getNotifications(),
      ]);
      setPuList(list);
      setNotifications(notifs);
    } catch (err) {
      console.error('Error fetching initial data:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Connect Real-Time SSE (Server-Sent Events) for multi-user synchronization
  useEffect(() => {
    let eventSource: EventSource | null = null;

    try {
      eventSource = new EventSource('/api/events');

      eventSource.onopen = () => {
        setIsRealtimeConnected(true);
      };

      // Handle presence
      eventSource.addEventListener('presence', (event: any) => {
        try {
          const data = JSON.parse(event.data);
          if (typeof data.activeClients === 'number') {
            setActiveClientsCount(data.activeClients);
          }
        } catch {}
      });

      // Handle newly created PU
      eventSource.addEventListener('pu_created', (event: any) => {
        try {
          const data = JSON.parse(event.data);
          if (data.pu) {
            setPuList((prev) => {
              const exists = prev.some((p) => p.id === data.pu.id);
              if (exists) return prev;
              return [data.pu, ...prev];
            });

            if (data.notification) {
              setNotifications((prev) => [data.notification, ...prev]);
              setToastMessage({
                title: data.notification.title,
                desc: data.notification.message,
                type: data.notification.type,
              });
            }
          }
        } catch (e) {
          console.error('Error parsing pu_created event:', e);
        }
      });

      // Handle updated PU
      eventSource.addEventListener('pu_updated', (event: any) => {
        try {
          const data = JSON.parse(event.data);
          if (data.pu) {
            setPuList((prev) =>
              prev.map((item) => (item.id === data.pu.id ? data.pu : item))
            );
            if (data.notification) {
              setNotifications((prev) => [data.notification, ...prev]);
              setToastMessage({
                title: data.notification.title,
                desc: data.notification.message,
                type: data.notification.type,
              });
            }
          }
        } catch (e) {
          console.error('Error parsing pu_updated event:', e);
        }
      });

      // Handle deleted PU
      eventSource.addEventListener('pu_deleted', (event: any) => {
        try {
          const data = JSON.parse(event.data);
          if (data.id) {
            setPuList((prev) => prev.filter((item) => item.id !== data.id));
            if (data.notification) {
              setNotifications((prev) => [data.notification, ...prev]);
            }
          }
        } catch (e) {
          console.error('Error parsing pu_deleted event:', e);
        }
      });

      // Handle reset event
      eventSource.addEventListener('pu_reset', (event: any) => {
        try {
          const data = JSON.parse(event.data);
          if (data.data) {
            setPuList(data.data);
          }
          if (data.notifications) {
            setNotifications(data.notifications);
          }
        } catch (e) {
          console.error('Error parsing pu_reset event:', e);
        }
      });

      eventSource.onerror = () => {
        setIsRealtimeConnected(false);
      };
    } catch (err) {
      console.warn('SSE not available in environment, using client state:', err);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Compute metrics
  const metrics = computeDasMetrics(puList);

  // Filtered list based on search and filters
  const filteredPuList = puList.filter((pu) => {
    if (activeCategoryFilter !== 'all' && pu.kategori !== activeCategoryFilter) return false;
    if (activeSubDasFilter !== 'all' && pu.subDas !== activeSubDasFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        pu.kodePU.toLowerCase().includes(q) ||
        pu.blok.toLowerCase().includes(q) ||
        (pu.das || pu.subDas || '').toLowerCase().includes(q) ||
        (pu.lokasiDaerah || pu.desa || '').toLowerCase().includes(q) ||
        (pu.petak || '').toLowerCase().includes(q) ||
        pu.jenisTanaman.some((j) => j.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Action handlers
  const handleOpenAddModal = () => {
    setEditingPu(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (pu: PetakUkur) => {
    setEditingPu(pu);
    setIsFormModalOpen(true);
  };

  const handleSavePu = async (data: Partial<PetakUkur>) => {
    if (editingPu) {
      const result = await ApiService.updatePetakUkur(editingPu.id, data);
      setPuList((prev) => prev.map((item) => (item.id === editingPu.id ? result.pu : item)));
      if (result.notification) {
        setNotifications((prev) => [result.notification!, ...prev]);
      }
    } else {
      const result = await ApiService.createPetakUkur(data);
      setPuList((prev) => [result.pu, ...prev]);
      if (result.notification) {
        setNotifications((prev) => [result.notification!, ...prev]);
      }
    }
  };

  const handleDeletePu = async (id: string) => {
    try {
      await ApiService.deletePetakUkur(id);
      setPuList((prev) => prev.filter((p) => p.id !== id));
      if (selectedPu?.id === id) {
        setSelectedPu(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetData = async () => {
    try {
      const resetList = await ApiService.resetData();
      setPuList(resetList);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkNotifRead = (id: string) => {
    ApiService.markNotificationRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const handleMarkAllNotifRead = () => {
    ApiService.markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleSelectPuFromNotif = (puId: string) => {
    const pu = puList.find((p) => p.id === puId);
    if (pu) {
      setSelectedPu(pu);
      setIsDetailModalOpen(true);
      setCurrentView('map');
    }
  };

  // Custom Boundary Handlers
  const handleAddBoundary = (boundary: CustomBoundary) => {
    setBoundaries((prev) => {
      const updated = [boundary, ...prev];
      saveBoundaries(updated);
      return updated;
    });
    setFocusedBoundary(boundary);
  };

  const handleUpdateBoundary = (updated: CustomBoundary) => {
    setBoundaries((prev) => {
      const next = prev.map((b) => (b.id === updated.id ? updated : b));
      saveBoundaries(next);
      return next;
    });
  };

  const handleRemoveBoundary = (id: string) => {
    setBoundaries((prev) => {
      const next = prev.filter((b) => b.id !== id);
      saveBoundaries(next);
      return next;
    });
  };

  const handleToggleBoundaryVisibility = (id: string) => {
    setBoundaries((prev) => {
      const next = prev.map((b) => (b.id === id ? { ...b, visible: !b.visible } : b));
      saveBoundaries(next);
      return next;
    });
  };

  const handleFocusBoundary = (b: CustomBoundary) => {
    setFocusedBoundary(b);
    setCurrentView('map');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Main Navigation Header */}
      <Header
        currentView={currentView}
        onChangeView={setCurrentView}
        onOpenAddModal={handleOpenAddModal}
        onExportPdf={() => exportDasReportPdf(puList)}
        onOpenShareModal={() => setIsShareModalOpen(true)}
        onOpenNotifications={() => setIsNotificationDrawerOpen(true)}
        onOpenGoogleSheets={() => setIsGoogleSheetsModalOpen(true)}
        isGoogleSheetsConnected={Boolean(getAccessToken() || GoogleSheetsBackend.isConnected())}
        unreadNotifCount={notifications.filter((n) => !n.isRead).length}
        isRealtimeConnected={isRealtimeConnected}
        activeClientsCount={activeClientsCount}
        onResetData={handleResetData}
        onOpenBoundaryModal={() => setIsBoundaryModalOpen(true)}
        boundaryCount={boundaries.length}
      />

      {/* Real-time Floating Toast Alert Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[1200] max-w-md bg-slate-900 border border-cyan-500/50 p-4 rounded-xl shadow-2xl animate-fade-in flex items-start gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 shrink-0 mt-0.5">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-slate-100 text-xs truncate">{toastMessage.title}</span>
              <button
                onClick={() => setToastMessage(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-slate-300 text-[11px] mt-0.5">{toastMessage.desc}</p>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 flex flex-col gap-4">
        {/* Quick KPI Bar on Map View */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Rata-Rata SR</span>
              <span
                className="text-xl font-black"
                style={{
                  color:
                    metrics.rataRataSurvivalRate >= 80
                      ? '#22c55e'
                      : metrics.rataRataSurvivalRate >= 75
                      ? '#eab308'
                      : metrics.rataRataSurvivalRate > 40
                      ? '#ef4444'
                      : '#94a3b8',
                }}
              >
                {metrics.rataRataSurvivalRate}%
              </span>
            </div>
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>

          <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Petak Ukur (PU)</span>
              <span className="text-xl font-black text-slate-100">{metrics.totalPU} Titik</span>
            </div>
            <MapPin className="w-5 h-5 text-cyan-400" />
          </div>

          <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Lolos Standar (≥75%)</span>
              <span className="text-xl font-black text-emerald-400">{metrics.persentaseLulusStandar}%</span>
            </div>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>

          <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Kebutuhan Sulam</span>
              <span className="text-xl font-black text-rose-400">
                {metrics.totalKebutuhanSulam.toLocaleString()} btg
              </span>
            </div>
            <AlertCircle className="w-5 h-5 text-rose-400" />
          </div>
        </div>

        {/* View 1: Peta Kinerja Geospasial */}
        {currentView === 'map' && (
          <div className="flex-1 flex flex-col gap-4">
            {/* Map Search & Filter Bar */}
            <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
                {/* Search */}
                <div className="relative flex-1 min-w-[180px]">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="map-search-input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari Kode PU (misal PU-01), Blok, Desa, atau Jenis..."
                    className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-cyan-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Sub-DAS Filter */}
                <div className="flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                  <select
                    id="subdas-filter-select"
                    value={activeSubDasFilter}
                    onChange={(e) => setActiveSubDasFilter(e.target.value)}
                    className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="all">Semua Sub-DAS</option>
                    {metrics.distribusiSubDas.map((s) => (
                      <option key={s.subDas} value={s.subDas}>
                        {s.subDas}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action buttons inside filter bar */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-mono">
                  Menampilkan: <strong>{filteredPuList.length}</strong> / {metrics.totalPU} PU
                </span>
              </div>
            </div>

            {/* Interactive Leaflet GIS Map */}
            <div className="w-full h-[520px] md:h-[620px] relative">
              <DasMap
                puList={filteredPuList}
                selectedPuId={selectedPu ? selectedPu.id : null}
                onSelectPu={(pu) => setSelectedPu(pu)}
                onOpenDetail={(pu) => {
                  setSelectedPu(pu);
                  setIsDetailModalOpen(true);
                }}
                activeCategoryFilter={activeCategoryFilter}
                activeSubDasFilter={activeSubDasFilter}
                customBoundaries={boundaries}
                onOpenBoundaryModal={() => setIsBoundaryModalOpen(true)}
                focusedBoundary={focusedBoundary}
              />
            </div>

            {/* Criteria Legend & Quick Filter Widget */}
            <LegendWidget
              activeCategoryFilter={activeCategoryFilter}
              onSelectCategoryFilter={setActiveCategoryFilter}
              countByKategori={metrics.countByKategori}
              totalPU={metrics.totalPU}
            />
          </div>
        )}

        {/* View 2: Dasbor Analitik Kinerja Mendalam */}
        {currentView === 'analytics' && (
          <AnalyticsDashboard
            puList={puList}
            onSelectPu={(pu) => setSelectedPu(pu)}
            onOpenDetail={(pu) => {
              setSelectedPu(pu);
              setIsDetailModalOpen(true);
            }}
          />
        )}
      </main>

      {/* Modal 1: Detail Petak Ukur (PU) */}
      <PuDetailModal
        pu={selectedPu}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onEdit={(pu) => handleOpenEditModal(pu)}
        onDelete={(id) => handleDeletePu(id)}
      />

      {/* Modal 2: Form Input / Update PU with Auto-Validation */}
      <PuFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSavePu}
        initialData={editingPu}
      />

      {/* Modal 3: Share Summary to Social Media & Team */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        puList={puList}
      />

      {/* Drawer 4: Automatic Notifications Drawer */}
      <NotificationDrawer
        isOpen={isNotificationDrawerOpen}
        onClose={() => setIsNotificationDrawerOpen(false)}
        notifications={notifications}
        onMarkRead={handleMarkNotifRead}
        onMarkAllRead={handleMarkAllNotifRead}
        onSelectPuFromNotif={handleSelectPuFromNotif}
      />

      {/* Modal 5: Google Sheets Backend Database Integration */}
      <GoogleSheetsModal
        isOpen={isGoogleSheetsModalOpen}
        onClose={() => setIsGoogleSheetsModalOpen(false)}
        puList={puList}
        onDataLoaded={(newList) => setPuList(newList)}
        onShowToast={(title, desc, type) => {
          setToastMessage({ title, desc, type });
        }}
      />

      {/* Modal 6: Boundary Map Area (SHP / KML) Upload & Management */}
      <BoundaryModal
        isOpen={isBoundaryModalOpen}
        onClose={() => setIsBoundaryModalOpen(false)}
        boundaries={boundaries}
        onAddBoundary={handleAddBoundary}
        onUpdateBoundary={handleUpdateBoundary}
        onRemoveBoundary={handleRemoveBoundary}
        onToggleVisibility={handleToggleBoundaryVisibility}
        onFocusBoundary={handleFocusBoundary}
        onShowToast={(title, desc, type) => {
          setToastMessage({ title, desc, type });
        }}
      />
    </div>
  );
}
