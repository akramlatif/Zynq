'use client';

import { TrendingUp, LineChart, Activity, AlertTriangle, PieChart } from 'lucide-react';

const analyticsCards = [
  { label: 'Revenue Growth', value: '+18.4%', icon: TrendingUp, tone: 'text-emerald-600' },
  { label: 'Conversion Rate', value: '32%', icon: LineChart, tone: 'text-blue-600' },
  { label: 'Active Alerts', value: '7', icon: AlertTriangle, tone: 'text-orange-600' },
  { label: 'Fast-Moving Items', value: '24', icon: Activity, tone: 'text-violet-600' },
];

const topMetrics = [
  { name: 'Tea Packs', sold: 148, revenue: 41600 },
  { name: 'Cooking Oil', sold: 92, revenue: 78200 },
  { name: 'Biscuits', sold: 121, revenue: 24300 },
  { name: 'Detergent', sold: 66, revenue: 18750 },
];

export default function AnalyticsPage() {
  return (
    <div className="space-y-6 animate-slide-up-fade">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
          <PieChart className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Analytics</h1>
          <p className="text-slate-500 dark:text-slate-400">Monitor sales performance, stock movement, and operational signals.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {analyticsCards.map((card) => (
          <div key={card.label} className="glass-card p-5 rounded-2xl border border-slate-200/70 dark:border-slate-800/70">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{card.label}</p>
                <p className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">{card.value}</p>
              </div>
              <div className={`p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800/70 ${card.tone}`}>
                <card.icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 glass-card rounded-2xl p-5 border border-slate-200/70 dark:border-slate-800/70">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Top Selling Products</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">This week&apos;s highest performers.</p>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">7 day view</span>
          </div>

          <div className="space-y-4">
            {topMetrics.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary font-bold flex items-center justify-center">{index + 1}</div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{item.name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{item.sold} units sold</p>
                  </div>
                </div>
                <p className="font-bold text-slate-900 dark:text-white">Rs {item.revenue.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-200/70 dark:border-slate-800/70">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Operational Notes</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">A few quick signals for store owners.</p>

          <div className="mt-4 space-y-3">
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 p-4">
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Revenue trend is up</p>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">Daily sales are outperforming the previous week.</p>
            </div>
            <div className="rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-200/60 dark:border-orange-900/40 p-4">
              <p className="text-sm font-semibold text-orange-700 dark:text-orange-400">Review low stock items</p>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">Some fast-moving items need restocking soon.</p>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800/70 p-4">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Udhaar follow-up due</p>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">Three customers are due for a reminder this week.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}