import type { EventRow, EventSessionRow } from '../types';

export const getEventStart = (event: EventRow) => event.start_at ?? event.date;
export const getEventEnd = (event: EventRow) => event.end_at ?? event.date;

export const combineSessionDateTime = (sessionDate: string, timeValue: string) => {
  const hhmm = timeValue.slice(0, 5);
  return new Date(`${sessionDate}T${hhmm}:00`);
};

export const sortSessions = (sessions: EventSessionRow[]) =>
  [...sessions].sort((a, b) => {
    const aStart = combineSessionDateTime(a.session_date, a.start_time).getTime();
    const bStart = combineSessionDateTime(b.session_date, b.start_time).getTime();
    return aStart - bStart;
  });

export const isMultiDayEvent = (event: EventRow) => {
  const start = new Date(getEventStart(event)).toDateString();
  const end = new Date(getEventEnd(event)).toDateString();
  return start !== end;
};

