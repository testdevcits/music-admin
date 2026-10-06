import { ChangeEvent, FormEvent, useState } from 'react';

type Props = {
  token: string;
  notify: (notice: { tone: 'success' | 'error' | 'info'; text: string }) => void;
  searchQuery: string;
};

type SongItem = {
  id: string;
  title: string;
  artist: string;
  album: string;
  language: string;
  genre: string;
  duration: string;
  cover: string;
  audioName: string;
  published: boolean;
  status: 'draft' | 'ready' | 'failed';
};

type SongDraft = {
  title: string;
  artist: string;
  album: string;
  language: string;
  genre: string;
  duration: string;
  cover: string;
  audioName: string;
};

const mockSongs: SongItem[] = [
  {
    id: 's_1',
    title: 'Tajdar-e-Haram',
    artist: 'Atif Aslam',
    album: 'The Sound of Sufi',
    language: 'Hindi',
    genre: 'Sufi',
    duration: '4:18',
    cover: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=80',
    audioName: 'tajdar-e-haram.mp3',
    published: true,
    status: 'ready',
  },
  {
    id: 's_2',
    title: 'Baarishein',
    artist: 'Anuv Jain',
    album: 'AAG',
    language: 'Hindi',
    genre: 'Indie',
    duration: '3:52',
    cover: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
    audioName: 'baarishein.mp3',
    published: false,
    status: 'draft',
  },
  {
    id: 's_3',
    title: 'Kala Chashma',
    artist: 'Badshah',
    album: 'Party Mix',
    language: 'Punjabi',
    genre: 'Pop',
    duration: '3:21',
    cover: 'https://images.unsplash.com/photo-1525201548942-d8732f6617a0?auto=format&fit=crop&w=900&q=80',
    audioName: 'kala-chashma.mp3',
    published: true,
    status: 'ready',
  },
  {
    id: 's_4',
    title: 'Agar Tum Saath Ho',
    artist: 'Alka Yagnik & Arijit Singh',
    album: 'Tamasha',
    language: 'Hindi',
    genre: 'Romantic',
    duration: '5:41',
    cover: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80',
    audioName: 'agar-tum-saath-ho.mp3',
    published: false,
    status: 'ready',
  },
];

const emptyDraft: SongDraft = {
  title: '',
  artist: '',
  album: '',
  language: 'Hindi',
  genre: 'Pop',
  duration: '3:30',
  cover: '',
  audioName: '',
};

