import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import NavBar from './components/NavBar';
import HomePage from './pages/HomePage';
import QuizPage from './pages/QuizPage';
import ProfilePage from './pages/ProfilePage';
import ResultPage from './pages/ResultPage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import AdminPage from './pages/AdminPage';
import HomeworkPage from './pages/HomeworkPage';
import DuelPage from './pages/DuelPage';
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
import { AuthProvider } from './contexts/AuthContext';
import { SoundProvider } from './contexts/SoundContext';
import RequireAuth from './components/RequireAuth';
import { Toaster } from 'sonner';
import AdminMessageNotification from './components/AdminMessageNotification';

function App() {
  return (
    <AuthProvider>
      <SoundProvider>
        <AdminMessageNotification />
        <Toaster position="top-center" />
        <Router>
          <div className="min-h-screen bg-gray-50">
            <NavBar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignUpPage />} />
                <Route path="/create-pdf" element={<CreatePdfPage />} />
                <Route 
                  path="/quiz" 
                  element={
                    <RequireAuth>
                      <QuizPage />
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
                  path="/duel" 
                  element={
                    <RequireAuth>
                      <DuelPage />
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
                <Route path="*" element={<Navigate to="/" />} />
                <Route path="/blog" element={<BlogPage />} />
                <Route path="/blog/:slug" element={<BlogPage />} />
              </Routes>
            </main>
          </div>
        </Router>
      </SoundProvider>
    </AuthProvider>
  );
}

export default App;
