import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Save, 
  Plus,
  Circle,
  Type,
  Loader2,
  Info
} from 'lucide-react';
import { Shape, shapes } from '@/lib/shapes';
import { Letter, letters } from '@/lib/letters';
import { Animal, animals } from '@/lib/animals';
import { Number, numbers } from '@/lib/numbers';
import { Profession, professions } from '@/lib/professions';
import { Fruit, fruits } from '@/lib/fruits';
import { Color, colors } from '@/lib/colors';
import { savePuzzle } from '@/lib/puzzleService';
import { toast } from 'sonner';
import {
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
  TooltipContent,
  TooltipPortal,
} from '@/components/ui/tooltip';

type ItemType = Shape | Letter | Animal | Number | Profession | Fruit | Color;

const LogicPuzzleCreator = () => {
  const [selectedType, setSelectedType] = useState<'shape' | 'letter' | 'animal' | 'number' | 'profession' | 'fruit' | 'color'>('shape');
  const [selectedItem, setSelectedItem] = useState<ItemType | null>(null);
  const [grid, setGrid] = useState<(ItemType | null)[][]>(
    Array(3).fill(null).map(() => Array(3).fill(null))
  );
  const [title, setTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const items = {
    shape: shapes,
    letter: letters,
    animal: animals,
    number: numbers,
    profession: professions,
    fruit: fruits,
    color: colors,
  };

  const handleItemClick = (item: ItemType) => {
    setSelectedItem(item);
  };

  const handleCellClick = (rowIndex: number, colIndex: number) => {
    if (selectedItem) {
      const newGrid = [...grid];
      newGrid[rowIndex][colIndex] = selectedItem;
      setGrid(newGrid);
      setSelectedItem(null);
    }
  };

  const renderItem = (item: ItemType) => {
    return item.svg;
  };

  const clearCell = (rowIndex: number, colIndex: number) => {
    const newGrid = [...grid];
    newGrid[rowIndex][colIndex] = null;
    setGrid(newGrid);
  };

  const handleSavePuzzle = async () => {
    if (!title.trim()) {
      toast.error('Lütfen bulmaca için bir başlık girin');
      return;
    }

    try {
      setIsSaving(true);
      const puzzleData = {
        grid,
        title: title.trim(),
      };

      await savePuzzle(puzzleData);
      toast.success('Bulmaca başarıyla kaydedildi!');
      setTitle('');
      setGrid(Array(3).fill(null).map(() => Array(3).fill(null)));
    } catch (error: any) {
      console.error('Error saving puzzle:', error);
      toast.error(error.message || 'Bulmaca kaydedilirken bir hata oluştu');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <TooltipProvider>
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="text-center space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">Matriks Bulmacası Oluştur</h2>
              <TooltipRoot>
                <TooltipTrigger asChild>
                  <button className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                    <Info className="w-5 h-5 text-gray-500" />
                  </button>
                </TooltipTrigger>
                <TooltipPortal>
                  <TooltipContent side="right" className="max-w-sm bg-white p-4 rounded-lg shadow-lg border">
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600">
                        Bu araç ile 3x3 mantık bulmacaları oluşturabilirsiniz. Bulmacalarınızda şekiller, harfler, 
                        sayılar, hayvanlar, meslekler, meyveler ve renkler kullanabilirsiniz.
                      </p>
                      <div>
                        <h3 className="font-semibold mb-2 text-gray-700">Nasıl Kullanılır?</h3>
                        <ol className="list-decimal list-inside space-y-1 text-gray-600 text-sm">
                          <li>Bulmaca için açıklayıcı bir başlık girin</li>
                          <li>Kullanmak istediğiniz öğe türünü seçin (örn: şekiller, harfler)</li>
                          <li>Kütüphaneden bir öğe seçin</li>
                          <li>Seçtiğiniz öğeyi ızgarada istediğiniz yere yerleştirin</li>
                          <li>İşiniz bittiğinde "Kaydet" butonuna tıklayın</li>
                        </ol>
                        <p className="mt-2 text-gray-500 text-xs">
                          İpucu: Bir hücreyi temizlemek için üzerine sağ tıklayın
                        </p>
                      </div>
                    </div>
                  </TooltipContent>
                </TooltipPortal>
              </TooltipRoot>
            </div>
            <div className="flex items-center gap-4">
              <Input
                placeholder="Bulmaca başlığı"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="max-w-sm"
              />
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as 'shape' | 'letter' | 'animal' | 'number' | 'profession' | 'fruit' | 'color')}
                className="p-2 border rounded"
              >
                <option value="number">Rakamlar</option>
                <option value="shape">Şekiller</option>
                <option value="letter">Harfler</option>
                <option value="animal">Hayvanlar</option>
                <option value="profession">Meslekler</option>
                <option value="fruit">Meyveler</option>
                <option value="color">Renkler</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Öğe Kütüphanesi */}
          <div className="bg-gray-100 p-4 rounded-lg">
            <h3 className="font-semibold mb-3">Kütüphane</h3>
            <div className="grid grid-cols-9 gap-2">
              {items[selectedType].map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`w-16 h-16 p-2 border rounded hover:bg-gray-100 ${
                    selectedItem?.id === item.id ? 'border-blue-500 bg-blue-50' : ''
                  }`}
                  title={item.value}
                >
                  {renderItem(item)}
                </button>
              ))}
            </div>
          </div>

          {/* 3x3 Grid */}
          <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
            <div className="grid grid-cols-3 gap-6 max-w-[600px] mx-auto">
              {grid.map((row, rowIndex) => (
                row.map((cell, colIndex) => (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      clearCell(rowIndex, colIndex);
                    }}
                    className={`w-40 h-40 border-2 rounded-lg flex items-center justify-center p-6 cursor-pointer hover:bg-gray-50 transition-colors duration-200 ${
                      cell ? 'border-gray-300 shadow-sm' : 'border-dashed border-gray-300'
                    }`}
                  >
                    <div className="transform scale-150">
                      {cell && renderItem(cell)}
                    </div>
                  </div>
                ))
              ))}
            </div>
          </div>

          {/* Kontroller */}
          <div className="flex justify-center gap-4">
            <Button
              onClick={() => {
                setGrid(Array(3).fill(null).map(() => Array(3).fill(null)));
                setTitle('');
              }}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Yeni
            </Button>
            <Button
              onClick={handleSavePuzzle}
              disabled={isSaving}
              className="flex items-center gap-2"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default LogicPuzzleCreator;
