import { useEffect, useState } from 'react';
import { AlertTriangle, LoaderCircle } from 'lucide-react';

type ConfirmDialogProps = {
  title: string;
  message: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
};

const buttonBase = 'inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-50';

export function ConfirmDialog({ title, message, confirmLabel = 'Delete', onCancel, onConfirm }: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !busy) onCancel();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [busy, onCancel]);

  async function confirm() {
    setBusy(true);
    try { await onConfirm(); }
    finally { setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-blackbar/60 p-4 backdrop-blur-sm" onMouseDown={() => { if (!busy) onCancel(); }}>
      <section className="w-full max-w-md rounded-2xl border border-border bg-white p-5 shadow-2xl sm:p-6" role="alertdialog" aria-modal="true" aria-labelledby="confirm-dialog-title" aria-describedby="confirm-dialog-message" onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-100 text-rose-700"><AlertTriangle size={19} /></span>
          <div className="min-w-0"><h2 id="confirm-dialog-title" className="font-bold text-ink">{title}</h2><p id="confirm-dialog-message" className="mt-1 text-sm leading-5 text-muted">{message}</p></div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className={`${buttonBase} border border-border bg-white text-navy hover:bg-surface-soft`} disabled={busy} onClick={onCancel}>Cancel</button>
          <button type="button" className={`${buttonBase} bg-danger text-white hover:bg-danger/90 focus:ring-danger/20`} disabled={busy} onClick={() => void confirm()}>{busy && <LoaderCircle className="animate-spin" size={15} />}{confirmLabel}</button>
        </div>
      </section>
    </div>
  );
}
