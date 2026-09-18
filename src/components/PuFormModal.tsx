import React, { useState, useEffect } from 'react';
import { PetakUkur } from '../types';
import { calculateSurvivalRate, getCategoryInfo } from '../utils/survivalHelper';
import { X, MapPin, Calculator, ShieldCheck, AlertCircle, Plus, Trash2, CheckCircle2 } from 'lucide-react';

interface PuFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<PetakUkur>) => Promise<void>;
  initialData?: PetakUkur | null;
}

export const PuFormModal: React.FC<PuFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [kodePU, setKodePU] = useState('');
  const [subDas, setSubDas] = useState('Sub-DAS Citarum Hulu');
  const [blok, setBlok] = useState('');
  const [desa, setDesa] = useState('');
  const [kecamatan, setKecamatan] = useState('');
  const [latitude, setLatitude] = useState<number>(-7.1625);
  const [longitude, setLongitude] = useState<number>(107.6712);
  const [luasHa, setLuasHa] = useState<number>(0.1);
  const [tanamanAwal, setTanamanAwal] = useState<number>(50);
  const [tanamanHidup, setTanamanHidup] = useState<number>(45);
  const [tanamanMerana, setTanamanMerana] = useState<number>(2);
  const [jenisTanaman, setJenisTanaman] = useState<string[]>(['Sengon', 'Mahoni']);
  const [newJenisInput, setNewJenisInput] = useState('');
  const [tinggiRataRataCm, setTinggiRataRataCm] = useState<number>(150);
  const [tutupanTajukPersen, setTutupanTajukPersen] = useState<number>(35);
  const [tahunTanam, setTahunTanam] = useState<number>(2024);
  const [periodeEvaluasi, setPeriodeEvaluasi] = useState<'P0 (Tanam Awal)' | 'P1 (Tahun 1)' | 'P2 (Tahun 2)' | 'P3 (Penyerahan)'>('P1 (Tahun 1)');
  const [kesehatanTanaman, setKesehatanTanaman] = useState<'Baik & Sehat' | 'Cukup Sehat' | 'Terserang Hama/Gulma' | 'Kering/Merana'>('Baik & Sehat');
  const [rekomendasi, setRekomendasi] = useState('');
  const [evaluator, setEvaluator] = useState('Ir. Tim Lapangan BPDAS');
  const [tanggalEvaluasi, setTanggalEvaluasi] = useState(new Date().toISOString().split('T')[0]);
  const [catatan, setCatatan] = useState('');

  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize or reset form
  useEffect(() => {
    if (initialData) {
      setKodePU(initialData.kodePU);
      setSubDas(initialData.subDas);
      setBlok(initialData.blok);
      setDesa(initialData.desa);
      setKecamatan(initialData.kecamatan);
      setLatitude(initialData.latitude);
      setLongitude(initialData.longitude);
      setLuasHa(initialData.luasHa);
      setTanamanAwal(initialData.tanamanAwal);
      setTanamanHidup(initialData.tanamanHidup);
      setTanamanMerana(initialData.tanamanMerana);
      setJenisTanaman(initialData.jenisTanaman);
      setTinggiRataRataCm(initialData.tinggiRataRataCm);
      setTutupanTajukPersen(initialData.tutupanTajukPersen);
      setTahunTanam(initialData.tahunTanam);
      setPeriodeEvaluasi(initialData.periodeEvaluasi);
      setKesehatanTanaman(initialData.kesehatanTanaman);
      setRekomendasi(initialData.rekomendasi);
      setEvaluator(initialData.evaluator);
      setTanggalEvaluasi(initialData.tanggalEvaluasi);
      setCatatan(initialData.catatan || '');
    } else {
      // Default new PU
      setKodePU(`PU-${Math.floor(10 + Math.random() * 89)}`);
      setSubDas('Sub-DAS Citarum Hulu');
      setBlok('Blok Pasir Kiara');
      setDesa('Sukaluyu');
      setKecamatan('Pangalengan');
      setLatitude(-7.15 + (Math.random() - 0.5) * 0.1);
      setLongitude(107.65 + (Math.random() - 0.5) * 0.1);
      setLuasHa(0.1);
      setTanamanAwal(50);
      setTanamanHidup(42);
      setTanamanMerana(3);
      setJenisTanaman(['Sengon', 'Alpukat', 'Puspa']);
      setTinggiRataRataCm(160);
      setTutupanTajukPersen(40);
      setTahunTanam(2024);
      setPeriodeEvaluasi('P1 (Tahun 1)');
      setKesehatanTanaman('Baik & Sehat');
      setRekomendasi('Lakukan pembersihan piringan tanaman dan sulam bibit yang mati.');
      setEvaluator('Tim Surveyor BPDAS');
      setTanggalEvaluasi(new Date().toISOString().split('T')[0]);
      setCatatan('Kondisi tanah gembur dan cukup air saat penilaian.');
    }
  }, [initialData, isOpen]);

  // Real-time automatic calculation and validation
  const calculated = calculateSurvivalRate(tanamanHidup, tanamanAwal);
  const categoryInfo = getCategoryInfo(calculated.category);
  const kebutuhanSulam = Math.max(0, tanamanAwal - tanamanHidup);

  // Auto-validation logic
  useEffect(() => {
    if (tanamanAwal <= 0) {
      setValidationError('Jumlah tanaman awal harus lebih dari 0.');
    } else if (tanamanHidup > tanamanAwal) {
      setValidationError(
        `Validasi Gagal: Tanaman hidup (${tanamanHidup}) melebihi jumlah tanaman awal (${tanamanAwal})!`
      );
    } else if (tanamanHidup < 0 || tanamanMerana < 0) {
      setValidationError('Jumlah tanaman tidak boleh negatif.');
    } else {
      setValidationError(null);
    }
  }, [tanamanAwal, tanamanHidup, tanamanMerana]);

  const handleAddJenis = () => {
    if (newJenisInput.trim() && !jenisTanaman.includes(newJenisInput.trim())) {
      setJenisTanaman([...jenisTanaman, newJenisInput.trim()]);
      setNewJenisInput('');
    }
  };

  const handleRemoveJenis = (index: number) => {
    setJenisTanaman(jenisTanaman.filter((_, idx) => idx !== index));
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(Number(pos.coords.latitude.toFixed(5)));
        setLongitude(Number(pos.coords.longitude.toFixed(5)));
      },
      (err) => {
        alert('Gagal membaca GPS: ' + err.message);
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validationError) return;

    if (!kodePU.trim()) {
      setValidationError('Kode Petak Ukur (PU) wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        kodePU: kodePU.trim().toUpperCase(),
        subDas,
        blok,
        desa,
        kecamatan,
        latitude,
        longitude,
        luasHa,
        tanamanAwal,
        tanamanHidup,
        tanamanMerana,
        jenisTanaman,
        tinggiRataRataCm,
        tutupanTajukPersen,
        tahunTanam,
        periodeEvaluasi,
        kesehatanTanaman,
        rekomendasi:
          rekomendasi.trim() ||
          (calculated.rate < 75
            ? `Penyulaman ${kebutuhanSulam} bibit dan penyiangan segera.`
            : 'Pertahankan pemeliharaan berkala.'),
        evaluator,
        tanggalEvaluasi,
        catatan,
      });
      onClose();
    } catch (err: any) {
      setValidationError(err.message || 'Gagal menyimpan data.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              {initialData ? `Perbarui Penilaian: ${initialData.kodePU}` : 'Input Data Penilaian Petak Ukur (PU) Baru'}
            </h2>
            <p className="text-xs text-slate-400">
              Sistem validasi otomatis memastikan akurasi data penilaian berkala rehabilitasi DAS.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs text-slate-200">
          {/* Automatic Calculation & Status Banner */}
          <div className="p-3.5 rounded-xl border border-slate-700 bg-slate-950/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg shadow-xl"
                style={{
                  backgroundColor: categoryInfo.colorHex,
                  border: `2px solid ${categoryInfo.markerBorderColor}`,
                  color: calculated.category === 'kuning' ? '#0f172a' : '#ffffff',
                }}
              >
                {calculated.rate}%
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-100 text-sm">
                    Kategori Terhitung: {categoryInfo.name}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border ${categoryInfo.badgeBg} ${categoryInfo.badgeBorder} ${categoryInfo.badgeText}`}
                  >
                    {categoryInfo.rangeLabel}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Formula Otomatis: ({tanamanHidup} hidup &divide; {tanamanAwal} awal) &times; 100% = {calculated.rate}%
                </p>
              </div>
            </div>

            <div className="text-right sm:text-right w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
              <span className="text-[10px] text-slate-400 block">Kebutuhan Penyulaman</span>
              <span className={`text-base font-extrabold ${kebutuhanSulam > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {kebutuhanSulam} Batang Bibit
              </span>
            </div>
          </div>

          {/* Validation Error Banner */}
          {validationError && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-600 text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Section 1: Identifikasi & Lokasi */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-800">
              1. Identifikasi & Lokasi Geospasial
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Kode Petak Ukur (PU) *</label>
                <input
                  type="text"
                  required
                  value={kodePU}
                  onChange={(e) => setKodePU(e.target.value)}
                  placeholder="Misal: PU-05"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Sub-DAS Wilayah</label>
                <select
                  value={subDas}
                  onChange={(e) => setSubDas(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  <option value="Sub-DAS Citarum Hulu">Sub-DAS Citarum Hulu</option>
                  <option value="Sub-DAS Cikapundung">Sub-DAS Cikapundung</option>
                  <option value="Sub-DAS Cirasea">Sub-DAS Cirasea</option>
                  <option value="Sub-DAS Cisangkuy">Sub-DAS Cisangkuy</option>
                  <option value="Sub-DAS Ciwidey">Sub-DAS Ciwidey</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Blok Penanaman</label>
                <input
                  type="text"
                  value={blok}
                  onChange={(e) => setBlok(e.target.value)}
                  placeholder="Misal: Blok Pasir Bintang"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Desa</label>
                <input
                  type="text"
                  value={desa}
                  onChange={(e) => setDesa(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Kecamatan</label>
                <input
                  type="text"
                  value={kecamatan}
                  onChange={(e) => setKecamatan(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Lintang (Latitude)</label>
                <input
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Bujur (Longitude)</label>
                <div className="flex gap-1.5">
                  <input
                    type="number"
                    step="any"
                    value={longitude}
                    onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleGetCurrentLocation}
                    title="Ambil GPS Saat Ini"
                    className="px-2 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 text-cyan-400 flex items-center justify-center shrink-0"
                  >
                    <MapPin className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Penilaian Tanaman & Survival Rate */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-800">
              2. Data Cacah Tanaman Petak Ukur (Validasi Otomatis)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <label className="block text-slate-400 mb-1">Jumlah Awal Ditanam (N0) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={tanamanAwal}
                  onChange={(e) => setTanamanAwal(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 text-sm font-bold font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <label className="block text-slate-400 mb-1">Jumlah Tanaman Hidup (Nh) *</label>
                <input
                  type="number"
                  min="0"
                  max={tanamanAwal}
                  required
                  value={tanamanHidup}
                  onChange={(e) => setTanamanHidup(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-emerald-400 text-sm font-bold font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <label className="block text-slate-400 mb-1">Tanaman Merana / Sakit</label>
                <input
                  type="number"
                  min="0"
                  value={tanamanMerana}
                  onChange={(e) => setTanamanMerana(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-amber-400 text-sm font-bold font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <label className="block text-slate-400 mb-1">Luas PU (Hektar)</label>
                <input
                  type="number"
                  step="0.01"
                  value={luasHa}
                  onChange={(e) => setLuasHa(parseFloat(e.target.value) || 0.1)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 text-sm font-bold font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Tinggi Rata-Rata (cm)</label>
                <input
                  type="number"
                  min="10"
                  value={tinggiRataRataCm}
                  onChange={(e) => setTinggiRataRataCm(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Tutupan Tajuk (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={tutupanTajukPersen}
                  onChange={(e) => setTutupanTajukPersen(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Kondisi Kesehatan</label>
                <select
                  value={kesehatanTanaman}
                  onChange={(e) => setKesehatanTanaman(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  <option value="Baik & Sehat">Baik & Sehat</option>
                  <option value="Cukup Sehat">Cukup Sehat</option>
                  <option value="Terserang Hama/Gulma">Terserang Hama/Gulma</option>
                  <option value="Kering/Merana">Kering/Merana</option>
                </select>
              </div>
            </div>

            {/* Species Tags */}
            <div>
              <label className="block text-slate-400 mb-1">Komposisi Jenis Tanaman</label>
              <div className="flex flex-wrap items-center gap-1.5 mb-2">
                {jenisTanaman.map((sp, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded bg-slate-800 text-slate-200 border border-slate-700 text-xs flex items-center gap-1.5"
                  >
                    {sp}
                    <button
                      type="button"
                      onClick={() => handleRemoveJenis(idx)}
                      className="text-slate-400 hover:text-rose-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newJenisInput}
                  onChange={(e) => setNewJenisInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddJenis();
                    }
                  }}
                  placeholder="Ketik jenis pohon (misal: Sengon, Alpukat, Kopi) lalu klik tambah"
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="button"
                  onClick={handleAddJenis}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 font-semibold"
                >
                  + Tambah Jenis
                </button>
              </div>
            </div>
          </div>

          {/* Section 3: Periode & Evaluator */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-800">
              3. Periode Evaluasi & Surveyor
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Periode Evaluasi</label>
                <select
                  value={periodeEvaluasi}
                  onChange={(e) => setPeriodeEvaluasi(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  <option value="P0 (Tanam Awal)">P0 (Tanam Awal)</option>
                  <option value="P1 (Tahun 1)">P1 (Tahun 1)</option>
                  <option value="P2 (Tahun 2)">P2 (Tahun 2)</option>
                  <option value="P3 (Penyerahan)">P3 (Penyerahan)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Tanggal Evaluasi</label>
                <input
                  type="date"
                  value={tanggalEvaluasi}
                  onChange={(e) => setTanggalEvaluasi(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Nama Petugas Penilai / Surveyor</label>
                <input
                  type="text"
                  value={evaluator}
                  onChange={(e) => setEvaluator(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Rekomendasi Tindak Lanjut Teknis</label>
              <textarea
                rows={2}
                value={rekomendasi}
                onChange={(e) => setRekomendasi(e.target.value)}
                placeholder="Rekomendasi tindakan sulam, pemupukan, atau perlindungan lahan..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Catatan Lapangan Tambahan</label>
              <input
                type="text"
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Misal: Akses jalan curam, partisipasi KTH tinggi"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || Boolean(validationError)}
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span>Menyimpan...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan & Sinkronkan Data PU</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
