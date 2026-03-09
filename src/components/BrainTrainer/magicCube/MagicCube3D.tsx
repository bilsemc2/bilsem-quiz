import { motion } from "framer-motion";

import type { FaceContent, FaceName, Rotation3D } from "./types";

interface MagicCube3DProps {
  data: Record<FaceName, FaceContent>;
  rotation: Rotation3D;
  size?: number;
}

const MagicCube3D = ({ data, rotation, size = 100 }: MagicCube3DProps) => {
  if (!data.FRONT) {
    return null;
  }

  const half = size / 2;
  const createFaceStyle = (transform: string, color: string) => ({
    position: "absolute" as const,
    width: size,
    height: size,
    transform,
    backgroundColor: color,
    border: "2px solid rgba(255,255,255,0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backfaceVisibility: "hidden" as const,
    borderRadius: "12px",
    boxShadow:
      "inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.2)",
  });

  return (
    <div style={{ perspective: "800px", width: size, height: size }}>
      <motion.div
        animate={{ rotateX: rotation.x, rotateY: rotation.y }}
        transition={{ type: "spring", stiffness: 60, damping: 15 }}
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          transformStyle: "preserve-3d",
        }}
      >
        <div style={createFaceStyle(`translateZ(${half}px)`, data.FRONT.color)}>
          <data.FRONT.icon size={size * 0.5} color="white" />
        </div>
        <div
          style={createFaceStyle(
            `translateZ(-${half}px) rotateY(180deg)`,
            data.BACK.color,
          )}
        >
          <data.BACK.icon size={size * 0.5} color="white" />
        </div>
        <div
          style={createFaceStyle(
            `translateX(-${half}px) rotateY(-90deg)`,
            data.LEFT.color,
          )}
        >
          <data.LEFT.icon size={size * 0.5} color="white" />
        </div>
        <div
          style={createFaceStyle(
            `translateX(${half}px) rotateY(90deg)`,
            data.RIGHT.color,
          )}
        >
          <data.RIGHT.icon size={size * 0.5} color="white" />
        </div>
        <div
          style={createFaceStyle(
            `translateY(-${half}px) rotateX(90deg)`,
            data.TOP.color,
          )}
        >
          <data.TOP.icon size={size * 0.5} color="white" />
        </div>
        <div
          style={createFaceStyle(
            `translateY(${half}px) rotateX(-90deg)`,
            data.BOTTOM.color,
          )}
        >
          <data.BOTTOM.icon size={size * 0.5} color="white" />
        </div>
      </motion.div>
    </div>
  );
};

export default MagicCube3D;
