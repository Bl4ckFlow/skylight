'use client';

import { useEffect, useState } from 'react';
import { Settings, Save } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

type CompanySettings = {
  name: string;
  activity: string;
  address: string;
  capital_social: string;
  phone: string;
  fax: string;
  email: string;
  website: string;
  nif: string;
  nis: string;
  tin: string;
  rc: string;
  bank_name: string;
  bank_rib: string;
  bank_name2: string;
  bank_rib2: string;
  invoice_prefix: string;
  tva_rate: string;
};

const EMPTY: CompanySettings = {
  name: '', activity: '', address: '', capital_social: '',
  phone: '', fax: '', email: '', website: '',
  nif: '', nis: '', tin: '', rc: '',
  bank_name: '', bank_rib: '', bank_name2: '', bank_rib2: '',
  invoice_prefix: 'F', tva_rate: '19',
};

export default function ParametresPage() {
  const { user } = useAuth();
  const [form, setForm]     = useState<CompanySettings>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);

  useEffect(() => {
    api.get('/settings').then(res => {
      const d = res.data;
      setForm({
        name:           d.name || '',
        activity:       d.activity || '',
        address:        d.address || '',
        capital_social: d.capital_social || '',
        phone:          d.phone || '',
        fax:            d.fax || '',
        email:          d.email || '',
        website:        d.website || '',
        nif:            d.nif || '',
        nis:            d.nis || '',
        tin:            d.tin || '',
        rc:             d.rc || '',
        bank_name:      d.bank_name || '',
        bank_rib:       d.bank_rib || '',
        bank_name2:     d.bank_name2 || '',
        bank_rib2:      d.bank_rib2 || '',
        invoice_prefix: d.invoice_prefix || 'F',
        tva_rate:       d.tva_rate || '19',
      });
    }).finally(() => setLoading(false));
  }, []);

  const f = (key: keyof CompanySettings) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(s => ({ ...s, [key]: e.target.value })),
  });

  const save = async () => {
    setSaving(true);
    await api.put('/settings', form);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="w-6 h-6 border-2 border-primary-950 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const isAdmin = user?.role === 'Admin' || user?.role === 'SuperAdmin';

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings size={18} className="text-primary-950" />
          <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
        </div>
        {isAdmin && (
          <button className="btn-primary flex items-center gap-2" onClick={save} disabled={saving}>
            <Save size={15} /> {saved ? 'Enregistré ✓' : saving ? 'Sauvegarde...' : 'Enregistrer'}
          </button>
        )}
      </div>

      {/* Entreprise */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">Informations entreprise</h2>
        {[
          { label: 'Nom de l\'entreprise', key: 'name' },
          { label: 'Activité', key: 'activity' },
          { label: 'Adresse', key: 'address' },
          { label: 'Capital Social (DA)', key: 'capital_social' },
        ].map(({ label, key }) => (
          <div key={key}>
            <label className="text-sm font-medium text-gray-700 block mb-1">{label}</label>
            <input type="text" className="input" disabled={!isAdmin} {...f(key as keyof CompanySettings)} />
          </div>
        ))}
      </div>

      {/* Contact */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">Contact</h2>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Téléphone', key: 'phone' },
            { label: 'Fax', key: 'fax' },
            { label: 'Email', key: 'email' },
            { label: 'Site web', key: 'website' },
          ].map(({ label, key }) => (
            <div key={key}>
              <label className="text-sm font-medium text-gray-700 block mb-1">{label}</label>
              <input type="text" className="input" disabled={!isAdmin} {...f(key as keyof CompanySettings)} />
            </div>
          ))}
        </div>
      </div>

      {/* Références fiscales */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">Références fiscales</h2>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'NIF (Identifiant Fiscal)', key: 'nif' },
            { label: 'NIS (Statistique)', key: 'nis' },
            { label: 'TIN', key: 'tin' },
            { label: 'RC (Registre de Commerce)', key: 'rc' },
          ].map(({ label, key }) => (
            <div key={key}>
              <label className="text-sm font-medium text-gray-700 block mb-1">{label}</label>
              <input type="text" className="input" disabled={!isAdmin} {...f(key as keyof CompanySettings)} />
            </div>
          ))}
        </div>
      </div>

      {/* Banques */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">Comptes bancaires</h2>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Banque 1', key: 'bank_name' },
            { label: 'RIB 1', key: 'bank_rib' },
            { label: 'Banque 2', key: 'bank_name2' },
            { label: 'RIB 2', key: 'bank_rib2' },
          ].map(({ label, key }) => (
            <div key={key}>
              <label className="text-sm font-medium text-gray-700 block mb-1">{label}</label>
              <input type="text" className="input" disabled={!isAdmin} {...f(key as keyof CompanySettings)} />
            </div>
          ))}
        </div>
      </div>

      {/* Facturation */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">Facturation</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Préfixe numéro facture</label>
            <input type="text" className="input" placeholder="F" disabled={!isAdmin} {...f('invoice_prefix')} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Taux TVA (%)</label>
            <input type="number" className="input" placeholder="19" disabled={!isAdmin} {...f('tva_rate')} />
          </div>
        </div>
      </div>
    </div>
  );
}
