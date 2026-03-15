import React from 'react';
import { Route } from 'react-router-dom';
import GuestGuard from '@/components/guards/GuestGuard';

// Auth Pages (Lazy)
const LoginPage = React.lazy(() => import('@/pages/LoginPage'));
const SignUpPage = React.lazy(() => import('@/pages/SignUpPage'));
const ResetPasswordPage = React.lazy(() => import('@/pages/ResetPasswordPage'));

/**
 * Authentication Routes
 * Public routes for login, signup, and password reset
 */
export const authRoutes = [
    <Route key="login" path="/login" element={<GuestGuard><LoginPage /></GuestGuard>} />,
    <Route key="signup" path="/signup" element={<GuestGuard><SignUpPage /></GuestGuard>} />,
    <Route key="reset-password" path="/reset-password" element={<ResetPasswordPage />} />,
];
