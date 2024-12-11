import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tab,
  Tabs,
  MenuItem,
  IconButton,
  Checkbox,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  Switch
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

interface User {
  id: string;
  email: string;
  full_name: string;
  points: number;
  experience: number;
  is_admin: boolean;
  created_at: string;
}

interface QuizStats {
  totalQuizzes: number;
  averageScore: number;
  totalQuestionsAnswered: number;
  totalCorrectAnswers: number;
  accuracyRate: number;
  quizzesByDay: { [key: string]: number };
  topScorers: {
    name: string;
    email: string;
    score: number;
    date: string;
  }[];
}

interface UserStats {
  totalQuizzes: number;
  averageScore: number;
  totalQuestionsAnswered: number;
  totalCorrectAnswers: number;
  accuracyRate: number;
  quizzesByDay: { [key: string]: number };
  recentQuizzes: Array<{
    score: number;
    questions_answered: number;
    correct_answers: number;
    completed_at: string;
  }>;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  questions: string[];
  created_at: string;
  is_active: boolean;
  created_by: string;
}

interface NewQuizForm extends Omit<Quiz, 'id'> {
  grade: 1 | 2 | 3;
  subject: string;
}

interface QuizQuestion {
  id: string;
  questionImageUrl: string;
  question: string;
  options: QuizOption[];
  correctOptionId: string;
  grade: 1 | 2 | 3;
  subject: string;
}

interface QuizOption {
  id: string;
  imageUrl: string;
  text: string;
}

interface QuestionPoolItem {
  id: string;
  number: number;
  category: string;
  selected: boolean;
}

interface Class {
  id: string;
  name: string;
  grade: number;
  created_by: string;
}

interface Profile {
  id: string;
  email: string;
  full_name: string;
  grade: number;
  is_vip: boolean;
}

