import React from 'react';
import { useNavigate } from 'react-router-dom';

interface XPWarningProps {
  requiredXP: number;
  currentXP: number;
  title: string;
}

const XPWarning = ({ requiredXP, currentXP, title }: XPWarningProps) => {
  const navigate = useNavigate();
  const progress = Math.min((currentXP / requiredXP) * 100, 100);

  return (
    <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-purple-100 rounded-full mx-auto flex items-center justify-center">
          <svg className="w-8 h-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        
        <h1 className="text-xl font-bold text-gray-900">
          {title}
        </h1>
        
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            Bu özelliği kullanmak için en az {requiredXP} XP'ye ihtiyacınız var. 
            Şu anda {currentXP} XP'niz bulunuyor.
          </p>

          {/* XP Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            >
            </div>
          </div>
          <p className="text-xs text-gray-500">
            {requiredXP - currentXP} XP daha kazanmanız gerekiyor
          </p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            XP Nasıl Kazanılır?
          </h2>
          <ul className="text-left space-y-2 text-sm text-gray-600">
          <li className="flex items-start">
              <svg className="w-4 h-4 text-green-500 mr-2 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Arkadaşlarınızı davet ederek bonus XP kazanın
            </li>
            <li className="flex items-start">
              <svg className="w-4 h-4 text-green-500 mr-2 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Quiz'leri tamamlayarak puan kazanın
            </li>
            
          </ul>
          <button
            onClick={() => navigate('/profile')}
            className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-md transition-colors text-sm font-medium"
          >
            Profilime Git
          </button>
        </div>
      </div>
    </div>
  );
};

export default XPWarning;
