import React from 'react';
import { formatYear, getItemStyle } from '../utils/timelineMath.js';

export default function EventPopup({ event, position, onClose, onDeepDive }) {
  if (!event) return null;

  const style = getItemStyle(event);

  return (
    <div
      style={{
        position: 'absolute',
        left: Math.max(190, Math.min(window.innerWidth - 190, position.x)),
        top: Math.max(70, position.y - 12),
        transform: 'translate(-50%, -100%)',
        zIndex: 20,
        width: 360,
        padding: '14px 16px',
        backgroundColor: 'rgba(15, 23, 42, 0.96)',
        backdropFilter: 'blur(16px)',
        border: `1.5px solid ${style.stroke}`,
        borderRadius: 14,
        boxShadow: '0 12px 35px rgba(0, 0, 0, 0.75), 0 0 20px rgba(0, 0, 0, 0.5)',
        color: '#f8fafc',
        pointerEvents: 'auto'
      }}
    >
      {/* Flèche indicatrice sous la boîte */}
      <div
        style={{
          position: 'absolute',
          bottom: -7,
          left: '50%',
          transform: 'translateX(-50%) rotate(45deg)',
          width: 12,
          height: 12,
          backgroundColor: 'rgba(15, 23, 42, 0.96)',
          borderRight: `1.5px solid ${style.stroke}`,
          borderBottom: `1.5px solid ${style.stroke}`
        }}
      />

      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              fontSize: 9,
              textTransform: 'uppercase',
              letterSpacing: 1,
              padding: '2px 6px',
              borderRadius: 4,
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              color: style.stroke,
              fontWeight: 'bold'
            }}
          >
            {event.date_fin ? '⏳ Période' : '📍 Événement'}
          </span>
          <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>
            {formatYear(event.date_debut)}
            {event.date_fin ? ` ➔ ${formatYear(event.date_fin)}` : ''}
          </span>
        </div>

        <button
          onClick={onClose}
          title="Fermer"
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            fontSize: 14,
            padding: 2,
            lineHeight: 1
          }}
        >
          ✕
        </button>
      </div>

      {/* Titre */}
      <h3 style={{ margin: '0 0 6px 0', fontWeight: 'bold', color: '#ffffff', fontSize: 15, lineHeight: 1.3 }}>
        {event.titre}
      </h3>

      {/* Extrait descriptif */}
      <p
        style={{
          fontSize: 11,
          color: '#cbd5e1',
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
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
        {(event.tags || [event.categorie]).filter(Boolean).map(t => (
          <span
            key={t}
            style={{
              padding: '1px 6px',
              borderRadius: 10,
              fontSize: 9,
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#94a3b8'
            }}
          >
            #{t}
          </span>
        ))}
      </div>

      {/* Pied : Bouton Approfondir */}
      <div
        style={{
          borderTop: '1px solid rgba(51, 65, 85, 0.5)',
          paddingTop: 10,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <span style={{ fontSize: 10, color: '#64748b' }}>
          🏛️ {event.periode}
        </span>

        <button
          onClick={() => onDeepDive(event)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '5px 12px',
            backgroundColor: style.stroke,
            color: '#020617',
            border: 'none',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: `0 2px 8px ${style.stroke}40`
          }}
        >
          <span>🔍</span>
          <span>Approfondir</span>
        </button>
      </div>
    </div>
  );
}