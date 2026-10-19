import React, { useState, useEffect } from 'react';
import { COLOR_PRESETS } from '../utils/timelineMath.js';

export default function EventEditDrawer({
  isOpen,
  onClose,
  event,
  onSave,
  onDelete,
  availableTags,
  onToggleTag,
  availableGroups = []
}) {
  const [formData, setFormData] = useState({
    titre: '',
    groupe_id: '',
    anneeDebut: '',
    ereDebut: 'CE',
    anneeFin: '',
    ereFin: 'CE',
    isRange: false,
    couleur: '',
    importance: 3,
    tags: [],
    forme: 'bandeau',
    style_trait: 'plein',
    gravite: true
  });

  const [newGroupInput, setNewGroupInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!event) return;
    const isEvtRange = event.date_fin !== null && event.date_fin !== undefined && event.date_fin !== '';

    setFormData({
      titre: event.titre || '',
      groupe_id: event.groupe_id || '',
      anneeDebut: Math.abs(event.date_debut || 0).toString(),
      ereDebut: (event.date_debut || 0) < 0 ? 'BCE' : 'CE',
      anneeFin: isEvtRange ? Math.abs(event.date_fin).toString() : '',
      ereFin: isEvtRange && event.date_fin < 0 ? 'BCE' : 'CE',
      isRange: isEvtRange,
      couleur: event.couleur || COLOR_PRESETS[0].stroke,
      importance: event.importance || 3,
      tags: Array.isArray(event.tags) && event.tags.length > 0 ? event.tags : [event.categorie || 'Général'],
      forme: event.forme || 'bandeau',
      style_trait: event.style_trait || 'plein',
      gravite: event.gravite !== false
    });
    setNewGroupInput('');
  }, [event]);

  if (!isOpen || !event) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    const startVal = Number(formData.anneeDebut);
    const calculatedStart = formData.ereDebut === 'BCE' ? -Math.abs(startVal) : startVal;

    let calculatedEnd = null;
    if (formData.isRange && formData.anneeFin !== '') {
      const endVal = Number(formData.anneeFin);
      calculatedEnd = formData.ereFin === 'BCE' ? -Math.abs(endVal) : endVal;
    }

    const payload = {
      titre: formData.titre.trim(),
      groupe_id: formData.groupe_id ? formData.groupe_id.trim() : null,
      date_debut: calculatedStart,
      date_fin: calculatedEnd,
      couleur: formData.couleur,
      importance: Number(formData.importance),
      tags: formData.tags,
      categorie: formData.tags[0] || 'Général',
      forme: formData.forme || 'bandeau',
      style_trait: formData.style_trait || 'plein',
      gravite: formData.gravite !== false
    };

    await onSave(event.id, payload);
    setIsSaving(false);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 40,
        pointerEvents: 'none',
        fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: 380,
          maxWidth: '90vw',
          height: '100vh',
          backgroundColor: '#faf7f2',
          borderLeft: '1px solid #e7ded0',
          boxShadow: '-8px 0 30px rgba(28, 25, 23, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          pointerEvents: 'auto',
          zIndex: 45
        }}
      >
        {/* En-tête */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 20px',
            borderBottom: '1px solid #e7ded0'
          }}
        >
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1c1917' }}>
            Modifier l’événement
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: 16,
              color: '#78716c',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        {/* Formulaire */}
        <form
          onSubmit={handleSubmit}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '18px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16
          }}
        >
          {/* Titre */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#57534e', textTransform: 'uppercase' }}>
              Titre de l'événement
            </label>
            <input
              type="text"
              required
              value={formData.titre}
              onChange={(e) => setFormData(prev => ({ ...prev, titre: e.target.value }))}
              style={{
                padding: '8px 10px',
                borderRadius: 8,
                border: '1px solid #d6cebf',
                backgroundColor: '#ffffff',
                fontSize: 13,
                outline: 'none',
                fontFamily: 'inherit'
              }}
            />
          </div>

          {/* Fil conducteur */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#57534e', textTransform: 'uppercase' }}>
              Fil conducteur
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
              {availableGroups.map((grp) => {
                const isSelected = formData.groupe_id === grp;
                return (
                  <button
                    key={grp}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, groupe_id: isSelected ? '' : grp }))}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 14,
                      border: 'none',
                      fontSize: 11,
                      fontWeight: 500,
                      cursor: 'pointer',
                      backgroundColor: isSelected ? '#0284c7' : '#eae3d5',
                      color: isSelected ? '#ffffff' : '#44403c',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {grp} {isSelected ? '✓' : ''}
                  </button>
                );
              })}

              <div style={{ display: 'flex', gap: 4 }}>
                <input
                  type="text"
                  placeholder="+ Nouveau fil"
                  value={newGroupInput}
                  onChange={(e) => setNewGroupInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const val = newGroupInput.trim();
                      if (val) {
                        setFormData(prev => ({ ...prev, groupe_id: val }));
                        setNewGroupInput('');
                      }
                    }
                  }}
                  style={{
                    padding: '4px 8px',
                    borderRadius: 14,
                    border: '1px dashed #c7bba7',
                    backgroundColor: 'transparent',
                    fontSize: 11,
                    outline: 'none',
                    width: 110
                  }}
                />
              </div>
            </div>
          </div>

          {/* Date de début & Ère */}
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#57534e', textTransform: 'uppercase' }}>
                Année {formData.isRange ? 'début' : ''}
              </label>
              <input
                type="number"
                required
                value={formData.anneeDebut}
                onChange={(e) => setFormData(prev => ({ ...prev, anneeDebut: e.target.value }))}
                style={{
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: '1px solid #d6cebf',
                  backgroundColor: '#ffffff',
                  fontSize: 13,
                  outline: 'none',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            <div style={{ width: 120, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#57534e', textTransform: 'uppercase' }}>
                Ère
              </label>
              <div style={{ display: 'flex', backgroundColor: '#eae3d5', borderRadius: 8, padding: 2, height: 36, boxSizing: 'border-box' }}>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, ereDebut: 'BCE' }))}
                  style={{
                    flex: 1,
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    backgroundColor: formData.ereDebut === 'BCE' ? '#ffffff' : 'transparent',
                    color: formData.ereDebut === 'BCE' ? '#b45309' : '#78716c'
                  }}
                >
                  BCE
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, ereDebut: 'CE' }))}
                  style={{
                    flex: 1,
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    backgroundColor: formData.ereDebut === 'CE' ? '#ffffff' : 'transparent',
                    color: formData.ereDebut === 'CE' ? '#b45309' : '#78716c'
                  }}
                >
                  CE
                </button>
              </div>
            </div>
          </div>

          {/* Date de fin si période */}
          {formData.isRange && (
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#57534e', textTransform: 'uppercase' }}>
                  Année fin
                </label>
                <input
                  type="number"
                  value={formData.anneeFin}
                  onChange={(e) => setFormData(prev => ({ ...prev, anneeFin: e.target.value }))}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: '1px solid #d6cebf',
                    backgroundColor: '#ffffff',
                    fontSize: 13,
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <div style={{ width: 120, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#57534e', textTransform: 'uppercase' }}>
                  Ère fin
                </label>
                <div style={{ display: 'flex', backgroundColor: '#eae3d5', borderRadius: 8, padding: 2, height: 36, boxSizing: 'border-box' }}>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, ereFin: 'BCE' }))}
                    style={{
                      flex: 1,
                      border: 'none',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      backgroundColor: formData.ereFin === 'BCE' ? '#ffffff' : 'transparent',
                      color: formData.ereFin === 'BCE' ? '#b45309' : '#78716c'
                    }}
                  >
                    BCE
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, ereFin: 'CE' }))}
                    style={{
                      flex: 1,
                      border: 'none',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      backgroundColor: formData.ereFin === 'CE' ? '#ffffff' : 'transparent',
                      color: formData.ereFin === 'CE' ? '#b45309' : '#78716c'
                    }}
                  >
                    CE
                  </button>
                </div>
              </div>
            </div>
          )}
		  
		  {/* Sélecteur d'apparence si période */}
          {formData.isRange && (
            <div style={{
              backgroundColor: '#f3ece0',
              border: '1px solid #dcd1be',
              borderRadius: 12,
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10
            }}>
              {/* Préréglages rapides */}
              <div>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Préréglages rapides
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginTop: 4 }}>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, forme: 'bandeau', style_trait: 'plein', gravite: true }))}
                    style={{
                      padding: '5px 4px',
                      borderRadius: 7,
                      border: '1px solid #d6cebf',
                      backgroundColor: (formData.forme === 'bandeau' && formData.style_trait === 'plein') ? '#ffffff' : 'transparent',
                      color: '#44403c',
                      fontSize: 10,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    🏛️ Dynastie
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, forme: 'ligne', style_trait: 'plein', gravite: true }))}
                    style={{
                      padding: '5px 4px',
                      borderRadius: 7,
                      border: '1px solid #d6cebf',
                      backgroundColor: (formData.forme === 'ligne' && formData.style_trait === 'plein') ? '#ffffff' : 'transparent',
                      color: '#44403c',
                      fontSize: 10,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    👤 Biographie
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, forme: 'bandeau', style_trait: 'pointille', gravite: true }))}
                    style={{
                      padding: '5px 4px',
                      borderRadius: 7,
                      border: '1px solid #d6cebf',
                      backgroundColor: formData.style_trait === 'pointille' ? '#ffffff' : 'transparent',
                      color: '#44403c',
                      fontSize: 10,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    🌫️ Période floue
                  </button>
                </div>
              </div>

              {/* Grille PowerPoint */}
              <div>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Forme du tracé
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginTop: 4 }}>
                  <div
                    onClick={() => setFormData(prev => ({ ...prev, forme: 'bandeau' }))}
                    style={{
                      border: (formData.forme || 'bandeau') === 'bandeau' ? '2px solid #b45309' : '1px solid #d6cebf',
                      backgroundColor: (formData.forme || 'bandeau') === 'bandeau' ? '#ffffff' : '#faf7f2',
                      borderRadius: 8,
                      padding: '6px 4px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <svg width="42" height="16" viewBox="0 0 48 18">
                      <rect x="2" y="2" width="44" height="14" rx="2" fill="#b45309" fillOpacity="0.4" stroke="#b45309" strokeWidth="1.5" />
                    </svg>
                    <span style={{ fontSize: 9, fontWeight: 600, color: '#44403c' }}>Bandeau</span>
                  </div>

                  <div
                    onClick={() => setFormData(prev => ({ ...prev, forme: 'ligne' }))}
                    style={{
                      border: formData.forme === 'ligne' ? '2px solid #b45309' : '1px solid #d6cebf',
                      backgroundColor: formData.forme === 'ligne' ? '#ffffff' : '#faf7f2',
                      borderRadius: 8,
                      padding: '6px 4px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <svg width="42" height="16" viewBox="0 0 48 18">
                      <line x1="6" y1="9" x2="42" y2="9" stroke="#b45309" strokeWidth="2.5" />
                      <line x1="6" y1="4" x2="6" y2="14" stroke="#b45309" strokeWidth="2" />
                      <line x1="42" y1="4" x2="42" y2="14" stroke="#b45309" strokeWidth="2" />
                    </svg>
                    <span style={{ fontSize: 9, fontWeight: 600, color: '#44403c' }}>Ligne |—|</span>
                  </div>

                  <div
                    onClick={() => setFormData(prev => ({ ...prev, forme: 'ruban' }))}
                    style={{
                      border: formData.forme === 'ruban' ? '2px solid #b45309' : '1px solid #d6cebf',
                      backgroundColor: formData.forme === 'ruban' ? '#ffffff' : '#faf7f2',
                      borderRadius: 8,
                      padding: '6px 4px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <svg width="42" height="16" viewBox="0 0 48 18">
                      <rect x="2" y="3" width="44" height="12" rx="6" fill="#b45309" fillOpacity="0.25" stroke="#b45309" strokeWidth="1.5" />
                    </svg>
                    <span style={{ fontSize: 9, fontWeight: 600, color: '#44403c' }}>Ruban</span>
                  </div>
                </div>
              </div>

              {/* Style de trait et Gravité */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 2 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#78716c', textTransform: 'uppercase' }}>Tracé</span>
                  <div style={{ display: 'flex', backgroundColor: '#eae3d5', padding: 2, borderRadius: 6 }}>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, style_trait: 'plein' }))}
                      style={{
                        flex: 1,
                        padding: '4px 0',
                        fontSize: 10,
                        fontWeight: 600,
                        border: 'none',
                        borderRadius: 5,
                        cursor: 'pointer',
                        backgroundColor: (formData.style_trait || 'plein') === 'plein' ? '#ffffff' : 'transparent',
                        color: (formData.style_trait || 'plein') === 'plein' ? '#1c1917' : '#78716c'
                      }}
                    >
                      Plein
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, style_trait: 'pointille' }))}
                      style={{
                        flex: 1,
                        padding: '4px 0',
                        fontSize: 10,
                        fontWeight: 600,
                        border: 'none',
                        borderRadius: 5,
                        cursor: 'pointer',
                        backgroundColor: formData.style_trait === 'pointille' ? '#ffffff' : 'transparent',
                        color: formData.style_trait === 'pointille' ? '#1c1917' : '#78716c'
                      }}
                    >
                      Pointillé
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#78716c', textTransform: 'uppercase' }}>Gravité</span>
                  <div style={{ display: 'flex', backgroundColor: '#eae3d5', padding: 2, borderRadius: 6 }}>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, gravite: true }))}
                      style={{
                        flex: 1,
                        padding: '4px 0',
                        fontSize: 10,
                        fontWeight: 600,
                        border: 'none',
                        borderRadius: 5,
                        cursor: 'pointer',
                        backgroundColor: (formData.gravite !== false) ? '#ffffff' : 'transparent',
                        color: (formData.gravite !== false) ? '#1c1917' : '#78716c'
                      }}
                    >
                      Auto
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, gravite: false }))}
                      style={{
                        flex: 1,
                        padding: '4px 0',
                        fontSize: 10,
                        fontWeight: 600,
                        border: 'none',
                        borderRadius: 5,
                        cursor: 'pointer',
                        backgroundColor: formData.gravite === false ? '#ffffff' : 'transparent',
                        color: formData.gravite === false ? '#1c1917' : '#78716c'
                      }}
                    >
                      Fixe
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Couleur */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#57534e', textTransform: 'uppercase' }}>
              Couleur du repère
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, couleur: c.stroke }))}
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    backgroundColor: c.stroke,
                    border: formData.couleur === c.stroke ? '2px solid #ffffff' : '2px solid transparent',
                    outline: formData.couleur === c.stroke ? '2px solid #b45309' : 'none',
                    cursor: 'pointer'
                  }}
                />
              ))}
            </div>
          </div>

          {/* Importance */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#57534e', textTransform: 'uppercase' }}>
              Importance (1 à 5)
            </label>
            <div style={{ display: 'flex', backgroundColor: '#eae3d5', borderRadius: 8, padding: 2, gap: 2 }}>
              {[1, 2, 3, 4, 5].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, importance: lvl }))}
                  style={{
                    flex: 1,
                    padding: '4px 0',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    backgroundColor: formData.importance === lvl ? '#b45309' : 'transparent',
                    color: formData.importance === lvl ? '#ffffff' : '#78716c'
                  }}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#57534e', textTransform: 'uppercase' }}>
              Tags
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {availableTags.map((tag) => {
                const active = formData.tags?.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      setFormData(prev => {
                        const exists = prev.tags.includes(tag);
                        return {
                          ...prev,
                          tags: exists ? prev.tags.filter(t => t !== tag) : [...prev.tags, tag]
                        };
                      });
                    }}
                    style={{
                      padding: '3px 8px',
                      borderRadius: 12,
                      border: 'none',
                      fontSize: 10,
                      fontWeight: 500,
                      cursor: 'pointer',
                      backgroundColor: active ? '#b45309' : '#eae3d5',
                      color: active ? '#ffffff' : '#44403c'
                    }}
                  >
                    {tag} {active ? '✓' : ''}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions bas */}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 'auto', paddingTop: 14 }}>
            <button
              type="button"
              onClick={() => onDelete(event)}
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                border: '1px solid #fecaca',
                backgroundColor: '#fff1f2',
                color: '#e11d48',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Supprimer
            </button>

            <button
              type="submit"
              disabled={isSaving}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
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
          </div>
        </form>
      </div>
    </div>
  );
}