'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

type State = 'loading' | 'success' | 'error' | 'already';

export default function LivraisonPage() {
  const params = useSearchParams();
  const [state, setState] = useState<State>('loading');
  const [confirmedAt, setConfirmedAt] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const token = params.get('token');
    if (!token) { setState('error'); setErrorMsg('Lien invalide.'); return; }

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/commandes/confirm-delivery?token=${token}`)
      .then(async res => {
        const data = await res.json();
        if (res.ok) {
          setConfirmedAt(data.confirmed_at);
          setState('success');
        } else if (data.error?.includes('déjà')) {
          setState('already');
        } else {
          setErrorMsg(data.error || 'Une erreur est survenue.');
          setState('error');
        }
      })
      .catch(() => { setState('error'); setErrorMsg('Impossible de contacter le serveur.'); });
  }, [params]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg max-w-sm w-full p-8 text-center">

        {state === 'loading' && (
          <>
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Loader size={24} className="text-gray-400 animate-spin" />
            </div>
            <p className="text-gray-600">Vérification en cours…</p>
          </>
        )}

        {state === 'success' && (
          <>
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={28} className="text-green-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Livraison confirmée !</h1>
            <p className="text-gray-500 text-sm">
              Merci d'avoir confirmé la réception de votre commande.
            </p>
            {confirmedAt && (
              <p className="text-xs text-gray-400 mt-3">
                Confirmé le {new Date(confirmedAt).toLocaleString('fr-FR')}
              </p>
            )}
          </>
        )}

        {state === 'already' && (
          <>
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={28} className="text-blue-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Déjà confirmé</h1>
            <p className="text-gray-500 text-sm">
              Cette livraison a déjà été confirmée. Merci !
            </p>
          </>
        )}

        {state === 'error' && (
          <>
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <XCircle size={28} className="text-red-500" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Lien invalide</h1>
            <p className="text-gray-500 text-sm">{errorMsg}</p>
          </>
        )}

        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-xs text-gray-400">Propulsé par <span className="font-semibold text-gray-600">skylight</span></p>
        </div>
      </div>
    </div>
  );
}
