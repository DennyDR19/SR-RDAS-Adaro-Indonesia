import React, { useState, useMemo, useEffect } from 'react';
import { PetakUkur } from '../types';
import { computeDasMetrics, CATEGORY_INFO_MAP } from '../utils/survivalHelper';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  TreeDeciduous,
  Leaf,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Search,
  FileSpreadsheet,
  Calendar,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Clock,
  Filter,
  Trash2,
  AlertOctagon,
  CheckSquare,
  Square,
  MinusSquare,
  ChevronDown,
  RotateCcw,
} from 'lucide-react';

export type SortField =
  | 'updatedAt'
  | 'survivalRate'
  | 'kebutuhanPenyulaman'
  | 'kodePU'
  | 'blok'
  | 'tanggalEvaluasi';

export type SortOrder = 'asc' | 'desc';

interface AnalyticsDashboardProps {
  puList: PetakUkur[];
  allPuList?: PetakUkur[];
  onSelectPu: (pu: PetakUkur) => void;
  onOpenDetail: (pu: PetakUkur) => void;
  onOpenExcelImport?: () => void;
  onDeletePu?: (id: string) => Promise<void> | void;
  onBulkDeletePu?: (ids: string[]) => Promise<void> | void;
  onClearAllPu?: () => Promise<void> | void;
  onResetData?: () => Promise<void> | void;
  activeFilterCount?: number;
  onResetFilters?: () => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  puList,
  allPuList,
  onSelectPu,
  onOpenDetail,
  onOpenExcelImport,
  onDeletePu,
  onBulkDeletePu,
  onClearAllPu,
  onResetData,
  activeFilterCount = 0,
  onResetFilters,
}) => {
  const metrics = computeDasMetrics(puList);
  const totalOverall = allPuList?.length || puList.length;
  const isFiltered = activeFilterCount > 0 || (allPuList && puList.length < allPuList.length);
  const [selectedSubDas, setSelectedSubDas] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Fitur "Urut Berdasarkan"
  const [sortField, setSortField] = useState<SortField>('updatedAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // 1. Data for Donut Chart (Distribution by 4 user criteria)
  const donutData = [
    {
      name: '0 - 40% (Hitam)',
      value: metrics.countByKategori.hitam,
      color: '#0f172a',
      stroke: '#94a3b8',
      desc: 'Kritis / Wajib Sulam 100%',
    },
    {
      name: '>40 - <75% (Merah)',
      value: metrics.countByKategori.merah,
      color: '#ef4444',
      stroke: '#dc2626',
      desc: 'Kurang / Perlu Sulam Intensif',
    },
    {
      name: '75 - 80% (Kuning)',
      value: metrics.countByKategori.kuning,
      color: '#eab308',
      stroke: '#ca8a04',
      desc: 'Sedang / Standar Minimal',
    },
    {
      name: '>80% (Hijau)',
      value: metrics.countByKategori.hijau,
      color: '#22c55e',
      stroke: '#16a34a',
      desc: 'Baik / Berhasil Sempurna',
    },
  ].filter((d) => d.value > 0);

  // 2. Adaptive Data for Bar Chart: Average SR per Sub-DAS or per Blok if filtered to single area
  const isSingleArea = metrics.distribusiSubDas.length <= 1;
  let subDasChartData: any[] = [];
  let barChartTitle = 'Performa Rata-Rata Survival Rate per Sub-DAS';

  if (isSingleArea && puList.length > 0) {
    const blokMap = new Map<string, { awal: number; hidup: number; count: number }>();
    for (const p of puList) {
      const b = p.blok || 'Blok Terpilih';
      const cur = blokMap.get(b) || { awal: 0, hidup: 0, count: 0 };
      const awal = p.tanamanAwal || 50;
      const hidup = p.tanamanHidup !== undefined ? p.tanamanHidup : Math.round(((p.survivalRate || 0) / 100) * awal);
      blokMap.set(b, { awal: cur.awal + awal, hidup: cur.hidup + hidup, count: cur.count + 1 });
    }
    subDasChartData = Array.from(blokMap.entries()).map(([blokName, stat]) => ({
      name: blokName,
      fullName: `Blok ${blokName}`,
      rataRataSR: stat.awal > 0 ? Math.round((stat.hidup / stat.awal) * 1000) / 10 : 0,
      totalPU: stat.count,
      pohonHidup: stat.hidup,
      pohonAwal: stat.awal,
      kebutuhanSulam: Math.max(0, stat.awal - stat.hidup),
    }));
    barChartTitle = 'Performa Rata-Rata Survival Rate per Blok';
  } else {
    subDasChartData = metrics.distribusiSubDas.map((d) => ({
      name: d.subDas.replace('Sub-DAS ', ''),
      fullName: d.subDas,
      rataRataSR: d.rataRataSR,
      totalPU: d.totalPU,
      pohonHidup: d.pohonHidup,
      pohonAwal: d.pohonAwal,
      kebutuhanSulam: Math.max(0, d.pohonAwal - d.pohonHidup),
    }));
  }

  // 3. Filtered PU table
  const filteredPuList = puList.filter((pu) => {
    if (selectedSubDas !== 'all' && (pu.das || pu.subDas) !== selectedSubDas) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        pu.kodePU.toLowerCase().includes(q) ||
        pu.blok.toLowerCase().includes(q) ||
        (pu.lokasiDaerah || pu.desa || '').toLowerCase().includes(q) ||
        (pu.das || pu.subDas || '').toLowerCase().includes(q) ||
        pu.jenisTanaman.some((j) => j.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Handler untuk mengubah pengurutan dari dropdown "Urut Berdasarkan"
  const handleSortSelect = (value: string) => {
    const [field, order] = value.split('-') as [SortField, SortOrder];
    setSortField(field);
    setSortOrder(order);
  };

  // Handler untuk mengubah pengurutan dengan klik header kolom
  const handleHeaderClick = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder(field === 'kodePU' || field === 'blok' ? 'asc' : 'desc');
    }
  };

  // Helper format tanggal data terinput ke web
  const formatTanggalInput = (pu: PetakUkur): { dateStr: string; timeStr: string } => {
    const raw = pu.tanggalInput || pu.tanggalTerinput || pu.updatedAt || pu.tanggalEvaluasi;
    if (!raw) return { dateStr: '-', timeStr: '' };
    try {
      const d = new Date(raw);
      if (!isNaN(d.getTime())) {
        const dateStr = d.toLocaleDateString('id-ID', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
        const hasTime = raw.includes('T') || raw.includes(':');
        const timeStr = hasTime
          ? d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'
          : 'Web Entry';
        return { dateStr, timeStr };
      }
    } catch {
      // fallback
    }
    return { dateStr: raw, timeStr: 'Web Entry' };
  };

  // 4. Sorted PU table berdasarkan pilihan user
  const sortedPuList = useMemo(() => {
    const list = [...filteredPuList];
    list.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'updatedAt') {
        const dateA = new Date(a.tanggalInput || a.tanggalTerinput || a.updatedAt || a.tanggalEvaluasi || 0).getTime();
        const dateB = new Date(b.tanggalInput || b.tanggalTerinput || b.updatedAt || b.tanggalEvaluasi || 0).getTime();
        cmp = dateA - dateB;
      } else if (sortField === 'survivalRate') {
        const srA = a.persentaseHidup !== undefined ? a.persentaseHidup : (a.survivalRate || 0);
        const srB = b.persentaseHidup !== undefined ? b.persentaseHidup : (b.survivalRate || 0);
        cmp = srA - srB;
      } else if (sortField === 'kebutuhanPenyulaman') {
        const awalA = a.tanamanAwal || 50;
        const hidupA = a.tanamanHidup !== undefined ? a.tanamanHidup : Math.round(((a.survivalRate || 0) / 100) * awalA);
        const sulamA = a.kebutuhanPenyulaman !== undefined ? a.kebutuhanPenyulaman : Math.max(0, awalA - hidupA);

        const awalB = b.tanamanAwal || 50;
        const hidupB = b.tanamanHidup !== undefined ? b.tanamanHidup : Math.round(((b.survivalRate || 0) / 100) * awalB);
        const sulamB = b.kebutuhanPenyulaman !== undefined ? b.kebutuhanPenyulaman : Math.max(0, awalB - hidupB);

        cmp = sulamA - sulamB;
      } else if (sortField === 'kodePU') {
        cmp = a.kodePU.localeCompare(b.kodePU, undefined, { numeric: true, sensitivity: 'base' });
      } else if (sortField === 'blok') {
        const locA = `${a.blok || ''} ${a.das || a.subDas || ''}`;
        const locB = `${b.blok || ''} ${b.das || b.subDas || ''}`;
        cmp = locA.localeCompare(locB);
      } else if (sortField === 'tanggalEvaluasi') {
        const dateA = new Date(a.tanggalEvaluasi || 0).getTime();
        const dateB = new Date(b.tanggalEvaluasi || 0).getTime();
        cmp = dateA - dateB;
      }

      return sortOrder === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [filteredPuList, sortField, sortOrder]);

  // State for Multi-Select & Bulk Deletion
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [confirmDeleteModal, setConfirmDeleteModal] = useState<{
    isOpen: boolean;
    mode: 'selected' | 'filtered' | 'all' | 'single';
    targetIds: string[];
    targetCode?: string;
  } | null>(null);
  const [isDeleteMenuOpen, setIsDeleteMenuOpen] = useState<boolean>(false);

  // Synchronize selectedIds when puList updates
  useEffect(() => {
    setSelectedIds((prev) => {
      if (prev.size === 0) return prev;
      const currentIds = new Set(puList.map((p) => p.id));
      let changed = false;
      const next = new Set<string>();
      for (const id of prev) {
        if (currentIds.has(id)) {
          next.add(id);
        } else {
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [puList]);

  const isAllSelected =
    sortedPuList.length > 0 && sortedPuList.every((p) => selectedIds.has(p.id));
  const isSomeSelected =
    sortedPuList.some((p) => selectedIds.has(p.id)) && !isAllSelected;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        sortedPuList.forEach((p) => next.delete(p.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        sortedPuList.forEach((p) => next.add(p.id));
        return next;
      });
    }
  };

  const handleToggleSelectRow = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleExecuteDelete = async () => {
    if (!confirmDeleteModal) return;
    const { mode, targetIds } = confirmDeleteModal;
    setIsDeleting(true);
    try {
      if (mode === 'all' && onClearAllPu) {
        await onClearAllPu();
        setSelectedIds(new Set());
      } else if ((mode === 'selected' || mode === 'filtered') && onBulkDeletePu) {
        await onBulkDeletePu(targetIds);
        setSelectedIds((prev) => {
          const next = new Set(prev);
          targetIds.forEach((id) => next.delete(id));
          return next;
        });
      } else if (mode === 'single' && onDeletePu && targetIds.length > 0) {
        await onDeletePu(targetIds[0]);
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(targetIds[0]);
          return next;
        });
      }
      setConfirmDeleteModal(null);
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="w-full space-y-6 pb-8">
      {/* Active Filter Scope Notification Banner */}
      {isFiltered && (
        <div className="bg-[#02241e] border border-lime-400/40 p-3 rounded-xl flex flex-wrap items-center justify-between gap-2.5 text-xs shadow-md">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
            <span className="text-emerald-200">
              Menampilkan Dasbor Kinerja Khusus Area Terfilter:{' '}
              <strong className="text-lime-300 font-bold">{puList.length}</strong> dari {totalOverall} PU
            </span>
          </div>
          {onResetFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-800/50 hover:bg-emerald-700/60 text-emerald-200 hover:text-white border border-emerald-500/30 transition-colors font-medium"
            >
              Kembali ke Seluruh Area ({totalOverall} PU)
            </button>
          )}
        </div>
      )}

      {/* Zero match empty state */}
      {puList.length === 0 && (
        <div className="bg-[#04332b]/90 border border-amber-500/40 rounded-xl p-8 text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
          <h3 className="text-white font-bold text-sm">Tidak Ada Data Petak Ukur yang Sesuai</h3>
          <p className="text-emerald-200/80 text-xs max-w-md mx-auto">
            Tidak ditemukan Petak Ukur dengan kombinasi kriteria filter saat ini. Silakan ubah atau reset filter ke pilihan &quot;All&quot;.
          </p>
          {onResetFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="px-4 py-2 rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-900 text-xs font-bold transition-colors shadow-lg"
            >
              Reset Semua Filter (All)
            </button>
          )}
        </div>
      )}

      {/* Top Headline Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Card 1: Rata-Rata Survival Rate */}
        <div className="bg-[#04332b]/90 border border-emerald-500/30 backdrop-blur-md rounded-xl p-4 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between text-emerald-200/90 text-xs mb-1">
            <span className="font-bold uppercase tracking-wider">Rata-Rata Survival Rate</span>
            <TrendingUp className="w-4 h-4 text-lime-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className="text-3xl font-black"
              style={{
                color:
                  metrics.rataRataSurvivalRate >= 80
                    ? '#a3e635'
                    : metrics.rataRataSurvivalRate >= 75
                    ? '#facc15'
                    : metrics.rataRataSurvivalRate > 40
                    ? '#f87171'
                    : '#cbd5e1',
              }}
            >
              {metrics.rataRataSurvivalRate}%
            </span>
            <span className="text-xs text-emerald-300/80">Target: ≥80%</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-200/80 flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                metrics.rataRataSurvivalRate >= 75 ? 'bg-lime-400' : 'bg-rose-400 animate-pulse'
              }`}
            />
            <span>
              {metrics.rataRataSurvivalRate >= 75
                ? 'Status Keseluruhan Memenuhi Ambang Standar'
                : 'Di Bawah Standar Keberhasilan Tanaman'}
            </span>
          </div>
        </div>

        {/* Card 2: Lulus Standar Keberhasilan */}
        <div className="bg-[#04332b]/90 border border-emerald-500/30 backdrop-blur-md rounded-xl p-4 shadow-xl">
          <div className="flex items-center justify-between text-emerald-200/90 text-xs mb-1">
            <span className="font-bold uppercase tracking-wider">Lulus Standar Minimal</span>
            <ShieldCheck className="w-4 h-4 text-lime-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-lime-300">
              {metrics.persentaseLulusStandar}%
            </span>
            <span className="text-xs text-emerald-300/80">
              ({metrics.countByKategori.kuning + metrics.countByKategori.hijau} dari {metrics.totalPU} PU)
            </span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-200/80">
            Kategori Kuning (75-80%) & Hijau (&gt;80%)
          </div>
        </div>

        {/* Card 3: Total Pohon Hidup vs Awal */}
        <div className="bg-[#04332b]/90 border border-emerald-500/30 backdrop-blur-md rounded-xl p-4 shadow-xl">
          <div className="flex items-center justify-between text-emerald-200/90 text-xs mb-1">
            <span className="font-bold uppercase tracking-wider">Total Tanaman Hidup</span>
            <TreeDeciduous className="w-4 h-4 text-emerald-300" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">
              {metrics.totalPohonHidup.toLocaleString()}
            </span>
            <span className="text-xs text-emerald-300/80">/ {metrics.totalPohonAwal.toLocaleString()} btg</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-200/80">
            Rasio Hidup Kumulatif: {Math.round((metrics.totalPohonHidup / (metrics.totalPohonAwal || 1)) * 100)}%
          </div>
        </div>

        {/* Card 4: Kebutuhan Penyulaman */}
        <div className="bg-[#04332b]/90 border border-emerald-500/30 backdrop-blur-md rounded-xl p-4 shadow-xl">
          <div className="flex items-center justify-between text-emerald-200/90 text-xs mb-1">
            <span className="font-bold uppercase tracking-wider">Kebutuhan Sulam</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-rose-400">
              {metrics.totalKebutuhanSulam.toLocaleString()}
            </span>
            <span className="text-xs text-emerald-300/80">bibit</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-200/80">
            {metrics.countByKategori.hitam + metrics.countByKategori.merah} Petak Ukur butuh perlakuan khusus
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Chart: Donut Chart Distribusi Kategori Survival Rate */}
        <div className="lg:col-span-5 bg-[#04332b]/90 border border-emerald-500/30 backdrop-blur-md rounded-xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-lime-400" />
                Distribusi Kategori Survival Rate
              </h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#022720] text-lime-300 border border-emerald-500/30 font-mono font-bold">
                {metrics.totalPU} PU
              </span>
            </div>
            <div className="w-8 h-1 bg-gradient-to-r from-lime-400 to-emerald-400 rounded-full mb-2" />
            <p className="text-xs text-emerald-200/80 mb-3">
              Proporsi petak ukur berdasarkan 4 kriteria warna acuan evaluasi DAS Adaro.
            </p>
          </div>

          <div className="h-64 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={88}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke={entry.stroke} strokeWidth={2} />
                  ))}
                </Pie>
                <RechartsTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-[#02241e] border border-emerald-500/40 p-2.5 rounded-lg shadow-xl text-xs text-emerald-100">
                          <div className="font-bold text-sm mb-1" style={{ color: data.stroke }}>
                            {data.name}
                          </div>
                          <div className="text-emerald-200">
                            Jumlah: <strong>{data.value} PU</strong> (
                            {Math.round((data.value / metrics.totalPU) * 100)}%)
                          </div>
                          <div className="text-[11px] text-emerald-300/70 mt-1">{data.desc}</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Inner Donut Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-white">{metrics.totalPU}</span>
              <span className="text-[10px] uppercase font-bold text-lime-400 tracking-wider">Petak Ukur</span>
            </div>
          </div>

          {/* Custom Legend Cards */}
          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-emerald-500/20">
            {donutData.map((d) => (
              <div key={d.name} className="flex items-center gap-2 p-1.5 rounded-lg bg-[#022720]/80 border border-emerald-500/20 text-xs">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: d.color, border: `1.5px solid ${d.stroke}` }} />
                <div className="min-w-0 flex-1">
                  <div className="text-emerald-100 font-semibold truncate text-[11px]">{d.name}</div>
                  <div className="text-emerald-300/80 text-[10px]">
                    {d.value} PU ({Math.round((d.value / metrics.totalPU) * 100)}%)
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Chart: Average Survival Rate per Sub-DAS or per Blok */}
        <div className="lg:col-span-7 bg-[#04332b]/90 border border-emerald-500/30 backdrop-blur-md rounded-xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-lime-400" />
                {barChartTitle}
              </h3>
              <span className="text-xs text-emerald-300/80 font-medium">Garis Merah: Ambang Batas 75%</span>
            </div>
            <div className="w-8 h-1 bg-gradient-to-r from-lime-400 to-emerald-400 rounded-full mb-2" />
            <p className="text-xs text-emerald-200/80 mb-3">
              Tingkat keberhasilan tanaman dibandingkan dengan ambang batas minimal kelulusan teknis (75%).
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subDasChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#065f46" opacity={0.4} />
                <XAxis dataKey="name" stroke="#6ee7b7" fontSize={11} tickLine={false} interval={0} />
                <YAxis stroke="#6ee7b7" fontSize={11} domain={[0, 100]} tickFormatter={(val) => `${val}%`} />
                <ReferenceLine
                  y={75}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  label={{ value: 'Standar Min (75%)', fill: '#f87171', fontSize: 10, position: 'insideTopRight' }}
                />
                <ReferenceLine
                  y={80}
                  stroke="#a3e635"
                  strokeDasharray="2 2"
                  label={{ value: 'Target Berhasil (>80%)', fill: '#a3e635', fontSize: 10, position: 'insideTopLeft' }}
                />
                <RechartsTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-[#02241e] border border-emerald-500/40 p-2.5 rounded-lg shadow-xl text-xs text-emerald-100">
                          <div className="font-bold text-sm text-lime-300 mb-1">{d.fullName}</div>
                          <div>Rata-Rata Survival Rate: <strong>{d.rataRataSR}%</strong></div>
                          <div>Jumlah PU: <strong>{d.totalPU} PU</strong></div>
                          <div>Pohon Hidup: <strong>{d.pohonHidup} / {d.pohonAwal} btg</strong></div>
                          <div className="text-rose-400 mt-1">Kebutuhan Sulam: <strong>{d.kebutuhanSulam} btg</strong></div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="rataRataSR"
                  radius={[6, 6, 0, 0]}
                  fill="#10b981"
                >
                  {subDasChartData.map((entry, idx) => {
                    const color =
                      entry.rataRataSR >= 80
                        ? '#22c55e'
                        : entry.rataRataSR >= 75
                        ? '#eab308'
                        : entry.rataRataSR > 40
                        ? '#ef4444'
                        : '#0f172a';
                    return <Cell key={`bar-${idx}`} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-[11px] text-emerald-300/80 mt-3 pt-3 border-t border-emerald-500/20">
            <span>Warna batang disesuaikan dengan rata-rata nilai kriteria per wilayah.</span>
            <span className="text-lime-300 font-semibold">Monitoring Wilayah Konsesi DAS Adaro</span>
          </div>
        </div>
      </div>

      {/* Priority Action List: Petak Ukur Butuh Penyulaman (Kategori Hitam & Merah) */}
      <div className="bg-[#04332b]/90 border border-emerald-500/30 backdrop-blur-md rounded-xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Prioritas Tindak Lanjut: Petak Ukur Kritis & Perlu Sulam Intensif
            </h3>
            <div className="w-8 h-1 bg-gradient-to-r from-lime-400 to-emerald-400 rounded-full my-1.5" />
            <p className="text-xs text-emerald-200/80">
              Daftar Petak Ukur dengan Survival Rate di bawah standar (&lt;75%) yang memerlukan tindakan teknis segera.
            </p>
          </div>

          {/* Filter, Search, and "Urut Berdasarkan" Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-emerald-400" />
              <input
                id="analytics-search-input"
                type="text"
                placeholder="Cari PU / Blok / Jenis..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#02241e] border border-emerald-500/30 text-emerald-100 placeholder-emerald-400/50 text-xs rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-lime-400 w-44"
              />
            </div>

            {/* Sub-DAS Filter */}
            <select
              id="analytics-subdas-filter"
              value={selectedSubDas}
              onChange={(e) => setSelectedSubDas(e.target.value)}
              className="bg-[#02241e] border border-emerald-500/30 text-emerald-100 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-lime-400"
            >
              <option value="all">Semua Sub-DAS</option>
              {metrics.distribusiSubDas.map((s) => (
                <option key={s.subDas} value={s.subDas}>
                  {s.subDas}
                </option>
              ))}
            </select>

            {/* Fitur: "Urut Berdasarkan" */}
            <div className="flex items-center gap-1.5 bg-[#02241e] border border-emerald-500/30 rounded-lg px-2.5 py-1 text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-lime-400 flex-shrink-0" />
              <label htmlFor="analytics-sort-select" className="text-[11px] text-emerald-300 font-medium whitespace-nowrap hidden lg:inline">
                Urut:
              </label>
              <select
                id="analytics-sort-select"
                value={`${sortField}-${sortOrder}`}
                onChange={(e) => handleSortSelect(e.target.value)}
                className="bg-transparent text-emerald-100 text-xs focus:outline-none cursor-pointer pr-1"
                title="Pilih kriteria pengurutan tabel"
              >
                <option value="updatedAt-desc" className="bg-[#04332b] text-white">
                  Tgl Terinput (Terbaru)
                </option>
                <option value="updatedAt-asc" className="bg-[#04332b] text-white">
                  Tgl Terinput (Terlama)
                </option>
                <option value="survivalRate-asc" className="bg-[#04332b] text-white">
                  Survival Rate (Terendah / Kritis Dulu)
                </option>
                <option value="survivalRate-desc" className="bg-[#04332b] text-white">
                  Survival Rate (Tertinggi)
                </option>
                <option value="kebutuhanPenyulaman-desc" className="bg-[#04332b] text-white">
                  Kebutuhan Sulam (Terbanyak)
                </option>
                <option value="kodePU-asc" className="bg-[#04332b] text-white">
                  Kode PU (A - Z)
                </option>
                <option value="kodePU-desc" className="bg-[#04332b] text-white">
                  Kode PU (Z - A)
                </option>
                <option value="blok-asc" className="bg-[#04332b] text-white">
                  Lokasi / Blok (A - Z)
                </option>
                <option value="tanggalEvaluasi-desc" className="bg-[#04332b] text-white">
                  Tgl Sensus Lapangan (Terbaru)
                </option>
              </select>
              {/* Quick toggle sort direction */}
              <button
                type="button"
                onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                title={`Arah urutan: ${sortOrder === 'asc' ? 'Menaik (A-Z / Terlama)' : 'Menurun (Z-A / Terbaru)'}. Klik untuk balikkan.`}
                className="p-1 rounded hover:bg-emerald-800/60 text-lime-300 transition-colors"
              >
                {sortOrder === 'asc' ? (
                  <ArrowUp className="w-3.5 h-3.5 text-lime-400" />
                ) : (
                  <ArrowDown className="w-3.5 h-3.5 text-lime-400" />
                )}
              </button>
            </div>

            {/* Impor Excel Button */}
            {onOpenExcelImport && (
              <button
                id="analytics-excel-import-btn"
                type="button"
                onClick={onOpenExcelImport}
                className="px-2.5 py-1.5 rounded-lg bg-[#007a48] hover:bg-[#009650] text-white border border-lime-400/30 text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shadow-sm"
                title="Impor Database PU dari Excel"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-lime-300" />
                <span>Impor Excel</span>
              </button>
            )}

            {/* Menu / Tombol Hapus Data Terpilih & Massal */}
            <div className="relative">
              <button
                id="analytics-delete-menu-btn"
                type="button"
                onClick={() => setIsDeleteMenuOpen((prev) => !prev)}
                className="px-2.5 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                title="Opsi penghapusan data massal & bersihkan database"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">Hapus Data</span>
                {selectedIds.size > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[10px] font-bold">
                    {selectedIds.size}
                  </span>
                )}
                <ChevronDown className="w-3 h-3 text-rose-300" />
              </button>

              {isDeleteMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsDeleteMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-1.5 z-50 w-64 bg-[#03231e] border border-emerald-500/40 rounded-xl shadow-2xl p-1 text-xs">
                    <div className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-emerald-400/80 border-b border-emerald-500/20">
                      Opsi Penghapusan Data
                    </div>

                    {/* Hapus Terpilih */}
                    <button
                      type="button"
                      disabled={selectedIds.size === 0}
                      onClick={() => {
                        setIsDeleteMenuOpen(false);
                        setConfirmDeleteModal({
                          isOpen: true,
                          mode: 'selected',
                          targetIds: Array.from(selectedIds),
                        });
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition-colors ${
                        selectedIds.size > 0
                          ? 'hover:bg-rose-950/60 text-rose-300 cursor-pointer'
                          : 'text-slate-500 cursor-not-allowed opacity-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <CheckSquare className="w-3.5 h-3.5 text-rose-400" />
                        <span>Hapus Data Terpilih</span>
                      </div>
                      <span className="px-1.5 py-0.5 rounded bg-rose-900/40 text-[10px] font-mono">
                        {selectedIds.size} PU
                      </span>
                    </button>

                    {/* Hapus Hasil Filter */}
                    <button
                      type="button"
                      disabled={sortedPuList.length === 0}
                      onClick={() => {
                        setIsDeleteMenuOpen(false);
                        setConfirmDeleteModal({
                          isOpen: true,
                          mode: 'filtered',
                          targetIds: sortedPuList.map((p) => p.id),
                        });
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition-colors ${
                        sortedPuList.length > 0
                          ? 'hover:bg-rose-950/60 text-rose-300 cursor-pointer'
                          : 'text-slate-500 cursor-not-allowed opacity-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Filter className="w-3.5 h-3.5 text-amber-400" />
                        <span>Hapus Semua Hasil Filter</span>
                      </div>
                      <span className="px-1.5 py-0.5 rounded bg-amber-900/40 text-[10px] font-mono text-amber-300">
                        {sortedPuList.length} PU
                      </span>
                    </button>

                    <div className="my-1 border-t border-emerald-500/20" />

                    {/* Kosongkan Seluruh Database */}
                    <button
                      type="button"
                      disabled={totalOverall === 0}
                      onClick={() => {
                        setIsDeleteMenuOpen(false);
                        setConfirmDeleteModal({
                          isOpen: true,
                          mode: 'all',
                          targetIds: [],
                        });
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition-colors ${
                        totalOverall > 0
                          ? 'hover:bg-rose-900/60 text-rose-200 cursor-pointer'
                          : 'text-slate-500 cursor-not-allowed opacity-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
                        <span className="font-semibold">Kosongkan Seluruh Database</span>
                      </div>
                      <span className="px-1.5 py-0.5 rounded bg-rose-800/40 text-[10px] font-mono">
                        {totalOverall} PU
                      </span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Floating / Inline Bulk Selection Action Banner */}
        {selectedIds.size > 0 && (
          <div className="bg-gradient-to-r from-[#032b24] via-[#053d33] to-[#04332b] border border-lime-400/50 rounded-xl p-3 mb-3 flex flex-wrap items-center justify-between gap-3 shadow-xl ring-1 ring-lime-400/20 animate-fade-in">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-lime-400/20 text-lime-300 font-bold flex items-center justify-center text-xs shrink-0">
                {selectedIds.size}
              </span>
              <div>
                <div className="font-bold text-white text-xs flex items-center gap-1.5">
                  <span>{selectedIds.size} Petak Ukur Dipilih</span>
                  <span className="text-[10px] text-emerald-300/70 font-normal">
                    (dari {sortedPuList.length} data tampil)
                  </span>
                </div>
                <p className="text-[10px] text-emerald-200/80">
                  Gunakan tombol aksi untuk menghapus data yang Anda centang secara bersamaan.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleSelectAll}
                className="px-2.5 py-1.5 rounded-lg bg-[#02241e] hover:bg-[#033028] text-emerald-200 text-xs font-medium border border-emerald-500/30 transition-colors"
              >
                {isAllSelected ? 'Batalkan Pilih Semua' : `Pilih Semua (${sortedPuList.length})`}
              </button>
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="px-2.5 py-1.5 text-xs text-emerald-400 hover:text-white transition-colors"
              >
                Batal Pilihan
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmDeleteModal({
                    isOpen: true,
                    mode: 'selected',
                    targetIds: Array.from(selectedIds),
                  });
                }}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-950/50 transition-all hover:scale-[1.02]"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus {selectedIds.size} Data Terpilih</span>
              </button>
            </div>
          </div>
        )}

        {/* Status Bar: Total baris & Kriteria Pengurutan Aktif */}
        <div className="flex items-center justify-between text-[11px] text-emerald-300/80 mb-3 px-1">
          <div className="flex items-center gap-2">
            <span>
              Menampilkan <strong className="text-lime-300 font-bold">{sortedPuList.length}</strong> Petak Ukur
            </span>
            {searchQuery && (
              <span className="text-emerald-400/70">
                (filter kata kunci: &ldquo;{searchQuery}&rdquo;)
              </span>
            )}
            {selectedIds.size > 0 && (
              <span className="text-lime-300 font-semibold">
                &bull; {selectedIds.size} terpilih
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-300/90 font-mono">
            <span>Urut:</span>
            <span className="text-lime-300 font-sans font-medium">
              {sortField === 'updatedAt'
                ? `Tanggal Terinput (${sortOrder === 'desc' ? 'Terbaru' : 'Terlama'})`
                : sortField === 'survivalRate'
                ? `Survival Rate (${sortOrder === 'asc' ? 'Terendah / Kritis' : 'Tertinggi'})`
                : sortField === 'kebutuhanPenyulaman'
                ? `Kebutuhan Sulam (${sortOrder === 'desc' ? 'Terbanyak' : 'Tersedikit'})`
                : sortField === 'kodePU'
                ? `Kode PU (${sortOrder === 'asc' ? 'A-Z' : 'Z-A'})`
                : sortField === 'blok'
                ? `Lokasi (${sortOrder === 'asc' ? 'A-Z' : 'Z-A'})`
                : `Tgl Sensus (${sortOrder === 'desc' ? 'Terbaru' : 'Terlama'})`}
            </span>
          </div>
        </div>

        {/* Interactive Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-emerald-500/30 text-emerald-300/80 uppercase tracking-wider text-[10px]">
                {/* Checkbox Master Header (Select All) */}
                <th className="py-2.5 px-3 w-10 text-center select-none">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isSomeSelected;
                    }}
                    onChange={handleToggleSelectAll}
                    className="w-4 h-4 rounded border-emerald-500/50 bg-[#02241e] text-emerald-600 focus:ring-lime-400 focus:ring-offset-0 cursor-pointer accent-emerald-500"
                    title={isAllSelected ? 'Batalkan pilihan semua' : 'Pilih semua data yang tampil'}
                  />
                </th>

                {/* Kode PU Column Header */}
                <th
                  className="py-2.5 px-3 cursor-pointer select-none hover:text-white transition-colors"
                  onClick={() => handleHeaderClick('kodePU')}
                  title="Klik untuk mengurutkan berdasarkan Kode PU"
                >
                  <div className="flex items-center gap-1">
                    <span>Kode PU</span>
                    {sortField === 'kodePU' ? (
                      sortOrder === 'asc' ? (
                        <ArrowUp className="w-3 h-3 text-lime-400" />
                      ) : (
                        <ArrowDown className="w-3 h-3 text-lime-400" />
                      )
                    ) : (
                      <ArrowUpDown className="w-2.5 h-2.5 text-emerald-500/40" />
                    )}
                  </div>
                </th>

                {/* Kolom Tanggal Data Terinput ke Web */}
                <th
                  className="py-2.5 px-3 cursor-pointer select-none hover:text-white transition-colors"
                  onClick={() => handleHeaderClick('updatedAt')}
                  title="Klik untuk mengurutkan berdasarkan Tanggal Data Terinput ke Web"
                >
                  <div className="flex items-center gap-1.5 text-lime-300 font-bold">
                    <Calendar className="w-3.5 h-3.5 text-lime-400" />
                    <span>Tgl Terinput ke Web</span>
                    {sortField === 'updatedAt' ? (
                      sortOrder === 'asc' ? (
                        <ArrowUp className="w-3 h-3 text-lime-300" />
                      ) : (
                        <ArrowDown className="w-3 h-3 text-lime-300" />
                      )
                    ) : (
                      <ArrowUpDown className="w-2.5 h-2.5 text-emerald-500/40" />
                    )}
                  </div>
                </th>

                {/* Lokasi & Sub-DAS Header */}
                <th
                  className="py-2.5 px-3 cursor-pointer select-none hover:text-white transition-colors"
                  onClick={() => handleHeaderClick('blok')}
                  title="Klik untuk mengurutkan berdasarkan Lokasi & Sub-DAS"
                >
                  <div className="flex items-center gap-1">
                    <span>Lokasi & Sub-DAS</span>
                    {sortField === 'blok' ? (
                      sortOrder === 'asc' ? (
                        <ArrowUp className="w-3 h-3 text-lime-400" />
                      ) : (
                        <ArrowDown className="w-3 h-3 text-lime-400" />
                      )
                    ) : (
                      <ArrowUpDown className="w-2.5 h-2.5 text-emerald-500/40" />
                    )}
                  </div>
                </th>

                <th className="py-2.5 px-3">Jenis Tanaman</th>
                <th className="py-2.5 px-3 text-center">Hidup / Awal</th>

                {/* Survival Rate Header */}
                <th
                  className="py-2.5 px-3 text-center cursor-pointer select-none hover:text-white transition-colors"
                  onClick={() => handleHeaderClick('survivalRate')}
                  title="Klik untuk mengurutkan berdasarkan Survival Rate"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Survival Rate</span>
                    {sortField === 'survivalRate' ? (
                      sortOrder === 'asc' ? (
                        <ArrowUp className="w-3 h-3 text-lime-400" />
                      ) : (
                        <ArrowDown className="w-3 h-3 text-lime-400" />
                      )
                    ) : (
                      <ArrowUpDown className="w-2.5 h-2.5 text-emerald-500/40" />
                    )}
                  </div>
                </th>

                <th className="py-2.5 px-3 text-center">Kategori</th>

                {/* Kebutuhan Sulam Header */}
                <th
                  className="py-2.5 px-3 text-center cursor-pointer select-none hover:text-white transition-colors"
                  onClick={() => handleHeaderClick('kebutuhanPenyulaman')}
                  title="Klik untuk mengurutkan berdasarkan Kebutuhan Sulam"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Kebutuhan Sulam</span>
                    {sortField === 'kebutuhanPenyulaman' ? (
                      sortOrder === 'asc' ? (
                        <ArrowUp className="w-3 h-3 text-lime-400" />
                      ) : (
                        <ArrowDown className="w-3 h-3 text-lime-400" />
                      )
                    ) : (
                      <ArrowUpDown className="w-2.5 h-2.5 text-emerald-500/40" />
                    )}
                  </div>
                </th>

                <th className="py-2.5 px-3">Rekomendasi Tindak Lanjut</th>
                <th className="py-2.5 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-500/20">
              {sortedPuList.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-emerald-300/70">
                    {totalOverall === 0 ? (
                      <div className="max-w-md mx-auto flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
                          <TreeDeciduous className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-sm">Database Petak Ukur Kosong</h4>
                          <p className="text-xs text-emerald-200/70 mt-1 leading-relaxed">
                            Belum ada data Petak Ukur tersimpan atau database baru saja dikosongkan.
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                          {onOpenExcelImport && (
                            <button
                              type="button"
                              onClick={onOpenExcelImport}
                              className="px-3.5 py-1.5 rounded-xl bg-[#007a48] hover:bg-[#009650] text-white text-xs font-bold flex items-center gap-1.5 shadow-md border border-lime-400/30 transition-all hover:scale-[1.02]"
                            >
                              <FileSpreadsheet className="w-4 h-4 text-lime-300" />
                              <span>Impor Database dari Excel</span>
                            </button>
                          )}
                          {onResetData && (
                            <button
                              type="button"
                              onClick={onResetData}
                              className="px-3 py-1.5 rounded-xl bg-[#032e27] hover:bg-[#05453a] text-emerald-200 text-xs font-semibold border border-emerald-500/30 flex items-center gap-1.5 transition-colors"
                            >
                              <RotateCcw className="w-3.5 h-3.5 text-lime-300" />
                              <span>Pulihkan Sampel Standar BPDAS</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm">Tidak ditemukan data Petak Ukur yang sesuai dengan kriteria filter.</p>
                        {searchQuery && (
                          <button
                            onClick={() => setSearchQuery('')}
                            className="mt-2 text-xs text-lime-300 hover:underline block mx-auto"
                          >
                            Hapus kata kunci pencarian (&ldquo;{searchQuery}&rdquo;)
                          </button>
                        )}
                        {onResetFilters && activeFilterCount > 0 && (
                          <button
                            onClick={onResetFilters}
                            className="mt-2 text-xs text-emerald-300 hover:text-white underline block mx-auto"
                          >
                            Reset Semua Filter Lapangan ({activeFilterCount})
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                sortedPuList.map((pu) => {
                  const cat = CATEGORY_INFO_MAP[pu.kategori];
                  const awal = pu.tanamanAwal || 50;
                  const hidup =
                    pu.tanamanHidup !== undefined
                      ? pu.tanamanHidup
                      : Math.round(((pu.survivalRate || 0) / 100) * awal);
                  const sulam =
                    pu.kebutuhanPenyulaman !== undefined
                      ? pu.kebutuhanPenyulaman
                      : Math.max(0, awal - hidup);
                  const namaDas = pu.das || pu.subDas;
                  const srVal = pu.persentaseHidup !== undefined ? pu.persentaseHidup : pu.survivalRate;
                  const { dateStr, timeStr } = formatTanggalInput(pu);
                  const isRowSelected = selectedIds.has(pu.id);

                  return (
                    <tr
                      key={pu.id}
                      className={`transition-colors group cursor-pointer ${
                        isRowSelected
                          ? 'bg-[#08483e]/80 ring-1 ring-inset ring-lime-400/40 border-l-2 border-l-lime-400'
                          : 'hover:bg-[#06433a]/50'
                      }`}
                      onClick={() => {
                        onSelectPu(pu);
                        onOpenDetail(pu);
                      }}
                    >
                      {/* Checkbox Row Selection */}
                      <td
                        className="py-3 px-3 w-10 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isRowSelected}
                          onChange={() => handleToggleSelectRow(pu.id)}
                          className="w-4 h-4 rounded border-emerald-500/50 bg-[#02241e] text-emerald-600 focus:ring-lime-400 focus:ring-offset-0 cursor-pointer accent-emerald-500"
                          title={`Pilih titik ${pu.kodePU}`}
                        />
                      </td>

                      {/* Kode PU */}
                      <td className="py-3 px-3 font-bold text-lime-300 whitespace-nowrap">
                        {pu.kodePU}
                        {pu.petak && (
                          <span className="ml-1 text-[10px] text-emerald-300/70 font-normal">
                            ({pu.petak})
                          </span>
                        )}
                      </td>

                      {/* Kolom Tanggal Data Terinput ke Web */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-medium text-emerald-100">
                          <Calendar className="w-3.5 h-3.5 text-lime-400 shrink-0" />
                          <span className="font-semibold text-white">{dateStr}</span>
                        </div>
                        {timeStr && (
                          <div className="text-[10px] text-emerald-300/70 font-mono pl-5">
                            {timeStr}
                          </div>
                        )}
                      </td>

                      {/* Lokasi & Sub-DAS */}
                      <td className="py-3 px-3">
                        <div className="font-semibold text-white">{pu.blok}</div>
                        <div className="text-[10px] text-emerald-300/80">{namaDas}</div>
                      </td>

                      {/* Jenis Tanaman */}
                      <td className="py-3 px-3 text-emerald-100">
                        {pu.jenisTanaman.slice(0, 2).join(', ')}
                        {pu.jenisTanaman.length > 2 && '...'}
                      </td>

                      {/* Hidup / Awal */}
                      <td className="py-3 px-3 text-center font-mono text-white whitespace-nowrap">
                        {hidup} / {awal}
                      </td>

                      {/* Survival Rate */}
                      <td className="py-3 px-3 text-center">
                        <span className="font-bold text-sm" style={{ color: cat.colorHex }}>
                          {srVal}%
                        </span>
                      </td>

                      {/* Kategori */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${cat.badgeBg} ${cat.badgeBorder} ${cat.badgeText}`}
                        >
                          {cat.name}
                        </span>
                      </td>

                      {/* Kebutuhan Sulam */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`font-semibold font-mono ${
                            sulam > 0 ? 'text-rose-400' : 'text-lime-300'
                          }`}
                        >
                          {sulam} btg
                        </span>
                      </td>

                      {/* Rekomendasi */}
                      <td className="py-3 px-3 text-emerald-200/90 text-[11px] max-w-xs truncate">
                        {pu.rekomendasi || (srVal >= 75 ? 'Pertahankan pemeliharaan intensif.' : 'Segera lakukan penyulaman bibit.')}
                      </td>

                      {/* Aksi: Lihat Detail & Hapus */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectPu(pu);
                              onOpenDetail(pu);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-[#032e27] hover:bg-[#05453a] text-emerald-200 text-[11px] font-medium border border-emerald-500/30 transition-colors inline-flex items-center gap-1"
                          >
                            Lihat
                            <ArrowUpRight className="w-3 h-3 text-lime-400" />
                          </button>
                          {onDeletePu && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDeleteModal({
                                  isOpen: true,
                                  mode: 'single',
                                  targetIds: [pu.id],
                                  targetCode: pu.kodePU,
                                });
                              }}
                              title={`Hapus data ${pu.kodePU}`}
                              className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/70 text-rose-400 hover:text-rose-200 border border-rose-800/40 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal for Bulk / Filtered / Single / All Delete */}
      {confirmDeleteModal && confirmDeleteModal.isOpen && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#03231e] border border-rose-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl text-slate-100 flex flex-col gap-4 animate-scale-in">
            <div className="flex items-start gap-3.5">
              <div className="p-3 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
                <AlertOctagon className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-base font-bold text-white">
                  {confirmDeleteModal.mode === 'all'
                    ? 'Kosongkan Seluruh Database PU?'
                    : confirmDeleteModal.mode === 'single'
                    ? `Hapus Petak Ukur ${confirmDeleteModal.targetCode}?`
                    : confirmDeleteModal.mode === 'filtered'
                    ? `Hapus Semua Hasil Filter (${confirmDeleteModal.targetIds.length} PU)?`
                    : `Hapus ${confirmDeleteModal.targetIds.length} Data Terpilih?`}
                </h4>
                <p className="text-xs text-emerald-200/80 mt-1.5 leading-relaxed">
                  {confirmDeleteModal.mode === 'all'
                    ? `Tindakan ini akan menghapus seluruh ${totalOverall} data Petak Ukur dari sistem dan sinkronisasi real-time. Anda dapat mengimpor data baru via Excel setelah ini.`
                    : confirmDeleteModal.mode === 'single'
                    ? `Data Petak Ukur ${confirmDeleteModal.targetCode} akan dihapus secara permanen dari sistem.`
                    : confirmDeleteModal.mode === 'filtered'
                    ? `Sebanyak ${confirmDeleteModal.targetIds.length} data Petak Ukur yang sesuai dengan kriteria filter saat ini akan dihapus sekaligus.`
                    : `Sebanyak ${confirmDeleteModal.targetIds.length} data Petak Ukur yang Anda centang akan dihapus sekaligus dari sistem.`}
                </p>
              </div>
            </div>

            {/* Sample Codes Preview */}
            {confirmDeleteModal.targetIds.length > 0 && confirmDeleteModal.mode !== 'single' && (
              <div className="bg-[#021a16] border border-emerald-500/20 rounded-xl p-3 text-xs">
                <span className="text-[11px] text-emerald-400 font-semibold block mb-1.5">
                  Daftar Petak Ukur yang akan dihapus:
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                  {confirmDeleteModal.targetIds.slice(0, 15).map((id) => {
                    const item = puList.find((p) => p.id === id);
                    return (
                      <span
                        key={id}
                        className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-200 text-[10px] font-mono border border-emerald-500/30"
                      >
                        {item ? item.kodePU : id}
                      </span>
                    );
                  })}
                  {confirmDeleteModal.targetIds.length > 15 && (
                    <span className="px-2 py-0.5 text-[10px] text-emerald-400 font-medium self-center">
                      +{confirmDeleteModal.targetIds.length - 15} lainnya
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-emerald-500/20">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setConfirmDeleteModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors disabled:opacity-50"
              >
                Batalkan
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleExecuteDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-rose-950/50 transition-all hover:scale-[1.02] disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Clock className="w-3.5 h-3.5 animate-spin" />
                    <span>Menghapus Data...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Ya, Hapus Sekarang</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
