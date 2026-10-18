import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

// 1. DÉFINITION DES GRANDES ÉPOQUES SUR LE MONOLITHE
const EPOCHS = [
  { id: "cosmo", nom: "Cosmologie & Terre (-4.5 Ga)", start: -4500000000, end: -300000, ratio: 0.22, color: "#1e1b4b" },
  { id: "prehist", nom: "Préhistoire", start: -300000, end: -3500, ratio: 0.16, color: "#172554" },
  { id: "antiq", nom: "Antiquité", start: -3500, end: 476, ratio: 0.16, color: "#064e3b" },
  { id: "moyenage", nom: "Moyen Âge", start: 476, end: 1492, ratio: 0.16, color: "#713f12" },
  { id: "moderne", nom: "Époque Moderne", start: 1492, end: 1789, ratio: 0.15, color: "#7c2d12" },
  { id: "contemp", nom: "Contemporain (2026)", start: 1789, end: 2026, ratio: 0.15, color: "#881337" }
];

const MONOLITH_WIDTH = 22; // 22 mètres dans l'espace 3D
const MONOLITH_LEFT = -MONOLITH_WIDTH / 2;

function yearTo3DX(year) {
  const clamped = Math.max(-4500000000, Math.min(2026, year));
  let accRatio = 0;
  for (const ep of EPOCHS) {
    if (clamped <= ep.end) {
      const progress = (clamped - ep.start) / (ep.end - ep.start);
      return MONOLITH_LEFT + (accRatio + progress * ep.ratio) * MONOLITH_WIDTH;
    }
    accRatio += ep.ratio;
  }
  return MONOLITH_LEFT + MONOLITH_WIDTH;
}

// 2. MONOLITHE DE PIERRE
function SharpMarbleMonolith() {
  const [texture, setTexture] = useState(null);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    const applyTexture = (tex) => {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(7, 1.2);
      tex.anisotropy = 16;
      setTexture(tex);
    };
    loader.load('/textures/marble.JPG', applyTexture, undefined, () => {
      loader.load('/textures/marble.jpg', applyTexture);
    });
  }, []);

  return (
    <group position={[0, -0.6, 0]}>
      <RoundedBox args={[MONOLITH_WIDTH, 0.42, 2.0]} radius={0.015} smoothness={3}>
        <meshStandardMaterial
          map={texture || null}
          color={texture ? '#ffffff' : '#f5f2eb'}
          roughness={0.22}
          metalness={0.02}
        />
      </RoundedBox>

      <mesh position={[0, -0.215, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[MONOLITH_WIDTH + 0.6, 2.3]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.32} />
      </mesh>
    </group>
  );
}

