import React from 'react';
import { COLOR_PRESETS } from '../utils/timelineMath.js';

export default function EventModal({
  isOpen,
  onClose,
  isSubmitting,
  formError,
  isRange,
  setIsRange,
  formData,
  setFormData,
  onSubmit,
  availableTags,
  newTagInput,
  setNewTagInput,
  onAddNewTag,
  onToggleTag
}) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        backgroundColor: 'rgba(28, 25, 23, 0.45)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 460,
          backgroundColor: '#faf7f2',
          borderRadius: 20,
          boxShadow: '0 20px 45px rgba(28, 25, 23, 0.22)',
          border: '1px solid #e7ded0',
          color: '#1c1917',
          padding: '24px 28px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          boxSizing: 'border-box'
        }}
      >
        {/* En-tête */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: -0.2 }}>
            Créer un événement
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: 16,
              color: '#78716c',
              padding: 4
            }}
          >
            ✕
          </button>
        </div>

        {formError && (
          <div
            style={{
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              padding: '8px 12px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 500
            }}
          >
            {formError}
          </div>
        )}

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Titre */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#57534e', textTransform: 'uppercase' }}>
              Titre de l'événement
            </label>
            <input
              type="text"
              required
              placeholder="Ex. Sacre de Charlemagne"
              value={formData.titre}
              onChange={(e) => setFormData(prev => ({ ...prev, titre: e.target.value }))}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 10,
                border: '1px solid #d6cebf',
                backgroundColor: '#ffffff',
                fontSize: 13,
                color: '#1c1917',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Sélecteur Ponctuel / Période (Segmented control) */}
          <div
            style={{
              display: 'flex',
              backgroundColor: '#eae3d5',
              padding: 3,
              borderRadius: 10,
              gap: 4
            }}
          >
            <button
              type="button"
              onClick={() => setIsRange(false)}
              style={{
                flex: 1,
                padding: '6px 0',
                border: 'none',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: !isRange ? '#ffffff' : 'transparent',
                color: !isRange ? '#1c1917' : '#78716c',
                boxShadow: !isRange ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              📍 Ponctuel
            </button>
            <button
              type="button"
              onClick={() => setIsRange(true)}
              style={{
                flex: 1,
                padding: '6px 0',
                border: 'none',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: isRange ? '#ffffff' : 'transparent',
                color: isRange ? '#1c1917' : '#78716c',
                boxShadow: isRange ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              ⏳ Période
            </button>
          </div>

          {/* Dates & Ères */}
          <div style={{ display: 'flex', gap: 10 }}>
            {/* Année début */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#57534e', textTransform: 'uppercase' }}>
                {isRange ? 'Année début' : 'Année'}
              </label>
              <input
                type="number"
                required
                placeholder="800"
                value={formData.anneeDebut}
                onChange={(e) => setFormData(prev => ({ ...prev, anneeDebut: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 10,
                  border: '1px solid #d6cebf',
                  backgroundColor: '#ffffff',
                  fontSize: 13,
                  color: '#1c1917',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Ère début (BCE / CE) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, width: 130 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#57534e', textTransform: 'uppercase' }}>
                Ère
              </label>
              <div style={{ display: 'flex', backgroundColor: '#eae3d5', padding: 3, borderRadius: 10, height: 36, boxSizing: 'border-box' }}>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, ereDebut: 'BCE' }))}
                  style={{
                    flex: 1,
                    border: 'none',
                    borderRadius: 7,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    backgroundColor: formData.ereDebut === 'BCE' ? '#ffffff' : 'transparent',
                    color: formData.ereDebut === 'BCE' ? '#b45309' : '#78716c',
                    boxShadow: formData.ereDebut === 'BCE' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
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
                    borderRadius: 7,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    backgroundColor: formData.ereDebut === 'CE' ? '#ffffff' : 'transparent',
                    color: formData.ereDebut === 'CE' ? '#b45309' : '#78716c',
                    boxShadow: formData.ereDebut === 'CE' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  CE
                </button>
              </div>
            </div>
          </div>

          {/* Année fin (si période) */}
          {isRange && (
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#57534e', textTransform: 'uppercase' }}>
                  Année fin
                </label>
                <input
                  type="number"
                  required
                  placeholder="814"
                  value={formData.anneeFin}
                  onChange={(e) => setFormData(prev => ({ ...prev, anneeFin: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 10,
                    border: '1px solid #d6cebf',
                    backgroundColor: '#ffffff',
                    fontSize: 13,
                    color: '#1c1917',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, width: 130 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#57534e', textTransform: 'uppercase' }}>
                  Ère fin
                </label>
                <div style={{ display: 'flex', backgroundColor: '#eae3d5', padding: 3, borderRadius: 10, height: 36, boxSizing: 'border-box' }}>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, ereFin: 'BCE' }))}
                    style={{
                      flex: 1,
                      border: 'none',
                      borderRadius: 7,
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
                      borderRadius: 7,
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

          {/* Palette de couleurs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#57534e', textTransform: 'uppercase' }}>
              Couleur
            </label>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {COLOR_PRESETS.map((c) => {
                const isSelected = formData.couleur === c.stroke;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, couleur: c.stroke }))}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      backgroundColor: c.stroke,
                      border: isSelected ? '2px solid #ffffff' : '2px solid transparent',
                      outline: isSelected ? '2px solid #b45309' : 'none',
                      cursor: 'pointer',
                      transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                      transition: 'all 0.15s ease'
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* Tags */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#57534e', textTransform: 'uppercase' }}>
              Tags
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {availableTags.map((tag) => {
                const active = formData.tags?.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => onToggleTag(tag)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 14,
                      border: 'none',
                      fontSize: 11,
                      fontWeight: 500,
                      cursor: 'pointer',
                      backgroundColor: active ? '#b45309' : '#eae3d5',
                      color: active ? '#ffffff' : '#44403c',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {tag} {active ? '✓' : ''}
                  </button>
                );
              })}

              {/* Champ d'ajout rapide de tag */}
              <div style={{ display: 'flex', gap: 4 }}>
                <input
                  type="text"
                  placeholder="+ Nouveau tag"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      onAddNewTag();
                    }
                  }}
                  style={{
                    padding: '4px 8px',
                    borderRadius: 14,
                    border: '1px dashed #c7bba7',
                    backgroundColor: 'transparent',
                    fontSize: 11,
                    outline: 'none',
                    width: 100
                  }}
                />
              </div>
            </div>
          </div>

          {/* Importance (1 à 5) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#57534e', textTransform: 'uppercase' }}>
              Importance (visibilité au dézoom)
            </label>
            <div style={{ display: 'flex', backgroundColor: '#eae3d5', borderRadius: 10, padding: 3, gap: 4 }}>
              {[1, 2, 3, 4, 5].map((lvl) => {
                const active = formData.importance === lvl;
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, importance: lvl }))}
                    style={{
                      flex: 1,
                      padding: '5px 0',
                      border: 'none',
                      borderRadius: 7,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      backgroundColor: active ? '#b45309' : 'transparent',
                      color: active ? '#ffffff' : '#57534e',
                      boxShadow: active ? '0 1px 3px rgba(0,0,0,0.15)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {lvl}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Boutons d'action */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 16px',
                borderRadius: 10,
                border: '1px solid #d6cebf',
                backgroundColor: '#ffffff',
                color: '#57534e',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '9px 20px',
                borderRadius: 10,
                border: 'none',
                backgroundColor: '#b45309',
                color: '#ffffff',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(180, 83, 9, 0.35)'
              }}
            >
              {isSubmitting ? 'Création...' : 'Créer l’événement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}