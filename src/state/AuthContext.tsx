/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import type { AdminRequestStatus, Profile, Role } from '../types';

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: Role | null;
  requestStatus: AdminRequestStatus | null;
  loading: boolean;
  isMainAdmin: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const MAIN_ADMIN_EMAIL = (import.meta.env.VITE_MAIN_ADMIN_EMAIL as string | undefined)?.toLowerCase() ?? '';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [requestStatus, setRequestStatus] = useState<AdminRequestStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    const user = session?.user;
    if (!user) {
      setProfile(null);
      setRequestStatus(null);
      return;
    }

    const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (p) setProfile(p as Profile);

    const { data: req } = await supabase
      .from('admin_requests')
      .select('status')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    setRequestStatus((req?.status as AdminRequestStatus | undefined) ?? null);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_e, nextSession) => {
      setSession(nextSession);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    refreshProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  useEffect(() => {
    if (!session?.user) return;
    const interval = setInterval(() => {
      void refreshProfile();
    }, 15000);
    const onFocus = () => {
      void refreshProfile();
    };
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  const user = session?.user ?? null;
  const email = (profile?.email ?? user?.email ?? '').toLowerCase();
  const value: AuthContextValue = {
    user,
    session,
    profile,
    role: profile?.role ?? null,
    requestStatus,
    loading,
    isMainAdmin: !!email && !!MAIN_ADMIN_EMAIL && email === MAIN_ADMIN_EMAIL,
    refreshProfile,
    signOut: async () => {
      await supabase.auth.signOut();
      setProfile(null);
      setRequestStatus(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

