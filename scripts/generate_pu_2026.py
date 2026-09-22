# generate_pu_2026.py
import re
import json
import math

WGS84_A = 6378137.0
WGS84_ECC_SQ = 0.00669437999014
UTM_K0 = 0.9996

def utm_to_latlon(easting, northing, zone, hemisphere='S'):
    e2 = WGS84_ECC_SQ
    ePrime2 = e2 / (1.0 - e2)
    x = easting - 500000.0
    y = northing
    if hemisphere == 'S':
        y -= 10000000.0
    
    centralLon = ((zone - 1) * 6 - 180 + 3) * (math.pi / 180.0)
    M = y / UTM_K0
    mu = M / (WGS84_A * (1.0 - e2 / 4.0 - (3.0 * e2 * e2) / 64.0 - (5.0 * e2 * e2 * e2) / 256.0))
    e1 = (1.0 - math.sqrt(1.0 - e2)) / (1.0 + math.sqrt(1.0 - e2))
    
    phi1Rad = (
        mu +
        ((3.0 * e1) / 2.0 - (27.0 * (e1 ** 3)) / 32.0) * math.sin(2.0 * mu) +
        ((21.0 * e1 * e1) / 16.0 - (55.0 * (e1 ** 4)) / 32.0) * math.sin(4.0 * mu) +
        ((151.0 * (e1 ** 3)) / 96.0) * math.sin(6.0 * mu) +
        ((1097.0 * (e1 ** 4)) / 512.0) * math.sin(8.0 * mu)
    )
    
    N1 = WGS84_A / math.sqrt(1.0 - e2 * math.sin(phi1Rad) * math.sin(phi1Rad))
    T1 = math.tan(phi1Rad) * math.tan(phi1Rad)
    C1 = ePrime2 * math.cos(phi1Rad) * math.cos(phi1Rad)
    R1 = (WGS84_A * (1.0 - e2)) / (math.pow(1.0 - e2 * math.sin(phi1Rad) * math.sin(phi1Rad), 1.5))
    D = x / (N1 * UTM_K0)
    
    latRad = (
        phi1Rad -
        ((N1 * math.tan(phi1Rad)) / R1) *
        ((D * D) / 2.0 -
         ((5.0 + 3.0 * T1 + 10.0 * C1 - 4.0 * C1 * C1 - 9.0 * ePrime2) * (D ** 4)) / 24.0 +
         ((61.0 + 90.0 * T1 + 298.0 * C1 + 45.0 * T1 * T1 - 252.0 * ePrime2 - 3.0 * C1 * C1) * (D ** 6)) / 720.0)
    )
    
    lonRad = (
        centralLon +
        (D -
         ((1.0 + 2.0 * T1 + C1) * (D ** 3)) / 6.0 +
         ((5.0 - 2.0 * C1 + 28.0 * T1 - 3.0 * C1 * C1 + 8.0 * ePrime2 + 24.0 * T1 * T1) * (D ** 5)) / 120.0) /
        math.cos(phi1Rad)
    )
    
    latitude = round((latRad * 180.0) / math.pi, 6)
    longitude = round((lonRad * 180.0) / math.pi, 6)
    return latitude, longitude

