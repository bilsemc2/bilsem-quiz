import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import FallingNumbersGame from '../components/FallingNumbersGame/FallingNumbersGame';

const FallingNumbersPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const previousState = location.state?.previousState;

  useEffect(() => {
    // Sadece ResultPage'den gelenlere izin ver
    const isComingFromResult = location.state?.fromResult === true;
    
    if (!isComingFromResult) {
      navigate('/', { 
        replace: true,
        state: { 
          error: 'Bu oyuna sadece quiz sonuç sayfasından erişilebilir!' 
        }
      });
      return;
    }
  }, [location.state, navigate]);

  return <FallingNumbersGame />;
};

export default FallingNumbersPage;
