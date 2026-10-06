import { CheckCircle2, CircleDollarSign, FileAudio, FolderOpen, ShieldCheck, Sparkles } from 'lucide-react';

const workflowSteps = [
  {
    title: '1. Prepare catalog foundation',
    description: 'Create or update artists, categories, and tags before a release is added to the library.',
    icon: FolderOpen,
    bullets: ['Artists are kept consistent', 'Categories define browse groups', 'Tags support discoverability'],
  },
  {
    title: '2. Add the song record',
    description: 'Create the track in the music library with title, artist, language, and metadata details.',
    icon: Sparkles,
    bullets: ['Song gets a unique draft state', 'Status is visible to the admin', 'Metadata is ready for review'],
  },
  {
    title: '3. Upload audio and assets',
    description: 'Attach audio files, cover artwork, and any supporting media needed for the release.',
    icon: FileAudio,
    bullets: ['Audio file upload is validated', 'Artwork is attached to the release', 'Upload errors are visible immediately'],
  },
  {
    title: '4. Review rights and quality',
    description: 'Check contract, provider, and publishing rules before making the song public.',
    icon: ShieldCheck,
    bullets: ['License terms are reviewed', 'Quality checks are enforced', 'Publishing is limited to approved releases'],
  },
  {
    title: '5. Publish and monitor',
    description: 'Once checks pass, publish the song and track its readiness in the admin dashboard.',
    icon: CircleDollarSign,
    bullets: ['Publish toggles are controlled', 'Ready status is tracked', 'Admins can fix or remove any release quickly'],
  },
];

type MusicWorkflowPageProps = {
  activeStepId: string;
  onStepSelect?: (id: string) => void;
};

export function MusicWorkflowPage({ activeStepId, onStepSelect }: MusicWorkflowPageProps) {
  return (
    <section className="space-y-5">
      <div className="rounded-[28px] border border-border bg-white p-5 shadow-[0_16px_40px_rgba(10,15,24,0.04)] sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-dark">Release lifecycle</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-ink">View music workflow</h2>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
            <CheckCircle2 size={14} />
            Admin-ready flow
          </span>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_320px]">
          <div className="space-y-4">
            {workflowSteps.map((step, index) => {
              const Icon = step.icon;
              const id = [
                'catalog-setup',
                'song-creation',
                'audio-upload',
                'review-and-publish',
                'publish-and-monitor',
              ][index];
              const isActive = activeStepId === id;
              return (
                <button key={step.title} id={id} type="button" onClick={() => onStepSelect?.(id)} className={`block w-full rounded-2xl border p-4 text-left scroll-mt-28 transition ${isActive ? 'border-[#e35050] bg-[#fffaf6] shadow-[0_0_0_1px_rgba(227,80,80,0.14)]' : 'border-border bg-surface-soft'}`}>
                  <div className="flex items-start gap-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-band text-navy shadow-sm">
                      <Icon size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                        <span>Step {index + 1}</span>
                        <span className="h-1 w-1 rounded-full bg-border" />
                        <span>Music operations</span>
                      </div>
                      <h3 className="mt-2 text-lg font-bold text-ink">{step.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-muted">{step.description}</p>
                      <ul className="mt-3 space-y-2 text-sm text-navy">
                        {step.bullets.map((bullet) => (
                          <li key={bullet} className="flex items-start gap-2">
                            <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="rounded-2xl border border-border bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">Quick actions</p>
            <div className="mt-4 space-y-3">
              <button type="button" className="w-full rounded-xl border border-border bg-surface-soft px-3 py-2.5 text-left text-sm font-semibold text-ink hover:bg-band">
                Open music library
              </button>
              <button type="button" className="w-full rounded-xl border border-border bg-surface-soft px-3 py-2.5 text-left text-sm font-semibold text-ink hover:bg-band">
                Review catalog records
              </button>
              <button type="button" className="w-full rounded-xl border border-border bg-surface-soft px-3 py-2.5 text-left text-sm font-semibold text-ink hover:bg-band">
                Import new music
              </button>
            </div>

            <div className="mt-5 rounded-xl border border-dashed border-border bg-surface-soft p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">Admin checklist</p>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                <li>• Confirm artist and category data</li>
                <li>• Validate uploaded audio</li>
                <li>• Check rights and provider terms</li>
                <li>• Publish only after review</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
