import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import WorkshopsPage from './pages/WorkshopsPage';
import WorkshopDetailPage from './pages/WorkshopDetailPage';
import WorkshopFormPage from './pages/WorkshopFormPage';
import UsersPage from './pages/UsersPage';

function IndexRedirect() {
  const { user } = useAuth();
  if (user?.role === 'ADMIN') {
    return <Navigate to="/users" replace />;
  }
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><IndexRedirect /></ProtectedRoute>} />
          
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['MANAGER', 'STAFF']}>
                  <DashboardPage />
                </ProtectedRoute>
              } 
            />
            <Route
              path="/workshops"
              element={
                <ProtectedRoute allowedRoles={['MANAGER', 'STAFF']}>
                  <WorkshopsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/workshops/new"
              element={
                <ProtectedRoute allowedRoles={['MANAGER']}>
                  <WorkshopFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/workshops/:id"
              element={
                <ProtectedRoute allowedRoles={['MANAGER', 'STAFF']}>
                  <WorkshopDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/workshops/:id/edit"
              element={
                <ProtectedRoute allowedRoles={['MANAGER']}>
                  <WorkshopFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <UsersPage />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
