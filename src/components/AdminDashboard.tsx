import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, AlertCircle, Lightbulb, RefreshCw } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { clsx } from 'clsx';

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
      console.error('Error fetching tickets:', error);
      setErrorMessage(error.message || 'Failed to fetch tickets.');
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
          if (readMarkerError.code === '42P01') {
            setAdminConfigWarning((existing) => existing ?? 'Unread tracking migration is missing. Run latest Supabase migrations to enable inbox counts.');
          } else {
            console.error('Error loading admin read markers:', readMarkerError);
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
      console.error('Error marking ticket as viewed:', error);
      setErrorMessage(error.message || 'Could not mark ticket as viewed.');
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
      console.error('Error updating status:', error);
    } else {
      await markTicketViewed(id);
      void fetchTickets();
    }
  };

  const getTypeIcon = (type: string) => {
    if (type === 'bug') return <AlertCircle className="w-5 h-5 text-red-400" />;
    if (type === 'feature_request') return <Lightbulb className="w-5 h-5 text-yellow-400" />;
    return <MessageSquare className="w-5 h-5 text-blue-400" />;
  };

  const getStatusClassName = (status: Ticket['status']) => {
    if (status === 'open') {
      return 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10';
    }
    if (status === 'in_progress') {
      return 'text-amber-300 border-amber-500/30 bg-amber-500/10';
    }
    return 'text-zinc-300 border-zinc-600/40 bg-zinc-500/10';
  };

  return (
    <div className="brand-shell min-h-screen relative overflow-hidden">
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_6%_0%,rgba(16,185,129,0.15),transparent_34%),radial-gradient(circle_at_92%_8%,rgba(59,130,246,0.12),transparent_36%),radial-gradient(circle_at_78%_82%,rgba(245,158,11,0.08),transparent_34%)]" />
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.12] mix-blend-screen" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.35) 1px, transparent 1px)', backgroundSize: '36px 36px' }} />

      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6 animate-in">
        <div className="premium-card p-5 sm:p-6 border-emerald-500/20 bg-zinc-900/60">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold font-mono tracking-tight text-white mb-1">Admin Dashboard</h1>
              <p className="text-zinc-400">Manage feedback like an inbox with unread tracking and triage states.</p>
              <p className="text-xs text-zinc-500 mt-2">
                Inbox: <span className={clsx('font-semibold', unreadCount > 0 ? 'text-amber-300' : 'text-zinc-400')}>{unreadCount}</span> unread
              </p>
            </div>
            <button
              type="button"
              onClick={() => void fetchTickets()}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800 transition-colors h-fit"
            >
              <RefreshCw size={14} />
              Refresh
            </button>
          </div>

          <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-xl border border-zinc-700/70 bg-zinc-900/70 px-3 py-2.5">
              <p className="text-[11px] uppercase tracking-wide text-zinc-500">Total</p>
              <p className="text-xl font-semibold text-zinc-100">{tickets.length}</p>
            </div>
            <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2.5">
              <p className="text-[11px] uppercase tracking-wide text-amber-200/75">Unread</p>
              <p className="text-xl font-semibold text-amber-200">{unreadCount}</p>
            </div>
            <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2.5">
              <p className="text-[11px] uppercase tracking-wide text-emerald-200/70">Open</p>
              <p className="text-xl font-semibold text-emerald-200">{openCount + inProgressCount}</p>
            </div>
            <div className="rounded-xl border border-zinc-600/40 bg-zinc-500/10 px-3 py-2.5">
              <p className="text-[11px] uppercase tracking-wide text-zinc-300/70">Resolved</p>
              <p className="text-xl font-semibold text-zinc-200">{resolvedCount}</p>
            </div>
          </div>
        </div>

        {adminConfigWarning && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
            {adminConfigWarning}
          </div>
        )}

        {errorMessage && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {errorMessage}
          </div>
        )}

        {loading ? (
          <div className="premium-card p-8 text-zinc-400">Loading tickets...</div>
        ) : (
          <div className="grid gap-4">
            {tickets.length === 0 ? (
              <div className="premium-card p-8 text-zinc-500 italic border border-dashed border-zinc-700 text-center">
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
                      isViewed ? 'bg-zinc-900/55 border-zinc-700/70' : 'bg-amber-500/[0.08] border-amber-500/45',
                    )}
                  >
                    <div className={clsx('absolute inset-y-0 left-0 w-[3px]', isViewed ? 'bg-zinc-700/80' : 'bg-amber-300/90')} />

                    <div className="space-y-3 flex-1 min-w-0 pl-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        {getTypeIcon(ticket.type)}
                        <span className="font-medium text-white capitalize">{ticket.type.replace('_', ' ')}</span>
                        {!isViewed && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide text-amber-300 bg-amber-500/20 border border-amber-500/30">
                            New
                          </span>
                        )}
                        <span className={clsx('px-2 py-0.5 rounded-full text-[10px] font-semibold border uppercase tracking-wide', getStatusClassName(ticket.status))}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-zinc-500 font-mono">{formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}</span>
                      </div>

                      <p className="text-zinc-200 text-sm leading-relaxed whitespace-pre-wrap">{ticket.message}</p>

                      {ticket.image_url && (
                        <a href={ticket.image_url} target="_blank" rel="noopener noreferrer" className="block w-max rounded-xl border border-zinc-700/70 bg-zinc-950/40 p-1 hover:border-zinc-500 transition-colors">
                          <img
                            src={ticket.image_url}
                            alt="Attached screenshot"
                            className="max-h-36 rounded-lg border border-zinc-700/60 hover:opacity-90 transition-opacity"
                          />
                        </a>
                      )}

                      <p className="text-xs text-zinc-500">From: {ticket.users?.email || ticket.user_id}</p>
                    </div>

                    <div className="flex lg:flex-col gap-2 lg:w-36 shrink-0">
                      <button
                        type="button"
                        onClick={() => void markTicketViewed(ticket.id)}
                        disabled={isViewed}
                        className={clsx(
                          'rounded-lg px-3 py-2 text-xs font-medium border transition-colors',
                          isViewed
                            ? 'text-zinc-500 border-zinc-800 bg-zinc-950/50 cursor-default'
                            : 'text-amber-200 border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20',
                        )}
                      >
                        {isViewed ? 'Viewed' : 'Mark Viewed'}
                      </button>

                      <select
                        value={ticket.status}
                        onChange={(e) => updateStatus(ticket.id, e.target.value)}
                        className="bg-zinc-950 border border-zinc-800 text-sm rounded-lg px-3 py-2 text-white outline-none focus:ring-1 focus:ring-emerald-500"
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
