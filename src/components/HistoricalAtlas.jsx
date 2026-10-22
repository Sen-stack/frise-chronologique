import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { formatYear } from '../utils/timelineMath.js';

// Icônes personnalisées
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [22, 36],
  iconAnchor: [11, 36],
  popupAnchor: [1, -30],
  shadowSize: [36, 36]
});

const selectedIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [26, 42],
  iconAnchor: [13, 42],
  popupAnchor: [1, -34],
  shadowSize: [42, 42]
});

// Époques mondiales pour le calque de niveau 0 (Empires)
const HISTORICAL_YEAR_SLICES = [
  -3000, -2000, -1000, -500, -323, -200, -1, 100, 200, 300, 400, 500, 
  600, 700, 800, 900, 1000, 1100, 1200, 1279, 1300, 1400, 1492, 1500, 
  1600, 1700, 1715, 1783, 1800, 1815, 1880, 1900, 1914, 1920, 1938, 1945, 1994
];

function getClosestHistoricalFile(year) {
  let closest = HISTORICAL_YEAR_SLICES[0];
  let minDiff = Math.abs(year - closest);

  for (const slice of HISTORICAL_YEAR_SLICES) {
    const diff = Math.abs(year - slice);
    if (diff < minDiff) {
      minDiff = diff;
      closest = slice;
    }
  }

  const filename = closest < 0 
    ? `world_bc${Math.abs(closest)}.geojson`
    : `world_${closest}.geojson`;

  return { year: closest, filename };
}

// Nuancier équilibré
const PALETTE = [
  '#b45309', '#0284c7', '#15803d', '#9333ea', '#c2410c', 
  '#475569', '#0f766e', '#854d0e', '#be123c', '#4338ca'
];

function getEntityColor(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

// Contrôleur de caméra
function DynamicMapBridge({ boundingBoxCoords, isManualOverride }) {
  const map = useMap();
  const lastCenterKeyRef = useRef('');
  const debounceTimerRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    if (isManualOverride || boundingBoxCoords.length === 0) return;

    const bounds = L.latLngBounds(boundingBoxCoords);
    if (!bounds.isValid()) return;

    const center = bounds.getCenter();
    const centerKey = `${center.lat.toFixed(1)},${center.lng.toFixed(1)},${map.getZoom()}`;
    if (centerKey === lastCenterKeyRef.current) return;

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(() => {
      lastCenterKeyRef.current = centerKey;

      if (boundingBoxCoords.length === 1) {
        map.flyTo(boundingBoxCoords[0], 6, { animate: true, duration: 1.0 });
      } else {
        map.flyToBounds(bounds, {
          padding: [50, 50],
          maxZoom: 7,
          animate: true,
          duration: 1.0
        });
      }
    }, 120);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [map, boundingBoxCoords, isManualOverride]);

  return null;
}

