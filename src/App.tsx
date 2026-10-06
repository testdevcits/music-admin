import { FormEvent, ReactNode, useCallback, useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  AudioLines,
  Bell,
  Check,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Disc3,
  Eye,
  EyeOff,
  FileAudio,
  FolderTree,
  LibraryBig,
  LoaderCircle,
  LogOut,
  Menu,
  Music2,
  Plus,
  RefreshCw,
  ShieldCheck,
  Search,
  Sparkles,
  Tag,
  Trash2,
  UploadCloud,
  Users,
  X,
} from 'lucide-react';
import { api, Artist, Category, configured, login, Song, Tag as TagModel, upload, User } from './api';

type Tab = 'users' | 'music' | 'catalog';
type Notice = { tone: 'success' | 'error' | 'info'; text: string };

const tokenKey = 'music-platform-admin-token';
const inputClass = 'mt-2 w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-gray focus:border-primary focus:ring-4 focus:ring-primary/15';
const passwordInputClass = inputClass.replace('mt-2 ', '');
const button = 'inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-50';
const primary = `${button} bg-primary text-navy-dark shadow-[0_8px_24px_rgba(214,163,35,0.24)] hover:bg-gold-dark hover:text-white focus:ring-primary/25`;
const secondary = `${button} border border-border bg-white text-navy hover:bg-navy-soft focus:ring-primary/15`;
const danger = `${button} border border-danger bg-danger text-white hover:bg-danger/90 focus:ring-danger/20`;
const pageCopy: Record<Tab, { eyebrow: string; title: string; description: string }> = {
  users: { eyebrow: 'Audience management', title: 'Users', description: 'Review accounts and control platform access.' },
  music: { eyebrow: 'Music operations', title: 'Music library', description: 'Create, process, license, and publish every release.' },
  catalog: { eyebrow: 'Content foundation', title: 'Catalog', description: 'Keep artists, listening categories, and tags organised.' },
};

function messageOf(error: unknown) {
  if (!(error instanceof Error)) return 'The request could not be completed.';
  const messages: Record<string, string> = {
    ARTIST_NAME_EXISTS: 'An artist with this name already exists.',
    ARTIST_IN_USE: 'This artist cannot be removed because a song or album uses it.',
  };
  return messages[error.message] || error.message.replaceAll('_', ' ');
}

function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'A';
}

function formatDate(value?: string) {
  return value ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—';
}

export default function App() {
  const [token, setToken] = useState(() => sessionStorage.getItem(tokenKey) || '');
  const [me, setMe] = useState<User | null>(null);
  const [tab, setTab] = useState<Tab>('users');
  const [notice, setNotice] = useState<Notice | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [logoutOpen, setLogoutOpen] = useState(false);

  const signOut = useCallback(() => {
    sessionStorage.removeItem(tokenKey);
    setToken('');
    setMe(null);
    setLogoutOpen(false);
  }, []);

  const changeTab = useCallback((nextTab: Tab) => {
    setTab(nextTab);
    setSearchQuery('');
  }, []);

  const requestSignOut = useCallback(() => setLogoutOpen(true), []);

  useEffect(() => {
    if (!token) return;
    api<User>(token, '/users/me').then((user) => {
      if (user.role !== 'admin') throw new Error('ADMIN_REQUIRED');
      setMe(user);
    }).catch((error) => {
      setNotice({ tone: 'error', text: messageOf(error) });
      signOut();
    });
  }, [token, signOut]);

  useEffect(() => {
    if (!notice || (!token && !me)) return;
    const timeout = window.setTimeout(() => setNotice(null), 4500);
    return () => window.clearTimeout(timeout);
  }, [notice, token, me]);

  if (!configured) return <ConfigurationNeeded />;
  if (!token || !me) return <Login onLogin={setToken} initialError={notice?.text} />;

  const copy = pageCopy[tab];
  return (
    <main className="flex h-screen flex-col overflow-hidden bg-surface text-ink selection:bg-band">
      <AdminHeader user={me} searchQuery={searchQuery} onSearch={setSearchQuery} onSignOut={requestSignOut} />
      <div className="flex min-h-0 w-full flex-1 overflow-hidden">
        <Sidebar active={tab} onChange={changeTab} user={me} onSignOut={requestSignOut} />
        <div className="hide-scrollbar min-w-0 flex-1 overflow-y-auto px-4 pb-12 pt-5 sm:px-7 lg:px-10 lg:pt-8">
          <MobileNav active={tab} onChange={changeTab} onSignOut={requestSignOut} />
          <div className="mb-5 flex items-center gap-2 text-xs font-medium text-muted" aria-label="Breadcrumb">
            <span>Administration</span><ChevronRight size={14} /><span className="text-navy">{copy.title}</span>
          </div>
          <header className="mb-7 border-b border-border pb-6">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-gold-dark">{copy.eyebrow}</p>
            <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">{copy.title}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{copy.description}</p>
          </header>
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_270px]">
            <div className="documentation-panel min-w-0">
              {tab === 'users' && <UsersPanel token={token} me={me} notify={setNotice} searchQuery={searchQuery} />}
              {tab === 'music' && <MusicPanel token={token} notify={setNotice} searchQuery={searchQuery} />}
              {tab === 'catalog' && <CatalogPanel token={token} notify={setNotice} searchQuery={searchQuery} />}
            </div>
            <ContextPanel tab={tab} />
          </div>
        </div>
      </div>
      {notice && <Toast notice={notice} onDismiss={() => setNotice(null)} />}
      {logoutOpen && <LogoutDialog user={me} onCancel={() => setLogoutOpen(false)} onConfirm={signOut} />}
    </main>
  );
}

