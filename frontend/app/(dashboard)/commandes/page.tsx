'use client';

import { useEffect, useState } from 'react';
import { Plus, ArrowRight, Clock, History, Truck, Search, BadgeCheck } from 'lucide-react';
import api from '@/lib/api';
import { Order, Client, Product } from '@/types';
import clsx from 'clsx';
import { useToast } from '@/hooks/useToast';
import ToastList from '@/components/ui/ToastList';
import Pagination from '@/components/ui/Pagination';

const STATUS_STYLES: Record<string, string> = {
  'En attente': 'bg-amber-50 text-amber-700 border border-amber-200',
  'En cours':   'bg-blue-50 text-blue-700 border border-blue-200',
  'Livrée':     'bg-green-50 text-green-700 border border-green-200',
};

const NEXT_STATUS: Record<string, string[]> = {
  'En attente': ['En cours', 'Livrée'],
  'En cours':   ['Livrée'],
  'Livrée':     [],
};

const STATUSES = ['En attente', 'En cours', 'Livrée'];

interface OrderLog {
  id: string;
  from_status: string;
  to_status: string;
  changed_by_email: string;
  changed_at: string;
}

export default function CommandesPage() {
  const [orders, setOrders]         = useState<Order[]>([]);
  const [clients, setClients]       = useState<Client[]>([]);
  const [products, setProducts]     = useState<Product[]>([]);
  const [filter, setFilter]         = useState('');
  const [search, setSearch]         = useState('');
  const [page, setPage]             = useState(1);
  const { toasts, toast, dismiss }  = useToast();
  const PAGE_SIZE = 15;
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);

  // Confirmation modal
  const [confirm, setConfirm] = useState<{ orderId: string; newStatus: string } | null>(null);

  // Log modal
  const [logOrder, setLogOrder]     = useState<Order | null>(null);
  const [logs, setLogs]             = useState<OrderLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const [form, setForm] = useState<{
    client_id: string;
    notes: string;
    items: { product_id: string; quantity: number; unit_price: number }[];
  }>({ client_id: '', notes: '', items: [{ product_id: '', quantity: 1, unit_price: 0 }] });

  const fetchOrders = async () => {
    const url = filter ? `/commandes?status=${encodeURIComponent(filter)}` : '/commandes';
    const res = await api.get(url);
    setOrders(res.data);
    setLoading(false);
  };

  useEffect(() => {
    Promise.all([api.get('/clients'), api.get('/stock')]).then(([c, s]) => {
      setClients(c.data);
      setProducts(s.data);
    });
  }, []);

  useEffect(() => { fetchOrders(); }, [filter]);

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { product_id: '', quantity: 1, unit_price: 0 }] }));
  const removeItem = (i: number) => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));

  const updateItem = (i: number, key: string, value: string | number) => {
    setForm(f => {
      const items = [...f.items];
      (items[i] as any)[key] = value;
      if (key === 'product_id') {
        const p = products.find(p => p.id === value);
        if (p) items[i].unit_price = Number(p.sell_price);
      }
      return { ...f, items };
    });
  };

  const save = async () => {
    try {
      await api.post('/commandes', form);
      toast('Commande créée');
      setShowModal(false);
      fetchOrders();
    } catch (err: any) {
      toast(err?.response?.data?.error || 'Une erreur est survenue', 'error');
    }
  };

  const confirmStatus = (orderId: string, newStatus: string) => {
    setConfirm({ orderId, newStatus });
  };

  const applyStatus = async () => {
    if (!confirm) return;
    try {
      await api.patch(`/commandes/${confirm.orderId}/status`, { status: confirm.newStatus });
      toast(`Statut mis à jour : ${confirm.newStatus}`);
    } catch (err: any) {
      toast(err?.response?.data?.error || 'Erreur', 'error');
    }
    setConfirm(null);
    fetchOrders();
  };

  const downloadBL = async (id: string) => {
    const res = await api.get(`/commandes/${id}/bl`, { responseType: 'blob' });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bl-${id}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = orders.filter(o =>
    !search || o.client_name?.toLowerCase().includes(search.toLowerCase())
  );
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const handleSearch = (v: string) => { setSearch(v); setPage(1); };

  const openLogs = async (order: Order) => {
    setLogOrder(order);
    setLogsLoading(true);
    const res = await api.get(`/commandes/${order.id}/logs`);
    setLogs(res.data);
    setLogsLoading(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Commandes</h1>
          <p className="text-sm text-gray-500">{filtered.length} commande(s)</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Nouvelle
        </button>
      </div>

      {/* Recherche + Filtres */}
      <div className="flex flex-col gap-2">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un client..."
            value={search}
            onChange={e => handleSearch(e.target.value)}
            className="input pl-8 text-sm"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['', ...STATUSES].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={clsx('px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                filter === s ? 'bg-primary-950 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              )}>
              {s || 'Toutes'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
        <div className="space-y-2">
          {paginated.map(o => (
            <div key={o.id} className="card">
              <div className="flex items-center justify-between gap-4">
                {/* Infos cliquables → logs */}
                <button className="flex-1 text-left min-w-0" onClick={() => openLogs(o)}>
                  <p className="font-medium text-gray-900">{o.client_name}</p>
                  <p className="text-xs text-gray-400">{new Date(o.created_at).toLocaleDateString('fr-FR')} · {Number(o.total_amount).toLocaleString('fr-DZ')} DA</p>
                </button>

                <div className="flex items-center gap-2">
                  {/* Statut actuel */}
                  <span className={clsx('px-2.5 py-1 rounded-full text-xs font-medium', STATUS_STYLES[o.status])}>
                    {o.status}
                  </span>

                  {/* Badge confirmation client */}
                  {o.status === 'Livrée' && o.client_confirmed && (
                    <span title="Réception confirmée par le client" className="flex items-center gap-1 text-xs text-green-600 font-medium">
                      <BadgeCheck size={14} /> Confirmé
                    </span>
                  )}
                  {o.status === 'Livrée' && !o.client_confirmed && (
                    <span className="text-xs text-gray-400">En attente client</span>
                  )}

                  {/* Boutons de transition */}
                  {NEXT_STATUS[o.status].map(next => (
                    <button
                      key={next}
                      onClick={() => confirmStatus(o.id, next)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                    >
                      <ArrowRight size={11} /> {next}
                    </button>
                  ))}

                  {/* BL */}
                  <button
                    onClick={() => downloadBL(o.id)}
                    title="Télécharger le bon de livraison"
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700"
                  >
                    <Truck size={15} />
                  </button>

                  {/* Logs */}
                  <button onClick={() => openLogs(o)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                    <History size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-center text-gray-400 py-12">Aucune commande</p>}
        </div>
        <Pagination page={page} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />
        </>
      )}

      {/* Modal confirmation changement statut */}
      {confirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 dark:border dark:border-gray-800 rounded-2xl w-full max-w-sm p-6 space-y-4">
            <h2 className="font-bold text-lg">Confirmer le changement</h2>
            <p className="text-gray-600 text-sm">
              Passer la commande à <span className="font-semibold">"{confirm.newStatus}"</span> ?
              <br />
              <span className="text-gray-400 text-xs mt-1 block">Cette action est irréversible.</span>
            </p>
            <div className="flex gap-3 pt-2">
              <button className="btn-secondary flex-1" onClick={() => setConfirm(null)}>Annuler</button>
              <button className="btn-primary flex-1" onClick={applyStatus}>Confirmer</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal logs */}
      {logOrder && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 dark:border dark:border-gray-800 rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-lg">Historique</h2>
                <p className="text-sm text-gray-400">{logOrder.client_name}</p>
              </div>
              <button onClick={() => setLogOrder(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            {logsLoading ? (
              <div className="flex justify-center py-6">
                <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : logs.length === 0 ? (
              <div className="flex items-center gap-2 text-gray-400 text-sm py-4">
                <Clock size={14} /> Aucun changement enregistré
              </div>
            ) : (
              <div className="space-y-3">
                {/* Création */}
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-gray-300 mt-1.5" />
                    <div className="w-px flex-1 bg-gray-100 mt-1" />
                  </div>
                  <div className="pb-3">
                    <p className="text-sm font-medium text-gray-700">Commande créée</p>
                    <p className="text-xs text-gray-400">{new Date(logOrder.created_at).toLocaleString('fr-FR')}</p>
                  </div>
                </div>
                {logs.map((log, i) => (
                  <div key={log.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-primary-950 mt-1.5" />
                      {i < logs.length - 1 && <div className="w-px flex-1 bg-gray-100 mt-1" />}
                    </div>
                    <div className="pb-3">
                      <p className="text-sm font-medium text-gray-700">
                        <span className={clsx('inline-block px-1.5 py-0.5 rounded text-xs mr-1', STATUS_STYLES[log.from_status])}>{log.from_status}</span>
                        →
                        <span className={clsx('inline-block px-1.5 py-0.5 rounded text-xs ml-1', STATUS_STYLES[log.to_status])}>{log.to_status}</span>
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(log.changed_at).toLocaleString('fr-FR')} · {log.changed_by_email}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <ToastList toasts={toasts} dismiss={dismiss} />

      {/* Modal nouvelle commande */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 dark:border dark:border-gray-800 rounded-2xl w-full max-w-lg p-6 space-y-4 my-4">
            <h2 className="font-bold text-lg">Nouvelle commande</h2>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Client *</label>
              <select className="input" value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}>
                <option value="">Sélectionner un client</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
              </select>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Articles *</label>
                <button className="text-primary-600 text-sm hover:underline" onClick={addItem}>+ Ajouter</button>
              </div>
              <div className="space-y-2">
                {form.items.map((item, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-6">
                      <select className="input text-xs" value={item.product_id} onChange={e => updateItem(i, 'product_id', e.target.value)}>
                        <option value="">Produit</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <input type="number" className="input text-xs" placeholder="Qté" min={1} value={item.quantity} onChange={e => updateItem(i, 'quantity', Number(e.target.value))} />
                    </div>
                    <div className="col-span-3">
                      <input type="number" className="input text-xs" placeholder="Prix" value={item.unit_price} onChange={e => updateItem(i, 'unit_price', Number(e.target.value))} />
                    </div>
                    <div className="col-span-1">
                      <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Notes</label>
              <textarea className="input" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <div className="flex gap-3 pt-2">
              <button className="btn-secondary flex-1" onClick={() => setShowModal(false)}>Annuler</button>
              <button className="btn-primary flex-1" onClick={save}>Créer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
