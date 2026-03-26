import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, AlertCircle, Lightbulb, CheckCircle2 } from 'lucide-react';

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

export function AdminDashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('user_feedback')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tickets:', error);
    } else {
      setTickets(data as Ticket[]);
    }
    setLoading(false);
  };

  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from('user_feedback')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      console.error('Error updating status:', error);
    } else {
      fetchTickets();
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
        </div>
      </div>

      {loading ? (
        <div className="text-zinc-400">Loading tickets...</div>
      ) : (
        <div className="grid gap-4">
          {tickets.length === 0 ? (
            <div className="text-zinc-500 italic p-8 border border-dashed border-zinc-800 rounded-xl text-center">
              No tickets found.
            </div>
          ) : (
            tickets.map((ticket) => (
              <div key={ticket.id} className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-4 flex-1">
                  <div className="flex items-center gap-3">
                    {getTypeIcon(ticket.type)}
                    <span className="font-medium text-white capitalize">
                      {ticket.type.replace('_', ' ')}
                    </span>
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
            ))
          )}
        </div>
      )}
    </div>
  );
}
