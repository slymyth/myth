import React, { useRef } from 'react';
import { UserPlus, ClipboardList, Upload, Users, Trash2, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Recipient } from '../types';
import { resolveRecipientName, isValidEmail } from '../utils/helpers';

interface RecipientsTabProps {
  recipients: Recipient[];
  newEmail: string;
  newName: string;
  pasted: string;
  setNewEmail: (val: string) => void;
  setNewName: (val: string) => void;
  setPasted: (val: string) => void;
  addRecipients: (list: { email: string; name?: string }[]) => void;
  remove: (id: string) => void;
  clear: () => void;
  onError: (msg: string) => void;
}

export const RecipientsTab: React.FC<RecipientsTabProps> = ({
  recipients,
  newEmail,
  newName,
  pasted,
  setNewEmail,
  setNewName,
  setPasted,
  addRecipients,
  remove,
  clear,
  onError,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSingleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) {
      onError('Please enter an email address.');
      return;
    }
    addRecipients([{ email: newEmail.trim(), name: newName.trim() }]);
  };

  const handlePasteImport = () => {
    if (!pasted.trim()) {
      onError('Paste one or more emails to import.');
      return;
    }
    const lines = pasted.split(/\r?\n/).filter(Boolean);
    const parsed = lines.map((line) => {
      const parts = line.split(',');
      const email = (parts[0] || '').trim();
      const name = (parts[1] || '').trim();
      return { email, name };
    });
    addRecipients(parsed);
  };

  const handleFileChange = async (file: File | undefined) => {
    if (!file) return;
    try {
      const fileName = file.name.toLowerCase();
      if (fileName.endsWith('.csv') || fileName.endsWith('.txt')) {
        const text = await file.text();
        const lines = text.split(/\r?\n/).filter(Boolean);
        const parsed = lines.map((l) => {
          const parts = l.split(/[,;\t]/);
          const email = (parts[0] || '').trim();
          const name = (parts[1] || '').trim();
          return { email, name };
        }).filter((item) => isValidEmail(item.email));
        addRecipients(parsed);
      } else {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) throw new Error('File has no sheets');
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json<any>(sheet, { header: 1 });
        const rawStrings = json.flatMap((row) => Object.values(row).map(String));
        const extracted = rawStrings
          .flatMap((s) => s.split(/[\s,;]+/))
          .filter(isValidEmail)
          .map((email) => ({ email, name: '' }));
        addRecipients(extracted);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch {
      onError('That file could not be imported. Use CSV, Excel, or a text file.');
    }
  };

  const handleExportCsv = () => {
    if (!recipients.length) return;
    const header = 'Email,Name\n';
    const rows = recipients.map((r) => `"${r.email}","${r.name || resolveRecipientName(r)}"`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mythsuite-recipients-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        {/* Add single recipient */}
        <section className="anim-card rounded-xl border border-white/10 bg-card p-5 shadow-sm">
          <h2 className="flex items-center gap-2 font-semibold text-white">
            <UserPlus className="size-4 text-amber-400" />
            <span>Add a store owner</span>
          </h2>

          <form onSubmit={handleSingleAdd} className="mt-4 space-y-3">
            <label className="block text-xs font-semibold text-slate-300">
              Email
              <input
                type="email"
                placeholder="owner@store.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="mt-1 flex h-9 w-full rounded-md border border-white/15 bg-black/20 px-3 py-1 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
            </label>

            <label className="block text-xs font-semibold text-slate-300">
              Name <span className="font-normal text-slate-500">(optional)</span>
              <input
                type="text"
                placeholder="Store or owner name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="mt-1 flex h-9 w-full rounded-md border border-white/15 bg-black/20 px-3 py-1 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
            </label>

            <button
              type="submit"
              className="mt-2 inline-flex items-center justify-center rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 text-sm font-semibold shadow-sm transition-colors cursor-pointer w-full sm:w-auto"
            >
              Add recipient
            </button>
          </form>
        </section>

        {/* Paste list */}
        <section className="anim-card rounded-xl border border-white/10 bg-card p-5 shadow-sm">
          <h2 className="flex items-center gap-2 font-semibold text-white">
            <ClipboardList className="size-4 text-amber-400" />
            <span>Paste a list</span>
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            One email per line (or email, name) — duplicate addresses are removed automatically.
          </p>

          <textarea
            rows={3}
            placeholder={`ada@adasshop.com\nowner@brightsneakers.co, Daniel\nsofia@verdantplants.shop`}
            value={pasted}
            onChange={(e) => setPasted(e.target.value)}
            className="mt-3 flex w-full rounded-md border border-white/15 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400 font-mono text-xs leading-5"
          />

          <button
            type="button"
            onClick={handlePasteImport}
            className="mt-3 inline-flex items-center justify-center rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 text-sm font-semibold shadow-sm transition-colors cursor-pointer"
          >
            Import list
          </button>
        </section>
      </div>

      {/* Import from file */}
      <section className="anim-card rounded-xl border border-white/10 bg-card p-5 shadow-sm">
        <h2 className="flex items-center gap-2 font-semibold text-white">
          <Upload className="size-4 text-amber-400" />
          <span>Import from a file</span>
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Choose an Excel (.xlsx), CSV, or text file — duplicate email addresses are removed automatically.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition-colors">
            <Upload className="size-4 text-amber-400" />
            <span>Choose a file</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv,.txt"
              onChange={(e) => handleFileChange(e.target.files?.[0])}
              className="sr-only"
            />
          </label>
          <span className="text-xs text-slate-500">Supports .csv, .xlsx, .txt</span>
        </div>
      </section>

      {/* Recipient list */}
      <section className="anim-card rounded-xl border border-white/10 bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-semibold text-white">
            <Users className="size-4 text-amber-400" />
            <span>Your list ({recipients.length})</span>
          </h2>

          <div className="flex items-center gap-2">
            {recipients.length > 0 && (
              <button
                type="button"
                onClick={handleExportCsv}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
              >
                <Download className="size-3.5" />
                <span>Export CSV</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (window.confirm('Clear every recipient?')) {
                  clear();
                }
              }}
              className="text-xs font-medium text-slate-400 hover:text-red-400 px-2 py-1 transition-colors cursor-pointer"
            >
              Clear all
            </button>
          </div>
        </div>

        <div className="mt-4 divide-y divide-white/5 max-h-[500px] overflow-y-auto pr-1">
          {recipients.map((r, idx) => {
            const displayName = resolveRecipientName(r);
            const initial = displayName.charAt(0).toUpperCase() || 'O';

            return (
              <div
                key={r.id}
                className="anim-fade flex items-center gap-3 py-3"
                style={{ animationDelay: `${Math.min(idx * 30, 300)}ms` }}
              >
                <span className="anim-pop grid size-9 place-items-center rounded-full bg-slate-800 text-amber-400 font-bold border border-white/10 text-sm">
                  {initial}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <b className="block text-sm font-semibold text-white truncate">
                      {displayName}
                    </b>
                    {r.skipped && (
                      <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400 border border-white/5">
                        Skipped
                      </span>
                    )}
                  </div>
                  <span className="block truncate text-xs text-slate-400">
                    {r.email}
                  </span>
                </div>

                <button
                  type="button"
                  aria-label={`Remove ${r.email}`}
                  onClick={() => remove(r.id)}
                  className="rounded-lg p-1.5 text-slate-400 hover:text-red-400 hover:bg-white/5 transition-colors cursor-pointer ml-auto"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            );
          })}

          {!recipients.length && (
            <p className="py-12 text-center text-sm text-slate-500">
              No recipients yet. Add individual store owners, paste a batch list, or upload a CSV file above.
            </p>
          )}
        </div>
      </section>
    </div>
  );
};
