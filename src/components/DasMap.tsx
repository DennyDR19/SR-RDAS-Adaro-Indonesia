import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { PetakUkur, SurvivalCategory } from '../types';
import { CATEGORY_INFO_MAP, getCategoryInfo } from '../utils/survivalHelper';
import { Layers, MapPin, Eye, Filter, RefreshCw, ZoomIn, ZoomOut, Crosshair } from 'lucide-react';

interface DasMapProps {
  puList: PetakUkur[];
  selectedPuId: string | null;
  onSelectPu: (pu: PetakUkur) => void;
  onOpenDetail: (pu: PetakUkur) => void;
  activeCategoryFilter: string;
  activeSubDasFilter: string;
}

type TileLayerType = 'satellite' | 'streets' | 'topo';

// Poligon semu delineasi batas hidrologis Wilayah Sub-DAS Citarum Hulu & Sekitarnya
const DAS_BOUNDARY_COORDS: [number, number][] = [
  [-7.05, 107.50],
  [-7.02, 107.62],
  [-6.80, 107.65],
  [-6.78, 107.75],
  [-6.85, 107.82],
  [-7.15, 107.78],
  [-7.28, 107.68],
  [-7.25, 107.52],
  [-7.12, 107.48],
  [-7.05, 107.50],
];

