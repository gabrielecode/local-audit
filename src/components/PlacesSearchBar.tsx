import React, { useState } from 'react';
import { 
  Search, 
  MapPin, 
  Briefcase, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  Key, 
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { RawBusinessInput } from '../types/audit';

interface PlacesSearchBarProps {
  onSearchSuccess: (results: RawBusinessInput[], category: string, city: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  onFallbackLoadSample?: () => void;
}

const POPULAR_SUGGESTIONS = [
  { category: 'Ristoranti', city: 'Bologna' },
  { category: 'Dentisti', city: 'Milano' },
  { category: 'Idraulici', city: 'Roma' },
  { category: 'Palestre', city: 'Torino' },
  { category: 'Centri Estetici', city: 'Firenze' },
];

export const PlacesSearchBar: React.FC<PlacesSearchBarProps> = ({
  onSearchSuccess,
  isLoading,
  setIsLoading,
  onFallbackLoadSample,
}) => {
  const [category, setCategory] = useState('Ristoranti');
  const [city, setCity] = useState('Bologna');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [missingKeyError, setMissingKeyError] = useState(false);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const trimmedCat = category.trim();
    const trimmedCity = city.trim();

    if (!trimmedCat || !trimmedCity) {
      setErrorMessage('Inserisci sia la categoria che la città per avviare la ricerca.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setMissingKeyError(false);
    setSuccessInfo(null);

    try {
      const url = `/api/search?category=${encodeURIComponent(trimmedCat)}&city=${encodeURIComponent(trimmedCity)}`;
      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) {
        if (data.code === 'MISSING_API_KEY' || res.status === 500) {
          if (data.error && data.error.includes('GOOGLE_PLACES_API_KEY')) {
            setMissingKeyError(true);
          }
        }
        throw new Error(data.error || `Errore del server (${res.status})`);
      }

      const placesList: RawBusinessInput[] = Array.isArray(data)
        ? data
        : Array.isArray(data.results)
        ? data.results
        : [];

      if (placesList.length === 0) {
        setErrorMessage(`Nessuna attività trovata per "${trimmedCat}" a "${trimmedCity}". Prova con un'altra categoria o città.`);
      } else {
        setSuccessInfo(`Trovate ${placesList.length} attività per "${trimmedCat}" a ${trimmedCity}! Analisi completata.`);
        onSearchSuccess(placesList, trimmedCat, trimmedCity);
      }
    } catch (err: any) {
      console.error('Search error:', err);
      setErrorMessage(err.message || 'Errore durante la ricerca dei lead su Google Places.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickSuggestion = (suggestedCat: string, suggestedCity: string) => {
    setCategory(suggestedCat);
    setCity(suggestedCity);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-md relative overflow-hidden">
      {/* Background glow accent */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-400">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <span>Ricerca Lead Live su Google Places</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Vercel Serverless
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Interroga le Google Places API (New Text Search) e analizza i lead in tempo reale
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className="hidden sm:inline">Suggeriti:</span>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_SUGGESTIONS.map((item) => (
                <button
                  key={`${item.category}-${item.city}`}
                  type="button"
                  onClick={() => handleQuickSuggestion(item.category, item.city)}
                  className="px-2 py-1 rounded-md text-[11px] bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
                >
                  {item.category} {item.city}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row items-stretch gap-3">
          {/* Field 1: Category */}
          <div className="flex-1 relative">
            <label className="block text-[11px] font-medium text-slate-400 mb-1">
              Categoria Attività
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Briefcase className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="es. Ristoranti, Dentisti, Idraulici..."
                disabled={isLoading}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all disabled:opacity-50"
              />
            </div>
          </div>

          {/* Field 2: City */}
          <div className="flex-1 relative">
            <label className="block text-[11px] font-medium text-slate-400 mb-1">
              Città / Località
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <MapPin className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="es. Bologna, Milano, Roma, Torino..."
                disabled={isLoading}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all disabled:opacity-50"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="md:self-end">
            <button
              type="submit"
              disabled={isLoading || !category.trim() || !city.trim()}
              className="w-full md:w-auto px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-medium text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer h-[42px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Scansione Zona...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Scansiona Zona</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Success alert */}
        {successInfo && (
          <div className="mt-3.5 p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span className="font-medium">{successInfo}</span>
          </div>
        )}

        {/* Error alert with Missing Key troubleshooting guide */}
        {errorMessage && (
          <div className="mt-3.5 p-3.5 rounded-xl bg-red-950/30 border border-red-500/30 text-red-200 text-xs space-y-2 animate-in fade-in">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-red-300">{errorMessage}</p>
                {missingKeyError && (
                  <div className="mt-2 text-slate-300 text-xs bg-slate-950/70 p-3 rounded-lg border border-red-900/40 space-y-1.5">
                    <p className="font-medium text-amber-300 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5" />
                      Come configurare la chiave per Vercel o in locale:
                    </p>
                    <ol className="list-decimal pl-4 space-y-1 text-slate-400 text-[11px]">
                      <li>
                        Vai su <strong>Vercel Dashboard</strong> &rarr; Seleziona il progetto &rarr; <strong>Settings</strong> &rarr; <strong>Environment Variables</strong>.
                      </li>
                      <li>
                        Aggiungi la variabile: <code className="text-indigo-300 bg-slate-900 px-1 py-0.5 rounded font-mono">GOOGLE_PLACES_API_KEY</code> con il valore della tua API Key di Google Cloud.
                      </li>
                      <li>
                        Assicurati che su Google Cloud Console sia abilitata l'API: <strong>"Places API (New)"</strong>.
                      </li>
                    </ol>
                    {onFallbackLoadSample && (
                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                        <span className="text-slate-400 text-[11px]">
                          Vuoi testare l'algoritmo di audit senza API Key?
                        </span>
                        <button
                          type="button"
                          onClick={onFallbackLoadSample}
                          className="px-2.5 py-1 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 rounded text-[11px] font-medium transition-colors"
                        >
                          Carica Dataset Dimostrativo
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
