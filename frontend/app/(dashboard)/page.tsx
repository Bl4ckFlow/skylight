'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle, ShoppingCart, FileText, Package, Users,
  TrendingUp, Building2, Shield, ArrowUpRight, Banknote, Clock,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import clsx from 'clsx';

// ── Types ─────────────────────────────────────────────────────────────────────
interface PlatformStats {
  total_companies: number; total_users: number;
  total_clients: number; total_orders: number;
}

interface DashboardData {
  kpis: {
    total_orders: number; pending_orders: number; delivered_orders: number;
    total_revenue: number; unpaid_amount: number; total_clients: number;
    low_stock_count: number; unpaid_invoices: number;
  };
  caMonthly: { month: string; revenue: number; orders_count: number }[];
  topProducts: { name: string; total_qty: number; total_revenue: number }[];
  recentOrders: { id: string; client_name: string; total_amount: number; status: string; created_at: string }[];
}

const STATUS_STYLES: Record<string, string> = {
  'En attente': 'bg-amber-50 text-amber-700',
  'En cours':   'bg-blue-50 text-blue-700',
  'Livrée':     'bg-green-50 text-green-700',
};

const MONTH_SHORT: Record<string, string> = {
  '01': 'Jan', '02': 'Fév', '03': 'Mar', '04': 'Avr', '05': 'Mai', '06': 'Jun',
  '07': 'Jul', '08': 'Aoû', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Déc',
};

function fmtMonth(ym: string) {
  const [, m] = ym.split('-');
  return MONTH_SHORT[m] ?? ym;
}

function fmtDA(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

// ── Custom tooltip ─────────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-gray-700 dark:text-gray-200 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name === 'revenue' ? `${Number(p.value).toLocaleString('fr-DZ')} DA` : `${p.value} cmd`}
        </p>
      ))}
    </div>
  );
};

// ── SuperAdmin ─────────────────────────────────────────────────────────────────
function SuperAdminDashboard() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats').then(r => setStats(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <Header title="Dashboard" subtitle="Vue globale de la plateforme" icon={<Shield size={18} />} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Entreprises"  value={stats?.total_companies ?? 0} icon={<Building2 size={15} />} color="blue"    href="/admin" />
        <KpiCard label="Utilisateurs" value={stats?.total_users ?? 0}     icon={<Users size={15} />}     color="green"   href="/admin" />
        <KpiCard label="Clients"      value={stats?.total_clients ?? 0}   icon={<Users size={15} />}     color="warning" href="/admin" />
        <KpiCard label="Commandes"    value={stats?.total_orders ?? 0}    icon={<ShoppingCart size={15} />} color="red"  href="/admin" />
      </div>
      <div className="card flex items-center justify-between">
        <div>
          <p className="font-medium text-gray-900 dark:text-gray-100">Gérer les entreprises</p>
          <p className="text-sm text-gray-400 mt-0.5">Créer et consulter les comptes clients</p>
        </div>
        <Link href="/admin" className="btn-primary text-sm">Voir →</Link>
      </div>
    </div>
  );
}

// ── Company dashboard ──────────────────────────────────────────────────────────
function CompanyDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (!data) return null;

  const { kpis, caMonthly, topProducts, recentOrders } = data;
  const chartData = caMonthly.map(d => ({ ...d, month: fmtMonth(d.month) }));
  const maxRevenue = Math.max(...topProducts.map(p => Number(p.total_revenue)), 1);

  return (
    <div className="space-y-6">
      <Header title="Dashboard" subtitle="Vue d'ensemble de votre activité" />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Chiffre d'affaires" value={`${fmtDA(Number(kpis.total_revenue))} DA`} icon={<Banknote size={15} />} color="green" href="/factures" />
        <KpiCard label="Impayés"  value={`${fmtDA(Number(kpis.unpaid_amount))} DA`} icon={<FileText size={15} />} color="red" href="/factures" />
        <KpiCard label="Commandes en attente" value={kpis.pending_orders} icon={<Clock size={15} />} color="blue" href="/commandes" />
        <KpiCard label="Alertes stock" value={kpis.low_stock_count} icon={<AlertTriangle size={15} />} color="warning" href="/stock" />
      </div>

      {/* CA Chart */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Chiffre d'affaires mensuel</h2>
            <p className="text-xs text-gray-400 mt-0.5">12 derniers mois</p>
          </div>
          <TrendingUp size={16} className="text-gray-300" />
        </div>
        {chartData.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">Pas encore de données</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="caGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#09090b" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#09090b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmtDA} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={40} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="revenue" name="revenue" stroke="#09090b" strokeWidth={2} fill="url(#caGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Top produits */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Top 5 produits vendus</h2>
          {topProducts.length === 0 ? (
            <p className="text-gray-400 text-sm">Pas encore de ventes</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, i) => (
                <div key={p.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-gray-700 dark:text-gray-300 truncate">{i + 1}. {p.name}</span>
                    <span className="text-gray-400 shrink-0 ml-2">{p.total_qty} unités</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-950 dark:bg-white rounded-full"
                      style={{ width: `${(Number(p.total_revenue) / maxRevenue) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dernières commandes */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Dernières commandes</h2>
            <Link href="/commandes" className="text-xs text-gray-400 hover:text-primary-950 dark:hover:text-white flex items-center gap-1">
              Voir tout <ArrowUpRight size={11} />
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="text-gray-400 text-sm">Aucune commande</p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {recentOrders.map(o => (
                <div key={o.id} className="flex items-center justify-between py-2.5 gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{o.client_name}</p>
                    <p className="text-xs text-gray-400">{new Date(o.created_at).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full shrink-0', STATUS_STYLES[o.status])}>
                    {o.status}
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 shrink-0">
                    {Number(o.total_amount).toLocaleString('fr-DZ')} DA
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Commandes bar chart */}
      {chartData.length > 0 && (
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Nombre de commandes / mois</h2>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={24} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="orders_count" name="orders_count" fill="#09090b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// ── Shared components ──────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-5 h-5 border-2 border-primary-950 dark:border-white border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function Header({ title, subtitle, icon }: { title: string; subtitle: string; icon?: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        {icon && <span className="text-primary-950 dark:text-white">{icon}</span>}
        <h1 className="text-xl font-semibold text-primary-950 dark:text-white">{title}</h1>
      </div>
      <p className="text-gray-400 text-sm mt-0.5">{subtitle}</p>
    </div>
  );
}

function KpiCard({ label, value, icon, color, href }: {
  label: string; value: string | number; icon: React.ReactNode; color: string; href: string;
}) {
  const colors: Record<string, string> = {
    green:   'dark:bg-green-950/30 bg-green-50 border-green-100',
    red:     'dark:bg-red-950/30 bg-red-50 border-red-100',
    blue:    'dark:bg-blue-950/30 bg-blue-50 border-blue-100',
    warning: 'dark:bg-orange-950/30 bg-orange-50 border-orange-100',
  };
  const iconColors: Record<string, string> = {
    green: 'text-green-600', red: 'text-red-600', blue: 'text-blue-600', warning: 'text-orange-500',
  };
  return (
    <Link href={href} className={clsx('card border hover:shadow-md transition-all duration-150', colors[color])}>
      <div className="flex items-center gap-1.5 mb-2">
        <span className={iconColors[color]}>{icon}</span>
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 leading-tight">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    </Link>
  );
}

// ── Root ───────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth();
  if (user?.role === 'SuperAdmin') return <SuperAdminDashboard />;
  return <CompanyDashboard />;
}
