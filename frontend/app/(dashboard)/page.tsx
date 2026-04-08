'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ShoppingCart, FileText, Package, Users, TrendingUp } from 'lucide-react';
import api from '@/lib/api';
import { Product, Order, Invoice } from '@/types';

export default function DashboardPage() {
  const [lowStock, setLowStock] = useState<Product[]>([]);
  const [orders, setOrders]     = useState<Order[]>([]);
  const [unpaid, setUnpaid]     = useState<Invoice[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/stock/low'),
      api.get('/commandes?status=En attente'),
      api.get('/factures?payment_status=Non Payé'),
    ]).then(([s, o, f]) => {
      setLowStock(s.data);
      setOrders(o.data);
      setUnpaid(f.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 border-2 border-primary-950 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-primary-950">Dashboard</h1>
        <p className="text-gray-400 text-sm mt-0.5">Vue d'ensemble de votre activité</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard
          label="Alertes stock"
          value={lowStock.length}
          icon={<AlertTriangle size={15} className="text-[#B45309]" />}
          accent="warning"
          href="/stock"
        />
        <StatCard
          label="Commandes en attente"
          value={orders.length}
          icon={<ShoppingCart size={15} className="text-[#1E40AF]" />}
          accent="blue"
          href="/commandes"
        />
        <StatCard
          label="Factures impayées"
          value={unpaid.length}
          icon={<FileText size={15} className="text-[#991B1B]" />}
          accent="danger"
          href="/factures"
        />
      </div>

      {/* Alertes stock faible */}
      {lowStock.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={14} className="text-[#B45309]" />
            <h2 className="text-sm font-semibold text-primary-950">Stock faible</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {lowStock.slice(0, 5).map((p) => (
              <div key={p.id} className="flex justify-between items-center py-2.5">
                <span className="text-sm text-gray-700">{p.name}</span>
                <span className="badge-warning">{p.stock_quantity} restants</span>
              </div>
            ))}
          </div>
          {lowStock.length > 5 && (
            <Link href="/stock" className="text-xs font-medium text-gray-400 hover:text-primary-950 mt-3 block transition-colors">
              Voir tout ({lowStock.length}) →
            </Link>
          )}
        </div>
      )}

      {/* Dernières commandes */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-primary-950">Commandes en attente</h2>
          <Link href="/commandes" className="text-xs font-medium text-gray-400 hover:text-primary-950 transition-colors">
            Voir tout →
          </Link>
        </div>
        {orders.length === 0 ? (
          <p className="text-gray-400 text-sm">Aucune commande en attente</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {orders.slice(0, 5).map((o) => (
              <div key={o.id} className="flex justify-between items-center py-2.5">
                <div>
                  <p className="text-sm font-medium text-gray-800">{o.client_name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{new Date(o.created_at).toLocaleDateString('fr-FR')}</p>
                </div>
                <span className="text-sm font-semibold text-primary-950">
                  {Number(o.total_amount).toLocaleString('fr-DZ')} DA
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Navigation rapide */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Navigation rapide</p>
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { href: '/stock',     label: 'Gérer le stock',      icon: Package },
            { href: '/clients',   label: 'Voir les clients',    icon: Users },
            { href: '/commandes', label: 'Nouvelles commandes', icon: ShoppingCart },
            { href: '/factures',  label: 'Gérer les factures',  icon: TrendingUp },
          ].map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="card flex items-center gap-3 hover:border-gray-300 transition-colors cursor-pointer group"
            >
              <div className="p-1.5 rounded-md bg-gray-100 group-hover:bg-gray-200 transition-colors">
                <Icon size={15} className="text-gray-600" />
              </div>
              <span className="text-sm font-medium text-gray-700 group-hover:text-primary-950 transition-colors">
                {label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label, value, icon, accent, href,
}: {
  label: string; value: number; icon: React.ReactNode; accent: string; href: string;
}) {
  const styles: Record<string, string> = {
    warning: 'border-[#FEF3C7] bg-[#FFFBEB]',
    blue:    'border-[#DBEAFE] bg-[#EFF6FF]',
    danger:  'border-[#FEE2E2] bg-[#FEF2F2]',
  };
  return (
    <Link href={href} className={`card border ${styles[accent]} hover:shadow-md transition-all duration-150`}>
      <div className="flex items-center gap-1.5 mb-3">
        {icon}
        <span className="text-xs font-medium text-gray-500">{label}</span>
      </div>
      <p className="text-3xl font-bold text-primary-950">{value}</p>
    </Link>
  );
}
