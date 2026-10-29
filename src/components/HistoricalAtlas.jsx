import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { formatYear } from '../utils/timelineMath.js';
import WIKI_ENTITIES_MAP from '../data/wikiEntitiesMap.json';

const BASE_MAPS = {
  topo: {
    name: 'Relief',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; National Geographic',
    maxZoom: 12
  },
  neutre: {
    name: 'Neutre',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
    maxZoom: 16
  }
};

const SILK_ROAD_GEOJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        name: 'Route de la Soie Septentrionale',
        routeType: 'Voie caravanière continentale',
        description: 'Axe reliant Chang’an au bassin du Tarim, à Samarcande, à la Perse et à Byzance.'
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [108.94, 34.26], [103.83, 36.06], [94.66, 40.14], [89.18, 42.95],
          [75.99, 39.47], [71.67, 40.54], [66.97, 39.65], [64.42, 39.77],
          [61.83, 37.60], [58.38, 37.95], [51.42, 35.69], [48.51, 34.80],
          [44.36, 33.31], [40.74, 37.91], [37.16, 36.20], [35.91, 34.43], [28.97, 41.00]
        ]
      }
    },
    {
      type: 'Feature',
      properties: {
        name: 'Route de la Soie Méridionale (Tarim & Khotan)',
        routeType: 'Voie caravanière du Sud',
        description: 'Contournement sud du désert du Taklamakan par Niya et Khotan jusqu’au Pamir.'
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [94.66, 40.14], [88.16, 39.03], [82.75, 37.06], [79.92, 37.11],
          [77.27, 38.41], [75.99, 39.47]
        ]
      }
    },
    {
      type: 'Feature',
      properties: {
        name: 'Branche vers le sous-continent indien',
        routeType: 'Voie marchande et bouddhique',
        description: 'Passage par l’Hindou Kouch reliant l’Asie centrale à Taxila et la vallée du Gange.'
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [66.97, 39.65], [66.90, 36.75], [69.17, 34.53], [71.52, 34.01],
          [72.82, 33.74], [77.67, 27.49]
        ]
      }
    },
    {
      type: 'Feature',
      properties: {
        name: 'Voie Royale et débouché méditerranéen',
        routeType: 'Voie impériale et maritime',
        description: 'Liaison entre la Mésopotamie, la côte syro-palestinienne, Alexandrie et Rome.'
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [44.36, 33.31], [40.41, 34.45], [38.28, 34.56], [36.29, 33.51],
          [35.21, 31.76], [29.91, 31.20], [14.26, 40.85], [12.49, 41.90]
        ]
      }
    }
  ]
};

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

function extractFeatureName(props) {
  if (!props) return '';
  return props.name || props.NAME || props.SUBJECT || props.PARTOF || props.LABEL || props.label || props.Name || props.Route || props.empire || props.province || '';
}

function findEntityMeta(rawName) {
  if (!rawName || rawName.trim().length === 0) return null;
  const clean = rawName.trim().toLowerCase();

  if (WIKI_ENTITIES_MAP[clean]) {
    return WIKI_ENTITIES_MAP[clean];
  }

  const stripped = clean
    .replace(/^kingdom of\s+/i, '')
    .replace(/^empire of\s+/i, '')
    .replace(/^dynasty\s+/i, '')
    .replace(/\s+empire$/i, '')
    .replace(/\s+kingdom$/i, '')
    .trim();

  if (WIKI_ENTITIES_MAP[stripped]) {
    return WIKI_ENTITIES_MAP[stripped];
  }

  return null;
}

