import React from 'react';
import {
  Send,
  Zap,
  RefreshCw,
  Plus,
  Trash2,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  Copy,
  Check,
} from 'lucide-react';
import { MessageTemplate, Recipient, RotationMode } from '../types';
import { SignatureEditor } from './SignatureEditor';
import { interpolate, getFullEmailBody } from '../utils/helpers';

interface MessagesTabProps {
  messages: MessageTemplate[];
  activeMessages: MessageTemplate[];
  recipients: Recipient[];
  cursor: number;
  nextRecipient: Recipient | undefined;
  nextMessage: MessageTemplate | undefined;
  rotation: RotationMode;
  busy: string;
  onAdvance: (skip?: boolean) => void;
  onRotation: (mode: RotationMode) => void;
  onChange: (id: string, updates: Partial<MessageTemplate>) => void;
  onSignatureChange: (id: string, updates: any) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  onGenerateAiVariation?: () => void;
  onSpam: (message: MessageTemplate) => void;
  autoCount: string;
  setAutoCount: (val: string) => void;
  autoInterval: string;
  setAutoInterval: (val: string) => void;
  autoUnit: 'seconds' | 'minutes';
  setAutoUnit: (val: 'seconds' | 'minutes') => void;
  autoRunning: boolean;
  onAuto: () => void;
  onStopAuto: () => void;
}

