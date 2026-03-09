import React from "react";
import { motion } from "framer-motion";

import { PREVIEW_CUBE_SIZE } from "./constants";
import { createFacePoseMap, findFacePlacement } from "./logic";
import type { CubeNet, FaceContent, FaceName } from "./types";

interface MagicCubeNetPreviewProps {
  facesData: Record<FaceName, FaceContent>;
  isFolding: boolean;
  net: CubeNet;
}

const facePoseMap = createFacePoseMap(PREVIEW_CUBE_SIZE);

const MagicCubeNetPreview = ({
  facesData,
  isFolding,
  net,
}: MagicCubeNetPreviewProps) => {
  return (
    <div
      className="relative flex h-[260px] w-[260px] items-center justify-center"
      style={{ perspective: "1200px" }}
    >
      <motion.div
        animate={isFolding ? { rotateX: -20, rotateY: 35 } : { rotateX: 0, rotateY: 0 }}
        transition={{ duration: 2 }}
        style={{
          position: "relative",
          width: `${PREVIEW_CUBE_SIZE}px`,
          height: `${PREVIEW_CUBE_SIZE}px`,
          transformStyle: "preserve-3d",
        }}
      >
        {net.grid.map((row, rowIndex) =>
          row.map((face, colIndex) => {
            if (!face || !facesData[face]) {
              return null;
            }

            const placement = findFacePlacement(net.grid, face);
            if (!placement) {
              return null;
            }

            const pose = facePoseMap[face];

            return (
              <motion.div
                key={`${face}-${rowIndex}-${colIndex}`}
                animate={
                  isFolding
                    ? {
                        x: pose.tx,
                        y: pose.ty,
                        z: pose.tz,
                        rotateX: pose.rx,
                        rotateY: pose.ry,
                        rotateZ: pose.rz,
                      }
                    : {
                        x: placement.relativeCol * PREVIEW_CUBE_SIZE,
                        y: placement.relativeRow * PREVIEW_CUBE_SIZE,
                        z: 0,
                        rotateX: 0,
                        rotateY: 0,
                        rotateZ: 0,
                      }
                }
                transition={{ duration: 1.5 }}
                className="absolute inset-0 flex items-center justify-center border-2 border-black/10 shadow-neo-sm"
                style={{
                  backgroundColor: facesData[face].color,
                  backfaceVisibility: "hidden",
                  transformStyle: "preserve-3d",
                }}
              >
                {React.createElement(facesData[face].icon, {
                  size: 30,
                  color: "white",
                  strokeWidth: 3,
                  className: "filter drop-shadow-[2px_2px_0_rgba(0,0,0,0.5)]",
                })}
              </motion.div>
            );
          }),
        )}
      </motion.div>
    </div>
  );
};

export default MagicCubeNetPreview;
