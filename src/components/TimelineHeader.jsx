import React from 'react';
import { TIMELINE_CHAPTERS } from '../utils/timelineMath.js';

export default function TimelineHeader({
  headerHeight,
  isMobileScreen,
  activeChapter,
  onSelectChapter,
  onResetFullView,
  onOpenCreateModal,
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
        padding: isMobileScreen ? '4px 8px 4px 40px' : '0 10px 0 44px',
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
                      title={`Dessiner le territoire de "${activeSelection.titre}"`}
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
                    title={`Dessiner le territoire de "${activeSelection.titre}"`}
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

      {/* SOUS-BARRE DE DESSIN SOUS LE BANDEAU SUPÉRIEUR */}
      {drawingTerritoryEvent && (
        <div
          ref={subBarRef}
          style={{
            width: '100%',
            backgroundColor: '#f8fafc',
            borderBottom: `1.5px solid ${drawColor}`,
            padding: isMobileScreen ? '6px 10px' : '6px 16px',
            boxSizing: 'border-box',
            zIndex: 28,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)'
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 6
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
              <span style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: drawColor,
                flexShrink: 0
              }} />
              <span style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#1c1917',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: isMobileScreen ? '48vw' : '300px'
              }}>
                {drawingTerritoryEvent.titre}
              </span>
              <span style={{
                fontSize: 10,
                fontWeight: 600,
                color: '#64748b',
                whiteSpace: 'nowrap'
              }}>
                ({drawUiState.shapesCount} forme{drawUiState.shapesCount > 1 ? 's' : ''})
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
              {drawUiState.canValidateShape && (
                <button
                  type="button"
                  onClick={() => drawUiState.actions?.validateShape()}
                  style={{
                    padding: '4px 8px',
                    borderRadius: 6,
                    border: `1px solid ${drawColor}`,
                    backgroundColor: '#f0f9ff',
                    color: drawColor,
                    fontSize: 10.5,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  + Forme
                </button>
              )}

              <button
                type="button"
                onClick={() => drawUiState.actions?.toggleAddLink()}
                style={{
                  padding: '4px 8px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  backgroundColor: drawUiState.isAddingLink ? '#e0f2fe' : '#ffffff',
                  color: '#0284c7',
                  fontSize: 10.5,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                + Lien ({drawUiState.linksCount})
              </button>

              {drawUiState.canUndo && (
                <button
                  type="button"
                  onClick={() => drawUiState.actions?.undoPoint()}
                  title="Annuler le dernier point"
                  style={{
                    padding: '4px 8px',
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#475569',
                    fontSize: 10.5,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Annuler pt
                </button>
              )}

              {drawUiState.canClear && (
                <button
                  type="button"
                  onClick={() => drawUiState.actions?.clearAll()}
                  title="Tout effacer"
                  style={{
                    padding: '4px 8px',
                    borderRadius: 6,
                    border: '1px solid #fecaca',
                    backgroundColor: '#fff1f2',
                    color: '#e11d48',
                    fontSize: 10.5,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Effacer
                </button>
              )}

              <button
                type="button"
                onClick={() => drawUiState.actions?.save()}
                disabled={drawUiState.isSaving}
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  border: 'none',
                  backgroundColor: '#15803d',
                  color: '#ffffff',
                  fontSize: 10.5,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {drawUiState.isSaving ? '...' : 'Enregistrer'}
              </button>

              <button
                type="button"
                onClick={onCancelDrawing}
                title="Fermer le mode dessin"
                style={{
                  padding: '4px 8px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#64748b',
                  fontSize: 10.5,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {drawUiState.linksBarContent}
        </div>
      )}
    </>
  );
}