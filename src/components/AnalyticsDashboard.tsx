import React, { useState } from 'react';
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
} from 'lucide-react';

interface AnalyticsDashboardProps {
  puList: PetakUkur[];
  onSelectPu: (pu: PetakUkur) => void;
  onOpenDetail: (pu: PetakUkur) => void;
  onOpenExcelImport?: () => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  puList,
  onSelectPu,
  onOpenDetail,
  onOpenExcelImport,
}) => {
  const metrics = computeDasMetrics(puList);
  const [selectedSubDas, setSelectedSubDas] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

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

  // 2. Data for Bar Chart: Average SR per Sub-DAS
  const subDasChartData = metrics.distribusiSubDas.map((d) => ({
    name: d.subDas.replace('Sub-DAS ', ''),
    fullName: d.subDas,
    rataRataSR: d.rataRataSR,
    totalPU: d.totalPU,
    pohonHidup: d.pohonHidup,
    pohonAwal: d.pohonAwal,
    kebutuhanSulam: Math.max(0, d.pohonAwal - d.pohonHidup),
  }));

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

  return (
    <div className="w-full space-y-6 pb-8">
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

        {/* Right Chart: Average Survival Rate per Sub-DAS */}
        <div className="lg:col-span-7 bg-[#04332b]/90 border border-emerald-500/30 backdrop-blur-md rounded-xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-lime-400" />
                Performa Rata-Rata Survival Rate per Sub-DAS
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

          {/* Filter and Search Bar */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-emerald-400" />
              <input
                id="analytics-search-input"
                type="text"
                placeholder="Cari PU / Blok / Jenis..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#02241e] border border-emerald-500/30 text-emerald-100 placeholder-emerald-400/50 text-xs rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-lime-400 w-48"
              />
            </div>

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
          </div>
        </div>

        {/* Interactive Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-emerald-500/30 text-emerald-300/80 uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3">Kode PU</th>
                <th className="py-2.5 px-3">Lokasi & Sub-DAS</th>
                <th className="py-2.5 px-3">Jenis Tanaman</th>
                <th className="py-2.5 px-3 text-center">Hidup / Awal</th>
                <th className="py-2.5 px-3 text-center">Survival Rate</th>
                <th className="py-2.5 px-3 text-center">Kategori</th>
                <th className="py-2.5 px-3 text-center">Kebutuhan Sulam</th>
                <th className="py-2.5 px-3">Rekomendasi Tindak Lanjut</th>
                <th className="py-2.5 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-500/20">
              {filteredPuList.map((pu) => {
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

                return (
                  <tr
                    key={pu.id}
                    className="hover:bg-[#06433a]/50 transition-colors group cursor-pointer"
                    onClick={() => {
                      onSelectPu(pu);
                      onOpenDetail(pu);
                    }}
                  >
                    <td className="py-3 px-3 font-bold text-lime-300 whitespace-nowrap">
                      {pu.kodePU}
                      {pu.petak && (
                        <span className="ml-1 text-[10px] text-emerald-300/70 font-normal">
                          ({pu.petak})
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-white">{pu.blok}</div>
                      <div className="text-[10px] text-emerald-300/80">{namaDas}</div>
                    </td>
                    <td className="py-3 px-3 text-emerald-100">
                      {pu.jenisTanaman.slice(0, 2).join(', ')}
                      {pu.jenisTanaman.length > 2 && '...'}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-white whitespace-nowrap">
                      {hidup} / {awal}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="font-bold text-sm" style={{ color: cat.colorHex }}>
                        {srVal}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${cat.badgeBg} ${cat.badgeBorder} ${cat.badgeText}`}
                      >
                        {cat.name}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`font-semibold font-mono ${
                          sulam > 0 ? 'text-rose-400' : 'text-lime-300'
                        }`}
                      >
                        {sulam} btg
                      </span>
                    </td>
                    <td className="py-3 px-3 text-emerald-200/90 text-[11px] max-w-xs truncate">
                      {pu.rekomendasi || (srVal >= 75 ? 'Pertahankan pemeliharaan intensif.' : 'Segera lakukan penyulaman bibit.')}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
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
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
