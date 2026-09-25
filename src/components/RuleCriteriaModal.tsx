import React from 'react';
import { X, CheckCircle, AlertTriangle, ShieldAlert, Globe, Star } from 'lucide-react';

interface RuleCriteriaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RuleCriteriaModal: React.FC<RuleCriteriaModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div>
            <h2 className="text-base font-bold text-white">Regole di Analisi & Classificazione Lead</h2>
            <p className="text-xs text-slate-400">Standard del motore Local SEO & Lead Intelligence Auditor</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
          {/* Segment 1 */}
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
            <div className="font-semibold text-amber-300 text-sm flex items-center gap-1.5">
              <Globe className="w-4 h-4" />
              <span>1. Valutazione Presenza Web</span>
            </div>
            <p className="leading-relaxed">
              • <strong className="text-white">Nessun Sito Web (NO_WEBSITE)</strong>: Attività con <code className="text-amber-300 font-mono">website</code> nullo, vuoto o puntante a profili social (es. solo Facebook/Instagram). Priorità Lead: <strong className="text-rose-400">ALTA</strong>.
            </p>
            <p className="leading-relaxed">
              • <strong className="text-white">Sito Web da Ottimizzare (WEBSITE_CRITICAL)</strong>: Attività con sito esistente ma <code className="text-orange-300 font-mono">pagespeed_mobile_score &lt; 50</code> oppure <code className="text-orange-300 font-mono">ssl_active: false</code> (mancanza certificato HTTPS). Priorità Lead: <strong className="text-amber-400">ALTA / MEDIA</strong>.
            </p>
          </div>

          {/* Segment 2 */}
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
            <div className="font-semibold text-indigo-300 text-sm flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" />
              <span>2. Valutazione Profilo Google Business (GBP)</span>
            </div>
            <p className="leading-relaxed">
              • <strong className="text-white">GBP Non Rivendicato (GBP_UNCLAIMED)</strong>: Se <code className="text-indigo-300 font-mono">unclaimed_profile: true</code>. Opportunità commerciale immediata per messa in sicurezza e branding.
            </p>
            <p className="leading-relaxed">
              • <strong className="text-white">Poche Recensioni (GBP_LOW_REVIEWS)</strong>: Se <code className="text-indigo-300 font-mono">reviews_count &lt; 15</code>. Segnale di debolezza rispetto alla concorrenza nel Local Pack.
            </p>
            <p className="leading-relaxed">
              • <strong className="text-white">Rating Basso (GBP_POOR_RATING)</strong>: Se <code className="text-indigo-300 font-mono">google_rating &lt; 4.0</code>. Barriera d'ingresso per clienti nuovi che cercano affidabilità.
            </p>
          </div>

          {/* Segment 3 */}
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
            <div className="font-semibold text-rose-300 text-sm flex items-center gap-1.5">
              <Star className="w-4 h-4" />
              <span>3. Calcolo Lead Score Complessivo</span>
            </div>
            <p className="leading-relaxed">
              • <strong className="text-rose-400">Alta Opportunità (Score 80–100)</strong>: Nessun sito web OPPURE profilo non rivendicato OPPURE sito gravemente lento con buon volume di clienti.
            </p>
            <p className="leading-relaxed">
              • <strong className="text-amber-400">Media Opportunità (Score 50–79)</strong>: Sito presente ma da rifare, profilo GBP con poche recensioni.
            </p>
            <p className="leading-relaxed">
              • <strong className="text-emerald-400">Bassa Opportunità (Score &lt; 50)</strong>: Sito veloce, profilo curato con oltre 50 recensioni e rating &gt; 4.5.
            </p>
          </div>

          {/* Output Format reminder */}
          <div className="p-4 bg-indigo-950/20 border border-indigo-500/30 rounded-xl space-y-2">
            <div className="font-semibold text-indigo-200">Formato di Uscita Standard Restituito:</div>
            <pre className="p-3 bg-slate-950 rounded-lg text-slate-300 font-mono text-xs overflow-x-auto">
{`{
  "business_name": "Nome",
  "lead_priority": "ALTA" | "MEDIA" | "BASSA",
  "tags": ["NO_WEBSITE", "GBP_LOW_REVIEWS"],
  "main_problems": [...],
  "suggested_services": [...],
  "sales_pitch_hook": "Breve frase o gancio (max 2 frasi)..."
}`}
            </pre>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
          >
            Ho Capito
          </button>
        </div>
      </div>
    </div>
  );
};
