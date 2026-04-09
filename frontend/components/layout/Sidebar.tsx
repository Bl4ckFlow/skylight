'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, Users, ShoppingCart, FileText, LogOut, UserCog, Shield, Settings } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '@/hooks/useAuth';

type Role = string;

const NAV_ITEMS = [
  { href: '/stock',        label: 'Stock',        icon: Package,       roles: ['Admin', 'Logistique'] },
  { href: '/clients',      label: 'Clients',      icon: Users,         roles: ['Admin', 'Commercial'] },
  { href: '/commandes',    label: 'Commandes',    icon: ShoppingCart,  roles: ['Admin', 'Commercial', 'Livreur'] },
  { href: '/factures',     label: 'Factures',     icon: FileText,      roles: ['Admin', 'Comptable'] },
  { href: '/parametres',   label: 'Paramètres',   icon: Settings,      roles: ['Admin'] },
  { href: '/utilisateurs', label: 'Utilisateurs', icon: UserCog,       roles: ['Admin'] },
];

function canSee(role: Role, roles: string[]) {
  return roles.includes(role);
}

interface Props {
  onLogout: () => void;
}

export default function Sidebar({ onLogout }: Props) {
  const pathname = usePathname();
  const { user } = useAuth();
  const role = user?.role || '';
  const isSuperAdmin = role === 'SuperAdmin';

  return (
    <aside className="hidden md:flex flex-col w-56 min-h-screen bg-white border-r border-gray-200 py-6 px-3">
      {/* Logo */}
      <div className="mb-8 px-3">
        <span className="text-lg font-bold tracking-tight text-primary-950">skylight</span>
      </div>

      <nav className="flex-1 space-y-0.5">
        {/* Dashboard — visible pour tous */}
        <Link
          href="/"
          className={clsx(
            'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors duration-150',
            pathname === '/'
              ? 'bg-gray-100 text-primary-950 font-semibold'
              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-medium'
          )}
        >
          <LayoutDashboard
            size={16}
            className={pathname === '/' ? 'text-primary-950' : 'text-gray-400'}
            strokeWidth={pathname === '/' ? 2.5 : 2}
          />
          Dashboard
        </Link>

        {/* SuperAdmin : panel entreprises uniquement */}
        {isSuperAdmin && (
          <Link
            href="/admin"
            className={clsx(
              'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors duration-150',
              pathname === '/admin'
                ? 'bg-gray-100 text-primary-950 font-semibold'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-medium'
            )}
          >
            <Shield
              size={16}
              className={pathname === '/admin' ? 'text-primary-950' : 'text-gray-400'}
              strokeWidth={pathname === '/admin' ? 2.5 : 2}
            />
            Entreprises
          </Link>
        )}

        {/* Nav filtrée par rôle */}
        {!isSuperAdmin && NAV_ITEMS.filter(item => canSee(role, item.roles)).map(({ href, label, icon: Icon }) => (
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

      {/* Role badge */}
      {!isSuperAdmin && role && (
        <div className="px-3 mb-3">
          <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-full">{role}</span>
        </div>
      )}

      {/* Logout */}
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
