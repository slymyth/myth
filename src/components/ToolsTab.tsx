import React, { useState } from 'react';
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Scissors,
  BookOpen,
  Copy,
  Check,
  PlusCircle,
} from 'lucide-react';
import {
  extractEmailsFromRawText,
  verifyEmail,
  segmentList,
  COLD_EMAIL_PRESETS,
} from '../utils/helpers';

interface ToolsTabProps {
  onImportLeads: (emails: { email: string; name?: string }[]) => void;
  onAddTemplateFromPreset: (preset: { title: string; subject: string; body: string }) => void;
}

export const ToolsTab: React.FC<ToolsTabProps> = ({
  onImportLeads,
  onAddTemplateFromPreset,
}) => {
  const [activeTool, setActiveTool] = useState<'scout' | 'verify' | 'segment' | 'presets'>('scout');

  // Tool 1: URL Scout / Email Extractor
  const [rawText, setRawText] = useState('');
  const [extractedData, setExtractedData] = useState<{ emails: string[]; domains: string[] } | null>(null);
  const [copiedExtractor, setCopiedExtractor] = useState(false);

  const handleExtract = () => {
    if (!rawText.trim()) return;
    const res = extractEmailsFromRawText(rawText);
    setExtractedData(res);
  };

  const handleImportExtracted = () => {
    if (!extractedData || !extractedData.emails.length) return;
    const formatted = extractedData.emails.map((email) => ({
      email,
    }));
    onImportLeads(formatted);
  };

  // Tool 2: Email Health & Verification
  const [verifyInput, setVerifyInput] = useState('');
  const [verifyResults, setVerifyResults] = useState<{ email: string; status: string }[] | null>(null);

  const handleVerifyEmails = () => {
    if (!verifyInput.trim()) return;
    const lines = verifyInput.split(/[\r\n,;]+/).map((s) => s.trim()).filter(Boolean);
    const results = lines.map((email) => ({
      email,
      status: verifyEmail(email),
    }));
    setVerifyResults(results);
  };

  // Tool 3: List Segmentation
  const [segmentInput, setSegmentInput] = useState('');
  const [segmentSize, setSegmentSize] = useState('50');
  const [segments, setSegments] = useState<string[][] | null>(null);

  const handleSegment = () => {
    const list = segmentInput.split(/[\r\n,;]+/).map((s) => s.trim()).filter(Boolean);
    const batched = segmentList(list, parseInt(segmentSize, 10) || 50);
    setSegments(batched);
  };

  return (
    <div className="space-y-5">
      {/* Tool Navigation Pill Bar */}
      <div className="flex gap-2 overflow-x-auto border-b border-white/10 pb-3">
        {[
          { id: 'scout', label: 'URL Scout & Extractor', icon: Search },
          { id: 'verify', label: 'Email Health & Verification', icon: CheckCircle2 },
          { id: 'segment', label: 'List Segmentation', icon: Scissors },
          { id: 'presets', label: 'Cold Email Presets', icon: BookOpen },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTool(id as any)}
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTool === id
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Icon className="size-3.5" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* 1. URL Scout & Extractor */}
      {activeTool === 'scout' && (
        <section className="anim-card rounded-xl border border-white/10 bg-card p-5 shadow-sm space-y-4 anim-rise">
          <div>
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Search className="size-4 text-amber-400" />
              <span>URL Scout & Email Extractor</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Paste raw text, website copy, Google search results, or HTML snippet. Mythsuite extracts clean email addresses and target website domains automatically.
            </p>
          </div>

          <textarea
            rows={5}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Paste raw leads, website text, HTML snippet, or contact paragraphs here..."
            className="w-full rounded-lg border border-white/15 bg-black/20 p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400 font-mono"
          />

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleExtract}
              className="rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 text-xs font-semibold transition-colors cursor-pointer"
            >
              Extract Leads & Domains
            </button>
            {rawText && (
              <button
                type="button"
                onClick={() => { setRawText(''); setExtractedData(null); }}
                className="text-xs text-slate-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {extractedData && (
            <div className="mt-4 rounded-lg border border-white/10 bg-black/30 p-4 space-y-3 anim-rise">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-200">
                  Found {extractedData.emails.length} Unique Emails & {extractedData.domains.length} Domains
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(extractedData.emails.join('\n'));
                      setCopiedExtractor(true);
                      setTimeout(() => setCopiedExtractor(false), 2000);
                    }}
                    className="inline-flex items-center gap-1 text-xs text-slate-300 hover:text-white px-2 py-1 rounded bg-white/5 border border-white/10"
                  >
                    {copiedExtractor ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                    <span>{copiedExtractor ? 'Copied' : 'Copy emails'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleImportExtracted}
                    className="inline-flex items-center gap-1 text-xs text-slate-950 bg-amber-500 hover:bg-amber-400 px-2.5 py-1 rounded font-semibold transition-colors cursor-pointer"
                  >
                    <PlusCircle className="size-3" />
                    <span>Import to Recipients list</span>
                  </button>
                </div>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1 pr-1 font-mono text-xs">
                {extractedData.emails.map((em, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1 border-b border-white/5 text-slate-300">
                    <span>{em}</span>
                    <span className="text-[10px] text-slate-500">{em.split('@')[1]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* 2. Email Health & Verification */}
      {activeTool === 'verify' && (
        <section className="anim-card rounded-xl border border-white/10 bg-card p-5 shadow-sm space-y-4 anim-rise">
          <div>
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-400" />
              <span>Email Health & Deliverability Verification</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Verify your prospect list before dispatching. Detect disposable mailboxes, role-based addresses (info@, team@), and formatting syntax errors.
            </p>
          </div>

          <textarea
            rows={4}
            value={verifyInput}
            onChange={(e) => setVerifyInput(e.target.value)}
            placeholder="Enter one email per line (or comma separated) to verify..."
            className="w-full rounded-lg border border-white/15 bg-black/20 p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400 font-mono"
          />

          <button
            type="button"
            onClick={handleVerifyEmails}
            className="rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 text-xs font-semibold transition-colors cursor-pointer"
          >
            Verify Email Health
          </button>

          {verifyResults && (
            <div className="mt-4 rounded-lg border border-white/10 bg-black/30 p-4 space-y-2 anim-rise">
              <h4 className="text-xs font-bold text-slate-200">
                Verification Results ({verifyResults.length} addresses tested)
              </h4>
              <div className="divide-y divide-white/5 max-h-56 overflow-y-auto">
                {verifyResults.map((r, i) => (
                  <div key={i} className="flex items-center justify-between py-2 text-xs">
                    <span className="font-mono text-slate-200">{r.email}</span>
                    {r.status === 'valid' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        <CheckCircle2 className="size-3" /> Valid Inbox
                      </span>
                    )}
                    {r.status === 'role_based' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        <AlertTriangle className="size-3" /> Role Account (hello/team)
                      </span>
                    )}
                    {r.status === 'disposable' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                        <XCircle className="size-3" /> Risky / Invalid
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* 3. List Segmentation */}
      {activeTool === 'segment' && (
        <section className="anim-card rounded-xl border border-white/10 bg-card p-5 shadow-sm space-y-4 anim-rise">
          <div>
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Scissors className="size-4 text-amber-400" />
              <span>Email List Segmentation</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Split bulk recipient lists into staggered batches to respect daily sender quotas and warm up inboxes smoothly.
            </p>
          </div>

          <div className="grid sm:grid-cols-4 gap-3 items-end">
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Recipients List
              </label>
              <textarea
                rows={4}
                value={segmentInput}
                onChange={(e) => setSegmentInput(e.target.value)}
                placeholder="Paste list of emails to segment..."
                className="w-full rounded-lg border border-white/15 bg-black/20 p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Batch Size
              </label>
              <select
                value={segmentSize}
                onChange={(e) => setSegmentSize(e.target.value)}
                className="w-full h-10 rounded-lg border border-white/15 bg-slate-900 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
              >
                <option value="25">25 per batch</option>
                <option value="50">50 per batch</option>
                <option value="100">100 per batch</option>
                <option value="200">200 per batch</option>
              </select>
              <button
                type="button"
                onClick={handleSegment}
                className="w-full mt-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 py-2 text-xs font-semibold transition-colors cursor-pointer"
              >
                Create Batches
              </button>
            </div>
          </div>

          {segments && (
            <div className="mt-4 space-y-3 anim-rise">
              <h4 className="text-xs font-bold text-slate-200">
                Created {segments.length} Segments
              </h4>
              <div className="grid sm:grid-cols-2 gap-3">
                {segments.map((batch, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-white/10 bg-black/20 p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-400">
                        Batch {idx + 1} ({batch.length} contacts)
                      </span>
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(batch.join('\n'))}
                        className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                      >
                        <Copy className="size-3" /> Copy
                      </button>
                    </div>
                    <p className="text-[11px] font-mono text-slate-400 truncate">
                      {batch.slice(0, 3).join(', ')}{batch.length > 3 ? '...' : ''}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* 4. Preset Library */}
      {activeTool === 'presets' && (
        <section className="anim-card rounded-xl border border-white/10 bg-card p-5 shadow-sm space-y-4 anim-rise">
          <div>
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <BookOpen className="size-4 text-amber-400" />
              <span>Proven Outreach Presets</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Click &quot;Add to Messages&quot; to load directly into your Mythsuite message rotation sequence.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {COLD_EMAIL_PRESETS.map((preset, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-4 flex flex-col justify-between space-y-3"
              >
                <div>
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                    Preset {idx + 1}
                  </span>
                  <h4 className="text-sm font-semibold text-white">
                    {preset.title}
                  </h4>
                  <p className="text-xs font-medium text-slate-300 mt-2 font-mono">
                    Subj: {preset.subject}
                  </p>
                  <p className="text-xs text-slate-400 mt-2 line-clamp-4 leading-relaxed font-sans">
                    {preset.body}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onAddTemplateFromPreset(preset)}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 py-2 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <PlusCircle className="size-3.5" />
                  <span>Add to Messages</span>
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
