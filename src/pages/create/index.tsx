import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Save, 
  Plus,
  Type,
  Loader2,
  Info
} from 'lucide-react';
import { Letter, letters } from '@/lib/letters';
import { Animal, animals } from '@/lib/animals';
import { Number, numbers } from '@/lib/numbers';
import { Profession, professions } from '@/lib/professions';
import { Fruit, fruits } from '@/lib/fruits';
import { Color, colors } from '@/lib/colors';
import { Bilsemc2Item, bilsemc2Items } from '@/lib/bilsemc2';
import { savePuzzle } from '@/lib/puzzleService';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useXPCheck } from '../../hooks/useXPCheck';
import XPWarning from '../../components/XPWarning';
import { useUser } from '../../hooks/useUser';

import {
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
  TooltipContent,
  TooltipPortal,
} from '@/components/ui/tooltip';

type ItemType = Letter | Animal | Number | Profession | Fruit | Color | Bilsemc2Item;

const LogicPuzzleCreator = () => {
  const navigate = useNavigate();
  const { currentUser, loading: userLoading } = useUser();
  const { hasEnoughXP, userXP, requiredXP, loading: xpLoading } = useXPCheck(
    userLoading ? undefined : currentUser?.id,
    '/create'
  );

  const [selectedType, setSelectedType] = useState<'letter' | 'animal' | 'number' | 'profession' | 'fruit' | 'color' | 'bilsemc2'>('letter');
  const [selectedItem, setSelectedItem] = useState<ItemType | null>(null);
  const [grid, setGrid] = useState<(ItemType | null)[][]>(
    Array(3).fill(null).map(() => Array(3).fill(null))
  );
  const [title, setTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const items = {
    letter: letters,
    animal: animals,
    number: numbers,
    profession: professions,
    fruit: fruits,
    color: colors,
    bilsemc2: bilsemc2Items,
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
      // Grid'i serileştirilebilir formata dönüştür
      const serializedGrid = grid.map(row =>
        row.map(cell => cell ? {
          id: cell.id,
          type: cell.type,
          value: cell.value
        } : null)
      );

      const puzzleData = {
        grid: serializedGrid,
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

  if (userLoading || xpLoading) {
    return <div>Yükleniyor...</div>;
  }

  if (!hasEnoughXP) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="flex items-center justify-center min-h-[80vh]">
          <XPWarning
            requiredXP={requiredXP}
            currentXP={userXP || 0}
            title="Soru Oluşturmak için XP Yetersiz"
          />
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="text-center space-y-4">
          {/* Başlık ve Bilgi İkonu */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold">Matriks Bulmacası Oluştur</h2>
              <TooltipRoot>
                <TooltipTrigger asChild>
                  <button className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                    <Info className="w-5 h-5 text-gray-500" />
                  </button>
                </TooltipTrigger>
                <TooltipPortal>
                  <TooltipContent side="right" className="max-w-[280px] sm:max-w-sm bg-white p-4 rounded-lg shadow-lg border">
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600">
                        Bu araç ile 3x3 mantık bulmacaları oluşturabilirsiniz. Bulmacalarınızda harfler, 
                        sayılar, hayvanlar, meslekler, meyveler ve renkler kullanabilirsiniz.
                      </p>
                      <div>
                        <h3 className="font-semibold mb-2 text-gray-700">Nasıl Kullanılır?</h3>
                        <ol className="list-decimal list-inside space-y-1 text-gray-600 text-sm">
                          <li>Bulmaca için açıklayıcı bir başlık girin</li>
                          <li>Kullanmak istediğiniz öğe türünü seçin (örn: harfler, sayılar)</li>
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

            {/* Başlık ve Tür Seçimi */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <Input
                placeholder="Bulmaca başlığı"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="flex-1 sm:max-w-[200px]"
              />
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as 'letter' | 'animal' | 'number' | 'profession' | 'fruit' | 'color' | 'bilsemc2')}
                className="p-2 border rounded flex-1 sm:flex-none"
              >
                <option value="number">Rakamlar</option>
                <option value="letter">Harfler</option>
                <option value="animal">Hayvanlar</option>
                <option value="profession">Meslekler</option>
                <option value="fruit">Meyveler</option>
                <option value="color">Renkler</option>
                <option value="bilsemc2">BilsemC2</option>
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Öğe Kütüphanesi */}
          <div className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
            <h3 className="font-semibold mb-3">Kütüphane</h3>
            <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-9 gap-2 min-w-[300px]">
              {items[selectedType].map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`w-12 sm:w-14 md:w-16 h-12 sm:h-14 md:h-16 p-2 border rounded hover:bg-gray-100 ${
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
            <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6 max-w-[600px] mx-auto">
              {grid.map((row, rowIndex) => (
                row.map((cell, colIndex) => (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      clearCell(rowIndex, colIndex);
                    }}
                    className={`w-[80px] h-[80px] sm:w-[120px] sm:h-[120px] md:w-[160px] md:h-[160px] border-2 rounded-lg flex items-center justify-center p-2 sm:p-4 md:p-6 cursor-pointer hover:bg-gray-50 transition-colors duration-200 ${
                      cell ? 'border-gray-300 shadow-sm' : 'border-dashed border-gray-300'
                    }`}
                  >
                    {cell && (
                      <div className="w-full h-full">
                        {renderItem(cell)}
                      </div>
                    )}
                  </div>
                ))
              ))}
            </div>
          </div>

          {/* Kaydet Butonu */}
          <div className="flex justify-center pt-4">
            <Button
              onClick={handleSavePuzzle}
              disabled={isSaving}
              className="px-8 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Kaydet
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default LogicPuzzleCreator;