export default function HistoricalAtlas({ 
  viewRange, 
  events = [], 
  selectedEvent, 
  onOpenDrawer, 
  onMapYearChange,
  mapLayers = { worldEmpires: true, subDivisions: true, markers: true }
}) {
  const [isManualOverride, setIsManualOverride] = useState(false);
  const [worldGeoJson, setWorldGeoJson] = useState(null);
  const [subDivisionsGeoJson, setSubDivisionsGeoJson] = useState(null);
  const [activeMapSlice, setActiveMapSlice] = useState(null);
  const [isLoadingBorders, setIsLoadingBorders] = useState(false);
  const mapRef = useRef(null);
  const cacheRef = useRef({});

  // 1. Année centrale affichée par la frise
  const currentCenterYear = useMemo(() => {
    if (!viewRange) return 200;
    return Math.round((viewRange.min + viewRange.max) / 2);
  }, [viewRange]);

  // 2. Flux A : Empires mondiaux
  useEffect(() => {
    const { year: targetYear, filename } = getClosestHistoricalFile(currentCenterYear);

    if (activeMapSlice === targetYear && worldGeoJson) {
      if (onMapYearChange) onMapYearChange(targetYear);
      return;
    }

    if (cacheRef.current[filename]) {
      setWorldGeoJson(cacheRef.current[filename]);
      setActiveMapSlice(targetYear);
      if (onMapYearChange) onMapYearChange(targetYear);
      return;
    }

    setIsLoadingBorders(true);
    const cdnUrl = `https://cdn.jsdelivr.net/gh/aourednik/historical-basemaps@master/geojson/${filename}`;

    fetch(cdnUrl)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        cacheRef.current[filename] = data;
        setWorldGeoJson(data);
        setActiveMapSlice(targetYear);
        if (onMapYearChange) onMapYearChange(targetYear);
        setIsLoadingBorders(false);
      })
      .catch(() => {
        fetch(`https://raw.githubusercontent.com/aourednik/historical-basemaps/master/geojson/${filename}`)
          .then(res => res.json())
          .then(data => {
            cacheRef.current[filename] = data;
            setWorldGeoJson(data);
            setActiveMapSlice(targetYear);
            if (onMapYearChange) onMapYearChange(targetYear);
            setIsLoadingBorders(false);
          })
          .catch(() => {
            setIsLoadingBorders(false);
          });
      });
  }, [currentCenterYear, activeMapSlice, worldGeoJson, onMapYearChange]);

  // 3. Flux B : DARE Provinces régionales (URL Klokantech vérifiée)
  useEffect(() => {
    if (!mapLayers.subDivisions) return;

    const isClassicalEra = currentCenterYear >= -500 && currentCenterYear <= 500;
    const subDivKey = isClassicalEra ? 'dare_provinces' : 'none';

    if (cacheRef.current[subDivKey]) {
      setSubDivisionsGeoJson(cacheRef.current[subDivKey]);
      return;
    }

    if (isClassicalEra) {
      const cdnUrl = 'https://cdn.jsdelivr.net/gh/klokantech/roman-empire@master/data/provinces.geojson';

      fetch(cdnUrl)
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then(data => {
          cacheRef.current[subDivKey] = data;
          setSubDivisionsGeoJson(data);
        })
        .catch(() => {
          fetch('https://raw.githubusercontent.com/klokantech/roman-empire/master/data/provinces.geojson')
            .then(res => res.json())
            .then(data => {
              cacheRef.current[subDivKey] = data;
              setSubDivisionsGeoJson(data);
            })
            .catch(err => {
              console.error("Erreur chargement provinces DARE:", err);
            });
        });
    } else {
      setSubDivisionsGeoJson(null);
    }
  }, [currentCenterYear, mapLayers.subDivisions]);

  // 4. Événements actifs
  const activeEvents = useMemo(() => {
    if (!viewRange) return [];
    return events.filter(evt => {
      const debut = evt.date_debut;
      const fin = evt.date_fin ?? evt.date_debut;
      return debut <= viewRange.max && fin >= viewRange.min;
    });
  }, [events, viewRange]);

  // 5. Points actifs
  const activePoints = useMemo(() => {
    const points = [];

    activeEvents.forEach(evt => {
      const hasDirectCoords = evt.latitude !== null && evt.longitude !== null && !isNaN(Number(evt.latitude)) && !isNaN(Number(evt.longitude));
      const lieuxList = Array.isArray(evt.lieux) ? evt.lieux : [];

      if (lieuxList.length > 0) {
        lieuxList.forEach(l => {
          if (l.latitude !== null && l.longitude !== null && !isNaN(Number(l.latitude))) {
            points.push({
              id: `${evt.id}-${l.id || l.nom}`,
              eventId: evt.id,
              event: evt,
              nom: l.nom,
              role: l.role || 'Lieu associé',
              latitude: Number(l.latitude),
              longitude: Number(l.longitude)
            });
          }
        });
      } else if (hasDirectCoords) {
        points.push({
          id: `${evt.id}-main`,
          eventId: evt.id,
          event: evt,
          nom: evt.titre,
          role: 'Lieu principal',
          latitude: Number(evt.latitude),
          longitude: Number(evt.longitude)
        });
      }
    });

    return points;
  }, [activeEvents]);

  const combinedBoundsCoords = useMemo(() => {
    return activePoints.map(p => [p.latitude, p.longitude]);
  }, [activePoints]);

  const handleRecalibrate = () => {
    setIsManualOverride(false);
    if (!mapRef.current || combinedBoundsCoords.length === 0) return;

    const bounds = L.latLngBounds(combinedBoundsCoords);
    if (!bounds.isValid()) return;

    if (combinedBoundsCoords.length === 1) {
      mapRef.current.flyTo(combinedBoundsCoords[0], 6, { duration: 1.0 });
    } else {
      mapRef.current.flyToBounds(bounds, { padding: [50, 50], maxZoom: 7, duration: 1.0 });
    }
  };

  return (
    <div
      style={{ width: '100%', height: '100%', position: 'relative' }}
      onMouseDown={(e) => {
        if (!e.target.closest('#atlas-status-badge')) {
          setIsManualOverride(true);
        }
      }}
      onWheel={(e) => {
        if (!e.target.closest('#atlas-status-badge')) {
          setIsManualOverride(true);
        }
      }}
    >
      {/* Badge d'état */}
      <div
        id="atlas-status-badge"
        style={{
          position: 'absolute',
          top: 12,
          right: 14,
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          backgroundColor: 'rgba(255, 255, 255, 0.94)',
          backdropFilter: 'blur(8px)',
          padding: '4px 10px',
          borderRadius: 8,
          border: '1px solid #e7ded0',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          fontSize: 11,
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif"
        }}
      >
        <span style={{ color: '#1c1917', fontWeight: 700 }}>
          🏛️ Carte mondiale : {activeMapSlice !== null ? formatYear(activeMapSlice) : '...'}
        </span>

        {isLoadingBorders && (
          <span style={{ fontSize: 10, color: '#b45309' }}>
            chargement...
          </span>
        )}

        <span style={{ color: '#78716c', fontWeight: 600, borderLeft: '1px solid #e7ded0', paddingLeft: 6 }}>
          📍 {activePoints.length} repère{activePoints.length > 1 ? 's' : ''}
        </span>

        {isManualOverride ? (
          <button
            type="button"
            onClick={handleRecalibrate}
            style={{
              padding: '3px 8px',
              borderRadius: 5,
              border: 'none',
              backgroundColor: '#b45309',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: 10,
              cursor: 'pointer'
            }}
          >
            🎯 Recalibrer sur la frise
          </button>
        ) : (
          <span style={{ fontSize: 10, color: '#15803d', fontWeight: 700 }}>
            ● Sync auto
          </span>
        )}
      </div>

      <MapContainer
        ref={mapRef}
        center={[46.5, 2.5]}
        zoom={5}
        style={{ width: '100%', height: '100%' }}
      >
        <DynamicMapBridge
          boundingBoxCoords={combinedBoundsCoords}
          isManualOverride={isManualOverride}
        />

        <TileLayer
          attribution='Tiles &copy; Esri &mdash; National Geographic'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}"
          maxZoom={12}
        />

        {/* 1. COUCHE DES EMPIRES MONDIAUX (Fond de couleur des grands empires) */}
        {mapLayers.worldEmpires && worldGeoJson && (
          <GeoJSON
            key={`world-layer-${activeMapSlice}`}
            data={worldGeoJson}
            style={(feature) => {
              const name = feature?.properties?.NAME || feature?.properties?.name || '';
              const color = getEntityColor(name);
              return {
                color: color,
                weight: 1.2,
                opacity: 0.7,
                fillColor: color,
                fillOpacity: 0.18
              };
            }}
            onEachFeature={(feature, layer) => {
              const name = feature?.properties?.NAME || feature?.properties?.name || 'Empire / Royaume';
              layer.bindTooltip(`<strong>${name}</strong> (${formatYear(activeMapSlice)})`, {
                sticky: true
              });
            }}
          />
        )}

        {/* 2. COUCHE DES PROVINCES RÉGIONALES (DARE / Klokantech) */}
        {mapLayers.subDivisions && subDivisionsGeoJson && (
          <GeoJSON
            key={`subdivisions-layer-${currentCenterYear}`}
            data={subDivisionsGeoJson}
            style={(feature) => {
              const name = feature?.properties?.name || feature?.properties?.NAME || feature?.properties?.province || '';
              const color = getEntityColor(name);
              return {
                color: '#ffffff',
                weight: 1.5,
                dashArray: '4, 4',
                opacity: 0.95,
                fillColor: color,
                fillOpacity: 0.32
              };
            }}
            onEachFeature={(feature, layer) => {
              const name = feature?.properties?.name || feature?.properties?.NAME || feature?.properties?.province || 'Province';
              layer.bindTooltip(`<strong>${name}</strong><br/><span style="font-size:10px; color:#57534e;">Province romaine</span>`, {
                sticky: true
              });
            }}
          />
        )}

        {/* 3. COUCHE DES MARQUEURS PERSONNELS */}
        {mapLayers.markers && activePoints.map(pt => {
          const isSelected = selectedEvent && selectedEvent.id === pt.eventId;

          return (
            <Marker
              key={pt.id}
              position={[pt.latitude, pt.longitude]}
              icon={isSelected ? selectedIcon : defaultIcon}
            >
              <Popup autoPan={true} autoPanPadding={[20, 20]} minWidth={220}>
                <div style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", padding: 2 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#b45309', textTransform: 'uppercase', marginBottom: 2 }}>
                    {pt.role}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1c1917', lineHeight: 1.3 }}>
                    {pt.nom}
                  </div>
                  <div style={{ fontSize: 11, color: '#57534e', marginTop: 2, marginBottom: 8 }}>
                    {pt.event.titre} ({formatYear(pt.event.date_debut)})
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenDrawer(pt.event)}
                    style={{
                      width: '100%',
                      padding: '5px 10px',
                      borderRadius: 6,
                      border: 'none',
                      backgroundColor: '#b45309',
                      color: '#ffffff',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    🔍 Approfondir
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}