export const MessagesTab: React.FC<MessagesTabProps> = ({
  messages,
  recipients,
  nextRecipient,
  nextMessage,
  rotation,
  busy,
  onAdvance,
  onRotation,
  onChange,
  onSignatureChange,
  onDelete,
  onAdd,
  onGenerateAiVariation,
  onSpam,
  autoCount,
  setAutoCount,
  autoInterval,
  setAutoInterval,
  autoUnit,
  setAutoUnit,
  autoRunning,
  onAuto,
  onStopAuto,
}) => {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const handleCopyPrepared = (msg: MessageTemplate, r: Recipient) => {
    const subject = interpolate(msg.subject, r);
    const body = getFullEmailBody(msg, r);
    navigator.clipboard.writeText(`To: ${r.email}\nSubject: ${subject}\n\n${body}`);
    setCopiedId(msg.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-5">
      {/* 1. Send next email card */}
      <section className="anim-card rounded-xl border border-white/10 bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2 font-semibold text-white">
          <Send className="size-4 text-amber-400" />
          <span>Send next email</span>
        </div>

        <p className="mt-2 text-sm text-slate-300">
          {nextRecipient && nextMessage ? (
            <>
              Next: <b className="text-white font-medium">{nextRecipient.email}</b> ·{' '}
              <span className="text-amber-400 font-medium">{nextMessage.label}</span> ·{' '}
              <span className="text-slate-400">{recipients.length} left</span>
            </>
          ) : messages.length && !recipients.length ? (
            'Everyone on your list has been emailed — 0 left. It stops here and does not start over. Add new recipients to keep going.'
          ) : (
            'Add an active message and a recipient to begin.'
          )}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            disabled={!nextRecipient || !!busy}
            onClick={() => onAdvance(true)}
            className="inline-flex items-center justify-center rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            Skip
          </button>

          <button
            type="button"
            disabled={!nextRecipient || !nextMessage || !!busy}
            onClick={() => onAdvance(false)}
            className="inline-flex items-center gap-2 justify-center rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 text-sm font-semibold shadow-md shadow-amber-500/10 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            <Send className="size-4" />
            <span>Open in mail app</span>
          </button>

          {nextRecipient && nextMessage && (
            <button
              type="button"
              onClick={() => handleCopyPrepared(nextMessage, nextRecipient)}
              title="Copy subject and body to clipboard"
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            >
              {copiedId === nextMessage.id ? (
                <>
                  <Check className="size-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="size-3.5" />
                  <span>Copy text</span>
                </>
              )}
            </button>
          )}
        </div>
      </section>

      {/* 2. Auto open mail app card */}
      <section className="anim-card rounded-xl border border-white/10 bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2 font-semibold text-white">
          <Zap className={`size-4 text-amber-400 ${autoRunning ? 'anim-pulse' : ''}`} />
          <span>Auto open mail app</span>
        </div>

        <p className="mt-1 text-xs text-slate-400 leading-relaxed">
          Automatically opens a prepared email for each person in the rotation, one after another. It stops when it reaches your limit — or on its own after everyone on your list has been opened.
        </p>

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="block text-xs font-semibold text-slate-300">
            How many before it stops
            <input
              type="number"
              min={1}
              value={autoCount}
              onChange={(e) => setAutoCount(e.target.value)}
              disabled={autoRunning}
              className="mt-1 flex h-9 w-28 rounded-md border border-white/15 bg-black/20 px-3 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-400 disabled:opacity-50"
            />
          </label>

          <label className="block text-xs font-semibold text-slate-300">
            Wait between each
            <input
              type="number"
              min={0.5}
              max={60}
              step={0.5}
              value={autoInterval}
              onChange={(e) => setAutoInterval(e.target.value)}
              disabled={autoRunning}
              className="mt-1 flex h-9 w-24 rounded-md border border-white/15 bg-black/20 px-3 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-400 disabled:opacity-50"
            />
          </label>

          <label className="block text-xs font-semibold text-slate-300">
            Unit
            <select
              value={autoUnit}
              onChange={(e) => setAutoUnit(e.target.value as 'seconds' | 'minutes')}
              disabled={autoRunning}
              className="mt-1 block h-9 rounded-md border border-white/15 bg-slate-900 px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-400 disabled:opacity-50"
            >
              <option value="seconds">seconds</option>
              <option value="minutes">minutes</option>
            </select>
          </label>

          {autoRunning ? (
            <button
              type="button"
              onClick={onStopAuto}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/50 bg-red-500/10 hover:bg-red-500/20 text-red-300 px-4 py-2 text-sm font-semibold transition-colors cursor-pointer"
            >
              <span>Stop auto send</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={!nextRecipient || !nextMessage}
              onClick={onAuto}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 text-sm font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <Zap className="size-4" />
              <span>Start auto send</span>
            </button>
          )}
        </div>
      </section>

      {/* 3. Rotation style card */}
      <section className="anim-card rounded-xl border border-white/10 bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2 font-semibold text-white">
          <RefreshCw className="size-4 text-amber-400" />
          <span>Rotation style</span>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          How the next message body is picked for each recipient.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onRotation('ordered')}
            className={`rounded-xl border p-4 text-left transition-all cursor-pointer ${
              rotation === 'ordered'
                ? 'border-amber-400 bg-amber-500/10 ring-1 ring-amber-400'
                : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05]'
            }`}
          >
            <b className="block text-sm font-semibold text-white">In order</b>
            <small className="mt-1 block font-normal text-xs text-slate-400">
              Message 1, then 2, then 3, then back to 1.
            </small>
          </button>

          <button
            type="button"
            onClick={() => onRotation('shuffled')}
            className={`rounded-xl border p-4 text-left transition-all cursor-pointer ${
              rotation === 'shuffled'
                ? 'border-amber-400 bg-amber-500/10 ring-1 ring-amber-400'
                : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05]'
            }`}
          >
            <b className="block text-sm font-semibold text-white">Shuffled</b>
            <small className="mt-1 block font-normal text-xs text-slate-400">
              Random order, but every message is used equally often.
            </small>
          </button>
        </div>
      </section>

      {/* 4. Message templates list */}
      {messages.map((message, idx) => {
        const isSpamHigh = message.spam_score !== null && message.spam_score > 30;

        return (
          <section
            key={message.id}
            className="anim-card rounded-xl border border-white/10 bg-card p-5 shadow-sm anim-rise space-y-4"
            style={{ animationDelay: `${idx * 70}ms` }}
          >
            <div className="flex items-center gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-amber-500/15 text-sm font-bold text-amber-400 border border-amber-500/30">
                {idx + 1}
              </span>

              <input
                type="text"
                aria-label={`Message ${idx + 1} name`}
                value={message.label}
                onChange={(e) => onChange(message.id, { label: e.target.value })}
                className="flex h-9 w-full rounded-md border border-white/15 bg-black/20 px-3 py-1 text-sm font-medium text-white focus:outline-none focus:ring-1 focus:ring-amber-400 sm:max-w-44"
              />

              <div className="ml-auto flex shrink-0 items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={message.enabled}
                    onChange={(e) => onChange(message.id, { enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                </label>

                {messages.length > 1 && (
                  <button
                    type="button"
                    aria-label={`Delete ${message.label}`}
                    onClick={() => onDelete(message.id)}
                    className="rounded-lg p-1.5 text-slate-400 hover:text-red-400 hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>
            </div>

            <label className="block text-xs font-semibold text-slate-300">
              Subject
              <input
                type="text"
                value={message.subject}
                onChange={(e) => onChange(message.id, { subject: e.target.value })}
                className="mt-1 flex h-9 w-full rounded-md border border-white/15 bg-black/20 px-3 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
            </label>

            <label className="block text-xs font-semibold text-slate-300">
              Message body
              <textarea
                rows={6}
                value={message.body}
                onChange={(e) => onChange(message.id, { body: e.target.value })}
                className="mt-1 flex w-full rounded-md border border-white/15 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400 resize-y leading-6 font-sans"
              />
            </label>

            <p className="text-xs text-slate-400">
              Use <code className="text-amber-400 bg-amber-500/10 px-1 py-0.5 rounded font-mono">{'{name}'}</code> — it fills in the person&apos;s name, or the store name for general addresses.
            </p>

            {/* Signature component */}
            <SignatureEditor
              signature={message.signature}
              onChange={(sig) => onSignatureChange(message.id, sig)}
              messageId={message.id}
            />

            {/* Spam score banner */}
            <div
              className={`flex flex-wrap items-center gap-2 rounded-lg px-3 py-2 text-xs border ${
                isSpamHigh
                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
              }`}
            >
              {isSpamHigh ? (
                <AlertTriangle className="size-4 shrink-0 text-amber-400" />
              ) : (
                <ShieldCheck className="size-4 shrink-0 text-emerald-400" />
              )}
              <b>Spam score {message.spam_score ?? 0}/100</b>
              {message.risky_words.length > 0 && (
                <span className="text-slate-300">
                  · risky words: <span className="underline decoration-dotted">{message.risky_words.join(', ')}</span>
                </span>
              )}
            </div>

            {/* AI Spam check button bar */}
            <div className="flex items-center justify-between border-t border-white/10 pt-3">
              <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-amber-400" />
                AI spam check
              </span>

              <button
                type="button"
                disabled={busy === `spam-${message.id}`}
                onClick={() => onSpam(message)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {busy === `spam-${message.id}` ? 'Checking…' : 'Check with AI'}
              </button>
            </div>
          </section>
        );
      })}

      {/* Add buttons: New template & AI Generated variation */}
      <div className="grid sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-white/[0.02] hover:bg-white/[0.06] p-3 text-sm font-medium text-slate-200 transition-colors cursor-pointer"
        >
          <Plus className="size-4" />
          <span>Add another message body</span>
        </button>

        {onGenerateAiVariation && (
          <button
            type="button"
            disabled={busy === 'ai-variation'}
            onClick={onGenerateAiVariation}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/15 p-3 text-sm font-medium text-amber-300 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="size-4 text-amber-400" />
            <span>{busy === 'ai-variation' ? 'Generating variation…' : 'Generate with AI'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
