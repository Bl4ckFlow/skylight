'use client';

import { useEffect, useState } from 'react';
import { Plus, Download, CheckCircle, Clock, History, Lock, Search } from 'lucide-react';
import api from '@/lib/api';
import { Invoice, Order } from '@/types';
import clsx from 'clsx';
import { useToast } from '@/hooks/useToast';
import ToastList from '@/components/ui/ToastList';
import Pagination from '@/components/ui/Pagination';

const PAGE_SIZE = 15;

interface InvoiceLog {
  id: string;
  changed_by_email: string;
  changed_at: string;
}

export default function FacturesPage() {
  const [invoices, setInvoices]     = useState<Invoice[]>([]);
  const [orders, setOrders]         = useState<Order[]>([]);
  const [filter, setFilter]         = useState('');
  const [search, setSearch]         = useState('');
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [selectedOrder, setSelectedOrder] = useState('');
  const [page, setPage]             = useState(1);
  const { toasts, toast, dismiss }  = useToast();

  const [confirm, setConfirm] = useState<{ invoiceId: string } | null>(null);
  const [logInvoice, setLogInvoice]   = useState<Invoice | null>(null);
  const [logs, setLogs]               = useState<InvoiceLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const fetchInvoices = async () => {
    const url = filter ? `/factures?payment_status=${encodeURIComponent(filter)}` : '/factures';
    const res = await api.get(url);
    setInvoices(res.data);
    setLoading(false);
  };

  useEffect(() => { api.get('/commandes').then(res => setOrders(res.data)); }, []);
  useEffect(() => { fetchInvoices(); }, [filter]);

  const filtered = invoices.filter(inv =>
    !search || inv.client_name?.toLowerCase().includes(search.toLowerCase())
  );
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const handleSearch = (v: string) => { setSearch(v); setPage(1); };
  const handleFilter = (v: string) => { setFilter(v); setPage(1); };

  const createInvoice = async () => {
    try {
      await api.post('/factures', { order_id: selectedOrder });
      toast('Facture créée');
      setShowModal(false);
      fetchInvoices();
    } catch (err: any) {
      toast(err?.response?.data?.error || 'Une erreur est survenue', 'error');
    }
  };

  const markPaid = async () => {
    if (!confirm) return;
    try {
      await api.patch(`/factures/${confirm.invoiceId}/status`, { payment_status: 'Payé' });
      toast('Facture marquée comme payée');
    } catch (err: any) {
      toast(err?.response?.data?.error || 'Erreur', 'error');
    }
    setConfirm(null);
    fetchInvoices();
  };

  const openLogs = async (invoice: Invoice) => {
    setLogInvoice(invoice);
    setLogsLoading(true);
    const res = await api.get(`/factures/${invoice.id}/logs`);
    setLogs(res.data);
    setLogsLoading(false);
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
          <p className="text-sm text-gray-500">{filtered.length} facture(s)</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="btn-secondary flex items-center gap-2"
            onClick={async () => {
              const res = await api.get('/factures/export.xlsx', { responseType: 'blob' });
              const url = URL.createObjectURL(res.data);
              const a = document.createElement('a');
              a.href = url;
              a.download = `factures-${new Date().toISOString().slice(0, 10)}.xlsx`;
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            <Download size={16} /> Export
          </button>
          <button className="btn-primary flex items-center gap-2" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Créer
          </button>
        </div>
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
        <div className="flex gap-2">
          {['', 'Payé', 'Non Payé'].map(s => (
            <button key={s} onClick={() => handleFilter(s)}
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
            {paginated.map(inv => (
              <div key={inv.id} className="card flex items-center justify-between gap-3">
                <button className="flex-1 text-left min-w-0" onClick={() => openLogs(inv)}>
                  <p className="font-medium text-gray-900">{inv.client_name}</p>
                  <p className="text-xs text-gray-400">
                    {(inv as any).invoice_number && <span className="mr-2 font-mono">{(inv as any).invoice_number}</span>}
                    {new Date(inv.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </button>

                <p className="font-semibold text-sm whitespace-nowrap">{Number(inv.total_amount).toLocaleString('fr-DZ')} DA</p>

                {inv.payment_status === 'Payé' ? (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-700 cursor-default">
                    <Lock size={11} /> Payé
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirm({ invoiceId: inv.id })}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                  >
                    <Clock size={11} /> Marquer payé
                  </button>
                )}

                <button onClick={() => openLogs(inv)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                  <History size={15} />
                </button>

                <button onClick={() => downloadPDF(inv.id)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                  <Download size={15} />
                </button>
              </div>
            ))}
            {filtered.length === 0 && <p className="text-center text-gray-400 py-12">Aucune facture</p>}
          </div>
          <Pagination page={page} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />
        </>
      )}

      {/* Confirmation paiement */}
      {confirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 dark:border dark:border-gray-800 rounded-2xl w-full max-w-sm p-6 space-y-4">
            <h2 className="font-bold text-lg">Confirmer le paiement</h2>
            <p className="text-gray-600 text-sm">
              Marquer cette facture comme <span className="font-semibold">Payée</span> ?
              <br />
              <span className="text-gray-400 text-xs mt-1 block">Cette action est irréversible.</span>
            </p>
            <div className="flex gap-3 pt-2">
              <button className="btn-secondary flex-1" onClick={() => setConfirm(null)}>Annuler</button>
              <button className="btn-primary flex-1" onClick={markPaid}>Confirmer</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal logs */}
      {logInvoice && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 dark:border dark:border-gray-800 rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-lg">Historique paiement</h2>
                <p className="text-sm text-gray-400">{logInvoice.client_name} · {Number(logInvoice.total_amount).toLocaleString('fr-DZ')} DA</p>
              </div>
              <button onClick={() => setLogInvoice(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            {logsLoading ? (
              <div className="flex justify-center py-6">
                <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : logs.length === 0 ? (
              <div className="flex items-center gap-2 text-gray-400 text-sm py-4">
                <Clock size={14} /> Aucun paiement enregistré
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-gray-300 mt-1.5" />
                    <div className="w-px flex-1 bg-gray-100 mt-1" />
                  </div>
                  <div className="pb-3">
                    <p className="text-sm font-medium text-gray-700">Facture créée</p>
                    <p className="text-xs text-gray-400">{new Date(logInvoice.created_at).toLocaleString('fr-FR')}</p>
                  </div>
                </div>
                {logs.map((log, i) => (
                  <div key={log.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5" />
                      {i < logs.length - 1 && <div className="w-px flex-1 bg-gray-100 mt-1" />}
                    </div>
                    <div className="pb-3">
                      <div className="flex items-center gap-1.5 text-sm font-medium text-green-700">
                        <CheckCircle size={13} /> Marquée Payée
                      </div>
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

      {/* Modal créer facture */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 dark:border dark:border-gray-800 rounded-2xl w-full max-w-md p-6 space-y-4">
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

      <ToastList toasts={toasts} dismiss={dismiss} />
    </div>
  );
}
