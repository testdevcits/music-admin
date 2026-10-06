import type { User } from '../api';

type Props = {
  me: User;
  notify: (notice: { tone: 'success' | 'error' | 'info'; text: string }) => void;
};

export function SettingsPage({ me }: Props) {
  return (
    <section className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-2">
        <article className="rounded-3xl border border-white/[0.09] bg-slate-900/50 p-5 shadow-2xl shadow-black/10 backdrop-blur sm:p-6">
          <h2 className="font-bold text-white">Admin profile</h2>
          <p className="mt-1 text-sm text-slate-500">Customize your account identity and platform identity.</p>
          <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-slate-950/30 p-5 text-sm text-slate-400">
            Logged in as {me.name} · {me.email}
          </div>
        </article>
        <article className="rounded-3xl border border-white/[0.09] bg-slate-900/50 p-5 shadow-2xl shadow-black/10 backdrop-blur sm:p-6">
          <h2 className="font-bold text-white">Branding</h2>
          <p className="mt-1 text-sm text-slate-500">Set the main workspace logo and visual identity.</p>
          <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-slate-950/30 p-5 text-sm text-slate-400">
            Brand file upload and logo configuration stay separated from content and user flows.
          </div>
        </article>
      </div>
      <article className="rounded-3xl border border-white/[0.09] bg-slate-900/50 p-5 shadow-2xl shadow-black/10 backdrop-blur sm:p-6">
        <h2 className="font-bold text-white">System health</h2>
        <p className="mt-1 text-sm text-slate-500">Backend, latency, and workload checks are grouped into one operational panel.</p>
        <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-slate-950/30 p-5 text-sm text-slate-400">
          Use health monitoring to confirm the API and queue are stable before publishing new music.
        </div>
      </article>
    </section>
  );
}
