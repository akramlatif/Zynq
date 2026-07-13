'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/stores/useAuth';
import { useTheme } from '@/providers/ThemeProvider';
import {
  Bell,
  ChevronDown,
  ChevronRight,
  Clock,
  KeyRound,
  Lock,
  MapPin,
  MoonStar,
  Palette,
  Phone,
  Save,
  Shield,
  Smartphone,
  Store,
  SunMedium,
  ToggleRight,
  UserRound,
} from 'lucide-react';
import { toast } from 'sonner';

type SectionId = 'store-profile' | 'notifications' | 'security' | 'appearance';

const settingsGroups: { id: SectionId; title: string; description: string; icon: any }[] = [
  { id: 'store-profile', title: 'Store Profile', description: 'Shop name, location, and business identity.', icon: Store },
  { id: 'notifications', title: 'Notifications', description: 'WhatsApp reminders, stock alerts, and report frequency.', icon: Bell },
  { id: 'security', title: 'Security', description: 'Password, session, and access controls.', icon: Shield },
  { id: 'appearance', title: 'Appearance', description: 'Theme and dashboard display preferences.', icon: Palette },
];

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { user, updateUser } = useAuth();
  const [expandedSections, setExpandedSections] = useState<Set<SectionId>>(new Set());
  const sectionRefs = useRef<Record<SectionId, HTMLDivElement | null>>({
    'store-profile': null,
    'notifications': null,
    'security': null,
    'appearance': null,
  });

  const [form, setForm] = useState({
    shopName: user?.shopName ?? '',
    ownerName: user?.ownerName ?? '',
    phone: user?.phone ?? '',
    city: user?.city ?? '',
    address: user?.address ?? '',
    businessType: user?.businessType ?? '',
  });

  // Notification settings state
  const [notifSettings, setNotifSettings] = useState({
    whatsappReminders: true,
    stockAlerts: true,
    dailyReports: false,
    weeklyReports: true,
    expiryWarnings: true,
  });

  // Security settings state
  const [securityForm, setSecurityForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    setForm({
      shopName: user?.shopName ?? '',
      ownerName: user?.ownerName ?? '',
      phone: user?.phone ?? '',
      city: user?.city ?? '',
      address: user?.address ?? '',
      businessType: user?.businessType ?? '',
    });
  }, [user]);

  const handleSave = () => {
    updateUser({
      shopName: form.shopName.trim(),
      ownerName: form.ownerName.trim(),
      phone: form.phone.trim(),
      city: form.city.trim(),
      address: form.address.trim(),
      businessType: form.businessType.trim(),
    });
    toast.success('Store profile saved successfully!');
  };

  const handleNotifSave = () => {
    toast.success('Notification preferences saved!');
  };

  const handleSecuritySave = () => {
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      toast.error('Passwords do not match!');
      return;
    }
    if (securityForm.newPassword.length > 0 && securityForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    setSecurityForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    toast.success('Security settings updated!');
  };

  const toggleSection = (id: SectionId) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleConfigure = (id: SectionId) => {
    // Expand the section
    setExpandedSections((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    // Scroll to the section after a brief delay to allow render
    setTimeout(() => {
      sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const isSectionExpanded = (id: SectionId) => expandedSections.has(id);

  return (
    <div className="space-y-6 animate-slide-up-fade">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
          <ToggleRight className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Settings</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage your store, alerts, and product preferences.</p>
        </div>
      </div>

      {/* Settings Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {settingsGroups.map((group) => (
          <div key={group.title} className="glass-card p-5 rounded-2xl hover:border-primary/30 transition-all duration-300 hover:-translate-y-0.5">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-primary/10 text-primary border border-primary/20">
                <group.icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{group.title}</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{group.description}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between rounded-2xl bg-slate-50 dark:bg-slate-800/50 px-4 py-3 border border-slate-100 dark:border-slate-700/30">
              <button
                onClick={() => handleConfigure(group.id)}
                className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2 hover:text-primary dark:hover:text-cyan-300 transition-colors"
              >
                <ChevronRight className={`w-4 h-4 text-primary transition-transform duration-200 ${isSectionExpanded(group.id) ? 'rotate-90' : ''}`} /> Open section
              </button>
              <button
                onClick={() => handleConfigure(group.id)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-500 text-white text-sm font-semibold shadow-[0_10px_20px_rgba(13,148,136,0.18)] hover:shadow-[0_12px_24px_rgba(13,148,136,0.24)] hover:-translate-y-0.5 transition-all active:scale-95"
              >
                Configure
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════
          APPEARANCE SECTION (Always visible toggle)
         ═══════════════════════════════════════════════════════════ */}
      <div
        ref={(el) => { sectionRefs.current['appearance'] = el; }}
        className="glass-card p-5 rounded-2xl"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Appearance</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Choose the color mode that feels best while you work.</p>
          </div>
          <div className="inline-flex rounded-2xl border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/50 p-1">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${theme === 'light' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
            >
              <SunMedium className="w-4 h-4" /> Light
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${theme === 'dark' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
            >
              <MoonStar className="w-4 h-4" /> Dark
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          STORE PROFILE SECTION (Expandable)
         ═══════════════════════════════════════════════════════════ */}
      <div
        ref={(el) => { sectionRefs.current['store-profile'] = el; }}
        className="glass-card rounded-2xl overflow-hidden"
      >
        <button
          type="button"
          onClick={() => toggleSection('store-profile')}
          className="w-full flex items-center justify-between p-6 text-left"
        >
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Store Profile</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Update the business name, owner info, and contact details shown throughout Zynq.</p>
          </div>
          <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isSectionExpanded('store-profile') ? 'rotate-180' : ''}`} />
        </button>

        {isSectionExpanded('store-profile') && (
          <div className="px-6 pb-6 space-y-5 border-t border-slate-100 dark:border-slate-700/30 pt-5 animate-slide-up-fade">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-cyan-600 text-white text-sm font-semibold shadow-[0_12px_30px_rgba(15,23,42,0.18)] hover:bg-slate-800 dark:hover:bg-cyan-700 transition-colors"
              >
                <Save className="w-4 h-4" /> Save Changes
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2"><Store className="w-4 h-4 text-primary" /> Shop Name</span>
                <input
                  value={form.shopName}
                  onChange={(e) => setForm((c) => ({ ...c, shopName: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white/90 dark:bg-slate-800/60 px-4 py-3 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-slate-400"
                  placeholder="My Awesome Shop"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2"><UserRound className="w-4 h-4 text-primary" /> Owner Name</span>
                <input
                  value={form.ownerName}
                  onChange={(e) => setForm((c) => ({ ...c, ownerName: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white/90 dark:bg-slate-800/60 px-4 py-3 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-slate-400"
                  placeholder="Ali"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2"><Phone className="w-4 h-4 text-primary" /> Phone</span>
                <input
                  value={form.phone}
                  onChange={(e) => setForm((c) => ({ ...c, phone: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white/90 dark:bg-slate-800/60 px-4 py-3 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-slate-400"
                  placeholder="03xxxxxxxxx"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> City</span>
                <input
                  value={form.city}
                  onChange={(e) => setForm((c) => ({ ...c, city: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white/90 dark:bg-slate-800/60 px-4 py-3 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-slate-400"
                  placeholder="Karachi"
                />
              </label>

              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2"><Store className="w-4 h-4 text-primary" /> Business Type</span>
                <input
                  value={form.businessType}
                  onChange={(e) => setForm((c) => ({ ...c, businessType: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white/90 dark:bg-slate-800/60 px-4 py-3 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-slate-400"
                  placeholder="Grocery, pharmacy, electronics..."
                />
              </label>

              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Address</span>
                <textarea
                  value={form.address}
                  onChange={(e) => setForm((c) => ({ ...c, address: e.target.value }))}
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white/90 dark:bg-slate-800/60 px-4 py-3 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/30 resize-none placeholder:text-slate-400"
                  placeholder="Street, area, city"
                />
              </label>
            </div>

            <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/30 px-4 py-3 text-sm text-slate-600 dark:text-slate-400 flex flex-wrap items-center gap-3 justify-between">
              <span className="font-medium">Changes save locally in this session and persist across refreshes.</span>
              <span className="text-primary font-semibold">Zynq profile editor</span>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════
          NOTIFICATIONS SECTION (Expandable)
         ═══════════════════════════════════════════════════════════ */}
      <div
        ref={(el) => { sectionRefs.current['notifications'] = el; }}
        className="glass-card rounded-2xl overflow-hidden"
      >
        <button
          type="button"
          onClick={() => toggleSection('notifications')}
          className="w-full flex items-center justify-between p-6 text-left"
        >
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Notifications</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">WhatsApp reminders, stock alerts, and report frequency.</p>
          </div>
          <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isSectionExpanded('notifications') ? 'rotate-180' : ''}`} />
        </button>

        {isSectionExpanded('notifications') && (
          <div className="px-6 pb-6 space-y-4 border-t border-slate-100 dark:border-slate-700/30 pt-5 animate-slide-up-fade">
            {[
              { key: 'whatsappReminders', label: 'WhatsApp Reminders', desc: 'Send Udhaar payment reminders via WhatsApp.', icon: Smartphone },
              { key: 'stockAlerts', label: 'Low Stock Alerts', desc: 'Get notified when inventory falls below threshold.', icon: Bell },
              { key: 'expiryWarnings', label: 'Expiry Warnings', desc: 'Daily alerts for products nearing expiry date.', icon: Clock },
              { key: 'dailyReports', label: 'Daily Revenue Reports', desc: 'Receive a daily sales summary via WhatsApp.', icon: Bell },
              { key: 'weeklyReports', label: 'Weekly Reports', desc: 'Get a comprehensive weekly business report.', icon: Bell },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <item.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.label}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setNotifSettings((prev) => ({ ...prev, [item.key]: !prev[item.key as keyof typeof prev] }))}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${notifSettings[item.key as keyof typeof notifSettings] ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${notifSettings[item.key as keyof typeof notifSettings] ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            ))}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleNotifSave}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-cyan-600 text-white text-sm font-semibold shadow-[0_12px_30px_rgba(15,23,42,0.18)] hover:bg-slate-800 dark:hover:bg-cyan-700 transition-colors"
              >
                <Save className="w-4 h-4" /> Save Preferences
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════
          SECURITY SECTION (Expandable)
         ═══════════════════════════════════════════════════════════ */}
      <div
        ref={(el) => { sectionRefs.current['security'] = el; }}
        className="glass-card rounded-2xl overflow-hidden"
      >
        <button
          type="button"
          onClick={() => toggleSection('security')}
          className="w-full flex items-center justify-between p-6 text-left"
        >
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Security</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Password, session, and access controls.</p>
          </div>
          <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isSectionExpanded('security') ? 'rotate-180' : ''}`} />
        </button>

        {isSectionExpanded('security') && (
          <div className="px-6 pb-6 space-y-5 border-t border-slate-100 dark:border-slate-700/30 pt-5 animate-slide-up-fade">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2"><KeyRound className="w-4 h-4 text-primary" /> Current Password</span>
                <input
                  type="password"
                  value={securityForm.currentPassword}
                  onChange={(e) => setSecurityForm((c) => ({ ...c, currentPassword: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white/90 dark:bg-slate-800/60 px-4 py-3 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-slate-400"
                  placeholder="Enter current password"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2"><Lock className="w-4 h-4 text-primary" /> New Password</span>
                <input
                  type="password"
                  value={securityForm.newPassword}
                  onChange={(e) => setSecurityForm((c) => ({ ...c, newPassword: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white/90 dark:bg-slate-800/60 px-4 py-3 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-slate-400"
                  placeholder="Enter new password"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2"><Lock className="w-4 h-4 text-primary" /> Confirm Password</span>
                <input
                  type="password"
                  value={securityForm.confirmPassword}
                  onChange={(e) => setSecurityForm((c) => ({ ...c, confirmPassword: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white/90 dark:bg-slate-800/60 px-4 py-3 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-slate-400"
                  placeholder="Confirm new password"
                />
              </label>
            </div>

            <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
              <p className="font-medium">⚠ Password changes will require re-authentication on all devices.</p>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSecuritySave}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-cyan-600 text-white text-sm font-semibold shadow-[0_12px_30px_rgba(15,23,42,0.18)] hover:bg-slate-800 dark:hover:bg-cyan-700 transition-colors"
              >
                <Save className="w-4 h-4" /> Update Security
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}