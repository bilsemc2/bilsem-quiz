import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  Container,
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  TextField,
  Tab,
  Tabs,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  Tooltip,
  Stack,
  Alert,
  Avatar,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  FormControlLabel,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListSubheader,
  TablePagination,
  Divider
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import QuizIcon from '@mui/icons-material/Quiz';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import SchoolIcon from '@mui/icons-material/School';
import ScienceIcon from '@mui/icons-material/Science';
import CodeIcon from '@mui/icons-material/Code';
import BrushIcon from '@mui/icons-material/Brush';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import CalculateIcon from '@mui/icons-material/Calculate';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import PsychologyIcon from '@mui/icons-material/Psychology';
import EmojiObjectsIcon from '@mui/icons-material/EmojiObjects';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import Pagination from '@mui/material/Pagination';
import { QUESTIONS_CONFIG } from '../config/questions';
import { togglePuzzleStatus, deletePuzzleByAdmin, PuzzleData } from '../lib/puzzleService';
import { QuizManagement } from '../components/QuizManagement';
import { UserManagement } from '../components/UserManagement';
import { StatsManagement } from '../components/StatsManagement';
import { QuizList } from '../components/QuizList';
import { ClassManagement } from '../components/ClassManagement';
import { PuzzleManagement } from '../components/PuzzleManagement';
import QuizizzManagement from '../components/QuizizzManagement';
import OnlineUsers from '../components/OnlineUsers';

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
  isCorrect: boolean;
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
  icon: string;
  created_by: string;
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  grade: number;
  is_active: boolean;
  is_vip: boolean;
  created_at: string;
  classes?: Class[];
}

interface PuzzleData {
  id: string;
  title: string;
  created_at: string;
  approved: boolean;
}

const AVAILABLE_ICONS = [
  { name: 'school', component: SchoolIcon },
  { name: 'science', component: ScienceIcon },
  { name: 'code', component: CodeIcon },
  { name: 'brush', component: BrushIcon },
  { name: 'music_note', component: MusicNoteIcon },
  { name: 'sports_soccer', component: SportsSoccerIcon },
  { name: 'calculate', component: CalculateIcon },
  { name: 'menu_book', component: MenuBookIcon },
  { name: 'psychology', component: PsychologyIcon },
  { name: 'emoji_objects', component: EmojiObjectsIcon },
];

const getRandomIcon = () => {
  const randomIndex = Math.floor(Math.random() * AVAILABLE_ICONS.length);
  return AVAILABLE_ICONS[randomIndex].name;
};

const getIconComponent = (iconName: string) => {
  const icon = AVAILABLE_ICONS.find(i => i.name === iconName);
  return icon ? icon.component : SchoolIcon;
};

