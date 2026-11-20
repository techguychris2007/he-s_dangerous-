import { supabase } from '../../../shared/lib/supabaseClient';
import { isAdmin } from './adminConfig';

/** Client for the admin-only RPCs in supabase/migrations/0015_admin_dashboard.sql. Every function
 *  re-checks the caller server-side (admin_access()); the isAdmin() check here only avoids a pointless
 *  request. Read-only: nothing in this module writes data. */

export interface AdminAccount {
  userId: string;
  email: string;
  fullName: string | null;
  createdAt: string;
  lastSignInAt: string | null;
  emailConfirmed: boolean;
  isAnonymous: boolean;
  isBanned: boolean;
  plan: string | null;
  completedLessons: Record<string, boolean>;
  labFlags: Record<string, string[]>;
  quizScores: Record<string, number>;
  labCompletedAt: Record<string, number>;
  completedCodeTasks: Record<string, boolean>;
  activityDates: string[];
  leaderboardOptIn: boolean;
  progressUpdatedAt: string | null;
}

export interface AdminFeedback {
  id: string;
  userId: string;
  email: string | null;
  category: 'bug' | 'suggestion' | 'content' | 'other';
  message: string;
  pagePath: string | null;
  createdAt: string;
}

export interface AdminLabComment {
  id: string;
  userId: string;
  email: string | null;
  labId: string;
  message: string;
  createdAt: string;
}

export interface AdminLabRating {
  labId: string;
  avgRating: number;
  ratingCount: number;
  tooEasy: number;
  justRight: number;
  tooHard: number;
}

export interface AdminData {
  accounts: AdminAccount[];
  feedback: AdminFeedback[];
  comments: AdminLabComment[];
  ratings: AdminLabRating[];
  loadedAt: Date;
}

/** Thrown when the server rejects the caller or the migration has not been applied. */
export class AdminLoadError extends Error {
  readonly kind: 'denied' | 'missing' | 'network';
  constructor(message: string, kind: 'denied' | 'missing' | 'network') {
    super(message);
    this.kind = kind;
  }
}

function rpcError(error: { code?: string; message?: string }): AdminLoadError {
  if (error.code === '42501') return new AdminLoadError('This account is not an admin.', 'denied');
  if (error.code === 'PGRST202' || error.code === '42883') return new AdminLoadError('The admin database functions are not installed yet (migration 0015).', 'missing');
  return new AdminLoadError(error.message || 'Request failed', 'network');
}

async function call<T>(fn: string, args?: Record<string, unknown>): Promise<T[]> {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw rpcError(error);
  return (data ?? []) as T[];
}

export async function fetchAdminData(): Promise<AdminData> {
  const { data: identity, error } = await supabase.auth.getUser();
  if (error || !isAdmin(identity.user)) throw new AdminLoadError('This account is not an admin.', 'denied');

  const [accounts, feedback, comments, ratings] = await Promise.all([
    call<any>('admin_accounts'),
    call<any>('admin_feedback', { p_limit: 500 }),
    call<any>('admin_lab_comments', { p_limit: 500 }),
    call<any>('admin_lab_ratings'),
  ]);

  return {
    loadedAt: new Date(),
    accounts: accounts.map((r) => ({
      userId: r.user_id,
      email: r.email ?? '',
      fullName: r.full_name,
      createdAt: r.created_at,
      lastSignInAt: r.last_sign_in_at,
      emailConfirmed: Boolean(r.email_confirmed),
      isAnonymous: Boolean(r.is_anonymous),
      isBanned: Boolean(r.is_banned),
      plan: r.plan,
      completedLessons: r.completed_lessons ?? {},
      labFlags: r.lab_flags ?? {},
      quizScores: r.quiz_scores ?? {},
      labCompletedAt: r.lab_completed_at ?? {},
      completedCodeTasks: r.completed_code_tasks ?? {},
      activityDates: Array.isArray(r.activity_dates) ? r.activity_dates : [],
      leaderboardOptIn: Boolean(r.leaderboard_opt_in),
      progressUpdatedAt: r.progress_updated_at,
    })),
    feedback: feedback.map((r) => ({
      id: r.id, userId: r.user_id, email: r.email, category: r.category,
      message: r.message, pagePath: r.page_path, createdAt: r.created_at,
    })),
    comments: comments.map((r) => ({
      id: r.id, userId: r.user_id, email: r.email, labId: r.lab_id, message: r.message, createdAt: r.created_at,
    })),
    ratings: ratings.map((r) => ({
      labId: r.lab_id, avgRating: Number(r.avg_rating), ratingCount: Number(r.rating_count),
      tooEasy: Number(r.too_easy_count), justRight: Number(r.just_right_count), tooHard: Number(r.too_hard_count),
    })),
  };
}

/** Builds a CSV string with quoting, and guards against spreadsheet formula injection. */
export function toCsv(header: string[], rows: (string | number | boolean | null | undefined)[][]): string {
  const cell = (value: string | number | boolean | null | undefined) => {
    let text = value == null ? '' : String(value);
    if (typeof value === 'string' && /^[=+\-@\t\r]/.test(text)) text = "'" + text;
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return [header, ...rows].map((row) => row.map(cell).join(',')).join('\r\n');
}

export function downloadCsv(filename: string, csv: string) {
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
