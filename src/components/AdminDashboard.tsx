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

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-3xl font-bold font-mono tracking-tight text-white mb-2">
            Admin Dashboard
          </h1>
          <p className="text-zinc-400">Manage user feedback and feature requests.</p>
          <p className="text-xs text-zinc-500 mt-1">
            Inbox: <span className={clsx('font-semibold', unreadCount > 0 ? 'text-amber-300' : 'text-zinc-400')}>{unreadCount}</span> unread
          </p>
        </div>
        <button
          type="button"
          onClick={() => void fetchTickets()}
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800 transition-colors"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
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
        <div className="text-zinc-400">Loading tickets...</div>
      ) : (
        <div className="grid gap-4">
          {tickets.length === 0 ? (
            <div className="text-zinc-500 italic p-8 border border-dashed border-zinc-800 rounded-xl text-center">
              No tickets found.
            </div>
          ) : (
            sortedTickets.map((ticket) => {
              const isViewed = viewedTicketIds.has(ticket.id);

              return (
              <div key={ticket.id} className={clsx('border p-6 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4', isViewed ? 'bg-zinc-900/50 border-zinc-800' : 'bg-amber-500/[0.07] border-amber-500/35')}>
                <div className="space-y-4 flex-1">
                  <div className="flex items-center gap-3">
                    {getTypeIcon(ticket.type)}
                    <span className="font-medium text-white capitalize">
                      {ticket.type.replace('_', ' ')}
                    </span>
                    {!isViewed && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide text-amber-300 bg-amber-500/20 border border-amber-500/30">
                        New
                      </span>
                    )}
                    <span className="text-xs text-zinc-500 font-mono">
                      {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-zinc-300 text-sm whitespace-pre-wrap">{ticket.message}</p>
                  
                  {ticket.image_url && (
                    <div className="mt-2">
                       <a href={ticket.image_url} target="_blank" rel="noopener noreferrer" className="block w-max">
                        <img 
                          src={ticket.image_url} 
                          alt="Attached screenshot" 
                          className="max-h-32 rounded-lg border border-zinc-700 hover:opacity-80 transition-opacity"
                        />
                      </a>
                    </div>
                  )}

                  <p className="text-xs text-zinc-500">From: {ticket.users?.email || ticket.user_id}</p>
                </div>
                
                <div className="flex sm:flex-col gap-2 min-w-32">
                  <button
                    type="button"
                    onClick={() => void markTicketViewed(ticket.id)}
                    disabled={isViewed}
                    className={clsx('rounded-lg px-3 py-2 text-xs font-medium border transition-colors', isViewed ? 'text-zinc-500 border-zinc-800 bg-zinc-950/50 cursor-default' : 'text-amber-200 border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20')}
                  >
                    {isViewed ? 'Viewed' : 'Mark Viewed'}
                  </button>
                  <select
                    value={ticket.status}
                    onChange={(e) => updateStatus(ticket.id, e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 text-sm rounded-lg px-3 py-2 text-white outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="open">🟢 Open</option>
                    <option value="in_progress">🟡 In Progress</option>
                    <option value="resolved">⚪️ Resolved</option>
                  </select>
                </div>
              </div>
            )})
          )}
        </div>
      )}
    </div>
  );
}
