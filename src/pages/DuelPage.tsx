import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types/user';
import { Question } from '../types/quiz';
import { generateQuiz } from '../utils/quizGenerator';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useXPCheck } from '../hooks/useXPCheck';
import { useUser } from '../hooks/useUser';
import XPWarning from '../components/XPWarning';
import DuelInfo from '@/components/DuelInfo';
import DuelQuestion from '../components/DuelQuestion';

const DuelPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [duelStatus, setDuelStatus] = useState<'waiting' | 'in_progress' | 'completed'>('waiting');
  const [searchTerm, setSearchTerm] = useState('');
  const [pendingDuels, setPendingDuels] = useState<any[]>([]);
  const [inProgressDuels, setInProgressDuels] = useState<any[]>([]);
  const [completedDuels, setCompletedDuels] = useState<any[]>([]);
  const [activeDuel, setActiveDuel] = useState<any>(null);
  const [answer, setAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [showQuestion, setShowQuestion] = useState(false);
  const navigate = useNavigate();

  // useUser hook'unu kullan
  const { currentUser, loading: userLoading } = useUser();
  const { hasEnoughXP, userXP, requiredXP, error: xpError, loading: xpLoading } = useXPCheck(
    userLoading ? undefined : currentUser?.id, 
    '/duel'
  );

  useEffect(() => {
    if (currentUser?.id) {
      fetchUsers();
      fetchDuels();
    }
  }, [currentUser]);

  const fetchUsers = async () => {
    if (!currentUser?.id) {
      console.log('currentUser.id bulunamadı');
      return;
    }

    try {
      const { data: currentUserProfile, error: profileError } = await supabase
        .from('profiles')
        .select('referral_code, email')
        .eq('id', currentUser.id)
        .single();

      if (profileError) {
        console.error('Profil bilgisi alınamadı:', profileError);
        throw profileError;
      }

      if (!currentUserProfile.referral_code) {
        console.log('Kullanıcının referral kodu yok');
        setUsers([]);
        return;
      }

      const { data: invitedUsers, error: usersError } = await supabase
        .from('profiles')
        .select('id, name, avatar_url, experience, referred_by, email')
        .eq('referred_by', currentUserProfile.referral_code)
        .neq('id', currentUser.id);

      if (usersError) {
        console.error('Davet edilen kullanıcılar alınamadı:', usersError);
        throw usersError;
      }

      setUsers(invitedUsers || []);
    } catch (error) {
      console.error('Error fetching users:', error);
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
        const pendingDuels = duels.filter(duel => duel.status === 'pending');
        const inProgressDuels = duels.filter(duel => {
          if (duel.status === 'in_progress') {
            const isChallenger = duel.challenger_id === currentUser?.id;
            const myAnswer = isChallenger ? duel.challenger_answer : duel.challenged_answer;
            const otherAnswer = isChallenger ? duel.challenged_answer : duel.challenger_answer;
            return myAnswer || otherAnswer;
          }
          return false;
        });
        const completedDuels = duels.filter(duel => duel.status === 'completed');
        
        setPendingDuels(pendingDuels);
        setInProgressDuels(inProgressDuels);
        setCompletedDuels(completedDuels);
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

      setSelectedUser(user);
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
          correctOptionId: randomQuestion.correctOptionId,
          solutionVideo: randomQuestion.solutionVideo || ''
        })
      };

      const { data: newDuel, error } = await supabase
        .from('duels')
        .insert([duelData])
        .select()
        .single();

      if (!error) {
        setDuelStatus('waiting');
        await fetchDuels();
        alert(`${user.name} kullanıcısına düello daveti gönderildi! Karşı tarafın kabul etmesini bekleyin.`);
      } else {
        console.error('Error creating duel:', error);
        alert('Düello daveti gönderilirken bir hata oluştu.');
      }
    } catch (error) {
      console.error('Error in handleChallenge:', error);
    }
  };

  const acceptDuel = async (duelId: string) => {
    if (!currentUser) return;
    
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
      alert('Düello başladı! Soruyu cevaplayabilirsiniz.');
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
        setActiveDuel(activeDuel);
        setDuelStatus('in_progress');
        
        const questionData = activeDuel.question_data ? JSON.parse(activeDuel.question_data) : null;
        
        if (questionData) {
          setCurrentQuestion({
            id: questionData.id,
            text: questionData.text,
            questionImageUrl: questionData.questionImageUrl,
            options: questionData.options,
            correctOptionId: questionData.correctOptionId,
            solutionVideo: questionData.solutionVideo
          });

          const isChallenger = activeDuel.challenger_id === currentUser?.id;
          const hasAnswered = isChallenger 
            ? activeDuel.challenger_answer 
            : activeDuel.challenged_answer;
          
          if (!hasAnswered) {
            setShowQuestion(true);
          }
        }
      } else {
        setActiveDuel(null);
        setDuelStatus('waiting');
        setCurrentQuestion(null);
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

      setShowQuestion(false);
      await checkActiveDuel();
    } catch (error) {
      console.error('Error in handleSubmitAnswer:', error);
    }
  };

  const getDuelResultText = (duel: any, isChallenger: boolean) => {
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
    const otherUser = isChallenger ? duel.challenged : duel.challenger;
    const hasAnswered = isChallenger ? duel.challenger_answer : duel.challenged_answer;
    const otherHasAnswered = isChallenger ? duel.challenged_answer : duel.challenger_answer;

    let statusText = '';
    if (duel.status === 'pending') {
      statusText = isChallenger ? 'Rakibiniz henüz kabul etmedi' : 'Size düello daveti gönderdi';
    } else if (duel.status === 'in_progress') {
      if (hasAnswered) {
        statusText = otherHasAnswered ? 'Her iki taraf da cevapladı' : 'Rakibinizin cevabı bekleniyor';
      } else {
        statusText = otherHasAnswered ? 'Rakibiniz cevapladı, sıra sizde' : 'Düello başladı';
      }
    }

    return (
      <div key={duel.id} className="border p-4 rounded-lg bg-white hover:bg-gray-50 transition-colors">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <img
              src={otherUser?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(otherUser?.email || '')}`}
              alt={otherUser?.name}
              className="w-10 h-10 rounded-full"
            />
            <div>
              <p className="font-medium">{otherUser?.name}</p>
              <p className="text-sm text-gray-500">{statusText}</p>
            </div>
          </div>
          {duel.status === 'pending' && !isChallenger && (
            <button
              onClick={() => acceptDuel(duel.id)}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              Kabul Et
            </button>
          )}
          {duel.status === 'in_progress' && !hasAnswered && (
            <button
              onClick={() => setShowQuestion(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Cevapla
            </button>
          )}
          {hasAnswered && (
            <span className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg">
              Cevaplandı
            </span>
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
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [duelStatus, timeLeft]);

  useEffect(() => {
    if (currentUser?.id) {
      const initialize = async () => {
        await Promise.all([
          fetchUsers(),
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

  const filteredUsers = users.filter(user => 
    user.id !== currentUser?.id &&
    (user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     user.email?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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

  // Loading durumunda bekle
  if (userLoading || xpLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // XP kontrolü
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto p-4 pt-20">
        {showQuestion && currentQuestion && activeDuel && (
          <DuelQuestion
            question={currentQuestion}
            duelId={activeDuel.id}
            isChallenger={activeDuel.challenger_id === currentUser?.id}
            onSubmitAnswer={handleSubmitAnswer}
            onClose={() => setShowQuestion(false)}
          />
        )}

        {/* Düello Nasıl Oynanır? */}
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

        {/* Düello Başlat Bölümü */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Düello Başlat</h2>
          <input
            type="text"
            placeholder="İsim ile ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
              {filteredUsers.map((user) => (
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
              {filteredUsers.length === 0 && (
                <p className="text-center text-gray-500 py-4">
                  Rakip bulunamadı
                </p>
              )}
            </div>
          )}
        </div>

        {pendingDuels.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">Bekleyen Düellolar</h2>
            <div className="space-y-4">
              {pendingDuels.map(duel => renderDuelCard(duel))}
            </div>
          </div>
        )}

        {inProgressDuels.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">Devam Eden Düellolar</h2>
            <div className="space-y-4">
              {inProgressDuels.map(duel => renderDuelCard(duel))}
            </div>
          </div>
        )}

        {completedDuels.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Tamamlanan Düellolar</h2>
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DuelPage;
