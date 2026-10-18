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

      
    </div>
  );
}

export default App;