
import React, { Suspense, useState, useRef, useMemo } from 'react';
import { Canvas, ThreeEvent, useLoader } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Environment, PerspectiveCamera, Text, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { BlockData, CUBE_SIZE } from '../types';

// Aliases for Three elements to avoid JSX intrinsic element errors
const Mesh = 'mesh' as any;
const BoxGeometry = 'boxGeometry' as any;
// Added PlaneGeometry alias to fix Property 'planeGeometry' does not exist error
const PlaneGeometry = 'planeGeometry' as any;
const MeshStandardMaterial = 'meshStandardMaterial' as any;
const LineSegments = 'lineSegments' as any;
const EdgesGeometry = 'edgesGeometry' as any;
const LineBasicMaterial = 'lineBasicMaterial' as any;
const Group = 'group' as any;
const AmbientLight = 'ambientLight' as any;
const SpotLight = 'spotLight' as any;
const PointLight = 'pointLight' as any;

interface BlockProps {
  data: BlockData;
  onClick: (id: string) => void;
  isSelected: boolean;
}

// Check if cube is on the surface (at least one coordinate is 0 or CUBE_SIZE-1)
const isSurfaceCube = (x: number, y: number, z: number): boolean => {
  return x === 0 || x === CUBE_SIZE - 1 ||
    y === 0 || y === CUBE_SIZE - 1 ||
    z === 0 || z === CUBE_SIZE - 1;
};

// Generate neon colors like the reference image
const getNeonColor = (x: number, y: number, z: number): string => {
  const colors = [
    '#00ffff', // cyan
    '#00ff88', // mint green
    '#88ff00', // lime
    '#ffff00', // yellow
    '#ff8800', // orange
    '#ff0088', // hot pink
    '#ff00ff', // magenta
    '#8800ff', // purple
    '#0088ff', // sky blue
  ];
  // Use position to deterministically assign colors
  const index = (x * 7 + y * 13 + z * 23) % colors.length;
  return colors[index];
};

const Block: React.FC<BlockProps> = ({
  data,
  onClick,
  isSelected
}) => {
  const centerOffset = (CUBE_SIZE - 1) / 2;
  const position: [number, number, number] = [
    data.position.x - centerOffset,
    data.position.y - centerOffset,
    data.position.z - centerOffset
  ];

  const neonColor = getNeonColor(data.position.x, data.position.y, data.position.z);

  // Color based on selection state only
  const displayColor = isSelected ? "#fbbf24" : neonColor;
  const glowIntensity = isSelected ? 1.2 : 0.4;

  // Load logo texture
  const logoTexture = useTexture('/images/logo_tree.png');

  // All cubes are translucent neon glass
  return (
    <Group position={position} scale={isSelected ? 1.15 : 1}>
      {/* Outer transparent shell - NOT clickable */}
      <Mesh raycast={() => null}>
        <BoxGeometry args={[0.92, 0.92, 0.92]} />
        <MeshStandardMaterial
          color={displayColor}
          transparent
          opacity={isSelected ? 0.9 : 0.5}
          metalness={0.1}
          roughness={0.05}
          emissive={displayColor}
          emissiveIntensity={glowIntensity}
        />
        {/* Cube edges */}
        <LineSegments>
          <EdgesGeometry args={[new THREE.BoxGeometry(0.93, 0.93, 0.93)]} />
          <LineBasicMaterial
            color={isSelected ? "#fbbf24" : neonColor}
            linewidth={isSelected ? 4 : 2}
            transparent
            opacity={isSelected ? 1 : 0.8}
          />
        </LineSegments>
      </Mesh>

      {/* Inner solid cube - CLICKABLE - captures all clicks reliably */}
      <Mesh onClick={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); onClick(data.id); }}>
        <BoxGeometry args={[0.5, 0.5, 0.5]} />
        <MeshStandardMaterial
          color={isSelected ? "#fbbf24" : "#ffffff"}
          transparent
          opacity={isSelected ? 1 : 0.3}
          emissive={isSelected ? "#fbbf24" : "#ffffff"}
          emissiveIntensity={isSelected ? 0.8 : 0.2}
        />
      </Mesh>

      {/* Decorative inner cube - creates nested cube effect */}
      <Mesh raycast={() => null}>
        <BoxGeometry args={[0.35, 0.35, 0.35]} />
        <MeshStandardMaterial
          color={neonColor}
          transparent
          opacity={0.8}
          emissive={neonColor}
          emissiveIntensity={0.6}
        />
        <LineSegments>
          <EdgesGeometry args={[new THREE.BoxGeometry(0.36, 0.36, 0.36)]} />
          <LineBasicMaterial color={neonColor} linewidth={2} transparent opacity={0.9} />
        </LineSegments>
      </Mesh>

      {/* Logos on 4 cube faces (no mouse events) */}
      {/* Front face */}
      <Mesh position={[0, 0, 0.47]} raycast={() => null}>
        <PlaneGeometry args={[0.4, 0.4]} />
        <MeshStandardMaterial map={logoTexture} transparent opacity={isSelected ? 0.3 : 0.9} side={THREE.DoubleSide} />
      </Mesh>
      {/* Back face */}
      <Mesh position={[0, 0, -0.47]} rotation={[0, Math.PI, 0]} raycast={() => null}>
        <PlaneGeometry args={[0.4, 0.4]} />
        <MeshStandardMaterial map={logoTexture} transparent opacity={isSelected ? 0.3 : 0.9} side={THREE.DoubleSide} />
      </Mesh>
      {/* Right face */}
      <Mesh position={[0.47, 0, 0]} rotation={[0, Math.PI / 2, 0]} raycast={() => null}>
        <PlaneGeometry args={[0.4, 0.4]} />
        <MeshStandardMaterial map={logoTexture} transparent opacity={isSelected ? 0.3 : 0.9} side={THREE.DoubleSide} />
      </Mesh>
      {/* Left face */}
      <Mesh position={[-0.47, 0, 0]} rotation={[0, -Math.PI / 2, 0]} raycast={() => null}>
        <PlaneGeometry args={[0.4, 0.4]} />
        <MeshStandardMaterial map={logoTexture} transparent opacity={isSelected ? 0.3 : 0.9} side={THREE.DoubleSide} />
      </Mesh>
    </Group>
  );
};

