with open("src/components/BrainTrainer/LazerHafizaGame.tsx", "r") as f:
    text = f.read()

text = text.replace('import { Crosshair, Eye, Sparkles, Brain, Star, Zap } from "lucide-react";', 'import { Crosshair, Eye, Brain, Star, Zap } from "lucide-react";')
text = text.replace('!!feedbackState', 'feedbackState')

text = text.replace('''  const getCellCenter = (row: number, col: number) => {
    const cellSize = 100 / config.gridSize;
    return { x: col * cellSize + cellSize / 2, y: row * cellSize + cellSize / 2 };
  };

  const previewSvgPath = useMemo(() => {
    if (localPhase !== "preview" || visiblePathIndex < 1) return "";
    return path.slice(0, visiblePathIndex + 1).map((coord, i) => {
      const { x, y } = getCellCenter(coord.row, coord.col);
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    }).join(" ");
  }, [path, visiblePathIndex, localPhase, config.gridSize]);

  const userSvgPath = useMemo(() => {
    if (userPath.length < 2) return "";
    return userPath.map((coord, i) => {
      const { x, y } = getCellCenter(coord.row, coord.col);
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    }).join(" ");
  }, [userPath, config.gridSize]);''', '''  const previewSvgPath = useMemo(() => {
    if (localPhase !== "preview" || visiblePathIndex < 1) return "";
    const cellSize = 100 / config.gridSize;
    return path.slice(0, visiblePathIndex + 1).map((coord, i) => {
      const x = coord.col * cellSize + cellSize / 2;
      const y = coord.row * cellSize + cellSize / 2;
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    }).join(" ");
  }, [path, visiblePathIndex, localPhase, config.gridSize]);

  const userSvgPath = useMemo(() => {
    if (userPath.length < 2) return "";
    const cellSize = 100 / config.gridSize;
    return userPath.map((coord, i) => {
      const x = coord.col * cellSize + cellSize / 2;
      const y = coord.row * cellSize + cellSize / 2;
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    }).join(" ");
  }, [userPath, config.gridSize]);''')

with open("src/components/BrainTrainer/LazerHafizaGame.tsx", "w") as f:
    f.write(text)
