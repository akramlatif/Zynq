'use client';

import { Receipt, CreditCard, IndianRupee, TrendingUp, CheckCircle2 } from 'lucide-react';

const recentBills = [
  { id: 'B-1042', customer: 'Ali Traders', amount: 12840, method: 'Cash', status: 'Paid' },
  { id: 'B-1041', customer: 'Noor Mart', amount: 6420, method: 'Card', status: 'Paid' },
  { id: 'B-1040', customer: 'Karim Store', amount: 9800, method: 'Udhaar', status: 'Pending' },
];

export default function BillingPage() {
  return (
    <div className="space-y-6 animate-slide-up-fade">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Billing</h1>
            <p className="text-slate-500 dark:text-slate-400">Track receipts, payment methods, and outstanding balances.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-5 rounded-2xl border-l-4 border-l-emerald-500">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Today&apos;s Sales</p>
          <p className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">Rs 42,580</p>
          <p className="mt-1 text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><TrendingUp className="w-4 h-4" /> +12% vs yesterday</p>
        </div>
        <div className="glass-card p-5 rounded-2xl border-l-4 border-l-blue-500">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Cash Collected</p>
          <p className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">Rs 31,240</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1"><IndianRupee className="w-4 h-4" /> Fast settlements</p>
        </div>
        <div className="glass-card p-5 rounded-2xl border-l-4 border-l-orange-500">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Pending Udhaar</p>
          <p className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">Rs 11,340</p>
          <p className="mt-1 text-sm text-orange-600 dark:text-orange-400 flex items-center gap-1"><CreditCard className="w-4 h-4" /> Needs follow-up</p>
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden border border-slate-200/70 dark:border-slate-800/70">
        <div className="p-5 border-b border-slate-200/70 dark:border-slate-800/70">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Recent Bills</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">A quick view of the latest receipts captured by Zynq.</p>
        </div>
        <div className="divide-y divide-slate-200/70 dark:divide-slate-800/70">
          {recentBills.map((bill) => (
            <div key={bill.id} className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-900/60 transition-colors">
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">{bill.customer}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{bill.id} · {bill.method}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-slate-900 dark:text-white">Rs {bill.amount.toLocaleString()}</span>
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${bill.status === 'Paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400'}`}>
                  <CheckCircle2 className="w-3.5 h-3.5" /> {bill.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}