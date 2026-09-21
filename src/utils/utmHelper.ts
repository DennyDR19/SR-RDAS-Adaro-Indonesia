/**
 * UTM (Universal Transverse Mercator) & WGS84 Geographic Coordinate Conversion
 * Standard Ellipsoid: WGS84
 */

const WGS84_A = 6378137.0; // semi-major axis
const WGS84_ECC_SQ = 0.00669437999014; // e^2
const UTM_K0 = 0.9996; // scale factor

export interface UtmCoordinate {
  easting: number;
  northing: number;
  zone: number;
  hemisphere: 'N' | 'S';
  formatted: string;
}

export interface LatLonCoordinate {
  latitude: number;
  longitude: number;
}

/**
 * Convert Lat/Lon (WGS84) to UTM Coordinate
 */
export function latLonToUtm(latitude: number, longitude: number): UtmCoordinate {
  const latRad = (latitude * Math.PI) / 180.0;
  const lonRad = (longitude * Math.PI) / 180.0;

  let zone = Math.floor((longitude + 180.0) / 6.0) + 1;
  if (zone < 1) zone = 1;
  if (zone > 60) zone = 60;

  const hemisphere: 'N' | 'S' = latitude < 0 ? 'S' : 'N';
  const centralLon = ((zone - 1) * 6 - 180 + 3) * (Math.PI / 180.0);

  const e2 = WGS84_ECC_SQ;
  const ePrime2 = e2 / (1.0 - e2);

  const N = WGS84_A / Math.sqrt(1.0 - e2 * Math.sin(latRad) * Math.sin(latRad));
  const T = Math.tan(latRad) * Math.tan(latRad);
  const C = ePrime2 * Math.cos(latRad) * Math.cos(latRad);
  const A = Math.cos(latRad) * (lonRad - centralLon);

  // Meridian distance M
  const M =
    WGS84_A *
    ((1.0 - e2 / 4.0 - (3.0 * e2 * e2) / 64.0 - (5.0 * e2 * e2 * e2) / 256.0) * latRad -
      ((3.0 * e2) / 8.0 + (3.0 * e2 * e2) / 32.0 + (45.0 * e2 * e2 * e2) / 1024.0) *
        Math.sin(2.0 * latRad) +
      ((15.0 * e2 * e2) / 256.0 + (45.0 * e2 * e2 * e2) / 1024.0) * Math.sin(4.0 * latRad) -
      ((35.0 * e2 * e2 * e2) / 3072.0) * Math.sin(6.0 * latRad));

  // Easting
  const easting =
    UTM_K0 *
      N *
      (A +
        ((1.0 - T + C) * Math.pow(A, 3)) / 6.0 +
        ((5.0 - 18.0 * T + T * T + 72.0 * C - 58.0 * ePrime2) * Math.pow(A, 5)) / 120.0) +
    500000.0;

  // Northing
  let northing =
    UTM_K0 *
    (M +
      N *
        Math.tan(latRad) *
        ((A * A) / 2.0 +
          ((5.0 - T + 9.0 * C + 4.0 * C * C) * Math.pow(A, 4)) / 24.0 +
          ((61.0 - 58.0 * T + T * T + 600.0 * C - 330.0 * ePrime2) * Math.pow(A, 6)) / 720.0));

  if (latitude < 0) {
    northing += 10000000.0; // False northing for southern hemisphere
  }

  const roundedEasting = Math.round(easting);
  const roundedNorthing = Math.round(northing);

  return {
    easting: roundedEasting,
    northing: roundedNorthing,
    zone,
    hemisphere,
    formatted: `${zone}${hemisphere} X: ${roundedEasting} m, Y: ${roundedNorthing} m`,
  };
}

/**
 * Convert UTM coordinate to Lat/Lon (WGS84)
 */
export function utmToLatLon(
  easting: number,
  northing: number,
  zone: number,
  hemisphere: 'N' | 'S'
): LatLonCoordinate {
  const e2 = WGS84_ECC_SQ;
  const ePrime2 = e2 / (1.0 - e2);

  const x = easting - 500000.0;
  let y = northing;
  if (hemisphere === 'S') {
    y -= 10000000.0;
  }

  const centralLon = ((zone - 1) * 6 - 180 + 3) * (Math.PI / 180.0);

  const M = y / UTM_K0;
  const mu =
    M /
    (WGS84_A *
      (1.0 - e2 / 4.0 - (3.0 * e2 * e2) / 64.0 - (5.0 * e2 * e2 * e2) / 256.0));

  const e1 = (1.0 - Math.sqrt(1.0 - e2)) / (1.0 + Math.sqrt(1.0 - e2));

  // Footprint latitude
  const phi1Rad =
    mu +
    ((3.0 * e1) / 2.0 - (27.0 * Math.pow(e1, 3)) / 32.0) * Math.sin(2.0 * mu) +
    ((21.0 * e1 * e1) / 16.0 - (55.0 * Math.pow(e1, 4)) / 32.0) * Math.sin(4.0 * mu) +
    ((151.0 * Math.pow(e1, 3)) / 96.0) * Math.sin(6.0 * mu) +
    ((1097.0 * Math.pow(e1, 4)) / 512.0) * Math.sin(8.0 * mu);

  const N1 = WGS84_A / Math.sqrt(1.0 - e2 * Math.sin(phi1Rad) * Math.sin(phi1Rad));
  const T1 = Math.tan(phi1Rad) * Math.tan(phi1Rad);
  const C1 = ePrime2 * Math.cos(phi1Rad) * Math.cos(phi1Rad);
  const R1 =
    (WGS84_A * (1.0 - e2)) /
    Math.pow(1.0 - e2 * Math.sin(phi1Rad) * Math.sin(phi1Rad), 1.5);
  const D = x / (N1 * UTM_K0);

  // Latitude
  let latRad =
    phi1Rad -
    ((N1 * Math.tan(phi1Rad)) / R1) *
      ((D * D) / 2.0 -
        ((5.0 + 3.0 * T1 + 10.0 * C1 - 4.0 * C1 * C1 - 9.0 * ePrime2) * Math.pow(D, 4)) / 24.0 +
        ((61.0 + 90.0 * T1 + 298.0 * C1 + 45.0 * T1 * T1 - 252.0 * ePrime2 - 3.0 * C1 * C1) *
          Math.pow(D, 6)) /
          720.0);

  // Longitude
  let lonRad =
    centralLon +
    (D -
      ((1.0 + 2.0 * T1 + C1) * Math.pow(D, 3)) / 6.0 +
      ((5.0 - 2.0 * C1 + 28.0 * T1 - 3.0 * C1 * C1 + 8.0 * ePrime2 + 24.0 * T1 * T1) *
        Math.pow(D, 5)) /
        120.0) /
      Math.cos(phi1Rad);

  const latitude = Number(((latRad * 180.0) / Math.PI).toFixed(6));
  const longitude = Number(((lonRad * 180.0) / Math.PI).toFixed(6));

  return { latitude, longitude };
}

