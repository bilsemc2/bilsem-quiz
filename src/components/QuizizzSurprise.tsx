import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Card } from './ui/card';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import XPWarning from './XPWarning';

const REQUIRED_XP = 10;
const SHOW_PROBABILITY = 0.25; // 10'da 1 olasılık
const COOLDOWN_HOURS = 24; // 24 saat bekleme süresi

interface QuizizzSurpriseProps {
  currentUser: any;
}

const QuizizzSurprise: React.FC<QuizizzSurpriseProps> = ({ currentUser }) => {
  const [quizizzCode, setQuizizzCode] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [loading, setLoading] = useState(true);
  const [shouldShow, setShouldShow] = useState(false);
  const [showXPWarning, setShowXPWarning] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);

  const resetAllStates = () => {
    setQuizizzCode(null);
    setShowQR(false);
    setShowXPWarning(false);
    setShowLoginPrompt(false);
    setShouldShow(false);
  };

  const canShowSurprise = () => {
    if (!currentUser?.id) return true; // Giriş yapmamış kullanıcılar için her zaman göster

    const lastShownTime = localStorage.getItem(`lastQuizizzSurprise_${currentUser.id}`);
    if (!lastShownTime) return true;

    const lastShown = new Date(lastShownTime);
    const now = new Date();
    const hoursDiff = (now.getTime() - lastShown.getTime()) / (1000 * 60 * 60);

    return hoursDiff >= COOLDOWN_HOURS;
  };

  const updateLastShownTime = () => {
    if (currentUser?.id) {
      localStorage.setItem(`lastQuizizzSurprise_${currentUser.id}`, new Date().toISOString());
    }
  };

  const fetchQuizizzCode = async () => {
    try {
      const { data: codes, error } = await supabase
        .from('quizizz_codes')
        .select('*')
        .eq('is_active', true)
        .limit(1)
        .single();

      if (error) {
        console.error('Quizizz kodu alınırken hata:', error);
        return;
      }

      if (codes) {
        setQuizizzCode(codes.code);
      }
    } catch (error) {
      console.error('Quizizz kodu alınırken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    resetAllStates();
    
    if (!currentUser) {
      const random = Math.random();
      if (random <= SHOW_PROBABILITY && canShowSurprise()) {
        setShowLoginPrompt(true);
        updateLastShownTime();
      }
      setLoading(false);
      return;
    }

    setShowLoginPrompt(false); // Giriş yapmış kullanıcıya login prompt'u gösterme
    fetchUserProfile();
  }, [currentUser]);

  const fetchUserProfile = async () => {
    if (!currentUser?.id) return;

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('experience')
        .eq('id', currentUser.id)
        .single();

      if (error) {
        console.error('Profil bilgisi alınırken hata:', error);
        return;
      }

      setCurrentUserProfile(profile);
      if (canShowSurprise()) {
        checkShowProbability(profile.experience);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Profil bilgisi alınırken hata:', error);
    }
  };

  const checkShowProbability = (userXP: number) => {
    resetAllStates();
    
    // XP kontrolü
    if (!userXP || userXP < REQUIRED_XP) {
      const random = Math.random();
      if (random <= SHOW_PROBABILITY) {
        setShowXPWarning(true);
        updateLastShownTime();
      }
      setLoading(false);
      return;
    }

    // 10'da 1 olasılık kontrolü
    const random = Math.random();
    if (random <= SHOW_PROBABILITY) {
      setShouldShow(true);
      updateLastShownTime();
      fetchQuizizzCode();
    } else {
      setShouldShow(false);
      setLoading(false);
    }
  };

  if (loading) return null;

  const quizizzUrl = quizizzCode ? `https://quizizz.com/join?gc=${quizizzCode}` : '';

  return (
    <AnimatePresence>
      {showLoginPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed bottom-8 right-8 z-50"
        >
          <Card className="bg-white rounded-lg shadow-xl p-6 max-w-sm">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Özel Fırsatları Kaçırma! 🎯
                  </h3>
                </div>
                <button
                  onClick={() => setShowLoginPrompt(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="text-sm text-gray-600">
                <p className="mb-4">
                  Giriş yap ve özel Quizizz kodları kazanma şansı yakala! 
                  XP biriktir, arkadaşını davet et, düellolara katıl ve sürpriz ödüller kazan.
                </p>
                <Link
                  to="/login"
                  className="block w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-center"
                >
                  Hemen Giriş Yap
                </Link>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {showXPWarning && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed bottom-8 right-8 z-50"
        >
          <Card className="bg-white rounded-lg shadow-xl p-6 max-w-sm">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m0 0l4-8 4 8H6l4-8 4 8z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Özel Fırsat! 🎯
                  </h3>
                </div>
                <button
                  onClick={() => setShowXPWarning(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="text-sm text-gray-600">
                <p className="mb-2">
                  100 XP'ye ulaştığında özel Quizizz kodları kazanma şansı yakalayabilirsin!
                </p>
                <div className="mt-4">
                  <div className="bg-gray-100 rounded-full h-2 mb-2">
                    <div 
                      className="bg-blue-500 rounded-full h-2 transition-all duration-300"
                      style={{ width: `${Math.min(100, ((currentUserProfile?.experience || 0) / REQUIRED_XP) * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{currentUserProfile?.experience || 0} XP</span>
                    <span>{REQUIRED_XP} XP</span>
                  </div>
                </div>
                <p>XP Kazanma Yolları:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Quiz çözerek</li>
                  <li>Arkadaşını siteye davet ederek</li>
                  <li>Günlük giriş yaparak</li>
                </ul>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {shouldShow && quizizzCode && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed bottom-8 right-8 z-50"
        >
          <Card className="bg-white rounded-lg shadow-xl p-6 max-w-sm">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Tebrikler! 🎉
                  </h3>
                </div>
                <button
                  onClick={() => setShouldShow(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="text-sm text-gray-600">
                <p className="mb-4">
                  Özel bir Quizizz kodu kazandın! Bu kodu arkadaşlarınla paylaşabilirsin.
                </p>
                <div className="bg-gray-50 p-4 rounded-lg mb-4 text-center">
                  <p className="text-lg font-mono font-bold text-gray-800">
                    {quizizzCode}
                  </p>
                </div>
                {showQR ? (
                  <div className="flex justify-center mb-4">
                    <QRCodeSVG
                      value={`https://quizizz.com/join?gc=${quizizzCode}`}
                      size={150}
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => setShowQR(true)}
                    className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors mb-4"
                  >
                    QR Kodu Göster
                  </button>
                )}
                <a
                  href={`https://quizizz.com/join?gc=${quizizzCode}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-center"
                >
                  Quizizz'e Git
                </a>
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default QuizizzSurprise;
