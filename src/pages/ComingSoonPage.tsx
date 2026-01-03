import { motion } from 'framer-motion';
import { Clock, Sparkles } from 'lucide-react';

const ComingSoonPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex flex-col items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-xl p-12 bg-white rounded-3xl shadow-xl border border-slate-100"
      >
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-indigo-100 rounded-2xl">
            <Clock className="w-12 h-12 text-indigo-600" />
          </div>
        </div>

        <h1 className="text-4xl font-black text-slate-800 mb-4 flex items-center justify-center gap-2">
          Çok Yakında! <Sparkles className="w-8 h-8 text-amber-500" />
        </h1>

        <p className="text-lg text-slate-600 leading-relaxed">
          Bu özellik şu anda geliştirme aşamasında. Yakında burada uzamsal zeka becerilerinizi
          geliştirebileceğiniz yeni bir aktivite ile karşınızda olacağız!
        </p>

        <div className="mt-8 flex justify-center gap-2">
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="w-3 h-3 bg-indigo-400 rounded-full"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default ComingSoonPage;
