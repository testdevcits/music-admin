type Props = {
  searchQuery: string;
};

export function CatalogPage({ searchQuery }: Props) {
  return (
    <section className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-3">
        <article className="rounded-3xl border border-white/[0.09] bg-slate-900/50 p-5 shadow-2xl shadow-black/10 backdrop-blur">
          <p className="text-sm font-medium text-slate-400">Artists</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-white">0</p>
        </article>
        <article className="rounded-3xl border border-white/[0.09] bg-slate-900/50 p-5 shadow-2xl shadow-black/10 backdrop-blur">
          <p className="text-sm font-medium text-slate-400">Categories</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-white">0</p>
        </article>
        <article className="rounded-3xl border border-white/[0.09] bg-slate-900/50 p-5 shadow-2xl shadow-black/10 backdrop-blur">
          <p className="text-sm font-medium text-slate-400">Tags</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-white">0</p>
        </article>
      </div>
      <div className="rounded-3xl border border-white/[0.09] bg-slate-900/50 p-5 shadow-2xl shadow-black/10 backdrop-blur sm:p-6">
        <h2 className="text-lg font-bold text-white">Catalog library</h2>
        <p className="mt-1 text-sm text-slate-500">{searchQuery ? `Search: “${searchQuery}”` : 'Manage catalog structure for artists, categories, and tags.'}</p>
        <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-slate-950/30 p-5 text-sm text-slate-400">
          This catalog page keeps admin metadata creation separated from music publishing and user controls.
        </div>
      </div>
    </section>
  );
}
