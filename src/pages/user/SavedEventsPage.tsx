import { useEffect, useState } from 'react';
import { EventCard } from '../../components/EventCard';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../state/AuthContext';
import type { EventRow } from '../../types';

export const SavedEventsPage = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('saved_events')
        .select('event:events(*)')
        .eq('user_id', user.id);
      const rows =
        data
          ?.flatMap((d: { event: EventRow | EventRow[] | null }) =>
            Array.isArray(d.event) ? d.event : d.event ? [d.event] : [],
          )
          .filter(Boolean) ?? [];
      setEvents(rows);
      setLoading(false);
    };
    void load();
  }, [user]);

  if (loading) return <p className="text-slate-400">Loading saved events...</p>;
  if (!events.length) return <div className="rounded-2xl border border-dashed border-slate-700 p-10 text-center text-slate-400">No saved events yet.</div>;

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">Saved Events</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
};

