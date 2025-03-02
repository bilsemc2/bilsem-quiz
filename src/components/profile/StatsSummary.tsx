import React from 'react';
import { UserProfile, QuizStats } from '@/types/profile';

interface StatsSummaryProps {
  userData: UserProfile;
  quizStats: QuizStats;
}

const StatsSummary: React.FC<StatsSummaryProps> = ({ userData, quizStats }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
      <h2 className="text-2xl font-bold mb-6">İstatistikler</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-purple-800">Toplam Deneyim</h3>
          <div className="flex items-center gap-2 mt-2">
            <p className="text-3xl font-bold text-purple-600">{userData.experience} XP</p>
            <div className="bg-purple-100 text-purple-800 text-sm rounded-full px-3 py-1 flex items-center gap-1">
              <span>{quizStats.levelBadge}</span>
              <span>Seviye {quizStats.currentLevel}</span>
            </div>
          </div>
          <p className="text-sm text-purple-700 mt-2">
            {quizStats.levelTitle} seviyesindesiniz
          </p>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-indigo-800">Toplam Puan</h3>
          <p className="text-3xl font-bold text-indigo-600">{userData.points}</p>
          <p className="text-sm text-indigo-700 mt-2">
            Quizlerden kazandığınız toplam puan
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800">Quiz Performansı</h3>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div>
              <p className="text-sm text-blue-700">Toplam Quiz</p>
              <p className="text-xl font-bold text-blue-600">{quizStats.totalQuizzes}</p>
            </div>
            <div>
              <p className="text-sm text-green-700">Başarı Oranı</p>
              <p className="text-xl font-bold text-green-600">%{quizStats.averageScore.toFixed(1)}</p>
            </div>
            <div>
              <p className="text-sm text-green-700">Doğru</p>
              <p className="text-xl font-bold text-green-600">{quizStats.totalCorrect}</p>
            </div>
            <div>
              <p className="text-sm text-red-700">Yanlış</p>
              <p className="text-xl font-bold text-red-600">{quizStats.totalWrong}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsSummary;
