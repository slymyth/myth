export interface SignatureData {
  closing: string;
  name: string;
  role: string;
  company: string;
  phone: string;
  website: string;
}

export interface SenderProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  company: string;
  dailyLimit: number;
  sentToday: number;
  enabled: boolean;
}

export interface MessageTemplate {
  id: string;
  position: number;
  label: string;
  subject: string;
  body: string;
  enabled: boolean;
  signature: SignatureData;
  spam_score: number | null;
  risky_words: string[];
  suggestions?: string[];
}

export interface Recipient {
  id: string;
  position: number;
  name: string;
  email: string;
  company?: string;
  website?: string;
  status?: 'valid' | 'role_based' | 'disposable';
  skipped: boolean;
}

export interface OutreachEvent {
  id: string;
  sender_email?: string;
  recipient_email: string;
  recipient_name: string;
  message_label: string;
  subject: string;
  sent_at: string;
  status: 'prepared' | 'sent';
}

export type RotationMode = 'ordered' | 'shuffled';
export type TabView = 'messages' | 'recipients' | 'senders' | 'tools' | 'preview' | 'activity';
