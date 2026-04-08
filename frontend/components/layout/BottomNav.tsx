'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, Users, ShoppingCart, FileText } from 'lucide-react';
import clsx from 'clsx';

const nav = [
  { href: '/',          label: 'Home',     icon: LayoutDashboard },
  { href: '/stock',     label: 'Stock',    icon: Package },
  { href: '/clients',   label: 'Clients',  icon: Users },
  { href: '/commandes', label: 'Commandes', icon: ShoppingCart },
  { href: '/factures',  label: 'Factures', icon: FileText },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around items-center px-1 py-1.5">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              'flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg transition-colors duration-150',
              pathname === href
                ? 'text-primary-950'
                : 'text-gray-400 hover:text-gray-600'
            )}
          >
            <Icon
              size={19}
              strokeWidth={pathname === href ? 2.5 : 1.75}
            />
            <span className={clsx(
              'text-[10px] font-medium',
              pathname === href ? 'text-primary-950' : 'text-gray-400'
            )}>
              {label}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
