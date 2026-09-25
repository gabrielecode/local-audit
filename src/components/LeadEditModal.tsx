import React, { useState, useEffect } from 'react';
import { RawBusinessInput, AuditResult } from '../types/audit';
import { X, Check, Globe, Phone, Star, Shield, AlertTriangle, ExternalLink } from 'lucide-react';
import { normalizeWebsiteUrl } from '../utils/auditorEngine';

interface LeadEditModalProps {
  isOpen: boolean;
  lead: AuditResult | null;
  onClose: () => void;
  onSave: (updatedRaw: RawBusinessInput) => void;
}

export const LeadEditModal: React.FC<LeadEditModalProps> = ({
  isOpen,
  lead,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<RawBusinessInput>({
    business_name: '',
    category: '',
    city: '',
    phone: '',
    website: '',
    google_rating: 4.0,
    reviews_count: 10,
    unclaimed_profile: false,
    pagespeed_mobile_score: 45,
    ssl_active: true,
  });

  useEffect(() => {
    if (lead) {
      setFormData({
        business_name: lead.business_name,
        category: lead.raw.category || '',
        city: lead.raw.city || '',
        phone: lead.raw.phone || '',
        website: lead.raw.website || '',
        google_rating: lead.raw.google_rating ?? 4.0,
        reviews_count: lead.raw.reviews_count ?? 10,
        unclaimed_profile: Boolean(lead.raw.unclaimed_profile),
        pagespeed_mobile_score: lead.raw.pagespeed_mobile_score ?? 45,
        ssl_active: lead.raw.ssl_active !== false,
        google_maps_url: lead.raw.google_maps_url || null,
        googleMapsUri: lead.raw.googleMapsUri || null,
      });
    }
  }, [lead]);

  if (!isOpen || !lead) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanWebsite = formData.website?.trim() ? formData.website.trim() : null;

    onSave({
      ...formData,
      website: cleanWebsite,
      reviews_count: Number(formData.reviews_count) || 0,
      google_rating: Number(formData.google_rating) || 0,
      pagespeed_mobile_score:
        formData.pagespeed_mobile_score !== null && formData.pagespeed_mobile_score !== undefined
          ? Number(formData.pagespeed_mobile_score)
          : null,
    });
    onClose();
  };

  const handleClearWebsite = () => {
    setFormData((prev) => ({ ...prev, website: '' }));
  };

  const currentNormalizedUrl = formData.website ? normalizeWebsiteUrl(formData.website) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>Modifica & Correggi Dati Scheda</span>
            </h2>
            <p className="text-xs text-slate-400">
              Aggiorna l'URL del sito web, telefono o metriche Google Maps per ricalcolare l'audit all'istante
            </p>
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
              <label className="block text-slate-300 font-medium mb-1">Nome Attività *</label>
              <input
                type="text"
                required
                value={formData.business_name}
                onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-hidden focus:border-indigo-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Categoria Commerciale</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
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
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Telefono</label>
              <input
                type="text"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="es. +39 388 188 0203"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-hidden focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          {/* Website Input Section with Live Validator */}
          <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-slate-200 font-semibold flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-indigo-400" />
                <span>URL Sito Web (Google Maps)</span>
              </label>
              {formData.website && (
                <button
                  type="button"
                  onClick={handleClearWebsite}
                  className="text-[11px] text-rose-400 hover:text-rose-300"
                >
                  Imposta come "Nessun Sito Web"
                </button>
              )}
            </div>

            <input
              type="text"
              value={formData.website || ''}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="es. https://pizzeriavesuviomilano.it oppure pizzeriavesuviomilano.it"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 font-mono text-xs"
            />

            {currentNormalizedUrl ? (
              <div className="flex items-center justify-between text-[11px] text-emerald-400 pt-1">
                <span>✓ Sito Web proprietario rilevato: <strong>{currentNormalizedUrl}</strong></span>
                <a
                  href={currentNormalizedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 hover:underline text-indigo-400"
                >
                  <span>Testa link</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ) : (
              <div className="text-[11px] text-amber-400 pt-1">
                ⚠ Nessun URL specificato: l'attività verrà classificata con tag <strong>NO_WEBSITE</strong> (Alta Priorità).
              </div>
            )}
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
                value={formData.reviews_count ?? 10}
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
                value={formData.pagespeed_mobile_score ?? 45}
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
              className="px-4 py-2 font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Salva & Rianalizza Lead</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
