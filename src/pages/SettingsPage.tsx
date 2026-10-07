import { useCallback, useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Camera, ImagePlus, Link2, MessageCircle } from 'lucide-react';
import { api, apiBaseUrl, type User, uploadProfileImage } from '../api';

type SettingsSection = 'admin-profile' | 'branding' | 'system-health';

type Props = {
  me: User;
  token: string;
  notify: (notice: { tone: 'success' | 'error' | 'info'; text: string }) => void;
  onMeUpdate: (user: User) => void;
};

const STORAGE_KEYS = { logo: 'admin-brand-logo', socialLinks: 'admin-brand-social-links' };

type SocialLinks = { youtube: string; instagram: string; whatsapp: string };
const EMPTY_SOCIAL_LINKS: SocialLinks = { youtube: '', instagram: '', whatsapp: '' };

function readStoredImage(key: string) {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(key) || '';
}

function readSocialLinks(): SocialLinks {
  if (typeof window === 'undefined') return EMPTY_SOCIAL_LINKS;
  try {
    return { ...EMPTY_SOCIAL_LINKS, ...JSON.parse(window.localStorage.getItem(STORAGE_KEYS.socialLinks) || '{}') };
  } catch {
    return EMPTY_SOCIAL_LINKS;
  }
}

function normalizeImageUrl(value: string | { url?: string; alt?: string; publicId?: string } | null | undefined) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value.url || '';
}