// 3. BANDEAU DES ÉPOQUES
function EpochStrip() {
  let curX = MONOLITH_LEFT;

  return (
    <group position={[0, -0.388, -0.65]}>
      {EPOCHS.map((ep) => {
        const segW = ep.ratio * MONOLITH_WIDTH;
        const centerX = curX + segW / 2;
        curX += segW;

        return (
          <group key={ep.id} position={[centerX, 0, 0]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[segW - 0.05, 0.22]} />
              <meshBasicMaterial color={ep.color} transparent opacity={0.22} />
            </mesh>
            <Text
              position={[0, 0.003, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
              fontSize={0.09}
              color="#334155"
              anchorX="center"
              anchorY="middle"
              letterSpacing={0.08}
            >
              {ep.nom.toUpperCase()}
            </Text>
          </group>
        );
      })}
    </group>
  );
}

// 4. FEUILLES TRANSPARENTES DE PÉRIODES
function UserPeriodFilm({ startYear, endYear, trackZ, color, title }) {
  const x1 = yearTo3DX(startYear);
  const x2 = yearTo3DX(endYear);
  const width = Math.max(0.14, x2 - x1);
  const centerX = x1 + width / 2;

  return (
    <group position={[centerX, -0.38, trackZ]}>
      <RoundedBox args={[width, 0.012, 0.30]} radius={0.003} smoothness={2}>
        <meshPhysicalMaterial
          color={color}
          transparent
          opacity={0.5}
          roughness={0.1}
          transmission={0.45}
          thickness={0.05}
        />
      </RoundedBox>

      {width > 0.45 && (
        <Text
          position={[0, 0.012, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.095}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.005}
          outlineColor="rgba(0,0,0,0.5)"
        >
          {title}
        </Text>
      )}
    </group>
  );
}

// 5. JALONS LUMINEUX
function RefinedPin({ year, trackZ, color, label, dateStr }) {
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef();
  const headRef = useRef();
  const x = yearTo3DX(year);

  useFrame(({ camera, clock }) => {
    if (groupRef.current) {
      const dist = camera.position.distanceTo(groupRef.current.position);
      const scaleFactor = Math.min(1.15, Math.max(0.65, dist * 0.22));
      groupRef.current.scale.set(scaleFactor, scaleFactor, scaleFactor);
    }
    if (headRef.current) {
      headRef.current.position.y = 0.95 + Math.sin(clock.elapsedTime * 2.8 + x) * 0.03;
    }
  });

  return (
    <group position={[x, -0.39, trackZ]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}>
        <circleGeometry args={[0.18, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.38} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0]}>
        <ringGeometry args={[0.045, 0.065, 32]} />
        <meshBasicMaterial color={color} side={THREE.DoubleSide} />
      </mesh>

      <group ref={groupRef}>
        <mesh position={[0, 0.48, 0]}>
          <cylinderGeometry args={[0.0035, 0.0035, 0.94, 16]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} />
        </mesh>

        <mesh
          ref={headRef}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
        >
          <sphereGeometry args={[0.055, 32, 32]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive={color}
            emissiveIntensity={hovered ? 3.0 : 1.4}
            roughness={0.15}
          />
        </mesh>

        <group position={[0, 1.14, 0]}>
          <Text
            fontSize={0.11}
            color="#ffffff"
            anchorX="center"
            anchorY="bottom"
            outlineWidth={0.01}
            outlineColor="#090d16"
          >
            {label}
          </Text>
          <Text
            position={[0, -0.035, 0]}
            fontSize={0.08}
            color={color}
            anchorX="center"
            anchorY="top"
            outlineWidth={0.006}
            outlineColor="#090d16"
          >
            {dateStr}
          </Text>
        </group>
      </group>
    </group>
  );
}

// 6. SCÈNE PRINCIPALE AVEC DÉPLACEMENT AU CLIC GAUCHE
export default function TestScene3D({ onClose }) {
  const controlsRef = useRef();

  const jumpTo = (year) => {
    if (!controlsRef.current) return;
    const targetX = yearTo3DX(year);
    const camera = controlsRef.current.object;
    
    // Déplace à la fois la cible et la caméra sur l'époque choisie
    const currentCamOffsetZ = camera.position.z - controlsRef.current.target.z;
    const currentCamOffsetY = camera.position.y - controlsRef.current.target.y;

    controlsRef.current.target.set(targetX, -0.3, 0);
    camera.position.set(targetX, -0.3 + currentCamOffsetY, currentCamOffsetZ);
    controlsRef.current.update();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: '#06080d' }}>
      {/* Barre de saut rapide */}
      <div style={{
        position: 'absolute',
        top: 20,
        left: 20,
        zIndex: 10000,
        display: 'flex',
        gap: 8,
        alignItems: 'center',
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(12px)',
        padding: '6px 12px',
        borderRadius: 10,
        border: '1px solid rgba(255, 255, 255, 0.12)'
      }}>
        <span style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginRight: 4 }}>
          Aller à :
        </span>
        <button type="button" onClick={() => jumpTo(-4500000000)} style={btnStyle}>Terre (-4.5 Ga)</button>
        <button type="button" onClick={() => jumpTo(-66000000)} style={btnStyle}>Dinosaures (-66 Ma)</button>
        <button type="button" onClick={() => jumpTo(-331)} style={btnStyle}>Antiquité</button>
        <button type="button" onClick={() => jumpTo(800)} style={btnStyle}>Moyen Âge</button>
        <button type="button" onClick={() => jumpTo(1789)} style={btnStyle}>Révolution</button>
        <button type="button" onClick={() => jumpTo(2026)} style={btnStyle}>Présent</button>
      </div>

      <button
        type="button"
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          zIndex: 10000,
          background: 'rgba(255,255,255,0.08)',
          color: '#e2e8f0',
          border: '1px solid rgba(255,255,255,0.18)',
          padding: '8px 16px',
          borderRadius: 8,
          cursor: 'pointer',
          backdropFilter: 'blur(10px)',
          fontSize: 12
        }}
      >
        ✕ Quitter le PoC 3D
      </button>

      <div style={{
        position: 'absolute',
        bottom: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10000,
        color: '#94a3b8',
        fontSize: 11,
        letterSpacing: 1,
        textTransform: 'uppercase',
        pointerEvents: 'none',
        background: 'rgba(6, 8, 13, 0.65)',
        padding: '6px 14px',
        borderRadius: 20
      }}>
        Clic gauche : Glisser le long du marbre • Molette : Zoomer • Clic droit : Pivoter
      </div>

      <Canvas
        camera={{ position: [0, 2.2, 5.0], fov: 40 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
      >
        <ambientLight intensity={0.75} />
        <directionalLight position={[6, 9, 4]} intensity={1.3} color="#ffffff" />
        <directionalLight position={[-6, 4, 2]} intensity={0.5} color="#cbd5e1" />

        <SharpMarbleMonolith />
        <EpochStrip />

        {/* Périodes étagées */}
        <UserPeriodFilm startYear={-3800000000} endYear={-2500000000} trackZ={-0.2} color="#3b82f6" title="Archéen (Première Vie)" />
        <UserPeriodFilm startYear={-250000000} endYear={-66000000} trackZ={0.15} color="#10b981" title="Ère des Dinosaures" />
        <UserPeriodFilm startYear={1368} endYear={1644} trackZ={-0.2} color="#ea580c" title="Dynastie Ming" />
        <UserPeriodFilm startYear={1337} endYear={1453} trackZ={0.15} color="#e11d48" title="Guerre de Cent Ans" />

        {/* Jalons de -4.5 Ga à 2026 */}
        <RefinedPin year={-4500000000} trackZ={-0.2} color="#ef4444" label="Formation de la Terre" dateStr="-4.5 Ga" />
        <RefinedPin year={-3800000000} trackZ={0.15} color="#06b6d4" label="Première bactérie" dateStr="-3.8 Ga" />
        <RefinedPin year={-66000000} trackZ={-0.2} color="#f59e0b" label="Extinction Dinosaures" dateStr="-66 Ma" />
        <RefinedPin year={-331} trackZ={0.15} color="#38bdf8" label="Gaugamèles" dateStr="-331 av. J.-C." />
        <RefinedPin year={800} trackZ={-0.2} color="#c084fc" label="Charlemagne" dateStr="800" />
        <RefinedPin year={1789} trackZ={0.15} color="#f87171" label="Révolution française" dateStr="1789" />
        <RefinedPin year={1969} trackZ={-0.2} color="#a3e635" label="Pas sur la Lune" dateStr="1969" />

        {/* Sol */}
        <mesh position={[0, -1.8, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[60, 60]} />
          <meshStandardMaterial color="#040609" roughness={0.5} />
        </mesh>

        {/* CONTRÔLES : Clic gauche = Déplacement (PAN), Clic droit = Rotation */}
        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.06}
          enablePan={true}
          screenSpacePanning={true}
          mouseButtons={{
            LEFT: THREE.MOUSE.PAN,      // Clic gauche : fait glisser la frise
            MIDDLE: THREE.MOUSE.DOLLY,  // Molette : zoom
            RIGHT: THREE.MOUSE.ROTATE   // Clic droit : légère rotation de l'angle
          }}
          minDistance={1.2}
          maxDistance={8.5}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2 - 0.08}
          minAzimuthAngle={-Math.PI / 4}
          maxAzimuthAngle={Math.PI / 4}
        />
      </Canvas>
    </div>
  );
}

const btnStyle = {
  background: 'rgba(255, 255, 255, 0.08)',
  color: '#e2e8f0',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  padding: '4px 10px',
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: 11
};