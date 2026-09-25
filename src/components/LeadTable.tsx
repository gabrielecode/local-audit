import React, { useState } from 'react';
import { AuditResult, OpportunityTag, LeadPriority } from '../types/audit';
import { 
  ExternalLink, 
  Phone, 
  Search, 
  Sparkles, 
  Copy, 
  Check, 
  ChevronRight, 
  AlertTriangle,
  Globe,
  Star,
  ShieldCheck,
  ShieldAlert,
  ArrowUpDown,
  MessageCircle,
  Edit3,
  Gauge,
  Loader2,
  RotateCw,
  Zap,
  MapPin
} from 'lucide-react';
import { buildWhatsAppUrl, generateWhatsAppPitch, formatWhatsAppNumber } from '../utils/whatsappHelper';

interface LeadTableProps {
  leads: AuditResult[];
  onSelectLead: (lead: AuditResult) => void;
  onEditLead?: (lead: AuditResult) => void;
  activeSegment: string;
  onChangeSegment: (segment: string) => void;
  senderName?: string;
  onTestSpeed?: (lead: AuditResult) => Promise<void>;
  onBatchTestSpeed?: () => void;
  testingBusinessNames?: Set<string>;
  isBatchTestingSpeed?: boolean;
  batchProgress?: { current: number; total: number };
}

