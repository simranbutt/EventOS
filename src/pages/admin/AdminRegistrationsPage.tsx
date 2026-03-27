import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';

type RegistrationView = {
  id: string;
  ticket_id: string;
  payment_status: string;
  created_at: string;
  user: { email?: string } | null;
};

export const AdminRegistrationsPage = () => {
  const { eventId } = useParams();
  const [rows, setRows] = useState<RegistrationView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!eventId) return;
      const { data } = await supabase
        .from('registrations')
        .select('id, ticket_id, payment_status, created_at, user:profiles!registrations_user_id_fkey(email)')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });
      setRows((data as RegistrationView[]) ?? []);
      setLoading(false);
    };
    void load();
  }, [eventId]);

  if (loading) return <p className="text-slate-400">Loading registrations...</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Event Registrations</h1>
      {!rows.length ? (
        <div className="rounded-2xl border border-dashed border-slate-700 p-8 text-center text-slate-400">No registrations yet.</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-900 text-left text-slate-300">
              <tr>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Ticket ID</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-slate-800">
                  <td className="px-4 py-3">{r.user?.email ?? '-'}</td>
                  <td className="px-4 py-3">{r.ticket_id}</td>
                  <td className="px-4 py-3">{r.payment_status}</td>
                  <td className="px-4 py-3">{new Date(r.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

