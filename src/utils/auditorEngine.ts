import { RawBusinessInput, AuditResult, OpportunityTag, LeadPriority } from '../types/audit';

const SOCIAL_DOMAINS = [
  'facebook.com',
  'fb.me',
  'instagram.com',
  'tiktok.com',
  'linkedin.com',
  'twitter.com',
  'x.com',
  'wa.me',
  'api.whatsapp.com',
];

export function normalizeWebsiteUrl(url?: string | null): string | null {
  if (!url || typeof url !== 'string') return null;
  const clean = url.trim();
  if (
    !clean ||
    clean.toLowerCase() === 'null' ||
    clean.toLowerCase() === 'undefined' ||
    clean.toLowerCase() === 'none' ||
    clean.toLowerCase() === 'n/a' ||
    clean.toLowerCase() === 'assente'
  ) {
    return null;
  }
  if (!/^https?:\/\//i.test(clean)) {
    return `https://${clean}`;
  }
  return clean;
}

export function isSocialOrEmptyWebsite(url?: string | null): boolean {
  if (!url || typeof url !== 'string' || url.trim() === '') return true;
  const cleanUrl = url.trim().toLowerCase();
  if (
    cleanUrl === 'null' ||
    cleanUrl === 'undefined' ||
    cleanUrl === 'none' ||
    cleanUrl === 'n/a' ||
    cleanUrl === 'assente'
  ) {
    return true;
  }
  return SOCIAL_DOMAINS.some((domain) => cleanUrl.includes(domain));
}

