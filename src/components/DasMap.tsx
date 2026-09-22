import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { PetakUkur, SurvivalCategory, CustomBoundary } from '../types';
import { CATEGORY_INFO_MAP, getCategoryInfo } from '../utils/survivalHelper';
import {
  Layers,
  MapPin,
  Eye,
  Filter,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Crosshair,
  FolderArchive,
  Maximize2,
  Minimize2,
} from 'lucide-react';

interface DasMapProps {
  puList: PetakUkur[];
  selectedPuId: string | null;
  onSelectPu: (pu: PetakUkur) => void;
  onOpenDetail: (pu: PetakUkur) => void;
  activeCategoryFilter: string;
  activeSubDasFilter: string;
  customBoundaries?: CustomBoundary[];
  onOpenBoundaryModal?: () => void;
  focusedBoundary?: CustomBoundary | null;
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
  customBoundaries = [],
  onOpenBoundaryModal,
  focusedBoundary = null,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const boundaryLayerRef = useRef<L.Polygon | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const customBoundaryLayersRef = useRef<{ [id: string]: L.GeoJSON }>({});
  const mapWrapperRef = useRef<HTMLDivElement>(null);

  const [activeTile, setActiveTile] = useState<TileLayerType>('satellite');
  const [showBoundary, setShowBoundary] = useState<boolean>(true);
  const [hoveredPu, setHoveredPu] = useState<PetakUkur | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Fullscreen toggle handler with hybrid browser API and CSS viewport fallback
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      setIsFullscreen(true);
      if (mapWrapperRef.current?.requestFullscreen) {
        mapWrapperRef.current.requestFullscreen().catch(() => {
          // Fallback CSS fixed full viewport
        });
      }
    } else {
      setIsFullscreen(false);
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  // Sync fullscreen state with browser events & Esc key
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isDocFs = Boolean(document.fullscreenElement);
      setIsFullscreen(isDocFs);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen]);

  // Recalculate Leaflet tile layout whenever fullscreen state changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [isFullscreen]);

  // Auto-resize observer to prevent gray tiles on any container resize
  useEffect(() => {
    if (!mapContainerRef.current) return;
    const ro = new ResizeObserver(() => {
      mapInstanceRef.current?.invalidateSize();
    });
    ro.observe(mapContainerRef.current);
    return () => ro.disconnect();
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center around South Kalimantan / Central Rehabilitation Region
    const map = L.map(mapContainerRef.current, {
      center: [-3.55, 115.05],
      zoom: 10,
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

  // Synchronize and render Custom Boundaries (SHP / KML / GeoJSON)
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    const currentLayerIds = new Set(customBoundaries.map((b) => b.id));

    // Remove obsolete layers
    Object.keys(customBoundaryLayersRef.current).forEach((id) => {
      if (!currentLayerIds.has(id)) {
        const layer = customBoundaryLayersRef.current[id];
        if (layer && map.hasLayer(layer)) {
          map.removeLayer(layer);
        }
        delete customBoundaryLayersRef.current[id];
      }
    });

    // Add or update layers
    customBoundaries.forEach((b) => {
      let geoJsonLayer = customBoundaryLayersRef.current[b.id];

      if (!geoJsonLayer) {
        try {
          geoJsonLayer = L.geoJSON(b.data, {
            style: () => ({
              color: b.color,
              fillColor: b.fillColor,
              fillOpacity: b.fillOpacity,
              weight: b.weight,
              dashArray: b.dashArray === 'none' ? undefined : b.dashArray,
            }),
            onEachFeature: (feature, layer) => {
              const props = feature.properties || {};
              const propKeys = Object.keys(props).filter(
                (k) => typeof props[k] !== 'object' && props[k] !== null && props[k] !== undefined
              );

              const propsRows = propKeys.slice(0, 8).map(
                (k) => `
                <tr class="border-b border-slate-800/80">
                  <td class="text-slate-400 font-mono text-[10px] py-1 pr-2 whitespace-nowrap">${k}</td>
                  <td class="text-slate-200 font-medium text-[11px] py-1">${String(props[k])}</td>
                </tr>
              `
              ).join('');

              const popupHtml = `
                <div class="p-3 max-w-[280px] bg-slate-900 text-slate-100 rounded-xl shadow-2xl border border-slate-700 text-xs">
                  <div class="flex items-center gap-2 pb-1.5 mb-2 border-b border-slate-800">
                    <span class="w-3 h-3 rounded-full shrink-0 border border-white/40" style="background-color: ${b.color};"></span>
                    <span class="font-bold text-slate-100 truncate">${b.name}</span>
                  </div>
                  <div class="flex items-center justify-between text-[10px] text-slate-400 mb-2 bg-slate-950/60 px-2 py-1 rounded">
                    <span>Format: <b class="text-cyan-400 uppercase font-mono">${b.fileType}</b></span>
                    <span class="truncate max-w-[130px] font-mono text-slate-500">${b.fileName}</span>
                  </div>
                  ${
                    propsRows
                      ? `
                    <div class="max-h-40 overflow-y-auto pr-1">
                      <table class="w-full text-left">
                        <tbody>${propsRows}</tbody>
                      </table>
                    </div>
                  `
                      : '<div class="text-[11px] text-slate-500 italic py-1">Tidak ada atribut khusus dalam file spasial ini.</div>'
                  }
                </div>
              `;

              layer.bindTooltip(`<b>${b.name}</b>`, {
                sticky: true,
                className: 'leaflet-custom-tooltip',
              });
              layer.bindPopup(popupHtml, { className: 'leaflet-custom-popup' });
            },
          });

          customBoundaryLayersRef.current[b.id] = geoJsonLayer;
        } catch (err) {
          console.error(`Error rendering GeoJSON boundary ${b.name}:`, err);
        }
      } else {
        // Update layer styles dynamically
        geoJsonLayer.setStyle({
          color: b.color,
          fillColor: b.fillColor,
          fillOpacity: b.fillOpacity,
          weight: b.weight,
          dashArray: b.dashArray === 'none' ? undefined : b.dashArray,
        });
      }

      if (geoJsonLayer) {
        if (b.visible) {
          if (!map.hasLayer(geoJsonLayer)) {
            geoJsonLayer.addTo(map);
            geoJsonLayer.bringToBack();
          }
        } else {
          if (map.hasLayer(geoJsonLayer)) {
            map.removeLayer(geoJsonLayer);
          }
        }
      }
    });
  }, [customBoundaries]);

  // Fit bounds when focusedBoundary changes
  useEffect(() => {
    if (!focusedBoundary || !mapInstanceRef.current) return;
    const layer = customBoundaryLayersRef.current[focusedBoundary.id];
    if (layer) {
      try {
        const bounds = layer.getBounds();
        if (bounds.isValid()) {
          mapInstanceRef.current.fitBounds(bounds, {
            padding: [50, 50],
            maxZoom: 15,
          });
        }
      } catch (e) {
        console.warn('Could not fit to boundary bounds:', e);
      }
    }
  }, [focusedBoundary]);

  // Render Petak Ukur Markers with interactive popups & hover
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    const markersGroup = markersLayerRef.current;
    markersGroup.clearLayers();

    // Filter items
    const filteredList = puList.filter((pu) => {
      if (activeCategoryFilter !== 'all' && pu.kategori !== activeCategoryFilter) return false;
      const dasVal = pu.das || pu.subDas;
      if (activeSubDasFilter !== 'all' && dasVal !== activeSubDasFilter) return false;
      return true;
    });

    filteredList.forEach((pu) => {
      const catInfo = getCategoryInfo(pu.kategori);
      const awal = pu.tanamanAwal || 50;
      const hidup =
        pu.tanamanHidup !== undefined
          ? pu.tanamanHidup
          : Math.round(((pu.survivalRate || 0) / 100) * awal);
      const namaDas = pu.das || pu.subDas;
      const utmLabel = pu.koordinatUtm || `${pu.latitude.toFixed(4)}, ${pu.longitude.toFixed(4)}`;

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
            ${pu.blok}${pu.petak ? ` (${pu.petak})` : ''} • ${namaDas}
          </div>
          <div class="grid grid-cols-2 gap-1.5 py-1 text-[11px] bg-slate-950/60 p-1.5 rounded mb-1.5">
            <div>
              <span class="text-slate-400 block text-[10px]">Survival Rate</span>
              <span class="font-bold text-sm" style="color: ${catInfo.colorHex}">${pu.survivalRate}%</span>
            </div>
            <div>
              <span class="text-slate-400 block text-[10px]">Pohon Hidup</span>
              <span class="font-bold text-sm text-slate-200">${hidup} / ${awal} btg</span>
            </div>
          </div>
          <div class="text-[10px] text-cyan-400 font-mono mb-1 truncate">
            UTM: ${utmLabel}
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

  // Automatically fit map bounds when Sub-DAS filter changes or when list first loads
  const prevFilterRef = useRef<string>(activeSubDasFilter);
  const initialFitDoneRef = useRef<boolean>(false);
  useEffect(() => {
    if (!mapInstanceRef.current || puList.length === 0) return;
    const filterChanged = prevFilterRef.current !== activeSubDasFilter;
    if (filterChanged || !initialFitDoneRef.current) {
      prevFilterRef.current = activeSubDasFilter;
      initialFitDoneRef.current = true;
      const filtered = puList.filter((p) => {
        if (activeSubDasFilter === 'all') return true;
        const dasVal = p.das || p.subDas;
        return dasVal === activeSubDasFilter;
      });
      const pointsToFit = filtered.length > 0 ? filtered : puList;
      const bounds = L.latLngBounds(pointsToFit.map((p) => [p.latitude, p.longitude]));
      if (bounds.isValid()) {
        mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      }
    }
  }, [activeSubDasFilter, puList]);

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
    <div
      ref={mapWrapperRef}
      className={`transition-all duration-300 flex-1 bg-slate-950 overflow-hidden ${
        isFullscreen
          ? 'fixed inset-0 z-[99999] w-screen h-screen rounded-none border-none shadow-none'
          : 'relative w-full h-full min-h-[460px] rounded-xl border border-slate-800 shadow-2xl'
      }`}
    >
      {/* Map Container */}
      <div id="das-leaflet-map" ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Top Center Floating Fullscreen Status & Exit Pill */}
      {isFullscreen && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[450] animate-fade-in pointer-events-auto">
          <button
            onClick={toggleFullscreen}
            title="Klik untuk keluar dari mode layar penuh"
            className="px-3.5 py-1.5 rounded-full bg-slate-900/95 hover:bg-slate-850 text-emerald-200 hover:text-white border border-emerald-500/50 shadow-2xl backdrop-blur-md text-xs font-semibold flex items-center gap-2 transition-all group ring-1 ring-lime-400/20"
          >
            <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
            <span className="text-white font-bold">Fokus Peta Layar Penuh</span>
            <span className="text-emerald-400/80 font-normal hidden sm:inline">&bull; Tekan</span>
            <kbd className="px-1.5 py-0.5 rounded bg-black/60 text-[10px] text-lime-300 font-mono border border-emerald-500/30">
              ESC
            </kbd>
            <span className="text-emerald-400/80 font-normal hidden sm:inline">atau klik untuk keluar</span>
            <Minimize2 className="w-3.5 h-3.5 text-lime-400 group-hover:scale-110 transition-transform ml-0.5" />
          </button>
        </div>
      )}

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

        {/* Boundary Area SHP / KML Manager Button */}
        {onOpenBoundaryModal && (
          <button
            id="open-boundary-modal-btn"
            onClick={onOpenBoundaryModal}
            title="Kelola & Unggah Boundary Area Peta (SHP / KML)"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border shadow-lg backdrop-blur-md flex items-center gap-2 self-start transition-all bg-slate-900/95 hover:bg-slate-850 text-cyan-300 border-cyan-500/40 hover:border-cyan-400 group"
          >
            <FolderArchive className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span>Boundary SHP / KML</span>
            {customBoundaries.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-cyan-500/20 text-cyan-300 font-mono font-bold border border-cyan-500/30">
                {customBoundaries.filter((b) => b.visible).length}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Top Right Zoom, Fullscreen, and Control Tools */}
      <div className="absolute top-4 right-4 z-[400] flex flex-col gap-1.5">
        {/* Fullscreen Map Mode Toggle */}
        <button
          id="map-fullscreen-btn"
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Keluar Layar Penuh (Esc)' : 'Fokus Peta: Layar Penuh (Full Screen)'}
          className={`w-9 h-9 rounded-lg border flex items-center justify-center shadow-lg transition-all group ${
            isFullscreen
              ? 'bg-lime-500 hover:bg-lime-400 text-slate-950 border-lime-400 font-bold scale-105 ring-2 ring-lime-400/50'
              : 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 border-slate-700 hover:text-white'
          }`}
        >
          {isFullscreen ? (
            <Minimize2 className="w-4 h-4 text-slate-950" />
          ) : (
            <Maximize2 className="w-4 h-4 text-slate-200 group-hover:scale-110 transition-transform" />
          )}
        </button>

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

      {/* Bottom Left Floating Mini-Legend in Fullscreen Mode */}
      {isFullscreen && (
        <div className="absolute bottom-5 left-4 z-[400] bg-slate-900/95 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-700/80 shadow-2xl animate-fade-in hidden md:flex items-center gap-3 text-xs">
          <span className="font-bold text-slate-300 text-[10px] uppercase tracking-wider">Kategori SR:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-black border border-slate-500" />
            <span className="text-[11px] text-slate-300">0–40%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="text-[11px] text-slate-300">&gt;40–74%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="text-[11px] text-slate-300">75–80%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-[11px] text-slate-300">&gt;80%</span>
          </div>
        </div>
      )}

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
              <span className="font-semibold text-slate-200">
                {hoveredPu.tanamanHidup !== undefined ? hoveredPu.tanamanHidup : Math.round(((hoveredPu.survivalRate || 0) / 100) * (hoveredPu.tanamanAwal || 50))} / {hoveredPu.tanamanAwal || 50}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Kebutuhan Sulam</span>
              <span className={`font-semibold ${(hoveredPu.kebutuhanPenyulaman ?? 0) > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {hoveredPu.kebutuhanPenyulaman ?? 0} btg
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Tutupan Tajuk</span>
              <span className="font-semibold text-slate-200">{hoveredPu.tutupanTajukPersen ?? Math.min(100, Math.round(hoveredPu.survivalRate * 0.6))}%</span>
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