// Orientation Guide Helper
const OrientationGuide = () => {
  const centerOffset = (CUBE_SIZE - 1) / 2;
  return (
    <Group position={[0, -centerOffset - 0.55, 0]}>
      {/* Base Grid - Fixed lowercase tags to use aliases */}
      <Mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <PlaneGeometry args={[CUBE_SIZE + 0.5, CUBE_SIZE + 0.5]} />
        <MeshStandardMaterial color="#1e293b" transparent opacity={0.5} />
      </Mesh>
      {/* Origin Marker (Starting Point) */}
      <Mesh position={[-centerOffset, 0.1, -centerOffset]}>
        <BoxGeometry args={[0.3, 0.1, 0.3]} />
        <MeshStandardMaterial color="#facc15" emissive="#facc15" emissiveIntensity={2} />
      </Mesh>
      {/* Label for Front/Origin */}
      <Text
        position={[-centerOffset, 0.2, -centerOffset - 0.5]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.2}
        color="#facc15"
      >
        Başlat (0,0)
      </Text>
    </Group>
  );
};

interface CubeViewProps {
  blocks: BlockData[];
  onBlockClick: (id: string) => void;
  selectedCubeId: string | null;
}

const CubeView: React.FC<CubeViewProps> = ({ blocks, onBlockClick, selectedCubeId }) => {
  const activeBlocks = useMemo(() => blocks.filter(b => b.isActive), [blocks]);

  return (
    <div className="h-full w-full">
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[7, 7, 7]} fov={40} />
        <AmbientLight intensity={0.5} />
        <SpotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        <PointLight position={[-10, -10, -10]} intensity={0.5} />

        <Suspense fallback={null}>
          {/* Scale up the entire cube group for touch-friendly interaction */}
          <Group scale={1.3}>
            <OrientationGuide />

            {activeBlocks.map(block => (
              <Block
                key={block.id}
                data={block}
                onClick={onBlockClick}
                isSelected={block.id === selectedCubeId}
              />
            ))}
          </Group>

          <Environment preset="city" />
          <ContactShadows position={[0, -3.2, 0]} opacity={0.3} scale={12} blur={2.5} far={5} />
        </Suspense>

        <OrbitControls enableDamping dampingFactor={0.05} rotateSpeed={0.5} minDistance={5} maxDistance={15} />
      </Canvas>
    </div>
  );
};

export default CubeView;
