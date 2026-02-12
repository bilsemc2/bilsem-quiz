import React from 'react';
import { Delete, Check } from 'lucide-react';

interface KeypadProps {
  onKeyPress: (key: string) => void;
  onDelete: () => void;
  onSubmit: () => void;
  disabled?: boolean;
}

export const Keypad: React.FC<KeypadProps> = ({ onKeyPress, onDelete, onSubmit, disabled }) => {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

  return (
    <div className="grid grid-cols-3 gap-2 w-full max-w-sm mx-auto mt-4">
      {keys.map((k) => (
        <button
          key={k}
          onClick={() => onKeyPress(k)}
          disabled={disabled}
          className="bg-white hover:bg-gray-50 active:bg-gray-100 border-b-4 border-gray-200 active:border-b-0 active:translate-y-1 text-gray-700 text-2xl font-bold py-4 rounded-xl shadow-sm transition-all"
        >
          {k}
        </button>
      ))}
      <button
        onClick={onDelete}
        disabled={disabled}
        className="bg-red-100 hover:bg-red-200 active:bg-red-300 border-b-4 border-red-200 active:border-b-0 active:translate-y-1 text-red-600 py-4 rounded-xl shadow-sm transition-all flex items-center justify-center"
      >
        <Delete size={28} />
      </button>
      <button
        onClick={onSubmit}
        disabled={disabled}
        className="col-span-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 border-b-4 border-indigo-800 active:border-b-0 active:translate-y-1 text-white py-4 rounded-xl shadow-sm transition-all flex items-center justify-center"
      >
        <Check size={32} />
      </button>
    </div>
  );
};