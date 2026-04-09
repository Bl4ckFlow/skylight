'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, AlertTriangle, History, ArrowUp, ArrowDown } from 'lucide-react';
import api from '@/lib/api';
import { Product } from '@/types';
import clsx from 'clsx';
import { useToast } from '@/hooks/useToast';
import ToastList from '@/components/ui/ToastList';
import Pagination from '@/components/ui/Pagination';
import ConfirmModal from '@/components/ui/ConfirmModal';

const PAGE_SIZE = 15;

export default function StockPage() {
  const [products, setProducts]   = useState<Product[]>([]);
  const [search, setSearch]       = useState('');
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState<Product | null>(null);
  const [deleteId, setDeleteId]   = useState<string | null>(null);
  const [page, setPage]           = useState(1);
  const [saving, setSaving]       = useState(false);
  const [movProduct, setMovProduct] = useState<Product | null>(null);
  const [movements, setMovements]   = useState<any[]>([]);
  const [movLoading, setMovLoading] = useState(false);
  const [movForm, setMovForm]       = useState({ delta: 1, reason: 'Entrée stock' });
  const { toasts, toast, dismiss } = useToast();

  const [form, setForm] = useState({
    name: '', stock_quantity: 0, buy_price: 0, sell_price: 0, category: '', low_stock_threshold: 5,
  });

  const load = async () => {
    const res = await api.get('/stock');
    setProducts(res.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  );

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSearch = (v: string) => { setSearch(v); setPage(1); };

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
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/stock/${editing.id}`, form);
        toast('Produit modifié');
      } else {
        await api.post('/stock', form);
        toast('Produit ajouté');
      }
      setShowModal(false);
      load();
    } catch {
      toast('Une erreur est survenue', 'error');
    } finally {
      setSaving(false);
    }
  };

  const openMovements = async (p: Product) => {
    setMovProduct(p);
    setMovLoading(true);
    setMovements([]);
    const res = await api.get(`/stock/${p.id}/movements`);
    setMovements(res.data);
    setMovLoading(false);
  };

  const addMovement = async () => {
    if (!movProduct) return;
    try {
      await api.post(`/stock/${movProduct.id}/movement`, movForm);
      toast(`Stock mis à jour : ${movForm.delta > 0 ? '+' : ''}${movForm.delta}`);
      load();
      openMovements(movProduct);
    } catch (err: any) {
      toast(err?.response?.data?.error || 'Erreur', 'error');
    }
  };

  const remove = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/stock/${deleteId}`);
      toast('Produit supprimé');
      load();
    } catch {
      toast('Impossible de supprimer ce produit', 'error');
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock</h1>
          <p className="text-sm text-gray-500">{filtered.length} produit(s)</p>
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
          onChange={e => handleSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {paginated.map(p => (
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
                  <button onClick={() => openMovements(p)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400" title="Mouvements de stock">
                    <History size={15} />
                  </button>
                  <button onClick={() => openEdit(p)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
                    <Edit2 size={15} />
                  </button>
                  <button onClick={() => setDeleteId(p.id)} className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-500">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-gray-400 py-12">Aucun produit trouvé</p>
            )}
          </div>
          <Pagination page={page} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />
        </>
      )}

      {/* Confirm suppression */}
      {deleteId && (
        <ConfirmModal
          title="Supprimer le produit ?"
          message="Cette action est irréversible."
          confirmLabel="Supprimer"
          danger
          onConfirm={remove}
          onCancel={() => setDeleteId(null)}
        />
      )}

      {/* Modal édition */}
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
              <button className="btn-primary flex-1" onClick={save} disabled={saving}>
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mouvements de stock */}
      {movProduct && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg p-6 space-y-4 my-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-lg text-gray-900 dark:text-white">Mouvements de stock</h2>
                <p className="text-sm text-gray-400">{movProduct.name} · {movProduct.stock_quantity} unités actuellement</p>
              </div>
              <button onClick={() => setMovProduct(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>

            {/* Ajouter un mouvement */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Ajouter un mouvement</p>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-gray-500 block mb-1">Quantité (négatif = sortie)</label>
                  <input type="number" className="input" value={movForm.delta}
                    onChange={e => setMovForm(f => ({ ...f, delta: Number(e.target.value) }))} />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-500 block mb-1">Motif</label>
                  <select className="input" value={movForm.reason}
                    onChange={e => setMovForm(f => ({ ...f, reason: e.target.value }))}>
                    <option>Entrée stock</option>
                    <option>Retour client</option>
                    <option>Correction inventaire</option>
                    <option>Perte / Casse</option>
                    <option>Sortie manuelle</option>
                  </select>
                </div>
              </div>
              <button className="btn-primary w-full" onClick={addMovement}>Enregistrer</button>
            </div>

            {/* Historique */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Historique</p>
              {movLoading ? (
                <div className="flex justify-center py-4">
                  <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : movements.length === 0 ? (
                <p className="text-sm text-gray-400">Aucun mouvement enregistré</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {movements.map((m: any) => (
                    <div key={m.id} className="flex items-center justify-between text-sm border-b border-gray-100 dark:border-gray-800 pb-2">
                      <div className="flex items-center gap-2">
                        {m.delta > 0
                          ? <ArrowUp size={13} className="text-green-500" />
                          : <ArrowDown size={13} className="text-red-500" />
                        }
                        <div>
                          <p className="text-gray-700 dark:text-gray-300 text-xs">{m.reason}</p>
                          <p className="text-gray-400 text-xs">{m.user_email} · {new Date(m.created_at).toLocaleString('fr-FR')}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold text-xs ${m.delta > 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {m.delta > 0 ? '+' : ''}{m.delta}
                        </p>
                        <p className="text-gray-400 text-xs">{m.qty_before} → {m.qty_after}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ToastList toasts={toasts} dismiss={dismiss} />
    </div>
  );
}
