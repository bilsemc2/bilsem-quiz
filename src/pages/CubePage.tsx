import React, { useState } from 'react';
import { Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import RequireAuth from '@/components/RequireAuth';

const CubePage = () => {
  const [grid, setGrid] = useState(Array(25).fill(null)); // 5x5 grid
  const [selectedColor, setSelectedColor] = useState('text-blue-500');
  const gridSize = 5;
  
  const colors = [
    { name: 'Mavi', class: 'text-blue-500' },
    { name: 'Kırmızı', class: 'text-red-500' },
    { name: 'Yeşil', class: 'text-green-500' },
    { name: 'Mor', class: 'text-purple-500' },
    { name: 'Turuncu', class: 'text-orange-500' }
  ];

  const toggleCube = (index) => {
    const newGrid = [...grid];
    newGrid[index] = newGrid[index] ? null : { color: selectedColor };
    setGrid(newGrid);
  };

  const clearGrid = () => {
    setGrid(Array(25).fill(null));
  };

  // Önden görünüm (teknik çizim)
  const renderFrontView = () => {
    const frontView = Array(gridSize).fill().map(() => Array(gridSize).fill(false));
    
    // Her sütun için en öndeki dolu hücreyi bul
    for (let col = 0; col < gridSize; col++) {
      for (let row = gridSize - 1; row >= 0; row--) {
        const index = row * gridSize + col;
        if (grid[index]) {
          frontView[row][col] = grid[index];
          break;
        }
      }
    }

    return (
      <div className="grid grid-cols-5 gap-1 bg-gray-50 p-4 rounded-lg">
        {frontView.flat().map((cell, index) => (
          <div key={`front-${index}`} className="aspect-square flex items-center justify-center">
            {cell && (
              <div className="w-10 h-10 flex items-center justify-center">
                <div className={`w-10 h-10 rounded-sm ${cell.color.replace('text', 'bg')}`} />
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Yandan görünüm (sağdan bakış)
  const renderSideView = () => {
    const sideView = Array(gridSize).fill().map(() => Array(gridSize).fill(false));
    
    // Her satır için en sağdaki dolu hücreyi bul
    for (let row = 0; row < gridSize; row++) {
      for (let col = gridSize - 1; col >= 0; col--) {
        const index = row * gridSize + col;
        if (grid[index]) {
          sideView[row][0] = grid[index];
          break;
        }
      }
    }

    return (
      <div className="grid grid-cols-5 gap-1 bg-gray-50 p-4 rounded-lg">
        {sideView.flat().map((cell, index) => (
          <div key={`side-${index}`} className="aspect-square flex items-center justify-center">
            {cell && (
              <div className="w-10 h-10 flex items-center justify-center">
                <div className={`w-5 h-10 rounded-sm ${cell.color.replace('text', 'bg')}`} />
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <RequireAuth>
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 p-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Teknik Küp Görünümleri</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
          <Card className="p-6 shadow-lg hover:shadow-xl transition-shadow">
            <h2 className="text-xl font-semibold mb-4 text-center">Yerleştirme Alanı</h2>
            <div className="flex gap-2 justify-center mb-4">
              {colors.map((color) => (
                <Button
                  key={color.name}
                  className={`w-10 h-10 rounded-lg transform transition-all duration-200 hover:scale-110 ${
                    selectedColor === color.class 
                      ? 'ring-2 ring-offset-2 ring-blue-500' 
                      : ''
                  }`}
                  onClick={() => setSelectedColor(color.class)}
                  title={color.name}
                >
                  <Square size={24} className={color.class} />
                </Button>
              ))}
            </div>
            
            <div className="grid grid-cols-5 gap-1 bg-white p-4 rounded-lg shadow-inner">
              {grid.map((cell, index) => (
                <div
                  key={index}
                  onClick={() => toggleCube(index)}
                  className={`
                    aspect-square border border-gray-200 rounded 
                    flex items-center justify-center cursor-pointer 
                    hover:bg-gray-50 transition-all duration-200
                    transform hover:scale-105
                    ${cell ? 'bg-gray-50' : 'bg-white'}
                  `}
                >
                  {cell && <Square size={40} className={`${cell.color}`} />}
                </div>
              ))}
            </div>
            
            <Button 
              onClick={clearGrid}
              variant="outline"
              className="w-full mt-4 hover:bg-gray-50 transition-colors"
            >
              Temizle
            </Button>
          </Card>
          
          <Card className="p-6 shadow-lg hover:shadow-xl transition-shadow">
            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-semibold mb-4 text-center">Önden Görünüm</h2>
                {renderFrontView()}
                <p className="text-sm text-gray-500 mt-2 text-center">
                  En öndeki küpler gösterilir
                </p>
              </div>
              
              <div>
                <h2 className="text-xl font-semibold mb-4 text-center">Yandan Görünüm</h2>
                {renderSideView()}
                <p className="text-sm text-gray-500 mt-2 text-center">
                  Her satırdaki en sağdaki küpler gösterilir
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="mt-8 text-center max-w-2xl">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Nasıl Kullanılır?</h3>
          <ul className="text-gray-600 space-y-2">
            <li>1. Bir renk seçin</li>
            <li>2. Izgara üzerinde küp eklemek istediğiniz karelere tıklayın</li>
            <li>3. Sağ tarafta küplerin önden ve yandan görünümlerini inceleyin</li>
            <li>4. Temizle butonu ile baştan başlayabilirsiniz</li>
          </ul>
        </div>
      </div>
    </RequireAuth>
  );
};

export default CubePage;
