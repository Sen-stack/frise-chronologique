import React, { useState, useEffect } from 'react';
import { COLOR_PRESETS } from '../utils/timelineMath.js';

export default function EventEditDrawer({
  isOpen,
  onClose,
  event,
  onSave,
  onDelete,
  availableTags,
  onToggleTag
}) {
  const [formData, setFormData] = useState({
    titre: '',
    anneeDebut: '',
    ereDebut: 'CE',
    anneeFin: '',
    ereFin: 'CE',
    isRange: false,
    couleur: '',
    importance: 3,
    tags: []
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!event) return;
    const isEvtRange = event.date_fin !== null && event.date_fin !== undefined && event.date_fin !== '';

    setFormData({
      titre: event.titre || '',
      anneeDebut: Math.abs(event.date_debut || 0).toString(),
      ereDebut: (event.date_debut || 0) < 0 ? 'BCE' : 'CE',
      anneeFin: isEvtRange ? Math.abs(event.date_fin).toString() : '',
      ereFin: isEvtRange && event.date_fin < 0 ? 'BCE' : 'CE',
      isRange: isEvtRange,
      couleur: event.couleur || COLOR_PRESETS[0].stroke,
      importance: event.importance || 3,
      tags: Array.isArray(event.tags) && event.tags.length > 0 ? event.tags : [event.categorie || 'Général']
    });
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
      date_debut: calculatedStart,
      date_fin: calculatedEnd,
      couleur: formData.couleur,
      importance: Number(formData.importance),
      tags: formData.tags,
      categorie: formData.tags[0] || 'Général'
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

        {/* Formulaire simplifié */}
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