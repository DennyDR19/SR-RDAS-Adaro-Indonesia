import React, { useState } from 'react';
import { PetakUkur } from '../types';
import { computeDasMetrics } from '../utils/survivalHelper';
import {
  X,
  Share2,
  Copy,
  Check,
  MessageSquare,
  Send,
  Twitter,
  Linkedin,
  Mail,
  FileText,
} from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  puList: PetakUkur[];
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  puList,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const metrics = computeDasMetrics(puList);
  const nowStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const shareText = `*RINGKASAN KINERJA REHABILITASI DAERAH ALIRAN SUNGAI (DAS)*
Evaluasi Data Petak Ukur (PU) - ${nowStr}

📊 *Indikator Kinerja Utama:*
• Rata-Rata Survival Rate: *${metrics.rataRataSurvivalRate}%*
• Status Kelulusan Standar (≥75%): *${metrics.persentaseLulusStandar}%* (${metrics.countByKategori.kuning + metrics.countByKategori.hijau}/${metrics.totalPU} PU)
• Total Tanaman Hidup: *${metrics.totalPohonHidup.toLocaleString()}* dari *${metrics.totalPohonAwal.toLocaleString()}* btg
• Kebutuhan Bibit Penyulaman: *${metrics.totalKebutuhanSulam.toLocaleString()}* btg

🎯 *Distribusi Kategori Survival Rate:*
⬛ 0 - 40% (Hitam / Kritis): ${metrics.countByKategori.hitam} PU (Wajib Sulam 100%)
🟥 >40 - <75% (Merah / Kurang): ${metrics.countByKategori.merah} PU (Sulam Intensif)
🟨 75 - 80% (Kuning / Sedang): ${metrics.countByKategori.kuning} PU (Ambang Batas)
🟩 >80% (Hijau / Berhasil): ${metrics.countByKategori.hijau} PU (Sangat Memuaskan)

Pantau progres pemetaan spasial dan sinkronisasi real-time tim di Sistem Informasi Geografis Rehabilitasi DAS.`;

  const encodedText = encodeURIComponent(shareText);
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const encodedUrl = encodeURIComponent(currentUrl);

  const handleCopy = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const shareChannels = [
    {
      name: 'WhatsApp',
      icon: MessageSquare,
      color: 'bg-emerald-600 hover:bg-emerald-500',
      textColor: 'text-emerald-400',
      url: `https://api.whatsapp.com/send?text=${encodedText}`,
    },
    {
      name: 'Telegram',
      icon: Send,
      color: 'bg-sky-600 hover:bg-sky-500',
      textColor: 'text-sky-400',
      url: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
    },
    {
      name: 'Twitter / X',
      icon: Twitter,
      color: 'bg-zinc-800 hover:bg-zinc-700',
      textColor: 'text-zinc-300',
      url: `https://twitter.com/intent/tweet?text=${encodedText}`,
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'bg-blue-700 hover:bg-blue-600',
      textColor: 'text-blue-400',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    },
    {
      name: 'Email Rekan',
      icon: Mail,
      color: 'bg-indigo-600 hover:bg-indigo-500',
      textColor: 'text-indigo-400',
      url: `mailto:?subject=${encodeURIComponent('Laporan Kinerja Rehabilitasi DAS')}&body=${encodedText}`,
    },
  ];

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">
                Bagikan Ringkasan Kinerja ke Tim & Media Sosial
              </h2>
              <p className="text-[11px] text-slate-400">
                Kirim ringkasan capaian survival rate ke saluran koordinasi lapangan
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

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-200">
          {/* Quick share buttons */}
          <div>
            <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block mb-2">
              Pilih Saluran Berbagi Langsung
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {shareChannels.map((ch) => {
                const Icon = ch.icon;
                return (
                  <a
                    key={ch.name}
                    href={ch.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800 flex items-center gap-2.5 transition-all text-xs font-semibold text-slate-200 shadow-sm"
                  >
                    <div className={`w-7 h-7 rounded-lg ${ch.color} text-white flex items-center justify-center shrink-0`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span>{ch.name}</span>
                  </a>
                );
              })}
            </div>
          </div>

          {/* Text Preview to Copy */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                Format Pesan Ringkasan Siap Kirim
              </span>
              <button
                onClick={handleCopy}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 font-semibold text-xs flex items-center gap-1.5 transition-colors border border-slate-700"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Pesan</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 whitespace-pre-wrap leading-relaxed max-h-52 overflow-y-auto">
              {shareText}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950/80 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
