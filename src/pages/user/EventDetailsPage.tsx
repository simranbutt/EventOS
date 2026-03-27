import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../state/AuthContext';
import type { EventRow, EventSessionRow, RegistrationRow } from '../../types';
import { combineSessionDateTime, getEventEnd, getEventStart, isMultiDayEvent, sortSessions } from '../../utils/eventDate';
import { makeTicketId } from '../../utils/ticket';

export const EventDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState<EventRow | null>(null);
  const [sessions, setSessions] = useState<EventSessionRow[]>([]);
  const [registration, setRegistration] = useState<RegistrationRow | null>(null);
  const [saved, setSaved] = useState(false);
  const [seatsTaken, setSeatsTaken] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const load = async () => {
    if (!id || !user) return;
    setLoading(true);
    const [{ data: e }, { data: myReg }, { data: allRegs }, { data: savedRow }, { data: sessionRows }] =
      await Promise.all([
      supabase.from('events').select('*').eq('id', id).single(),
      supabase.from('registrations').select('*').eq('event_id', id).eq('user_id', user.id).maybeSingle(),
      supabase.from('registrations').select('id').eq('event_id', id),
      supabase.from('saved_events').select('id').eq('event_id', id).eq('user_id', user.id).maybeSingle(),
      supabase.from('event_sessions').select('*').eq('event_id', id),
    ]);
    setEvent((e as EventRow) ?? null);
    setSessions(sortSessions((sessionRows as EventSessionRow[] | null) ?? []));
    setRegistration((myReg as RegistrationRow) ?? null);
    setSeatsTaken(allRegs?.length ?? 0);
    setSaved(!!savedRow);
    setLoading(false);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.id]);

  const soldOut = !!event && seatsTaken >= event.max_seats;

  const onRegister = async () => {
    if (!event || !user || soldOut || registration) return;
    setProcessing(true);

    const payment_status = event.is_paid ? 'paid' : 'pending';
    const { data, error } = await supabase
      .from('registrations')
      .insert([{ user_id: user.id, event_id: event.id, ticket_id: makeTicketId(), payment_status }])
      .select('*')
      .single();

    if (!error) {
      setRegistration(data as RegistrationRow);
      setSeatsTaken((n) => n + 1);
    } else {
      alert(error.message.includes('duplicate') ? 'Already registered for this event' : error.message);
    }
    setProcessing(false);
  };

  const toggleSave = async () => {
    if (!user || !event) return;
    if (saved) {
      await supabase.from('saved_events').delete().eq('event_id', event.id).eq('user_id', user.id);
      setSaved(false);
      return;
    }
    await supabase.from('saved_events').insert([{ user_id: user.id, event_id: event.id }]);
    setSaved(true);
  };

  if (loading) return <p className="text-slate-400">Loading event details...</p>;
  if (!event) return <p className="text-slate-400">Event not found.</p>;

  return (
    <div className="space-y-4">
      <button className="text-sm text-indigo-300 hover:text-indigo-200" onClick={() => navigate(-1)}>
        Back
      </button>
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg">
        <div className="mb-2 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5">{event.category}</span>
          <span className={`rounded-full border px-2 py-0.5 ${event.is_paid ? 'border-amber-500/40 bg-amber-500/10 text-amber-300' : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'}`}>
            {event.is_paid ? 'Paid' : 'Free'}
          </span>
          {isMultiDayEvent(event) && <span className="rounded-full border border-indigo-500/40 bg-indigo-500/10 px-2 py-0.5 text-indigo-300">Multi-day</span>}
          {soldOut && <span className="rounded-full border border-rose-500/40 bg-rose-500/10 px-2 py-0.5 text-rose-300">Sold Out</span>}
        </div>
        <h1 className="text-2xl font-bold text-white">{event.title}</h1>
        <p className="mt-2 text-slate-300">{event.description}</p>
        <div className="mt-4 grid gap-2 text-sm text-slate-300 md:grid-cols-2">
          <p><strong>City:</strong> {event.city}</p>
          <p><strong>Venue:</strong> {event.venue_name}</p>
          <p><strong>Address:</strong> {event.address}</p>
          <p><strong>Starts:</strong> {new Date(getEventStart(event)).toLocaleString()}</p>
          <p><strong>Ends:</strong> {new Date(getEventEnd(event)).toLocaleString()}</p>
          <p><strong>Price:</strong> {event.is_paid ? `Rs. ${Number(event.price ?? 0).toFixed(2)}` : 'Free'}</p>
          <p><strong>Seats:</strong> {seatsTaken}/{event.max_seats}</p>
        </div>
        {sessions.length > 0 && (
          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <h2 className="mb-2 text-sm font-semibold text-white">Day-wise Schedule</h2>
            <div className="space-y-2">
              {sessions.map((session) => (
                <div key={session.id} className="rounded-lg border border-slate-800 bg-slate-900/70 p-3 text-sm text-slate-300">
                  <p className="font-medium text-white">
                    {new Date(session.session_date).toLocaleDateString()} •{' '}
                    {combineSessionDateTime(session.session_date, session.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                    {combineSessionDateTime(session.session_date, session.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {session.title && <p className="mt-1 text-xs text-slate-400">{session.title}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <button disabled={soldOut || !!registration || processing} onClick={() => void onRegister()} className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-60">
            {registration ? 'Registered' : event.is_paid ? 'Buy Ticket' : 'Register'}
          </button>
          <button onClick={() => void toggleSave()} className="rounded-xl border border-slate-700 px-4 py-2 text-sm hover:border-slate-500">
            {saved ? 'Unsave Event' : 'Save Event'}
          </button>
          <a
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm hover:border-slate-500"
            href={`https://www.google.com/maps?q=${event.latitude},${event.longitude}`}
          >
            View Location
          </a>
          <Link to="/dashboard" className="rounded-xl border border-slate-700 px-4 py-2 text-sm hover:border-slate-500">
            Find Nearby Events
          </Link>
        </div>
      </div>

      {registration && (
        <div id="ticket" className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-5">
          <h2 className="text-lg font-semibold">Your Ticket</h2>
          <p className="text-sm text-slate-300">Event: {event.title}</p>
          <p className="text-sm text-slate-300">Email: {user?.email}</p>
          <p className="text-sm text-slate-300">Ticket ID: {registration.ticket_id}</p>
          <p className="text-sm text-slate-300">Starts: {new Date(getEventStart(event)).toLocaleString()}</p>
          <p className="text-xs text-slate-400">Valid for all event sessions.</p>
          <button className="mt-3 rounded-lg bg-white px-3 py-1.5 text-sm text-slate-900 hover:bg-slate-200" onClick={() => window.print()}>
            Download Ticket
          </button>
        </div>
      )}
    </div>
  );
};

