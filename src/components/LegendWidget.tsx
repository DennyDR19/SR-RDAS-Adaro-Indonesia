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
    <div className="bg-slate-900/90 backdrop-blur-md rounded-xl p-3 border border-slate-800 shadow-xl text-xs text-slate-200">
      <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-800">
        <div className="flex items-center gap-1.5 font-bold text-slate-100 text-xs">
          <Info className="w-3.5 h-3.5 text-emerald-400" />
          <span>Kriteria Nilai Survival Rate (Petak Ukur)</span>
        </div>
        <button
          id="legend-filter-all-btn"
          onClick={() => onSelectCategoryFilter('all')}
          className={`text-[11px] px-2 py-0.5 rounded font-medium transition-colors ${
            activeCategoryFilter === 'all'
              ? 'bg-emerald-600 text-white'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          Semua ({totalPU})
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
              className={`p-2 rounded-lg border text-left transition-all relative flex flex-col justify-between ${
                isActive
                  ? 'ring-2 ring-cyan-400 bg-slate-800/90 border-slate-600 shadow-md'
                  : 'bg-slate-950/50 hover:bg-slate-800/60 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3.5 h-3.5 rounded-full inline-block shadow-sm"
                    style={{
                      backgroundColor: c.bgHex,
                      border: `1.5px solid ${c.borderHex}`,
                    }}
                  />
                  <span className="font-bold text-slate-100 text-xs">{c.range}</span>
                </div>
                <span className="font-mono text-xs font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                  {c.count} PU
                </span>
              </div>

              <div className="text-[10px] text-slate-400 leading-tight">
                <span className="font-medium text-slate-300 block">{c.label}:</span>
                {c.keterangan}
              </div>

              {isActive && (
                <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-cyan-400" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
