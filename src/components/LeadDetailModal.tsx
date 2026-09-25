import React, { useState } from 'react';
import { AuditResult, LeadPriority } from '../types/audit';
import { 
  X, 
  Copy, 
  Check, 
  Phone, 
  ExternalLink, 
  MapPin, 
  Sparkles, 
  FileText, 
  Code, 
  CheckCircle2, 
  AlertTriangle, 
  Flame, 
  MessageSquare, 
  Mail, 
  ShieldAlert, 
  Clock, 
  Globe 
} from 'lucide-react';

interface LeadDetailModalProps {
  lead: AuditResult | null;
  onClose: () => void;
  onUpdateStatus?: (businessName: string, status: AuditResult['pipeline_status']) => void;
}

export const LeadDetailModal: React.FC<LeadDetailModalProps> = ({
  lead,
  onClose,
  onUpdateStatus,
}) => {
  const [activeTab, setActiveTab] = useState<'dossier' | 'ai-kit' | 'json'>('dossier');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiKit, setAiKit] = useState(lead?.ai_pitch_details || null);
  const [pipelineStatus, setPipelineStatus] = useState<AuditResult['pipeline_status']>(
    lead?.pipeline_status || 'NUOVO'
  );
  const [aiError, setAiError] = useState<string | null>(null);

  if (!lead) return null;

  // The clean output JSON format requested by the user prompt
  const cleanOutputJson = {
    business_name: lead.business_name,
    lead_priority: lead.lead_priority,
    tags: lead.tags,
    main_problems: lead.main_problems,
    suggested_services: lead.suggested_services,
    sales_pitch_hook: lead.sales_pitch_hook,
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleGenerateAiKit = async () => {
    setIsGeneratingAi(true);
    setAiError(null);
    try {
      const response = await fetch('/api/ai-pitch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audit: lead }),
      });
      const data = await response.json();
      if (data.success && data.pitch) {
        setAiKit(data.pitch);
        lead.ai_pitch_details = data.pitch;
      } else {
        setAiError(data.error || 'Errore nella generazione dello script.');
      }
    } catch (err: any) {
      setAiError('Impossibile contattare il server. Riprova tra poco.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleStatusChange = (newStatus: AuditResult['pipeline_status']) => {
    setPipelineStatus(newStatus);
    if (onUpdateStatus) {
      onUpdateStatus(lead.business_name, newStatus);
    }
  };

  const gmapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${lead.business_name} ${lead.raw.city || ''}`
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-start justify-between gap-4 bg-slate-950/40">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-white tracking-tight">
                {lead.business_name}
              </h2>
              <span
                className={`text-xs px-2.5 py-0.5 rounded font-mono font-semibold ${
                  lead.lead_priority === 'ALTA'
                    ? 'bg-rose-950/80 text-rose-300 border border-rose-800/80'
                    : lead.lead_priority === 'MEDIA'
                    ? 'bg-amber-950/80 text-amber-300 border border-amber-800/80'
                    : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/80'
                }`}
              >
                PRIORITÀ {lead.lead_priority} · SCORE {lead.lead_score}/100
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
              <span>{lead.raw.category}</span>
              <span aria-hidden="true">·</span>
              <span>{lead.raw.city}</span>
              {lead.raw.phone && (
                <>
                  <span aria-hidden="true">·</span>
                  <a
                    href={`tel:${lead.raw.phone}`}
                    className="text-indigo-400 hover:text-indigo-300 font-mono flex items-center gap-1"
                  >
                    <Phone className="w-3 h-3" />
                    <span>{lead.raw.phone}</span>
                  </a>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => copyToClipboard(JSON.stringify(cleanOutputJson, null, 2), 'clean-json')}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors"
            >
              {copiedKey === 'clean-json' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>JSON Copiato!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copia JSON</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Chiudi"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-5 border-b border-slate-800 bg-slate-900">
          <button
            onClick={() => setActiveTab('dossier')}
            className={`py-3 px-4 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'dossier'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Dossier Commerciale & Audit</span>
          </button>

          <button
            onClick={() => setActiveTab('ai-kit')}
            className={`py-3 px-4 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'ai-kit'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>AI Cold Outreach & Script</span>
            {aiKit && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />}
          </button>

          <button
            onClick={() => setActiveTab('json')}
            className={`py-3 px-4 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'json'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-4 h-4" />
            <span>JSON Output Specificato</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200 text-sm">
          {/* TAB 1: Dossier Commerciale */}
          {activeTab === 'dossier' && (
            <div className="space-y-6">
              {/* Sales Hook Box */}
              <div className="p-4 bg-indigo-950/30 border border-indigo-500/40 rounded-xl relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
                    Hook Commerciale per il Consulente (Telefono / Email)
                  </span>
                  <button
                    onClick={() => copyToClipboard(lead.sales_pitch_hook, 'hook')}
                    className="flex items-center gap-1 text-xs text-indigo-300 hover:text-white"
                  >
                    {copiedKey === 'hook' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Copiato</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copia Hook</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-sm font-medium text-indigo-100 leading-relaxed italic">
                  "{lead.sales_pitch_hook}"
                </p>
              </div>

              {/* Grid: Problems & Services */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Main Problems */}
                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
                  <div className="text-xs font-semibold text-rose-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Criticità Commerciali Rilevate</span>
                  </div>
                  <ul className="space-y-2.5">
                    {lead.main_problems.map((problem, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-slate-300 leading-normal">
                        <span className="text-rose-400 shrink-0 mt-0.5 font-bold">✕</span>
                        <span>{problem}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Suggested Services */}
                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
                  <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Servizi Consigliati da Proporre</span>
                  </div>
                  <ul className="space-y-2.5">
                    {lead.suggested_services.map((service, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-slate-300 leading-normal">
                        <span className="text-emerald-400 shrink-0 mt-0.5 font-bold">✓</span>
                        <span>{service}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Technical Profile Breakdown */}
              <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Indicatori Tecnici e Google Business Profile
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 block mb-0.5">Sito Web</span>
                    {lead.raw.website ? (
                      <a
                        href={lead.raw.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-400 hover:underline flex items-center gap-1 truncate"
                      >
                        <span className="truncate">{lead.raw.website}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    ) : (
                      <span className="text-amber-400 font-medium">Assente / Solo Social</span>
                    )}
                  </div>

                  <div>
                    <span className="text-slate-500 block mb-0.5">PageSpeed Mobile</span>
                    <span className="font-mono font-medium tabular-nums text-slate-200">
                      {lead.raw.pagespeed_mobile_score !== null
                        ? `${lead.raw.pagespeed_mobile_score}/100`
                        : 'Non rilevabile'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block mb-0.5">Google Rating & Recensioni</span>
                    <span className="font-mono font-medium tabular-nums text-slate-200">
                      ★ {lead.raw.google_rating?.toFixed(1) || 'N/D'} ({lead.raw.reviews_count || 0})
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block mb-0.5">Scheda Rivendicata</span>
                    <span
                      className={`font-medium ${
                        lead.raw.unclaimed_profile ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      {lead.raw.unclaimed_profile ? 'NO (Aperta a tutti)' : 'SI (Rivendicata)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Pipeline Status & Direct Links */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 bg-slate-800/40 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Stato Pipeline:</span>
                  <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-700/60">
                    {(['NUOVO', 'DA_CONTATTARE', 'IN_TRATTATIVA', 'CHIUSO_VINTO', 'PERSO'] as const).map(
                      (status) => (
                        <button
                          key={status}
                          onClick={() => handleStatusChange(status)}
                          className={`px-2.5 py-1 text-xs rounded transition-colors ${
                            pipelineStatus === status
                              ? 'bg-indigo-600 text-white font-medium'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {status.replace('_', ' ')}
                        </button>
                      )
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={gmapsSearchUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5 text-rose-400" />
                    <span>Verifica su Maps</span>
                  </a>

                  {lead.raw.phone && (
                    <a
                      href={`tel:${lead.raw.phone}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Chiama Ora</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AI Cold Outreach Kit */}
          {activeTab === 'ai-kit' && (
            <div className="space-y-5">
              {!aiKit && (
                <div className="p-8 text-center bg-slate-950/40 border border-dashed border-slate-800 rounded-xl space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mx-auto">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-semibold text-white">
                    Genera Kit di Contatto Personalizzato con Gemini 3.8 Flash
                  </h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Crea istantaneamente lo script per telefonata a freddo di 45 secondi, l'email icebreaker ad alta apertura e il messaggio WhatsApp per il titolare di {lead.business_name}.
                  </p>
                  <button
                    onClick={handleGenerateAiKit}
                    disabled={isGeneratingAi}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-colors disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{isGeneratingAi ? 'Generazione in corso...' : 'Genera Kit di Contatto'}</span>
                  </button>
                  {aiError && (
                    <div className="text-xs text-rose-400 mt-2">{aiError}</div>
                  )}
                </div>
              )}

              {aiKit && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Materiali di Vendita Pronti per l'Agenzia
                    </span>
                    <button
                      onClick={handleGenerateAiKit}
                      disabled={isGeneratingAi}
                      className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isGeneratingAi ? 'Rigenerazione...' : 'Rigenera con AI'}</span>
                    </button>
                  </div>

                  {/* Pitch Hook 1: Cold Call Script */}
                  <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300">
                        <Phone className="w-4 h-4 text-indigo-400" />
                        <span>Script Telefonata a Freddo (45 Secondi con il Titolare)</span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(aiKit.call_script, 'call-script')}
                        className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
                      >
                        {copiedKey === 'call-script' ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>Copiato</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copia</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                      {aiKit.call_script}
                    </p>
                  </div>

                  {/* Pitch Hook 2: Email Icebreaker */}
                  <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
                        <Mail className="w-4 h-4 text-amber-400" />
                        <span>Email Icebreaker (Brevissima, Orientata al Valore)</span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(aiKit.email_icebreaker, 'email-script')}
                        className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
                      >
                        {copiedKey === 'email-script' ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>Copiato</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copia</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                      {aiKit.email_icebreaker}
                    </p>
                  </div>

                  {/* Pitch Hook 3: WhatsApp Direct Message */}
                  <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
                        <MessageSquare className="w-4 h-4 text-emerald-400" />
                        <span>Messaggio Diretto WhatsApp (Sintetico per Smartphone)</span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(aiKit.whatsapp_pitch, 'wa-script')}
                        className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
                      >
                        {copiedKey === 'wa-script' ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>Copiato</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copia</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                      {aiKit.whatsapp_pitch}
                    </p>
                  </div>

                  {/* Two column: Value Prop & Objection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg">
                      <span className="text-slate-400 font-semibold block mb-1">
                        Proposta di Valore Condensata:
                      </span>
                      <p className="text-slate-200 italic">"{aiKit.value_proposition}"</p>
                    </div>

                    <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg">
                      <span className="text-slate-400 font-semibold block mb-1">
                        Risposta a Obiezione Frequente:
                      </span>
                      <p className="text-slate-200 italic">"{aiKit.objection_answer}"</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: JSON Output Specification */}
          {activeTab === 'json' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Formato JSON conforme alle specifiche richieste dall'auditor:
                </span>
                <button
                  onClick={() => copyToClipboard(JSON.stringify(cleanOutputJson, null, 2), 'tab-json')}
                  className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300"
                >
                  {copiedKey === 'tab-json' ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>Copiato negli Appunti!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copia JSON</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-indigo-300 overflow-x-auto max-h-96">
                {JSON.stringify(cleanOutputJson, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>Tags:</span>
            {lead.tags.map((tag) => (
              <span key={tag} className="font-mono text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded">
                {tag}
              </span>
            ))}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};
