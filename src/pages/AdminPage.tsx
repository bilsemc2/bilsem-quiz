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
  List,
  ListItem,
  ListItemText,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
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
import { QUESTIONS_CONFIG } from '../config/questions';
import { togglePuzzleStatus, deletePuzzleByAdmin } from '../lib/puzzleService';
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
import QuestionManagement from '../components/admin/QuestionManagement';

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
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
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
  questions: QuizQuestion[];
  grade: 1 | 2 | 3;
  subject: string;
  created_at: string;
  is_active: boolean;
  created_by: string;
}

interface QuizQuestion {
  id: string;
  questionImageUrl: string;
  question: string;
  options: QuestionOption[];
  correctOptionId: string;
  grade: 1 | 2 | 3;
  subject: string;
}

interface QuestionOption {
  id: string;
  imageUrl: string;
  text: string;
  isCorrect: boolean;
}

interface NewQuizForm {
  id: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
  grade: 1 | 2 | 3;
  subject: string;
  created_at: string;
  is_active: boolean;
  created_by: string;
}

interface Class {
  id: string;
  name: string;
  grade: 1 | 2 | 3;
  created_by: string;
  icon?: string;
}

interface PuzzleData {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  created_by: string;
  created_at: string;
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
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [newQuizForm, setNewQuizForm] = useState<NewQuizForm>({
    id: '',
    title: '',
    description: '',
    questions: [],
    grade: 1,
    subject: '',
    created_at: new Date().toISOString(),
    is_active: true,
    created_by: user?.id || ''
  });
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion>({
    id: '',
    questionImageUrl: '',
    question: '',
    options: [],
    correctOptionId: '',
    grade: 1,
    subject: ''
  });
  const [showQuizDialog, setShowQuizDialog] = useState(false);
  const [showQuestionDialog, setShowQuestionDialog] = useState(false);

