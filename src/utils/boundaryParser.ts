import shp from 'shpjs';
import { kml as kmlToGeoJSON } from '@tmcw/togeojson';
import JSZip from 'jszip';
import { CustomBoundary } from '../types';

export const BOUNDARY_PALETTE = [
  { name: 'Emerald / Hijau RHL', color: '#10b981', fill: '#059669' },
  { name: 'Sky Blue / Biru DAS', color: '#38bdf8', fill: '#0284c7' },
  { name: 'Amber / Kuning Pemeliharaan', color: '#f59e0b', fill: '#d97706' },
  { name: 'Rose / Merah Kritis', color: '#f43f5e', fill: '#e11d48' },
  { name: 'Purple / Ungu Wilayah', color: '#a855f7', fill: '#9333ea' },
  { name: 'Orange / Oranye Blok', color: '#f97316', fill: '#ea580c' },
  { name: 'Teal / Hijau Toska', color: '#14b8a6', fill: '#0d9488' },
  { name: 'Indigo / Biru Lembayung', color: '#6366f1', fill: '#4f46e5' },
];

/**
 * Normalizes any GeoJSON structure to a standard FeatureCollection
 */
export function normalizeToFeatureCollection(rawGeoJson: any): any {
  if (!rawGeoJson) {
    throw new Error('Data spasial kosong atau tidak valid.');
  }

  // If array of FeatureCollections (common in shpjs with multiple layers)
  if (Array.isArray(rawGeoJson)) {
    const combinedFeatures: any[] = [];
    rawGeoJson.forEach((fc) => {
      if (fc && fc.features && Array.isArray(fc.features)) {
        combinedFeatures.push(...fc.features);
      } else if (fc && fc.type === 'Feature') {
        combinedFeatures.push(fc);
      }
    });
    return {
      type: 'FeatureCollection',
      features: combinedFeatures,
    };
  }

  // If single Feature
  if (rawGeoJson.type === 'Feature') {
    return {
      type: 'FeatureCollection',
      features: [rawGeoJson],
    };
  }

  // If standard FeatureCollection
  if (rawGeoJson.type === 'FeatureCollection') {
    return rawGeoJson;
  }

  // If raw Geometry (Polygon, MultiPolygon, etc.)
  if (rawGeoJson.coordinates) {
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: rawGeoJson,
        },
      ],
    };
  }

  throw new Error('Format geometri tidak dikenali sebagai format GeoJSON standar.');
}

/**
 * Parses an uploaded file (Shapefile .zip, .kml, .kmz, .geojson)
 */
