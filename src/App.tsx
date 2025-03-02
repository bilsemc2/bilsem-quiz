import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import NavBar from './components/NavBar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import QuizPage from './pages/QuizPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import AdminPage from './pages/AdminPage';
import HomeworkPage from './pages/HomeworkPage';
import DuelPage from './pages/DuelPage';
import MirrorPage from './pages/MirrorPage';
import MathWorld from './pages/MathWorld';
import LogicPuzzleCreator from './pages/create';
import PuzzleManagement from './pages/admin/PuzzleManagement';
import XPRequirementsPage from './pages/admin/XPRequirementsPage';
import PuzzleRankingPage from './pages/PuzzleRankingPage';
import PuzzlePage from './pages/PuzzlePage';
import CreatePdfPage from './pages/CreatePdfPage';
import GamePage from './pages/GamePage';
import CubePage from './pages/CubePage';
import ClassEnvironmentPage from './pages/ClassEnvironmentPage';
import BlogPage from './pages/BlogPage';
import UnfoldedCubePage from './pages/UnfoldedCubePage';
import AdvancedMissingPieceGame from './pages/MissingPiecePage';
import BilsemC2Page from './pages/BilsemC2Page';
import MirrorGame from './components/MirrorGame';
import CubeCountingPage from './pages/CubeCountingPage';
import ShapeGamePage from './pages/ShapeGamePage';
import RotationGamePage from './pages/RotationGamePage';
import VisualEncoderPage from './pages/VisualEncoderPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import MemoryGamePage from './pages/MemoryGamePage';
import MemoryGamePage2 from './pages/MemoryGamePage2';
import InfiniteMathProblems from './pages/Math/M1/m1';
import ClassroomPage from './pages/ClassroomPage';
import BallGame from './pages/BallGame';
import AssignmentResults from './pages/AssignmentResults';
import ServicesPage from './pages/ServicesPage';
import SpeedReadingPage from './pages/SpeedReadingPage';
import HowItWorksPage from './pages/HowItWorksPage';
import FAQPage from './pages/FAQPage';
import ContactPage from './pages/ContactPage';
import PricingPage from './pages/PricingPage';
import TeacherPricingPage from './pages/TeacherPricingPage';
import { AuthProvider } from './contexts/AuthContext';
import { SoundProvider } from './contexts/SoundContext';
import RequireAuth from './components/RequireAuth';
import { Toaster } from 'react-hot-toast';
import AdminMessageNotification from './components/AdminMessageNotification';
import toast from 'react-hot-toast';
import FilledEmptyPage from './pages/FilledEmptyPage';
import FallingNumbersPage from './pages/FallingNumbersPage';
import BubbleNumbersPage from './pages/BubbleNumbersPage';
import { QuizProvider } from './contexts/QuizContext';
import QuizResultPage from './pages/QuizResultPage';
import DeyimlerPage from './pages/DeyimlerPage';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import AssignmentQuestions from './pages/teacher/AssignmentQuestions';
import AssignmentStudents from './pages/teacher/AssignmentStudents';
// Hata mesajını gösterecek bileşen
const LocationAwareRouter: React.FC = () => {
  const location = useLocation();

  React.useEffect(() => {
    if (location?.state?.error) {
      toast.error(location.state.error);
    }
  }, [location]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <NavBar />
      <main className="flex-1 pt-16">

        <Routes>
          <Route 
            path="/" 
            element={
              <HomePage />
            } 
          />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/filled-empty" element={<FilledEmptyPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/deyimler" element={<DeyimlerPage />} />
          <Route path="/matematik-dunyasi" element={<MathWorld />} />
          <Route 
            path="/create-pdf" 
            element={
              <RequireAuth>
                <CreatePdfPage />
              </RequireAuth>
            } 
          />
          <Route 
            path="/quiz" 
            element={
              <RequireAuth>
                <QuizPage />
              </RequireAuth>
            } 
          />
          <Route 
            path="/duel" 
            element={
              <RequireAuth>
                <DuelPage />
              </RequireAuth>
            } 
          />
          <Route 
            path="/mirror" 
            element={
              <RequireAuth>
                <MirrorPage />
              </RequireAuth>
            } 
          />
          <Route 
            path="/cube" 
            element={
              <CubePage />
            } 
          />
          <Route
            path="/class-environment"
            element={
              <RequireAuth>
                <ClassEnvironmentPage />
              </RequireAuth>
            }
          />
          <Route 
            path="/admin/*" 
            element={
              <RequireAuth requireAdmin>
                <AdminPage />
              </RequireAuth>
            } 
          />
          <Route 
            path="/admin/puzzle-management" 
            element={
              <RequireAuth requireAdmin>
                <PuzzleManagement />
              </RequireAuth>
            } 
          />
          <Route 
            path="/admin/xp-requirements" 
            element={
              <RequireAuth requireAdmin>
                <XPRequirementsPage />
              </RequireAuth>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <RequireAuth skipXPCheck>
                <ProfilePage />
              </RequireAuth>
            } 
          />
          <Route 
            path="/create" 
            element={
              <RequireAuth>
                <LogicPuzzleCreator />
              </RequireAuth>
            } 
          />
          <Route 
            path="/puzzle-creator" 
            element={
              <RequireAuth skipXPCheck>
                <LogicPuzzleCreator />
              </RequireAuth>
            } 
          />
          <Route 
            path="/homework" 
            element={
              <RequireAuth>
                <HomeworkPage />
              </RequireAuth>
            } 
          />

          <Route
            path="/puzzle-ranking" 
            element={
              <RequireAuth>
                <PuzzleRankingPage />
              </RequireAuth>
            }
          />
          <Route
            path="/teacher"
            element={
              <RequireAuth requireTeacher>
                <TeacherDashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/teacher/assignments/:id/questions"
            element={
              <RequireAuth requireTeacher>
                <AssignmentQuestions />
              </RequireAuth>
            }
          />
          <Route
            path="/teacher/assignments/:id/students"
            element={
              <RequireAuth requireTeacher>
                <AssignmentStudents />
              </RequireAuth>
            }
          />
          <Route 
            path="/puzzle/:id" 
            element={
              <RequireAuth>
                <PuzzlePage />
              </RequireAuth>
            } 
          />
          <Route 
            path="/game" 
            element={
              <RequireAuth>
                <GamePage />
              </RequireAuth>
            } 
          />
          <Route 
            path="/spatial/cube" 
            element={
              <RequireAuth>
                <CubePage />
              </RequireAuth>
            } 
          />

          <Route path="/unfolded-cube" element={<UnfoldedCubePage />} />
          <Route path="/missing-piece" element={<AdvancedMissingPieceGame />} />
          <Route path="/bilsemc2" element={<BilsemC2Page />} />
          <Route path="/mirror-games" element={<MirrorGame />} />
          <Route path="/cube-counting" element={<CubeCountingPage />} />
          <Route path="/shape-game" element={<ShapeGamePage />} />
          <Route path="/rotation-game" element={<RotationGamePage />} />
          <Route path="/visual-encoder" element={<VisualEncoderPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/teacher-pricing" element={<TeacherPricingPage />} />
          <Route path="/speed-reading" element={<SpeedReadingPage />} />
          <Route 
            path="/memory-game-2" 
            element={
              <RequireAuth>
                <MemoryGamePage2 />
              </RequireAuth>
            } 
          />
          <Route 
            path="/math/M1/m1" 
            element={
              <InfiniteMathProblems />
            } 
          />
          <Route 
            path="/memory-game" 
            element={
              <RequireAuth>
                <MemoryGamePage />
              </RequireAuth>
            } 
          />
          <Route
            path="/classroom/:classId"
            element={
              <RequireAuth>
                <ClassroomPage />
              </RequireAuth>
            }
          />
          <Route 
            path="/ball-game" 
            element={
              <RequireAuth>
                <BallGame />
              </RequireAuth>
            } 
          />

          <Route path="/games" element={<GamePage />} />
          <Route path="/falling-numbers" element={<FallingNumbersPage />} />
          <Route path="/cube" element={<CubePage />} />
          <Route path="/bubble-numbers" element={<BubbleNumbersPage />} />
          <Route path="/quiz/:quizId/results" element={
            <RequireAuth>
              <QuizResultPage />
            </RequireAuth>
          } />
          <Route 
            path="/quiz/:quizId" 
            element={
              <RequireAuth>
                <QuizPage />
              </RequireAuth>
            } 
          />
          <Route 
            path="/assignments/quiz/:quizId" 
            element={
              <RequireAuth>
                <QuizPage />
              </RequireAuth>
            } 
          />
          <Route 
            path="/quiz/:quizId/result" 
            element={
              <RequireAuth>
                <QuizResultPage />
              </RequireAuth>
            } 
          />
          <Route 
            path="/assignments/results/:assignmentId" 
            element={
              <RequireAuth>
                <AssignmentResults />
              </RequireAuth>
            } 
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <SoundProvider>
        <AdminMessageNotification />
        <Toaster position="top-center" />
        <Router>
          <QuizProvider>
            <LocationAwareRouter />
          </QuizProvider>
        </Router>
      </SoundProvider>
    </AuthProvider>
  );
}

export default App;
