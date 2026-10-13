import { Recipient, MessageTemplate, SignatureData, SenderProfile } from '../types';

export const DEFAULT_SIGNATURE: SignatureData = {
  closing: 'Best regards,',
  name: '',
  role: '',
  company: 'Mythsuite',
  phone: '',
  website: '',
};

export const DEFAULT_SENDERS: SenderProfile[] = [
  {
    id: 'sender-1',
    name: 'Alex Morgan',
    email: 'alex@mythsuite.com',
    role: 'Growth Lead',
    company: 'Mythsuite',
    dailyLimit: 50,
    sentToday: 12,
    enabled: true,
  },
  {
    id: 'sender-2',
    name: 'Tade Saoban',
    email: 'tade@mythsuite.com',
    role: 'Store Partnerships',
    company: 'Mythsuite',
    dailyLimit: 50,
    sentToday: 8,
    enabled: true,
  },
];

export const DEFAULT_MESSAGES: Omit<MessageTemplate, 'id'>[] = [
  {
    position: 0,
    label: 'Message 1',
    subject: 'Quick idea for {name}',
    body: 'Hi {name},\n\nI came across {name} and loved how you present your products. I help store owners like you bring in steady, high-intent traffic without extra ad spend.\n\nWould you be open to a short chat this week?\n\nBest,\nMythsuite',
    enabled: true,
    signature: { ...DEFAULT_SIGNATURE },
    spam_score: 0,
    risky_words: [],
  },
  {
    position: 1,
    label: 'Message 2',
    subject: '{name} — a small win worth 10 minutes',
    body: 'Hello {name},\n\nI work with independent stores on their outreach and conversion flow. Looking at {name}, there are one or two quick wins I think you\'d like.\n\nHappy to share them free of charge — want me to send a short breakdown?\n\nWarmly,\nMythsuite',
    enabled: true,
    signature: { ...DEFAULT_SIGNATURE },
    spam_score: 0,
    risky_words: [],
  },
  {
    position: 2,
    label: 'Message 3',
    subject: 'Helping {name} reach more buyers',
    body: 'Hey {name},\n\nQuick note: I put together growth plans for shops similar to {name}, and the results usually show up within the first month.\n\nIf it sounds useful, just reply and I\'ll send the details.\n\nCheers,\nMythsuite',
    enabled: true,
    signature: { ...DEFAULT_SIGNATURE },
    spam_score: 0,
    risky_words: [],
  },
];

export const COLD_EMAIL_PRESETS = [
  {
    title: 'Store Growth Audit',
    subject: 'Quick idea for {name}',
    body: 'Hi {name},\n\nI was looking over your store catalog and noticed a few quick layout tweaks that usually boost checkout conversion by 15-20% for similar brands.\n\nHappy to share a 2-minute overview with your team free of charge — interested?\n\nBest,\nMythsuite',
  },
  {
    title: 'Client Acquisition Pitch',
    subject: '{name} — customer acquisition suggestion',
    body: 'Hello {name},\n\nWe specialize in outbound buyer acquisition for independent online shops and e-commerce stores.\n\nWould you be open to a 10-minute discovery call next week to see if we can bring 20+ qualified shoppers to your storefront this month?\n\nWarm regards,\nMythsuite',
  },
  {
    title: 'Polite Follow-up Bump',
    subject: 'Re: Quick idea for {name}',
    body: 'Hi {name},\n\nJust bumping this to the top of your inbox in case it got buried under other store tasks.\n\nNo worries at all if the timing isn\'t right — let me know if you\'d prefer I check back in next quarter.\n\nCheers,\nMythsuite',
  },
];

export const DEFAULT_RECIPIENTS = [
  { name: 'Amara', email: 'hello@thecraftloft.com' },
  { name: 'Daniel', email: 'owner@brightsneakers.co' },
  { name: 'Sofia', email: 'team@verdantplants.shop' },
  { name: 'Ken', email: 'info@northgear.store' },
  { name: 'Priya', email: 'contact@luminacandles.com' },
];

const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', '10minutemail.com', 'guerrillamail.com', 'tempmail.com',
  'trashmail.com', 'yopmail.com', 'getnada.com', 'sharklasers.com',
  'fakemailgenerator.com', 'throwawaymail.com', 'dispostable.com',
]);

const GENERIC_EMAIL_PREFIXES = new Set([
  'hello', 'info', 'team', 'contact', 'owner', 'sales', 'support',
  'service', 'services', 'admin', 'administrator', 'office', 'mail',
  'email', 'enquiries', 'inquiries', 'help', 'customerservice',
  'customercare', 'care', 'hi', 'hey', 'welcome', 'noreply', 'no-reply',
  'shop', 'store', 'orders', 'booking', 'bookings', 'marketing',
  'press', 'media'
]);

