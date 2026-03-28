import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CATEGORY_OPTIONS, CITY_OPTIONS } from '../../constants/eventMeta';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../state/AuthContext';
import { combineSessionDateTime } from '../../utils/eventDate';

type FormState = {
  title: string;
  description: string;
  city: string;
  venue_name: string;
  address: string;
  latitude: string;
  longitude: string;
  category: string;
  is_paid: boolean;
  price: string;
  max_seats: string;
};

type SessionForm = {
  session_date: string;
  start_time: string;
  end_time: string;
  title: string;
};

const initial: FormState = {
  title: '',
  description: '',
  city: '',
  venue_name: '',
  address: '',
  latitude: '',
  longitude: '',
  category: '',
  is_paid: false,
  price: '',
  max_seats: '100',
};

const initialSession = (): SessionForm => ({
  session_date: '',
  start_time: '',
  end_time: '',
  title: '',
});

export const AdminEventFormPage = () => {
  const { id } = useParams();
  const editMode = !!id;
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState<FormState>(initial);
  const [sessions, setSessions] = useState<SessionForm[]>([initialSession()]);
  const [loading, setLoading] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      const [{ data }, { data: sessionRows }] = await Promise.all([
        supabase.from('events').select('*').eq('id', id).single(),
        supabase.from('event_sessions').select('*').eq('event_id', id).order('session_date', { ascending: true }),
      ]);
      if (!data) return;
      setForm({
        title: data.title ?? '',
        description: data.description ?? '',
        city: data.city ?? '',
        venue_name: data.venue_name ?? '',
        address: data.address ?? '',
        latitude: String(data.latitude ?? ''),
        longitude: String(data.longitude ?? ''),
        category: data.category ?? '',
        is_paid: !!data.is_paid,
        price: String(data.price ?? ''),
        max_seats: String(data.max_seats ?? '100'),
      });
      if (sessionRows?.length) {
        setSessions(
          sessionRows.map((s) => ({
            session_date: s.session_date,
            start_time: String(s.start_time ?? '').slice(0, 5),
            end_time: String(s.end_time ?? '').slice(0, 5),
            title: s.title ?? '',
          })),
        );
      } else {
        setSessions([initialSession()]);
      }
    };
    void load();
  }, [id]);

  const submit = async () => {
    if (!user) return;
    const requiredText: (keyof FormState)[] = [
      'title',
      'description',
      'city',
      'venue_name',
      'address',
      'latitude',
      'longitude',
      'category',
      'max_seats',
    ];
    const missing = requiredText.find((key) => !String(form[key]).trim());
    if (missing) {
      alert(`Please fill the "${missing.replace('_', ' ')}" field.`);
      return;
    }
    if (!CITY_OPTIONS.includes(form.city as (typeof CITY_OPTIONS)[number])) {
      alert('Please select a valid city.');
      return;
    }
    if (!CATEGORY_OPTIONS.includes(form.category as (typeof CATEGORY_OPTIONS)[number])) {
      alert('Please select a valid category.');
      return;
    }
    if (!Number.isFinite(Number(form.latitude)) || !Number.isFinite(Number(form.longitude))) {
      alert('Latitude and longitude must be valid numbers.');
      return;
    }
    if (!Number.isInteger(Number(form.max_seats)) || Number(form.max_seats) <= 0) {
      alert('Max seats must be a positive whole number.');
      return;
    }
    if (form.is_paid && (!form.price.trim() || Number(form.price) <= 0)) {
      alert('Please enter a valid price for a paid event.');
      return;
    }

    if (!sessions.length) {
      alert('Please add at least one event session.');
      return;
    }

    const normalized = sessions.map((s) => ({
      session_date: s.session_date.trim(),
      start_time: s.start_time.trim(),
      end_time: s.end_time.trim(),
      title: s.title.trim() || null,
    }));

    const missingSession = normalized.find((s) => !s.session_date || !s.start_time || !s.end_time);
    if (missingSession) {
      alert('Please fill date, start time, and end time for each session.');
      return;
    }

    const pastDateSession = normalized.find(s => s.session_date < today);
if (pastDateSession) {
  alert('Event sessions cannot be scheduled for past dates.');
  return;
}

 

    const invalidRange = normalized.find((s) => combineSessionDateTime(s.session_date, s.end_time) <= combineSessionDateTime(s.session_date, s.start_time));
    if (invalidRange) {
      alert('Each session end time must be after start time.');
      return;
    }

    const timeline = normalized.flatMap((s) => [
      combineSessionDateTime(s.session_date, s.start_time).getTime(),
      combineSessionDateTime(s.session_date, s.end_time).getTime(),
    ]);
    const startAt = new Date(Math.min(...timeline)).toISOString();
    const endAt = new Date(Math.max(...timeline)).toISOString();

    setLoading(true);
    const payload = {
      title: form.title,
      description: form.description,
      city: form.city,
      venue_name: form.venue_name,
      address: form.address,
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      category: form.category,
      date: startAt,
      start_at: startAt,
      end_at: endAt,
      is_paid: form.is_paid,
      price: form.is_paid ? Number(form.price || 0) : null,
      max_seats: Number(form.max_seats),
      created_by: user.id,
    };

    const { data: eventResult, error } = editMode
      ? await supabase.from('events').update(payload).eq('id', id).select('id').single()
      : await supabase.from('events').insert([payload]).select('id').single();

    if (error || !eventResult?.id) {
      setLoading(false);
      alert(error?.message ?? 'Unable to save event.');
      return;
    }

    const eventId = eventResult.id as string;
    if (editMode) {
      const { error: deleteError } = await supabase.from('event_sessions').delete().eq('event_id', eventId);
      if (deleteError) {
        setLoading(false);
        alert(deleteError.message);
        return;
      }
    }

    const sessionPayload = normalized.map((s) => ({
      event_id: eventId,
      session_date: s.session_date,
      start_time: `${s.start_time}:00`,
      end_time: `${s.end_time}:00`,
      title: s.title,
    }));
    const { error: sessionsError } = await supabase.from('event_sessions').insert(sessionPayload);
    setLoading(false);
    if (sessionsError) return alert(sessionsError.message);
    navigate('/admin/events');
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{editMode ? 'Edit Event' : 'Add Event'}</h1>
      <div className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 md:grid-cols-2">
        {(
          [
            ['title', 'Title'],
            ['description', 'Description'],
            ['venue_name', 'Venue Name'],
            ['address', 'Address'],
            ['latitude', 'Latitude'],
            ['longitude', 'Longitude'],
            ['max_seats', 'Max Seats'],
            ['price', 'Price'],
          ] as const
        ).map(([key, label]) => (
          <input
            key={key}
            placeholder={label}
            value={form[key]}
            onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
            className={`rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm ${key === 'description' ? 'md:col-span-2' : ''} ${key === 'price' && !form.is_paid ? 'opacity-40' : ''}`}
            disabled={key === 'price' && !form.is_paid}
            required={key !== 'price'}
          />
        ))}
        <select
          value={form.city}
          onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
          className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          required
        >
          <option value="">Select city</option>
          {CITY_OPTIONS.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
        <select
          value={form.category}
          onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          required
        >
          <option value="">Select category</option>
          {CATEGORY_OPTIONS.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm">
          <input type="checkbox" checked={form.is_paid} onChange={(e) => setForm((f) => ({ ...f, is_paid: e.target.checked }))} />
          Is paid event
        </label>
      </div>
      <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Schedule Builder</h2>
          <button
            type="button"
            onClick={() => setSessions((prev) => [...prev, initialSession()])}
            className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm hover:border-slate-500"
          >
            Add Day Session
          </button>
        </div>
        <p className="text-xs text-slate-400">Add one row per day/session. Different timings per day are supported.</p>
        <div className="space-y-2">
          {sessions.map((session, idx) => (
            <div key={`${idx}-${session.session_date}-${session.start_time}`} className="grid gap-2 rounded-xl border border-slate-800 bg-slate-950/60 p-3 md:grid-cols-5">
              <input
                type="date"
                value={session.session_date}
                onChange={(e) =>
                  setSessions((prev) =>
                    prev.map((row, rowIdx) => (rowIdx === idx ? { ...row, session_date: e.target.value } : row)),
                  )
                }
                className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-sm"
                required
              />
              <input
                type="time"
                value={session.start_time}
                onChange={(e) =>
                  setSessions((prev) =>
                    prev.map((row, rowIdx) => (rowIdx === idx ? { ...row, start_time: e.target.value } : row)),
                  )
                }
                className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-sm"
                required
              />
              <input
                type="time"
                value={session.end_time}
                onChange={(e) =>
                  setSessions((prev) =>
                    prev.map((row, rowIdx) => (rowIdx === idx ? { ...row, end_time: e.target.value } : row)),
                  )
                }
                className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-sm"
                required
              />
              <input
                placeholder="Session title (optional)"
                value={session.title}
                onChange={(e) =>
                  setSessions((prev) =>
                    prev.map((row, rowIdx) => (rowIdx === idx ? { ...row, title: e.target.value } : row)),
                  )
                }
                className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-sm md:col-span-1"
              />
              <button
                type="button"
                disabled={sessions.length === 1}
                onClick={() => setSessions((prev) => prev.filter((_, rowIdx) => rowIdx !== idx))}
                className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-2 py-2 text-sm text-rose-300 hover:bg-rose-500/20 disabled:opacity-40"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
      <button onClick={() => void submit()} disabled={loading} className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-60">
        {loading ? 'Saving...' : editMode ? 'Update Event' : 'Create Event'}
      </button>
    </div>
  );
};

