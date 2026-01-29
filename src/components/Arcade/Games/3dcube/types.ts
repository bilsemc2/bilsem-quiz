
export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface BlockData {
  id: string;
  position: Vector3;
  originalColor: string;
  extractedColor: string;
  isActive: boolean; // True if in the 3D cube
}

export interface BlockGroup {
  id: string;
  blocks: BlockData[];
}

export const CUBE_SIZE = 3;
export const BASE_COLOR = "#3b82f6"; // Tailwind blue-500
