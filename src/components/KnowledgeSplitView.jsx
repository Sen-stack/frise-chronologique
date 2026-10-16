import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { supabase } from '../supabase.js';
import WikimediaPickerModal from './WikimediaPickerModal.jsx';
import CityPicker from './CityPicker.jsx';

const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Forcer Leaflet à recalculer sa taille d'affichage et centrer sur la position
function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
      if (center) {
        map.setView(center, zoom);
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [map, center, zoom]);
  return null;
}

export default function KnowledgeSplitView({ event, isOpen, onClose }) {
  if (!isOpen || !event) return null;

  // Données éditables
  const [description, setDescription] = useState('');
  const [blocs, setBlocs] = useState([]);
  const [cartes, setCartes] = useState([]);
  const [activeTab, setActiveTab] = useState('archives');
  const [previewCard, setPreviewCard] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Géolocalisation Leaflet
  const [coords, setCoords] = useState({ latitude: null, longitude: null });

  // Modale Wikimedia et saisie libre de lien
  const [isWikiPickerOpen, setIsWikiPickerOpen] = useState(false);
  const [isAddingDirectUrl, setIsAddingDirectUrl] = useState(false);
  const [directCardUrl, setDirectCardUrl] = useState('');
  const [directCardTitre, setDirectCardTitre] = useState('');

  // Blocs dynamiques libres
  const [newBlockType, setNewBlockType] = useState(null); // 'text' ou 'link'
  const [newBlockContent, setNewBlockContent] = useState({ titre: '', url: '', texte: '' });

  useEffect(() => {
    if (event) {
      setDescription(event.description || '');

      const bentoData = Array.isArray(event.references_bento) ? event.references_bento : [];
      setBlocs(bentoData);

      let cartesList = [];
      if (Array.isArray(event.cartes_historiques) && event.cartes_historiques.length > 0) {
        cartesList = event.cartes_historiques;
      } else if (event.carte_historique_url) {
        cartesList = [{ source: 'archive', titre: event.carte_legende || 'Document historique', url: event.carte_historique_url }];
      }
      setCartes(cartesList);
      setActiveTab(cartesList.length > 0 ? 'archives' : 'moderne');

      // Chargement des coordonnées existantes
      setCoords({
        latitude: event.latitude !== null && event.latitude !== undefined ? Number(event.latitude) : null,
        longitude: event.longitude !== null && event.longitude !== undefined ? Number(event.longitude) : null
      });

      setSaveMessage('');
    }
  }, [event]);

  const hasCoords = coords.latitude !== null && coords.longitude !== null && !isNaN(coords.latitude);
  const position = hasCoords ? [coords.latitude, coords.longitude] : [41.9028, 12.4964];
  const zoom = Number(event.zoom_niveau) || (hasCoords ? 7 : 4);

  const anneeAffichee = event.date_debut < 0
    ? `${Math.abs(event.date_debut)} BCE`
    : `${event.date_debut} CE`;

  const handleSave = async (updatedBlocs = blocs, updatedCartes = cartes, updatedDesc = description, updatedCoords = coords) => {
    setIsSaving(true);
    setSaveMessage('');

    const payload = {
      description: updatedDesc.trim() || null,
      references_bento: updatedBlocs,
      cartes_historiques: updatedCartes,
      carte_historique_url: updatedCartes[0]?.url || null,
      carte_legende: updatedCartes[0]?.titre || null,
      latitude: updatedCoords.latitude,
      longitude: updatedCoords.longitude
    };

    const { error } = await supabase
      .from('evenements')
      .update(payload)
      .eq('id', event.id);

    setIsSaving(false);
    if (error) {
      setSaveMessage('Erreur');
    } else {
      setSaveMessage('Enregistré ✓');
      event.description = payload.description;
      event.references_bento = payload.references_bento;
      event.cartes_historiques = payload.cartes_historiques;
      event.carte_historique_url = payload.carte_historique_url;
      event.carte_legende = payload.carte_legende;
      event.latitude = payload.latitude;
      event.longitude = payload.longitude;
      setTimeout(() => setSaveMessage(''), 2000);
    }
  };

  // Mise à jour de la ville depuis le CityPicker
  const handleLocationSelect = ({ latitude, longitude }) => {
    const nextCoords = {
      latitude: latitude !== null ? Number(latitude) : null,
      longitude: longitude !== null ? Number(longitude) : null
    };
    setCoords(nextCoords);
    handleSave(blocs, cartes, description, nextCoords);
  };

  // Réception de l'image sélectionnée dans la modale Wikimedia
  const handleSelectWikimedia = (nouvelleCarte) => {
    const nextList = [...cartes, nouvelleCarte];
    setCartes(nextList);
    setActiveTab('archives');
    handleSave(blocs, nextList, description, coords);
  };

  // Ajout par URL manuelle
  const handleAddDirectUrlSubmit = (e) => {
    e.preventDefault();
    if (!directCardUrl.trim()) return;
    const nouvelle = {
      source: 'web',
      titre: directCardTitre.trim() || 'Document d’époque',
      url: directCardUrl.trim()
    };
    const nextList = [...cartes, nouvelle];
    setCartes(nextList);
    setDirectCardUrl('');
    setDirectCardTitre('');
    setIsAddingDirectUrl(false);
    setActiveTab('archives');
    handleSave(blocs, nextList, description, coords);
  };

  const handleRemoveCard = (index) => {
    const nextList = cartes.filter((_, i) => i !== index);
    setCartes(nextList);
    handleSave(blocs, nextList, description, coords);
  };

  // Ajout / Suppression de bloc libre
  const handleAddBlockSubmit = (e) => {
    e.preventDefault();
    const nouveauBloc = {
      id: Date.now(),
      type: newBlockType,
      titre: newBlockContent.titre.trim(),
      url: newBlockContent.url.trim(),
      texte: newBlockContent.texte.trim()
    };
    const nextBlocs = [...blocs, nouveauBloc];
    setBlocs(nextBlocs);
    setNewBlockType(null);
    setNewBlockContent({ titre: '', url: '', texte: '' });
    handleSave(nextBlocs, cartes, description, coords);
  };

  const handleRemoveBlock = (blockId) => {
    const nextBlocs = blocs.filter(b => b.id !== blockId);
    setBlocs(nextBlocs);
    handleSave(nextBlocs, cartes, description, coords);
  };

  return (
    <>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100vw',
          height: '50vh',
          backgroundColor: '#faf7f2',
          borderBottom: '1px solid #e7ded0',
          boxShadow: '0 12px 30px rgba(44, 34, 22, 0.08)',
          zIndex: 25,
          display: 'flex',
          flexDirection: 'column',
          color: '#1c1917',
          overflow: 'hidden',
          boxSizing: 'border-box',
          fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
        }}
      >
        {/* En-tête */}
        <div
          style={{
            padding: '12px 24px 8px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1c1917', letterSpacing: -0.2 }}>
              {event.titre}
            </h1>
            <span style={{ fontSize: 12, color: '#b45309', fontWeight: 600 }}>
              {anneeAffichee}
            </span>
            {saveMessage && (
              <span style={{ fontSize: 11, color: '#15803d', fontWeight: 600 }}>
                {saveMessage}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              onClick={() => handleSave()}
              disabled={isSaving}
              style={{
                padding: '5px 12px',
                borderRadius: 7,
                border: 'none',
                backgroundColor: '#b45309',
                color: '#ffffff',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {isSaving ? 'Enregistrement...' : 'Enregistrer'}
            </button>

            <button
              type="button"
              onClick={onClose}
              title="Fermer le volet"
              style={{
                background: '#f2ece1',
                border: '1px solid #e7ded0',
                color: '#57534e',
                borderRadius: 7,
                width: 28,
                height: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                cursor: 'pointer'
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Corps : Gauche (Documents & Cartes) / Droite (Blocs libres) */}
        <div
          style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 16,
            padding: '4px 24px 14px 24px',
            overflow: 'hidden',
            boxSizing: 'border-box'
          }}
        >
          {/* COLONNE GAUCHE : DOCUMENTS D'ARCHIVES & CARTE */}
          <div
            style={{
              height: '100%',
              backgroundColor: '#f3ece0',
              borderRadius: 12,
              border: '1px solid #e7ded0',
              overflow: 'hidden',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Barre d'onglets */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                backgroundColor: 'rgba(250, 247, 242, 0.95)',
                borderBottom: '1px solid #e7ded0',
                zIndex: 10,
                flexShrink: 0
              }}
            >
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('archives')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    border: 'none',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    backgroundColor: activeTab === 'archives' ? '#ffffff' : 'transparent',
                    color: activeTab === 'archives' ? '#1c1917' : '#78716c',
                    boxShadow: activeTab === 'archives' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none'
                  }}
                >
                  Archives & Documents ({cartes.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('moderne')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    border: 'none',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    backgroundColor: activeTab === 'moderne' ? '#ffffff' : 'transparent',
                    color: activeTab === 'moderne' ? '#1c1917' : '#78716c',
                    boxShadow: activeTab === 'moderne' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none'
                  }}
                >
                  Carte moderne
                </button>
              </div>

              {activeTab === 'archives' && (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => setIsWikiPickerOpen(true)}
                    style={{
                      padding: '3px 8px',
                      borderRadius: 6,
                      border: '1px solid #0284c7',
                      backgroundColor: 'rgba(2, 132, 199, 0.1)',
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#0284c7',
                      cursor: 'pointer'
                    }}
                  >
                    Chercher sur Wikimedia
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsAddingDirectUrl(!isAddingDirectUrl)}
                    style={{
                      padding: '3px 8px',
                      borderRadius: 6,
                      border: '1px solid #d6cebf',
                      backgroundColor: '#ffffff',
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#57534e',
                      cursor: 'pointer'
                    }}
                  >
                    {isAddingDirectUrl ? '✕' : '+ Lien URL'}
                  </button>
                </div>
              )}
            </div>

            {/* Formulaire manuel d'URL */}
            {isAddingDirectUrl && (
              <form
                onSubmit={handleAddDirectUrlSubmit}
                style={{
                  padding: 8,
                  backgroundColor: '#ffffff',
                  borderBottom: '1px solid #e7ded0',
                  display: 'flex',
                  gap: 6,
                  alignItems: 'center',
                  zIndex: 10
                }}
              >
                <input
                  type="text"
                  placeholder="Légende ou titre"
                  value={directCardTitre}
                  onChange={(e) => setDirectCardTitre(e.target.value)}
                  style={{ flex: 1, padding: '4px 8px', borderRadius: 6, border: '1px solid #d6cebf', fontSize: 11, outline: 'none' }}
                />
                <input
                  type="text"
                  required
                  placeholder="URL directe de l'image"
                  value={directCardUrl}
                  onChange={(e) => setDirectCardUrl(e.target.value)}
                  style={{ flex: 2, padding: '4px 8px', borderRadius: 6, border: '1px solid #d6cebf', fontSize: 11, outline: 'none' }}
                />
                <button
                  type="submit"
                  style={{ padding: '4px 10px', borderRadius: 6, border: 'none', backgroundColor: '#b45309', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                >
                  Ajouter
                </button>
              </form>
            )}

            {/* VUE 1 : DOCUMENTS D'ARCHIVES */}
            {activeTab === 'archives' && (
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: 12,
                  backgroundColor: '#f5eee3',
                  boxSizing: 'border-box'
                }}
              >
                {cartes.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#78716c', fontSize: 12 }}>
                    <span>Aucun document d'archive associé.</span>
                    <button
                      type="button"
                      onClick={() => setIsWikiPickerOpen(true)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 6,
                        border: '1px solid #0284c7',
                        backgroundColor: '#ffffff',
                        fontSize: 11,
                        fontWeight: 600,
                        color: '#0284c7',
                        cursor: 'pointer'
                      }}
                    >
                      Ouvrir la recherche Wikimedia Commons
                    </button>
                  </div>
                ) : cartes.length === 1 ? (
                  <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <img
                      src={cartes[0].url}
                      alt={cartes[0].titre}
                      referrerPolicy="no-referrer"
                      onClick={() => setPreviewCard(cartes[0])}
                      style={{ maxWidth: '100%', maxHeight: '85%', objectFit: 'contain', borderRadius: 8, boxShadow: '0 4px 15px rgba(0,0,0,0.1)', cursor: 'zoom-in' }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                      <span style={{ fontSize: 11, color: '#57534e', fontStyle: 'italic' }}>
                        {cartes[0].titre}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCard(0)}
                        title="Supprimer cette carte"
                        style={{ border: 'none', background: 'transparent', color: '#e11d48', cursor: 'pointer', fontSize: 12 }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ columnCount: 2, columnGap: 12 }}>
                    {cartes.map((c, idx) => (
                      <div
                        key={idx}
                        style={{
                          breakInside: 'avoid',
                          marginBottom: 12,
                          borderRadius: 8,
                          overflow: 'hidden',
                          backgroundColor: '#ffffff',
                          border: '1px solid #e7ded0',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                          position: 'relative'
                        }}
                      >
                        <img
                          src={c.url}
                          alt={c.titre}
                          referrerPolicy="no-referrer"
                          onClick={() => setPreviewCard(c)}
                          style={{ width: '100%', display: 'block', cursor: 'zoom-in' }}
                        />
                        <div style={{ padding: '6px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 10, color: '#44403c', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {c.titre}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveCard(idx)}
                            title="Supprimer"
                            style={{ border: 'none', background: 'transparent', color: '#e11d48', cursor: 'pointer', fontSize: 11 }}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* VUE 2 : CARTE MODERNE + SÉLECTEUR DE VILLES FLOTTANT */}
            {activeTab === 'moderne' && (
              <div style={{ flex: 1, width: '100%', height: '100%', position: 'relative' }}>
                
                {/* Sélecteur de ville positionné en haut de la carte */}
                <div
                  style={{
                    position: 'absolute',
                    top: 10,
                    left: 10,
                    right: 10,
                    zIndex: 1000,
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(8px)',
                    padding: '8px 12px',
                    borderRadius: 10,
                    border: '1px solid #e7ded0',
                    boxShadow: '0 4px 12px rgba(44, 34, 22, 0.1)'
                  }}
                >
                  <CityPicker
                    latitude={coords.latitude}
                    longitude={coords.longitude}
                    onLocationSelect={handleLocationSelect}
                  />
                </div>

                <MapContainer
                  center={position}
                  zoom={zoom}
                  style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
                >
                  <MapController center={position} zoom={zoom} />
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {hasCoords && (
                    <Marker position={position} icon={defaultIcon}>
                      <Popup>
                        <strong>{event.titre}</strong>
                      </Popup>
                    </Marker>
                  )}
                </MapContainer>
              </div>
            )}
          </div>

          {/* COLONNE DROITE : BLOCS LIBRES & CONTEXTE */}
          <div
            style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              overflowY: 'auto'
            }}
          >
            {/* Contexte principal */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: 10,
                border: '1px solid #e7ded0',
                padding: 10,
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                flexShrink: 0
              }}
            >
              <label style={{ fontSize: 11, fontWeight: 700, color: '#57534e', textTransform: 'uppercase' }}>
                Contexte & Description principale
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Rédigez les détails du contexte historique..."
                style={{
                  width: '100%',
                  border: 'none',
                  outline: 'none',
                  fontSize: 12,
                  lineHeight: 1.5,
                  color: '#1c1917',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Boutons d'ajout de blocs libres */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#78716c', textTransform: 'uppercase' }}>
                Blocs & Références ({blocs.length})
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  onClick={() => { setNewBlockType('text'); setNewBlockContent({ titre: '', url: '', texte: '' }); }}
                  style={{
                    padding: '4px 8px',
                    borderRadius: 6,
                    border: '1px solid #d6cebf',
                    backgroundColor: '#ffffff',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    color: '#44403c'
                  }}
                >
                  ➕ Bloc texte
                </button>
                <button
                  type="button"
                  onClick={() => { setNewBlockType('link'); setNewBlockContent({ titre: '', url: '', texte: '' }); }}
                  style={{
                    padding: '4px 8px',
                    borderRadius: 6,
                    border: '1px solid #d6cebf',
                    backgroundColor: '#ffffff',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    color: '#44403c'
                  }}
                >
                  ➕ Bloc lien
                </button>
              </div>
            </div>

            {/* Formulaire d'ajout de bloc */}
            {newBlockType && (
              <form
                onSubmit={handleAddBlockSubmit}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: 10,
                  border: '1px solid #b45309',
                  padding: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#b45309' }}>
                    {newBlockType === 'text' ? 'Nouveau bloc de texte' : 'Nouveau lien de recherche'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setNewBlockType(null)}
                    style={{ border: 'none', background: 'transparent', fontSize: 12, cursor: 'pointer', color: '#78716c' }}
                  >
                    ✕
                  </button>
                </div>

                <input
                  type="text"
                  required
                  placeholder="Titre du bloc ou de la source"
                  value={newBlockContent.titre}
                  onChange={(e) => setNewBlockContent(prev => ({ ...prev, titre: e.target.value }))}
                  style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid #d6cebf', fontSize: 11, outline: 'none' }}
                />

                {newBlockType === 'link' && (
                  <input
                    type="text"
                    required
                    placeholder="URL du lien (ex. https://...)"
                    value={newBlockContent.url}
                    onChange={(e) => setNewBlockContent(prev => ({ ...prev, url: e.target.value }))}
                    style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid #d6cebf', fontSize: 11, outline: 'none' }}
                  />
                )}

                <textarea
                  rows={2}
                  placeholder="Notes, extraits ou remarques..."
                  value={newBlockContent.texte}
                  onChange={(e) => setNewBlockContent(prev => ({ ...prev, texte: e.target.value }))}
                  style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid #d6cebf', fontSize: 11, outline: 'none', resize: 'vertical' }}
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => setNewBlockType(null)}
                    style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #d6cebf', background: '#fff', fontSize: 11, cursor: 'pointer' }}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: '#b45309', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Ajouter ce bloc
                  </button>
                </div>
              </form>
            )}

            {/* Liste des blocs personnalisés */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 10 }}>
              {blocs.length === 0 && !newBlockType && (
                <div style={{ color: '#a8a29e', fontSize: 11, fontStyle: 'italic', padding: 8 }}>
                  Aucun bloc personnalisé.
                </div>
              )}

              {blocs.map((bloc) => (
                <div
                  key={bloc.id}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: 8,
                    border: '1px solid #e7ded0',
                    padding: '8px 10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#1c1917' }}>
                      {bloc.type === 'link' ? '🔗 ' : '📝 '}
                      {bloc.titre}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveBlock(bloc.id)}
                      title="Supprimer ce bloc"
                      style={{ border: 'none', background: 'transparent', color: '#e11d48', cursor: 'pointer', fontSize: 11 }}
                    >
                      ✕
                    </button>
                  </div>

                  {bloc.url && (
                    <a
                      href={bloc.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: 10, color: '#b45309', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {bloc.url} ↗
                    </a>
                  )}

                  {bloc.texte && (
                    <p style={{ margin: 0, fontSize: 11, color: '#57534e', lineHeight: 1.4 }}>
                      {bloc.texte}
                    </p>
                  )}
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>

      {/* Modale de recherche Wikimedia */}
      <WikimediaPickerModal
        isOpen={isWikiPickerOpen}
        onClose={() => setIsWikiPickerOpen(false)}
        onSelectImage={handleSelectWikimedia}
      />

      {/* Lightbox plein écran */}
      {previewCard && (
        <div
          onClick={() => setPreviewCard(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            backgroundColor: 'rgba(28, 25, 23, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            cursor: 'zoom-out'
          }}
        >
          <div style={{ position: 'absolute', top: 18, right: 24 }}>
            <button
              onClick={() => setPreviewCard(null)}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
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
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)'
            }}
          />
          <div style={{ marginTop: 10, padding: '4px 12px', backgroundColor: '#fff', borderRadius: 16, fontSize: 11, color: '#1c1917' }}>
            {previewCard.titre}
          </div>
        </div>
      )}
    </>
  );
}