/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  MessageSquare,
  Users,
  Eye,
  Activity,
  UserCheck,
  Wrench,
  AlertCircle,
  ExternalLink,
  X,
} from 'lucide-react';
import { Header } from './components/Header';
import { MessagesTab } from './components/MessagesTab';
import { RecipientsTab } from './components/RecipientsTab';
import { SendersTab } from './components/SendersTab';
import { ToolsTab } from './components/ToolsTab';
import { RotationPreviewTab } from './components/RotationPreviewTab';
import { ActivityTab } from './components/ActivityTab';
import {
  MessageTemplate,
  Recipient,
  OutreachEvent,
  SenderProfile,
  RotationMode,
  TabView,
} from './types';
import {
  DEFAULT_MESSAGES,
  DEFAULT_RECIPIENTS,
  DEFAULT_SENDERS,
  DEFAULT_SIGNATURE,
  resolveRecipientName,
  interpolate,
  getFullEmailBody,
  clientSpamHeuristic,
  isValidEmail,
} from './utils/helpers';

const STORAGE_KEY = 'mythsuite-workspace';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabView>('messages');

  // Messages
  const [messages, setMessages] = useState<MessageTemplate[]>(() =>
    DEFAULT_MESSAGES.map((m, idx) => ({
      ...m,
      id: `message-${idx + 1}`,
      position: idx,
    }))
  );

  // Senders
  const [senders, setSenders] = useState<SenderProfile[]>(() => DEFAULT_SENDERS);

  // Recipients
  const [recipients, setRecipients] = useState<Recipient[]>(() =>
    DEFAULT_RECIPIENTS.map((r, idx) => ({
      id: `recipient-${idx + 1}`,
      name: r.name,
      email: r.email,
      position: idx,
      skipped: false,
    }))
  );

  const [events, setEvents] = useState<OutreachEvent[]>([]);
  const [rotation, setRotation] = useState<RotationMode>('ordered');
  const [cursor, setCursor] = useState<number>(0);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Status notification banner
  const [notification, setNotification] = useState<string>('');
  const [busyAction, setBusyAction] = useState<string>('');

  // Auto dispatch settings
  const [autoCount, setAutoCount] = useState<string>('5');
  const [autoInterval, setAutoInterval] = useState<string>('2');
  const [autoUnit, setAutoUnit] = useState<'seconds' | 'minutes'>('seconds');
  const [autoRunning, setAutoRunning] = useState<boolean>(false);

  // Browser security click prompt state
  const [showPromptModal, setShowPromptModal] = useState<boolean>(false);
  const promptNextRef = useRef<(() => void) | null>(null);
  const promptMailtoUrlRef = useRef<string>('');

  const stopAutoRef = useRef<boolean>(false);
  const isWindowActiveRef = useRef<boolean>(true);

  // Handle window focus & blur to pause/resume auto loop
  useEffect(() => {
    const handleFocus = () => {
      isWindowActiveRef.current = true;
    };
    const handleBlur = () => {
      isWindowActiveRef.current = false;
    };
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed.messages) && parsed.messages.length > 0) {
          setMessages(
            parsed.messages.map((m: any) => ({
              ...m,
              signature: { ...DEFAULT_SIGNATURE, ...(m.signature || {}) },
            }))
          );
        }
        if (Array.isArray(parsed.senders) && parsed.senders.length > 0) {
          setSenders(parsed.senders);
        }
        if (Array.isArray(parsed.recipients)) {
          setRecipients(parsed.recipients.filter((r: any) => r && r.email));
        }
        if (Array.isArray(parsed.events)) {
          setEvents(parsed.events);
        }
        if (parsed.rotation) {
          setRotation(parsed.rotation);
        }
        if (typeof parsed.cursor === 'number') {
          setCursor(parsed.cursor);
        }
      }
    } catch {
      setNotification('Saved workspace data could not be read.');
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save to localStorage whenever state updates
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            messages,
            senders,
            recipients,
            events,
            rotation,
            cursor,
          })
        );
      } catch (err) {
        console.error('Failed to save to localStorage:', err);
      }
    }
  }, [isLoaded, messages, senders, recipients, events, rotation, cursor]);

  const activeMessages = useMemo(
    () => messages.filter((m) => m.enabled),
    [messages]
  );

  const activeSenders = useMemo(
    () => senders.filter((s) => s.enabled),
    [senders]
  );

  const pendingRecipients = useMemo(() => {
    const openedEmails = new Set(events.map((e) => e.recipient_email.toLowerCase()));
    return recipients.filter(
      (r) => !r.skipped && !openedEmails.has(r.email.toLowerCase())
    );
  }, [recipients, events]);

  const nextRecipient = pendingRecipients[0];
  const nextMessage = activeMessages.length
    ? activeMessages[cursor % activeMessages.length]
    : undefined;

  const currentSender = activeSenders.length
    ? activeSenders[cursor % activeSenders.length]
    : undefined;

  // Single manual advance
  const handleAdvance = (skip = false) => {
    if (!nextRecipient || !nextMessage) return;

    setBusyAction(skip ? 'skip' : 'send');
    setNotification('');
    const newCursor = cursor + 1;
    setCursor(newCursor);

    if (skip) {
      setRecipients((prev) =>
        prev.map((r) => (r.id === nextRecipient.id ? { ...r, skipped: true } : r))
      );
      setNotification(`Recipient ${nextRecipient.email} skipped.`);
    } else {
      const subject = interpolate(nextMessage.subject, nextRecipient);
      const body = getFullEmailBody(nextMessage, nextRecipient);

      // Record event
      const newEvent: OutreachEvent = {
        id: crypto.randomUUID(),
        sender_email: currentSender?.email,
        recipient_email: nextRecipient.email,
        recipient_name: resolveRecipientName(nextRecipient),
        message_label: nextMessage.label,
        subject,
        sent_at: new Date().toISOString(),
        status: 'prepared',
      };
      setEvents((prev) => [newEvent, ...prev]);

      if (currentSender) {
        setSenders((prev) =>
          prev.map((s) => (s.id === currentSender.id ? { ...s, sentToday: s.sentToday + 1 } : s))
        );
      }

      const mailtoUrl = `mailto:${encodeURIComponent(nextRecipient.email)}?subject=${encodeURIComponent(
        subject
      )}&body=${encodeURIComponent(body)}`;

      window.location.href = mailtoUrl;
      setNotification(`Opened a new email for ${nextRecipient.email}.`);
    }

    setBusyAction('');
  };

  // Automated dispatch loop
  const handleStartAuto = async () => {
    if (!pendingRecipients.length) {
      setNotification(
        'Everyone on your list has been emailed — 0 left. Add more recipients to keep going.'
      );
      return;
    }
    if (!activeMessages.length) {
      setNotification('Add an active message to begin.');
      return;
    }

    const maxToSend = Math.max(1, Math.min(parseInt(autoCount, 10) || 1, pendingRecipients.length));
    const delayMs =
      Math.max(0.5, parseFloat(autoInterval) || 1) *
      (autoUnit === 'minutes' ? 60000 : 1000);

    stopAutoRef.current = false;
    setAutoRunning(true);
    setNotification('Auto send started…');

    let currentCursor = cursor;
    const queue = [...pendingRecipients];
    let dispatched = 0;

    for (let i = 0; i < maxToSend && !stopAutoRef.current; i++) {
      // Pause if tab is blurred
      while ((document.hidden || !isWindowActiveRef.current) && !stopAutoRef.current) {
        setNotification('Paused — come back to this tab to continue sending.');
        await new Promise((res) => setTimeout(res, 500));
      }

      if (stopAutoRef.current || !queue.length) break;

      const recipient = queue.shift()!;
      const message = activeMessages[currentCursor % activeMessages.length];
      const sender = activeSenders.length ? activeSenders[currentCursor % activeSenders.length] : undefined;
      const subject = interpolate(message.subject, recipient);
      const body = getFullEmailBody(message, recipient);

      const mailtoUrl = `mailto:${encodeURIComponent(recipient.email)}?subject=${encodeURIComponent(
        subject
      )}&body=${encodeURIComponent(body)}`;

      window.location.href = mailtoUrl;

      // Check if browser allowed mailto without click blocking
      let hiddenOccurred = false;
      for (let step = 0; step < 20 && !stopAutoRef.current; step++) {
        await new Promise((res) => setTimeout(res, 100));
        if (document.hidden || !isWindowActiveRef.current) {
          hiddenOccurred = true;
          break;
        }
      }

      if (!hiddenOccurred && !stopAutoRef.current) {
        setNotification('Your browser needs a click to open the next email in mail app.');
        await new Promise<void>((resolve) => {
          promptNextRef.current = resolve;
          promptMailtoUrlRef.current = mailtoUrl;
          setShowPromptModal(true);
        });
        setShowPromptModal(false);
        promptNextRef.current = null;
      }

      if (stopAutoRef.current) break;

      // Log event
      setEvents((prev) => [
        {
          id: crypto.randomUUID(),
          sender_email: sender?.email,
          recipient_email: recipient.email,
          recipient_name: resolveRecipientName(recipient),
          message_label: message.label,
          subject,
          sent_at: new Date().toISOString(),
          status: 'prepared',
        },
        ...prev,
      ]);

      if (sender) {
        setSenders((prev) =>
          prev.map((s) => (s.id === sender.id ? { ...s, sentToday: s.sentToday + 1 } : s))
        );
      }

      dispatched += 1;
      currentCursor += 1;
      setCursor(currentCursor);
      setNotification(`Opened ${dispatched} of ${maxToSend} emails…`);

      await new Promise((res) => setTimeout(res, 800));

      if (i < maxToSend - 1 && !stopAutoRef.current) {
        await new Promise((res) => setTimeout(res, delayMs));
      }
    }

    if (stopAutoRef.current) {
      setNotification(`Stopped after ${dispatched} emails.`);
    } else {
      setNotification(`Done — opened ${dispatched} emails in your mail app.`);
    }
    setAutoRunning(false);
  };

  const handleStopAuto = () => {
    stopAutoRef.current = true;
    if (promptNextRef.current) {
      const cb = promptNextRef.current;
      promptNextRef.current = null;
      setShowPromptModal(false);
      cb();
    }
  };

  const handlePromptContinue = () => {
    if (promptMailtoUrlRef.current) {
      window.location.href = promptMailtoUrlRef.current;
    }
    if (promptNextRef.current) {
      const cb = promptNextRef.current;
      promptNextRef.current = null;
      setShowPromptModal(false);
      cb();
    }
  };

  // Message modifications
  const handleUpdateMessage = (id: string, updates: Partial<MessageTemplate>) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
    );
  };

  const handleUpdateSignature = (id: string, sigUpdates: any) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === id
          ? { ...m, signature: { ...m.signature, ...sigUpdates } }
          : m
      )
    );
  };

  const handleDeleteMessage = (id: string) => {
    if (messages.length <= 1) {
      setNotification('Keep at least one message body.');
      return;
    }
    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  const handleAddMessage = () => {
    const nextIdx = messages.length;
    const newMsg: MessageTemplate = {
      id: crypto.randomUUID(),
      position: nextIdx,
      label: `Message ${nextIdx + 1}`,
      subject: 'Quick idea for {name}',
      body: 'Hi {name},\n\nWrite your customized outreach message here.\n\nBest,\nMythsuite',
      signature: { ...DEFAULT_SIGNATURE },
      enabled: true,
      spam_score: 0,
      risky_words: [],
    };
    setMessages((prev) => [...prev, newMsg]);
  };

  // Add from Presets tool
  const handleAddTemplateFromPreset = (preset: { title: string; subject: string; body: string }) => {
    const nextIdx = messages.length;
    const newMsg: MessageTemplate = {
      id: crypto.randomUUID(),
      position: nextIdx,
      label: preset.title,
      subject: preset.subject,
      body: preset.body,
      signature: { ...DEFAULT_SIGNATURE },
      enabled: true,
      spam_score: 0,
      risky_words: [],
    };
    setMessages((prev) => [...prev, newMsg]);
    setNotification(`Added "${preset.title}" preset to Messages rotation.`);
    setActiveTab('messages');
  };

  // AI Spam check
  const handleSpamCheck = async (msg: MessageTemplate) => {
    setBusyAction(`spam-${msg.id}`);
    setNotification('');

    try {
      const response = await fetch('/api/spam-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: msg.subject, body: msg.body }),
      });

      if (response.ok) {
        const data = await response.json();
        handleUpdateMessage(msg.id, {
          spam_score: data.score,
          risky_words: data.riskyWords || [],
          suggestions: data.suggestions || [],
        });
        setNotification(`Spam analysis complete for ${msg.label}. Score: ${data.score}/100.`);
      } else {
        throw new Error('API unavailable');
      }
    } catch {
      const fallback = clientSpamHeuristic(msg.subject, msg.body);
      handleUpdateMessage(msg.id, {
        spam_score: fallback.score,
        risky_words: fallback.riskyWords,
      });
      setNotification(`Spam check complete. Score: ${fallback.score}/100.`);
    } finally {
      setBusyAction('');
    }
  };

  // AI Variation generation
  const handleGenerateAiVariation = async () => {
    setBusyAction('ai-variation');
    setNotification('');

    try {
      const response = await fetch('/api/ai-variation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        const data = await response.json();
        const nextIdx = messages.length;
        const newMsg: MessageTemplate = {
          id: crypto.randomUUID(),
          position: nextIdx,
          label: `Message ${nextIdx + 1} (${data.label || 'AI'})`,
          subject: data.subject || 'Quick idea for {name}',
          body: data.body || 'Hi {name},\n\n...',
          signature: { ...DEFAULT_SIGNATURE },
          enabled: true,
          spam_score: 0,
          risky_words: [],
        };
        setMessages((prev) => [...prev, newMsg]);
        setNotification('New AI message variation added.');
      } else {
        throw new Error('Fallback variation');
      }
    } catch {
      const nextIdx = messages.length;
      const newMsg: MessageTemplate = {
        id: crypto.randomUUID(),
        position: nextIdx,
        label: `Message ${nextIdx + 1} (Growth)`,
        subject: 'Quick question about {name}',
        body: 'Hi {name},\n\nCame across your store recently and loved the product curation.\n\nAre you looking to scale repeat customer orders this season, or is your team already focused on other priorities?\n\nHappy to share a 2-minute overview if useful.\n\nBest,\nMythsuite',
        signature: { ...DEFAULT_SIGNATURE },
        enabled: true,
        spam_score: 0,
        risky_words: [],
      };
      setMessages((prev) => [...prev, newMsg]);
      setNotification('New message variation added.');
    } finally {
      setBusyAction('');
    }
  };

  // Senders operations
  const handleToggleSender = (id: string, enabled: boolean) => {
    setSenders((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled } : s))
    );
  };

  const handleAddSender = (newSender: Omit<SenderProfile, 'id' | 'sentToday'>) => {
    const s: SenderProfile = {
      ...newSender,
      id: crypto.randomUUID(),
      sentToday: 0,
    };
    setSenders((prev) => [...prev, s]);
    setNotification(`Added sender account ${s.email}.`);
  };

  const handleDeleteSender = (id: string) => {
    setSenders((prev) => prev.filter((s) => s.id !== id));
  };

  // Recipients operations
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [pasted, setPasted] = useState('');

  const handleAddRecipients = (list: { email: string; name?: string }[]) => {
    const existing = new Set(recipients.map((r) => r.email.trim().toLowerCase()));
    const validToAdd: { email: string; name: string }[] = [];
    let duplicates = 0;

    list.forEach((item) => {
      const email = item.email.trim().toLowerCase();
      const name = (item.name || '').trim();
      if (isValidEmail(email)) {
        if (existing.has(email)) {
          duplicates += 1;
        } else {
          existing.add(email);
          validToAdd.push({ email, name });
        }
      }
    });

    if (!validToAdd.length) {
      if (duplicates > 0) {
        setNotification(
          `${duplicates} duplicate email${duplicates === 1 ? ' was' : 's were'} removed. No new recipients added.`
        );
      } else {
        setNotification('No new valid email addresses were found.');
      }
      return;
    }

    const createdRecipients: Recipient[] = validToAdd.map((v, i) => ({
      id: crypto.randomUUID(),
      email: v.email,
      name: v.name,
      position: recipients.length + i,
      skipped: false,
    }));

    setRecipients((prev) => [...prev, ...createdRecipients]);
    setNewEmail('');
    setNewName('');
    setPasted('');
    setNotification(
      `${validToAdd.length} recipient${validToAdd.length === 1 ? '' : 's'} added.${
        duplicates > 0 ? ` ${duplicates} duplicate email(s) removed.` : ''
      }`
    );
  };

  const handleRemoveRecipient = (id: string) => {
    setRecipients((prev) => prev.filter((r) => r.id !== id));
  };

  const handleClearRecipients = () => {
    setRecipients([]);
    setNotification('All recipients cleared.');
  };

  const handleClearHistory = () => {
    setEvents([]);
    setNotification('Outreach activity history cleared.');
  };

  // Reset to sample demo data
  const handleResetDemo = () => {
    if (window.confirm('Reset workspace to original sample messages, senders, and recipients?')) {
      setMessages(
        DEFAULT_MESSAGES.map((m, idx) => ({
          ...m,
          id: `message-${idx + 1}`,
          position: idx,
        }))
      );
      setSenders(DEFAULT_SENDERS);
      setRecipients(
        DEFAULT_RECIPIENTS.map((r, idx) => ({
          id: `recipient-${idx + 1}`,
          name: r.name,
          email: r.email,
          position: idx,
          skipped: false,
        }))
      );
      setEvents([]);
      setCursor(0);
      setRotation('ordered');
      setNotification('Workspace reset to sample demo data.');
    }
  };

  // Export full workspace backup
  const handleExportBackup = () => {
    const backup = {
      messages,
      senders,
      recipients,
      events,
      rotation,
      cursor,
      exported_at: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mythsuite-workspace-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sentTodayCount = useMemo(() => {
    const today = new Date().toDateString();
    return events.filter((e) => new Date(e.sent_at).toDateString() === today).length;
  }, [events]);

  const navTabs = [
    { id: 'messages' as TabView, label: 'Messages', icon: MessageSquare },
    { id: 'recipients' as TabView, label: `Recipients (${recipients.length})`, icon: Users },
    { id: 'senders' as TabView, label: `Senders (${senders.length})`, icon: UserCheck },
    { id: 'tools' as TabView, label: 'Tools', icon: Wrench },
    { id: 'preview' as TabView, label: 'Rotation preview', icon: Eye },
    { id: 'activity' as TabView, label: `Activity (${events.length})`, icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-amber-500/20 selection:text-amber-300">
      <Header
        messageCount={messages.length}
        recipientCount={recipients.length}
        openedCount={events.length}
        sentTodayCount={sentTodayCount}
        onResetDemo={handleResetDemo}
        onExportBackup={handleExportBackup}
      />

      <main className="mx-auto max-w-5xl px-5 py-7 w-full flex-1">
        {/* Tab navigation */}
        <nav
          className="mb-6 flex gap-1.5 overflow-x-auto rounded-xl bg-slate-900/80 p-1.5 border border-white/10 backdrop-blur-md"
          aria-label="Workspace views"
        >
          {navTabs.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="size-4" />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        {/* Temporary Notification Banner */}
        {notification && (
          <div
            role="status"
            className="anim-slide mb-6 flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0 text-amber-400" />
              <span>{notification}</span>
            </div>
            <button
              onClick={() => setNotification('')}
              className="text-amber-400 hover:text-white p-1 rounded transition-colors cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>
        )}

        {/* Browser Security Popup modal fallback */}
        {showPromptModal && (
          <div className="anim-fade fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
            <div className="anim-pop flex items-center gap-3 rounded-xl border border-amber-500/40 bg-slate-900/95 p-4 shadow-2xl backdrop-blur-xl">
              <div className="text-xs text-slate-200">
                <p className="font-semibold text-white">Browser Mail App Link</p>
                <p className="text-slate-400">Click below to open the next email in mail app</p>
              </div>
              <button
                type="button"
                onClick={handlePromptContinue}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 px-3.5 py-1.5 text-xs font-bold transition-colors cursor-pointer"
              >
                <ExternalLink className="size-3.5" />
                <span>Open next email</span>
              </button>
              <button
                type="button"
                onClick={handleStopAuto}
                className="rounded-lg border border-white/20 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/10 transition-colors cursor-pointer"
              >
                Stop
              </button>
            </div>
          </div>
        )}

        {/* Tab view rendering */}
        <div className="anim-fade">
          {activeTab === 'messages' && (
            <MessagesTab
              messages={messages}
              activeMessages={activeMessages}
              recipients={pendingRecipients}
              cursor={cursor}
              nextRecipient={nextRecipient}
              nextMessage={nextMessage}
              rotation={rotation}
              busy={busyAction}
              onAdvance={handleAdvance}
              onRotation={setRotation}
              onChange={handleUpdateMessage}
              onSignatureChange={handleUpdateSignature}
              onDelete={handleDeleteMessage}
              onAdd={handleAddMessage}
              onGenerateAiVariation={handleGenerateAiVariation}
              onSpam={handleSpamCheck}
              autoCount={autoCount}
              setAutoCount={setAutoCount}
              autoInterval={autoInterval}
              setAutoInterval={setAutoInterval}
              autoUnit={autoUnit}
              setAutoUnit={setAutoUnit}
              autoRunning={autoRunning}
              onAuto={handleStartAuto}
              onStopAuto={handleStopAuto}
            />
          )}

          {activeTab === 'recipients' && (
            <RecipientsTab
              recipients={recipients}
              newEmail={newEmail}
              newName={newName}
              pasted={pasted}
              setNewEmail={setNewEmail}
              setNewName={setNewName}
              setPasted={setPasted}
              addRecipients={handleAddRecipients}
              remove={handleRemoveRecipient}
              clear={handleClearRecipients}
              onError={(msg) => setNotification(msg)}
            />
          )}

          {activeTab === 'senders' && (
            <SendersTab
              senders={senders}
              onToggleSender={handleToggleSender}
              onAddSender={handleAddSender}
              onDeleteSender={handleDeleteSender}
            />
          )}

          {activeTab === 'tools' && (
            <ToolsTab
              onImportLeads={handleAddRecipients}
              onAddTemplateFromPreset={handleAddTemplateFromPreset}
            />
          )}

          {activeTab === 'preview' && (
            <RotationPreviewTab
              recipients={pendingRecipients}
              messages={activeMessages}
              cursor={cursor}
              rotation={rotation}
            />
          )}

          {activeTab === 'activity' && (
            <ActivityTab
              events={events}
              onClearHistory={handleClearHistory}
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-6 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-5xl px-5 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Mythsuite · Rotating Email Outreach Manager</span>
          <span>Personalized store outreach with anti-spam sequence rotation</span>
        </div>
      </footer>
    </div>
  );
}
