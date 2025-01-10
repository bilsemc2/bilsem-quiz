import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import NavBar from './components/NavBar';
import HomePage from './pages/HomePage';
import QuizPage from './pages/QuizPage';
import ProfilePage from './pages/ProfilePage';
import ResultPage from './pages/ResultPage';
import TeacherPage from './pages/TeacherPage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import AdminPage from './pages/AdminPage';
import HomeworkPage from './pages/HomeworkPage';
import DuelPage from './pages/DuelPage';
import MirrorPage from './pages/MirrorPage';
import LogicPuzzleCreator from './pages/create';
import PuzzleManagement from './pages/admin/PuzzleManagement';
import XPRequirementsPage from './pages/admin/XPRequirementsPage';
import PuzzleRankingPage from './pages/PuzzleRankingPage';
import PuzzlePage from './pages/PuzzlePage';
import CreatePdfPage from './pages/CreatePdfPage';
import GamePage from './pages/GamePage';
import CubePage from './pages/CubePage';
import ComingSoonPage from './pages/ComingSoonPage';
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
import FoldingGamesPage from './pages/FoldingGamesPage';
import ClassroomPage from './pages/ClassroomPage';
import BallGame from './pages/BallGame';
import { AuthProvider } from './contexts/AuthContext';
import { SoundProvider } from './contexts/SoundContext';
import RequireAuth from './components/RequireAuth';
import ProtectedRoute from './components/ProtectedRoute';
import { Toaster } from 'sonner';
import AdminMessageNotification from './components/AdminMessageNotification';
import ExtensionIcon from '@mui/icons-material/Extension';
import toast from 'react-hot-toast';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Hata mesajını gösterecek bileşen
const LocationAwareRouter: React.FC = () => {
  const location = useLocation();

  React.useEffect(() => {
    if (location?.state?.error) {
      toast.error(location.state.error);
    }
  }, [location]);

  return (
    <div className="min-h-screen bg-gray-50">
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
              <ProtectedRoute>
                <QuizPage />
              </ProtectedRoute>
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
            path="/admin" 
            element={
              <RequireAuth requireAdmin>
                <AdminPage />
              </RequireAuth>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <RequireAuth>
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
              <RequireAuth>
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
            path="/result" 
            element={
              <RequireAuth>
                <ResultPage />
              </RequireAuth>
            } 
          />
          <Route 
            path="/ogretmenim" 
            element={
              <RequireAuth>
                <TeacherPage />
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
          <Route 
            path="/spatial/folding" 
            element={
              <RequireAuth>
                <ComingSoonPage />
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
          <Route 
            path="/memory-game-2" 
            element={
              <RequireAuth>
                <MemoryGamePage2 />
              </RequireAuth>
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
            path="/folding" 
            element={
              <RequireAuth>
                <FoldingGamesPage />
              </RequireAuth>
            } 
          />
          <Route
            path="/classroom/:grade"
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
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
};

function App() {
  return (
    <>
      <AuthProvider>
        <SoundProvider>
          <AdminMessageNotification />
          <Toaster position="top-center" />
          <Router>
            <LocationAwareRouter />
          </Router>
        </SoundProvider>
      </AuthProvider>
      <ToastContainer position="bottom-right" />
    </>
  );
}

export default App;