function Brand({ compact = false, inverted = false }: { compact?: boolean; inverted?: boolean }) {
  return <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-gold-soft via-primary to-gold-dark text-navy-dark shadow-sm"><AudioLines size={21} strokeWidth={2.5} /></span>{!compact && <span><span className={`block text-sm font-bold tracking-tight ${inverted ? 'text-white' : 'text-ink'}`}>Music Platform</span><span className={`block text-xs ${inverted ? 'text-slate-500' : 'text-muted'}`}>Admin workspace</span></span>}</div>;
}

function Avatar({ name }: { name: string }) {
  return <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-violet-400 to-cyan-300 text-xs font-black text-slate-950">{initials(name)}</span>;
}

function ConfigurationNeeded() {
  return <main className="grid min-h-screen place-items-center bg-[#080b14] px-5 text-slate-100"><section className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900/70 p-7 shadow-2xl shadow-black/30 backdrop-blur sm:p-10"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-400/15 text-violet-300"><CircleAlert size={23} /></span><p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-violet-300">Configuration needed</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Connect the dashboard API</h1><p className="mt-3 leading-7 text-slate-400">Create <code className="rounded bg-white/10 px-1.5 py-0.5 text-sm text-violet-200">.env.local</code> from the example, set <code className="rounded bg-white/10 px-1.5 py-0.5 text-sm text-violet-200">VITE_API_BASE_URL</code>, then restart Vite.</p></section></main>;
}

function Login({ onLogin, initialError }: { onLogin: (token: string) => void; initialError?: string }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(initialError || '');
  const [passwordVisible, setPasswordVisible] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setMessage('');
    const values = new FormData(event.currentTarget);
    try {
      const result = await login(String(values.get('email')), String(values.get('password')));
      sessionStorage.setItem(tokenKey, result.accessToken);
      onLogin(result.accessToken);
    } catch (error) { setMessage(messageOf(error)); } finally { setBusy(false); }
  }
  return <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#080b14] px-5 py-10 text-slate-100"><div className="pointer-events-none absolute -left-20 top-[-12rem] h-[35rem] w-[35rem] rounded-full bg-violet-700/30 blur-3xl" /><div className="pointer-events-none absolute -bottom-28 right-[-8rem] h-[28rem] w-[28rem] rounded-full bg-cyan-500/15 blur-3xl" /><section className="relative w-full max-w-[460px] rounded-[2rem] border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-black/40 backdrop-blur sm:p-9"><Brand inverted /><div className="mt-9"><p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-300">Secure workspace</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Welcome back</h1><p className="mt-2 text-sm leading-6 text-slate-400">Sign in with an administrator account to manage your music platform.</p></div><form className="mt-7 space-y-5" onSubmit={submit}><Field label="Email address"><input className={inputClass} name="email" type="email" autoComplete="username" placeholder="admin@example.com" required /></Field><div className="block text-sm font-semibold text-slate-300"><label htmlFor="login-password">Password</label><div className="relative mt-2"><input id="login-password" className={`${passwordInputClass} pr-12`} name="password" type={passwordVisible ? 'text' : 'password'} autoComplete="current-password" placeholder="••••••••" required /><div className="absolute inset-y-0 right-1 flex items-center"><button className="grid h-9 w-9 place-items-center rounded-lg text-navy transition hover:bg-navy/15 hover:text-navy-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60" type="button" onClick={() => setPasswordVisible((visible) => !visible)} aria-label={passwordVisible ? 'Hide password' : 'Show password'} title={passwordVisible ? 'Hide password' : 'Show password'}>{passwordVisible ? <EyeOff size={19} strokeWidth={2.25} /> : <Eye size={19} strokeWidth={2.25} />}</button></div></div></div><button className={`${primary} w-full`} disabled={busy}>{busy ? <LoaderCircle className="animate-spin" size={17} /> : <ShieldCheck size={17} />}{busy ? 'Signing in…' : 'Sign in to dashboard'}</button></form>{message && <p className="mt-5 rounded-xl border border-rose-400/20 bg-rose-400/10 px-3.5 py-3 text-sm text-rose-200">{message}</p>}</section></main>;
}

const navItems: { id: Tab; label: string; description: string; icon: LucideIcon }[] = [
  { id: 'users', label: 'Users', description: 'Accounts and access', icon: Users },
  { id: 'music', label: 'Music library', description: 'Songs and processing', icon: Music2 },
  { id: 'catalog', label: 'Catalog', description: 'Artists, categories, tags', icon: FolderTree },
];

function AdminHeader({ user, searchQuery, onSearch, onSignOut }: { user: User; searchQuery: string; onSearch: (query: string) => void; onSignOut: () => void }) {
  return <div className="relative z-30 shrink-0"><div className="hidden h-8 bg-blackbar px-5 text-xs text-white sm:block"><div className="mx-auto flex h-full max-w-[1680px] items-center justify-end gap-5"><span>Music Platform administration</span><button className="inline-flex items-center gap-1 hover:text-gold-soft">Preferences <ChevronDown size={12} /></button><button className="hover:text-gold-soft">Support</button></div></div><header className="border-b border-border bg-white/95 shadow-sm backdrop-blur"><div className="mx-auto flex h-16 max-w-[1680px] items-center gap-3 px-4 sm:gap-5 sm:px-6"><Brand /><div className="ml-auto hidden max-w-md flex-1 items-center md:flex"><label className="relative w-full"><span className="sr-only">Search the current dashboard section</span><Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={17} /><input value={searchQuery} onChange={(event) => onSearch(event.target.value)} className="w-full rounded-lg border border-divider bg-surface-soft py-2 pl-9 pr-9 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="Search this section" />{searchQuery && <button type="button" onClick={() => onSearch('')} className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-muted hover:bg-band hover:text-navy" aria-label="Clear search"><X size={15} /></button>}</label></div><button className="hidden rounded-lg p-2 text-muted hover:bg-band hover:text-navy sm:grid sm:place-items-center" title="Notifications" aria-label="Notifications"><Bell size={18} /></button><span className="hidden h-8 w-px bg-border sm:block" /><button className="hidden items-center gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-surface-soft sm:flex" onClick={onSignOut} title="Sign out"><Avatar name={user.name} /><span className="hidden xl:block"><span className="block text-xs font-bold text-ink">{user.name}</span><span className="block max-w-36 truncate text-[11px] text-muted">{user.email}</span></span></button></div></header></div>;
}