export function SettingsPage({ me, token, notify, onMeUpdate }: Props) {
  const [activeSection, setActiveSection] = useState<SettingsSection>('admin-profile');
  const [name, setName] = useState(me.name);
  const email = me.email;
  const [profileImage, setProfileImage] = useState(() => normalizeImageUrl(me.image));
  const [logo, setLogo] = useState(readStoredImage(STORAGE_KEYS.logo));
  const [socialLinks, setSocialLinks] = useState<SocialLinks>(readSocialLinks);
  const [checking, setChecking] = useState(true);
  const [health, setHealth] = useState({ backend: 'Checking', latency: '—', jobs: '—' });
  const [healthHistory, setHealthHistory] = useState<Array<{ latency: number; backend: number; jobs: number }>>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const handleSectionSelect = (event: Event) => {
      const section = (event as CustomEvent<SettingsSection>).detail;
      if (section === 'admin-profile' || section === 'branding' || section === 'system-health') setActiveSection(section);
    };
    window.addEventListener('settings-section-select', handleSectionSelect);
    return () => window.removeEventListener('settings-section-select', handleSectionSelect);
  }, []);

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

  const saveBranding = (event: FormEvent) => {
    event.preventDefault();
    window.localStorage.setItem(STORAGE_KEYS.socialLinks, JSON.stringify(socialLinks));
    notify({ tone: 'success', text: 'Branding and social links saved in this admin workspace.' });
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

  const refreshHealth = useCallback(async () => {
    setChecking(true);
    const started = performance.now();
    try {
      const healthUrl = `${apiBaseUrl.replace(/\/api\/v1\/?$/, '')}/health/ready`;
      const response = await fetch(healthUrl, { cache: 'no-store' });
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.status !== 'ready') throw new Error('Backend unavailable');
      const latency = Math.round(performance.now() - started);
      setHealth({
        backend: 'Ready',
        latency: `${latency} ms`,
        jobs: result.backgroundJobs === 'enabled' ? 'Enabled' : 'Disabled',
      });
      setHealthHistory((history) => [...history, {
        latency,
        backend: 100,
        jobs: result.backgroundJobs === 'enabled' ? 100 : 0,
      }].slice(-20));
    } catch {
      setHealth({ backend: 'Unavailable', latency: '—', jobs: '—' });
      setHealthHistory((history) => [...history, { latency: 0, backend: 0, jobs: 0 }].slice(-20));
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    if (activeSection !== 'system-health') return;
    void refreshHealth();
    const interval = window.setInterval(() => void refreshHealth(), 1_000);
    return () => window.clearInterval(interval);
  }, [activeSection, refreshHealth]);

  return (
    <section className="space-y-4">
      <div className="grid items-start gap-4">
        {activeSection === 'admin-profile' && <article id="admin-profile" className="scroll-mt-24 rounded-3xl border border-white/[0.09] bg-slate-900/50 p-4 shadow-2xl shadow-black/10 backdrop-blur sm:p-5">
          <h2 className="font-bold text-white">Admin profile</h2>
          <p className="mt-1 text-sm text-slate-500">Update your basic admin identity.</p>

          <div className="mt-4 flex items-center gap-3">
            <label title="Change profile photo" className="group relative grid h-14 w-14 cursor-pointer place-items-center overflow-hidden rounded-full border border-[#d9d0bd] bg-transparent text-slate-500">
              {profileImage ? (
                <img src={profileImage} alt="Profile preview" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs font-bold uppercase text-[#5b6069]">{name.slice(0, 1) || 'A'}</span>
              )}
              <span className="pointer-events-none absolute inset-0 grid place-items-center bg-black/45 text-white opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100"><Camera size={18} /></span>
              <input aria-label="Change profile photo" title="Change profile photo" type="file" accept="image/*" className="absolute inset-0 cursor-pointer opacity-0" onChange={(event) => handleImageUpload(event, 'profile')} />
            </label>
            <span className="text-xs text-[#5b6069]">Click the photo to change it</span>
          </div>

          <form onSubmit={saveProfile} className="mt-4 space-y-3">
            <label className="block text-xs font-semibold text-[#5b6069]">Display name<input value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5 w-full rounded-xl border border-[#d9d0bd] bg-[#f7f2ea] px-3 py-2 text-sm text-[#1f2430] placeholder:text-[#7a7f87]" placeholder="Display name" /></label>
            <label className="block text-xs font-semibold text-[#5b6069]">Email address<input value={email} readOnly className="mt-1.5 w-full rounded-xl border border-[#d9d0bd] bg-[#f7f2ea] px-3 py-2 text-sm text-[#1f2430]" /></label>
            <button type="submit" disabled={saving} className="rounded-xl bg-violet-500 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-400 disabled:opacity-60">{saving ? 'Saving…' : 'Save profile'}</button>
          </form>
        </article>}

        {activeSection === 'branding' && <article id="branding" className="scroll-mt-24 rounded-3xl border border-white/[0.09] bg-slate-900/50 p-4 shadow-2xl shadow-black/10 backdrop-blur sm:p-5">
          <h2 className="font-bold text-white">Branding</h2>
          <p className="mt-1 text-sm text-slate-500">Manage your logo and public social links.</p>
          <div className="mt-4 flex items-center gap-3">
            <label title="Change logo" className="group relative grid h-20 w-20 cursor-pointer place-items-center overflow-hidden rounded-xl border border-[#d9d0bd] bg-transparent text-[#9a7c52]">
              {logo ? <img src={logo} alt="Logo preview" className="h-full w-full object-contain" /> : <ImagePlus size={24} aria-hidden="true" />}
              <span className="pointer-events-none absolute inset-0 grid place-items-center bg-black/45 text-white opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100"><Camera size={18} /></span>
              <input aria-label="Change logo" title="Change logo" type="file" accept="image/*" className="absolute inset-0 cursor-pointer opacity-0" onChange={(event) => handleImageUpload(event, 'logo')} />
            </label>
            <span className="text-xs text-[#5b6069]">Click the image area to change logo</span>
          </div>
          <form onSubmit={saveBranding} className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="block text-xs font-semibold text-[#5b6069]">
              <span className="mb-1.5 flex items-center gap-2"><Link2 size={16} className="text-red-600" />YouTube URL</span>
              <input type="url" value={socialLinks.youtube} onChange={(event) => setSocialLinks((current) => ({ ...current, youtube: event.target.value }))} className="w-full rounded-xl border border-[#d9d0bd] bg-[#f7f2ea] px-3 py-2 text-sm text-[#1f2430] placeholder:text-[#7a7f87]" placeholder="https://youtube.com/@yourchannel" />
            </label>
            <label className="block text-xs font-semibold text-[#5b6069]">
              <span className="mb-1.5 flex items-center gap-2"><Link2 size={16} className="text-pink-600" />Instagram URL</span>
              <input type="url" value={socialLinks.instagram} onChange={(event) => setSocialLinks((current) => ({ ...current, instagram: event.target.value }))} className="w-full rounded-xl border border-[#d9d0bd] bg-[#f7f2ea] px-3 py-2 text-sm text-[#1f2430] placeholder:text-[#7a7f87]" placeholder="https://instagram.com/yourprofile" />
            </label>
            <label className="block text-xs font-semibold text-[#5b6069] sm:col-span-2">
              <span className="mb-1.5 flex items-center gap-2"><MessageCircle size={16} className="text-green-600" />WhatsApp number or link</span>
              <input type="text" value={socialLinks.whatsapp} onChange={(event) => setSocialLinks((current) => ({ ...current, whatsapp: event.target.value }))} className="w-full rounded-xl border border-[#d9d0bd] bg-[#f7f2ea] px-3 py-2 text-sm text-[#1f2430] placeholder:text-[#7a7f87]" placeholder="+91 98765 43210 or https://wa.me/919876543210" />
            </label>
            <div className="sm:col-span-2">
              <button type="submit" className="rounded-xl bg-[#d49b12] px-4 py-2 text-sm font-semibold text-[#1f2430] transition hover:bg-[#c58d0e]">Save branding</button>
            </div>
          </form>
        </article>}
      
        {activeSection === 'system-health' && <article id="system-health" className="scroll-mt-24 overflow-hidden rounded-2xl border border-[#d9d0bd] bg-[#f3eee4] p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${health.backend === 'Ready' ? 'bg-emerald-500' : health.backend === 'Unavailable' ? 'bg-red-500' : 'bg-[#aaa]'}`} /><h2 className="text-[1.1rem] font-bold tracking-wide text-[#1f2430]">System health</h2></div>
            <p className="mt-1 text-sm text-[#5b6069]">Live backend status and response time.</p>
          </div>
          <span className="text-xs font-medium text-[#5b6069]">Auto-updates every second</span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <HealthValue label="Backend" value={health.backend} tone={health.backend === 'Ready' ? 'green' : health.backend === 'Unavailable' ? 'red' : 'neutral'} detail={health.backend === 'Ready' ? 'Connection established' : health.backend === 'Unavailable' ? 'Connection failed' : 'Checking connection'} />
          <HealthValue label="API response" value={health.latency} tone={health.backend === 'Unavailable' ? 'red' : health.backend === 'Ready' ? 'green' : 'neutral'} detail="Health endpoint latency" />
          <HealthValue label="Background jobs" value={health.jobs} tone={health.jobs === 'Enabled' ? 'green' : health.jobs === 'Disabled' ? 'red' : 'neutral'} detail={health.jobs === 'Enabled' ? 'Queue processing active' : health.jobs === 'Disabled' ? 'Queue processing inactive' : 'Reading queue status'} />
        </div>
        <div className="mt-4 rounded-xl border border-[#d9d0bd] bg-white p-4 text-[#1f2430]">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div><h3 className="text-sm font-bold">Server health metrics</h3><p className="mt-1 text-xs text-[#72706a]">Recent checks · all three indicators</p></div>
            <div className="text-right"><strong className={`text-lg ${health.backend === 'Unavailable' ? 'text-red-600' : 'text-emerald-700'}`}>{health.latency}</strong><p className="text-[11px] text-[#72706a]">latest check</p></div>
          </div>
          <HealthMetricsChart values={healthHistory} />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[#eee5d5] pt-2 text-[11px] text-[#72706a]"><span>{healthHistory.length ? `${healthHistory.length} checks recorded` : 'Waiting for first health check'}</span><span className="flex flex-wrap items-center gap-x-4 gap-y-1"><ChartLegend color="#16834a" label="API latency (ms)" /><ChartLegend color="#dc2626" label="Backend availability" /><ChartLegend color="#ffffff" label="Background jobs" border /></span></div>
        </div>
        </article>}
      </div>
    </section>
  );
}

export function selectSettingsSection(section: SettingsSection) {
  window.dispatchEvent(new CustomEvent<SettingsSection>('settings-section-select', { detail: section }));
}

function HealthValue({ label, value, tone, detail }: { label: string; value: string; tone: 'green' | 'red' | 'neutral'; detail: string }) {
  const palette = {
    green: 'text-emerald-600',
    red: 'text-red-600',
    neutral: 'text-[#5b6069]',
  };
  const dot = tone === 'green' ? 'bg-emerald-500' : tone === 'red' ? 'bg-red-500' : 'bg-[#aaa]';
  return <div className="min-h-28 rounded-xl border border-[#d9d0bd] bg-white p-4"><div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-[#5b6069]"><i className={`h-2 w-2 rounded-full ${dot}`} />{label}</div><strong className={`mt-3 block text-2xl font-semibold tracking-tight ${palette[tone]}`}>{value}</strong><p className="mt-1 text-xs text-[#77736d]">{detail}</p></div>;
}

function HealthMetricsChart({ values }: { values: Array<{ latency: number; backend: number; jobs: number }> }) {
  const width = 720;
  const height = 180;
  const padX = 12;
  const padY = 20;
  const maxLatency = Math.max(100, ...values.map((point) => point.latency)) * 1.15;
  const series = [
    { key: 'latency', color: '#16834a', normalize: (value: number) => (value / maxLatency) * 100 },
    { key: 'backend', color: '#dc2626', normalize: (value: number) => value },
    { key: 'jobs', color: '#ffffff', normalize: (value: number) => value },
  ] as const;
  const makePoints = (key: typeof series[number]['key']) => values.map((point, index) => {
    const x = values.length < 2 ? width / 2 : padX + (index / (values.length - 1)) * (width - padX * 2);
    const normalized = key === 'latency' ? series[0].normalize(point.latency) : point[key];
    const y = height - padY - (normalized / 100) * (height - padY * 2);
    return `${x},${y}`;
  });

  return <div className="mt-3 h-44 w-full overflow-hidden rounded-lg border border-[#333] bg-black">
    <svg className="h-full w-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label="Backend availability, API latency and background job history chart">
      {[0, 1, 2, 3, 4].map((line) => <g key={line}><line x1="0" x2={width} y1={padY + line * ((height - padY * 2) / 4)} y2={padY + line * ((height - padY * 2) / 4)} stroke="#555" strokeOpacity=".7" /><text x="5" y={padY + line * ((height - padY * 2) / 4) - 3} fill="#dedede" fontSize="9">{100 - line * 25}</text></g>)}
      {series.map(({ key, color }) => {
        const points = makePoints(key);
        const last = points.at(-1)?.split(',').map(Number);
        return <g key={key}>
          {points.length > 1 && <polyline points={points.join(' ')} fill="none" stroke={color} strokeWidth={key === 'latency' ? 3 : 2.5} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />}
          {last && <circle cx={last[0]} cy={last[1]} r="4" fill={color} stroke="white" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />}
        </g>;
      })}
      {values.length === 1 && <text x={width / 2} y={height - 6} textAnchor="middle" fill="#dedede" fontSize="11">Trend will build automatically</text>}
      {values.length === 0 && <text x={width / 2} y={height / 2} textAnchor="middle" fill="#dedede" fontSize="12">Waiting for the first health check</text>}
    </svg>
  </div>;
}

function ChartLegend({ color, label, border = false }: { color: string; label: string; border?: boolean }) {
  return <span className="inline-flex items-center gap-1.5"><i className={`h-2 w-2 rounded-full ${border ? 'border border-[#aaa]' : ''}`} style={{ backgroundColor: color }} />{label}</span>;
}
