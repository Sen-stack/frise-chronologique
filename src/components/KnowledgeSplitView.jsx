import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { formatYear, getItemStyle } from '../utils/timelineMath.js';

// Icône Leaflet
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function KnowledgeSplitView({ event, isOpen, onClose }) {
  if (!isOpen || !event) return null;

  const style = getItemStyle(event);

  // Onglet actif : 'archive' si une carte d'époque existe, sinon 'moderne'
  const hasArchiveMap = Boolean(event.carte_historique_url);
  const [activeTab, setActiveTab] = useState(hasArchiveMap ? 'archive' : 'moderne');

  // Coordonnées géographiques modernes
  const hasCoords = event.latitude !== null && event.latitude !== undefined && event.longitude !== null && event.longitude !== undefined;
  const position = hasCoords ? [event.latitude, event.longitude] : [41.9028, 12.4964];
  const zoom = event.zoom_niveau || 6;

  return (
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
      {/* Barre d'en-tête */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 18px',
          backgroundColor: '#0f172a',
          borderBottom: '1px solid #1e293b'
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
          title="Fermer la vue détaillée"
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

      {/* Corps scindé */}
      <div style={{ display: 'flex', flex: 1, height: 'calc(100% - 44px)' }}>
        
        {/* Colonne Gauche : Espace cartographique avec onglets */}
        <div style={{ flex: '0 0 55%', height: '100%', display: 'flex', flexDirection: 'column', borderRight: '1px solid #1e293b', backgroundColor: '#020617' }}>
          
          {/* Barre de navigation des onglets de carte */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 12px',
              backgroundColor: '#0a0f1d',
              borderBottom: '1px solid #1e293b'
            }}
          >
            <div style={{ display: 'flex', gap: 6 }}>
              {hasArchiveMap && (
                <button
                  type="button"
                  onClick={() => setActiveTab('archive')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    border: 'none',
                    fontSize: 11,
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    backgroundColor: activeTab === 'archive' ? '#0284c7' : 'rgba(255,255,255,0.05)',
                    color: activeTab === 'archive' ? '#ffffff' : '#94a3b8'
                  }}
                >
                  🗺️ Carte / Plan d’époque
                </button>
              )}

              <button
                type="button"
                onClick={() => setActiveTab('moderne')}
                style={{
                  padding: '4px 10px',
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

            {activeTab === 'archive' && event.carte_legende && (
              <span style={{ fontSize: 10, color: '#94a3b8', fontStyle: 'italic', maxWidth: '40%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {event.carte_legende}
              </span>
            )}
          </div>

          {/* Contenu : Onglet 1 — Archive / Plan historique */}
          {/* Contenu : Onglet 1 — Archive / Plan historique */}
          {activeTab === 'archive' && event.carte_historique_url && (
            <div
              style={{
                flex: 1,
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                backgroundColor: '#050811',
                padding: 10
              }}
            >
              <img
                src={event.carte_historique_url}
                alt={event.carte_legende || event.titre}
                referrerPolicy="no-referrer"
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  borderRadius: 6,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.6)'
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: 10,
                  right: 12,
                  backgroundColor: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid #334155',
                  padding: '3px 8px',
                  borderRadius: 4,
                  fontSize: 10,
                  color: '#94a3b8'
                }}
              >
                Document d'époque
              </div>
            </div>
          )}

          {/* Contenu : Onglet 2 — Carte moderne Leaflet */}
          {activeTab === 'moderne' && (
            <div style={{ flex: 1, position: 'relative' }}>
              <MapContainer
                key={`${event.id}-${position[0]}-${position[1]}`}
                center={position}
                zoom={zoom}
                style={{ width: '100%', height: '100%', background: '#020617' }}
              >
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

        {/* Colonne Droite : Métadonnées et références */}
        <div
          style={{
            flex: '0 0 45%',
            padding: 18,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 12
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
            📚 Espace réservé pour les livres, vidéos, articles et liens (Étape 6).
          </div>
        </div>

      </div>
    </div>
  );
}