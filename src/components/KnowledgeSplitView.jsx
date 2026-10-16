import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { supabase } from '../supabase.js';
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

// Forcer Leaflet à recalculer sa taille d'affichage
function MapResizer() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 120);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

export default function KnowledgeSplitView({ event, isOpen, onClose }) {
  if (!isOpen || !event) return null;

  const style = getItemStyle(event);

  const cartes = Array.isArray(event.cartes_historiques) && event.cartes_historiques.length > 0
    ? event.cartes_historiques
    : (event.carte_historique_url
        ? [{ source: 'archive', titre: event.carte_legende || 'Carte historique', url: event.carte_historique_url }]
        : []);

  const hasArchiveMaps = cartes.length > 0;
  const [activeTab, setActiveTab] = useState(hasArchiveMaps ? 'archives' : 'moderne');
  const [previewCard, setPreviewCard] = useState(null);

  // État local des tuiles Bento (chargé depuis la base ou initialisé vide)
  const [bentoItems, setBentoItems] = useState(() => {
    return Array.isArray(event.references_bento) ? event.references_bento : [];
  });

  // Mettre à jour si l'événement sélectionné change
  useEffect(() => {
    setBentoItems(Array.isArray(event.references_bento) ? event.references_bento : []);
  }, [event]);

  // Formulaire d'ajout rapide d'une tuile Bento
  const [isAdding, setIsAdding] = useState(false);
  const [itemType, setItemType] = useState('text'); // 'text', 'link', 'quote', 'book'
  const [itemTitle, setItemTitle] = useState('');
  const [itemContent, setItemContent] = useState('');
  const [itemUrl, setItemUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Sauvegarder dans Supabase
  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!itemContent.trim() && !itemTitle.trim() && !itemUrl.trim()) return;

    const newItem = {
      id: Date.now().toString(),
      type: itemType,
      title: itemTitle.trim() || null,
      content: itemContent.trim() || null,
      url: itemUrl.trim() || null,
      createdAt: new Date().toISOString()
    };

    const updatedList = [...bentoItems, newItem];
    setIsSaving(true);

    const { error } = await supabase
      .from('evenements')
      .update({ references_bento: updatedList })
      .eq('id', event.id);

    setIsSaving(false);

    if (!error) {
      setBentoItems(updatedList);
      event.references_bento = updatedList; // Mise à jour locale en direct
      setIsAdding(false);
      setItemTitle('');
      setItemContent('');
      setItemUrl('');
    } else {
      alert("Erreur d'enregistrement : " + error.message);
    }
  };

  // Supprimer une tuile
  const handleDeleteItem = async (itemId) => {
    const updatedList = bentoItems.filter(it => it.id !== itemId);
    const { error } = await supabase
      .from('evenements')
      .update({ references_bento: updatedList })
      .eq('id', event.id);

    if (!error) {
      setBentoItems(updatedList);
      event.references_bento = updatedList;
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setPreviewCard(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const hasCoords = event.latitude !== null && event.latitude !== undefined && event.longitude !== null && event.longitude !== undefined && !isNaN(event.latitude);
  const position = hasCoords ? [Number(event.latitude), Number(event.longitude)] : [41.9028, 12.4964];
  const zoom = Number(event.zoom_niveau) || 6;

  return (
    <>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100vw',
          height: '50vh',
          backgroundColor: '#8c8273',
          borderBottom: '2px solid rgba(60, 45, 30, 0.35)',
          zIndex: 25,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 12px 35px rgba(35, 25, 15, 0.35)',
          color: '#1c1917',
          overflow: 'hidden'
        }}
      >
        {/* 1. Barre d'en-tête */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '9px 18px',
            backgroundColor: 'rgba(60, 48, 38, 0.92)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
            flexShrink: 0,
            color: '#fdfbf7'
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
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: '#fde68a',
                fontWeight: 'bold'
              }}
            >
              {event.date_fin ? '⏳ Période' : '📍 Événement'}
            </span>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 'bold', color: '#ffffff' }}>
              {event.titre}
            </h2>
            <span style={{ fontSize: 12, color: '#e2d9cc' }}>
              ({formatYear(event.date_debut)}{event.date_fin ? ` ➔ ${formatYear(event.date_fin)}` : ''})
            </span>
          </div>

          <button
            onClick={onClose}
            title="Fermer le volet"
            style={{
              background: 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              color: '#ffffff',
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

        {/* 2. Corps scindé */}
        <div style={{ display: 'flex', flex: 1, width: '100%', overflow: 'hidden' }}>
          
          {/* COLONNE GAUCHE (CARTES) */}
          <div style={{ width: '55%', height: '100%', display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(60, 45, 30, 0.25)', backgroundColor: '#756c5e', position: 'relative', overflow: 'hidden' }}>
            
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 14px',
                backgroundColor: 'rgba(45, 35, 25, 0.45)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                flexShrink: 0
              }}
            >
              <div style={{ display: 'flex', gap: 6 }}>
                {hasArchiveMaps && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('archives')}
                    style={{
                      padding: '4px 12px',
                      borderRadius: 6,
                      border: 'none',
                      fontSize: 11,
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      backgroundColor: activeTab === 'archives' ? '#1c1917' : 'rgba(255, 255, 255, 0.15)',
                      color: '#ffffff'
                    }}
                  >
                    🗺️ Archives & Cartes ({cartes.length})
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setActiveTab('moderne')}
                  style={{
                    padding: '4px 12px',
                    borderRadius: 6,
                    border: 'none',
                    fontSize: 11,
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    backgroundColor: activeTab === 'moderne' ? '#1c1917' : 'rgba(255, 255, 255, 0.15)',
                    color: '#ffffff'
                  }}
                >
                  🌍 Localisation moderne
                </button>
              </div>

              {activeTab === 'archives' && (
                <span style={{ fontSize: 10, color: '#f3ede4' }}>
                  Cliquez sur un document pour l'agrandir
                </span>
              )}
            </div>

            {/* VUE ARCHIVES */}
            {activeTab === 'archives' && hasArchiveMaps && (
              <div style={{ flex: 1, overflowY: 'auto', padding: 14, backgroundColor: 'rgba(35, 28, 22, 0.25)' }}>
                {cartes.length === 1 ? (
                  <div
                    onClick={() => setPreviewCard(cartes[0])}
                    style={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'zoom-in'
                    }}
                  >
                    <img
                      src={cartes[0].url}
                      alt={cartes[0].titre}
                      referrerPolicy="no-referrer"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '85%',
                        objectFit: 'contain',
                        borderRadius: 8,
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
                      }}
                    />
                    <div style={{ marginTop: 8, fontSize: 11, color: '#fdfbf7', fontStyle: 'italic', textAlign: 'center' }}>
                      {cartes[0].titre}
                    </div>
                  </div>
                ) : (
                  <div style={{ columnCount: 2, columnGap: 14 }}>
                    {cartes.map((carte, idx) => (
                      <div
                        key={idx}
                        onClick={() => setPreviewCard(carte)}
                        style={{
                          breakInside: 'avoid',
                          marginBottom: 14,
                          borderRadius: 8,
                          overflow: 'hidden',
                          backgroundColor: '#f5f3ec',
                          border: '1px solid rgba(60, 45, 30, 0.2)',
                          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.2)',
                          cursor: 'zoom-in',
                          transition: 'transform 0.15s ease'
                        }}
                      >
                        <img
                          src={carte.url}
                          alt={carte.titre}
                          referrerPolicy="no-referrer"
                          style={{ width: '100%', display: 'block', objectFit: 'cover' }}
                        />
                        <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span style={{ fontSize: 9, color: '#854d0e', fontWeight: 'bold', textTransform: 'uppercase' }}>
                            {carte.source || 'Archive'}
                          </span>
                          <span style={{ fontSize: 11, color: '#1c1917', lineHeight: 1.3, fontWeight: 500 }}>
                            {carte.titre}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* VUE LEAFLET */}
            {activeTab === 'moderne' && (
              <div style={{ flex: 1, width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
                <MapContainer
                  center={position}
                  zoom={zoom}
                  style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
                >
                  <MapResizer />
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

          {/* COLONNE DROITE : LE MUR BENTO MODULAIRE */}
          <div
            style={{
              width: '45%',
              height: '100%',
              padding: 14,
              overflowY: 'auto',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              backgroundColor: '#9a9082'
            }}
          >
            {/* Barre d'action supérieure du Bento */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
              <span style={{ fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.8, color: '#3d2616' }}>
                Cabinet de recherche & Notes ({bentoItems.length + (event.description ? 1 : 0)})
              </span>
              <button
                type="button"
                onClick={() => setIsAdding(!isAdding)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  backgroundColor: '#1c1917',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 16,
                  padding: '4px 10px',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                }}
              >
                <span>{isAdding ? '✕ Fermer' : '+ Ajouter'}</span>
              </button>
            </div>

            {/* Formulaire rétractable d'ajout au Bento */}
            {isAdding && (
              <form
                onSubmit={handleSaveItem}
                style={{
                  backgroundColor: '#f5efe4',
                  border: '1px solid #dfd3bf',
                  borderRadius: 12,
                  padding: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  boxShadow: '0 4px 12px rgba(40, 25, 10, 0.1)'
                }}
              >
                {/* Choix du format */}
                <div style={{ display: 'flex', gap: 6 }}>
                  {[
                    { id: 'text', label: '📝 Note libre' },
                    { id: 'link', label: '🔗 Lien / Source' },
                    { id: 'quote', label: '“ Citation' },
                    { id: 'book', label: '📚 Ouvrage' }
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setItemType(t.id)}
                      style={{
                        flex: 1,
                        padding: '4px 6px',
                        borderRadius: 6,
                        border: 'none',
                        fontSize: 10,
                        fontWeight: 600,
                        cursor: 'pointer',
                        backgroundColor: itemType === t.id ? '#1c1917' : '#ebe4d8',
                        color: itemType === t.id ? '#ffffff' : '#442b15'
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Titre ou nom de source */}
                <input
                  type="text"
                  placeholder={itemType === 'link' ? "Nom du lien (ex: Article Le Monde, Musée...)" : (itemType === 'book' ? "Titre du livre & Auteur" : "Titre ou contexte (optionnel)")}
                  value={itemTitle}
                  onChange={e => setItemTitle(e.target.value)}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #d4c8b6',
                    borderRadius: 6,
                    padding: '6px 8px',
                    fontSize: 11,
                    outline: 'none',
                    color: '#1c1917'
                  }}
                />

                {/* URL si lien ou vidéo */}
                {(itemType === 'link' || itemType === 'book') && (
                  <input
                    type="url"
                    placeholder="https://..."
                    value={itemUrl}
                    onChange={e => setItemUrl(e.target.value)}
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #d4c8b6',
                      borderRadius: 6,
                      padding: '6px 8px',
                      fontSize: 11,
                      outline: 'none',
                      color: '#1c1917'
                    }}
                  />
                )}

                {/* Contenu textuel / citation */}
                <textarea
                  rows={itemType === 'quote' ? 2 : 3}
                  placeholder={itemType === 'quote' ? "Sentence, extrait de discours ou de texte ancien..." : "Votre note, observation ou synthèse..."}
                  value={itemContent}
                  onChange={e => setItemContent(e.target.value)}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #d4c8b6',
                    borderRadius: 6,
                    padding: '6px 8px',
                    fontSize: 11,
                    outline: 'none',
                    color: '#1c1917',
                    resize: 'none'
                  }}
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 6,
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: '#57534e',
                      fontSize: 11,
                      cursor: 'pointer'
                    }}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    style={{
                      padding: '4px 12px',
                      borderRadius: 6,
                      border: 'none',
                      backgroundColor: '#1c1917',
                      color: '#ffffff',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {isSaving ? 'Enregistrement...' : 'Épingler au Bento'}
                  </button>
                </div>
              </form>
            )}

            {/* GRILLE BENTO MODULAIRE DYNAMIQUE */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 8,
                width: '100%'
              }}
            >
              {/* Tuile Fixe 1 : Description de base (Pleine largeur) */}
              {event.description && (
                <div
                  style={{
                    gridColumn: 'span 2',
                    backgroundColor: 'rgba(255, 253, 248, 0.92)',
                    border: '1px solid rgba(60, 45, 30, 0.15)',
                    borderRadius: 10,
                    padding: 12,
                    boxShadow: '0 2px 6px rgba(40, 25, 10, 0.06)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: 12 }}>📜</span>
                    <span style={{ fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.8, color: '#6b3a19' }}>
                      Contexte général
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: 11, lineHeight: 1.5, color: '#1c1917' }}>
                    {event.description}
                  </p>
                </div>
              )}

              {/* Tuiles dynamiques créées par l'utilisateur */}
              {bentoItems.map((item) => {
                // Détection de la taille Bento selon la longueur du contenu
                const isWide = item.type === 'quote' || item.type === 'text' || (item.content && item.content.length > 70);

                return (
                  <div
                    key={item.id}
                    style={{
                      gridColumn: isWide ? 'span 2' : 'span 1',
                      backgroundColor: item.type === 'quote' ? '#f5efe4' : 'rgba(255, 253, 248, 0.92)',
                      border: item.type === 'quote' ? '1px solid #dfd3bf' : '1px solid rgba(60, 45, 30, 0.15)',
                      borderRadius: 10,
                      padding: 10,
                      boxShadow: '0 2px 6px rgba(40, 25, 10, 0.06)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      position: 'relative'
                    }}
                  >
                    <div>
                      {/* En-tête de la tuile avec titre et corbeille */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ fontSize: 12 }}>
                            {item.type === 'link' ? '🔗' : (item.type === 'quote' ? '“' : (item.type === 'book' ? '📚' : '📝'))}
                          </span>
                          {item.title && (
                            <span style={{ fontSize: 10, fontWeight: 'bold', color: '#1c1917' }}>
                              {item.title}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id)}
                          title="Supprimer cette référence"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#a8a29e',
                            cursor: 'pointer',
                            fontSize: 10,
                            padding: '0 2px'
                          }}
                        >
                          ✕
                        </button>
                      </div>

                      {/* Contenu */}
                      {item.content && (
                        <p style={{
                          margin: 0,
                          fontSize: 11,
                          lineHeight: 1.45,
                          fontStyle: item.type === 'quote' ? 'italic' : 'normal',
                          color: item.type === 'quote' ? '#451a03' : '#292524'
                        }}>
                          {item.content}
                        </p>
                      )}
                    </div>

                    {/* Lien cliquable externe */}
                    {item.url && (
                      <div style={{ marginTop: 6 }}>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 10,
                            color: '#1c1917',
                            fontWeight: 600,
                            textDecoration: 'none',
                            backgroundColor: '#ebe4d8',
                            padding: '3px 8px',
                            borderRadius: 6,
                            border: '1px solid #d4c8b6'
                          }}
                        >
                          <span>{item.title || "Consulter le lien"}</span>
                          <span style={{ fontSize: 8 }}>↗</span>
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Message d'accueil si aucune tuile n'a encore été ajoutée */}
              {bentoItems.length === 0 && !event.description && (
                <div
                  style={{
                    gridColumn: 'span 2',
                    padding: 16,
                    textAlign: 'center',
                    backgroundColor: 'rgba(255, 253, 248, 0.5)',
                    border: '1px dashed #c4b9a8',
                    borderRadius: 10,
                    fontSize: 11,
                    color: '#57534e'
                  }}
                >
                  Aucune note ou référence pour le moment.<br />
                  Clique sur <strong>+ Ajouter</strong> pour épingler ta première note, citation ou lien.
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Lightbox plein écran */}
      {previewCard && (
        <div
          onClick={() => setPreviewCard(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            backgroundColor: 'rgba(28, 25, 23, 0.92)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            cursor: 'zoom-out'
          }}
        >
          <div style={{ position: 'absolute', top: 18, right: 24, display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: '#e7e5e4' }}>Appuyez sur Échap ou cliquez pour fermer</span>
            <button
              onClick={() => setPreviewCard(null)}
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                border: '1px solid #78716c',
                color: '#ffffff',
                borderRadius: '50%',
                width: 32,
                height: 32,
                cursor: 'pointer',
                fontSize: 14
              }}
            >
              ✕
            </button>
          </div>

          <img
            src={previewCard.url}
            alt={previewCard.titre}
            referrerPolicy="no-referrer"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '92vw',
              maxHeight: '84vh',
              objectFit: 'contain',
              borderRadius: 8,
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)',
              cursor: 'default'
            }}
          />

          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              marginTop: 12,
              padding: '6px 16px',
              backgroundColor: 'rgba(40, 32, 24, 0.9)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: 20,
              fontSize: 12,
              color: '#fdfbf7',
              textAlign: 'center',
              maxWidth: '80%'
            }}
          >
            {previewCard.titre}
          </div>
        </div>
      )}
    </>
  );
}