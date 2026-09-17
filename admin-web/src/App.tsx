import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './store/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './layouts/AdminLayout';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import VendorListPage from './pages/VendorListPage';
import VendorDetailsPage from './pages/VendorDetailsPage';
import CategoriesPage from './pages/CategoriesPage';
import ServicesPage from './pages/ServicesPage';
import PackagesPage from './pages/PackagesPage';
import EventTypesPage from './pages/EventTypesPage';
import UsersPage from './pages/UsersPage';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<AdminLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="users" element={<UsersPage />} />
                <Route path="providers" element={<VendorListPage />} />
                <Route path="providers/:id" element={<VendorDetailsPage />} />
                <Route path="event-types" element={<EventTypesPage />} />
                <Route path="categories" element={<CategoriesPage />} />
                <Route path="services" element={<ServicesPage />} />
                <Route path="packages" element={<PackagesPage />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
