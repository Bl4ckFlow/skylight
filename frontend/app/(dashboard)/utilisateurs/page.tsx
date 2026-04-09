'use client';

import { useEffect, useState } from 'react';
import { Plus, UserCircle, Shield } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/useToast';
import ToastList from '@/components/ui/ToastList';

type Role = 'Admin' | 'Comptable' | 'Commercial' | 'Logistique' | 'Livreur';

const ROLES: { value: Role; label: string; description: string; color: string }[] = [
  { value: 'Admin',      label: 'Admin',      description: 'Accès complet',            color: 'bg-gray-900 text-white' },
  { value: 'Comptable',  label: 'Comptable',  description: 'Factures',                 color: 'bg-blue-100 text-blue-700' },
  { value: 'Commercial', label: 'Commercial', description: 'Clients + Commandes',      color: 'bg-green-100 text-green-700' },
  { value: 'Logistique', label: 'Logistique', description: 'Stock',                    color: 'bg-orange-100 text-orange-700' },
  { value: 'Livreur',    label: 'Livreur',    description: 'Confirme les livraisons',  color: 'bg-purple-100 text-purple-700' },
];

interface UserItem {
  id: string;
  email: string;
  role: Role;
  created_at: string;
}

export default function UtilisateursPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers]         = useState<UserItem[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  const { toasts, toast, dismiss } = useToast();
  const [form, setForm] = useState<{ email: string; password: string; role: Role }>({
    email: '', password: '', role: 'Commercial',
  });

  useEffect(() => {
    if (!authLoading && user?.role !== 'Admin') router.replace('/');
  }, [authLoading, user, router]);

  const fetchUsers = async () => {
    const res = await api.get('/auth/users');
    setUsers(res.data);
    setLoading(false);
  };

  useEffect(() => {
    if (user?.role === 'Admin') fetchUsers();
  }, [user]);

  const openCreate = () => {
    setForm({ email: '', password: '', role: 'Commercial' });
    setError('');
    setShowModal(true);
  };

  const save = async () => {
    if (!form.email || !form.password) { setError('Email et mot de passe requis'); return; }
    setSaving(true);
    setError('');
    try {
      await api.post('/auth/register', form);
      toast(`Utilisateur créé — ${form.role}`);
      setShowModal(false);
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur serveur');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || user?.role !== 'Admin') return null;

  const getRoleInfo = (role: string) => ROLES.find(r => r.value === role);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Utilisateurs</h1>
          <p className="text-sm text-gray-500">{users.length} utilisateur(s)</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={openCreate}>
          <Plus size={16} /> Ajouter
        </button>
      </div>

      {/* Légende des rôles */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {ROLES.map(r => (
          <div key={r.value} className="card py-3 text-center">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${r.color}`}>{r.label}</span>
            <p className="text-xs text-gray-400 mt-1.5">{r.description}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {users.map(u => {
            const roleInfo = getRoleInfo(u.role);
            return (
              <div key={u.id} className="card flex items-center gap-4">
                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                  <UserCircle size={20} className="text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 truncate">{u.email}</p>
                    {u.id === user?.id && <span className="text-xs text-gray-400">(vous)</span>}
                  </div>
                  {roleInfo && (
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                      <Shield size={10} /> {roleInfo.description}
                    </p>
                  )}
                </div>
                {roleInfo && (
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${roleInfo.color}`}>
                    {u.role}
                  </span>
                )}
              </div>
            );
          })}
          {users.length === 0 && <p className="text-center text-gray-400 py-12">Aucun utilisateur</p>}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4">
            <h2 className="font-bold text-lg">Ajouter un utilisateur</h2>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Email *</label>
              <input type="email" className="input" placeholder="exemple@email.com"
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Mot de passe *</label>
              <input type="password" className="input" placeholder="••••••••"
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Rôle</label>
              <div className="space-y-2">
                {ROLES.map(r => (
                  <button
                    key={r.value}
                    onClick={() => setForm(f => ({ ...f, role: r.value }))}
                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm transition-colors ${
                      form.role === r.value
                        ? 'border-primary-950 bg-primary-950/5'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span className="font-medium">{r.label}</span>
                    <span className="text-xs text-gray-400">{r.description}</span>
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex gap-3 pt-2">
              <button className="btn-secondary flex-1" onClick={() => setShowModal(false)}>Annuler</button>
              <button className="btn-primary flex-1" onClick={save} disabled={saving}>
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastList toasts={toasts} dismiss={dismiss} />
    </div>
  );
}