function Sidebar({ active, onChange, user, onSignOut }: { active: Tab; onChange: (tab: Tab) => void; user: User; onSignOut: () => void }) {
  return <aside className="hidden h-full w-64 shrink-0 flex-col overflow-y-auto border-r border-border bg-white px-4 py-6 lg:flex"><p className="px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-brown">Music management</p><nav className="mt-3 space-y-1" aria-label="Dashboard navigation">{navItems.map(({ id, label, description, icon: Icon }) => <button key={id} onClick={() => onChange(id)} className={`group flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition ${active === id ? 'bg-navy-soft text-navy shadow-[inset_3px_0_0_#D6A323]' : 'text-muted hover:bg-surface-soft hover:text-navy'}`}><span className={`grid h-8 w-8 place-items-center rounded-lg ${active === id ? 'bg-band text-navy' : 'text-brown group-hover:bg-gold-soft group-hover:text-navy'}`}><Icon size={17} /></span><span className="min-w-0"><span className="block text-sm font-bold">{label}</span><span className="mt-0.5 block truncate text-xs text-muted">{description}</span></span>{active === id && <ChevronRight className="ml-auto text-navy" size={16} />}</button>)}</nav><div className="mt-8 border-t border-border pt-6"><p className="px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-brown">Workspace</p><button className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-muted hover:bg-surface-soft hover:text-navy"><ShieldCheck size={17} className="text-brown" />Platform policies</button></div><div className="mt-auto rounded-xl border border-border bg-surface-soft p-3"><div className="flex items-center gap-3"><Avatar name={user.name} /><span className="min-w-0"><span className="block truncate text-sm font-bold text-ink">{user.name}</span><span className="block truncate text-xs text-muted">{user.email}</span></span></div><button className={`${secondary} mt-3 w-full`} onClick={onSignOut}><LogOut size={16} />Sign out</button></div></aside>;
}

function MobileNav({ active, onChange, onSignOut }: { active: Tab; onChange: (tab: Tab) => void; onSignOut: () => void }) {
  return <div className="mb-5 flex items-center gap-2 border-b border-border pb-4 lg:hidden"><button className="grid h-10 w-10 place-items-center rounded-lg border border-border bg-white text-navy" aria-label="Dashboard sections"><Menu size={19} /></button><div className="hide-scrollbar flex min-w-0 flex-1 gap-1 overflow-x-auto">{navItems.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => onChange(id)} className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${active === id ? 'bg-navy text-white' : 'bg-white text-muted hover:bg-band hover:text-navy'}`}><Icon size={16} />{label}</button>)}</div><button title="Sign out" onClick={onSignOut} className="grid h-10 w-10 place-items-center rounded-lg border border-border bg-white text-navy"><LogOut size={17} /></button></div>;
}

function LogoutDialog({ user, onCancel, onConfirm }: { user: User; onCancel: () => void; onConfirm: () => void }) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [onCancel]);

  return <div className="fixed inset-0 z-50 grid place-items-center bg-blackbar/60 p-4 backdrop-blur-sm" onMouseDown={onCancel}><section className="w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="logout-title" onMouseDown={(event) => event.stopPropagation()}><div className="flex items-start gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-band text-gold-dark ring-1 ring-primary/20"><LogOut size={20} /></span><div><h2 id="logout-title" className="text-lg font-bold text-ink">Sign out of Music Platform?</h2><p className="mt-1 text-sm leading-6 text-muted">You are signed in as <span className="font-semibold text-ink">{user.email}</span>. You will need to enter your credentials again to return.</p></div></div><div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button className={secondary} type="button" onClick={onCancel}>Cancel</button><button className={danger} type="button" onClick={onConfirm}><LogOut size={16} />Sign out</button></div></section></div>;
}

function ContextPanel({ tab }: { tab: Tab }) {
  const sections: Record<Tab, string[]> = { users: ['User accounts', 'Access controls', 'Account status'], music: ['Create a song', 'Audio processing', 'Rights and publishing'], catalog: ['Artists', 'Categories', 'Tags'] };
  return <aside className="hidden border-l border-border pl-6 xl:block"><div className="sticky top-24"><div className="flex items-center justify-between"><h2 className="text-base font-bold text-ink">On this page</h2><button className="text-muted hover:text-navy" aria-label="Page options"><Menu size={17} /></button></div><nav className="mt-3 border-l-2 border-divider pl-3" aria-label="Page sections">{sections[tab].map((section, index) => <a key={section} href={`#${section.toLowerCase().replaceAll(' ', '-')}`} className={`block py-1.5 text-sm ${index === 0 ? 'font-bold text-navy' : 'text-muted hover:text-navy'}`}>{section}</a>)}</nav><div className="mt-8 border-t border-border pt-6"><h2 className="text-base font-bold text-ink">Recommended tasks</h2><div className="mt-3 rounded-xl border border-border bg-white p-4"><p className="text-sm font-bold text-ink">Get your library ready</p><p className="mt-1 text-xs leading-5 text-muted">Create catalog records, add a song, then upload audio when background processing is enabled.</p><button className="mt-3 text-sm font-bold text-navy hover:text-gold-dark">View music workflow <ChevronRight className="inline" size={15} /></button></div></div></div></aside>;
}

