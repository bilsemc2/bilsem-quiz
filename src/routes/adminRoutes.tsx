import React from 'react';
import { Route } from 'react-router-dom';
import { protectElement } from '@/components/guards/protectElement';

// Admin Page (Lazy)
const AdminPage = React.lazy(() => import('@/pages/AdminPage'));

/**
 * Admin Routes
 * Protected admin routes - require admin privileges
 */
export const adminRoutes = [
    <Route key="admin" path="/admin/*" element={protectElement(<AdminPage />, { requireAdmin: true })} />,
];
