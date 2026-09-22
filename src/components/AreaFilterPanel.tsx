import React, { useState } from 'react';
import { PetakUkur, PuFilterCriteria, DEFAULT_PU_FILTER } from '../types';
import { extractFilterOptions, countActiveFilters } from '../utils/filterHelper';
import {
  Filter,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Search,
  MapPin,
  Trees,
  Calendar,
  Layers,
  Thermometer,
  Droplets,
  Sprout,
  Compass,
  UserCheck,
  Percent,
  Sliders,
  Sparkles,
  X,
  Tag,
} from 'lucide-react';

interface AreaFilterPanelProps {
  puList: PetakUkur[];
  filteredCount: number;
  totalCount: number;
  filters: PuFilterCriteria;
  onFilterChange: (filters: PuFilterCriteria) => void;
  onResetFilters: () => void;
}

export const AreaFilterPanel: React.FC<AreaFilterPanelProps> = ({
  puList,
  filteredCount,
  totalCount,
  filters,
  onFilterChange,
  onResetFilters,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const activeCount = countActiveFilters(filters);
  const options = extractFilterOptions(puList);

  const updateSingleFilter = (key: keyof PuFilterCriteria, value: string) => {
    onFilterChange({
      ...filters,
      [key]: value,
    });
  };

  // Quick preset filter actions
  const applyPreset = (preset: 'all' | 'das7' | 'das9' | 'das3' | 'das4' | 'dasrt1' | 'kritis') => {
    if (preset === 'all') {
      onResetFilters();
    } else if (preset === 'das7') {
      onFilterChange({ ...DEFAULT_PU_FILTER, das: 'DAS 7' });
    } else if (preset === 'das9') {
      onFilterChange({ ...DEFAULT_PU_FILTER, das: 'DAS 9' });
    } else if (preset === 'das3') {
      onFilterChange({ ...DEFAULT_PU_FILTER, das: 'DAS 3' });
    } else if (preset === 'das4') {
      onFilterChange({ ...DEFAULT_PU_FILTER, das: 'DAS 4' });
    } else if (preset === 'dasrt1') {
      onFilterChange({ ...DEFAULT_PU_FILTER, das: 'DAS RT1' });
    } else if (preset === 'kritis') {
      onFilterChange({ ...DEFAULT_PU_FILTER, persentaseHidup: '<=40' });
    }
  };

  // Construct readable tags for active filters
  const activeFilterTags: { key: keyof PuFilterCriteria; label: string; value: string }[] = [];
  if (filters.das !== 'all') activeFilterTags.push({ key: 'das', label: 'DAS', value: filters.das });
  if (filters.blok !== 'all') activeFilterTags.push({ key: 'blok', label: 'Blok', value: filters.blok });
  if (filters.petak !== 'all') activeFilterTags.push({ key: 'petak', label: 'Petak', value: filters.petak });
  if (filters.periodeEvaluasi !== 'all') activeFilterTags.push({ key: 'periodeEvaluasi', label: 'Periode', value: filters.periodeEvaluasi });
  if (filters.lokasiDaerah !== 'all') activeFilterTags.push({ key: 'lokasiDaerah', label: 'Lokasi', value: filters.lokasiDaerah });
  if (filters.titikKoordinatUtm !== 'all') activeFilterTags.push({ key: 'titikKoordinatUtm', label: 'UTM', value: filters.titikKoordinatUtm });
  if (filters.tahunTanam !== 'all') activeFilterTags.push({ key: 'tahunTanam', label: 'Tahun', value: filters.tahunTanam });
  if (filters.kategori !== 'all') activeFilterTags.push({ key: 'kategori', label: 'Kategori', value: filters.kategori.toUpperCase() });
  if (filters.pengawasOperasional !== 'all') activeFilterTags.push({ key: 'pengawasOperasional', label: 'Pengawas', value: filters.pengawasOperasional });
  if (filters.persentaseHidup !== 'all') activeFilterTags.push({ key: 'persentaseHidup', label: 'SR', value: filters.persentaseHidup });
  if (filters.jarakTanam !== 'all') activeFilterTags.push({ key: 'jarakTanam', label: 'Jarak', value: filters.jarakTanam });
  if (filters.jenisTanaman !== 'all') activeFilterTags.push({ key: 'jenisTanaman', label: 'Tanaman', value: filters.jenisTanaman });
  if (filters.suhuLingkungan !== 'all') activeFilterTags.push({ key: 'suhuLingkungan', label: 'Suhu', value: filters.suhuLingkungan });
  if (filters.kelembabanUdara !== 'all') activeFilterTags.push({ key: 'kelembabanUdara', label: 'Kelembaban', value: filters.kelembabanUdara });
  if (filters.jenisTanah !== 'all') activeFilterTags.push({ key: 'jenisTanah', label: 'Tanah', value: filters.jenisTanah });
  if (filters.pHTanah !== 'all') activeFilterTags.push({ key: 'pHTanah', label: 'pH', value: filters.pHTanah });

  return (
    <div className="bg-[#04332b]/90 border border-emerald-500/35 backdrop-blur-md rounded-2xl shadow-xl p-4 md:p-5 transition-all">
      {/* Top Header & Quick Controller */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-emerald-500/25">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="p-2 rounded-xl bg-lime-400/15 border border-lime-400/30 text-lime-300 shrink-0">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-wide flex items-center gap-1.5">
                <span>Filter Kinerja Area &amp; Analitik</span>
              </h2>
              <span className="text-[11px] px-2 py-0.5 rounded-full font-mono font-semibold bg-[#02241e] border border-emerald-500/40 text-lime-300">
                {filteredCount} / {totalCount} PU
              </span>
              {activeCount > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-400/20 border border-amber-400/50 text-amber-300">
                  {activeCount} Filter Aktif
                </span>
              )}
            </div>
            <p className="text-[11px] text-emerald-200/80 mt-0.5">
              Pilih area tertentu atau parameter lapangan untuk meninjau performa dan dashboard analitik.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Search Bar */}
          <div className="relative min-w-[170px] flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-emerald-400" />
            <input
              id="global-area-search"
              type="text"
              value={filters.searchQuery || ''}
              onChange={(e) => updateSingleFilter('searchQuery', e.target.value)}
              placeholder="Cari Kode PU, Blok, atau Petugas..."
              className="w-full bg-[#02241e] border border-emerald-500/30 text-emerald-100 placeholder-emerald-400/50 text-xs rounded-lg pl-8 pr-7 py-1.5 focus:outline-none focus:border-lime-400"
            />
            {filters.searchQuery && (
              <button
                type="button"
                onClick={() => updateSingleFilter('searchQuery', '')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-emerald-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Reset Button */}
          {activeCount > 0 && (
            <button
              id="reset-area-filters-btn"
              type="button"
              onClick={onResetFilters}
              className="px-2.5 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/40 text-rose-200 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              title="Reset seluruh filter ke pilihan Semua / All"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filter</span>
            </button>
          )}

          {/* Toggle Expand 16 Filters Button */}
          <button
            id="toggle-filter-panel-btn"
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-1.5 rounded-lg bg-[#007a48] hover:bg-[#009650] text-white border border-lime-400/30 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Sliders className="w-3.5 h-3.5 text-lime-300" />
            <span>{isExpanded ? 'Sembunyikan Filter' : '16 Variabel Filter'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Quick Presets Strip */}
      <div className="flex flex-wrap items-center gap-1.5 py-2 text-xs">
        <span className="text-[11px] font-semibold text-emerald-300/80 flex items-center gap-1 mr-1">
          <Sparkles className="w-3 h-3 text-lime-400" />
          Akses Cepat Area:
        </span>
        <button
          type="button"
          onClick={() => applyPreset('all')}
          className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all border ${
            activeCount === 0
              ? 'bg-lime-400 text-slate-900 border-lime-400 shadow-sm'
              : 'bg-[#02241e] text-emerald-200 border-emerald-500/30 hover:bg-emerald-800/40'
          }`}
        >
          Seluruh Area ({totalCount} PU)
        </button>
        <button
          type="button"
          onClick={() => applyPreset('das7')}
          className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all border ${
            filters.das === 'DAS 7'
              ? 'bg-lime-400 text-slate-900 border-lime-400 shadow-sm'
              : 'bg-[#02241e] text-emerald-200 border-emerald-500/30 hover:bg-emerald-800/40'
          }`}
        >
          DAS 7 (Belangian)
        </button>
        <button
          type="button"
          onClick={() => applyPreset('das9')}
          className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all border ${
            filters.das === 'DAS 9'
              ? 'bg-lime-400 text-slate-900 border-lime-400 shadow-sm'
              : 'bg-[#02241e] text-emerald-200 border-emerald-500/30 hover:bg-emerald-800/40'
          }`}
        >
          DAS 9 (Jabar)
        </button>
        <button
          type="button"
          onClick={() => applyPreset('das3')}
          className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all border ${
            filters.das === 'DAS 3'
              ? 'bg-lime-400 text-slate-900 border-lime-400 shadow-sm'
              : 'bg-[#02241e] text-emerald-200 border-emerald-500/30 hover:bg-emerald-800/40'
          }`}
        >
          DAS 3 (Tiwingan Lama)
        </button>
        <button
          type="button"
          onClick={() => applyPreset('das4')}
          className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all border ${
            filters.das === 'DAS 4'
              ? 'bg-lime-400 text-slate-900 border-lime-400 shadow-sm'
              : 'bg-[#02241e] text-emerald-200 border-emerald-500/30 hover:bg-emerald-800/40'
          }`}
        >
          DAS 4 (Batung)
        </button>
        <button
          type="button"
          onClick={() => applyPreset('dasrt1')}
          className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all border ${
            filters.das === 'DAS RT1'
              ? 'bg-lime-400 text-slate-900 border-lime-400 shadow-sm'
              : 'bg-[#02241e] text-emerald-200 border-emerald-500/30 hover:bg-emerald-800/40'
          }`}
        >
          DAS RT1 (Sabuhur/Batakan)
        </button>
        <button
          type="button"
          onClick={() => applyPreset('kritis')}
          className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all border ${
            filters.persentaseHidup === '<=40'
              ? 'bg-rose-500 text-white border-rose-400 shadow-sm'
              : 'bg-[#02241e] text-rose-300 border-rose-500/30 hover:bg-rose-900/40'
          }`}
        >
          Kritis (SR ≤40%)
        </button>
      </div>

      {/* Active Filter Chips Strip */}
      {activeFilterTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-2 pb-1 border-t border-emerald-500/15">
          <span className="text-[10px] uppercase font-bold text-emerald-300/70 mr-1 flex items-center gap-1">
            <Tag className="w-2.5 h-2.5" />
            Aktif:
          </span>
          {activeFilterTags.map((t) => (
            <span
              key={t.key}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-lime-400/15 border border-lime-400/40 text-lime-300 text-[11px] font-medium"
            >
              <strong className="text-emerald-200">{t.label}:</strong>
              <span className="truncate max-w-[130px]">{t.value}</span>
              <button
                type="button"
                onClick={() => updateSingleFilter(t.key, 'all')}
                className="hover:text-white rounded-full p-0.5"
                title={`Hapus filter ${t.label}`}
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={onResetFilters}
            className="text-[10px] text-rose-300 hover:text-rose-200 underline ml-1 font-semibold"
          >
            Bersihkan Semua
          </button>
        </div>
      )}

      {/* 16 Comprehensive Filter Variables in Responsive Grid */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-emerald-500/20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs animate-fade-in">
          {/* 1. DAS */}
          <div className="flex flex-col gap-1">
            <label htmlFor="filter-das" className="text-[11px] font-bold text-emerald-200 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-lime-400" />
              <span>1. DAS</span>
              {filters.das !== 'all' && <span className="w-1.5 h-1.5 rounded-full bg-lime-400" />}
            </label>
            <select
              id="filter-das"
              value={filters.das}
              onChange={(e) => updateSingleFilter('das', e.target.value)}
              className={`w-full bg-[#02241e] border text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-lime-400 transition-colors ${
                filters.das !== 'all'
                  ? 'border-lime-400/80 text-lime-300 font-semibold bg-emerald-950/60'
                  : 'border-emerald-500/30 text-emerald-100'
              }`}
            >
              <option value="all">All (Semua DAS)</option>
              {options.dasOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.value} ({opt.count} PU)
                </option>
              ))}
            </select>
          </div>

          {/* 2. Blok */}
          <div className="flex flex-col gap-1">
            <label htmlFor="filter-blok" className="text-[11px] font-bold text-emerald-200 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-lime-400" />
              <span>2. Blok</span>
              {filters.blok !== 'all' && <span className="w-1.5 h-1.5 rounded-full bg-lime-400" />}
            </label>
            <select
              id="filter-blok"
              value={filters.blok}
              onChange={(e) => updateSingleFilter('blok', e.target.value)}
              className={`w-full bg-[#02241e] border text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-lime-400 transition-colors ${
                filters.blok !== 'all'
                  ? 'border-lime-400/80 text-lime-300 font-semibold bg-emerald-950/60'
                  : 'border-emerald-500/30 text-emerald-100'
              }`}
            >
              <option value="all">All (Semua Blok)</option>
              {options.blokOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.value} ({opt.count} PU)
                </option>
              ))}
            </select>
          </div>

          {/* 3. Petak */}
          <div className="flex flex-col gap-1">
            <label htmlFor="filter-petak" className="text-[11px] font-bold text-emerald-200 flex items-center gap-1.5">
              <Trees className="w-3.5 h-3.5 text-lime-400" />
              <span>3. Petak</span>
              {filters.petak !== 'all' && <span className="w-1.5 h-1.5 rounded-full bg-lime-400" />}
            </label>
            <select
              id="filter-petak"
              value={filters.petak}
              onChange={(e) => updateSingleFilter('petak', e.target.value)}
              className={`w-full bg-[#02241e] border text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-lime-400 transition-colors ${
                filters.petak !== 'all'
                  ? 'border-lime-400/80 text-lime-300 font-semibold bg-emerald-950/60'
                  : 'border-emerald-500/30 text-emerald-100'
              }`}
            >
              <option value="all">All (Semua Petak)</option>
              {options.petakOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.value} ({opt.count} PU)
                </option>
              ))}
            </select>
          </div>

          {/* 4. Periode Evaluasi */}
          <div className="flex flex-col gap-1">
            <label htmlFor="filter-periode" className="text-[11px] font-bold text-emerald-200 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-lime-400" />
              <span>4. Periode Evaluasi</span>
              {filters.periodeEvaluasi !== 'all' && <span className="w-1.5 h-1.5 rounded-full bg-lime-400" />}
            </label>
            <select
              id="filter-periode"
              value={filters.periodeEvaluasi}
              onChange={(e) => updateSingleFilter('periodeEvaluasi', e.target.value)}
              className={`w-full bg-[#02241e] border text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-lime-400 transition-colors ${
                filters.periodeEvaluasi !== 'all'
                  ? 'border-lime-400/80 text-lime-300 font-semibold bg-emerald-950/60'
                  : 'border-emerald-500/30 text-emerald-100'
              }`}
            >
              <option value="all">All (Semua Periode)</option>
              {options.periodeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.value} ({opt.count} PU)
                </option>
              ))}
            </select>
          </div>

          {/* 5. Lokasi Daerah */}
          <div className="flex flex-col gap-1">
            <label htmlFor="filter-lokasi" className="text-[11px] font-bold text-emerald-200 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-lime-400" />
              <span>5. Lokasi Daerah</span>
              {filters.lokasiDaerah !== 'all' && <span className="w-1.5 h-1.5 rounded-full bg-lime-400" />}
            </label>
            <select
              id="filter-lokasi"
              value={filters.lokasiDaerah}
              onChange={(e) => updateSingleFilter('lokasiDaerah', e.target.value)}
              className={`w-full bg-[#02241e] border text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-lime-400 transition-colors ${
                filters.lokasiDaerah !== 'all'
                  ? 'border-lime-400/80 text-lime-300 font-semibold bg-emerald-950/60'
                  : 'border-emerald-500/30 text-emerald-100'
              }`}
            >
              <option value="all">All (Semua Lokasi)</option>
              {options.lokasiOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.value} ({opt.count} PU)
                </option>
              ))}
            </select>
          </div>

          {/* 6. Titik Koordinat (UTM) */}
          <div className="flex flex-col gap-1">
            <label htmlFor="filter-utm" className="text-[11px] font-bold text-emerald-200 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-lime-400" />
              <span>6. Titik Koordinat (UTM)</span>
              {filters.titikKoordinatUtm !== 'all' && <span className="w-1.5 h-1.5 rounded-full bg-lime-400" />}
            </label>
            <select
              id="filter-utm"
              value={filters.titikKoordinatUtm}
              onChange={(e) => updateSingleFilter('titikKoordinatUtm', e.target.value)}
              className={`w-full bg-[#02241e] border text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-lime-400 transition-colors ${
                filters.titikKoordinatUtm !== 'all'
                  ? 'border-lime-400/80 text-lime-300 font-semibold bg-emerald-950/60'
                  : 'border-emerald-500/30 text-emerald-100'
              }`}
            >
              <option value="all">All (Semua Zona UTM)</option>
              {options.utmOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  Zona {opt.value} ({opt.count} PU)
                </option>
              ))}
            </select>
          </div>

          {/* 7. Tahun Tanam */}
          <div className="flex flex-col gap-1">
            <label htmlFor="filter-tahun" className="text-[11px] font-bold text-emerald-200 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-lime-400" />
              <span>7. Tahun Tanam</span>
              {filters.tahunTanam !== 'all' && <span className="w-1.5 h-1.5 rounded-full bg-lime-400" />}
            </label>
            <select
              id="filter-tahun"
              value={filters.tahunTanam}
              onChange={(e) => updateSingleFilter('tahunTanam', e.target.value)}
              className={`w-full bg-[#02241e] border text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-lime-400 transition-colors ${
                filters.tahunTanam !== 'all'
                  ? 'border-lime-400/80 text-lime-300 font-semibold bg-emerald-950/60'
                  : 'border-emerald-500/30 text-emerald-100'
              }`}
            >
              <option value="all">All (Semua Tahun)</option>
              {options.tahunOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  Tahun {opt.value} ({opt.count} PU)
                </option>
              ))}
            </select>
          </div>

          {/* 8. Kategori */}
          <div className="flex flex-col gap-1">
            <label htmlFor="filter-kategori" className="text-[11px] font-bold text-emerald-200 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-lime-400 inline-block" />
              <span>8. Kategori Kinerja</span>
              {filters.kategori !== 'all' && <span className="w-1.5 h-1.5 rounded-full bg-lime-400" />}
            </label>
            <select
              id="filter-kategori"
              value={filters.kategori}
              onChange={(e) => updateSingleFilter('kategori', e.target.value)}
              className={`w-full bg-[#02241e] border text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-lime-400 transition-colors ${
                filters.kategori !== 'all'
                  ? 'border-lime-400/80 text-lime-300 font-semibold bg-emerald-950/60'
                  : 'border-emerald-500/30 text-emerald-100'
              }`}
            >
              <option value="all">All (Semua Kategori)</option>
              {options.kategoriOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} ({opt.count} PU)
                </option>
              ))}
            </select>
          </div>

          {/* 9. Pengawas Operasional Lapangan */}
          <div className="flex flex-col gap-1">
            <label htmlFor="filter-pengawas" className="text-[11px] font-bold text-emerald-200 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-lime-400" />
              <span>9. Pengawas Operasional</span>
              {filters.pengawasOperasional !== 'all' && <span className="w-1.5 h-1.5 rounded-full bg-lime-400" />}
            </label>
            <select
              id="filter-pengawas"
              value={filters.pengawasOperasional}
              onChange={(e) => updateSingleFilter('pengawasOperasional', e.target.value)}
              className={`w-full bg-[#02241e] border text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-lime-400 transition-colors ${
                filters.pengawasOperasional !== 'all'
                  ? 'border-lime-400/80 text-lime-300 font-semibold bg-emerald-950/60'
                  : 'border-emerald-500/30 text-emerald-100'
              }`}
            >
              <option value="all">All (Semua Pengawas)</option>
              {options.pengawasOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.value} ({opt.count} PU)
                </option>
              ))}
            </select>
          </div>

          {/* 10. Persentase Hidup Tanaman */}
          <div className="flex flex-col gap-1">
            <label htmlFor="filter-persentase" className="text-[11px] font-bold text-emerald-200 flex items-center gap-1.5">
              <Percent className="w-3.5 h-3.5 text-lime-400" />
              <span>10. Persentase Hidup Tanaman</span>
              {filters.persentaseHidup !== 'all' && <span className="w-1.5 h-1.5 rounded-full bg-lime-400" />}
            </label>
            <select
              id="filter-persentase"
              value={filters.persentaseHidup}
              onChange={(e) => updateSingleFilter('persentaseHidup', e.target.value)}
              className={`w-full bg-[#02241e] border text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-lime-400 transition-colors ${
                filters.persentaseHidup !== 'all'
                  ? 'border-lime-400/80 text-lime-300 font-semibold bg-emerald-950/60'
                  : 'border-emerald-500/30 text-emerald-100'
              }`}
            >
              <option value="all">All (Semua Persentase)</option>
              {options.persentaseHidupOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* 11. Jarak Tanam */}
          <div className="flex flex-col gap-1">
            <label htmlFor="filter-jarak" className="text-[11px] font-bold text-emerald-200 flex items-center gap-1.5">
              <Trees className="w-3.5 h-3.5 text-lime-400" />
              <span>11. Jarak Tanam</span>
              {filters.jarakTanam !== 'all' && <span className="w-1.5 h-1.5 rounded-full bg-lime-400" />}
            </label>
            <select
              id="filter-jarak"
              value={filters.jarakTanam}
              onChange={(e) => updateSingleFilter('jarakTanam', e.target.value)}
              className={`w-full bg-[#02241e] border text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-lime-400 transition-colors ${
                filters.jarakTanam !== 'all'
                  ? 'border-lime-400/80 text-lime-300 font-semibold bg-emerald-950/60'
                  : 'border-emerald-500/30 text-emerald-100'
              }`}
            >
              <option value="all">All (Semua Jarak Tanam)</option>
              {options.jarakTanamOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.value} ({opt.count} PU)
                </option>
              ))}
            </select>
          </div>

          {/* 12. Jenis Tanaman */}
          <div className="flex flex-col gap-1">
            <label htmlFor="filter-tanaman" className="text-[11px] font-bold text-emerald-200 flex items-center gap-1.5">
              <Sprout className="w-3.5 h-3.5 text-lime-400" />
              <span>12. Jenis Tanaman</span>
              {filters.jenisTanaman !== 'all' && <span className="w-1.5 h-1.5 rounded-full bg-lime-400" />}
            </label>
            <select
              id="filter-tanaman"
              value={filters.jenisTanaman}
              onChange={(e) => updateSingleFilter('jenisTanaman', e.target.value)}
              className={`w-full bg-[#02241e] border text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-lime-400 transition-colors ${
                filters.jenisTanaman !== 'all'
                  ? 'border-lime-400/80 text-lime-300 font-semibold bg-emerald-950/60'
                  : 'border-emerald-500/30 text-emerald-100'
              }`}
            >
              <option value="all">All (Semua Jenis Tanaman)</option>
              {options.tanamanOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.value} ({opt.count} PU)
                </option>
              ))}
            </select>
          </div>

          {/* 13. Suhu Lingkungan */}
          <div className="flex flex-col gap-1">
            <label htmlFor="filter-suhu" className="text-[11px] font-bold text-emerald-200 flex items-center gap-1.5">
              <Thermometer className="w-3.5 h-3.5 text-lime-400" />
              <span>13. Suhu Lingkungan</span>
              {filters.suhuLingkungan !== 'all' && <span className="w-1.5 h-1.5 rounded-full bg-lime-400" />}
            </label>
            <select
              id="filter-suhu"
              value={filters.suhuLingkungan}
              onChange={(e) => updateSingleFilter('suhuLingkungan', e.target.value)}
              className={`w-full bg-[#02241e] border text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-lime-400 transition-colors ${
                filters.suhuLingkungan !== 'all'
                  ? 'border-lime-400/80 text-lime-300 font-semibold bg-emerald-950/60'
                  : 'border-emerald-500/30 text-emerald-100'
              }`}
            >
              <option value="all">All (Semua Suhu Lingkungan)</option>
              {options.suhuOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* 14. Kelembaban Udara */}
          <div className="flex flex-col gap-1">
            <label htmlFor="filter-kelembaban" className="text-[11px] font-bold text-emerald-200 flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5 text-lime-400" />
              <span>14. Kelembaban Udara</span>
              {filters.kelembabanUdara !== 'all' && <span className="w-1.5 h-1.5 rounded-full bg-lime-400" />}
            </label>
            <select
              id="filter-kelembaban"
              value={filters.kelembabanUdara}
              onChange={(e) => updateSingleFilter('kelembabanUdara', e.target.value)}
              className={`w-full bg-[#02241e] border text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-lime-400 transition-colors ${
                filters.kelembabanUdara !== 'all'
                  ? 'border-lime-400/80 text-lime-300 font-semibold bg-emerald-950/60'
                  : 'border-emerald-500/30 text-emerald-100'
              }`}
            >
              <option value="all">All (Semua Kelembaban)</option>
              {options.kelembabanOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* 15. Jenis Tanah */}
          <div className="flex flex-col gap-1">
            <label htmlFor="filter-tanah" className="text-[11px] font-bold text-emerald-200 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-lime-400" />
              <span>15. Jenis Tanah</span>
              {filters.jenisTanah !== 'all' && <span className="w-1.5 h-1.5 rounded-full bg-lime-400" />}
            </label>
            <select
              id="filter-tanah"
              value={filters.jenisTanah}
              onChange={(e) => updateSingleFilter('jenisTanah', e.target.value)}
              className={`w-full bg-[#02241e] border text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-lime-400 transition-colors ${
                filters.jenisTanah !== 'all'
                  ? 'border-lime-400/80 text-lime-300 font-semibold bg-emerald-950/60'
                  : 'border-emerald-500/30 text-emerald-100'
              }`}
            >
              <option value="all">All (Semua Jenis Tanah)</option>
              {options.tanahOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.value} ({opt.count} PU)
                </option>
              ))}
            </select>
          </div>

          {/* 16. pH Tanah */}
          <div className="flex flex-col gap-1">
            <label htmlFor="filter-ph" className="text-[11px] font-bold text-emerald-200 flex items-center gap-1.5">
              <span className="text-lime-400 font-mono font-bold text-xs">pH</span>
              <span>16. pH Tanah</span>
              {filters.pHTanah !== 'all' && <span className="w-1.5 h-1.5 rounded-full bg-lime-400" />}
            </label>
            <select
              id="filter-ph"
              value={filters.pHTanah}
              onChange={(e) => updateSingleFilter('pHTanah', e.target.value)}
              className={`w-full bg-[#02241e] border text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-lime-400 transition-colors ${
                filters.pHTanah !== 'all'
                  ? 'border-lime-400/80 text-lime-300 font-semibold bg-emerald-950/60'
                  : 'border-emerald-500/30 text-emerald-100'
              }`}
            >
              <option value="all">All (Semua pH Tanah)</option>
              {options.phOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
};