export const DasMap: React.FC<DasMapProps> = ({
  puList,
  selectedPuId,
  onSelectPu,
  onOpenDetail,
  activeCategoryFilter,
  activeSubDasFilter,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const boundaryLayerRef = useRef<L.Polygon | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const [activeTile, setActiveTile] = useState<TileLayerType>('satellite');
  const [showBoundary, setShowBoundary] = useState<boolean>(true);
  const [hoveredPu, setHoveredPu] = useState<PetakUkur | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center around Southern Bandung / Kertasari / DAS Citarum Hulu
    const map = L.map(mapContainerRef.current, {
      center: [-7.14, 107.64],
      zoom: 11,
      zoomControl: false,
    });

    // Default tile: Esri World Imagery (Satellite)
    const initialTile = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: '&copy; Esri &mdash; Citra Satelit Resolusi Tinggi Pengawasan DAS',
        maxZoom: 18,
      }
    ).addTo(map);

    tileLayerRef.current = initialTile;

    // Delineation polygon
    const boundary = L.polygon(DAS_BOUNDARY_COORDS, {
      color: '#38bdf8',
      weight: 2,
      dashArray: '5, 8',
      fillColor: '#0284c7',
      fillOpacity: 0.08,
    }).addTo(map);
    boundaryLayerRef.current = boundary;

    // Layer group for markers
    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Basemap Layer
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    let url = '';
    let attribution = '';

    if (activeTile === 'satellite') {
      url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      attribution = '&copy; Esri, Earthstar Geographics &mdash; Citra Satelit DAS';
    } else if (activeTile === 'streets') {
      url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      attribution = '&copy; OpenStreetMap contributors &mdash; Peta Jalur Transportasi Lapangan';
    } else {
      url = 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
      attribution = '&copy; OpenTopoMap &mdash; Kontur Kelerengan & Topografi DAS';
    }

    const newTile = L.tileLayer(url, { attribution, maxZoom: 18 }).addTo(map);
    newTile.bringToBack();
    tileLayerRef.current = newTile;
  }, [activeTile]);

  // Toggle boundary layer
  useEffect(() => {
    if (!mapInstanceRef.current || !boundaryLayerRef.current) return;
    if (showBoundary) {
      boundaryLayerRef.current.addTo(mapInstanceRef.current);
    } else {
      mapInstanceRef.current.removeLayer(boundaryLayerRef.current);
    }
  }, [showBoundary]);

  // Render Petak Ukur Markers with interactive popups & hover
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    const markersGroup = markersLayerRef.current;
    markersGroup.clearLayers();

    // Filter items
    const filteredList = puList.filter((pu) => {
      if (activeCategoryFilter !== 'all' && pu.kategori !== activeCategoryFilter) return false;
      if (activeSubDasFilter !== 'all' && pu.subDas !== activeSubDasFilter) return false;
      return true;
    });

    filteredList.forEach((pu) => {
      const catInfo = getCategoryInfo(pu.kategori);

      // Color scheme for marker symbol
      // 0-40%: Hitam, >40-<75%: Merah, 75-80%: Kuning, >80%: Hijau
      let bgStyle = '';
      let borderStyle = '';
      let textColor = '#ffffff';

      if (pu.kategori === 'hitam') {
        bgStyle = '#0f172a'; // pure dark slate / black
        borderStyle = '#ffffff';
        textColor = '#f8fafc';
      } else if (pu.kategori === 'merah') {
        bgStyle = '#dc2626'; // red
        borderStyle = '#ffffff';
        textColor = '#ffffff';
      } else if (pu.kategori === 'kuning') {
        bgStyle = '#eab308'; // yellow
        borderStyle = '#1e293b';
        textColor = '#0f172a';
      } else {
        bgStyle = '#16a34a'; // green
        borderStyle = '#ffffff';
        textColor = '#ffffff';
      }

      const isSelected = selectedPuId === pu.id;

      // Custom HTML Marker using DivIcon
      const iconHtml = `
        <div class="relative group cursor-pointer" style="transform: translate(-50%, -50%);">
          <!-- Pulse ring for critical or top performing -->
          ${
            isSelected
              ? `<div class="absolute -inset-2 rounded-full bg-cyan-400/40 animate-ping"></div>`
              : pu.kategori === 'hitam'
              ? `<div class="absolute -inset-1 rounded-full bg-red-500/30 animate-pulse"></div>`
              : ''
          }
          
          <div style="
            background-color: ${bgStyle};
            border: ${isSelected ? '3px solid #38bdf8' : `2.5px solid ${borderStyle}`};
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
            color: ${textColor};
          " class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-[11px] shadow-lg transition-transform duration-200 hover:scale-125">
            ${Math.round(pu.survivalRate)}
          </div>
          
          <div class="absolute top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-900/90 text-slate-200 text-[10px] font-semibold px-1.5 py-0.5 rounded shadow border border-slate-700 pointer-events-none">
            ${pu.kodePU}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-pu-marker',
        html: iconHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([pu.latitude, pu.longitude], {
        icon: customIcon,
        title: `${pu.kodePU} (${pu.survivalRate}%)`,
      });

      // Hover Tooltip
      const tooltipContent = `
        <div class="p-2.5 max-w-[260px] bg-slate-900 text-slate-100 rounded-lg shadow-xl border border-slate-700 text-xs">
          <div class="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-slate-800">
            <span class="font-bold text-sm text-cyan-400">${pu.kodePU}</span>
            <span class="px-2 py-0.5 rounded text-[10px] font-bold ${catInfo.badgeBg} ${catInfo.badgeText} border ${catInfo.badgeBorder}">
              ${catInfo.name}
            </span>
          </div>
          <div class="text-[11px] text-slate-300 font-medium mb-1">
            ${pu.blok} • ${pu.subDas}
          </div>
          <div class="grid grid-cols-2 gap-1.5 py-1 text-[11px] bg-slate-950/60 p-1.5 rounded mb-1.5">
            <div>
              <span class="text-slate-400 block text-[10px]">Survival Rate</span>
              <span class="font-bold text-sm" style="color: ${catInfo.colorHex}">${pu.survivalRate}%</span>
            </div>
            <div>
              <span class="text-slate-400 block text-[10px]">Pohon Hidup</span>
              <span class="font-bold text-sm text-slate-200">${pu.tanamanHidup} / ${pu.tanamanAwal} btg</span>
            </div>
          </div>
          <div class="text-[10px] text-slate-400 mb-1">
            <strong class="text-slate-300">Jenis:</strong> ${pu.jenisTanaman.join(', ')}
          </div>
          <div class="text-[10px] text-amber-300 italic">
            Klik marker untuk membuka data detail lengkap & rekomendasi teknis.
          </div>
        </div>
      `;

      marker.bindTooltip(tooltipContent, {
        direction: 'top',
        offset: [0, -16],
        opacity: 0.98,
        className: 'leaflet-custom-tooltip',
      });

      // Hover and Click events
      marker.on('mouseover', () => {
        setHoveredPu(pu);
      });

      marker.on('mouseout', () => {
        setHoveredPu(null);
      });

      marker.on('click', () => {
        onSelectPu(pu);
        onOpenDetail(pu);
      });

      markersGroup.addLayer(marker);
    });
  }, [puList, selectedPuId, activeCategoryFilter, activeSubDasFilter, onSelectPu, onOpenDetail]);

  // Zoom to selected PU if changed from outside
  useEffect(() => {
    if (!selectedPuId || !mapInstanceRef.current) return;
    const pu = puList.find((p) => p.id === selectedPuId);
    if (pu) {
      mapInstanceRef.current.flyTo([pu.latitude, pu.longitude], 14, {
        duration: 1.2,
      });
    }
  }, [selectedPuId, puList]);

  // Center bounds
  const handleResetBounds = () => {
    if (!mapInstanceRef.current || puList.length === 0) return;
    const bounds = L.latLngBounds(puList.map((p) => [p.latitude, p.longitude]));
    mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
  };

  // User current location
  const handleLocateMe = () => {
    if (!navigator.geolocation || !mapInstanceRef.current) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        mapInstanceRef.current?.flyTo([latitude, longitude], 13);
      },
      () => {
        // Fallback to default DAS center
        handleResetBounds();
      }
    );
  };

  return (
    <div className="relative w-full h-full min-h-[460px] flex-1 bg-slate-950 overflow-hidden rounded-xl border border-slate-800 shadow-2xl">
      {/* Map Container */}
      <div id="das-leaflet-map" ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Top Left Floating Basemap Selector */}
      <div className="absolute top-4 left-4 z-[400] flex flex-col gap-2">
        <div className="bg-slate-900/95 backdrop-blur-md p-1.5 rounded-lg border border-slate-800 shadow-xl flex items-center gap-1 text-xs">
          <button
            id="basemap-satellite-btn"
            onClick={() => setActiveTile('satellite')}
            className={`px-2.5 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-all ${
              activeTile === 'satellite'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Citra Satelit
          </button>
          <button
            id="basemap-streets-btn"
            onClick={() => setActiveTile('streets')}
            className={`px-2.5 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-all ${
              activeTile === 'streets'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            Peta Jalan
          </button>
          <button
            id="basemap-topo-btn"
            onClick={() => setActiveTile('topo')}
            className={`px-2.5 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-all ${
              activeTile === 'topo'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            Topografi
          </button>
        </div>

        {/* Watershed Boundary Toggle */}
        <button
          id="toggle-boundary-btn"
          onClick={() => setShowBoundary(!showBoundary)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border shadow-lg backdrop-blur-md flex items-center gap-1.5 self-start transition-colors ${
            showBoundary
              ? 'bg-sky-950/90 text-sky-300 border-sky-600'
              : 'bg-slate-900/90 text-slate-400 border-slate-700 hover:bg-slate-800'
          }`}
        >
          <div className="w-2.5 h-2.5 rounded-full border border-sky-400 bg-sky-500/40" />
          {showBoundary ? 'Delineasi DAS Aktif' : 'Batas DAS Non-aktif'}
        </button>
      </div>

      {/* Top Right Zoom and Control Tools */}
      <div className="absolute top-4 right-4 z-[400] flex flex-col gap-1.5">
        <button
          id="map-zoom-in-btn"
          onClick={() => mapInstanceRef.current?.zoomIn()}
          title="Perbesar Peta"
          className="w-9 h-9 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 flex items-center justify-center shadow-lg transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          id="map-zoom-out-btn"
          onClick={() => mapInstanceRef.current?.zoomOut()}
          title="Perkecil Peta"
          className="w-9 h-9 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 flex items-center justify-center shadow-lg transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          id="map-reset-bounds-btn"
          onClick={handleResetBounds}
          title="Fokus Seluruh Petak Ukur (Fit Bounds)"
          className="w-9 h-9 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 flex items-center justify-center shadow-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
        <button
          id="map-locate-me-btn"
          onClick={handleLocateMe}
          title="Pusatkan ke Lokasi Saya"
          className="w-9 h-9 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 flex items-center justify-center shadow-lg transition-colors"
        >
          <Crosshair className="w-4 h-4" />
        </button>
      </div>

      {/* Interactive Bottom Hover Preview Card */}
      {hoveredPu && (
        <div className="absolute bottom-5 left-4 right-4 md:left-auto md:right-4 md:w-96 z-[400] bg-slate-900/95 backdrop-blur-md p-3.5 rounded-xl border border-slate-700 shadow-2xl animate-fade-in pointer-events-none">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: getCategoryInfo(hoveredPu.kategori).colorHex }} />
              <span className="font-bold text-slate-100 text-sm">{hoveredPu.kodePU}</span>
              <span className="text-xs text-slate-400">({hoveredPu.blok})</span>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${getCategoryInfo(hoveredPu.kategori).badgeBg} ${getCategoryInfo(hoveredPu.kategori).badgeText} border ${getCategoryInfo(hoveredPu.kategori).badgeBorder}`}
            >
              {hoveredPu.survivalRate}% ({getCategoryInfo(hoveredPu.kategori).name})
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 py-1.5 px-2 bg-slate-950/80 rounded-lg text-center text-xs mb-2">
            <div>
              <span className="text-[10px] text-slate-400 block">Hidup / Awal</span>
              <span className="font-semibold text-slate-200">{hoveredPu.tanamanHidup} / {hoveredPu.tanamanAwal}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Kebutuhan Sulam</span>
              <span className={`font-semibold ${hoveredPu.kebutuhanPenyulaman > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {hoveredPu.kebutuhanPenyulaman} btg
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Tutupan Tajuk</span>
              <span className="font-semibold text-slate-200">{hoveredPu.tutupanTajukPersen}%</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-300 line-clamp-1 italic">
            "{hoveredPu.rekomendasi}"
          </p>
        </div>
      )}
    </div>
  );
};
