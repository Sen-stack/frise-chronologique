import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { formatYear, getItemStyle } from '../utils/timelineMath.js';

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

// Coordonnées de secours historiques par défaut si l'événement n'a pas encore été géolocalisé
function getHistoricalFallbackCoords(titre = '') {
  const t = titre.toLowerCase();
  if (t.includes('rome') || t.includes('romain')) return { lat: 41.9028, lng: 12.4964 };
  if (t.includes('qin') || t.includes('shang') || t.includes('zhou') || t.includes('ming') || t.includes('confucius') || t.includes('taoï')) return { lat: 34.3416, lng: 108.9398 };
  if (t.includes('gaugam') || t.includes('perse') || t.includes('babylone')) return { lat: 36.36, lng: 43.15 };
  if (t.includes('hastings') || t.includes('angleterre')) return { lat: 50.91, lng: 0.48 };
  if (t.includes('constantinople')) return { lat: 41.0082, lng: 28.9784 };
  if (t.includes('amérique')) return { lat: 24.0, lng: -74.5 };
  if (t.includes('napoléon') || t.includes('révolution')) return { lat: 48.8566, lng: 2.3522 };
  return null;
}

// Contrôleur de caméra ultra-fluide synchronisé avec la frise
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

    // Calcul de l'enveloppe
    const bounds = L.latLngBounds(boundingBoxCoords);
    if (!bounds.isValid()) return;

    // Empreinte arrondie pour éviter le micro-tremblement
    const center = bounds.getCenter();
    const centerKey = `${center.lat.toFixed(1)},${center.lng.toFixed(1)},${map.getZoom()}`;
    if (centerKey === lastCenterKeyRef.current) return;

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(() => {
      lastCenterKeyRef.current = centerKey;

      if (boundingBoxCoords.length === 1) {
        map.flyTo(boundingBoxCoords[0], 6, { animate: true, duration: 1.2 });
      } else {
        map.flyToBounds(bounds, {
          padding: [50, 50],
          maxZoom: 7,
          animate: true,
          duration: 1.2
        });
      }
    }, 120);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [map, boundingBoxCoords, isManualOverride]);

  return null;
}

export default function HistoricalAtlas({ viewRange, events = [], selectedEvent, onOpenDrawer }) {
  const [isManualOverride, setIsManualOverride] = useState(false);
  const mapRef = useRef(null);

  // 1. Filtrage temporel strict
  const activeEvents = useMemo(() => {
    if (!viewRange) return [];
    const vMin = viewRange.min;
    const vMax = viewRange.max;

    return events.filter(evt => {
      const debut = evt.date_debut;
      const fin = evt.date_fin ?? evt.date_debut;
      return debut <= vMax && fin >= vMin;
    });
  }, [events, viewRange]);

  // 2. Extraction des points actifs avec rattrapage historique si vide
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
      } else {
        // Coordonnées de secours déduites du titre de l'époque
        const fallback = getHistoricalFallbackCoords(evt.titre);
        if (fallback) {
          points.push({
            id: `${evt.id}-fallback`,
            eventId: evt.id,
            event: evt,
            nom: evt.titre,
            role: 'Zone historique',
            latitude: fallback.lat,
            longitude: fallback.lng
          });
        }
      }
    });

    return points;
  }, [activeEvents]);

  // 3. Extraction des polygones GeoJSON actifs
  const activePolygons = useMemo(() => {
    const polygons = [];

    activeEvents.forEach(evt => {
      const rawGeo = evt.zone_geojson || evt.geojson || evt.polygone;
      if (!rawGeo) return;

      let parsedGeo = null;
      if (typeof rawGeo === 'string') {
        try {
          parsedGeo = JSON.parse(rawGeo);
        } catch {
          parsedGeo = null;
        }
      } else if (typeof rawGeo === 'object') {
        parsedGeo = rawGeo;
      }

      if (parsedGeo) {
        const style = getItemStyle(evt);
        polygons.push({
          eventId: evt.id,
          event: evt,
          data: parsedGeo,
          color: evt.couleur || style.stroke || '#b45309'
        });
      }
    });

    return polygons;
  }, [activeEvents]);

  // 4. Calcul de l'ensemble des coordonnées pour la Bounding Box
  const combinedBoundsCoords = useMemo(() => {
    const coords = [];

    activePoints.forEach(p => {
      coords.push([p.latitude, p.longitude]);
    });

    activePolygons.forEach(poly => {
      try {
        const layer = L.geoJSON(poly.data);
        const bounds = layer.getBounds();
        if (bounds.isValid()) {
          coords.push([bounds.getNorth(), bounds.getEast()]);
          coords.push([bounds.getSouth(), bounds.getWest()]);
        }
      } catch {
        // Ignorer
      }
    });

    return coords;
  }, [activePoints, activePolygons]);

  // Recalibrage forcé
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
      {/* Badge d'état & Bouton de recalibrage */}
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
        <span style={{ color: '#78716c', fontWeight: 600 }}>
          📍 {activePoints.length} point{activePoints.length > 1 ? 's' : ''}
          {activePolygons.length > 0 && ` • 🗺️ ${activePolygons.length} zone${activePolygons.length > 1 ? 's' : ''}`}
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
        center={[34, 108]}
        zoom={4}
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

        {activePolygons.map(poly => {
          const isSelected = selectedEvent && selectedEvent.id === poly.eventId;

          return (
            <GeoJSON
              key={`poly-${poly.eventId}`}
              data={poly.data}
              style={{
                color: poly.color,
                weight: isSelected ? 3 : 1.5,
                opacity: isSelected ? 0.95 : 0.7,
                fillColor: poly.color,
                fillOpacity: isSelected ? 0.35 : 0.18
              }}
              eventHandlers={{
                click: () => onOpenDrawer(poly.event)
              }}
            />
          );
        })}

        {activePoints.map(pt => {
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