export type Role = 'user' | 'admin';
export type AdminRequestStatus = 'pending' | 'approved' | 'rejected';

export interface Profile {
  id: string;
  email: string;
  role: Role;
  interests?: string[];
  created_at?: string;
}

export interface EventRow {
  id: string;
  title: string;
  description: string | null;
  city: string;
  venue_name: string;
  address: string;
  latitude: number;
  longitude: number;
  category: string;
  date: string; // timestamptz ISO
  start_at?: string | null;
  end_at?: string | null;
  is_paid: boolean;
  price: number | null;
  max_seats: number;
  created_by: string;
  created_at: string;
}

export interface EventSessionRow {
  id: string;
  event_id: string;
  session_date: string; // YYYY-MM-DD
  start_time: string; // HH:mm:ss
  end_time: string; // HH:mm:ss
  title: string | null;
  created_at: string;
}

export interface RegistrationRow {
  id: string;
  user_id: string;
  event_id: string;
  ticket_id: string;
  payment_status: 'pending' | 'paid' | 'failed';
  created_at: string;
}

export interface SavedEventRow {
  id: string;
  user_id: string;
  event_id: string;
  created_at?: string;
}

export interface AdminRequestRow {
  id: string;
  user_id: string;
  status: AdminRequestStatus;
  created_at: string;
  updated_at?: string;
}

