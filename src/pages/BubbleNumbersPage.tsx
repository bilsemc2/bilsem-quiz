import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import BubbleNumbersGame from '../components/BubbleNumbersGame/BubbleNumbersGame';

const BubbleNumbersPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Sadece ResultPage'den gelenlere ve 7+ doğru cevabı olanlara izin ver
    const isComingFromResult = location.state?.fromResult === true;
    const correctAnswers = location.state?.previousState?.correctAnswers || 0;
    
    if (!isComingFromResult || correctAnswers < 7) {
      navigate('/', { 
        replace: true,
        state: { 
          error: 'Bu oyuna erişmek için quiz\'de en az 7 doğru yapmalısınız!' 
        }
      });
      return;
    }
  }, [location.state, navigate]);

  return <BubbleNumbersGame />;
};

export default BubbleNumbersPage;
