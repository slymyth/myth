import React from 'react';
import { Mail, RotateCcw, Download } from 'lucide-react';

interface HeaderProps {
  messageCount: number;
  recipientCount: number;
  openedCount: number;
  sentTodayCount: number;
  onResetDemo: () => void;
  onExportBackup: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  messageCount,
  recipientCount,
  openedCount,
  sentTodayCount,
  onResetDemo,
  onExportBackup,
}) => {
  const stats = [
    { label: 'Messages', value: messageCount },
    { label: 'Recipients', value: recipientCount },
    { label: 'Opened', value: openedCount },
    { label: 'Sent today', value: sentTodayCount },
  ];

  return (
    <header className="bg-brand text-brand-foreground border-b border-white/5">
      <div className="mx-auto max-w-5xl px-5 py-8 sm:py-10">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-inner">
              <Mail className="size-5" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-400/90">
                  Mythsuite
                </p>
                <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400 border border-amber-500/20">
                  Outreach Flow
                </span>
              </div>
              <h1 className="text-xl font-bold tracking-tight sm:text-3xl text-white mt-0.5">
                Rotating outreach manager
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={onExportBackup}
              title="Export workspace backup (JSON)"
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            >
              <Download className="size-3.5" />
              <span>Backup</span>
            </button>
            <button
              onClick={onResetDemo}
              title="Reset to default sample data"
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            >
              <RotateCcw className="size-3.5" />
              <span>Reset demo</span>
            </button>
          </div>
        </div>

        <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">
          Write three (or more) different message bodies. Each store owner gets the next one in rotation, so your outreach never looks like the same copy-paste email.
        </p>

        {/* 4 Stats counters matching Mythsuite */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          {stats.map((stat, idx) => (
            <div
              key={stat.label}
              className="anim-rise min-w-0 rounded-xl bg-white/[0.04] border border-white/10 px-3 py-3 text-center sm:px-4 backdrop-blur-sm"
              style={{ animationDelay: `${idx * 80}ms` }}
            >
              <strong className="block text-xl sm:text-2xl font-bold text-white tracking-tight">
                {stat.value}
              </strong>
              <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wider text-slate-400 mt-0.5 block">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </header>
  );
};