function Toast({ notice, onDismiss }: { notice: Notice; onDismiss: () => void }) {
  const palette = notice.tone === 'success' ? 'border-success/25 bg-white text-success' : notice.tone === 'error' ? 'border-danger/25 bg-white text-danger' : 'border-navy/25 bg-white text-navy';
  const Icon = notice.tone === 'success' ? Check : CircleAlert;
  return <div className="pointer-events-none fixed inset-x-4 bottom-5 z-40 flex justify-center sm:bottom-7" aria-live="polite" aria-atomic="true"><div className={`pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium shadow-[0_16px_45px_rgba(31,36,48,0.2)] animate-slide-fade-in ${palette}`} role={notice.tone === 'error' ? 'alert' : 'status'}><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-current/10"><Icon size={18} /></span><p className="min-w-0 flex-1 text-ink">{notice.text}</p><button className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-surface hover:text-ink" onClick={onDismiss} aria-label="Dismiss message"><X size={17} /></button></div></div>;
}

function UsersPanel({ token, me, notify, searchQuery }: { token: string; me: User; notify: (notice: Notice) => void; searchQuery: string }) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try { setUsers((await api<{ data: User[] }>(token, '/admin/users?limit=100')).data); }
    catch (error) { notify({ tone: 'error', text: messageOf(error) }); }
    finally { setLoading(false); }
  }, [token, notify]);
  useEffect(() => { void load(); }, [load]);
  async function toggle(user: User) {
    try { await api(token, `/admin/users/${user._id}`, { method: 'PATCH', body: JSON.stringify({ disabled: !user.disabled }) }); await load(); notify({ tone: 'success', text: `${user.name} is now ${user.disabled ? 'active' : 'disabled'}.` }); }
    catch (error) { notify({ tone: 'error', text: messageOf(error) }); }
  }
  const activeUsers = users.filter((user) => !user.disabled).length;
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const visibleUsers = normalizedQuery ? users.filter((user) => [user.name, user.email, user.role, user.disabled ? 'disabled' : 'active'].some((value) => value.toLowerCase().includes(normalizedQuery))) : users;
  return <section className="space-y-5"><div className="grid gap-4 sm:grid-cols-3"><Metric label="Total accounts" value={users.length} icon={Users} tone="violet" /><Metric label="Active accounts" value={activeUsers} icon={Check} tone="emerald" /><Metric label="Restricted" value={users.length - activeUsers} icon={ShieldCheck} tone="amber" /></div><section className="overflow-hidden rounded-3xl border border-white/[0.09] bg-slate-900/50 shadow-2xl shadow-black/10 backdrop-blur"><div className="flex flex-col gap-4 border-b border-white/[0.08] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div><h2 className="text-lg font-bold text-white">All users</h2><p className="mt-1 text-sm text-slate-500">{normalizedQuery ? `${visibleUsers.length} result${visibleUsers.length === 1 ? '' : 's'} for “${searchQuery.trim()}”` : 'The first 100 user accounts in your platform.'}</p></div><button className={secondary} onClick={() => void load()} disabled={loading}><RefreshCw className={loading ? 'animate-spin' : ''} size={16} />Refresh</button></div>{loading ? <LoadingRows /> : visibleUsers.length === 0 ? <Empty title={normalizedQuery ? 'No matching users' : 'No users yet'} text={normalizedQuery ? 'Try a different name, email, role, or account status.' : 'User accounts will appear here as they join your platform.'} icon={Users} /> : <div className="divide-y divide-white/[0.07]">{visibleUsers.map((user) => <UserRow key={user._id} user={user} currentUser={me._id} onToggle={toggle} />)}</div>}</section></section>;
}

