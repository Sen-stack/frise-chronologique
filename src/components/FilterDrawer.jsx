import React from 'react';
import { formatYear, DEFAULT_TAG_PALETTE } from '../utils/timelineMath.js';

export default function FilterDrawer({
  isOpen,
  onClose,
  filterMode,
  setFilterMode,
  availableTags = [],
  selectedTags = [],
  onToggleTag,
  onToggleFilterTag,
  onSelectAllTags,
  onDeselectAllTags,
  events = [],
  customSelectedIds = new Set(),
  onToggleCustomEvent,
  onSelectAllCustom,
  onDeselectAllCustom,
  searchQuery = '',
  setSearchQuery
}) {
  if (!isOpen) return null;

  const handleToggleTag = onToggleTag || onToggleFilterTag;

  const searchedEvents = events.filter(e =>
    (e.titre || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const areAllTagsSelected = availableTags.length > 0 && selectedTags.length === availableTags.length;
  const areNoTagsSelected = selectedTags.length === 0;

  const areAllCustomSelected = events.length > 0 && customSelectedIds.size === events.length;
  const areNoCustomSelected = customSelectedIds.size === 0;

  return (
    <div
      style={{
        position: 'absolute',
        top: 68,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 30,
        width: 360,
        maxHeight: 'calc(100vh - 140px)',
        backgroundColor: 'rgba(253, 251, 247, 0.95)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(180, 150, 120, 0.35)',
        borderRadius: 20,
        boxShadow: '0 20px 45px rgba(60, 45, 30, 0.18)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        color: '#2b2118',
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif"
      }}
    >
      {/* En-tête minéral */}
      <div
        style={{
          padding: '14px 18px',
          borderBottom: '1px solid rgba(180, 150, 120, 0.25)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'rgba(247, 243, 236, 0.7)'
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 13, color: '#78350f', letterSpacing: '0.3px' }}>
          Filtres d'affichage
        </span>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(0, 0, 0, 0.05)',
            border: 'none',
            color: '#78716c',
            cursor: 'pointer',
            fontSize: 13,
            width: 26,
            height: 26,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ✕
        </button>
      </div>

      {/* Onglets sélecteurs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          padding: 4,
          margin: '12px 14px 0 14px',
          gap: 6,
          backgroundColor: 'rgba(235, 227, 215, 0.65)',
          borderRadius: 12,
          border: '1px solid rgba(180, 150, 120, 0.25)'
        }}
      >
        <button
          onClick={() => setFilterMode('tags')}
          style={{
            padding: '7px 0',
            fontSize: 11,
            fontWeight: 600,
            borderRadius: 8,
            border: 'none',
            cursor: 'pointer',
            backgroundColor: filterMode === 'tags' ? '#ffffff' : 'transparent',
            color: filterMode === 'tags' ? '#78350f' : '#78716c',
            boxShadow: filterMode === 'tags' ? '0 2px 6px rgba(60, 45, 30, 0.1)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          Par tags
        </button>
        <button
          onClick={() => setFilterMode('custom')}
          style={{
            padding: '7px 0',
            fontSize: 11,
            fontWeight: 600,
            borderRadius: 8,
            border: 'none',
            cursor: 'pointer',
            backgroundColor: filterMode === 'custom' ? '#ffffff' : 'transparent',
            color: filterMode === 'custom' ? '#78350f' : '#78716c',
            boxShadow: filterMode === 'custom' ? '0 2px 6px rgba(60, 45, 30, 0.1)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          Éléments isolés
        </button>
      </div>

      {/* Contenu déroulant */}
      <div style={{ padding: '14px 16px', overflowY: 'auto', flex: 1, fontSize: 12 }}>
        
        {/* --- ONGLET 1 : PAR TAGS --- */}
        {filterMode === 'tags' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Barre Tous / Aucun */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 4 }}>
              <span style={{ fontSize: 10, color: '#8c7e72', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Visibilité
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  onClick={onSelectAllTags}
                  style={{
                    padding: '3px 10px',
                    borderRadius: 12,
                    border: '1px solid',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    borderColor: areAllTagsSelected ? '#b45309' : 'rgba(180, 150, 120, 0.4)',
                    backgroundColor: areAllTagsSelected ? '#b45309' : 'transparent',
                    color: areAllTagsSelected ? '#ffffff' : '#78716c'
                  }}
                >
                  Tous
                </button>
                <button
                  type="button"
                  onClick={onDeselectAllTags}
                  style={{
                    padding: '3px 10px',
                    borderRadius: 12,
                    border: '1px solid',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    borderColor: areNoTagsSelected ? '#b91c1c' : 'rgba(180, 150, 120, 0.4)',
                    backgroundColor: areNoTagsSelected ? '#b91c1c' : 'transparent',
                    color: areNoTagsSelected ? '#ffffff' : '#78716c'
                  }}
                >
                  Aucun
                </button>
              </div>
            </div>

            {/* Liste des tags */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {availableTags.map(tag => {
                const isChecked = selectedTags.includes(tag);
                const tagColor = (DEFAULT_TAG_PALETTE[tag] && DEFAULT_TAG_PALETTE[tag].stroke) || '#b45309';
                return (
                  <div
                    key={tag}
                    onClick={() => {
                      if (handleToggleTag) handleToggleTag(tag);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 10px',
                      borderRadius: 10,
                      backgroundColor: isChecked ? 'rgba(255, 255, 255, 0.85)' : 'rgba(240, 235, 226, 0.4)',
                      border: `1px solid ${isChecked ? 'rgba(180, 150, 120, 0.45)' : 'transparent'}`,
                      cursor: 'pointer',
                      boxShadow: isChecked ? '0 1px 4px rgba(60, 45, 30, 0.06)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      readOnly
                      style={{ cursor: 'pointer', pointerEvents: 'none', accentColor: tagColor }}
                    />
                    <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: tagColor }} />
                    <span style={{ flex: 1, fontWeight: isChecked ? 600 : 400, color: isChecked ? '#2b2118' : '#8c7e72' }}>
                      {tag}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* --- ONGLET 2 : ÉLÉMENTS ISOLÉS --- */}
        {filterMode === 'custom' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input
              type="text"
              placeholder="Rechercher un événement..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                backgroundColor: '#ffffff',
                border: '1px solid rgba(180, 150, 120, 0.45)',
                borderRadius: 10,
                padding: '8px 12px',
                color: '#2b2118',
                fontSize: 11,
                outline: 'none'
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 10, color: '#8c7e72', fontWeight: 600 }}>
                {customSelectedIds.size} visible(s) / {events.length}
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  onClick={onSelectAllCustom}
                  style={{
                    padding: '3px 10px',
                    borderRadius: 12,
                    border: '1px solid',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    borderColor: areAllCustomSelected ? '#b45309' : 'rgba(180, 150, 120, 0.4)',
                    backgroundColor: areAllCustomSelected ? '#b45309' : 'transparent',
                    color: areAllCustomSelected ? '#ffffff' : '#78716c'
                  }}
                >
                  Tous
                </button>
                <button
                  type="button"
                  onClick={onDeselectAllCustom}
                  style={{
                    padding: '3px 10px',
                    borderRadius: 12,
                    border: '1px solid',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    borderColor: areNoCustomSelected ? '#b91c1c' : 'rgba(180, 150, 120, 0.4)',
                    backgroundColor: areNoCustomSelected ? '#b91c1c' : 'transparent',
                    color: areNoCustomSelected ? '#ffffff' : '#78716c'
                  }}
                >
                  Rien
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 240, overflowY: 'auto' }}>
              {searchedEvents.map(evt => {
                const isChecked = customSelectedIds.has(evt.id);
                return (
                  <div
                    key={evt.id}
                    onClick={() => {
                      if (onToggleCustomEvent) onToggleCustomEvent(evt.id);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '7px 10px',
                      borderRadius: 8,
                      backgroundColor: isChecked ? 'rgba(255, 255, 255, 0.85)' : 'transparent',
                      border: `1px solid ${isChecked ? 'rgba(180, 150, 120, 0.35)' : 'transparent'}`,
                      cursor: 'pointer',
                      fontSize: 11,
                      transition: 'all 0.12s ease'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      readOnly
                      style={{ accentColor: '#b45309', cursor: 'pointer', pointerEvents: 'none' }}
                    />
                    <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: isChecked ? '#2b2118' : '#8c7e72' }}>
                      {evt.titre}
                    </span>
                    <span style={{ fontSize: 9, color: '#8c7e72' }}>
                      {formatYear(evt.date_debut)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}