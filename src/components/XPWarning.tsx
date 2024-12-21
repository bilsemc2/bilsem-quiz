import React from 'react';
import { useNavigate } from 'react-router-dom';

interface XPWarningProps {
  requiredXP: number;
  currentXP: number;
  title: string;
}

const XPWarning = ({ requiredXP, currentXP, title }: XPWarningProps) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-white py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="text-center space-y-6">
          <div className="w-24 h-24 bg-purple-100 rounded-full mx-auto flex items-center justify-center">
            <svg className="w-12 h-12 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900">
            {title}
          </h1>
          
          <p className="text-lg text-gray-600 max-w-lg mx-auto">
            Bu özelliği kullanmak için en az {requiredXP} XP'ye ihtiyacınız var. 
            Şu anda {currentXP || 0} XP'niz bulunuyor.
          </p>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              XP Nasıl Kazanılır?
            </h2>
            <ul className="text-left space-y-3 text-gray-600">
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mr-2 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Quiz'leri tamamlayarak puan kazanın
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mr-2 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Bulmacaları çözerek deneyim puanı kazanın
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mr-2 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Arkadaşlarınızı davet ederek bonus XP kazanın
              </li>
            </ul>
            <div className="mt-6">
              <button
                onClick={() => navigate('/profile')}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-md transition-colors"
              >
                Profilime Git
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default XPWarning;
