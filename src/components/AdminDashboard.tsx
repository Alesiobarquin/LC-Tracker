import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, AlertCircle, Lightbulb, RefreshCw } from 'lucide-react';
import { useUser } from '@clerk/react';
import { clsx } from 'clsx';
import { isMissingRelationError } from '../utils/supabaseErrors';
import { ThemeSwitcher } from './ThemeSwitcher';

interface Ticket {
  id: string;
  user_id: string;
  type: 'bug' | 'feature_request' | 'general';
  message: string;
  status: 'open' | 'in_progress' | 'resolved';
  image_url?: string;
  created_at: string;
  users?: { email: string };
}

interface AdminReadMarker {
  feedback_id: string;
}

export function AdminDashboard() {
  const { user } = useUser();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [viewedTicketIds, setViewedTicketIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [adminConfigWarning, setAdminConfigWarning] = useState<string | null>(null);

  const unreadCount = useMemo(
    () => tickets.reduce((count, ticket) => count + (viewedTicketIds.has(ticket.id) ? 0 : 1), 0),
    [tickets, viewedTicketIds],
  );
  const openCount = useMemo(
    () => tickets.filter((ticket) => ticket.status === 'open').length,
    [tickets],
  );
  const inProgressCount = useMemo(
    () => tickets.filter((ticket) => ticket.status === 'in_progress').length,
    [tickets],
  );
  const resolvedCount = useMemo(
    () => tickets.filter((ticket) => ticket.status === 'resolved').length,
    [tickets],
  );

  const sortedTickets = useMemo(
    () =>
      [...tickets].sort((a, b) => {
        const aViewed = viewedTicketIds.has(a.id);
        const bViewed = viewedTicketIds.has(b.id);

        if (aViewed !== bViewed) {
          return aViewed ? 1 : -1;
        }

        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }),
    [tickets, viewedTicketIds],
  );

  useEffect(() => {
    void fetchTickets();
  }, [user?.id]);

  const fetchTickets = async () => {
    setLoading(true);
    setErrorMessage(null);
    setAdminConfigWarning(null);

    if (user?.id) {
      const { data: adminRows, error: adminCheckError } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', user.id)
        .limit(1);

      if (adminCheckError) {
        const tableMissing = adminCheckError.code === '42P01';
        setAdminConfigWarning(
          tableMissing
            ? 'Database migration for admin access is missing. Run the latest Supabase migrations.'
            : 'Could not verify DB admin role. Cross-user tickets may be hidden by RLS policies.',
        );
      } else if (!adminRows || adminRows.length === 0) {
        setAdminConfigWarning('This account is not registered in admin_users, so only your own tickets are visible.');
      }
    }

    const { data, error } = await supabase
      .from('user_feedback')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Operation failed: Failed to fetch tickets');
      setErrorMessage('Failed to fetch tickets.');
      setTickets([]);
      setViewedTicketIds(new Set());
    } else {
      setTickets((data ?? []) as Ticket[]);

      if (user?.id) {
        const { data: readMarkers, error: readMarkerError } = await supabase
          .from('admin_feedback_reads')
          .select('feedback_id')
          .eq('admin_user_id', user.id);

        if (readMarkerError) {
          if (isMissingRelationError(readMarkerError)) {
            setAdminConfigWarning((existing) => existing ?? 'Unread tracking migration is missing. Run latest Supabase migrations to enable inbox counts.');
          } else {
            console.error('Operation failed: Failed to load admin read markers');
          }
          setViewedTicketIds(new Set());
        } else {
          const markerRows = (readMarkers ?? []) as AdminReadMarker[];
          setViewedTicketIds(new Set(markerRows.map((marker) => marker.feedback_id)));
        }
      } else {
        setViewedTicketIds(new Set());
      }
    }
    setLoading(false);
  };

  const markTicketViewed = async (ticketId: string) => {
    if (!user?.id) return;

    const { error } = await supabase
      .from('admin_feedback_reads')
      .upsert(
        {
          admin_user_id: user.id,
          feedback_id: ticketId,
        },
        {
          onConflict: 'admin_user_id,feedback_id',
          ignoreDuplicates: true,
        },
      );

    if (error) {
      console.error('Operation failed: Could not mark ticket as viewed');
      setErrorMessage('Could not mark ticket as viewed.');
      return;
    }

    setViewedTicketIds((previous) => {
      const next = new Set(previous);
      next.add(ticketId);
      return next;
    });
  };

  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from('user_feedback')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      console.error('Operation failed: Error updating status');
    } else {
      await markTicketViewed(id);
      void fetchTickets();
    }
  };

  const getTypeIcon = (type: string) => {
    if (type === 'bug') return <AlertCircle className="w-5 h-5 text-danger" />;
    if (type === 'feature_request') return <Lightbulb className="w-5 h-5 text-warning" />;
    return <MessageSquare className="w-5 h-5 text-accent" />;
  };

  const getStatusClassName = (status: Ticket['status']) => {
    if (status === 'open') {
      return 'text-accent border-accent/30 bg-accent/10';
    }
    if (status === 'in_progress') {
      return 'text-warning border-warning/30 bg-warning/10';
    }
    return 'text-body border-line-strong/40 bg-subtle/10';
  };

  return (
    <div className="brand-shell min-h-screen relative overflow-hidden">
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6 animate-in">
        <div className="premium-card p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-1">Admin Dashboard</h1>
              <p className="text-muted">Manage feedback like an inbox with unread tracking and triage states.</p>
              <p className="text-xs text-subtle mt-2">
                Inbox: <span className={clsx('font-semibold', unreadCount > 0 ? 'text-warning' : 'text-muted')}>{unreadCount}</span> unread
              </p>
            </div>
            <div className="flex items-center gap-2">
              <ThemeSwitcher compact />
              <button
                type="button"
                onClick={() => void fetchTickets()}
                className="inline-flex items-center gap-2 rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm text-body hover:bg-muted-surface transition-colors h-fit"
              >
                <RefreshCw size={14} />
                Refresh
              </button>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-xl border border-line-strong/70 bg-surface/70 px-3 py-2.5">
              <p className="text-[11px] uppercase tracking-wide text-subtle">Total</p>
              <p className="text-xl font-semibold text-foreground">{tickets.length}</p>
            </div>
            <div className="rounded-xl border border-warning/25 bg-warning/10 px-3 py-2.5">
              <p className="text-xs font-medium text-warning">Unread</p>
              <p className="text-xl font-semibold text-warning">{unreadCount}</p>
            </div>
            <div className="rounded-xl border border-accent/25 bg-accent/10 px-3 py-2.5">
              <p className="text-xs font-medium text-accent">Open</p>
              <p className="text-xl font-semibold text-accent">{openCount + inProgressCount}</p>
            </div>
            <div className="rounded-xl border border-line-strong/40 bg-subtle/10 px-3 py-2.5">
              <p className="text-xs font-medium text-body">Resolved</p>
              <p className="text-xl font-semibold text-body">{resolvedCount}</p>
            </div>
          </div>
        </div>

        {adminConfigWarning && (
          <div className="rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
            {adminConfigWarning}
          </div>
        )}

        {errorMessage && (
          <div className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            {errorMessage}
          </div>
        )}

        {loading ? (
          <div className="premium-card p-8 text-muted">Loading tickets...</div>
        ) : (
          <div className="grid gap-4">
            {tickets.length === 0 ? (
              <div className="premium-card p-8 text-subtle italic border border-dashed border-line-strong text-center">
                Inbox is clear. No tickets found.
              </div>
            ) : (
              sortedTickets.map((ticket) => {
                const isViewed = viewedTicketIds.has(ticket.id);

                return (
                  <div
                    key={ticket.id}
                    className={clsx(
                      'premium-card p-5 sm:p-6 relative overflow-hidden border flex flex-col lg:flex-row lg:items-start gap-4 lg:gap-6',
                      isViewed ? 'bg-surface/55 border-line-strong/70' : 'bg-warning/[0.08] border-warning/45',
                    )}
                  >
                    <div className={clsx('absolute inset-y-0 left-0 w-[3px]', isViewed ? 'bg-hover-surface/80' : 'bg-warning/90')} />

                    <div className="space-y-3 flex-1 min-w-0 pl-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        {getTypeIcon(ticket.type)}
                        <span className="font-medium text-foreground capitalize">{ticket.type.replace('_', ' ')}</span>
                        {!isViewed && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide text-warning bg-warning/20 border border-warning/30">
                            New
                          </span>
                        )}
                        <span className={clsx('px-2 py-0.5 rounded-full text-[10px] font-semibold border uppercase tracking-wide', getStatusClassName(ticket.status))}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-subtle font-mono">{formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}</span>
                      </div>

                      <p className="text-body text-sm leading-relaxed whitespace-pre-wrap">{ticket.message}</p>

                      {ticket.image_url && (() => {
                        let safeUrl = '#';
                        try {
                          const url = new URL(ticket.image_url);
                          if (url.protocol === 'http:' || url.protocol === 'https:') safeUrl = url.href;
                        } catch {
                          // Invalid URL, safely fallback to '#'
                        }
                        return (
                          <a href={safeUrl} target="_blank" rel="noopener noreferrer" className="block w-max rounded-xl border border-line-strong/70 bg-canvas/40 p-1 hover:border-line-strong transition-colors">
                            <img
                              src={safeUrl}
                              alt="Attached screenshot"
                              className="max-h-36 rounded-lg border border-line-strong/60 hover:opacity-90 transition-opacity"
                            />
                          </a>
                        );
                      })()}

                      <p className="text-xs text-subtle">From: {ticket.users?.email || ticket.user_id}</p>
                    </div>

                    <div className="flex lg:flex-col gap-2 lg:w-36 shrink-0">
                      <button
                        type="button"
                        onClick={() => void markTicketViewed(ticket.id)}
                        disabled={isViewed}
                        className={clsx(
                          'rounded-lg px-3 py-2 text-xs font-medium border transition-colors',
                          isViewed
                            ? 'text-subtle border-line bg-canvas/50 cursor-default'
                            : 'text-warning border-warning/40 bg-warning/10 hover:bg-warning/20',
                        )}
                      >
                        {isViewed ? 'Viewed' : 'Mark Viewed'}
                      </button>

                      <select
                        value={ticket.status}
                        onChange={(e) => updateStatus(ticket.id, e.target.value)}
                        className="bg-canvas border border-line text-sm rounded-lg px-3 py-2 text-foreground outline-none focus:ring-1 focus:ring-accent"
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
