import React from 'react';
import { formatYear, getItemStyle } from '../utils/timelineMath.js';

export default function EventPopup({ event, position, onClose, onDeepDive }) {
  if (!event) return null;

  const style = getItemStyle(event);
  const accentColor = event.couleur || style.stroke || '#b45309';

  return (
    <div
      style={{
        position: 'absolute',
        left: Math.max(190, Math.min(window.innerWidth - 190, position.x)),
        top: position.y - 14,
        transform: 'translate(-50%, -100%)',
        zIndex: 25,
        width: 320,
        maxWidth: 'calc(100vw - 32px)',
        padding: '12px 14px',
        backgroundColor: '#faf7f2',
        border: '1px solid #e7ded0',
        borderRadius: 12,
        boxShadow: '0 10px 25px rgba(44, 34, 22, 0.12), 0 2px 6px rgba(44, 34, 22, 0.06)',
        color: '#1c1917',
        fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
        pointerEvents: 'auto'
      }}
    >
      {/* Flèche indicatrice sous la boîte */}
      <div
        style={{
          position: 'absolute',
          bottom: -6,
          left: '50%',
          transform: 'translateX(-50%) rotate(45deg)',
          width: 10,
          height: 10,
          backgroundColor: '#faf7f2',
          borderRight: '1px solid #e7ded0',
          borderBottom: '1px solid #e7ded0'
        }}
      />

      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              fontSize: 9,
              textTransform: 'uppercase',
              letterSpacing: 0.8,
              padding: '2px 6px',
              borderRadius: 4,
              backgroundColor: '#f3ece0',
              color: accentColor,
              fontWeight: 700
            }}
          >
            {event.date_fin ? '⏳ Période' : '📍 Événement'}
          </span>
          <span style={{ fontSize: 11, color: '#78716c', fontWeight: 600 }}>
            {formatYear(event.date_debut)}
            {event.date_fin ? ` ➔ ${formatYear(event.date_fin)}` : ''}
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          title="Fermer"
          style={{
            background: 'none',
            border: 'none',
            color: '#78716c',
            cursor: 'pointer',
            fontSize: 13,
            padding: 2,
            lineHeight: 1
          }}
        >
          ✕
        </button>
      </div>

      {/* Titre */}
      <h3 style={{ margin: '0 0 6px 0', fontWeight: 700, color: '#1c1917', fontSize: 14, lineHeight: 1.3 }}>
        {event.titre}
      </h3>

      {/* Extrait descriptif */}
      <p
        style={{
          fontSize: 11,
          color: '#57534e',
          margin: '0 0 10px 0',
          lineHeight: 1.45,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}
      >
        {event.description || 'Aucune description rapide fournie.'}
      </p>

      {/* Badges de tags */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
        {(event.tags || [event.categorie]).filter(Boolean).map(t => (
          <span
            key={t}
            style={{
              padding: '1px 6px',
              borderRadius: 6,
              fontSize: 9,
              backgroundColor: '#f3ece0',
              color: '#57534e',
              fontWeight: 500
            }}
          >
            #{t}
          </span>
        ))}
      </div>

      {/* Pied : Bouton Approfondir */}
      <div
        style={{
          borderTop: '1px solid #e7ded0',
          paddingTop: 8,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <span style={{ fontSize: 10, color: '#a8a29e', fontWeight: 600 }}>
          🏛️ {event.periode}
        </span>

        <button
          type="button"
          onClick={() => onDeepDive(event)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '5px 12px',
            backgroundColor: '#b45309',
            color: '#ffffff',
            border: 'none',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(180, 83, 9, 0.2)'
          }}
        >
          <span>🔍</span>
          <span>Approfondir</span>
        </button>
      </div>
    </div>
  );
}