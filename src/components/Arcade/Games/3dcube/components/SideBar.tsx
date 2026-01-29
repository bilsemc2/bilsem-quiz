
import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import { BlockData, BlockGroup, CUBE_SIZE } from '../types';

// Aliases for Three elements to avoid JSX intrinsic element errors
const AmbientLight = 'ambientLight' as any;
const PointLight = 'pointLight' as any;
const Group = 'group' as any;
const Mesh = 'mesh' as any;
const BoxGeometry = 'boxGeometry' as any;
// Added PlaneGeometry alias to fix Property 'planeGeometry' does not exist error
const PlaneGeometry = 'planeGeometry' as any;
const MeshStandardMaterial = 'meshStandardMaterial' as any;

interface SideBarProps {
  targetIds: Set<string>;
  extractedBlocks: BlockData[];
  onBlockClick: (id: string) => void;
}

const SideBar: React.FC<SideBarProps> = ({ targetIds, extractedBlocks, onBlockClick }) => {
  return (
    <div className="w-96 h-full bg-slate-800/90 backdrop-blur-2xl border-l border-white/5 flex flex-col p-6 shadow-2xl z-20">
      {/* Target Mission Section */}
      <div className="mb-8">
        <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
          Hedef Küpler
        </h2>
        <div className="h-56 bg-slate-900/60 rounded-3xl border border-white/5 relative overflow-hidden group/target">
          <TargetPreview targetIds={targetIds} />
          <div className="absolute top-3 right-3 bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border border-red-500/20 pointer-events-none">
            Vurgulananları çıkar
          </div>
          <div className="absolute bottom-3 left-3 pointer-events-none">
            <span className="text-[8px] text-yellow-500 uppercase font-bold bg-slate-900/80 px-2 py-1 rounded border border-yellow-500/20 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-yellow-500 rounded-sm"></span> BAŞLANGIÇ (0,0)
            </span>
          </div>
          <div className="absolute bottom-3 right-3 opacity-0 group-hover/target:opacity-100 transition-opacity pointer-events-none">
            <span className="text-[8px] text-slate-500 uppercase font-bold bg-slate-900/80 px-2 py-1 rounded">
              <i className="fa-solid fa-arrows-rotate mr-1"></i> Döndürmek için sürükle
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
          <i className="fa-solid fa-cube text-blue-400"></i>
          Envanter
        </h2>
        <span className="text-[10px] font-mono text-slate-500">{extractedBlocks.length} Küp</span>
      </div>

      <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
        {extractedBlocks.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center px-4 py-10 opacity-40">
            <i className="fa-solid fa-box-open text-3xl mb-4"></i>
            <p className="text-[11px] font-medium leading-relaxed">Hedef küpleri çıkararak buraya ekleyin.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {extractedBlocks.map((block) => (
              <InventoryBlock
                key={block.id}
                block={block}
                isTarget={targetIds.has(block.id)}
                onClick={() => onBlockClick(block.id)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 pt-6 border-t border-white/5">
        <div className="bg-blue-500/5 p-4 rounded-2xl border border-blue-500/10">
          <div className="flex items-start gap-3">
            <i className="fa-solid fa-circle-nodes text-blue-400 mt-0.5"></i>
            <p className="text-[10px] text-blue-200/60 leading-relaxed">
              Görünümünüzü  ana küple hizalamak için  <span className="text-yellow-500 font-bold">BAŞLAT</span> işaretini kullanın. </p>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
      `}</style>
    </div>
  );
};

// Orientation Guide Helper for both views
const TargetOrientationGuide = () => {
  const centerOffset = (CUBE_SIZE - 1) / 2;
  return (
    <Group position={[0, -centerOffset - 0.55, 0]}>
      {/* Base Grid - Fixed lowercase tags to use aliases */}
      <Mesh rotation={[-Math.PI / 2, 0, 0]}>
        <PlaneGeometry args={[CUBE_SIZE + 0.5, CUBE_SIZE + 0.5]} />
        <MeshStandardMaterial color="#1e293b" transparent opacity={0.6} />
      </Mesh>
      {/* Origin Marker (Starting Point) */}
      <Mesh position={[-centerOffset, 0.1, -centerOffset]}>
        <BoxGeometry args={[0.3, 0.1, 0.3]} />
        <MeshStandardMaterial color="#facc15" emissive="#facc15" emissiveIntensity={1.5} />
      </Mesh>
      <Text
        position={[-centerOffset, 0.2, -centerOffset - 0.5]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.2}
        color="#facc15"
      >
        Başlat
      </Text>
    </Group>
  );
};

// Preview of which blocks to remove
const TargetPreview: React.FC<{ targetIds: Set<string> }> = ({ targetIds }) => {
  const centerOffset = (CUBE_SIZE - 1) / 2;
  const blocks = [];
  for (let x = 0; x < CUBE_SIZE; x++) {
    for (let y = 0; y < CUBE_SIZE; y++) {
      for (let z = 0; z < CUBE_SIZE; z++) {
        const id = `${x}-${y}-${z}`;
        blocks.push({ id, pos: [x - centerOffset, y - centerOffset, z - centerOffset] as [number, number, number] });
      }
    }
  }

  return (
    <Canvas camera={{ position: [4, 3, 4], fov: 35 }}>
      <AmbientLight intensity={0.5} />
      <PointLight position={[10, 10, 10]} intensity={1} />
      <Group>
        <TargetOrientationGuide />
        {blocks.map(b => (
          <Mesh key={b.id} position={b.pos}>
            <BoxGeometry args={[0.8, 0.8, 0.8]} />
            <MeshStandardMaterial
              color={targetIds.has(b.id) ? "#ef4444" : "#ffffff"}
              transparent
              opacity={targetIds.has(b.id) ? 0.8 : 0.05}
              emissive={targetIds.has(b.id) ? "#ef4444" : "#000"}
              emissiveIntensity={targetIds.has(b.id) ? 0.5 : 0}
            />
          </Mesh>
        ))}
      </Group>
      <OrbitControls
        enableDamping
        dampingFactor={0.1}
        autoRotate={false}
        enableZoom={false}
      />
    </Canvas>
  );
};

// Single cube in the inventory
interface InventoryBlockProps {
  block: BlockData;
  isTarget: boolean;
  onClick: () => void;
}

const InventoryBlock: React.FC<InventoryBlockProps> = ({ block, isTarget, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`
        group relative aspect-square bg-slate-900/40 rounded-2xl border 
        ${isTarget ? 'border-green-500/50 bg-green-500/10' : 'border-white/5'}
        hover:border-blue-500/50 hover:bg-slate-700/30 
        transition-all cursor-pointer active:scale-95 overflow-hidden shadow-inner
      `}
    >
      <Canvas camera={{ position: [2.5, 2, 2.5], fov: 40 }} gl={{ alpha: true }}>
        <AmbientLight intensity={1.5} />
        <PointLight position={[5, 5, 5]} intensity={2} />
        <Group rotation={[Math.PI / 6, -Math.PI / 4, 0]}>
          <Mesh>
            <BoxGeometry args={[1, 1, 1]} />
            <MeshStandardMaterial
              color={block.extractedColor}
              metalness={0.1}
              roughness={0.2}
            />
          </Mesh>
        </Group>
      </Canvas>

      {/* Coordinate label */}
      <div className="absolute bottom-1 left-1 right-1 text-center">
        <span className={`text-[8px] font-mono font-bold ${isTarget ? 'text-green-400' : 'text-slate-500'}`}>
          ({block.position.x},{block.position.y},{block.position.z})
        </span>
      </div>

      {/* Target indicator */}
      {isTarget && (
        <div className="absolute top-1 right-1">
          <span className="w-2 h-2 rounded-full bg-green-500 block shadow-sm shadow-green-500/50"></span>
        </div>
      )}

      {/* Restore hint on hover */}
      <div className="absolute inset-0 flex items-center justify-center bg-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity">
        <i className="fa-solid fa-rotate-left text-white text-sm"></i>
      </div>
    </div>
  );
};

export default SideBar;
