/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { RawBusinessInput, AuditResult } from './types/audit';
import { auditBusinessBatch, auditSingleBusiness } from './utils/auditorEngine';
import { SAMPLE_PRESETS, DatasetPreset } from './data/sampleDatasets';
import { Header } from './components/Header';
import { MetricsOverview } from './components/MetricsOverview';
import { LeadTable } from './components/LeadTable';
import { LeadDetailModal } from './components/LeadDetailModal';
import { JsonImportModal } from './components/JsonImportModal';
import { SingleAuditModal } from './components/SingleAuditModal';
import { RuleCriteriaModal } from './components/RuleCriteriaModal';
import { 
  Building2, 
  Sparkles, 
  HelpCircle, 
  Layers, 
  FileSpreadsheet, 
  Download, 
  Filter, 
  RefreshCw 
} from 'lucide-react';

export default function App() {
  const [leads, setLeads] = useState<AuditResult[]>([]);
  const [selectedLead, setSelectedLead] = useState<AuditResult | null>(null);
  const [activeSegment, setActiveSegment] = useState<string>('ALL');
  const [currentPresetName, setCurrentPresetName] = useState<string>(SAMPLE_PRESETS[0].name);

  // Modals state
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isSingleAuditOpen, setIsSingleAuditOpen] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);

  // Initialize with the first preset
  useEffect(() => {
    const initialLeads = auditBusinessBatch(SAMPLE_PRESETS[0].items);
    setLeads(initialLeads);
  }, []);

  const handleLoadPreset = (preset: DatasetPreset) => {
    const audited = auditBusinessBatch(preset.items);
    setLeads(audited);
    setCurrentPresetName(preset.name);
    setActiveSegment('ALL');
  };

  const handleImportJson = (businesses: RawBusinessInput[]) => {
    const audited = auditBusinessBatch(businesses);
    setLeads(audited);
    setCurrentPresetName(`Import Personalizzato (${businesses.length} record)`);
    setActiveSegment('ALL');
  };

  const handleSingleAudit = (business: RawBusinessInput) => {
    const singleResult = auditSingleBusiness(business);
    setLeads((prev) => [singleResult, ...prev]);
    setSelectedLead(singleResult);
  };

  const handleUpdateStatus = (businessName: string, status: AuditResult['pipeline_status']) => {
    setLeads((prev) =>
      prev.map((l) => (l.business_name === businessName ? { ...l, pipeline_status: status } : l))
    );
  };

  // Export clean JSON according to prompt output specification
  const handleExportJson = () => {
    const cleanOutput = leads.map((l) => ({
      business_name: l.business_name,
      lead_priority: l.lead_priority,
      tags: l.tags,
      main_problems: l.main_problems,
      suggested_services: l.suggested_services,
      sales_pitch_hook: l.sales_pitch_hook,
    }));

    const blob = new Blob([JSON.stringify(cleanOutput, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `localaudit-leads-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export CSV for Excel / Google Sheets
  const handleExportCsv = () => {
    const headers = [
      'Nome Attivita',
      'Priorita',
      'Lead Score',
      'Categoria',
      'Citta',
      'Telefono',
      'Sito Web',
      'Tag Opportunita',
      'Problemi Principali',
      'Servizi Suggeriti',
      'Sales Pitch Hook',
      'Stato Pipeline',
    ];

    const rows = leads.map((l) => [
      `"${l.business_name.replace(/"/g, '""')}"`,
      `"${l.lead_priority}"`,
      l.lead_score,
      `"${(l.raw.category || '').replace(/"/g, '""')}"`,
      `"${(l.raw.city || '').replace(/"/g, '""')}"`,
      `"${(l.raw.phone || '').replace(/"/g, '""')}"`,
      `"${(l.raw.website || 'N/A').replace(/"/g, '""')}"`,
      `"${l.tags.join(', ')}"`,
      `"${l.main_problems.join(' | ').replace(/"/g, '""')}"`,
      `"${l.suggested_services.join(' | ').replace(/"/g, '""')}"`,
      `"${l.sales_pitch_hook.replace(/"/g, '""')}"`,
      `"${l.pipeline_status || 'NUOVO'}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `localaudit-crm-export-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Bar */}
      <Header
        onOpenImport={() => setIsImportOpen(true)}
        onOpenSingleAudit={() => setIsSingleAuditOpen(true)}
        onOpenRules={() => setIsRulesOpen(true)}
        onExportJson={handleExportJson}
        onExportCsv={handleExportCsv}
        onLoadPreset={handleLoadPreset}
        leadsCount={leads.length}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Context Title & Opportunity Segment Guide */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
              <span>Auditor Lead Intelligence</span>
              <span aria-hidden="true">·</span>
              <span className="text-indigo-400">{currentPresetName}</span>
              <span aria-hidden="true">·</span>
              <span>{leads.length} Attività Inviate</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Classificazione Commerciale Attività Locali
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Esporta CSV (CRM)</span>
            </button>
            <button
              onClick={handleExportJson}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Esporta JSON Output</span>
            </button>
          </div>
        </div>

        {/* 3 Core Opportunity Segments Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 bg-amber-950/20 border border-amber-500/20 rounded-xl">
            <div className="font-semibold text-amber-300 mb-1 flex items-center justify-between">
              <span>1. Nessun Sito Web</span>
              <span className="font-mono text-amber-400/90 font-bold">ALTA PRIORITÀ</span>
            </div>
            <p className="text-slate-400 leading-normal">
              Attività con profilo GBP senza sito web o con link social. Offerta: sito vetrina mobile-first ad alte prestazioni.
            </p>
          </div>

          <div className="p-3.5 bg-orange-950/20 border border-orange-500/20 rounded-xl">
            <div className="font-semibold text-orange-300 mb-1 flex items-center justify-between">
              <span>2. Sito Web da Ottimizzare</span>
              <span className="font-mono text-orange-400/90 font-bold">ALTA / MEDIA</span>
            </div>
            <p className="text-slate-400 leading-normal">
              Sito esistente con PageSpeed Mobile &lt; 50 o assenza di certificato SSL/HTTPS. Offerta: rifacimento o velocizzazione.
            </p>
          </div>

          <div className="p-3.5 bg-indigo-950/20 border border-indigo-500/20 rounded-xl">
            <div className="font-semibold text-indigo-300 mb-1 flex items-center justify-between">
              <span>3. Profilo GBP da Migliorare</span>
              <span className="font-mono text-indigo-400/90 font-bold">VALORE CONTINUATIVO</span>
            </div>
            <p className="text-slate-400 leading-normal">
              &lt; 15 recensioni, rating &lt; 4.0 o scheda non verificata. Offerta: reputazione, recensioni automatiche e Local Pack SEO.
            </p>
          </div>
        </div>

        {/* Key Metrics Overview */}
        <MetricsOverview
          leads={leads}
          onSelectFilter={setActiveSegment}
          activeFilter={activeSegment}
        />

        {/* Leads Table */}
        <LeadTable
          leads={leads}
          onSelectLead={(lead) => setSelectedLead(lead)}
          activeSegment={activeSegment}
          onChangeSegment={setActiveSegment}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div>
            <span>LocalAudit Pro</span>
            <span className="mx-2">·</span>
            <span>Lead Intelligence & Local SEO Auditor Engine</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsRulesOpen(true)}
              className="hover:text-slate-300 transition-colors"
            >
              Parametri di Scoring
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setIsImportOpen(true)}
              className="hover:text-slate-300 transition-colors"
            >
              Incolla Dati JSON
            </button>
          </div>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <LeadDetailModal
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
        onUpdateStatus={handleUpdateStatus}
      />

      <JsonImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImport={handleImportJson}
      />

      <SingleAuditModal
        isOpen={isSingleAuditOpen}
        onClose={() => setIsSingleAuditOpen(false)}
        onSubmit={handleSingleAudit}
      />

      <RuleCriteriaModal
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
      />
    </div>
  );
}
