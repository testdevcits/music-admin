export type PageSectionItem = {
  id: string;
  label: string;
  targetId?: string;
  badge?: string | number;
};

type Props = {
  items: PageSectionItem[];
  activeId: string;
  onSelect: (item: PageSectionItem) => void;
  ariaLabel: string;
};

export function PageSectionNav({ items, activeId, onSelect, ariaLabel }: Props) {
  return <nav className="mt-3 space-y-1.5" aria-label={ariaLabel}>{items.map((item) => {
    const active = activeId === item.id;
    return <button key={item.id} type="button" onClick={() => onSelect(item)} aria-current={active ? 'location' : undefined} className={`flex w-full items-center justify-between rounded-lg border border-transparent px-3 py-2 text-left text-sm transition ${active ? 'border-primary/20 bg-navy-soft font-bold text-navy' : 'text-muted hover:border-border hover:bg-surface-soft hover:text-navy'}`}><span>{item.label}</span>{item.badge !== undefined && <span className={`min-w-7 rounded-full px-2 py-0.5 text-center text-xs font-semibold ${active ? 'bg-white text-navy' : 'bg-surface-soft text-muted'}`}>{item.badge}</span>}</button>;
  })}</nav>;
}
