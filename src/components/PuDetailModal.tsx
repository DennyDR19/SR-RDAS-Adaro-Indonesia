import React from 'react';
import { PetakUkur } from '../types';
import { getCategoryInfo } from '../utils/survivalHelper';
import { latLonToUtm, formatUtmDisplay } from '../utils/utmHelper';
import {
  X,
  MapPin,
  Calendar,
  User,
  TreeDeciduous,
  ShieldAlert,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  Sparkles,
  AlertCircle,
  Thermometer,
  Droplets,
  Mountain,
  Layers,
  Compass,
  FileText,
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

  // Compute UTM display string
  const utmStr =
    pu.koordinatUtm ||
    (pu.utmEasting && pu.utmNorthing
      ? `${pu.utmZone || '48S'} X: ${pu.utmEasting} m, Y: ${pu.utmNorthing} m`
      : (() => {
          const u = latLonToUtm(pu.latitude, pu.longitude);
          return formatUtmDisplay(u.zone, u.hemisphere, u.easting, u.northing);
        })());

  const survivalRateVal = pu.persentaseHidup !== undefined ? pu.persentaseHidup : pu.survivalRate;
  const tglPengambilan = pu.tanggalPengambilanData || pu.tanggalEvaluasi;
  const rawInputDate = pu.tanggalInput || pu.tanggalTerinput || pu.updatedAt || pu.tanggalEvaluasi;
  let formattedInputDate = rawInputDate;
  try {
    const d = new Date(rawInputDate);
    if (!isNaN(d.getTime())) {
      formattedInputDate = d.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }) + (rawInputDate.includes('T') ? ` ${d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB` : '');
    }
  } catch {
    // fallback
  }
  const namaDas = pu.das || pu.subDas;
  const lokasi = pu.lokasiDaerah || (pu.desa ? `${pu.desa}, Kec. ${pu.kecamatan}` : 'Wilayah DAS');
  const namaAssessor = pu.assessor || pu.evaluator;
  const catatan = pu.catatanTambahan || pu.catatan;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg shadow-lg shrink-0"
              style={{
                backgroundColor: catInfo.colorHex,
                border: `2px solid ${catInfo.markerBorderColor}`,
                color: pu.kategori === 'kuning' ? '#0f172a' : '#ffffff',
              }}
            >
              {Math.round(survivalRateVal)}%
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-100">{pu.kodePU}</h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${catInfo.badgeBg} ${catInfo.badgeBorder} ${catInfo.badgeText}`}
                >
                  {catInfo.rangeLabel} ({catInfo.name})
                </span>
                {pu.petak && (
                  <span className="px-2 py-0.5 rounded text-[11px] bg-slate-800 text-cyan-300 font-mono border border-slate-700">
                    {pu.petak}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {pu.blok} &bull; {lokasi} &bull; {namaDas}
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
        <div className="p-6 overflow-y-auto space-y-4 text-slate-200 text-xs">
          {/* Section: Identifikasi Geospasial & Administrasi */}
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              Identifikasi Geospasial & Administrasi Petak
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div>
                <span className="text-slate-400 text-[10px] block">Kode Petak Ukur</span>
                <span className="font-bold text-slate-100 font-mono text-sm">{pu.kodePU}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Periode Evaluasi</span>
                <span className="font-semibold text-slate-200">{pu.periodeEvaluasi}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">DAS</span>
                <span className="font-semibold text-slate-200">{namaDas}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Tgl Sensus Lapangan</span>
                <span className="font-semibold text-slate-200">{tglPengambilan}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Tgl Terinput ke Web</span>
                <span className="font-semibold text-lime-300 font-mono text-[11px]">{formattedInputDate}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-slate-800/80 pt-2 text-[11px]">
              <div>
                <span className="text-slate-400 text-[10px] block">Blok & Petak</span>
                <span className="text-slate-200 font-medium">
                  {pu.blok} / {pu.petak || '-'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Lokasi Daerah</span>
                <span className="text-slate-200 font-medium">{lokasi}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Titik Koordinat (UTM)</span>
                <span className="text-cyan-300 font-mono font-bold block">{utmStr}</span>
                <span className="text-[10px] text-slate-500 font-mono">
                  Lat: {pu.latitude.toFixed(5)}, Lon: {pu.longitude.toFixed(5)}
                </span>
              </div>
            </div>
          </div>

          {/* Section: Parameter Silvikultur & Kinerja Tanaman */}
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <TreeDeciduous className="w-3.5 h-3.5 text-emerald-400" />
              Kinerja Tanaman & Parameter Silvikultur
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Persentase Hidup</span>
                <span className="text-xl font-black text-emerald-400">{survivalRateVal}%</span>
                <span className="text-[10px] text-slate-400 block">{catInfo.statusKinerja}</span>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Kategori Penilaian</span>
                <span className="text-sm font-bold text-slate-200">{catInfo.name}</span>
                <span className="text-[10px] text-slate-400 block">{catInfo.rangeLabel}</span>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Tahun Tanam</span>
                <span className="text-base font-bold text-slate-200">{pu.tahunTanam}</span>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Jarak Tanam</span>
                <span className="text-base font-bold text-slate-200">{pu.jarakTanam || '3 x 3 m'}</span>
              </div>
            </div>

            <div>
              <span className="text-slate-400 text-[11px] block mb-1">Jenis Tanaman:</span>
              <div className="flex flex-wrap gap-1.5">
                {pu.jenisTanaman.map((sp, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded bg-slate-800 text-slate-200 border border-slate-700 text-xs font-medium"
                  >
                    {sp}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Section: Parameter Biofisik & Lingkungan */}
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Mountain className="w-3.5 h-3.5 text-amber-400" />
              Parameter Biofisik & Kondisi Lingkungan Lahan
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[10px] block flex items-center gap-1">
                  <Thermometer className="w-3 h-3 text-amber-400" />
                  Suhu
                </span>
                <span className="font-bold text-slate-200">{pu.suhuLingkungan || '24°C'}</span>
              </div>
              <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[10px] block flex items-center gap-1">
                  <Droplets className="w-3 h-3 text-cyan-400" />
                  Kelembaban
                </span>
                <span className="font-bold text-slate-200">{pu.kelembabanUdara || '78%'}</span>
              </div>
              <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Jenis Tanah</span>
                <span className="font-bold text-slate-200">{pu.jenisTanah || 'Andosol'}</span>
              </div>
              <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[10px] block">pH Tanah</span>
                <span className="font-bold text-slate-200 font-mono">{pu.pHTanah || '6.2'}</span>
              </div>
              <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Kemiringan</span>
                <span className="font-bold text-slate-200">{pu.kemiringanLahan || 'Landai (8-15%)'}</span>
              </div>
            </div>
          </div>

          {/* Section: Personel & Catatan Tambahan */}
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-purple-400" />
              Personel Penilai & Catatan Tambahan
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
              <div>
                <span className="text-slate-400 text-[10px] block">Pengawas Operasional Lapangan:</span>
                <span className="font-semibold text-slate-200">
                  {pu.pengawasOperasional || 'Ir. Bambang S., S.Hut'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Assessor:</span>
                <span className="font-semibold text-slate-200">{namaAssessor}</span>
              </div>
            </div>

            {catatan && (
              <div className="mt-2 bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-semibold mb-0.5">
                  Catatan Tambahan:
                </span>
                <p className="text-slate-300 italic leading-relaxed">"{catatan}"</p>
              </div>
            )}
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
