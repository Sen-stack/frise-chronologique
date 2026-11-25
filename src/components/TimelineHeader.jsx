import React from 'react';
import { TIMELINE_CHAPTERS } from '../utils/timelineMath.js';

export default function TimelineHeader({
  headerHeight,
  isMobileScreen,
  activeChapter,
  onSelectChapter,
  onResetFullView,
  onOpenCreateModal,
  onOpenFilterModal,
  activeSelection,
  onOpenEditDrawer,
  onStartDrawTerritory,
  onDeleteEvent,
  drawingTerritoryEvent,
  onCancelDrawing,
  drawUiState,
  subBarRef,
  isReliefActive,
  onToggleRelief,
  onRecalibrate,
  isAtlasOpen,
  onToggleAtlas
}) {
  const btnSize = isMobileScreen ? 28 : 32;
  const drawColor = drawingTerritoryEvent?.couleur || '#0284c7';

  const tools = [
    {
      id: 'polygon',
      title: 'Zone / Polygone',
      icon: (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 3 20 9 17 20 7 20 4 9 12 3" />
        </svg>
      )
    },
    {
      id: 'line',
      title: 'Trait droit (2 clics)',
      icon: (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
          <line x1="5" y1="19" x2="19" y2="5" />
        </svg>
      )
    },
    {
      id: 'curve',
      title: 'Trait courbé (3 clics)',
      icon: (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
          <path d="M4 18 Q 12 3, 20 18" />
        </svg>
      )
    },
    {
      id: 'arrow',
      title: 'Flèche droite (2 clics)',
      icon: (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="19" x2="19" y2="5" />
          <polyline points="9 5 19 5 19 15" />
        </svg>
      )
    },
    {
      id: 'curvedArrow',
      title: 'Flèche courbée (3 clics)',
      icon: (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 17 Q 11 4, 19 12" />
          <polyline points="14 12 19 12 19 7" />
        </svg>
      )
    }
  ];

  return (
    <>
      <header style={{
        height: headerHeight,
        minHeight: headerHeight,
        width: '100%',
        backgroundColor: '#eaf0f6',
        display: 'flex',
        flexDirection: isMobileScreen ? 'column' : 'row',
        alignItems: 'center',
        justifyContent: isMobileScreen ? 'center' : 'space-between',
        gap: isMobileScreen ? 5 : 0,
        padding: isMobileScreen ? '4px 8px' : '0 10px 0 46px',
        boxSizing: 'border-box',
        zIndex: 30,
        boxShadow: drawingTerritoryEvent ? 'none' : '0 4px 14px rgba(166, 180, 200, 0.35)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.6)'
      }}>

        {isMobileScreen ? (
          <>
            <div style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                {/* Bouton Filtrer style Fnac */}
                <button
                  type="button"
                  onClick={onOpenFilterModal}
                  title="Filtrer & Calques"
                  style={{
                    height: btnSize,
                    padding: '0 9px',
                    borderRadius: 14,
                    backgroundColor: '#eaf0f6',
                    border: '1px solid rgba(255, 255, 255, 0.85)',
                    boxShadow: '2px 2px 6px rgba(166, 180, 200, 0.5), -2px -2px 6px rgba(255, 255, 255, 0.9)',
                    color: '#5b4fe8',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 10.5,
                    fontWeight: 700
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="4" y1="21" x2="4" y2="14" />
                    <line x1="4" y1="10" x2="4" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12" y2="3" />
                    <line x1="20" y1="21" x2="20" y2="16" />
                    <line x1="20" y1="12" x2="20" y2="3" />
                    <line x1="1" y1="14" x2="7" y2="14" />
                    <line x1="9" y1="8" x2="15" y2="8" />
                    <line x1="17" y1="16" x2="23" y2="16" />
                  </svg>
                  <span>Filtrer</span>
                </button>

                <button
                  type="button"
                  onClick={onResetFullView}
                  title="Afficher toute l'époque (Vue globale)"
                  style={{
                    width: btnSize,
                    height: btnSize,
                    borderRadius: '50%',
                    backgroundColor: '#eaf0f6',
                    border: '1px solid rgba(255, 255, 255, 0.8)',
                    boxShadow: '2px 2px 6px rgba(166, 180, 200, 0.5), -2px -2px 6px rgba(255, 255, 255, 0.9)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#243242" strokeWidth="2.4" strokeLinecap="round">
                    <path d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={onOpenCreateModal}
                  title="Ajouter un événement"
                  style={{
                    width: btnSize,
                    height: btnSize,
                    borderRadius: '50%',
                    backgroundColor: '#eaf0f6',
                    border: '1px solid rgba(255, 255, 255, 0.8)',
                    boxShadow: '2px 2px 6px rgba(166, 180, 200, 0.5), -2px -2px 6px rgba(255, 255, 255, 0.9)',
                    color: '#0284c7',
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0
                  }}
                >
                  +
                </button>

                {activeSelection && (
                  <>
                    <button
                      type="button"
                      onClick={() => onOpenEditDrawer(activeSelection)}
                      title={`Modifier "${activeSelection.titre}"`}
                      style={{
                        width: btnSize,
                        height: btnSize,
                        borderRadius: '50%',
                        backgroundColor: '#eaf0f6',
                        border: '1px solid rgba(255, 255, 255, 0.8)',
                        boxShadow: '2px 2px 6px rgba(166, 180, 200, 0.5), -2px -2px 6px rgba(255, 255, 255, 0.9)',
                        color: '#d97706',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0
                      }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                      </svg>
                    </button>

                    <button
                      type="button"
                      onClick={() => onStartDrawTerritory(activeSelection)}
                      title={`Dessiner sur la carte pour "${activeSelection.titre}"`}
                      style={{
                        width: btnSize,
                        height: btnSize,
                        borderRadius: '50%',
                        backgroundColor: drawingTerritoryEvent?.id === activeSelection.id ? '#e0f2fe' : '#eaf0f6',
                        border: drawingTerritoryEvent?.id === activeSelection.id ? '1px solid #0284c7' : '1px solid rgba(255, 255, 255, 0.8)',
                        boxShadow: drawingTerritoryEvent?.id === activeSelection.id
                          ? 'inset 2px 2px 4px rgba(166, 180, 200, 0.6), inset -2px -2px 4px rgba(255, 255, 255, 0.9)'
                          : '2px 2px 6px rgba(166, 180, 200, 0.5), -2px -2px 6px rgba(255, 255, 255, 0.9)',
                        color: activeSelection.zone_geojson || drawingTerritoryEvent?.id === activeSelection.id ? '#0284c7' : '#0f766e',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0
                      }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
                      </svg>
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteEvent(activeSelection)}
                      title={`Supprimer "${activeSelection.titre}"`}
                      style={{
                        width: btnSize,
                        height: btnSize,
                        borderRadius: '50%',
                        backgroundColor: '#eaf0f6',
                        border: '1px solid rgba(255, 255, 255, 0.8)',
                        boxShadow: '2px 2px 6px rgba(166, 180, 200, 0.5), -2px -2px 6px rgba(255, 255, 255, 0.9)',
                        color: '#e11d48',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0
                      }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <button
                  type="button"
                  onClick={onToggleRelief}
                  title={isReliefActive ? "Désactiver le relief" : "Activer le relief"}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '4px 8px',
                    borderRadius: 14,
                    backgroundColor: '#eaf0f6',
                    border: '1px solid rgba(255, 255, 255, 0.8)',
                    boxShadow: isReliefActive
                      ? 'inset 2px 2px 4px rgba(166, 180, 200, 0.6), inset -2px -2px 4px rgba(255, 255, 255, 0.9)'
                      : '2px 2px 6px rgba(166, 180, 200, 0.5), -2px -2px 6px rgba(255, 255, 255, 0.9)',
                    cursor: 'pointer',
                    color: '#334155',
                    fontSize: 10,
                    fontWeight: 600
                  }}
                >
                  <span style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    backgroundColor: isReliefActive ? '#10b981' : '#94a3b8'
                  }} />
                  <span>Relief</span>
                </button>

                <button
                  type="button"
                  onClick={onRecalibrate}
                  title="Recalibrer / Resynchroniser la carte"
                  style={{
                    width: btnSize,
                    height: btnSize,
                    borderRadius: '50%',
                    backgroundColor: '#eaf0f6',
                    border: '1px solid rgba(255, 255, 255, 0.8)',
                    boxShadow: '2px 2px 6px rgba(166, 180, 200, 0.5), -2px -2px 6px rgba(255, 255, 255, 0.9)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0
                  }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="#5b4fe8">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </button>

                <div
                  onClick={onToggleAtlas}
                  title={isAtlasOpen ? "Masquer la carte" : "Afficher la carte"}
                  style={{
                    width: 18,
                    height: btnSize,
                    backgroundColor: isAtlasOpen ? '#10b981' : '#d8e2ec',
                    borderRadius: 10,
                    padding: 2,
                    boxSizing: 'border-box',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: isAtlasOpen ? 'flex-start' : 'flex-end',
                    alignItems: 'center',
                    transition: 'background-color 0.2s ease',
                    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.18)'
                  }}
                >
                  <div style={{
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    backgroundColor: '#ffffff',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 8,
                    fontWeight: 800,
                    color: isAtlasOpen ? '#10b981' : '#94a3b8'
                  }}>
                    {isAtlasOpen ? '✓' : ''}
                  </div>
                </div>
              </div>
            </div>

            <div style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#e2e9f0',
              padding: 3,
              borderRadius: 16,
              gap: 3,
              boxSizing: 'border-box',
              boxShadow: 'inset 2px 2px 5px rgba(166, 180, 200, 0.6), inset -2px -2px 5px rgba(255, 255, 255, 0.9)'
            }}>
              {TIMELINE_CHAPTERS.map(ch => {
                const isActive = activeChapter === ch.id;
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => onSelectChapter(ch.id)}
                    style={{
                      flex: 1,
                      padding: '4px 6px',
                      backgroundColor: isActive ? '#eaf0f6' : 'transparent',
                      color: isActive ? '#243242' : '#718096',
                      border: isActive ? '1px solid rgba(255, 255, 255, 0.7)' : 'none',
                      borderRadius: 13,
                      fontSize: 10,
                      fontWeight: isActive ? 700 : 500,
                      whiteSpace: 'nowrap',
                      cursor: 'pointer',
                      boxShadow: isActive ? '2px 2px 5px rgba(166, 180, 200, 0.5), -2px -2px 5px rgba(255, 255, 255, 0.95)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {ch.label}
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                type="button"
                onClick={onResetFullView}
                title="Afficher toute l'époque (Vue globale)"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  backgroundColor: '#eaf0f6',
                  border: '1px solid rgba(255, 255, 255, 0.8)',
                  boxShadow: '3px 3px 8px rgba(166, 180, 200, 0.5), -3px -3px 8px rgba(255, 255, 255, 0.9)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#243242" strokeWidth="2.4" strokeLinecap="round">
                  <path d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4" />
                </svg>
              </button>

              <button
                type="button"
                onClick={onOpenCreateModal}
                title="Ajouter un événement"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  backgroundColor: '#eaf0f6',
                  border: '1px solid rgba(255, 255, 255, 0.8)',
                  boxShadow: '3px 3px 8px rgba(166, 180, 200, 0.5), -3px -3px 8px rgba(255, 255, 255, 0.9)',
                  color: '#0284c7',
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0
                }}
              >
                +
              </button>

              {activeSelection && (
                <>
                  <button
                    type="button"
                    onClick={() => onOpenEditDrawer(activeSelection)}
                    title={`Modifier "${activeSelection.titre}"`}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      backgroundColor: '#eaf0f6',
                      border: '1px solid rgba(255, 255, 255, 0.8)',
                      boxShadow: '3px 3px 8px rgba(166, 180, 200, 0.5), -3px -3px 8px rgba(255, 255, 255, 0.9)',
                      color: '#d97706',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 0
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    onClick={() => onStartDrawTerritory(activeSelection)}
                    title={`Dessiner sur la carte pour "${activeSelection.titre}"`}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      backgroundColor: drawingTerritoryEvent?.id === activeSelection.id ? '#e0f2fe' : '#eaf0f6',
                      border: drawingTerritoryEvent?.id === activeSelection.id ? '1px solid #0284c7' : '1px solid rgba(255, 255, 255, 0.8)',
                      boxShadow: drawingTerritoryEvent?.id === activeSelection.id
                        ? 'inset 2px 2px 5px rgba(166, 180, 200, 0.65), inset -2px -2px 5px rgba(255, 255, 255, 0.9)'
                        : '3px 3px 8px rgba(166, 180, 200, 0.5), -3px -3px 8px rgba(255, 255, 255, 0.9)',
                      color: activeSelection.zone_geojson || drawingTerritoryEvent?.id === activeSelection.id ? '#0284c7' : '#0f766e',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 0
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteEvent(activeSelection)}
                    title={`Supprimer "${activeSelection.titre}"`}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      backgroundColor: '#eaf0f6',
                      border: '1px solid rgba(255, 255, 255, 0.8)',
                      boxShadow: '3px 3px 8px rgba(166, 180, 200, 0.5), -3px -3px 8px rgba(255, 255, 255, 0.9)',
                      color: '#e11d48',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 0
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </>
              )}
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#e2e9f0',
              padding: 3,
              borderRadius: 20,
              gap: 3,
              boxShadow: 'inset 2px 2px 5px rgba(166, 180, 200, 0.6), inset -2px -2px 5px rgba(255, 255, 255, 0.9)'
            }}>
              {TIMELINE_CHAPTERS.map(ch => {
                const isActive = activeChapter === ch.id;
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => onSelectChapter(ch.id)}
                    style={{
                      padding: '4px 9px',
                      backgroundColor: isActive ? '#eaf0f6' : 'transparent',
                      color: isActive ? '#243242' : '#718096',
                      border: isActive ? '1px solid rgba(255, 255, 255, 0.7)' : 'none',
                      borderRadius: 14,
                      fontSize: 10.5,
                      fontWeight: isActive ? 700 : 500,
                      cursor: 'pointer',
                      boxShadow: isActive ? '3px 3px 7px rgba(166, 180, 200, 0.5), -2px -2px 6px rgba(255, 255, 255, 0.95)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {ch.label}
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                type="button"
                onClick={onToggleRelief}
                title={isReliefActive ? "Désactiver le relief" : "Activer le relief"}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '4px 9px',
                  borderRadius: 16,
                  backgroundColor: '#eaf0f6',
                  border: '1px solid rgba(255, 255, 255, 0.8)',
                  boxShadow: isReliefActive
                    ? 'inset 2px 2px 4px rgba(166, 180, 200, 0.6), inset -2px -2px 4px rgba(255, 255, 255, 0.9)'
                    : '3px 3px 8px rgba(166, 180, 200, 0.5), -3px -3px 8px rgba(255, 255, 255, 0.9)',
                  cursor: 'pointer',
                  color: '#334155',
                  fontSize: 11,
                  fontWeight: 600
                }}
              >
                <span style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: isReliefActive ? '#10b981' : '#94a3b8',
                  boxShadow: isReliefActive ? '0 0 6px rgba(16, 185, 129, 0.6)' : 'none',
                  transition: 'background-color 0.2s ease'
                }} />
                <span>Relief</span>
              </button>

              <button
                type="button"
                onClick={onRecalibrate}
                title="Recalibrer / Resynchroniser la carte"
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  backgroundColor: '#eaf0f6',
                  border: '1px solid rgba(255, 255, 255, 0.8)',
                  boxShadow: '3px 3px 8px rgba(166, 180, 200, 0.5), -3px -3px 8px rgba(255, 255, 255, 0.9)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#5b4fe8">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </button>

              <div
                onClick={onToggleAtlas}
                title={isAtlasOpen ? "Masquer la carte" : "Afficher la carte"}
                style={{
                  width: 18,
                  height: 30,
                  backgroundColor: isAtlasOpen ? '#10b981' : '#d8e2ec',
                  borderRadius: 10,
                  padding: 2,
                  boxSizing: 'border-box',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: isAtlasOpen ? 'flex-start' : 'flex-end',
                  alignItems: 'center',
                  transition: 'background-color 0.2s ease',
                  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.18)'
                }}
              >
                <div style={{
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 8,
                  fontWeight: 800,
                  color: isAtlasOpen ? '#10b981' : '#94a3b8'
                }}>
                  {isAtlasOpen ? '✓' : ''}
                </div>
              </div>
            </div>
          </>
        )}

      </header>

      {/* SOUS-BARRE DE DESSIN VECTORIEL */}
      {drawingTerritoryEvent && (
        <div
          ref={subBarRef}
          style={{
            width: '100%',
            backgroundColor: '#f8fafc',
            borderBottom: `1.5px solid ${drawColor}`,
            padding: isMobileScreen ? '5px 8px' : '5px 12px 5px 46px',
            boxSizing: 'border-box',
            zIndex: 28,
            display: 'flex',
            flexDirection: 'column',
            gap: 5,
            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)'
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 6,
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, backgroundColor: '#e2e8f0', padding: 2, borderRadius: 8 }}>
              {tools.map(t => {
                const isSelected = (drawUiState.activeTool || 'polygon') === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => drawUiState.actions?.setTool(t.id)}
                    title={t.title}
                    style={{
                      width: 26,
                      height: 24,
                      borderRadius: 6,
                      border: 'none',
                      backgroundColor: isSelected ? '#ffffff' : 'transparent',
                      color: isSelected ? drawColor : '#475569',
                      boxShadow: isSelected ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 0
                    }}
                  >
                    {t.icon}
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 2, backgroundColor: '#e2e8f0', padding: 2, borderRadius: 7 }}>
                <button
                  type="button"
                  onClick={() => drawUiState.actions?.setThickness('thin')}
                  title="Trait fin"
                  style={{
                    width: 24,
                    height: 22,
                    borderRadius: 5,
                    border: 'none',
                    backgroundColor: (drawUiState.thickness || 'thin') === 'thin' ? '#ffffff' : 'transparent',
                    color: (drawUiState.thickness || 'thin') === 'thin' ? '#0f172a' : '#64748b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                    <line x1="4" y1="12" x2="20" y2="12" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => drawUiState.actions?.setThickness('thick')}
                  title="Trait épais"
                  style={{
                    width: 24,
                    height: 22,
                    borderRadius: 5,
                    border: 'none',
                    backgroundColor: drawUiState.thickness === 'thick' ? '#ffffff' : 'transparent',
                    color: drawUiState.thickness === 'thick' ? '#0f172a' : '#64748b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4.2" strokeLinecap="round">
                    <line x1="4" y1="12" x2="20" y2="12" />
                  </svg>
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 2, backgroundColor: '#e2e8f0', padding: 2, borderRadius: 7 }}>
                <button
                  type="button"
                  onClick={() => drawUiState.actions?.setDashed(false)}
                  title="Trait plein"
                  style={{
                    width: 24,
                    height: 22,
                    borderRadius: 5,
                    border: 'none',
                    backgroundColor: !drawUiState.dashed ? '#ffffff' : 'transparent',
                    color: !drawUiState.dashed ? '#0f172a' : '#64748b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                    <line x1="4" y1="12" x2="20" y2="12" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => drawUiState.actions?.setDashed(true)}
                  title="Trait pointillé"
                  style={{
                    width: 24,
                    height: 22,
                    borderRadius: 5,
                    border: 'none',
                    backgroundColor: drawUiState.dashed ? '#ffffff' : 'transparent',
                    color: drawUiState.dashed ? '#0f172a' : '#64748b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.4" strokeDasharray="3 3" strokeLinecap="round">
                    <line x1="3" y1="12" x2="21" y2="12" />
                  </svg>
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{
                fontSize: 10,
                fontWeight: 700,
                color: '#475569',
                backgroundColor: '#e2e8f0',
                padding: '2px 6px',
                borderRadius: 6
              }}>
                {drawUiState.shapesCount}
              </span>

              <button
                type="button"
                onClick={() => drawUiState.actions?.validateShape()}
                disabled={!drawUiState.canValidateShape}
                title="Valider cette forme et en tracer une nouvelle"
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 6,
                  border: `1px solid ${drawUiState.canValidateShape ? drawColor : '#cbd5e1'}`,
                  backgroundColor: drawUiState.canValidateShape ? '#f0f9ff' : '#f1f5f9',
                  color: drawUiState.canValidateShape ? drawColor : '#94a3b8',
                  cursor: drawUiState.canValidateShape ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>

              <button
                type="button"
                onClick={() => drawUiState.actions?.toggleAddLink()}
                title={`Associer un lien (${drawUiState.linksCount})`}
                style={{
                  position: 'relative',
                  width: 26,
                  height: 26,
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  backgroundColor: drawUiState.isAddingLink ? '#e0f2fe' : '#ffffff',
                  color: '#0284c7',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
                {drawUiState.linksCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    backgroundColor: '#0284c7',
                    color: '#ffffff',
                    fontSize: 8,
                    fontWeight: 800,
                    borderRadius: '50%',
                    width: 13,
                    height: 13,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {drawUiState.linksCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => drawUiState.actions?.undoPoint()}
                disabled={!drawUiState.canUndo}
                title="Annuler le dernier point"
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: drawUiState.canUndo ? '#475569' : '#cbd5e1',
                  cursor: drawUiState.canUndo ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 7v6h6" />
                  <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
                </svg>
              </button>

              <button
                type="button"
                onClick={() => drawUiState.actions?.clearAll()}
                disabled={!drawUiState.canClear}
                title="Tout effacer"
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 6,
                  border: '1px solid #fecaca',
                  backgroundColor: drawUiState.canClear ? '#fff1f2' : '#f8fafc',
                  color: drawUiState.canClear ? '#e11d48' : '#cbd5e1',
                  cursor: drawUiState.canClear ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>

              <button
                type="button"
                onClick={() => drawUiState.actions?.save()}
                disabled={drawUiState.isSaving}
                title="Enregistrer"
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 6,
                  border: 'none',
                  backgroundColor: '#15803d',
                  color: '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </button>

              <button
                type="button"
                onClick={onCancelDrawing}
                title="Fermer"
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#64748b',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {drawUiState.linksBarContent}
        </div>
      )}
    </>
  );
}