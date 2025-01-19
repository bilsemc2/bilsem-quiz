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
  Switch,
  FormControlLabel,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Alert,
  Snackbar,
  TablePagination,
  LinearProgress,
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
import Pagination from '@mui/material/Pagination';
import { QUESTIONS_CONFIG } from '../config/questions';
import { togglePuzzleStatus, deletePuzzleByAdmin, PuzzleData } from '../lib/puzzleService';
import { QuizManagement } from '../components/QuizManagement';
import { UserManagement } from '../components/UserManagement';
import { StatsManagement } from '../components/StatsManagement';
import { QuizList } from '../components/QuizList';
import QuizizzManagement from '../components/QuizizzManagement';
import OnlineUsers from '../components/OnlineUsers';
import SaveIcon from '@mui/icons-material/Save';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import XPRequirementsManagement from '../components/admin/XPRequirementsManagement';
import ClassManagement from '../components/ClassManagement';
import ReactMarkdown from 'react-markdown';

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

interface BlogPost {
  id: string;
  title: string;
  content: string;
  published: boolean;
  created_at: string;
  updated_at: string;
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
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
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
  const [assignments, setQuizzes] = useState<Quiz[]>([]);
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
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [openBlogDialog, setOpenBlogDialog] = useState(false);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    published: false
  });

  useEffect(() => {
    const initializePage = async () => {
      if (authLoading || !user) return;

      try {
        // Admin kontrolü
        const { data: adminCheck } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single();

        if (!adminCheck?.is_admin) {
          alert('Bu sayfaya erişim yetkiniz yok!');
          navigate('/');
          return;
        }

        await Promise.all([
          fetchUsers(),
          fetchStats(),
          fetchQuizStats(),
          fetchPuzzles(),
          fetchBlogPosts()
        ]);
      } catch (error) {
        console.error('Veriler yüklenirken hata:', error);
        alert('Bir hata oluştu. Lütfen tekrar deneyin.');
      } finally {
        setLoading(false);
      }
    };

    initializePage();
  }, [user, authLoading]);

  useEffect(() => {
    if (tabValue === 2) {
      fetchQuizzes();
    }
  }, [tabValue]);

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

  const fetchBlogPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setBlogPosts(data || []);
    } catch (error) {
      console.error('Error fetching blog posts:', error);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const fetchQuizzes = async () => {
    try {
      console.log('Fetching assignments...');
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching assignments:', error);
        throw error;
      }
      console.log('Fetched assignments:', data);
      setQuizzes(data || []);
    } catch (error) {
      console.error('Error fetching assignments:', error);
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
        .from('assignments')
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
      imageUrl: `/src/images/options/Matris/${questionNumber}/Soru-${questionNumber}${optionLetter}.webp`,
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
    const questionImageUrl = `/src/images/questions/Matris/Soru-${questionNumber}.webp`;
    
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
        imageUrl: `/src/images/options/Matris/${questionNumber}/Soru-${isCorrect ? 'cevap-' : ''}${questionNumber}${letter}.webp`,
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
          imageUrl: `/src/images/options/Matris/${questionNumber}/Soru-${isCorrect ? 'cevap-' : ''}${questionNumber}${letter}.webp`,
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
        .from('assignments')
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
    if (!editingUser || !user) {
      toast.error('Kullanıcı bilgisi bulunamadı');
      return;
    }

    try {
      // Admin kontrolü
      const { data: adminCheck, error: adminError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (adminError) {
        throw new Error('Admin kontrolü yapılırken bir hata oluştu');
      }

      if (!adminCheck?.is_admin) {
        throw new Error('Admin yetkisine sahip değilsiniz');
      }

      // Güncelleme işlemi
      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: editFormData.full_name,
          points: editFormData.points,
          experience: editFormData.experience,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingUser.id)
        .select()
        .single();

      if (error) {
        console.error('Update error:', error);
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error('Güncelleme başarılı ancak veri dönmedi');
      }

      toast.success('Kullanıcı başarıyla güncellendi!');
      setEditingUser(null);
      fetchUsers(); // Kullanıcı listesini yenile

    } catch (error) {
      console.error('Error in handleSaveEdit:', error);
      toast.error(error instanceof Error ? error.message : 'Güncelleme sırasında bir hata oluştu');
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
        .from('assignments')
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
        imageUrl: `/src/images/options/Matris/${num}/Soru-${num}${letter}.webp`,
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
        questionImageUrl: `/src/images/questions/Matris/Soru-${num}.webp`,
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
          imageUrl: `/src/images/options/Matris/${id}/Soru-${id}${letter}.webp`,
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
          questionImageUrl: `/src/images/questions/Matris/Soru-${id}.webp`,
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

  const handleCreatePost = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('blog_posts')
      .insert([
        {
          title: newPost.title,
          content: newPost.content,
          published: newPost.published,
          author_id: user.id
        }
      ]);

    if (error) {
      alert('Blog yazısı eklenirken bir hata oluştu');
    } else {
      alert('Blog yazısı başarıyla eklendi');
      setOpenBlogDialog(false);
      setNewPost({ title: '', content: '', published: false });
    }
  };

  const handleUpdatePost = async (postId: string, published: boolean) => {
    try {
      const { error } = await supabase
        .from('blog_posts')
        .update({ 
          published: !published, // Mevcut durumun tersini ayarla
          updated_at: new Date().toISOString()
        })
        .eq('id', postId);

      if (error) {
        alert('Blog yazısı güncellenirken bir hata oluştu');
        console.error('Error updating post:', error);
      } else {
        alert(`Blog yazısı ${!published ? 'yayınlandı' : 'taslağa alındı'}`);
        // Yazıları yeniden yükle
        fetchBlogPosts();
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Bir hata oluştu');
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (window.confirm('Bu blog yazısını silmek istediğinize emin misiniz?')) {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', postId);

      if (error) {
        alert('Blog yazısı silinirken bir hata oluştu');
      } else {
        alert('Blog yazısı başarıyla silindi');
      }
    }
  };

  const handleOpenBlogDialog = (post?: BlogPost) => {
    if (post) {
      setSelectedPost(post);
      setNewPost({
        title: post.title,
        content: post.content,
        published: post.published
      });
    } else {
      setSelectedPost(null);
      setNewPost({
        title: '',
        content: '',
        published: false
      });
    }
    setOpenBlogDialog(true);
  };

  const handleCloseBlogDialog = () => {
    setOpenBlogDialog(false);
    setSelectedPost(null);
    setNewPost({
      title: '',
      content: '',
      published: false
    });
  };

  const handleSavePost = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      let error;

      if (selectedPost) {
        // Mevcut yazıyı güncelle
        const { error: updateError } = await supabase
          .from('blog_posts')
          .update({
            title: newPost.title,
            content: newPost.content,
            published: newPost.published,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedPost.id);
        error = updateError;
      } else {
        // Yeni yazı ekle
        const { error: insertError } = await supabase
          .from('blog_posts')
          .insert([{
            title: newPost.title,
            content: newPost.content,
            published: newPost.published,
            author_id: user.id
          }]);
        error = insertError;
      }

      if (error) {
        toast.error(selectedPost ? 'Blog yazısı güncellenirken bir hata oluştu' : 'Blog yazısı eklenirken bir hata oluştu');
        console.error('Error:', error);
      } else {
        toast.success(selectedPost ? 'Blog yazısı başarıyla güncellendi' : 'Blog yazısı başarıyla eklendi');
        handleCloseBlogDialog();
        fetchBlogPosts();
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Bir hata oluştu');
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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
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

  const renderBlogManagement = () => {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Blog Yönetimi
        </Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Başlık</TableCell>
                <TableCell>Son Güncelleme</TableCell>
                <TableCell>Durum</TableCell>
                <TableCell>İşlemler</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {blogPosts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell>{post.title}</TableCell>
                  <TableCell>
                    {new Date(post.updated_at || post.created_at).toLocaleDateString('tr-TR')}
                  </TableCell>
                  <TableCell>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={post.published}
                          onChange={() => handleUpdatePost(post.id, post.published)}
                          color={post.published ? 'success' : 'warning'}
                        />
                      }
                      label={
                        <Typography 
                          variant="body2" 
                          color={post.published ? 'success.main' : 'warning.main'}
                        >
                          {post.published ? 'Yayında' : 'Taslak'}
                        </Typography>
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Düzenle">
                        <IconButton
                          onClick={() => handleOpenBlogDialog(post)}
                          color="primary"
                          size="small"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Sil">
                        <IconButton
                          onClick={() => handleDeletePost(post.id)}
                          color="error"
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {blogPosts.length === 0 && (
          <Box sx={{ textAlign: 'center', mt: 3, p: 3, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Typography variant="body1" color="text.secondary">
              Henüz hiç blog yazısı oluşturulmamış.
            </Typography>
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <Typography variant="h4" component="h1" gutterBottom>
        Admin Paneli
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="admin tabs">
          <Tab label="Kullanıcılar" />
          <Tab label="İstatistikler" />
          <Tab label="Quiz Yönetimi" />
          <Tab label="Sınıf Yönetimi" />
          <Tab label="Blog Yönetimi" />
          <Tab label="Bulmaca Yönetimi" />
          <Tab label="Quizizz Yönetimi" />
          <Tab label="XP Gereksinimleri" />
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
        <Box>
          <Typography variant="h5" gutterBottom>
            Blog Yönetimi
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Button
                variant="contained"
                onClick={() => handleOpenBlogDialog()}
              >
                Yeni Blog Yazısı
              </Button>
            </Grid>
            <Grid item xs={12}>
              {renderBlogManagement()}
            </Grid>
          </Grid>
        </Box>
      </TabPanel>

      <TabPanel value={tabValue} index={5}>
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
      </TabPanel>

      <TabPanel value={tabValue} index={6}>
        <QuizizzManagement />
      </TabPanel>

      <TabPanel value={tabValue} index={7}>
        <XPRequirementsManagement />
      </TabPanel>

      <Dialog
        open={openBlogDialog}
        onClose={handleCloseBlogDialog}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ 
          borderBottom: 1, 
          borderColor: 'divider',
          mb: 2,
          pb: 2
        }}>
          <Typography variant="h5" component="div" fontWeight="bold">
            {selectedPost ? 'Blog Yazısını Düzenle' : 'Yeni Blog Yazısı'}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            <TextField
              label="Başlık"
              fullWidth
              value={newPost.title}
              onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
              InputProps={{
                sx: { 
                  fontSize: '1.5rem',
                  '& input': {
                    fontWeight: 'bold'
                  }
                }
              }}
            />
            
            <Box>
              <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                İçerik (Markdown destekli)
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={10}
                variant="outlined"
                placeholder="# Başlık
## Alt Başlık
**Kalın yazı** ve *italik yazı*

- Liste öğesi 1
- Liste öğesi 2

[Link](https://example.com)

![Resim açıklaması](resim-url)"
                value={newPost.content}
                onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
              />
            </Box>

            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                Önizleme
              </Typography>
              <Paper sx={{ p: 3, bgcolor: 'grey.50' }}>
                <ReactMarkdown>{newPost.content}</ReactMarkdown>
              </Paper>
            </Box>

            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2,
              mt: 2,
              pt: 2,
              borderTop: 1,
              borderColor: 'divider'
            }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={newPost.published}
                    onChange={(e) => setNewPost(prev => ({ ...prev, published: e.target.checked }))}
                  />
                }
                label={
                  <Box>
                    <Typography variant="subtitle1" fontWeight="medium">
                      {newPost.published ? 'Yayında' : 'Taslak'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {newPost.published ? 'Bu yazı hemen yayınlanacak' : 'Bu yazı taslak olarak kaydedilecek'}
                    </Typography>
                  </Box>
                }
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
          <Button 
            onClick={handleCloseBlogDialog}
            color="inherit"
          >
            İptal
          </Button>
          <Button 
            onClick={handleSavePost}
            variant="contained"
            startIcon={<SaveIcon />}
          >
            {selectedPost ? 'Güncelle' : (newPost.published ? 'Yayınla' : 'Kaydet')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
