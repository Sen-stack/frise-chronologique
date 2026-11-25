import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase.js';
import WikimediaPickerModal from './WikimediaPickerModal.jsx';

export default function KnowledgeSplitView({ event, isOpen, onClose, onStartDrawTerritory, onDeleteTerritory }) {
  if (!isOpen || !event) return null;

  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [blocs, setBlocs] = useState([]);
  const [cartes, setCartes] = useState([]);
  const [previewCard, setPreviewCard] = useState(null);
  const [saveMessage, setSaveMessage] = useState('');

  const [groupEvents, setGroupEvents] = useState([]);
  const [loadingGroup, setLoadingGroup] = useState(false);

  const [isWikiPickerOpen, setIsWikiPickerOpen] = useState(false);
  const [isAddingDirectUrl, setIsAddingDirectUrl] = useState(false);
  const [directCardUrl, setDirectCardUrl] = useState('');
  const [directCardTitre, setDirectCardTitre] = useState('');

  const [newBlockType, setNewBlockType] = useState(null);
  const [newBlockContent, setNewBlockContent] = useState({ titre: '', url: '', texte: '' });

  const fileInputRef = useRef(null);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (event) {
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

  const handleSave = async (updatedBlocs = blocs, updatedCartes = cartes) => {
    setSaveMessage('');

    const payload = {
      references_bento: updatedBlocs,
      cartes_historiques: updatedCartes,
      carte_historique_url: updatedCartes[0]?.url || null,
      carte_legende: updatedCartes[0]?.titre || null
    };

    const { error } = await supabase
      .from('evenements')
      .update(payload)
      .eq('id', event.id);

    if (error) {
      setSaveMessage('Erreur');
    } else {
      setSaveMessage('✓');
      event.references_bento = payload.references_bento;
      event.cartes_historiques = payload.cartes_historiques;
      event.carte_historique_url = payload.carte_historique_url;
      event.carte_legende = payload.carte_legende;
      setTimeout(() => setSaveMessage(''), 1500);
    }
  };

  const processImageFile = (file, customTitle = '') => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result;
      if (!dataUrl) return;
      const cleanName = customTitle || file.name?.replace(/\.[^/.]+$/, '') || 'Image';
      const nouvelle = {
        source: 'upload',
        titre: cleanName,
        url: dataUrl
      };
      setCartes(prev => {
        const nextList = [...prev, nouvelle];
        handleSave(blocs, nextList);
        return nextList;
      });
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const blob = items[i].getAsFile();
          if (blob) {
            e.preventDefault();
            processImageFile(blob, 'Image collée');
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [blocs, event?.id]);

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

  const handleSelectWikimedia = (nouvelleCarte) => {
    const nextList = [...cartes, nouvelleCarte];
    setCartes(nextList);
    handleSave(blocs, nextList);
  };

  const handleAddDirectUrlSubmit = (e) => {
    e.preventDefault();
    if (!directCardUrl.trim()) return;
    const nouvelle = {
      source: 'web',
      titre: directCardTitre.trim() || 'Document',
      url: directCardUrl.trim()
    };
    const nextList = [...cartes, nouvelle];
    setCartes(nextList);
    setDirectCardUrl('');
    setDirectCardTitre('');
    setIsAddingDirectUrl(false);
    handleSave(blocs, nextList);
  };

  const handleRemoveCard = (index) => {
    const nextList = cartes.filter((_, i) => i !== index);
    setCartes(nextList);
    handleSave(blocs, nextList);
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
    handleSave(nextBlocs, cartes);
  };

  const handleRemoveBlock = (blockId) => {
    const nextBlocs = blocs.filter(b => b.id !== blockId);
    setBlocs(nextBlocs);
    handleSave(nextBlocs, cartes);
  };

  const iconBtnStyle = {
    height: 28,
    padding: '0 8px',
    borderRadius: 9,
    border: '1px solid rgba(255, 255, 255, 0.85)',
    backgroundColor: '#eaf0f6',
    boxShadow: '2px 2px 5px rgba(166, 180, 200, 0.5), -2px -2px 5px rgba(255, 255, 255, 0.9)',
    color: '#475569',
    fontSize: 11,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4
  };

  const panelContent = (
    <div
      onClick={(e) => e.stopPropagation()}
      style={
        isMobile
          ? {
              width: '100%',
              maxWidth: 460,
              maxHeight: '88dvh',
              backgroundColor: '#eaf0f6',
              borderRadius: 24,
              border: '1px solid rgba(255, 255, 255, 0.85)',
              boxShadow: '12px 12px 28px rgba(15, 23, 42, 0.35)',
              display: 'flex',
              flexDirection: 'column',
              color: '#1e293b',
              overflow: 'hidden',
              boxSizing: 'border-box',
              fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
            }
          : {
              position: 'fixed',
              top: 0,
              right: 0,
              width: 450,
              maxWidth: '92vw',
              height: '100vh',
              backgroundColor: '#eaf0f6',
              borderLeft: '1px solid rgba(255, 255, 255, 0.85)',
              boxShadow: '-10px 0 28px rgba(166, 180, 200, 0.55)',
              zIndex: 1000,
              display: 'flex',
              flexDirection: 'column',
              color: '#1e293b',
              boxSizing: 'border-box',
              fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
            }
      }
    >
      {/* En-tête épuré */}
      <div
        style={{
          padding: '14px 18px',
          borderBottom: '1px solid rgba(166, 180, 200, 0.35)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0, paddingRight: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {event.groupe_id && (
              <span
                style={{
                  fontSize: 9.5,
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 10,
                  backgroundColor: '#5b4fe8',
                  color: '#ffffff'
                }}
              >
                {event.groupe_id}
              </span>
            )}
            <span style={{ fontSize: 11.5, color: '#5b4fe8', fontWeight: 700 }}>
              {anneeAffichee}
            </span>
            {saveMessage && (
              <span style={{ fontSize: 11, color: '#10b981', fontWeight: 700 }}>
                {saveMessage}
              </span>
            )}
          </div>
          <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1e293b', lineHeight: 1.25, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {event.titre}
          </h1>
        </div>

        <button
          type="button"
          onClick={onClose}
          title="Fermer"
          style={{
            width: 30,
            height: 30,
            borderRadius: '50%',
            backgroundColor: '#eaf0f6',
            border: '1px solid rgba(255, 255, 255, 0.85)',
            boxShadow: '3px 3px 6px rgba(166, 180, 200, 0.5), -3px -3px 6px rgba(255, 255, 255, 0.9)',
            color: '#64748b',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          ✕
        </button>
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
        {/* SECTION : TERRITOIRE SUR LA CARTE (Uniquement sur navigateur PC) */}
        {!isMobile && (
          <div
            style={{
              backgroundColor: '#eaf0f6',
              borderRadius: 14,
              border: '1px solid rgba(255, 255, 255, 0.8)',
              boxShadow: '4px 4px 10px rgba(166, 180, 200, 0.45), -4px -4px 10px rgba(255, 255, 255, 0.85)',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
              flexShrink: 0
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                Territoire sur la carte
              </span>
              <span style={{ fontSize: 11, color: hasTerritory ? '#10b981' : '#64748b', fontWeight: 600 }}>
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
                    padding: '6px 12px',
                    borderRadius: 9,
                    border: 'none',
                    backgroundColor: '#5b4fe8',
                    color: '#ffffff',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '2px 2px 6px rgba(91, 79, 232, 0.35)'
                  }}
                >
                  {hasTerritory ? 'Redessiner' : 'Dessiner'}
                </button>
              )}
              {hasTerritory && onDeleteTerritory && (
                <button
                  type="button"
                  onClick={() => onDeleteTerritory(event)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 9,
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
        )}

        {/* SECTION : AJOUT TEXTE / LIEN AU-DESSUS DE LA GALERIE */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
            <button
              type="button"
              title="Ajouter un texte"
              onClick={() => { setNewBlockType('text'); setNewBlockContent({ titre: '', url: '', texte: '' }); }}
              style={iconBtnStyle}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="17" y1="10" x2="3" y2="10" />
                <line x1="21" y1="6" x2="3" y2="6" />
                <line x1="21" y1="14" x2="3" y2="14" />
                <line x1="17" y1="18" x2="3" y2="18" />
              </svg>
            </button>
            <button
              type="button"
              title="Ajouter un lien"
              onClick={() => { setNewBlockType('link'); setNewBlockContent({ titre: '', url: '', texte: '' }); }}
              style={iconBtnStyle}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            </button>
          </div>

          {newBlockType && (
            <form
              onSubmit={handleAddBlockSubmit}
              style={{
                backgroundColor: '#eaf0f6',
                borderRadius: 12,
                border: '1px solid #5b4fe8',
                padding: 10,
                display: 'flex',
                flexDirection: 'column',
                gap: 6
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#5b4fe8' }}>
                  {newBlockType === 'text' ? 'Note' : 'Lien'}
                </span>
                <button
                  type="button"
                  onClick={() => setNewBlockType(null)}
                  style={{ border: 'none', background: 'transparent', fontSize: 11, cursor: 'pointer', color: '#64748b' }}
                >
                  ✕
                </button>
              </div>
              <input
                type="text"
                required
                placeholder="Titre"
                value={newBlockContent.titre}
                onChange={(e) => setNewBlockContent(prev => ({ ...prev, titre: e.target.value }))}
                style={{ padding: '5px 8px', borderRadius: 8, border: 'none', backgroundColor: '#dfe6ee', fontSize: 11, outline: 'none' }}
              />
              {newBlockType === 'link' && (
                <input
                  type="text"
                  required
                  placeholder="https://..."
                  value={newBlockContent.url}
                  onChange={(e) => setNewBlockContent(prev => ({ ...prev, url: e.target.value }))}
                  style={{ padding: '5px 8px', borderRadius: 8, border: 'none', backgroundColor: '#dfe6ee', fontSize: 11, outline: 'none' }}
                />
              )}
              <textarea
                rows={2}
                placeholder="Contenu..."
                value={newBlockContent.texte}
                onChange={(e) => setNewBlockContent(prev => ({ ...prev, texte: e.target.value }))}
                style={{ padding: '5px 8px', borderRadius: 8, border: 'none', backgroundColor: '#dfe6ee', fontSize: 11, outline: 'none', resize: 'vertical' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                <button
                  type="submit"
                  style={{ padding: '5px 12px', borderRadius: 8, border: 'none', backgroundColor: '#5b4fe8', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                >
                  ✓
                </button>
              </div>
            </form>
          )}

          {blocs.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {blocs.map((bloc) => (
                <div
                  key={bloc.id}
                  style={{
                    backgroundColor: '#eaf0f6',
                    borderRadius: 12,
                    border: '1px solid rgba(255, 255, 255, 0.8)',
                    boxShadow: '3px 3px 8px rgba(166, 180, 200, 0.45), -3px -3px 8px rgba(255, 255, 255, 0.85)',
                    padding: '8px 10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: '#1e293b' }}>
                      {bloc.titre}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveBlock(bloc.id)}
                      style={{ border: 'none', background: 'transparent', color: '#e11d48', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}
                    >
                      ✕
                    </button>
                  </div>
                  {bloc.url && (
                    <a
                      href={bloc.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: 10.5, color: '#5b4fe8', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {bloc.url} ↗
                    </a>
                  )}
                  {bloc.texte && (
                    <p style={{ margin: 0, fontSize: 11, color: '#475569', lineHeight: 1.45 }}>
                      {bloc.texte}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION : GALERIE */}
        <div
          style={{
            minHeight: isMobile ? 280 : 340,
            flexShrink: 0,
            backgroundColor: '#eaf0f6',
            borderRadius: 16,
            border: '1px solid rgba(255, 255, 255, 0.8)',
            boxShadow: '4px 4px 10px rgba(166, 180, 200, 0.45), -4px -4px 10px rgba(255, 255, 255, 0.85)',
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
              padding: '8px 12px',
              borderBottom: '1px solid rgba(166, 180, 200, 0.3)',
              zIndex: 10,
              flexShrink: 0
            }}
          >
            <span style={{ fontSize: 11.5, fontWeight: 700, color: '#1e293b' }}>
              Galerie ({cartes.length})
            </span>

            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  files.forEach(f => processImageFile(f));
                  e.target.value = '';
                }}
              />
              <button
                type="button"
                title="Joindre une image"
                onClick={() => fileInputRef.current?.click()}
                style={iconBtnStyle}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                </svg>
              </button>

              <button
                type="button"
                onClick={() => setIsWikiPickerOpen(true)}
                style={{ ...iconBtnStyle, color: '#5b4fe8' }}
              >
                Wikimedia
              </button>

              <button
                type="button"
                onClick={() => setIsAddingDirectUrl(!isAddingDirectUrl)}
                style={iconBtnStyle}
              >
                {isAddingDirectUrl ? '✕' : '+ URL'}
              </button>
            </div>
          </div>

          {isAddingDirectUrl && (
            <form
              onSubmit={handleAddDirectUrlSubmit}
              style={{
                padding: 8,
                backgroundColor: '#dfe6ee',
                borderBottom: '1px solid rgba(166, 180, 200, 0.3)',
                display: 'flex',
                gap: 6,
                alignItems: 'center',
                zIndex: 10
              }}
            >
              <input
                type="text"
                placeholder="Titre"
                value={directCardTitre}
                onChange={(e) => setDirectCardTitre(e.target.value)}
                style={{ flex: 1, padding: '5px 8px', borderRadius: 8, border: 'none', backgroundColor: '#eaf0f6', fontSize: 11, outline: 'none' }}
              />
              <input
                type="text"
                required
                placeholder="https://..."
                value={directCardUrl}
                onChange={(e) => setDirectCardUrl(e.target.value)}
                style={{ flex: 2, padding: '5px 8px', borderRadius: 8, border: 'none', backgroundColor: '#eaf0f6', fontSize: 11, outline: 'none' }}
              />
              <button
                type="submit"
                style={{ padding: '5px 10px', borderRadius: 8, border: 'none', backgroundColor: '#5b4fe8', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
              >
                ✓
              </button>
            </form>
          )}

          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: 10,
              backgroundColor: '#dfe6ee',
              boxShadow: 'inset 2px 2px 5px rgba(166, 180, 200, 0.45)',
              boxSizing: 'border-box'
            }}
          >
            {cartes.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 220, alignItems: 'center', justifyContent: 'center', gap: 8, color: '#64748b', fontSize: 11, textAlign: 'center', padding: 12 }}>
                <span>Collez une image (Ctrl+V), joignez un fichier ou choisissez sur Wikimedia.</span>
              </div>
            ) : cartes.length === 1 ? (
              <div style={{ height: '100%', minHeight: 240, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <img
                  src={cartes[0].url}
                  alt={cartes[0].titre}
                  referrerPolicy="no-referrer"
                  onClick={() => setPreviewCard(cartes[0])}
                  style={{ maxWidth: '100%', maxHeight: 250, objectFit: 'contain', borderRadius: 10, cursor: 'zoom-in', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                  <span style={{ fontSize: 10.5, color: '#475569', fontWeight: 600 }}>{cartes[0].titre}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCard(0)}
                    style={{ border: 'none', background: 'transparent', color: '#e11d48', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ columnCount: 2, columnGap: 10 }}>
                {cartes.map((c, idx) => (
                  <div
                    key={idx}
                    style={{
                      breakInside: 'avoid',
                      marginBottom: 10,
                      borderRadius: 10,
                      overflow: 'hidden',
                      backgroundColor: '#eaf0f6',
                      border: '1px solid rgba(255, 255, 255, 0.8)',
                      boxShadow: '2px 2px 6px rgba(166, 180, 200, 0.45)',
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
                    <div style={{ padding: '5px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 9.5, color: '#334155', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.titre}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCard(idx)}
                        style={{ border: 'none', background: 'transparent', color: '#e11d48', cursor: 'pointer', fontSize: 10.5, fontWeight: 700 }}
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

        {/* SECTION : ÉTAPES DU FIL SI THÉMATIQUE */}
        {event.groupe_id && (
          <div
            style={{
              backgroundColor: '#eaf0f6',
              borderRadius: 14,
              border: '1px solid rgba(255, 255, 255, 0.8)',
              boxShadow: '4px 4px 10px rgba(166, 180, 200, 0.45), -4px -4px 10px rgba(255, 255, 255, 0.85)',
              padding: 10,
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              flexShrink: 0
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: '#5b4fe8', textTransform: 'uppercase' }}>
                {event.groupe_id} ({groupEvents.length})
              </label>
              {loadingGroup && <span style={{ fontSize: 9, color: '#64748b' }}>...</span>}
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
                      padding: '4px 8px',
                      borderRadius: 8,
                      backgroundColor: isCurrent ? '#ffffff' : '#dfe6ee',
                      border: isCurrent ? '1px solid #5b4fe8' : '1px solid transparent',
                      fontSize: 10.5
                    }}
                  >
                    <span style={{ fontWeight: isCurrent ? 700 : 500, color: '#1e293b' }}>{item.titre}</span>
                    <span style={{ color: '#64748b', fontVariantNumeric: 'tabular-nums' }}>{dateStr}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {isMobile ? (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            backgroundColor: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 14
          }}
        >
          {panelContent}
        </div>
      ) : (
        panelContent
      )}

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
            backgroundColor: 'rgba(15, 23, 42, 0.88)',
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
              borderRadius: 10,
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)'
            }}
          />
          <div style={{ marginTop: 10, padding: '4px 12px', backgroundColor: '#eaf0f6', borderRadius: 16, fontSize: 11, fontWeight: 600, color: '#1e293b' }}>
            {previewCard.titre}
          </div>
        </div>
      )}
    </>
  );
}