import React, { useState } from 'react';
import { Mail, ChevronDown } from 'lucide-react';
import { SignatureData } from '../types';
import { formatSignature } from '../utils/helpers';

interface SignatureEditorProps {
  signature: SignatureData;
  onChange: (updated: Partial<SignatureData>) => void;
  messageId: string;
}

export const SignatureEditor: React.FC<SignatureEditorProps> = ({
  signature,
  onChange,
  messageId,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const accordionId = `signature-${messageId}`;

  const fields: { key: keyof SignatureData; label: string; placeholder: string }[] = [
    { key: 'closing', label: 'Closing', placeholder: 'Best regards,' },
    { key: 'name', label: 'Your name', placeholder: 'Alex Morgan' },
    { key: 'role', label: 'Job title', placeholder: 'Growth Consultant' },
    { key: 'company', label: 'Company', placeholder: 'Mythsuite' },
    { key: 'phone', label: 'Phone', placeholder: '+1 555 123 4567' },
    { key: 'website', label: 'Website', placeholder: 'mythsuite.com' },
  ];

  const previewText = formatSignature(signature);

  return (
    <div className="border-t border-white/10 pt-2">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={accordionId}
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-2 w-full justify-start py-2 px-2 text-sm font-semibold rounded-lg hover:bg-white/5 text-slate-200 transition-colors cursor-pointer"
      >
        <Mail className="size-4 text-amber-400" />
        <span>Professional signature</span>
        <ChevronDown
          className={`size-4 ml-auto text-slate-400 transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div id={accordionId} className="anim-slide px-2 pb-2 mt-2 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {fields.map(({ key, label, placeholder }) => (
              <label key={key} className="block text-xs font-semibold text-slate-300">
                {label}
                <input
                  type="text"
                  value={signature[key] || ''}
                  placeholder={placeholder}
                  onChange={(e) => onChange({ [key]: e.target.value })}
                  className="mt-1 flex h-9 w-full rounded-md border border-white/15 bg-black/20 px-3 py-1 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400"
                />
              </label>
            ))}
          </div>

          <div className="overflow-hidden rounded-lg border border-white/10 bg-black/30">
            <div className="border-b border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Mobile preview
            </div>
            <div className="max-w-sm px-4 py-3 text-sm text-slate-200 leading-relaxed font-sans">
              <p className="whitespace-pre-line">
                {previewText || 'Complete the fields above to create your signature.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
