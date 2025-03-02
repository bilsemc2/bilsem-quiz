import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Download } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { StoryPDF } from './StoryPDF';
import { Story } from '../types';

interface StoryViewerProps {
  story: Story;
  onNext: () => void;
}

export function StoryViewer({ story, onNext }: StoryViewerProps) {
  const [isPlaying, setIsPlaying] = React.useState(false);

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <h1 className="text-4xl font-bold text-center text-purple-800">{story.title}</h1>

      <div className="flex justify-end">
        <PDFDownloadLink
          document={<StoryPDF story={story} />}
          fileName={`${story.title}.pdf`}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Download size={20} />
            <span>PDF İndir</span>
          </div>
        </PDFDownloadLink>
      </div>
      
      {story.image_url && (
        <div className="relative aspect-square rounded-2xl overflow-hidden shadow-2xl">
          <img
            src={story.image_url}
            alt={story.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="bg-white rounded-xl p-6 shadow-lg space-y-4">
        <div className="prose max-w-none text-lg leading-relaxed">
          {story.content}
        </div>
        
        {story.theme === 'animals' && story.animalInfo && (
          <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <h3 className="text-lg font-semibold text-purple-900 mb-2">
              Biliyor muydun? 🤔
            </h3>
            <p className="text-purple-800">
              {story.animalInfo}
            </p>
          </div>
        )}

        {story.audio_url && (
          <div className="flex items-center justify-center gap-4 py-4">
            <button className="p-2 rounded-full bg-gray-100 hover:bg-gray-200">
              <SkipBack size={24} />
            </button>
            <button
              className="p-4 rounded-full bg-purple-600 text-white hover:bg-purple-700"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? <Pause size={32} /> : <Play size={32} />}
            </button>
            <button className="p-2 rounded-full bg-gray-100 hover:bg-gray-200">
              <SkipForward size={24} />
            </button>
          </div>
        )}
      </div>

      <button
        onClick={onNext}
        className="w-full py-4 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-colors"
      >
        Sorulara Geç
      </button>
    </div>
  );
}