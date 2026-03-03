import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Download, Sparkles, ArrowRight } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { StoryPDF } from './StoryPDF';
import { Story } from '../types';

interface StoryViewerProps {
  story: Story;
  onNext: () => void;
  isLoading?: boolean;
}

export function StoryViewer({ story, onNext, isLoading }: StoryViewerProps) {
  const [isPlaying, setIsPlaying] = React.useState(false);

  return (
    <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8">
      {/* Title */}
      <h1 className="text-3xl sm:text-4xl font-black font-nunito text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-pink-600 dark:from-purple-400 dark:to-pink-400">
        {story.title}
      </h1>

      {/* PDF Download */}
      <div className="flex justify-end">
        <PDFDownloadLink
          document={<StoryPDF story={story} />}
          fileName={`${story.title}.pdf`}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5 shadow-md"
        >
          <div className="flex items-center gap-2">
            <Download size={18} />
            <span>PDF İndir</span>
          </div>
        </PDFDownloadLink>
      </div>

      {/* Story Image */}
      {story.image_url && (
        <div className="relative rounded-3xl overflow-hidden shadow-xl border-2 border-slate-200 dark:border-slate-700">
          <img
            src={story.image_url}
            alt={story.title}
            className="w-full h-auto object-cover"
          />
        </div>
      )}

      {/* Story Content */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-lg border-2 border-slate-200 dark:border-slate-700 space-y-6">
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <p className="text-slate-700 dark:text-slate-300 text-base sm:text-lg leading-relaxed sm:leading-loose first-letter:text-5xl first-letter:font-black first-letter:text-purple-600 dark:first-letter:text-purple-400 first-letter:float-left first-letter:mr-3 first-letter:mt-1">
            {story.content}
          </p>
        </div>

        {/* Animal Info */}
        {story.theme === 'animals' && story.animalInfo && (
          <div className="p-5 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl border-2 border-emerald-200 dark:border-emerald-800">
            <h3 className="text-base font-black text-emerald-800 dark:text-emerald-300 mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Biliyor muydun? 🤔
            </h3>
            <p className="text-emerald-700 dark:text-emerald-400 text-sm leading-relaxed">{story.animalInfo}</p>
          </div>
        )}

        {/* Audio Player */}
        {story.audio_url && (
          <div className="flex items-center justify-center gap-4 py-4">
            <button className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
              <SkipBack size={22} />
            </button>
            <button
              className="p-4 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600 shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? <Pause size={28} /> : <Play size={28} />}
            </button>
            <button className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
              <SkipForward size={22} />
            </button>
          </div>
        )}
      </div>

      {/* CTA Button */}
      <button
        onClick={onNext}
        disabled={isLoading}
        className={`w-full py-4 ${isLoading ? 'bg-gradient-to-r from-purple-400 to-indigo-400 cursor-wait' : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 transform hover:scale-[1.02] hover:-translate-y-1'} text-white rounded-2xl font-black font-nunito text-lg transition-all shadow-lg flex items-center justify-center gap-3 uppercase tracking-wider`}
      >
        {isLoading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Sorular Oluşturuluyor...
          </>
        ) : (
          <>Sorulara Geç <ArrowRight className="w-5 h-5" /></>
        )}
      </button>
    </div>
  );
}