import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../state/AuthContext';

export const AuthPage = () => {
  const { user, role } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (user) return <Navigate to={role === 'admin' ? '/admin' : '/dashboard'} replace />;

  const onSubmit = async (formData: FormData) => {
    setError('');
    setLoading(true);
    const email = String(formData.get('email') ?? '');
    const password = String(formData.get('password') ?? '');

    const { error: authError } =
      mode === 'signup'
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });

    if (authError) setError(authError.message);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 p-4">
      <div className="mx-auto mt-10 w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-glow">
        <h1 className="text-2xl font-bold text-white">EventOS</h1>
        <p className="mt-1 text-sm text-slate-400">Sign in to discover and manage events.</p>

        <div className="mt-5 grid grid-cols-2 rounded-xl bg-slate-800 p-1 text-sm">
          <button className={`rounded-lg px-3 py-2 ${mode === 'login' ? 'bg-indigo-500 text-white' : 'text-slate-300'}`} onClick={() => setMode('login')}>
            Login
          </button>
          <button className={`rounded-lg px-3 py-2 ${mode === 'signup' ? 'bg-indigo-500 text-white' : 'text-slate-300'}`} onClick={() => setMode('signup')}>
            Signup
          </button>
        </div>

        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void onSubmit(new FormData(e.currentTarget));
          }}
        >
          <input required name="email" type="email" placeholder="Email" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
          <input required name="password" type="password" placeholder="Password" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <button disabled={loading} className="w-full rounded-xl bg-indigo-500 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-60">
            {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  );
};

