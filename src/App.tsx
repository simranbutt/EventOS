import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthPage } from './pages/AuthPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './state/AuthContext';
import { UserLayout } from './layouts/UserLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { DashboardPage } from './pages/user/DashboardPage';
import { SavedEventsPage } from './pages/user/SavedEventsPage';
import { EventDetailsPage } from './pages/user/EventDetailsPage';
import { ProfilePage } from './pages/user/ProfilePage';
import { OnboardingInterestsPage } from './pages/user/OnboardingInterestsPage';
import { AdminHomePage } from './pages/admin/AdminHomePage';
import { AdminEventFormPage } from './pages/admin/AdminEventFormPage';
import { AdminMyEventsPage } from './pages/admin/AdminMyEventsPage';
import { AdminRegistrationsPage } from './pages/admin/AdminRegistrationsPage';
import { AdminRequestsPage } from './pages/admin/AdminRequestsPage';
import { InterestRequired } from './components/InterestRequired';

const RootRedirect = () => {
  const { user, role, loading, profile } = useAuth();
  if (loading) return <div className="min-h-screen grid place-items-center text-slate-400">Loading...</div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (role === 'user' && !(profile?.interests?.length ?? 0)) return <Navigate to="/onboarding" replace />;
  return <Navigate to={role === 'admin' ? '/admin' : '/dashboard'} replace />;
};

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/auth" element={<AuthPage />} />

        <Route
          element={
            <ProtectedRoute>
              <UserLayout />
            </ProtectedRoute>
          }
        >
          <Route
            path="/dashboard"
            element={
              <InterestRequired>
                <DashboardPage />
              </InterestRequired>
            }
          />
          <Route
            path="/saved"
            element={
              <InterestRequired>
                <SavedEventsPage />
              </InterestRequired>
            }
          />
          <Route
            path="/events/:id"
            element={
              <InterestRequired>
                <EventDetailsPage />
              </InterestRequired>
            }
          />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/onboarding" element={<OnboardingInterestsPage />} />
        </Route>

        <Route
          path="/admin"
          element={
            <ProtectedRoute requireRole="admin">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminHomePage />} />
          <Route path="events" element={<AdminMyEventsPage />} />
          <Route path="events/new" element={<AdminEventFormPage />} />
          <Route path="events/:id/edit" element={<AdminEventFormPage />} />
          <Route path="registrations/:eventId" element={<AdminRegistrationsPage />} />
          <Route path="requests" element={<AdminRequestsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
