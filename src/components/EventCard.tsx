import { Link } from 'react-router-dom';
import type { EventRow } from '../types';
import { getEventEnd, getEventStart, isMultiDayEvent } from '../utils/eventDate';

type Props = {
  event: EventRow & { registration_count?: number; distanceKm?: number };
  badge?: string;
};

export const EventCard = ({ event, badge }: Props) => {
  const isSoldOut = (event.registration_count ?? 0) >= event.max_seats;
  return (
    <Link
      to={`/events/${event.id}`}
      className="group rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg transition hover:-translate-y-0.5 hover:border-indigo-400/40 hover:shadow-glow"
    >
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5">{event.category}</span>
        <span
          className={`rounded-full border px-2 py-0.5 ${event.is_paid ? 'border-amber-500/40 bg-amber-500/10 text-amber-300' : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'}`}
        >
          {event.is_paid ? 'Paid' : 'Free'}
        </span>
        {badge && <span className="rounded-full border border-indigo-500/40 bg-indigo-500/10 px-2 py-0.5 text-indigo-300">{badge}</span>}
        {isSoldOut && <span className="rounded-full border border-rose-500/40 bg-rose-500/10 px-2 py-0.5 text-rose-300">Sold Out</span>}
      </div>
      <h3 className="mb-1 text-lg font-semibold text-white">{event.title}</h3>
      <p className="text-sm text-slate-300">
        {event.city} • {event.venue_name}
      </p>
      <div className="mt-3 flex items-center justify-between text-sm text-slate-400">
        <span>
          {isMultiDayEvent(event)
            ? `${new Date(getEventStart(event)).toLocaleDateString()} - ${new Date(getEventEnd(event)).toLocaleDateString()}`
            : new Date(getEventStart(event)).toLocaleString()}
        </span>
        {typeof event.distanceKm === 'number' ? (
          <span>{event.distanceKm.toFixed(1)} km</span>
        ) : (
          <span>{event.is_paid ? `Rs. ${Number(event.price ?? 0).toFixed(2)}` : 'No cost'}</span>
        )}
      </div>
    </Link>
  );
};