/**
 * Format UTM string for display
 */
export function formatUtmDisplay(zone: number, hemisphere: 'N' | 'S', easting: number, northing: number): string {
  return `${zone}${hemisphere} ${Math.round(easting)}m E, ${Math.round(northing)}m N`;
}

/**
 * Parses user typed UTM string if entered in freeform, e.g. "48S 795400 9208500" or "48S, 795400, 9208500"
 */
export function parseUtmInput(input: string): { zone: number; hemisphere: 'N' | 'S'; easting: number; northing: number } | null {
  if (!input) return null;
  const cleaned = input.replace(/[,;mENenXY:]/g, ' ').replace(/\s+/g, ' ').trim();
  // Support standard N/S hemisphere or M/L latitude band used in Indonesia (M is south of equator)
  const match = cleaned.match(/^(\d{1,2})\s*([NSMLnsml])\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)$/);
  if (match) {
    const zone = parseInt(match[1], 10);
    const bandOrHemi = match[2].toUpperCase();
    // In UTM grid, C through M are Southern Hemisphere. Also northing > 5,000,000 in Indonesia indicates South.
    const hemisphere: 'N' | 'S' = bandOrHemi === 'N' ? 'N' : 'S';
    const easting = parseFloat(match[3]);
    const northing = parseFloat(match[4]);
    if (zone >= 1 && zone <= 60 && easting > 0 && northing > 0) {
      return { zone, hemisphere, easting, northing };
    }
  }
  return null;
}

/**
 * Universal coordinate parser for Excel import:
 * Supports:
 * - "50M 275294 9598293" or "48S 705581 9177828"
 * - "-3.63733047 114.9622084" or "-3.63733, 114.9622"
 * - Returns { latitude, longitude, utmZone, utmEasting, utmNorthing, formattedUtm }
 */
export function parseAnyCoordinate(input: string | number): {
  latitude: number;
  longitude: number;
  utmZone: string;
  utmEasting: number;
  utmNorthing: number;
  formattedUtm: string;
} | null {
  if (!input) return null;
  const str = String(input).trim();

  // Check if it matches UTM format, e.g. 50M 275294 9598293 or 48S 705581 9177828
  const utmMatch = str.match(/^(\d{1,2})\s*([A-Za-z])\s+([0-9.]+)\s+([0-9.]+)$/);
  if (utmMatch) {
    const zone = parseInt(utmMatch[1], 10);
    const letter = utmMatch[2].toUpperCase();
    const easting = parseFloat(utmMatch[3]);
    const northing = parseFloat(utmMatch[4]);
    // In UTM: bands C..M are Southern Hemisphere. Also letter S is South.
    // If northing > 5,000,000 (typical 9,000,000+ in Java/Kalimantan), it's Southern hemisphere
    const hemisphere: 'N' | 'S' = (letter === 'N') ? 'N' : 'S';

    try {
      const geo = utmToLatLon(easting, northing, zone, hemisphere);
      return {
        latitude: geo.latitude,
        longitude: geo.longitude,
        utmZone: `${zone}${hemisphere}`,
        utmEasting: Math.round(easting),
        utmNorthing: Math.round(northing),
        formattedUtm: `${zone}${letter} ${Math.round(easting)} ${Math.round(northing)}`,
      };
    } catch {
      // ignore
    }
  }

  // Check if it matches Lat/Lon format, e.g. "-3.63733047 114.9622084" or "-3.63733047, 114.9622084"
  const latLonMatch = str.match(/^(-?\d{1,2}(?:\.\d+)?)[,\s]+(1\d{2}(?:\.\d+)?|-?\d{1,3}(?:\.\d+)?)$/);
  if (latLonMatch) {
    const lat = parseFloat(latLonMatch[1]);
    const lon = parseFloat(latLonMatch[2]);
    if (!isNaN(lat) && !isNaN(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
      const utm = latLonToUtm(lat, lon);
      return {
        latitude: lat,
        longitude: lon,
        utmZone: `${utm.zone}${utm.hemisphere}`,
        utmEasting: utm.easting,
        utmNorthing: utm.northing,
        formattedUtm: `${utm.zone}${utm.hemisphere} ${utm.easting} ${utm.northing}`,
      };
    }
  }

  return null;
}
