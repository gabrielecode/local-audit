import React, { useState } from 'react';
import { RawBusinessInput } from '../types/audit';
import { X, Upload, FileCode, Check, AlertCircle } from 'lucide-react';

interface JsonImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (businesses: RawBusinessInput[]) => void;
}

const TEMPLATE_EXAMPLE = `[
  {
    "business_name": "Ristorante Bella Napoli",
    "category": "Pizzeria & Cucina",
    "city": "Bologna",
    "phone": "+39 051 123456",
    "website": null,
    "google_rating": 4.2,
    "reviews_count": 9,
    "unclaimed_profile": false,
    "pagespeed_mobile_score": null,
    "ssl_active": null
  },
  {
    "business_name": "Studio Tecnico Arch. Ferri",
    "category": "Architetto",
    "city": "Firenze",
    "phone": "+39 055 987654",
    "website": "http://architettoferrifirenze.it",
    "google_rating": 4.7,
    "reviews_count": 22,
    "unclaimed_profile": false,
    "pagespeed_mobile_score": 31,
    "ssl_active": false
  }
]`;

export const JsonImportModal: React.FC<JsonImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleProcessImport = () => {
    setError(null);
    if (!jsonText.trim()) {
      setError('Inserisci il testo JSON prima di importare.');
      return;
    }

    try {
      const parsed = JSON.parse(jsonText);
      let items: RawBusinessInput[] = [];

      if (Array.isArray(parsed)) {
        items = parsed;
      } else if (parsed && typeof parsed === 'object') {
        items = [parsed];
      } else {
        throw new Error('Il JSON deve contenere un array di oggetti o un singolo oggetto.');
      }

      // Basic validation
      if (items.length === 0) {
        throw new Error('Nessuna attività presente nel JSON.');
      }

      for (let i = 0; i < items.length; i++) {
        if (!items[i].business_name) {
          throw new Error(`L'elemento #${i + 1} non possiede il campo "business_name" obbligatorio.`);
        }
      }

      onImport(items);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Errore nella sintassi JSON. Verifica virgole e virgolette.');
    }
  };

  const handleLoadTemplate = () => {
    setJsonText(TEMPLATE_EXAMPLE);
    setError(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setJsonText(content);
      setError(null);
    };
    reader.onerror = () => {
      setError('Impossibile leggere il file selezionato.');
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-600/20 text-emerald-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Importa Dati Grezzi (JSON)</h2>
              <p className="text-xs text-slate-400">
                Incolla il JSON estratto da Google Maps o carica un file .json
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Inserisci o incolla l'array JSON:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleLoadTemplate}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>Carica Esempio</span>
              </button>

              <label className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer underline">
                Carica file .json
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <textarea
            rows={10}
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder={`[\n  {\n    "business_name": "Nome Attività",\n    "category": "Ristorante",\n    "city": "Roma",\n    "phone": "+39 ...",\n    "website": null,\n    "google_rating": 4.1,\n    "reviews_count": 8,\n    "unclaimed_profile": false,\n    "pagespeed_mobile_score": 38,\n    "ssl_active": true\n  }\n]`}
            className="w-full p-3 font-mono text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-hidden focus:border-indigo-500 leading-relaxed resize-none"
          />

          {error && (
            <div className="flex items-center gap-2 p-3 text-xs text-rose-300 bg-rose-950/50 border border-rose-800/80 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            Annulla
          </button>
          <button
            onClick={handleProcessImport}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Elabora ed Esegui Audit</span>
          </button>
        </div>
      </div>
    </div>
  );
};
