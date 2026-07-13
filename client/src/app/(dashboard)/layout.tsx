'use client';

import { useAuth } from '@/stores/useAuth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Package, 
  Receipt, 
  BookOpenCheck, 
  MessageSquareText, 
  BarChart3, 
  Settings,
  LogOut,
  Store,
  Menu,
  X
} from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Inventory', href: '/inventory', icon: Package },
  { name: 'Billing', href: '/billing', icon: Receipt },
  { name: 'Udhaar', href: '/udhaar', icon: BookOpenCheck },
  { name: 'Agent Chat', href: '/chat', icon: MessageSquareText },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Basic protection - if no user, redirect to login
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated || !user) {
    return null; // Or a loading spinner
  }

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 dark:bg-[#0f1729] text-slate-900 dark:text-slate-100 flex flex-col md:flex-row">
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white/90 dark:bg-slate-900/95 backdrop-blur-2xl border-b border-slate-200 dark:border-slate-700/50 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2">
          <Store className="w-6 h-6 text-primary" />
          <span className="font-bold text-lg text-slate-900 dark:text-white truncate max-w-[200px]">
            Zynq
          </span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-[73px] left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-b border-slate-200 dark:border-slate-700/50 shadow-2xl z-40">
          <div className="p-4 space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    isActive 
                      ? 'bg-primary/10 text-primary font-medium' 
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-66 bg-white/92 dark:bg-slate-900/95 backdrop-blur-2xl border-r border-slate-200/60 dark:border-slate-700/40 sticky top-0 h-screen overflow-y-auto shadow-[0_30px_80px_rgba(15,23,42,0.08)] dark:shadow-[0_30px_80px_rgba(0,0,0,0.3)]">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700/40 bg-gradient-to-b from-white/30 dark:from-slate-800/30 to-transparent">
          <div className="flex items-center gap-3.5 mb-2">
            <div className="bg-primary/10 dark:bg-primary/15 p-2.5 rounded-xl transition-transform hover:scale-105 duration-300 shadow-sm shadow-cyan-500/10">
              <Store className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-900 dark:text-white leading-tight truncate w-40 tracking-tight">Zynq</h2>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 truncate w-40">{user.shopName}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1.5">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-300 relative group overflow-hidden ${
                  isActive 
                    ? 'bg-cyan-100 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 shadow-[0_0_0_1px_rgba(34,211,238,0.18),0_10px_24px_rgba(34,211,238,0.10)] scale-[1.02]' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-primary dark:hover:text-cyan-300'
                }`}
              >
                <item.icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-primary dark:group-hover:text-cyan-400'}`} />
                <span className="font-semibold text-sm">{item.name}</span>
                {isActive && (
                  <span className="absolute right-0 top-1/4 bottom-1/4 w-1 bg-cyan-400 rounded-l-md shadow-[0_0_18px_rgba(34,211,238,0.8)]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Profile Card & Logout */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-700/40 space-y-3">
          <div className="flex items-center gap-3 px-3 py-2 bg-slate-50/60 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/30 rounded-xl backdrop-blur-sm">
            <div className="w-9 h-9 rounded-full bg-primary/10 dark:bg-primary/15 flex items-center justify-center font-bold text-primary uppercase border border-primary/20 dark:border-primary/25">
              {user.ownerName.charAt(0)}
            </div>
            <div className="truncate flex-1">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{user.ownerName}</p>
              <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 truncate">{user.phone}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200 group font-semibold text-sm"
          >
            <LogOut className="w-5 h-5 text-slate-400 group-hover:text-red-500 transition-colors" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="relative flex-1 overflow-y-auto pb-20 md:pb-0 bg-slate-50 dark:bg-[#0f1729]">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/95 backdrop-blur-2xl border-t border-slate-200 dark:border-slate-700/50 flex items-center justify-around p-2 z-50 safe-area-bottom shadow-[0_-8px_30px_rgba(15,23,42,0.08)]">
        {NAV_ITEMS.slice(0, 5).map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-colors ${
                isActive ? 'text-primary' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <div className={`p-1.5 rounded-full ${isActive ? 'bg-primary/10' : ''}`}>
                <item.icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-medium mt-1 truncate w-full text-center">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
