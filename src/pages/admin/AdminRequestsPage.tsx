import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../state/AuthContext';
import type { AdminRequestStatus } from '../../types';

type RequestView = {
  id: string;
  user_id: string;
  status: AdminRequestStatus;
  created_at: string;
  profile: { email?: string } | null;
};

export const AdminRequestsPage = () => {
  const { isMainAdmin, refreshProfile } = useAuth();
  const [rows, setRows] = useState<RequestView[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase
      .from('admin_requests')
      .select('id, user_id, status, created_at, profile:profiles!admin_requests_user_id_fkey(email)')
      .order('created_at', { ascending: false });
    setRows((data as RequestView[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    const run = async () => {
      if (isMainAdmin) await load();
    };
    void run();
  }, [isMainAdmin]);

  const updateStatus = async (row: RequestView, status: 'approved' | 'rejected') => {
    const { error, data: requestUpdate } = await supabase
      .from('admin_requests')
      .update({ status })
      .eq('id', row.id)
      .select('id');
    if (error) return alert(error.message);
    if (!requestUpdate?.length) return alert('Could not update request status. Check RLS policy for admin_requests.');

    if (status === 'approved') {
      const { error: roleError, data: roleUpdate } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', row.user_id)
        .select('id');
      if (roleError) return alert(roleError.message);
      if (!roleUpdate?.length) return alert('Request approved, but role update failed due to policy. Please run profiles_update_main_admin policy SQL.');
    }
    await load();
    await refreshProfile();
  };

  if (!isMainAdmin) return <Navigate to="/admin" replace />;
  if (loading) return <p className="text-slate-400">Loading requests...</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Admin Requests</h1>
      {!rows.length ? (
        <div className="rounded-2xl border border-dashed border-slate-700 p-8 text-center text-slate-400">No organizer requests.</div>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <div>
                <p className="font-medium text-white">{r.profile?.email ?? 'Email unavailable (policy issue)'}</p>
                <p className="text-xs text-slate-400">User ID: {r.user_id}</p>
                <p className="text-xs text-slate-400">Requested: {new Date(r.created_at).toLocaleString()}</p>
                <p className="text-xs text-slate-400">Status: {r.status}</p>
              </div>
              <div className="flex gap-2">
                <button disabled={r.status === 'approved'} onClick={() => void updateStatus(r, 'approved')} className="rounded-lg bg-emerald-500 px-3 py-1.5 text-sm text-white hover:bg-emerald-400 disabled:opacity-60">
                  Approve
                </button>
                <button disabled={r.status === 'rejected'} onClick={() => void updateStatus(r, 'rejected')} className="rounded-lg bg-rose-500 px-3 py-1.5 text-sm text-white hover:bg-rose-400 disabled:opacity-60">
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

