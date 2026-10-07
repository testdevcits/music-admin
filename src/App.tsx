import { ChangeEvent, FormEvent, ReactNode, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowLeft,
  AudioLines,
  Bell,
  Check,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Clock3,
  Disc3,
  Eye,
  EyeOff,
  FolderTree,
  ImageUp,
  LibraryBig,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Menu,
  Music2,
  PanelRightClose,
  PanelRightOpen,
  Pencil,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Settings,
  ShieldCheck,
  Search,
  Sparkles,
  Tag,
  Trash2,
  UploadCloud,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { api, apiBaseUrl, Artist, Category, configured, login, Song, Tag as TagModel, upload, uploadProfileImage, User } from './api';
import { MusicWorkflowPage } from './pages/MusicWorkflowPage';
import { DashboardPage } from './pages/DashboardPage';
import { SettingsPage, selectSettingsSection } from './pages/SettingsPage';
import { FilterDropdown } from './components/FilterDropdown';
import { ConfirmDialog } from './components/ConfirmDialog';
import { PageSectionNav, type PageSectionItem } from './components/PageSectionNav';
import { AdminPageHeader } from './components/AdminPageHeader';
import { CommonTable } from './components/CommonTable';
import type { CommonTableColumn } from './components/CommonTable';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { setMe, setToken, signOut as clearAuth } from './store/authSlice';

type Tab = 'dashboard' | 'users' | 'music' | 'catalog' | 'import' | 'settings' | 'workflow' | 'policies' | 'notifications';
type CatalogSection = 'artists' | 'categories' | 'tags';
type Notice = { tone: 'success' | 'error' | 'info'; text: string };

const routeByTab: Record<Tab, string> = {
  dashboard: '/dashboard',
  users: '/users',
  music: '/music',
  catalog: '/catalog',
  import: '/import',
  settings: '/settings',
  workflow: '/workflow',
  policies: '/policies',
  notifications: '/notifications',
};
const tabByRoute = Object.fromEntries(Object.entries(routeByTab).map(([tab, path]) => [path, tab])) as Record<string, Tab>;
function tabFromPath(pathname: string): Tab {
  const path = pathname.replace(/\/$/, '') || '/';
  if (/^\/users\/[^/]+$/.test(path)) return 'users';
  return tabByRoute[path] ?? 'dashboard';
}
function userIdFromPath(pathname: string): string | null {
  const match = pathname.replace(/\/$/, '').match(/^\/users\/([^/]+)$/);
  if (!match) return null;
  try { return decodeURIComponent(match[1]); } catch { return null; }
}

const pageSections: Record<Tab, PageSectionItem[]> = {
  dashboard: [{ id: 'dashboard-overview', label: 'Overview' }, { id: 'growth-overview', label: 'Growth overview' }, { id: 'listening-activity', label: 'Listening activity' }, { id: 'library-health', label: 'Library health' }, { id: 'account-status', label: 'Account status' }],
  users: [{ id: 'user-accounts', label: 'User accounts' }, { id: 'access-controls', label: 'Access controls' }, { id: 'account-status', label: 'Account status' }],
  music: [{ id: 'create-song', label: 'Create a song' }, { id: 'audio-processing', label: 'Audio processing' }, { id: 'rights-and-publishing', label: 'Rights and publishing' }],
  catalog: [{ id: 'artists', label: 'Artists', targetId: 'catalog-records' }, { id: 'categories', label: 'Categories', targetId: 'catalog-records' }, { id: 'tags', label: 'Tags', targetId: 'catalog-records' }],
  import: [{ id: 'provider-search', label: 'Provider search' }, { id: 'metadata-review', label: 'Metadata review' }, { id: 'draft-import', label: 'Draft import', targetId: 'metadata-review' }],
  settings: [{ id: 'admin-profile', label: 'Admin profile' }, { id: 'branding', label: 'Branding' }, { id: 'system-health', label: 'System health' }],
  workflow: [{ id: 'catalog-setup', label: 'Catalog setup' }, { id: 'song-creation', label: 'Song creation' }, { id: 'audio-upload', label: 'Audio upload' }, { id: 'review-and-publish', label: 'Review and publish' }, { id: 'publish-and-monitor', label: 'Publish and monitor' }],
  policies: [{ id: 'add-policy', label: 'Add policy' }, { id: 'saved-policies', label: 'Saved policies' }],
  notifications: [{ id: 'all-notifications', label: 'All notifications' }],
};

const tokenKey = 'music-platform-admin-token';
const inputClass = 'mt-2 w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-gray focus:border-primary focus:ring-4 focus:ring-primary/15';
const passwordInputClass = inputClass.replace('mt-2 ', '');
const button = 'inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-50';
const primary = `${button} bg-primary text-navy-dark shadow-[0_8px_24px_rgba(214,163,35,0.24)] hover:bg-gold-dark hover:text-white focus:ring-primary/25`;
const secondary = `${button} border border-border bg-white text-navy hover:bg-navy-soft focus:ring-primary/15`;
const danger = `${button} border border-danger bg-danger text-white hover:bg-danger/90 focus:ring-danger/20`;
const pageCopy: Record<Tab, { eyebrow: string; title: string; description: string }> = {
  dashboard: { eyebrow: 'Platform analytics', title: 'Dashboard', description: 'Monitor audience growth, listening activity, and your music catalog.' },
  users: { eyebrow: 'Audience management', title: 'Users', description: 'Review accounts and control platform access.' },
  music: { eyebrow: 'Music operations', title: 'Music library', description: 'Create, process, license, and publish every release.' },
  catalog: { eyebrow: 'Content foundation', title: 'Catalog', description: 'Keep artists, listening categories, and tags organised.' },
  import: { eyebrow: 'External sourcing', title: 'Music import', description: 'Search approved providers, check metadata, and import draft tracks for review.' },
  settings: { eyebrow: 'Workspace controls', title: 'Settings', description: 'Manage your admin identity, logo branding, and platform system health.' },
  workflow: { eyebrow: 'Release flow', title: 'View music workflow', description: 'Walk through the full music lifecycle from catalog setup to publishing.' },
  policies: { eyebrow: 'Workspace controls', title: 'Platform policies', description: 'Create and manage the policies shown to your platform users.' },
  notifications: { eyebrow: 'Audience messaging', title: 'Notifications', description: 'Send an in-app message to a listener.' },
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

function readStoredImage(key: string) {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(key) || '';
}

function resolveImageUrl(value?: string | { url?: string; alt?: string; publicId?: string } | null) {
  if (!value) return '';
  if (typeof value === 'string') {
    if (value.startsWith('data:') || value.startsWith('http://') || value.startsWith('https://')) return value;
    if (value.startsWith('/')) return `${apiBaseUrl}${value}`;
    return value;
  }
  if (value.url) {
    if (value.url.startsWith('data:') || value.url.startsWith('http://') || value.url.startsWith('https://')) return value.url;
    if (value.url.startsWith('/')) return `${apiBaseUrl}${value.url}`;
    return value.url;
  }
  return '';
}

function formatDate(value?: string) {
  return value ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—';
}

export default function App() {
  const dispatch = useAppDispatch();
  const reduxToken = useAppSelector((state) => state.auth.token);
  const reduxMe = useAppSelector((state) => state.auth.me);
  const [token, setTokenState] = useState(() => reduxToken || sessionStorage.getItem(tokenKey) || '');
  const [me, setMeState] = useState<User | null>(reduxMe);
  const [authLoading, setAuthLoading] = useState(() => Boolean(reduxToken || sessionStorage.getItem(tokenKey)) && !reduxMe);
  const [tab, setTab] = useState<Tab>(() => tabFromPath(window.location.pathname));
  const [selectedUserId, setSelectedUserId] = useState<string | null>(() => userIdFromPath(window.location.pathname));
  const [pageHeaderCompact, setPageHeaderCompact] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const pageHeaderRef = useRef<HTMLDivElement>(null);
  const previousPageHeaderHeight = useRef(0);
  const [catalogSection, setCatalogSection] = useState<CatalogSection>('artists');
  const [catalogCounts, setCatalogCounts] = useState<Record<CatalogSection, number>>({ artists: 0, categories: 0, tags: 0 });
  const [workflowStepId, setWorkflowStepId] = useState('catalog-setup');
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [logoutOpen, setLogoutOpen] = useState(false);

  const signOut = useCallback(() => {
    window.localStorage.removeItem('admin-profile-image');
    window.localStorage.removeItem('admin-brand-logo');
    dispatch(clearAuth());
    setTokenState('');
    setMeState(null);
    setAuthLoading(false);
    setLogoutOpen(false);
  }, [dispatch]);

  const changeTab = useCallback((nextTab: Tab) => {
    const nextPath = routeByTab[nextTab];
    if (window.location.pathname !== nextPath) window.history.pushState({ tab: nextTab }, '', nextPath);
    setTab(nextTab);
    setSelectedUserId(null);
    setSearchQuery('');
    setPageHeaderCompact(false);
    previousPageHeaderHeight.current = 0;
    scrollAreaRef.current?.scrollTo({ top: 0 });
  }, []);

  const openUserDetails = useCallback((userId: string) => {
    const nextPath = `/users/${encodeURIComponent(userId)}`;
    if (window.location.pathname !== nextPath) window.history.pushState({ tab: 'users', userId }, '', nextPath);
    setTab('users');
    setSelectedUserId(userId);
    setSearchQuery('');
    setPageHeaderCompact(false);
    scrollAreaRef.current?.scrollTo({ top: 0 });
  }, []);

  useEffect(() => {
    const path = window.location.pathname.replace(/\/$/, '') || '/';
    if (path === '/' || (!tabByRoute[path] && !userIdFromPath(path))) {
      window.history.replaceState({ tab: tabFromPath(window.location.pathname) }, '', routeByTab[tabFromPath(window.location.pathname)]);
    }
    const handlePopState = () => {
      setTab(tabFromPath(window.location.pathname));
      setSelectedUserId(userIdFromPath(window.location.pathname));
      setSearchQuery('');
      setPageHeaderCompact(false);
      previousPageHeaderHeight.current = 0;
      scrollAreaRef.current?.scrollTo({ top: 0 });
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  const updateCatalogCount = useCallback((section: CatalogSection, total: number) => {
    const safeTotal = Number.isFinite(total) && total >= 0 ? total : 0;
    setCatalogCounts((current) => ({ ...current, [section]: safeTotal }));
  }, []);

  const requestSignOut = useCallback(() => setLogoutOpen(true), []);
  const beginLogin = useCallback((nextToken: string) => {
    setAuthLoading(true);
    setTokenState(nextToken);
  }, []);

  useEffect(() => {
    dispatch(setToken(token));
  }, [dispatch, token]);

  useEffect(() => {
    if (!token) {
      setAuthLoading(false);
      return;
    }
    let active = true;
    setAuthLoading(true);
    api<User>(token, '/users/me').then((user) => {
      if (user.role !== 'admin') throw new Error('ADMIN_REQUIRED');
      if (!active) return;
      const profileUrl = resolveImageUrl(user.image);
      if (profileUrl) window.localStorage.setItem('admin-profile-image', profileUrl);
      setMeState(user);
      dispatch(setMe(user));
      setAuthLoading(false);
    }).catch((error) => {
      if (!active) return;
      setNotice({ tone: 'error', text: messageOf(error) });
      signOut();
    });
    return () => { active = false; };
  }, [dispatch, token, signOut]);

  useEffect(() => {
    if (me) {
      dispatch(setMe(me));
    }
  }, [dispatch, me]);

  useEffect(() => {
    if (!notice || (!token && !me)) return;
    const timeout = window.setTimeout(() => setNotice(null), 4500);
    return () => window.clearTimeout(timeout);
  }, [notice, token, me]);

  useLayoutEffect(() => {
    const headerHeight = pageHeaderRef.current?.getBoundingClientRect().height;
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea) return;
    if (headerHeight === undefined) {
      previousPageHeaderHeight.current = 0;
      return;
    }
    if (previousPageHeaderHeight.current && Math.abs(headerHeight - previousPageHeaderHeight.current) > 1) {
      scrollArea.scrollTop = Math.max(0, scrollArea.scrollTop + headerHeight - previousPageHeaderHeight.current);
    }
    previousPageHeaderHeight.current = headerHeight;
  }, [pageHeaderCompact]);

  if (!configured) return <ConfigurationNeeded />;
  if (authLoading) return <AuthLoading />;
  if (!token || !me) return <Login onLogin={beginLogin} initialError={notice?.text} />;

  const copy = pageCopy[tab];
  return (
    <main className="flex h-screen flex-col overflow-hidden bg-surface text-ink selection:bg-band">
      <AdminHeader user={me} searchQuery={searchQuery} onSearch={setSearchQuery} onSignOut={requestSignOut} onNotifications={() => changeTab('notifications')} />
      <div className="flex min-h-0 w-full flex-1 overflow-hidden">
        <Sidebar active={tab} onChange={changeTab} user={me} onSignOut={requestSignOut} />
        <div ref={scrollAreaRef} onScroll={(event) => { const top = event.currentTarget.scrollTop; setPageHeaderCompact((compact) => compact ? top > 24 : top > 160); }} className="hide-scrollbar min-w-0 flex-1 overflow-y-auto px-3 pb-8 sm:px-5 lg:px-6">
          <MobileNav active={tab} onChange={changeTab} onSignOut={requestSignOut} />
          {tab !== 'dashboard' && <AdminPageHeader copy={copy} compact={pageHeaderCompact} headerRef={pageHeaderRef} />}
          <div className={`mt-4 grid gap-5 ${rightPanelOpen ? 'xl:grid-cols-[minmax(0,1fr)_270px]' : 'xl:grid-cols-[minmax(0,1fr)]'}`}>
            <div className="documentation-panel min-w-0">
              {tab === 'users' && <UsersPanel token={token} me={me} notify={setNotice} searchQuery={searchQuery} selectedUserId={selectedUserId} onViewUser={openUserDetails} onBackToUsers={() => changeTab('users')} />}
              {tab === 'dashboard' && <DashboardPage token={token} notify={setNotice} onNavigate={changeTab} />}
              {tab === 'music' && <MusicPanel token={token} notify={setNotice} searchQuery={searchQuery} onSearch={setSearchQuery} />}
              {tab === 'workflow' && <MusicWorkflowPage activeStepId={workflowStepId} onStepSelect={setWorkflowStepId} />}
              {tab === 'policies' && <PoliciesPanel token={token} notify={setNotice} />}
              {tab === 'notifications' && <NotificationsPanel token={token} notify={setNotice} />}
              {tab === 'catalog' && <CatalogWorkspace token={token} notify={setNotice} searchQuery={searchQuery} section={catalogSection} onCountChange={updateCatalogCount} />}
              {tab === 'import' && <ImportPanel token={token} notify={setNotice} />}
              {tab === 'settings' && <SettingsPage me={me} token={token} notify={setNotice} onMeUpdate={(user) => { setMeState(user); dispatch(setMe(user)); }} />}
            </div>
            {rightPanelOpen ? <ContextPanel tab={tab} section={catalogSection} catalogCounts={catalogCounts} onSectionSelect={setCatalogSection} onTabChange={changeTab} onToggle={() => setRightPanelOpen(false)} activeStepId={workflowStepId} onStepSelect={setWorkflowStepId} /> : <button type="button" onClick={() => setRightPanelOpen(true)} className="fixed right-4 top-28 z-30 hidden items-center gap-2 rounded-xl border border-border bg-white px-3 py-2 text-sm font-semibold text-navy shadow-lg xl:inline-flex" aria-label="Open page panel"><PanelRightOpen size={16} />Open</button>}
          </div>
        </div>
      </div>
      {notice && <Toast notice={notice} onDismiss={() => setNotice(null)} />}
      {logoutOpen && <LogoutDialog user={me} onCancel={() => setLogoutOpen(false)} onConfirm={signOut} />}
    </main>
  );
}

function Brand({ compact = false, inverted = false }: { compact?: boolean; inverted?: boolean }) {
  const logo = readStoredImage('admin-brand-logo');
  return <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-gold-soft via-primary to-gold-dark text-navy-dark shadow-sm">{logo ? <img src={logo} alt="Brand logo" className="h-full w-full object-cover" /> : <AudioLines size={21} strokeWidth={2.5} />}</span>{!compact && <span><span className={`block text-sm font-bold tracking-tight ${inverted ? 'text-white' : 'text-ink'}`}>Music Platform</span><span className={`block text-xs ${inverted ? 'text-slate-500' : 'text-muted'}`}>Admin workspace</span></span>}</div>;
}

function Avatar({ name, imageUrl }: { name: string; imageUrl?: string }) {
  if (imageUrl) return <img src={imageUrl} alt={name} className="h-10 w-10 rounded-full object-cover ring-1 ring-border" />;
  return <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-violet-400 to-cyan-300 text-xs font-black text-slate-950">{initials(name)}</span>;
}

function AuthLoading() {
  return <main className="grid min-h-screen place-items-center bg-surface text-ink"><div className="flex items-center gap-3 rounded-2xl border border-border bg-white px-5 py-4 text-sm font-medium text-muted"><LoaderCircle size={18} className="animate-spin text-gold-dark" />Restoring your admin session…</div></main>;
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
  { id: 'dashboard', label: 'Dashboard', description: 'Platform overview', icon: LayoutDashboard },
  { id: 'users', label: 'Users', description: 'Accounts and access', icon: Users },
  { id: 'music', label: 'Music library', description: 'Songs and processing', icon: Music2 },
  { id: 'catalog', label: 'Catalog', description: 'Artists, categories, tags', icon: FolderTree },
  { id: 'import', label: 'Music import', description: 'External provider catalog', icon: UploadCloud },
  { id: 'settings', label: 'Settings', description: 'Profile and controls', icon: Settings },
];

function AdminHeader({ user, searchQuery, onSearch, onSignOut, onNotifications }: { user: User; searchQuery: string; onSearch: (query: string) => void; onSignOut: () => void; onNotifications: () => void }) {
  const avatarUrl = resolveImageUrl(user.image);
  return <div className="relative z-30 shrink-0"><div className="hidden h-8 bg-blackbar px-5 text-xs text-white sm:block"><div className="mx-auto flex h-full max-w-[1680px] items-center justify-end gap-5"><span>Music Platform administration</span><button className="inline-flex items-center gap-1 hover:text-gold-soft">Preferences <ChevronDown size={12} /></button><button className="hover:text-gold-soft">Support</button></div></div><header className="border-b border-border bg-white/95 backdrop-blur"><div className="mx-auto flex h-16 max-w-[1680px] items-center gap-3 px-4 sm:gap-5 sm:px-6"><Brand /><div className="ml-auto hidden max-w-md flex-1 items-center md:flex"><label className="relative w-full"><span className="sr-only">Search the current dashboard section</span><Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={17} /><input value={searchQuery} onChange={(event) => onSearch(event.target.value)} className="w-full rounded-lg border border-divider bg-surface-soft py-2 pl-9 pr-9 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="Search this section" />{searchQuery && <button type="button" onClick={() => onSearch('')} className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-muted hover:bg-band hover:text-navy" aria-label="Clear search"><X size={15} /></button>}</label></div><button type="button" onClick={onNotifications} className="hidden rounded-lg p-2 text-muted hover:bg-band hover:text-navy sm:grid sm:place-items-center" title="Notifications" aria-label="Notifications"><Bell size={18} /></button><span className="hidden h-8 w-px bg-border sm:block" /><button className="hidden items-center gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-surface-soft sm:flex" onClick={onSignOut} title="Sign out"><Avatar name={user.name} imageUrl={avatarUrl} /><span className="hidden xl:block"><span className="block text-xs font-bold text-ink">{user.name}</span><span className="block max-w-36 truncate text-[11px] text-muted">{user.email}</span></span></button></div></header></div>;
}

function Sidebar({ active, onChange, user, onSignOut }: { active: Tab; onChange: (tab: Tab) => void; user: User; onSignOut: () => void }) {
  const avatarUrl = resolveImageUrl(user.image);
  return <aside className="hidden h-full w-64 shrink-0 flex-col overflow-y-auto border-r border-border bg-white px-2 py-3 lg:flex"><p className="px-2 text-[10px] font-bold uppercase tracking-[0.16em] text-brown">Music management</p><nav className="mt-1.5 space-y-0.5" aria-label="Dashboard navigation">{navItems.map(({ id, label, description, icon: Icon }) => <button key={id} onClick={() => onChange(id)} className={`group flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition ${active === id ? 'bg-navy-soft text-navy shadow-[inset_3px_0_0_#D6A323]' : 'text-muted hover:text-navy'}`}><span className={`grid h-6 w-6 shrink-0 place-items-center rounded-md ${active === id ? 'bg-band text-navy' : 'text-brown group-hover:text-navy'}`}><Icon size={15} /></span><span className="min-w-0"><span className="block text-[13px] font-bold leading-4">{label}</span><span className="block truncate text-[10px] leading-3.5 text-muted">{description}</span></span>{active === id && <ChevronRight className="ml-auto text-navy" size={14} />}</button>)}</nav><div className="mt-3 border-t border-border pt-2.5"><p className="px-2 text-[10px] font-bold uppercase tracking-[0.16em] text-brown">Workspace</p>{[{ id: 'workflow' as const, label: 'View music workflow', icon: Sparkles }, { id: 'policies' as const, label: 'Platform policies', icon: ShieldCheck }, { id: 'notifications' as const, label: 'Notifications', icon: Bell }].map(({ id, label, icon: Icon }) => <button key={id} onClick={() => onChange(id)} className={`mt-0.5 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] font-semibold transition ${active === id ? 'bg-navy-soft text-navy' : 'text-muted hover:text-navy'}`}><Icon size={15} className="shrink-0 text-brown" />{label}</button>)}</div><div className="mt-auto rounded-xl border border-border bg-surface-soft p-2"><div className="flex items-center gap-2"><Avatar name={user.name} imageUrl={avatarUrl} /><span className="min-w-0"><span className="block truncate text-[13px] font-bold text-ink">{user.name}</span><span className="block truncate text-[11px] text-muted">{user.email}</span></span></div><button className={`${secondary} mt-1.5 w-full py-1.5`} onClick={onSignOut}><LogOut size={14} />Sign out</button></div></aside>;
}

function MobileNav({ active, onChange, onSignOut }: { active: Tab; onChange: (tab: Tab) => void; onSignOut: () => void }) {
  return <div className="mt-4 mb-5 flex items-center gap-2 border-b border-border pb-4 lg:hidden"><button className="grid h-10 w-10 place-items-center rounded-lg border border-border bg-white text-navy" aria-label="Dashboard sections"><Menu size={19} /></button><div className="hide-scrollbar flex min-w-0 flex-1 gap-1 overflow-x-auto">{[...navItems, { id: 'workflow' as const, label: 'Workflow', icon: Sparkles }, { id: 'policies' as const, label: 'Policies', icon: ShieldCheck }, { id: 'notifications' as const, label: 'Notifications', icon: Bell }].map(({ id, label, icon: Icon }) => <button key={id} onClick={() => onChange(id)} className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${active === id ? 'bg-navy text-white' : 'bg-white text-muted hover:bg-band hover:text-navy'}`}><Icon size={16} />{label}</button>)}</div><button title="Sign out" onClick={onSignOut} className="grid h-10 w-10 place-items-center rounded-lg border border-border bg-white text-navy"><LogOut size={17} /></button></div>;
}

function LogoutDialog({ user, onCancel, onConfirm }: { user: User; onCancel: () => void; onConfirm: () => void }) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [onCancel]);

  return <div className="fixed inset-0 z-50 grid place-items-center bg-blackbar/60 p-4 backdrop-blur-sm" onMouseDown={onCancel}><section className="w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="logout-title" onMouseDown={(event) => event.stopPropagation()}><div className="flex items-start gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-band text-gold-dark ring-1 ring-primary/20"><LogOut size={20} /></span><div><h2 id="logout-title" className="text-lg font-bold text-ink">Sign out of Music Platform?</h2><p className="mt-1 text-sm leading-6 text-muted">You are signed in as <span className="font-semibold text-ink">{user.email}</span>. You will need to enter your credentials again to return.</p></div></div><div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button className={secondary} type="button" onClick={onCancel}>Cancel</button><button className={danger} type="button" onClick={onConfirm}><LogOut size={16} />Sign out</button></div></section></div>;
}

function ContextPanel({ tab, section, catalogCounts, onSectionSelect, onTabChange, onToggle, activeStepId, onStepSelect }: { tab: Tab; section?: CatalogSection; catalogCounts: Record<CatalogSection, number>; onSectionSelect?: (section: CatalogSection) => void; onTabChange?: (tab: Tab) => void; onToggle: () => void; activeStepId?: string; onStepSelect?: (id: string) => void }) {
  const [activeSectionId, setActiveSectionId] = useState('');
  useEffect(() => {
    setActiveSectionId(tab === 'catalog' ? section ?? 'artists' : tab === 'workflow' && activeStepId ? activeStepId : pageSections[tab][0]?.id ?? '');
  }, [tab, section, activeStepId]);

  const focusSection = (anchor: string) => {
    const defaultSection = pageSections[tab][0];
    const target = document.getElementById(anchor) || document.getElementById(defaultSection.targetId || defaultSection.id);
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    target.classList.remove('page-section-highlight');
    void target.offsetWidth;
    target.classList.add('page-section-highlight');
    window.setTimeout(() => target.classList.remove('page-section-highlight'), 1800);
  };
  const items = pageSections[tab].map((item) => tab === 'catalog'
    ? { ...item, badge: (Number(catalogCounts[item.id as CatalogSection]) || 0).toLocaleString() }
    : item);
  const selectSection = (item: PageSectionItem) => {
    setActiveSectionId(item.id);
    if (tab === 'catalog') {
      onSectionSelect?.(item.id as CatalogSection);
      window.setTimeout(() => focusSection(item.targetId || item.id), 80);
      return;
    }
    if (tab === 'workflow') onStepSelect?.(item.id);
    if (tab === 'settings') {
      selectSettingsSection(item.id as 'admin-profile' | 'branding' | 'system-health');
      return;
    }
    focusSection(item.targetId || item.id);
  };

  return <aside className="hidden border-l border-border pl-4 xl:block"><div className="sticky top-24"><div className="flex items-center justify-between"><h2 className="text-base font-bold text-ink">On this page</h2><button type="button" onClick={onToggle} className="grid h-8 w-8 place-items-center rounded-lg border border-border bg-white text-muted hover:text-navy" aria-label="Close page panel"><PanelRightClose size={16} /></button></div><PageSectionNav items={items} activeId={tab === 'catalog' ? section ?? 'artists' : activeSectionId} onSelect={selectSection} ariaLabel={`${pageCopy[tab].title} sections`} />{tab !== 'workflow' && <div className="mt-6 border-t border-border pt-4"><h2 className="text-base font-bold text-ink">Recommended tasks</h2><div className="mt-3 rounded-xl border border-border bg-white p-3.5"><p className="text-sm font-bold text-ink">Get your library ready</p><p className="mt-1 text-xs leading-5 text-muted">Create catalog records, add a song, then upload audio when background processing is enabled.</p><button type="button" onClick={() => onTabChange?.('workflow')} className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-navy hover:text-gold-dark">View music workflow <ChevronRight className="inline" size={15} /></button></div></div>}</div></aside>;
}


function SettingsPanel({ token, me, notify }: { token: string; me: User; notify: (notice: Notice) => void }) {
  const [profileImage, setProfileImage] = useState<string>(() => resolveImageUrl(me.image));
  const [brandLogo, setBrandLogo] = useState<string>(() => readStoredImage('admin-brand-logo'));
  const [name, setName] = useState(me.name);
  const [email, setEmail] = useState(me.email);
  const [health, setHealth] = useState({ connected: false, latency: 0, checkedAt: 'Not checked yet' });
  const [checking, setChecking] = useState(false);

  function persistDataUrl(key: string, value: string, label: string) {
    if (!value) return;
    window.localStorage.setItem(key, value);
    notify({ tone: 'success', text: `${label} updated.` });
  }

  async function handleFileUpload(event: ChangeEvent<HTMLInputElement>, key: 'admin-profile-image' | 'admin-brand-logo', onSet: (value: string) => void, label: string) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    console.log('[profile upload] selected file', { key, fileName: file.name, type: file.type, size: file.size });

    try {
      if (key === 'admin-profile-image') {
        const result = await uploadProfileImage(token, file);
        const uploadedUrl = resolveImageUrl(result.image);
        console.log('[profile upload] success', { key, uploadedUrl, response: result });

        if (uploadedUrl) {
          onSet(uploadedUrl);
          notify({ tone: 'success', text: `${label} uploaded.` });
        }
        return;
      }

      reader.onload = () => {
        const result = String(reader.result || '');
        console.log('[brand upload] local preview saved', { key, fileName: file.name, size: file.size });
        window.localStorage.setItem(key, result);
        onSet(result);
        notify({ tone: 'success', text: `${label} uploaded.` });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('[profile upload] failed', { key, error });
      notify({ tone: 'error', text: messageOf(error) });
    }
  }

  const checkBackend = useCallback(async () => {
    setChecking(true);
    const started = performance.now();
    console.log('[refresh] checking backend health');

    try {
      const response = await api(token, '/users/me');
      console.log('[refresh] backend health success', { response, latency: Math.round(performance.now() - started) });
      setHealth({ connected: true, latency: Math.round(performance.now() - started), checkedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) });
      notify({ tone: 'success', text: 'Backend connection check passed.' });
    } catch (error) {
      console.error('[refresh] backend health failed', error);
      setHealth({ connected: false, latency: 0, checkedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) });
      notify({ tone: 'error', text: messageOf(error) });
    } finally {
      setChecking(false);
    }
  }, [notify, token]);

  useEffect(() => { void checkBackend(); }, [checkBackend]);

  return <section className="space-y-5"><div className="grid gap-5 xl:grid-cols-2"><article id="admin-profile" className="rounded-3xl border border-white/[0.09] bg-slate-900/50 p-5 shadow-2xl shadow-black/10 backdrop-blur sm:p-6"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-violet-400/15 text-violet-300"><ShieldCheck size={20} /></span><div><h2 className="font-bold text-white">Admin profile</h2><p className="mt-1 text-sm text-slate-500">Customize your account identity for the dashboard.</p></div></div><div className="mt-6 flex items-center gap-4"><Avatar name={name} imageUrl={profileImage} /><div><p className="text-sm text-slate-400">Profile image</p><label className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-white px-3 py-2 text-sm font-semibold text-navy hover:bg-band"><ImageUp size={16} />Upload photo<input type="file" accept="image/*" className="hidden" onChange={(event) => handleFileUpload(event, 'admin-profile-image', setProfileImage, 'Profile image')} /></label></div></div><div className="mt-5 space-y-4"><Field label="Display name"><input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} placeholder="Admin name" /></Field><Field label="Email address"><input className={inputClass} value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="admin@example.com" /></Field></div><button className={`${primary} mt-5`} onClick={() => notify({ tone: 'success', text: 'Profile details saved locally.' })}>Save profile</button></article><article id="branding" className="rounded-3xl border border-white/[0.09] bg-slate-900/50 p-5 shadow-2xl shadow-black/10 backdrop-blur sm:p-6"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-amber-400/15 text-amber-200"><ImageUp size={20} /></span><div><h2 className="font-bold text-white">Branding</h2><p className="mt-1 text-sm text-slate-500">Set the main workspace logo for the admin UI.</p></div></div><div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-slate-950/40 p-4"><div className="flex items-center gap-4"><div className="grid h-20 w-20 place-items-center overflow-hidden rounded-xl border border-border bg-white"><img src={brandLogo || ''} alt="Brand logo preview" className={brandLogo ? 'h-full w-full object-cover' : 'hidden'} />{!brandLogo && <AudioLines size={26} className="text-gold-dark" />}</div><div><p className="text-sm font-semibold text-white">Main logo</p><p className="mt-1 text-xs text-slate-500">Recommended size: 512×512 PNG or JPG.</p><label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-white px-3 py-2 text-sm font-semibold text-navy hover:bg-band"><UploadCloud size={16} />Upload logo<input type="file" accept="image/*" className="hidden" onChange={(event) => handleFileUpload(event, 'admin-brand-logo', setBrandLogo, 'Brand logo')} /></label></div></div></div></article></div><article id="system-health" className="rounded-3xl border border-white/[0.09] bg-slate-900/50 p-5 shadow-2xl shadow-black/10 backdrop-blur sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-400/15 text-emerald-300"><Check size={20} /></span><div><h2 className="font-bold text-white">System health</h2><p className="mt-1 text-sm text-slate-500">Status checks for the connected backend and admin environment.</p></div></div><button className={secondary} onClick={() => void checkBackend()} disabled={checking}>{checking ? <LoaderCircle className="animate-spin" size={16} /> : <RefreshCw size={16} />}Check connection</button></div><div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Backend" value={health.connected ? 'Online' : 'Offline'} icon={ShieldCheck} tone="emerald" /><Metric label="Latency" value={`${health.latency} ms`} icon={Zap} tone="violet" /><Metric label="Connect time" value={health.checkedAt} icon={Clock3} tone="amber" /><Metric label="Queue" value={health.connected ? 'Ready' : 'Pending'} icon={UploadCloud} tone="cyan" /></div></article></section>;
}

function Toast({ notice, onDismiss }: { notice: Notice; onDismiss: () => void }) {
  const palette = notice.tone === 'success' ? 'border-success/25 bg-white text-success' : notice.tone === 'error' ? 'border-danger/25 bg-white text-danger' : 'border-navy/25 bg-white text-navy';
  const Icon = notice.tone === 'success' ? Check : CircleAlert;
  return <div className="pointer-events-none fixed inset-x-4 bottom-5 z-40 flex justify-center sm:bottom-7" aria-live="polite" aria-atomic="true"><div className={`pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium shadow-[0_16px_45px_rgba(31,36,48,0.2)] animate-slide-fade-in ${palette}`} role={notice.tone === 'error' ? 'alert' : 'status'}><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-current/10"><Icon size={18} /></span><p className="min-w-0 flex-1 text-ink">{notice.text}</p><button className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-surface hover:text-ink" onClick={onDismiss} aria-label="Dismiss message"><X size={17} /></button></div></div>;
}

function UsersPanel({ token, me, notify, searchQuery, selectedUserId, onViewUser, onBackToUsers }: { token: string; me: User; notify: (notice: Notice) => void; searchQuery: string; selectedUserId: string | null; onViewUser: (userId: string) => void; onBackToUsers: () => void }) {
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
    try { await api(token, `/admin/users/${user.id}`, { method: 'PATCH', body: JSON.stringify({ disabled: !user.disabled }) }); await load(); notify({ tone: 'success', text: `${user.name} is now ${user.disabled ? 'active' : 'disabled'}.` }); }
    catch (error) { notify({ tone: 'error', text: messageOf(error) }); }
  }
  const activeUsers = users.filter((user) => !user.disabled).length;
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const visibleUsers = normalizedQuery ? users.filter((user) => [user.name, user.email, user.role, user.disabled ? 'disabled' : 'active'].some((value) => value.toLowerCase().includes(normalizedQuery))) : users;
  const columns: CommonTableColumn<User>[] = [
    { key: 'user', title: 'User', render: (user: User) => <div className="flex min-w-56 items-center gap-3"><Avatar name={user.name} imageUrl={user.image ? resolveImageUrl(user.image) : user.id === me.id ? readStoredImage('admin-profile-image') : ''} /><div className="min-w-0"><div className="flex items-center gap-2"><span className="truncate font-semibold text-ink">{user.name}</span>{user.id === me.id && <span className="rounded-full border border-violet-200 bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-800">You</span>}</div><span className="block truncate text-xs text-muted">{user.email}</span></div></div> },
    { key: 'publicId', title: 'User ID', render: (user: User) => <span className="rounded-md bg-band px-2 py-1 font-mono text-xs font-bold text-navy">{user.publicId || '—'}</span> },
    { key: 'role', title: 'Role', render: (user: User) => <span className="rounded-full border border-border bg-surface-soft px-2.5 py-1 text-xs font-semibold capitalize text-ink">{user.role}</span> },
    { key: 'joined', title: 'Joined', render: (user: User) => <span className="whitespace-nowrap text-xs text-muted">{formatDate(user.createdAt)}</span> },
    { key: 'status', title: 'Status', render: (user: User) => <StatusBadge active={!user.disabled} /> },
    { key: 'actions', title: 'Actions', className: 'w-28 text-right', render: (user: User) => <div className="flex justify-end gap-1"><button type="button" onClick={() => onViewUser(user.id)} className="grid h-8 w-8 place-items-center rounded-lg text-navy hover:bg-band" aria-label={`View ${user.name}`} title="View user"><Eye size={16} /></button>{user.id !== me.id && <button type="button" onClick={() => void toggle(user)} className="rounded-lg px-2 py-1 text-xs font-semibold text-navy hover:bg-band" title={user.disabled ? 'Enable account' : 'Disable account'}>{user.disabled ? 'Enable' : 'Disable'}</button>}</div> },
  ];
  if (selectedUserId) return <UserDetailsPage token={token} userId={selectedUserId} user={users.find((user) => user.id === selectedUserId)} currentUser={selectedUserId === me.id} onBack={onBackToUsers} />;
  return <>
    <section className="space-y-5"><div className="grid gap-4 sm:grid-cols-3"><Metric id="user-accounts" label="Total accounts" value={users.length} icon={Users} tone="violet" /><Metric label="Active accounts" value={activeUsers} icon={Check} tone="emerald" /><Metric id="account-status" label="Restricted" value={users.length - activeUsers} icon={ShieldCheck} tone="amber" /></div><section id="access-controls" className="overflow-hidden rounded-3xl border border-white/[0.09] bg-slate-900/50 shadow-2xl shadow-black/10 backdrop-blur"><div className="flex flex-col gap-4 border-b border-white/[0.08] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div><h2 className="text-lg font-bold text-white">All users</h2><p className="mt-1 text-sm text-slate-500">{normalizedQuery ? `${visibleUsers.length} result${visibleUsers.length === 1 ? '' : 's'} for “${searchQuery.trim()}”` : 'Manage platform accounts and access.'}</p></div><button className={secondary} onClick={() => void load()} disabled={loading}><RefreshCw className={loading ? 'animate-spin' : ''} size={16} />Refresh</button></div><CommonTable rows={visibleUsers} columns={columns} rowKey={(user) => user.id} loading={loading} pageSize={10} emptyMessage={normalizedQuery ? 'No matching users. Try another search.' : 'No user accounts found.'} /></section></section>
  </>;
}

type UserDetailResponse = {
  user: User;
  listening: {
    totalEvents: number;
    totalListenedSeconds: number;
    totalListenedMinutes: number;
    plays: number;
    completions: number;
    topSongs: Array<{ id: string; title: string; genre?: string; categories: string[]; listenedSeconds: number; plays: number; completions: number; lastPlayedAt?: string }>;
    topCategories: Array<{ name: string; listenedSeconds: number }>;
    weekdays: Array<{ name: string; events: number; listenedSeconds: number }>;
    recentActivity: Array<{ type: string; seconds: number; createdAt: string; song: string; genre: string | null }>;
  };
};

function UserDetailsPage({ token, userId, user, currentUser, onBack }: { token: string; userId: string; user?: User; currentUser: boolean; onBack: () => void }) {
  const [details, setDetails] = useState<UserDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    setLoading(true);
    api<UserDetailResponse>(token, `/admin/users/${userId}/details`).then((response) => {
      if (active) setDetails(response);
    }).catch((requestError) => {
      if (active) setError(messageOf(requestError));
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token, userId]);

  const profile = details?.user ?? user;
  if (!profile) return <section className="space-y-4"><button type="button" onClick={onBack} className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm font-semibold text-navy hover:bg-surface-soft"><ArrowLeft size={16} />Back to users</button><div className="rounded-2xl border border-border bg-white p-8 text-center text-sm text-muted">{loading ? <><LoaderCircle className="mr-2 inline animate-spin" size={16} />Loading user details…</> : `Could not load user details: ${error || 'NOT_FOUND'}`}</div></section>;
  const listening = details?.listening;
  const image = profile.image ? resolveImageUrl(profile.image) : currentUser ? readStoredImage('admin-profile-image') : '';
  const maxDaySeconds = Math.max(1, ...(listening?.weekdays.map((day) => day.listenedSeconds) ?? [1]));
  const formatListeningTime = (seconds: number) => seconds >= 3600 ? `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m` : `${Math.floor(seconds / 60)}m ${seconds % 60}s`;

  return <section className="space-y-4">
    <button type="button" onClick={onBack} className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm font-semibold text-navy hover:bg-surface-soft"><ArrowLeft size={16} />Back to users</button>
    <article className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-white p-4 sm:p-5"><Avatar name={profile.name} imageUrl={image} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-bold text-ink">{profile.name}</h2><StatusBadge active={!profile.disabled} /><span className="rounded-full border border-border bg-surface-soft px-2.5 py-1 text-xs font-semibold capitalize text-ink">{profile.role}</span><span className="rounded-md bg-band px-2 py-1 font-mono text-xs font-bold text-navy">{profile.publicId || user?.publicId || 'Assigning ID…'}</span></div><p className="mt-1 text-sm text-muted">{profile.email}</p><p className="mt-1 text-xs text-muted">Joined {formatDate(profile.createdAt)} · Account {profile.id}</p></div></article>
    {loading ? <div className="rounded-2xl border border-border bg-white p-8 text-center text-sm text-muted"><LoaderCircle className="mr-2 inline animate-spin" size={16} />Loading listening details…</div> : error ? <div className="rounded-2xl border border-rose-200 bg-white p-5 text-sm text-rose-700">Could not load user listening details: {error}</div> : <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><UserStat label="Listening time" value={formatListeningTime(listening?.totalListenedSeconds ?? 0)} /><UserStat label="Listening events" value={(listening?.totalEvents ?? 0).toLocaleString()} /><UserStat label="Plays" value={(listening?.plays ?? 0).toLocaleString()} /><UserStat label="Completed tracks" value={(listening?.completions ?? 0).toLocaleString()} /></div>
      <div className="grid gap-4 xl:grid-cols-2"><section className="rounded-2xl border border-border bg-white p-4 sm:p-5"><h3 className="font-bold text-ink">Listening by weekday</h3><p className="mt-1 text-xs text-muted">Total listening time grouped by day</p><div className="mt-5 space-y-3">{(listening?.weekdays ?? []).map((day) => <div key={day.name} className="grid grid-cols-[2.5rem_minmax(0,1fr)_4.5rem] items-center gap-2 text-xs"><span className="text-muted">{day.name.slice(0, 3)}</span><div className="h-2 overflow-hidden rounded-full bg-surface-soft"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(day.listenedSeconds ? 3 : 0, (day.listenedSeconds / maxDaySeconds) * 100)}%` }} /></div><span className="text-right font-medium text-ink">{formatListeningTime(day.listenedSeconds)}</span></div>)}</div></section>
        <section className="rounded-2xl border border-border bg-white p-4 sm:p-5"><h3 className="font-bold text-ink">Most-listened categories</h3><p className="mt-1 text-xs text-muted">Based on tracked listening seconds</p>{listening?.topCategories.length ? <div className="mt-4 space-y-3">{listening.topCategories.slice(0, 6).map((category, index) => <div key={category.name} className="flex items-center justify-between gap-3 border-b border-border pb-2 last:border-0"><span className="flex items-center gap-2 text-sm font-medium text-ink"><span className="grid h-6 w-6 place-items-center rounded-full bg-band text-xs font-bold text-navy">{index + 1}</span>{category.name}</span><span className="text-xs text-muted">{formatListeningTime(category.listenedSeconds)}</span></div>)}</div> : <p className="mt-5 text-sm text-muted">No category listening data yet.</p>}</section></div>
      <section className="overflow-hidden rounded-2xl border border-border bg-white"><div className="border-b border-border px-4 py-3"><h3 className="font-bold text-ink">Most-listened music</h3></div>{listening?.topSongs.length ? <div className="divide-y divide-border">{listening.topSongs.slice(0, 10).map((song) => <div key={song.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"><div className="min-w-0"><p className="truncate text-sm font-semibold text-ink">{song.title}</p><p className="mt-0.5 text-xs text-muted">{[song.genre, ...song.categories].filter(Boolean).join(' · ') || 'Uncategorized'} · {song.plays} plays</p></div><span className="text-sm font-semibold text-navy">{formatListeningTime(song.listenedSeconds)}</span></div>)}</div> : <p className="p-5 text-sm text-muted">No listening history recorded for this user.</p>}</section>
      <section className="overflow-hidden rounded-2xl border border-border bg-white"><div className="border-b border-border px-4 py-3"><h3 className="font-bold text-ink">Recent listening activity</h3></div>{listening?.recentActivity.length ? <div className="divide-y divide-border">{listening.recentActivity.slice(0, 10).map((event, index) => <div key={`${event.createdAt}-${index}`} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"><div><p className="text-sm font-semibold text-ink">{event.song}</p><p className="mt-0.5 text-xs capitalize text-muted">{event.type}{event.genre ? ` · ${event.genre}` : ''}</p></div><span className="text-xs text-muted">{formatDate(event.createdAt)} · {formatListeningTime(event.seconds)}</span></div>)}</div> : <p className="p-5 text-sm text-muted">No recent activity.</p>}</section>
    </>}
  </section>;
}

function UserStat({ label, value }: { label: string; value: string }) {
  return <article className="rounded-2xl border border-border bg-white p-4"><p className="text-xs font-medium text-muted">{label}</p><p className="mt-2 text-xl font-bold text-ink">{value}</p></article>;
}

type PlatformPolicyRecord = { _id: string; title: string; type: 'terms' | 'privacy' | 'content' | 'community' | 'other'; version: string; effectiveAt: string; content: string; active: boolean };

function NotificationsPanel({ token, notify }: { token: string; notify: (notice: Notice) => void }) {
  type AdminNotification = { id: string; title: string; body: string; createdAt: string; readAt?: string; user: { id: string; publicId?: string; name: string; email: string } };
  type NotificationPage = { data: AdminNotification[]; page: number; limit: number; total: number; unreadCount: number };
  const [notifications, setNotifications] = useState<NotificationPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    api<NotificationPage>(token, `/admin/notifications?page=${page}&limit=20`).then((result) => {
      if (active) setNotifications(result);
    }).catch((error) => notify({ tone: 'error', text: messageOf(error) })).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token, notify, page, reload]);
  const totalPages = Math.max(1, Math.ceil((notifications?.total ?? 0) / (notifications?.limit ?? 20)));
  return <section id="all-notifications" className="overflow-hidden rounded-2xl border border-border bg-white">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4 sm:p-5"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-band text-navy"><Bell size={18} /></span><div><h2 className="font-bold text-ink">All notifications</h2><p className="mt-1 text-sm text-muted">{(notifications?.total ?? 0).toLocaleString()} sent · {(notifications?.unreadCount ?? 0).toLocaleString()} unread across users</p></div></div><button type="button" className={secondary} onClick={() => setReload((current) => current + 1)} disabled={loading}>{loading ? <LoaderCircle className="animate-spin" size={15} /> : <RefreshCw size={15} />}Refresh</button></div>
    {loading && !notifications ? <p className="p-8 text-center text-sm text-muted"><LoaderCircle className="mr-2 inline animate-spin" size={16} />Loading notifications…</p> : notifications?.data.length ? <div className="divide-y divide-border">{notifications.data.map((item) => <article key={item.id} className="flex flex-wrap items-start justify-between gap-3 p-4 sm:px-5"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-ink">{item.title}</h3><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${item.readAt ? 'bg-surface-soft text-muted' : 'bg-amber-100 text-amber-800'}`}>{item.readAt ? 'Read' : 'Unread'}</span></div><p className="mt-1 whitespace-pre-wrap text-sm text-muted">{item.body}</p><p className="mt-2 text-xs text-muted">To: {item.user?.name || 'Unknown user'}{item.user?.email ? ` · ${item.user.email}` : ''}{item.user?.publicId ? ` · ${item.user.publicId}` : ''}</p></div><time className="shrink-0 text-xs text-muted">{formatDate(item.createdAt)}</time></article>)}</div> : <p className="p-8 text-center text-sm text-muted">No notifications have been sent yet.</p>}
    <footer className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted"><span>Page {page} / {totalPages}</span><div className="flex gap-2"><button type="button" className={secondary} disabled={page <= 1 || loading} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</button><button type="button" className={secondary} disabled={page >= totalPages || loading} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>Next</button></div></footer>
  </section>;
}

function PoliciesPanel({ token, notify }: { token: string; notify: (notice: Notice) => void }) {
  const [policies, setPolicies] = useState<PlatformPolicyRecord[]>([]);
  const [policyToDelete, setPolicyToDelete] = useState<PlatformPolicyRecord | null>(null);
  const [editing, setEditing] = useState<PlatformPolicyRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let live = true;
    void api<{ data: PlatformPolicyRecord[] }>(token, '/admin/policies').then((result) => { if (live) setPolicies(result.data); }).catch((error) => notify({ tone: 'error', text: messageOf(error) })).finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [token, notify, reload]);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true);
    const form = new FormData(event.currentTarget);
    const payload = { title: String(form.get('title')), type: String(form.get('type')), version: String(form.get('version')), effectiveAt: new Date(`${String(form.get('effectiveAt'))}T00:00:00.000Z`).toISOString(), content: String(form.get('content')), active: form.get('active') === 'on' };
    try {
      if (editing) await api(token, `/admin/policies/${editing._id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      else await api(token, '/admin/policies', { method: 'POST', body: JSON.stringify(payload) });
      setEditing(null); setReload((value) => value + 1); notify({ tone: 'success', text: 'Platform policy saved.' });
    } catch (error) { notify({ tone: 'error', text: messageOf(error) }); } finally { setSaving(false); }
  }
  async function remove(policy: PlatformPolicyRecord) {
    try { await api(token, `/admin/policies/${policy._id}`, { method: 'DELETE' }); setPolicyToDelete(null); setReload((value) => value + 1); notify({ tone: 'success', text: 'Policy deleted.' }); }
    catch (error) { notify({ tone: 'error', text: messageOf(error) }); }
  }
  return <section className="space-y-4">
    <section id="add-policy" className="rounded-2xl border border-border bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-center justify-between"><div><h2 className="font-bold text-ink">{editing ? 'Edit policy' : 'Add a policy'}</h2><p className="mt-1 text-xs text-muted">Create terms, privacy, content or community guidance.</p></div>{editing && <button className={secondary} type="button" onClick={() => setEditing(null)}>Cancel edit</button>}</div>
      <form key={editing?._id || 'new-policy'} className="space-y-3" onSubmit={(event) => void save(event)}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Field label="Policy title"><input className={inputClass} name="title" defaultValue={editing?.title} required placeholder="Terms of Service" /></Field><Field label="Type"><select className={inputClass} name="type" defaultValue={editing?.type || 'terms'}><option value="terms">Terms</option><option value="privacy">Privacy</option><option value="content">Content policy</option><option value="community">Community rules</option><option value="other">Other</option></select></Field><Field label="Version"><input className={inputClass} name="version" defaultValue={editing?.version || '1.0'} required placeholder="1.0" /></Field><Field label="Effective date"><input className={inputClass} type="date" name="effectiveAt" defaultValue={editing?.effectiveAt ? new Date(editing.effectiveAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)} required /></Field></div>
        <Field label="Policy text"><textarea className={`${inputClass} min-h-32 resize-y`} name="content" defaultValue={editing?.content} required maxLength={50000} placeholder="Write the policy text…" /></Field>
        <div className="flex flex-wrap items-center justify-between gap-3"><label className="inline-flex items-center gap-2 text-sm text-ink"><input type="checkbox" name="active" defaultChecked={editing?.active ?? true} className="accent-amber-600" />Active and visible to users</label><button className={primary} disabled={saving}>{saving && <LoaderCircle className="animate-spin" size={15} />}{editing ? 'Save changes' : 'Add policy'}</button></div>
      </form>
    </section>
    <section id="saved-policies" className="overflow-hidden rounded-2xl border border-border bg-white"><div className="border-b border-border px-4 py-3"><h2 className="font-bold text-ink">Saved policies</h2></div>{loading ? <LoadingRows /> : policies.length === 0 ? <Empty title="No policies yet" text="Add a policy above to get started." icon={ShieldCheck} /> : <div className="divide-y divide-border">{policies.map((policy) => <article key={policy._id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-ink">{policy.title}</h3><span className="rounded-full bg-band px-2 py-0.5 text-[10px] font-semibold uppercase text-navy">{policy.type}</span><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${policy.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>{policy.active ? 'Active' : 'Inactive'}</span></div><p className="mt-1 text-xs text-muted">Version {policy.version} · Effective {new Date(policy.effectiveAt).toLocaleDateString()}</p><p className="mt-2 whitespace-pre-wrap text-sm text-ink">{policy.content}</p></div><div className="flex shrink-0 gap-2"><button className={secondary} onClick={() => { setEditing(policy); document.getElementById('add-policy')?.scrollIntoView({ behavior: 'smooth' }); }}>Edit</button><button className={danger} onClick={() => setPolicyToDelete(policy)}>Delete</button></div></article>)}</div>}</section>
    {policyToDelete && <ConfirmDialog title={`Delete “${policyToDelete.title}”?`} message="This policy will be permanently removed." onCancel={() => setPolicyToDelete(null)} onConfirm={() => remove(policyToDelete)} />}
  </section>;
}

function MusicPanel({ token, notify, searchQuery, onSearch }: { token: string; notify: (notice: Notice) => void; searchQuery: string; onSearch: (query: string) => void }) {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<TagModel[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [songPage, setSongPage] = useState(1);
  const [songPages, setSongPages] = useState(1);
  const [songTotal, setSongTotal] = useState(0);
  const [songStateFilter, setSongStateFilter] = useState('');
  const [songQualityFilter, setSongQualityFilter] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);
  const songRequestSequence = useRef(0);
  const [loading, setLoading] = useState(true);
  const [licenseSong, setLicenseSong] = useState<Song | null>(null);
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [songToDelete, setSongToDelete] = useState<Song | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creatingSong, setCreatingSong] = useState(false);
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});
  const load = useCallback(async () => {
    const requestSequence = ++songRequestSequence.current;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(songPage), limit: '25' });
      if (debouncedQuery.trim()) params.set('q', debouncedQuery.trim());
      if (songStateFilter) params.set(songStateFilter === 'published' || songStateFilter === 'unpublished' ? 'published' : 'processing', songStateFilter === 'published' ? 'true' : songStateFilter === 'unpublished' ? 'false' : songStateFilter);
      if (songQualityFilter) params.set('quality', songQualityFilter);
      const songResult = await api<{ data: Song[]; pages: number; total: number }>(token, `/admin/songs?${params.toString()}`);
      if (requestSequence !== songRequestSequence.current) return;
      setSongs(songResult.data); setSongPages(Math.max(1, songResult.pages)); setSongTotal(songResult.total);
    } catch (error) { if (requestSequence === songRequestSequence.current) notify({ tone: 'error', text: messageOf(error) }); } finally { if (requestSequence === songRequestSequence.current) setLoading(false); }
  }, [token, notify, songPage, songStateFilter, songQualityFilter, debouncedQuery]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    const timer = window.setTimeout(() => { setDebouncedQuery(searchQuery); setSongPage(1); }, 250);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);
  useEffect(() => { setSongPage(1); }, [songStateFilter, songQualityFilter]);
  useEffect(() => {
    Promise.all([api<{ data: Artist[] }>(token, '/admin/artists?limit=100'), api<{ data: Category[] }>(token, '/admin/categories?limit=100'), api<{ data: TagModel[] }>(token, '/admin/tags?limit=100')])
      .then(([artistResult, categoryResult, tagResult]) => { setArtists(artistResult.data); setCategories(categoryResult.data); setTags(tagResult.data); })
      .catch((error) => notify({ tone: 'error', text: messageOf(error) }));
  }, [token, notify]);
  async function createSong(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const title = String(data.get('title') || '').trim();
    const artist = String(data.get('artist') || '').trim();
    const language = String(data.get('language') || '').trim();
    const genre = String(data.get('genre') || '').trim();
    const yearText = String(data.get('year') || '').trim();
    const durationText = String(data.get('duration') || '').trim();
    const audioFile = data.get('audioFile');
    const coverFile = data.get('coverFile');
    const errors: Record<string, string> = {};
    if (!title) errors.title = 'Enter a song title.';
    else if (title.length > 200) errors.title = 'Title must be 200 characters or fewer.';
    if (!artist) errors.artist = 'Select an artist.';
    if (language.length < 2) errors.language = 'Enter a language (at least 2 characters).';
    else if (language.length > 50) errors.language = 'Language must be 50 characters or fewer.';
    if (genre.length > 100) errors.genre = 'Genre must be 100 characters or fewer.';
    if (yearText && (!Number.isInteger(Number(yearText)) || Number(yearText) < 1900 || Number(yearText) > 2100)) errors.year = 'Enter a whole year between 1900 and 2100.';
    if (durationText && (!Number.isInteger(Number(durationText)) || Number(durationText) < 0 || Number(durationText) > 86400)) errors.duration = 'Duration must be a whole number from 0 to 86400 seconds.';
    if (!(audioFile instanceof File) || !audioFile.name.toLowerCase().endsWith('.mp3') || (audioFile.type && audioFile.type !== 'audio/mpeg')) {
      errors.audioFile = 'Choose a valid MP3 audio file.';
    }
    if (!(coverFile instanceof File) || !['image/jpeg', 'image/png', 'image/webp'].includes(coverFile.type)) {
      errors.coverFile = 'Choose a JPG, PNG, or WebP cover image.';
    } else if (coverFile.size > 10 * 1024 * 1024) {
      errors.coverFile = 'Cover image must be 10 MB or smaller.';
    }
    setCreateErrors(errors);
    if (Object.keys(errors).length) return;

    const payload = {
      title,
      artist,
      language,
      lyrics: String(data.get('lyrics') || '').trim() || undefined,
      duration: durationText ? Number(durationText) : undefined,
      genre: genre || undefined,
      year: yearText ? Number(yearText) : undefined,
      trackNumber: Number(data.get('trackNumber')) || undefined,
      discNumber: Number(data.get('discNumber')) || undefined,
      format: String(data.get('format') || '').trim() || undefined,
      bitrate: Number(data.get('bitrate')) || undefined,
      isFavorite: false,
      playCount: 0,
      dateAdded: Date.now(),
      categories: selectedValues(form, 'categories'),
      tags: selectedValues(form, 'tags'),
    };
    setCreatingSong(true);
    try {
      const created = await api<Song>(token, '/admin/songs', { method: 'POST', body: JSON.stringify(payload) });
      try {
        await upload(token, created.mongoId ?? created.id, 'cover', coverFile as File);
        await upload(token, created.mongoId ?? created.id, 'audio', audioFile as File);
      } catch (error) {
        await load();
        setShowCreateForm(false);
        notify({ tone: 'error', text: `Song created, but a file upload failed: ${messageOf(error)}. Retry it from the song row.` });
        return;
      }
      form.reset();
      setCreateErrors({});
      setShowCreateForm(false);
      await load();
      notify({ tone: 'success', text: 'Song created and MP3 uploaded for processing.' });
    } catch (error) {
      notify({ tone: 'error', text: messageOf(error) });
    } finally {
      setCreatingSong(false);
    }
  }
  async function publish(song: Song) {
    try { await api(token, `/admin/songs/${song.mongoId ?? song.id}/publish`, { method: 'POST', body: JSON.stringify({ published: !song.published }) }); await load(); notify({ tone: 'success', text: `${song.title} is now ${song.published ? 'unpublished' : 'published'}.` }); }
    catch (error) { notify({ tone: 'error', text: messageOf(error) }); }
  }
  async function removeSong(song: Song) {
    try {
      await api(token, `/admin/songs/${song.mongoId ?? song.id}`, { method: 'DELETE' });
      setSongToDelete(null);
      await load();
      notify({ tone: 'success', text: `${song.title} was deleted.` });
    } catch (error) {
      notify({ tone: 'error', text: messageOf(error) });
    }
  }
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const visibleSongs = songs;
  const artistNames = new Map(artists.map((artist) => [artist.mongoId ?? artist._id ?? artist.id, artist.name]));
  const categoryNames = new Map(categories.map((category) => [category.mongoId ?? category._id ?? category.id, category.name]));
  const tagNames = new Map(tags.map((tag) => [tag.mongoId ?? tag._id ?? tag.id, tag.name]));
  return (
    <section id="music-processing" className="space-y-5">
      {showCreateForm ? (
        <section id="create-song" className="rounded-3xl border border-white/[0.09] bg-slate-900/50 p-5 shadow-2xl shadow-black/10 backdrop-blur sm:p-6">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2 className="font-bold text-white">Create a song</h2>
              <p className="mt-1 text-sm text-slate-500">Add track details, cover image, and its MP3 file.</p>
            </div>
            <button type="button" className={secondary} onClick={() => { setShowCreateForm(false); setCreateErrors({}); }}>Cancel</button>
          </div>
          <form className="space-y-5" onSubmit={(event) => void createSong(event)} noValidate>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Song title">
                <input className={`${inputClass} ${createErrors.title ? 'border-rose-400' : ''}`} name="title" aria-invalid={Boolean(createErrors.title)} onChange={() => setCreateErrors((current) => ({ ...current, title: '' }))} placeholder="Song name" />
                <FieldError>{createErrors.title}</FieldError>
              </Field>
              <Field label="Language">
                <input className={`${inputClass} ${createErrors.language ? 'border-rose-400' : ''}`} name="language" defaultValue="en" aria-invalid={Boolean(createErrors.language)} onChange={() => setCreateErrors((current) => ({ ...current, language: '' }))} placeholder="e.g. English" />
                <FieldError>{createErrors.language}</FieldError>
              </Field>
              <Field label="Artist">
                <select className={`${inputClass} ${createErrors.artist ? 'border-rose-400' : ''}`} name="artist" defaultValue="" aria-invalid={Boolean(createErrors.artist)} onChange={() => setCreateErrors((current) => ({ ...current, artist: '' }))}>
                  <option value="">Select artist</option>{artists.map((artist) => <option value={artist.mongoId ?? artist.id} key={artist.id}>{artist.name}</option>)}
                </select>
                <FieldError>{createErrors.artist || (!artists.length ? 'Add an artist in Catalog before creating a song.' : '')}</FieldError>
              </Field>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Genre"><input className={`${inputClass} ${createErrors.genre ? 'border-rose-400' : ''}`} name="genre" aria-invalid={Boolean(createErrors.genre)} onChange={() => setCreateErrors((current) => ({ ...current, genre: '' }))} placeholder="Genre (optional)" /><FieldError>{createErrors.genre}</FieldError></Field>
              <Field label="Year"><input className={`${inputClass} ${createErrors.year ? 'border-rose-400' : ''}`} type="number" name="year" min={1900} max={2100} aria-invalid={Boolean(createErrors.year)} onChange={() => setCreateErrors((current) => ({ ...current, year: '' }))} placeholder="Year (optional)" /><FieldError>{createErrors.year}</FieldError></Field>
            </div>
            <Field label="MP3 audio file">
              <input className={`${inputClass} ${createErrors.audioFile ? 'border-rose-400' : ''}`} type="file" name="audioFile" accept="audio/mpeg,.mp3" aria-invalid={Boolean(createErrors.audioFile)} onChange={() => setCreateErrors((current) => ({ ...current, audioFile: '' }))} />
              <FieldError>{createErrors.audioFile}</FieldError>
            </Field>
            <Field label="Cover image">
              <input className={`${inputClass} ${createErrors.coverFile ? 'border-rose-400' : ''}`} type="file" name="coverFile" accept="image/jpeg,image/png,image/webp" aria-invalid={Boolean(createErrors.coverFile)} onChange={() => setCreateErrors((current) => ({ ...current, coverFile: '' }))} />
              <Hint>JPG, PNG, or WebP. Maximum size: 10 MB.</Hint>
              <FieldError>{createErrors.coverFile}</FieldError>
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Duration (seconds, optional)"><input className={`${inputClass} ${createErrors.duration ? 'border-rose-400' : ''}`} type="number" name="duration" min={0} max={86400} aria-invalid={Boolean(createErrors.duration)} onChange={() => setCreateErrors((current) => ({ ...current, duration: '' }))} placeholder="e.g. 210" /><FieldError>{createErrors.duration}</FieldError></Field>
              <Field label="Format"><input className={inputClass} name="format" value="mp3" readOnly /></Field>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Categories (optional)"><CustomMultiSelect name="categories" placeholder="Select categories" helper="Choose from your saved categories." items={categories.map((category) => ({ value: category.mongoId ?? category.id, label: category.name }))} /></Field>
              <Field label="Tags (optional)"><CustomMultiSelect name="tags" placeholder="Select tags" helper="Choose from your saved tags." items={tags.map((tag) => ({ value: tag.mongoId ?? tag.id, label: tag.name }))} /></Field>
            </div>
            <button className={primary} disabled={creatingSong || !artists.length}>
              {creatingSong ? <LoaderCircle className="animate-spin" size={16} /> : <UploadCloud size={16} />}
              {creatingSong ? 'Creating and uploading…' : 'Create song and upload MP3'}
            </button>
          </form>
        </section>
      ) : (
        <section className="overflow-hidden rounded-3xl border border-white/[0.09] bg-slate-900/50 shadow-2xl shadow-black/10 backdrop-blur">
          <div className="flex flex-col gap-4 border-b border-white/[0.08] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="text-lg font-bold text-white">Music processing</h2>
              <p className="mt-1 text-sm text-slate-500">{songTotal.toLocaleString()} songs · page {songPage} of {songPages}</p>
            </div>
            <div id="create-song" className="flex items-center gap-2">
              <button type="button" className={secondary} disabled={loading} onClick={() => void load()}><RefreshCw className={loading ? 'animate-spin' : ''} size={16} />Refresh</button>
              <button type="button" className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-navy-dark hover:bg-gold-dark" aria-label="Add song" title="Add song" onClick={() => setShowCreateForm(true)}><Plus size={20} /></button>
            </div>
          </div>
          <div id="audio-processing" className="flex flex-wrap items-center gap-2 border-b border-border bg-surface-soft px-4 py-2.5 sm:px-5">
            <label className="relative min-w-48 flex-1 sm:max-w-xs"><span className="sr-only">Search songs</span><Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" size={15} /><input className="w-full rounded-lg border border-border bg-white py-2 pl-8 pr-8 text-xs text-ink outline-none placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/15" value={searchQuery} onChange={(event) => onSearch(event.target.value)} placeholder="Search songs…" />{searchQuery && <button type="button" className="absolute right-1 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded text-muted hover:bg-surface-soft" aria-label="Clear song search" onClick={() => onSearch('')}><X size={14} /></button>}</label>
            <FilterDropdown label="Filter by status" value={songStateFilter} onChange={setSongStateFilter} options={[{ value: '', label: 'All statuses' }, { value: 'pending', label: 'Pending' }, { value: 'processing', label: 'Processing' }, { value: 'ready', label: 'Ready' }, { value: 'failed', label: 'Failed' }, { value: 'published', label: 'Published' }, { value: 'unpublished', label: 'Unpublished' }]} />
            <FilterDropdown label="Filter by audio quality" value={songQualityFilter} onChange={setSongQualityFilter} options={[{ value: '', label: 'All qualities' }, { value: '64', label: '64 kbps' }, { value: '128', label: '128 kbps' }, { value: '192', label: '192 kbps' }]} />
            {(songStateFilter || songQualityFilter) && <button className="px-2 py-1.5 text-xs font-semibold text-navy hover:underline" onClick={() => { setSongStateFilter(''); setSongQualityFilter(''); setSongPage(1); }}>Clear filters</button>}
            <span className="ml-auto text-xs text-muted">{loading ? 'Updating…' : `Showing ${songTotal ? (songPage - 1) * 25 + 1 : 0}–${Math.min(songPage * 25, songTotal)} of ${songTotal.toLocaleString()}`}</span>
          </div>
          {loading ? <LoadingRows /> : visibleSongs.length === 0 ? <div id="rights-and-publishing"><Empty title={normalizedQuery ? 'No matching songs' : 'Your library is empty'} text={normalizedQuery ? 'No songs match these search and filter settings.' : 'Use the + button to create a song.'} icon={Music2} /></div> : <div id="rights-and-publishing" className="divide-y divide-white/[0.07]">{visibleSongs.map((song) => <SongRow key={song.id} token={token} song={song} artistName={artistNames.get(song.artist) || 'Unknown artist'} categoryNames={(song.categories || []).map((value) => categoryNames.get(value) || value)} tagNames={(song.tags || []).map((value) => tagNames.get(value) || value)} onEdit={setEditingSong} onLicense={setLicenseSong} onPublish={publish} onDelete={setSongToDelete} />)}</div>}
          <div className="flex items-center justify-between border-t border-white/[0.08] px-4 py-2.5 sm:px-5"><span className="text-xs text-slate-500">Page {songPage} / {songPages}</span><div className="flex gap-2"><button className={secondary} disabled={loading || songPage <= 1} onClick={() => setSongPage((current) => Math.max(1, current - 1))}>Previous</button><button className={secondary} disabled={loading || songPage >= songPages} onClick={() => setSongPage((current) => Math.min(songPages, current + 1))}>Next</button></div></div>
        </section>
      )}
      {licenseSong && <LicenseDialog token={token} song={licenseSong} onClose={() => setLicenseSong(null)} onSaved={async () => { setLicenseSong(null); await load(); notify({ tone: 'success', text: 'Music rights and availability have been saved.' }); }} onError={(text) => notify({ tone: 'error', text })} />}
      {editingSong && <SongEditDialog token={token} song={editingSong} artists={artists} categories={categories} tags={tags} onClose={() => setEditingSong(null)} onSaved={async () => { setEditingSong(null); await load(); notify({ tone: 'success', text: 'Song details and selected files were updated.' }); }} onError={(text) => notify({ tone: 'error', text })} />}
      {songToDelete && <ConfirmDialog title={`Delete “${songToDelete.title}”?`} message="This song and its catalog record will be permanently removed." onCancel={() => setSongToDelete(null)} onConfirm={() => removeSong(songToDelete)} />}
    </section>
  );
}

function ImportPanel({ token, notify }: { token: string; notify: (notice: Notice) => void }) {
  const [providers, setProviders] = useState<{ name: string; baseUrl: string | null; allowAudio: boolean; allowImages: boolean; permittedFields: string[] }[]>([]);
  const [provider, setProvider] = useState('configured');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);

  const loadProviders = useCallback(async () => {
    try {
      const response = await api<{ data: { name: string; baseUrl: string | null; allowAudio: boolean; allowImages: boolean; permittedFields: string[] }[] }>(token, '/admin/import/providers');
      setProviders(response.data);
      if (response.data[0]) setProvider(response.data[0].name);
    } catch (error) {
      notify({ tone: 'error', text: messageOf(error) });
    }
  }, [token, notify]);

  useEffect(() => { void loadProviders(); }, [loadProviders]);

  async function search() {
    if (!query.trim()) {
      notify({ tone: 'info', text: 'Enter a title, artist, or album to search for music.' });
      return;
    }
    setLoading(true);
    try {
      const response = await api<{ data: any[] }>(token, `/admin/import/search?q=${encodeURIComponent(query)}&provider=${encodeURIComponent(provider)}`);
      setResults(response.data);
      if (response.data.length === 0) notify({ tone: 'info', text: 'No provider matches were found.' });
    } catch (error) {
      notify({ tone: 'error', text: messageOf(error) });
    } finally {
      setLoading(false);
    }
  }

  async function importSong(record: any) {
    setImportingId(record.externalSongId);
    try {
      await api(token, '/admin/import', { method: 'POST', body: JSON.stringify(record) });
      setResults((current) => current.filter((item) => item.externalSongId !== record.externalSongId));
      notify({ tone: 'success', text: `${record.title || 'Track'} was imported as a draft for review.` });
    } catch (error) {
      notify({ tone: 'error', text: messageOf(error) });
    } finally {
      setImportingId(null);
    }
  }

  return (
    <section className="space-y-5">
      <div id="provider-search" className="rounded-3xl border border-white/[0.09] bg-slate-900/50 p-5 shadow-2xl shadow-black/10 backdrop-blur sm:p-6">
        <div className="mb-6 flex items-start gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-400/15 text-violet-300"><UploadCloud size={20} /></span>
          <div>
            <h2 className="font-bold text-white">Search provider catalog</h2>
            <p className="mt-1 text-sm text-slate-500">Search a configured third-party API, review its metadata, and import it as a draft before publishing.</p>
          </div>
        </div>

        {providers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/30 p-5 text-sm text-slate-400">
            No provider is configured. Set MUSIC_IMPORT_PROVIDER_BASE_URL and the provider token in the backend environment to enable this module.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-[1fr_220px_auto]">
            <Field label="Provider">
              <select className={inputClass} value={provider} onChange={(event) => setProvider(event.target.value)}>
                <option value="configured">configured</option>
                {providers.map((entry) => <option value={entry.name} key={entry.name}>{entry.name}</option>)}
              </select>
            </Field>
            <Field label="Search">
              <input
                className={inputClass}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search title, artist, or album"
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    void search();
                  }
                }}
              />
            </Field>
            <button className={`${primary} self-end`} onClick={() => void search()} disabled={loading}>
              {loading ? <LoaderCircle className="animate-spin" size={16} /> : <Search size={16} />}
              Search
            </button>
          </div>
        )}

        {results.length > 0 && (
          <div id="metadata-review" className="mt-6 space-y-3">
            {results.map((item) => (
              <article key={`${item.provider}-${item.externalSongId}`} className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                  <div className="flex min-w-0 flex-1 gap-4">
                    {item.artwork || item.coverUrl ? (
                      <img
                        src={item.artwork || item.coverUrl}
                        alt={item.title || 'Album cover'}
                        className="h-20 w-20 rounded-xl object-cover ring-1 ring-white/10"
                        onError={(event) => { event.currentTarget.hidden = true; }}
                      />
                    ) : (
                      <span className="grid h-20 w-20 shrink-0 place-items-center rounded-xl bg-white/[0.06] text-slate-500"><Music2 size={22} /></span>
                    )}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-lg font-bold text-white">{item.title || 'Untitled track'}</h3>
                        {item.sourceLicense && <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-200">License approved</span>}
                      </div>
                      <p className="mt-1 text-sm text-slate-400">{item.artist || 'Unknown artist'} · {item.album || 'Unknown album'}</p>
                      <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-400">
                        <span className="rounded-full bg-white/[0.04] px-2 py-1">{item.genre || item.category || 'Unspecified genre'}</span>
                        {item.year && <span className="rounded-full bg-white/[0.04] px-2 py-1">{item.year}</span>}
                        {item.duration && <span className="rounded-full bg-white/[0.04] px-2 py-1">{Math.round(item.duration / 60)} min</span>}
                      </div>
                      {item.lyrics && <p className="mt-3 max-w-xl text-xs leading-5 text-slate-500 line-clamp-3">{item.lyrics}</p>}
                    </div>
                  </div>

                  <div className="flex min-w-0 flex-col gap-2 lg:w-48 lg:items-end">
                    <div className="w-full rounded-xl border border-white/10 bg-white/[0.02] p-2 text-xs text-slate-400">
                      <div className="font-semibold text-slate-300">Source</div>
                      <div className="mt-1 truncate">{item.provider} / {item.externalSongId}</div>
                      <div className="mt-1 text-[11px]">{item.sourceLicense || 'Provider terms not provided'}</div>
                    </div>
                    <button className={primary} disabled={importingId === item.externalSongId} onClick={() => void importSong(item)}>
                      {importingId === item.externalSongId ? <LoaderCircle className="animate-spin" size={15} /> : <Plus size={15} />}
                      Import draft
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function SongEditDialog({ token, song, artists, categories, tags, onClose, onSaved, onError }: { token: string; song: Song; artists: Artist[]; categories: Category[]; tags: TagModel[]; onClose: () => void; onSaved: () => Promise<void>; onError: (message: string) => void }) {
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true);
    const form = new FormData(event.currentTarget);
    const selectedCategories = selectedValues(event.currentTarget, 'categories');
    const selectedTags = selectedValues(event.currentTarget, 'tags');
    const audioFile = form.get('audioFile');
    const coverFile = form.get('coverFile');
    const duration = String(form.get('duration') || '').trim();
    const year = String(form.get('year') || '').trim();
    const songId = song.mongoId ?? song.id;
    try {
      await api(token, `/admin/songs/${songId}`, { method: 'PATCH', body: JSON.stringify({
        title: String(form.get('title')).trim(), artist: String(form.get('artist')),
        language: String(form.get('language')).trim(), genre: String(form.get('genre')).trim() || undefined,
        year: year ? Number(year) : undefined, duration: duration ? Number(duration) : undefined,
        lyrics: String(form.get('lyrics')).trim() || undefined,
        format: String(form.get('format')).trim() || undefined,
        trackNumber: form.get('trackNumber') ? Number(form.get('trackNumber')) : undefined,
        discNumber: form.get('discNumber') ? Number(form.get('discNumber')) : undefined,
        bitrate: form.get('bitrate') ? Number(form.get('bitrate')) : undefined,
        categories: selectedCategories, tags: selectedTags,
      }) });
      if (audioFile instanceof File && audioFile.size) await upload(token, songId, 'audio', audioFile);
      if (coverFile instanceof File && coverFile.size) await upload(token, songId, 'cover', coverFile);
      await onSaved();
    } catch (error) { onError(messageOf(error)); }
    finally { setBusy(false); }
  }
  return <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="edit-song-title"><form key={song.mongoId ?? song.id} className="my-auto w-full max-w-3xl space-y-4 rounded-2xl border border-border bg-white p-5 shadow-2xl" onSubmit={(event) => void submit(event)}><div className="flex items-start justify-between"><div><h2 id="edit-song-title" className="text-lg font-bold text-ink">Edit song</h2><p className="mt-1 text-xs text-muted">Song data is prefilled from the saved record. Change any fields and save.</p></div><button type="button" className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-surface-soft" onClick={onClose} aria-label="Close"><X size={18} /></button></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><Field label="Title"><input className={inputClass} name="title" defaultValue={song.title} required maxLength={200} /></Field><Field label="Artist"><select className={inputClass} name="artist" defaultValue={song.artist} required>{artists.map((artist) => <option key={artist.mongoId ?? artist.id} value={artist.mongoId ?? artist.id}>{artist.name}</option>)}</select></Field><Field label="Language"><input className={inputClass} name="language" defaultValue={song.language} required minLength={2} maxLength={50} /></Field><Field label="Genre"><input className={inputClass} name="genre" defaultValue={song.genre || ''} maxLength={100} /></Field><Field label="Year"><input className={inputClass} name="year" type="number" min={1900} max={2100} defaultValue={song.year ?? ''} /></Field><Field label="Duration (seconds)"><input className={inputClass} name="duration" type="number" min={0} max={86400} defaultValue={song.duration ?? ''} /></Field><Field label="Format"><input className={inputClass} name="format" defaultValue={song.format || ''} maxLength={20} /></Field><Field label="Source bitrate (kbps)"><input className={inputClass} name="bitrate" type="number" min={1} max={2000} defaultValue={song.bitrate ?? ''} /></Field><Field label="Track number"><input className={inputClass} name="trackNumber" type="number" min={1} max={500} defaultValue={song.trackNumber ?? ''} /></Field><Field label="Disc number"><input className={inputClass} name="discNumber" type="number" min={1} max={20} defaultValue={song.discNumber ?? ''} /></Field></div><div className="grid gap-3 sm:grid-cols-2"><Field label="Categories"><CustomMultiSelect key={`edit-categories-${song.mongoId ?? song.id}`} name="categories" items={categories.map((item) => ({ value: item.mongoId ?? item.id, label: item.name }))} selectedValues={song.categories || []} placeholder="Select categories" helper="Saved categories are preselected." /></Field><Field label="Tags"><CustomMultiSelect key={`edit-tags-${song.mongoId ?? song.id}`} name="tags" items={tags.map((item) => ({ value: item.mongoId ?? item.id, label: item.name }))} selectedValues={song.tags || []} placeholder="Select tags" helper="Saved tags are preselected." /></Field></div><Field label="Lyrics"><textarea className={`${inputClass} min-h-24`} name="lyrics" defaultValue={song.lyrics || ''} maxLength={50000} /></Field><div className="grid gap-3 sm:grid-cols-2"><Field label="Replace MP3"><input className={inputClass} type="file" name="audioFile" accept="audio/mpeg,.mp3" /><Hint>Current qualities: {song.audio?.map((item) => `${item.quality} kbps`).join(', ') || 'Not processed'} · Replacing the MP3 regenerates all supported qualities.</Hint></Field><Field label="Replace cover">{song.coverUrl && <img src={song.coverUrl} alt={`${song.title} current cover`} className="mt-2 mb-2 h-14 w-14 rounded-lg object-cover" />}<input className={inputClass} type="file" name="coverFile" accept="image/jpeg,image/png,image/webp" /></Field></div><div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3"><p className="text-xs text-muted">Status: {song.processing} · {song.published ? 'Published' : 'Unpublished'} · Added {song.dateAdded ? new Date(song.dateAdded).toLocaleString() : '—'}</p><div className="flex gap-2"><button type="button" className={secondary} onClick={onClose}>Cancel</button><button className={primary} disabled={busy}>{busy && <LoaderCircle className="animate-spin" size={15} />}Save song</button></div></div></form></div>;
}

function SongRow({ token, song, artistName, categoryNames, tagNames, onEdit, onLicense, onPublish, onDelete }: { token: string; song: Song; artistName: string; categoryNames: string[]; tagNames: string[]; onEdit: (song: Song) => void; onLicense: (song: Song) => void; onPublish: (song: Song) => Promise<void>; onDelete: (song: Song) => void | Promise<void> }) {
  const [coverUnavailable, setCoverUnavailable] = useState(false); const [busy, setBusy] = useState<'publish' | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const previewAudioRef = useRef<HTMLAudioElement>(null);
  useEffect(() => () => { if (previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl); }, [previewUrl]);
  async function loadPreview() {
    if (previewUrl || previewLoading) return;
    setPreviewLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/admin/songs/${song.mongoId ?? song.id}/preview`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error('Preview unavailable');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      if (previewAudioRef.current) {
        previewAudioRef.current.src = url;
        await previewAudioRef.current.play();
      }
    } catch { /* Leave the compact preview control disabled when loading fails. */ }
    finally { setPreviewLoading(false); }
  }
  async function publish() { setBusy('publish'); try { await onPublish(song); } finally { setBusy(null); } }
  const qualities = song.audio?.map((item) => item.quality).join(' · ');
  const audioStatus = qualities || (song.processing === 'pending' ? 'MP3 is waiting for upload' : song.processing === 'processing' ? 'MP3 is being processed' : 'MP3 processing failed');
  const duration = song.duration ? `${Math.floor(song.duration / 60)}:${String(song.duration % 60).padStart(2, '0')}` : null;
  return <article className="px-3 py-2 sm:px-4"><div className="grid grid-cols-[2.75rem_minmax(0,1fr)] gap-x-3 gap-y-1 sm:grid-cols-[3rem_minmax(0,1fr)_auto] sm:items-center"><div className="row-span-2 sm:row-span-1"><div className="group relative h-11 w-11 overflow-hidden rounded-xl sm:h-12 sm:w-12">{song.coverUrl && !coverUnavailable ? <img src={song.coverUrl} alt={`${song.title} cover`} className="h-full w-full object-cover" onError={() => setCoverUnavailable(true)} /> : <span className="grid h-full w-full place-items-center bg-gradient-to-br from-violet-100 to-cyan-50 text-violet-700"><Music2 size={20} /></span>}<button type="button" className="absolute inset-0 grid place-items-center bg-slate-950/55 text-white opacity-100 backdrop-blur-[1px] transition hover:bg-slate-950/65 focus:opacity-100 sm:opacity-0 sm:group-hover:opacity-100" aria-label={isPlaying ? `Pause ${song.title}` : `Play ${song.title}`} title={isPlaying ? 'Pause' : 'Play'} disabled={song.processing !== 'ready' || previewLoading} onClick={() => { if (previewUrl && previewAudioRef.current) { if (previewAudioRef.current.paused) void previewAudioRef.current.play(); else previewAudioRef.current.pause(); } else void loadPreview(); }}><span className="grid h-8 w-8 place-items-center rounded-full bg-white text-navy shadow-lg ring-2 ring-white/70">{previewLoading ? <LoaderCircle className="animate-spin" size={17} /> : isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}</span></button></div></div><div className="min-w-0"><div className="flex flex-wrap items-baseline gap-x-2"><h3 className="break-words text-sm font-bold text-ink">{song.title}</h3><span className="truncate text-xs text-muted">{artistName}</span></div><p className="truncate text-[11px] text-muted">{[song.language, song.genre, song.year, duration].filter(Boolean).join(' · ')}{qualities ? ` · ${qualities} kbps` : ''}</p><audio ref={previewAudioRef} className="hidden" preload="none" onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onEnded={() => setIsPlaying(false)} /><div className="mt-1 flex flex-wrap gap-1">{[song.processing, ...(song.published ? ['Published'] : []), ...categoryNames, ...tagNames.map((name) => `#${name}`)].map((label, index) => <span key={`${label}-${index}`} className="rounded-full border border-border bg-white/65 px-1.5 py-0.5 text-[10px] font-medium text-ink">{label}</span>)}</div></div><div className="col-span-2 flex flex-wrap items-center gap-1 sm:col-span-1 sm:row-span-1 sm:justify-end"><button type="button" className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-white text-navy hover:bg-navy-soft" aria-label={`Edit ${song.title}`} title="Edit song" onClick={() => onEdit(song)}><Pencil size={16} /></button><button type="button" className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-white text-navy hover:bg-navy-soft" aria-label={`Set rights for ${song.title}`} title="Rights" onClick={() => onLicense(song)}><ShieldCheck size={16} /></button>{song.processing === 'ready' && <button type="button" className={`grid h-9 w-9 place-items-center rounded-lg ${song.published ? 'bg-rose-100 text-rose-700 hover:bg-rose-200' : 'bg-amber-100 text-amber-800 hover:bg-amber-200'}`} aria-label={song.published ? `Unpublish ${song.title}` : `Publish ${song.title}`} title={song.published ? 'Unpublish' : 'Publish'} disabled={busy === 'publish'} onClick={() => void publish()}>{busy === 'publish' ? <LoaderCircle className="animate-spin" size={16} /> : song.published ? <EyeOff size={16} /> : <Eye size={16} />}</button>}<button type="button" className="grid h-9 w-9 place-items-center rounded-lg bg-rose-100 text-rose-700 hover:bg-rose-200" aria-label={`Delete ${song.title}`} title="Delete" onClick={() => void onDelete(song)}><Trash2 size={16} /></button></div></div></article>;
}

function LicenseDialog({ token, song, onClose, onSaved, onError }: { token: string; song: Song; onClose: () => void; onSaved: () => Promise<void>; onError: (message: string) => void }) {
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true);
    const form = new FormData(event.currentTarget);
    try { const endsAt = new Date(`${String(form.get('endsAt'))}T23:59:59.999Z`); const songId = song.mongoId ?? song.id; await api(token, `/admin/licenses/${songId}`, { method: 'PUT', body: JSON.stringify({ song: songId, holder: form.get('holder'), startsAt: new Date().toISOString(), endsAt: endsAt.toISOString(), streaming: true, offline: true, territories: [], enabled: true }) }); await onSaved(); }
    catch (error) { onError(messageOf(error)); } finally { setBusy(false); }
  }
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="license-title">
      <form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl shadow-black/50">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-400/15" style={{ color: '#c4b5fd' }}><ShieldCheck size={20} /></span>
          <div className="flex-1">
            <h2 id="license-title" className="font-bold" style={{ color: '#f8fafc' }}>Set music rights</h2>
            <p className="mt-1 text-sm leading-5" style={{ color: '#cbd5e1' }}>{song.title} will be eligible for streaming and offline playback until this license expires.</p>
          </div>
          <button className="rounded-lg p-1 hover:bg-white/10" style={{ color: '#cbd5e1' }} type="button" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <div className="mt-6 space-y-4">
          <label className="block text-sm font-semibold" style={{ color: '#e2e8f0' }}>Rights holder
            <input className={inputClass} name="holder" placeholder="Label or rights owner" required />
          </label>
          <label className="block text-sm font-semibold" style={{ color: '#e2e8f0' }}>License expiry
            <input className={inputClass} name="endsAt" type="date" min={new Date().toISOString().slice(0, 10)} defaultValue={new Date(Date.now() + 31536000000).toISOString().slice(0, 10)} required />
          </label>
        </div>
        <div className="mt-7 flex justify-end gap-3"><button className={secondary} type="button" onClick={onClose}>Cancel</button><button className={primary} disabled={busy}>{busy && <LoaderCircle className="animate-spin" size={16} />}Save rights</button></div>
      </form>
    </div>
  );
}

type CatalogRecord = Artist | Category | TagModel;

function CatalogWorkspace({ token, notify, searchQuery, section, onCountChange }: { token: string; notify: (notice: Notice) => void; searchQuery: string; section: CatalogSection; onCountChange: (section: CatalogSection, total: number) => void }) {
  const [records, setRecords] = useState<CatalogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<CatalogRecord | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<CatalogRecord | null>(null);
  const [reload, setReload] = useState(0);
  const config = {
    artists: { title: 'Artists', singular: 'Artist', icon: Disc3, description: 'Create and manage artists in your music catalog.' },
    categories: { title: 'Categories', singular: 'Category', icon: FolderTree, description: 'Organize music into genres and devotional groups.' },
    tags: { title: 'Tags', singular: 'Tag', icon: Tag, description: 'Manage searchable descriptors for songs.' },
  }[section];
  const Icon = config.icon;
  useEffect(() => {
    let current = true;
    setLoading(true);
    void api<{ data?: CatalogRecord[]; total?: number }>(token, `/admin/${section}?limit=100`).then((result) => { if (current) { const data = Array.isArray(result.data) ? result.data : []; const reportedTotal = typeof result.total === 'number' && Number.isFinite(result.total) ? result.total : 0; const total = Math.max(reportedTotal, data.length); setRecords(data); onCountChange(section, total); } })
      .catch((error) => notify({ tone: 'error', text: messageOf(error) }))
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [token, section, reload, notify, onCountChange]);
  useEffect(() => {
    let current = true;
    const kinds: CatalogSection[] = ['artists', 'categories', 'tags'];
    void Promise.all(kinds.map((kind) => api<{ total?: number; data?: unknown[] }>(token, `/admin/${kind}?limit=100`).then((result) => { const reportedTotal = typeof result.total === 'number' && Number.isFinite(result.total) ? result.total : 0; const fetchedCount = Array.isArray(result.data) ? result.data.length : 0; return [kind, Math.max(reportedTotal, fetchedCount)] as const; })))
      .then((counts) => { if (current) counts.forEach(([kind, total]) => onCountChange(kind, total)); })
      .catch((error) => notify({ tone: 'error', text: messageOf(error) }));
    return () => { current = false; };
  }, [token, onCountChange, notify]);
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const visible = records.filter((record) => `${record.name} ${'slug' in record ? record.slug || '' : ''}`.toLowerCase().includes(normalizedQuery));
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true);
    const form = new FormData(event.currentTarget);
    const payload = section === 'artists'
      ? { name: String(form.get('name')).trim() }
      : { name: String(form.get('name')).trim(), slug: String(form.get('slug')).trim() };
    try {
      await api(token, `/admin/${section}`, { method: 'POST', body: JSON.stringify(payload) });
      setShowForm(false); setReload((value) => value + 1);
      notify({ tone: 'success', text: `${config.singular} added.` });
    } catch (error) { notify({ tone: 'error', text: messageOf(error) }); }
    finally { setSaving(false); }
  }
  async function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!editing) return;
    const form = new FormData(event.currentTarget);
    const payload = section === 'artists'
      ? { name: String(form.get('name')).trim() }
      : { name: String(form.get('name')).trim(), slug: String(form.get('slug')).trim() };
    try {
      await api(token, `/admin/${section}/${editing.mongoId ?? editing.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      setEditing(null); setReload((value) => value + 1); notify({ tone: 'success', text: `${config.singular} updated.` });
    } catch (error) { notify({ tone: 'error', text: messageOf(error) }); }
  }
  async function remove(record: CatalogRecord) {
    try {
      await api(token, `/admin/${section}/${record.mongoId ?? record.id}`, { method: 'DELETE' });
      setRecordToDelete(null);
      setReload((value) => value + 1); notify({ tone: 'success', text: `${config.singular} removed.` });
    } catch (error) { notify({ tone: 'error', text: messageOf(error) }); }
  }
  return <section id="catalog-records" className="overflow-hidden rounded-3xl border border-border bg-white shadow-sm">
    <div className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-band text-gold-dark"><Icon size={18} /></span><div><h2 className="font-bold text-ink">{config.title}</h2><p className="text-xs text-muted">{records.length} {config.title.toLowerCase()} · {config.description}</p></div></div>
      <div className="flex gap-2"><button type="button" className={secondary} disabled={loading} onClick={() => setReload((value) => value + 1)}><RefreshCw className={loading ? 'animate-spin' : ''} size={15} />Refresh</button><button type="button" className={primary} onClick={() => { setEditing(null); setShowForm((value) => !value); }}>{showForm ? <X size={15} /> : <Plus size={15} />}{showForm ? 'Close' : `Add ${config.singular}`}</button></div>
    </div>
    {showForm && <form className="grid gap-3 border-b border-border bg-surface-soft p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end" onSubmit={(event) => void submit(event)}><label className="block text-sm font-semibold text-ink"><span>{config.singular} name</span><input className={inputClass} name="name" placeholder={section === 'artists' ? 'Artist name' : `${config.singular} name`} required maxLength={200} /></label>{section !== 'artists' && <label className="block text-sm font-semibold text-ink"><span>Slug</span><input className={inputClass} name="slug" placeholder="lowercase-with-hyphens" pattern="[a-z0-9]+(-[a-z0-9]+)*" required maxLength={100} /></label>}<button className={primary} disabled={saving}>{saving ? <LoaderCircle className="animate-spin" size={15} /> : <Plus size={15} />}Save {config.singular}</button></form>}
    <div className="overflow-x-auto"><table className="w-full min-w-[520px] text-left"><thead className="border-b border-border bg-surface-soft text-[11px] uppercase tracking-wide text-muted"><tr><th className="px-4 py-2.5 font-semibold">{config.singular}</th>{section !== 'artists' && <th className="px-4 py-2.5 font-semibold">Slug</th>}<th className="w-24 px-4 py-2.5 text-right font-semibold">Actions</th></tr></thead><tbody className="divide-y divide-border">{loading ? <tr><td colSpan={section === 'artists' ? 2 : 3} className="px-4 py-8 text-center text-sm text-muted"><LoaderCircle className="mr-2 inline animate-spin" size={15} />Loading {config.title.toLowerCase()}…</td></tr> : visible.length === 0 ? <tr><td colSpan={section === 'artists' ? 2 : 3} className="px-4 py-8 text-center text-sm text-muted">{normalizedQuery ? `No ${config.title.toLowerCase()} match this search.` : `No ${config.title.toLowerCase()} yet. Use Add ${config.singular} to create one.`}</td></tr> : visible.map((record) => <tr key={record.mongoId ?? record.id} className="hover:bg-surface-soft/70"><td className="px-4 py-2.5 text-sm font-semibold text-ink">{record.name}</td>{section !== 'artists' && <td className="px-4 py-2.5 text-xs text-muted">{'slug' in record ? record.slug : ''}</td>}<td className="px-4 py-2"><div className="flex justify-end gap-1"><button type="button" className="grid h-8 w-8 place-items-center rounded-lg text-navy hover:bg-band" aria-label={`Edit ${record.name}`} title="Edit" onClick={() => { setShowForm(false); setEditing(record); }}><Pencil size={15} /></button><button type="button" className="grid h-8 w-8 place-items-center rounded-lg text-danger hover:bg-danger/10" aria-label={`Delete ${record.name}`} title="Delete" onClick={() => setRecordToDelete(record)}><Trash2 size={15} /></button></div></td></tr>)}</tbody></table></div>
    {editing && <div className="fixed inset-0 z-50 grid place-items-center bg-blackbar/50 p-4 backdrop-blur-sm"><form className="w-full max-w-lg space-y-4 rounded-2xl border border-border bg-white p-5 shadow-2xl" role="dialog" aria-modal="true" onSubmit={(event) => void saveEdit(event)}><div className="flex items-center justify-between"><h2 className="font-bold text-ink">Edit {config.singular}</h2><button type="button" className="grid h-8 w-8 place-items-center rounded-lg hover:bg-surface-soft" onClick={() => setEditing(null)} aria-label="Close"><X size={17} /></button></div><label className="block text-sm font-semibold text-ink"><span>{config.singular} name</span><input className={inputClass} name="name" defaultValue={editing.name} required maxLength={200} /></label>{section !== 'artists' && <label className="block text-sm font-semibold text-ink"><span>Slug</span><input className={inputClass} name="slug" defaultValue={'slug' in editing ? editing.slug : ''} pattern="[a-z0-9]+(-[a-z0-9]+)*" required maxLength={100} /></label>}<div className="flex justify-end gap-2"><button type="button" className={secondary} onClick={() => setEditing(null)}>Cancel</button><button className={primary}>Save changes</button></div></form></div>}
    {recordToDelete && <ConfirmDialog title={`Remove “${recordToDelete.name}”?`} message={section === 'artists' ? 'Artists attached to songs or albums cannot be deleted.' : `This ${config.singular.toLowerCase()} will be permanently removed.`} confirmLabel="Remove" onCancel={() => setRecordToDelete(null)} onConfirm={() => remove(recordToDelete)} />}
  </section>;
}

function Metric({ id, label, value, icon: Icon, tone }: { id?: string; label: string; value: number | string; icon: LucideIcon; tone: 'violet' | 'emerald' | 'amber' | 'cyan' }) {
  const tones = { violet: 'bg-violet-100 text-violet-800', emerald: 'bg-emerald-100 text-emerald-800', amber: 'bg-amber-100 text-amber-800', cyan: 'bg-cyan-100 text-cyan-800' };
  return <article id={id} className="rounded-3xl border border-white/[0.09] bg-slate-900/50 p-5 shadow-xl shadow-black/10 backdrop-blur"><div className="flex items-start justify-between"><div><p className="text-sm font-medium text-slate-400">{label}</p><p className="mt-2 text-2xl font-bold tracking-tight text-white">{value}</p></div><span className={`grid h-10 w-10 place-items-center rounded-2xl ${tones[tone]}`}><Icon size={19} /></span></div></article>;
}

function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="block text-sm font-semibold text-slate-300"><span>{label}</span>{children}</label>; }
function FieldError({ children }: { children?: string }) { return children ? <span className="mt-1 block text-xs font-medium text-rose-300" role="alert">{children}</span> : null; }
function Hint({ children }: { children: ReactNode }) { return <p className="mt-1.5 text-xs leading-5 text-slate-500">{children}</p>; }
function CustomMultiSelect({ name, items, placeholder, helper, selectedValues: initialSelected = [] }: { name: string; items: { value: string; label: string }[]; placeholder: string; helper: string; selectedValues?: string[] }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(initialSelected);
  const ref = useRef<HTMLDivElement | null>(null);
  const selectedItems = items.filter((item) => selected.includes(item.value));

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  function toggle(value: string) {
    setSelected((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  }

  return (
    <div ref={ref} className="relative mt-2">
      <button type="button" className="mt-2 w-full rounded-xl border border-[#d9c49a] bg-[#f8f5f1] px-3.5 py-2.5 text-left shadow-[inset_0_0_0_1px_rgba(154,121,78,0.06)] transition focus:outline-none focus:ring-4 focus:ring-primary/15" onClick={() => setOpen((current) => !current)}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {selectedItems.length > 0 ? selectedItems.map((item) => (
              <span key={item.value} className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800">{item.label}</span>
            )) : <span className="truncate text-sm text-slate-500">{placeholder}</span>}
          </div>
          <ChevronDown size={16} className={`shrink-0 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {open && (
        <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-[#d9c49a] bg-[#f9f6f2] shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
          <div className="max-h-56 overflow-y-auto p-2">
            {items.length === 0 ? (
              <div className="px-2 py-3 text-sm text-muted">No options available.</div>
            ) : items.map((item) => {
              const active = selected.includes(item.value);
              return (
                <button
                  key={item.value}
                  type="button"
                  className={`flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left text-sm transition ${active ? 'bg-[#f1e6c8] text-[#1f2937]' : 'text-ink hover:bg-[#f3eee6]'}`}
                  onClick={() => toggle(item.value)}
                >
                  <span>{item.label}</span>
                  <span className={`grid h-4 w-4 place-items-center rounded border text-[10px] ${active ? 'border-primary bg-primary text-navy-dark' : 'border-slate-300 bg-white text-transparent'}`}>
                    ✓
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {selected.map((value) => <input key={value} type="hidden" name={name} value={value} />)}
      <p className="mt-1.5 text-xs leading-5 text-slate-500">{helper}</p>
    </div>
  );
}
function StatusBadge({ active }: { active: boolean }) { return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${active ? 'border-emerald-300 bg-emerald-100 text-emerald-800' : 'border-rose-300 bg-rose-100 text-rose-800'}`}><span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-emerald-600' : 'bg-rose-600'}`} />{active ? 'Active' : 'Disabled'}</span>; }
function ProcessingBadge({ state }: { state: Song['processing'] }) { const styles = { pending: { borderColor: '#facc15', backgroundColor: '#fef3c7', color: '#854d0e' }, processing: { borderColor: '#7dd3fc', backgroundColor: '#e0f2fe', color: '#075985' }, ready: { borderColor: '#86efac', backgroundColor: '#dcfce7', color: '#166534' }, failed: { borderColor: '#fda4af', backgroundColor: '#ffe4e6', color: '#9f1239' } }; return <span className="rounded-full border px-2.5 py-1 text-xs font-bold capitalize" style={styles[state]}>{state}</span>; }
function Empty({ title, text, icon: Icon }: { title: string; text: string; icon: LucideIcon }) { return <div className="grid min-h-72 place-items-center px-5 py-10 text-center"><div><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white/[0.06] text-slate-400"><Icon size={22} /></span><h3 className="mt-4 font-bold text-slate-200">{title}</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">{text}</p></div></div>; }
function LoadingRows() { return <div className="divide-y divide-white/[0.07] px-5 py-2 sm:px-6">{Array.from({ length: 4 }, (_, index) => <div className="flex items-center gap-3 py-4" key={index}><div className="h-10 w-10 animate-pulse rounded-full bg-white/[0.06]" /><div className="flex-1 space-y-2"><div className="h-3 w-36 animate-pulse rounded bg-white/[0.07]" /><div className="h-2.5 w-52 animate-pulse rounded bg-white/[0.05]" /></div><div className="h-8 w-20 animate-pulse rounded-xl bg-white/[0.06]" /></div>)}</div>; }
function selectedValues(form: HTMLFormElement, name: string) { const elements = Array.from(form.elements).filter((element) => element instanceof HTMLElement && element.getAttribute('name') === name); return elements.flatMap((element) => { if (element instanceof HTMLSelectElement) return Array.from(element.selectedOptions).map((option) => option.value); if (element instanceof HTMLInputElement) { if (element.type === 'checkbox' || element.type === 'radio') return element.checked ? [element.value] : []; if (element.type === 'hidden' && element.value) return [element.value]; } return []; }); }
