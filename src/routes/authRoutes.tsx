import React from 'react';
import { Route } from 'react-router-dom';

// Auth Pages (Lazy)
const LoginPage = React.lazy(() => import('@/pages/LoginPage'));
const SignUpPage = React.lazy(() => import('@/pages/SignUpPage'));
const ResetPasswordPage = React.lazy(() => import('@/pages/ResetPasswordPage'));

/**
 * Authentication Routes
 * Public routes for login, signup, and password reset
 */
export const authRoutes = [
    <Route key="login" path="/login" element={<LoginPage />} />,
    <Route key="signup" path="/signup" element={<SignUpPage />} />,
    <Route key="reset-password" path="/reset-password" element={<ResetPasswordPage />} />,
];