function UserRow({ user, currentUser, onToggle }: { user: User; currentUser: string; onToggle: (user: User) => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  async function toggle() { setBusy(true); try { await onToggle(user); } finally { setBusy(false); } }
  return <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:px-6"><Avatar name={user.name} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="truncate font-semibold text-slate-100">{user.name}</p>{user._id === currentUser && <span className="rounded-full bg-violet-400/15 px-2 py-0.5 text-[11px] font-bold text-violet-200">You</span>}</div><p className="mt-0.5 truncate text-sm text-slate-500">{user.email}</p></div><div className="flex flex-wrap items-center gap-3 sm:gap-7"><span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-xs font-semibold capitalize text-slate-300">{user.role}</span><span className="min-w-28 text-xs text-slate-500">Joined {formatDate(user.createdAt)}</span><StatusBadge active={!user.disabled} />{user._id !== currentUser && <button className={user.disabled ? secondary : danger} disabled={busy} onClick={() => void toggle()}>{busy && <LoaderCircle className="animate-spin" size={14} />}{user.disabled ? 'Enable' : 'Disable'}</button>}</div></div>;
}

function MusicPanel({ token, notify, searchQuery }: { token: string; notify: (notice: Notice) => void; searchQuery: string }) {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<TagModel[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [licenseSong, setLicenseSong] = useState<Song | null>(null);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [artistResult, categoryResult, tagResult, songResult] = await Promise.all([api<{ data: Artist[] }>(token, '/admin/artists?limit=100'), api<{ data: Category[] }>(token, '/admin/categories?limit=100'), api<{ data: TagModel[] }>(token, '/admin/tags?limit=100'), api<{ data: Song[] }>(token, '/admin/songs?limit=100')]);
      setArtists(artistResult.data); setCategories(categoryResult.data); setTags(tagResult.data); setSongs(songResult.data);
    } catch (error) { notify({ tone: 'error', text: messageOf(error) }); } finally { setLoading(false); }
  }, [token, notify]);
  useEffect(() => { void load(); }, [load]);
  async function createSong(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget; const data = new FormData(form);
    try { await api(token, '/admin/songs', { method: 'POST', body: JSON.stringify({ title: data.get('title'), language: data.get('language'), artist: data.get('artist'), lyrics: data.get('lyrics') || undefined, categories: selectedValues(form, 'categories'), tags: selectedValues(form, 'tags') }) }); form.reset(); await load(); notify({ tone: 'success', text: 'Song created. Upload audio and a cover to begin processing.' }); }
    catch (error) { notify({ tone: 'error', text: messageOf(error) }); }
  }
  async function uploadMedia(songId: string, file: File | undefined, kind: 'audio' | 'cover') {
    if (!file) { notify({ tone: 'error', text: `Choose a ${kind} file first.` }); return; }
    try { const queued = await upload(token, songId, kind, file); notify({ tone: 'success', text: `${kind === 'audio' ? 'Audio' : 'Cover'} received and queued as job ${queued.jobId}.` }); await load(); }
    catch (error) { notify({ tone: 'error', text: messageOf(error) }); }
  }
  async function publish(song: Song) {
    try { await api(token, `/admin/songs/${song._id}/publish`, { method: 'POST', body: JSON.stringify({ published: !song.published }) }); await load(); notify({ tone: 'success', text: `${song.title} is now ${song.published ? 'unpublished' : 'published'}.` }); }
    catch (error) { notify({ tone: 'error', text: messageOf(error) }); }
  }
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const visibleSongs = normalizedQuery ? songs.filter((song) => [song.title, song.language, song.processing, song.published ? 'published' : 'unpublished'].some((value) => value.toLowerCase().includes(normalizedQuery))) : songs;
  return <section className="space-y-5"><div className="grid gap-4 sm:grid-cols-3"><Metric label="Songs" value={songs.length} icon={LibraryBig} tone="violet" /><Metric label="Ready to publish" value={songs.filter((song) => song.processing === 'ready').length} icon={Sparkles} tone="cyan" /><Metric label="Published" value={songs.filter((song) => song.published).length} icon={Disc3} tone="emerald" /></div><section className="rounded-3xl border border-white/[0.09] bg-slate-900/50 p-5 shadow-2xl shadow-black/10 backdrop-blur sm:p-6"><div className="mb-6 flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-400/15 text-violet-300"><Plus size={20} /></span><div><h2 className="font-bold text-white">Create a song</h2><p className="mt-1 text-sm text-slate-500">Add metadata first, then upload the source audio from the library below.</p></div></div><form className="space-y-5" onSubmit={createSong}><div className="grid gap-4 md:grid-cols-3"><Field label="Song title"><input className={inputClass} name="title" placeholder="Song name" required /></Field><Field label="Language"><input className={inputClass} name="language" placeholder="hi" required /></Field><Field label="Artist"><select className={inputClass} name="artist" required defaultValue=""><option value="" disabled>Select artist</option>{artists.map((artist) => <option value={artist._id} key={artist._id}>{artist.name}</option>)}</select></Field></div><div className="grid gap-4 md:grid-cols-2"><Field label="Categories"><select className={`${inputClass} min-h-28`} name="categories" multiple>{categories.map((category) => <option value={category._id} key={category._id}>{category.name}</option>)}</select><Hint>Select one or more categories.</Hint></Field><Field label="Tags"><select className={`${inputClass} min-h-28`} name="tags" multiple>{tags.map((tag) => <option value={tag._id} key={tag._id}>{tag.name}</option>)}</select><Hint>Use tags for richer search results.</Hint></Field></div><Field label="Lyrics"><textarea className={`${inputClass} min-h-28 resize-y`} name="lyrics" placeholder="Optional lyrics…" /></Field><button className={primary}><Plus size={17} />Create song</button></form></section><section className="overflow-hidden rounded-3xl border border-white/[0.09] bg-slate-900/50 shadow-2xl shadow-black/10 backdrop-blur"><div className="flex flex-col gap-4 border-b border-white/[0.08] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div><h2 className="text-lg font-bold text-white">Music processing</h2><p className="mt-1 text-sm text-slate-500">{normalizedQuery ? `${visibleSongs.length} result${visibleSongs.length === 1 ? '' : 's'} for “${searchQuery.trim()}”` : 'Audio is processed in the background after it is uploaded.'}</p></div><button className={secondary} disabled={loading} onClick={() => void load()}><RefreshCw className={loading ? 'animate-spin' : ''} size={16} />Refresh</button></div>{loading ? <LoadingRows /> : visibleSongs.length === 0 ? <Empty title={normalizedQuery ? 'No matching songs' : 'Your library is empty'} text={normalizedQuery ? 'Try a different title, language, processing state, or publishing state.' : 'Create a song above after adding artists and categories in Catalog.'} icon={Music2} /> : <div className="divide-y divide-white/[0.07]">{visibleSongs.map((song) => <SongRow key={song._id} song={song} onUpload={uploadMedia} onLicense={setLicenseSong} onPublish={publish} />)}</div>}</section>{licenseSong && <LicenseDialog token={token} song={licenseSong} onClose={() => setLicenseSong(null)} onSaved={async () => { setLicenseSong(null); await load(); notify({ tone: 'success', text: 'Music rights and availability have been saved.' }); }} onError={(text) => notify({ tone: 'error', text })} />}</section>;
}

