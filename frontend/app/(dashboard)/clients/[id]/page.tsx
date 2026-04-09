'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Phone, Mail, MapPin, Building2, User,
  ShoppingCart, FileText, TrendingUp, Clock, BadgeCheck,
} from 'lucide-react';
import api from '@/lib/api';
import clsx from 'clsx';

interface ClientDetail {
  id: string;
  full_name: string;
  phone?: string;
  email?: string;
  address?: string;
  client_type: string;
  nif?: string;
  nis?: string;
  rc?: string;
  ai?: string;
  created_at: string;
}

interface ClientStats {
  total_orders: number;
  total_spent: number;
  unpaid_invoices: number;
  unpaid_amount: number;
  last_order_at: string | null;
}

interface Order {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
  client_confirmed: boolean;
}

const STATUS_STYLES: Record<string, string> = {
  'En attente': 'bg-amber-50 text-amber-700',
  'En cours':   'bg-blue-50 text-blue-700',
  'Livrée':     'bg-green-50 text-green-700',
};

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [client, setClient]   = useState<ClientDetail | null>(null);
  const [stats, setStats]     = useState<ClientStats | null>(null);
  const [orders, setOrders]   = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/clients/${id}`),
      api.get(`/clients/${id}/stats`),
      api.get(`/clients/${id}/orders`),
    ]).then(([c, s, o]) => {
      setClient(c.data);
      setStats(s.data);
      setOrders(o.data);
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-6 h-6 border-2 border-primary-950 dark:border-white border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!client) return (
    <div className="text-center py-16 text-gray-400">Client introuvable</div>
  );

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Back */}
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
        <ArrowLeft size={15} /> Retour
      </button>

      {/* Header */}
      <div className="card flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
          {client.client_type === 'Entreprise'
            ? <Building2 size={22} className="text-blue-500" />
            : <User size={22} className="text-gray-500" />
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{client.full_name}</h1>
            <span className={clsx(
              'text-xs font-medium px-2 py-0.5 rounded-full',
              client.client_type === 'Entreprise' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'
            )}>
              {client.client_type}
            </span>
          </div>
          <div className="flex flex-wrap gap-3 mt-2">
            {client.phone   && <span className="flex items-center gap-1 text-sm text-gray-500"><Phone size={13} />{client.phone}</span>}
            {client.email   && <span className="flex items-center gap-1 text-sm text-gray-500"><Mail size={13} />{client.email}</span>}
            {client.address && <span className="flex items-center gap-1 text-sm text-gray-500"><MapPin size={13} />{client.address}</span>}
          </div>
          {client.client_type === 'Entreprise' && (
            <div className="flex flex-wrap gap-3 mt-2">
              {client.nif && <span className="text-xs text-gray-400">NIF: {client.nif}</span>}
              {client.nis && <span className="text-xs text-gray-400">NIS: {client.nis}</span>}
              {client.rc  && <span className="text-xs text-gray-400">RC: {client.rc}</span>}
              {client.ai  && <span className="text-xs text-gray-400">AI: {client.ai}</span>}
            </div>
          )}
        </div>
        <p className="text-xs text-gray-400 shrink-0">
          Client depuis {new Date(client.created_at).toLocaleDateString('fr-FR')}
        </p>
      </div>

      {/* Stats KPIs */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="card text-center">
            <ShoppingCart size={16} className="text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total_orders}</p>
            <p className="text-xs text-gray-400 mt-1">Commandes</p>
          </div>
          <div className="card text-center">
            <TrendingUp size={16} className="text-green-500 mx-auto mb-2" />
            <p className="text-lg font-bold text-gray-900 dark:text-white">{Number(stats.total_spent).toLocaleString('fr-DZ')} DA</p>
            <p className="text-xs text-gray-400 mt-1">Total acheté</p>
          </div>
          <div className="card text-center">
            <FileText size={16} className="text-red-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.unpaid_invoices}</p>
            <p className="text-xs text-gray-400 mt-1">Factures impayées</p>
          </div>
          <div className="card text-center">
            <Clock size={16} className="text-orange-500 mx-auto mb-2" />
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              {stats.last_order_at ? new Date(stats.last_order_at).toLocaleDateString('fr-FR') : '—'}
            </p>
            <p className="text-xs text-gray-400 mt-1">Dernière commande</p>
          </div>
        </div>
      )}

      {/* Impayés alert */}
      {stats && Number(stats.unpaid_amount) > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900 rounded-xl">
          <FileText size={15} className="text-red-500 shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-400">
            Solde impayé : <span className="font-bold">{Number(stats.unpaid_amount).toLocaleString('fr-DZ')} DA</span>
          </p>
        </div>
      )}

      {/* Orders list */}
      <div className="card">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Historique des commandes ({orders.length})
        </h2>
        {orders.length === 0 ? (
          <p className="text-gray-400 text-sm">Aucune commande</p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {orders.map(o => (
              <div key={o.id} className="flex items-center justify-between py-3 gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-gray-400">{new Date(o.created_at).toLocaleDateString('fr-FR')}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full', STATUS_STYLES[o.status])}>
                    {o.status}
                  </span>
                  {o.status === 'Livrée' && o.client_confirmed && (
                    <span className="flex items-center gap-1 text-xs text-green-600">
                      <BadgeCheck size={12} /> Confirmé
                    </span>
                  )}
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {Number(o.total_amount).toLocaleString('fr-DZ')} DA
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