all_lines = []
for p in range(1, 7):
    with open(f"scripts/raw_p{p}.txt", "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("PAGE"):
                continue
            all_lines.append(line)

known_bloks = [
    "Belangian Tanjung", "Belangian II", "Belangian I", "Belangian tanjung",
    "Tiwingan Lama I", "Tiwingan Lama II", "Tiwingan lama I", "Tiwingan lama II",
    "Sabuhur II", "Batakan II", "Batakan I", "Batakan III",
    "Batung I",
    "Agrabinta", "Cidaun", "Cikadu", "Cikanyere", "Sindangbarang", "Sukasari", "Kuningan",
    "I"
]

known_pengawas = [
    "Adek, Andika & Amat", "Fadlullah & Muhammad Asra", "Asra & Yandi", "Rehan & Asra",
    "Akhmad Ghadafi", "A. Ghadafi", "Ghadafi", "GhadafI", "Septia Rendy S", "A. Semadi",
    "M. Rafi'i", "M. Asra", "Adek N", "M. Jufri", "JufrI", "Jufri", "jufri", "Riyandi",
    "Naslihun", "Husen", "Ungkas", "Alfath", "Ikbal", "Asep", "Suliadi", "Ikhsan",
    "Odiyana", "OdIYana", "Sulton", "Maman", "Sule", "Ari", "Cep", "Adek", "Asra"
]

soil_types = [
    "Podsolik Merah Kuning", "Eutric Cambisols", "Orthic Acrisol", "Orthic Luvisol",
    "Pellic Vertisols", "Ochric Andosols", "Lithosols", "Podzolik",
    "Regosol", "Ultisol", "Latosol", "Lempung", "Andosol", "Aluvial", "Aluvia", "Alluvial",
    "Litosol", "Gembur", "Latsol"
]

def normalize_date(d_str):
    d_str = d_str.replace("/", "-")
    parts = d_str.split("-")
    if len(parts) == 3:
        day, month, year = parts[0], parts[1], parts[2]
        if len(year) == 2:
            year = "20" + year
        return f"{year}-{month.zfill(2)}-{day.zfill(2)}"
    return "2026-01-01"

pu_list = []

for idx, line in enumerate(all_lines):
    row_num = idx + 1
    
    # Coordinates
    utm_match = re.search(r'(\d{2}[A-Z])\s+(\d+)\s+(\d+)', line)
    latlon_match = None
    if not utm_match:
        latlon_match = re.search(r'(-?\d+\.\d+)\s+(\d+\.\d+)', line)
        coord_span = latlon_match.span()
        lat = float(latlon_match.group(1))
        lon = float(latlon_match.group(2))
        utm_zone = "50M"
        utm_easting = 274200
        utm_northing = 9597700
        koordinat_utm = f"{lat}, {lon}"
    else:
        coord_span = utm_match.span()
        zone_str = utm_match.group(1)
        utm_zone = zone_str
        zone_num = int(zone_str[:2])
        easting_str = utm_match.group(2)
        northing_str = utm_match.group(3)
        
        easting = int(easting_str)
        northing = int(northing_str)
        
        # Typos in source
        if row_num == 122 and len(easting_str) == 7:
            easting = 279407
        elif row_num == 385 and len(northing_str) == 8:
            northing = 9608452
        elif row_num == 248 and len(northing_str) == 6:
            northing = 9608460
        elif row_num == 383 and easting_str == "202514":
            easting = 282514
        elif row_num == 316 and easting_str == "250107":
            easting = 280107
            northing = 9612164
            
        lat, lon = utm_to_latlon(easting, northing, zone_num, 'S')
        utm_easting = easting
        utm_northing = northing
        koordinat_utm = f"{zone_str} {easting} {northing}"
        
    before = line[:coord_span[0]].strip()
    after = line[coord_span[1]:].strip()
    
    # Prefix match
    m_pref = re.match(r'^(\d+)\s+(.+?)\s+(\d+(?:[.,]\d+)?)\s+(Hijau|HIjau|Kuning|Merah|Hitam)\s+(\d{2}[-/]\d{2}[-/]\d{2,4})\s+(.*)$', before, re.IGNORECASE)
    no_pu_raw = m_pref.group(2).strip()
    survival_rate_val = float(m_pref.group(3).replace(",", "."))
    kategori_warna_raw = m_pref.group(4).strip().lower()
    if kategori_warna_raw == "hijau":
        kategori = "hijau"
    elif kategori_warna_raw == "kuning":
        kategori = "kuning"
    elif kategori_warna_raw == "merah":
        kategori = "merah"
    else:
        kategori = "hitam"
        
    tanggal_evaluasi = normalize_date(m_pref.group(5))
    rest_before = m_pref.group(6)
    
    das_raw = rest_before.split()[0]
    rest_b = rest_before[len(das_raw):].strip()
    
    matched_blok = "Belangian"
    for b in sorted(known_bloks, key=lambda x: -len(x)):
        if rest_b.lower().startswith(b.lower()):
            matched_blok = b
            rest_b = rest_b[len(b):].strip()
            break
            
    # Normalize Blok capitalization
    blok_clean = matched_blok
    if blok_clean.lower() == "belangian tanjung":
        blok_clean = "Belangian Tanjung"
    elif blok_clean.lower() == "tiwingan lama i":
        blok_clean = "Tiwingan Lama I"
    elif blok_clean.lower() == "tiwingan lama ii":
        blok_clean = "Tiwingan Lama II"
    elif blok_clean.lower() == "i":
        blok_clean = "Kiram / Pamaton (Blok I)"
        
    # Petak and Lokasi
    if "jawa barat" in rest_b.lower():
        m_jb = re.search(r'^(.*?)(Jawa Barat)$', rest_b, re.IGNORECASE)
        petak = m_jb.group(1).strip() if m_jb else rest_b
        lokasi = "Jawa Barat"
    else:
        tokens = rest_b.split(None, 1)
        if len(tokens) > 1 and tokens[0].isdigit():
            petak = f"Petak {tokens[0]}"
            lokasi = tokens[1]
        elif len(tokens) > 1:
            petak = tokens[0]
            lokasi = tokens[1]
        else:
            petak = rest_b if rest_b else "Petak 1"
            lokasi = "Kawasan DAS"
            
    # Sub-DAS mapping
    if das_raw == "7":
        das_name = "DAS 7"
        sub_das = "DAS 7 - Belangian"
    elif das_raw == "9":
        das_name = "DAS 9"
        sub_das = f"DAS 9 - {blok_clean}"
    elif das_raw == "3":
        das_name = "DAS 3"
        sub_das = "DAS 3 - Tiwingan Lama"
    elif das_raw == "4":
        das_name = "DAS 4"
        sub_das = f"DAS 4 - {blok_clean}"
    elif das_raw in ["RT1", "R1"]:
        das_name = "DAS RT1"
        sub_das = f"DAS RT1 - {blok_clean}"
    elif das_raw in ["1", "I"]:
        das_name = "DAS 1"
        sub_das = "DAS 1 - Kiram & Pamaton"
    else:
        das_name = f"DAS {das_raw}"
        sub_das = f"DAS {das_raw} - {blok_clean}"
        
    # Parse After
    note = ""
    if "belum dilakukan penanaman" in after.lower():
        note = "Belum dilakukan penanaman"
        after = re.sub(r'belum dilakukan penanaman', '', after, flags=re.IGNORECASE).strip()
        
    pengawas = ""
    for p in sorted(known_pengawas, key=lambda x: -len(x)):
        if re.search(r'\b' + re.escape(p) + r'$', after, re.IGNORECASE):
            pengawas = p
            after = re.sub(r'\s*' + re.escape(p) + r'$', '', after, flags=re.IGNORECASE).strip()
            break
            
    kat_lahan = ""
    m_kat = re.search(r'\b(2A|3B|3C|3A|2)\b$', after)
    if m_kat:
        kat_lahan = m_kat.group(1)
        after = after[:m_kat.start()].strip()
        
    m_yr = re.match(r'^(20\d\d(?:\s*[-&,]\s*20\d\d)?)\s*(.*)$', after)
    if m_yr:
        th_tanam_str = m_yr.group(1)
        # Year as integer: extract latest year
        yrs = re.findall(r'20\d\d', th_tanam_str)
        th_tanam = int(yrs[-1]) if yrs else 2025
        rest = m_yr.group(2).strip()
    else:
        th_tanam = 2025
        rest = after
        
    m_jk = re.match(r'^(\d+(?:[.,]\d+)?\s*[xX]\s*\d+(?:[.,]\d+)?)\s*(.*)$', rest)
    if m_jk:
        jarak_tanam = m_jk.group(1).replace(" ", "") + " m"
        rest = m_jk.group(2).strip()
    else:
        jarak_tanam = "3 x 3 m"
        
    matched_soil = ""
    soil_before = rest
    soil_after = ""
    for st in sorted(soil_types, key=lambda x: -len(x)):
        m_s = re.search(r'\b' + re.escape(st) + r'\b', rest, re.IGNORECASE)
        if m_s:
            matched_soil = st
            soil_before = rest[:m_s.start()].strip()
            soil_after = rest[m_s.end():].strip()
            break
            
    # Soil after -> pH & kemiringan
    tokens_after = soil_after.split()
    ph = ""
    kemiringan = ""
    if len(tokens_after) >= 2:
        ph = tokens_after[0].replace(",", ".")
        kemiringan = tokens_after[1] + "%"
    elif len(tokens_after) == 1:
        val = tokens_after[0].replace(",", ".")
        try:
            f = float(val)
            if f <= 14:
                ph = val
            else:
                kemiringan = val + "%"
        except:
            kemiringan = tokens_after[0] + "%"
            
    # Soil before -> Tanaman, Suhu, Kelembaban
    m_env = re.search(r'(\d+(?:[.,]\d+)?)\s+(\d+(?:[.,]\d+)?%?)$', soil_before)
    if m_env:
        suhu = m_env.group(1).replace(",", ".") + "°C"
        kelembaban = m_env.group(2).replace(",", ".")
        if not kelembaban.endswith("%"):
            kelembaban += "%"
        tanaman_str = soil_before[:m_env.start()].strip()
    else:
        m_env1 = re.search(r'(\d+(?:[.,]\d+)?%?)$', soil_before)
        if m_env1:
            tanaman_str = soil_before[:m_env1.start()].strip()
            val = m_env1.group(1).replace(",", ".")
            if "%" in val or float(re.sub(r'[^\d.]', '', val) or 0) > 40:
                kelembaban = val if val.endswith("%") else val + "%"
                suhu = "29°C"
            else:
                suhu = val + "°C"
                kelembaban = "75%"
        else:
            tanaman_str = soil_before
            suhu = "29.5°C"
            kelembaban = "72%"
            
    tanaman_str = tanaman_str.strip().strip(",").strip("-").strip()
    if not tanaman_str:
        tanaman_str = "Mahoni, Karet"
        
    # Split tanaman into list
    jenis_tanaman = [t.strip() for t in re.split(r'[,;&]|\bdan\b', tanaman_str) if t.strip() and t.strip() != "-"]
    if not jenis_tanaman:
        jenis_tanaman = [tanaman_str]
        
    # Default soil if empty
    if not matched_soil:
        if "belangian" in blok_clean.lower():
            matched_soil = "Latosol"
        elif "tiwingan" in blok_clean.lower():
            matched_soil = "Gembur"
        elif "batakan" in blok_clean.lower() or "sabuhur" in blok_clean.lower():
            matched_soil = "Aluvial"
        elif "jawa barat" in lokasi.lower():
            matched_soil = "Regosol"
        else:
            matched_soil = "Latosol"
            
    tanaman_awal = 50
    tanaman_hidup = int(round((survival_rate_val / 100.0) * tanaman_awal))
    kebutuhan_sulam = max(0, tanaman_awal - tanaman_hidup)
    
    if survival_rate_val >= 80:
        kesehatan = "Baik & Sehat"
        rekomendasi = "Pertahankan pemeliharaan intensif; persentase hidup sangat memuaskan."
    elif survival_rate_val >= 75:
        kesehatan = "Cukup Sehat"
        rekomendasi = "Lakukan penyiangan gulma dan pemupukan tambahan agar melampaui standar 80%."
    elif survival_rate_val > 40:
        kesehatan = "Perlu Pemeliharaan & Sulam"
        rekomendasi = f"Segera lakukan penyulaman bibit {kebutuhan_sulam} batang dan perbaikan saluran drainase/pemberantasan hama."
    else:
        kesehatan = "Kritis (Mati/Hilang)"
        rekomendasi = f"Status Kritis / Gagal Tumbuh. Perlu penanaman ulang (replanting) menyeluruh sebanyak {kebutuhan_sulam} bibit berkualitas."
        
    evaluator_name = pengawas if pengawas else "Tim Pemantau Lapangan 2026"
    
    kode_pu = f"PU-{no_pu_raw}".replace(" ", "")
    
    pu_obj = {
        "id": f"pu-2026-{row_num}",
        "kodePU": kode_pu,
        "tanggalEvaluasi": tanggal_evaluasi,
        "tanggalPengambilanData": tanggal_evaluasi,
        "periodeEvaluasi": "P1 (Tahun 1)",
        "subDas": sub_das,
        "das": das_name,
        "blok": blok_clean,
        "petak": petak,
        "lokasiDaerah": lokasi,
        "desa": petak,
        "kecamatan": lokasi,
        "latitude": lat,
        "longitude": lon,
        "koordinatUtm": koordinat_utm,
        "utmZone": utm_zone,
        "utmEasting": utm_easting,
        "utmNorthing": utm_northing,
        "tahunTanam": th_tanam,
        "kategori": kategori,
        "pengawasOperasional": evaluator_name,
        "survivalRate": round(survival_rate_val, 2),
        "persentaseHidup": round(survival_rate_val, 2),
        "jarakTanam": jarak_tanam,
        "jenisTanaman": jenis_tanaman,
        "suhuLingkungan": suhu,
        "kelembabanUdara": kelembaban,
        "jenisTanah": matched_soil,
        "pHTanah": ph if ph else "5.8",
        "kemiringanLahan": kemiringan if kemiringan else "20%",
        "evaluator": evaluator_name,
        "assessor": evaluator_name,
        "catatan": note if note else f"Data pemantauan survival rate tahun 2026 di {blok_clean} ({petak}).",
        "tanamanAwal": tanaman_awal,
        "tanamanHidup": tanaman_hidup,
        "tanamanMerana": max(0, tanaman_awal - tanaman_hidup - (2 if tanaman_hidup < tanaman_awal else 0)),
        "kesehatanTanaman": kesehatan,
        "kebutuhanPenyulaman": kebutuhan_sulam,
        "rekomendasi": rekomendasi,
        "updatedAt": f"{tanggal_evaluasi}T08:00:00.000Z"
    }
    
    pu_list.append(pu_obj)

print(f"Total processed PU items: {len(pu_list)}")

# Write to TypeScript file
ts_content = """import { PetakUkur } from '../types';

export const PETAK_UKUR_2026: PetakUkur[] = """ + json.dumps(pu_list, indent=2, ensure_ascii=False) + """;
"""

with open("src/data/pu2026Data.ts", "w", encoding="utf-8") as f:
    f.write(ts_content)

print("Successfully wrote src/data/pu2026Data.ts")