function SongRow({ song, onUpload, onLicense, onPublish }: { song: Song; onUpload: (id: string, file: File | undefined, kind: 'audio' | 'cover') => Promise<void>; onLicense: (song: Song) => void; onPublish: (song: Song) => Promise<void> }) {
  const [audio, setAudio] = useState<File>(); const [cover, setCover] = useState<File>(); const [busy, setBusy] = useState<'audio' | 'cover' | 'publish' | null>(null);
  async function run(kind: 'audio' | 'cover') { setBusy(kind); try { await onUpload(song._id, kind === 'audio' ? audio : cover, kind); } finally { setBusy(null); } }
  async function publish() { setBusy('publish'); try { await onPublish(song); } finally { setBusy(null); } }
  const qualities = song.audio?.map((item) => item.quality).join(' · ');
  return <article className="px-5 py-5 sm:px-6"><div className="flex flex-col gap-5 xl:flex-row xl:items-start"><div className="flex min-w-0 flex-1 gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-400/25 to-cyan-400/15 text-violet-200"><Music2 size={20} /></span><div className="min-w-0"><h3 className="truncate font-bold text-white">{song.title}</h3><p className="mt-1 text-sm text-slate-500">{song.language.toUpperCase()} · {qualities || 'No processed audio yet'}</p><div className="mt-3 flex flex-wrap gap-2"><ProcessingBadge state={song.processing} />{song.published && <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-xs font-bold text-emerald-200">Published</span>}</div></div></div><div className="grid gap-3 sm:grid-cols-2 xl:w-[620px]"><UploadControl label="Source audio" accept="audio/mpeg,audio/wav,audio/flac,audio/mp4" file={audio} onChange={setAudio} onUpload={() => void run('audio')} busy={busy === 'audio'} /><UploadControl label="Cover image" accept="image/jpeg,image/png,image/webp" file={cover} onChange={setCover} onUpload={() => void run('cover')} busy={busy === 'cover'} /></div><div className="flex flex-wrap gap-2 xl:w-48 xl:justify-end"><button className={secondary} onClick={() => onLicense(song)}><ShieldCheck size={15} />Rights</button>{song.processing === 'ready' && <button className={song.published ? danger : primary} disabled={busy === 'publish'} onClick={() => void publish()}>{busy === 'publish' && <LoaderCircle className="animate-spin" size={15} />}{song.published ? 'Unpublish' : 'Publish'}</button>}</div></div></article>;
}

function UploadControl({ label, accept, file, onChange, onUpload, busy }: { label: string; accept: string; file?: File; onChange: (file: File | undefined) => void; onUpload: () => void; busy: boolean }) {
  return <div className="rounded-2xl border border-dashed border-white/15 bg-slate-950/35 p-3"><div className="flex items-center gap-2 text-xs font-semibold text-slate-300"><FileAudio size={15} className="text-violet-300" />{label}</div><label className="mt-2 block"><span className="sr-only">Choose {label.toLowerCase()}</span><input className="block w-full text-xs text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-white/[0.08] file:px-2.5 file:py-1.5 file:text-xs file:font-semibold file:text-slate-200 hover:file:bg-white/[0.14]" type="file" accept={accept} onChange={(event) => onChange(event.target.files?.[0])} /></label><div className="mt-3 flex items-center justify-between gap-2"><p className="min-w-0 truncate text-xs text-slate-500">{file?.name || 'No file selected'}</p><button className={secondary} disabled={!file || busy} onClick={onUpload}>{busy ? <LoaderCircle className="animate-spin" size={14} /> : <UploadCloud size={14} />}Upload</button></div></div>;
}

function LicenseDialog({ token, song, onClose, onSaved, onError }: { token: string; song: Song; onClose: () => void; onSaved: () => Promise<void>; onError: (message: string) => void }) {
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true);
    const form = new FormData(event.currentTarget);
    try { const endsAt = new Date(`${String(form.get('endsAt'))}T23:59:59.999Z`); await api(token, `/admin/licenses/${song._id}`, { method: 'PUT', body: JSON.stringify({ holder: form.get('holder'), startsAt: new Date().toISOString(), endsAt: endsAt.toISOString(), streaming: true, offline: true, territories: [], enabled: true }) }); await onSaved(); }
    catch (error) { onError(messageOf(error)); } finally { setBusy(false); }
  }
  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="license-title"><form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl shadow-black/50"><div className="flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-400/15 text-violet-300"><ShieldCheck size={20} /></span><div className="flex-1"><h2 id="license-title" className="font-bold text-white">Set music rights</h2><p className="mt-1 text-sm text-slate-500">{song.title} will be eligible for streaming and offline playback until this license expires.</p></div><button className="rounded-lg p-1 text-slate-400 hover:bg-white/10" type="button" onClick={onClose} aria-label="Close"><X size={18} /></button></div><div className="mt-6 space-y-4"><Field label="Rights holder"><input className={inputClass} name="holder" placeholder="Label or rights owner" required /></Field><Field label="License expiry"><input className={inputClass} name="endsAt" type="date" min={new Date().toISOString().slice(0, 10)} defaultValue={new Date(Date.now() + 31536000000).toISOString().slice(0, 10)} required /></Field></div><div className="mt-7 flex justify-end gap-3"><button className={secondary} type="button" onClick={onClose}>Cancel</button><button className={primary} disabled={busy}>{busy && <LoaderCircle className="animate-spin" size={16} />}Save rights</button></div></form></div>;
}

