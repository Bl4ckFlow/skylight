'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, Users, ShoppingCart, FileText, LogOut, UserCog, Shield, Settings, Sun, Moon } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '@/hooks/useAuth';
import { useDarkMode } from '@/hooks/useDarkMode';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

type Role = string;

const NAV_ITEMS = [
  { href: '/stock',        label: 'Stock',        icon: Package,       roles: ['Admin', 'Logistique'],              badge: 'lowStock' },
  { href: '/clients',      label: 'Clients',      icon: Users,         roles: ['Admin', 'Commercial'],              badge: null },
  { href: '/commandes',    label: 'Commandes',    icon: ShoppingCart,  roles: ['Admin', 'Commercial', 'Livreur'],   badge: null },
  { href: '/factures',     label: 'Factures',     icon: FileText,      roles: ['Admin', 'Comptable'],               badge: null },
  { href: '/parametres',   label: 'Paramètres',   icon: Settings,      roles: ['Admin'],                            badge: null },
  { href: '/utilisateurs', label: 'Utilisateurs', icon: UserCog,       roles: ['Admin'],                            badge: null },
];

interface Props {
  onLogout: () => void;
}

export default function Sidebar({ onLogout }: Props) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { dark, toggle } = useDarkMode();
  const [lowStockCount, setLowStockCount] = useState(0);
  const role = user?.role || '';
  const isSuperAdmin = role === 'SuperAdmin';

  useEffect(() => {
    if (['Admin', 'Logistique'].includes(role)) {
      api.get('/stock/low').then(r => setLowStockCount(r.data.length)).catch(() => {});
    }
  }, [role]);

  return (
    <aside className="hidden md:flex flex-col w-56 min-h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 py-6 px-3 transition-colors duration-200">
      {/* Logo */}
      <div className="mb-8 px-3 flex items-center justify-between">
        <span className="text-lg font-bold tracking-tight text-primary-950 dark:text-white">skylight</span>
        <button onClick={toggle} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors">
          {dark ? <Sun size={14} /> : <Moon size={14} />}
        </button>
      </div>

      <nav className="flex-1 space-y-0.5">
        {/* Dashboard */}
        <Link
          href="/"
          className={clsx(
            'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors duration-150',
            pathname === '/'
              ? 'bg-gray-100 dark:bg-gray-800 text-primary-950 dark:text-white font-semibold'
              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white font-medium'
          )}
        >
          <LayoutDashboard size={16} className={pathname === '/' ? 'text-primary-950 dark:text-white' : 'text-gray-400'} strokeWidth={pathname === '/' ? 2.5 : 2} />
          Dashboard
        </Link>

        {/* SuperAdmin */}
        {isSuperAdmin && (
          <Link
            href="/admin"
            className={clsx(
              'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors duration-150',
              pathname === '/admin'
                ? 'bg-gray-100 dark:bg-gray-800 text-primary-950 dark:text-white font-semibold'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white font-medium'
            )}
          >
            <Shield size={16} className={pathname === '/admin' ? 'text-primary-950 dark:text-white' : 'text-gray-400'} strokeWidth={pathname === '/admin' ? 2.5 : 2} />
            Entreprises
          </Link>
        )}

        {/* Filtered nav */}
        {!isSuperAdmin && NAV_ITEMS.filter(item => item.roles.includes(role)).map(({ href, label, icon: Icon, badge }) => {
          const count = badge === 'lowStock' ? lowStockCount : 0;
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors duration-150',
                pathname === href
                  ? 'bg-gray-100 dark:bg-gray-800 text-primary-950 dark:text-white font-semibold'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white font-medium'
              )}
            >
              <Icon size={16} className={pathname === href ? 'text-primary-950 dark:text-white' : 'text-gray-400'} strokeWidth={pathname === href ? 2.5 : 2} />
              <span className="flex-1">{label}</span>
              {count > 0 && (
                <span className="text-[10px] font-bold bg-orange-500 text-white rounded-full px-1.5 py-0.5 leading-none">
                  {count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Role badge */}
      {!isSuperAdmin && role && (
        <div className="px-3 mb-3">
          <span className="text-xs font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">{role}</span>
        </div>
      )}

      {/* Logout */}
      <div className="border-t border-gray-100 dark:border-gray-800 pt-3 mt-3">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200 transition-colors duration-150"
        >
          <LogOut size={16} strokeWidth={2} />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
