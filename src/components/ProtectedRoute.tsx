import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../state/AuthContext';
import type { Role } from '../types';

export const ProtectedRoute = ({
  children,
  requireRole,
}: {
  children: React.ReactElement;
  requireRole?: Role;
}) => {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="min-h-screen grid place-items-center text-slate-400">Loading...</div>;
  }

  if (!user) return <Navigate to="/auth" state={{ from: location }} replace />;

  if (requireRole && role !== requireRole) {
    return <Navigate to={role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }

  return children;
};

