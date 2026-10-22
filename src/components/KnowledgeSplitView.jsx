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

function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
      if (center && !isNaN(center[0]) && !isNaN(center[1])) {
        map.setView(center, zoom);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [map, center, zoom]);
  return null;
}

export default function KnowledgeSplitView({ event, isOpen, onClose }) {
  if (!isOpen || !event) return null;

  const [description, setDescription] = useState('');
  const [blocs, setBlocs] = useState([]);
  const [cartes, setCartes] = useState([]);
  const [activeTab, setActiveTab] = useState('archives');
  const [previewCard, setPreviewCard] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const [groupEvents, setGroupEvents] = useState([]);
  const [loadingGroup, setLoadingGroup] = useState(false);

  const [coords, setCoords] = useState({ latitude: null, longitude: null });
  const [lieux, setLieux] = useState([]);
  const [nouveauRole, setNouveauRole] = useState('');
  const [villeSelectionnee, setVilleSelectionnee] = useState(null);

  const [isWikiPickerOpen, setIsWikiPickerOpen] = useState(false);
  const [isAddingDirectUrl, setIsAddingDirectUrl] = useState(false);
  const [directCardUrl, setDirectCardUrl] = useState('');
  const [directCardTitre, setDirectCardTitre] = useState('');

  const [newBlockType, setNewBlockType] = useState(null);
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

      const listeLieux = Array.isArray(event.lieux) ? event.lieux : [];
      setLieux(listeLieux);

      const initialLat = event.latitude !== null && event.latitude !== undefined && !isNaN(event.latitude)
        ? Number(event.latitude)
        : (listeLieux[0] ? Number(listeLieux[0].latitude) : null);

      const initialLng = event.longitude !== null && event.longitude !== undefined && !isNaN(event.longitude)
        ? Number(event.longitude)
        : (listeLieux[0] ? Number(listeLieux[0].longitude) : null);

      setCoords({ latitude: initialLat, longitude: initialLng });
      setVilleSelectionnee(null);
      setNouveauRole('');
      setSaveMessage('');

      if (event.groupe_id) {
        setLoadingGroup(true);
        supabase
          .from('evenements')
          .select('*')
          .eq('groupe_id', event.groupe_id)
          .order('date_debut', { ascending: true })
          .then(({ data, error }) => {
            if (!error && data) setGroupEvents(data);
            setLoadingGroup(false);
          });
      } else {
        setGroupEvents([]);
      }
    }
  }, [event]);

  const hasCoords = (coords.latitude !== null && coords.longitude !== null && !isNaN(coords.latitude)) || (lieux.length > 0);
  const position = lieux.length > 0
    ? [Number(lieux[0].latitude), Number(lieux[0].longitude)]
    : (coords.latitude !== null ? [coords.latitude, coords.longitude] : [41.9028, 12.4964]);
  const zoom = Number(event.zoom_niveau) || (hasCoords ? 6 : 4);

  const anneeAffichee = event.date_debut < 0
    ? `${Math.abs(event.date_debut)} BCE`
    : `${event.date_debut} CE`;

  const handleSave = async (updatedBlocs = blocs, updatedCartes = cartes, updatedDesc = description, updatedCoords = coords, updatedLieux = lieux) => {
    setIsSaving(true);
    setSaveMessage('');

    const finalCoords = {
      latitude: updatedLieux.length > 0 ? Number(updatedLieux[0].latitude) : updatedCoords.latitude,
      longitude: updatedLieux.length > 0 ? Number(updatedLieux[0].longitude) : updatedCoords.longitude
    };

    const payload = {
      description: updatedDesc.trim() || null,
      references_bento: updatedBlocs,
      cartes_historiques: updatedCartes,
      carte_historique_url: updatedCartes[0]?.url || null,
      carte_legende: updatedCartes[0]?.titre || null,
      latitude: finalCoords.latitude,
      longitude: finalCoords.longitude,
      lieux: updatedLieux
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
      event.lieux = payload.lieux;
      setCoords(finalCoords);
      setTimeout(() => setSaveMessage(''), 2000);
    }
  };

  const handleLocationSelect = (loc) => {
    if (!loc || loc.latitude === null) {
      setVilleSelectionnee(null);
      return;
    }
    setVilleSelectionnee(loc);
  };

  const handleAddLieu = (e) => {
    if (e) e.preventDefault();
    if (!villeSelectionnee) return;

    const nomDetecte = villeSelectionnee.name 
      || villeSelectionnee.nom 
      || villeSelectionnee.ville 
      || villeSelectionnee.label 
      || (typeof villeSelectionnee === 'string' ? villeSelectionnee : 'Lieu');

    const point = {
      id: Date.now(),
      nom: nomDetecte,
      role: nouveauRole.trim() || 'Lieu associé',
      latitude: Number(villeSelectionnee.latitude),
      longitude: Number(villeSelectionnee.longitude)
    };

    const nextLieux = [...lieux, point];
    setLieux(nextLieux);
    setVilleSelectionnee(null);
    setNouveauRole('');

    const nextCoords = {
      latitude: Number(point.latitude),
      longitude: Number(point.longitude)
    };
    setCoords(nextCoords);
    handleSave(blocs, cartes, description, nextCoords, nextLieux);
  };

  const handleRemoveLieu = (lieuId) => {
    const nextLieux = lieux.filter(l => l.id !== lieuId);
    setLieux(nextLieux);
    const nextCoords = nextLieux.length > 0 
      ? { latitude: Number(nextLieux[0].latitude), longitude: Number(nextLieux[0].longitude) }
      : { latitude: null, longitude: null };
    setCoords(nextCoords);
    handleSave(blocs, cartes, description, nextCoords, nextLieux);
  };

  const handleSelectWikimedia = (nouvelleCarte) => {
    const nextList = [...cartes, nouvelleCarte];
    setCartes(nextList);
    setActiveTab('archives');
    handleSave(blocs, nextList, description, coords, lieux);
  };

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
    handleSave(blocs, nextList, description, coords, lieux);
  };

  const handleRemoveCard = (index) => {
    const nextList = cartes.filter((_, i) => i !== index);
    setCartes(nextList);
    handleSave(blocs, nextList, description, coords, lieux);
  };

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
    handleSave(nextBlocs, cartes, description, coords, lieux);
  };

  const handleRemoveBlock = (blockId) => {
    const nextBlocs = blocs.filter(b => b.id !== blockId);
    setBlocs(nextBlocs);
    handleSave(nextBlocs, cartes, description, coords, lieux);
  };

  return (
    <>
      {/* Conteneur tiroir latéral droit (Slide-over drawer) */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: 480,
          maxWidth: '92vw',
          height: '100vh',
          backgroundColor: '#faf7f2',
          borderLeft: '1px solid #e7ded0',
          boxShadow: '-8px 0 32px rgba(44, 34, 22, 0.16)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          color: '#1c1917',
          boxSizing: 'border-box',
          fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
        }}
      >
        {/* En-tête */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #e7ded0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#fff',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0, paddingRight: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {event.groupe_id && (
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                    padding: '2px 6px',
                    borderRadius: 10,
                    backgroundColor: '#b45309',
                    color: '#ffffff'
                  }}
                >
                  Fil : {event.groupe_id}
                </span>
              )}
              <span style={{ fontSize: 12, color: '#b45309', fontWeight: 700 }}>
                {anneeAffichee}
              </span>
              {saveMessage && (
                <span style={{ fontSize: 11, color: '#15803d', fontWeight: 600 }}>
                  {saveMessage}
                </span>
              )}
            </div>
            <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1c1917', lineHeight: 1.25, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {event.titre}
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => handleSave()}
              disabled={isSaving}
              style={{
                padding: '5px 10px',
                borderRadius: 6,
                border: 'none',
                backgroundColor: '#b45309',
                color: '#ffffff',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {isSaving ? '...' : 'Enregistrer'}
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Fermer le volet"
              style={{
                background: '#f2ece1',
                border: '1px solid #e7ded0',
                color: '#57534e',
                borderRadius: 6,
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

        {/* Corps déroulant empilé verticalement */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            padding: 16,
            overflowY: 'auto',
            boxSizing: 'border-box'
          }}
        >
          {/* SECTION : ARCHIVES ET GÉOLOCALISATION */}
          <div
            style={{
              height: 280,
              flexShrink: 0,
              backgroundColor: '#f3ece0',
              borderRadius: 10,
              border: '1px solid #e7ded0',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative'
            }}
          >
            {/* Barre d'onglets */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 10px',
                backgroundColor: 'rgba(250, 247, 242, 0.95)',
                borderBottom: '1px solid #e7ded0',
                zIndex: 10,
                flexShrink: 0
              }}
            >
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('archives')}
                  style={{
                    padding: '3px 8px',
                    borderRadius: 5,
                    border: 'none',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    backgroundColor: activeTab === 'archives' ? '#ffffff' : 'transparent',
                    color: activeTab === 'archives' ? '#1c1917' : '#78716c'
                  }}
                >
                  Archives ({cartes.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('moderne')}
                  style={{
                    padding: '3px 8px',
                    borderRadius: 5,
                    border: 'none',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    backgroundColor: activeTab === 'moderne' ? '#ffffff' : 'transparent',
                    color: activeTab === 'moderne' ? '#1c1917' : '#78716c'
                  }}
                >
                  Carte
                </button>
              </div>

              {activeTab === 'archives' && (
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    type="button"
                    onClick={() => setIsWikiPickerOpen(true)}
                    style={{
                      padding: '2px 6px',
                      borderRadius: 5,
                      border: '1px solid #0284c7',
                      backgroundColor: 'rgba(2, 132, 199, 0.1)',
                      fontSize: 10,
                      fontWeight: 600,
                      color: '#0284c7',
                      cursor: 'pointer'
                    }}
                  >
                    Wikimedia
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingDirectUrl(!isAddingDirectUrl)}
                    style={{
                      padding: '2px 6px',
                      borderRadius: 5,
                      border: '1px solid #d6cebf',
                      backgroundColor: '#ffffff',
                      fontSize: 10,
                      fontWeight: 600,
                      color: '#57534e',
                      cursor: 'pointer'
                    }}
                  >
                    {isAddingDirectUrl ? '✕' : '+ URL'}
                  </button>
                </div>
              )}
            </div>

            {/* Formulaire manuel d'URL */}
            {isAddingDirectUrl && (
              <form
                onSubmit={handleAddDirectUrlSubmit}
                style={{
                  padding: 6,
                  backgroundColor: '#ffffff',
                  borderBottom: '1px solid #e7ded0',
                  display: 'flex',
                  gap: 4,
                  alignItems: 'center',
                  zIndex: 10
                }}
              >
                <input
                  type="text"
                  placeholder="Titre"
                  value={directCardTitre}
                  onChange={(e) => setDirectCardTitre(e.target.value)}
                  style={{ flex: 1, padding: '3px 6px', borderRadius: 4, border: '1px solid #d6cebf', fontSize: 10, outline: 'none' }}
                />
                <input
                  type="text"
                  required
                  placeholder="URL directe"
                  value={directCardUrl}
                  onChange={(e) => setDirectCardUrl(e.target.value)}
                  style={{ flex: 2, padding: '3px 6px', borderRadius: 4, border: '1px solid #d6cebf', fontSize: 10, outline: 'none' }}
                />
                <button
                  type="submit"
                  style={{ padding: '3px 8px', borderRadius: 4, border: 'none', backgroundColor: '#b45309', color: '#fff', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}
                >
                  OK
                </button>
              </form>
            )}

            {/* Contenu : Galerie d'archives */}
            {activeTab === 'archives' && (
              <div style={{ flex: 1, overflowY: 'auto', padding: 8, backgroundColor: '#f5eee3', boxSizing: 'border-box' }}>
                {cartes.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center', gap: 6, color: '#78716c', fontSize: 11 }}>
                    <span>Aucun document d'archive associé.</span>
                    <button
                      type="button"
                      onClick={() => setIsWikiPickerOpen(true)}
                      style={{ padding: '4px 8px', borderRadius: 5, border: '1px solid #0284c7', backgroundColor: '#ffffff', fontSize: 10, fontWeight: 600, color: '#0284c7', cursor: 'pointer' }}
                    >
                      Ouvrir Wikimedia
                    </button>
                  </div>
                ) : cartes.length === 1 ? (
                  <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <img
                      src={cartes[0].url}
                      alt={cartes[0].titre}
                      referrerPolicy="no-referrer"
                      onClick={() => setPreviewCard(cartes[0])}
                      style={{ maxWidth: '100%', maxHeight: '80%', objectFit: 'contain', borderRadius: 6, cursor: 'zoom-in' }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <span style={{ fontSize: 10, color: '#57534e', fontStyle: 'italic' }}>{cartes[0].titre}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCard(0)}
                        style={{ border: 'none', background: 'transparent', color: '#e11d48', cursor: 'pointer', fontSize: 11 }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ columnCount: 2, columnGap: 8 }}>
                    {cartes.map((c, idx) => (
                      <div
                        key={idx}
                        style={{
                          breakInside: 'avoid',
                          marginBottom: 8,
                          borderRadius: 6,
                          overflow: 'hidden',
                          backgroundColor: '#ffffff',
                          border: '1px solid #e7ded0',
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
                        <div style={{ padding: '4px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 9, color: '#44403c', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {c.titre}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveCard(idx)}
                            style={{ border: 'none', background: 'transparent', color: '#e11d48', cursor: 'pointer', fontSize: 10 }}
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

            {/* Contenu : Mini-carte Leaflet locale */}
            {activeTab === 'moderne' && (
              <div style={{ flex: 1, width: '100%', height: '100%', position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    top: 6,
                    left: 48,
                    right: 6,
                    zIndex: 1000,
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(8px)',
                    padding: '6px 8px',
                    borderRadius: 8,
                    border: '1px solid #e7ded0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4
                  }}
                >
                  <CityPicker
                    latitude={villeSelectionnee?.latitude || null}
                    longitude={villeSelectionnee?.longitude || null}
                    onLocationSelect={handleLocationSelect}
                  />
                  {villeSelectionnee && (
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <input
                        type="text"
                        placeholder="Rôle (ex: Port...)"
                        value={nouveauRole}
                        onChange={(e) => setNouveauRole(e.target.value)}
                        style={{ flex: 1, padding: '3px 6px', borderRadius: 4, border: '1px solid #d6cebf', fontSize: 10, outline: 'none' }}
                      />
                      <button
                        type="button"
                        onClick={handleAddLieu}
                        style={{ padding: '3px 8px', borderRadius: 4, border: 'none', backgroundColor: '#b45309', color: '#ffffff', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}
                      >
                        +
                      </button>
                    </div>
                  )}
                  {lieux.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, maxHeight: 40, overflowY: 'auto' }}>
                      {lieux.map((l) => (
                        <span
                          key={l.id}
                          style={{
                            fontSize: 9,
                            padding: '1px 5px',
                            backgroundColor: '#f3ece0',
                            borderRadius: 4,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 3
                          }}
                        >
                          <strong>{l.nom}</strong>
                          <button
                            type="button"
                            onClick={() => handleRemoveLieu(l.id)}
                            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#e11d48', fontSize: 9 }}
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <MapContainer
                  center={position}
                  zoom={zoom}
                  style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
                >
                  <MapController center={position} zoom={zoom} />
                  <TileLayer
                    attribution='Tiles &copy; Esri'
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
                  />
                  {lieux.map((l) => (
                    <Marker key={l.id} position={[Number(l.latitude), Number(l.longitude)]} icon={defaultIcon}>
                      <Popup>
                        <strong>{l.nom}</strong>
                        <br />
                        <span style={{ fontSize: 11, color: '#b45309' }}>{l.role}</span>
                      </Popup>
                    </Marker>
                  ))}
                  {lieux.length === 0 && hasCoords && coords.latitude !== null && (
                    <Marker position={[coords.latitude, coords.longitude]} icon={defaultIcon}>
                      <Popup>
                        <strong>{event.titre}</strong>
                      </Popup>
                    </Marker>
                  )}
                </MapContainer>
              </div>
            )}
          </div>

          {/* SECTION : FIL CONDUCTEUR */}
          {event.groupe_id && (
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: 8,
                border: '1px solid #e7ded0',
                padding: 10,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                flexShrink: 0
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: 10, fontWeight: 700, color: '#b45309', textTransform: 'uppercase' }}>
                  Étapes du fil « {event.groupe_id} » ({groupEvents.length})
                </label>
                {loadingGroup && <span style={{ fontSize: 9, color: '#a8a29e' }}>Chargement...</span>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 100, overflowY: 'auto' }}>
                {groupEvents.map(item => {
                  const isCurrent = item.id === event.id;
                  const dateStr = item.date_debut < 0 ? `${Math.abs(item.date_debut)} BCE` : `${item.date_debut} CE`;
                  return (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '4px 6px',
                        borderRadius: 5,
                        backgroundColor: isCurrent ? '#fef3c7' : '#f9f6f0',
                        border: isCurrent ? '1px solid #f59e0b' : '1px solid #e7ded0',
                        fontSize: 10
                      }}
                    >
                      <span style={{ fontWeight: isCurrent ? 700 : 500, color: '#1c1917' }}>{item.titre}</span>
                      <span style={{ color: '#8c7e72', fontVariantNumeric: 'tabular-nums' }}>{dateStr}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION : DESCRIPTION & CONTEXTE */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 8,
              border: '1px solid #e7ded0',
              padding: 10,
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              flexShrink: 0
            }}
          >
            <label style={{ fontSize: 10, fontWeight: 700, color: '#57534e', textTransform: 'uppercase' }}>
              Contexte historique
            </label>
            <textarea
              rows={4}
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

          {/* SECTION : BENTO DE RÉFÉRENCES */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#78716c', textTransform: 'uppercase' }}>
                Références & Blocs ({blocs.length})
              </span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  type="button"
                  onClick={() => { setNewBlockType('text'); setNewBlockContent({ titre: '', url: '', texte: '' }); }}
                  style={{
                    padding: '3px 6px',
                    borderRadius: 5,
                    border: '1px solid #d6cebf',
                    backgroundColor: '#ffffff',
                    fontSize: 10,
                    fontWeight: 600,
                    cursor: 'pointer',
                    color: '#44403c'
                  }}
                >
                  + Texte
                </button>
                <button
                  type="button"
                  onClick={() => { setNewBlockType('link'); setNewBlockContent({ titre: '', url: '', texte: '' }); }}
                  style={{
                    padding: '3px 6px',
                    borderRadius: 5,
                    border: '1px solid #d6cebf',
                    backgroundColor: '#ffffff',
                    fontSize: 10,
                    fontWeight: 600,
                    cursor: 'pointer',
                    color: '#44403c'
                  }}
                >
                  + Lien
                </button>
              </div>
            </div>

            {newBlockType && (
              <form
                onSubmit={handleAddBlockSubmit}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: 8,
                  border: '1px solid #b45309',
                  padding: 8,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#b45309' }}>
                    {newBlockType === 'text' ? 'Nouveau bloc texte' : 'Nouveau lien'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setNewBlockType(null)}
                    style={{ border: 'none', background: 'transparent', fontSize: 11, cursor: 'pointer', color: '#78716c' }}
                  >
                    ✕
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="Titre de la source"
                  value={newBlockContent.titre}
                  onChange={(e) => setNewBlockContent(prev => ({ ...prev, titre: e.target.value }))}
                  style={{ padding: '4px 6px', borderRadius: 4, border: '1px solid #d6cebf', fontSize: 11, outline: 'none' }}
                />
                {newBlockType === 'link' && (
                  <input
                    type="text"
                    required
                    placeholder="URL (ex. https://...)"
                    value={newBlockContent.url}
                    onChange={(e) => setNewBlockContent(prev => ({ ...prev, url: e.target.value }))}
                    style={{ padding: '4px 6px', borderRadius: 4, border: '1px solid #d6cebf', fontSize: 11, outline: 'none' }}
                  />
                )}
                <textarea
                  rows={2}
                  placeholder="Notes ou citations..."
                  value={newBlockContent.texte}
                  onChange={(e) => setNewBlockContent(prev => ({ ...prev, texte: e.target.value }))}
                  style={{ padding: '4px 6px', borderRadius: 4, border: '1px solid #d6cebf', fontSize: 11, outline: 'none', resize: 'vertical' }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                  <button
                    type="button"
                    onClick={() => setNewBlockType(null)}
                    style={{ padding: '3px 6px', borderRadius: 4, border: '1px solid #d6cebf', background: '#fff', fontSize: 10, cursor: 'pointer' }}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    style={{ padding: '3px 8px', borderRadius: 4, border: 'none', background: '#b45309', color: '#fff', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Ajouter
                  </button>
                </div>
              </form>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingBottom: 16 }}>
              {blocs.length === 0 && !newBlockType && (
                <div style={{ color: '#a8a29e', fontSize: 11, fontStyle: 'italic', padding: 6 }}>
                  Aucun bloc personnalisé.
                </div>
              )}
              {blocs.map((bloc) => (
                <div
                  key={bloc.id}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: 6,
                    border: '1px solid #e7ded0',
                    padding: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3
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

      <WikimediaPickerModal
        isOpen={isWikiPickerOpen}
        onClose={() => setIsWikiPickerOpen(false)}
        onSelectImage={handleSelectWikimedia}
      />

      {previewCard && (
        <div
          onClick={() => setPreviewCard(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1100,
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