function getWikiUrl(rawName) {
  if (!rawName || rawName.trim().length === 0) {
    return 'https://fr.wikipedia.org/wiki/Histoire_du_monde';
  }

  const meta = findEntityMeta(rawName);

  if (meta && meta.fr) {
    return `https://fr.wikipedia.org/wiki/${encodeURIComponent(meta.fr)}`;
  }

  if (meta && meta.en) {
    return `https://en.wikipedia.org/wiki/${encodeURIComponent(meta.en)}`;
  }

  const clean = rawName.trim();
  const formattedEn = clean.replace(/\s+/g, '_');
  return `https://en.wikipedia.org/wiki/${encodeURIComponent(formattedEn)}`;
}

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
  mapLayers = { worldEmpires: true, subDivisions: true, tradeRoutes: false, markers: true }
}) {
  const [baseMapKey, setBaseMapKey] = useState('neutre');
  const [isManualOverride, setIsManualOverride] = useState(false);
  const [worldGeoJson, setWorldGeoJson] = useState(null);
  const [subDivisionsGeoJson, setSubDivisionsGeoJson] = useState(null);
  const [activeMapSlice, setActiveMapSlice] = useState(null);
  const [isLoadingBorders, setIsLoadingBorders] = useState(false);
  const mapRef = useRef(null);
  const cacheRef = useRef({});

  const currentCenterYear = useMemo(() => {
    if (!viewRange) return 200;
    return Math.round((viewRange.min + viewRange.max) / 2);
  }, [viewRange]);

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

  const activeEvents = useMemo(() => {
    if (!viewRange) return [];
    return events.filter(evt => {
      const debut = evt.date_debut;
      const fin = evt.date_fin ?? evt.date_debut;
      return debut <= viewRange.max && fin >= viewRange.min;
    });
  }, [events, viewRange]);

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

  const currentBaseMap = BASE_MAPS[baseMapKey] || BASE_MAPS.neutre;

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
      {/* BARRE D'ÉTAT SUPÉRIEURE ÉPURÉE SANS ÉMOJI */}
      <div
        id="atlas-status-badge"
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(8px)',
          padding: '3px 8px',
          borderRadius: 6,
          border: '1px solid #e7ded0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          fontSize: 10,
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
          whiteSpace: 'nowrap'
        }}
      >
        {/* Fonds de carte sans emoji */}
        <div style={{ display: 'flex', backgroundColor: '#ede7dc', padding: 2, borderRadius: 4, gap: 1 }}>
          <button
            type="button"
            onClick={() => setBaseMapKey('topo')}
            style={{
              border: 'none',
              padding: '2px 5px',
              borderRadius: 3,
              fontSize: 9,
              fontWeight: 600,
              cursor: 'pointer',
              backgroundColor: baseMapKey === 'topo' ? '#ffffff' : 'transparent',
              color: baseMapKey === 'topo' ? '#b45309' : '#78716c'
            }}
          >
            Relief
          </button>
          <button
            type="button"
            onClick={() => setBaseMapKey('neutre')}
            style={{
              border: 'none',
              padding: '2px 5px',
              borderRadius: 3,
              fontSize: 9,
              fontWeight: 600,
              cursor: 'pointer',
              backgroundColor: baseMapKey === 'neutre' ? '#ffffff' : 'transparent',
              color: baseMapKey === 'neutre' ? '#b45309' : '#78716c'
            }}
          >
            Neutre
          </button>
        </div>

        {/* Année sans emoji */}
        <span style={{ color: '#1c1917', fontWeight: 600, borderLeft: '1px solid #e7ded0', paddingLeft: 6 }}>
          {activeMapSlice !== null ? formatYear(activeMapSlice) : '...'}
        </span>

        {/* Repères sans emoji */}
        <span style={{ color: '#78716c', fontWeight: 500, borderLeft: '1px solid #e7ded0', paddingLeft: 6 }}>
          {activePoints.length} repères
        </span>

        {/* Statut de recalibrage / Sync */}
        {isManualOverride ? (
          <button
            type="button"
            onClick={handleRecalibrate}
            style={{
              padding: '2px 6px',
              borderRadius: 4,
              border: 'none',
              backgroundColor: '#b45309',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: 9,
              cursor: 'pointer'
            }}
          >
            Recalibrer
          </button>
        ) : (
          <span style={{ fontSize: 9, color: '#15803d', fontWeight: 600, borderLeft: '1px solid #e7ded0', paddingLeft: 6 }}>
            Sync
          </span>
        )}
      </div>

      <MapContainer
        ref={mapRef}
        center={[36.0, 40.0]}
        zoom={4}
        style={{ width: '100%', height: '100%' }}
      >
        <DynamicMapBridge
          boundingBoxCoords={combinedBoundsCoords}
          isManualOverride={isManualOverride}
        />

        <TileLayer
          key={baseMapKey}
          attribution={currentBaseMap.attribution}
          url={currentBaseMap.url}
          maxZoom={currentBaseMap.maxZoom}
        />

        {mapLayers.worldEmpires && worldGeoJson && (
          <GeoJSON
            key={`world-layer-${activeMapSlice}`}
            data={worldGeoJson}
            style={(feature) => {
              const name = extractFeatureName(feature?.properties);
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
              const detectedName = extractFeatureName(feature?.properties);
              const meta = findEntityMeta(detectedName);
              const frenchLabel = meta?.fr ? meta.fr.replace(/_/g, ' ') : null;
              const displayName = frenchLabel 
                ? `${detectedName} (${frenchLabel})` 
                : (detectedName || 'Territoire / Empire non documenté');

              layer.bindTooltip(`<strong>${displayName}</strong> (${formatYear(activeMapSlice)})`, {
                sticky: true
              });

              layer.bindPopup(`
                <div style="font-family:'Plus Jakarta Sans',system-ui,sans-serif; padding:4px; min-width:180px;">
                  <div style="font-size:10px; font-weight:700; color:#b45309; text-transform:uppercase; margin-bottom:2px;">
                    Empire / Royaume (${formatYear(activeMapSlice)})
                  </div>
                  <div style="font-size:14px; font-weight:700; color:#1c1917; margin-bottom:8px;">
                    ${displayName}
                  </div>
                  <a 
                    href="${getWikiUrl(detectedName)}" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style="display:inline-flex; align-items:center; justify-content:center; gap:5px; width:100%; padding:6px 10px; border-radius:6px; background-color:#1c1917; color:#ffffff; font-size:11px; font-weight:700; text-decoration:none; box-sizing:border-box;"
                  >
                    Consulter sur Wikipédia
                  </a>
                </div>
              `, { autoPan: true });
            }}
          />
        )}

        {mapLayers.subDivisions && subDivisionsGeoJson && (
          <GeoJSON
            key={`subdivisions-layer-${currentCenterYear}`}
            data={subDivisionsGeoJson}
            style={(feature) => {
              const name = extractFeatureName(feature?.properties);
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
              const rawName = extractFeatureName(feature?.properties) || 'Province';
              const meta = findEntityMeta(rawName);
              const frenchLabel = meta?.fr ? meta.fr.replace(/_/g, ' ') : null;
              const displayName = frenchLabel ? `${rawName} (${frenchLabel})` : rawName;

              layer.bindTooltip(`<strong>${displayName}</strong><br/><span style="font-size:10px; color:#57534e;">Province romaine</span>`, {
                sticky: true
              });

              layer.bindPopup(`
                <div style="font-family:'Plus Jakarta Sans',system-ui,sans-serif; padding:4px; min-width:180px;">
                  <div style="font-size:10px; font-weight:700; color:#0284c7; text-transform:uppercase; margin-bottom:2px;">
                    Province romaine
                  </div>
                  <div style="font-size:14px; font-weight:700; color:#1c1917; margin-bottom:8px;">
                    ${displayName}
                  </div>
                  <a 
                    href="${getWikiUrl(rawName)}" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style="display:inline-flex; align-items:center; justify-content:center; gap:5px; width:100%; padding:6px 10px; border-radius:6px; background-color:#1c1917; color:#ffffff; font-size:11px; font-weight:700; text-decoration:none; box-sizing:border-box;"
                  >
                    Consulter sur Wikipédia
                  </a>
                </div>
              `, { autoPan: true });
            }}
          />
        )}

        {mapLayers.tradeRoutes && (
          <GeoJSON
            key="silk-road-layer"
            data={SILK_ROAD_GEOJSON}
            style={() => ({
              color: '#c2410c',
              weight: 3.2,
              dashArray: '7, 7',
              opacity: 0.95
            })}
            onEachFeature={(feature, layer) => {
              const routeName = feature?.properties?.name || 'Route de la Soie';
              const routeType = feature?.properties?.routeType || 'Voie de communication';
              const desc = feature?.properties?.description || '';

              layer.bindTooltip(`<strong>${routeName}</strong>`, { sticky: true });

              layer.bindPopup(`
                <div style="font-family:'Plus Jakarta Sans',system-ui,sans-serif; padding:4px; min-width:210px;">
                  <div style="font-size:10px; font-weight:700; color:#c2410c; text-transform:uppercase; margin-bottom:2px;">
                    ${routeType}
                  </div>
                  <div style="font-size:13px; font-weight:700; color:#1c1917; margin-bottom:4px;">
                    ${routeName}
                  </div>
                  ${desc ? `<div style="font-size:11px; color:#57534e; margin-bottom:8px; line-height:1.4;">${desc}</div>` : ''}
                  <a 
                    href="${getWikiUrl(routeName)}" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style="display:inline-flex; align-items:center; justify-content:center; gap:5px; width:100%; padding:6px 10px; border-radius:6px; background-color:#1c1917; color:#ffffff; font-size:11px; font-weight:700; text-decoration:none; box-sizing:border-box;"
                  >
                    Article Wikipédia
                  </a>
                </div>
              `, { autoPan: true });
            }}
          />
        )}

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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
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
                      Approfondir
                    </button>
                    <a
                      href={getWikiUrl(pt.nom || pt.event.titre)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        padding: '4px 10px',
                        borderRadius: 6,
                        backgroundColor: '#f3ece0',
                        color: '#1c1917',
                        fontSize: 10,
                        fontWeight: 700,
                        textDecoration: 'none',
                        boxSizing: 'border-box'
                      }}
                    >
                      Wikipédia
                    </a>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}