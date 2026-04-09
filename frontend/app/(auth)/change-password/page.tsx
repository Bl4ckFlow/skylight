'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound } from 'lucide-react';
import api from '@/lib/api';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/change-password', { password });
      // Refresh token info by re-logging or just redirecting
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur serveur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-950/10 mb-4">
            <KeyRound size={22} className="text-primary-950" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Nouveau mot de passe</h1>
          <p className="text-sm text-gray-500 mt-1">
            Pour des raisons de sécurité, vous devez changer votre mot de passe avant de continuer.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Nouveau mot de passe</label>
            <input
              type="password"
              className="input"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoFocus
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Confirmer le mot de passe</label>
            <input
              type="password"
              className="input"
              placeholder="••••••••"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Enregistrement...' : 'Confirmer'}
          </button>
        </form>
      </div>
    </div>
  );
}