function CatalogPanel({ token, notify, searchQuery }: { token: string; notify: (notice: Notice) => void; searchQuery: string }) {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [artistsLoading, setArtistsLoading] = useState(true);
  const [artistToDelete, setArtistToDelete] = useState<Artist | null>(null);
  const [deletingArtist, setDeletingArtist] = useState(false);

  const loadArtists = useCallback(async () => {
    setArtistsLoading(true);
    try { setArtists((await api<{ data: Artist[] }>(token, '/admin/artists?limit=100')).data); }
    catch (error) { notify({ tone: 'error', text: messageOf(error) }); }
    finally { setArtistsLoading(false); }
  }, [token, notify]);

  useEffect(() => { void loadArtists(); }, [loadArtists]);

  const create = (kind: 'artists' | 'categories' | 'tags') => async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const form = event.currentTarget;
    try { await api(token, `/admin/${kind}`, { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(form))) }); form.reset(); if (kind === 'artists') await loadArtists(); notify({ tone: 'success', text: `${kind.slice(0, -1).replace(/^./, (character) => character.toUpperCase())} created.` }); }
    catch (error) { notify({ tone: 'error', text: messageOf(error) }); }
  };

  async function deleteArtist() {
    if (!artistToDelete) return;
    setDeletingArtist(true);
    try {
      await api(token, `/admin/artists/${artistToDelete._id}`, { method: 'DELETE' });
      const removedName = artistToDelete.name;
      setArtistToDelete(null);
      await loadArtists();
      notify({ tone: 'success', text: `${removedName} was removed.` });
    } catch (error) { notify({ tone: 'error', text: messageOf(error) }); }
    finally { setDeletingArtist(false); }
  }

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const visibleArtists = normalizedQuery ? artists.filter((artist) => artist.name.toLowerCase().includes(normalizedQuery)) : artists;
  const cards = [
    { key: 'artists', title: 'Artists', description: 'Create artists before creating their songs.', keywords: 'artist musician singer', icon: Disc3, form: <Field label="Artist name"><input className={inputClass} name="name" placeholder="Artist name" required /></Field>, footer: <ArtistList artists={visibleArtists} loading={artistsLoading} filtered={Boolean(normalizedQuery)} onDelete={setArtistToDelete} /> },
    { key: 'categories', title: 'Categories', description: 'Build dynamic genres and devotional groups.', keywords: 'category genre devotional bhakti', icon: FolderTree, form: <><Field label="Category name"><input className={inputClass} name="name" placeholder="e.g. Bhakti" required /></Field><Field label="Slug"><input className={inputClass} name="slug" placeholder="e.g. bhakti" pattern="[a-z0-9]+(-[a-z0-9]+)*" required /></Field></> },
    { key: 'tags', title: 'Tags', description: 'Improve discovery with searchable descriptors.', keywords: 'tag search descriptor', icon: Tag, form: <><Field label="Tag name"><input className={inputClass} name="name" placeholder="e.g. Peaceful" required /></Field><Field label="Slug"><input className={inputClass} name="slug" placeholder="e.g. peaceful" pattern="[a-z0-9]+(-[a-z0-9]+)*" required /></Field></> },
  ] as const;
  const visibleCards = normalizedQuery ? cards.filter((card) => `${card.title} ${card.description} ${card.keywords}`.toLowerCase().includes(normalizedQuery) || (card.key === 'artists' && visibleArtists.length > 0)) : cards;
  return <>{visibleCards.length === 0 ? <Empty title="No matching catalog tools" text="Try searching for artists, categories, genres, or tags." icon={Search} /> : <section className="grid items-start gap-5 xl:grid-cols-3">{visibleCards.map((card) => <CatalogCard key={card.key} title={card.title} description={card.description} icon={card.icon} onSubmit={create(card.key)} footer={'footer' in card ? card.footer : undefined}>{card.form}</CatalogCard>)}</section>}{artistToDelete && <DeleteArtistDialog artist={artistToDelete} busy={deletingArtist} onCancel={() => setArtistToDelete(null)} onConfirm={() => void deleteArtist()} />}</>;
}

function ArtistList({ artists, loading, filtered, onDelete }: { artists: Artist[]; loading: boolean; filtered: boolean; onDelete: (artist: Artist) => void }) {
  return <div className="mt-5 border-t border-border pt-4"><div className="mb-2 flex items-center justify-between"><h3 className="text-xs font-bold uppercase tracking-[0.14em] text-brown">Existing artists</h3><span className="text-xs text-muted">{artists.length}</span></div>{loading ? <div className="flex items-center gap-2 py-3 text-sm text-muted"><LoaderCircle className="animate-spin" size={15} />Loading artists…</div> : artists.length === 0 ? <p className="py-3 text-sm text-muted">{filtered ? 'No matching artists.' : 'No artists added yet.'}</p> : <div className="max-h-52 space-y-1 overflow-y-auto pr-1">{artists.map((artist) => <div key={artist._id} className="group flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-surface-soft"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-band text-gold-dark"><Disc3 size={15} /></span><span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{artist.name}</span><button type="button" onClick={() => onDelete(artist)} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-danger/10 hover:text-danger focus:outline-none focus-visible:ring-2 focus-visible:ring-danger/30" aria-label={`Remove ${artist.name}`} title="Remove artist"><Trash2 size={16} /></button></div>)}</div>}</div>;
}

