import React, { useState } from 'react';
import { UserCheck, Plus, Trash2, Mail } from 'lucide-react';
import { SenderProfile } from '../types';

interface SendersTabProps {
  senders: SenderProfile[];
  onToggleSender: (id: string, enabled: boolean) => void;
  onAddSender: (sender: Omit<SenderProfile, 'id' | 'sentToday'>) => void;
  onDeleteSender: (id: string) => void;
}

export const SendersTab: React.FC<SendersTabProps> = ({
  senders,
  onToggleSender,
  onAddSender,
  onDeleteSender,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Growth Consultant');
  const [company, setCompany] = useState('Mythsuite');
  const [limit, setLimit] = useState('50');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    onAddSender({
      name: name.trim() || email.split('@')[0],
      email: email.trim().toLowerCase(),
      role: role.trim(),
      company: company.trim(),
      dailyLimit: Math.max(1, parseInt(limit, 10) || 50),
      enabled: true,
    });
    setName('');
    setEmail('');
    setShowAddForm(false);
  };

  const activeSenders = senders.filter((s) => s.enabled);
  const totalCapacity = activeSenders.reduce((acc, s) => acc + s.dailyLimit, 0);
  const totalSent = activeSenders.reduce((acc, s) => acc + s.sentToday, 0);

  return (
    <div className="space-y-5">
      {/* Sender Rotation Overview Card */}
      <section className="anim-card rounded-xl border border-white/10 bg-card p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <UserCheck className="size-5" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-white">
                Sender Inboxes & Rotation
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Rotate multiple outbound email accounts to distribute volume, protect inbox health, and avoid spam flags.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 px-3.5 py-2 text-xs font-semibold shadow-sm transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Plus className="size-3.5" />
            <span>Add sender account</span>
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3 border-t border-white/10 pt-4">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Active Inboxes</span>
            <p className="text-xl font-bold text-white mt-0.5">{activeSenders.length}</p>
          </div>
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Daily Limit</span>
            <p className="text-xl font-bold text-white mt-0.5">{totalCapacity} emails/day</p>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Dispatched Today</span>
            <p className="text-xl font-bold text-amber-400 mt-0.5">
              {totalSent} <span className="text-xs font-normal text-slate-400">/ {totalCapacity}</span>
            </p>
          </div>
        </div>
      </section>

      {/* Add Sender Form */}
      {showAddForm && (
        <form
          onSubmit={handleSubmit}
          className="anim-slide rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 space-y-4"
        >
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Mail className="size-4 text-amber-400" />
            <span>Connect New Sending Account</span>
          </h3>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-semibold text-slate-300">
              Sender Name
              <input
                type="text"
                required
                placeholder="e.g. Alex Morgan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 flex h-9 w-full rounded-md border border-white/15 bg-black/20 px-3 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
            </label>

            <label className="block text-xs font-semibold text-slate-300">
              Sender Email Address
              <input
                type="email"
                required
                placeholder="e.g. alex@mythsuite.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 flex h-9 w-full rounded-md border border-white/15 bg-black/20 px-3 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
            </label>

            <label className="block text-xs font-semibold text-slate-300">
              Job Title / Role
              <input
                type="text"
                placeholder="e.g. Growth Consultant"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="mt-1 flex h-9 w-full rounded-md border border-white/15 bg-black/20 px-3 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
            </label>

            <label className="block text-xs font-semibold text-slate-300">
              Daily Safe Sending Limit
              <input
                type="number"
                min={5}
                max={500}
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                className="mt-1 flex h-9 w-full rounded-md border border-white/15 bg-black/20 px-3 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
            </label>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              className="rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 text-xs font-semibold transition-colors cursor-pointer"
            >
              Save sender
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-white/10 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Senders List */}
      <div className="space-y-3">
        {senders.map((sender) => {
          const percentUsed = Math.min(Math.round((sender.sentToday / sender.dailyLimit) * 100), 100);

          return (
            <div
              key={sender.id}
              className={`anim-card rounded-xl border p-4 transition-all ${
                sender.enabled
                  ? 'border-white/10 bg-card'
                  : 'border-white/5 bg-white/[0.02] opacity-60'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-full bg-amber-500/15 text-amber-400 font-bold text-xs border border-amber-500/30">
                    {sender.name.charAt(0).toUpperCase()}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <b className="text-sm font-semibold text-white">
                        {sender.name}
                      </b>
                      <span className="text-xs text-slate-400">· {sender.role}</span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono">
                      {sender.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 self-end sm:self-auto">
                  <div className="text-right">
                    <span className="text-xs font-semibold text-slate-300">
                      {sender.sentToday} / {sender.dailyLimit} sent
                    </span>
                    <div className="w-28 h-1.5 bg-black/40 rounded-full mt-1 overflow-hidden border border-white/5">
                      <div
                        className={`h-full rounded-full ${
                          percentUsed > 80 ? 'bg-amber-400' : 'bg-emerald-400'
                        }`}
                        style={{ width: `${percentUsed}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Enable Switch Toggle */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sender.enabled}
                      onChange={(e) => onToggleSender(sender.id, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>

                  {senders.length > 1 && (
                    <button
                      type="button"
                      aria-label="Remove sender"
                      onClick={() => onDeleteSender(sender.id)}
                      className="text-slate-400 hover:text-red-400 p-1.5 rounded transition-colors cursor-pointer"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