export async function parseBoundaryFile(
  file: File,
  customName?: string,
  chosenColor?: { color: string; fill: string }
): Promise<CustomBoundary> {
  const fileName = file.name;
  const ext = fileName.split('.').pop()?.toLowerCase();
  const id = `boundary-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const cleanName =
    customName?.trim() ||
    fileName.replace(/\.(zip|kml|kmz|geojson|json)$/i, '').replace(/[-_]/g, ' ');

  const colorConfig = chosenColor || BOUNDARY_PALETTE[Math.floor(Math.random() * BOUNDARY_PALETTE.length)];

  let featureCollection: any = null;
  let fileType: CustomBoundary['fileType'] = 'geojson';

  try {
    if (ext === 'zip') {
      fileType = 'shp';
      const arrayBuffer = await file.arrayBuffer();
      // shpjs can parse arrayBuffer of a zip directly
      const parsed = await shp(arrayBuffer);
      featureCollection = normalizeToFeatureCollection(parsed);
    } else if (ext === 'kml') {
      fileType = 'kml';
      const text = await file.text();
      const domParser = new DOMParser();
      const xmlDoc = domParser.parseFromString(text, 'text/xml');
      const parserErrors = xmlDoc.getElementsByTagName('parsererror');
      if (parserErrors.length > 0) {
        throw new Error('File KML rusak atau memiliki sintaks XML yang tidak valid.');
      }
      const parsed = kmlToGeoJSON(xmlDoc);
      featureCollection = normalizeToFeatureCollection(parsed);
    } else if (ext === 'kmz') {
      fileType = 'kmz';
      const zip = await JSZip.loadAsync(file);
      // Locate .kml inside .kmz
      const kmlEntry = Object.values(zip.files).find((f) =>
        f.name.toLowerCase().endsWith('.kml')
      );
      if (!kmlEntry) {
        throw new Error('Arsip KMZ tidak memiliki file KML internal.');
      }
      const kmlText = await kmlEntry.async('text');
      const domParser = new DOMParser();
      const xmlDoc = domParser.parseFromString(kmlText, 'text/xml');
      const parsed = kmlToGeoJSON(xmlDoc);
      featureCollection = normalizeToFeatureCollection(parsed);
    } else if (ext === 'geojson' || ext === 'json') {
      fileType = 'geojson';
      const text = await file.text();
      const parsed = JSON.parse(text);
      featureCollection = normalizeToFeatureCollection(parsed);
    } else {
      throw new Error(
        `Format file .${ext} belum didukung. Harap unggah Shapefile (.zip), KML (.kml), KMZ (.kmz), atau GeoJSON.`
      );
    }
  } catch (err: any) {
    console.error('Error parsing boundary file:', err);
    throw new Error(
      err?.message ||
        'Gagal memproses file spasial. Pastikan file Shapefile (.zip) memuat minimal .shp dan .dbf, atau file KML valid.'
    );
  }

  if (!featureCollection || !featureCollection.features || featureCollection.features.length === 0) {
    throw new Error('File spasial tidak memuat satupun fitur poligon atau batas area.');
  }

  return {
    id,
    name: cleanName,
    fileName,
    fileType,
    color: colorConfig.color,
    fillColor: colorConfig.fill,
    fillOpacity: 0.18,
    weight: 2.5,
    dashArray: '4, 6',
    visible: true,
    featureCount: featureCollection.features.length,
    uploadedAt: new Date().toISOString(),
    data: featureCollection,
  };
}

const STORAGE_KEY = 'das_custom_boundaries_v1';

export function getSavedBoundaries(): CustomBoundary[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load boundaries from localStorage:', e);
    return [];
  }
}

export function saveBoundaries(boundaries: CustomBoundary[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(boundaries));
  } catch (e) {
    console.warn('Failed to save boundaries to localStorage (storage quota may be full):', e);
  }
}

export function getSampleBoundaries(): CustomBoundary[] {
  return [
    {
      id: 'sample-boundary-1',
      name: 'Blok RHL Pasir Bintang (Sampel KML)',
      fileName: 'blok_rhl_pasir_bintang.kml',
      fileType: 'kml',
      color: '#10b981',
      fillColor: '#059669',
      fillOpacity: 0.22,
      weight: 2.5,
      dashArray: '5, 5',
      visible: true,
      featureCount: 1,
      uploadedAt: new Date().toISOString(),
      data: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {
              nama_blok: 'Pasir Bintang Blok B1',
              luas_ha: 14.8,
              tahun_tanam: 2023,
              pola_tanam: 'Agroforestri RHL',
              pengelola: 'KTH Wargamekar',
              sub_das: 'Citarum Hulu',
            },
            geometry: {
              type: 'Polygon',
              coordinates: [
                [
                  [107.625, -7.135],
                  [107.645, -7.130],
                  [107.655, -7.145],
                  [107.638, -7.155],
                  [107.622, -7.148],
                  [107.625, -7.135],
                ],
              ],
            },
          },
        ],
      },
    },
    {
      id: 'sample-boundary-2',
      name: 'Delineasi Wilayah Sub-DAS Cisangkuy (Sampel SHP)',
      fileName: 'batas_subdas_cisangkuy.zip',
      fileType: 'shp',
      color: '#0284c7',
      fillColor: '#0369a1',
      fillOpacity: 0.14,
      weight: 2,
      dashArray: '6, 8',
      visible: true,
      featureCount: 1,
      uploadedAt: new Date().toISOString(),
      data: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {
              nama_das: 'Citarum',
              sub_das: 'Cisangkuy Hulu',
              luas_km2: 182.4,
              orde_sungai: 2,
              status_kritis: 'Tinggi',
            },
            geometry: {
              type: 'Polygon',
              coordinates: [
                [
                  [107.49, -7.08],
                  [107.56, -7.05],
                  [107.61, -7.12],
                  [107.59, -7.22],
                  [107.51, -7.21],
                  [107.47, -7.14],
                  [107.49, -7.08],
                ],
              ],
            },
          },
        ],
      },
    },
  ];
}
