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

  const rawTrimmed = phone.trim();

  // Check if international prefix (+) is explicitly provided
  const hasPlusPrefix = rawTrimmed.startsWith('+');
  const hasDoubleZeroPrefix = rawTrimmed.startsWith('00');

  // Remove all non-digit characters
  let digits = rawTrimmed.replace(/[^\d]/g, '');

  if (!digits || digits.length < 6) return null;

  // If starts with 00, remove the first two zeros
  if (hasDoubleZeroPrefix || digits.startsWith('00')) {
    digits = digits.slice(2);
    // Already has country code
    return digits.length >= 8 && digits.length <= 16 ? digits : null;
  }

  // If originally had +, the country code is already included
  if (hasPlusPrefix) {
    return digits.length >= 8 && digits.length <= 16 ? digits : null;
  }

  // Detect common Swiss numbers (e.g. 091, 076, 077, 078, 079, 044, 022)
  if (/^0(91|76|77|78|79|44|22|21|31|61)\d{6,8}$/.test(digits)) {
    // Strip leading 0 and prepend Swiss country code 41
    return `41${digits.slice(1)}`;
  }

  // If already starts with 39 (Italy) and is standard length
  if (digits.startsWith('39') && digits.length >= 11 && digits.length <= 13) {
    return digits;
  }

  // If starts with 41 (Switzerland) and is standard length
  if (digits.startsWith('41') && digits.length >= 10 && digits.length <= 12) {
    return digits;
  }

  // Otherwise, default fallback: if it doesn't have a recognized country prefix, prepend defaultCountryCode
  if (!digits.startsWith(defaultCountryCode)) {
    // For national numbers starting with 0 or 3
    digits = `${defaultCountryCode}${digits}`;
  }

  if (digits.length < 10 || digits.length > 16) {
    return null;
  }

  return digits;
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
