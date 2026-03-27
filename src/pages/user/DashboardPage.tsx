import { useEffect, useMemo, useState } from 'react';
import { EventCard } from '../../components/EventCard';
import { supabase } from '../../lib/supabaseClient';
import type { EventRow } from '../../types';
import { getEventEnd, getEventStart } from '../../utils/eventDate';
import { getCurrentCoords, haversineDistanceKm } from '../../utils/location';
import { useAuth } from '../../state/AuthContext';

type EventWithMeta = EventRow & { registration_count: number; save_count: number; distanceKm?: number };

export const DashboardPage = () => {
  const { profile } = useAuth();
  const [now] = useState(() => Date.now());
  const [events, setEvents] = useState<EventWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');
  const [nearby, setNearby] = useState<EventWithMeta[]>([]);
  const [nearbyOnly, setNearbyOnly] = useState(false);
  const [geoError, setGeoError] = useState('');

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('events')
      .select('*, registrations(id), saved_events(id)')
      .order('date', { ascending: true });
    const mapped =
      data?.map((e: EventRow & { registrations?: { id: string }[]; saved_events?: { id: string }[] }) => ({
        ...e,
        registration_count: e.registrations?.length ?? 0,
        save_count: e.saved_events?.length ?? 0,
      })) ?? [];
    setEvents(mapped);
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, []);

  const filtered = useMemo(
    () =>
      events.filter((e) => {
        if (search && !e.title.toLowerCase().includes(search.toLowerCase())) return false;
        if (city && e.city !== city) return false;
        if (category && e.category !== category) return false;
        if (date) {
          const selected = new Date(`${date}T00:00:00`);
          const eventStart = new Date(getEventStart(e));
          const eventEnd = new Date(getEventEnd(e));
          if (!(selected >= new Date(eventStart.toDateString()) && selected <= new Date(eventEnd.toDateString()))) return false;
        }
        return true;
      }),
    [events, search, city, category, date],
  );

  const upcoming = filtered.filter((e) => new Date(getEventStart(e)).getTime() >= now).slice(0, 6);
  const trending = [...filtered]
    .filter((e) => e.registration_count > 0)
    .sort((a, b) => b.registration_count - a.registration_count)
    .slice(0, 6);
  const interests = profile?.interests ?? [];
  const recommended = [...filtered]
    .filter((e) => interests.includes(e.category))
    .sort((a, b) => b.save_count - a.save_count)
    .slice(0, 6);

  const findNearby = async () => {
    try {
      setGeoError('');
      const coords = await getCurrentCoords();
      const within = events
        .map((event) => ({
          ...event,
          distanceKm: haversineDistanceKm(coords.latitude, coords.longitude, event.latitude, event.longitude),
        }))
        .filter((event) => (event.distanceKm ?? 999) <= 20)
        .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
      setNearby(within);
      setNearbyOnly(true);
    } catch {
      setGeoError('Location denied. Please use city filter instead.');
      setNearbyOnly(false);
    }
  };

  const cities = [...new Set(events.map((e) => e.city))];
  const categories = [...new Set(events.map((e) => e.category))];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg">
        <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex-1">
            <label className="mb-1 block text-xs text-slate-400">Search</label>
            <input value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm" placeholder="Search events..." />
          </div>
          <select value={city} onChange={(e) => setCity(e.target.value)} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm">
            <option value="">All cities</option>
            {cities.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm">
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
          <button onClick={() => void findNearby()} className="rounded-xl bg-indigo-500 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-400">
            Find Nearby
          </button>
        </div>
        {geoError && <p className="text-sm text-amber-300">{geoError}</p>}
      </div>

      {loading ? (
        <p className="text-slate-400">Loading events...</p>
      ) : nearbyOnly ? (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Nearby events (20km)</h2>
            <button
              type="button"
              onClick={() => setNearbyOnly(false)}
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-200 hover:border-slate-500"
            >
              Show All Events
            </button>
          </div>
          {nearby.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-700 p-10 text-center text-slate-400">
              No nearby events found within 20km.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {nearby.map((event) => (
                <EventCard key={event.id} event={event} badge="Nearby" />
              ))}
            </div>
          )}
        </section>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-700 p-10 text-center text-slate-400">No events found.</div>
      ) : (
        <>
          <Section title="Upcoming events" items={upcoming} badge="Upcoming" />
          <Section title="Trending events" items={trending} badge="Trending" emptyText="No trending events yet." />
          <Section title="Recommended events" items={recommended} emptyText="No recommendations yet. Add more interests in your profile." />
        </>
      )}
    </div>
  );
};

const Section = ({
  title,
  items,
  badge,
  emptyText = 'No events found.',
}: {
  title: string;
  items: EventWithMeta[];
  badge?: string;
  emptyText?: string;
}) => (
  <section>
    <h2 className="mb-3 text-lg font-semibold text-white">{title}</h2>
    {!items.length ? (
      <div className="rounded-2xl border border-dashed border-slate-700 p-6 text-center text-slate-400">{emptyText}</div>
    ) : (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((event) => (
          <EventCard key={event.id} event={event} badge={badge} />
        ))}
      </div>
    )}
  </section>
);

