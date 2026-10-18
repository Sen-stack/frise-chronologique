import React, { useState } from 'react';
import TimelineCanvas from './components/TimelineCanvas.jsx';
import TestScene3D from './components/TestScene3D.jsx';

function App() {
  const [show3DPoC, setShow3DPoC] = useState(false);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {/* 1. Ta frise habituelle reste active par défaut */}
      <TimelineCanvas />

      {/* 2. Quand on clique sur le bouton, le prototype 3D s'affiche par-dessus */}
      {show3DPoC && (
        <TestScene3D onClose={() => setShow3DPoC(false)} />
      )}

      {/* 3. Le bouton en bas à gauche pour tester */}
      <button
        type="button"
        onClick={() => setShow3DPoC(true)}
        style={{
          position: 'fixed',
          bottom: 20,
          left: 20,
          zIndex: 9000,
          backgroundColor: '#0f172a',
          color: '#38bdf8',
          border: '1px solid #0284c7',
          padding: '8px 14px',
          borderRadius: 8,
          cursor: 'pointer',
          fontWeight: 'bold',
          fontSize: 12,
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
        }}
      >
        🧊 Tester le Vrai Marbre 3D
      </button>
    </div>
  );
}

export default App;