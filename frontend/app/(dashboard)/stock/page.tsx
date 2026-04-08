'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import api from '@/lib/api';
import { Product } from '@/types';
import clsx from 'clsx';

export default function StockPage() {
  const [products, setProducts]   = useState<Product[]>([]);
  const [search, setSearch]       = useState('');
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState<Product | null>(null);
  const [form, setForm] = useState({
    name: '', stock_quantity: 0, buy_price: 0, sell_price: 0, category: '', low_stock_threshold: 5,
  });

  const fetch = async () => {
    const res = await api.get('/stock');
    setProducts(res.data);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', stock_quantity: 0, buy_price: 0, sell_price: 0, category: '', low_stock_threshold: 5 });
    setShowModal(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name, stock_quantity: p.stock_quantity, buy_price: Number(p.buy_price),
      sell_price: Number(p.sell_price), category: p.category || '', low_stock_threshold: p.low_stock_threshold,
    });
    setShowModal(true);
  };

  const save = async () => {
    if (editing) {
      await api.put(`/stock/${editing.id}`, form);
    } else {
      await api.post('/stock', form);
    }
    setShowModal(false);
    fetch();
  };

  const remove = async (id: string) => {
    if (!confirm('Supprimer ce produit ?')) return;
    await api.delete(`/stock/${id}`);
    fetch();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock</h1>
          <p className="text-sm text-gray-500">{products.length} produit(s)</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={openCreate}>
          <Plus size={16} /> Ajouter
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="input pl-9"
          placeholder="Rechercher un produit..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(p => (
            <div key={p.id} className="card flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900 truncate">{p.name}</p>
                  {p.stock_quantity <= p.low_stock_threshold && (
                    <AlertTriangle size={14} className="text-orange-500 flex-shrink-0" />
                  )}
                </div>
                {p.category && <p className="text-xs text-gray-400">{p.category}</p>}
              </div>
              <div className="text-right text-sm">
                <p className={clsx('font-semibold', p.stock_quantity <= p.low_stock_threshold ? 'text-orange-500' : 'text-gray-800')}>
                  {p.stock_quantity} unités
                </p>
                <p className="text-gray-400">{Number(p.sell_price).toLocaleString('fr-DZ')} DA</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(p)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
                  <Edit2 size={15} />
                </button>
                <button onClick={() => remove(p.id)} className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-500">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-gray-400 py-12">Aucun produit trouvé</p>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4">
            <h2 className="font-bold text-lg">{editing ? 'Modifier' : 'Ajouter'} un produit</h2>
            {[
              { label: 'Nom du produit *', key: 'name', type: 'text' },
              { label: 'Catégorie', key: 'category', type: 'text' },
              { label: 'Quantité en stock', key: 'stock_quantity', type: 'number' },
              { label: "Prix d'achat (DA)", key: 'buy_price', type: 'number' },
              { label: 'Prix de vente (DA)', key: 'sell_price', type: 'number' },
              { label: 'Seuil alerte stock', key: 'low_stock_threshold', type: 'number' },
            ].map(({ label, key, type }) => (
              <div key={key}>
                <label className="text-sm font-medium text-gray-700 block mb-1">{label}</label>
                <input
                  type={type}
                  className="input"
                  value={(form as any)[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))}
                />
              </div>
            ))}
            <div className="flex gap-3 pt-2">
              <button className="btn-secondary flex-1" onClick={() => setShowModal(false)}>Annuler</button>
              <button className="btn-primary flex-1" onClick={save}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
