import React from 'react';
import { SurvivalCategory } from '../types';
import { CATEGORY_INFO_MAP } from '../utils/survivalHelper';
import { Info, Check } from 'lucide-react';

interface LegendWidgetProps {
  activeCategoryFilter: string;
  onSelectCategoryFilter: (cat: string) => void;
  countByKategori: {
    hitam: number;
    merah: number;
    kuning: number;
    hijau: number;
  };
  totalPU: number;
}

export const LegendWidget: React.FC<LegendWidgetProps> = ({
  activeCategoryFilter,
  onSelectCategoryFilter,
  countByKategori,
  totalPU,
}) => {
  const categories: {
    id: SurvivalCategory;
    range: string;
    label: string;
    bgHex: string;
    borderHex: string;
    count: number;
    keterangan: string;
  }[] = [
    {
      id: 'hitam',
      range: '0 - 40%',
      label: 'Hitam',
      bgHex: '#0f172a',
      borderHex: '#ffffff',
      count: countByKategori.hitam,
      keterangan: 'Kritis / Wajib Sulam 100%',
    },
    {
      id: 'merah',
      range: '>40 - <75%',
      label: 'Merah',
      bgHex: '#dc2626',
      borderHex: '#ef4444',
      count: countByKategori.merah,
      keterangan: 'Kurang / Perlu Sulam Intensif',
    },
    {
      id: 'kuning',
      range: '75 - 80%',
      label: 'Kuning',
      bgHex: '#eab308',
      borderHex: '#ca8a04',
      count: countByKategori.kuning,
      keterangan: 'Sedang / Ambang Batas Minimal',
    },
    {
      id: 'hijau',
      range: '>80%',
      label: 'Hijau',
      bgHex: '#16a34a',
      borderHex: '#22c55e',
      count: countByKategori.hijau,
      keterangan: 'Baik / Berhasil Sempurna',
    },
  ];

  return (
    <div className="bg-[#04332b]/90 backdrop-blur-md rounded-xl p-3.5 border border-emerald-500/30 shadow-xl text-xs text-emerald-100">
      <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-emerald-500/20">
        <div className="flex items-center gap-2 font-bold text-white text-xs">
          <Info className="w-3.5 h-3.5 text-lime-400" />
          <span>Kriteria Nilai Survival Rate (Petak Ukur) &bull; Acuan Teknis PT Adaro Indonesia</span>
        </div>
        <button
          id="legend-filter-all-btn"
          onClick={() => onSelectCategoryFilter('all')}
          className={`text-[11px] px-2.5 py-0.5 rounded-lg font-bold transition-colors ${
            activeCategoryFilter === 'all'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm border border-emerald-400/40'
              : 'text-emerald-300 hover:text-white hover:bg-emerald-900/40'
          }`}
        >
          Tampilkan Semua ({totalPU})
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {categories.map((c) => {
          const isActive = activeCategoryFilter === c.id;
          return (
            <button
              key={c.id}
              id={`legend-filter-${c.id}-btn`}
              onClick={() => onSelectCategoryFilter(isActive ? 'all' : c.id)}
              className={`p-2.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                isActive
                  ? 'ring-2 ring-lime-400 bg-[#064a3e] border-emerald-400 shadow-md'
                  : 'bg-[#022720]/80 hover:bg-[#053d33] border-emerald-500/25'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3.5 h-3.5 rounded-full inline-block shadow-sm"
                    style={{
                      backgroundColor: c.bgHex,
                      border: `1.5px solid ${c.borderHex}`,
                    }}
                  />
                  <span className="font-bold text-white text-xs">{c.range}</span>
                </div>
                <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-emerald-950/80 text-lime-300 border border-emerald-500/30">
                  {c.count} PU
                </span>
              </div>

              <div className="text-[10px] text-emerald-200/80 leading-tight">
                <span className="font-semibold text-emerald-100 block">{c.label}:</span>
                {c.keterangan}
              </div>

              {isActive && (
                <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-lime-400 animate-ping" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
