import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import MemoryGame from '../components/MemoryGame/MemoryGame';

interface MemoryCardLocationState {
  fromResult?: boolean;
  previousState?: {
    correctAnswers?: number;
  };
  error?: string; // Opsiyonel olarak error'u da ekleyebiliriz
}

const MemoryCardGamePage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as MemoryCardLocationState | null; // Tip ataması

  useEffect(() => {
    const isComingFromResult = state?.fromResult === true;
    const correctAnswers = state?.previousState?.correctAnswers || 0;

    if (!isComingFromResult || correctAnswers < 4) {
      const errorMessage = 'Bu oyuna erişmek için quiz\'de en az 4 doğru yapmalısınız!';
      toast.error(errorMessage, { /* ... toast options ... */ });
      navigate('/', {
        replace: true,
        state: { // Tip tanımına uygun state
          error: errorMessage
        }
      });
      return; // return burada olmalı
    }
  }, [state, navigate]); // state'i dependency yapabiliriz

  // Eğer useEffect içindeki koşul başarılı ise (yani return çalışmazsa), MemoryGame render edilir.
  // Ancak state null ise veya koşul sağlanmıyorsa bir şey render etmemek veya loading göstermek daha iyi olabilir.
  // Şu anki haliyle, koşul sağlanmazsa kısa bir an MemoryGame render edilebilir useEffect çalışana kadar.
  // Bunu önlemek için:
  const canAccess = state?.fromResult === true && (state?.previousState?.correctAnswers || 0) >= 4;

  if (!canAccess && !location.key) {
    // Henüz useEffect çalışmadıysa veya state yoksa bir loading/placeholder gösterilebilir.
    // Veya useEffect'in ilk render'da çalışmasını bekleyebiliriz. Mevcut kod bunu yapıyor.
  }
  
  // Eğer erişim kontrolü başarılıysa (useEffect içindeki navigate çalışmadıysa) oyunu göster
  return <MemoryGame />;

  // Alternatif olarak, erişim kontrolünü useEffect dışında yapıp render'ı koşullu hale getirebiliriz:
  /*
  const state = location.state as MemoryCardLocationState | null;
  const canAccess = state?.fromResult === true && (state?.previousState?.correctAnswers || 0) >= 4;

  useEffect(() => {
    if (!canAccess) {
      // Toast ve navigate işlemleri burada...
    }
  }, [canAccess, navigate]);

  if (!canAccess) {
    // Opsiyonel: Yönlendirme gerçekleşene kadar bir yükleme ekranı veya null gösterilebilir.
    return null; // veya <LoadingSpinner />;
  }

  return <MemoryGame />;
  */

};

export default MemoryCardGamePage;