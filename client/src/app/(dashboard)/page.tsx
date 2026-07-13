'use client';

import { useAuth } from '@/stores/useAuth';
import { useQuery } from '@tanstack/react-query';
import { Banknote, Package, AlertTriangle, BookOpenCheck, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from '@/providers/ThemeProvider';

// Mock data for when the backend is unavailable
const MOCK_DASHBOARD = {
  metrics: {
    todayRevenue: 45780,
    totalProducts: 1245,
    lowStockCount: 28,
    pendingUdhaar: 67450,
  },
  revenueData: [
    { day: 'Mon', revenue: 8200 },
    { day: 'Tue', revenue: 9300 },
    { day: 'Wed', revenue: 6300 },
    { day: 'Thu', revenue: 8200 },
    { day: 'Fri', revenue: 9700 },
    { day: 'Sat', revenue: 7500 },
    { day: 'Sun', revenue: 9100 },
  ],
  topSellers: [
    { id: '1', name: 'Artisan Coffee Beans', sold: 340, revenue: 12450 },
    { id: '2', name: 'Wireless Earbuds', sold: 210, revenue: 9800 },
    { id: '3', name: 'Leather Backpack', sold: 180, revenue: 8250 },
    { id: '4', name: 'Smart Watch', sold: 155, revenue: 7600 },
    { id: '5', name: 'Ceramic Mug Set', sold: 290, revenue: 5900 },
  ],
  lowStock: [
    { id: '1', name: 'Artisan Coffee', stock: 14, threshold: 50 },
    { id: '2', name: 'Wireless Earbuds', stock: 22, threshold: 45 },
    { id: '3', name: 'Leather Backpack', stock: 18, threshold: 40 },
  ],
};

const fetchDashboardData = async () => {
  const res = await fetch('/api/dashboard');
  if (!res.ok) throw new Error('Failed to fetch dashboard data');
  return res.json();
};

export default function DashboardPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const { data: apiData, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboardData,
    refetchInterval: 60000,
    retry: 1,
  });

  // Use API data if available, otherwise fall back to mock data
  const data = apiData || MOCK_DASHBOARD;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-slide-up-fade relative">
      <div className="flex justify-between items-start gap-4 flex-col lg:flex-row">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Dashboard
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Welcome back, {user?.ownerName}! Here is your Zynq overview.</p>
        </div>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl border border-slate-200/70 dark:border-slate-600/50 bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 shadow-sm backdrop-blur-xl">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_18px_rgba(34,211,238,0.75)]" />
          <span className="text-sm font-semibold">Oct 16 - Oct 22, 2023</span>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6 rounded-2xl flex items-center justify-between border-l-4 border-l-cyan-400">
          <div>
            <h3 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Today's Revenue</h3>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">Rs {data?.metrics.todayRevenue.toLocaleString()}</p>
            <p className="mt-1 text-sm text-emerald-600 dark:text-emerald-400">+12.5% this month</p>
          </div>
          <div className="bg-cyan-500/10 p-3.5 rounded-xl border border-cyan-400/20 shadow-[0_0_25px_rgba(34,211,238,0.12)]">
            <Banknote className="w-6 h-6 text-cyan-600 dark:text-cyan-300" />
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl flex items-center justify-between border-l-4 border-l-cyan-400">
          <div>
            <h3 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Total Products</h3>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">{data?.metrics.totalProducts}</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Active</p>
          </div>
          <div className="bg-cyan-500/10 p-3.5 rounded-xl border border-cyan-400/20 shadow-[0_0_25px_rgba(34,211,238,0.15)]">
            <Package className="w-6 h-6 text-cyan-600 dark:text-cyan-300" />
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl flex items-center justify-between border-l-4 border-l-amber-400">
          <div>
            <h3 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Low Stock Items</h3>
            <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-300 mt-2">{data?.metrics.lowStockCount}</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Needs Attention</p>
          </div>
          <div className="bg-amber-500/10 p-3.5 rounded-xl border border-amber-400/20 shadow-[0_0_25px_rgba(245,158,11,0.15)]">
            <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-300" />
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl flex items-center justify-between border-l-4 border-l-cyan-400">
          <div>
            <h3 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Pending Udhaar</h3>
            <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-300 mt-2">Rs {data?.metrics.pendingUdhaar.toLocaleString()}</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">18 Records</p>
          </div>
          <div className="bg-cyan-500/10 p-3.5 rounded-xl border border-cyan-400/20 shadow-[0_0_25px_rgba(34,211,238,0.10)]">
            <BookOpenCheck className="w-6 h-6 text-cyan-600 dark:text-cyan-300" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Day Revenue Chart */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl">
          <h3 className="font-extrabold text-slate-900 dark:text-white mb-6 text-base tracking-tight">7-Day Revenue Trends</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.95}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0.8}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#e2e8f0'} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 12, fontWeight: 500 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 12, fontWeight: 500 }} dx={-10} tickFormatter={(val) => `Rs ${val / 1000}k`} />
                <Tooltip 
                  cursor={{ fill: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(15, 118, 110, 0.05)', radius: 8 }}
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: isDark ? '1px solid rgba(148, 163, 184, 0.16)' : '1px solid rgba(15, 118, 110, 0.1)', 
                    background: isDark ? 'rgba(30, 41, 59, 0.98)' : 'rgba(255, 255, 255, 0.95)',
                    boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.10)' 
                  }}
                  itemStyle={{ color: isDark ? '#e2e8f0' : '#0f766e', fontWeight: 600 }}
                  labelStyle={{ color: isDark ? '#e2e8f0' : '#64748b', fontWeight: 700 }}
                  formatter={(value: number) => [`Rs ${value.toLocaleString()}`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="url(#colorRevenue)" radius={[8, 8, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Sellers & Low Stock Lists */}
        <div className="space-y-6">
          <div className="glass-card p-6 rounded-2xl">
            <h3 className="font-extrabold text-slate-900 dark:text-white mb-4 text-base tracking-tight">Top 5 Sellers</h3>
            <div className="space-y-4">
              {data?.topSellers.map((item: any, i: number) => (
                <div key={item.id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center text-xs font-bold text-cyan-600 dark:text-cyan-300 group-hover:scale-110 transition-transform duration-300 border border-cyan-400/20">
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{item.sold} units sold</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    Rs {item.revenue.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-amber-500/10">
            <h3 className="font-extrabold text-slate-900 dark:text-white mb-4 flex items-center gap-2 text-base tracking-tight">
              <AlertTriangle className="w-5 h-5 text-amber-500 dark:text-amber-400" /> Critical Stock alerts
            </h3>
            <div className="space-y-4">
              {data?.lowStock.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Threshold: {item.threshold}</p>
                  </div>
                  <div className="px-3 py-1 bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 rounded-full text-xs font-bold border border-red-200 dark:border-red-900/30">
                    {item.stock} left
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