export const LeadTable: React.FC<LeadTableProps> = ({
  leads,
  onSelectLead,
  onEditLead,
  activeSegment,
  onChangeSegment,
  senderName = 'il team di LocalAudit',
  onTestSpeed,
  onBatchTestSpeed,
  testingBusinessNames = new Set(),
  isBatchTestingSpeed = false,
  batchProgress,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'score' | 'reviews' | 'name'>('score');
  const [sortAsc, setSortAsc] = useState(false);

  // Filter leads based on segment and search term
  const filteredLeads = leads
    .filter((lead) => {
      // Segment filter
      if (activeSegment === 'NO_WEBSITE' && !lead.tags.includes('NO_WEBSITE')) return false;
      if (activeSegment === 'WEBSITE_CRITICAL' && !lead.tags.includes('WEBSITE_CRITICAL')) return false;
      if (
        activeSegment === 'GBP_IMPROVABLE' &&
        !lead.tags.some((t) => ['GBP_LOW_REVIEWS', 'GBP_POOR_RATING', 'GBP_UNCLAIMED'].includes(t))
      ) {
        return false;
      }
      if (activeSegment === 'PRIORITY_HIGH' && lead.lead_priority !== 'ALTA') return false;
      if (activeSegment === 'PRIORITY_MEDIUM' && lead.lead_priority !== 'MEDIA') return false;
      if (activeSegment === 'PRIORITY_LOW' && lead.lead_priority !== 'BASSA') return false;

      // Text search
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return (
        lead.business_name.toLowerCase().includes(q) ||
        (lead.raw.category || '').toLowerCase().includes(q) ||
        (lead.raw.city || '').toLowerCase().includes(q) ||
        lead.tags.some((t) => t.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      if (sortBy === 'score') {
        return sortAsc ? a.lead_score - b.lead_score : b.lead_score - a.lead_score;
      }
      if (sortBy === 'reviews') {
        const revA = a.raw.reviews_count || 0;
        const revB = b.raw.reviews_count || 0;
        return sortAsc ? revA - revB : revB - revA;
      }
      return sortAsc
        ? a.business_name.localeCompare(b.business_name)
        : b.business_name.localeCompare(a.business_name);
    });

  const handleCopyHook = (e: React.MouseEvent, hook: string, index: number) => {
    e.stopPropagation();
    navigator.clipboard.writeText(hook);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const getPriorityBadge = (priority: LeadPriority) => {
    switch (priority) {
      case 'ALTA':
        return (
          <span className="inline-flex items-center text-xs font-semibold text-rose-400">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mr-1.5 animate-pulse" />
            ALTA
          </span>
        );
      case 'MEDIA':
        return (
          <span className="inline-flex items-center text-xs font-semibold text-amber-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5" />
            MEDIA
          </span>
        );
      case 'BASSA':
        return (
          <span className="inline-flex items-center text-xs font-semibold text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5" />
            BASSA
          </span>
        );
    }
  };

  // Untested websites count
  const untestedWebsitesCount = leads.filter(
    (l) => l.raw.website && !l.tags.includes('NO_WEBSITE') && l.raw.pagespeed_mobile_score === null
  ).length;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
      {/* Search and Segment Toolbar */}
      <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-slate-950/40">
        {/* Segmented Filter Control */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg overflow-x-auto">
          {[
            { id: 'ALL', label: 'Tutti' },
            { id: 'PRIORITY_HIGH', label: 'Alta Priorità' },
            { id: 'NO_WEBSITE', label: '1. Senza Sito' },
            { id: 'WEBSITE_CRITICAL', label: '2. Sito Critico' },
            { id: 'GBP_IMPROVABLE', label: '3. GBP Debole' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => onChangeSegment(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                activeSegment === tab.id
                  ? 'bg-slate-800 text-white shadow-xs font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Action Controls & Search input */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Batch PageSpeed Test Button */}
          {onBatchTestSpeed && untestedWebsitesCount > 0 && (
            <button
              onClick={onBatchTestSpeed}
              disabled={isBatchTestingSpeed}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg transition-colors disabled:opacity-50"
              title="Testa automaticamente tutti i siti non ancora misurati con Google PageSpeed Insights"
            >
              {isBatchTestingSpeed ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  <span>
                    Audit PageSpeed ({batchProgress?.current || 0}/{batchProgress?.total || untestedWebsitesCount})
                  </span>
                </>
              ) : (
                <>
                  <Gauge className="w-3.5 h-3.5 text-amber-400" />
                  <span>Testa Tutti i Siti ({untestedWebsitesCount})</span>
                </>
              )}
            </button>
          )}

          <div className="relative flex-1 md:w-60">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cerca attività, città..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          <button
            onClick={() => {
              if (sortBy === 'score') setSortAsc(!sortAsc);
              else {
                setSortBy('score');
                setSortAsc(false);
              }
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 transition-colors"
            title="Ordina per Lead Score"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span>Score</span>
          </button>
        </div>
      </div>

      {/* Batch progress banner if running */}
      {isBatchTestingSpeed && batchProgress && (
        <div className="px-4 py-2 bg-indigo-950/40 border-b border-indigo-500/30 flex items-center justify-between text-xs text-indigo-200">
          <div className="flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
            <span>
              Google PageSpeed Insights in corso: <strong>{batchProgress.current}</strong> di{' '}
              <strong>{batchProgress.total}</strong> siti analizzati...
            </span>
          </div>
          <div className="w-32 bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-indigo-500 h-full transition-all duration-300"
              style={{
                width: `${Math.round((batchProgress.current / (batchProgress.total || 1)) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-medium">
              <th className="py-3 px-4">Attività & Dettagli</th>
              <th className="py-3 px-4">Priorità & Score</th>
              <th className="py-3 px-4">Presenza Web & PageSpeed</th>
              <th className="py-3 px-4">Profilo Google (GBP)</th>
              <th className="py-3 px-4">Hook Commerciale</th>
              <th className="py-3 px-4 text-right">Azione</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredLeads.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-500">
                  Nessun lead trovato con i filtri selezionati. Prova a cambiare categoria o reimposta la ricerca.
                </td>
              </tr>
            ) : (
              filteredLeads.map((lead, index) => {
                const isNoWeb = lead.tags.includes('NO_WEBSITE');
                const isCriticalWeb = lead.tags.includes('WEBSITE_CRITICAL');
                const isUnclaimed = lead.tags.includes('GBP_UNCLAIMED');
                const isTestingThisLead = testingBusinessNames.has(lead.business_name);
                const hasScore = lead.raw.pagespeed_mobile_score !== null;

                return (
                  <tr
                    key={index}
                    onClick={() => onSelectLead(lead)}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors group"
                  >
                    {/* Attività & Categoria */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors text-sm">
                        {lead.business_name}
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400 text-xs mt-0.5">
                        <span>{lead.raw.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>{lead.raw.city}</span>
                        {lead.raw.phone && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums text-slate-500">
                              {lead.raw.phone}
                            </span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Priorità & Lead Score */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {getPriorityBadge(lead.lead_priority)}
                        <span className="font-mono font-semibold tabular-nums text-slate-300">
                          {lead.lead_score}/100
                        </span>
                      </div>
                      <div className="w-20 bg-slate-800 rounded-full h-1.5 mt-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            lead.lead_priority === 'ALTA'
                              ? 'bg-rose-500'
                              : lead.lead_priority === 'MEDIA'
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${lead.lead_score}%` }}
                        />
                      </div>
                    </td>

                    {/* Presenza Web & PageSpeed Mobile */}
                    <td className="py-3 px-4">
                      {isNoWeb ? (
                        <div className="space-y-1">
                          <div className="text-amber-400 font-medium flex items-center gap-1">
                            <Globe className="w-3.5 h-3.5 text-amber-400" />
                            <span>Nessun Sito Web</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-amber-400/80 font-mono">
                              Score: 0 · NO_WEBSITE
                            </span>
                            {(lead.raw.googleMapsUri || lead.raw.google_maps_url) && (
                              <a
                                href={(lead.raw.googleMapsUri || lead.raw.google_maps_url)!}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-800/90 hover:bg-slate-700 text-rose-400 hover:text-rose-300 border border-slate-700/60 transition-colors text-[10px] font-medium"
                                title="Verifica scheda Google Maps con 1 click"
                              >
                                <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                                <span>Maps</span>
                              </a>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {/* Website Link, SSL and Google Maps 1-Click Link */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <a
                              href={lead.raw.website!}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-xs text-indigo-400 hover:underline truncate max-w-[140px] inline-flex items-center gap-1 font-medium"
                              title={lead.raw.website!}
                            >
                              <span className="truncate">
                                {lead.raw.website!.replace(/^https?:\/\/(www\.)?/, '')}
                              </span>
                              <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-70" />
                            </a>

                            {/* Direct Google Maps 1-click check */}
                            {(lead.raw.googleMapsUri || lead.raw.google_maps_url) && (
                              <a
                                href={(lead.raw.googleMapsUri || lead.raw.google_maps_url)!}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-slate-800/80 hover:bg-slate-700 text-rose-400 hover:text-rose-300 border border-slate-700/60 transition-colors"
                                title="Apri scheda ufficiale Google Maps con 1 click"
                              >
                                <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                                <span className="text-[10px] font-medium">Maps</span>
                              </a>
                            )}

                            {lead.raw.ssl_active === false && (
                              <span className="text-[10px] text-rose-400 bg-rose-950/60 px-1 rounded font-mono">
                                No SSL
                              </span>
                            )}
                            {lead.raw.ssl_active === true && (
                              <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-1 rounded font-mono">
                                HTTPS
                              </span>
                            )}
                          </div>

                          {/* PageSpeed Status or Test Button */}
                          {isTestingThisLead ? (
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-indigo-950/80 text-indigo-300 border border-indigo-500/30">
                              <Loader2 className="w-3 h-3 animate-spin text-indigo-400" />
                              <span>Audit Mobile...</span>
                            </div>
                          ) : hasScore ? (
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-mono font-semibold ${
                                  lead.raw.pagespeed_mobile_score! < 50
                                    ? 'bg-rose-950/80 text-rose-300 border border-rose-800/80'
                                    : lead.raw.pagespeed_mobile_score! < 90
                                    ? 'bg-amber-950/80 text-amber-300 border border-amber-800/80'
                                    : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/80'
                                }`}
                              >
                                <Gauge className="w-3 h-3" />
                                <span>Mobile: {lead.raw.pagespeed_mobile_score}/100</span>
                                {lead.raw.pagespeed_mobile_score! < 50 && <span>(Lento)</span>}
                              </span>

                              {onTestSpeed && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onTestSpeed(lead);
                                  }}
                                  className="p-1 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800 transition-colors"
                                  title="Rifai audit PageSpeed"
                                >
                                  <RotateCw className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          ) : (
                            onTestSpeed && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onTestSpeed(lead);
                                }}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-indigo-200 border border-indigo-500/30 transition-colors cursor-pointer"
                                title="Misura il punteggio Mobile reale tramite Google PageSpeed Insights"
                              >
                                <Zap className="w-3 h-3 text-amber-400" />
                                <span>Testa Velocità</span>
                              </button>
                            )
                          )}
                        </div>
                      )}
                    </td>

                    {/* Profilo Google (GBP) */}
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 text-slate-200">
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          <span className="font-mono font-medium tabular-nums">
                            {lead.raw.google_rating?.toFixed(1) || '0.0'}
                          </span>
                          <span className="text-slate-500">
                            ({lead.raw.reviews_count || 0} rec.)
                          </span>
                        </div>
                        {(lead.raw.googleMapsUri || lead.raw.google_maps_url) && (
                          <a
                            href={(lead.raw.googleMapsUri || lead.raw.google_maps_url)!}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1 rounded bg-slate-800/80 hover:bg-slate-700 text-rose-400 hover:text-rose-300 border border-slate-700/60 transition-colors shrink-0"
                            title="Apri scheda ufficiale Google Maps"
                          >
                            <MapPin className="w-3 h-3 text-rose-400" />
                          </a>
                        )}
                      </div>
                      {isUnclaimed ? (
                        <div className="text-xs text-rose-400 font-medium flex items-center gap-1 mt-0.5">
                          <ShieldAlert className="w-3 h-3 text-rose-400" />
                          <span>Non rivendicato</span>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-500 mt-0.5">
                          {(lead.raw.reviews_count || 0) < 15 ? 'Poche recensioni' : 'Profilo attivo'}
                        </div>
                      )}
                    </td>

                    {/* Hook Commerciale */}
                    <td className="py-3 px-4 max-w-xs">
                      <p className="text-xs text-slate-300 line-clamp-2 italic">
                        "{lead.sales_pitch_hook}"
                      </p>
                    </td>

                    {/* Azione Rapida */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Direct Google Maps 1-click icon in actions */}
                        {(lead.raw.googleMapsUri || lead.raw.google_maps_url) && (
                          <a
                            href={(lead.raw.googleMapsUri || lead.raw.google_maps_url)!}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-slate-700 transition-colors"
                            title="Apri scheda Google Maps con 1 click"
                          >
                            <MapPin className="w-3.5 h-3.5 text-rose-400" />
                          </a>
                        )}

                        {/* WhatsApp Direct wa.me Link Button */}
                        {lead.raw.phone && formatWhatsAppNumber(lead.raw.phone) && (
                          <a
                            href={buildWhatsAppUrl(
                              lead.raw.phone,
                              generateWhatsAppPitch(lead, senderName)
                            )!}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 rounded-md hover:bg-emerald-950/80 text-emerald-400 hover:text-emerald-300 border border-emerald-900/60 bg-emerald-950/30 transition-colors flex items-center gap-1"
                            title={`Invia messaggio WhatsApp personalizzato (${formatWhatsAppNumber(lead.raw.phone)})`}
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span className="text-[11px] font-medium hidden sm:inline">WhatsApp</span>
                          </a>
                        )}

                        <button
                          onClick={(e) => handleCopyHook(e, lead.sales_pitch_hook, index)}
                          className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                          title="Copia hook commerciale"
                        >
                          {copiedIndex === index ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {onEditLead && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditLead(lead);
                            }}
                            className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-indigo-300 transition-colors"
                            title="Modifica / Correggi URL o dati"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => onSelectLead(lead)}
                          className="px-2.5 py-1 text-xs font-medium rounded-md bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white transition-colors flex items-center gap-1"
                        >
                          <span>Dossier</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between text-xs text-slate-500">
        <div>
          Mostrando <span className="font-mono tabular-nums text-slate-300 font-medium">{filteredLeads.length}</span> attività di{' '}
          <span className="font-mono tabular-nums text-slate-300 font-medium">{leads.length}</span> totali
        </div>
        <div className="flex items-center gap-3">
          <span>Clicca su "Testa Velocità" o su una riga per aprire il Dossier completo e testare Google PageSpeed.</span>
        </div>
      </div>
    </div>
  );
};
