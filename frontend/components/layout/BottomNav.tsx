'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, Users, ShoppingCart, FileText, Shield } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '@/hooks/useAuth';

const ALL_NAV = [
  { href: '/',          label: 'Home',      icon: LayoutDashboard, roles: ['Admin', 'Comptable', 'Commercial', 'Logistique', 'Livreur', 'Employé'] },
  { href: '/stock',     label: 'Stock',     icon: Package,         roles: ['Admin', 'Logistique'] },
  { href: '/clients',   label: 'Clients',   icon: Users,           roles: ['Admin', 'Commercial'] },
  { href: '/commandes', label: 'Commandes', icon: ShoppingCart,    roles: ['Admin', 'Commercial', 'Livreur'] },
  { href: '/factures',  label: 'Factures',  icon: FileText,        roles: ['Admin', 'Comptable'] },
];

const superAdminNav = [
  { href: '/',      label: 'Home',        icon: LayoutDashboard },
  { href: '/admin', label: 'Entreprises', icon: Shield },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  const role = user?.role || '';
  const nav = role === 'SuperAdmin'
    ? superAdminNav
    : ALL_NAV.filter(item => item.roles.includes(role));

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around items-center px-1 py-1.5">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              'flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg transition-colors duration-150',
              pathname === href ? 'text-primary-950' : 'text-gray-400 hover:text-gray-600'
            )}
          >
            <Icon size={19} strokeWidth={pathname === href ? 2.5 : 1.75} />
            <span className={clsx('text-[10px] font-medium', pathname === href ? 'text-primary-950' : 'text-gray-400')}>
              {label}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
