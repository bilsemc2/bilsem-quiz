import type { LucideIcon } from "lucide-react";

export interface GameIcon {
  component: LucideIcon;
  id: string;
  name: string;
}

export interface RoundData {
  group: GameIcon[];
  hasTarget: boolean;
  target: GameIcon;
}
