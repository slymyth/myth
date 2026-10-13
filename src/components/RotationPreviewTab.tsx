import React, { useMemo } from 'react';
import { Eye, Layers } from 'lucide-react';
import { Recipient, MessageTemplate, RotationMode } from '../types';
import { resolveRecipientName, interpolate, getFullEmailBody } from '../utils/helpers';

interface RotationPreviewTabProps {
  recipients: Recipient[];
  messages: MessageTemplate[];
  cursor: number;
  rotation: RotationMode;
}

export const RotationPreviewTab: React.FC<RotationPreviewTabProps> = ({
  recipients,
  messages,
  cursor,
  rotation,
}) => {
  const schedule = useMemo(() => {
    if (!messages.length || !recipients.length) return [];
    return recipients.map((recipient, i) => {
      const offset = cursor + i;
      const messageIndex =
        rotation === 'shuffled'
          ? (offset * 7 + 3) % Math.max(messages.length, 1)
          : offset % Math.max(messages.length, 1);
      const message = messages[messageIndex];
      return {
        recipient,
        message,
        orderIndex: i + 1,
      };
    });
  }, [recipients, messages, cursor, rotation]);

  return (
    <section className="anim-card rounded-xl border border-white/10 bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 font-semibold text-white">
            <Eye className="size-4 text-amber-400" />
            <span>Who gets which message</span>
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            The exact order your next send will follow ({rotation === 'ordered' ? 'In order sequence' : 'Shuffled rotation'}).
          </p>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-400 bg-white/5 px-2.5 py-1 rounded-md border border-white/10">
          <Layers className="size-3.5 text-amber-400" />
          <span>{schedule.length} scheduled</span>
        </span>
      </div>

      <div className="mt-6 space-y-4">
        {schedule.map(({ recipient, message, orderIndex }, idx) => {
          if (!message) return null;
          const resolvedName = resolveRecipientName(recipient);
          const subject = interpolate(message.subject, recipient);
          const fullBody = getFullEmailBody(message, recipient);

          return (
            <article
              key={recipient.id}
              className="anim-rise border-b border-white/10 pb-5 last:border-0"
              style={{ animationDelay: `${Math.min(idx * 50, 400)}ms` }}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="grid size-6 place-items-center rounded-full bg-white/10 text-xs font-semibold text-slate-300">
                  {orderIndex}
                </span>
                <b className="text-white text-sm">{resolvedName}</b>
                <span className="min-w-0 break-all text-xs text-slate-400">
                  {recipient.email}
                </span>
                <span className="ml-auto rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-xs font-semibold text-amber-400">
                  {message.label}
                </span>
              </div>

              <h3 className="mt-3 text-sm font-semibold text-slate-200">
                {subject}
              </h3>

              <div className="mt-2 rounded-lg bg-black/25 border border-white/5 p-3.5">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300 font-sans">
                  {fullBody}
                </p>
              </div>
            </article>
          );
        })}

        {!schedule.length && (
          <p className="py-12 text-center text-sm text-slate-500">
            Add recipients and at least one active message template to preview the rotation sequence.
          </p>
        )}
      </div>
    </section>
  );
};