export default function AdminPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    totalUsers: 0,
    totalQuizzes: 0,
    averageScore: 0
  });
  const [quizStats, setQuizStats] = useState<QuizStats>({
    totalQuizzes: 0,
    averageScore: 0,
    totalQuestionsAnswered: 0,
    totalCorrectAnswers: 0,
    accuracyRate: 0,
    quizzesByDay: {},
    topScorers: []
  });
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editFormData, setEditFormData] = useState({
    full_name: '',
    points: 0,
    experience: 0
  });
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [showUserStats, setShowUserStats] = useState(false);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [showQuizForm, setShowQuizForm] = useState(false);
  const [newQuiz, setNewQuiz] = useState<NewQuizForm>({
    title: '',
    description: '',
    questions: [],
    grade: 1,
    subject: '',
  });
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Partial<QuizQuestion>>({
    questionImageUrl: '',
    question: '',
    options: [],
    grade: 1,
    subject: '',
  });
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [showQuestionPoolDialog, setShowQuestionPoolDialog] = useState(false);
  const [questionPool, setQuestionPool] = useState<QuestionPoolItem[]>([]);
  const [showAddClassDialog, setShowAddClassDialog] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassGrade, setNewClassGrade] = useState('');
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [showStudentDialog, setShowStudentDialog] = useState(false);
  const [availableStudents, setAvailableStudents] = useState<Profile[]>([]);
  const [classStudents, setClassStudents] = useState<Profile[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [showOnlyVip, setShowOnlyVip] = useState(false);

  useEffect(() => {
    checkAdminStatus();
    fetchUsers();
    fetchStats();
    fetchQuizStats();
  }, []);

  const checkAdminStatus = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin, email')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin || profile.email !== 'yaprakyesili@msn.com') {
      navigate('/');
      return;
    }

    setIsAdmin(true);
    setLoading(false);
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      return;
    }

    // Null değerleri varsayılan değerlerle değiştir
    const processedUsers = data?.map(user => ({
      ...user,
      experience: user.experience || 0,
      full_name: user.full_name || '',
      points: user.points || 0,
      is_active: user.is_active ?? true,
      is_vip: user.is_vip ?? false,
      grade: user.grade || 1
    })) || [];

    setUsers(processedUsers);
  };

  const fetchStats = async () => {
    // Toplam kullanıcı sayısı
    const { count: userCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Quiz sonuçları
    const { data: quizResults } = await supabase
      .from('quiz_results')
      .select('score');

    const totalUsers = userCount || 0;
    const scores = quizResults?.map(q => q.score) || [];
    const averageScore = scores.length > 0 
      ? scores.reduce((a, b) => a + b, 0) / scores.length 
      : 0;

    setStats({
      totalUsers,
      totalQuizzes: scores.length,
      averageScore: Math.round(averageScore * 100) / 100
    });
  };

  const fetchQuizStats = async () => {
    try {
      // Önce quiz sonuçlarını al
      const { data: quizResults, error: quizError } = await supabase
        .from('quiz_results')
        .select('*, profiles!inner(*)')
        .order('completed_at', { ascending: false });

      if (quizError) {
        console.error('Error fetching quiz results:', quizError);
        return;
      }

      if (!quizResults) return;

      // İstatistikleri hesapla
      const totalQuizzes = quizResults.length;
      const totalQuestionsAnswered = quizResults.reduce((sum, quiz) => sum + quiz.questions_answered, 0);
      const totalCorrectAnswers = quizResults.reduce((sum, quiz) => sum + quiz.correct_answers, 0);
      const averageScore = totalQuestionsAnswered > 0 
        ? (totalCorrectAnswers / totalQuestionsAnswered) * 100 
        : 0;

      // Günlük quiz sayılarını hesapla
      const quizzesByDay = quizResults.reduce((acc: { [key: string]: number }, quiz) => {
        const date = new Date(quiz.completed_at).toLocaleDateString('tr-TR');
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {});

      // En yüksek skorları al
      const topScorers = quizResults
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map(quiz => ({
          name: quiz.profiles?.full_name || 'İsimsiz',
          email: quiz.profiles?.email || 'N/A',
          score: quiz.score,
          date: new Date(quiz.completed_at).toLocaleDateString('tr-TR')
        }));

      setQuizStats({
        totalQuizzes,
        averageScore: Math.round(averageScore * 100) / 100,
        totalQuestionsAnswered,
        totalCorrectAnswers,
        accuracyRate: Math.round(averageScore * 100) / 100,
        quizzesByDay,
        topScorers
      });

    } catch (error) {
      console.error('Error calculating quiz stats:', error);
    }
  };

  const fetchUserStats = async (userId: string) => {
    try {
      const { data: quizResults, error } = await supabase
        .from('quiz_results')
        .select('*')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false });

      if (error) throw error;

      if (!quizResults) return;

      const totalQuizzes = quizResults.length;
      const totalQuestionsAnswered = quizResults.reduce((sum, quiz) => sum + quiz.questions_answered, 0);
      const totalCorrectAnswers = quizResults.reduce((sum, quiz) => sum + quiz.correct_answers, 0);
      const averageScore = totalQuestionsAnswered > 0 
        ? (totalCorrectAnswers / totalQuestionsAnswered) * 100 
        : 0;

      const quizzesByDay = quizResults.reduce((acc: { [key: string]: number }, quiz) => {
        const date = new Date(quiz.completed_at).toLocaleDateString('tr-TR');
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {});

      setUserStats({
        totalQuizzes,
        averageScore: Math.round(averageScore * 100) / 100,
        totalQuestionsAnswered,
        totalCorrectAnswers,
        accuracyRate: Math.round(averageScore * 100) / 100,
        quizzesByDay,
        recentQuizzes: quizResults.slice(0, 5)
      });

    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    if (newValue === 2) { // Quiz yönetimi sekmesi
      fetchQuizzes();
    }
  };

  const fetchQuizzes = async () => {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuizzes(data || []);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    }
  };

  const handleCreateQuiz = async () => {
    if (!newQuiz.title || !newQuiz.description || !newQuiz.grade || !newQuiz.subject) {
      alert('Lütfen tüm alanları doldurun');
      return;
    }

    if (!user) {
      alert('Oturum açmanız gerekiyor');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('quizzes')
        .insert([{
          title: newQuiz.title,
          description: newQuiz.description,
          questions: newQuiz.questions,
          grade: newQuiz.grade,
          subject: newQuiz.subject,
          is_active: true,
          created_by: user.id,
          created_at: new Date().toISOString()
        }])
        .select();

      if (error) throw error;

      setQuizzes([...(data || []), ...quizzes]);
      setShowQuizForm(false);
      setNewQuiz({
        title: '',
        description: '',
        questions: [],
        grade: 1,
        subject: '',
      });
      
      // Refresh quiz list to ensure we have the latest data
      fetchQuizzes();
    } catch (error) {
      console.error('Error creating quiz:', error);
      alert('Quiz oluşturulurken bir hata oluştu');
    }
  };

  const handleAddOption = () => {
    if (currentQuestion.options?.length >= 5) {
      alert('En fazla 5 seçenek ekleyebilirsiniz');
      return;
    }

    const questionNumber = (newQuiz.questions.length + 1).toString();
    const optionLetter = String.fromCharCode(65 + (currentQuestion.options?.length || 0)); // A, B, C, D, E
    const isCorrectAnswer = false; // This will be set when marking the correct answer

    const newOption: QuizOption = {
      id: `${questionNumber}${optionLetter}`,
      imageUrl: `/images/options/Matris/${questionNumber}/Soru-${isCorrectAnswer ? 'cevap-' : ''}${questionNumber}${optionLetter}.webp`,
      text: '',
    };

    setCurrentQuestion(prev => ({
      ...prev,
      options: [...(prev.options || []), newOption],
    }));
  };

  const handleAddQuestion = () => {
    if (!currentQuestion.question || !currentQuestion.options?.length) {
      alert('Lütfen tüm alanları doldurun');
      return;
    }

    const questionNumber = (newQuiz.questions.length + 1).toString();
    const questionImageUrl = `/images/questions/Matris/Soru-${questionNumber}.webp`;
    
    // Find the correct option by looking for "cevap" in the filename
    const correctOption = currentQuestion.options.find(opt => opt.imageUrl.includes('cevap'));
    if (!correctOption) {
      alert('Lütfen doğru cevabı işaretleyin');
      return;
    }

    // Extract the correct letter from the filename
    const correctLetter = correctOption.imageUrl.match(/Soru-(?:cevap-)?(\d+)([A-E])/)?.[2];
    if (!correctLetter) {
      alert('Doğru cevap seçeneği formatı hatalı');
      return;
    }

    // Generate options with correct file paths
    const options = ['A', 'B', 'C', 'D', 'E'].map(letter => {
      const isCorrect = letter === correctLetter;
      return {
        id: `${questionNumber}${letter}`,
        imageUrl: `/images/options/Matris/${questionNumber}/Soru-${isCorrect ? 'cevap-' : ''}${questionNumber}${letter}.webp`,
        text: ''
      };
    });

    const newQuestion: QuizQuestion = {
      id: questionNumber,
      questionImageUrl,
      question: currentQuestion.question,
      options,
      correctOptionId: `${questionNumber}${correctLetter}`,
      grade: currentQuestion.grade as 1 | 2 | 3,
      subject: currentQuestion.subject,
    };

    setNewQuiz(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion],
    }));

    setCurrentQuestion({
      questionImageUrl: '',
      question: '',
      options: [],
      grade: newQuiz.grade,
      subject: newQuiz.subject,
    });
    setShowQuestionForm(false);
  };

  const handleMarkCorrectAnswer = (optionIndex: number) => {
    const questionNumber = (newQuiz.questions.length + 1).toString();
    const optionLetter = String.fromCharCode(65 + optionIndex); // A, B, C, D, E

    setCurrentQuestion(prev => {
      const updatedOptions = prev.options?.map((opt, idx) => {
        const letter = String.fromCharCode(65 + idx);
        const isCorrect = idx === optionIndex;
        return {
          ...opt,
          id: `${questionNumber}${letter}`,
          imageUrl: `/images/options/Matris/${questionNumber}/Soru-${isCorrect ? 'cevap-' : ''}${questionNumber}${letter}.webp`
        };
      });

      return {
        ...prev,
        options: updatedOptions,
      };
    });
  };

  const handleToggleQuizStatus = async (quizId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('quizzes')
        .update({ is_active: !currentStatus })
        .eq('id', quizId);

      if (error) throw error;

      setQuizzes(quizzes.map(quiz => 
        quiz.id === quizId ? { ...quiz, is_active: !currentStatus } : quiz
      ));
    } catch (error) {
      console.error('Error toggling quiz status:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const confirmed = window.confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?');
    if (!confirmed) return;

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (error) {
      console.error('Error deleting user:', error);
      return;
    }

    fetchUsers();
  };

  const handleEditUser = (user: User) => {
    try {
      console.log('Editing user:', user);
      setEditingUser(user);
      setEditFormData({
        full_name: user.full_name || '',
        points: user.points || 0,
        experience: user.experience || 0
      });
    } catch (error) {
      console.error('Error in handleEditUser:', error);
      alert('Kullanıcı bilgileri yüklenirken bir hata oluştu.');
    }
  };

  const handleEditFormChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const value = field === 'full_name'
        ? event.target.value 
        : Number(event.target.value) || 0;

      setEditFormData(prev => ({
        ...prev,
        [field]: value
      }));
    } catch (error) {
      console.error(`Error updating ${field}:`, error);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: editFormData.full_name,
          points: editFormData.points,
          experience: editFormData.experience
        })
        .eq('id', editingUser.id)
        .select();

      if (error) {
        console.error('Error updating user:', error);
        alert('Kullanıcı güncellenirken bir hata oluştu: ' + error.message);
        return;
      }

      if (data) {
        console.log('User updated successfully:', data);
        alert('Kullanıcı başarıyla güncellendi!');
      }

      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error in handleSaveEdit:', error);
      alert('Bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  const handleUserClick = async (user: any) => {
    setSelectedUser(user);
    await fetchUserStats(user.id);
    setShowUserStats(true);
  };

  const handleCloseStats = () => {
    setShowUserStats(false);
    setSelectedUser(null);
    setUserStats(null);
  };

  const handleEditQuiz = async () => {
    if (!editingQuiz) return;

    if (!editingQuiz.title || !editingQuiz.description || !editingQuiz.questions.length) {
      alert('Lütfen tüm alanları doldurun ve en az bir soru ekleyin');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('quizzes')
        .update({
          title: editingQuiz.title,
          description: editingQuiz.description,
          questions: editingQuiz.questions,
          grade: editingQuiz.grade,
          subject: editingQuiz.subject,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingQuiz.id)
        .select();

      if (error) throw error;

      setQuizzes(quizzes.map(quiz => 
        quiz.id === editingQuiz.id ? { ...editingQuiz, updated_at: new Date().toISOString() } : quiz
      ));
      setEditingQuiz(null);
      setShowQuizForm(false);
      
      // Refresh quiz list
      fetchQuizzes();
    } catch (error) {
      console.error('Error updating quiz:', error);
      alert('Quiz güncellenirken bir hata oluştu');
    }
  };

  const handleUpdateQuestion = (questionId: string, updatedQuestion: QuizQuestion) => {
    if (editingQuiz) {
      const updatedQuestions = editingQuiz.questions.map(q => 
        q.id === questionId ? updatedQuestion : q
      );
      setEditingQuiz({
        ...editingQuiz,
        questions: updatedQuestions
      });
    }
  };

  const handleDeleteQuestion = (questionId: string) => {
    if (editingQuiz) {
      const updatedQuestions = editingQuiz.questions.filter(q => q.id !== questionId);
      setEditingQuiz({
        ...editingQuiz,
        questions: updatedQuestions
      });
    }
  };

  const handleAddPredefinedQuestions = () => {
    // Matris klasöründeki tüm soruları al
    const matrisQuestions = Array.from({ length: 40 }, (_, i) => i + 1).map(num => {
      // Her seçenek için resim URL'lerini oluştur
      const options = ['A', 'B', 'C', 'D', 'E'].map(letter => ({
        id: Math.random().toString(36).substr(2, 9),
        imageUrl: `/images/options/Matris/${num}/Soru-${num}${letter}.webp`
      }));

      // Doğru cevap resmi: Soru-cevap-1C.webp formatında
      const correctAnswerPath = `/images/options/Matris/${num}/Soru-cevap-${num}`;
      let correctAnswer = 'A'; // Varsayılan

      // Her seçenek için doğru cevap kontrolü
      ['A', 'B', 'C', 'D', 'E'].forEach(letter => {
        const testPath = `${correctAnswerPath}${letter}.webp`;
        // Burada dosya varlığını kontrol etmek ideal olurdu ama client-side'da bu mümkün değil
        // O yüzden QuizPage'de görüntülenirken kontrol edilecek
        if (testPath.includes('cevap')) {
          correctAnswer = letter;
        }
      });

      const correctOption = options.find(opt => opt.text === correctAnswer);

      return {
        id: num.toString(),
        questionImageUrl: `/images/questions/Matris/Soru-${num}.webp`,
        question: `Matris Soru ${num}`,
        options,
        correctOptionId: correctOption?.id || options[0].id,
        grade: editingQuiz?.grade || newQuiz.grade,
        subject: editingQuiz?.subject || newQuiz.subject,
      };
    });

    // Soruları mevcut quiz'e ekle
    if (editingQuiz) {
      setEditingQuiz({
        ...editingQuiz,
        questions: [...editingQuiz.questions, ...matrisQuestions]
      });
    } else {
      setNewQuiz({
        ...newQuiz,
        questions: [...newQuiz.questions, ...matrisQuestions]
      });
    }
  };

  const handleAddFromQuestionPool = () => {
    const selectedQuestions = questionPool
      .filter(q => q.selected)
      .map(q => q.number);

    if (selectedQuestions.length === 0) {
      alert('Lütfen en az bir soru seçin');
      return;
    }

    // Doğru cevapların haritası
    const correctAnswers: { [key: number]: string } = {
      1: 'C',
      2: 'B',
      3: 'D',
      4: 'A',
      5: 'B',
      6: 'E',
      7: 'C',
      8: 'D',
      9: 'B',
      10: 'B',
      11: 'C',
      12: 'A',
      13: 'D',
      14: 'B',
      15: 'E',
      16: 'C',
      17: 'A',
      18: 'D',
      19: 'E',
      20: 'B',
      21: 'D',
      22: 'A',
      23: 'C',
      24: 'E',
      25: 'B',
      26: 'D',
      27: 'A',
      28: 'C',
      29: 'B',
      30: 'E',
      31: 'A',
      32: 'E',
      33: 'B',
      34: 'E',
      35: 'E',
      36: 'C',
      37: 'D',
      38: 'A',
      39: 'B',
      40: 'E'
    };

    try {
      const newQuestions = selectedQuestions.map(num => {
        const correctLetter = correctAnswers[num];
        if (!correctLetter) {
          console.error(`No correct answer mapping found for question ${num}`);
          return null;
        }

        // Generate options with correct file paths
        const options = ['A', 'B', 'C', 'D', 'E'].map(letter => ({
          id: `${num}${letter}`,
          imageUrl: `/images/options/Matris/${num}/Soru-${letter === correctLetter ? 'cevap-' : ''}${num}${letter}.webp`,
          text: ''
        }));

        return {
          id: num.toString(),
          questionImageUrl: `/images/questions/Matris/Soru-${num}.webp`,
          question: '',
          options,
          correctOptionId: `${num}${correctLetter}`,
          grade: newQuiz.grade,
          subject: 'Matris'
        };
      }).filter(q => q !== null) as QuizQuestion[];

      if (newQuestions.length === 0) {
        throw new Error('Seçilen sorular eklenemedi');
      }

      setNewQuiz(prev => ({
        ...prev,
        questions: [...prev.questions, ...newQuestions]
      }));

      setShowQuestionPoolDialog(false);
      
      // Reset selection
      setQuestionPool(prev => prev.map(q => ({ ...q, selected: false })));
    } catch (error) {
      console.error('Error adding questions from pool:', error);
      alert('Sorular eklenirken bir hata oluştu');
    }
  };

  const toggleQuestionSelection = (id: string) => {
    setQuestionPool(pool => 
      pool.map(q => q.id === id ? { ...q, selected: !q.selected } : q)
    );
  };

  const loadQuestionPool = () => {
    // Şimdilik sadece Matris kategorisi var
    const questions = Array.from({ length: 40 }, (_, i) => ({
      id: Math.random().toString(36).substr(2, 9),
      number: i + 1,
      category: 'Matris',
      selected: false
    }));
    setQuestionPool(questions);
  };

  const handleAddClass = async () => {
    if (!newClassName || !newClassGrade) {
      alert('Lütfen sınıf adı ve seviyesini giriniz');
      return;
    }

    try {
      const { error } = await supabase
        .from('classes')
        .insert([
          {
            name: newClassName,
            grade: parseInt(newClassGrade),
            created_by: user?.id
          }
        ]);

      if (error) throw error;

      alert('Sınıf başarıyla oluşturuldu');
      setShowAddClassDialog(false);
      setNewClassName('');
      setNewClassGrade('');
    } catch (error) {
      console.error('Error adding class:', error);
      alert('Sınıf oluşturulurken bir hata oluştu');
    }
  };

  const loadClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .order('grade', { ascending: true });

      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error('Error loading classes:', error);
    }
  };

  const loadClassStudents = async (classId: string) => {
    try {
      const { data, error } = await supabase
        .from('class_students')
        .select(`
          student_id,
          profiles:student_id (
            id,
            email,
            full_name,
            grade
          )
        `)
        .eq('class_id', classId);

      if (error) throw error;
      setClassStudents(data?.map(d => d.profiles) || []);
    } catch (error) {
      console.error('Error loading class students:', error);
    }
  };

  const loadAvailableStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_admin', false)
        .order('full_name', { ascending: true });

      if (error) throw error;
      setAvailableStudents(data || []);
    } catch (error) {
      console.error('Error loading available students:', error);
    }
  };

  const handleAddStudents = async () => {
    if (!selectedClass || selectedStudents.length === 0) return;

    try {
      const { error } = await supabase
        .from('class_students')
        .insert(
          selectedStudents.map(studentId => ({
            class_id: selectedClass.id,
            student_id: studentId
          }))
        );

      if (error) throw error;

      alert('Öğrenciler başarıyla eklendi');
      setShowStudentDialog(false);
      setSelectedStudents([]);
      loadClassStudents(selectedClass.id);
    } catch (error) {
      console.error('Error adding students:', error);
      alert('Öğrenciler eklenirken bir hata oluştu');
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!selectedClass) return;

    try {
      const { error } = await supabase
        .from('class_students')
        .delete()
        .eq('class_id', selectedClass.id)
        .eq('student_id', studentId);

      if (error) throw error;

      loadClassStudents(selectedClass.id);
    } catch (error) {
      console.error('Error removing student:', error);
      alert('Öğrenci çıkarılırken bir hata oluştu');
    }
  };

  useEffect(() => {
    checkAdminStatus();
    fetchUsers();
    fetchStats();
    fetchQuizStats();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadClasses();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (selectedClass) {
      loadClassStudents(selectedClass.id);
    }
  }, [selectedClass]);

  const handleToggleUserStatus = async (userId: string, newStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: newStatus })
        .eq('id', userId);

      if (error) throw error;

      // Kullanıcı listesini güncelle
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, is_active: newStatus }
          : user
      ));

      alert(`Kullanıcı ${newStatus ? 'aktif' : 'pasif'} duruma getirildi`);
    } catch (error) {
      console.error('Error toggling user status:', error);
      alert('Kullanıcı durumu güncellenirken bir hata oluştu');
    }
  };

  const handleToggleVipStatus = async (userId: string, newStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_vip: newStatus })
        .eq('id', userId);

      if (error) throw error;

      // Kullanıcı listesini güncelle
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, is_vip: newStatus }
          : user
      ));

      alert(`Kullanıcı ${newStatus ? 'VIP' : 'normal'} duruma getirildi`);
    } catch (error) {
      console.error('Error toggling VIP status:', error);
      alert('VIP durumu güncellenirken bir hata oluştu');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Admin Paneli
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="admin tabs">
          <Tab label="Kullanıcılar" />
          <Tab label="İstatistikler" />
          <Tab label="Quiz Yönetimi" />
          <Tab label="Sınıf Yönetimi" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Kullanıcı Yönetimi
          </Typography>
        </Box>

        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <TableContainer>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Ad Soyad</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Sınıf</TableCell>
                  <TableCell>Kayıt Tarihi</TableCell>
                  <TableCell>Durum</TableCell>
                  <TableCell>VIP</TableCell>
                  <TableCell>İşlemler</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.full_name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.grade}. Sınıf</TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString('tr-TR')}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={user.is_active ? "Aktif" : "Pasif"}
                        color={user.is_active ? "success" : "error"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <FormControlLabel
                        control={
                          <Switch
                            size="small"
                            checked={user.is_vip}
                            onChange={(e) => handleToggleVipStatus(user.id, e.target.checked)}
                          />
                        }
                        label={user.is_vip ? "VIP" : "Normal"}
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        onClick={() => handleToggleUserStatus(user.id, !user.is_active)}
                        color={user.is_active ? "error" : "success"}
                      >
                        {user.is_active ? <BlockOutlinedIcon /> : <CheckCircleOutlineIcon />}
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Hızlı İstatistikler
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3 }}>
            <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4">{stats.totalUsers}</Typography>
              <Typography variant="body2" color="text.secondary">
                Toplam Kullanıcı
              </Typography>
            </Paper>
            <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4">{stats.totalQuizzes}</Typography>
              <Typography variant="body2" color="text.secondary">
                Tamamlanan Quiz
              </Typography>
            </Paper>
            <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4">{stats.averageScore}</Typography>
              <Typography variant="body2" color="text.secondary">
                Ortalama Puan
              </Typography>
            </Paper>
          </Box>
        </Paper>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Box sx={{ mb: 3 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setShowQuizForm(true)}
          >
            Yeni Quiz Oluştur
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setShowAddClassDialog(true)}
          >
            Yeni Sınıf Ekle
          </Button>
        </Box>

        {/* Quiz Listesi */}
        <Box sx={{ mt: 3 }}>
          {quizzes.map((quiz) => (
            <Paper key={quiz.id} sx={{ p: 2, mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6">{quiz.title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {quiz.description}
                  </Typography>
                  <Typography variant="caption" display="block">
                    Oluşturulma: {new Date(quiz.created_at).toLocaleDateString('tr-TR')}
                  </Typography>
                  <Typography variant="caption" display="block">
                    Sınıf: {quiz.grade}. Sınıf | Ders: {quiz.subject} | Soru Sayısı: {quiz.questions.length}
                  </Typography>
                </Box>
                <Box>
                  <Button
                    variant="outlined"
                    color={quiz.is_active ? "error" : "success"}
                    onClick={() => handleToggleQuizStatus(quiz.id, quiz.is_active)}
                    sx={{ mr: 1 }}
                  >
                    {quiz.is_active ? "Devre Dışı Bırak" : "Etkinleştir"}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setEditingQuiz(quiz);
                      setShowQuizForm(true);
                    }}
                  >
                    Düzenle
                  </Button>
                </Box>
              </Box>
            </Paper>
          ))}
        </Box>

        {/* Quiz Form Modal */}
        <Dialog 
          open={showQuizForm} 
          onClose={() => {
            setShowQuizForm(false);
            setEditingQuiz(null);
          }}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>{editingQuiz ? 'Quiz Düzenle' : 'Yeni Quiz Oluştur'}</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Quiz Başlığı"
                fullWidth
                value={editingQuiz?.title || newQuiz.title}
                onChange={(e) => {
                  if (editingQuiz) {
                    setEditingQuiz({ ...editingQuiz, title: e.target.value });
                  } else {
                    setNewQuiz({ ...newQuiz, title: e.target.value });
                  }
                }}
              />
              <TextField
                label="Açıklama"
                fullWidth
                multiline
                rows={3}
                value={editingQuiz?.description || newQuiz.description}
                onChange={(e) => {
                  if (editingQuiz) {
                    setEditingQuiz({ ...editingQuiz, description: e.target.value });
                  } else {
                    setNewQuiz({ ...newQuiz, description: e.target.value });
                  }
                }}
              />
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  select
                  label="Sınıf"
                  value={editingQuiz?.grade || newQuiz.grade}
                  onChange={(e) => {
                    const value = Number(e.target.value) as 1 | 2 | 3;
                    if (editingQuiz) {
                      setEditingQuiz({ ...editingQuiz, grade: value });
                    } else {
                      setNewQuiz({ ...newQuiz, grade: value });
                    }
                  }}
                  sx={{ width: '150px' }}
                >
                  <MenuItem value={1}>1. Sınıf</MenuItem>
                  <MenuItem value={2}>2. Sınıf</MenuItem>
                  <MenuItem value={3}>3. Sınıf</MenuItem>
                </TextField>
                
                <TextField
                  label="Ders"
                  value={editingQuiz?.subject || newQuiz.subject}
                  onChange={(e) => {
                    if (editingQuiz) {
                      setEditingQuiz({ ...editingQuiz, subject: e.target.value });
                    } else {
                      setNewQuiz({ ...newQuiz, subject: e.target.value });
                    }
                  }}
                  sx={{ flexGrow: 1 }}
                />
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6">
                Sorular ({(editingQuiz?.questions || newQuiz.questions).length})
              </Typography>
              
              {(editingQuiz?.questions || newQuiz.questions).map((question, index) => (
                <Paper key={question.id} sx={{ p: 2, mb: 2 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      label="Soru"
                      fullWidth
                      value={question.question}
                      onChange={(e) => {
                        const updatedQuestion = { ...question, question: e.target.value };
                        handleUpdateQuestion(question.id, updatedQuestion);
                      }}
                    />
                    <TextField
                      label="Soru Resmi URL"
                      fullWidth
                      value={question.questionImageUrl}
                      onChange={(e) => {
                        const updatedQuestion = { ...question, questionImageUrl: e.target.value };
                        handleUpdateQuestion(question.id, updatedQuestion);
                      }}
                    />
                    
                    <Typography variant="subtitle1">Seçenekler:</Typography>
                    {question.options.map((option, optionIndex) => (
                      <Box key={option.id} sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <TextField
                          label={`Seçenek ${optionIndex + 1}`}
                          fullWidth
                          value={option.text}
                          onChange={(e) => {
                            const updatedOptions = [...question.options];
                            updatedOptions[optionIndex] = { ...option, text: e.target.value };
                            const updatedQuestion = { ...question, options: updatedOptions };
                            handleUpdateQuestion(question.id, updatedQuestion);
                          }}
                        />
                        <TextField
                          label="Resim URL"
                          fullWidth
                          value={option.imageUrl}
                          onChange={(e) => {
                            const updatedOptions = [...question.options];
                            updatedOptions[optionIndex] = { ...option, imageUrl: e.target.value };
                            const updatedQuestion = { ...question, options: updatedOptions };
                            handleUpdateQuestion(question.id, updatedQuestion);
                          }}
                        />
                        <IconButton 
                          color="error"
                          onClick={() => {
                            const updatedOptions = question.options.filter((_, i) => i !== optionIndex);
                            const updatedQuestion = { ...question, options: updatedOptions };
                            handleUpdateQuestion(question.id, updatedQuestion);
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    ))}
                    
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={() => {
                        const newOption: QuizOption = {
                          id: Math.random().toString(36).substr(2, 9),
                          text: '',
                          imageUrl: ''
                        };
                        const updatedQuestion = {
                          ...question,
                          options: [...question.options, newOption]
                        };
                        handleUpdateQuestion(question.id, updatedQuestion);
                      }}
                    >
                      Seçenek Ekle
                    </Button>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={() => handleDeleteQuestion(question.id)}
                      >
                        Soruyu Sil
                      </Button>
                    </Box>
                  </Box>
                </Paper>
              ))}

              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    const newQuestion: QuizQuestion = {
                      id: Math.random().toString(36).substr(2, 9),
                      questionImageUrl: '',
                      question: '',
                      options: [],
                      correctOptionId: '',
                      grade: editingQuiz?.grade || newQuiz.grade,
                      subject: editingQuiz?.subject || newQuiz.subject,
                    };
                    
                    if (editingQuiz) {
                      setEditingQuiz({
                        ...editingQuiz,
                        questions: [...editingQuiz.questions, newQuestion]
                      });
                    } else {
                      setNewQuiz({
                        ...newQuiz,
                        questions: [...newQuiz.questions, newQuestion]
                      });
                    }
                  }}
                >
                  Soru Ekle
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={handleAddPredefinedQuestions}
                >
                  Hazır Soruları Ekle
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => {
                    loadQuestionPool();
                    setShowQuestionPoolDialog(true);
                  }}
                >
                  Soru Havuzundan Ekle
                </Button>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => {
                setShowQuizForm(false);
                setEditingQuiz(null);
              }}
            >
              İptal
            </Button>
            <Button 
              variant="contained" 
              color="primary"
              onClick={editingQuiz ? handleEditQuiz : handleCreateQuiz}
            >
              {editingQuiz ? 'Güncelle' : 'Oluştur'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Soru Havuzu Dialog'u */}
        <Dialog
          open={showQuestionPoolDialog}
          onClose={() => setShowQuestionPoolDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Soru Havuzu</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              {questionPool.map(question => (
                <Paper 
                  key={question.id} 
                  sx={{ 
                    p: 2, 
                    cursor: 'pointer',
                    bgcolor: question.selected ? 'action.selected' : 'background.paper'
                  }}
                  onClick={() => toggleQuestionSelection(question.id)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Checkbox
                      checked={question.selected}
                      onChange={() => toggleQuestionSelection(question.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Typography>
                      {question.category} - Soru {question.number}
                    </Typography>
                  </Box>
                </Paper>
              ))}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowQuestionPoolDialog(false)}>
              İptal
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleAddFromQuestionPool}
              disabled={!questionPool.some(q => q.selected)}
            >
              Seçili Soruları Ekle ({questionPool.filter(q => q.selected).length})
            </Button>
          </DialogActions>
        </Dialog>

        {/* Sınıf Ekle Dialog'u */}
        <Dialog
          open={showAddClassDialog}
          onClose={() => setShowAddClassDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Yeni Sınıf Ekle</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Sınıf Adı"
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                fullWidth
              />
              <TextField
                label="Sınıf Seviyesi"
                type="number"
                value={newClassGrade}
                onChange={(e) => setNewClassGrade(e.target.value)}
                fullWidth
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowAddClassDialog(false)}>İptal</Button>
            <Button onClick={handleAddClass} variant="contained">
              Ekle
            </Button>
          </DialogActions>
        </Dialog>
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Sınıf Yönetimi
          </Typography>
        </Box>

        {/* Sınıf Listesi */}
        <Grid container spacing={3}>
          {classes.map((cls) => (
            <Grid item xs={12} md={6} key={cls.id}>
              <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    {cls.name} - {cls.grade}. Sınıf
                  </Typography>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setSelectedClass(cls);
                      loadAvailableStudents();
                      setShowStudentDialog(true);
                    }}
                  >
                    Öğrenci Ekle
                  </Button>
                </Box>

                {/* Sınıf Öğrencileri */}
                <List>
                  {classStudents.map((student) => (
                    <ListItem
                      key={student.id}
                      secondaryAction={
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={() => handleRemoveStudent(student.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      }
                    >
                      <ListItemText
                        primary={student.full_name}
                        secondary={student.email}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Öğrenci Ekleme Dialog'u */}
        <Dialog
          open={showStudentDialog}
          onClose={() => setShowStudentDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Öğrenci Ekle - {selectedClass?.name}</DialogTitle>
          <DialogContent>
            <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                label="Öğrenci Ara"
                variant="outlined"
                size="small"
                fullWidth
                value={studentSearchTerm}
                onChange={(e) => setStudentSearchTerm(e.target.value)}
                sx={{ mb: 1 }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={showOnlyVip}
                    onChange={(e) => setShowOnlyVip(e.target.checked)}
                  />
                }
                label="Sadece VIP"
              />
            </Box>
            <List>
              {availableStudents
                .filter(student => 
                  // Sınıfta olmayan öğrencileri filtrele
                  !classStudents.find(cs => cs.id === student.id) &&
                  // İsim veya email'e göre ara
                  (student.full_name?.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                   student.email.toLowerCase().includes(studentSearchTerm.toLowerCase())) &&
                  // VIP filtresi
                  (!showOnlyVip || student.is_vip)
                )
                .map((student) => (
                  <ListItem key={student.id}>
                    <ListItemIcon>
                      <Checkbox
                        edge="start"
                        checked={selectedStudents.includes(student.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedStudents([...selectedStudents, student.id]);
                          } else {
                            setSelectedStudents(selectedStudents.filter(id => id !== student.id));
                          }
                        }}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {student.full_name}
                          {student.is_vip && (
                            <Chip
                              label="VIP"
                              size="small"
                              color="primary"
                              sx={{ height: 20 }}
                            />
                          )}
                        </Box>
                      }
                      secondary={student.email}
                    />
                  </ListItem>
                ))}
            </List>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowStudentDialog(false)}>İptal</Button>
            <Button onClick={handleAddStudents} variant="contained">
              Ekle
            </Button>
          </DialogActions>
        </Dialog>
      </TabPanel>
    </Container>
  );
}
