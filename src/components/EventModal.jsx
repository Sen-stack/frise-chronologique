import React, { useRef, useEffect } from 'react';
import { COLOR_PRESETS, MONTHS_FR, formatDetailedDate } from '../utils/timelineMath.js';

function WheelColumn({ items, value, onChange, width = '100%' }) {
  const listRef = useRef(null);
  const itemHeight = 32;
  const scrollTimeout = useRef(null);

  useEffect(() => {
    const idx = items.findIndex(it => String(it.value) === String(value));
    if (idx !== -1 && listRef.current) {
      const targetTop = idx * itemHeight;
      if (Math.abs(listRef.current.scrollTop - targetTop) > 2) {
        listRef.current.scrollTo({ top: targetTop, behavior: 'smooth' });
      }
    }
  }, [value, items]);

  const handleScroll = () => {
    if (!listRef.current) return;
    clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      if (!listRef.current) return;
      const idx = Math.round(listRef.current.scrollTop / itemHeight);
      const clamped = Math.max(0, Math.min(items.length - 1, idx));
      const picked = items[clamped];
      if (picked && String(picked.value) !== String(value)) {
        onChange(picked.value);
      }
    }, 90);
  };

  return (
    <div style={{ position: 'relative', height: itemHeight * 3, width, overflow: 'hidden', userSelect: 'none' }}>
      {/* Bande centrale de sélection */}
      <div
        style={{
          position: 'absolute',
          top: itemHeight,
          left: 4,
          right: 4,
          height: itemHeight,
          backgroundColor: '#eaf0f6',
          borderRadius: 9,
          boxShadow: 'inset 2px 2px 4px rgba(166, 180, 200, 0.5), inset -2px -2px 4px rgba(255, 255, 255, 0.9)',
          pointerEvents: 'none',
          zIndex: 1
        }}
      />
      <div
        ref={listRef}
        onScroll={handleScroll}
        style={{
          height: '100%',
          overflowY: 'auto',
          scrollSnapType: 'y mandatory',
          paddingTop: itemHeight,
          paddingBottom: itemHeight,
          boxSizing: 'border-box',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          position: 'relative',
          zIndex: 2
        }}
      >
        {items.map((it) => {
          const isSelected = String(it.value) === String(value);
          return (
            <div
              key={String(it.value)}
              onClick={() => onChange(it.value)}
              style={{
                height: itemHeight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                scrollSnapAlign: 'center',
                fontSize: isSelected ? 12.5 : 11,
                fontWeight: isSelected ? 700 : 500,
                color: isSelected ? '#5b4fe8' : '#718096',
                cursor: 'pointer',
                transition: 'all 0.12s ease'
              }}
            >
              {it.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}

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
  required = false
}) {
  const numericYear = yearValue === '' ? null : Number(yearValue);
  const signedYear = numericYear !== null && !isNaN(numericYear)
    ? (eraValue === 'BCE' ? -Math.abs(numericYear) : Math.abs(numericYear))
    : null;

  const selectedMonthObj = MONTHS_FR.find(m => m.value === Number(monthValue));
  const maxDays = selectedMonthObj
    ? (selectedMonthObj.value === 2 && numericYear && numericYear % 4 !== 0 ? 28 : selectedMonthObj.days)
    : 31;

  const currentYear = 2026;
  const baseWheelYear = numericYear && !isNaN(numericYear) ? Math.abs(numericYear) : currentYear;
  const startWheel = Math.max(1, baseWheelYear - 80);
  const endWheel = baseWheelYear + 80;
  const yearWheelItems = [];
  for (let y = startWheel; y <= endWheel; y++) {
    yearWheelItems.push({ value: String(y), label: String(y) });
  }

  const monthWheelItems = [
    { value: '', label: '—' },
    ...MONTHS_FR.map(m => ({ value: String(m.value), label: m.label }))
  ];

  const dayWheelItems = [
    { value: '', label: '—' },
    ...Array.from({ length: maxDays }, (_, idx) => {
      const d = idx + 1;
      return { value: String(d), label: d === 1 ? '1er' : String(d) };
    })
  ];

  const preview = signedYear !== null
    ? formatDetailedDate(signedYear, monthValue || null, dayValue || null)
    : '';

  const neumorphicInput = {
    padding: '8px 11px',
    borderRadius: 11,
    border: '1px solid rgba(255, 255, 255, 0.75)',
    backgroundColor: '#eaf0f6',
    boxShadow: 'inset 2px 2px 5px rgba(166, 180, 200, 0.55), inset -2px -2px 5px rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    fontWeight: 600,
    color: '#1e293b',
    outline: 'none',
    boxSizing: 'border-box'
  };

  return (
    <div style={{
      backgroundColor: '#eaf0f6',
      border: '1px solid rgba(255, 255, 255, 0.8)',
      borderRadius: 16,
      padding: '10px 12px',
      boxShadow: '4px 4px 10px rgba(166, 180, 200, 0.45), -4px -4px 10px rgba(255, 255, 255, 0.85)',
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label style={{ fontSize: 10.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.4 }}>
          {label}
        </label>
        {preview && (
          <span style={{
            fontSize: 10.5,
            fontWeight: 700,
            color: '#5b4fe8',
            backgroundColor: '#eaf0f6',
            padding: '2px 8px',
            borderRadius: 9,
            boxShadow: '2px 2px 5px rgba(166, 180, 200, 0.45), -2px -2px 5px rgba(255, 255, 255, 0.9)'
          }}>
            {preview}
          </span>
        )}
      </div>

      {/* Saisie manuelle année + Ère BCE / CE */}
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="number"
          required={required}
          value={yearValue}
          onChange={(e) => onYearChange(e.target.value)}
          style={{ ...neumorphicInput, flex: 1, minWidth: 0 }}
        />

        <div style={{
          display: 'flex',
          backgroundColor: '#dfe6ee',
          padding: 3,
          borderRadius: 11,
          width: 112,
          boxShadow: 'inset 2px 2px 4px rgba(166, 180, 200, 0.55), inset -2px -2px 4px rgba(255, 255, 255, 0.85)',
          boxSizing: 'border-box'
        }}>
          <button
            type="button"
            onClick={() => onEraChange('BCE')}
            style={{
              flex: 1,
              border: 'none',
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              backgroundColor: eraValue === 'BCE' ? '#eaf0f6' : 'transparent',
              color: eraValue === 'BCE' ? '#5b4fe8' : '#64748b',
              boxShadow: eraValue === 'BCE' ? '2px 2px 5px rgba(166, 180, 200, 0.5), -2px -2px 5px rgba(255, 255, 255, 0.9)' : 'none'
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
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              backgroundColor: eraValue === 'CE' ? '#eaf0f6' : 'transparent',
              color: eraValue === 'CE' ? '#5b4fe8' : '#64748b',
              boxShadow: eraValue === 'CE' ? '2px 2px 5px rgba(166, 180, 200, 0.5), -2px -2px 5px rgba(255, 255, 255, 0.9)' : 'none'
            }}
          >
            CE
          </button>
        </div>
      </div>

      {/* Roulette iOS-like : Mois / Jour / Année */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.35fr 0.85fr 1fr',
        gap: 4,
        backgroundColor: '#dfe6ee',
        borderRadius: 12,
        padding: '4px 6px',
        boxShadow: 'inset 2px 2px 5px rgba(166, 180, 200, 0.5), inset -2px -2px 5px rgba(255, 255, 255, 0.85)'
      }}>
        <WheelColumn
          items={monthWheelItems}
          value={monthValue || ''}
          onChange={(val) => {
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
        />
        <WheelColumn
          items={dayWheelItems}
          value={dayValue || ''}
          onChange={(val) => {
            if (val && !monthValue) {
              onMonthChange('1');
            }
            onDayChange(val);
          }}
        />
        <WheelColumn
          items={yearWheelItems}
          value={String(baseWheelYear)}
          onChange={(val) => onYearChange(val)}
        />
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
  const colorPickerRef = useRef(null);

  if (!isOpen) return null;

  const isCustomColor = !COLOR_PRESETS.some(c => c.stroke.toLowerCase() === (formData.couleur || '').toLowerCase());

  const neumorphicInput = {
    width: '100%',
    padding: '9px 12px',
    borderRadius: 12,
    border: '1px solid rgba(255, 255, 255, 0.75)',
    backgroundColor: '#eaf0f6',
    boxShadow: 'inset 2px 2px 5px rgba(166, 180, 200, 0.55), inset -2px -2px 5px rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    color: '#1e293b',
    outline: 'none',
    boxSizing: 'border-box'
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        backgroundColor: 'rgba(15, 23, 42, 0.35)',
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
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: '#eaf0f6',
          borderRadius: 24,
          boxShadow: '12px 12px 28px rgba(166, 180, 200, 0.55), -10px -10px 24px rgba(255, 255, 255, 0.9)',
          border: '1px solid rgba(255, 255, 255, 0.85)',
          color: '#1e293b',
          padding: '20px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          boxSizing: 'border-box',
          position: 'relative'
        }}
      >
        {/* Bouton fermer discret en haut à droite */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 14,
            right: 16,
            width: 28,
            height: 28,
            borderRadius: '50%',
            backgroundColor: '#eaf0f6',
            border: '1px solid rgba(255, 255, 255, 0.8)',
            boxShadow: '3px 3px 6px rgba(166, 180, 200, 0.5), -3px -3px 6px rgba(255, 255, 255, 0.9)',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 700,
            color: '#64748b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ✕
        </button>

        {formError && (
          <div
            style={{
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              padding: '8px 12px',
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 600,
              marginTop: 14
            }}
          >
            {formError}
          </div>
        )}

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Nom */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, paddingRight: 30 }}>
            <label style={{ fontSize: 10.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.4 }}>
              Nom
            </label>
            <input
              type="text"
              required
              value={formData.titre}
              onChange={(e) => setFormData(prev => ({ ...prev, titre: e.target.value }))}
              style={neumorphicInput}
            />
          </div>

          {/* Thématique */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 10.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.4 }}>
              Thématique
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
                      backgroundColor: isSelected ? '#5b4fe8' : '#eaf0f6',
                      color: isSelected ? '#ffffff' : '#334155',
                      boxShadow: isSelected
                        ? 'inset 2px 2px 4px rgba(0, 0, 0, 0.2)'
                        : '3px 3px 6px rgba(166, 180, 200, 0.45), -3px -3px 6px rgba(255, 255, 255, 0.9)',
                      border: '1px solid rgba(255, 255, 255, 0.7)',
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
                        fontWeight: 600,
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
                        opacity: 0.75
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
                  value={newGroupInput}
                  onChange={(e) => setNewGroupInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      onAddNewGroup();
                    }
                  }}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 14,
                    border: '1px dashed #94a3b8',
                    backgroundColor: '#eaf0f6',
                    fontSize: 11,
                    color: '#1e293b',
                    outline: 'none',
                    width: 105
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
                      backgroundColor: '#5b4fe8',
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

          {/* Sélecteur Ponctuel / Période (sans émoji) */}
          <div
            style={{
              display: 'flex',
              backgroundColor: '#dfe6ee',
              padding: 3,
              borderRadius: 12,
              gap: 4,
              boxShadow: 'inset 2px 2px 5px rgba(166, 180, 200, 0.55), inset -2px -2px 5px rgba(255, 255, 255, 0.85)'
            }}
          >
            <button
              type="button"
              onClick={() => setIsRange(false)}
              style={{
                flex: 1,
                padding: '7px 0',
                border: 'none',
                borderRadius: 9,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                backgroundColor: !isRange ? '#eaf0f6' : 'transparent',
                color: !isRange ? '#5b4fe8' : '#64748b',
                boxShadow: !isRange ? '3px 3px 6px rgba(166, 180, 200, 0.5), -3px -3px 6px rgba(255, 255, 255, 0.9)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              Ponctuel
            </button>
            <button
              type="button"
              onClick={() => setIsRange(true)}
              style={{
                flex: 1,
                padding: '7px 0',
                border: 'none',
                borderRadius: 9,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                backgroundColor: isRange ? '#eaf0f6' : 'transparent',
                color: isRange ? '#5b4fe8' : '#64748b',
                boxShadow: isRange ? '3px 3px 6px rgba(166, 180, 200, 0.5), -3px -3px 6px rgba(255, 255, 255, 0.9)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              Période
            </button>
          </div>

          {/* Sélecteur d'apparence de période */}
          {isRange && (
            <div style={{
              backgroundColor: '#eaf0f6',
              border: '1px solid rgba(255, 255, 255, 0.8)',
              borderRadius: 14,
              padding: '12px',
              boxShadow: '4px 4px 10px rgba(166, 180, 200, 0.45), -4px -4px 10px rgba(255, 255, 255, 0.85)',
              display: 'flex',
              flexDirection: 'column',
              gap: 10
            }}>
              <div>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Préréglages rapides
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginTop: 4 }}>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, forme: 'bandeau', style_trait: 'plein', gravite: true }))}
                    style={{
                      padding: '5px 4px',
                      borderRadius: 8,
                      border: '1px solid rgba(255, 255, 255, 0.7)',
                      backgroundColor: (formData.forme === 'bandeau' && formData.style_trait === 'plein') ? '#ffffff' : '#dfe6ee',
                      color: '#334155',
                      fontSize: 10,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Dynastie
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, forme: 'ligne', style_trait: 'plein', gravite: true }))}
                    style={{
                      padding: '5px 4px',
                      borderRadius: 8,
                      border: '1px solid rgba(255, 255, 255, 0.7)',
                      backgroundColor: (formData.forme === 'ligne' && formData.style_trait === 'plein') ? '#ffffff' : '#dfe6ee',
                      color: '#334155',
                      fontSize: 10,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Biographie
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, forme: 'bandeau', style_trait: 'pointille', gravite: true }))}
                    style={{
                      padding: '5px 4px',
                      borderRadius: 8,
                      border: '1px solid rgba(255, 255, 255, 0.7)',
                      backgroundColor: formData.style_trait === 'pointille' ? '#ffffff' : '#dfe6ee',
                      color: '#334155',
                      fontSize: 10,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Période floue
                  </button>
                </div>
              </div>

              <div>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Forme du tracé
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginTop: 4 }}>
                  <div
                    onClick={() => setFormData(prev => ({ ...prev, forme: 'bandeau' }))}
                    style={{
                      border: (formData.forme || 'bandeau') === 'bandeau' ? '2px solid #5b4fe8' : '1px solid rgba(255, 255, 255, 0.7)',
                      backgroundColor: (formData.forme || 'bandeau') === 'bandeau' ? '#ffffff' : '#dfe6ee',
                      borderRadius: 9,
                      padding: '8px 4px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <svg width="48" height="18" viewBox="0 0 48 18">
                      <rect x="2" y="2" width="44" height="14" rx="2" fill="#5b4fe8" fillOpacity="0.35" stroke="#5b4fe8" strokeWidth="1.5" />
                    </svg>
                    <span style={{ fontSize: 10, fontWeight: 600, color: '#334155' }}>Bandeau</span>
                  </div>

                  <div
                    onClick={() => setFormData(prev => ({ ...prev, forme: 'ligne' }))}
                    style={{
                      border: formData.forme === 'ligne' ? '2px solid #5b4fe8' : '1px solid rgba(255, 255, 255, 0.7)',
                      backgroundColor: formData.forme === 'ligne' ? '#ffffff' : '#dfe6ee',
                      borderRadius: 9,
                      padding: '8px 4px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <svg width="48" height="18" viewBox="0 0 48 18">
                      <line x1="6" y1="9" x2="42" y2="9" stroke="#5b4fe8" strokeWidth="2.5" />
                      <line x1="6" y1="4" x2="6" y2="14" stroke="#5b4fe8" strokeWidth="2" />
                      <line x1="42" y1="4" x2="42" y2="14" stroke="#5b4fe8" strokeWidth="2" />
                    </svg>
                    <span style={{ fontSize: 10, fontWeight: 600, color: '#334155' }}>Ligne |—|</span>
                  </div>

                  <div
                    onClick={() => setFormData(prev => ({ ...prev, forme: 'ruban' }))}
                    style={{
                      border: formData.forme === 'ruban' ? '2px solid #5b4fe8' : '1px solid rgba(255, 255, 255, 0.7)',
                      backgroundColor: formData.forme === 'ruban' ? '#ffffff' : '#dfe6ee',
                      borderRadius: 9,
                      padding: '8px 4px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <svg width="48" height="18" viewBox="0 0 48 18">
                      <rect x="2" y="3" width="44" height="12" rx="6" fill="#5b4fe8" fillOpacity="0.25" stroke="#5b4fe8" strokeWidth="1.5" />
                    </svg>
                    <span style={{ fontSize: 10, fontWeight: 600, color: '#334155' }}>Ruban</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 2 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Tracé</span>
                  <div style={{ display: 'flex', backgroundColor: '#dfe6ee', padding: 2, borderRadius: 7 }}>
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
                        color: (formData.style_trait || 'plein') === 'plein' ? '#5b4fe8' : '#64748b'
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
                        color: formData.style_trait === 'pointille' ? '#5b4fe8' : '#64748b'
                      }}
                    >
                      Pointillé
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Gravité</span>
                  <div style={{ display: 'flex', backgroundColor: '#dfe6ee', padding: 2, borderRadius: 7 }}>
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
                        color: (formData.gravite !== false) ? '#5b4fe8' : '#64748b'
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
                        color: formData.gravite === false ? '#5b4fe8' : '#64748b'
                      }}
                    >
                      Fixe
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                    Opacité du fond
                  </span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#5b4fe8' }}>
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
                          backgroundColor: isSelected ? '#5b4fe8' : '#dfe6ee',
                          color: isSelected ? '#ffffff' : '#64748b',
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

          {/* Date (saisie manuelle + roulette) */}
          <HistoricalDateSelector
            label={isRange ? 'Date de début' : 'Date'}
            required
            yearValue={formData.anneeDebut}
            onYearChange={(val) => setFormData(prev => ({ ...prev, anneeDebut: val }))}
            eraValue={formData.ereDebut}
            onEraChange={(val) => setFormData(prev => ({ ...prev, ereDebut: val }))}
            monthValue={formData.moisDebut || ''}
            onMonthChange={(val) => setFormData(prev => ({ ...prev, moisDebut: val }))}
            dayValue={formData.jourDebut || ''}
            onDayChange={(val) => setFormData(prev => ({ ...prev, jourDebut: val }))}
          />

          {isRange && (
            <HistoricalDateSelector
              label="Date de fin"
              required
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

          {/* Palette de couleurs + Nuancier personnalisé */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 10.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.4 }}>
              Couleur
            </label>
            <div style={{ display: 'flex', gap: 9, alignItems: 'center', flexWrap: 'wrap' }}>
              {COLOR_PRESETS.map((c) => {
                const isSelected = (formData.couleur || '').toLowerCase() === c.stroke.toLowerCase();
                return (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, couleur: c.stroke }))}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      backgroundColor: c.stroke,
                      border: isSelected ? '2px solid #ffffff' : '2px solid transparent',
                      outline: isSelected ? '2px solid #5b4fe8' : 'none',
                      cursor: 'pointer',
                      transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                      transition: 'all 0.15s ease'
                    }}
                  />
                );
              })}

              {/* Bouton nuancier personnalisé (arc-en-ciel + sélecteur natif) */}
              <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                <button
                  type="button"
                  title="Nuancier personnalisé"
                  onClick={() => colorPickerRef.current?.click()}
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    background: isCustomColor
                      ? formData.couleur
                      : 'conic-gradient(from 0deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)',
                    border: isCustomColor ? '2px solid #ffffff' : '2px solid rgba(255,255,255,0.9)',
                    outline: isCustomColor ? '2px solid #5b4fe8' : '1px solid #cbd5e1',
                    boxShadow: '2px 2px 5px rgba(166, 180, 200, 0.5)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 800,
                    color: '#ffffff',
                    textShadow: '0 1px 2px rgba(0,0,0,0.6)'
                  }}
                >
                  +
                </button>
                <input
                  ref={colorPickerRef}
                  type="color"
                  value={formData.couleur || '#38bdf8'}
                  onChange={(e) => setFormData(prev => ({ ...prev, couleur: e.target.value }))}
                  style={{
                    position: 'absolute',
                    opacity: 0,
                    width: 0,
                    height: 0,
                    pointerEvents: 'none'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Tags */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 10.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.4 }}>
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
                      backgroundColor: active ? '#5b4fe8' : '#eaf0f6',
                      color: active ? '#ffffff' : '#334155',
                      boxShadow: active
                        ? 'inset 2px 2px 4px rgba(0, 0, 0, 0.2)'
                        : '3px 3px 6px rgba(166, 180, 200, 0.45), -3px -3px 6px rgba(255, 255, 255, 0.9)',
                      border: '1px solid rgba(255, 255, 255, 0.7)',
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
                        fontWeight: 600,
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
                          opacity: 0.75
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
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      onAddNewTag();
                    }
                  }}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 14,
                    border: '1px dashed #94a3b8',
                    backgroundColor: '#eaf0f6',
                    fontSize: 11,
                    color: '#1e293b',
                    outline: 'none',
                    width: 95
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
                      backgroundColor: '#5b4fe8',
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
            <label style={{ fontSize: 10.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.4 }}>
              Importance
            </label>
            <div style={{
              display: 'flex',
              backgroundColor: '#dfe6ee',
              borderRadius: 12,
              padding: 3,
              gap: 4,
              boxShadow: 'inset 2px 2px 5px rgba(166, 180, 200, 0.55), inset -2px -2px 5px rgba(255, 255, 255, 0.85)'
            }}>
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
                      borderRadius: 9,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      backgroundColor: active ? '#5b4fe8' : 'transparent',
                      color: active ? '#ffffff' : '#64748b',
                      boxShadow: active ? '2px 2px 6px rgba(91, 79, 232, 0.35)' : 'none',
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
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 16px',
                borderRadius: 12,
                border: '1px solid rgba(255, 255, 255, 0.85)',
                backgroundColor: '#eaf0f6',
                boxShadow: '4px 4px 8px rgba(166, 180, 200, 0.5), -4px -4px 8px rgba(255, 255, 255, 0.9)',
                color: '#475569',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '9px 22px',
                borderRadius: 12,
                border: 'none',
                backgroundColor: '#5b4fe8',
                color: '#ffffff',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '4px 4px 10px rgba(91, 79, 232, 0.35)'
              }}
            >
              {isSubmitting ? 'Création...' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}