import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CATEGORY_OPTIONS } from '../../constants/eventMeta';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../state/AuthContext';

export const OnboardingInterestsPage = () => {
  const navigate = useNavigate();
  const { profile, refreshProfile } = useAuth();
  const [selected, setSelected] = useState<string[]>(profile?.interests ?? []);
  const [saving, setSaving] = useState(false);

  const toggle = (category: string) => {
    setSelected((prev) => (prev.includes(category) ? prev.filter((v) => v !== category) : [...prev, category]));
  };

  const save = async () => {
    if (!profile?.id) return;
    if (!selected.length) return alert('Please select at least one interest.');
    setSaving(true);
    const { error } = await supabase.from('profiles').update({ interests: selected }).eq('id', profile.id);
    setSaving(false);
    if (error) return alert(error.message);
    await refreshProfile();
    navigate('/dashboard');
  };

  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-2xl font-bold text-white">Choose Your Interests</h1>
      <p className="text-sm text-slate-400">Select categories to personalize your recommendations.</p>
      <div className="grid gap-2 md:grid-cols-2">
        {CATEGORY_OPTIONS.map((category) => {
          const active = selected.includes(category);
          return (
            <button
              key={category}
              type="button"
              onClick={() => toggle(category)}
              className={`rounded-xl border px-3 py-2 text-left text-sm transition ${
                active
                  ? 'border-indigo-400 bg-indigo-500/20 text-indigo-200'
                  : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500'
              }`}
            >
              {category}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        disabled={saving}
        onClick={() => void save()}
        className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-60"
      >
        {saving ? 'Saving...' : 'Continue'}
      </button>
    </div>
  );
};

