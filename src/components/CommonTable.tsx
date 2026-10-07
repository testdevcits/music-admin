import { LoaderCircle } from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';

export type CommonTableColumn<T> = {
  key: string;
  title: string;
  className?: string;
  render: (row: T) => ReactNode;
};

type Props<T> = {
  rows: T[];
  columns: CommonTableColumn<T>[];
  rowKey: (row: T) => string;
  loading?: boolean;
  pageSize?: number;
  emptyMessage: string;
};

export function CommonTable<T>({ rows, columns, rowKey, loading = false, pageSize = 10, emptyMessage }: Props<T>) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const visibleRows = rows.slice((safePage - 1) * pageSize, safePage * pageSize);
  const from = rows.length ? (safePage - 1) * pageSize + 1 : 0;
  const to = Math.min(safePage * pageSize, rows.length);

  return <div className="overflow-hidden bg-white">
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] text-left">
        <thead className="border-b border-border bg-surface-soft text-[11px] uppercase tracking-wide text-muted"><tr>{columns.map((column) => <th key={column.key} className={`px-4 py-3 font-semibold ${column.className || ''}`}>{column.title}</th>)}</tr></thead>
        <tbody className="divide-y divide-border">
          {loading ? <tr><td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-muted"><LoaderCircle className="mr-2 inline animate-spin" size={16} />Loading records…</td></tr>
            : rows.length === 0 ? <tr><td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-muted">{emptyMessage}</td></tr>
              : visibleRows.map((row) => <tr key={rowKey(row)} className="hover:bg-surface-soft/60">{columns.map((column) => <td key={column.key} className={`px-4 py-3 ${column.className || ''}`}>{column.render(row)}</td>)}</tr>)}
        </tbody>
      </table>
    </div>
    <footer className="flex flex-col gap-3 border-t border-border px-4 py-3 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
      <span>Showing {from}–{to} of {rows.length.toLocaleString()}</span>
      <div className="flex items-center gap-2">
        <button type="button" className="rounded-lg border border-border bg-white px-3 py-1.5 font-semibold text-navy disabled:cursor-not-allowed disabled:opacity-45" disabled={safePage <= 1 || loading} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</button>
        <span className="min-w-16 text-center">Page {safePage} / {pageCount}</span>
        <button type="button" className="rounded-lg border border-border bg-white px-3 py-1.5 font-semibold text-navy disabled:cursor-not-allowed disabled:opacity-45" disabled={safePage >= pageCount || loading} onClick={() => setPage((current) => Math.min(pageCount, current + 1))}>Next</button>
      </div>
    </footer>
  </div>;
}
