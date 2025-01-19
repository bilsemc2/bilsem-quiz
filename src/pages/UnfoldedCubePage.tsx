import React, { useState, useEffect } from 'react';
import { Square, Triangle, Circle, Star, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import RequireAuth from '@/components/RequireAuth';
import { useXPCheck } from '../hooks/useXPCheck';
import XPWarning from '../components/XPWarning';
import { useUser } from '../hooks/useUser';

const shapes = [
  { id: 'square', icon: Square, name: 'Kare' },
  { id: 'triangle', icon: Triangle, name: 'Üçgen' },
  { id: 'circle', icon: Circle, name: 'Daire' },
  { id: 'star', icon: Star, name: 'Yıldız' },
  { id: 'heart', icon: Heart, name: 'Kalp' }
];

const colors = [
  'text-blue-500',
  'text-red-500',
  'text-green-500',
  'text-purple-500',
  'text-orange-500'
];

const unfoldedLayouts = [
  {
    name: 'T Şekli',
    grid: [
      [null, 'Üst', null],
      ['Sol', 'Ön', 'Sağ'],
      [null, 'Alt', null],
      [null, 'Arka', null]
    ]
  },
  {
    name: 'Dikdörtgen Şekli',
    grid: [
      ['Üst', 'Ön', 'Alt', 'Arka'],
      ['Sol', 'Sağ', null, null]
    ]
  },
  {
    name: 'L Şekli',
    grid: [
      ['Üst', null, null],
      ['Ön', null, null],
      ['Alt', 'Sağ', 'Arka'],
      ['Sol', null, null]
    ]
  },
  {
    name: 'Piramit Şekli',
    grid: [
      [null, null, 'Üst', null],
      ['Sol', 'Ön', 'Sağ', 'Arka'],
      [null, 'Alt', null, null]
    ]
  }
];

const UnfoldedCubePage = () => {
  const { currentUser, loading: userLoading } = useUser();
  const { hasEnoughXP, userXP, requiredXP, error: xpError, loading: xpLoading } = useXPCheck(
    userLoading ? undefined : currentUser?.id,
    '/unfolded-cube'
  );

  const [selectedShape, setSelectedShape] = useState(shapes[0]);
  const [selectedColor, setSelectedColor] = useState(colors[0]);
  const [selectedLayout, setSelectedLayout] = useState(unfoldedLayouts[0]);
  const [faces, setFaces] = useState({
    Ön: null,
    Arka: null,
    Sol: null,
    Sağ: null,
    Üst: null,
    Alt: null
  });
  const [isClosed, setIsClosed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startPosition, setStartPosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState({ x: -20, y: 45 });

  // Döndürme olayları
  const handleDragStart = (e) => {
    if (isClosed) {
      setIsDragging(true);
      setStartPosition({
        x: e.clientX || e.touches?.[0].clientX,
        y: e.clientY || e.touches?.[0].clientY
      });
    }
  };

  const handleDragMove = (e) => {
    if (isDragging && isClosed) {
      const clientX = e.clientX || e.touches?.[0].clientX;
      const clientY = e.clientY || e.touches?.[0].clientY;
      
      const deltaX = clientX - startPosition.x;
      const deltaY = clientY - startPosition.y;

      setRotation({
        x: rotation.x - deltaY * 0.5,
        y: rotation.y + deltaX * 0.5
      });

      setStartPosition({
        x: clientX,
        y: clientY
      });
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Yüzeye şekil ekleme
  const assignShape = (face) => {
    if (!isClosed) {
      setFaces(prev => ({
        ...prev,
        [face]: {
          shape: selectedShape,
          color: selectedColor
        }
      }));
    }
  };

  // Tüm yüzeylerin dolu olup olmadığını kontrol et
  useEffect(() => {
    const allFacesFilled = Object.values(faces).every(face => face !== null);
    if (allFacesFilled) {
      setTimeout(() => setIsClosed(true), 500);
    }
  }, [faces]);

  // Küp yüzü bileşeni
  const CubeFace = ({ face, data, onClick }) => (
    <div 
      className={`
        w-32 h-32 border-4 border-gray-300 rounded-lg
        flex items-center justify-center bg-white
        transition-all duration-300
        ${!isClosed ? 'cursor-pointer hover:bg-gray-50' : ''}
      `}
      onClick={() => !isClosed && onClick()}
    >
      {data ? (
        <data.shape.icon 
          size={48} 
          className={data.color}
        />
      ) : (
        <span className="text-lg font-medium text-gray-400">{face}</span>
      )}
    </div>
  );

  // Açık küp görünümü
  const renderUnfoldedCube = () => (
    <div className="grid gap-1 w-fit mx-auto">
      {selectedLayout.grid.map((row, i) => (
        <div key={i} className="flex gap-1">
          {row.map((face, j) => (
            <div key={`${i}-${j}`} className="w-32 h-32">
              {face && (
                <CubeFace
                  face={face.charAt(0).toUpperCase() + face.slice(1)}
                  data={faces[face]}
                  onClick={() => assignShape(face)}
                />
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );

  // Kapalı küp görünümü
  const renderClosedCube = () => (
    <div 
      className="relative w-32 h-32"
      style={{ 
        transformStyle: 'preserve-3d',
        transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
        transition: isDragging ? 'none' : 'transform 0.5s'
      }}
    >
      <div className="absolute" style={{ transform: 'translateZ(64px)' }}>
        <CubeFace face="Ön" data={faces.Ön} onClick={() => {}} />
      </div>
      <div className="absolute" style={{ transform: 'translateZ(-64px) rotateY(180deg)' }}>
        <CubeFace face="Arka" data={faces.Arka} onClick={() => {}} />
      </div>
      <div className="absolute" style={{ transform: 'translateX(64px) rotateY(90deg)' }}>
        <CubeFace face="Sağ" data={faces.Sağ} onClick={() => {}} />
      </div>
      <div className="absolute" style={{ transform: 'translateX(-64px) rotateY(-90deg)' }}>
        <CubeFace face="Sol" data={faces.Sol} onClick={() => {}} />
      </div>
      <div className="absolute" style={{ transform: 'translateY(-64px) rotateX(90deg)' }}>
        <CubeFace face="Üst" data={faces.Üst} onClick={() => {}} />
      </div>
      <div className="absolute" style={{ transform: 'translateY(64px) rotateX(-90deg)' }}>
        <CubeFace face="Alt" data={faces.Alt} onClick={() => {}} />
      </div>
    </div>
  );

  const resetGame = () => {
    setSelectedShape(shapes[0]);
    setSelectedColor(colors[0]);
    setSelectedLayout(unfoldedLayouts[0]);
    setFaces({
      Ön: null,
      Arka: null,
      Sol: null,
      Sağ: null,
      Üst: null,
      Alt: null
    });
    setIsClosed(false);
    setRotation({ x: -20, y: 45 });
  };

  // Loading durumunda bekle
  if (userLoading || xpLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // XP kontrolü
  if (!hasEnoughXP) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <XPWarning
          requiredXP={requiredXP}
          currentXP={userXP}
          title="Açılmış Küp sayfasına erişim için yeterli XP'niz yok"
        />
      </div>
    );
  }

  return (
    <RequireAuth>
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 p-4">
        <Card className="p-6 w-full max-w-4xl">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Küp Döndürme</h1>
            <div className="flex items-center gap-4">
              <select 
                className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedLayout.name}
                onChange={(e) => setSelectedLayout(unfoldedLayouts.find(l => l.name === e.target.value) || unfoldedLayouts[0])}
                disabled={isClosed}
              >
                {unfoldedLayouts.map(layout => (
                  <option key={layout.name} value={layout.name}>
                    {layout.name}
                  </option>
                ))}
              </select>
              <p className="text-gray-500">
                {isClosed ? 'Küpü döndürmek için sürükleyin' : 'Tüm yüzeylere şekil ekleyin'}
              </p>
            </div>
          </div>

          {/* Şekil ve renk seçiciler */}
          <div className="flex gap-6 mb-8">
            <div className="space-y-2">
              <h2 className="text-sm font-medium">Şekiller</h2>
              <div className="flex gap-2">
                {shapes.map((shape) => (
                  <Button
                    key={shape.id}
                    onClick={() => setSelectedShape(shape)}
                    disabled={isClosed}
                    className={`p-3 ${
                      selectedShape.id === shape.id 
                        ? 'ring-2 ring-blue-500' 
                        : ''
                    }`}
                  >
                    <shape.icon size={24} />
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-sm font-medium">Renkler</h2>
              <div className="flex gap-2">
                {colors.map((color) => (
                  <Button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    disabled={isClosed}
                    className={`w-10 h-10 rounded-full ${
                      selectedColor === color 
                        ? 'ring-2 ring-offset-2 ring-blue-500' 
                        : ''
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full ${color.replace('text', 'bg')}`} />
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Küp alanı */}
          <div 
            className={`
              relative h-[600px] bg-gray-100 rounded-xl p-8
              ${isClosed ? 'cursor-move' : ''}
            `}
            onMouseDown={handleDragStart}
            onMouseMove={handleDragMove}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
            onTouchStart={handleDragStart}
            onTouchMove={handleDragMove}
            onTouchEnd={handleDragEnd}
          >
            <div className="absolute inset-0 flex items-center justify-center" style={{ perspective: '1200px' }}>
              {isClosed ? renderClosedCube() : renderUnfoldedCube()}
            </div>
          </div>

          {isClosed && (
            <Button
              onClick={resetGame}
              className="mt-6 w-full py-6 text-2xl font-bold bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              YENİDEN BAŞLA
            </Button>
          )}
        </Card>
      </div>
    </RequireAuth>
  );
};

export default UnfoldedCubePage;
