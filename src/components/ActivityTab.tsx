import React, { useState, useMemo } from 'react';
import { History, CheckCircle2, Clock, Trash2, Download, Search, X, Filter } from 'lucide-react';
import { OutreachEvent } from '../types';

interface ActivityTabProps {
  events: OutreachEvent[];
  onClearHistory: () => void;
}

export const ActivityTab: React.FC<ActivityTabProps> = ({ events, onClearHistory }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('all');

  // Last 12 hours filter
  const twelveHoursAgo = Date.now() - 12 * 60 * 60 * 1000;
  const recentEvents = events.filter((e) => new Date(e.sent_at).getTime() >= twelveHoursAgo);

  const uniquePeople = new Set(recentEvents.map((e) => e.recipient_email.toLowerCase())).size;

  const messageFrequency = recentEvents.reduce<Record<string, number>>((acc, ev) => {
    acc[ev.message_label] = (acc[ev.message_label] || 0) + 1;
    return acc;
  }, {});

  const mostUsedMessage =
    Object.entries(messageFrequency).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

  const hourFrequency = recentEvents.reduce<Record<string, number>>((acc, ev) => {
    const hour = new Date(ev.sent_at).getHours().toString();
    acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {});

  const busiestHourRaw = Object.entries(hourFrequency).sort((a, b) => b[1] - a[1])[0]?.[0];
  const busiestHour = busiestHourRaw ? `${busiestHourRaw.padStart(2, '0')}:00` : '—';

  // Extract unique templates for the filter dropdown
  const uniqueTemplates = useMemo(() => {
    const labels = new Set(events.map((e) => e.message_label).filter(Boolean));
    return Array.from(labels);
  }, [events]);

  // Filtered events by search query (name or email) and message template
  const filteredEvents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return events.filter((ev) => {
      const matchesSearch =
        !query ||
        ev.recipient_email.toLowerCase().includes(query) ||
        (ev.recipient_name && ev.recipient_name.toLowerCase().includes(query)) ||
        (ev.subject && ev.subject.toLowerCase().includes(query));

      const matchesTemplate =
        selectedTemplate === 'all' || ev.message_label === selectedTemplate;

      return matchesSearch && matchesTemplate;
    });
  }, [events, searchQuery, selectedTemplate]);

  const handleExportCsv = () => {
    const exportData = filteredEvents.length ? filteredEvents : events;
    if (!exportData.length) return;
    const header = 'Timestamp,Recipient Name,Recipient Email,Message Template,Subject\n';
    const rows = exportData
      .map(
        (e) =>
          `"${e.sent_at}","${e.recipient_name}","${e.recipient_email}","${e.message_label}","${e.subject.replace(/"/g, '""')}"`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mythsuite-outreach-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isFiltering = Boolean(searchQuery.trim() || selectedTemplate !== 'all');

  return (
    <div className="space-y-5">
      {/* Analytics stats */}
      <section className="anim-card rounded-xl border border-white/10 bg-card p-5 shadow-sm">
        <h2 className="flex items-center gap-2 font-semibold text-white">
          <Clock className="size-4 text-amber-400" />
          <span>Last 12 hours</span>
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Emails prepared in your mail app.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { value: recentEvents.length, label: 'Emails opened' },
            { value: uniquePeople, label: 'People prepared' },
            { value: mostUsedMessage, label: 'Most used' },
            { value: busiestHour, label: 'Busiest hour' },
          ].map((stat, idx) => (
            <div
              key={stat.label}
              className="anim-rise rounded-xl bg-white/[0.03] border border-white/5 p-4"
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              <b className="block text-2xl font-bold text-white tracking-tight">
                {stat.value}
              </b>
              <span className="mt-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Email dispatch history */}
      <section className="anim-card rounded-xl border border-white/10 bg-card p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="flex items-center gap-2 font-semibold text-white">
                <History className="size-4 text-amber-400" />
                <span>Email history</span>
              </h2>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-medium text-slate-300">
                {events.length} total
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Every email opened and the message body it used.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {events.length > 0 && (
              <button
                type="button"
                onClick={handleExportCsv}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                title={isFiltering ? 'Export filtered results' : 'Export all events'}
              >
                <Download className="size-3.5" />
                <span>Export {isFiltering ? 'filtered' : 'log'}</span>
              </button>
            )}

            {events.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Clear your entire email outreach history?')) {
                    onClearHistory();
                  }
                }}
                className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-white/10 transition-colors cursor-pointer"
              >
                <Trash2 className="size-3.5" />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        {events.length > 0 && (
          <div className="mt-4 flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 size-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by recipient name or email..."
                className="w-full rounded-lg border border-white/15 bg-black/25 pl-9 pr-9 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 p-0.5 rounded text-slate-400 hover:text-white transition-colors"
                  title="Clear search"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Template Filter Dropdown */}
            {uniqueTemplates.length > 1 && (
              <div className="flex items-center gap-1.5 shrink-0">
                <Filter className="size-3.5 text-slate-400" />
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="h-8 rounded-lg border border-white/15 bg-slate-900 px-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-400"
                >
                  <option value="all">All message variations</option>
                  {uniqueTemplates.map((label) => (
                    <option key={label} value={label}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Filter Summary Bar */}
        {isFiltering && (
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 bg-white/[0.03] px-3 py-1.5 rounded-lg border border-white/5">
            <span>
              Showing <b className="text-white">{filteredEvents.length}</b> of {events.length} events
              {searchQuery && (
                <> for &ldquo;<span className="text-amber-400">{searchQuery}</span>&rdquo;</>
              )}
              {selectedTemplate !== 'all' && (
                <> (template: <span className="text-amber-400">{selectedTemplate}</span>)</>
              )}
            </span>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedTemplate('all');
              }}
              className="text-amber-400 hover:underline cursor-pointer font-medium ml-2"
            >
              Reset filters
            </button>
          </div>
        )}

        {/* Events List */}
        <div className="mt-4 divide-y divide-white/5 max-h-[500px] overflow-y-auto pr-1">
          {filteredEvents.map((ev, idx) => (
            <div
              key={ev.id}
              className="anim-fade flex items-start gap-3 py-3"
              style={{ animationDelay: `${Math.min(idx * 30, 300)}ms` }}
            >
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-400" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <b className="text-sm font-semibold text-white truncate">
                    {ev.recipient_name || ev.recipient_email}
                  </b>
                  <span className="text-xs text-slate-400 truncate">
                    ({ev.recipient_email})
                  </span>
                  {ev.sender_email && (
                    <span className="text-[10px] text-slate-400 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                      via {ev.sender_email}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  <span className="text-amber-400 font-medium">{ev.message_label}</span> ·{' '}
                  <span className="text-slate-300">{ev.subject}</span>
                </p>
                <time className="text-[11px] text-slate-500 mt-0.5 block">
                  {new Date(ev.sent_at).toLocaleString()}
                </time>
              </div>
            </div>
          ))}

          {events.length > 0 && filteredEvents.length === 0 && (
            <div className="py-12 text-center text-xs text-slate-400 space-y-2">
              <p>No outreach events match your search.</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedTemplate('all');
                }}
                className="text-amber-400 hover:underline font-semibold cursor-pointer"
              >
                Clear search and filters
              </button>
            </div>
          )}

          {!events.length && (
            <p className="py-12 text-center text-sm text-slate-500">
              No emails opened yet. Start sending from the Messages tab to record dispatch history.
            </p>
          )}
        </div>
      </section>
    </div>
  );
};
