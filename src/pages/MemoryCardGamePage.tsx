import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import MemoryGame from '../components/MemoryGame/MemoryGame';

const MemoryCardGamePage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Sadece ResultPage'den gelenlere ve 4+ doğru cevabı olanlara izin ver
    const isComingFromResult = location.state?.fromResult === true;
    const correctAnswers = location.state?.previousState?.correctAnswers || 0;
    
    if (!isComingFromResult || correctAnswers < 4) {
      toast.error('Bu oyuna erişmek için quiz\'de en az 4 doğru yapmalısınız!', {
        duration: 5000,
        position: 'top-center',
        style: {
          border: '1px solid #E57373',
          padding: '16px',
          color: '#D32F2F',
          fontWeight: 'bold',
        },
        icon: '🚫',
      });
      
      navigate('/', { 
        replace: true,
        state: { 
          error: 'Bu oyuna erişmek için quiz\'de en az 4 doğru yapmalısınız!' 
        }
      });
      return;
    }
  }, [location.state, navigate]);

  return <MemoryGame />;
};

export default MemoryCardGamePage;
