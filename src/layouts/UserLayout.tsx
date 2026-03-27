import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../state/AuthContext';

export const UserLayout = () => {
  const { role, signOut } = useAuth();
  return (
    <div className="min-h-screen bg-grid">
      <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
          <div className="text-lg font-bold text-white">EventOS</div>
          <nav className="flex items-center gap-4 text-sm">
            <NavLink className="text-slate-300 hover:text-white" to="/dashboard">
              Dashboard
            </NavLink>
            <NavLink className="text-slate-300 hover:text-white" to="/saved">
              Saved
            </NavLink>
            <NavLink className="text-slate-300 hover:text-white" to="/profile">
              Profile
            </NavLink>
            {role === 'admin' && (
              <NavLink className="rounded-full bg-indigo-500 px-3 py-1 text-white hover:bg-indigo-400" to="/admin">
                Admin
              </NavLink>
            )}
            <button onClick={() => void signOut()} className="rounded-full border border-slate-700 px-3 py-1 text-slate-200 hover:border-slate-500">
              Logout
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
};

