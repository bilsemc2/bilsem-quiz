import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useXPCheck } from '../hooks/useXPCheck';
import { useUser } from '../hooks/useUser';
import XPWarning from '../components/XPWarning';
import DuelQuestion from '../components/DuelQuestion';
import { generateQuiz } from '../utils/quizGenerator';
import toast from 'react-hot-toast';
import { 
  Trophy, 
  Sword, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Search, 
  Medal,
  Users,
  Zap,
  Star,
  Shield,
  Target,
  Crown,
  TrendingUp,
  Eye,
  Flame,
  Calendar,
  Brain,
  User,
  Play
} from 'lucide-react';

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

// Liderlik tablosu için kullanıcı tipi
interface LeaderboardUser {
  id: string;
  name: string;
  avatar_url: string;
  email: string;
  wins: number;
  total: number;
  winRate: number;
}

const DuelPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [duels, setDuels] = useState<any[]>([]);
  const [activeDuel, setActiveDuel] = useState<any>(null);
  const [showQuestion, setShowQuestion] = useState(false);
  const [selectedDuel, setSelectedDuel] = useState<any>(null);
  const [showDuelDetails, setShowDuelDetails] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const { currentUser, loading: userLoading } = useUser();
  const { hasEnoughXP, userXP, requiredXP, loading: xpLoading } = useXPCheck(
    userLoading || !currentUser?.id);

  useEffect(() => {
    if (currentUser?.id) {
      fetchInvitedUsers();
      fetchDuels();
      fetchLeaderboard();
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
      setFilteredUsers(formattedUsers);
    } catch (error) {
      console.error('Error fetching related users:', error);
      setUsers([]);
    }
  };

  // Düello verilerini getir
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
  
  // Liderlik tablosu verilerini getir
  const fetchLeaderboard = async () => {
    try {
      // Tüm tamamlanan düellolar
      const { data: completedDuels, error } = await supabase
        .from('duels')
        .select(`
          challenger_id,
          challenged_id,
          result,
          challenger:profiles!challenger_id(id, name, email, avatar_url),
          challenged:profiles!challenged_id(id, name, email, avatar_url)
        `)
        .eq('status', 'completed');
      
      // TypeScript için tipleri düzeltme
      type ChallengeType = {
        challenger_id: string;
        challenged_id: string;
        result: string;
        challenger: {
          id: string;
          name: string;
          email: string;
          avatar_url: string;
        } | {
          id: string;
          name: string;
          email: string;
          avatar_url: string;
        }[];
        challenged: {
          id: string;
          name: string;
          email: string;
          avatar_url: string;
        } | {
          id: string;
          name: string;
          email: string;
          avatar_url: string;
        }[];
      };
      
      // Tip düzenlemesi
      const typedCompletedDuels = completedDuels as unknown as ChallengeType[];
        
      if (error) {
        console.error('Error fetching leaderboard data:', error);
        return;
      }
      
      if (!typedCompletedDuels || typedCompletedDuels.length === 0) {
        return;
      }
      
      // Kullanıcı bazında düello istatistiklerini hesapla
      const userStats: Record<string, { 
        id: string, 
        name: string, 
        avatar_url: string, 
        email: string,
        wins: number, 
        total: number 
      }> = {};
      
      typedCompletedDuels.forEach(duel => {
        // Challenger kullanıcı istatistikleri
        const challengerId = duel.challenger_id;
        // Challenger bir dizi olarak geliyor, ilk elemanı alalım
        const challenger = Array.isArray(duel.challenger) ? duel.challenger[0] : duel.challenger;
        
        if (!userStats[challengerId]) {
          userStats[challengerId] = { 
            id: challengerId,
            name: challenger?.name || 'İsimsiz kullanıcı',
            avatar_url: challenger?.avatar_url || '',
            email: challenger?.email || '',
            wins: 0, 
            total: 0 
          };
        }
        
        userStats[challengerId].total++;
        if (duel.result === 'challenger_won') {
          userStats[challengerId].wins++;
        }
        
        // Challenged kullanıcı istatistikleri
        const challengedId = duel.challenged_id;
        // Challenged bir dizi olarak geliyor, ilk elemanı alalım
        const challenged = Array.isArray(duel.challenged) ? duel.challenged[0] : duel.challenged;
        
        if (!userStats[challengedId]) {
          userStats[challengedId] = { 
            id: challengedId,
            name: challenged?.name || 'İsimsiz kullanıcı',
            avatar_url: challenged?.avatar_url || '',
            email: challenged?.email || '',
            wins: 0, 
            total: 0 
          };
        }
        
        userStats[challengedId].total++;
        if (duel.result === 'challenged_won') {
          userStats[challengedId].wins++;
        }
      });
      
      // Kazanma oranını hesapla ve sırala
      const leaderboardData = Object.values(userStats)
        .map(user => ({
          ...user,
          winRate: user.total > 0 ? (user.wins / user.total) * 100 : 0
        }))
        .sort((a, b) => b.wins - a.wins);
      
      setLeaderboard(leaderboardData);
    } catch (error) {
      console.error('Error in fetchLeaderboard:', error);
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
        .select('challenger_answer, challenged_answer, question_data, challenger_id, challenged_id')
        .eq('id', duelId)
        .single();

      if (duel?.challenger_answer && duel?.challenged_answer) {
        const questionData = JSON.parse(duel.question_data);
        const correctAnswer = questionData.correctOptionId;
        
        let result = 'draw';
        let winnerId = null;
        const XP_REWARD = 10; // Kazanan için XP ödülü
        
        if (duel.challenger_answer === correctAnswer && duel.challenged_answer !== correctAnswer) {
          result = 'challenger_won';
          winnerId = duel.challenger_id;
        } else if (duel.challenged_answer === correctAnswer && duel.challenger_answer !== correctAnswer) {
          result = 'challenged_won';
          winnerId = duel.challenged_id;
        }

        await supabase
          .from('duels')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            result
          })
          .eq('id', duelId);
        
        // Kazanan kullanıcıya XP ver (berabere değilse)
        if (winnerId) {
          // XP'yi güncelle
          const { error: xpError } = await supabase
            .from('profiles')
            .update({ experience: supabase.rpc('increment', { x: XP_REWARD }) })
            .eq('id', winnerId);
            
          if (xpError) {
            console.error('XP güncellenirken hata oluştu:', xpError);
          }
          
          // Kazanan kullanıcı mevcut kullanıcıysa XP kazanımını göster
          if (winnerId === currentUser?.id) {
            toast.success(
              <div className="flex flex-col items-center">
                <div className="text-lg font-bold mb-1">Tebrikler! Düelloyu Kazandın!</div>
                <div className="flex items-center justify-center w-full">
                  <span className="text-yellow-500 text-lg font-semibold">+{XP_REWARD} XP</span>
                  <span className="ml-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </span>
                </div>
              </div>,
              {
                duration: 5000,
                style: {
                  background: '#1E40AF',
                  color: 'white',
                  padding: '16px',
                  border: '1px solid #1E3A8A',
                  borderRadius: '8px',
                },
                icon: '🏆',
              }
            );
          }
        }

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
    
    // Kazanan veya kaybeden kullanıcı bilgisini kontrol et
    const isWinner = 
      (duel.result === 'challenger_won' && duel.challenger_id === currentUser?.id) ||
      (duel.result === 'challenged_won' && duel.challenged_id === currentUser?.id);
    
    const isLoser = 
      (duel.result === 'challenger_won' && duel.challenged_id === currentUser?.id) ||
      (duel.result === 'challenged_won' && duel.challenger_id === currentUser?.id);

    const getStatusConfig = (status: string, isWinner: boolean, isLoser: boolean) => {
      if (status === 'pending') return {
        bg: 'bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30',
        text: 'text-yellow-800 dark:text-yellow-200',
        icon: Clock,
        label: 'Bekliyor'
      };
      if (status === 'in_progress') return {
        bg: 'bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30',
        text: 'text-blue-800 dark:text-blue-200',
        icon: Flame,
        label: 'Devam Ediyor'
      };
      if (status === 'completed') {
        if (isWinner) return {
          bg: 'bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30',
          text: 'text-green-800 dark:text-green-200',
          icon: Trophy,
          label: 'Kazandın!'
        };
        if (isLoser) return {
          bg: 'bg-gradient-to-r from-red-100 to-pink-100 dark:from-red-900/30 dark:to-pink-900/30',
          text: 'text-red-800 dark:text-red-200',
          icon: XCircle,
          label: 'Kaybettin'
        };
        return {
          bg: 'bg-gradient-to-r from-gray-100 to-slate-100 dark:from-gray-900/30 dark:to-slate-900/30',
          text: 'text-gray-800 dark:text-gray-200',
          icon: Target,
          label: 'Berabere'
        };
      }
      return {
        bg: 'bg-gray-100 dark:bg-gray-700',
        text: 'text-gray-800 dark:text-gray-200',
        icon: Target,
        label: status
      };
    };

    const statusConfig = getStatusConfig(duel.status, isWinner, isLoser);
    const StatusIcon = statusConfig.icon;

    return (
      <motion.div
        key={duel.id}
        whileHover={{ y: -2 }}
        className={`bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl hover:shadow-2xl transition-all p-6 border-2 ${
          duel.status === 'completed' && isWinner 
            ? 'border-yellow-300 dark:border-yellow-600 shadow-yellow-200/50' 
            : duel.status === 'completed' && isLoser
            ? 'border-red-200 dark:border-red-800 shadow-red-200/50'
            : 'border-gray-200/50 dark:border-gray-700/50'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(opponent?.email || '')}`}
                alt={opponent?.name}
                className="w-14 h-14 rounded-full border-3 border-white shadow-lg"
              />
              {duel.status === 'completed' && isWinner && (
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                  <Crown className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-800 dark:text-white">{opponent?.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(duel.created_at)}
              </p>
            </div>
          </div>
          
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${statusConfig.bg} ${statusConfig.text}`}>
            <StatusIcon className="w-4 h-4" />
            <span className="text-sm font-semibold">{statusConfig.label}</span>
          </div>
        </div>

        {duel.status === 'completed' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 space-y-4"
          >
            <div className="text-center">
              <div className="text-lg font-bold text-gray-800 dark:text-white mb-2">
                {getDuelResultText(duel)}
              </div>
              
              {/* Kazanan veya kaybeden için farklı gösterim */}
              {duel.result !== 'draw' && (
                <div className="flex justify-center">
                  {(duel.result === 'challenger_won' && duel.challenger_id === currentUser?.id) || 
                   (duel.result === 'challenged_won' && duel.challenged_id === currentUser?.id) ? (
                    <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300 text-sm font-semibold bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 py-2 px-4 rounded-full">
                      <Zap className="w-4 h-4" />
                      <span>+10 XP Kazandın!</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-red-700 dark:text-red-300 text-sm font-semibold bg-gradient-to-r from-red-100 to-pink-100 dark:from-red-900/30 dark:to-pink-900/30 py-2 px-4 rounded-full">
                      <Target className="w-4 h-4" />
                      <span>Daha çok çalış!</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setSelectedDuel(duel);
                setShowDuelDetails(true);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white rounded-xl transition-all font-semibold shadow-lg"
            >
              <Eye className="w-4 h-4" />
              Soru Detaylarını Gör
            </motion.button>
          </motion.div>
        )}

        {duel.status === 'pending' && !isChallenger && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => acceptDuel(duel.id)}
            className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl transition-all font-semibold shadow-lg"
          >
            <CheckCircle className="w-4 h-4" />
            Düelloyu Kabul Et
          </motion.button>
        )}
      </motion.div>
    );
  };

  const renderDuelDetails = () => {
    if (!selectedDuel || !showDuelDetails) return null;

    const questionData = selectedDuel.question_data ? JSON.parse(selectedDuel.question_data) : null;
    const isChallenger = selectedDuel.challenger_id === currentUser?.id;
    const myAnswer = isChallenger ? selectedDuel.challenger_answer : selectedDuel.challenged_answer;
    const opponentAnswer = isChallenger ? selectedDuel.challenged_answer : selectedDuel.challenger_answer;

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl border border-gray-200/30 dark:border-gray-700/30"
          >
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Düello Detayları
              </h3>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowDuelDetails(false)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </motion.button>
            </div>

            {questionData && (
              <div className="space-y-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-xl p-6 border border-indigo-200/50 dark:border-indigo-700/50"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-indigo-500 rounded-xl">
                      <Brain className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="font-bold text-lg text-gray-800 dark:text-white">Soru</h4>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">{questionData.text}</p>
                  {questionData.questionImageUrl && (
                    <motion.img
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      src={questionData.questionImageUrl}
                      alt="Soru görseli"
                      className="mt-6 rounded-xl max-h-64 mx-auto shadow-lg"
                    />
                  )}
                </motion.div>

                <div className="grid grid-cols-1 gap-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border border-green-200/50 dark:border-green-700/50 rounded-xl p-6"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-green-500 rounded-xl">
                        <CheckCircle className="w-5 h-5 text-white" />
                      </div>
                      <h4 className="font-bold text-lg text-gray-800 dark:text-white">Doğru Cevap</h4>
                    </div>
                    <p className="text-green-700 dark:text-green-300 font-semibold text-lg">
                      {questionData.options.find((opt: any) => opt.id === questionData.correctOptionId)?.text || '-'}
                    </p>
                    {questionData.options.find((opt: any) => opt.id === questionData.correctOptionId)?.imageUrl && (
                      <motion.img
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        src={questionData.options.find((opt: any) => opt.id === questionData.correctOptionId)?.imageUrl} 
                        alt="Doğru cevap" 
                        className="mt-4 max-h-32 mx-auto rounded-xl shadow-md"
                      />
                    )}
                  </motion.div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl p-6 border border-blue-200/50 dark:border-blue-700/50"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-500 rounded-xl">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <h4 className="font-bold text-gray-800 dark:text-white">Sizin Cevabınız</h4>
                      </div>
                      <div className={`${!myAnswer ? 'text-gray-600 dark:text-gray-400' : (myAnswer === questionData.correctOptionId ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-red-600 dark:text-red-400 font-semibold')}`}>
                        <p className="text-lg">
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
                          <motion.img
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            src={questionData.options.find((opt: any) => opt.id === myAnswer)?.imageUrl} 
                            alt="Sizin cevabınız" 
                            className="mt-4 max-h-24 mx-auto rounded-xl shadow-md"
                          />
                        )}
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                      className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl p-6 border border-purple-200/50 dark:border-purple-700/50"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-purple-500 rounded-xl">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                        <h4 className="font-bold text-gray-800 dark:text-white">Rakip Cevabı</h4>
                      </div>
                      <div className={`${!opponentAnswer ? 'text-gray-600 dark:text-gray-400' : (opponentAnswer === questionData.correctOptionId ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-red-600 dark:text-red-400 font-semibold')}`}>
                        <p className="text-lg">
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
                          <motion.img
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            src={questionData.options.find((opt: any) => opt.id === opponentAnswer)?.imageUrl} 
                            alt="Rakip cevabı" 
                            className="mt-4 max-h-24 mx-auto rounded-xl shadow-md"
                          />
                        )}
                      </div>
                    </motion.div>
                  </div>
                </div>

                {questionData.solutionVideo && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/30 rounded-xl p-6 border border-orange-200/50 dark:border-orange-700/50"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-orange-500 rounded-xl">
                        <Play className="w-5 h-5 text-white" />
                      </div>
                      <h4 className="font-bold text-lg text-gray-800 dark:text-white">Çözüm Videosu</h4>
                    </div>
                    <div className="aspect-w-16 aspect-h-9">
                      <iframe
                        src={questionData.solutionVideo}
                        className="w-full h-64 rounded-xl shadow-lg"
                        allowFullScreen
                      />
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      </AnimatePresence>
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900">
        <div className="container mx-auto px-4 py-8 pt-20 max-w-7xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg mb-4">
              <Sword className="w-8 h-8 text-purple-600" />
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Düello Arenası
              </h1>
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              Arkadaşlarınla bilgi yarışı yap ve XP kazan!
            </p>
          </motion.div>

          {/* Liderlik Tablosu Butonu */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex justify-end mb-6"
          >
            <motion.button 
              onClick={() => setShowLeaderboard(!showLeaderboard)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
            >
              <Trophy className="w-5 h-5" />
              {showLeaderboard ? 'Liderlik Tablosunu Kapat' : 'Liderlik Tablosunu Göster'}
            </motion.button>
          </motion.div>
          
          {/* Liderlik Tablosu */}
          <AnimatePresence>
            {showLeaderboard && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl p-6 mb-8"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl">
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                    Düello Liderlik Tablosu
                  </h2>
                </div>
                
                {leaderboard.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12"
                  >
                    <div className="w-20 h-20 mx-auto bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                      <Trophy className="w-10 h-10 text-gray-400" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">Henüz tamamlanmış düello bulunmuyor.</p>
                    <p className="text-sm text-gray-400">Düellolar tamamlandıkça sıralama güncellenecek.</p>
                  </motion.div>
                ) : (
                  <div className="overflow-x-auto">
                    <div className="grid gap-4">
                      {leaderboard.slice(0, 10).map((user, index) => (
                        <motion.div
                          key={user.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`flex items-center justify-between p-4 rounded-xl transition-all ${
                            index < 3 
                              ? 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-2 border-yellow-200 dark:border-yellow-700' 
                              : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              {index === 0 && <Crown className="w-6 h-6 text-yellow-500" />}
                              {index === 1 && <Medal className="w-6 h-6 text-gray-400" />}
                              {index === 2 && <Star className="w-6 h-6 text-yellow-700" />}
                              <span className="text-lg font-bold text-gray-700 dark:text-gray-300">
                                #{index + 1}
                              </span>
                            </div>
                            <img 
                              className="w-12 h-12 rounded-full border-2 border-white shadow-md" 
                              src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.email)}`} 
                              alt={user.name}
                            />
                            <div>
                              <div className="font-semibold text-gray-800 dark:text-white">{user.name}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {user.wins} galibiyet / {user.total} düello
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-2 mb-1">
                              <TrendingUp className="w-4 h-4 text-green-500" />
                              <span className="font-bold text-lg text-gray-800 dark:text-white">
                                {user.winRate.toFixed(1)}%
                              </span>
                            </div>
                            <div className="w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${user.winRate}%` }}
                                transition={{ delay: index * 0.1 + 0.5, duration: 1 }}
                                className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full"
                              />
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Soru Gösterim Alanı */}
          <AnimatePresence>
            {showQuestion && activeDuel && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
              >
                <DuelQuestion
                  duelId={activeDuel.id}
                  question={activeDuel.question_data ? JSON.parse(activeDuel.question_data) : null}
                  isChallenger={activeDuel.challenger_id === currentUser?.id}
                  onSubmitAnswer={handleSubmitAnswer}
                  onClose={() => setShowQuestion(false)}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Nasıl Oynanır Rehberi */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl p-6 mb-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                Düello Nasıl Oynanır?
              </h2>
            </div>
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shrink-0">
                  1
                </div>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  Düello başlatmak için aşağıdaki listeden bir rakip seçin. Rakibinize düello daveti gönderilecek.
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold shrink-0">
                  2
                </div>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  Rakibiniz düelloyu kabul ettiğinde her iki tarafa da aynı soru gösterilecek. Soruyu cevaplamak için 30 saniyeniz var!
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-red-600 flex items-center justify-center text-white font-bold shrink-0">
                  3
                </div>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  Her iki taraf da cevap verdiğinde düello sonuçlanır. Doğru cevap veren kazanır, eşitlik durumunda berabere kalırsınız.
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl border border-yellow-200 dark:border-yellow-700"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-yellow-600" />
                  <strong className="text-yellow-800 dark:text-yellow-200">Önemli Not:</strong>
                </div>
                <p className="text-yellow-700 dark:text-yellow-300">
                  Düello başlatmak için yeterli XP'ye sahip olmanız gerekir. XP'nizi artırmak için egzersiz sorularını çözebilirsiniz.
                </p>
              </motion.div>
            </div>
          </motion.div>

          {/* Düellolarım Bölümü */}
          <AnimatePresence>
            {duels.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl p-6 mb-8"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-r from-green-500 to-blue-600 rounded-xl">
                      <Sword className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                      Düellolarım
                    </h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setDuels(duels.filter(d => d.status === 'pending'))}
                      className="px-4 py-2 rounded-full text-sm bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 text-yellow-800 dark:text-yellow-200 hover:shadow-md transition-all"
                    >
                      <Clock className="w-4 h-4 inline mr-1" />
                      Bekleyenler
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setDuels(duels.filter(d => d.status === 'in_progress'))}
                      className="px-4 py-2 rounded-full text-sm bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-800 dark:text-blue-200 hover:shadow-md transition-all"
                    >
                      <Flame className="w-4 h-4 inline mr-1" />
                      Devam Edenler
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setDuels(duels.filter(d => d.status === 'completed'))}
                      className="px-4 py-2 rounded-full text-sm bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-800 dark:text-green-200 hover:shadow-md transition-all"
                    >
                      <CheckCircle className="w-4 h-4 inline mr-1" />
                      Tamamlananlar
                    </motion.button>
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {duels.map((duel, index) => (
                    <motion.div
                      key={duel.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      {renderDuelCard(duel)}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Düello Başlat Bölümü */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl p-6 mb-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-r from-red-500 to-pink-600 rounded-xl">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                Düello Başlat
              </h2>
            </div>
            
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="İsim ile ara..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  const filtered = users.filter(user => 
                    user.name.toLowerCase().includes(e.target.value.toLowerCase())
                  );
                  setFilteredUsers(filtered);
                }}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>

            {users.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <div className="w-20 h-20 mx-auto bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                  <Users className="w-10 h-10 text-gray-400" />
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-lg mb-2">
                  Henüz davet ettiğiniz arkadaşınız bulunmuyor.
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Arkadaşlarınızı davet etmek için profil sayfanızdaki referans kodunu paylaşabilirsiniz.
                  Sadece davet ettiğiniz arkadaşlarınızla düello yapabilirsiniz.
                </p>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {filteredUsers.map((user, index) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.email)}`}
                        alt={user.name}
                        className="w-12 h-12 rounded-full border-2 border-white shadow-md"
                      />
                      <div>
                        <p className="font-semibold text-gray-800 dark:text-white">{user.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Düelloya hazır</p>
                      </div>
                    </div>
                    <motion.button
                      onClick={() => handleChallenge(user)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
                    >
                      <Sword className="w-4 h-4" />
                      Düello
                    </motion.button>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
      {renderDuelDetails()}
    </>
  );
};

export default DuelPage;
