import React, { useState } from 'react';
import { formatYear, DEFAULT_TAG_PALETTE } from '../utils/timelineMath.js';

export default function FilterDrawer({
  isOpen = true,
  onToggleOpen,
  filterMode,
  setFilterMode,
  availableTags = [],
  selectedTags = [],
  onToggleTag,
  onSelectAllTags,
  onDeselectAllTags,
  availableGroups = [],
  selectedGroups = [],
  onToggleGroup,
  onSelectAllGroups,
  onDeselectAllGroups,
  events = [],
  customSelectedIds = new Set(),
  onToggleCustomEvent,
  onSelectAllCustom,
  onDeselectAllCustom,
  searchQuery = '',
  setSearchQuery,
  currentTheme = 'light'
}) {
  const isLight = currentTheme === 'light';
  const [isFilterSectionOpen, setIsFilterSectionOpen] = useState(false);

  const searchedEvents = events.filter(e =>
    (e.titre || '').toLowerCase().includes((searchQuery || '').toLowerCase())
  );

  const areAllTagsSelected = availableTags.length > 0 && selectedTags.length === availableTags.length;
  const areNoTagsSelected = selectedTags.length === 0;

  const areAllGroupsSelected = availableGroups.length > 0 && selectedGroups.length === availableGroups.length;
  const areNoGroupsSelected = selectedGroups.length === 0;

  const areAllCustomSelected = events.length > 0 && customSelectedIds.size === events.length;
  const areNoCustomSelected = customSelectedIds.size === 0;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0, // Descend jusqu'au bas complet de l'écran
        width: 300,
        maxWidth: '85vw',
        zIndex: 25,
        backgroundColor: isLight ? 'rgba(250, 248, 245, 0.97)' : 'rgba(15, 23, 42, 0.96)',
        backdropFilter: 'blur(20px)',
        borderRight: isLight ? '1px solid rgba(180, 150, 120, 0.3)' : '1px solid #334155',
        boxShadow: isOpen ? '10px 0 30px rgba(0, 0, 0, 0.1)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        color: isLight ? '#2b2118' : '#f8fafc',
        userSelect: 'none'
      }}
    >
      {/* Bouton pour replier ou déplier le menu latéral */}
      <button
        type="button"
        onClick={onToggleOpen}
        title={isOpen ? "Replier le menu" : "Afficher le menu"}
        style={{
          position: 'absolute',
          top: 18,
          left: '100%',
          width: 26,
          height: 34,
          backgroundColor: isLight ? 'rgba(250, 248, 245, 0.97)' : 'rgba(15, 23, 42, 0.96)',
          backdropFilter: 'blur(16px)',
          borderTop: isLight ? '1px solid rgba(180, 150, 120, 0.3)' : '1px solid #334155',
          borderRight: isLight ? '1px solid rgba(180, 150, 120, 0.3)' : '1px solid #334155',
          borderBottom: isLight ? '1px solid rgba(180, 150, 120, 0.3)' : '1px solid #334155',
          borderLeft: 'none',
          borderTopRightRadius: 8,
          borderBottomRightRadius: 8,
          boxShadow: '3px 2px 8px rgba(0, 0, 0, 0.08)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: isLight ? '#78350f' : '#38bdf8',
          fontSize: 12,
          fontWeight: 700
        }}
      >
        {isOpen ? '◀' : '▶'}
      </button>

      {/* Zone du haut : prête à recevoir le logo et le titre de l'application */}
      <div
        style={{
          padding: '24px 20px 16px 20px',
          borderBottom: isLight ? '1px solid rgba(180, 150, 120, 0.2)' : '1px solid #1e293b'
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', color: isLight ? '#2b2118' : '#ffffff' }}>
          CHRONOS
        </div>
      </div>

      {/* Corps du menu latéral avec ascenseur */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>

        {/* SECTION REPLIABLE : FILTRES */}
        <div
          style={{
            borderRadius: 10,
            border: isLight ? '1px solid rgba(180, 150, 120, 0.25)' : '1px solid #334155',
            backgroundColor: isLight ? 'rgba(255, 255, 255, 0.6)' : 'rgba(30, 41, 59, 0.4)',
            overflow: 'hidden'
          }}
        >
          {/* En-tête cliquable pour déplier/replier les filtres */}
          <div
            onClick={() => setIsFilterSectionOpen(!isFilterSectionOpen)}
            style={{
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              backgroundColor: isLight ? 'rgba(245, 240, 232, 0.6)' : 'rgba(30, 41, 59, 0.7)'
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', color: isLight ? '#78350f' : '#38bdf8' }}>
              Filtres
            </span>
            <span style={{ fontSize: 10, color: isLight ? '#78716c' : '#94a3b8' }}>
              {isFilterSectionOpen ? '▲' : '▼'}
            </span>
          </div>

          {/* Contenu dépliable des filtres */}
          {isFilterSectionOpen && (
            <div style={{ padding: '12px 10px 14px 10px' }}>
              
              {/* Onglets sélecteurs */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  padding: 2,
                  gap: 3,
                  backgroundColor: isLight ? 'rgba(235, 227, 215, 0.7)' : 'rgba(15, 23, 42, 0.7)',
                  borderRadius: 8,
                  marginBottom: 12
                }}
              >
                <button
                  type="button"
                  onClick={() => setFilterMode('tags')}
                  style={{
                    padding: '6px 0',
                    fontSize: 10,
                    fontWeight: 600,
                    borderRadius: 6,
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: filterMode === 'tags' ? (isLight ? '#ffffff' : '#0284c7') : 'transparent',
                    color: filterMode === 'tags' ? (isLight ? '#78350f' : '#ffffff') : (isLight ? '#78716c' : '#94a3b8')
                  }}
                >
                  Tags
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('groups')}
                  style={{
                    padding: '6px 0',
                    fontSize: 10,
                    fontWeight: 600,
                    borderRadius: 6,
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: filterMode === 'groups' ? (isLight ? '#ffffff' : '#0284c7') : 'transparent',
                    color: filterMode === 'groups' ? (isLight ? '#78350f' : '#ffffff') : (isLight ? '#78716c' : '#94a3b8')
                  }}
                >
                  Thèmes
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('custom')}
                  style={{
                    padding: '6px 0',
                    fontSize: 10,
                    fontWeight: 600,
                    borderRadius: 6,
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: filterMode === 'custom' ? (isLight ? '#ffffff' : '#0284c7') : 'transparent',
                    color: filterMode === 'custom' ? (isLight ? '#78350f' : '#ffffff') : (isLight ? '#78716c' : '#94a3b8')
                  }}
                >
                  Unitaires
                </button>
              </div>

              {/* 1. TAGS */}
              {filterMode === 'tags' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: isLight ? '#8c7e72' : '#94a3b8', textTransform: 'uppercase' }}>
                      Tags ({selectedTags.length}/{availableTags.length})
                    </span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        type="button"
                        onClick={onSelectAllTags}
                        style={{
                          padding: '2px 6px',
                          borderRadius: 6,
                          border: '1px solid',
                          fontSize: 9,
                          fontWeight: 600,
                          cursor: 'pointer',
                          borderColor: areAllTagsSelected ? '#b45309' : (isLight ? 'rgba(180, 150, 120, 0.4)' : '#475569'),
                          backgroundColor: areAllTagsSelected ? '#b45309' : 'transparent',
                          color: areAllTagsSelected ? '#ffffff' : (isLight ? '#78716c' : '#cbd5e1')
                        }}
                      >
                        Tous
                      </button>
                      <button
                        type="button"
                        onClick={onDeselectAllTags}
                        style={{
                          padding: '2px 6px',
                          borderRadius: 6,
                          border: '1px solid',
                          fontSize: 9,
                          fontWeight: 600,
                          cursor: 'pointer',
                          borderColor: areNoTagsSelected ? '#b91c1c' : (isLight ? 'rgba(180, 150, 120, 0.4)' : '#475569'),
                          backgroundColor: areNoTagsSelected ? '#b91c1c' : 'transparent',
                          color: areNoTagsSelected ? '#ffffff' : (isLight ? '#78716c' : '#cbd5e1')
                        }}
                      >
                        Aucun
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {availableTags.map(tag => {
                      const isChecked = selectedTags.includes(tag);
                      const tagColor = (DEFAULT_TAG_PALETTE[tag] && DEFAULT_TAG_PALETTE[tag].stroke) || '#b45309';
                      return (
                        <div
                          key={tag}
                          onClick={() => onToggleTag && onToggleTag(tag)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '6px 8px',
                            borderRadius: 6,
                            backgroundColor: isChecked
                              ? (isLight ? '#ffffff' : 'rgba(30, 41, 59, 0.8)')
                              : 'transparent',
                            border: `1px solid ${isChecked ? (isLight ? 'rgba(180, 150, 120, 0.4)' : '#475569') : 'transparent'}`,
                            cursor: 'pointer',
                            fontSize: 11
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            readOnly
                            style={{ cursor: 'pointer', pointerEvents: 'none', accentColor: tagColor }}
                          />
                          <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: tagColor }} />
                          <span style={{ flex: 1, fontWeight: isChecked ? 600 : 400, color: isLight ? '#2b2118' : '#f8fafc' }}>
                            {tag}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2. THÉMATIQUES */}
              {filterMode === 'groups' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: isLight ? '#8c7e72' : '#94a3b8', textTransform: 'uppercase' }}>
                      Thématiques ({selectedGroups.length}/{availableGroups.length})
                    </span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        type="button"
                        onClick={onSelectAllGroups}
                        style={{
                          padding: '2px 6px',
                          borderRadius: 6,
                          border: '1px solid',
                          fontSize: 9,
                          fontWeight: 600,
                          cursor: 'pointer',
                          borderColor: areAllGroupsSelected ? '#b45309' : (isLight ? 'rgba(180, 150, 120, 0.4)' : '#475569'),
                          backgroundColor: areAllGroupsSelected ? '#b45309' : 'transparent',
                          color: areAllGroupsSelected ? '#ffffff' : (isLight ? '#78716c' : '#cbd5e1')
                        }}
                      >
                        Toutes
                      </button>
                      <button
                        type="button"
                        onClick={onDeselectAllGroups}
                        style={{
                          padding: '2px 6px',
                          borderRadius: 6,
                          border: '1px solid',
                          fontSize: 9,
                          fontWeight: 600,
                          cursor: 'pointer',
                          borderColor: areNoGroupsSelected ? '#b91c1c' : (isLight ? 'rgba(180, 150, 120, 0.4)' : '#475569'),
                          backgroundColor: areNoGroupsSelected ? '#b91c1c' : 'transparent',
                          color: areNoGroupsSelected ? '#ffffff' : (isLight ? '#78716c' : '#cbd5e1')
                        }}
                      >
                        Aucune
                      </button>
                    </div>
                  </div>

                  {availableGroups.length === 0 ? (
                    <div style={{ fontSize: 11, color: isLight ? '#8c7e72' : '#94a3b8', fontStyle: 'italic', padding: '6px 2px' }}>
                      Aucune thématique définie.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {availableGroups.map(grp => {
                        const isChecked = selectedGroups.includes(grp);
                        return (
                          <div
                            key={grp}
                            onClick={() => onToggleGroup && onToggleGroup(grp)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              padding: '6px 8px',
                              borderRadius: 6,
                              backgroundColor: isChecked
                                ? (isLight ? '#ffffff' : 'rgba(30, 41, 59, 0.8)')
                                : 'transparent',
                              border: `1px solid ${isChecked ? (isLight ? 'rgba(180, 150, 120, 0.4)' : '#475569') : 'transparent'}`,
                              cursor: 'pointer',
                              fontSize: 11
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              readOnly
                              style={{ cursor: 'pointer', pointerEvents: 'none', accentColor: '#0284c7' }}
                            />
                            <span style={{ flex: 1, fontWeight: isChecked ? 600 : 400, color: isLight ? '#2b2118' : '#f8fafc' }}>
                              {grp}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* 3. ÉVÉNEMENTS UNITAIRES */}
              {filterMode === 'custom' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      backgroundColor: isLight ? '#ffffff' : '#1e293b',
                      border: isLight ? '1px solid rgba(180, 150, 120, 0.45)' : '1px solid #475569',
                      borderRadius: 6,
                      padding: '6px 8px',
                      color: isLight ? '#2b2118' : '#f8fafc',
                      fontSize: 11,
                      outline: 'none'
                    }}
                  />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 9, color: isLight ? '#8c7e72' : '#94a3b8', fontWeight: 600 }}>
                      {customSelectedIds.size} / {events.length}
                    </span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        type="button"
                        onClick={onSelectAllCustom}
                        style={{
                          padding: '2px 6px',
                          borderRadius: 6,
                          border: '1px solid',
                          fontSize: 9,
                          fontWeight: 600,
                          cursor: 'pointer',
                          borderColor: areAllCustomSelected ? '#b45309' : (isLight ? 'rgba(180, 150, 120, 0.4)' : '#475569'),
                          backgroundColor: areAllCustomSelected ? '#b45309' : 'transparent',
                          color: areAllCustomSelected ? '#ffffff' : (isLight ? '#78716c' : '#cbd5e1')
                        }}
                      >
                        Tous
                      </button>
                      <button
                        type="button"
                        onClick={onDeselectAllCustom}
                        style={{
                          padding: '2px 6px',
                          borderRadius: 6,
                          border: '1px solid',
                          fontSize: 9,
                          fontWeight: 600,
                          cursor: 'pointer',
                          borderColor: areNoCustomSelected ? '#b91c1c' : (isLight ? 'rgba(180, 150, 120, 0.4)' : '#475569'),
                          backgroundColor: areNoCustomSelected ? '#b91c1c' : 'transparent',
                          color: areNoCustomSelected ? '#ffffff' : (isLight ? '#78716c' : '#cbd5e1')
                        }}
                      >
                        Rien
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 180, overflowY: 'auto' }}>
                    {searchedEvents.map(evt => {
                      const isChecked = customSelectedIds.has(evt.id);
                      return (
                        <div
                          key={evt.id}
                          onClick={() => onToggleCustomEvent && onToggleCustomEvent(evt.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '5px 6px',
                            borderRadius: 6,
                            backgroundColor: isChecked
                              ? (isLight ? '#ffffff' : 'rgba(30, 41, 59, 0.8)')
                              : 'transparent',
                            border: `1px solid ${isChecked ? (isLight ? 'rgba(180, 150, 120, 0.35)' : '#475569') : 'transparent'}`,
                            cursor: 'pointer',
                            fontSize: 10
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            readOnly
                            style={{ accentColor: '#b45309', cursor: 'pointer', pointerEvents: 'none' }}
                          />
                          <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: isChecked ? (isLight ? '#2b2118' : '#f8fafc') : (isLight ? '#8c7e72' : '#94a3b8') }}>
                            {evt.titre}
                          </span>
                          <span style={{ fontSize: 9, color: isLight ? '#8c7e72' : '#94a3b8' }}>
                            {formatYear(evt.date_debut)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

      </div>
    </div>
  );
}