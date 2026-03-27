import { useEffect, useState } from 'react';
import { CATEGORY_OPTIONS } from '../../constants/eventMeta';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../state/AuthContext';

export const ProfilePage = () => {
  const { user, profile, role, requestStatus, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [interestsLoading, setInterestsLoading] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(profile?.interests ?? []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedInterests(profile?.interests ?? []);
  }, [profile?.interests]);

  const toggleInterest = (category: string) => {
    setSelectedInterests((prev) => (prev.includes(category) ? prev.filter((v) => v !== category) : [...prev, category]));
  };

  const saveInterests = async () => {
    if (!user) return;
    if (!selectedInterests.length) return alert('Please select at least one interest.');
    setInterestsLoading(true);
    const { error } = await supabase.from('profiles').update({ interests: selectedInterests }).eq('id', user.id);
    setInterestsLoading(false);
    if (error) return alert(error.message);
    await refreshProfile();
    alert('Interests updated.');
  };

  const requestOrganizer = async () => {
    if (!user || requestStatus === 'pending' || role === 'admin') return;
    setLoading(true);
    const { error } = await supabase.from('admin_requests').insert([{ user_id: user.id, status: 'pending' }]);
    if (error && !error.message.toLowerCase().includes('duplicate')) alert(error.message);
    await refreshProfile();
    setLoading(false);
  };

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-xl font-bold">Profile</h1>
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
        <p className="text-sm text-slate-300">Email: {user?.email}</p>
        <p className="text-sm text-slate-300">Role: <span className="font-semibold">{role}</span></p>
      </div>
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
        <h2 className="mb-2 text-lg font-semibold">Your Interests</h2>
        <p className="mb-3 text-sm text-slate-400">Choose categories to personalize your recommended events.</p>
        <div className="grid gap-2 md:grid-cols-2">
          {CATEGORY_OPTIONS.map((category) => {
            const active = selectedInterests.includes(category);
            return (
              <button
                key={category}
                type="button"
                onClick={() => toggleInterest(category)}
                className={`rounded-lg border px-3 py-2 text-left text-sm ${
                  active ? 'border-indigo-400 bg-indigo-500/20 text-indigo-200' : 'border-slate-700 bg-slate-950 text-slate-300'
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          disabled={interestsLoading}
          onClick={() => void saveInterests()}
          className="mt-3 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-60"
        >
          {interestsLoading ? 'Saving...' : 'Save Interests'}
        </button>
      </div>
      {role !== 'admin' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <h2 className="mb-2 text-lg font-semibold">Organizer Access</h2>
          {requestStatus === 'pending' && <StatusBadge text="Request under review" tone="pending" />}
          {requestStatus === 'approved' && <StatusBadge text="You are now an organizer" tone="approved" />}
          {requestStatus === 'rejected' && <StatusBadge text="Request rejected. You can request again." tone="rejected" />}
          {!requestStatus && <p className="mb-3 text-sm text-slate-400">Request organizer access to create and manage events.</p>}
          <button
            disabled={loading || requestStatus === 'pending'}
            onClick={() => void requestOrganizer()}
            className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-60"
          >
            Request Organizer Access
          </button>
        </div>
      )}
    </div>
  );
};

const StatusBadge = ({ text, tone }: { text: string; tone: 'pending' | 'approved' | 'rejected' }) => {
  const cls =
    tone === 'approved'
      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
      : tone === 'rejected'
        ? 'border-rose-500/40 bg-rose-500/10 text-rose-300'
        : 'border-amber-500/40 bg-amber-500/10 text-amber-300';
  return <p className={`mb-3 inline-flex rounded-full border px-3 py-1 text-xs ${cls}`}>{text}</p>;
};