  useEffect(() => {
    if (user) {
      fetchQuizzes();
    }
  }, [user]);

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
    if (!newQuizForm.title || !newQuizForm.description || !newQuizForm.grade || !newQuizForm.subject) {
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
          title: newQuizForm.title,
          description: newQuizForm.description,
          questions: newQuizForm.questions,
          grade: newQuizForm.grade,
          subject: newQuizForm.subject,
          is_active: true,
          created_by: user.id,
          created_at: new Date().toISOString()
        }])
        .select();

      if (error) throw error;

      setQuizzes([...(data || []), ...quizzes]);
      setShowQuizDialog(false);
      setNewQuizForm({
        id: '',
        title: '',
        description: '',
        questions: [],
        grade: 1,
        subject: '',
        created_at: new Date().toISOString(),
        is_active: true,
        created_by: ''
      });
      
      // Refresh quiz list to ensure we have the latest data
      fetchQuizzes();
    } catch (error) {
      console.error('Error creating quiz:', error);
      alert('Quiz oluşturulurken bir hata oluştu');
    }
  };

  const handleAddOption = () => {
    if (currentQuestion.options && currentQuestion.options.length < 5) {
      const optionLetter = String.fromCharCode(65 + currentQuestion.options.length);
      const newOption: QuestionOption = {
        id: `${Date.now()}_${optionLetter}`,
        imageUrl: '',
        text: '',
        isCorrect: false
      };

      setCurrentQuestion(prev => ({
        ...prev,
        options: [...(prev.options || []), newOption]
      }));
    }
  };

  const handleAddQuestion = () => {
    const newQuestion: QuizQuestion = {
      ...currentQuestion,
      id: `${Date.now()}`,
      options: currentQuestion.options || []
    };

    setNewQuizForm(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));

    setCurrentQuestion({
      id: '',
      questionImageUrl: '',
      question: '',
      options: [],
      correctOptionId: '',
      grade: 1,
      subject: ''
    });
  };

  const handleMarkCorrectAnswer = (optionId: string) => {
    setCurrentQuestion(prev => ({
      ...prev,
      correctOptionId: optionId,
      options: prev.options?.map(opt => ({
        ...opt,
        isCorrect: opt.id === optionId
      }))
    }));
  };

  const handleUpdateQuestion = (questionId: string, updatedQuestion: QuizQuestion) => {
    setNewQuizForm(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === questionId ? updatedQuestion : q
      )
    }));
  };

  const handleDeleteQuestion = (questionId: string) => {
    setNewQuizForm(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== questionId)
    }));
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

    fetchQuizzes();
  };

  const handleEditUser = (user: User) => {
    try {
      console.log('Editing user:', user);
      setNewQuizForm({
        id: '',
        title: '',
        description: '',
        questions: [],
        grade: 1,
        subject: '',
        created_at: new Date().toISOString(),
        is_active: true,
        created_by: ''
      });
      setCurrentQuestion({
        id: '',
        questionImageUrl: '',
        question: '',
        options: [],
        correctOptionId: '',
        grade: 1,
        subject: ''
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

      setNewQuizForm(prev => ({
        ...prev,
        [field]: value
      }));
    } catch (error) {
      console.error(`Error updating ${field}:`, error);
    }
  };

  const handleSaveEdit = async () => {
    if (!newQuizForm) {
      toast.error('Quiz bilgisi bulunamadı');
      return;
    }

    try {
      // Güncelleme işlemi
      const { data, error } = await supabase
        .from('assignments')
        .update({
          title: newQuizForm.title,
          description: newQuizForm.description,
          questions: newQuizForm.questions,
          grade: newQuizForm.grade,
          subject: newQuizForm.subject,
          updated_at: new Date().toISOString()
        })
        .eq('id', newQuizForm.id)
        .select()
        .single();

      if (error) {
        console.error('Update error:', error);
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error('Güncelleme başarılı ancak veri dönmedi');
      }

      toast.success('Quiz başarıyla güncellendi!');
      setNewQuizForm({
        id: '',
        title: '',
        description: '',
        questions: [],
        grade: 1,
        subject: '',
        created_at: new Date().toISOString(),
        is_active: true,
        created_by: ''
      });
      setCurrentQuestion({
        id: '',
        questionImageUrl: '',
        question: '',
        options: [],
        correctOptionId: '',
        grade: 1,
        subject: ''
      });
      fetchQuizzes(); // Quiz listesini yenile

    } catch (error) {
      console.error('Error in handleSaveEdit:', error);
      toast.error(error instanceof Error ? error.message : 'Güncelleme sırasında bir hata oluştu');
    }
  };

  const handleUserClick = async (user: any) => {
    console.log('User clicked:', user);
  };

  const handleCloseStats = () => {
    console.log('Stats closed');
  };

  const handleEditQuiz = async () => {
    if (!newQuizForm) return;

    if (!newQuizForm.title || !newQuizForm.description || !newQuizForm.questions.length) {
      alert('Lütfen tüm alanları doldurun ve en az bir soru ekleyin');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('assignments')
        .update({
          title: newQuizForm.title,
          description: newQuizForm.description,
          questions: newQuizForm.questions,
          grade: newQuizForm.grade,
          subject: newQuizForm.subject,
          updated_at: new Date().toISOString()
        })
        .eq('id', newQuizForm.id)
        .select();

      if (error) throw error;

      setQuizzes(quizzes.map(quiz => 
        quiz.id === newQuizForm.id ? { ...newQuizForm, updated_at: new Date().toISOString() } : quiz
      ));
      setShowQuizDialog(false);
      
      // Refresh quiz list
      fetchQuizzes();
      
      alert('Quiz başarıyla güncellendi');
    } catch (error) {
      console.error('Error updating quiz:', error);
      alert('Quiz güncellenirken bir hata oluştu');
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
        grade: newQuizForm.grade,
        subject: newQuizForm.subject,
      };
    });

    // Soruları mevcut quiz'e ekle
    setNewQuizForm({
      ...newQuizForm,
      questions: [...newQuizForm.questions, ...matrisQuestions]
    });
  };

  const handleAddFromQuestionPool = () => {
    console.log('Adding from question pool');
  };

  const handleQuestionSelect = (questionId: string) => {
    console.log('Question selected:', questionId);
  };

  const handlePreviewQuestion = (questionId: string) => {
    console.log('Question previewed:', questionId);
  };

  const fetchClasses = async () => {
    console.log('Fetching classes');
  };

  const fetchClassStudents = async (classId: string) => {
    console.log('Fetching class students:', classId);
  };

  const fetchAvailableStudents = async (classId: string) => {
    console.log('Fetching available students:', classId);
  };

  const handleCreateClass = async () => {
    console.log('Creating class');
  };

  const handleDeleteClass = async (classId: string) => {
    console.log('Deleting class:', classId);
  };

  const handleRemoveStudentFromClass = async (studentId: string) => {
    console.log('Removing student from class:', studentId);
  };

  const handleAssignStudent = async (studentId: string) => {
    console.log('Assigning student:', studentId);
  };

  const handleToggleUserStatus = async (userId: string, newStatus: boolean) => {
    console.log('Toggling user status:', userId, newStatus);
  };

  const handleToggleVipStatus = async (userId: string, newStatus: boolean) => {
    console.log('Toggling VIP status:', userId, newStatus);
  };

  const handleChangePage = (event: React.ChangeEvent<unknown>, newPage: number) => {
    console.log('Page changed:', newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Rows per page changed:', event.target.value);
  };

  const handleAssignToClass = async (classId: string) => {
    console.log('Assigning to class:', classId);
  };

  const handleOpenAssignClassDialog = (userId: string) => {
    console.log('Opening assign class dialog:', userId);
  };

  const handleCloseAssignClassDialog = () => {
    console.log('Closing assign class dialog');
  };

  const handleTogglePuzzleStatus = async (id: string, currentStatus: boolean) => {
    console.log('Toggling puzzle status:', id, currentStatus);
  };

  const handleDeletePuzzle = async (id: string, title: string) => {
    console.log('Deleting puzzle:', id, title);
  };

  const handleCreatePost = async () => {
    console.log('Creating post');
  };

  const handleUpdatePost = async (postId: string, published: boolean) => {
    console.log('Updating post:', postId, published);
  };

  const handleDeletePost = async (postId: string) => {
    console.log('Deleting post:', postId);
  };

  const handleOpenBlogDialog = (post?: BlogPost) => {
    console.log('Opening blog dialog:', post);
  };

  const handleCloseBlogDialog = () => {
    console.log('Closing blog dialog');
  };

  const handleSavePost = async () => {
    console.log('Saving post');
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
        <Tabs 
          aria-label="admin tabs"
          variant="scrollable"
          scrollButtons="auto"
          sx={{ maxWidth: '100%' }}
          value={tabValue}
          onChange={handleTabChange}
        >
          <Tab label="Kullanıcılar" />
          <Tab label="Quiz Yönetimi" />
          <Tab label="İstatistikler" />
          <Tab label="Quiz Listesi" />
          <Tab label="Quizizz" />
          <Tab label="Çevrimiçi Kullanıcılar" />
          <Tab label="XP Gereksinimleri" />
          <Tab label="Sınıf Yönetimi" />
          <Tab label="Soru Yönetimi" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <OnlineUsers />
          <UserManagement onUserUpdate={fetchQuizzes} />
        </Box>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Box>
          <Typography variant="h5" gutterBottom>
            Quiz Yönetimi
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box sx={{ p: 3 }}>
                <Typography variant="h4" gutterBottom>
                  Quiz Yönetimi
                </Typography>

                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={() => setShowQuizDialog(true)}
                  sx={{ mb: 3 }}
                >
                  Yeni Quiz Ekle
                </Button>

                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Başlık</TableCell>
                        <TableCell>Açıklama</TableCell>
                        <TableCell>Sınıf</TableCell>
                        <TableCell>Ders</TableCell>
                        <TableCell>Soru Sayısı</TableCell>
                        <TableCell>Durum</TableCell>
                        <TableCell>İşlemler</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {quizzes.map((quiz) => (
                        <TableRow key={quiz.id}>
                          <TableCell>{quiz.title}</TableCell>
                          <TableCell>{quiz.description}</TableCell>
                          <TableCell>{quiz.grade}. Sınıf</TableCell>
                          <TableCell>{quiz.subject}</TableCell>
                          <TableCell>{quiz.questions.length}</TableCell>
                          <TableCell>
                            <Switch
                              checked={quiz.is_active}
                              onChange={() => handleToggleQuizStatus(quiz.id, quiz.is_active)}
                              color="primary"
                            />
                          </TableCell>
                          <TableCell>
                            <IconButton
                              color="primary"
                              onClick={() => {
                                setNewQuizForm(quiz);
                                setShowQuizDialog(true);
                              }}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              color="error"
                              onClick={() => handleDeleteQuiz(quiz.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Quiz Dialog */}
                <Dialog 
                  open={showQuizDialog} 
                  onClose={() => setShowQuizDialog(false)}
                  maxWidth="md"
                  fullWidth
                >
                  <DialogTitle>
                    {newQuizForm.id ? 'Quiz Düzenle' : 'Yeni Quiz Ekle'}
                  </DialogTitle>
                  <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Quiz Başlığı"
                          value={newQuizForm.title}
                          onChange={(e) => setNewQuizForm(prev => ({ ...prev, title: e.target.value }))}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Açıklama"
                          multiline
                          rows={3}
                          value={newQuizForm.description}
                          onChange={(e) => setNewQuizForm(prev => ({ ...prev, description: e.target.value }))}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="Sınıf"
                          type="number"
                          value={newQuizForm.grade}
                          onChange={(e) => setNewQuizForm(prev => ({ ...prev, grade: parseInt(e.target.value) || 1 }))}
                          inputProps={{ min: 1, max: 12 }}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="Ders"
                          value={newQuizForm.subject}
                          onChange={(e) => setNewQuizForm(prev => ({ ...prev, subject: e.target.value }))}
                        />
                      </Grid>
                    </Grid>

                    <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
                      Sorular
                    </Typography>

                    <List>
                      {newQuizForm.questions.map((question, index) => (
                        <ListItem
                          key={question.id}
                          secondaryAction={
                            <IconButton
                              edge="end"
                              color="error"
                              onClick={() => handleDeleteQuestion(question.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          }
                        >
                          <ListItemIcon>
                            {index + 1}
                          </ListItemIcon>
                          <ListItemText
                            primary={question.question}
                            secondary={`${question.options.length} seçenek`}
                          />
                        </ListItem>
                      ))}
                    </List>

                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={() => setShowQuestionDialog(true)}
                      sx={{ mt: 2 }}
                    >
                      Soru Ekle
                    </Button>
                  </DialogContent>
                  <DialogActions>
                    <Button onClick={() => setShowQuizDialog(false)}>İptal</Button>
                    <Button 
                      variant="contained"
                      onClick={newQuizForm.id ? handleEditQuiz : handleCreateQuiz}
                    >
                      {newQuizForm.id ? 'Güncelle' : 'Oluştur'}
                    </Button>
                  </DialogActions>
                </Dialog>

                {/* Question Dialog */}
                <Dialog
                  open={showQuestionDialog}
                  onClose={() => setShowQuestionDialog(false)}
                  maxWidth="md"
                  fullWidth
                >
                  <DialogTitle>Soru Ekle</DialogTitle>
                  <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Soru"
                          multiline
                          rows={3}
                          value={currentQuestion.question}
                          onChange={(e) => setCurrentQuestion(prev => ({ ...prev, question: e.target.value }))}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Soru Resmi URL"
                          value={currentQuestion.questionImageUrl}
                          onChange={(e) => setCurrentQuestion(prev => ({ ...prev, questionImageUrl: e.target.value }))}
                        />
                      </Grid>
                    </Grid>

                    <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
                      Seçenekler
                    </Typography>

                    <List>
                      {currentQuestion.options?.map((option, index) => (
                        <ListItem
                          key={option.id}
                          secondaryAction={
                            <IconButton
                              edge="end"
                              color={option.isCorrect ? "success" : "default"}
                              onClick={() => handleMarkCorrectAnswer(option.id)}
                            >
                              {option.isCorrect ? "✓" : ""}
                            </IconButton>
                          }
                        >
                          <ListItemIcon>
                            {String.fromCharCode(65 + index)}
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <TextField
                                fullWidth
                                label={`${String.fromCharCode(65 + index)} Seçeneği`}
                                value={option.text}
                                onChange={(e) => {
                                  const newOptions = [...currentQuestion.options];
                                  newOptions[index] = { ...option, text: e.target.value };
                                  setCurrentQuestion(prev => ({ ...prev, options: newOptions }));
                                }}
                              />
                            }
                          />
                        </ListItem>
                      ))}
                    </List>

                    {currentQuestion.options?.length < 5 && (
                      <Button
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={handleAddOption}
                        sx={{ mt: 2 }}
                      >
                        Seçenek Ekle
                      </Button>
                    )}
                  </DialogContent>
                  <DialogActions>
                    <Button onClick={() => setShowQuestionDialog(false)}>İptal</Button>
                    <Button 
                      variant="contained"
                      onClick={handleAddQuestion}
                    >
                      Ekle
                    </Button>
                  </DialogActions>
                </Dialog>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <StatsManagement />
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <Box>
          <Typography variant="h5" gutterBottom>
            Quiz Listesi
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <QuizList />
            </Grid>
          </Grid>
        </Box>
      </TabPanel>

      <TabPanel value={tabValue} index={4}>
        <QuizizzManagement />
      </TabPanel>

      <TabPanel value={tabValue} index={5}>
        <OnlineUsers />
      </TabPanel>

      <TabPanel value={tabValue} index={6}>
        <XPRequirementsManagement />
      </TabPanel>

      <TabPanel value={tabValue} index={7}>
        <ClassManagement />
      </TabPanel>

      <TabPanel value={tabValue} index={8}>
        <QuestionManagement />
      </TabPanel>

      <Dialog
        open={showQuizDialog}
        onClose={() => setShowQuizDialog(false)}
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
            Yeni Quiz
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            <TextField
              label="Başlık"
              fullWidth
              value={newQuizForm.title}
              onChange={(e) => setNewQuizForm(prev => ({ ...prev, title: e.target.value }))}
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
                Açıklama
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={10}
                variant="outlined"
                placeholder="Quiz açıklaması"
                value={newQuizForm.description}
                onChange={(e) => setNewQuizForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <FormControl>
                <InputLabel id="grade-label">Sınıf</InputLabel>
                <Select
                  labelId="grade-label"
                  id="grade-select"
                  value={newQuizForm.grade}
                  label="Sınıf"
                  onChange={(e) => setNewQuizForm(prev => ({ ...prev, grade: e.target.value }))}
                >
                  <MenuItem value={1}>1. Sınıf</MenuItem>
                  <MenuItem value={2}>2. Sınıf</MenuItem>
                  <MenuItem value={3}>3. Sınıf</MenuItem>
                </Select>
              </FormControl>

              <FormControl>
                <InputLabel id="subject-label">Ders</InputLabel>
                <Select
                  labelId="subject-label"
                  id="subject-select"
                  value={newQuizForm.subject}
                  label="Ders"
                  onChange={(e) => setNewQuizForm(prev => ({ ...prev, subject: e.target.value }))}
                >
                  <MenuItem value="Matematik">Matematik</MenuItem>
                  <MenuItem value="Fen Bilimleri">Fen Bilimleri</MenuItem>
                  <MenuItem value="Türkçe">Türkçe</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button 
                onClick={handleAddQuestion}
                variant="contained"
                startIcon={<AddIcon />}
              >
                Soru Ekle
              </Button>
              <Button 
                onClick={handleCreateQuiz}
                variant="contained"
                startIcon={<SaveIcon />}
              >
                Quiz Oluştur
              </Button>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
          <Button 
            onClick={() => setShowQuizDialog(false)}
            color="inherit"
          >
            İptal
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={showQuestionDialog}
        onClose={() => setShowQuestionDialog(false)}
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
            Yeni Soru
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            <Box>
              <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                Soru
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={10}
                variant="outlined"
                placeholder="Soru"
                value={currentQuestion.question}
                onChange={(e) => setCurrentQuestion(prev => ({ ...prev, question: e.target.value }))}
              />
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <FormControl>
                <InputLabel id="grade-label">Sınıf</InputLabel>
                <Select
                  labelId="grade-label"
                  id="grade-select"
                  value={currentQuestion.grade}
                  label="Sınıf"
                  onChange={(e) => setCurrentQuestion(prev => ({ ...prev, grade: e.target.value }))}
                >
                  <MenuItem value={1}>1. Sınıf</MenuItem>
                  <MenuItem value={2}>2. Sınıf</MenuItem>
                  <MenuItem value={3}>3. Sınıf</MenuItem>
                </Select>
              </FormControl>

              <FormControl>
                <InputLabel id="subject-label">Ders</InputLabel>
                <Select
                  labelId="subject-label"
                  id="subject-select"
                  value={currentQuestion.subject}
                  label="Ders"
                  onChange={(e) => setCurrentQuestion(prev => ({ ...prev, subject: e.target.value }))}
                >
                  <MenuItem value="Matematik">Matematik</MenuItem>
                  <MenuItem value="Fen Bilimleri">Fen Bilimleri</MenuItem>
                  <MenuItem value="Türkçe">Türkçe</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button 
                onClick={handleAddOption}
                variant="contained"
                startIcon={<AddIcon />}
              >
                Seçenek Ekle
              </Button>
              <Button 
                onClick={handleMarkCorrectAnswer}
                variant="contained"
                startIcon={<CheckCircleIcon />}
              >
                Doğru Cevap İşaretle
              </Button>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {currentQuestion.options?.map((option, index) => (
                <Box key={option.id} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body1">
                    {option.text}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button 
                      onClick={() => handleUpdateQuestion(currentQuestion.id, { ...currentQuestion, options: currentQuestion.options.map((opt, i) => i === index ? { ...opt, isCorrect: true } : opt) })}
                      variant="contained"
                      startIcon={<CheckCircleIcon />}
                    >
                      Doğru Cevap
                    </Button>
                    <Button 
                      onClick={() => handleUpdateQuestion(currentQuestion.id, { ...currentQuestion, options: currentQuestion.options.filter((opt, i) => i !== index) })}
                      variant="contained"
                      startIcon={<DeleteIcon />}
                    >
                      Sil
                    </Button>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
          <Button 
            onClick={() => setShowQuestionDialog(false)}
            color="inherit"
          >
            İptal
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
