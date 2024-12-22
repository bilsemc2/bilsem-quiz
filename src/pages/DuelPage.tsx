import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types/user';
import { Question } from '../types/quiz';
import { generateQuiz } from '../utils/quizGenerator';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import XPWarning from '@/components/XPWarning';

const REQUIRED_XP = 1000;

const DuelPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [duelStatus, setDuelStatus] = useState<'waiting' | 'in_progress' | 'completed'>('waiting');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pendingDuels, setPendingDuels] = useState<any[]>([]);
  const [completedDuels, setCompletedDuels] = useState<any[]>([]);
  const [activeDuel, setActiveDuel] = useState<any>(null);
  const [answer, setAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [hasEnoughXP, setHasEnoughXP] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser?.id) {
      fetchDuels();
      checkXPRequirement();
    }
  }, [currentUser]);

  const checkXPRequirement = async () => {
    if (!currentUser?.id) return;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('experience')
      .eq('id', currentUser.id)
      .single();

    if (error) {
      console.error('XP bilgisi alınırken hata:', error);
      return;
    }

    setHasEnoughXP(profile.experience >= REQUIRED_XP);
  };

  const fetchUsers = async () => {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .order('name');
    
    if (profiles) {
      setUsers(profiles);
    } else if (error) {
      console.error('Kullanıcılar yüklenirken hata:', error);
    }
  };

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (data) {
        setCurrentUser(data);
      }
    }
  };

  const fetchDuels = async () => {
    if (!currentUser?.id) return;

    try {
      const { data: duels, error } = await supabase
        .from('duels')
        .select(`
          id,
          status,
          challenger_id,
          challenged_id,
          question_id,
          created_at,
          completed_at,
          challenger_answer,
          challenged_answer,
          result,
          challenger:profiles!challenger_id(id, name, email),
          challenged:profiles!challenged_id(id, name, email),
          question:questions!question_id(*)
        `)
        .or(`challenger_id.eq.${currentUser.id},challenged_id.eq.${currentUser.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching duels:', error);
        return;
      }

      if (duels) {
        console.log('Fetched duels:', duels);
        const completed = duels.filter(duel => duel.status === 'completed');
        console.log('Last completed duels:', completed.slice(0, 2));
        setPendingDuels(duels.filter(duel => duel.status === 'pending'));
        setCompletedDuels(completed);
      }
    } catch (error) {
      console.error('Error in fetchDuels:', error);
    }
  };

  const fetchRandomQuestion = async () => {
    const quiz = generateQuiz();
    // Rastgele bir soru seç
    const randomQuestion = quiz.questions[Math.floor(Math.random() * quiz.questions.length)];
    
    console.log('Random question:', randomQuestion);

    // Önce soruyu oluşturmayı deneyelim
    const { data: newQuestion, error: insertError } = await supabase
      .from('questions')
      .insert([{
        text: `Soru ${randomQuestion.id}`,
        question_image_url: randomQuestion.questionImageUrl,
        options: randomQuestion.options,
        correct_option_id: randomQuestion.correctOptionId,
        solution_video: randomQuestion.solutionVideo,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (insertError) {
      console.error('Error creating question:', insertError);
      return null;
    }

    console.log('Created question:', newQuestion);
    return newQuestion;
  };

  const sendDuelRequest = async (challengedUser: User) => {
    if (currentUser?.id === challengedUser.id) {
      alert('Kendinize düello daveti gönderemezsiniz!');
      return;
    }

    const existingDuel = pendingDuels.find(
      duel => 
        (duel.challenger_id === currentUser?.id && duel.challenged_id === challengedUser.id) ||
        (duel.challenger_id === challengedUser.id && duel.challenged_id === currentUser?.id)
    );

    if (existingDuel) {
      alert('Bu kullanıcı ile zaten bekleyen bir düellonuz var!');
      return;
    }

    const randomQuestion = await fetchRandomQuestion();
    console.log('Random question for duel:', randomQuestion);

    if (randomQuestion && currentUser) {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('duels')
        .insert([{
          challenger_id: currentUser.id,
          challenged_id: challengedUser.id,
          question_id: randomQuestion.id,
          status: 'pending',
          created_at: now
        }]);

      if (!error) {
        setDuelStatus('waiting');
        alert(`${challengedUser.name} kullanıcısına düello daveti gönderildi!`);
        fetchDuels();
      } else {
        console.error('Error creating duel:', error);
        alert('Düello daveti gönderilirken bir hata oluştu.');
      }
    }
  };

  const acceptDuel = async (duelId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('duels')
        .update({ status: 'in_progress' })
        .eq('id', duelId);

      if (updateError) {
        console.error('Error updating duel status:', updateError);
        return;
      }

      await checkActiveDuel();
    } catch (error) {
      console.error('Error in acceptDuel:', error);
    }
  };

  const checkActiveDuel = async () => {
    if (!currentUser?.id) return;

    try {
      const { data: duels, error } = await supabase
        .from('duels')
        .select(`
          id,
          status,
          challenger_id,
          challenged_id,
          question_id,
          challenger:profiles!challenger_id(id, name, email),
          challenged:profiles!challenged_id(id, name, email),
          question:questions!question_id(*)
        `)
        .eq('status', 'in_progress')
        .or(`challenger_id.eq.${currentUser.id},challenged_id.eq.${currentUser.id}`);

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching active duel:', error);
        return;
      }

      const activeDuel = duels?.[0];
      if (activeDuel) {
        console.log('Found active duel:', activeDuel);
        setActiveDuel(activeDuel);
        setDuelStatus('in_progress');
        setCurrentQuestion(activeDuel.question);
      } else {
        setActiveDuel(null);
        setDuelStatus('waiting');
        setCurrentQuestion(null);
      }
    } catch (error) {
      console.error('Error in checkActiveDuel:', error);
    }
  };

  useEffect(() => {
    if (currentUser?.id) {
      const initialize = async () => {
        await fetchDuels();
        await checkActiveDuel();
      };
      initialize();
    }
  }, [currentUser]);

  const getDuelResultText = (duel: any, isChallenger: boolean) => {
    if (!duel.result) return '';
    
    const challenger = duel.challenger?.name;
    const challenged = duel.challenged?.name;
    const question = duel.question;
    
    // Cevapları kontrol et
    const correctAnswer = question?.correct_option_id;
    const challengerAnswer = duel.challenger_answer;
    const challengedAnswer = duel.challenged_answer;
    
    const challengerCorrect = challengerAnswer === correctAnswer;
    const challengedCorrect = challengedAnswer === correctAnswer;

    // Cevap detaylarını logla
    console.log(`Düello #${duel.id} sonuçları:`, {
      soru: question?.text,
      dogruCevap: correctAnswer,
      challengerCevap: challengerAnswer,
      challengedCevap: challengedAnswer,
      challengerDogru: challengerCorrect,
      challengedDogru: challengedCorrect
    });

    if (duel.result === 'draw') {
      if (challengerCorrect && challengedCorrect) {
        return '🤝 İki oyuncu da doğru cevapladı - Berabere!';
      } else if (!challengerCorrect && !challengedCorrect) {
        return '🤝 İki oyuncu da yanlış cevapladı - Berabere!';
      }
      return '🤝 Berabere';
    } else if (duel.result === 'challenger_won') {
      return `🏆 ${challenger} doğru cevapladı ve kazandı!`;
    } else if (duel.result === 'challenged_won') {
      return `🏆 ${challenged} doğru cevapladı ve kazandı!`;
    }
    return '';
  };

  const submitAnswer = async () => {
    if (!activeDuel || !answer) return;

    const isChallenger = activeDuel.challenger_id === currentUser?.id;
    const updateField = isChallenger ? 'challenger_answer' : 'challenged_answer';

    const now = new Date().toISOString();
    const { error } = await supabase
      .from('duels')
      .update({ 
        [updateField]: answer,
        ...(isChallenger ? { challenger_answered_at: now } : { challenged_answered_at: now })
      })
      .eq('id', activeDuel.id);

    if (!error) {
      const { data: updatedDuel } = await supabase
        .from('duels')
        .select('*, question:questions!question_id(*)')
        .eq('id', activeDuel.id)
        .single();

      if (updatedDuel?.challenger_answer && updatedDuel?.challenged_answer) {
        const correctAnswer = updatedDuel.question.correct_option_id;
        const challengerAnswer = updatedDuel.challenger_answer;
        const challengedAnswer = updatedDuel.challenged_answer;
        
        const challengerCorrect = challengerAnswer === correctAnswer;
        const challengedCorrect = challengedAnswer === correctAnswer;
        
        let result = 'draw';
        if (challengerCorrect && !challengedCorrect) result = 'challenger_won';
        if (!challengerCorrect && challengedCorrect) result = 'challenged_won';

        console.log('Düello sonucu:', {
          soru: updatedDuel.question.text,
          dogruCevap: correctAnswer,
          challengerCevap: challengerAnswer,
          challengedCevap: challengedAnswer,
          challengerDogru: challengerCorrect,
          challengedDogru: challengedCorrect,
          sonuc: result
        });

        await supabase
          .from('duels')
          .update({ 
            status: 'completed',
            completed_at: now,
            result: result
          })
          .eq('id', activeDuel.id);

        // Düello tamamlandıktan sonra listeleri güncelle
        await fetchDuels();
      }

      setDuelStatus('completed');
      setActiveDuel(null);
      setAnswer('');
      navigate('/duel');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      console.log('Formatting date:', dateString);
      const date = new Date(dateString);
      console.log('Parsed date:', date);
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
    const otherUserId = isChallenger ? duel.challenged_id : duel.challenger_id;
    const otherUser = users.find(u => u.id === otherUserId);

    let statusText = 'Bekliyor';
    let resultText = '';
    let resultClass = '';

    if (duel.status === 'completed') {
      const challenger = duel.challenger?.name;
      const challenged = duel.challenged?.name;

      if (duel.result === 'draw') {
        resultText = '🤝 Berabere!';
        resultClass = 'text-yellow-600';
      } else if (duel.result === 'challenger_won') {
        resultText = `🏆 ${challenger} kazandı!`;
        resultClass = isChallenger ? 'text-green-600' : 'text-red-600';
      } else if (duel.result === 'challenged_won') {
        resultText = `🏆 ${challenged} kazandı!`;
        resultClass = !isChallenger ? 'text-green-600' : 'text-red-600';
      }
      statusText = resultText;
    }

    console.log('Duel dates:', {
      created_at: duel.created_at,
      completed_at: duel.completed_at
    });

    return (
      <div key={duel.id} className="border p-4 rounded-lg mb-4 bg-white shadow-md">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">
              {isChallenger ? `${otherUser?.name}'e meydan okudun` : `${otherUser?.name} sana meydan okudu`}
            </h3>
            <p className={`font-medium ${resultClass}`}>{statusText}</p>
            <div className="mt-2 text-sm text-gray-600">
              <p>Meydan Okuyan: {duel.challenger?.name}</p>
              <p>Meydan Okunan: {duel.challenged?.name}</p>
              {duel.status === 'completed' ? (
                <p>Tamamlanma: {formatDate(duel.completed_at)}</p>
              ) : (
                <p>Oluşturulma: {formatDate(duel.created_at)}</p>
              )}
            </div>
          </div>
          {duel.status === 'pending' && !isChallenger && (
            <button
              onClick={() => acceptDuel(duel.id)}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Kabul Et
            </button>
          )}
        </div>
      </div>
    );
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (duelStatus === 'in_progress' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            submitAnswer();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [duelStatus, timeLeft]);

  const filteredUsers = users.filter(user => 
    user.id !== currentUser?.id &&
    (user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     user.email?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Realtime subscription ekle
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
          console.log('Düello değişikliği algılandı, liste güncelleniyor...');
          fetchDuels();
        }
      )
      .subscribe();

    return () => {
      duelsSubscription.unsubscribe();
    };
  }, [currentUser?.id]);

  const handleChallenge = (userId: string) => {
    const challengedUser = users.find(user => user.id === userId);
    if (challengedUser) {
      sendDuelRequest(challengedUser);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {!hasEnoughXP ? (
        <div className="flex items-center justify-center min-h-[80vh]">
          <XPWarning
            requiredXP={REQUIRED_XP}
            currentXP={currentUser?.experience || 0}
            title="Düello için XP Yetersiz"
          />
        </div>
      ) : (
        <div className="container mx-auto p-4">
          {duelStatus === 'in_progress' && activeDuel ? (
            <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-8">
                <div className="flex items-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-800">Soru</h3>
                  <div className="ml-auto">
                    <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      Düello Sorusu
                    </span>
                  </div>
                </div>
                
                {currentQuestion && (
                  <>
                    <div className="mb-8">
                      <div className="relative rounded-xl overflow-hidden shadow-md">
                        <img 
                          src={currentQuestion.question_image_url} 
                          alt="Soru" 
                          className="w-full h-auto max-h-[400px] object-contain"
                        />
                      </div>
                    </div>

                    {/* Masaüstü için 5 sütun, mobil için 2 sütun */}
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4 mb-8">
                      {currentQuestion.options?.map((option: any, index: number) => (
                        <button
                          key={option.id}
                          onClick={() => setAnswer(option.id)}
                          className={`group relative overflow-hidden rounded-xl transition-all duration-300 ${
                            answer === option.id 
                              ? 'ring-4 ring-blue-500 ring-opacity-50 transform scale-[1.02]' 
                              : 'hover:shadow-lg hover:transform hover:scale-[1.01]'
                          }`}
                        >
                          <div className={`absolute inset-0 transition-opacity duration-300 ${
                            answer === option.id ? 'bg-blue-500 opacity-10' : 'opacity-0 group-hover:opacity-5'
                          }`} />
                          <div className="relative">
                            <img 
                              src={option.imageUrl} 
                              alt={`Seçenek ${index + 1}`} 
                              className="w-full h-auto rounded-xl"
                            />
                            <div className={`absolute top-2 left-2 lg:top-3 lg:left-3 w-6 h-6 lg:w-8 lg:h-8 flex items-center justify-center rounded-full text-xs lg:text-sm font-bold ${
                              answer === option.id
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-200 text-gray-600'
                            }`}>
                              {String.fromCharCode(65 + index)}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={submitAnswer}
                        disabled={!answer}
                        className={`px-8 py-4 rounded-xl font-semibold text-white transition-all duration-300 ${
                          answer
                            ? 'bg-blue-500 hover:bg-blue-600 hover:shadow-lg transform hover:scale-[1.02]'
                            : 'bg-gray-300 cursor-not-allowed'
                        }`}
                      >
                        {answer ? 'Cevabı Gönder' : 'Bir seçenek seçin'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Düello Başlat Bölümü */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold mb-4">Düello Başlat</h2>
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Rakip ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {searchTerm && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredUsers.map(user => (
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
                          onClick={() => handleChallenge(user.id)}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          Düello
                        </button>
                      </div>
                    ))}
                    {filteredUsers.length === 0 && (
                      <p className="text-center text-gray-500 col-span-full py-4">
                        Rakip bulunamadı
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Bekleyen Düellolar */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold mb-4">Bekleyen Düellolar</h2>
                <div className="space-y-4">
                  {pendingDuels.map(duel => renderDuelCard(duel))}
                  {pendingDuels.length === 0 && (
                    <p className="text-center text-gray-500 py-4">
                      Bekleyen düello bulunmuyor
                    </p>
                  )}
                </div>
              </div>

              {/* Tamamlanan Düellolar */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold mb-4">Tamamlanan Düellolar</h2>
                <div className="space-y-4">
                  {completedDuels.map(duel => {
                    const isChallenger = duel.challenger_id === currentUser?.id;
                    return (
                      <div key={duel.id} className="border p-4 rounded-lg bg-gray-50">
                        <div className="flex justify-between items-center">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-semibold">
                                {isChallenger ? `${duel.challenged?.name}'e karşı` : `${duel.challenger?.name}'e karşı`}
                              </h3>
                              <span className={`px-2 py-1 rounded text-sm font-medium ${
                                duel.result === 'draw' ? 'bg-yellow-100 text-yellow-800' :
                                (duel.result === 'challenger_won' && isChallenger) || (duel.result === 'challenged_won' && !isChallenger) ?
                                'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {getDuelResultText(duel, isChallenger)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">
                              Tamamlanma: {formatDate(duel.completed_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {completedDuels.length === 0 && (
                    <p className="text-center text-gray-500 py-4">
                      Tamamlanan düello bulunmuyor
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DuelPage;