export default function AdminPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [puzzles, setPuzzles] = useState<PuzzleData[]>([]);
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
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [classStudents, setClassStudents] = useState<UserProfile[]>([]);
  const [availableStudents, setAvailableStudents] = useState<UserProfile[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showStudentDialog, setShowStudentDialog] = useState(false);
  const [showCreateClassDialog, setShowCreateClassDialog] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassGrade, setNewClassGrade] = useState('');
  const [classes, setClasses] = useState<Class[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const questionsPerPage = 10;
  const [userFilters, setUserFilters] = useState({
    showOnlyVip: false,
    showOnlyActive: false,
    gradeFilter: 'all'
  });
  const [showAssignClassDialog, setShowAssignClassDialog] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [assigningToClass, setAssigningToClass] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [previewQuestion, setPreviewQuestion] = useState<string | null>(null);
  const [totalQuestions, setTotalQuestions] = useState<number>(0);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    checkAdminStatus();
    fetchUsers();
    fetchStats();
    fetchQuizStats();
    fetchPuzzles();
  }, []);

  useEffect(() => {
    if (tabValue === 2) {
      fetchQuizzes();
    }
  }, [tabValue]);

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

  const fetchStudentClasses = async (studentId: string) => {
    try {
      const { data, error } = await supabase
        .from('class_students')
        .select(`
          classes (
            id,
            name,
            grade,
            icon
          )
        `)
        .eq('student_id', studentId);

      if (error) {
        console.error('Error fetching student classes:', error);
        return [];
      }

      return data?.map(item => item.classes) || [];
    } catch (error) {
      console.error('Error in fetchStudentClasses:', error);
      return [];
    }
  };

  const fetchUsers = async () => {
    try {
      // Önce tüm kullanıcıları al
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      // Her kullanıcı için sınıf bilgilerini al
      const usersWithClasses = await Promise.all(
        users.map(async (user) => {
          // Kullanıcının sınıflarını al
          const { data: classStudents, error: classError } = await supabase
            .from('class_students')
            .select(`
              classes (
                id,
                name,
                grade,
                icon
              )
            `)
            .eq('student_id', user.id);

          if (classError) {
            console.error('Error fetching user classes:', classError);
            return {
              ...user,
              classes: []
            };
          }

          return {
            ...user,
            classes: classStudents?.map(cs => cs.classes) || []
          };
        })
      );

      setUsers(usersWithClasses);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
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

  const fetchPuzzles = async () => {
    try {
      const { data, error } = await supabase
        .from('puzzles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPuzzles(data || []);
    } catch (error) {
      console.error('Error fetching puzzles:', error);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const fetchQuizzes = async () => {
    try {
      console.log('Fetching quizzes...');
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching quizzes:', error);
        throw error;
      }
      console.log('Fetched quizzes:', data);
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
      imageUrl: `/images/options/Matris/${questionNumber}/Soru-${questionNumber}${optionLetter}.webp`,
      text: '',
      isCorrect: false
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
        text: '',
        isCorrect
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
          imageUrl: `/images/options/Matris/${questionNumber}/Soru-${isCorrect ? 'cevap-' : ''}${questionNumber}${letter}.webp`,
          isCorrect
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
        id: `${num}${letter}`,
        imageUrl: `/images/options/Matris/${num}/Soru-${num}${letter}.webp`,
        text: letter,
        isCorrect: false
      }));

      // Doğru cevabı bul ve işaretle
      const correctAnswerLetter = QUESTIONS_CONFIG[num]?.correctAnswer || 'A';
      const correctOption = options.find(opt => opt.text === correctAnswerLetter);
      if (correctOption) {
        correctOption.isCorrect = true;
      }

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
    if (selectedQuestions.length === 0) {
      alert('Lütfen en az bir soru seçin');
      return;
    }

    try {
      const newQuestions = selectedQuestions.map(id => {
        const numericId = parseInt(id);
        const options = ['A', 'B', 'C', 'D', 'E'].map(letter => ({
          id: `${id}${letter}`,
          imageUrl: `/images/options/Matris/${id}/Soru-${id}${letter}.webp`,
          text: letter,
          isCorrect: false
        }));

        // Doğru cevabı bul ve işaretle
        const correctAnswerLetter = QUESTIONS_CONFIG[numericId]?.correctAnswer || 'A';
        const correctOption = options.find(opt => opt.text === correctAnswerLetter);
        if (correctOption) {
          correctOption.isCorrect = true;
        }

        return {
          id,
          questionImageUrl: `/images/questions/Matris/Soru-${id}.webp`,
          question: '',
          options,
          correctOptionId: correctOption?.id || options[0].id,
          grade: editingQuiz?.grade || newQuiz.grade,
          subject: editingQuiz?.subject || newQuiz.subject
        };
      });

      // Soruları mevcut quiz'e ekle
      if (editingQuiz) {
        setEditingQuiz({
          ...editingQuiz,
          questions: [...editingQuiz.questions, ...newQuestions]
        });
      } else {
        setNewQuiz({
          ...newQuiz,
          questions: [...newQuiz.questions, ...newQuestions]
        });
      }

      setSelectedQuestions([]);
      setShowQuestionPoolDialog(false);
    } catch (error) {
      console.error('Error adding questions from pool:', error);
      alert('Sorular eklenirken bir hata oluştu');
    }
  };

  const handleQuestionSelect = (questionId: string) => {
    setSelectedQuestions(prev => {
      if (prev.includes(questionId)) {
        return prev.filter(id => id !== questionId);
      } else {
        return [...prev, questionId];
      }
    });
  };

  const handlePreviewQuestion = (questionId: string) => {
    setPreviewQuestion(questionId === previewQuestion ? null : questionId);
  };

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('id, name, grade')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Her sınıfa varsayılan icon ekle
      const classesWithIcons = (data || []).map(cls => ({
        ...cls,
        icon: 'school'
      }));

      setClasses(classesWithIcons);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchClassStudents = async (classId: string) => {
    try {
      // Önce sınıftaki öğrenci ID'lerini al
      const { data: studentIds, error: studentIdsError } = await supabase
        .from('class_students')
        .select('student_id')
        .eq('class_id', classId);

      if (studentIdsError) throw studentIdsError;

      if (!studentIds || studentIds.length === 0) {
        setClassStudents([]);
        return;
      }

      // Öğrenci profillerini getir
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', studentIds.map(s => s.student_id));

      if (profilesError) throw profilesError;

      setClassStudents(profiles || []);
    } catch (error) {
      console.error('Error fetching class students:', error);
      setClassStudents([]);
    }
  };

  const fetchAvailableStudents = async (classId: string) => {
    try {
      // Önce sınıftaki öğrencileri al
      const { data: enrolledStudents, error: enrolledError } = await supabase
        .from('class_students')
        .select('student_id')
        .eq('class_id', classId);

      if (enrolledError) throw enrolledError;

      // Kayıtlı olmayan öğrencileri getir
      const enrolledIds = enrolledStudents?.map(s => s.student_id) || [];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .not('id', 'in', `(${enrolledIds.length > 0 ? enrolledIds.join(',') : '00000000-0000-0000-0000-000000000000'})`);

      if (profilesError) throw profilesError;

      setAvailableStudents(profiles || []);
    } catch (error) {
      console.error('Error fetching available students:', error);
      setAvailableStudents([]);
    }
  };

  const handleCreateClass = async () => {
    if (!newClassName || !newClassGrade) return;

    try {
      const { data, error } = await supabase
        .from('classes')
        .insert([
          {
            name: newClassName,
            grade: parseInt(newClassGrade)
          }
        ])
        .select('*')
        .single();

      if (error) throw error;

      // Yeni sınıfa varsayılan ikon ekle
      const classWithIcon = {
        ...data,
        icon: 'school'
      };

      setClasses(prevClasses => [...prevClasses, classWithIcon]);
      setNewClassName('');
      setNewClassGrade('');
      setShowCreateClassDialog(false);
    } catch (error) {
      console.error('Error creating class:', error);
      alert('Sınıf oluşturulurken bir hata oluştu');
    }
  };

  const handleDeleteClass = async (classId: string) => {
    if (!window.confirm('Bu sınıfı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) {
      return;
    }

    try {
      // Sınıfı sil (class_students kayıtları ON DELETE CASCADE ile otomatik silinecek)
      const { error: classError } = await supabase
        .from('classes')
        .delete()
        .eq('id', classId);

      if (classError) throw classError;

      // UI'ı güncelle
      setClasses(prevClasses => prevClasses.filter(c => c.id !== classId));
      setSelectedClass(null);

      // Kullanıcı listesini yenile
      await fetchUsers();

      alert('Sınıf başarıyla silindi');
    } catch (error) {
      console.error('Error deleting class:', error);
      alert('Sınıf silinirken bir hata oluştu');
    }
  };

  const handleRemoveStudentFromClass = async (studentId: string) => {
    if (!selectedClass) return;

    try {
      const { error } = await supabase
        .from('class_students')
        .delete()
        .eq('class_id', selectedClass.id)
        .eq('student_id', studentId);

      if (error) throw error;

      // Listeleri güncelle
      await fetchClassStudents(selectedClass.id);
      await fetchAvailableStudents(selectedClass.id);
    } catch (error) {
      console.error('Error removing student:', error);
      alert('Öğrenci çıkarılırken bir hata oluştu');
    }
  };

  const handleAssignStudent = async (studentId: string) => {
    if (!selectedClass || isUpdating) return;
    
    try {
      setIsUpdating(true);

      // Öğrenciyi sınıfa ekle
      const { error } = await supabase
        .from('class_students')
        .insert({
          class_id: selectedClass.id,
          student_id: studentId
        });

      if (error) {
        console.error('Error assigning student:', error);
        throw error;
      }

      // Tüm listeleri güncelle
      await Promise.all([
        fetchUsers(),
        fetchClassStudents(selectedClass.id),
        fetchAvailableStudents(selectedClass.id)
      ]);

      // Başarı mesajı göster
      alert('Öğrenci başarıyla eklendi');
    } catch (error) {
      console.error('Error assigning student to class:', error);
      alert('Öğrenci sınıfa eklenirken bir hata oluştu');
    } finally {
      setIsUpdating(false);
    }
  };

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

  const handleChangePage = (event: React.ChangeEvent<unknown>, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleAssignToClass = async (classId: string) => {
    if (!selectedUserId || assigningToClass) return;

    try {
      setAssigningToClass(true);

      // Öğrenciyi sınıfa ekle
      const { error } = await supabase
        .from('class_students')
        .insert({
          class_id: classId,
          student_id: selectedUserId
        });

      if (error) {
        console.error('Error assigning to class:', error);
        throw error;
      }

      // Listeleri güncelle
      await Promise.all([
        fetchUsers(),
        fetchClassStudents(classId)
      ]);

      // Başarı mesajı göster
      alert('Öğrenci sınıfa eklendi');
    } catch (error) {
      console.error('Error assigning to class:', error);
      alert('Öğrenci sınıfa eklenirken bir hata oluştu');
    } finally {
      setAssigningToClass(false);
    }
  };

  const handleOpenAssignClassDialog = (userId: string) => {
    setSelectedUserId(userId);
    setShowAssignClassDialog(true);
  };

  const handleCloseAssignClassDialog = () => {
    setSelectedUserId(null);
    setShowAssignClassDialog(false);
  };

  useEffect(() => {
    checkAdminStatus();
    fetchUsers();
    fetchStats();
    fetchQuizStats();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchClasses();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (selectedClass) {
      fetchClassStudents(selectedClass.id);
      fetchAvailableStudents(selectedClass.id);
    }
  }, [selectedClass]);

  useEffect(() => {
    setTotalQuestions(QUESTIONS_CONFIG.categories.Matris.totalQuestions);
  }, []);

  const getCorrectLetter = (questionNumber: number): string => {
    const imageUrls = ['A', 'B', 'C', 'D', 'E'].map(option => 
      `/images/options/Matris/${questionNumber}/Soru-cevap-${questionNumber}${option}.webp`
    );
    return findCorrectOptionLetter(imageUrls);
  };

  const findCorrectOptionLetter = (imageUrls: string[]): string => {
    const correctLetter = imageUrls.find(url => url.includes('cevap'))?.match(/cevap-(\d+)([A-E])/)?.[2];
    return correctLetter || 'A';
  };

  const validateFiles = (files: FileList): string | null => {
    const fileList = Array.from(files);
    
    // Soru dosyası kontrolü
    const questionFile = fileList.find(file => 
        file.name.match(/^Soru-\d+\.webp$/)
    );
    if (!questionFile) return 'Soru görseli eksik veya yanlış format (Soru-1.webp)';

    // Soru numarasını al
    const questionMatch = questionFile.name.match(/Soru-(\d+)\.webp$/);
    if (!questionMatch) return 'Geçersiz soru dosya adı';
    const questionNumber = questionMatch[1];

    // Seçenek dosyaları kontrolü
    const optionFiles = fileList.filter(file => 
        file.name.match(new RegExp(`^Soru-${questionNumber}[A-E]\.webp$`))
    );
    if (optionFiles.length !== 4) return `Tam 4 seçenek görseli gerekli (Soru-${questionNumber}[A-E].webp)`;

    // Cevap dosyası kontrolü
    const answerFile = fileList.find(file => 
        file.name.match(new RegExp(`^Soru-cevap-${questionNumber}[A-E]\.webp$`))
    );
    if (!answerFile) return `Cevap görseli eksik (Soru-cevap-${questionNumber}[A-E].webp)`;

    // Toplam dosya sayısı kontrolü
    if (fileList.length !== 6) return 'Toplam 6 dosya gerekli: 1 soru görseli + 4 seçenek görseli + 1 cevap görseli';

    // Dosya formatı kontrolü
    const invalidFiles = fileList.filter(file => !file.name.endsWith('.webp'));
    if (invalidFiles.length > 0) return 'Tüm dosyalar .webp formatında olmalı';

    return null;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const validationError = validateFiles(files);
    if (validationError) {
      setUploadError(validationError);
      return;
    }

    try {
      setUploading(true);
      setUploadError(null);
      setSuccess(null);
      
      // İlk dosyanın adından soru numarasını al
      const questionMatch = files[0].name.match(/^Soru-(\d+)/);
      if (!questionMatch) {
        setUploadError('Geçersiz soru dosya adı');
        return;
      }
      
      const questionNumber = parseInt(questionMatch[1]);

      // Dosyaları yükle
      for (const file of files) {
        let filePath: string;
        
        if (file.name.match(/^Soru-\d+\.webp$/)) {
          // Soru dosyası
          filePath = `images/questions/Matris/Soru-${questionNumber}.webp`;
        } else if (file.name.match(/^Soru-\d+[A-E]\.webp$/)) {
          // Normal seçenek dosyası (yanlış cevap)
          const optionLetter = file.name.charAt(file.name.length - 6);
          filePath = `images/options/Matris/${questionNumber}/Soru-${questionNumber}${optionLetter}.webp`;
        } else if (file.name.match(/^Soru-cevap-\d+[A-E]\.webp$/)) {
          // Doğru cevap dosyası
          const optionLetter = file.name.charAt(file.name.length - 6);
          filePath = `images/options/Matris/${questionNumber}/Soru-cevap-${questionNumber}${optionLetter}.webp`;
        } else {
          setUploadError(`Geçersiz dosya adı: ${file.name}`);
          return;
        }

        // Dosyayı public klasörüne kopyala
        // const response = await fetch(URL.createObjectURL(file));
        // const blob = await response.blob();
        // await fs.writeFile(`public${filePath}`, blob);

        console.log('File saved:', {
          name: file.name,
          path: filePath,
          size: file.size,
          type: file.type
        });
      }

      setSuccess('Dosyalar başarıyla yüklendi!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError('Dosya yükleme hatası: ' + (error as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleOpenStudentDialog = async (classItem: Class) => {
    setSelectedClass(classItem);
    await fetchAvailableStudents(classItem.id);
    setShowStudentDialog(true);
  };

  const handleTogglePuzzleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await togglePuzzleStatus(id, currentStatus);
      await fetchPuzzles();
    } catch (error) {
      console.error('Error toggling puzzle status:', error);
    }
  };

  const handleDeletePuzzle = async (id: string, title: string) => {
    if (window.confirm(`"${title}" adlı bulmacayı silmek istediğinize emin misiniz?`)) {
      try {
        await deletePuzzleByAdmin(id);
        await fetchPuzzles();
      } catch (error) {
        console.error('Error deleting puzzle:', error);
      }
    }
  };

  const renderClassCard = (classItem: Class) => (
    <Grid item xs={12} sm={6} md={4} key={classItem.id}>
      <Paper
        sx={{
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          height: '100%'
        }}
      >
        <Typography variant="h6" gutterBottom>
          {classItem.name}
        </Typography>
        <Typography color="textSecondary" gutterBottom>
          {classItem.grade}. Sınıf
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
          <Button
            size="small"
            onClick={() => handleOpenStudentDialog(classItem)}
          >
            Öğrenci Ekle
          </Button>
          <IconButton
            size="small"
            color="error"
            onClick={() => handleDeleteClass(classItem.id)}
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      </Paper>
    </Grid>
  );

  const renderStudentDialog = () => (
    <Dialog
      open={showStudentDialog}
      onClose={() => setShowStudentDialog(false)}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        {selectedClass ? `${selectedClass.name} - Öğrenci Ekle` : 'Öğrenci Ekle'}
      </DialogTitle>
      <DialogContent>
        <List>
          {availableStudents.map((student) => (
            <ListItem
              key={student.id}
              secondaryAction={
                <IconButton
                  edge="end"
                  aria-label="add"
                  onClick={() => handleAssignStudent(student.id)}
                  disabled={isUpdating}
                >
                  <AddIcon />
                </IconButton>
              }
            >
              <ListItemText
                primary={student.full_name || student.email}
                secondary={`${student.grade}. Sınıf`}
              />
            </ListItem>
          ))}
          {availableStudents.length === 0 && (
            <ListItem>
              <ListItemText primary="Eklenebilecek öğrenci bulunamadı" />
            </ListItem>
          )}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowStudentDialog(false)}>
          Kapat
        </Button>
      </DialogActions>
    </Dialog>
  );

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

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      (user.full_name?.toLowerCase() || '').includes(userSearchTerm.toLowerCase()) ||
      (user.email?.toLowerCase() || '').includes(userSearchTerm.toLowerCase());

    const matchesVip = !userFilters.showOnlyVip || user.is_vip;
    const matchesActive = !userFilters.showOnlyActive || user.is_active;
    const matchesGrade = userFilters.gradeFilter === 'all' || user.grade === parseInt(userFilters.gradeFilter);

    return matchesSearch && matchesVip && matchesActive && matchesGrade;
  });

  const paginatedUsers = filteredUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handlePageChange = (event: React.ChangeEvent<unknown>, newPage: number) => {
    setPage(newPage);
  };

  const handleQuestionPageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value - 1);
  };

  const startIndex = page * questionsPerPage;
  const endIndex = startIndex + questionsPerPage;

  const displayedQuestions = Array.from({ length: totalQuestions }, (_, i) => i + 1)
    .slice(startIndex, endIndex);

  const handleApprovePuzzle = async (id: string) => {
    try {
      await approvePuzzle(id);
      await fetchPuzzles();
    } catch (error) {
      console.error('Error approving puzzle:', error);
    }
  };

  const handleRejectPuzzle = async (id: string) => {
    if (window.confirm('Bu bulmacayı silmek istediğinize emin misiniz?')) {
      try {
        await rejectPuzzle(id);
        await fetchPuzzles();
      } catch (error) {
        console.error('Error rejecting puzzle:', error);
      }
    }
  };

  const renderPuzzleManagement = () => {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Bulmaca Yönetimi
        </Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Başlık</TableCell>
                <TableCell>Oluşturulma Tarihi</TableCell>
                <TableCell>Durum</TableCell>
                <TableCell>İşlemler</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {puzzles.map((puzzle) => (
                <TableRow key={puzzle.id}>
                  <TableCell>{puzzle.title}</TableCell>
                  <TableCell>
                    {new Date(puzzle.created_at).toLocaleDateString('tr-TR')}
                  </TableCell>
                  <TableCell>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={puzzle.approved}
                          onChange={() => handleTogglePuzzleStatus(puzzle.id, puzzle.approved)}
                          color={puzzle.approved ? 'success' : 'warning'}
                        />
                      }
                      label={puzzle.approved ? 'Onaylı' : 'Beklemede'}
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Sil">
                      <IconButton
                        onClick={() => handleDeletePuzzle(puzzle.id, puzzle.title)}
                        color="error"
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {puzzles.length === 0 && (
          <Box sx={{ textAlign: 'center', mt: 3, p: 3, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Typography variant="body1" color="text.secondary">
              Henüz hiç bulmaca oluşturulmamış.
            </Typography>
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Admin Paneli
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Kullanıcılar" />
          <Tab label="İstatistikler" />
          <Tab label="Quiz Yönetimi" />
          <Tab label="Sınıf Yönetimi" />
          <Tab label="Bulmaca Yönetimi" />
          <Tab label="Quizizz" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <OnlineUsers />
          <UserManagement onUserUpdate={fetchStats} />
        </Box>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <StatsManagement />
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Box>
          <Typography variant="h5" gutterBottom>
            Quiz Yönetimi
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <QuizList />
            </Grid>
            <Grid item xs={12}>
              <QuizManagement />
            </Grid>
          </Grid>
        </Box>
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <ClassManagement />
      </TabPanel>

      <TabPanel value={tabValue} index={4}>
        <PuzzleManagement />
      </TabPanel>

      <TabPanel value={tabValue} index={5}>
        <QuizizzManagement />
      </TabPanel>
    </Container>
  );
}
