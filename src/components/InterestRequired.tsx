import { Navigate } from 'react-router-dom';
import { useAuth } from '../state/AuthContext';

export const InterestRequired = ({ children }: { children: React.ReactElement }) => {
  const { loading, role, profile } = useAuth();

  if (loading) return <div className="min-h-screen grid place-items-center text-slate-400">Loading...</div>;
  if (role !== 'user') return children;

  const interests = profile?.interests ?? [];
  if (!interests.length) return <Navigate to="/onboarding" replace />;
  return children;
};

