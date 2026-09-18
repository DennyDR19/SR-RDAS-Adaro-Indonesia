import React from 'react';
import { PetakUkur } from '../types';
import { getCategoryInfo } from '../utils/survivalHelper';
import {
  X,
  MapPin,
  Calendar,
  User,
  TreeDeciduous,
  ShieldAlert,
  Edit,
  Trash2,
  ExternalLink,
  CheckCircle,
  Clock,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

interface PuDetailModalProps {
  pu: PetakUkur | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (pu: PetakUkur) => void;
  onDelete: (id: string) => void;
}

export const PuDetailModal: React.FC<PuDetailModalProps> = ({
  pu,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}) => {
  if (!isOpen || !pu) return null;

  const catInfo = getCategoryInfo(pu.kategori);

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base shadow-lg"
              style={{
                backgroundColor: catInfo.colorHex,
                border: `2px solid ${catInfo.markerBorderColor}`,
                color: pu.kategori === 'kuning' ? '#0f172a' : '#ffffff',
              }}
            >
              {Math.round(pu.survivalRate)}%
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-100">{pu.kodePU}</h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${catInfo.badgeBg} ${catInfo.badgeBorder} ${catInfo.badgeText}`}
                >
                  {catInfo.rangeLabel} ({catInfo.name})
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {pu.blok}, {pu.desa}, Kec. {pu.kecamatan} &bull; {pu.subDas}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-200 text-xs">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">
                Survival Rate
              </span>
              <span className="text-2xl font-extrabold" style={{ color: catInfo.colorHex }}>
                {pu.survivalRate}%
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {catInfo.statusKinerja}
              </span>
            </div>

            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">
                Tanaman Hidup
              </span>
              <span className="text-2xl font-extrabold text-emerald-400">
                {pu.tanamanHidup}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                dari {pu.tanamanAwal} btg awal
              </span>
            </div>

            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">
                Kebutuhan Sulam
              </span>
              <span
                className={`text-2xl font-extrabold ${
                  pu.kebutuhanPenyulaman > 0 ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {pu.kebutuhanPenyulaman}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">bibit pengganti</span>
            </div>

            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">
                Kondisi Kesehatan
              </span>
              <span className="text-sm font-bold text-slate-100 block mt-1">
                {pu.kesehatanTanaman}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Merana: {pu.tanamanMerana} btg
              </span>
            </div>
          </div>

          {/* Technical Vegetative Parameters */}
          <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/80 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <TreeDeciduous className="w-3.5 h-3.5 text-emerald-400" />
              Parameter Silvikultur & Vegetasi Petak
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-slate-400 text-[11px] block">Komposisi Jenis Tanaman</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {pu.jenisTanaman.map((sp, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 text-[11px] font-medium"
                    >
                      {sp}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-slate-400 text-[11px] block">Tinggi Rata-Rata</span>
                <span className="text-sm font-semibold text-slate-200 mt-1 block">
                  {pu.tinggiRataRataCm} cm ({(pu.tinggiRataRataCm / 100).toFixed(2)} m)
                </span>
              </div>

              <div>
                <span className="text-slate-400 text-[11px] block">Tutupan Tajuk</span>
                <span className="text-sm font-semibold text-slate-200 mt-1 block">
                  {pu.tutupanTajukPersen}% kanopi
                </span>
              </div>
            </div>
          </div>

          {/* Technical Recommendation & Action Needed */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 space-y-2">
            <div className="flex items-center gap-2 text-slate-100 font-bold text-xs">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span>Rekomendasi Tindak Lanjut Teknis Lapangan</span>
            </div>
            <p className="text-slate-300 leading-relaxed bg-slate-900/80 p-3 rounded-lg border border-slate-800">
              {pu.rekomendasi}
            </p>
            {pu.catatan && (
              <p className="text-[11px] text-slate-400 italic">
                <strong>Catatan Petugas Lapangan:</strong> "{pu.catatan}"
              </p>
            )}
          </div>

          {/* Geospatial and Administrative Metadata */}
          <div className="grid grid-cols-2 gap-3 text-slate-400 text-[11px] border-t border-slate-800/80 pt-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>
                Lat: {pu.latitude.toFixed(5)}, Long: {pu.longitude.toFixed(5)} (Luas {pu.luasHa} Ha)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>
                Evaluasi: {pu.tanggalEvaluasi} ({pu.periodeEvaluasi})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>Penilai: {pu.evaluator}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>Tahun Tanam: {pu.tahunTanam}</span>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-3.5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={() => {
              if (confirm(`Apakah Anda yakin ingin menghapus data petak ukur ${pu.kodePU}?`)) {
                onDelete(pu.id);
                onClose();
              }
            }}
            className="px-3 py-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 text-xs font-medium border border-rose-900/60 flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Hapus Titik
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              Tutup
            </button>
            <button
              onClick={() => {
                onClose();
                onEdit(pu);
              }}
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg transition-colors"
            >
              <Edit className="w-3.5 h-3.5" />
              Perbarui Data PU
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
