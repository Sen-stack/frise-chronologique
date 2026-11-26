import React, { useState } from 'react';

export default function TagThemeModal({
  isOpen,
  onClose,
  availableTags = [],
  onCreateTag,
  onDeleteTag,
  availableGroups = [],
  onCreateGroup,
  onDeleteGroup
}) {
  const [activeTab, setActiveTab] = useState('tag');
  const [inputValue, setInputValue] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    if (activeTab === 'tag') {
      onCreateTag(trimmed);
    } else {
      onCreateGroup(trimmed);
    }
    setInputValue('');
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 65,
        backgroundColor: 'rgba(15, 23, 42, 0.42)',
        backdropFilter: 'blur(6px)',
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
          maxWidth: 400,
          maxHeight: '82dvh',
          backgroundColor: '#eaf0f6',
          borderRadius: 24,
          border: '1px solid rgba(255, 255, 255, 0.85)',
          boxShadow: '12px 12px 28px rgba(15, 23, 42, 0.35)',
          padding: '20px 22px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          color: '#1e293b',
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
          boxSizing: 'border-box',
          position: 'relative'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.6, color: '#5b4fe8' }}>
            Tags & Thématiques
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: 28,
              height: 28,
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
              justifyContent: 'center'
            }}
          >
            ✕
          </button>
        </div>

        {/* Sélecteur Tag / Thématique */}
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
            onClick={() => setActiveTab('tag')}
            style={{
              flex: 1,
              padding: '7px 0',
              border: 'none',
              borderRadius: 9,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              backgroundColor: activeTab === 'tag' ? '#eaf0f6' : 'transparent',
              color: activeTab === 'tag' ? '#5b4fe8' : '#64748b',
              boxShadow: activeTab === 'tag' ? '3px 3px 6px rgba(166, 180, 200, 0.5), -3px -3px 6px rgba(255, 255, 255, 0.9)' : 'none'
            }}
          >
            Tag
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('theme')}
            style={{
              flex: 1,
              padding: '7px 0',
              border: 'none',
              borderRadius: 9,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              backgroundColor: activeTab === 'theme' ? '#eaf0f6' : 'transparent',
              color: activeTab === 'theme' ? '#5b4fe8' : '#64748b',
              boxShadow: activeTab === 'theme' ? '3px 3px 6px rgba(166, 180, 200, 0.5), -3px -3px 6px rgba(255, 255, 255, 0.9)' : 'none'
            }}
          >
            Thématique
          </button>
        </div>

        {/* Formulaire de création */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            style={{
              flex: 1,
              padding: '9px 12px',
              borderRadius: 12,
              border: '1px solid rgba(255, 255, 255, 0.75)',
              backgroundColor: '#eaf0f6',
              boxShadow: 'inset 2px 2px 5px rgba(166, 180, 200, 0.55), inset -2px -2px 5px rgba(255, 255, 255, 0.9)',
              fontSize: 13,
              color: '#1e293b',
              outline: 'none'
            }}
          />
          <button
            type="submit"
            style={{
              padding: '9px 16px',
              borderRadius: 12,
              border: 'none',
              backgroundColor: '#5b4fe8',
              color: '#ffffff',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '3px 3px 8px rgba(91, 79, 232, 0.35)'
            }}
          >
            Créer
          </button>
        </form>

        {/* Liste existante avec scroll interne */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
          maxHeight: 220,
          overflowY: 'auto',
          padding: 4
        }}>
          {activeTab === 'tag'
            ? availableTags.map(tag => (
                <div
                  key={tag}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    borderRadius: 14,
                    backgroundColor: '#eaf0f6',
                    color: '#334155',
                    boxShadow: '2px 2px 5px rgba(166, 180, 200, 0.45), -2px -2px 5px rgba(255, 255, 255, 0.9)',
                    border: '1px solid rgba(255, 255, 255, 0.75)',
                    padding: '4px 8px 4px 10px',
                    fontSize: 11,
                    fontWeight: 600,
                    gap: 6
                  }}
                >
                  <span>{tag}</span>
                  {availableTags.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onDeleteTag && onDeleteTag(tag)}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: '#e11d48',
                        fontWeight: 700,
                        cursor: 'pointer',
                        padding: 0,
                        fontSize: 11
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))
            : availableGroups.map(grp => (
                <div
                  key={grp}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    borderRadius: 14,
                    backgroundColor: '#eaf0f6',
                    color: '#334155',
                    boxShadow: '2px 2px 5px rgba(166, 180, 200, 0.45), -2px -2px 5px rgba(255, 255, 255, 0.9)',
                    border: '1px solid rgba(255, 255, 255, 0.75)',
                    padding: '4px 8px 4px 10px',
                    fontSize: 11,
                    fontWeight: 600,
                    gap: 6
                  }}
                >
                  <span>{grp}</span>
                  <button
                    type="button"
                    onClick={() => onDeleteGroup && onDeleteGroup(grp)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: '#e11d48',
                      fontWeight: 700,
                      cursor: 'pointer',
                      padding: 0,
                      fontSize: 11
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
        </div>
      </div>
    </div>
  );
}