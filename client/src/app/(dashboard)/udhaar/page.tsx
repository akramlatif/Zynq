'use client';

import { BookOpenCheck, CircleDollarSign, PhoneCall, ArrowUpRight } from 'lucide-react';

const udhaarAccounts = [
  { name: 'Rahim General Store', phone: '+92 300 1234567', balance: 8200, due: '3 days' },
  { name: 'Sana Mart', phone: '+92 321 9876543', balance: 4300, due: 'Today' },
  { name: 'Iqbal Traders', phone: '+92 333 5551212', balance: 12500, due: '7 days' },
];

export default function UdhaarPage() {
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-5 rounded-2xl border-l-4 border-l-red-500">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Outstanding Balance</p>
          <p className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">Rs 25,000</p>
        </div>
        <div className="glass-card p-5 rounded-2xl border-l-4 border-l-blue-500">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Due This Week</p>
          <p className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">Rs 6,200</p>
        </div>
        <div className="glass-card p-5 rounded-2xl border-l-4 border-l-emerald-500">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Collected Today</p>
          <p className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">Rs 1,800</p>
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden border border-slate-200/70 dark:border-slate-800/70">
        <div className="p-5 border-b border-slate-200/70 dark:border-slate-800/70">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Active Credit Accounts</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Customers with balances that need attention.</p>
        </div>
        <div className="divide-y divide-slate-200/70 dark:divide-slate-800/70">
          {udhaarAccounts.map((account) => (
            <div key={account.name} className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:bg-slate-50/80 dark:hover:bg-slate-900/60 transition-colors">
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">{account.name}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1"><PhoneCall className="w-4 h-4" />{account.phone}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-lg font-bold text-slate-900 dark:text-white">Rs {account.balance.toLocaleString()}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Due {account.due}</p>
                </div>
                <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary-hover transition-colors shadow-sm">
                  Send Reminder <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card p-5 rounded-2xl flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Need a quick collection summary?</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white">Track cash flow across all pending Udhaar.</p>
        </div>
        <div className="hidden md:flex items-center gap-2 text-primary font-semibold">
          <CircleDollarSign className="w-5 h-5" /> Reconcile balances
        </div>
      </div>
    </div>
  );
}