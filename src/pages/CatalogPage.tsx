import { useMemo, useState } from 'react';

type Props = {
  searchQuery: string;
  section: 'artists' | 'categories' | 'tags';
  onSectionChange: (section: 'artists' | 'categories' | 'tags') => void;
};

type CatalogItem = { id: string; name: string; slug: string; image?: string; description?: string; color?: string };
type SectionKey = 'artists' | 'categories' | 'tags';

const pageSize = 5;

const mockArtists: CatalogItem[] = [
  { id: 'a_1', name: 'Arooj Aftab', slug: 'arooj-aftab', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80', description: 'Contemporary Sufi and indie fusion artist', color: '#c68d3b' },
  { id: 'a_2', name: 'Talal Qureshi', slug: 'talal-qureshi', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80', description: 'Electronic and crossover producer', color: '#5d6d8c' },
  { id: 'a_3', name: 'Naseebo Lal', slug: 'naseebo-lal', image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=400&q=80', description: 'Folk and devotional vocalist', color: '#8a6d3b' },
  { id: 'a_4', name: 'Atif Aslam', slug: 'atif-aslam', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80', description: 'Pop and rock vocalist', color: '#a94d4d' },
  { id: 'a_5', name: 'Abida Parveen', slug: 'abida-parveen', image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80', description: 'Classical and Sufi singer', color: '#5f7f63' },
];

const mockCategories: CatalogItem[] = [
  { id: 'c_1', name: 'Pop', slug: 'pop', description: 'Mainstream melodic hits', color: '#d4a72c' },
  { id: 'c_2', name: 'Rock', slug: 'rock', description: 'Electric guitar and live energy', color: '#7d3b3b' },
  { id: 'c_3', name: 'Sufi', slug: 'sufi', description: 'Spiritual and devotional sound', color: '#a76a2a' },
  { id: 'c_4', name: 'Indie', slug: 'indie', description: 'Independent and experimental releases', color: '#2d5d76' },
  { id: 'c_5', name: 'Hip-Hop', slug: 'hip-hop', description: 'Rhythm-driven modern culture', color: '#4c6f45' },
];

const mockTags: CatalogItem[] = [
  { id: 't_1', name: 'Trending', slug: 'trending', description: 'High engagement this week', color: '#d6a323' },
  { id: 't_2', name: 'Featured', slug: 'featured', description: 'Curated for homepage highlight', color: '#4d6dc3' },
  { id: 't_3', name: 'Fresh Drop', slug: 'fresh-drop', description: 'New albums and singles', color: '#5d9c72' },
  { id: 't_4', name: 'Late Night', slug: 'late-night', description: 'Mood-driven listening sessions', color: '#7f5aa9' },
  { id: 't_5', name: 'Workout', slug: 'workout', description: 'High tempo playlists', color: '#cd7c3f' },
];

export function CatalogPage({ searchQuery, section, onSectionChange }: Props) {
  const [artists, setArtists] = useState<CatalogItem[]>(mockArtists);
  const [categories, setCategories] = useState<CatalogItem[]>(mockCategories);
  const [tags, setTags] = useState<CatalogItem[]>(mockTags);
  const [page, setPage] = useState(1);
  const [artistName, setArtistName] = useState('');
  const [artistImage, setArtistImage] = useState('');
  const [artistImageName, setArtistImageName] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [categorySlug, setCategorySlug] = useState('');
  const [tagName, setTagName] = useState('');
  const [tagSlug, setTagSlug] = useState('');
  const [formErrors, setFormErrors] = useState<{ artistName?: string; categoryName?: string; categorySlug?: string; tagName?: string; tagSlug?: string }>({});

  const filter = (items: CatalogItem[]) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return items;
    return items.filter((item) => `${item.name} ${item.slug} ${item.description ?? ''}`.toLowerCase().includes(query));
  };

  const sectionData = useMemo(() => ({
    artists: { label: 'Artists', items: filter(artists), count: artists.length },
    categories: { label: 'Categories', items: filter(categories), count: categories.length },
    tags: { label: 'Tags', items: filter(tags), count: tags.length },
  }), [artists, categories, tags, searchQuery]);

  const activeSection = section;
  const activeItems = sectionData[activeSection].items;
  const totalPages = Math.max(1, Math.ceil(activeItems.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedItems = activeItems.slice((safePage - 1) * pageSize, safePage * pageSize);

  const sectionMeta: Record<SectionKey, { title: string; placeholder: string; buttonLabel: string; extraField?: boolean }> = {
    artists: { title: 'Add artist', placeholder: 'Artist name', buttonLabel: 'Add artist' },
    categories: { title: 'Add category', placeholder: 'Category name', buttonLabel: 'Add category', extraField: true },
    tags: { title: 'Add tag', placeholder: 'Tag name', buttonLabel: 'Add tag', extraField: true },
  };

  const addArtist = (event: React.FormEvent) => {
    event.preventDefault();
    const nextError = !artistName.trim() ? 'Artist name is required.' : '';
    setFormErrors((current) => ({ ...current, artistName: nextError }));
    if (nextError) return;
    setArtists((current) => [{ 
      id: `a_${Date.now()}`,
      name: artistName.trim(),
      slug: artistName.trim().toLowerCase().replace(/\s+/g, '-'),
      image: artistImage || undefined,
    }, ...current]);
    setArtistName('');
    setArtistImage('');
    setArtistImageName('');
    setFormErrors((current) => ({ ...current, artistName: undefined }));
    setPage(1);
  };

  const addCategory = (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors: { categoryName?: string; categorySlug?: string } = {
      categoryName: !categoryName.trim() ? 'Category name is required.' : undefined,
      categorySlug: !categorySlug.trim() ? 'Slug is required.' : undefined,
    };
    setFormErrors((current) => ({ ...current, ...nextErrors }));
    if (nextErrors.categoryName || nextErrors.categorySlug) return;
    setCategories((current) => [{ id: `c_${Date.now()}`, name: categoryName.trim(), slug: categorySlug.trim() }, ...current]);
    setCategoryName('');
    setCategorySlug('');
    setFormErrors((current) => ({ ...current, categoryName: undefined, categorySlug: undefined }));
    setPage(1);
  };

  const addTag = (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors: { tagName?: string; tagSlug?: string } = {
      tagName: !tagName.trim() ? 'Tag name is required.' : undefined,
      tagSlug: !tagSlug.trim() ? 'Slug is required.' : undefined,
    };
    setFormErrors((current) => ({ ...current, ...nextErrors }));
    if (nextErrors.tagName || nextErrors.tagSlug) return;
    setTags((current) => [{ id: `t_${Date.now()}`, name: tagName.trim(), slug: tagSlug.trim() }, ...current]);
    setTagName('');
    setTagSlug('');
    setFormErrors((current) => ({ ...current, tagName: undefined, tagSlug: undefined }));
    setPage(1);
  };

  const removeArtist = (id: string) => setArtists((current) => current.filter((item) => item.id !== id));
  const removeCategory = (id: string) => setCategories((current) => current.filter((item) => item.id !== id));
  const removeTag = (id: string) => setTags((current) => current.filter((item) => item.id !== id));

  const handleSectionSelect = (nextSection: SectionKey) => {
    onSectionChange(nextSection);
    setPage(1);
  };

  const handleRemove = (id: string) => {
    if (activeSection === 'artists') removeArtist(id);
    if (activeSection === 'categories') removeCategory(id);
    if (activeSection === 'tags') removeTag(id);
  };

  const renderForm = () => {
    if (activeSection === 'artists') {
      return (
        <form onSubmit={addArtist} className="space-y-2.5 pt-2">
          <label className="block text-sm font-medium text-[#1f2430]">
            <span className="mb-1.5 block">Artist name</span>
            <input value={artistName} onChange={(e) => { setArtistName(e.target.value); if (formErrors.artistName) setFormErrors((current) => ({ ...current, artistName: undefined })); }} className={`w-full rounded-xl border bg-[#f7f2ea] px-3 py-2 text-sm text-[#1f2430] placeholder:text-[#7a7f87] ${formErrors.artistName ? 'border-[#b94a4a]' : 'border-[#d9d0bd]'}`} placeholder="Artist name" />
            {formErrors.artistName && <span className="mt-1 block text-xs text-[#b94a4a]">{formErrors.artistName}</span>}
          </label>

          <label className="block text-sm font-medium text-[#1f2430]">
            <span className="mb-1.5 block">Artist image</span>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => setArtistImage(String(reader.result || ''));
                reader.readAsDataURL(file);
                setArtistImageName(file.name);
              }}
              className="block w-full rounded-xl border border-dashed border-[#d9d0bd] bg-[#f7f2ea] px-3 py-2 text-sm text-[#1f2430] file:mr-3 file:rounded-lg file:border-0 file:bg-[#efe7db] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[#1f2430]"
            />
            {artistImageName && <span className="mt-1 block text-xs text-[#5d646c]">Selected: {artistImageName}</span>}
            {artistImage && <img src={artistImage} alt="Artist preview" className="mt-3 h-20 w-20 rounded-xl object-cover ring-1 ring-[#d9d0bd]" />}
          </label>

          <button type="submit" className="w-full rounded-xl bg-[#d6a323] px-4 py-2 text-sm font-semibold text-[#1d2430] hover:bg-[#c88f13]">Add artist</button>
        </form>
      );
    }

    if (activeSection === 'categories') {
      return (
        <form onSubmit={addCategory} className="space-y-2.5 pt-2">
          <label className="block text-sm font-medium text-[#1f2430]">
            <span className="mb-1.5 block">Category name</span>
            <input value={categoryName} onChange={(e) => { setCategoryName(e.target.value); if (formErrors.categoryName) setFormErrors((current) => ({ ...current, categoryName: undefined })); }} className={`w-full rounded-xl border bg-[#f7f2ea] px-3 py-2 text-sm text-[#1f2430] placeholder:text-[#7a7f87] ${formErrors.categoryName ? 'border-[#b94a4a]' : 'border-[#d9d0bd]'}`} placeholder="Category name" />
            {formErrors.categoryName && <span className="mt-1 block text-xs text-[#b94a4a]">{formErrors.categoryName}</span>}
          </label>
          <label className="block text-sm font-medium text-[#1f2430]">
            <span className="mb-1.5 block">Slug</span>
            <input value={categorySlug} onChange={(e) => { setCategorySlug(e.target.value); if (formErrors.categorySlug) setFormErrors((current) => ({ ...current, categorySlug: undefined })); }} className={`w-full rounded-xl border bg-[#f7f2ea] px-3 py-2 text-sm text-[#1f2430] placeholder:text-[#7a7f87] ${formErrors.categorySlug ? 'border-[#b94a4a]' : 'border-[#d9d0bd]'}`} placeholder="Slug" />
            {formErrors.categorySlug && <span className="mt-1 block text-xs text-[#b94a4a]">{formErrors.categorySlug}</span>}
          </label>
          <button type="submit" className="w-full rounded-xl bg-[#d6a323] px-4 py-2 text-sm font-semibold text-[#1d2430] hover:bg-[#c88f13]">Add category</button>
        </form>
      );
    }

    return (
      <form onSubmit={addTag} className="space-y-2.5 pt-2">
        <label className="block text-sm font-medium text-[#1f2430]">
          <span className="mb-1.5 block">Tag name</span>
          <input value={tagName} onChange={(e) => { setTagName(e.target.value); if (formErrors.tagName) setFormErrors((current) => ({ ...current, tagName: undefined })); }} className={`w-full rounded-xl border bg-[#f7f2ea] px-3 py-2 text-sm text-[#1f2430] placeholder:text-[#7a7f87] ${formErrors.tagName ? 'border-[#b94a4a]' : 'border-[#d9d0bd]'}`} placeholder="Tag name" />
          {formErrors.tagName && <span className="mt-1 block text-xs text-[#b94a4a]">{formErrors.tagName}</span>}
        </label>
        <label className="block text-sm font-medium text-[#1f2430]">
          <span className="mb-1.5 block">Slug</span>
          <input value={tagSlug} onChange={(e) => { setTagSlug(e.target.value); if (formErrors.tagSlug) setFormErrors((current) => ({ ...current, tagSlug: undefined })); }} className={`w-full rounded-xl border bg-[#f7f2ea] px-3 py-2 text-sm text-[#1f2430] placeholder:text-[#7a7f87] ${formErrors.tagSlug ? 'border-[#b94a4a]' : 'border-[#d9d0bd]'}`} placeholder="Slug" />
          {formErrors.tagSlug && <span className="mt-1 block text-xs text-[#b94a4a]">{formErrors.tagSlug}</span>}
        </label>
        <button type="submit" className="w-full rounded-xl bg-[#d6a323] px-4 py-2 text-sm font-semibold text-[#1d2430] hover:bg-[#c88f13]">Add tag</button>
      </form>
    );
  };

  return (
    <section className="space-y-4">
      <div className="p-4 shadow-[0_8px_18px_rgba(113,97,75,0.04)]">
        <div className="mb-3 flex items-center justify-between border-b border-[#d9d0bd] pb-2.5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#b07d17]">Content foundation</p>
            <h3 className="mt-2 text-2xl font-bold text-[#1f2430]">{sectionMeta[activeSection].title}</h3>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-[#d9d0bd] bg-[#f7f2ea] p-3">
            {renderForm()}
          </div>

          <div className="rounded-2xl border border-[#d9d0bd] bg-[#f7f2ea] p-3">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-base font-bold text-[#1f2430]">{sectionData[activeSection].label}</h4>
              <span className="text-sm text-[#656d77]">Total: {activeItems.length}</span>
            </div>

            {activeItems.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#d9d0bd] bg-[#efe9df] p-4 text-sm text-[#5d646c]">
                No {sectionData[activeSection].label.toLowerCase()} yet.
              </div>
            ) : (
              <div className="space-y-2.5">
                {paginatedItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 rounded-2xl border border-[#d9d0bd] bg-[#efe7db] p-2.5">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 overflow-hidden rounded-full border border-[#d9d0bd] bg-[#f7f2ea]">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs font-bold text-[#1f2430]" style={{ background: item.color ?? '#e8dcc0' }}>{item.name.slice(0, 2).toUpperCase()}</div>
                        )}
                      </div>

                      <div>
                        <div className="font-semibold text-[#1f2430]">{item.name}</div>
                        <div className="text-xs text-[#6a717b]">/{item.slug}</div>
                      </div>
                    </div>

                    <button type="button" className="text-sm font-medium text-[#a64040] hover:text-[#7f2e2e]" onClick={() => handleRemove(item.id)}>Delete</button>
                  </div>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#d9d0bd] pt-3">
                <button type="button" disabled={safePage === 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="rounded-lg border border-[#d9d0bd] bg-[#f7f2ea] px-3 py-1.5 text-sm text-[#1f2430] disabled:cursor-not-allowed disabled:opacity-50">Prev</button>
                <span className="text-sm text-[#5f6973]">Page {safePage} of {totalPages}</span>
                <button type="button" disabled={safePage === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))} className="rounded-lg border border-[#d9d0bd] bg-[#f7f2ea] px-3 py-1.5 text-sm text-[#1f2430] disabled:cursor-not-allowed disabled:opacity-50">Next</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
