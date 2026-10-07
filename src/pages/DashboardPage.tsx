import { useCallback, useEffect, useState } from 'react';
import { Activity, Disc3, FolderTree, Headphones, LoaderCircle, Music2, RefreshCw, Tags, TrendingUp, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { api } from '../api';

export type DashboardMonth = {
  key: string; label: string; users: number; songs: number; plays: number;
};
type RankedSong = {
  id: string; title: string; artist: string; categories: string[]; plays: number;
  completions?: number; listenedSeconds?: number; listeners?: number; lastPlayedAt?: string | null;
};
type RankedCategory = { id: string; name: string; slug: string; plays: number; listenedSeconds: number; songs: number };
type DashboardData = {
  summary: {
    totalUsers: number; activeUsers: number; restrictedUsers: number;
    totalSongs: number; publishedSongs: number; readySongs: number;
    artists: number; categories: number; tags: number; playlists: number; listeningEvents: number;
  };
  months: DashboardMonth[];
  trending: { days: number; since: string; songs: RankedSong[]; categories: RankedCategory[] };
  popularSongs: RankedSong[];
};
type Notice = { tone: 'success' | 'error' | 'info'; text: string };
type Props = { token: string; notify: (notice: Notice) => void; onNavigate: (tab: 'users' | 'music' | 'catalog') => void };

const number = new Intl.NumberFormat();

export function DashboardPage({ token, notify, onNavigate }: Props) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await api<DashboardData>(token, '/admin/dashboard')); }
    catch (error) { notify({ tone: 'error', text: error instanceof Error ? error.message.replaceAll('_', ' ') : 'Could not load dashboard analytics.' }); }
    finally { setLoading(false); }
  }, [token, notify]);
  useEffect(() => { void load(); }, [load]);

  if (loading && !data) return <div className="grid min-h-64 place-items-center rounded-2xl border border-border bg-white text-muted"><span className="inline-flex items-center gap-2"><LoaderCircle className="animate-spin" size={18} />Loading analytics…</span></div>;
  if (!data) return <div className="rounded-2xl border border-border bg-white p-6"><p className="font-semibold text-ink">Dashboard analytics could not load.</p><button type="button" onClick={() => void load()} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-navy"><RefreshCw size={15} />Try again</button></div>;

  const { summary, months } = data;
  const cards: { label: string; value: number; detail: string; icon: LucideIcon; color: string; tab: 'users' | 'music' | 'catalog' }[] = [
    { label: 'Total accounts', value: summary.totalUsers, detail: `${number.format(summary.activeUsers)} active`, icon: Users, color: 'bg-blue-50 text-blue-700', tab: 'users' },
    { label: 'Songs in library', value: summary.totalSongs, detail: `${number.format(summary.publishedSongs)} published`, icon: Music2, color: 'bg-amber-50 text-amber-700', tab: 'music' },
    { label: 'Listening events', value: summary.listeningEvents, detail: 'Plays and completions', icon: Headphones, color: 'bg-emerald-50 text-emerald-700', tab: 'music' },
    { label: 'Playlists', value: summary.playlists, detail: 'Created by listeners', icon: Activity, color: 'bg-violet-50 text-violet-700', tab: 'music' },
  ];

  return <section id="dashboard-overview" className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold text-ink">Platform overview</h2><p className="mt-1 text-sm text-muted">Live totals and activity over the last six months.</p></div><button type="button" onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm font-semibold text-navy hover:bg-surface-soft disabled:opacity-60"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} />Refresh</button></div>

    <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">{cards.map(({ label, value, detail, icon: Icon, color, tab }) => <button type="button" key={label} onClick={() => onNavigate(tab)} className="rounded-2xl border border-border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium text-muted">{label}</p><p className="mt-2 text-3xl font-bold tracking-tight text-ink">{number.format(value)}</p><p className="mt-1 text-xs text-muted">{detail}</p></div><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${color}`}><Icon size={19} /></span></div></button>)}</div>

    <AnalyticsCharts months={months} />

    <section className="grid gap-4 xl:grid-cols-2">
      <div className="rounded-2xl border border-border bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-start gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-50 text-amber-700"><TrendingUp size={18} /></span><div><h3 className="font-bold text-ink">Trending songs</h3><p className="mt-1 text-xs text-muted">Based on recorded plays and listening time · last 7 days</p></div></div>
        {data.trending.songs.length ? <div className="mt-4 divide-y divide-border">{data.trending.songs.map((song, index) => <div key={song.id} className="flex items-center gap-3 py-3"><span className="w-5 text-xs font-bold text-muted">{index + 1}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-ink">{song.title}</p><p className="truncate text-xs text-muted">{song.artist}{song.categories.length ? ` · ${song.categories.join(', ')}` : ''}</p></div><div className="shrink-0 text-right"><p className="text-sm font-bold text-ink">{number.format(song.plays)} plays</p><p className="text-[11px] text-muted">{number.format(Math.round((song.listenedSeconds ?? 0) / 60))} min · {number.format(song.listeners ?? 0)} listeners</p></div></div>)}</div> : <p className="mt-4 rounded-xl bg-surface-soft p-4 text-sm text-muted">No listening events in the last 7 days yet. Songs will appear here as listeners play them.</p>}
        <div className="mt-3 border-t border-border pt-3"><p className="text-xs font-semibold uppercase tracking-wide text-muted">Trending categories</p>{data.trending.categories.length ? <div className="mt-2 flex flex-wrap gap-2">{data.trending.categories.map((category) => <span key={category.id} className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900">{category.name} · {number.format(category.plays)}</span>)}</div> : <p className="mt-2 text-xs text-muted">Category trends appear once categorized songs have listening activity.</p>}</div>
      </div>
      <div className="rounded-2xl border border-border bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-start gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-50 text-violet-700"><Headphones size={18} /></span><div><h3 className="font-bold text-ink">Popular songs</h3><p className="mt-1 text-xs text-muted">All-time play count from recorded play events</p></div></div>
        {data.popularSongs.length ? <div className="mt-4 divide-y divide-border">{data.popularSongs.map((song, index) => <div key={song.id} className="flex items-center gap-3 py-3"><span className="w-5 text-xs font-bold text-muted">{index + 1}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-ink">{song.title}</p><p className="truncate text-xs text-muted">{song.artist}{song.categories.length ? ` · ${song.categories.join(', ')}` : ''}</p></div><p className="shrink-0 text-sm font-bold text-ink">{number.format(song.plays)} plays</p></div>)}</div> : <p className="mt-4 rounded-xl bg-surface-soft p-4 text-sm text-muted">No published songs are available yet.</p>}
      </div>
    </section>

    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,1fr)]">
      <section id="library-health" className="rounded-2xl border border-border bg-white p-4 shadow-sm sm:p-5"><div className="flex items-center justify-between gap-3"><div><h3 className="font-bold text-ink">Library health</h3><p className="mt-1 text-xs text-muted">Catalog and release readiness</p></div><button onClick={() => onNavigate('music')} className="text-sm font-semibold text-navy hover:text-gold-dark">Open library →</button></div><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">{[{ label: 'Ready audio', value: summary.readySongs, icon: Music2 }, { label: 'Artists', value: summary.artists, icon: Disc3 }, { label: 'Categories', value: summary.categories, icon: FolderTree }, { label: 'Tags', value: summary.tags, icon: Tags }].map(({ label, value, icon: Icon }) => <div className="rounded-xl bg-surface-soft p-3" key={label}><Icon size={16} className="text-gold-dark" /><p className="mt-2 text-xl font-bold text-ink">{number.format(value)}</p><p className="text-xs text-muted">{label}</p></div>)}</div></section>
      <section id="account-status" className="rounded-2xl border border-border bg-white p-4 shadow-sm sm:p-5"><h3 className="font-bold text-ink">Account status</h3><p className="mt-1 text-xs text-muted">Active and restricted listener accounts</p><div className="mt-5 space-y-4"><StatusLine label="Active" value={summary.activeUsers} total={summary.totalUsers} color="bg-emerald-500" /><StatusLine label="Restricted" value={summary.restrictedUsers} total={summary.totalUsers} color="bg-rose-400" /></div><button type="button" onClick={() => onNavigate('users')} className="mt-5 text-sm font-semibold text-navy hover:text-gold-dark">Manage accounts →</button></section>
    </div>
  </section>;
}

export function AnalyticsCharts({ months }: { months: DashboardMonth[] | null }) {
  if (!months) return <div className="grid min-h-40 place-items-center rounded-2xl border border-border bg-white text-sm text-muted"><span className="inline-flex items-center gap-2"><LoaderCircle className="animate-spin" size={16} />Loading analytics…</span></div>;
  return <div className="grid gap-4 2xl:grid-cols-[minmax(0,1.5fr)_minmax(290px,1fr)]"><MonthlyChart months={months} /><section id="listening-activity" className="rounded-2xl border border-border bg-white p-4 shadow-sm sm:p-5"><div><h3 className="font-bold text-ink">Listening activity</h3><p className="mt-1 text-xs text-muted">Plays and completed listens by month</p></div><ActivityChart months={months} /><div className="mt-3 flex items-center gap-2 text-xs text-muted"><span className="h-2.5 w-2.5 rounded-full bg-primary" />Listening events</div></section></div>;
}

function MonthlyChart({ months }: { months: DashboardData['months'] }) {
  const maxValue = Math.max(1, ...months.flatMap((month) => [month.users, month.songs]));
  return <section id="growth-overview" className="min-w-0 rounded-2xl border border-border bg-white p-4 shadow-sm sm:p-5"><div><h3 className="font-bold text-ink">Growth overview</h3><p className="mt-1 text-xs text-muted">New accounts and songs added each month</p></div><div className="mt-5 flex h-48 items-end gap-2 sm:gap-4">{months.map((month) => <div key={month.key} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2"><div className="flex h-36 w-full items-end justify-center gap-1.5 sm:gap-2"><div title={`${month.users} new accounts`} className="w-[34%] max-w-8 rounded-t-md bg-blue-500 transition-all" style={{ height: `${Math.max(month.users ? 7 : 2, (month.users / maxValue) * 100)}%` }} /><div title={`${month.songs} songs added`} className="w-[34%] max-w-8 rounded-t-md bg-primary transition-all" style={{ height: `${Math.max(month.songs ? 7 : 2, (month.songs / maxValue) * 100)}%` }} /></div><span className="text-[11px] text-muted">{month.label}</span></div>)}</div><div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-3 text-xs text-muted"><span className="inline-flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-blue-500" />New accounts</span><span className="inline-flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-primary" />Songs added</span></div></section>;
}

function ActivityChart({ months }: { months: DashboardData['months'] }) {
  const maxValue = Math.max(1, ...months.map((month) => month.plays));
  return <div className="mt-6 flex h-48 items-end gap-2 sm:gap-3">{months.map((month) => <div key={month.key} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2"><div title={`${number.format(month.plays)} listens`} className="w-full max-w-10 rounded-t-md bg-primary transition-all" style={{ height: `${Math.max(month.plays ? 7 : 2, (month.plays / maxValue) * 100)}%` }} /><span className="text-[11px] text-muted">{month.label}</span></div>)}</div>;
}

function StatusLine({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const percent = total ? Math.min(100, Math.round((value / total) * 100)) : 0;
  return <div><div className="mb-1.5 flex justify-between text-sm"><span className="text-muted">{label}</span><span className="font-semibold text-ink">{number.format(value)} <span className="font-normal text-muted">· {percent}%</span></span></div><div className="h-2 overflow-hidden rounded-full bg-surface-soft"><div className={`h-full rounded-full ${color}`} style={{ width: `${percent}%` }} /></div></div>;
}
