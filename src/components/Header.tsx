import React from 'react';
import { 
  Building2, 
  Upload, 
  Download, 
  PlusCircle, 
  HelpCircle, 
  RefreshCw,
  Sparkles,
  Search
} from 'lucide-react';
import { DatasetPreset, SAMPLE_PRESETS } from '../data/sampleDatasets';

interface HeaderProps {
  onOpenImport: () => void;
  onOpenSingleAudit: () => void;
  onOpenRules: () => void;
  onExportJson: () => void;
  onExportCsv: () => void;
  onLoadPreset: (preset: DatasetPreset) => void;
  leadsCount: number;
  onFocusSearch?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenImport,
  onOpenSingleAudit,
  onOpenRules,
  onExportJson,
  onExportCsv,
  onLoadPreset,
  leadsCount,
  onFocusSearch,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              LocalAudit Pro
              <span className="text-xs font-normal text-slate-400 tracking-normal border border-slate-700 rounded px-1.5 py-0.2">
                Lead Intelligence
              </span>
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation & Dataset selector */}
        <nav className="hidden lg:flex items-center gap-5 text-sm font-medium text-slate-300">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Preset di test:</span>
            {SAMPLE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => onLoadPreset(preset)}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors border border-slate-700/60"
                title={preset.description}
              >
                {preset.name.split('—')[0].trim()}
              </button>
            ))}
          </div>

          <button
            onClick={onOpenRules}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Criteri & Regole</span>
          </button>
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {onFocusSearch && (
            <button
              onClick={onFocusSearch}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 transition-colors"
              title="Cerca lead live con Google Places API"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cerca Places</span>
            </button>
          )}

          <button
            onClick={onOpenSingleAudit}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5 text-indigo-400" />
            <span>Nuovo Audit</span>
          </button>

          <button
            onClick={onOpenImport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-400" />
            <span>Importa JSON</span>
          </button>

          <div className="relative group">
            <button
              onClick={onExportJson}
              disabled={leadsCount === 0}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white shadow-sm transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Esporta Risultati ({leadsCount})</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
