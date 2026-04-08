'use client';

import { useEffect, useState } from 'react';
import { Plus, Download, CheckCircle, Clock } from 'lucide-react';
import api from '@/lib/api';
import { Invoice, Order } from '@/types';
import clsx from 'clsx';

export default function FacturesPage() {
  const [invoices, setInvoices]   = useState<Invoice[]>([]);
  const [orders, setOrders]       = useState<Order[]>([]);
  const [filter, setFilter]       = useState('');
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState('');

  const fetchInvoices = async () => {
    const url = filter ? `/factures?payment_status=${encodeURIComponent(filter)}` : '/factures';
    const res = await api.get(url);
    setInvoices(res.data);
    setLoading(false);
  };

  useEffect(() => {
    api.get('/commandes').then(res => setOrders(res.data));
  }, []);

  useEffect(() => { fetchInvoices(); }, [filter]);

  const createInvoice = async () => {
    await api.post('/factures', { order_id: selectedOrder });
    setShowModal(false);
    fetchInvoices();
  };

  const toggleStatus = async (id: string, current: string) => {
    const next = current === 'Payé' ? 'Non Payé' : 'Payé';
    await api.patch(`/factures/${id}/status`, { payment_status: next });
    fetchInvoices();
  };

  const downloadPDF = (id: string) => {
    const token = localStorage.getItem('token');
    window.open(`${process.env.NEXT_PUBLIC_API_URL}/factures/${id}/pdf?token=${token}`, '_blank');
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Factures</h1>
          <p className="text-sm text-gray-500">{invoices.length} facture(s)</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Créer
        </button>
      </div>

      {/* Filtres */}
      <div className="flex gap-2">
        {['', 'Payé', 'Non Payé'].map(s => (
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
          {invoices.map(inv => (
            <div key={inv.id} className="card flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">{inv.client_name}</p>
                <p className="text-xs text-gray-400">{new Date(inv.created_at).toLocaleDateString('fr-FR')}</p>
              </div>
              <p className="font-semibold text-sm">{Number(inv.total_amount).toLocaleString('fr-DZ')} DA</p>
              <button
                onClick={() => toggleStatus(inv.id, inv.payment_status)}
                className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                  inv.payment_status === 'Payé'
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                )}
              >
                {inv.payment_status === 'Payé'
                  ? <><CheckCircle size={12} /> Payé</>
                  : <><Clock size={12} /> Non payé</>}
              </button>
              <button onClick={() => downloadPDF(inv.id)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                <Download size={15} />
              </button>
            </div>
          ))}
          {invoices.length === 0 && <p className="text-center text-gray-400 py-12">Aucune facture</p>}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4">
            <h2 className="font-bold text-lg">Créer une facture</h2>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Commande *</label>
              <select className="input" value={selectedOrder} onChange={e => setSelectedOrder(e.target.value)}>
                <option value="">Sélectionner une commande</option>
                {orders.map(o => (
                  <option key={o.id} value={o.id}>
                    {o.client_name} — {Number(o.total_amount).toLocaleString('fr-DZ')} DA
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button className="btn-secondary flex-1" onClick={() => setShowModal(false)}>Annuler</button>
              <button className="btn-primary flex-1" onClick={createInvoice} disabled={!selectedOrder}>Créer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
