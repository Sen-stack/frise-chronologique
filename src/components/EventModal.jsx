import React from 'react';
import { COLOR_PRESETS, MONTHS_FR, formatDetailedDate } from '../utils/timelineMath.js';

function HistoricalDateSelector({
  label,
  yearValue,
  onYearChange,
  eraValue,
  onEraChange,
  monthValue,
  onMonthChange,
  dayValue,
  onDayChange,
  required = false,
  placeholderYear = '1918'
}) {
  const numericYear = yearValue === '' ? null : Number(yearValue);
  const signedYear = numericYear !== null && !isNaN(numericYear)
    ? (eraValue === 'BCE' ? -Math.abs(numericYear) : Math.abs(numericYear))
    : null;

  const selectedMonthObj = MONTHS_FR.find(m => m.value === Number(monthValue));
  const maxDays = selectedMonthObj
    ? (selectedMonthObj.value === 2 && numericYear && numericYear % 4 !== 0 ? 28 : selectedMonthObj.days)
    : 31;

  const stepYear = (delta) => {
    const currentSigned = signedYear ?? 0;
    let nextSigned = currentSigned + delta;
    if (nextSigned === 0) nextSigned = delta > 0 ? 1 : -1;
    onEraChange(nextSigned < 0 ? 'BCE' : 'CE');
    onYearChange(String(Math.abs(nextSigned)));
  };

  const preview = signedYear !== null
    ? formatDetailedDate(signedYear, monthValue || null, dayValue || null)
    : '';

  return (
    <div style={{
      backgroundColor: '#f3ece0',
      border: '1px solid #dcd1be',
      borderRadius: 12,
      padding: '10px 12px',
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label style={{ fontSize: 11, fontWeight: 700, color: '#57534e', textTransform: 'uppercase' }}>
          {label}
        </label>
        {preview && (
          <span style={{
            fontSize: 11,
            fontWeight: 700,
            color: '#b45309',
            backgroundColor: '#ffffff',
            padding: '2px 8px',
            borderRadius: 8,
            border: '1px solid #e7ded0'
          }}>
            📅 {preview}
          </span>
        )}
      </div>

      {/* Ligne 1 : Saisie année + Ère BCE / CE */}
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="number"
          required={required}
          placeholder={`Année (ex. ${placeholderYear})`}
          value={yearValue}
          onChange={(e) => onYearChange(e.target.value)}
          style={{
            flex: 1,
            padding: '8px 10px',
            borderRadius: 9,
            border: '1px solid #d6cebf',
            backgroundColor: '#ffffff',
            fontSize: 13,
            fontWeight: 600,
            color: '#1c1917',
            outline: 'none',
            boxSizing: 'border-box'
          }}
        />

        <div style={{ display: 'flex', backgroundColor: '#eae3d5', padding: 3, borderRadius: 9, width: 116, boxSizing: 'border-box' }}>
          <button
            type="button"
            onClick={() => onEraChange('BCE')}
            style={{
              flex: 1,
              border: 'none',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              backgroundColor: eraValue === 'BCE' ? '#ffffff' : 'transparent',
              color: eraValue === 'BCE' ? '#b45309' : '#78716c',
              boxShadow: eraValue === 'BCE' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            BCE
          </button>
          <button
            type="button"
            onClick={() => onEraChange('CE')}
            style={{
              flex: 1,
              border: 'none',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              backgroundColor: eraValue === 'CE' ? '#ffffff' : 'transparent',
              color: eraValue === 'CE' ? '#b45309' : '#78716c',
              boxShadow: eraValue === 'CE' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            CE
          </button>
        </div>
      </div>

      {/* Ligne 2 : Navigation rapide entre les années */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 4 }}>
        {[-100, -10, -1, 1, 10, 100].map((step) => (
          <button
            key={step}
            type="button"
            onClick={() => stepYear(step)}
            style={{
              padding: '4px 0',
              borderRadius: 6,
              border: '1px solid #d6cebf',
              backgroundColor: '#faf7f2',
              color: '#57534e',
              fontSize: 10,
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            {step > 0 ? `+${step}` : step}
          </button>
        ))}
      </div>

      {/* Ligne 3 : Mois et Jour (facultatifs) */}
      <div style={{ display: 'flex', gap: 8 }}>
        <select
          value={monthValue || ''}
          onChange={(e) => {
            const val = e.target.value;
            onMonthChange(val);
            if (!val) {
              onDayChange('');
            } else {
              const mObj = MONTHS_FR.find(m => m.value === Number(val));
              if (mObj && Number(dayValue) > mObj.days) {
                onDayChange(String(mObj.days));
              }
            }
          }}
          style={{
            flex: 1.4,
            padding: '7px 8px',
            borderRadius: 9,
            border: '1px solid #d6cebf',
            backgroundColor: '#ffffff',
            fontSize: 12,
            color: monthValue ? '#1c1917' : '#78716c',
            outline: 'none'
          }}
        >
          <option value="">Mois (facultatif)</option>
          {MONTHS_FR.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>

        <select
          value={dayValue || ''}
          disabled={!monthValue}
          onChange={(e) => onDayChange(e.target.value)}
          style={{
            flex: 1,
            padding: '7px 8px',
            borderRadius: 9,
            border: '1px solid #d6cebf',
            backgroundColor: monthValue ? '#ffffff' : '#eae3d5',
            fontSize: 12,
            color: dayValue ? '#1c1917' : '#78716c',
            outline: 'none',
            cursor: monthValue ? 'pointer' : 'not-allowed'
          }}
        >
          <option value="">Jour (facultatif)</option>
          {Array.from({ length: maxDays }, (_, idx) => idx + 1).map((d) => (
            <option key={d} value={d}>
              {d === 1 ? '1er' : d}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

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
  onDeleteTag = () => {},
  onToggleTag,
  availableGroups = [],
  newGroupInput = '',
  setNewGroupInput = () => {},
  onAddNewGroup = () => {},
  onDeleteGroup = () => {}
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
          maxWidth: 480,
          maxHeight: '90vh',
          overflowY: 'auto',
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
              placeholder="Ex. Armistice de 1918"
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

          {/* Fil conducteur / Thématique */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#57534e', textTransform: 'uppercase' }}>
              Fil conducteur (facultatif)
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
              {availableGroups.map((grp) => {
                const isSelected = formData.groupe_id === grp;
                return (
                  <div
                    key={grp}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      borderRadius: 14,
                      backgroundColor: isSelected ? '#0284c7' : '#eae3d5',
                      color: isSelected ? '#ffffff' : '#44403c',
                      transition: 'all 0.15s ease',
                      overflow: 'hidden'
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, groupe_id: isSelected ? '' : grp }))}
                      style={{
                        padding: '4px 6px 4px 10px',
                        border: 'none',
                        background: 'transparent',
                        fontSize: 11,
                        fontWeight: 500,
                        cursor: 'pointer',
                        color: 'inherit'
                      }}
                    >
                      {grp} {isSelected ? '✓' : ''}
                    </button>
                    <button
                      type="button"
                      title="Supprimer cette thématique"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteGroup(grp);
                      }}
                      style={{
                        padding: '4px 8px 4px 4px',
                        border: 'none',
                        background: 'transparent',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                        color: 'inherit',
                        opacity: 0.7
                      }}
                    >
                      ×
                    </button>
                  </div>
                );
              })}

              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <input
                  type="text"
                  enterKeyHint="done"
                  placeholder="+ Nouveau fil"
                  value={newGroupInput}
                  onChange={(e) => setNewGroupInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      onAddNewGroup();
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
                {newGroupInput.trim() && (
                  <button
                    type="button"
                    onClick={onAddNewGroup}
                    style={{
                      padding: '4px 8px',
                      borderRadius: 14,
                      border: 'none',
                      backgroundColor: '#0284c7',
                      color: '#ffffff',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    ✓
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Sélecteur Ponctuel / Période */}
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

          {/* Sélecteur d'apparence de période */}
          {isRange && (
            <div style={{
              backgroundColor: '#f3ece0',
              border: '1px solid #dcd1be',
              borderRadius: 12,
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10
            }}>
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
                      padding: '8px 4px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <svg width="48" height="18" viewBox="0 0 48 18">
                      <rect x="2" y="2" width="44" height="14" rx="2" fill="#b45309" fillOpacity="0.4" stroke="#b45309" strokeWidth="1.5" />
                    </svg>
                    <span style={{ fontSize: 10, fontWeight: 600, color: '#44403c' }}>Bandeau</span>
                  </div>

                  <div
                    onClick={() => setFormData(prev => ({ ...prev, forme: 'ligne' }))}
                    style={{
                      border: formData.forme === 'ligne' ? '2px solid #b45309' : '1px solid #d6cebf',
                      backgroundColor: formData.forme === 'ligne' ? '#ffffff' : '#faf7f2',
                      borderRadius: 8,
                      padding: '8px 4px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <svg width="48" height="18" viewBox="0 0 48 18">
                      <line x1="6" y1="9" x2="42" y2="9" stroke="#b45309" strokeWidth="2.5" />
                      <line x1="6" y1="4" x2="6" y2="14" stroke="#b45309" strokeWidth="2" />
                      <line x1="42" y1="4" x2="42" y2="14" stroke="#b45309" strokeWidth="2" />
                    </svg>
                    <span style={{ fontSize: 10, fontWeight: 600, color: '#44403c' }}>Ligne |—|</span>
                  </div>

                  <div
                    onClick={() => setFormData(prev => ({ ...prev, forme: 'ruban' }))}
                    style={{
                      border: formData.forme === 'ruban' ? '2px solid #b45309' : '1px solid #d6cebf',
                      backgroundColor: formData.forme === 'ruban' ? '#ffffff' : '#faf7f2',
                      borderRadius: 8,
                      padding: '8px 4px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <svg width="48" height="18" viewBox="0 0 48 18">
                      <rect x="2" y="3" width="44" height="12" rx="6" fill="#b45309" fillOpacity="0.25" stroke="#b45309" strokeWidth="1.5" />
                    </svg>
                    <span style={{ fontSize: 10, fontWeight: 600, color: '#44403c' }}>Ruban</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 2 }}>
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

              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#78716c', textTransform: 'uppercase' }}>
                    Opacité du fond
                  </span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#b45309' }}>
                    {Math.round((formData.opacite ?? 0.85) * 100)} %
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
                  {[0.25, 0.50, 0.75, 1.0].map((val) => {
                    const isSelected = (formData.opacite ?? 0.85) === val;
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, opacite: val }))}
                        style={{
                          padding: '4px 0',
                          fontSize: 10,
                          fontWeight: 600,
                          border: 'none',
                          borderRadius: 6,
                          cursor: 'pointer',
                          backgroundColor: isSelected ? '#b45309' : '#eae3d5',
                          color: isSelected ? '#ffffff' : '#78716c',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {Math.round(val * 100)} %
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Sélecteur de date début (Année + Mois + Jour) */}
          <HistoricalDateSelector
            label={isRange ? 'Date de début' : 'Date de l’événement'}
            required
            placeholderYear="1918"
            yearValue={formData.anneeDebut}
            onYearChange={(val) => setFormData(prev => ({ ...prev, anneeDebut: val }))}
            eraValue={formData.ereDebut}
            onEraChange={(val) => setFormData(prev => ({ ...prev, ereDebut: val }))}
            monthValue={formData.moisDebut || ''}
            onMonthChange={(val) => setFormData(prev => ({ ...prev, moisDebut: val }))}
            dayValue={formData.jourDebut || ''}
            onDayChange={(val) => setFormData(prev => ({ ...prev, jourDebut: val }))}
          />

          {/* Sélecteur de date fin si Période */}
          {isRange && (
            <HistoricalDateSelector
              label="Date de fin"
              required
              placeholderYear="1945"
              yearValue={formData.anneeFin}
              onYearChange={(val) => setFormData(prev => ({ ...prev, anneeFin: val }))}
              eraValue={formData.ereFin}
              onEraChange={(val) => setFormData(prev => ({ ...prev, ereFin: val }))}
              monthValue={formData.moisFin || ''}
              onMonthChange={(val) => setFormData(prev => ({ ...prev, moisFin: val }))}
              dayValue={formData.jourFin || ''}
              onDayChange={(val) => setFormData(prev => ({ ...prev, jourFin: val }))}
            />
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
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
              {availableTags.map((tag) => {
                const active = formData.tags?.includes(tag);
                return (
                  <div
                    key={tag}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      borderRadius: 14,
                      backgroundColor: active ? '#b45309' : '#eae3d5',
                      color: active ? '#ffffff' : '#44403c',
                      transition: 'all 0.15s ease',
                      overflow: 'hidden'
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => onToggleTag(tag)}
                      style={{
                        padding: '4px 6px 4px 10px',
                        border: 'none',
                        background: 'transparent',
                        fontSize: 11,
                        fontWeight: 500,
                        cursor: 'pointer',
                        color: 'inherit'
                      }}
                    >
                      {tag} {active ? '✓' : ''}
                    </button>
                    {availableTags.length > 1 && (
                      <button
                        type="button"
                        title="Supprimer ce tag"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteTag(tag);
                        }}
                        style={{
                          padding: '4px 8px 4px 4px',
                          border: 'none',
                          background: 'transparent',
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: 'pointer',
                          color: 'inherit',
                          opacity: 0.7
                        }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                );
              })}

              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <input
                  type="text"
                  enterKeyHint="done"
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
                {newTagInput.trim() && (
                  <button
                    type="button"
                    onClick={onAddNewTag}
                    style={{
                      padding: '4px 8px',
                      borderRadius: 14,
                      border: 'none',
                      backgroundColor: '#b45309',
                      color: '#ffffff',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    ✓
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Importance */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#57534e', textTransform: 'uppercase' }}>
              Importance
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

          {/* Actions */}
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