export function MusicPage({ searchQuery, notify }: Props) {
  const [songs, setSongs] = useState<SongItem[]>(mockSongs);
  const [draft, setDraft] = useState<SongDraft>(emptyDraft);
  const [showForm, setShowForm] = useState(false);

  const filtered = songs.filter((song) => {
    const haystack = `${song.title} ${song.artist} ${song.album} ${song.language} ${song.genre}`.toLowerCase();
    return haystack.includes(searchQuery.trim().toLowerCase());
  });

  const updateDraft = <K extends keyof SongDraft>(key: K, value: SongDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const handleCoverUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => updateDraft('cover', String(reader.result ?? ''));
    reader.readAsDataURL(file);
  };

  const handleAudioUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    updateDraft('audioName', file.name);
  };

  const addSong = (event: FormEvent) => {
    event.preventDefault();
    if (!draft.title.trim() || !draft.artist.trim()) return;

    const next: SongItem = {
      id: `s_${Date.now()}`,
      title: draft.title.trim(),
      artist: draft.artist.trim(),
      album: draft.album.trim() || 'Single',
      language: draft.language,
      genre: draft.genre,
      duration: draft.duration || '3:30',
      cover: draft.cover || 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=80',
      audioName: draft.audioName || 'upload.mp3',
      published: false,
      status: draft.audioName ? 'ready' : 'draft',
    };

    setSongs((current) => [next, ...current]);
    setDraft(emptyDraft);
    notify({ tone: 'success', text: 'Song added to the library and ready for review.' });
  };

  const togglePublish = (id: string) => {
    setSongs((current) =>
      current.map((song) => {
        if (song.id !== id) return song;
        const published = !song.published;
        return { ...song, published, status: published ? 'ready' : 'draft' };
      }),
    );
    notify({ tone: 'success', text: 'Song publishing state updated.' });
  };

  const deleteSong = (id: string) => {
    setSongs((current) => current.filter((song) => song.id !== id));
    notify({ tone: 'info', text: 'Song removed from the library.' });
  };

  return (
    <section className="space-y-5">
      <div className="rounded-[28px] border border-border bg-white p-4 shadow-[0_12px_30px_rgba(30,35,45,0.04)] sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-ink">Music processing</h2>
          <button
            type="button"
            onClick={() => setShowForm((visible) => !visible)}
            className="grid h-11 w-11 place-items-center rounded-xl border border-border bg-surface-soft text-lg font-bold text-navy transition hover:bg-band"
            aria-label={showForm ? 'Close add song form' : 'Open add song form'}
            title={showForm ? 'Close form' : 'Add song'}
          >
            +
          </button>
        </div>

        {showForm && (
          <form onSubmit={addSong} className="mt-4 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium text-ink">
                <span className="mb-1.5 block">Song title</span>
                <input value={draft.title} onChange={(event) => updateDraft('title', event.target.value)} className="w-full rounded-xl border border-border bg-surface-soft px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-gray focus:border-primary focus:ring-4 focus:ring-primary/15" placeholder="Example: Sadi Gali" />
              </label>

              <label className="block text-sm font-medium text-ink">
                <span className="mb-1.5 block">Artist</span>
                <input value={draft.artist} onChange={(event) => updateDraft('artist', event.target.value)} className="w-full rounded-xl border border-border bg-surface-soft px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-gray focus:border-primary focus:ring-4 focus:ring-primary/15" placeholder="Artist name" />
              </label>

              <label className="block text-sm font-medium text-ink">
                <span className="mb-1.5 block">Album / release</span>
                <input value={draft.album} onChange={(event) => updateDraft('album', event.target.value)} className="w-full rounded-xl border border-border bg-surface-soft px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-gray focus:border-primary focus:ring-4 focus:ring-primary/15" placeholder="Single / EP / Album" />
              </label>

              <label className="block text-sm font-medium text-ink">
                <span className="mb-1.5 block">Genre</span>
                <input value={draft.genre} onChange={(event) => updateDraft('genre', event.target.value)} className="w-full rounded-xl border border-border bg-surface-soft px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-gray focus:border-primary focus:ring-4 focus:ring-primary/15" placeholder="Pop, Sufi, Indie..." />
              </label>

              <label className="block text-sm font-medium text-ink">
                <span className="mb-1.5 block">Language</span>
                <select value={draft.language} onChange={(event) => updateDraft('language', event.target.value)} className="w-full rounded-xl border border-border bg-surface-soft px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15">
                  <option value="Hindi">Hindi</option>
                  <option value="English">English</option>
                  <option value="Punjabi">Punjabi</option>
                  <option value="Marathi">Marathi</option>
                  <option value="Urdu">Urdu</option>
                  <option value="Bengali">Bengali</option>
                </select>
              </label>

              <label className="block text-sm font-medium text-ink">
                <span className="mb-1.5 block">Duration</span>
                <input value={draft.duration} onChange={(event) => updateDraft('duration', event.target.value)} className="w-full rounded-xl border border-border bg-surface-soft px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-gray focus:border-primary focus:ring-4 focus:ring-primary/15" placeholder="3:30" />
              </label>

              <label className="block text-sm font-medium text-ink md:col-span-2">
                <span className="mb-1.5 block">Upload MP3 audio</span>
                <input type="file" accept="audio/mpeg,.mp3" onChange={handleAudioUpload} className="block w-full rounded-xl border border-dashed border-border bg-surface-soft px-3.5 py-3 text-sm text-ink file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-semibold file:text-navy-dark" />
                {draft.audioName && <span className="mt-2 block text-xs font-medium text-muted">Selected file: {draft.audioName}</span>}
              </label>

              <label className="block text-sm font-medium text-ink md:col-span-2">
                <span className="mb-1.5 block">Cover artwork</span>
                <input type="file" accept="image/*" onChange={handleCoverUpload} className="block w-full rounded-xl border border-dashed border-border bg-surface-soft px-3.5 py-3 text-sm text-ink file:mr-3 file:rounded-lg file:border-0 file:bg-[#efe7db] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-navy" />
                {draft.cover && <img src={draft.cover} alt="Cover preview" className="mt-3 h-20 w-20 rounded-xl object-cover ring-1 ring-border" />}
              </label>
            </div>

            <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-navy-dark shadow-[0_8px_24px_rgba(214,163,35,0.24)] transition hover:bg-gold-dark hover:text-white">Add song</button>
          </form>
        )}
      </div>

      <div className="rounded-[28px] border border-border bg-white p-4 shadow-[0_12px_30px_rgba(30,35,45,0.04)] sm:p-6">
        <h2 className="text-xl font-bold text-ink">Music processing</h2>
        <p className="mt-1 text-sm text-muted">{searchQuery ? `Search: "${searchQuery}"` : 'Upload audio, add artwork, and publish once the track is ready.'}</p>

        <div className="mt-5 space-y-3">
          {filtered.map((song) => (
            <div key={song.id} className="flex flex-col gap-4 rounded-2xl border border-border bg-surface-soft p-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <img src={song.cover} alt={song.title} className="h-16 w-16 rounded-xl object-cover ring-1 ring-border" />
                <div>
                  <div className="text-base font-bold text-ink">{song.title}</div>
                  <div className="text-sm text-muted">{song.artist} · {song.album}</div>
                  <div className="mt-1 text-xs text-gray">{song.language} · {song.genre} · {song.duration}</div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${song.status === 'ready' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : song.status === 'draft' ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
                  {song.status}
                </span>
                <span className="rounded-full border border-border bg-white px-2.5 py-1 text-[11px] font-medium text-muted">{song.audioName}</span>
                <button className="rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-semibold text-ink hover:bg-band" onClick={() => togglePublish(song.id)}>{song.published ? 'Unpublish' : 'Publish'}</button>
                <button className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100" onClick={() => deleteSong(song.id)}>Delete</button>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-surface-soft p-6 text-center text-sm text-muted">
              No songs match this search.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
