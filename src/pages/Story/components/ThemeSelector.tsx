import { Book, Users, Cat, Microscope, Wand2, Heart } from 'lucide-react';
import { StoryTheme, themeTranslations } from './types';

interface ThemeSelectorProps {
  selectedTheme?: StoryTheme;
  onSelectTheme: (theme: StoryTheme) => void;
  disabled?: boolean;
}

const themes = [
  { id: 'adventure', icon: Book, color: 'bg-orange-500' },
  { id: 'friendship', icon: Users, color: 'bg-pink-500' },
  { id: 'animals', icon: Cat, color: 'bg-green-500' },
  { id: 'science', icon: Microscope, color: 'bg-blue-500' },
  { id: 'fantasy', icon: Wand2, color: 'bg-purple-500' },
  { id: 'life-lessons', icon: Heart, color: 'bg-red-500' },
] as const;

export function ThemeSelector({ selectedTheme = 'adventure', onSelectTheme, disabled = false }: ThemeSelectorProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4">
      {themes.map((theme) => (
        <button
          key={theme.id}
          onClick={() => onSelectTheme(theme.id)}
          disabled={disabled}
          className={`${theme.color} ${selectedTheme === theme.id ? 'ring-4 ring-offset-2 ring-blue-500' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90 hover:shadow-xl hover:scale-105'} transition-all rounded-xl p-6 text-white flex flex-col items-center gap-3 shadow-lg`}
        >
          <theme.icon size={32} />
          <span className="text-lg font-medium">{themeTranslations[theme.id]}</span>
        </button>
      ))}
    </div>
  );
}