
import React, { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Box, RotateCcw } from 'lucide-react';
import { CUBE_SIZE, BlockData, BASE_COLOR } from './types';
import CubeView from './components/CubeView';
import SideBar from './components/SideBar';

const generateInitialBlocks = (): BlockData[] => {
  const blocks: BlockData[] = [];
  for (let x = 0; x < CUBE_SIZE; x++) {
    for (let y = 0; y < CUBE_SIZE; y++) {
      for (let z = 0; z < CUBE_SIZE; z++) {
        const r = Math.floor((x / (CUBE_SIZE - 1)) * 200) + 55;
        const g = Math.floor((y / (CUBE_SIZE - 1)) * 200) + 55;
        const b = Math.floor((z / (CUBE_SIZE - 1)) * 200) + 55;
        const extractedColor = `rgb(${r}, ${g}, ${b})`;

        blocks.push({
          id: `${x}-${y}-${z}`,
          position: { x, y, z },
          originalColor: BASE_COLOR,
          extractedColor: extractedColor,
          isActive: true,
        });
      }
    }
  }
  return blocks;
};


function KupPuzzle() {
  const [blocks, setBlocks] = useState<BlockData[]>(generateInitialBlocks());
  const [targetIds, setTargetIds] = useState<Set<string>>(new Set());
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [showLevelComplete, setShowLevelComplete] = useState(false);
  const [completedLevel, setCompletedLevel] = useState(0);
  const [selectedCubeId, setSelectedCubeId] = useState<string | null>(null);

  // Check if a cube is on the surface (visible from outside)
  const isSurfaceCube = useCallback((x: number, y: number, z: number): boolean => {
    return x === 0 || x === CUBE_SIZE - 1 ||
      y === 0 || y === CUBE_SIZE - 1 ||
      z === 0 || z === CUBE_SIZE - 1;
  }, []);

  // Level Generation: Only pick surface cubes as targets
  const generateLevel = useCallback(() => {
    const allBlocks = generateInitialBlocks();
    // Filter to only surface cubes (accessible without destroying others)
    const surfaceIds = allBlocks
      .filter(b => isSurfaceCube(b.position.x, b.position.y, b.position.z))
      .map(b => b.id);

    const numTargets = Math.min(3 + level, surfaceIds.length);
    const shuffled = [...surfaceIds].sort(() => 0.5 - Math.random());
    setTargetIds(new Set(shuffled.slice(0, numTargets)));
    setBlocks(allBlocks);
  }, [level, isSurfaceCube]);

  useEffect(() => {
    generateLevel();
  }, [generateLevel]);

  const toggleBlock = useCallback((id: string) => {
    setBlocks(prev => {
      const block = prev.find(b => b.id === id);
      if (!block) return prev;

      const isTarget = targetIds.has(id);

      if (block.isActive) {
        // Extracting
        if (isTarget) {
          setScore(s => s + 100);
        } else {
          setScore(s => Math.max(0, s - 50));
        }
        return prev.map(b => b.id === id ? { ...b, isActive: false } : b);
      } else {
        // Restoring (Putting back accidentally removed block)
        if (isTarget) {
          setScore(s => Math.max(0, s - 100)); // Undo point gain if it was a target
        } else {
          setScore(s => s + 50); // Undo point penalty if it wasn't a target
        }
        return prev.map(b => b.id === id ? { ...b, isActive: true } : b);
      }
    });
  }, [targetIds]);


  // Check level completion
  useEffect(() => {
    const inactiveIds = new Set(blocks.filter(b => !b.isActive).map(b => b.id));
    const allTargetsHit = Array.from(targetIds).every(id => inactiveIds.has(id));
    const onlyTargetsHit = Array.from(inactiveIds).every(id => targetIds.has(id));

    if (allTargetsHit && onlyTargetsHit && targetIds.size > 0) {
      setCompletedLevel(level);
      setShowLevelComplete(true);
      setScore(s => s + 500);
    }
  }, [blocks, targetIds, level]);

  const handleReset = () => {
    setScore(0);
    setLevel(1);
    setShowLevelComplete(false);
    generateLevel();
  };

  const handleNextLevel = () => {
    setShowLevelComplete(false);
    // Reset blocks first to prevent immediate re-trigger of completion check
    setBlocks(generateInitialBlocks());
    setLevel(l => l + 1);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-900 text-white font-sans pt-16">
      <div className="flex-grow relative h-full">
        <div className="absolute top-6 left-6 z-10">
          <Link
            to="/bilsem-zeka"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4 bg-slate-800/50 px-4 py-2 rounded-full border border-slate-700"
          >
            <ChevronLeft size={16} />
            <span className="font-bold">BİLSEM Zeka</span>
          </Link>
          <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-blue-400 to-indigo-600 drop-shadow-sm">
            Küp Puzzle
          </h1>
          <div className="flex items-center gap-4 mt-2">
            <div className="bg-slate-800/80 px-3 py-1 rounded-full border border-slate-700">
              <span className="text-slate-400 text-xs font-bold uppercase mr-2">Puan</span>
              <span className="text-blue-400 font-mono font-bold text-lg">{score.toLocaleString()}</span>
            </div>
            <div className="bg-slate-800/80 px-3 py-1 rounded-full border border-slate-700">
              <span className="text-slate-400 text-xs font-bold uppercase mr-2">Seviye</span>
              <span className="text-white font-mono font-bold text-lg">{level}</span>
            </div>
          </div>

          <button
            onClick={handleReset}
            className="mt-6 flex items-center gap-2 bg-slate-800/50 hover:bg-red-500/20 hover:border-red-500/50 text-slate-400 hover:text-red-400 text-xs px-4 py-2 rounded-xl border border-slate-700 transition-all active:scale-95"
          >
            <RotateCcw size={14} /> Yeni oyun
          </button>
        </div>

        <CubeView
          blocks={blocks}
          onBlockClick={(id) => setSelectedCubeId(id === selectedCubeId ? null : id)}
          selectedCubeId={selectedCubeId}
        />

        {/* Extract button - shows when cube is selected */}
        {selectedCubeId && blocks.find(b => b.id === selectedCubeId)?.isActive && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20">
            <button
              onClick={() => {
                toggleBlock(selectedCubeId);
                setSelectedCubeId(null);
              }}
              className="px-8 py-4 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold text-lg rounded-2xl shadow-lg shadow-red-500/30 transition-all transform hover:scale-105 active:scale-95 flex items-center gap-3"
            >
              <i className="fa-solid fa-cube" />
              <span>Küpü Çıkar</span>
            </button>
          </div>
        )}

        <div className="absolute bottom-6 left-6 flex gap-3">
          <div className="bg-slate-900/60 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/5 text-[10px] text-slate-400 flex items-center gap-4">
            <span className="flex items-center gap-1.5"><i className="fa-solid fa-hand-pointer text-yellow-400"></i> Küp seç</span>
            <span className="flex items-center gap-1.5"><i className="fa-solid fa-trash text-red-400"></i> Butona bas = Çıkar</span>
          </div>
        </div>
      </div>

      <SideBar
        targetIds={targetIds}
        extractedBlocks={blocks.filter(b => !b.isActive)}
        onBlockClick={toggleBlock}
      />

      {/* Level Complete Modal */}
      {showLevelComplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={handleNextLevel}
          />

          {/* Confetti particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-3 h-3 rounded-full animate-confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  backgroundColor: ['#fbbf24', '#34d399', '#60a5fa', '#f472b6', '#a78bfa'][i % 5],
                  animationDelay: `${Math.random() * 0.5}s`,
                  animationDuration: `${2 + Math.random()}s`
                }}
              />
            ))}
          </div>

          {/* Modal Content */}
          <div className="relative bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl animate-scale-in max-w-md mx-4">
            {/* Glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500/20 via-green-500/20 to-blue-500/20 rounded-3xl blur-xl opacity-50" />

            <div className="relative">
              {/* Trophy icon */}
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg shadow-yellow-500/30 animate-bounce-slow">
                <i className="fa-solid fa-trophy text-3xl text-white" />
              </div>

              {/* Title */}
              <h2 className="text-3xl font-black text-center text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-green-400 to-blue-400 mb-2">
                Tebrikler!
              </h2>

              <p className="text-center text-slate-300 text-lg mb-6">
                Seviye <span className="font-bold text-white">{completedLevel}</span> tamamlandı!
              </p>

              {/* Bonus points */}
              <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 mb-6">
                <div className="flex items-center justify-center gap-3">
                  <i className="fa-solid fa-star text-yellow-400 animate-pulse" />
                  <span className="text-2xl font-bold text-green-400">+500</span>
                  <span className="text-green-300">Bonus Puan</span>
                  <i className="fa-solid fa-star text-yellow-400 animate-pulse" />
                </div>
              </div>

              {/* Next level button */}
              <button
                onClick={handleNextLevel}
                className="w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold text-lg rounded-2xl transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/30 flex items-center justify-center gap-3"
              >
                <span>Sonraki Seviye</span>
                <i className="fa-solid fa-arrow-right" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Animations */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes confetti {
          0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
        .animate-scale-in { animation: scale-in 0.4s ease-out; }
        .animate-confetti { animation: confetti 3s ease-out forwards; }
        .animate-bounce-slow { animation: bounce-slow 2s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default KupPuzzle;
