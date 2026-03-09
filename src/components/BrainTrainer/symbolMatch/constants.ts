import { GAME_COLORS } from "../shared/gameColors.ts";

export const GAME_ID = "sekil-hafizasi";
export const GAME_TITLE = "Şekil Hafızası";
export const GAME_DESCRIPTION =
  "Şekillerin renklerini kısa sürede ezberle ve sorulan sorulara doğru cevap ver. Görsel çalışma belleğini test et!";
export const TUZO_TEXT = "TUZÖ 4.2.1 Görsel Çalışma Belleği";
export const MAX_LEVEL = 20;
export const INITIAL_LIVES = 5;
export const TIME_LIMIT = 180;
export const FEEDBACK_DURATION_MS = 2000;
export const ROUND_TRANSITION_MS = 1500;

export const SHAPE_DEFINITIONS = [
  { key: "star", name: "Yıldız", fill: true },
  { key: "circle", name: "Daire", fill: true },
  { key: "square", name: "Kare", fill: true },
  { key: "triangle", name: "Üçgen", fill: true },
  { key: "hexagon", name: "Altıgen", fill: true },
  { key: "diamond", name: "Elmas", fill: true },
  { key: "pentagon", name: "Beşgen", fill: true },
  { key: "octagon", name: "Sekizgen", fill: true },
  { key: "heart", name: "Kalp", fill: true },
] as const;

export const COLOR_OPTIONS = [
  { hex: GAME_COLORS.incorrect, name: "Kırmızı" },
  { hex: GAME_COLORS.blue, name: "Mavi" },
  { hex: GAME_COLORS.emerald, name: "Yeşil" },
  { hex: GAME_COLORS.orange, name: "Sarı" },
  { hex: GAME_COLORS.purple, name: "Mor" },
  { hex: GAME_COLORS.pink, name: "Pembe" },
  { hex: GAME_COLORS.orange, name: "Turuncu" },
  { hex: GAME_COLORS.blue, name: "Turkuaz" },
  { hex: "#14b8a6", name: "Deniz Yeşili" },
  { hex: GAME_COLORS.purple, name: "Lila" },
  { hex: "#e11d48", name: "Bordo" },
  { hex: "#84cc16", name: "Lime" },
  { hex: "#0ea5e9", name: "Gök Mavi" },
  { hex: "#d946ef", name: "Fuşya" },
] as const;
