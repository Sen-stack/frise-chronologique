import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { formatYear, getItemStyle } from '../utils/timelineMath.js';

// Icône de repère Leaflet
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Hook utilitaire pour forcer Leaflet à recalculer sa taille d'affichage sans tuiles cassées
function MapResizer() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 120);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

export default function KnowledgeSplitView({ event, isOpen, onClose }) {
  if (!isOpen || !event) return null;

  const style = getItemStyle(event);

  const cartes = Array.isArray(event.cartes_historiques) && event.cartes_historiques.length > 0
    ? event.cartes_historiques
    : (event.carte_historique_url
        ? [{ source: 'archive', titre: event.carte_legende || 'Carte historique', url: event.carte_historique_url }]
        : []);

  const hasArchiveMaps = cartes.length > 0;
  const [activeTab, setActiveTab] = useState(hasArchiveMaps ? 'archives' : 'moderne');
  const [previewCard, setPreviewCard] = useState(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setPreviewCard(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const hasCoords = event.latitude !== null && event.latitude !== undefined && event.longitude !== null && event.longitude !== undefined && !isNaN(event.latitude);
  const position = hasCoords ? [Number(event.latitude), Number(event.longitude)] : [41.9028, 12.4964];
  const zoom = Number(event.zoom_niveau) || 6;

  return (
    <>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100vw',
          height: '50vh',
          backgroundColor: '#090d16',
          borderBottom: '2px solid #1e293b',
          zIndex: 25,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.8)',
          color: '#f8fafc',
          overflow: 'hidden'
        }}
      >
        {/* 1. Barre d'en-tête */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 18px',
            backgroundColor: '#0f172a',
            borderBottom: '1px solid #1e293b',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: 1,
                padding: '2px 8px',
                borderRadius: 4,
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: style.stroke,
                fontWeight: 'bold'
              }}
            >
              {event.date_fin ? '⏳ Période' : '📍 Événement'}
            </span>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 'bold', color: '#ffffff' }}>
              {event.titre}
            </h2>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>
              ({formatYear(event.date_debut)}{event.date_fin ? ` ➔ ${formatYear(event.date_fin)}` : ''})
            </span>
          </div>

          <button
            onClick={onClose}
            title="Fermer le volet"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid #334155',
              color: '#cbd5e1',
              borderRadius: 6,
              padding: '4px 10px',
              fontSize: 12,
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            ✕ Fermer le split
          </button>
        </div>

        {/* 2. Corps scindé (Gauche 58% / Droite 42%) */}
        <div style={{ display: 'flex', flex: 1, width: '100%', overflow: 'hidden' }}>
          
          {/* COLONNE GAUCHE (CARTES & ARCHIVES) */}
          <div style={{ width: '58%', height: '100%', display: 'flex', flexDirection: 'column', borderRight: '1px solid #1e293b', backgroundColor: '#020617', position: 'relative', overflow: 'hidden' }}>
            
            {/* Onglets */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 14px',
                backgroundColor: '#0a0f1d',
                borderBottom: '1px solid #1e293b',
                flexShrink: 0
              }}
            >
              <div style={{ display: 'flex', gap: 6 }}>
                {hasArchiveMaps && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('archives')}
                    style={{
                      padding: '4px 12px',
                      borderRadius: 6,
                      border: 'none',
                      fontSize: 11,
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      backgroundColor: activeTab === 'archives' ? '#0284c7' : 'rgba(255,255,255,0.05)',
                      color: activeTab === 'archives' ? '#ffffff' : '#94a3b8'
                    }}
                  >
                    🗺️ Archives & Cartes ({cartes.length})
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setActiveTab('moderne')}
                  style={{
                    padding: '4px 12px',
                    borderRadius: 6,
                    border: 'none',
                    fontSize: 11,
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    backgroundColor: activeTab === 'moderne' ? '#0284c7' : 'rgba(255,255,255,0.05)',
                    color: activeTab === 'moderne' ? '#ffffff' : '#94a3b8'
                  }}
                >
                  🌍 Localisation moderne
                </button>
              </div>

              {activeTab === 'archives' && (
                <span style={{ fontSize: 10, color: '#64748b' }}>
                  Cliquez sur un document pour l'agrandir
                </span>
              )}
            </div>

            {/* VUE ARCHIVES PINTEREST */}
            {activeTab === 'archives' && hasArchiveMaps && (
              <div style={{ flex: 1, overflowY: 'auto', padding: 14, backgroundColor: '#050811' }}>
                {cartes.length === 1 ? (
                  <div
                    onClick={() => setPreviewCard(cartes[0])}
                    style={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'zoom-in'
                    }}
                  >
                    <img
                      src={cartes[0].url}
                      alt={cartes[0].titre}
                      referrerPolicy="no-referrer"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '85%',
                        objectFit: 'contain',
                        borderRadius: 8,
                        boxShadow: '0 8px 30px rgba(0,0,0,0.8)'
                      }}
                    />
                    <div style={{ marginTop: 8, fontSize: 11, color: '#94a3b8', fontStyle: 'italic', textAlign: 'center' }}>
                      {cartes[0].titre}
                    </div>
                  </div>
                ) : (
                  <div style={{ columnCount: 2, columnGap: 14 }}>
                    {cartes.map((carte, idx) => (
                      <div
                        key={idx}
                        onClick={() => setPreviewCard(carte)}
                        style={{
                          breakInside: 'avoid',
                          marginBottom: 14,
                          borderRadius: 8,
                          overflow: 'hidden',
                          backgroundColor: '#0b1120',
                          border: '1px solid #1e293b',
                          boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
                          cursor: 'zoom-in',
                          transition: 'transform 0.15s ease, border-color 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.borderColor = '#38bdf8';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.borderColor = '#1e293b';
                        }}
                      >
                        <img
                          src={carte.url}
                          alt={carte.titre}
                          referrerPolicy="no-referrer"
                          style={{ width: '100%', display: 'block', objectFit: 'cover' }}
                        />
                        <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span style={{ fontSize: 9, color: '#38bdf8', fontWeight: 'bold', textTransform: 'uppercase' }}>
                            {carte.source || 'Archive'}
                          </span>
                          <span style={{ fontSize: 11, color: '#cbd5e1', lineHeight: 1.3 }}>
                            {carte.titre}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* VUE LEAFLET MODERNE (Conteneur strictement calibré avec Invalidator) */}
            {activeTab === 'moderne' && (
              <div style={{ flex: 1, width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
                <MapContainer
                  center={position}
                  zoom={zoom}
                  style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
                >
                  <MapResizer />
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {hasCoords && (
                    <Marker position={position} icon={defaultIcon}>
                      <Popup>
                        <strong style={{ color: '#0f172a' }}>{event.titre}</strong>
                        <br />
                        <span style={{ fontSize: 11, color: '#475569' }}>{formatYear(event.date_debut)}</span>
                      </Popup>
                    </Marker>
                  )}
                </MapContainer>
              </div>
            )}
          </div>

          {/* COLONNE DROITE : CONNAISSANCES & RÉFÉRENCES */}
          <div
            style={{
              width: '42%',
              height: '100%',
              padding: 18,
              overflowY: 'auto',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              backgroundColor: '#090d16'
            }}
          >
            <div>
              <h4 style={{ margin: '0 0 6px 0', fontSize: 12, textTransform: 'uppercase', color: '#38bdf8' }}>
                Description & Contexte
              </h4>
              <p style={{ margin: 0, fontSize: 13, color: '#cbd5e1', lineHeight: 1.5 }}>
                {event.description || "Aucun détail fourni pour cet événement."}
              </p>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
              {(event.tags || [event.categorie]).filter(Boolean).map(t => (
                <span
                  key={t}
                  style={{
                    padding: '2px 8px',
                    borderRadius: 12,
                    fontSize: 10,
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#94a3b8'
                  }}
                >
                  #{t}
                </span>
              ))}
            </div>

            <div
              style={{
                marginTop: 'auto',
                padding: 12,
                borderRadius: 8,
                backgroundColor: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid #1e293b',
                fontSize: 11,
                color: '#64748b'
              }}
            >
              📚 Espace réservé pour les lectures, vidéos, citations et liens d'études (Bento Grid).
            </div>
          </div>

        </div>
      </div>

      {/* Lightbox plein écran */}
      {previewCard && (
        <div
          onClick={() => setPreviewCard(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            backgroundColor: 'rgba(2, 6, 23, 0.94)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            cursor: 'zoom-out'
          }}
        >
          <div style={{ position: 'absolute', top: 18, right: 24, display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>Appuyez sur Échap ou cliquez pour fermer</span>
            <button
              onClick={() => setPreviewCard(null)}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid #475569',
                color: '#ffffff',
                borderRadius: '50%',
                width: 32,
                height: 32,
                cursor: 'pointer',
                fontSize: 14
              }}
            >
              ✕
            </button>
          </div>

          <img
            src={previewCard.url}
            alt={previewCard.titre}
            referrerPolicy="no-referrer"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '92vw',
              maxHeight: '84vh',
              objectFit: 'contain',
              borderRadius: 8,
              boxShadow: '0 20px 50px rgba(0,0,0,0.9)',
              cursor: 'default'
            }}
          />

          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              marginTop: 12,
              padding: '6px 16px',
              backgroundColor: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid #334155',
              borderRadius: 20,
              fontSize: 12,
              color: '#f8fafc',
              textAlign: 'center',
              maxWidth: '80%'
            }}
          >
            {previewCard.titre}
          </div>
        </div>
      )}
    </>
  );
}