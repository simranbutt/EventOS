import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../state/AuthContext';

export const AdminHomePage = () => {
  const { user } = useAuth();
  const [count, setCount] = useState({ events: 0, registrations: 0 });

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const [{ count: eventCount }, { data: ownEventIds }] = await Promise.all([
        supabase.from('events').select('id', { count: 'exact', head: true }).eq('created_by', user.id),
        supabase.from('events').select('id').eq('created_by', user.id),
      ]);
      const ids = ownEventIds?.map((e: { id: string }) => e.id) ?? [];
      const { count: regCount } = ids.length
        ? await supabase.from('registrations').select('id', { count: 'exact', head: true }).in('event_id', ids)
        : { count: 0 };
      setCount({ events: eventCount ?? 0, registrations: regCount ?? 0 });
    };
    void load();
  }, [user]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Admin Overview</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Events Created" value={count.events} />
        <Card title="Total Registrations" value={count.registrations} />
      </div>
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
        <p className="text-slate-300">Quick actions:</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link to="/admin/events/new" className="rounded-lg bg-indigo-500 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-400">
            Add Event
          </Link>
          <Link to="/admin/events" className="rounded-lg border border-slate-700 px-3 py-2 text-sm hover:border-slate-500">
            Manage Events
          </Link>
        </div>
      </div>
    </div>
  );
};

const Card = ({ title, value }: { title: string; value: number }) => (
  <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg">
    <p className="text-sm text-slate-400">{title}</p>
    <p className="mt-1 text-3xl font-bold">{value}</p>
  </div>
);

