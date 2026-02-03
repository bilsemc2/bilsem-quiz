import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { PuzzlePiece } from '../types';
import { useSpring, animated } from '@react-spring/three';

interface PieceProps {
    piece: PuzzlePiece;
    isRevealed: boolean;
    isFilled: boolean;
    onClick: () => void;
    hovered: boolean;
    onPointerOver: () => void;
    onPointerOut: () => void;
}

const Piece: React.FC<PieceProps> = ({
    piece,
    isRevealed,
    isFilled,
    onClick,
    hovered,
    onPointerOver,
    onPointerOut
}) => {
    const meshRef = useRef<THREE.Mesh>(null);

    // Generate Shape from points
    const shape = useMemo(() => {
        const s = new THREE.Shape();
        s.moveTo(piece.points[0][0], piece.points[0][1]);
        for (let i = 1; i < piece.points.length; i++) {
            s.lineTo(piece.points[i][0], piece.points[i][1]);
        }
        s.closePath();
        return s;
    }, [piece.points]);

    // Extrude settings for depth
    const extrudeSettings = useMemo(() => ({
        steps: 1,
        depth: piece.depth,
        bevelEnabled: true,
        bevelThickness: 0.1,
        bevelSize: 0.1,
        bevelOffset: 0,
        bevelSegments: 4
    }), [piece.depth]);

    // Animation logic - #4A4A5E is visible against dark background
    const { color, positionZ, emissiveIntensity } = useSpring({
        color: isRevealed || isFilled ? piece.targetColor : '#5A5A6E',
        positionZ: isRevealed || isFilled ? 0.3 : 0,
        emissiveIntensity: isRevealed ? 0.25 : (hovered ? 0.15 : 0.05),
        config: { mass: 1, tension: 120, friction: 14 }
    });

    return (
        <animated.mesh
            ref={meshRef}
            position-z={positionZ}
            onClick={(e) => {
                e.stopPropagation();
                onClick();
            }}
            onPointerOver={(e) => {
                e.stopPropagation();
                onPointerOver();
            }}
            onPointerOut={onPointerOut}
        >
            <extrudeGeometry args={[shape, extrudeSettings]} />
            <animated.meshPhysicalMaterial
                color={color}
                emissive={color}
                emissiveIntensity={emissiveIntensity}
                roughness={0.1}
                metalness={0.6}
                clearcoat={1}
                clearcoatRoughness={0.1}
                reflectivity={1}
            />
        </animated.mesh>
    );
};

export default Piece;
