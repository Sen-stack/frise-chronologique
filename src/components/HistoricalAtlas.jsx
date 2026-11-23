import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, Polygon, Polyline, CircleMarker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { formatYear } from '../utils/timelineMath.js';
import WIKI_ENTITIES_MAP from '../data/wikiEntitiesMap.json';
import GeologyVectorMap from './GeologyVectorMap.jsx';

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

function createNeuMarkerIcon(color = '#0284c7', isSelected = false) {
  const size = isSelected ? 22 : 18;
  const coreSize = isSelected ? 10 : 8;
  const pulseBorder = isSelected ? 'rgba(2, 132, 199, 0.7)' : 'rgba(166, 180, 200, 0.6)';

  const html = `
    <div style="
      position: relative;
      width: ${size}px;
      height: ${size}px;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        position: absolute;
        inset: -5px;
        border-radius: 50%;
        border: 1.5px solid ${pulseBorder};
        animation: neuPulse 2.2s cubic-bezier(0.25, 1, 0.5, 1) infinite;
        pointer-events: none;
      "></div>
      <div style="
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: #eaf0f6;
        box-shadow: 2px 2px 5px rgba(166, 180, 200, 0.6), -2px -2px 5px rgba(255, 255, 255, 0.95);
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid rgba(255, 255, 255, 0.8);
      ">
        <div style="
          width: ${coreSize}px;
          height: ${coreSize}px;
          border-radius: 50%;
          background: ${color};
          box-shadow: inset 1px 1px 2px rgba(0, 0, 0, 0.25);
        "></div>
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'neu-custom-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 4]
  });
}

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

function extractTerritoryDataFromGeojson(rawGeo) {
  if (!rawGeo) return { polygons: [], links: [] };
  let parsed = rawGeo;
  if (typeof rawGeo === 'string') {
    try {
      parsed = JSON.parse(rawGeo);
    } catch {
      return { polygons: [], links: [] };
    }
  }
  if (!parsed || typeof parsed !== 'object') return { polygons: [], links: [] };

  const links = Array.isArray(parsed.properties?.links) ? parsed.properties.links : [];
  const geometry = parsed.type === 'Feature' ? parsed.geometry : parsed;
  if (!geometry || !geometry.type || !Array.isArray(geometry.coordinates)) {
    return { polygons: [], links };
  }

  if (geometry.type === 'Polygon') {
    const ring = geometry.coordinates[0] || [];
    const pts = ring.map(c => [c[1], c[0]]);
    if (pts.length > 2 && pts[0][0] === pts[pts.length - 1][0] && pts[0][1] === pts[pts.length - 1][1]) {
      pts.pop();
    }
    return { polygons: pts.length >= 3 ? [pts] : [], links };
  }

  if (geometry.type === 'MultiPolygon') {
    const polygons = geometry.coordinates
      .map(polyCoords => {
        const ring = polyCoords[0] || [];
        const pts = ring.map(c => [c[1], c[0]]);
        if (pts.length > 2 && pts[0][0] === pts[pts.length - 1][0] && pts[0][1] === pts[pts.length - 1][1]) {
          pts.pop();
        }
        return pts;
      })
      .filter(pts => pts.length >= 3);
    return { polygons, links };
  }

  return { polygons: [], links };
}

function DynamicMapBridge({ boundingBoxCoords, isManualOverride, isDrawing, onUserInteract }) {
  const map = useMap();
  const lastCenterKeyRef = useRef('');
  const debounceTimerRef = useRef(null);

  useMapEvents({
    dragstart: () => {
      if (!isDrawing) onUserInteract();
    },
    zoomstart: () => {
      if (!isDrawing) onUserInteract();
    }
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    if (isManualOverride || isDrawing || boundingBoxCoords.length === 0) return;

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
  }, [map, boundingBoxCoords, isManualOverride, isDrawing]);

  return null;
}

function GlobalDrawHandler({ isDrawing, onAddPoint }) {
  useMapEvents({
    click(e) {
      if (isDrawing) {
        onAddPoint([Number(e.latlng.lat.toFixed(5)), Number(e.latlng.lng.toFixed(5))]);
      }
    }
  });
  return null;
}

export default function HistoricalAtlas({ 
  viewRange, 
  targetDate,
  events = [], 
  selectedEvent, 
  onSelectEvent,
  onOpenDrawer, 
  onMapYearChange,
  mapLayers = { worldEmpires: true, subDivisions: true, tradeRoutes: false, markers: true },
  isReliefProp = false,
  recalibrateTrigger = 0,
  drawingEvent = null,
  onSaveTerritory,
  onCancelDrawing,
  onDrawUiStateChange
}) {
  const [isManualOverride, setIsManualOverride] = useState(false);
  const [worldGeoJson, setWorldGeoJson] = useState(null);
  const [subDivisionsGeoJson, setSubDivisionsGeoJson] = useState(null);
  const [activeMapSlice, setActiveMapSlice] = useState(null);
  const [isLoadingBorders, setIsLoadingBorders] = useState(false);
  const mapRef = useRef(null);
  const cacheRef = useRef({});

  const [completedPolygons, setCompletedPolygons] = useState([]);
  const [currentPoints, setCurrentPoints] = useState([]);
  const [territoryLinks, setTerritoryLinks] = useState([]);
  const [linkTitleInput, setLinkTitleInput] = useState('');
  const [linkUrlInput, setLinkUrlInput] = useState('');
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [isSavingZone, setIsSavingZone] = useState(false);

  const isDrawingMode = Boolean(drawingEvent);

  useEffect(() => {
    if (drawingEvent) {
      const { polygons, links } = extractTerritoryDataFromGeojson(drawingEvent.zone_geojson);
      setCompletedPolygons(polygons);
      setTerritoryLinks(links);
      setCurrentPoints([]);
      setLinkTitleInput('');
      setLinkUrlInput('');
      setIsAddingLink(false);
      setIsManualOverride(true);
    } else {
      setCompletedPolygons([]);
      setTerritoryLinks([]);
      setCurrentPoints([]);
      setIsAddingLink(false);
    }
  }, [drawingEvent]);

  const handleAddDraftPoint = (latlng) => {
    setCurrentPoints(prev => [...prev, latlng]);
  };

  const handleUndoPoint = () => {
    if (currentPoints.length > 0) {
      setCurrentPoints(prev => prev.slice(0, -1));
    } else if (completedPolygons.length > 0) {
      const lastPoly = completedPolygons[completedPolygons.length - 1];
      setCompletedPolygons(prev => prev.slice(0, -1));
      setCurrentPoints(lastPoly);
    }
  };

  const handleValidateCurrentShape = () => {
    if (currentPoints.length < 3) return;
    setCompletedPolygons(prev => [...prev, currentPoints]);
    setCurrentPoints([]);
  };

  const handleClearAllShapes = () => {
    setCompletedPolygons([]);
    setCurrentPoints([]);
  };

  const handleAddTerritoryLink = (e) => {
    e.preventDefault();
    const rawUrl = linkUrlInput.trim();
    if (!rawUrl) return;
    const formattedUrl = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
    const newLink = {
      id: Date.now(),
      titre: linkTitleInput.trim() || formattedUrl,
      url: formattedUrl
    };
    setTerritoryLinks(prev => [...prev, newLink]);
    setLinkTitleInput('');
    setLinkUrlInput('');
    setIsAddingLink(false);
  };

  const handleRemoveTerritoryLink = (linkId) => {
    setTerritoryLinks(prev => prev.filter(l => l.id !== linkId));
  };

  const handleConfirmSaveTerritory = async () => {
    if (!drawingEvent || !onSaveTerritory) return;

    const allPolys = currentPoints.length >= 3
      ? [...completedPolygons, currentPoints]
      : [...completedPolygons];

    setIsSavingZone(true);

    if (allPolys.length === 0) {
      await onSaveTerritory(drawingEvent.id, null);
      setIsSavingZone(false);
      return;
    }

    const closedRings = allPolys.map(poly => {
      const coords = poly.map(pt => [pt[1], pt[0]]);
      coords.push(coords[0]);
      return [coords];
    });

    const geojsonPayload = {
      type: 'Feature',
      properties: {
        name: drawingEvent.titre,
        couleur: drawingEvent.couleur || '#0284c7',
        date_debut: drawingEvent.date_debut,
        date_fin: drawingEvent.date_fin ?? drawingEvent.date_debut,
        links: territoryLinks
      },
      geometry: closedRings.length === 1
        ? { type: 'Polygon', coordinates: closedRings[0] }
        : { type: 'MultiPolygon', coordinates: closedRings }
    };

    await onSaveTerritory(drawingEvent.id, geojsonPayload);
    setIsSavingZone(false);
  };

  useEffect(() => {
    if (!onDrawUiStateChange) return;
    const totalShapesCount = completedPolygons.length + (currentPoints.length >= 3 ? 1 : 0);

    const linksBarContent = (isAddingLink || territoryLinks.length > 0) ? (
      <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 5, display: 'flex', flexDirection: 'column', gap: 5 }}>
        {isAddingLink && (
          <form onSubmit={handleAddTerritoryLink} style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Titre du lien"
              value={linkTitleInput}
              onChange={(e) => setLinkTitleInput(e.target.value)}
              style={{
                flex: 1,
                padding: '4px 7px',
                borderRadius: 5,
                border: '1px solid #cbd5e1',
                fontSize: 11,
                outline: 'none'
              }}
            />
            <input
              type="text"
              required
              placeholder="https://..."
              value={linkUrlInput}
              onChange={(e) => setLinkUrlInput(e.target.value)}
              style={{
                flex: 1.4,
                padding: '4px 7px',
                borderRadius: 5,
                border: '1px solid #cbd5e1',
                fontSize: 11,
                outline: 'none'
              }}
            />
            <button
              type="submit"
              style={{
                padding: '4px 9px',
                borderRadius: 5,
                border: 'none',
                backgroundColor: '#0284c7',
                color: '#ffffff',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              OK
            </button>
          </form>
        )}

        {territoryLinks.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {territoryLinks.map(lk => (
              <span
                key={lk.id}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '2px 7px',
                  borderRadius: 5,
                  backgroundColor: '#e2e8f0',
                  fontSize: 10,
                  fontWeight: 600,
                  color: '#334155'
                }}
              >
                <span>{lk.titre}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTerritoryLink(lk.id)}
                  style={{ border: 'none', background: 'transparent', color: '#e11d48', cursor: 'pointer', fontSize: 10, padding: 0 }}
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    ) : null;

    onDrawUiStateChange({
      shapesCount: totalShapesCount,
      canValidateShape: currentPoints.length >= 3,
      canUndo: currentPoints.length > 0 || completedPolygons.length > 0,
      canClear: currentPoints.length > 0 || completedPolygons.length > 0,
      linksCount: territoryLinks.length,
      isAddingLink,
      isSaving: isSavingZone,
      linksBarContent,
      actions: {
        validateShape: handleValidateCurrentShape,
        toggleAddLink: () => setIsAddingLink(prev => !prev),
        undoPoint: handleUndoPoint,
        clearAll: handleClearAllShapes,
        save: handleConfirmSaveTerritory
      }
    });
  }, [completedPolygons, currentPoints, territoryLinks, linkTitleInput, linkUrlInput, isAddingLink, isSavingZone, drawingEvent]);

  const currentCenterYear = useMemo(() => {
    if (typeof targetDate === 'number') return targetDate;
    if (!viewRange) return 200;
    return Math.round((viewRange.min + viewRange.max) / 2);
  }, [targetDate, viewRange]);

  const isGeologyMode = currentCenterYear < -300000;

  useEffect(() => {
    let isCurrentEffect = true;
    if (isGeologyMode) return;

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
        if (!isCurrentEffect) return;
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
            if (!isCurrentEffect) return;
            cacheRef.current[filename] = data;
            setWorldGeoJson(data);
            setActiveMapSlice(targetYear);
            if (onMapYearChange) onMapYearChange(targetYear);
            setIsLoadingBorders(false);
          })
          .catch(() => {
            if (!isCurrentEffect) return;
            setIsLoadingBorders(false);
          });
      });

    return () => {
      isCurrentEffect = false;
    };
  }, [currentCenterYear, activeMapSlice, worldGeoJson, onMapYearChange, isGeologyMode]);

  useEffect(() => {
    if (!mapLayers.subDivisions || isGeologyMode) {
      setSubDivisionsGeoJson(null);
      return;
    }

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
  }, [currentCenterYear, mapLayers.subDivisions, isGeologyMode]);

  const activeEvents = useMemo(() => {
    if (!viewRange) return [];
    return events.filter(evt => {
      const debut = evt.date_debut;
      const fin = evt.date_fin ?? evt.date_debut;
      return debut <= viewRange.max && fin >= viewRange.min;
    });
  }, [events, viewRange]);

  const customTerritories = useMemo(() => {
    const span = viewRange ? Math.max(1, viewRange.max - viewRange.min) : 500;
    const pointTolerance = Math.max(1, Math.round(span * 0.015));

    return events
      .filter(evt => {
        if (!evt.zone_geojson) return false;
        if (drawingEvent && evt.id === drawingEvent.id) return false;

        const hasEnd = evt.date_fin !== null && evt.date_fin !== undefined && evt.date_fin !== '';
        if (hasEnd) {
          return currentCenterYear >= evt.date_debut && currentCenterYear <= evt.date_fin;
        }
        return Math.abs(currentCenterYear - evt.date_debut) <= pointTolerance;
      })
      .map(evt => {
        const { polygons, links } = extractTerritoryDataFromGeojson(evt.zone_geojson);
        return {
          event: evt,
          polygons,
          links,
          color: evt.couleur || '#0284c7'
        };
      })
      .filter(item => item.polygons.length > 0);
  }, [events, currentCenterYear, viewRange, drawingEvent]);

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
    const coords = activePoints.map(p => [p.latitude, p.longitude]);
    customTerritories.forEach(t => {
      t.polygons.forEach(poly => {
        poly.forEach(pt => coords.push(pt));
      });
    });
    return coords;
  }, [activePoints, customTerritories]);

  const handleRecalibrate = () => {
    setIsManualOverride(false);
    if (!mapRef.current) return;
    if (combinedBoundsCoords.length === 0) return;

    const bounds = L.latLngBounds(combinedBoundsCoords);
    if (!bounds.isValid()) return;

    if (combinedBoundsCoords.length === 1) {
      mapRef.current.flyTo(combinedBoundsCoords[0], 6, { duration: 1.0 });
    } else {
      mapRef.current.flyToBounds(bounds, { padding: [50, 50], maxZoom: 7, duration: 1.0 });
    }
  };

  useEffect(() => {
    if (recalibrateTrigger > 0) {
      handleRecalibrate();
    }
  }, [recalibrateTrigger]);

  const currentBaseMap = isReliefProp ? BASE_MAPS.topo : BASE_MAPS.neutre;
  const drawColor = drawingEvent?.couleur || '#0284c7';

  if (isGeologyMode) {
    return (
      <GeologyVectorMap
        currentYear={currentCenterYear}
        events={activeEvents}
        selectedEvent={selectedEvent}
        onOpenDrawer={onOpenDrawer}
      />
    );
  }

  return (
    <div
      style={{ width: '100%', height: '100%', position: 'relative' }}
      onTouchStart={() => { if (!isDrawingMode) setIsManualOverride(true); }}
      onMouseDown={() => { if (!isDrawingMode) setIsManualOverride(true); }}
      onWheel={() => { if (!isDrawingMode) setIsManualOverride(true); }}
    >
      <style>{`
        @keyframes neuPulse {
          0% { transform: scale(0.7); opacity: 1; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        .neu-custom-marker {
          background: transparent;
          border: none;
        }
        .leaflet-container.drawing-cursor {
          cursor: crosshair !important;
        }
        .leaflet-container *:focus,
        .leaflet-interactive:focus,
        .leaflet-container svg:focus,
        .leaflet-container path:focus {
          outline: none !important;
          box-shadow: none !important;
        }
        .leaflet-container {
          -webkit-tap-highlight-color: transparent;
        }
      `}</style>

      <MapContainer
        ref={mapRef}
        center={[-12.0, 20.0]}
        zoom={2}
        minZoom={1}
        zoomControl={false}
        className={isDrawingMode ? 'drawing-cursor' : ''}
        style={{ width: '100%', height: '100%' }}
      >
        <DynamicMapBridge
          boundingBoxCoords={combinedBoundsCoords}
          isManualOverride={isManualOverride}
          isDrawing={isDrawingMode}
          onUserInteract={() => setIsManualOverride(true)}
        />

        <GlobalDrawHandler
          isDrawing={isDrawingMode}
          onAddPoint={handleAddDraftPoint}
        />

        <TileLayer
          key={isReliefProp ? 'topo' : 'neutre'}
          attribution={currentBaseMap.attribution}
          url={currentBaseMap.url}
          maxZoom={currentBaseMap.maxZoom}
        />

        {mapLayers.worldEmpires && worldGeoJson && (
          <GeoJSON
            key={`world-layer-${activeMapSlice || 'empty'}`}
            data={worldGeoJson}
            interactive={!isDrawingMode}
            style={() => ({
              color: '#b45309',
              weight: 1.2,
              opacity: 0.7,
              fillColor: '#b45309',
              fillOpacity: 0.18
            })}
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
            }}
          />
        )}

        {mapLayers.subDivisions && subDivisionsGeoJson && (
          <GeoJSON
            key={`subdivisions-layer-${currentCenterYear}`}
            data={subDivisionsGeoJson}
            interactive={!isDrawingMode}
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
          />
        )}

        {mapLayers.tradeRoutes && (
          <GeoJSON
            key="silk-road-layer"
            data={SILK_ROAD_GEOJSON}
            interactive={!isDrawingMode}
            style={() => ({
              color: '#c2410c',
              weight: 3.2,
              dashArray: '7, 7',
              opacity: 0.95
            })}
          />
        )}

        {customTerritories.map(({ event: evt, polygons, links, color }) => {
          const isSelected = selectedEvent && selectedEvent.id === evt.id;
          return polygons.map((polyCoords, idx) => (
            <Polygon
              key={`custom-zone-${evt.id}-${idx}`}
              positions={polyCoords}
              interactive={!isDrawingMode}
              pathOptions={{
                color: color,
                weight: isSelected ? 3 : 2,
                opacity: 0.95,
                fillColor: color,
                fillOpacity: isSelected ? 0.38 : 0.24
              }}
              eventHandlers={{
                click: () => {
                  if (!isDrawingMode && onSelectEvent) {
                    onSelectEvent(evt);
                  }
                }
              }}
            >
              <Popup autoPan={true} minWidth={200}>
                <div style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", padding: 2 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: color, textTransform: 'uppercase', marginBottom: 2 }}>
                    {formatYear(evt.date_debut)}{evt.date_fin ? ` — ${formatYear(evt.date_fin)}` : ''}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1c1917', marginBottom: links.length > 0 ? 8 : 4 }}>
                    {evt.titre}
                  </div>
                  {links.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {links.map((lk, lIdx) => (
                        <a
                          key={lk.id || lIdx}
                          href={lk.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'block',
                            padding: '5px 8px',
                            borderRadius: 6,
                            backgroundColor: '#1c1917',
                            color: '#ffffff',
                            fontSize: 11,
                            fontWeight: 700,
                            textDecoration: 'none',
                            textAlign: 'center'
                          }}
                        >
                          {lk.titre} ↗
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: 11, color: '#78716c' }}>
                      Aucun lien associé.
                    </div>
                  )}
                </div>
              </Popup>
            </Polygon>
          ));
        })}

        {isDrawingMode && completedPolygons.map((polyCoords, idx) => (
          <Polygon
            key={`draft-completed-${idx}`}
            positions={polyCoords}
            interactive={false}
            pathOptions={{
              color: drawColor,
              weight: 2.5,
              fillColor: drawColor,
              fillOpacity: 0.32
            }}
          />
        ))}

        {isDrawingMode && currentPoints.length > 0 && (
          <>
            {currentPoints.length >= 3 ? (
              <Polygon
                positions={currentPoints}
                interactive={false}
                pathOptions={{
                  color: drawColor,
                  weight: 2,
                  dashArray: '6, 6',
                  fillColor: drawColor,
                  fillOpacity: 0.22
                }}
              />
            ) : (
              <Polyline
                positions={currentPoints}
                interactive={false}
                pathOptions={{ color: drawColor, weight: 2, dashArray: '6, 6' }}
              />
            )}
            {currentPoints.map((pt, idx) => (
              <CircleMarker
                key={`draft-pt-${idx}`}
                center={pt}
                radius={4.5}
                interactive={false}
                pathOptions={{
                  color: '#ffffff',
                  weight: 1.5,
                  fillColor: drawColor,
                  fillOpacity: 1
                }}
              />
            ))}
          </>
        )}

        {mapLayers.markers && activePoints.map(pt => {
          const isSelected = selectedEvent && selectedEvent.id === pt.eventId;
          const markerColor = isSelected ? '#0284c7' : '#e11d48';

          return (
            <Marker
              key={pt.id}
              position={[pt.latitude, pt.longitude]}
              icon={createNeuMarkerIcon(markerColor, isSelected)}
              interactive={!isDrawingMode}
              eventHandlers={{
                click: () => {
                  if (!isDrawingMode && onSelectEvent) onSelectEvent(pt.event);
                }
              }}
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
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}