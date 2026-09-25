import React from 'react';
import { AuditResult } from '../types/audit';
import { AlertCircle, Globe, Flame, Star, ShieldAlert } from 'lucide-react';

interface MetricsOverviewProps {
  leads: AuditResult[];
  onSelectFilter: (tag: string) => void;
  activeFilter: string;
}

export const MetricsOverview: React.FC<MetricsOverviewProps> = ({
  leads,
  onSelectFilter,
  activeFilter,
}) => {
  const total = leads.length;
  const highPriority = leads.filter((l) => l.lead_priority === 'ALTA').length;
  const noWebsite = leads.filter((l) => l.tags.includes('NO_WEBSITE')).length;
  const criticalWeb = leads.filter((l) => l.tags.includes('WEBSITE_CRITICAL')).length;
  const weakGbp = leads.filter(
    (l) =>
      l.tags.includes('GBP_LOW_REVIEWS') ||
      l.tags.includes('GBP_POOR_RATING') ||
      l.tags.includes('GBP_UNCLAIMED')
  ).length;

  const estimatedPipelineValue = highPriority * 1800 + (total - highPriority) * 650;

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {/* Metric 1: Total Leads */}
      <div
        onClick={() => onSelectFilter('ALL')}
        className={`cursor-pointer p-4 rounded-xl border transition-all ${
          activeFilter === 'ALL'
            ? 'bg-slate-800/90 border-indigo-500/80 shadow-sm'
            : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
        }`}
      >
        <div className="text-xs text-slate-400 font-medium mb-1">Lead Analizzati</div>
        <div className="text-2xl font-bold font-mono tabular-nums text-white">
          {total}
        </div>
        <div className="text-xs text-slate-500 mt-1">
          Pipeline ~€{estimatedPipelineValue.toLocaleString('it-IT')}
        </div>
      </div>

      {/* Metric 2: Alta Priorità */}
      <div
        onClick={() => onSelectFilter('PRIORITY_HIGH')}
        className={`cursor-pointer p-4 rounded-xl border transition-all ${
          activeFilter === 'PRIORITY_HIGH'
            ? 'bg-rose-950/40 border-rose-500/80 shadow-sm'
            : 'bg-slate-900/60 border-slate-800 hover:border-rose-900/40'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs text-rose-300 font-medium">Alta Opportunità</span>
          <Flame className="w-3.5 h-3.5 text-rose-400" />
        </div>
        <div className="text-2xl font-bold font-mono tabular-nums text-rose-200 mt-1">
          {highPriority}
        </div>
        <div className="text-xs text-slate-400 mt-1">
          Score 80–100 · Chiusura rapida
        </div>
      </div>

      {/* Metric 3: Nessun Sito Web */}
      <div
        onClick={() => onSelectFilter('NO_WEBSITE')}
        className={`cursor-pointer p-4 rounded-xl border transition-all ${
          activeFilter === 'NO_WEBSITE'
            ? 'bg-amber-950/40 border-amber-500/80 shadow-sm'
            : 'bg-slate-900/60 border-slate-800 hover:border-amber-900/40'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs text-amber-300 font-medium">1. Nessun Sito Web</span>
          <Globe className="w-3.5 h-3.5 text-amber-400" />
        </div>
        <div className="text-2xl font-bold font-mono tabular-nums text-amber-200 mt-1">
          {noWebsite}
        </div>
        <div className="text-xs text-slate-400 mt-1">
          Zero URL o solo link social
        </div>
      </div>

      {/* Metric 4: Sito da Ottimizzare */}
      <div
        onClick={() => onSelectFilter('WEBSITE_CRITICAL')}
        className={`cursor-pointer p-4 rounded-xl border transition-all ${
          activeFilter === 'WEBSITE_CRITICAL'
            ? 'bg-orange-950/40 border-orange-500/80 shadow-sm'
            : 'bg-slate-900/60 border-slate-800 hover:border-orange-900/40'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs text-orange-300 font-medium">2. Sito Critico</span>
          <AlertCircle className="w-3.5 h-3.5 text-orange-400" />
        </div>
        <div className="text-2xl font-bold font-mono tabular-nums text-orange-200 mt-1">
          {criticalWeb}
        </div>
        <div className="text-xs text-slate-400 mt-1">
          PageSpeed &lt; 50 o No HTTPS
        </div>
      </div>

      {/* Metric 5: GBP Debole */}
      <div
        onClick={() => onSelectFilter('GBP_IMPROVABLE')}
        className={`cursor-pointer p-4 rounded-xl border transition-all ${
          activeFilter === 'GBP_IMPROVABLE'
            ? 'bg-indigo-950/40 border-indigo-500/80 shadow-sm'
            : 'bg-slate-900/60 border-slate-800 hover:border-indigo-900/40'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs text-indigo-300 font-medium">3. GBP da Potenziare</span>
          <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />
        </div>
        <div className="text-2xl font-bold font-mono tabular-nums text-indigo-200 mt-1">
          {weakGbp}
        </div>
        <div className="text-xs text-slate-400 mt-1">
          &lt;15 recensioni o non verificato
        </div>
      </div>
    </div>
  );
};
