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
  ChevronRight,
  Globe,
  SlidersHorizontal,
  Navigation
} from 'lucide-react';
import { RawBusinessInput } from '../types/audit';

interface PlacesSearchBarProps {
  onSearchSuccess: (results: RawBusinessInput[], category: string, city: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  onFallbackLoadSample?: () => void;
}

type SearchMode = 'direct' | 'category_city';

interface SuggestionItem {
  label: string;
  mode: SearchMode;
  query?: string;
  category?: string;
  city?: string;
}

const POPULAR_SUGGESTIONS: SuggestionItem[] = [
  { label: 'Grotto Morchino Lugano', mode: 'direct', query: 'Grotto Morchino Lugano' },
  { label: 'Ristoranti Lugano', mode: 'category_city', category: 'Ristoranti', city: 'Lugano' },
  { label: 'Dentisti Milano', mode: 'category_city', category: 'Dentisti', city: 'Milano' },
  { label: 'Idraulici Roma', mode: 'category_city', category: 'Idraulici', city: 'Roma' },
  { label: 'Pasticcerie Bologna', mode: 'category_city', category: 'Pasticcerie', city: 'Bologna' },
];

export const PlacesSearchBar: React.FC<PlacesSearchBarProps> = ({
  onSearchSuccess,
  isLoading,
  setIsLoading,
  onFallbackLoadSample,
}) => {
  const [searchMode, setSearchMode] = useState<SearchMode>('direct');
  const [directQuery, setDirectQuery] = useState('Grotto Morchino Lugano');
  const [category, setCategory] = useState('Ristoranti');
  const [city, setCity] = useState('Lugano');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [missingKeyError, setMissingKeyError] = useState(false);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);
  const [recentResults, setRecentResults] = useState<RawBusinessInput[]>([]);
  const [showQuickPreview, setShowQuickPreview] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    let queryParam = '';
    let categoryParam = '';
    let cityParam = '';
    let displayLabel = '';

