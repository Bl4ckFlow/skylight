'use client';

import { useEffect, useState } from 'react';
import { Plus, UserCircle, Mail, Shield } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

interface UserItem {
  id: string;
  email: string;
  role: 'Admin' | 'Employé';
  created_at: string;
}

export default function UtilisateursPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers]           = useState<UserItem[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');
  const [form, setForm] = useState({ email: '', password: '', role: 'Employé' as 'Admin' | 'Employé' });

  useEffect(() => {
    if (!authLoading && user?.role !== 'Admin') {
      router.replace('/');
    }
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
    setForm({ email: '', password: '', role: 'Employé' });
    setError('');
    setShowModal(true);
  };

  const save = async () => {
    if (!form.email || !form.password) {
      setError('Email et mot de passe requis');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.post('/auth/register', form);
      setShowModal(false);
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur serveur');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || user?.role !== 'Admin') return null;

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

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {users.map(u => (
            <div key={u.id} className="card flex items-center gap-4">
              <div className="p-2 rounded-full bg-gray-100">
                <UserCircle size={20} className="text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900">{u.email}</p>
                  {u.id === user.id && (
                    <span className="text-xs text-gray-400">(vous)</span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <Mail size={11} />{u.email}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <Shield size={11} />{u.role}
                  </span>
                </div>
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                u.role === 'Admin'
                  ? 'bg-primary-950/10 text-primary-950'
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {u.role}
              </span>
            </div>
          ))}
          {users.length === 0 && (
            <p className="text-center text-gray-400 py-12">Aucun utilisateur</p>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4">
            <h2 className="font-bold text-lg">Ajouter un utilisateur</h2>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Email *</label>
              <input
                type="email"
                className="input"
                placeholder="exemple@email.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Mot de passe *</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Rôle</label>
              <select
                className="input"
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value as 'Admin' | 'Employé' }))}
              >
                <option value="Employé">Employé</option>
                <option value="Admin">Admin</option>
              </select>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex gap-3 pt-2">
              <button className="btn-secondary flex-1" onClick={() => setShowModal(false)}>
                Annuler
              </button>
              <button className="btn-primary flex-1" onClick={save} disabled={saving}>
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
