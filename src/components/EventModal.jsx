import React, { useState, useEffect } from 'react';
import { COLOR_PRESETS } from '../utils/timelineMath.js';
import WikimediaPickerModal from './WikimediaPickerModal.jsx';

export default function EventModal({
  isOpen,
  onClose,
  isEditing,
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
  const [isWikiPickerOpen, setIsWikiPickerOpen] = useState(false);

  if (!isOpen) return null;

  // Liste des cartes rattachées (tableau d'objets)
  const cartes = Array.isArray(formData.cartesHistoriques) ? formData.cartesHistoriques : [];

  const handleAddCard = (nouvelleCarte) => {
    setFormData(prev => ({
      ...prev,
      cartesHistoriques: [...(Array.isArray(prev.cartesHistoriques) ? prev.cartesHistoriques : []), nouvelleCarte]
    }));
  };

  const handleRemoveCard = (indexASupprimer) => {
    setFormData(prev => ({
      ...prev,
      cartesHistoriques: prev.cartesHistoriques.filter((_, idx) => idx !== indexASupprimer)
    }));
  };

  return (
    <>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 30,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16
        }}
      >
        <div
          style={{
            backgroundColor: '#0f172a',
            border: '1px solid #1e293b',
            borderRadius: 12,
            padding: 20,
            width: '100%',
            maxWidth: 520,
            maxHeight: '90vh',
            overflowY: 'auto',
            color: '#f8fafc',
            boxShadow: '0 15px 35px rgba(0,0,0,0.7)'
          }}
        >
          {/* En-tête de la modale */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 14,
              borderBottom: '1px solid #1e293b',
              paddingBottom: 10
            }}
          >
            <h2 style={{ margin: 0, fontSize: 14, fontWeight: 'bold', color: '#38bdf8' }}>
              {isEditing ? "Modifier l'élément" : "Ajouter un élément"}
            </h2>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 14 }}
            >
              ✕
            </button>
          </div>

          {formError && (
            <div
              style={{
                marginBottom: 12,
                padding: 8,
                backgroundColor: 'rgba(244, 63, 94, 0.2)',
                border: '1px solid #f43f5e',
                color: '#fecdd3',
                fontSize: 12,
                borderRadius: 6
              }}
            >
              {formError}
            </div>
          )}

          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 12 }}>
            {/* Bascule Ponctuel / Période */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 8,
                padding: 4,
                backgroundColor: '#020617',
                borderRadius: 8,
                border: '1px solid #1e293b'
              }}
            >
              <button
                type="button"
                onClick={() => setIsRange(false)}
                style={{
                  padding: '7px 10px',
                  borderRadius: 6,
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 11,
                  backgroundColor: !isRange ? '#0284c7' : 'transparent',
                  color: !isRange ? '#ffffff' : '#94a3b8'
                }}
              >
                📍 Événement ponctuel
              </button>
              <button
                type="button"
                onClick={() => setIsRange(true)}
                style={{
                  padding: '7px 10px',
                  borderRadius: 6,
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 11,
                  backgroundColor: isRange ? '#0284c7' : 'transparent',
                  color: isRange ? '#ffffff' : '#94a3b8'
                }}
              >
                ⏳ Période / Dynastie
              </button>
            </div>

            {/* Titre */}
            <div>
              <label style={{ display: 'block', marginBottom: 4, color: '#cbd5e1', fontWeight: 500 }}>Titre</label>
              <input
                type="text"
                required
                placeholder={isRange ? "Ex: Dynastie Ming" : "Ex: Chute de Constantinople"}
                value={formData.titre}
                onChange={e => setFormData({ ...formData, titre: e.target.value })}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  backgroundColor: '#020617',
                  border: '1px solid #334155',
                  borderRadius: 6,
                  padding: '8px 10px',
                  color: '#ffffff',
                  outline: 'none'
                }}
              />
            </div>

            {/* Dates */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 8 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 4, color: '#cbd5e1', fontWeight: 500 }}>
                  {isRange ? "Année de début" : "Année"}
                </label>
                <input
                  type="number"
                  required
                  placeholder="Ex: 1368"
                  value={formData.anneeDebut}
                  onChange={e => setFormData({ ...formData, anneeDebut: e.target.value })}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    backgroundColor: '#020617',
                    border: '1px solid #334155',
                    borderRadius: 6,
                    padding: '8px 10px',
                    color: '#ffffff',
                    outline: 'none'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, color: '#cbd5e1', fontWeight: 500 }}>Ère</label>
                <select
                  value={formData.ereDebut}
                  onChange={e => setFormData({ ...formData, ereDebut: e.target.value })}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    backgroundColor: '#020617',
                    border: '1px solid #334155',
                    borderRadius: 6,
                    padding: '8px 10px',
                    color: '#ffffff',
                    outline: 'none'
                  }}
                >
                  <option value="CE">ap. J.-C.</option>
                  <option value="BCE">av. J.-C.</option>
                </select>
              </div>
            </div>

            {isRange && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 120px',
                  gap: 8,
                  padding: 10,
                  backgroundColor: 'rgba(56, 189, 248, 0.05)',
                  border: '1px dashed #38bdf8',
                  borderRadius: 8
                }}
              >
                <div>
                  <label style={{ display: 'block', marginBottom: 4, color: '#38bdf8', fontWeight: 500 }}>
                    Année de fin
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="Ex: 1644"
                    value={formData.anneeFin}
                    onChange={e => setFormData({ ...formData, anneeFin: e.target.value })}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      backgroundColor: '#020617',
                      border: '1px solid #38bdf8',
                      borderRadius: 6,
                      padding: '8px 10px',
                      color: '#ffffff',
                      outline: 'none'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, color: '#38bdf8', fontWeight: 500 }}>
                    Ère de fin
                  </label>
                  <select
                    value={formData.ereFin}
                    onChange={e => setFormData({ ...formData, ereFin: e.target.value })}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      backgroundColor: '#020617',
                      border: '1px solid #38bdf8',
                      borderRadius: 6,
                      padding: '8px 10px',
                      color: '#ffffff',
                      outline: 'none'
                    }}
                  >
                    <option value="CE">ap. J.-C.</option>
                    <option value="BCE">av. J.-C.</option>
                  </select>
                </div>
              </div>
            )}

            {/* SECTION CARTES HISTORIQUES MULTIPLES */}
            <div style={{ padding: 12, backgroundColor: 'rgba(15, 23, 42, 0.8)', border: '1px solid #1e293b', borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 'bold', color: '#38bdf8' }}>
                  🗺️ Cartes & documents historiques
                </span>
                <span style={{ fontSize: 10, color: '#94a3b8' }}>
                  {cartes.length} carte(s) liée(s)
                </span>
              </div>

              {/* Boutons d'ajout par source */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setIsWikiPickerOpen(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 12px',
                    backgroundColor: 'rgba(2, 132, 199, 0.15)',
                    border: '1px solid #0284c7',
                    color: '#38bdf8',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <span>🏛️</span>
                  <span>+ Ajouter depuis Wikimedia Commons</span>
                </button>
              </div>

              {/* Liste des cartes associées */}
              {cartes.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                  {cartes.map((carte, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: '#020617',
                        border: '1px solid #334155',
                        borderRadius: 6,
                        padding: '6px 10px',
                        fontSize: 11
                      }}
                    >
                      <span style={{ color: '#38bdf8', fontWeight: 'bold', fontSize: 10, textTransform: 'uppercase', marginRight: 8 }}>
                        [{carte.source || 'archive'}]
                      </span>
                      <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#cbd5e1' }} title={carte.titre}>
                        {carte.titre}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCard(idx)}
                        title="Supprimer cette carte"
                        style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer', fontSize: 13, paddingLeft: 8 }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Repères modernes (Optionnels) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 3, color: '#cbd5e1', fontSize: 11 }}>Latitude moderne</label>
                <input
                  type="number"
                  step="any"
                  placeholder="Ex: 41.0082"
                  value={formData.latitude || ''}
                  onChange={e => setFormData({ ...formData, latitude: e.target.value })}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    backgroundColor: '#020617',
                    border: '1px solid #334155',
                    borderRadius: 6,
                    padding: '6px 8px',
                    color: '#ffffff',
                    fontSize: 11,
                    outline: 'none'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 3, color: '#cbd5e1', fontSize: 11 }}>Longitude moderne</label>
                <input
                  type="number"
                  step="any"
                  placeholder="Ex: 28.9784"
                  value={formData.longitude || ''}
                  onChange={e => setFormData({ ...formData, longitude: e.target.value })}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    backgroundColor: '#020617',
                    border: '1px solid #334155',
                    borderRadius: 6,
                    padding: '6px 8px',
                    color: '#ffffff',
                    fontSize: 11,
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Nuancier de couleur */}
            <div>
              <label style={{ display: 'block', marginBottom: 6, color: '#cbd5e1', fontWeight: 500 }}>
                Couleur du repère / bandeau
              </label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                {COLOR_PRESETS.map(preset => {
                  const isSelected = formData.couleur.toLowerCase() === preset.stroke.toLowerCase();
                  return (
                    <button
                      type="button"
                      key={preset.name}
                      onClick={() => setFormData({ ...formData, couleur: preset.stroke })}
                      title={preset.name}
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        backgroundColor: preset.stroke,
                        border: isSelected ? '3px solid #ffffff' : '2px solid transparent',
                        boxShadow: isSelected ? '0 0 10px ' + preset.stroke : 'none',
                        cursor: 'pointer',
                        transform: isSelected ? 'scale(1.15)' : 'scale(1)'
                      }}
                    />
                  );
                })}
                <input
                  type="color"
                  value={formData.couleur}
                  onChange={e => setFormData({ ...formData, couleur: e.target.value })}
                  style={{ width: 24, height: 24, borderRadius: '50%', border: 'none', background: 'none', cursor: 'pointer', marginLeft: 4 }}
                  title="Couleur personnalisée"
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label style={{ display: 'block', marginBottom: 4, color: '#cbd5e1', fontWeight: 500 }}>
                Tags associés
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                {availableTags.map(tag => {
                  const isSelected = formData.tags.includes(tag);
                  return (
                    <span
                      key={tag}
                      onClick={() => onToggleTag(tag)}
                      style={{
                        padding: '3px 8px',
                        borderRadius: 14,
                        fontSize: 10,
                        fontWeight: 500,
                        cursor: 'pointer',
                        backgroundColor: isSelected ? '#0284c7' : '#020617',
                        color: isSelected ? '#ffffff' : '#94a3b8',
                        border: `1px solid ${isSelected ? '#38bdf8' : '#334155'}`
                      }}
                    >
                      {tag} {isSelected ? '✓' : '+'}
                    </span>
                  );
                })}
              </div>

              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type="text"
                  placeholder="Créer un nouveau tag..."
                  value={newTagInput}
                  onChange={e => setNewTagInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      onAddNewTag();
                    }
                  }}
                  style={{
                    flex: 1,
                    backgroundColor: '#020617',
                    border: '1px solid #334155',
                    borderRadius: 6,
                    padding: '6px 10px',
                    color: '#ffffff',
                    fontSize: 11,
                    outline: 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={onAddNewTag}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    color: '#38bdf8',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: 11
                  }}
                >
                  + Ajouter
                </button>
              </div>
            </div>

            {/* Importance */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <label style={{ color: '#cbd5e1', fontWeight: 500 }}>Importance visuelle</label>
                <span style={{ fontWeight: 'bold', color: '#38bdf8' }}>Niveau {formData.importance} / 5</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={formData.importance}
                onChange={e => setFormData({ ...formData, importance: e.target.value })}
                style={{ width: '100%', accentColor: '#38bdf8', cursor: 'pointer' }}
              />
            </div>

            {/* Description */}
            <div>
              <label style={{ display: 'block', marginBottom: 4, color: '#cbd5e1', fontWeight: 500 }}>
                Description
              </label>
              <textarea
                rows="3"
                placeholder="Contexte, acteurs, conséquences..."
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  backgroundColor: '#020617',
                  border: '1px solid #334155',
                  borderRadius: 6,
                  padding: '8px 10px',
                  color: '#ffffff',
                  outline: 'none',
                  resize: 'none'
                }}
              />
            </div>

            {/* Boutons d'action */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 10, borderTop: '1px solid #1e293b' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#1e293b',
                  border: 'none',
                  color: '#94a3b8',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  padding: '6px 16px',
                  backgroundColor: '#0284c7',
                  border: 'none',
                  color: '#ffffff',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                {isSubmitting ? 'Enregistrement...' : isEditing ? 'Mettre à jour' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <WikimediaPickerModal
        isOpen={isWikiPickerOpen}
        onClose={() => setIsWikiPickerOpen(false)}
        onSelectImage={handleAddCard}
      />
    </>
  );
}