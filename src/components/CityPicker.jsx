import React, { useState, useEffect, useRef } from 'react';

export default function CityPicker({ latitude, longitude, onLocationSelect }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const debounceTimerRef = useRef(null);

  // Recherche sur l'API Nominatim (OpenStreetMap)
  const searchCities = async (text) => {
    if (!text.trim() || text.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(text)}&format=json&addressdetails=1&limit=6&accept-language=fr`;
      const res = await fetch(url, {
        headers: { 'Accept': 'application/json' }
      });
      const data = await res.json();

      const items = (data || []).map(item => ({
        id: item.place_id,
        nomComplet: item.display_name,
        nomCourt: item.name || item.address?.city || item.address?.town || item.address?.village || text,
        pays: item.address?.country || '',
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon)
      }));

      setSuggestions(items);
      setIsOpen(true);
    } catch (err) {
      console.error('Erreur de géocodage :', err);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setSelectedLabel('');

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      searchCities(val);
    }, 350); // Attend 350ms après la frappe pour éviter de spammer l'API
  };

  const handleSelect = (item) => {
    setQuery('');
    setSelectedLabel(`${item.nomCourt} (${item.pays})`);
    setSuggestions([]);
    setIsOpen(false);
    onLocationSelect({
      latitude: item.lat,
      longitude: item.lon,
      label: item.nomCourt
    });
  };

  const handleClear = () => {
    setQuery('');
    setSelectedLabel('');
    setSuggestions([]);
    onLocationSelect({
      latitude: '',
      longitude: '',
      label: ''
    });
  };

  const hasCoords = latitude !== '' && latitude !== null && longitude !== '' && longitude !== null;

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ display: 'block', color: '#cbd5e1', fontSize: 11, fontWeight: 500 }}>
        Localisation moderne (ville, région ou capitale)
      </label>

      {hasCoords && selectedLabel ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#020617',
          border: '1px solid #10b981',
          borderRadius: 6,
          padding: '6px 10px',
          fontSize: 11
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#34d399' }}>
            <span>📍</span>
            <span style={{ fontWeight: 600 }}>{selectedLabel}</span>
            <span style={{ fontSize: 10, color: '#64748b' }}>({latitude.toFixed(3)}, {longitude.toFixed(3)})</span>
          </div>
          <button
            type="button"
            onClick={handleClear}
            style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer', fontSize: 12 }}
          >
            ✕
          </button>
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            value={query}
            placeholder="Rechercher une ville dans le monde (ex: Rome, Constantinople, Bagdad...)"
            onChange={handleInputChange}
            onFocus={() => { if (suggestions.length > 0) setIsOpen(true); }}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              backgroundColor: '#020617',
              border: '1px solid #334155',
              borderRadius: 6,
              padding: '7px 10px',
              color: '#ffffff',
              fontSize: 11,
              outline: 'none'
            }}
          />
          {isLoading && (
            <span style={{ position: 'absolute', right: 10, top: 7, fontSize: 10, color: '#38bdf8' }}>
              Recherche…
            </span>
          )}

          {isOpen && suggestions.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: 4,
              backgroundColor: '#0f172a',
              border: '1px solid #334155',
              borderRadius: 8,
              boxShadow: '0 10px 25px rgba(0,0,0,0.8)',
              zIndex: 70,
              maxHeight: 180,
              overflowY: 'auto'
            }}>
              {suggestions.map(s => (
                <div
                  key={s.id}
                  onClick={() => handleSelect(s)}
                  style={{
                    padding: '8px 10px',
                    fontSize: 11,
                    cursor: 'pointer',
                    borderBottom: '1px solid #1e293b',
                    color: '#f8fafc',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.15)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <span style={{ fontWeight: 600, color: '#38bdf8' }}>{s.nomCourt}</span>
                  <span style={{ fontSize: 9, color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {s.nomComplet}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}