'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, Phone, Mail, Building2, User } from 'lucide-react';
import api from '@/lib/api';
import { Client } from '@/types';

type ClientForm = {
  full_name: string;
  phone: string;
  email: string;
  address: string;
  client_type: 'Particulier' | 'Entreprise';
  nif: string;
  nis: string;
  rc: string;
  ai: string;
};

const EMPTY_FORM: ClientForm = {
  full_name: '', phone: '', email: '', address: '',
  client_type: 'Particulier', nif: '', nis: '', rc: '', ai: '',
};

export default function ClientsPage() {
  const [clients, setClients]     = useState<Client[]>([]);
  const [search, setSearch]       = useState('');
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState<Client | null>(null);
  const [form, setForm]           = useState<ClientForm>(EMPTY_FORM);

  const fetch = async () => {
    const res = await api.get('/clients');
    setClients(res.data);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const filtered = clients.filter(c =>
    c.full_name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  );

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (c: Client) => {
    setEditing(c);
    setForm({
      full_name:   c.full_name,
      phone:       c.phone || '',
      email:       c.email || '',
      address:     c.address || '',
      client_type: (c as any).client_type || 'Particulier',
      nif:         (c as any).nif || '',
      nis:         (c as any).nis || '',
      rc:          (c as any).rc || '',
      ai:          (c as any).ai || '',
    });
    setShowModal(true);
  };

  const save = async () => {
    if (editing) {
      await api.put(`/clients/${editing.id}`, form);
    } else {
      await api.post('/clients', form);
    }
    setShowModal(false);
    fetch();
  };

  const remove = async (id: string) => {
    if (!confirm('Supprimer ce client ?')) return;
    try {
      await api.delete(`/clients/${id}`);
      fetch();
    } catch {
      alert('Impossible de supprimer un client avec des commandes.');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-sm text-gray-500">{clients.length} client(s)</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={openCreate}>
          <Plus size={16} /> Ajouter
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input className="input pl-9" placeholder="Rechercher un client..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(c => (
            <div key={c.id} className="card flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {(c as any).client_type === 'Entreprise'
                    ? <Building2 size={13} className="text-blue-500 shrink-0" />
                    : <User size={13} className="text-gray-400 shrink-0" />
                  }
                  <p className="font-medium text-gray-900">{c.full_name}</p>
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  {c.phone && <span className="flex items-center gap-1 text-xs text-gray-400"><Phone size={11} />{c.phone}</span>}
                  {c.email && <span className="flex items-center gap-1 text-xs text-gray-400"><Mail size={11} />{c.email}</span>}
                  {(c as any).nif && <span className="text-xs text-gray-400">NIF: {(c as any).nif}</span>}
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(c)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"><Edit2 size={15} /></button>
                <button onClick={() => remove(c.id)} className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-500"><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-center text-gray-400 py-12">Aucun client trouvé</p>}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4 my-4">
            <h2 className="font-bold text-lg">{editing ? 'Modifier' : 'Ajouter'} un client</h2>

            {/* Type */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Type de client</label>
              <div className="flex gap-2">
                {(['Particulier', 'Entreprise'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setForm(f => ({ ...f, client_type: t }))}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      form.client_type === t
                        ? 'border-primary-950 bg-primary-950 text-white'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {t === 'Entreprise' ? <Building2 size={14} /> : <User size={14} />} {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Champs communs */}
            {[
              { label: 'Nom complet *', key: 'full_name', type: 'text' },
              { label: 'Téléphone',     key: 'phone',     type: 'tel' },
              { label: 'Email',         key: 'email',     type: 'email' },
              { label: 'Adresse',       key: 'address',   type: 'text' },
            ].map(({ label, key, type }) => (
              <div key={key}>
                <label className="text-sm font-medium text-gray-700 block mb-1">{label}</label>
                <input type={type} className="input" value={(form as any)[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
              </div>
            ))}

            {/* Champs entreprise algérienne */}
            {form.client_type === 'Entreprise' && (
              <div className="space-y-3 border-t border-gray-100 pt-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Informations fiscales</p>
                {[
                  { label: 'NIF (Numéro d\'Identification Fiscale)', key: 'nif' },
                  { label: 'NIS (Numéro d\'Identification Statistique)', key: 'nis' },
                  { label: 'RC (Registre de Commerce)',               key: 'rc' },
                  { label: 'AI (Article d\'Imposition)',               key: 'ai' },
                ].map(({ label, key }) => (
                  <div key={key}>
                    <label className="text-sm font-medium text-gray-700 block mb-1">{label}</label>
                    <input type="text" className="input" value={(form as any)[key]}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
                  </div>
                ))}
              </div>
            )}

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
