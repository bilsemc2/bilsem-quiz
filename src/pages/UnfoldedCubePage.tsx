import React, { useState, useEffect, useCallback, MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Square, Triangle, Circle, Star, Heart, RotateCcw, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import RequireAuth from '@/components/RequireAuth';
import { useXPCheck } from '../hooks/useXPCheck';
import XPWarning from '../components/XPWarning';
import { useUser } from '../hooks/useUser';
import { cn } from "@/lib/utils"; // shadcn/ui'nin classnames yardımcı fonksiyonu (opsiyonel)

// --- Sabitler ---
const FACE_NAMES = {
  FRONT: 'Ön', BACK: 'Arka', LEFT: 'Sol', RIGHT: 'Sağ', TOP: 'Üst', BOTTOM: 'Alt'
} as const; // Yüz isimleri için sabitler

type FaceName = typeof FACE_NAMES[keyof typeof FACE_NAMES];

const shapes = [
  { id: 'square', icon: Square, name: 'Kare' },
  { id: 'triangle', icon: Triangle, name: 'Üçgen' },
  { id: 'circle', icon: Circle, name: 'Daire' },
  { id: 'star', icon: Star, name: 'Yıldız' },
  { id: 'heart', icon: Heart, name: 'Kalp' }
];

const colors = [
  { id: 'blue', class: 'text-blue-500', bgClass: 'bg-blue-500' },
  { id: 'red', class: 'text-red-500', bgClass: 'bg-red-500' },
  { id: 'green', class: 'text-green-500', bgClass: 'bg-green-500' },
  { id: 'purple', class: 'text-purple-500', bgClass: 'bg-purple-500' },
  { id: 'orange', class: 'text-orange-500', bgClass: 'bg-orange-500' },
];

const unfoldedLayouts = [
  {
    name: 'T Şekli', // Klasik T
    grid: [
      [null, FACE_NAMES.TOP, null],
      [FACE_NAMES.LEFT, FACE_NAMES.FRONT, FACE_NAMES.RIGHT],
      [null, FACE_NAMES.BOTTOM, null],
      [null, FACE_NAMES.BACK, null]
    ]
  },
  {
    name: '1x4 Sıra', // Uzun sıra
    grid: [
      [null, FACE_NAMES.TOP, null, null],
      [FACE_NAMES.LEFT, FACE_NAMES.FRONT, FACE_NAMES.RIGHT, FACE_NAMES.BACK],
      [null, FACE_NAMES.BOTTOM, null, null]
    ]
  },
    {
    name: 'Basamak Şekli', // Farklı bir yapı
    grid: [
      [FACE_NAMES.LEFT, FACE_NAMES.TOP, null],
      [null, FACE_NAMES.FRONT, FACE_NAMES.RIGHT],
      [null, FACE_NAMES.BOTTOM, null],
      [null, FACE_NAMES.BACK, null]
    ]
  },
  // İsteğe bağlı olarak daha fazla layout eklenebilir
];

// Yüz Verisi Tipi
type FaceData = {
  shape: typeof shapes[0];
  color: typeof colors[0];
} | null;

type FacesState = Record<FaceName, FaceData>;

const initialFacesState: FacesState = {
  [FACE_NAMES.FRONT]: null, [FACE_NAMES.BACK]: null, [FACE_NAMES.LEFT]: null,
  [FACE_NAMES.RIGHT]: null, [FACE_NAMES.TOP]: null, [FACE_NAMES.BOTTOM]: null,
};

// --- Küp Yüzü Bileşeni ---
interface CubeFaceProps {
  faceName: FaceName;
  data: FaceData;
  onClick: () => void;
  isClickable: boolean;
  // Katlanma animasyonu için ek proplar (opsiyonel)
  // style?: React.CSSProperties;
}

const CubeFace: React.FC<CubeFaceProps> = React.memo(({ faceName, data, onClick, isClickable }) => (
  <div
    className={cn(
      "w-full h-full border-2 border-gray-300 rounded-md", // Boyutlar parent tarafından belirlenecek
      "flex items-center justify-center bg-white",
      "transition-colors duration-200",
      isClickable ? 'cursor-pointer hover:bg-gray-50' : 'cursor-default'
    )}
    onClick={isClickable ? onClick : undefined}
    aria-label={data ? `${faceName} yüzü - ${data.shape.name} (${data.color.id})` : `${faceName} yüzü - Boş`}
  >
    {data ? (
      <data.shape.icon
        size={40} // Biraz daha küçük ikon
        className={data.color.class}
        aria-hidden="true"
      />
    ) : (
      <span className="text-sm font-medium text-gray-400">{faceName}</span>
    )}
  </div>
));
CubeFace.displayName = 'CubeFace';

// --- Ana Bileşen ---
const UnfoldedCubePage = () => {
  // --- Hooklar ---
  const navigate = useNavigate();
  const { currentUser, loading: userLoading } = useUser();
  const { hasEnoughXP, userXP, requiredXP, loading: xpLoading } = useXPCheck(false);

  // --- State'ler ---
  const [selectedShape, setSelectedShape] = useState(shapes[0]);
  const [selectedColor, setSelectedColor] = useState(colors[0]);
  const [selectedLayout, setSelectedLayout] = useState(unfoldedLayouts[0]);
  const [faces, setFaces] = useState<FacesState>(initialFacesState);
  const [isClosed, setIsClosed] = useState(false); // Küp kapalı mı?
  const [isDragging, setIsDragging] = useState(false);
  const [startPosition, setStartPosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState({ x: -20, y: 30 }); // Başlangıç açısı

  // --- Memoized Değerler ---
  const allFacesFilled = useMemo(() => Object.values(faces).every(face => face !== null), [faces]);

  // --- Efektler ---
  // Otomatik Kapanma
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (allFacesFilled) {
      // Kısa bir gecikme sonrası kapanma state'ini ayarla
      timer = setTimeout(() => setIsClosed(true), 600);
    }
    return () => clearTimeout(timer); // Cleanup
  }, [allFacesFilled]);

  // Kullanıcı Giriş Kontrolü
  useEffect(() => {
    if (!userLoading && !currentUser) {
      toast.error("Bu sayfayı görmek için giriş yapmalısınız.");
      navigate('/login', { replace: true });
    }
  }, [currentUser, userLoading, navigate]);


  // --- Olay Yöneticileri ---
  const handleAssignShape = useCallback((faceName: FaceName) => {
    // Sadece açıkken ve o yüz boşsa şekil ata
    if (!isClosed && faces[faceName] === null) {
      setFaces(prev => ({
        ...prev,
        [faceName]: {
          shape: selectedShape,
          color: selectedColor
        }
      }));
    }
  }, [isClosed, faces, selectedShape, selectedColor]); // Bağımlılıklar eklendi

  const handleResetGame = useCallback(() => {
    setSelectedShape(shapes[0]);
    setSelectedColor(colors[0]);
    // Layout'u resetlemeyebiliriz, kullanıcı seçimi kalsın isteyebilir. Şimdilik resetliyoruz.
    setSelectedLayout(unfoldedLayouts[0]);
    setFaces(initialFacesState);
    setIsClosed(false);
    setRotation({ x: -20, y: 30 }); // Başlangıç rotasyonu
  }, []);

  // Döndürme Olayları
  const handleDragStart = useCallback((e: ReactMouseEvent<HTMLDivElement> | ReactTouchEvent<HTMLDivElement>) => {
    if (!isClosed) return;
    e.preventDefault(); // Dokunmatik cihazlarda kaydırmayı engelle
    setIsDragging(true);
    const x = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const y = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setStartPosition({ x, y });
  }, [isClosed]);

  const handleDragMove = useCallback((e: ReactMouseEvent<HTMLDivElement> | ReactTouchEvent<HTMLDivElement>) => {
    if (!isDragging || !isClosed) return;
    e.preventDefault();

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const deltaX = clientX - startPosition.x;
    const deltaY = clientY - startPosition.y;

    // Döndürme hassasiyetini ayarla (0.4)
    setRotation(prev => ({
      x: Math.max(-90, Math.min(90, prev.x - deltaY * 0.4)), // X eksenini sınırla
      y: prev.y + deltaX * 0.4
    }));
    setStartPosition({ x: clientX, y: clientY });
  }, [isDragging, isClosed, startPosition, rotation.x, rotation.y]); // rotation'ı bağımlılığa eklemek gerekli değil gibi duruyor, prev kullanılıyor

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // --- Render Fonksiyonları ---

  const renderUnfoldedCube = () => (
    <div className="grid gap-1 w-fit mx-auto border border-dashed border-gray-300 p-2 rounded-lg">
      {selectedLayout.grid.map((row, i) => (
        <div key={`row-${i}`} className="flex gap-1">
          {row.map((faceName, j) => (
            <div key={`cell-${i}-${j}`} className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32"> {/* Responsive Boyut */}
              {faceName ? (
                <CubeFace
                  faceName={faceName}
                  data={faces[faceName]}
                  onClick={() => handleAssignShape(faceName)}
                  isClickable={!isClosed && faces[faceName] === null}
                />
              ) : (
                <div className="w-full h-full"></div> // Boş hücreler
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );

  const renderClosedCube = () => {
      const cubeSize = 128; // w-32 = 8rem = 128px (varsayılan)
      const halfSize = cubeSize / 2;
      // Not: Katlanma animasyonu için bu transform değerleri state'e bağlı ve zamanla değişmeli.
      // Şimdilik sadece kapalı hali gösteriliyor.
      const faceStyles: Record<FaceName, React.CSSProperties> = {
          [FACE_NAMES.FRONT]: { transform: `translateZ(${halfSize}px)` },
          [FACE_NAMES.BACK]:  { transform: `translateZ(-${halfSize}px) rotateY(180deg)` },
          [FACE_NAMES.RIGHT]: { transform: `translateX(${halfSize}px) rotateY(90deg)` },
          [FACE_NAMES.LEFT]:  { transform: `translateX(-${halfSize}px) rotateY(-90deg)` },
          [FACE_NAMES.TOP]:   { transform: `translateY(-${halfSize}px) rotateX(90deg)` },
          [FACE_NAMES.BOTTOM]:{ transform: `translateY(${halfSize}px) rotateX(-90deg)` },
      };

      return (
          <div
              className="relative"
              style={{
                  width: `${cubeSize}px`,
                  height: `${cubeSize}px`,
                  transformStyle: 'preserve-3d',
                  transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
                  transition: isDragging ? 'none' : 'transform 0.3s ease-out' // Yumuşak geçiş
              }}
          >
              {(Object.keys(FACE_NAMES) as Array<keyof typeof FACE_NAMES>).map((key) => {
                  const faceName = FACE_NAMES[key];
                  return (
                      <div key={faceName} className="absolute w-full h-full" style={faceStyles[faceName]}>
                          {/* CubeFace'e tıklama olayını kapalıyken de göndermeyelim */}
                          <CubeFace faceName={faceName} data={faces[faceName]} onClick={() => {}} isClickable={false} />
                      </div>
                  );
              })}
          </div>
      );
  };


  // --- Yükleme ve Erişim Kontrolleri ---
  if (userLoading || xpLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <Loader2 className="w-12 h-12 text-white animate-spin" />
      </div>
    );
  }

  if (!currentUser) return null; // Giriş kontrolü useEffect'de yapılıyor

  if (!hasEnoughXP) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <XPWarning requiredXP={requiredXP} currentXP={userXP} title="Küp Açılımı Oyunu İçin Gereken XP" />
      </div>
    );
  }

  // --- Ana JSX ---
  return (
    <RequireAuth>
      {/* Arka plan ve genel container */}
      <div className="flex flex-col items-center justify-start min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 pt-10">
        <Card className="p-4 sm:p-6 w-full max-w-5xl shadow-xl">
          {/* Başlık ve Kontroller */}
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Küp Açılımı ve Döndürme</h1>
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Layout Seçici */}
              <select
                className="px-3 py-2 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                value={selectedLayout.name}
                onChange={(e) => {
                    const newLayout = unfoldedLayouts.find(l => l.name === e.target.value) || unfoldedLayouts[0];
                    if (selectedLayout.name !== newLayout.name) {
                        handleResetGame(); // Layout değişince oyunu sıfırla
                        setSelectedLayout(newLayout);
                    }
                }}
                disabled={isClosed || allFacesFilled} // Dolmaya başlayınca veya kapanınca değiştirilemez
              >
                {unfoldedLayouts.map(layout => (
                  <option key={layout.name} value={layout.name}>
                    {layout.name}
                  </option>
                ))}
              </select>
              <span className="text-xs sm:text-sm text-gray-500 hidden md:block">
                {isClosed ? 'Döndürmek için sürükleyin' : 'Yüzeylere tıklayarak doldurun'}
              </span>
            </div>
          </div>

          {/* Şekil ve Renk Seçiciler (Sadece küp açıkken göster) */}
          {!isClosed && (
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-6 p-4 bg-gray-50 rounded-lg border">
              {/* Şekil Seçici */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-600">Şekil Seç</h3>
                <div className="flex flex-wrap gap-2">
                  {shapes.map((shape) => (
                    <Button
                      key={shape.id}
                      variant="outline"
                      onClick={() => setSelectedShape(shape)}
                      disabled={isClosed}
                      className={cn("p-2 w-10 h-10", selectedShape.id === shape.id && 'ring-2 ring-blue-500 border-blue-400')}
                      aria-label={`${shape.name} şeklini seç`}
                    >
                      <shape.icon size={20} className="text-gray-700" />
                    </Button>
                  ))}
                </div>
              </div>
              {/* Renk Seçici */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-600">Renk Seç</h3>
                <div className="flex flex-wrap gap-2">
                  {colors.map((color) => (
                    <Button
                      key={color.id}
                      variant="outline"
                      onClick={() => setSelectedColor(color)}
                      disabled={isClosed}
                      className={cn("p-0 w-10 h-10 border-2", selectedColor.id === color.id && 'ring-2 ring-offset-1 ring-blue-500 border-blue-400')}
                      aria-label={`${color.id} rengini seç`}
                    >
                      <div className={`w-full h-full rounded-sm ${color.bgClass}`} />
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Küp Alanı */}
          <div
            className={cn(
              "relative min-h-[400px] sm:min-h-[500px] bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl p-4 sm:p-8 border overflow-hidden",
              isClosed && 'cursor-grab active:cursor-grabbing'
            )}
            onMouseDown={handleDragStart}
            onMouseMove={handleDragMove}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd} // Fare alandan çıkınca da sürüklemeyi bitir
            onTouchStart={handleDragStart}
            onTouchMove={handleDragMove}
            onTouchEnd={handleDragEnd}
          >
            {/* Perspective container */}
            <div className="absolute inset-0 flex items-center justify-center" style={{ perspective: '1500px' }}>
              {isClosed ? renderClosedCube() : renderUnfoldedCube()}
            </div>
            {/* Katlanma animasyonu eklenecekse, bu div'in içinde yönetilebilir */}
          </div>

          {/* Yeniden Başla Butonu */}
          {/* Buton sadece kapalıyken değil, tüm yüzler dolduğunda ama henüz kapanmadığında da gösterilebilir */}
          {(isClosed || allFacesFilled) && (
            <div className="mt-6 text-center">
                 <Button
                    onClick={handleResetGame}
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-3 text-lg font-semibold"
                 >
                   <RotateCcw className="w-5 h-5 mr-2" />
                   Yeniden Başla
                 </Button>
            </div>
          )}
        </Card>
      </div>
    </RequireAuth>
  );
};

export default UnfoldedCubePage;