function DeleteArtistDialog({ artist, busy, onCancel, onConfirm }: { artist: Artist; busy: boolean; onCancel: () => void; onConfirm: () => void }) {
  return <div className="fixed inset-0 z-50 grid place-items-center bg-blackbar/60 p-4 backdrop-blur-sm" onMouseDown={busy ? undefined : onCancel}><section className="w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="delete-artist-title" onMouseDown={(event) => event.stopPropagation()}><div className="flex items-start gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-danger/10 text-danger"><Trash2 size={20} /></span><div><h2 id="delete-artist-title" className="text-lg font-bold text-ink">Remove {artist.name}?</h2><p className="mt-1 text-sm leading-6 text-muted">The artist will be permanently removed. Artists attached to songs or albums cannot be deleted.</p></div></div><div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button className={secondary} type="button" disabled={busy} onClick={onCancel}>Cancel</button><button className={danger} type="button" disabled={busy} onClick={onConfirm}>{busy ? <LoaderCircle className="animate-spin" size={16} /> : <Trash2 size={16} />}Remove artist</button></div></section></div>;
}

function CatalogCard({ title, description, icon: Icon, onSubmit, children, footer }: { title: string; description: string; icon: LucideIcon; onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>; children: ReactNode; footer?: ReactNode }) {
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) { setBusy(true); try { await onSubmit(event); } finally { setBusy(false); } }
  const singularTitle = title === 'Categories' ? 'Category' : title.slice(0, -1);
  return <article className="rounded-2xl border border-border bg-white p-5 shadow-[0_14px_35px_rgba(31,36,48,0.08)] sm:p-6"><span className="grid h-11 w-11 place-items-center rounded-xl bg-band text-gold-dark ring-1 ring-primary/20"><Icon size={21} /></span><h2 className="mt-5 text-lg font-bold text-ink">{title}</h2><p className="mt-1 min-h-10 text-sm leading-5 text-muted">{description}</p><form className="mt-5 space-y-4" onSubmit={(event) => void submit(event)}>{children}<button className={`${primary} w-full`} disabled={busy}>{busy && <LoaderCircle className="animate-spin" size={16} />}<Plus size={16} />Add {singularTitle}</button></form>{footer}</article>;
}

function Metric({ label, value, icon: Icon, tone }: { label: string; value: number; icon: LucideIcon; tone: 'violet' | 'emerald' | 'amber' | 'cyan' }) {
  const tones = { violet: 'bg-violet-400/15 text-violet-300', emerald: 'bg-emerald-400/15 text-emerald-300', amber: 'bg-amber-400/15 text-amber-200', cyan: 'bg-cyan-400/15 text-cyan-200' };
  return <article className="rounded-3xl border border-white/[0.09] bg-slate-900/50 p-5 shadow-xl shadow-black/10 backdrop-blur"><div className="flex items-start justify-between"><div><p className="text-sm font-medium text-slate-400">{label}</p><p className="mt-2 text-3xl font-bold tracking-tight text-white">{value}</p></div><span className={`grid h-10 w-10 place-items-center rounded-2xl ${tones[tone]}`}><Icon size={19} /></span></div></article>;
}

function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="block text-sm font-semibold text-slate-300"><span>{label}</span>{children}</label>; }
function Hint({ children }: { children: ReactNode }) { return <p className="mt-1.5 text-xs leading-5 text-slate-500">{children}</p>; }
function StatusBadge({ active }: { active: boolean }) { return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${active ? 'border border-emerald-400/20 bg-emerald-400/10 text-emerald-200' : 'border border-rose-400/20 bg-rose-400/10 text-rose-200'}`}><span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-emerald-300' : 'bg-rose-300'}`} />{active ? 'Active' : 'Disabled'}</span>; }
function ProcessingBadge({ state }: { state: Song['processing'] }) { const styles = { pending: 'border-amber-400/20 bg-amber-400/10 text-amber-200', processing: 'border-sky-400/20 bg-sky-400/10 text-sky-200', ready: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200', failed: 'border-rose-400/20 bg-rose-400/10 text-rose-200' }; return <span className={`rounded-full border px-2.5 py-1 text-xs font-bold capitalize ${styles[state]}`}>{state}</span>; }
function Empty({ title, text, icon: Icon }: { title: string; text: string; icon: LucideIcon }) { return <div className="grid min-h-72 place-items-center px-5 py-10 text-center"><div><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white/[0.06] text-slate-400"><Icon size={22} /></span><h3 className="mt-4 font-bold text-slate-200">{title}</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">{text}</p></div></div>; }
function LoadingRows() { return <div className="divide-y divide-white/[0.07] px-5 py-2 sm:px-6">{Array.from({ length: 4 }, (_, index) => <div className="flex items-center gap-3 py-4" key={index}><div className="h-10 w-10 animate-pulse rounded-full bg-white/[0.06]" /><div className="flex-1 space-y-2"><div className="h-3 w-36 animate-pulse rounded bg-white/[0.07]" /><div className="h-2.5 w-52 animate-pulse rounded bg-white/[0.05]" /></div><div className="h-8 w-20 animate-pulse rounded-xl bg-white/[0.06]" /></div>)}</div>; }
function selectedValues(form: HTMLFormElement, name: string) { const select = form.elements.namedItem(name) as HTMLSelectElement; return Array.from(select.selectedOptions).map((option) => option.value); }
