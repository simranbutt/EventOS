import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../state/AuthContext';

export const AdminLayout = () => {
  const { isMainAdmin, signOut } = useAuth();
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 md:flex">
      <aside className="border-b border-slate-800 bg-slate-900 md:min-h-screen md:w-64 md:border-b-0 md:border-r">
        <div className="border-b border-slate-800 p-4">
          <h1 className="text-xl font-bold">EventOS Admin</h1>
          <p className="text-xs text-slate-400">Organizer dashboard</p>
        </div>
        <nav className="space-y-1 p-3 text-sm">
          <NavLink className="block rounded-lg px-3 py-2 hover:bg-slate-800" to="/admin">
            Overview
          </NavLink>
          <NavLink className="block rounded-lg px-3 py-2 hover:bg-slate-800" to="/admin/events/new">
            Add Event
          </NavLink>
          <NavLink className="block rounded-lg px-3 py-2 hover:bg-slate-800" to="/admin/events">
            My Events
          </NavLink>
          {isMainAdmin && (
            <NavLink className="block rounded-lg px-3 py-2 hover:bg-slate-800" to="/admin/requests">
              Admin Requests
            </NavLink>
          )}
          <button onClick={() => void signOut()} className="mt-3 w-full rounded-lg border border-slate-700 px-3 py-2 text-left hover:border-slate-500">
            Logout
          </button>
        </nav>
      </aside>
      <main className="flex-1 p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  );
};

