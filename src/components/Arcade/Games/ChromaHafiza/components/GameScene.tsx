import React, { useState, Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Float, ContactShadows } from '@react-three/drei';
import Piece from './Piece';
import { PuzzlePiece } from '../types';

interface GameSceneProps {
    pieces: PuzzlePiece[];
    isRevealing: boolean;
    onPieceClick: (id: string) => void;
    isGameWon: boolean;
}

const GameScene: React.FC<GameSceneProps> = ({ pieces, isRevealing, onPieceClick, isGameWon }) => {
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const [cameraDistance, setCameraDistance] = useState(12);

    // Responsive camera - move further on small screens
    useEffect(() => {
        const updateCamera = () => {
            const width = window.innerWidth;
            if (width < 640) {
                setCameraDistance(18); // Mobile - much further
            } else if (width < 1024) {
                setCameraDistance(15); // Tablet - slightly further
            } else {
                setCameraDistance(12); // Desktop
            }
        };
        updateCamera();
        window.addEventListener('resize', updateCamera);
        return () => window.removeEventListener('resize', updateCamera);
    }, []);

    return (
        <div className="w-full h-full relative">
            <Canvas
                shadows
                dpr={[1, 2]}
                gl={{
                    antialias: true,
                    powerPreference: "high-performance",
                    failIfMajorPerformanceCaveat: false
                }}
            >
                <Suspense fallback={null}>
                    <PerspectiveCamera makeDefault position={[cameraDistance, cameraDistance, cameraDistance]} fov={40} />
                    <OrbitControls
                        enablePan={false}
                        enableZoom={false}
                        minPolarAngle={Math.PI / 4}
                        maxPolarAngle={Math.PI / 2.5}
                    />

                    {/* Improved lighting without Environment HDRI */}
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[10, 20, 10]} intensity={1.2} castShadow />
                    <directionalLight position={[-10, 10, -10]} intensity={0.4} color="#8866ff" />
                    <pointLight position={[0, 10, 0]} intensity={0.6} color="#ffffff" />

                    <Float speed={isGameWon ? 5 : 1} rotationIntensity={0.2} floatIntensity={0.5}>
                        <group rotation={[-Math.PI / 2, 0, 0]}>
                            {pieces.map((piece) => (
                                <Piece
                                    key={piece.id}
                                    piece={piece}
                                    isRevealed={isRevealing}
                                    isFilled={piece.isSelected}
                                    onClick={() => onPieceClick(piece.id)}
                                    hovered={hoveredId === piece.id}
                                    onPointerOver={() => setHoveredId(piece.id)}
                                    onPointerOut={() => setHoveredId(null)}
                                />
                            ))}

                            {/* Magnetic base plate hint */}
                            <mesh position={[0, 0, -0.2]} receiveShadow>
                                <boxGeometry args={[11, 11, 0.1]} />
                                <meshStandardMaterial color="#0c0c0e" roughness={1} metalness={0} />
                            </mesh>
                        </group>
                    </Float>

                    <ContactShadows
                        position={[0, -5, 0]}
                        opacity={0.4}
                        scale={20}
                        blur={2.5}
                        far={10}
                    />
                </Suspense>
            </Canvas>
        </div>
    );
};

export default GameScene;

