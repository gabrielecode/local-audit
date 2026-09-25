import { AuditResult } from '../types/audit';

/**
 * Pulisce e formatta un numero di telefono per l'utilizzo con l'API wa.me
 * Requisiti:
 * 1. Rimuove tutti i caratteri non numerici (spazi, trattini, parentesi, punti, segno +).
 * 2. Se inizia con '00', rimuove gli zeri iniziali (es. 0039 -> 39).
 * 3. Se non ha il prefisso internazionale italiano (+39 o 0039), aggiunge "39".
 * 4. Valida la lunghezza minima e massima.
 */
export function formatWhatsAppNumber(
  phone?: string | null,
  defaultCountryCode = '39'
): string | null {
  if (!phone || typeof phone !== 'string') return null;

  // 1. Rimuovi tutti i caratteri non numerici tranne eventuali cifre
  let cleaned = phone.replace(/[^\d]/g, '');

  if (!cleaned || cleaned.length < 6) return null;

  // 2. Se inizia con 00, rimuovi i primi due zeri
  if (cleaned.startsWith('00')) {
    cleaned = cleaned.slice(2);
  }

  // 3. Se non inizia con il prefisso internazionale di default (es. 39 per Italia)
  // Nota: per l'Italia i numeri nazionali senza prefisso iniziano per 0 (fissi) o 3 (cellulari).
  // Se già inizia per 39 e la lunghezza complessiva è congrua (almeno 11 cifre, es. 39 340 1234567 o 39 02 1234567), va bene così.
  // Se non inizia per 39, aggiungi 39.
  if (!cleaned.startsWith(defaultCountryCode)) {
    cleaned = `${defaultCountryCode}${cleaned}`;
  }

  // 4. Validazione: un numero italiano con prefisso 39 è tipicamente tra 11 e 13 cifre
  if (cleaned.length < 10 || cleaned.length > 15) {
    return null;
  }

  return cleaned;
}

/**
 * Genera il messaggio personalizzato per WhatsApp (AI Hook) secondo i 3 casi d'uso
 */
export function generateWhatsAppPitch(
  lead: {
    business_name: string;
    raw: {
      category?: string | null;
      city?: string | null;
      website?: string | null;
      pagespeed_mobile_score?: number | null;
      ssl_active?: boolean | null;
      reviews_count?: number | null;
    };
    tags: string[];
  },
  senderName: string = 'il team di LocalAudit'
): string {
  const businessName = lead.business_name || 'Titolare';
  const city = lead.raw.city || 'zona';
  const author = senderName.trim() || 'il team di LocalAudit';

  // Caso 1: Nessun Sito Web (NO_WEBSITE)
  if (lead.tags.includes('NO_WEBSITE')) {
    return `Buongiorno ${businessName}, ho visto la vostra scheda su Google Maps e stavo cercando il vostro menù/catalogo online, ma ho notato che non avete ancora un sito web collegato. Volevo chiedervi se fosse nei vostri piani realizzarne uno vetrina per ricevere contatti diretti. Un saluto cordiale, ${author}`;
  }

  // Caso 2: Sito Web Lento o Non Ottimizzato per Smartphone (WEBSITE_CRITICAL)
  if (lead.tags.includes('WEBSITE_CRITICAL')) {
    return `Buongiorno ${businessName}, visitando il vostro sito web da smartphone ho notato che impiega diversi secondi a caricare i contenuti. Molti potenziali clienti rischiano di abbandonare la pagina prima di chiamarvi. Se vi fa piacere, ho preparato un rapido report gratuito con i 3 punti tecnici da sistemare. Buona giornata, ${author}`;
  }

  // Caso 3: Profilo Google Business Trascurato o con Poche Recensioni (GBP_LOW_REVIEWS, GBP_POOR_RATING, GBP_UNCLAIMED)
  if (
    lead.tags.includes('GBP_LOW_REVIEWS') ||
    lead.tags.includes('GBP_POOR_RATING') ||
    lead.tags.includes('GBP_UNCLAIMED')
  ) {
    return `Buongiorno ${businessName}, ho notato la vostra attività cercando su Google a ${city}. Avete un ottimo servizio, ma pochissime recensioni rispetto ai concorrenti in zona, e questo penalizza la vostra posizione nelle ricerche locali. Posso inviarvi una breve guida su come aumentare le recensioni a costo zero? Saluti, ${author}`;
  }

  // Default fallback cortese e orientato al valore
  return `Buongiorno ${businessName}, ho notato la vostra scheda su Google Maps a ${city}. Volevo complimentarmi per la vostra presenza locale e chiedervi se state valutando nuovi canali digitali per acquisire clienti diretti di zona. Un saluto cordiale, ${author}`;
}

/**
 * Costruisce l'URL completo wa.me
 */
export function buildWhatsAppUrl(
  phone?: string | null,
  message?: string,
  defaultCountryCode = '39'
): string | null {
  const cleanPhone = formatWhatsAppNumber(phone, defaultCountryCode);
  if (!cleanPhone) return null;

  const textParam = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${cleanPhone}${textParam}`;
}
