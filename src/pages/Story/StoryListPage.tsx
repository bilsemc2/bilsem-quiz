// React componenti
import { StoriesList } from './components/StoriesList';
import { BookOpen, Sparkles } from 'lucide-react';

export default function StoryListPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-100 via-pink-50 to-amber-50 dark:from-slate-900 dark:via-purple-950/50 dark:to-slate-900 py-12 sm:py-16">
        <div className="absolute inset-0 overflow-hidden opacity-20">
          <div className="absolute -top-20 -left-20 w-72 h-72 bg-purple-300 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-pink-300 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-amber-200 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-full border-2 border-purple-200 dark:border-purple-700 shadow-lg mb-6">
            <BookOpen className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider">Okuma Köşesi</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black font-nunito text-transparent bg-clip-text bg-gradient-to-r from-purple-700 via-pink-600 to-amber-600 dark:from-purple-400 dark:via-pink-400 dark:to-amber-400 mb-4 leading-tight">
            📚 Hikayeler
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto font-medium">
            Eğlenceli hikayeler oku, soruları çöz, kelime oyunlarıyla öğren!
          </p>
        </div>
      </div>

      {/* Stories Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
        <StoriesList />
      </div>
    </div>
  );
}
