import React, { useState, useEffect } from 'react';
import { PetakUkur, SurvivalCategory } from '../types';
import { getCategoryInfo } from '../utils/survivalHelper';
import {
  latLonToUtm,
  utmToLatLon,
  formatUtmDisplay,
  parseUtmInput,
} from '../utils/utmHelper';
import {
  X,
  MapPin,
  ShieldCheck,
  AlertCircle,
  Plus,
  CheckCircle2,
  Calendar,
  Compass,
  Thermometer,
  Droplets,
  Layers,
  Mountain,
  UserCheck,
  FileText,
  Percent,
} from 'lucide-react';

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
  // 1. Tanggal pengambilan data
  const [tanggalPengambilanData, setTanggalPengambilanData] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  // 2. Kode Nomor Petak Ukur
  const [kodePU, setKodePU] = useState<string>('');
  // 3. Periode Evaluasi
  const [periodeEvaluasi, setPeriodeEvaluasi] = useState<string>('P1 (Tahun 1)');
  // 4. DAS
  const [das, setDas] = useState<string>('Sub-DAS Citarum Hulu');
  // 5. Blok
  const [blok, setBlok] = useState<string>('');
  // 6. Petak
  const [petak, setPetak] = useState<string>('');
  // 7. Lokasi Daerah
  const [lokasiDaerah, setLokasiDaerah] = useState<string>('');
  // 8. Titik Koordinat (UTM) & Lat/Lon
  const [utmZone, setUtmZone] = useState<number>(48);
  const [utmHemi, setUtmHemi] = useState<'N' | 'S'>('S');
  const [utmEasting, setUtmEasting] = useState<number>(795400);
  const [utmNorthing, setUtmNorthing] = useState<number>(9208500);
  const [latitude, setLatitude] = useState<number>(-7.155);
  const [longitude, setLongitude] = useState<number>(107.675);
  const [utmFreeInput, setUtmFreeInput] = useState<string>('');

  // 9. Tahun Tanam
  const [tahunTanam, setTahunTanam] = useState<number>(2024);
  // 10. Kategori
  const [kategori, setKategori] = useState<SurvivalCategory>('hijau');
  const [manualKategoriOverride, setManualKategoriOverride] = useState<boolean>(false);
  // 11. Pengawas Operasional Lapangan
  const [pengawasOperasional, setPengawasOperasional] = useState<string>('');
  // 12. Persentase Hidup Tanaman
  const [persentaseHidup, setPersentaseHidup] = useState<number>(85);
  // 13. Jarak Tanam
  const [jarakTanam, setJarakTanam] = useState<string>('3 x 3 m');
  // 14. Jenis Tanaman
  const [jenisTanaman, setJenisTanaman] = useState<string[]>(['Sengon', 'Mahoni', 'Alpukat']);
  const [newJenisInput, setNewJenisInput] = useState<string>('');
  // 15. Suhu Lingkungan
  const [suhuLingkungan, setSuhuLingkungan] = useState<string>('24°C');
  // 16. Kelembaban Udara
  const [kelembabanUdara, setKelembabanUdara] = useState<string>('78%');
  // 17. Jenis Tanah
  const [jenisTanah, setJenisTanah] = useState<string>('Andosol');
  // 18. pH Tanah
  const [pHTanah, setPHTanah] = useState<string>('6.2');
  // 19. Kemiringan Lahan
  const [kemiringanLahan, setKemiringanLahan] = useState<string>('Landai (8-15%)');
  // 20. Assessor
  const [assessor, setAssessor] = useState<string>('');
  // 21. Catatan Tambahan
  const [catatanTambahan, setCatatanTambahan] = useState<string>('');

  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Initialize or reset form values
  useEffect(() => {
    if (initialData) {
      setTanggalPengambilanData(
        initialData.tanggalPengambilanData || initialData.tanggalEvaluasi || new Date().toISOString().split('T')[0]
      );
      setKodePU(initialData.kodePU || '');
      setPeriodeEvaluasi(initialData.periodeEvaluasi || 'P1 (Tahun 1)');
      setDas(initialData.das || initialData.subDas || 'Sub-DAS Citarum Hulu');
      setBlok(initialData.blok || '');
      setPetak(initialData.petak || 'Petak 01');
      setLokasiDaerah(
        initialData.lokasiDaerah ||
          (initialData.desa ? `${initialData.desa}, Kec. ${initialData.kecamatan}` : '')
      );
      
      const lat = initialData.latitude || -7.155;
      const lon = initialData.longitude || 107.675;
      setLatitude(lat);
      setLongitude(lon);

      if (initialData.utmEasting && initialData.utmNorthing) {
        setUtmEasting(initialData.utmEasting);
        setUtmNorthing(initialData.utmNorthing);
        setUtmZone(initialData.utmZone ? parseInt(initialData.utmZone, 10) || 48 : 48);
        setUtmHemi(initialData.utmZone?.toUpperCase().includes('N') ? 'N' : 'S');
      } else {
        const utm = latLonToUtm(lat, lon);
        setUtmEasting(utm.easting);
        setUtmNorthing(utm.northing);
        setUtmZone(utm.zone);
        setUtmHemi(utm.hemisphere);
      }

      setTahunTanam(initialData.tahunTanam || 2024);
      setKategori(initialData.kategori || 'hijau');
      setManualKategoriOverride(true);
      setPengawasOperasional(initialData.pengawasOperasional || 'Ir. Bambang S., S.Hut');
      
      const rate = initialData.persentaseHidup !== undefined ? initialData.persentaseHidup : initialData.survivalRate || 85;
      setPersentaseHidup(rate);
      setJarakTanam(initialData.jarakTanam || '3 x 3 m');
      setJenisTanaman(initialData.jenisTanaman && initialData.jenisTanaman.length > 0 ? initialData.jenisTanaman : ['Sengon', 'Alpukat']);
      setSuhuLingkungan(initialData.suhuLingkungan ? String(initialData.suhuLingkungan) : '24°C');
      setKelembabanUdara(initialData.kelembabanUdara ? String(initialData.kelembabanUdara) : '78%');
      setJenisTanah(initialData.jenisTanah || 'Andosol');
      setPHTanah(initialData.pHTanah ? String(initialData.pHTanah) : '6.2');
      setKemiringanLahan(initialData.kemiringanLahan || 'Landai (8-15%)');
      setAssessor(initialData.assessor || initialData.evaluator || 'Tim Surveyor BPDAS');
      setCatatanTambahan(initialData.catatanTambahan || initialData.catatan || '');
    } else {
      // Default New Petak Ukur (PU)
      setTanggalPengambilanData(new Date().toISOString().split('T')[0]);
      setKodePU(`PU-${Math.floor(10 + Math.random() * 89)}`);
      setPeriodeEvaluasi('P1 (Tahun 1)');
      setDas('Sub-DAS Citarum Hulu');
      setBlok('Blok Pasir Kiara');
      setPetak('Petak 01');
      setLokasiDaerah('Desa Sukaluyu, Kec. Pangalengan, Kab. Bandung');
      
      const lat = -7.15 + (Math.random() - 0.5) * 0.08;
      const lon = 107.65 + (Math.random() - 0.5) * 0.08;
      setLatitude(Number(lat.toFixed(6)));
      setLongitude(Number(lon.toFixed(6)));
      const utm = latLonToUtm(lat, lon);
      setUtmEasting(utm.easting);
      setUtmNorthing(utm.northing);
      setUtmZone(utm.zone);
      setUtmHemi(utm.hemisphere);

      setTahunTanam(2024);
      setPersentaseHidup(84);
      setKategori('hijau');
      setManualKategoriOverride(false);
      setPengawasOperasional('Ir. Bambang S., S.Hut (Pengawas Lapangan)');
      setJarakTanam('3 x 3 m');
      setJenisTanaman(['Sengon', 'Mahoni', 'Alpukat']);
      setSuhuLingkungan('24°C');
      setKelembabanUdara('78%');
      setJenisTanah('Andosol');
      setPHTanah('6.2');
      setKemiringanLahan('Landai (8-15%)');
      setAssessor('Tim Assessor BPDAS Cimanuk-Cisanggarung');
      setCatatanTambahan('Akses lokasi memadai, kondisi tegakan tanaman terawat baik.');
    }
  }, [initialData, isOpen]);

  // Sync Kategori with Persentase Hidup Tanaman unless manually overridden
  useEffect(() => {
    if (!manualKategoriOverride) {
      if (persentaseHidup > 80) {
        setKategori('hijau');
      } else if (persentaseHidup >= 75) {
        setKategori('kuning');
      } else if (persentaseHidup > 40) {
        setKategori('merah');
      } else {
        setKategori('hitam');
      }
    }
  }, [persentaseHidup, manualKategoriOverride]);

  // Update Lat/Lon whenever UTM changes
  const handleUtmChange = (newEasting: number, newNorthing: number, newZone: number, newHemi: 'N' | 'S') => {
    setUtmEasting(newEasting);
    setUtmNorthing(newNorthing);
    setUtmZone(newZone);
    setUtmHemi(newHemi);
    try {
      const geo = utmToLatLon(newEasting, newNorthing, newZone, newHemi);
      if (!isNaN(geo.latitude) && !isNaN(geo.longitude)) {
        setLatitude(geo.latitude);
        setLongitude(geo.longitude);
      }
    } catch {
      // ignore
    }
  };

  // Freeform UTM parser
  const handleParseFreeUtm = () => {
    const parsed = parseUtmInput(utmFreeInput);
    if (parsed) {
      handleUtmChange(parsed.easting, parsed.northing, parsed.zone, parsed.hemisphere);
      setUtmFreeInput('');
      setValidationError(null);
    } else {
      setValidationError('Format UTM tidak valid. Contoh: 48S 795400 9208500');
    }
  };

  // Read GPS and convert to UTM
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Fitur Geolocation tidak didukung di peramban ini.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lon = Number(pos.coords.longitude.toFixed(6));
        setLatitude(lat);
        setLongitude(lon);
        const utm = latLonToUtm(lat, lon);
        setUtmEasting(utm.easting);
        setUtmNorthing(utm.northing);
        setUtmZone(utm.zone);
        setUtmHemi(utm.hemisphere);
        setValidationError(null);
      },
      (err) => {
        alert('Gagal mendeteksi koordinat GPS: ' + err.message);
      }
    );
  };

  const handleAddJenis = () => {
    const val = newJenisInput.trim();
    if (val && !jenisTanaman.includes(val)) {
      setJenisTanaman([...jenisTanaman, val]);
      setNewJenisInput('');
    }
  };

  const handleRemoveJenis = (index: number) => {
    setJenisTanaman(jenisTanaman.filter((_, idx) => idx !== index));
  };

  const catInfo = getCategoryInfo(kategori);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kodePU.trim()) {
      setValidationError('Kode Nomor Petak Ukur wajib diisi.');
      return;
    }
    if (persentaseHidup < 0 || persentaseHidup > 100) {
      setValidationError('Persentase Hidup Tanaman harus di antara 0% dan 100%.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formattedUtm = `${utmZone}${utmHemi} X: ${Math.round(utmEasting)} m, Y: ${Math.round(utmNorthing)} m`;
      
      await onSave({
        // 1. Tanggal pengambilan data
        tanggalEvaluasi: tanggalPengambilanData,
        tanggalPengambilanData,
        // 2. Kode Nomor Petak Ukur
        kodePU: kodePU.trim().toUpperCase(),
        // 3. Periode Evaluasi
        periodeEvaluasi,
        // 4. DAS
        subDas: das,
        das,
        // 5. Blok
        blok: blok.trim() || 'Blok RHL',
        // 6. Petak
        petak: petak.trim() || 'Petak 01',
        // 7. Lokasi Daerah
        lokasiDaerah: lokasiDaerah.trim() || 'Wilayah DAS',
        desa: lokasiDaerah,
        kecamatan: lokasiDaerah,
        // 8. Titik Koordinat (UTM) & Geographic
        latitude,
        longitude,
        koordinatUtm: formattedUtm,
        utmZone: `${utmZone}${utmHemi}`,
        utmEasting: Math.round(utmEasting),
        utmNorthing: Math.round(utmNorthing),
        // 9. Tahun Tanam
        tahunTanam: Number(tahunTanam) || 2024,
        // 10. Kategori
        kategori,
        // 11. Pengawas Operasional Lapangan
        pengawasOperasional: pengawasOperasional.trim(),
        // 12. Persentase Hidup Tanaman
        survivalRate: Number(persentaseHidup),
        persentaseHidup: Number(persentaseHidup),
        // 13. Jarak Tanam
        jarakTanam: jarakTanam.trim(),
        // 14. Jenis Tanaman
        jenisTanaman: jenisTanaman.length > 0 ? jenisTanaman : ['Sengon', 'Mahoni'],
        // 15. Suhu Lingkungan
        suhuLingkungan: suhuLingkungan.trim(),
        // 16. Kelembaban Udara
        kelembabanUdara: kelembabanUdara.trim(),
        // 17. Jenis Tanah
        jenisTanah: jenisTanah.trim(),
        // 18. pH Tanah
        pHTanah: pHTanah ? parseFloat(pHTanah) || 6.5 : 6.5,
        // 19. Kemiringan Lahan
        kemiringanLahan: kemiringanLahan.trim(),
        // 20. Assessor
        evaluator: assessor.trim() || 'Tim Assessor BPDAS',
        assessor: assessor.trim() || 'Tim Assessor BPDAS',
        // 21. Catatan Tambahan
        catatan: catatanTambahan.trim(),
        catatanTambahan: catatanTambahan.trim(),

        // Backward compatibility properties for metrics & maps
        luasHa: initialData?.luasHa || 0.1,
        tanamanAwal: initialData?.tanamanAwal || 50,
        tanamanHidup: Math.round(((Number(persentaseHidup) || 0) / 100) * (initialData?.tanamanAwal || 50)),
        tanamanMerana: initialData?.tanamanMerana || 0,
        kebutuhanPenyulaman: Math.max(
          0,
          (initialData?.tanamanAwal || 50) -
            Math.round(((Number(persentaseHidup) || 0) / 100) * (initialData?.tanamanAwal || 50))
        ),
        tinggiRataRataCm: initialData?.tinggiRataRataCm || 150,
        tutupanTajukPersen: initialData?.tutupanTajukPersen || Math.min(100, Math.round(Number(persentaseHidup) * 0.6)),
        kesehatanTanaman:
          persentaseHidup >= 80
            ? 'Baik & Sehat'
            : persentaseHidup >= 75
            ? 'Cukup Sehat'
            : persentaseHidup >= 40
            ? 'Terserang Hama/Gulma'
            : 'Kering/Merana',
        rekomendasi:
          persentaseHidup >= 75
            ? 'Pertahankan pemeliharaan berkala dan perlindungan tegakan.'
            : 'Lakukan penyulaman bibit berkualitas dan pembersihan gulma piringan.',
        updatedAt: new Date().toISOString(),
      });
      onClose();
    } catch (err: any) {
      setValidationError(err.message || 'Terjadi kesalahan saat menyimpan data PU.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              {initialData
                ? `Perbarui Penilaian Petak Ukur: ${initialData.kodePU}`
                : 'Input Data Penilaian Petak Ukur (PU)'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Formulir isian standar 21 parameter penilaian kinerja, biofisik, dan geospasial rehabilitasi DAS.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 text-xs text-slate-200">
          {/* Summary Status Bar */}
          <div className="p-4 rounded-xl border border-slate-700 bg-slate-950/80 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-inner">
            <div className="flex items-center gap-3">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center font-black text-xl shadow-lg shrink-0"
                style={{
                  backgroundColor: catInfo.colorHex,
                  border: `2px solid ${catInfo.markerBorderColor}`,
                  color: kategori === 'kuning' ? '#0f172a' : '#ffffff',
                }}
              >
                {persentaseHidup}%
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-100 text-sm">
                    Kategori: {catInfo.name}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border ${catInfo.badgeBg} ${catInfo.badgeBorder} ${catInfo.badgeText}`}
                  >
                    {catInfo.rangeLabel}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Status Standar Kinerja: <strong className="text-slate-200">{catInfo.statusKinerja}</strong> &bull; {catInfo.deskripsi}
                </p>
              </div>
            </div>

            <div className="text-right sm:text-right w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800 flex sm:flex-col justify-between items-center sm:items-end">
              <span className="text-[10px] text-slate-400 block">Koordinat Terkini (UTM)</span>
              <span className="text-xs font-mono font-bold text-cyan-400">
                {formatUtmDisplay(utmZone, utmHemi, utmEasting, utmNorthing)}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                Lat: {latitude.toFixed(5)}, Lon: {longitude.toFixed(5)}
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

          {/* SECTION 1: Identifikasi Administrasi & Lokasi */}
          <div className="space-y-3">
            <h3 className="font-bold text-cyan-400 uppercase tracking-wider text-[11px] pb-1.5 border-b border-slate-800 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              1. Identifikasi Administrasi, Daerah & Koordinat Spasial
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* 1. Tanggal pengambilan data */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-cyan-400" />
                  Tanggal Pengambilan Data *
                </label>
                <input
                  type="date"
                  required
                  value={tanggalPengambilanData}
                  onChange={(e) => setTanggalPengambilanData(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* 2. Kode Nomor Petak Ukur */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Kode Nomor Petak Ukur *
                </label>
                <input
                  type="text"
                  required
                  value={kodePU}
                  onChange={(e) => setKodePU(e.target.value)}
                  placeholder="Misal: PU-01, PU-02"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono font-bold focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* 3. Periode Evaluasi */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Periode Evaluasi *
                </label>
                <select
                  value={periodeEvaluasi}
                  onChange={(e) => setPeriodeEvaluasi(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500 font-medium"
                >
                  <option value="P0 (Tanam Awal)">P0 (Tanam Awal - Bulan ke-0)</option>
                  <option value="P1 (Tahun 1)">P1 (Tahun 1 - Pemeliharaan I)</option>
                  <option value="P2 (Tahun 2)">P2 (Tahun 2 - Pemeliharaan II)</option>
                  <option value="P3 (Penyerahan)">P3 (Tahun 3 - Penyerahan Akhir)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {/* 4. DAS */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">DAS *</label>
                <input
                  type="text"
                  required
                  list="list-das"
                  value={das}
                  onChange={(e) => setDas(e.target.value)}
                  placeholder="Misal: DAS Citarum Hulu"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
                <datalist id="list-das">
                  <option value="Sub-DAS Citarum Hulu" />
                  <option value="Sub-DAS Cikapundung" />
                  <option value="Sub-DAS Cisangkuy" />
                  <option value="Sub-DAS Cirasea" />
                  <option value="Sub-DAS Ciwidey" />
                  <option value="Sub-DAS Cimanuk Hulu" />
                </datalist>
              </div>

              {/* 5. Blok */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Blok *</label>
                <input
                  type="text"
                  required
                  value={blok}
                  onChange={(e) => setBlok(e.target.value)}
                  placeholder="Misal: Blok Pasir Bintang"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* 6. Petak */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Petak *</label>
                <input
                  type="text"
                  required
                  value={petak}
                  onChange={(e) => setPetak(e.target.value)}
                  placeholder="Misal: Petak 12, Petak 04A"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* 7. Lokasi Daerah */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Lokasi Daerah *</label>
                <input
                  type="text"
                  required
                  value={lokasiDaerah}
                  onChange={(e) => setLokasiDaerah(e.target.value)}
                  placeholder="Misal: Desa Sukaluyu, Pangalengan"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* 8. Titik Koordinat (UTM) */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  Titik Koordinat (UTM) *
                </label>
                <button
                  type="button"
                  onClick={handleGetCurrentLocation}
                  className="px-2.5 py-1 bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 rounded-lg text-[11px] font-medium flex items-center gap-1 self-start sm:self-auto"
                >
                  <MapPin className="w-3 h-3" />
                  Deteksi GPS Perangkat Otomatis
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="block text-slate-400 text-[10px] mb-0.5">Zona UTM</label>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={utmZone}
                      onChange={(e) =>
                        handleUtmChange(utmEasting, utmNorthing, parseInt(e.target.value) || 48, utmHemi)
                      }
                      className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-100 font-mono text-center font-bold focus:border-cyan-500"
                    />
                    <select
                      value={utmHemi}
                      onChange={(e) =>
                        handleUtmChange(utmEasting, utmNorthing, utmZone, e.target.value as 'N' | 'S')
                      }
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-100 font-mono font-bold focus:border-cyan-500"
                    >
                      <option value="S">S (Selatan / Jawa/Bali/Sumsel/dll)</option>
                      <option value="N">N (Utara / Aceh/Riau/Kalut/dll)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 text-[10px] mb-0.5">Easting X (meter) *</label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={utmEasting}
                    onChange={(e) =>
                      handleUtmChange(parseFloat(e.target.value) || 0, utmNorthing, utmZone, utmHemi)
                    }
                    placeholder="Contoh: 795400"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-cyan-300 font-mono font-bold focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-[10px] mb-0.5">Northing Y (meter) *</label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={utmNorthing}
                    onChange={(e) =>
                      handleUtmChange(utmEasting, parseFloat(e.target.value) || 0, utmZone, utmHemi)
                    }
                    placeholder="Contoh: 9208500"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-cyan-300 font-mono font-bold focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-[10px] mb-0.5">Konversi WGS84 Peta</label>
                  <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[10px] text-slate-400 font-mono leading-tight">
                    <div>Lat: {latitude.toFixed(5)}</div>
                    <div>Lon: {longitude.toFixed(5)}</div>
                  </div>
                </div>
              </div>

              {/* Paste or quick input freeform UTM */}
              <div className="flex gap-1.5 pt-1">
                <input
                  type="text"
                  value={utmFreeInput}
                  onChange={(e) => setUtmFreeInput(e.target.value)}
                  placeholder="Tempel format teks UTM bebas (misal: 48S 795400 9208500)..."
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] text-slate-200 font-mono focus:border-cyan-500"
                />
                <button
                  type="button"
                  onClick={handleParseFreeUtm}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg text-[11px]"
                >
                  Terapkan
                </button>
              </div>
            </div>
          </div>

          {/* SECTION 2: Parameter Silvikultur & Kinerja Tanaman */}
          <div className="space-y-3">
            <h3 className="font-bold text-emerald-400 uppercase tracking-wider text-[11px] pb-1.5 border-b border-slate-800 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              2. Kinerja Penilaian & Parameter Silvikultur
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {/* 9. Tahun Tanam */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Tahun Tanam *</label>
                <input
                  type="number"
                  min="2010"
                  max="2035"
                  required
                  value={tahunTanam}
                  onChange={(e) => setTahunTanam(parseInt(e.target.value) || 2024)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono font-bold focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* 12. Persentase Hidup Tanaman */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1 flex items-center justify-between">
                  <span>Persentase Hidup (%) *</span>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold">{persentaseHidup}%</span>
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={persentaseHidup}
                    onChange={(e) => {
                      const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                      setPersentaseHidup(val);
                      setManualKategoriOverride(false);
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-emerald-400 font-mono text-base font-bold focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* 10. Kategori */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1 flex items-center justify-between">
                  <span>Kategori *</span>
                  {manualKategoriOverride && (
                    <span className="text-[9px] text-amber-400 uppercase font-semibold">Manual</span>
                  )}
                </label>
                <select
                  value={kategori}
                  onChange={(e) => {
                    setKategori(e.target.value as SurvivalCategory);
                    setManualKategoriOverride(true);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-semibold focus:outline-none focus:border-cyan-500"
                >
                  <option value="hijau">Hijau - Baik / Sangat Berhasil (&gt;80%)</option>
                  <option value="kuning">Kuning - Sedang (75% - 80%)</option>
                  <option value="merah">Merah - Kurang (&gt;40% - &lt;75%)</option>
                  <option value="hitam">Hitam - Sangat Kurang (0% - 40%)</option>
                </select>
              </div>

              {/* 13. Jarak Tanam */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Jarak Tanam *</label>
                <input
                  type="text"
                  required
                  list="list-jarak"
                  value={jarakTanam}
                  onChange={(e) => setJarakTanam(e.target.value)}
                  placeholder="Misal: 3 x 3 m"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
                <datalist id="list-jarak">
                  <option value="2 x 2 m" />
                  <option value="2 x 3 m" />
                  <option value="3 x 3 m" />
                  <option value="4 x 2 m" />
                  <option value="4 x 4 m" />
                </datalist>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* 11. Pengawas Operasional Lapangan */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                  <UserCheck className="w-3 h-3 text-cyan-400" />
                  Pengawas Operasional Lapangan *
                </label>
                <input
                  type="text"
                  required
                  value={pengawasOperasional}
                  onChange={(e) => setPengawasOperasional(e.target.value)}
                  placeholder="Nama & gelar Pengawas Lapangan"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* 14. Jenis Tanaman */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Jenis Tanaman *
                </label>
                <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                  {jenisTanaman.map((sp, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 text-[11px] flex items-center gap-1"
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
                    placeholder="Tambah jenis pohon (Sengon, Pinus, Mahoni, dll)..."
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddJenis}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 font-semibold shrink-0"
                  >
                    + Tambah
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: Parameter Biofisik & Lingkungan */}
          <div className="space-y-3">
            <h3 className="font-bold text-amber-400 uppercase tracking-wider text-[11px] pb-1.5 border-b border-slate-800 flex items-center gap-1.5">
              <Mountain className="w-3.5 h-3.5 text-amber-400" />
              3. Parameter Biofisik, Tanah & Kondisi Lingkungan Lahan
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {/* 15. Suhu Lingkungan */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1">
                  <Thermometer className="w-3 h-3 text-amber-400" />
                  Suhu Lingkungan *
                </label>
                <input
                  type="text"
                  required
                  value={suhuLingkungan}
                  onChange={(e) => setSuhuLingkungan(e.target.value)}
                  placeholder="Misal: 24°C"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* 16. Kelembaban Udara */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1">
                  <Droplets className="w-3 h-3 text-cyan-400" />
                  Kelembaban Udara *
                </label>
                <input
                  type="text"
                  required
                  value={kelembabanUdara}
                  onChange={(e) => setKelembabanUdara(e.target.value)}
                  placeholder="Misal: 78%"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* 17. Jenis Tanah */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Jenis Tanah *</label>
                <input
                  type="text"
                  required
                  list="list-tanah"
                  value={jenisTanah}
                  onChange={(e) => setJenisTanah(e.target.value)}
                  placeholder="Misal: Andosol"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
                <datalist id="list-tanah">
                  <option value="Andosol" />
                  <option value="Latosol" />
                  <option value="Regosol" />
                  <option value="Kambisol" />
                  <option value="Aluvial" />
                  <option value="Litosol" />
                </datalist>
              </div>

              {/* 18. pH Tanah */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">pH Tanah *</label>
                <input
                  type="number"
                  step="0.1"
                  min="3"
                  max="9"
                  required
                  value={pHTanah}
                  onChange={(e) => setPHTanah(e.target.value)}
                  placeholder="Misal: 6.2"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* 19. Kemiringan Lahan */}
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-slate-300 font-semibold mb-1">Kemiringan Lahan *</label>
                <select
                  value={kemiringanLahan}
                  onChange={(e) => setKemiringanLahan(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  <option value="Datar (0-8%)">Datar (0-8%)</option>
                  <option value="Landai (8-15%)">Landai (8-15%)</option>
                  <option value="Agak Curam (15-25%)">Agak Curam (15-25%)</option>
                  <option value="Curam (25-45%)">Curam (25-45%)</option>
                  <option value="Sangat Curam (>45%)">Sangat Curam (&gt;45%)</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 4: Personel Penilai & Catatan Tambahan */}
          <div className="space-y-3">
            <h3 className="font-bold text-purple-400 uppercase tracking-wider text-[11px] pb-1.5 border-b border-slate-800 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-purple-400" />
              4. Personel Penilai (Assessor) & Catatan Lapangan
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* 20. Assessor */}
              <div className="sm:col-span-1">
                <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                  <UserCheck className="w-3 h-3 text-purple-400" />
                  Assessor *
                </label>
                <input
                  type="text"
                  required
                  value={assessor}
                  onChange={(e) => setAssessor(e.target.value)}
                  placeholder="Nama Surveyor / Assessor Penilai"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* 21. Catatan Tambahan */}
              <div className="sm:col-span-2">
                <label className="block text-slate-300 font-semibold mb-1">Catatan Tambahan</label>
                <textarea
                  rows={2}
                  value={catatanTambahan}
                  onChange={(e) => setCatatanTambahan(e.target.value)}
                  placeholder="Catatan kondisi lapangan, kendala cuaca, partisipasi kelompok tani, rekomendasi tindakan..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Footer Submit Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Seluruh 21 field terstandarisasi diverifikasi dan disimpan ke sistem evaluasi DAS.
            </span>
            <div className="flex items-center gap-2 ml-auto">
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
                  <span>Menyimpan Data...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Simpan Penilaian Petak Ukur</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
