import React, { useState, useEffect, useRef } from 'react';

export default function CityPicker({ latitude, longitude, onLocationSelect }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cityName, setCityName] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  // Déduire le nom de la ville si les coordonnées existent déjà
  useEffect(() => {
    if (latitude && longitude) {
      async function reverseGeocode() {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`
          );
          const data = await res.json();
          const name = data.address?.city || data.address?.town || data.address?.village || data.display_name?.split(',')[0];
          setCityName(name || `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`);
        } catch {
          setCityName(`${latitude.toFixed(2)}, ${longitude.toFixed(2)}`);
        }
      }
      reverseGeocode();
    } else {
      setCityName('');
    }
  }, [latitude, longitude]);

  // Fermer les suggestions si on clique à côté
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (val) => {
    setQuery(val);
    if (val.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val)}&limit=5&addressdetails=1`
      );
      const data = await res.json();
      setSuggestions(data || []);
      setIsOpen(true);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (item) => {
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);
    const label = item.address?.city || item.address?.town || item.address?.village || item.display_name.split(',')[0];
    
    setCityName(label);
    setQuery('');
    setSuggestions([]);
    setIsOpen(false);

    if (onLocationSelect) {
      onLocationSelect({ latitude: lat, longitude: lon, nom: label });
    }
  };

  const handleReset = (e) => {
    e.stopPropagation();
    setCityName('');
    setQuery('');
    if (onLocationSelect) {
      onLocationSelect({ latitude: null, longitude: null, nom: '' });
    }
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%', maxWidth: 280, fontFamily: 'inherit' }}>
      {cityName ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '5px 10px',
            backgroundColor: 'rgba(253, 251, 247, 0.92)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(180, 150, 120, 0.35)',
            borderRadius: 8,
            boxShadow: '0 2px 8px rgba(44, 34, 22, 0.08)',
            fontSize: 11,
            color: '#2b2118'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#b45309', flexShrink: 0 }} />
            <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {cityName}
            </span>
          </div>
          <button
            type="button"
            onClick={handleReset}
            title="Changer de lieu"
            style={{
              border: 'none',
              background: 'transparent',
              color: '#8c7e72',
              cursor: 'pointer',
              fontSize: 11,
              padding: '0 2px'
            }}
          >
            ✕
          </button>
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => { if (suggestions.length > 0) setIsOpen(true); }}
            placeholder="Lier une cité ou un lieu..."
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '6px 10px',
              backgroundColor: 'rgba(253, 251, 247, 0.94)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(180, 150, 120, 0.35)',
              borderRadius: 8,
              boxShadow: '0 2px 8px rgba(44, 34, 22, 0.08)',
              fontSize: 11,
              color: '#2b2118',
              outline: 'none'
            }}
          />
          {loading && (
            <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: '#8c7e72' }}>
              …
            </span>
          )}
        </div>
      )}

      {/* Menu déroulant des résultats */}
      {isOpen && suggestions.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            width: '100%',
            backgroundColor: 'rgba(253, 251, 247, 0.98)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(180, 150, 120, 0.35)',
            borderRadius: 8,
            boxShadow: '0 8px 20px rgba(44, 34, 22, 0.12)',
            overflow: 'hidden',
            zIndex: 1100,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {suggestions.map((item, idx) => {
            const principal = item.address?.city || item.address?.town || item.address?.village || item.display_name.split(',')[0];
            const pays = item.address?.country || '';
            return (
              <div
                key={idx}
                onClick={() => handleSelect(item)}
                style={{
                  padding: '6px 10px',
                  cursor: 'pointer',
                  borderBottom: idx < suggestions.length - 1 ? '1px solid rgba(180, 150, 120, 0.15)' : 'none',
                  fontSize: 11,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  transition: 'background-color 0.1s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(180, 83, 9, 0.08)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <span style={{ fontWeight: 600, color: '#2b2118' }}>{principal}</span>
                <span style={{ fontSize: 9, color: '#8c7e72' }}>{pays}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}