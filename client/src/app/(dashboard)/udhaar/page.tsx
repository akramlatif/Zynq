'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  BookOpenCheck,
  PhoneCall,
  ArrowUpRight,
  CheckCircle2,
  Loader2,
  Search,
  AlertCircle,
  Wallet,
  CalendarClock,
  HandCoins,
} from 'lucide-react';
import { useMemo, useState } from 'react';

interface UdhaarRecord {
  id: string;
  customer_name: string;
  customer_phone: string | null;
  amount: number;
  note?: string | null;
  due_date?: string | null;
  paid: boolean;
  created_at: string;
}

interface OutstandingCustomer {
  customer_name: string;
  customer_phone: string | null;
  outstanding: number;
  entries: number;
  oldest_due?: string | null;
}

async function fetchOutstanding(): Promise<OutstandingCustomer[]> {
  const res = await fetch('/api/udhaar');
  if (!res.ok) throw new Error('Failed to fetch udhaar records');
  return res.json();
}

async function markAsPaid(id: string): Promise<void> {
  const res = await fetch(`/api/udhaar/${id}/pay`, { method: 'PATCH' });
  if (!res.ok) throw new Error('Failed to mark as paid');
}

export default function UdhaarPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['udhaar'],
    queryFn: fetchOutstanding,
    refetchInterval: 60000,
  });

  const payMutation = useMutation({
    mutationFn: markAsPaid,
    onSuccess: () => {
      toast.success('Udhaar marked as paid');
      queryClient.invalidateQueries({ queryKey: ['udhaar'] });
    },
    onError: () => toast.error('Could not mark as paid. Please try again.'),
  });

  const customers = useMemo(() => data ?? [], [data]);

  const filtered = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase();
    return customers.filter(
      (c) =>
        c.customer_name.toLowerCase().includes(q) ||
        (c.customer_phone ?? '').includes(q)
    );
  }, [customers, search]);

  const totalOutstanding = customers.reduce((s, c) => s + c.outstanding, 0);
  const maxOutstanding = Math.max(...customers.map((c) => c.outstanding), 1);

  const stats = [
    {
      label: 'Outstanding Balance',
      value: `Rs ${totalOutstanding.toLocaleString()}`,
      icon: Wallet,
      accent: 'border-l-red-500 text-red-500',
      iconBg: 'bg-red-500/10 border-red-500/20',
    },
    {
      label: 'Accounts with Balance',
      value: customers.length,
      icon: BookOpenCheck,
      accent: 'border-l-blue-500 text-blue-500',
      iconBg: 'bg-blue-500/10 border-blue-500/20',
    },
    {
      label: 'Entries (approx. due this week)',
      value: customers.reduce((s, c) => s + c.entries, 0),
      icon: CalendarClock,
      accent: 'border-l-amber-500 text-amber-500',
      iconBg: 'bg-amber-500/10 border-amber-500/20',
    },
  ];

  return (
    <div className="space-y-6 animate-slide-up-fade">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
          <BookOpenCheck className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Udhaar</h1>
          <p className="text-slate-500 dark:text-slate-400">Monitor customer credit, send reminders, and reduce overdue balances.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className={`glass-card p-5 rounded-2xl border-l-4 ${stat.accent.split(' ')[0]}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{stat.label}</p>
                <p className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-xl border ${stat.iconBg}`}>
                <stat.icon className={`w-5 h-5 ${stat.accent.split(' ')[1]}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search customers by name or phone…"
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
        />
      </div>

      {/* Accounts list */}
      <div className="glass-card rounded-2xl overflow-hidden border border-slate-200/70 dark:border-slate-800/70">
        <div className="p-5 border-b border-slate-200/70 dark:border-slate-800/70">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Active Credit Accounts</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {isLoading ? 'Loading accounts…' : `${filtered.length} customer${filtered.length === 1 ? '' : 's'} with balances that need attention.`}
          </p>
        </div>

        {isLoading ? (
          <div className="p-5 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between animate-pulse">
                <div className="space-y-2">
                  <div className="h-4 w-40 bg-slate-200 dark:bg-slate-700/60 rounded" />
                  <div className="h-3 w-32 bg-slate-100 dark:bg-slate-800/60 rounded" />
                </div>
                <div className="h-9 w-32 bg-slate-200 dark:bg-slate-700/60 rounded-xl" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="p-8 text-center">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <p className="text-slate-600 dark:text-slate-300 font-medium">Could not load udhaar accounts.</p>
            <p className="text-sm text-slate-400 mt-1">Check that the backend is running, then refresh.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <HandCoins className="w-12 h-12 text-emerald-500/70 mx-auto mb-3" />
            <p className="text-slate-600 dark:text-slate-300 font-semibold">All settled! 🎉</p>
            <p className="text-sm text-slate-400 mt-1">
              {search ? 'No customers match your search.' : 'No outstanding udhaar right now.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200/70 dark:divide-slate-800/70">
            {filtered.map((account) => {
              const overdue = account.oldest_due ? new Date(account.oldest_due) < new Date() : false;
              return (
                <div
                  key={account.customer_name}
                  className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:bg-slate-50/80 dark:hover:bg-slate-900/60 transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary shrink-0">
                      {account.customer_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 dark:text-white truncate">{account.customer_name}</p>
                      {account.customer_phone && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <PhoneCall className="w-3.5 h-3.5" />{account.customer_phone}
                        </p>
                      )}
                      <p className="text-xs text-slate-400 mt-0.5">{account.entries} entr{account.entries === 1 ? 'y' : 'ies'} open</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-bold text-slate-900 dark:text-white">Rs {account.outstanding.toLocaleString()}</p>
                      {overdue ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400">
                          <AlertCircle className="w-3 h-3" /> Overdue
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500 dark:text-slate-400">Within terms</span>
                      )}
                      {/* Balance severity bar */}
                      <div className="mt-1.5 h-1.5 w-28 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${overdue ? 'bg-red-500' : 'bg-primary'}`}
                          style={{ width: `${Math.min((account.outstanding / maxOutstanding) * 100, 100)}%` }}
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        toast.promise(markAsPaid(account.customer_name), {
                          loading: 'Marking as paid…',
                          success: 'Marked as paid',
                          error: 'Could not mark as paid',
                        });
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary-hover transition-colors shadow-sm text-sm font-semibold disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Mark Paid
                    </button>

                    <button
                      onClick={() => {
                        const msg = `Assalam-o-Alaikum! Friendly reminder from your store: Rs ${account.outstanding.toLocaleString()} udhaar is pending. JazakAllah! 🙏`;
                        window.open(`https://wa.me/${account.customer_phone?.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                      }}
                      disabled={!account.customer_phone}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors text-sm font-semibold disabled:opacity-40"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                      Remind
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}