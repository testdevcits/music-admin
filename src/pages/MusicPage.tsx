import type { Song } from '../api';

type Props = {
  token: string;
  notify: (notice: { tone: 'success' | 'error' | 'info'; text: string }) => void;
  searchQuery: string;
};

export function MusicPage({ searchQuery }: Props) {
  return (
    <section className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-3xl border border-white/[0.09] bg-slate-900/50 p-5 shadow-2xl shadow-black/10 backdrop-blur">
          <p className="text-sm font-medium text-slate-400">Songs</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-white">0</p>
        </article>
        <article className="rounded-3xl border border-white/[0.09] bg-slate-900/50 p-5 shadow-2xl shadow-black/10 backdrop-blur">
          <p className="text-sm font-medium text-slate-400">Ready</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-white">0</p>
        </article>
        <article className="rounded-3xl border border-white/[0.09] bg-slate-900/50 p-5 shadow-2xl shadow-black/10 backdrop-blur">
          <p className="text-sm font-medium text-slate-400">Published</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-white">0</p>
        </article>
      </div>

      <div className="rounded-3xl border border-white/[0.09] bg-slate-900/50 p-5 shadow-2xl shadow-black/10 backdrop-blur sm:p-6">
        <h2 className="text-lg font-bold text-white">Music processing</h2>
        <p className="mt-1 text-sm text-slate-500">{searchQuery ? `Search: “${searchQuery}”` : 'Create songs, upload audio, and publish them after validation.'}</p>
        <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-slate-950/30 p-5 text-sm text-slate-400">
          This playlist area is isolated in a dedicated music page so uploads, processing, and publishing stay easier to manage.
        </div>
      </div>
    </section>
  );
}
