import React from 'react';
import { Route } from 'react-router-dom';
import RequireAuth from '@/components/RequireAuth';

// Admin Page (Lazy)
const AdminPage = React.lazy(() => import('@/pages/AdminPage'));

/**
 * Admin Routes
 * Protected admin routes - require admin privileges
 */
export const adminRoutes = [
    <Route key="admin" path="/admin/*" element={<RequireAuth requireAdmin><AdminPage /></RequireAuth>} />,
];
