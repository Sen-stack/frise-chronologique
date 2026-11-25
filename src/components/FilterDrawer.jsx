import React, { useState, useEffect } from 'react';
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
  currentTheme = 'light',
  setCurrentTheme,
  mapLayers = {
    worldEmpires: true,
    subDivisions: true,
    tradeRoutes: false,
    markers: true
  },
  onToggleMapLayer
}) {
  const isLight = currentTheme === 'light';
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [isFilterSectionOpen, setIsFilterSectionOpen] = useState(true);
  const [isLayersSectionOpen, setIsLayersSectionOpen] = useState(true);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const searchedEvents = events.filter(e =>
    (e.titre || '').toLowerCase().includes((searchQuery || '').toLowerCase())
  );

  const areAllTagsSelected = availableTags.length > 0 && selectedTags.length === availableTags.length;
  const areNoTagsSelected = selectedTags.length === 0;

  const areAllGroupsSelected = availableGroups.length > 0 && selectedGroups.length === availableGroups.length;
  const areNoGroupsSelected = selectedGroups.length === 0;

  const areAllCustomSelected = events.length > 0 && customSelectedIds.size === events.length;
  const areNoCustomSelected = customSelectedIds.size === 0;

  const baseBg = isLight ? '#eaf0f6' : '#0f172a';
  const wellBg = isLight ? '#dfe6ee' : '#1e293b';
  const textMain = isLight ? '#1e293b' : '#f8fafc';
  const textMuted = isLight ? '#64748b' : '#94a3b8';
  const accentColor = isLight ? '#5b4fe8' : '#38bdf8';

  const cardShadow = isLight
    ? '4px 4px 10px rgba(166, 180, 200, 0.45), -4px -4px 10px rgba(255, 255, 255, 0.85)'
    : '0 4px 12px rgba(0, 0, 0, 0.35)';

  const insetShadow = isLight
    ? 'inset 2px 2px 5px rgba(166, 180, 200, 0.55), inset -2px -2px 5px rgba(255, 255, 255, 0.85)'
    : 'inset 2px 2px 5px rgba(0, 0, 0, 0.4)';

  const borderLight = isLight ? '1px solid rgba(255, 255, 255, 0.85)' : '1px solid #334155';

  const innerContent = (
    <>
      {/* En-tête : CHRONOS + Bouton icône seule Jour/Nuit (+ Fermer sur mobile) */}
      <div
        style={{
          padding: '16px 16px 12px 16px',
          borderBottom: isLight ? '1px solid rgba(166, 180, 200, 0.35)' : '1px solid #1e293b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', color: textMain }}>
          CHRONOS
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            onClick={() => setCurrentTheme && setCurrentTheme(t => (t === 'light' ? 'dark' : 'light'))}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              backgroundColor: baseBg,
              color: accentColor,
              border: borderLight,
              boxShadow: cardShadow,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0
            }}
            title={isLight ? 'Mode sombre' : 'Mode clair'}
          >
            {isLight ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            )}
          </button>

          {isMobile && (
            <button
              type="button"
              onClick={onToggleOpen}
              title="Fermer"
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                backgroundColor: baseBg,
                color: textMuted,
                border: borderLight,
                boxShadow: cardShadow,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Corps déroulant */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* SECTION 1 : CALQUE */}
        <div
          style={{
            borderRadius: 16,
            border: borderLight,
            backgroundColor: baseBg,
            boxShadow: cardShadow,
            overflow: 'hidden',
            flexShrink: 0
          }}
        >
          <div
            onClick={() => setIsLayersSectionOpen(!isLayersSectionOpen)}
            style={{
              padding: '11px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              borderBottom: isLayersSectionOpen ? (isLight ? '1px solid rgba(166, 180, 200, 0.25)' : '1px solid #334155') : 'none'
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.7px', textTransform: 'uppercase', color: accentColor }}>
              Calque
            </span>
            <span style={{ fontSize: 10, color: textMuted }}>
              {isLayersSectionOpen ? '▲' : '▼'}
            </span>
          </div>

          {isLayersSectionOpen && (
            <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 7 }}>
              {[
                { key: 'worldEmpires', label: 'Empires & Royaumes mondiaux' },
                { key: 'subDivisions', label: 'Provinces & Peuples régionaux' },
                { key: 'tradeRoutes', label: 'Voies & Routes de la Soie' },
                { key: 'markers', label: "Jalons & Lieux d'événements" }
              ].map((layer) => {
                const checked = !!mapLayers[layer.key];
                return (
                  <label
                    key={layer.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '7px 10px',
                      borderRadius: 10,
                      cursor: 'pointer',
                      backgroundColor: checked ? (isLight ? '#ffffff' : 'rgba(30, 41, 59, 0.85)') : wellBg,
                      boxShadow: checked ? '2px 2px 5px rgba(166, 180, 200, 0.35)' : 'none',
                      fontSize: 11,
                      color: textMain
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggleMapLayer && onToggleMapLayer(layer.key)}
                      style={{ accentColor: accentColor, cursor: 'pointer' }}
                    />
                    <span style={{ flex: 1, fontWeight: checked ? 600 : 400 }}>
                      {layer.label}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* SECTION 2 : FILTRES */}
        <div
          style={{
            borderRadius: 16,
            border: borderLight,
            backgroundColor: baseBg,
            boxShadow: cardShadow,
            overflow: 'hidden',
            flexShrink: 0
          }}
        >
          <div
            onClick={() => setIsFilterSectionOpen(!isFilterSectionOpen)}
            style={{
              padding: '11px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              borderBottom: isFilterSectionOpen ? (isLight ? '1px solid rgba(166, 180, 200, 0.25)' : '1px solid #334155') : 'none'
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.7px', textTransform: 'uppercase', color: accentColor }}>
              Filtres
            </span>
            <span style={{ fontSize: 10, color: textMuted }}>
              {isFilterSectionOpen ? '▲' : '▼'}
            </span>
          </div>

          {isFilterSectionOpen && (
            <div style={{ padding: '12px 10px 14px 10px' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  padding: 3,
                  gap: 4,
                  backgroundColor: wellBg,
                  boxShadow: insetShadow,
                  borderRadius: 11,
                  marginBottom: 12
                }}
              >
                {[
                  { id: 'tags', label: 'Tags' },
                  { id: 'groups', label: 'Thèmes' },
                  { id: 'custom', label: 'Unitaires' }
                ].map(tab => {
                  const active = filterMode === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setFilterMode(tab.id)}
                      style={{
                        padding: '6px 0',
                        fontSize: 10.5,
                        fontWeight: 700,
                        borderRadius: 8,
                        border: 'none',
                        cursor: 'pointer',
                        backgroundColor: active ? (isLight ? '#eaf0f6' : '#0284c7') : 'transparent',
                        color: active ? accentColor : textMuted,
                        boxShadow: active && isLight ? '2px 2px 5px rgba(166, 180, 200, 0.5), -2px -2px 5px rgba(255, 255, 255, 0.9)' : 'none'
                      }}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {filterMode === 'tags' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 9.5, fontWeight: 700, color: textMuted, textTransform: 'uppercase' }}>
                      Tags ({selectedTags.length}/{availableTags.length})
                    </span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        type="button"
                        onClick={onSelectAllTags}
                        style={{
                          padding: '3px 7px',
                          borderRadius: 7,
                          border: 'none',
                          fontSize: 9.5,
                          fontWeight: 700,
                          cursor: 'pointer',
                          backgroundColor: areAllTagsSelected ? accentColor : wellBg,
                          color: areAllTagsSelected ? '#ffffff' : textMuted
                        }}
                      >
                        Tous
                      </button>
                      <button
                        type="button"
                        onClick={onDeselectAllTags}
                        style={{
                          padding: '3px 7px',
                          borderRadius: 7,
                          border: 'none',
                          fontSize: 9.5,
                          fontWeight: 700,
                          cursor: 'pointer',
                          backgroundColor: areNoTagsSelected ? '#e11d48' : wellBg,
                          color: areNoTagsSelected ? '#ffffff' : textMuted
                        }}
                      >
                        Aucun
                      </button>
                    </div>
                  </div>

                  {/* Conteneur avec sa propre barre de scroll comme Unitaires */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 220, overflowY: 'auto', paddingRight: 3 }}>
                    {availableTags.map(tag => {
                      const isChecked = selectedTags.includes(tag);
                      const tagColor = (DEFAULT_TAG_PALETTE[tag] && DEFAULT_TAG_PALETTE[tag].stroke) || accentColor;
                      return (
                        <div
                          key={tag}
                          onClick={() => onToggleTag && onToggleTag(tag)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '6px 9px',
                            borderRadius: 9,
                            backgroundColor: isChecked ? (isLight ? '#ffffff' : 'rgba(30, 41, 59, 0.85)') : wellBg,
                            boxShadow: isChecked ? '2px 2px 5px rgba(166, 180, 200, 0.35)' : 'none',
                            cursor: 'pointer',
                            fontSize: 11,
                            flexShrink: 0
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            readOnly
                            style={{ cursor: 'pointer', pointerEvents: 'none', accentColor: tagColor }}
                          />
                          <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: tagColor, flexShrink: 0 }} />
                          <span style={{ flex: 1, fontWeight: isChecked ? 600 : 400, color: textMain }}>
                            {tag}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {filterMode === 'groups' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 9.5, fontWeight: 700, color: textMuted, textTransform: 'uppercase' }}>
                      Thématiques ({selectedGroups.length}/{availableGroups.length})
                    </span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        type="button"
                        onClick={onSelectAllGroups}
                        style={{
                          padding: '3px 7px',
                          borderRadius: 7,
                          border: 'none',
                          fontSize: 9.5,
                          fontWeight: 700,
                          cursor: 'pointer',
                          backgroundColor: areAllGroupsSelected ? accentColor : wellBg,
                          color: areAllGroupsSelected ? '#ffffff' : textMuted
                        }}
                      >
                        Toutes
                      </button>
                      <button
                        type="button"
                        onClick={onDeselectAllGroups}
                        style={{
                          padding: '3px 7px',
                          borderRadius: 7,
                          border: 'none',
                          fontSize: 9.5,
                          fontWeight: 700,
                          cursor: 'pointer',
                          backgroundColor: areNoGroupsSelected ? '#e11d48' : wellBg,
                          color: areNoGroupsSelected ? '#ffffff' : textMuted
                        }}
                      >
                        Aucune
                      </button>
                    </div>
                  </div>

                  {availableGroups.length === 0 ? (
                    <div style={{ fontSize: 11, color: textMuted, fontStyle: 'italic', padding: '6px 2px' }}>
                      Aucune thématique définie.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 220, overflowY: 'auto', paddingRight: 3 }}>
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
                              padding: '6px 9px',
                              borderRadius: 9,
                              backgroundColor: isChecked ? (isLight ? '#ffffff' : 'rgba(30, 41, 59, 0.85)') : wellBg,
                              boxShadow: isChecked ? '2px 2px 5px rgba(166, 180, 200, 0.35)' : 'none',
                              cursor: 'pointer',
                              fontSize: 11,
                              flexShrink: 0
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              readOnly
                              style={{ cursor: 'pointer', pointerEvents: 'none', accentColor: accentColor }}
                            />
                            <span style={{ flex: 1, fontWeight: isChecked ? 600 : 400, color: textMain }}>
                              {grp}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

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
                      backgroundColor: wellBg,
                      boxShadow: insetShadow,
                      border: 'none',
                      borderRadius: 9,
                      padding: '7px 10px',
                      color: textMain,
                      fontSize: 11,
                      outline: 'none'
                    }}
                  />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 9.5, color: textMuted, fontWeight: 700 }}>
                      {customSelectedIds.size} / {events.length}
                    </span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        type="button"
                        onClick={onSelectAllCustom}
                        style={{
                          padding: '3px 7px',
                          borderRadius: 7,
                          border: 'none',
                          fontSize: 9.5,
                          fontWeight: 700,
                          cursor: 'pointer',
                          backgroundColor: areAllCustomSelected ? accentColor : wellBg,
                          color: areAllCustomSelected ? '#ffffff' : textMuted
                        }}
                      >
                        Tous
                      </button>
                      <button
                        type="button"
                        onClick={onDeselectAllCustom}
                        style={{
                          padding: '3px 7px',
                          borderRadius: 7,
                          border: 'none',
                          fontSize: 9.5,
                          fontWeight: 700,
                          cursor: 'pointer',
                          backgroundColor: areNoCustomSelected ? '#e11d48' : wellBg,
                          color: areNoCustomSelected ? '#ffffff' : textMuted
                        }}
                      >
                        Rien
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 200, overflowY: 'auto', paddingRight: 3 }}>
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
                            padding: '6px 8px',
                            borderRadius: 8,
                            backgroundColor: isChecked ? (isLight ? '#ffffff' : 'rgba(30, 41, 59, 0.85)') : wellBg,
                            cursor: 'pointer',
                            fontSize: 10.5,
                            flexShrink: 0
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            readOnly
                            style={{ accentColor: accentColor, cursor: 'pointer', pointerEvents: 'none' }}
                          />
                          <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: isChecked ? textMain : textMuted, fontWeight: isChecked ? 600 : 400 }}>
                            {evt.titre}
                          </span>
                          <span style={{ fontSize: 9.5, color: textMuted }}>
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
    </>
  );

  // Version mobile : pop-up modale uniquement quand ouverte
  if (isMobile) {
    if (!isOpen) return null;
    return (
      <div
        onClick={onToggleOpen}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 60,
          backgroundColor: 'rgba(15, 23, 42, 0.42)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: 420,
            maxHeight: '85dvh',
            backgroundColor: baseBg,
            borderRadius: 24,
            border: borderLight,
            boxShadow: '12px 12px 28px rgba(15, 23, 42, 0.35)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
            color: textMain,
            userSelect: 'none'
          }}
        >
          {innerContent}
        </div>
      </div>
    );
  }

  // Version navigateur PC : volet latéral gauche
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        width: 300,
        maxWidth: '85vw',
        zIndex: 35,
        backgroundColor: baseBg,
        borderRight: borderLight,
        boxShadow: isOpen ? '8px 0 24px rgba(166, 180, 200, 0.45)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        color: textMain,
        userSelect: 'none'
      }}
    >
      {/* Bouton replier / déplier */}
      <button
        type="button"
        onClick={onToggleOpen}
        title={isOpen ? 'Replier le menu' : 'Afficher le menu'}
        style={{
          position: 'absolute',
          top: 86,
          left: '100%',
          width: 28,
          height: 38,
          backgroundColor: baseBg,
          borderTop: borderLight,
          borderRight: borderLight,
          borderBottom: borderLight,
          borderLeft: 'none',
          borderTopRightRadius: 10,
          borderBottomRightRadius: 10,
          boxShadow: '4px 3px 10px rgba(166, 180, 200, 0.45)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: accentColor,
          fontSize: 12,
          fontWeight: 700,
          zIndex: 36
        }}
      >
        {isOpen ? '◀' : '▶'}
      </button>

      {innerContent}
    </div>
  );
}