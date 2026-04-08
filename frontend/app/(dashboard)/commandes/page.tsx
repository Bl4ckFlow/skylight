'use client';

import { useEffect, useState } from 'react';
import { Plus, ChevronDown } from 'lucide-react';
import api from '@/lib/api';
import { Order, Client, Product } from '@/types';
import clsx from 'clsx';

const STATUS_COLORS: Record<string, string> = {
  'En attente': 'badge-warning',
  'En cours':   'badge-blue',
  'Livrée':     'badge-success',
};

const STATUSES = ['En attente', 'En cours', 'Livrée'];

export default function CommandesPage() {
  const [orders, setOrders]       = useState<Order[]>([]);
  const [clients, setClients]     = useState<Client[]>([]);
  const [products, setProducts]   = useState<Product[]>([]);
  const [filter, setFilter]       = useState('');
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);

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

  const addItem = () => setForm(f => ({
    ...f, items: [...f.items, { product_id: '', quantity: 1, unit_price: 0 }]
  }));

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
    await api.post('/commandes', form);
    setShowModal(false);
    fetchOrders();
  };

  const updateStatus = async (id: string, status: string) => {
    await api.patch(`/commandes/${id}/status`, { status });
    fetchOrders();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Commandes</h1>
          <p className="text-sm text-gray-500">{orders.length} commande(s)</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Nouvelle
        </button>
      </div>

      {/* Filtres statut */}
      <div className="flex gap-2 flex-wrap">
        {['', ...STATUSES].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={clsx('px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
              filter === s ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            )}>
            {s || 'Toutes'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {orders.map(o => (
            <div key={o.id} className="card flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">{o.client_name}</p>
                <p className="text-xs text-gray-400">{new Date(o.created_at).toLocaleDateString('fr-FR')}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-sm">{Number(o.total_amount).toLocaleString('fr-DZ')} DA</p>
              </div>
              <div className="relative">
                <select
                  value={o.status}
                  onChange={e => updateStatus(o.id, e.target.value)}
                  className={clsx('appearance-none pr-6 pl-2.5 py-1 rounded-full text-xs font-medium border-0 cursor-pointer',
                    STATUS_COLORS[o.status]
                  )}
                >
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          ))}
          {orders.length === 0 && <p className="text-center text-gray-400 py-12">Aucune commande</p>}
        </div>
      )}

      {/* Modal nouvelle commande */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-4 my-4">
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
                      <select className="input text-xs" value={item.product_id}
                        onChange={e => updateItem(i, 'product_id', e.target.value)}>
                        <option value="">Produit</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <input type="number" className="input text-xs" placeholder="Qté" min={1}
                        value={item.quantity} onChange={e => updateItem(i, 'quantity', Number(e.target.value))} />
                    </div>
                    <div className="col-span-3">
                      <input type="number" className="input text-xs" placeholder="Prix"
                        value={item.unit_price} onChange={e => updateItem(i, 'unit_price', Number(e.target.value))} />
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
              <textarea className="input" rows={2} value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
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
