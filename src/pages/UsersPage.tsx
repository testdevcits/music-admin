import type { User } from '../api';

type Props = {
  token: string;
  me: User;
  notify: (notice: { tone: 'success' | 'error' | 'info'; text: string }) => void;
  searchQuery: string;
};

export function UsersPage({ me, searchQuery }: Props) {
  return (
    <section className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-3xl border border-white/[0.09] bg-slate-900/50 p-5 shadow-2xl shadow-black/10 backdrop-blur">
          <p className="text-sm font-medium text-slate-400">Total users</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-white">1</p>
        </article>
        <article className="rounded-3xl border border-white/[0.09] bg-slate-900/50 p-5 shadow-2xl shadow-black/10 backdrop-blur">
          <p className="text-sm font-medium text-slate-400">Active</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-white">1</p>
        </article>
        <article className="rounded-3xl border border-white/[0.09] bg-slate-900/50 p-5 shadow-2xl shadow-black/10 backdrop-blur">
          <p className="text-sm font-medium text-slate-400">Restricted</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-white">0</p>
        </article>
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/[0.09] bg-slate-900/50 p-5 shadow-2xl shadow-black/10 backdrop-blur sm:p-6">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div>
            <h2 className="text-lg font-bold text-white">All users</h2>
            <p className="mt-1 text-sm text-slate-500">{searchQuery ? `Search: “${searchQuery}”` : 'Signed-in and invited admin accounts.'}</p>
          </div>
        </div>
        <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-slate-950/30 p-5 text-sm text-slate-400">
          Users are managed through the API layer. This page is separated for a clearer admin structure.
          <div className="mt-3 text-xs text-slate-500">Current admin: {me.name}</div>
        </div>
      </div>
    </section>
  );
}
