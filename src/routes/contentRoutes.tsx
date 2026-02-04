import React from 'react';
import { Route } from 'react-router-dom';
import RequireAuth from '@/components/RequireAuth';

// Content Pages (Lazy)
const BlogPage = React.lazy(() => import('@/pages/BlogPage'));
const BilsemPage = React.lazy(() => import('@/pages/BilsemPage'));
const BilsemRehberiPage = React.lazy(() => import('@/pages/BilsemRehberiPage'));
const BilsemDetailPage = React.lazy(() => import('@/pages/BilsemDetailPage'));
const DeyimlerPage = React.lazy(() => import('@/pages/DeyimlerPage'));
const CreatePdfPage = React.lazy(() => import('@/pages/CreatePdfPage'));
const HomeworkPage = React.lazy(() => import('@/pages/HomeworkPage'));
const QuizizzCodesPage = React.lazy(() => import('@/pages/QuizizzCodesPage'));
const ProfilePage = React.lazy(() => import('@/pages/ProfilePage'));

// Story Pages (Lazy)
const StoryListPage = React.lazy(() => import('@/pages/Story/StoryListPage'));
const StoryDetailPage = React.lazy(() => import('@/pages/Story/StoryDetailPage'));
const StoryQuizGame = React.lazy(() => import('@/pages/Story/StoryQuizGame'));

/**
 * Content Routes
 * Blog, BilsemRehberi, stories, and user content pages
 */
export const contentRoutes = [
    // Public Content
    <Route key="bilsem" path="/bilsem" element={<BilsemPage />} />,
    <Route key="rehberi" path="/bilsem-rehberi" element={<BilsemRehberiPage />} />,
    <Route key="rehberi-detail" path="/bilsem-rehberi/:slug" element={<BilsemDetailPage />} />,
    <Route key="blog" path="/blog" element={<BlogPage />} />,
    <Route key="blog-slug" path="/blog/:slug" element={<BlogPage />} />,
    // Protected Content
    <Route key="deyimler" path="/deyimler" element={<RequireAuth><DeyimlerPage /></RequireAuth>} />,
    <Route key="pdf" path="/create-pdf" element={<RequireAuth><CreatePdfPage /></RequireAuth>} />,
    <Route key="profile" path="/profile" element={<RequireAuth skipXPCheck><ProfilePage /></RequireAuth>} />,
    <Route key="homework" path="/homework" element={<RequireAuth><HomeworkPage /></RequireAuth>} />,
    <Route key="quizizz" path="/quizizz-kodlari" element={<RequireAuth><QuizizzCodesPage /></RequireAuth>} />,
    // Story Routes
    <Route key="stories" path="/stories" element={<RequireAuth><StoryListPage /></RequireAuth>} />,
    <Route key="story" path="/stories/:id" element={<RequireAuth><StoryDetailPage /></RequireAuth>} />,
    <Route key="quiz" path="/stories/quiz-game" element={<RequireAuth><StoryQuizGame /></RequireAuth>} />,
];
