import React from 'react';
import { formatEventDate, getItemStyle } from '../utils/timelineMath.js';

export default function EventPopup({ event, position, onClose, onDeepDive }) {
  if (!event) return null;

  const style = getItemStyle(event);
  const accentColor = event.couleur || style.stroke || '#5b4fe8';
  const tagsList = (event.tags || [event.categorie]).filter(Boolean);

  return (
    <div
      style={{
        position: 'absolute',
        left: Math.max(175, Math.min(window.innerWidth - 175, position.x)),
        top: position.y - 14,
        transform: 'translate(-50%, -100%)',
        zIndex: 25,
        width: 300,
        maxWidth: 'calc(100vw - 32px)',
        padding: '12px 14px',
        backgroundColor: '#eaf0f6',
        border: '1px solid rgba(255, 255, 255, 0.85)',
        borderRadius: 16,
        boxShadow: '8px 8px 20px rgba(166, 180, 200, 0.55), -6px -6px 16px rgba(255, 255, 255, 0.9)',
        color: '#1e293b',
        fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
        pointerEvents: 'auto'
      }}
    >
      <div
        style={{
          position: 'absolute',
          bottom: -6,
          left: '50%',
          transform: 'translateX(-50%) rotate(45deg)',
          width: 11,
          height: 11,
          backgroundColor: '#eaf0f6',
          borderRight: '1px solid rgba(166, 180, 200, 0.45)',
          borderBottom: '1px solid rgba(166, 180, 200, 0.45)'
        }}
      />

      {/* Ligne haut : Date + Croix fermer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: accentColor, fontWeight: 700 }}>
          {formatEventDate(event)}
        </span>

        <button
          type="button"
          onClick={onClose}
          title="Fermer"
          style={{
            width: 22,
            height: 22,
            borderRadius: '50%',
            backgroundColor: '#eaf0f6',
            border: '1px solid rgba(255, 255, 255, 0.85)',
            boxShadow: '2px 2px 4px rgba(166, 180, 200, 0.5), -2px -2px 4px rgba(255, 255, 255, 0.9)',
            color: '#64748b',
            cursor: 'pointer',
            fontSize: 10,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0
          }}
        >
          ✕
        </button>
      </div>

      {/* Titre */}
      <h3 style={{ margin: '0 0 10px 0', fontWeight: 700, color: '#1e293b', fontSize: 14, lineHeight: 1.3 }}>
        {event.titre}
      </h3>

      {/* Ligne bas : Tags à gauche + Bouton loupe à droite */}
      <div
        style={{
          borderTop: '1px solid rgba(166, 180, 200, 0.35)',
          paddingTop: 8,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 8
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, flex: 1, minWidth: 0 }}>
          {tagsList.map(t => (
            <span
              key={t}
              style={{
                padding: '2px 7px',
                borderRadius: 8,
                fontSize: 9.5,
                backgroundColor: '#dfe6ee',
                color: '#475569',
                fontWeight: 600
              }}
            >
              #{t}
            </span>
          ))}
        </div>

        <button
          type="button"
          onClick={() => onDeepDive(event)}
          title="Approfondir"
          style={{
            width: 30,
            height: 30,
            borderRadius: '50%',
            backgroundColor: '#5b4fe8',
            color: '#ffffff',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '3px 3px 8px rgba(91, 79, 232, 0.35)'
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>
      </div>
    </div>
  );
}