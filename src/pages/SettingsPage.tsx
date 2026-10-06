import { useCallback, useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { api, apiBaseUrl, type User, uploadProfileImage } from '../api';

type Props = {
  me: User;
  token: string;
  notify: (notice: { tone: 'success' | 'error' | 'info'; text: string }) => void;
  onMeUpdate: (user: User) => void;
};

const STORAGE_KEYS = { logo: 'admin-brand-logo' };

function readStoredImage(key: string) {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(key) || '';
}

function normalizeImageUrl(value: string | { url?: string; alt?: string; publicId?: string } | null | undefined) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value.url || '';
}

export function SettingsPage({ me, token, notify, onMeUpdate }: Props) {
  const [name, setName] = useState(me.name);
  const email = me.email;
  const [profileImage, setProfileImage] = useState(() => normalizeImageUrl(me.image));
  const [logo, setLogo] = useState(readStoredImage(STORAGE_KEYS.logo));
  const [checking, setChecking] = useState(true);
  const [health, setHealth] = useState({ backend: 'Checking', latency: '—', jobs: '—' });
  const [saving, setSaving] = useState(false);

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const updated = await api<User>(token, '/users/me', {
        method: 'PATCH',
        body: JSON.stringify({ name: name.trim() }),
      });
      onMeUpdate(updated);
      notify({ tone: 'success', text: 'Profile details saved.' });
    } catch (error) {
      notify({ tone: 'error', text: error instanceof Error ? error.message.replaceAll('_', ' ') : 'Profile update failed.' });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    setProfileImage(normalizeImageUrl(me.image));
    setName(me.name);
  }, [me.image, me.name]);

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>, key: 'profile' | 'logo') => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (key === 'profile') {
      try {
        await uploadProfileImage(token, file);
        const current = await api<User>(token, '/users/me');
        setProfileImage(normalizeImageUrl(current.image));
        onMeUpdate(current);
        notify({ tone: 'success', text: 'Profile image uploaded to Cloudinary and refreshed.' });
      } catch (error) {
        notify({ tone: 'error', text: error instanceof Error ? error.message.replaceAll('_', ' ') : 'Profile image upload failed.' });
      }
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const value = String(reader.result || '');
      if (!value) return;
      window.localStorage.setItem(STORAGE_KEYS[key], value);
      if (key === 'logo') setLogo(value);
      notify({
        tone: 'success',
        text: 'Logo uploaded and saved in this admin workspace.',
      });
    };
    reader.readAsDataURL(file);
  };

  const refreshHealth = useCallback(async (showNotice = true) => {
    setChecking(true);
    const started = performance.now();
    try {
      const healthUrl = `${apiBaseUrl.replace(/\/api\/v1\/?$/, '')}/health/ready`;
      const response = await fetch(healthUrl, { cache: 'no-store' });
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.status !== 'ready') throw new Error('Backend unavailable');
      setHealth({
        backend: 'Ready',
        latency: `${Math.round(performance.now() - started)} ms`,
        jobs: result.backgroundJobs === 'enabled' ? 'Enabled' : 'Disabled',
      });
      if (showNotice) notify({ tone: 'success', text: 'System health refreshed.' });
    } catch {
      setHealth({ backend: 'Unavailable', latency: '—', jobs: '—' });
      if (showNotice) notify({ tone: 'error', text: 'Could not read system health from the backend.' });
    } finally {
      setChecking(false);
    }
  }, [notify]);

  useEffect(() => {
    void refreshHealth(false);
  }, [refreshHealth]);

  return (
    <section className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-2">
        <article className="rounded-3xl border border-white/[0.09] bg-slate-900/50 p-5 shadow-2xl shadow-black/10 backdrop-blur sm:p-6">
          <h2 className="font-bold text-white">Admin profile</h2>
          <p className="mt-1 text-sm text-slate-500">Update your basic admin identity.</p>

          <div className="mt-5 flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center overflow-hidden rounded-full border border-white/10 bg-slate-950/40 text-slate-500">
              {profileImage ? (
                <img src={profileImage} alt="Profile preview" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs font-bold uppercase text-slate-300">{name.slice(0, 1) || 'A'}</span>
              )}
            </div>
            <label className="cursor-pointer rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-slate-200 hover:bg-white/5">
              Upload photo
              <input type="file" accept="image/*" className="hidden" onChange={(event) => handleImageUpload(event, 'profile')} />
            </label>
          </div>

          <form onSubmit={saveProfile} className="mt-5 space-y-4">
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border border-[#d9d0bd] bg-[#f7f2ea] px-3 py-2 text-sm text-[#1f2430] placeholder:text-[#7a7f87]" placeholder="Display name" />
            <input value={email} readOnly className="w-full rounded-xl border border-[#d9d0bd] bg-[#f7f2ea] px-3 py-2 text-sm text-[#1f2430]" aria-label="Email address" />
            <button type="submit" disabled={saving} className="rounded-xl bg-violet-500 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-400 disabled:opacity-60">{saving ? 'Saving…' : 'Save profile'}</button>
          </form>
        </article>

        <article className="rounded-3xl border border-white/[0.09] bg-slate-900/50 p-5 shadow-2xl shadow-black/10 backdrop-blur sm:p-6">
          <h2 className="font-bold text-white">Branding</h2>
          <p className="mt-1 text-sm text-slate-500">Upload your app logo for the dashboard header.</p>
          <div className="mt-5 flex items-center gap-4">
            <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-xl border border-white/10 bg-slate-950/40 text-slate-500">
              {logo ? <img src={logo} alt="Logo preview" className="h-full w-full object-cover" /> : <span className="text-xs">Logo</span>}
            </div>
            <label className="cursor-pointer rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-slate-200 hover:bg-white/5">
              Upload logo
              <input type="file" accept="image/*" className="hidden" onChange={(event) => handleImageUpload(event, 'logo')} />
            </label>
          </div>
        </article>
      </div>

      <article className="rounded-3xl border border-[#d9d0bd] bg-[#f3eee4] p-5 shadow-[0_10px_25px_rgba(92,77,52,0.05)] sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-[1.1rem] font-bold text-[#1f2430]">System health</h2>
            <p className="mt-1 text-sm text-[#5b6069]">Check API and queue status from one place.</p>
          </div>
          <button
            type="button"
            onClick={() => void refreshHealth()}
            disabled={checking}
            className="inline-flex items-center justify-center rounded-xl border border-[#d9d0bd] bg-[#f7f2ea] px-3 py-2 text-sm font-medium text-[#1f2430] shadow-sm transition hover:bg-[#efe6d8] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {checking ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className={`rounded-2xl border p-4 text-sm font-medium ${health.backend === 'Ready' ? 'border-[#a9c8b5] bg-[#dfeee4] text-[#1f2430]' : health.backend === 'Unavailable' ? 'border-[#d9a3a3] bg-[#f7e3e3] text-[#1f2430]' : 'border-[#d9d0bd] bg-white text-[#1f2430]'}`}>
            Backend: {health.backend}
          </div>
          <div className="rounded-2xl border border-[#c9b5d9] bg-[#ece3f7] p-4 text-sm font-medium text-[#1f2430]">
            Latency: {health.latency}
          </div>
          <div className="rounded-2xl border border-[#d9c79a] bg-[#f2ead2] p-4 text-sm font-medium text-[#1f2430]">
            Background jobs: {health.jobs}
          </div>
        </div>
      </article>
    </section>
  );
}