    if (searchMode === 'direct') {
      const trimmedQuery = directQuery.trim();
      if (!trimmedQuery) {
        setErrorMessage('Inserisci il nome dell\'attività o la zona da cercare (es. "Grotto Morchino Lugano").');
        return;
      }
      queryParam = trimmedQuery;
      displayLabel = trimmedQuery;
    } else {
      const trimmedCat = category.trim();
      const trimmedCity = city.trim();

      if (!trimmedCat && !trimmedCity) {
        setErrorMessage('Inserisci una categoria o una località per avviare la ricerca.');
        return;
      }
      categoryParam = trimmedCat;
      cityParam = trimmedCity;
      displayLabel = trimmedCat && trimmedCity ? `${trimmedCat} a ${trimmedCity}` : trimmedCat || trimmedCity;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setMissingKeyError(false);
    setSuccessInfo(null);

    try {
      const params = new URLSearchParams();
      if (searchMode === 'direct') {
        params.set('query', queryParam);
      } else {
        if (categoryParam) params.set('category', categoryParam);
        if (cityParam) params.set('city', cityParam);
      }

      const url = `/api/search?${params.toString()}`;
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
        setErrorMessage(`Nessuna attività trovata per "${displayLabel}". Prova a modificare la ricerca.`);
        setRecentResults([]);
      } else {
        const withWeb = placesList.filter((p) => Boolean(p.website)).length;
        const withoutWeb = placesList.length - withWeb;
        setSuccessInfo(
          `Trovate ${placesList.length} attività per "${displayLabel}" (${withWeb} con sito rilevato, ${withoutWeb} senza sito). Tutti i dati e i link Maps sono disponibili nella tabella sottostante.`
        );
        setRecentResults(placesList);
        setShowQuickPreview(true);

        if (searchMode === 'direct') {
          onSearchSuccess(placesList, displayLabel, 'Ricerca Libera');
        } else {
          onSearchSuccess(placesList, categoryParam || 'Attività', cityParam || 'Zona');
        }
      }
    } catch (err: any) {
      console.error('Search error:', err);
      setErrorMessage(err.message || 'Errore durante la ricerca dei lead su Google Places.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickSuggestion = (item: SuggestionItem) => {
    setSearchMode(item.mode);
    if (item.mode === 'direct' && item.query) {
      setDirectQuery(item.query);
    } else if (item.mode === 'category_city') {
      if (item.category) setCategory(item.category);
      if (item.city) setCity(item.city);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-md relative overflow-hidden">
      {/* Background glow accent */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-4">
        {/* Top Header & Fast Suggestions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-400">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <span>Ricerca Lead Live su Google Places</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Places API (New)
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Interroga Google Places Text Search con rilevamento accurato del sito web e link diretto Maps
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className="hidden sm:inline">Suggeriti:</span>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_SUGGESTIONS.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handleQuickSuggestion(item)}
                  className="px-2 py-1 rounded-md text-[11px] bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/60 transition-colors cursor-pointer"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Search Mode Toggle Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-950/80 border border-slate-800 rounded-xl w-fit">
          <button
            type="button"
            onClick={() => setSearchMode('direct')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
              searchMode === 'direct'
                ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Ricerca per Nome o Zona (Query Libera)</span>
          </button>
          <button
            type="button"
            onClick={() => setSearchMode('category_city')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
              searchMode === 'category_city'
                ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filtro Categoria & Città</span>
          </button>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row items-stretch gap-3">
          {searchMode === 'direct' ? (
            /* Mode 1: Direct name or free query */
            <div className="flex-1 relative">
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Nome Attività o Ricerca Libera
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={directQuery}
                  onChange={(e) => setDirectQuery(e.target.value)}
                  placeholder="es. Grotto Morchino Lugano, Ristorante Da Mario Roma, Hotel Splendide..."
                  disabled={isLoading}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all disabled:opacity-50"
                />
              </div>
            </div>
          ) : (
            /* Mode 2: Category and City separate */
            <>
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
                    placeholder="es. Lugano, Milano, Bologna, Roma..."
                    disabled={isLoading}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all disabled:opacity-50"
                  />
                </div>
              </div>
            </>
          )}

          {/* Submit Button */}
          <div className="md:self-end">
            <button
              type="submit"
              disabled={
                isLoading ||
                (searchMode === 'direct' ? !directQuery.trim() : !category.trim() && !city.trim())
              }
              className="w-full md:w-auto px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-medium text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer h-[42px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Ricerca Live...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>{searchMode === 'direct' ? 'Cerca Attività' : 'Scansiona Zona'}</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Success alert */}
        {successInfo && (
          <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between gap-2.5 animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span className="font-medium">{successInfo}</span>
            </div>
            {recentResults.length > 0 && (
              <button
                type="button"
                onClick={() => setShowQuickPreview(!showQuickPreview)}
                className="text-[11px] underline text-emerald-400 hover:text-emerald-200 cursor-pointer font-medium whitespace-nowrap ml-2"
              >
                {showQuickPreview ? 'Nascondi anteprima' : 'Mostra anteprima rapida'}
              </button>
            )}
          </div>
        )}

        {/* Quick Results Preview Bar (shows detected websites and 1-click Google Maps link) */}
        {showQuickPreview && recentResults.length > 0 && (
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold uppercase tracking-wider px-1">
              <span>Riepilogo Immediato Riscontri ({recentResults.length})</span>
              <span>Sito Web & Link Google Maps Diretto</span>
            </div>
            <div className="max-h-52 overflow-y-auto divide-y divide-slate-800/60 pr-1">
              {recentResults.map((place, idx) => (
                <div
                  key={`${place.business_name}-${idx}`}
                  className="py-2 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-semibold text-slate-200 truncate block">
                      {place.business_name}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {place.category} · {place.city} {place.phone ? `· ${place.phone}` : ''}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Website Link */}
                    {place.website ? (
                      <a
                        href={place.website}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-500/30 text-xs transition-colors"
                        title={place.website}
                      >
                        <Globe className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="truncate max-w-[130px]">
                          {place.website.replace(/^https?:\/\/(www\.)?/, '')}
                        </span>
                        <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                      </a>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-amber-950/40 text-amber-300/90 border border-amber-500/20">
                        <AlertCircle className="w-3 h-3 text-amber-400" />
                        <span>Nessun sito</span>
                      </span>
                    )}

                    {/* Google Maps Uri Quick Link */}
                    {(place.googleMapsUri || place.google_maps_url) ? (
                      <a
                        href={place.googleMapsUri || place.google_maps_url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-rose-400 hover:text-rose-300 border border-slate-700 transition-colors text-xs font-medium"
                        title="Apri scheda Google Maps con 1 click"
                      >
                        <MapPin className="w-3.5 h-3.5 text-rose-400" />
                        <span className="hidden sm:inline">Maps</span>
                        <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                      </a>
                    ) : (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          `${place.business_name} ${place.city}`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 border border-slate-700 transition-colors text-xs"
                        title="Cerca su Google Maps"
                      >
                        <MapPin className="w-3.5 h-3.5 text-rose-400" />
                        <span className="hidden sm:inline">Cerca Maps</span>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error alert with Missing Key troubleshooting guide */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-500/30 text-red-200 text-xs space-y-2 animate-in fade-in">
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
                          className="px-2.5 py-1 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 rounded text-[11px] font-medium transition-colors cursor-pointer"
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
