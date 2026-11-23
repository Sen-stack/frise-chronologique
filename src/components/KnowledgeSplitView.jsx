import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase.js';
import WikimediaPickerModal from './WikimediaPickerModal.jsx';

export default function KnowledgeSplitView({ event, isOpen, onClose, onStartDrawTerritory, onDeleteTerritory }) {
  if (!isOpen || !event) return null;

  const [description, setDescription] = useState('');
  const [blocs, setBlocs] = useState([]);
  const [cartes, setCartes] = useState([]);
  const [previewCard, setPreviewCard] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const [groupEvents, setGroupEvents] = useState([]);
  const [loadingGroup, setLoadingGroup] = useState(false);

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

  const anneeAffichee = event.date_debut < 0
    ? `${Math.abs(event.date_debut)} BCE`
    : `${event.date_debut} CE`;

  const hasTerritory = Boolean(event.zone_geojson);
  const polygonCount = React.useMemo(() => {
    if (!event.zone_geojson || !event.zone_geojson.geometry) return 0;
    if (event.zone_geojson.geometry.type === 'MultiPolygon') {
      return event.zone_geojson.geometry.coordinates.length;
    }
    if (event.zone_geojson.geometry.type === 'Polygon') {
      return 1;
    }
    return 0;
  }, [event.zone_geojson]);

  const handleSave = async (updatedBlocs = blocs, updatedCartes = cartes, updatedDesc = description) => {
    setIsSaving(true);
    setSaveMessage('');

    const payload = {
      description: updatedDesc.trim() || null,
      references_bento: updatedBlocs,
      cartes_historiques: updatedCartes,
      carte_historique_url: updatedCartes[0]?.url || null,
      carte_legende: updatedCartes[0]?.titre || null
    };

    const { error } = await supabase
      .from('evenements')
      .update(payload)
      .eq('id', event.id);

    setIsSaving(false);
    if (error) {
      setSaveMessage('Erreur');
    } else {
      setSaveMessage('Enregistré');
      event.description = payload.description;
      event.references_bento = payload.references_bento;
      event.cartes_historiques = payload.cartes_historiques;
      event.carte_historique_url = payload.carte_historique_url;
      event.carte_legende = payload.carte_legende;
      setTimeout(() => setSaveMessage(''), 2000);
    }
  };

  const handleSelectWikimedia = (nouvelleCarte) => {
    const nextList = [...cartes, nouvelleCarte];
    setCartes(nextList);
    handleSave(blocs, nextList, description);
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
    handleSave(blocs, nextList, description);
  };

  const handleRemoveCard = (index) => {
    const nextList = cartes.filter((_, i) => i !== index);
    setCartes(nextList);
    handleSave(blocs, nextList, description);
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
    handleSave(nextBlocs, cartes, description);
  };

  const handleRemoveBlock = (blockId) => {
    const nextBlocs = blocs.filter(b => b.id !== blockId);
    setBlocs(nextBlocs);
    handleSave(nextBlocs, cartes, description);
  };

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: 440,
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

        {/* Corps déroulant */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            padding: 16,
            overflowY: 'auto',
            boxSizing: 'border-box'
          }}
        >
          {/* SECTION : TERRITOIRE VECTORIEL SUR LA CARTE GLOBALE */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 10,
              border: '1px solid #e7ded0',
              padding: '10px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
              flexShrink: 0
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#57534e', textTransform: 'uppercase' }}>
                Territoire sur la carte
              </span>
              <span style={{ fontSize: 11, color: hasTerritory ? '#15803d' : '#78716c', fontWeight: 600 }}>
                {hasTerritory
                  ? `${polygonCount} forme${polygonCount > 1 ? 's' : ''} tracée${polygonCount > 1 ? 's' : ''}`
                  : 'Aucune zone tracée'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {onStartDrawTerritory && (
                <button
                  type="button"
                  onClick={() => onStartDrawTerritory(event)}
                  style={{
                    padding: '6px 11px',
                    borderRadius: 7,
                    border: '1px solid #0284c7',
                    backgroundColor: '#e0f2fe',
                    color: '#0284c7',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {hasTerritory ? 'Redessiner' : 'Dessiner'}
                </button>
              )}
              {hasTerritory && onDeleteTerritory && (
                <button
                  type="button"
                  onClick={() => onDeleteTerritory(event)}
                  title="Supprimer les formes tracées"
                  style={{
                    padding: '6px 9px',
                    borderRadius: 7,
                    border: '1px solid #fecaca',
                    backgroundColor: '#fff1f2',
                    color: '#e11d48',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Supprimer
                </button>
              )}
            </div>
          </div>

          {/* SECTION : ARCHIVES & DOCUMENTS */}
          <div
            style={{
              height: 240,
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
              <span style={{ fontSize: 11, fontWeight: 700, color: '#1c1917' }}>
                Archives ({cartes.length})
              </span>

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
            </div>

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