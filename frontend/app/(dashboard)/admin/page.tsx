'use client';

import { useEffect, useState } from 'react';
import { Plus, Building2, Users, ChevronDown, ChevronUp, Shield } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

interface Company {
  id: string;
  name: string;
  subscription_plan: string;
  created_at: string;
  user_count: number;
}

interface CompanyUser {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

const PLAN_LABELS: Record<string, string> = {
  free: 'Free',
  starter: 'Starter',
  pro: 'Pro',
};

const PLAN_STYLES: Record<string, string> = {
  free:    'bg-gray-100 text-gray-500',
  starter: 'bg-blue-50 text-blue-600',
  pro:     'bg-amber-50 text-amber-600',
};

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [companies, setCompanies]     = useState<Company[]>([]);
  const [expanded, setExpanded]       = useState<string | null>(null);
  const [usersMap, setUsersMap]       = useState<Record<string, CompanyUser[]>>({});
  const [loading, setLoading]         = useState(true);
  const [showModal, setShowModal]     = useState(false);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState('');
  const [form, setForm] = useState({
    company_name: '',
    admin_email: '',
    admin_password: '',
    plan: 'free' as 'free' | 'starter' | 'pro',
  });

  useEffect(() => {
    if (!authLoading && user?.role !== 'SuperAdmin') router.replace('/');
  }, [authLoading, user, router]);

  const fetchCompanies = async () => {
    const res = await api.get('/admin/companies');
    setCompanies(res.data);
    setLoading(false);
  };

  useEffect(() => {
    if (user?.role === 'SuperAdmin') fetchCompanies();
  }, [user]);

  const toggleCompany = async (id: string) => {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    if (!usersMap[id]) {
      const res = await api.get(`/admin/companies/${id}/users`);
      setUsersMap(m => ({ ...m, [id]: res.data }));
    }
  };

  const save = async () => {
    if (!form.company_name || !form.admin_email || !form.admin_password) {
      setError('Tous les champs obligatoires doivent être remplis');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.post('/admin/companies', form);
      setShowModal(false);
      setForm({ company_name: '', admin_email: '', admin_password: '', plan: 'free' });
      fetchCompanies();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur serveur');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || user?.role !== 'SuperAdmin') return null;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-primary-950" />
            <h1 className="text-2xl font-bold text-gray-900">Super Admin</h1>
          </div>
          <p className="text-sm text-gray-500">{companies.length} entreprise(s) cliente(s)</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => { setError(''); setShowModal(true); }}>
          <Plus size={16} /> Nouvelle entreprise
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {companies.map(c => (
            <div key={c.id} className="card overflow-hidden">
              <button
                className="w-full flex items-center justify-between gap-4 text-left"
                onClick={() => toggleCompany(c.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gray-100">
                    <Building2 size={16} className="text-gray-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{c.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Créée le {new Date(c.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${PLAN_STYLES[c.subscription_plan]}`}>
                    {PLAN_LABELS[c.subscription_plan]}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <Users size={12} /> {c.user_count}
                  </span>
                  {expanded === c.id ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </div>
              </button>

              {expanded === c.id && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  {usersMap[c.id] === undefined ? (
                    <div className="flex justify-center py-4">
                      <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : usersMap[c.id].length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-2">Aucun utilisateur</p>
                  ) : (
                    <div className="space-y-2">
                      {usersMap[c.id].map(u => (
                        <div key={u.id} className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-gray-50">
                          <span className="text-sm text-gray-700">{u.email}</span>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            u.role === 'Admin' ? 'bg-primary-950/10 text-primary-950' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {u.role}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {companies.length === 0 && (
            <p className="text-center text-gray-400 py-12">Aucune entreprise cliente</p>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4">
            <h2 className="font-bold text-lg">Nouvelle entreprise cliente</h2>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Nom de l'entreprise *</label>
              <input
                type="text"
                className="input"
                placeholder="Acme Corp"
                value={form.company_name}
                onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Plan</label>
              <select
                className="input"
                value={form.plan}
                onChange={e => setForm(f => ({ ...f, plan: e.target.value as any }))}
              >
                <option value="free">Free</option>
                <option value="starter">Starter</option>
                <option value="pro">Pro</option>
              </select>
            </div>

            <div className="border-t border-gray-100 pt-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Compte Admin de l'entreprise</p>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Email *</label>
                  <input
                    type="email"
                    className="input"
                    placeholder="admin@entreprise.com"
                    value={form.admin_email}
                    onChange={e => setForm(f => ({ ...f, admin_email: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Mot de passe *</label>
                  <input
                    type="password"
                    className="input"
                    placeholder="••••••••"
                    value={form.admin_password}
                    onChange={e => setForm(f => ({ ...f, admin_password: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex gap-3 pt-2">
              <button className="btn-secondary flex-1" onClick={() => setShowModal(false)}>Annuler</button>
              <button className="btn-primary flex-1" onClick={save} disabled={saving}>
                {saving ? 'Création...' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