export function auditSingleBusiness(input: RawBusinessInput): AuditResult {
  const tags: OpportunityTag[] = [];
  const main_problems: string[] = [];
  const suggested_services: string[] = [];

  const businessName = (input.business_name || 'Attività Locale').trim();
  const category = (input.category || 'Attività locale').trim();
  const city = (input.city || 'zona').trim();
  const rawWebsite = normalizeWebsiteUrl(input.website) || input.website?.trim() || null;
  const reviewsCount = typeof input.reviews_count === 'number' ? input.reviews_count : 0;
  const rating = typeof input.google_rating === 'number' ? input.google_rating : 0;
  const pagespeed = typeof input.pagespeed_mobile_score === 'number' ? input.pagespeed_mobile_score : null;
  const sslActive = typeof input.ssl_active === 'boolean' ? input.ssl_active : true;
  const unclaimed = Boolean(input.unclaimed_profile);

  // 1. Valutazione Presenza Web
  const hasNoWebsite = isSocialOrEmptyWebsite(rawWebsite);
  let isWebsiteCritical = false;

  if (hasNoWebsite) {
    tags.push('NO_WEBSITE');
    if (rawWebsite && SOCIAL_DOMAINS.some((d) => rawWebsite.toLowerCase().includes(d))) {
      main_problems.push(
        `L'attività utilizza una pagina social (${rawWebsite}) anziché un sito proprietario, perdendo posizionamento organico su Google e conversioni dirette.`
      );
    } else {
      main_problems.push(
        'Nessun sito web indicato sul profilo Google Business: dispersione di oltre il 40% delle ricerche locali ad alta intenzione di acquisto.'
      );
    }
    suggested_services.push('Realizzazione sito web vetrina mobile-first ad alte prestazioni');
    suggested_services.push('Setup tracciamento conversioni e pulsanti di chiamata/prenotazione rapida');
  } else {
    // Has a website
    const hasSlowMobile = pagespeed !== null && pagespeed < 50;
    const hasNoSsl = sslActive === false;

    if (hasSlowMobile || hasNoSsl) {
      tags.push('WEBSITE_CRITICAL');
      isWebsiteCritical = true;

      if (hasSlowMobile && pagespeed !== null) {
        main_problems.push(
          `Punteggio PageSpeed Mobile critico (${pagespeed}/100): il caricamento lento penalizza il ranking su Google e causa l'abbandono degli utenti da smartphone.`
        );
      }
      if (hasNoSsl) {
        main_problems.push(
          "Certificato SSL assente o non valido: i browser mostrano l'avviso di sicurezza \"Non Sicuro\", distruggendo la fiducia dei clienti."
        );
      }

      suggested_services.push('Rifacimento o velocizzazione sito web (Core Web Vitals > 85)');
      if (hasNoSsl) {
        suggested_services.push('Installazione certificato SSL e migrazione protocollo sicuro HTTPS');
      }
    }
  }

  // 2. Valutazione Profilo Google Business
  if (unclaimed) {
    tags.push('GBP_UNCLAIMED');
    main_problems.push(
      'Profilo Google Business non rivendicato o verificato: rischio di modifiche arbitrarie da concorrenti e mancato controllo delle informazioni ufficiali.'
    );
    suggested_services.push('Rivendicazione immediata, verifica e ottimizzazione scheda Google Business Profile');
  }

  if (reviewsCount < 15) {
    tags.push('GBP_LOW_REVIEWS');
    main_problems.push(
      `Volume di recensioni critico (${reviewsCount} recensioni): scarsa riprova sociale rispetto ai competitor locali, che riduce la visibilità nel Local Pack di Google.`
    );
    suggested_services.push('Sistema automatizzato di raccolta recensioni positive (WhatsApp/QR Code)');
  }

  if (rating > 0 && rating < 4.0) {
    tags.push('GBP_POOR_RATING');
    main_problems.push(
      `Punteggio medio di gradimento basso (${rating.toFixed(1)}/5): impatto fortemente negativo sul tasso di conversione delle chiamate e delle visite.`
    );
    suggested_services.push('Reputation Management e strategia di risposta professionale alle recensioni');
  }

  // 3. Calcolo Lead Score Complessivo & Priorità
  // Alta Opportunità (Score 80-100):
  // - Nessun sito web OPPURE profilo non rivendicato OPPURE sito gravemente lento con buon volume di clienti (reviews >= 15 && pagespeed < 50).
  // Media Opportunità (Score 50-79):
  // - Sito presente ma da rifare (WEBSITE_CRITICAL), o profilo GBP con poche recensioni / rating basso.
  // Bassa Opportunità (Score < 50):
  // - Sito veloce, profilo curato con oltre 50 recensioni e rating > 4.5.

  let leadScore = 40;
  let leadPriority: LeadPriority = 'BASSA';

  const isHighTrafficSlowSite = isWebsiteCritical && reviewsCount >= 15 && pagespeed !== null && pagespeed < 50;

  if (hasNoWebsite || unclaimed || isHighTrafficSlowSite) {
    leadPriority = 'ALTA';
    let baseScore = 80;
    if (hasNoWebsite) baseScore += 10;
    if (unclaimed) baseScore += 8;
    if (reviewsCount < 15) baseScore += 2;
    leadScore = Math.min(100, baseScore);
  } else if (isWebsiteCritical || tags.includes('GBP_LOW_REVIEWS') || tags.includes('GBP_POOR_RATING')) {
    leadPriority = 'MEDIA';
    let baseScore = 55;
    if (isWebsiteCritical) baseScore += 15;
    if (tags.includes('GBP_LOW_REVIEWS')) baseScore += 6;
    if (tags.includes('GBP_POOR_RATING')) baseScore += 4;
    leadScore = Math.min(79, baseScore);
  } else {
    // Profilo ben posizionato
    leadPriority = 'BASSA';
    if (reviewsCount > 50 && rating >= 4.5 && !isWebsiteCritical && !hasNoWebsite) {
      leadScore = 25;
    } else {
      leadScore = 42;
    }
  }

  // Se nessun problema rilevato, indichiamo profilo sano
  if (main_problems.length === 0) {
    if (reviewsCount >= 30 && rating >= 4.3) {
      main_problems.push(
        `Presenza digitale solida e ben curata: ottima reputazione su Google (${rating.toFixed(1)}/5 con ${reviewsCount} recensioni) e sito web attivo.`
      );
    } else {
      main_problems.push(
        'Presenza digitale in buono stato generale; possibili margini di crescita su campagne locali sponsorizzate.'
      );
    }
    suggested_services.push('Campagne Google Ads Local o potenziamento SEO locale continuativo');
  }

  // 4. Generazione sales_pitch_hook (max 2 frasi, orientato al valore e pragmatico)
  let sales_pitch_hook = '';

  if (hasNoWebsite) {
    if (rawWebsite && SOCIAL_DOMAINS.some((d) => rawWebsite.toLowerCase().includes(d))) {
      sales_pitch_hook = `Buongiorno ${businessName}, ho notato che la vostra scheda Google rimanda solo a un profilo social, facendo perdere molte richieste dirette da chi cerca un ${category} a ${city}. Con un sito vetrina rapido possiamo raddoppiare i contatti senza costi pubblicitari aggiuntivi.`;
    } else {
      sales_pitch_hook = `Buongiorno ${businessName}, molti clienti cercano un ${category} a ${city} direttamente su Google ma non trovano una vostra pagina web per prenotare o consultare i servizi. Vi rubiamo 2 minuti per mostrarvi quanti contatti state lasciando ai vostri concorrenti?`;
    }
  } else if (unclaimed) {
    sales_pitch_hook = `Buongiorno ${businessName}, abbiamo rilevato che la vostra scheda Google Business a ${city} non è ancora protetta e verificata, con il rischio che chiunque possa modificarne contatti e orari. Possiamo aiutarvi a blindarla e ottimizzarla in giornata per salire nelle prime posizioni.`;
  } else if (isWebsiteCritical) {
    if (pagespeed !== null && pagespeed < 50) {
      sales_pitch_hook = `Buongiorno ${businessName}, analizzando la vostra presenza a ${city} abbiamo riscontrato che il vostro sito impiega troppo tempo a caricare da smartphone (${pagespeed}/100), spingendo oltre il 50% dei visitatori a chiudere la pagina. Possiamo inviarvi un breve report gratuito con le modifiche tecniche per non perdere più clienti?`;
    } else {
      sales_pitch_hook = `Buongiorno ${businessName}, abbiamo notato che il vostro sito web segnala un avviso di connessione non protetta ai visitatori da ${city}, riducendo la fiducia di chi vuole contattarvi. Bastano poche ore per metterlo in sicurezza e renderlo conforme alle linee guida di Google.`;
    }
  } else if (tags.includes('GBP_LOW_REVIEWS')) {
    sales_pitch_hook = `Buongiorno ${businessName}, lavorate con ottima qualità a ${city} ma con sole ${reviewsCount} recensioni su Google i competitor con più feedback vi superano nelle ricerche locali. Con il nostro sistema automatizzato possiamo portarvi oltre 40 recensioni a 5 stelle nei prossimi 60 giorni.`;
  } else if (tags.includes('GBP_POOR_RATING')) {
    sales_pitch_hook = `Buongiorno ${businessName}, abbiamo notato che la media delle vostre recensioni a ${city} è di ${rating.toFixed(1)}, un valore che frena molti nuovi clienti dal chiamarvi. Abbiamo una strategia collaudata per valorizzare le esperienze positive e ripristinare un punteggio rassicurante.`;
  } else {
    sales_pitch_hook = `Buongiorno ${businessName}, complimenti per la forte reputazione a ${city} (${rating > 0 ? rating.toFixed(1) : '5.0'} con oltre ${reviewsCount} recensioni): avendo già un'ottima base digitale, possiamo aiutarvi a consolidare la leadership di zona attraverso campagne mirate su Google Local.`;
  }

  return {
    business_name: businessName,
    lead_priority: leadPriority,
    lead_score: leadScore,
    tags,
    main_problems,
    suggested_services,
    sales_pitch_hook,
    raw: input,
    pipeline_status: 'NUOVO',
  };
}

export function auditBusinessBatch(inputs: RawBusinessInput[]): AuditResult[] {
  if (!Array.isArray(inputs)) return [];
  return inputs.map((item) => auditSingleBusiness(item));
}
