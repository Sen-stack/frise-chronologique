import React from 'react';
import { formatYear, DEFAULT_TAG_PALETTE } from '../utils/timelineMath.js';

export default function FilterDrawer({
  isOpen,
  onClose,
  filterMode,
  setFilterMode,
  availableTags,
  selectedTags,
  onToggleFilterTag,
  onSelectAllTags,
  onDeselectAllTags,
  events,
  customSelectedIds,
  onToggleCustomEvent,
  onSelectAllCustom,
  onDeselectAllCustom,
  searchQuery,
  setSearchQuery
}) {
  if (!isOpen) return null;

  const searchedEvents = events.filter(e =>
    e.titre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      style={{
        position: 'absolute',
        top: 68,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 25,
        width: 340,
        maxHeight: 'calc(100vh - 180px)',
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        border: '1px solid #334155',
        borderRadius: 16,
        backdropFilter: 'blur(12px)',
        boxShadow: '0 15px 35px rgba(0,0,0,0.7)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        color: '#f8fafc'
      }}
    >
      {/* En-tête du volet */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #1e293b',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <span style={{ fontWeight: 'bold', fontSize: 13, color: '#38bdf8' }}>
          Filtres d'affichage
        </span>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 14 }}
        >
          ✕
        </button>
      </div>

      {/* Onglets de mode */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          padding: 8,
          gap: 6,
          backgroundColor: '#090d16',
          borderBottom: '1px solid #1e293b'
        }}
      >
        <button
          onClick={() => setFilterMode('tags')}
          style={{
            padding: '6px',
            fontSize: 11,
            fontWeight: 'bold',
            borderRadius: 6,
            border: 'none',
            cursor: 'pointer',
            backgroundColor: filterMode === 'tags' ? '#0284c7' : 'transparent',
            color: filterMode === 'tags' ? '#ffffff' : '#94a3b8'
          }}
        >
          Par Tags
        </button>
        <button
          onClick={() => setFilterMode('custom')}
          style={{
            padding: '6px',
            fontSize: 11,
            fontWeight: 'bold',
            borderRadius: 6,
            border: 'none',
            cursor: 'pointer',
            backgroundColor: filterMode === 'custom' ? '#0284c7' : 'transparent',
            color: filterMode === 'custom' ? '#ffffff' : '#94a3b8'
          }}
        >
          Éléments isolés
        </button>
      </div>

      {/* Contenu filtrable */}
      <div style={{ padding: 14, overflowY: 'auto', flex: 1, fontSize: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
        
        {/* Mode Tags */}
        {filterMode === 'tags' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94a3b8', marginBottom: 4 }}>
              <span>COCHER POUR VISUALISER :</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <span onClick={onSelectAllTags} style={{ cursor: 'pointer', color: '#38bdf8' }}>Tous</span>
                <span onClick={onDeselectAllTags} style={{ cursor: 'pointer', color: '#94a3b8' }}>Aucun</span>
              </div>
            </div>

            {availableTags.map(tag => {
              const isChecked = selectedTags.includes(tag);
              const strokeColor = (DEFAULT_TAG_PALETTE[tag] && DEFAULT_TAG_PALETTE[tag].stroke) || '#94a3b8';
              return (
                <label
                  key={tag}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 8px',
                    borderRadius: 6,
                    backgroundColor: isChecked ? 'rgba(255,255,255,0.05)' : 'transparent',
                    cursor: 'pointer'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => onToggleFilterTag(tag)}
                    style={{ accentColor: strokeColor }}
                  />
                  <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', backgroundColor: strokeColor }} />
                  <span style={{ color: isChecked ? '#f8fafc' : '#64748b' }}>{tag}</span>
                </label>
              );
            })}
          </div>
        )}

        {/* Mode Éléments Isolés */}
        {filterMode === 'custom' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input
              type="text"
              placeholder="Rechercher un événement..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                backgroundColor: '#020617',
                border: '1px solid #334155',
                borderRadius: 6,
                padding: '6px 10px',
                color: '#ffffff',
                fontSize: 11,
                outline: 'none'
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94a3b8' }}>
              <span>{customSelectedIds.size} visible(s) / {events.length}</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <span onClick={onSelectAllCustom} style={{ cursor: 'pointer', color: '#38bdf8' }}>Tout</span>
                <span onClick={onDeselectAllCustom} style={{ cursor: 'pointer', color: '#94a3b8' }}>Rien</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 220, overflowY: 'auto' }}>
              {searchedEvents.map(evt => {
                const isChecked = customSelectedIds.has(evt.id);
                return (
                  <label
                    key={evt.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '5px 6px',
                      borderRadius: 6,
                      backgroundColor: isChecked ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
                      cursor: 'pointer',
                      fontSize: 11
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => onToggleCustomEvent(evt.id)}
                      style={{ accentColor: '#38bdf8' }}
                    />
                    <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: isChecked ? '#f8fafc' : '#64748b' }}>
                      {evt.titre}
                    </span>
                    <span style={{ fontSize: 9, color: '#64748b' }}>{formatYear(evt.date_debut)}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}