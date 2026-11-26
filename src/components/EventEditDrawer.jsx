import React, { useState, useEffect, useRef } from 'react';
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

export default function EventEditDrawer({
  isOpen,
  onClose,
  event,
  onSave,
  onDelete,
  availableTags,
  onCreateTag = () => {},
  availableGroups = [],
  onCreateGroup = () => {},
  onDeleteGroup = () => {}
}) {
  const [formData, setFormData] = useState({
    titre: '',
    groupe_id: '',
    anneeDebut: '',
    ereDebut: 'CE',
    moisDebut: '',
    jourDebut: '',
    anneeFin: '',
    ereFin: 'CE',
    moisFin: '',
    jourFin: '',
    isRange: false,
    couleur: '',
    importance: 3,
    tags: [],
    forme: 'bandeau',
    opacite: 0.85,
    style_trait: 'plein',
    gravite: true
  });

  const [newGroupInput, setNewGroupInput] = useState('');
  const [newTagInput, setNewTagInput] = useState('');
  const [isTagsPickerOpen, setIsTagsPickerOpen] = useState(false);
  const [tagSearch, setTagSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const colorPickerRef = useRef(null);

  useEffect(() => {
    if (!event) return;
    const isEvtRange = event.date_fin !== null && event.date_fin !== undefined && event.date_fin !== '';

    setFormData({
      titre: event.titre || '',
      groupe_id: event.groupe_id || '',
      anneeDebut: Math.abs(event.date_debut || 0).toString(),
      ereDebut: (event.date_debut || 0) < 0 ? 'BCE' : 'CE',
      moisDebut: event.mois_debut ? String(event.mois_debut) : '',
      jourDebut: event.jour_debut ? String(event.jour_debut) : '',
      anneeFin: isEvtRange ? Math.abs(event.date_fin).toString() : '',
      ereFin: isEvtRange && event.date_fin < 0 ? 'BCE' : 'CE',
      moisFin: isEvtRange && event.mois_fin ? String(event.mois_fin) : '',
      jourFin: isEvtRange && event.jour_fin ? String(event.jour_fin) : '',
      isRange: isEvtRange,
      couleur: event.couleur || COLOR_PRESETS[0].stroke,
      importance: event.importance || 3,
      tags: Array.isArray(event.tags) && event.tags.length > 0 ? event.tags : [event.categorie || 'Général'],
      forme: event.forme || 'bandeau',
      opacite: event.opacite ?? 0.85,
      style_trait: event.style_trait || 'plein',
      gravite: event.gravite !== false
    });
    setNewGroupInput('');
    setNewTagInput('');
  }, [event]);

  if (!isOpen || !event) return null;

  const isCustomColor = !COLOR_PRESETS.some(c => c.stroke.toLowerCase() === (formData.couleur || '').toLowerCase());
  const filteredTags = availableTags.filter(t => t.toLowerCase().includes(tagSearch.toLowerCase()));

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
    fontFamily: 'inherit',
    boxSizing: 'border-box'
  };

  const handleAddGroupLocal = () => {
    const val = newGroupInput.trim();
    if (!val) return;
    onCreateGroup(val);
    setFormData(prev => ({ ...prev, groupe_id: val }));
    setNewGroupInput('');
  };

  const handleAddTagLocal = () => {
    const val = newTagInput.trim();
    if (!val) return;
    onCreateTag(val);
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(val) ? prev.tags : [...prev.tags, val]
    }));
    setNewTagInput('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    const startVal = Number(formData.anneeDebut);
    const calculatedStart = formData.ereDebut === 'BCE' ? -Math.abs(startVal) : startVal;
    const parsedMoisDebut = formData.moisDebut ? Number(formData.moisDebut) : null;
    const parsedJourDebut = parsedMoisDebut && formData.jourDebut ? Number(formData.jourDebut) : null;

    let calculatedEnd = null;
    let parsedMoisFin = null;
    let parsedJourFin = null;
    if (formData.isRange && formData.anneeFin !== '') {
      const endVal = Number(formData.anneeFin);
      calculatedEnd = formData.ereFin === 'BCE' ? -Math.abs(endVal) : endVal;
      parsedMoisFin = formData.moisFin ? Number(formData.moisFin) : null;
      parsedJourFin = parsedMoisFin && formData.jourFin ? Number(formData.jourFin) : null;
    }

    const pendingGroup = newGroupInput.trim();
    if (pendingGroup) {
      onCreateGroup(pendingGroup);
    }
    const finalGroup = pendingGroup || (formData.groupe_id ? formData.groupe_id.trim() : null);

    const payload = {
      titre: formData.titre.trim(),
      groupe_id: finalGroup,
      date_debut: calculatedStart,
      mois_debut: parsedMoisDebut,
      jour_debut: parsedJourDebut,
      date_fin: calculatedEnd,
      mois_fin: parsedMoisFin,
      jour_fin: parsedJourFin,
      couleur: formData.couleur,
      importance: Number(formData.importance),
      tags: formData.tags,
      categorie: formData.tags[0] || 'Général',
      forme: formData.forme || 'bandeau',
      opacite: formData.opacite ?? 0.85,
      style_trait: formData.style_trait || 'plein',
      gravite: formData.gravite !== false
    };

    await onSave(event.id, payload);
    setIsSaving(false);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        backgroundColor: 'rgba(15, 23, 42, 0.35)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 450,
          maxHeight: '90dvh',
          overflowY: 'auto',
          backgroundColor: '#eaf0f6',
          borderRadius: 24,
          boxShadow: '12px 12px 28px rgba(166, 180, 200, 0.55), -10px -10px 24px rgba(255, 255, 255, 0.9)',
          border: '1px solid rgba(255, 255, 255, 0.85)',
          color: '#1e293b',
          padding: '20px 22px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          boxSizing: 'border-box',
          position: 'relative'
        }}
      >
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
            fontSize: 12,
            fontWeight: 700,
            color: '#64748b',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10
          }}
        >
          ✕
        </button>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
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
                        if (formData.groupe_id === grp) {
                          setFormData(prev => ({ ...prev, groupe_id: '' }));
                        }
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
                      handleAddGroupLocal();
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
                    onClick={handleAddGroupLocal}
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

          {/* Bascule Ponctuel / Période */}
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
              onClick={() => setFormData(prev => ({ ...prev, isRange: false }))}
              style={{
                flex: 1,
                padding: '7px 0',
                border: 'none',
                borderRadius: 9,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                backgroundColor: !formData.isRange ? '#eaf0f6' : 'transparent',
                color: !formData.isRange ? '#5b4fe8' : '#64748b',
                boxShadow: !formData.isRange ? '3px 3px 6px rgba(166, 180, 200, 0.5), -3px -3px 6px rgba(255, 255, 255, 0.9)' : 'none'
              }}
            >
              Ponctuel
            </button>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, isRange: true }))}
              style={{
                flex: 1,
                padding: '7px 0',
                border: 'none',
                borderRadius: 9,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                backgroundColor: formData.isRange ? '#eaf0f6' : 'transparent',
                color: formData.isRange ? '#5b4fe8' : '#64748b',
                boxShadow: formData.isRange ? '3px 3px 6px rgba(166, 180, 200, 0.5), -3px -3px 6px rgba(255, 255, 255, 0.9)' : 'none'
              }}
            >
              Période
            </button>
          </div>

          {/* Sélecteur d'apparence si période */}
          {formData.isRange && (
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
                          color: isSelected ? '#ffffff' : '#64748b'
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

          {/* Date */}
          <HistoricalDateSelector
            label={formData.isRange ? 'Date de début' : 'Date'}
            required
            yearValue={formData.anneeDebut}
            onYearChange={(val) => setFormData(prev => ({ ...prev, anneeDebut: val }))}
            eraValue={formData.ereDebut}
            onEraChange={(val) => setFormData(prev => ({ ...prev, ereDebut: val }))}
            monthValue={formData.moisDebut}
            onMonthChange={(val) => setFormData(prev => ({ ...prev, moisDebut: val }))}
            dayValue={formData.jourDebut}
            onDayChange={(val) => setFormData(prev => ({ ...prev, jourDebut: val }))}
          />

          {formData.isRange && (
            <HistoricalDateSelector
              label="Date de fin"
              required
              yearValue={formData.anneeFin}
              onYearChange={(val) => setFormData(prev => ({ ...prev, anneeFin: val }))}
              eraValue={formData.ereFin}
              onEraChange={(val) => setFormData(prev => ({ ...prev, ereFin: val }))}
              monthValue={formData.moisFin}
              onMonthChange={(val) => setFormData(prev => ({ ...prev, moisFin: val }))}
              dayValue={formData.jourFin}
              onDayChange={(val) => setFormData(prev => ({ ...prev, jourFin: val }))}
            />
          )}

          {/* Couleur */}
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
                    border: '2px solid #ffffff',
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

          {/* Bouton Tags compact (ouvre la fenêtre dédiée) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 10.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.4 }}>
              Tags
            </label>
            <button
              type="button"
              onClick={() => { setTagSearch(''); setIsTagsPickerOpen(true); }}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 12,
                border: '1px solid rgba(255, 255, 255, 0.85)',
                backgroundColor: '#eaf0f6',
                boxShadow: '3px 3px 7px rgba(166, 180, 200, 0.45), -3px -3px 7px rgba(255, 255, 255, 0.9)',
                color: '#1e293b',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8
              }}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#5b4fe8' }}>
                {(formData.tags || []).join(', ') || 'Sélectionner'}
              </span>
              <span style={{
                padding: '2px 8px',
                borderRadius: 8,
                backgroundColor: '#dfe6ee',
                color: '#475569',
                fontSize: 10.5,
                fontWeight: 700,
                flexShrink: 0
              }}>
                {(formData.tags || []).length}
              </span>
            </button>
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

          {/* Actions bas */}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 6 }}>
            <button
              type="button"
              onClick={() => onDelete(event)}
              style={{
                padding: '9px 16px',
                borderRadius: 12,
                border: '1px solid #fecaca',
                backgroundColor: '#fff1f2',
                color: '#e11d48',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Supprimer
            </button>

            <button
              type="submit"
              disabled={isSaving}
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
              {isSaving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>

      {/* Fenêtre dédiée de sélection des Tags */}
      {isTagsPickerOpen && (
        <div
          onClick={() => setIsTagsPickerOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 70,
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 360,
              maxHeight: '75dvh',
              backgroundColor: '#eaf0f6',
              borderRadius: 22,
              border: '1px solid rgba(255, 255, 255, 0.85)',
              boxShadow: '12px 12px 28px rgba(15, 23, 42, 0.35)',
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              color: '#1e293b'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: '#5b4fe8' }}>
                Tags
              </span>
              <button
                type="button"
                onClick={() => setIsTagsPickerOpen(false)}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  backgroundColor: '#eaf0f6',
                  border: '1px solid rgba(255, 255, 255, 0.85)',
                  boxShadow: '2px 2px 5px rgba(166, 180, 200, 0.5)',
                  color: '#64748b',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>

            <input
              type="text"
              placeholder="Rechercher..."
              value={tagSearch}
              onChange={(e) => setTagSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 11px',
                borderRadius: 11,
                border: 'none',
                backgroundColor: '#dfe6ee',
                boxShadow: 'inset 2px 2px 5px rgba(166, 180, 200, 0.5)',
                fontSize: 12,
                color: '#1e293b',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 240, overflowY: 'auto', paddingRight: 3 }}>
              {filteredTags.map((tag) => {
                const active = formData.tags?.includes(tag);
                return (
                  <div
                    key={tag}
                    onClick={() => {
                      setFormData(prev => {
                        const exists = prev.tags.includes(tag);
                        if (exists && prev.tags.length === 1) return prev;
                        return {
                          ...prev,
                          tags: exists ? prev.tags.filter(t => t !== tag) : [...prev.tags, tag]
                        };
                      });
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '7px 10px',
                      borderRadius: 10,
                      backgroundColor: active ? '#5b4fe8' : '#ffffff',
                      color: active ? '#ffffff' : '#1e293b',
                      fontSize: 11.5,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <span>{tag}</span>
                    <span>{active ? '✓' : ''}</span>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: 6 }}>
              <input
                type="text"
                enterKeyHint="done"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTagLocal();
                  }
                }}
                style={{
                  flex: 1,
                  padding: '7px 10px',
                  borderRadius: 10,
                  border: '1px dashed #94a3b8',
                  backgroundColor: '#eaf0f6',
                  fontSize: 11.5,
                  outline: 'none'
                }}
              />
              <button
                type="button"
                onClick={handleAddTagLocal}
                style={{
                  padding: '7px 12px',
                  borderRadius: 10,
                  border: 'none',
                  backgroundColor: '#5b4fe8',
                  color: '#ffffff',
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                +
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsTagsPickerOpen(false)}
              style={{
                width: '100%',
                padding: '9px 0',
                borderRadius: 11,
                border: 'none',
                backgroundColor: '#5b4fe8',
                color: '#ffffff',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}