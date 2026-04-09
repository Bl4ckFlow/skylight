'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, Users, ShoppingCart, FileText, LogOut, UserCog } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '@/hooks/useAuth';

const nav = [
  { href: '/',          label: 'Dashboard', icon: LayoutDashboard },
  { href: '/stock',     label: 'Stock',     icon: Package },
  { href: '/clients',   label: 'Clients',   icon: Users },
  { href: '/commandes', label: 'Commandes', icon: ShoppingCart },
  { href: '/factures',  label: 'Factures',  icon: FileText },
];

interface Props {
  onLogout: () => void;
}

export default function Sidebar({ onLogout }: Props) {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <aside className="hidden md:flex flex-col w-56 min-h-screen bg-white border-r border-gray-200 py-6 px-3">
      {/* Logo */}
      <div className="mb-8 px-3">
        <span className="text-lg font-bold tracking-tight text-primary-950">skylight</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors duration-150',
              pathname === href
                ? 'bg-gray-100 text-primary-950 font-semibold'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-medium'
            )}
          >
            <Icon
              size={16}
              className={pathname === href ? 'text-primary-950' : 'text-gray-400'}
              strokeWidth={pathname === href ? 2.5 : 2}
            />
            {label}
          </Link>
        ))}
      </nav>

      {/* Admin: Utilisateurs */}
      {user?.role === 'Admin' && (
        <div className="border-t border-gray-100 pt-3 mt-3">
          <Link
            href="/utilisateurs"
            className={clsx(
              'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors duration-150',
              pathname === '/utilisateurs'
                ? 'bg-gray-100 text-primary-950 font-semibold'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-medium'
            )}
          >
            <UserCog
              size={16}
              className={pathname === '/utilisateurs' ? 'text-primary-950' : 'text-gray-400'}
              strokeWidth={pathname === '/utilisateurs' ? 2.5 : 2}
            />
            Utilisateurs
          </Link>
        </div>
      )}

      {/* Divider + Logout */}
      <div className="border-t border-gray-100 pt-3 mt-3">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-50 hover:text-gray-700 transition-colors duration-150"
        >
          <LogOut size={16} strokeWidth={2} />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
