import React from 'react';

export interface Color {
  id: string;
  type: 'color';
  value: string;
  svg: React.ReactNode;
}

interface CreateColorParams {
  id: string;
  value: string;
  hexCode: string;
}

const createColor = ({
  id,
  value,
  hexCode,
}: CreateColorParams): Color => ({
  id,
  type: 'color',
  value,
  svg: (
    <div className="w-16 h-16 relative flex items-center justify-center">
      <div 
        className="w-12 h-12 rounded-full border-2 border-gray-300"
        style={{ backgroundColor: hexCode }}
      />
    </div>
  ),
});

export const colors: Color[] = [
  createColor({ id: 'red', value: 'Kırmızı', hexCode: '#FF0000' }),
  createColor({ id: 'blue', value: 'Mavi', hexCode: '#0000FF' }),
  createColor({ id: 'yellow', value: 'Sarı', hexCode: '#FFFF00' }),
  createColor({ id: 'green', value: 'Yeşil', hexCode: '#00FF00' }),
  createColor({ id: 'orange', value: 'Turuncu', hexCode: '#FFA500' }),
  createColor({ id: 'purple', value: 'Mor', hexCode: '#800080' }),
  createColor({ id: 'pink', value: 'Pembe', hexCode: '#FFC0CB' }),
  createColor({ id: 'brown', value: 'Kahverengi', hexCode: '#A52A2A' }),
  createColor({ id: 'black', value: 'Siyah', hexCode: '#000000' }),
  createColor({ id: 'white', value: 'Beyaz', hexCode: '#FFFFFF' }),
  createColor({ id: 'gray', value: 'Gri', hexCode: '#808080' }),
  createColor({ id: 'navy', value: 'Lacivert', hexCode: '#000080' }),
];
