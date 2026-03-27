import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../state/AuthContext';
import type { EventRow } from '../../types';
import { getEventStart } from '../../utils/eventDate';

type EventItem = EventRow & { registration_count: number };

export const AdminMyEventsPage = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('events')
      .select('*, registrations(id)')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false });
    const mapped = data?.map((e: EventRow & { registrations?: { id: string }[] }) => ({ ...e, registration_count: e.registrations?.length ?? 0 })) ?? [];
    setEvents(mapped);
    setLoading(false);
  };

  useEffect(() => {
    const run = async () => {
      await load();
    };
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const remove = async (id: string) => {
    if (!confirm('Delete this event?')) return;
    await supabase.from('events').delete().eq('id', id);
    await load();
  };

  if (loading) return <p className="text-slate-400">Loading events...</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">My Events</h1>
      {!events.length ? (
        <div className="rounded-2xl border border-dashed border-slate-700 p-8 text-center text-slate-400">No events created yet.</div>
      ) : (
        <div className="space-y-3">
          {events.map((e) => {
            const soldOut = e.registration_count >= e.max_seats;
            return (
              <div key={e.id} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{e.title}</h3>
                    <p className="text-sm text-slate-300">
                      {e.city} • {e.category} • {new Date(getEventStart(e)).toLocaleString()}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Seats: {e.registration_count}/{e.max_seats} {soldOut ? '• Sold Out' : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm">
                    <Link to={`/admin/events/${e.id}/edit`} className="rounded-lg border border-slate-700 px-3 py-1.5 hover:border-slate-500">
                      Edit
                    </Link>
                    <button onClick={() => void remove(e.id)} className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-rose-300 hover:bg-rose-500/20">
                      Delete
                    </button>
                    <Link to={`/admin/registrations/${e.id}`} className="rounded-lg border border-slate-700 px-3 py-1.5 hover:border-slate-500">
                      Registrations
                    </Link>
                    <Link to={`/admin/events/${e.id}/edit`} className="rounded-lg bg-indigo-500 px-3 py-1.5 text-white hover:bg-indigo-400">
                      Open
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