export function verifyEmail(email: string): 'valid' | 'role_based' | 'disposable' {
  const clean = email.trim().toLowerCase();
  if (!isValidEmail(clean)) return 'disposable';

  const [prefix = '', domain = ''] = clean.split('@');
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return 'disposable';
  }
  if (GENERIC_EMAIL_PREFIXES.has(prefix)) {
    return 'role_based';
  }
  return 'valid';
}

/**
 * Intelligently extracts a friendly display name for cold outreach.
 * If user entered an explicit name, uses that (cleaned).
 * If empty, checks email:
 *   - if prefix is generic (e.g. info@, team@), extracts and capitalizes domain name (e.g. brightsneakers)
 *   - if prefix is personal (e.g. alex.miller@), formats that
 */
export function resolveRecipientName(recipient: Pick<Recipient, 'name' | 'email'>): string {
  if (recipient.name && recipient.name.trim()) {
    const cleaned = recipient.name.trim().replace(/\d+/g, '').replace(/\s{2,}/g, ' ').trim();
    if (cleaned) return cleaned;
  }

  const [prefix = '', domain = ''] = recipient.email.split('@');
  const cleanPrefix = prefix.toLowerCase().replace(/\d+/g, '').replace(/^[._-]+|[._-]+$/g, '');
  const domainBrand = (domain.split('.')[0] || '').replace(/\d+/g, '');

  let chosen = '';
  if ((!cleanPrefix || GENERIC_EMAIL_PREFIXES.has(cleanPrefix)) && domainBrand) {
    chosen = domainBrand;
  } else {
    chosen = cleanPrefix || domainBrand || 'there';
  }

  const formatted = chosen
    .replace(/[._-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();

  return formatted || 'there';
}

export function interpolate(templateString: string, recipient: Pick<Recipient, 'name' | 'email'>): string {
  const name = resolveRecipientName(recipient);
  return templateString.replaceAll('{name}', name);
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function formatSignature(sig: SignatureData): string {
  const roleCompany = [sig.role?.trim(), sig.company?.trim()].filter(Boolean).join(' · ');
  const lines = [
    sig.closing?.trim(),
    sig.name?.trim(),
    roleCompany,
    sig.phone?.trim(),
    sig.website?.trim(),
  ].filter(Boolean);

  return lines.join('\n');
}

export function getFullEmailBody(
  message: Pick<MessageTemplate, 'body' | 'signature'>,
  recipient: Pick<Recipient, 'name' | 'email'>
): string {
  const bodyText = interpolate(message.body, recipient).trimEnd();
  const signatureText = formatSignature(message.signature);

  return signatureText ? `${bodyText}\n\n${signatureText}` : bodyText;
}

export function clientSpamHeuristic(subject: string, body: string): { score: number; riskyWords: string[] } {
  const text = `${subject} ${body}`.toLowerCase();
  const triggers = [
    'free', '100%', 'guarantee', 'urgent', 'buy now', 'act now',
    'cash bonus', 'prize', 'winner', 'risk free', 'make money',
    'eliminate debt', 'no catch', 'click here', 'exclusive deal'
  ];

  const matched = triggers.filter((w) => text.includes(w));
  let score = matched.length * 20;

  if ((text.match(/!/g) || []).length > 2) {
    matched.push('multiple exclamation marks');
    score += 15;
  }

  const caps = subject.split(/\s+/).filter((w) => w.length > 3 && w === w.toUpperCase() && /^[A-Z]+$/.test(w));
  if (caps.length > 0) {
    matched.push('ALL CAPS subject words');
    score += 20;
  }

  score = Math.min(Math.max(score, 0), 100);
  return {
    score,
    riskyWords: Array.from(new Set(matched)).slice(0, 5),
  };
}

/**
 * Extract emails and website domains from unstructured text, HTML, or logs
 */
export function extractEmailsFromRawText(raw: string): { emails: string[]; domains: string[] } {
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
  const found = raw.match(emailRegex) || [];
  const uniqueEmails = Array.from(new Set(found.map((e) => e.trim().toLowerCase())));

  const urlRegex = /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+(?:\.[a-zA-Z]{2,})+)/g;
  const urlsFound: string[] = [];
  let m;
  while ((m = urlRegex.exec(raw)) !== null) {
    if (m[1] && !m[1].includes('@')) {
      urlsFound.push(m[1].toLowerCase());
    }
  }

  return {
    emails: uniqueEmails,
    domains: Array.from(new Set(urlsFound)),
  };
}

/**
 * Segment email list into batches
 */
export function segmentList<T>(items: T[], segmentSize: number): T[][] {
  const size = Math.max(1, segmentSize);
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size));
  }
  return result;
}
