import React, { useState } from 'react';
import { RawBusinessInput } from '../types/audit';
import { X, Plus, Sparkles, Building, Globe, Star, Shield } from 'lucide-react';

interface SingleAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (business: RawBusinessInput) => void;
}

export const SingleAuditModal: React.FC<SingleAuditModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<RawBusinessInput>({
    business_name: '',
    category: '',
    city: '',
    phone: '',
    website: '',
    google_rating: 4.0,
    reviews_count: 8,
    unclaimed_profile: false,
    pagespeed_mobile_score: 40,
    ssl_active: true,
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.business_name.trim()) return;

    onSubmit({
      ...formData,
      website: formData.website?.trim() ? formData.website.trim() : null,
      reviews_count: Number(formData.reviews_count) || 0,
      google_rating: Number(formData.google_rating) || 0,
      pagespeed_mobile_score:
        formData.pagespeed_mobile_score !== null && formData.pagespeed_mobile_score !== undefined
          ? Number(formData.pagespeed_mobile_score)
          : null,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Audit Nuova Attività Singola</h2>
              <p className="text-xs text-slate-400">Inserisci i parametri di verifica locale</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Nome Attività *
              </label>
              <input
                type="text"
                required
                value={formData.business_name}
                onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                placeholder="es. Trattoria da Mario"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Categoria Commerciale
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="es. Ristorante / Idraulico / Dentista"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-hidden focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Città</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="es. Milano"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Telefono</label>
              <input
                type="text"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="es. +39 02 1234567"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-hidden focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Sito Web (Lascia vuoto o inserisci link Facebook per testare "Nessun Sito")
            </label>
            <input
              type="text"
              value={formData.website || ''}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://... oppure https://facebook.com/... oppure vuoto"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-hidden focus:border-indigo-500 font-mono"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Rating Google (1-5)</label>
              <input
                type="number"
                step="0.1"
                min="1"
                max="5"
                value={formData.google_rating ?? 4.0}
                onChange={(e) =>
                  setFormData({ ...formData, google_rating: parseFloat(e.target.value) })
                }
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-hidden focus:border-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">N. Recensioni</label>
              <input
                type="number"
                min="0"
                value={formData.reviews_count ?? 8}
                onChange={(e) =>
                  setFormData({ ...formData, reviews_count: parseInt(e.target.value, 10) })
                }
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-hidden focus:border-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                PageSpeed Mobile (0-100)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.pagespeed_mobile_score ?? 40}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    pagespeed_mobile_score: parseInt(e.target.value, 10),
                  })
                }
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-hidden focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <label className="flex items-center gap-2 p-3 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(formData.unclaimed_profile)}
                onChange={(e) =>
                  setFormData({ ...formData, unclaimed_profile: e.target.checked })
                }
                className="rounded border-slate-700 text-indigo-600 focus:ring-0"
              />
              <span className="text-slate-300">Profilo NON rivendicato (GBP Unclaimed)</span>
            </label>

            <label className="flex items-center gap-2 p-3 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(formData.ssl_active)}
                onChange={(e) => setFormData({ ...formData, ssl_active: e.target.checked })}
                className="rounded border-slate-700 text-indigo-600 focus:ring-0"
              />
              <span className="text-slate-300">Certificato SSL Attivo (HTTPS)</span>
            </label>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="px-4 py-2 font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Esegui Audit Subito</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
