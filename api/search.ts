import type { Request, Response } from 'express';

export interface RawBusinessInput {
  business_name: string;
  category: string;
  city: string;
  phone?: string | null;
  website?: string | null;
  google_rating?: number | null;
  reviews_count?: number | null;
  unclaimed_profile?: boolean | null;
  pagespeed_mobile_score?: number | null;
  ssl_active?: boolean | null;
  google_maps_url?: string | null;
  googleMapsUri?: string | null;
}

export default async function handler(req: Request, res: Response) {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  res.setHeader('Access-Control-Allow-Origin', '*');

  const rawQuery = ((req.query?.query || req.body?.query || '') as string).trim();
  const rawCategory = ((req.query?.category || req.body?.category || '') as string).trim();
  const rawCity = ((req.query?.city || req.body?.city || '') as string).trim();
  const apiKey = (process.env.GOOGLE_PLACES_API_KEY || '').trim();

  if (!apiKey || apiKey === 'la_tua_google_places_api_key') {
    return res.status(500).json({
      error: 'GOOGLE_PLACES_API_KEY non configurata nelle variabili d\'ambiente o nel file .env',
      code: 'MISSING_API_KEY',
    });
  }

  // 1. Flessibilità della query:
  // - Se sono forniti sia categoria che città, componi la query in modo naturale: `${category} ${city}`
  // - Se l'utente inserisce solo il nome o una query libera, usa direttamente quella stringa
  let textQuery = '';
  if (rawCategory && rawCity) {
    textQuery = `${rawCategory} ${rawCity}`;
  } else if (rawQuery) {
    textQuery = rawQuery;
  } else if (rawCategory) {
    textQuery = rawCategory;
  } else if (rawCity) {
    textQuery = rawCity;
  }

  if (!textQuery) {
    return res.status(400).json({
      error: 'Parametro di ricerca obbligatorio (es. query="Grotto Morchino Lugano" oppure category=Ristoranti&city=Lugano)',
    });
  }

  try {
    const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask':
          'places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.googleMapsUri,places.primaryTypeDisplayName,places.types,places.addressComponents',
      },
      body: JSON.stringify({
        textQuery,
        languageCode: 'it',
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('Google Places API Error:', response.status, data.error?.message);
      return res.status(response.status).json({
        error: data.error?.message || 'Errore Google Places API',
      });
    }

    const places: RawBusinessInput[] = (data.places || []).map((p: any) => {
      // Log di console del server per verificare cosa restituisce Google in tempo reale
      console.log('Place trovato:', p.displayName?.text, 'Sito:', p.websiteUri);

      // Normalizzazione campo website: se websiteUri è presente, mantienilo con protocollo (https://...). Se vuoto, lascia null.
      let normalizedWebsite: string | null = null;
      if (p.websiteUri && typeof p.websiteUri === 'string') {
        const trimmedWeb = p.websiteUri.trim();
        if (
          trimmedWeb &&
          trimmedWeb.toLowerCase() !== 'null' &&
          trimmedWeb.toLowerCase() !== 'undefined'
        ) {
          if (/^https?:\/\//i.test(trimmedWeb)) {
            normalizedWebsite = trimmedWeb;
          } else {
            normalizedWebsite = `https://${trimmedWeb}`;
          }
        }
      }

      // Link diretto scheda Google Maps
      const googleMapsUri: string | null = p.googleMapsUri ? String(p.googleMapsUri).trim() : null;

      // Extract accurate category
      const resolvedCategory =
        p.primaryTypeDisplayName?.text ||
        (Array.isArray(p.types) && p.types.length > 0
          ? p.types[0].replace(/_/g, ' ')
          : rawCategory || 'Attività commerciale');

      // Extract accurate city / locality from address components or formattedAddress
      let resolvedCity = rawCity;
      if (Array.isArray(p.addressComponents)) {
        const localityComp = p.addressComponents.find((c: any) =>
          c.types?.includes('locality') ||
          c.types?.includes('postal_town') ||
          c.types?.includes('administrative_area_level_3')
        );
        if (localityComp?.longText) {
          resolvedCity = localityComp.longText;
        }
      }

      // If city still empty, extract from formattedAddress
      if (!resolvedCity && p.formattedAddress) {
        const parts = p.formattedAddress.split(',');
        if (parts.length >= 2) {
          resolvedCity = parts[parts.length - 2].trim().replace(/^\d{4,5}\s+/, '');
        }
      }

      // Accurate phone preference: international number with country code (+41, +39, etc.)
      const preferredPhone = p.internationalPhoneNumber || p.nationalPhoneNumber || null;

      // Real SSL estimation: if URI explicitly has https, true. If http or no protocol, mark null (pending live verification), NEVER false
      const initialSslActive = normalizedWebsite ? (normalizedWebsite.startsWith('https://') ? true : null) : null;

      return {
        business_name: p.displayName?.text || 'Attività senza nome',
        category: resolvedCategory,
        city: resolvedCity || 'Zona locale',
        phone: preferredPhone,
        website: normalizedWebsite,
        google_rating: typeof p.rating === 'number' ? p.rating : 0,
        reviews_count: typeof p.userRatingCount === 'number' ? p.userRatingCount : 0,
        unclaimed_profile: false,
        pagespeed_mobile_score: null, // Verificato accuratamente su richiesta o asincronamente
        ssl_active: initialSslActive,
        google_maps_url: googleMapsUri,
        googleMapsUri: googleMapsUri,
      };
    });

    return res.status(200).json({ results: places });
  } catch (error: any) {
    console.error('Search Places Internal Error:', error);
    return res.status(500).json({ error: error.message || 'Errore interno del server' });
  }
}
