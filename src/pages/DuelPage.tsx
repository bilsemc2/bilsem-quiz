import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useXPCheck } from '../hooks/useXPCheck';
import { useUser } from '../hooks/useUser';
import XPWarning from '../components/XPWarning';
import DuelQuestion from '../components/DuelQuestion';
import { generateQuiz } from '../utils/quizGenerator';
import toast from 'react-hot-toast';

// Window tipine lastAction özelliğini ekle
declare global {
  interface Window {
    lastAction: string;
  }
}

// Global lastAction değişkenini tanımla
window.lastAction = window.lastAction || '';

interface User {
  id: string;
  name: string;
  full_name: string;
  avatar_url: string;
  points: number;
  experience: number;
  is_admin: boolean;
  created_at: string;
  referred_by: string;
  email: string;
}

const DuelPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [duels, setDuels] = useState<any[]>([]);
  const [activeDuel, setActiveDuel] = useState<any>(null);
  const [showQuestion, setShowQuestion] = useState(false);
  const [selectedDuel, setSelectedDuel] = useState<any>(null);
  const [showDuelDetails, setShowDuelDetails] = useState(false);

  const { currentUser, loading: userLoading } = useUser();
  const { hasEnoughXP, userXP, requiredXP, loading: xpLoading } = useXPCheck(
    userLoading || !currentUser?.id);

  useEffect(() => {
    if (currentUser?.id) {
      fetchInvitedUsers();
      fetchDuels();
    }
  }, [currentUser]);

  const fetchInvitedUsers = async () => {
    if (!currentUser?.id) {
      console.log('Oturum açmış kullanıcı bulunamadı');
      return;
    }

    try {
      const { data: currentUserProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (profileError) {
        console.error('Kullanıcı profili alınamadı:', profileError);
        throw profileError;
      }

      // Kullanıcının davet ettiği kişiler
      const { data: invitedByMe, error: invitedError } = await supabase
        .from('profiles')
        .select('*')
        .eq('referred_by', currentUserProfile.referral_code)
        .neq('id', currentUser.id);

      if (invitedError) {
        console.error('Davet edilen kullanıcılar alınamadı:', invitedError);
        throw invitedError;
      }

      // Kullanıcıyı davet eden kişi
      const { data: invitedByOthers, error: referrerError } = await supabase
        .from('profiles')
        .select('*')
        .eq('referral_code', currentUserProfile.referred_by)
        .neq('id', currentUser.id);

      if (referrerError) {
        console.error('Davet eden kullanıcı alınamadı:', referrerError);
        throw referrerError;
      }

      // YENİ: Aynı kişi tarafından davet edilmiş kullanıcılar (sınıf arkadaşları)
      const { data: classmates, error: classmatesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('referred_by', currentUserProfile.referred_by) // Aynı kişi tarafından davet edilenler
        .neq('id', currentUser.id); // Kendisi hariç

      if (classmatesError) {
        console.error('Sınıf arkadaşları alınamadı:', classmatesError);
        throw classmatesError;
      }

      // Tüm ilişkili kullanıcıları birleştir
      const allRelatedUsers = [
        ...(invitedByMe || []), 
        ...(invitedByOthers || []),
        ...(classmates || [])
      ];
      
      // Tekrarlı kullanıcıları çıkar (aynı kişi birden fazla kategoride olabilir)
      const uniqueUsers = allRelatedUsers.filter((user, index, self) =>
        index === self.findIndex((u) => u.id === user.id)
      );

      const formattedUsers: User[] = uniqueUsers.map(profile => ({
        id: profile.id,
        name: profile.name,
        full_name: profile.full_name || '',
        avatar_url: profile.avatar_url,
        points: profile.points || 0,
        is_admin: profile.is_admin || false,
        experience: profile.experience,
        referred_by: profile.referred_by,
        email: profile.email,
        created_at: profile.created_at
      }));

      setUsers(formattedUsers);
    } catch (error) {
      console.error('Error fetching related users:', error);
      setUsers([]);
    }
  };

  const fetchDuels = async () => {
    try {
      const { data: duels, error } = await supabase
        .from('duels')
        .select(`
          id,
          status,
          challenger_id,
          challenged_id,
          question_data,
          created_at,
          completed_at,
          challenger_answer,
          challenged_answer,
          result,
          challenger:profiles!challenger_id(id, name, email),
          challenged:profiles!challenged_id(id, name, email)
        `)
        .or(`challenger_id.eq.${currentUser?.id},challenged_id.eq.${currentUser?.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching duels:', error);
        return;
      }

      if (duels) {
        setDuels(duels);
      }
    } catch (error) {
      console.error('Error in fetchDuels:', error);
    }
  };

  const handleChallenge = async (user: User) => {
    if (!currentUser) return;
    
    try {
      if (!currentUser?.id) {
        console.error('Düello başlatılamadı: Kullanıcı girişi yapılmamış!');
        return;
      }

      const now = new Date().toISOString();
      
      const quiz = await generateQuiz(1); // Sadece 1 soru istiyoruz
      const randomQuestion = quiz.questions[0]; // İlk soruyu al

      const duelData = {
        challenger_id: currentUser.id,
        challenged_id: user.id,
        status: 'pending',
        created_at: now,
        question_data: JSON.stringify({
          id: randomQuestion.id,
          text: `Soru ${randomQuestion.id}`,
          questionImageUrl: randomQuestion.questionImageUrl,
          options: randomQuestion.options,
          correctOptionId: randomQuestion.correctOptionId
        })
      };

      const { error } = await supabase
        .from('duels')
        .insert([duelData])
        .select()
        .single();

      if (!error) {
        await fetchDuels();
        toast.success(`${user.name} kullanıcısına düello daveti gönderildi! Karşı tarafın kabul etmesini bekleyin.`, {
          duration: 4000,
          style: {
            border: '1px solid #4CAF50',
            padding: '16px',
            color: '#1e3a8a',
          },
          iconTheme: {
            primary: '#4CAF50',
            secondary: '#FFFAEE',
          },
        });
      } else {
        console.error('Error creating duel:', error);
        toast.error('Düello daveti gönderilirken bir hata oluştu.', {
          duration: 4000,
          style: {
            border: '1px solid #E53E3E',
            padding: '16px',
            color: '#E53E3E',
          },
        });
      }
    } catch (error) {
      console.error('Error in handleChallenge:', error);
    }
  };



  const acceptDuel = async (duelId: string) => {
    if (!currentUser) return;
    
    try {
      // Kabul etme işlemini kaydet
      window.lastAction = 'accept_duel';
      
      const { error: updateError } = await supabase
        .from('duels')
        .update({ status: 'in_progress' })
        .eq('id', duelId);

      if (updateError) {
        console.error('Error updating duel status:', updateError);
        return;
      }

      await checkActiveDuel();
      toast.success('Düello başladı! Soruyu cevaplayabilirsiniz.', {
        duration: 4000,
        style: {
          border: '1px solid #4CAF50',
          padding: '16px',
          color: '#1e3a8a',
        },
        iconTheme: {
          primary: '#4CAF50',
          secondary: '#FFFAEE',
        },
      });
    } catch (error) {
      console.error('Error in acceptDuel:', error);
    }
  };

  const checkActiveDuel = async () => {
    if (!currentUser) return;
    
    try {
      const { data: duels, error } = await supabase
        .from('duels')
        .select(`
          id,
          status,
          challenger_id,
          challenged_id,
          question_data,
          challenger_answer,
          challenged_answer,
          challenger:profiles!challenger_id(id, name, email),
          challenged:profiles!challenged_id(id, name, email)
        `)
        .eq('status', 'in_progress')
        .or(`challenger_id.eq.${currentUser?.id},challenged_id.eq.${currentUser?.id}`)
        .order('created_at', { ascending: false });

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching active duel:', error);
        return;
      }

      const activeDuel = duels?.[0];
      if (activeDuel) {
        // Yeni düelloyu state'e kayıt edelim
        setActiveDuel(activeDuel);
        
        // Düello kabul edildiğinde veya aktif bir düello varsa soru ekranını göster
        if (window.lastAction === 'accept_duel' || activeDuel.status === 'in_progress') {
          const questionData = activeDuel.question_data ? JSON.parse(activeDuel.question_data) : null;
          
          // Kullanıcı düelloyu gönderen mi yoksa kabul eden mi?
          const isChallenger = activeDuel.challenger_id === currentUser?.id;
          const isChallenged = activeDuel.challenged_id === currentUser?.id;
          
          // Eğer kullanıcı düelloya dahilse ve henüz cevap vermediyse
          const challengerAnswered = activeDuel.challenger_answer;
          const challengedAnswered = activeDuel.challenged_answer;
          
          // Gönderen henüz cevaplamarruşsa ve gönderen ise veya
          // Kabul eden henüz cevaplamamışsa ve kabul eden ise
          if ((isChallenger && !challengerAnswered) || (isChallenged && !challengedAnswered)) {
            if (questionData) {
              setShowQuestion(true);
            }
          }
          
          // İşlem tamamlandı, son işlemi sıfırla
          window.lastAction = '';
        }
      } else {
        setActiveDuel(null);
        setShowQuestion(false);
      }
    } catch (error) {
      console.error('Error in checkActiveDuel:', error);
    }
  };

  const handleSubmitAnswer = async (duelId: string, answer: string, isChallenger: boolean) => {
    if (!currentUser) return;
    
    try {
      const updateField = isChallenger ? 'challenger_answer' : 'challenged_answer';
      
      const { error: updateError } = await supabase
        .from('duels')
        .update({ [updateField]: answer })
        .eq('id', duelId);

      if (updateError) {
        console.error('Error updating answer:', updateError);
        return;
      }

      const { data: duel } = await supabase
        .from('duels')
        .select('challenger_answer, challenged_answer, question_data')
        .eq('id', duelId)
        .single();

      if (duel?.challenger_answer && duel?.challenged_answer) {
        const questionData = JSON.parse(duel.question_data);
        const correctAnswer = questionData.correctOptionId;
        
        let result = 'draw';
        if (duel.challenger_answer === correctAnswer && duel.challenged_answer !== correctAnswer) {
          result = 'challenger_won';
        } else if (duel.challenged_answer === correctAnswer && duel.challenger_answer !== correctAnswer) {
          result = 'challenged_won';
        }

        await supabase
          .from('duels')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            result
          })
          .eq('id', duelId);

        await fetchDuels();
      }

      // Önce aktif düelloru kapatıyoruz, sonra checkActiveDuel çağrılıyor
      setActiveDuel(null);
      setShowQuestion(false);
      
      // Son olarak aktiveDuel'i güncelleyelim
      await checkActiveDuel();
    } catch (error) {
      console.error('Error in handleSubmitAnswer:', error);
    }
  };

  const getDuelResultText = (duel: any) => {
    if (!duel.result) return '';
    
    const challenger = duel.challenger?.name;
    const challenged = duel.challenged?.name;
    const question = {
      text: duel.question_data ? JSON.parse(duel.question_data).text : '',
      correctOptionId: duel.question_data ? JSON.parse(duel.question_data).correctOptionId : ''
    };
    
    const correctAnswer = question.correctOptionId;
    const challengerAnswer = duel.challenger_answer;
    const challengedAnswer = duel.challenged_answer;
    
    const challengerCorrect = challengerAnswer === correctAnswer;
    const challengedCorrect = challengedAnswer === correctAnswer;

    if (duel.result === 'draw') {
      if (challengerCorrect && challengedCorrect) {
        return 'İki oyuncu da doğru cevapladı - Berabere!';
      } else if (!challengerCorrect && !challengedCorrect) {
        return 'İki oyuncu da yanlış cevapladı - Berabere!';
      }
      return 'Berabere';
    } else if (duel.result === 'challenger_won') {
      return `${challenger} doğru cevapladı ve kazandı!`;
    } else if (duel.result === 'challenged_won') {
      return `${challenged} doğru cevapladı ve kazandı!`;
    }
    return '';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error, dateString);
      return '-';
    }
  };

  const renderDuelCard = (duel: any) => {
    const isChallenger = duel.challenger_id === currentUser?.id;
    const opponent = isChallenger ? duel.challenged : duel.challenger;

    return (
      <div key={duel.id} className="bg-white border rounded-xl shadow-sm hover:shadow-md transition-shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <img
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(opponent?.email || '')}`}
              alt={opponent?.name}
              className="w-12 h-12 rounded-full border-2 border-purple-200"
            />
            <div>
              <h3 className="font-semibold text-lg">{opponent?.name}</h3>
              <p className="text-sm text-gray-500">{formatDate(duel.created_at)}</p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            duel.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            duel.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
            duel.status === 'completed' ? 'bg-green-100 text-green-800' : ''
          }`}>
            {duel.status === 'pending' ? 'Bekliyor' :
             duel.status === 'in_progress' ? 'Devam Ediyor' :
             duel.status === 'completed' ? 'Tamamlandı' : duel.status}
          </div>
        </div>

        {duel.status === 'completed' && (
          <div className="mt-4 space-y-3">
            <div className="text-center font-medium text-lg">
              {getDuelResultText(duel)}
            </div>
            <button
              onClick={() => {
                setSelectedDuel(duel);
                setShowDuelDetails(true);
              }}
              className="w-full mt-2 px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition-colors"
            >
              Soru Detaylarını Gör
            </button>
          </div>
        )}

        {duel.status === 'pending' && !isChallenger && (
          <button
            onClick={() => acceptDuel(duel.id)}
            className="w-full mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            Düelloyu Kabul Et
          </button>
        )}
      </div>
    );
  };

  const renderDuelDetails = () => {
    if (!selectedDuel || !showDuelDetails) return null;

    const questionData = selectedDuel.question_data ? JSON.parse(selectedDuel.question_data) : null;
    const isChallenger = selectedDuel.challenger_id === currentUser?.id;
    const myAnswer = isChallenger ? selectedDuel.challenger_answer : selectedDuel.challenged_answer;
    const opponentAnswer = isChallenger ? selectedDuel.challenged_answer : selectedDuel.challenger_answer;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">Düello Detayları</h3>
            <button
              onClick={() => setShowDuelDetails(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {questionData && (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium mb-2">Soru</h4>
                <p>{questionData.text}</p>
                {questionData.questionImageUrl && (
                  <img
                    src={questionData.questionImageUrl}
                    alt="Soru görseli"
                    className="mt-4 rounded-lg max-h-64 mx-auto"
                  />
                )}
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium mb-2">Doğru Cevap</h4>
                  <p className="text-green-700 font-medium">
                    {questionData.options.find((opt: any) => opt.id === questionData.correctOptionId)?.text || '-'}
                  </p>
                  {questionData.options.find((opt: any) => opt.id === questionData.correctOptionId)?.imageUrl && (
                    <img 
                      src={questionData.options.find((opt: any) => opt.id === questionData.correctOptionId)?.imageUrl} 
                      alt="Doğru cevap" 
                      className="mt-2 max-h-32 mx-auto rounded-md"
                    />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-medium mb-2">Sizin Cevabınız</h4>
                    <div className={`${!myAnswer ? 'text-gray-600' : (myAnswer === questionData.correctOptionId ? 'text-green-600 font-medium' : 'text-red-600 font-medium')}`}>
                      <p>
                        {selectedDuel.status === 'completed' 
                          ? (!myAnswer
                              ? 'Süre doldu / Yanıtlamadı'
                              : questionData.options.find((opt: any) => opt.id === myAnswer)?.text)
                          : (!myAnswer
                              ? 'Henüz cevaplanmadı'
                              : questionData.options.find((opt: any) => opt.id === myAnswer)?.text)
                        }
                      </p>
                      {myAnswer && questionData.options.find((opt: any) => opt.id === myAnswer)?.imageUrl && (
                        <img 
                          src={questionData.options.find((opt: any) => opt.id === myAnswer)?.imageUrl} 
                          alt="Sizin cevabınız" 
                          className="mt-2 max-h-24 mx-auto rounded-md"
                        />
                      )}
                    </div>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4">
                    <h4 className="font-medium mb-2">Rakip Cevabı</h4>
                    <div className={`${!opponentAnswer ? 'text-gray-600' : (opponentAnswer === questionData.correctOptionId ? 'text-green-600 font-medium' : 'text-red-600 font-medium')}`}>
                      <p>
                        {selectedDuel.status === 'completed'
                          ? (!opponentAnswer
                              ? 'Süre doldu / Yanıtlamadı'
                              : questionData.options.find((opt: any) => opt.id === opponentAnswer)?.text)
                          : (!opponentAnswer
                              ? 'Henüz cevaplanmadı'
                              : questionData.options.find((opt: any) => opt.id === opponentAnswer)?.text)
                        }
                      </p>
                      {opponentAnswer && questionData.options.find((opt: any) => opt.id === opponentAnswer)?.imageUrl && (
                        <img 
                          src={questionData.options.find((opt: any) => opt.id === opponentAnswer)?.imageUrl} 
                          alt="Rakip cevabı" 
                          className="mt-2 max-h-24 mx-auto rounded-md"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {questionData.solutionVideo && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Çözüm Videosu</h4>
                  <div className="aspect-w-16 aspect-h-9">
                    <iframe
                      src={questionData.solutionVideo}
                      className="w-full rounded-lg"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (currentUser?.id) {
      const initialize = async () => {
        await Promise.all([
          fetchInvitedUsers(),
          fetchDuels(),
          checkActiveDuel()
        ]);
      };
      initialize();

      const interval = setInterval(async () => {
        await Promise.all([
          checkActiveDuel(),
          fetchDuels()
        ]);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser?.id) return;

    const duelsSubscription = supabase
      .channel('duels-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'duels',
          filter: `challenger_id=eq.${currentUser.id},challenged_id=eq.${currentUser.id}`
        },
        () => {
          fetchDuels();
        }
      )
      .subscribe();

    return () => {
      duelsSubscription.unsubscribe();
    };
  }, [currentUser?.id]);

  if (userLoading || xpLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!hasEnoughXP) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <XPWarning
          requiredXP={requiredXP}
          currentXP={userXP}
          title="Düello sayfasına erişim için yeterli XP'niz yok"
        />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto p-4 pt-20">
          {showQuestion && activeDuel && (
            <DuelQuestion
              duelId={activeDuel.id}
              question={activeDuel.question_data ? JSON.parse(activeDuel.question_data) : null}
              isChallenger={activeDuel.challenger_id === currentUser?.id}
              onSubmitAnswer={handleSubmitAnswer}
              onClose={() => setShowQuestion(false)}
            />
          )}

          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">Düello Nasıl Oynanır?</h2>
            <div className="space-y-4 text-gray-600">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0">1</div>
                <p>Düello başlatmak için aşağıdaki listeden bir rakip seçin. Rakibinize düello daveti gönderilecek.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0">2</div>
                <p>Rakibiniz düelloyu kabul ettiğinde her iki tarafa da aynı soru gösterilecek. Soruyu cevaplamak için 30 saniyeniz var!</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0">3</div>
                <p>Her iki taraf da cevap verdiğinde düello sonuçlanır. Doğru cevap veren kazanır, eşitlik durumunda berabere kalırsınız.</p>
              </div>
              <div className="mt-4 p-4 bg-yellow-50 rounded-lg text-yellow-800">
                <strong>Not:</strong> Düello başlatmak için yeterli XP'ye sahip olmanız gerekir. XP'nizi artırmak için egzersiz sorularını çözebilirsiniz.
              </div>
            </div>
          </div>

          {duels.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Düellolarım</h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setDuels(duels.filter(d => d.status === 'pending'))}
                    className="px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                  >
                    Bekleyenler
                  </button>
                  <button
                    onClick={() => setDuels(duels.filter(d => d.status === 'in_progress'))}
                    className="px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 hover:bg-blue-200"
                  >
                    Devam Edenler
                  </button>
                  <button
                    onClick={() => setDuels(duels.filter(d => d.status === 'completed'))}
                    className="px-3 py-1 rounded-full text-sm bg-green-100 text-green-800 hover:bg-green-200"
                  >
                    Tamamlananlar
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {duels.map(duel => renderDuelCard(duel))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">Düello Başlat</h2>
            <input
              type="text"
              placeholder="İsim ile ara..."
              value=""
              onChange={() => {}}
              className="w-full p-2 mb-4 border rounded"
            />
            {users.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-gray-600">Henüz davet ettiğiniz arkadaşınız bulunmuyor.</p>
                <p className="text-sm text-gray-500 mt-2">
                  Arkadaşlarınızı davet etmek için profil sayfanızdaki referans kodunu paylaşabilirsiniz.
                  Sadece davet ettiğiniz arkadaşlarınızla düello yapabilirsiniz.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <img
                        src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.email)}`}
                        alt={user.name}
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <p className="font-medium">{user.name}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleChallenge(user)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Düello
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {renderDuelDetails()}
    </>
  );
};

export default DuelPage;
