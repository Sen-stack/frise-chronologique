import React, { useMemo, useState, useEffect, useRef } from 'react';
import * as d3 from 'd3-geo';

// Les 9 tranches officielles en local
const GEOLOGY_MA_SLICES = [400, 300, 250, 200, 150, 100, 66, 20, 0];

export default function GeologyVectorMap({ 
  currentYear, 
  events = [], 
  selectedEvent, 
  onOpenDrawer 
}) {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 450 });
  const [platesGeoJson, setPlatesGeoJson] = useState(null);
  const cacheRef = useRef({});

  // 1. Lissage de l'année pour découpler totalement le défilement de la frise
  const [debouncedYear, setDebouncedYear] = useState(currentYear);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedYear(currentYear);
    }, 100);
    return () => clearTimeout(timer);
  }, [currentYear]);

  // 2. Calcul des Millions d'années (Ma)
  const currentMa = useMemo(() => {
    return Math.max(0, Math.round(Math.abs(debouncedYear) / 1000000));
  }, [debouncedYear]);

  // 3. Choix de la tranche géologique la plus proche
  const closestMa = useMemo(() => {
    return GEOLOGY_MA_SLICES.reduce((prev, curr) => 
      Math.abs(curr - currentMa) < Math.abs(prev - currentMa) ? curr : prev
    );
  }, [currentMa]);

  // 4. Détection dynamique de la taille (responsive)
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
          setDimensions({
            width: Math.round(entry.contentRect.width),
            height: Math.round(entry.contentRect.height)
          });
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // 5. Chargement instantané depuis le disque local
  useEffect(() => {
    let isMounted = true;
    const cacheKey = `local_plates_${closestMa}`;

    if (cacheRef.current[cacheKey]) {
      setPlatesGeoJson(cacheRef.current[cacheKey]);
      return;
    }

    fetch(`/maps/geology/plates_${closestMa}ma.geojson`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!isMounted) return;
        cacheRef.current[cacheKey] = data;
        setPlatesGeoJson(data);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Erreur chargement local géologie:", err);
      });

    return () => {
      isMounted = false;
    };
  }, [closestMa]);

  // 6. Filtrage des repères géologiques (antérieurs à -300 000 ans)
  const geologicalPoints = useMemo(() => {
    const list = [];
    events.forEach((evt) => {
      if (evt.date_debut > -300000) return;

      const hasDirectCoords = evt.latitude !== null && evt.longitude !== null && !isNaN(Number(evt.latitude)) && !isNaN(Number(evt.longitude));
      const lieuxList = Array.isArray(evt.lieux) ? evt.lieux : [];

      if (lieuxList.length > 0) {
        lieuxList.forEach((l) => {
          if (l.latitude !== null && l.longitude !== null && !isNaN(Number(l.latitude))) {
            list.push({
              id: `${evt.id}-${l.id || l.nom}`,
              event: evt,
              nom: l.nom || evt.titre,
              lat: Number(l.latitude),
              lng: Number(l.longitude)
            });
          }
        });
      } else if (hasDirectCoords) {
        list.push({
          id: `${evt.id}-main`,
          event: evt,
          nom: evt.titre,
          lat: Number(evt.latitude),
          lng: Number(evt.longitude)
        });
      }
    });
    return list;
  }, [events]);

  // 7. Moteur de projection (Equal Earth)
  const projection = useMemo(() => {
    return d3.geoEqualEarth()
      .fitSize([dimensions.width - 40, dimensions.height - 40], { type: "Sphere" })
      .translate([dimensions.width / 2, dimensions.height / 2]);
  }, [dimensions]);

  const pathGenerator = useMemo(() => {
    return d3.geoPath().projection(projection);
  }, [projection]);

  // 8. OPTIMISATION : Les tracés SVG sont mis en cache (calculés 1 seule fois, 0% CPU pendant le scroll)
  const spherePath = useMemo(() => {
    return pathGenerator({ type: "Sphere" });
  }, [pathGenerator]);

  const graticulePath = useMemo(() => {
    return pathGenerator(d3.geoGraticule()());
  }, [pathGenerator]);

  const platePaths = useMemo(() => {
    if (!platesGeoJson || !platesGeoJson.features) return [];
    return platesGeoJson.features
      .map((feature, idx) => ({
        id: `plate-${idx}`,
        d: pathGenerator(feature)
      }))
      .filter((p) => Boolean(p.d));
  }, [platesGeoJson, pathGenerator]);

  const projectedMarkers = useMemo(() => {
    return geologicalPoints
      .map((pt) => {
        const coords = projection([pt.lng, pt.lat]);
        if (!coords) return null;
        return {
          ...pt,
          x: coords[0],
          y: coords[1]
        };
      })
      .filter(Boolean);
  }, [geologicalPoints, projection]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#070b12',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Badge informatif */}
      <div
        style={{
          position: 'absolute',
          top: 14,
          left: 16,
          zIndex: 10,
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: 8,
          padding: '6px 14px',
          color: '#f8fafc',
          pointerEvents: 'none'
        }}
      >
        <div style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase' }}>
          Tectonique des plaques (Local)
        </div>
        <div style={{ fontSize: 13, fontWeight: 700 }}>
          -{closestMa} Millions d'années (Ma)
        </div>
      </div>

      <svg width={dimensions.width} height={dimensions.height} style={{ display: 'block' }}>
        {/* Globe océanique */}
        {spherePath && (
          <path
            d={spherePath}
            fill="#0b1329"
            stroke="rgba(255, 255, 255, 0.18)"
            strokeWidth={1.2}
          />
        )}

        {/* Méridiens et parallèles */}
        {graticulePath && (
          <path
            d={graticulePath}
            fill="none"
            stroke="rgba(255, 255, 255, 0.05)"
            strokeWidth={0.5}
          />
        )}

        {/* Plaques continentales (tracés pré-calculés en mémoire) */}
        {platePaths.map((plate) => (
          <path
            key={plate.id}
            d={plate.d}
            fill="#2e4235"
            stroke="#52796f"
            strokeWidth={0.8}
            opacity={0.92}
          />
        ))}

        {/* Repères personnels projetés */}
        {projectedMarkers.map((pt) => {
          const isSelected = selectedEvent && selectedEvent.id === pt.event.id;
          const markerColor = isSelected ? '#0284c7' : '#e11d48';

          return (
            <g
              key={pt.id}
              transform={`translate(${pt.x}, ${pt.y})`}
              style={{ cursor: 'pointer' }}
              onClick={() => onOpenDrawer && onOpenDrawer(pt.event)}
            >
              <circle
                r={isSelected ? 7 : 5}
                fill={markerColor}
                stroke="#ffffff"
                strokeWidth={1.5}
              />
              <text
                y={-9}
                textAnchor="middle"
                fill="#f8fafc"
                fontSize={10}
                fontWeight={600}
                style={{ textShadow: '0 2px 4px rgba(0,0,0,0.9)' }}
              >
                {pt.nom}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}