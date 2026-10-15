import React, { useState } from 'react';

export default function WikimediaPickerModal({ isOpen, onClose, onSelectImage }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  if (!isOpen) return null;

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      // Ajoute "map" si absent pour cibler les cartes historiques
      const searchTerm = query.toLowerCase().includes('map') ? query : `${query} map`;
      const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(searchTerm)}&gsrnamespace=6&prop=imageinfo&iiprop=url|mime&iiurlwidth=400&format=json&origin=*`;

      const res = await fetch(url);
      const data = await res.json();

      if (!data.query?.pages) {
        setResults([]);
      } else {
        const items = Object.values(data.query.pages)
          .map(item => ({
            id: item.pageid,
            titre: (item.title || '').replace('File:', '').replace(/\.[^/.]+$/, ''),
            thumb: item.imageinfo?.[0]?.thumburl,
            url: item.imageinfo?.[0]?.url
          }))
          .filter(item => item.thumb && item.url);

        setResults(items);
      }
    } catch (err) {
      console.error('Erreur Wikimedia Commons :', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!selectedItem) return;
    onSelectImage({
      source: 'wikimedia',
      titre: selectedItem.titre,
      url: selectedItem.url
    });
    setSelectedItem(null);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 60,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16
    }}>
      <div style={{
        backgroundColor: '#0f172a',
        border: '1px solid #334155',
        borderRadius: 12,
        width: '100%',
        maxWidth: 680,
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        color: '#f8fafc',
        boxShadow: '0 20px 40px rgba(0,0,0,0.8)'
      }}>
        {/* En-tête */}
        <div style={{
          padding: '12px 18px',
          borderBottom: '1px solid #1e293b',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 'bold', color: '#38bdf8' }}>
              Rechercher sur Wikimedia Commons
            </h3>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>
              Sélectionnez une carte historique à associer
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 16, cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        {/* Barre de recherche */}
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, padding: 12, borderBottom: '1px solid #1e293b' }}>
          <input
            type="text"
            placeholder="Ex : Siege of Constantinople, Gallia romaine, Waterloo..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              backgroundColor: '#020617',
              border: '1px solid #334155',
              borderRadius: 6,
              padding: '8px 12px',
              color: '#ffffff',
              fontSize: 12,
              outline: 'none'
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '8px 16px',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: 6,
              fontWeight: 600,
              fontSize: 12,
              cursor: 'pointer'
            }}
          >
            {loading ? 'Recherche…' : 'Chercher'}
          </button>
        </form>

        {/* Galerie */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: 14,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: 12
        }}>
          {results.map((item) => {
            const isSelected = selectedItem?.url === item.url;
            return (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                style={{
                  border: isSelected ? '2px solid #38bdf8' : '1px solid #1e293b',
                  borderRadius: 8,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.1)' : '#020617',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <div style={{ height: 110, backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  <img
                    src={item.thumb}
                    alt={item.titre}
                    referrerPolicy="no-referrer"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <div style={{ padding: 8, fontSize: 11, color: '#cbd5e1', lineHeight: 1.3 }}>
                  <p style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {item.titre}
                  </p>
                </div>
              </div>
            );
          })}

          {!loading && results.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#64748b', padding: 25, fontSize: 12 }}>
              Tape un mot-clé pour lancer la recherche d'archives.
            </div>
          )}
        </div>

        {/* Pied de page */}
        <div style={{
          padding: '12px 18px',
          borderTop: '1px solid #1e293b',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>
            {selectedItem ? `Sélection : ${selectedItem.titre.substring(0, 35)}…` : 'Aucun élément choisi'}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '6px 14px',
                backgroundColor: '#1e293b',
                color: '#94a3b8',
                border: 'none',
                borderRadius: 6,
                fontSize: 12,
                cursor: 'pointer'
              }}
            >
              Annuler
            </button>
            <button
              type="button"
              disabled={!selectedItem}
              onClick={handleConfirm}
              style={{
                padding: '6px 16px',
                backgroundColor: selectedItem ? '#0284c7' : '#334155',
                color: '#ffffff',
                border: 'none',
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 12,
                cursor: selectedItem ? 'pointer' : 'not-allowed'
              }}
            >
              Valider la carte
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}