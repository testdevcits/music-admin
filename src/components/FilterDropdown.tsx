import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { createPortal } from 'react-dom';

export type FilterDropdownOption = { value: string; label: string };

type FilterDropdownProps = {
  label: string;
  value: string;
  options: FilterDropdownOption[];
  onChange: (value: string) => void;
};

export function FilterDropdown({ label, value, options, onChange }: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ left: 0, top: 0, width: 112 });
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target) && !menuRef.current?.contains(event.target)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const updatePosition = () => {
      const rect = rootRef.current?.getBoundingClientRect();
      if (rect) {
        const menuHeight = Math.min(options.length * 36 + 8, 320);
        const top = rect.bottom + menuHeight + 5 > window.innerHeight ? Math.max(8, rect.top - menuHeight - 5) : rect.bottom + 5;
        setPosition({ left: rect.left, top, width: Math.max(rect.width, 144) });
      }
    };
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open, options.length]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="inline-flex h-[34px] min-w-[112px] items-center justify-between gap-3 rounded-lg border border-border bg-white px-2.5 text-xs font-medium text-ink shadow-sm transition hover:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        <span className="truncate">{selected?.label ?? label}</span>
        <ChevronDown size={14} className={`shrink-0 text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && createPortal(
        <div ref={menuRef} role="listbox" aria-label={label} style={{ position: 'fixed', left: position.left, top: position.top, minWidth: position.width, zIndex: 10000, maxHeight: 'min(20rem, calc(100vh - 1rem))' }} className="overflow-y-auto rounded-lg border border-border bg-white p-1 shadow-xl">
          {options.map((option) => (
            <button
              type="button"
              role="option"
              aria-selected={option.value === value}
              key={option.value}
              onClick={() => { onChange(option.value); setOpen(false); }}
              className="flex w-full items-center justify-between gap-4 whitespace-nowrap rounded-md px-2.5 py-2 text-left text-xs text-ink transition hover:bg-surface-soft"
            >
              {option.label}
              {option.value === value && <Check size={13} className="text-gold-dark" />}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </div>
  );
}
