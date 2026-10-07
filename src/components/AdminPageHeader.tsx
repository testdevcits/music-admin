import { ChevronRight } from 'lucide-react';
import type { RefObject } from 'react';

export type PageHeaderCopy = { eyebrow: string; title: string; description: string };

export function AdminPageHeader({ copy, compact, headerRef }: { copy: PageHeaderCopy; compact: boolean; headerRef: RefObject<HTMLDivElement | null> }) {
  return <div ref={headerRef} className={`sticky top-0 z-20 isolate -mx-3 bg-white px-3 sm:-mx-5 sm:px-5 lg:-mx-6 lg:px-6 ${compact ? 'min-h-10 border-b border-border py-2' : 'pb-0 pt-3 sm:pt-4'}`}>
    {compact ? (
      <div className="flex min-h-9 items-center gap-2 text-xs font-medium text-muted" aria-label="Breadcrumb">
        <span>Administration</span><ChevronRight size={14} /><span className="font-bold text-navy">{copy.title}</span>
      </div>
    ) : (
      <>
        <div className="mb-3 flex items-center gap-2 text-xs font-medium text-muted" aria-label="Breadcrumb">
          <span>Administration</span><ChevronRight size={14} /><span className="text-navy">{copy.title}</span>
        </div>
        <header className="mb-3 flex flex-col gap-2 border-b border-border pb-3 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
          <div className="min-w-0">
            <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-gold-dark">{copy.eyebrow}</p>
            <h1 className="text-3xl font-bold tracking-tight text-ink">{copy.title}</h1>
          </div>
          <p className="max-w-xl text-sm leading-5 text-muted lg:pb-1 lg:text-right">{copy.description}</p>
        </header>
      </>
    )}
  </div>;
}
