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

  try {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;

    if (!apiKey || apiKey.trim() === '' || apiKey === 'la_tua_google_places_api_key') {
      return res.status(500).json({
        error: 'Chiave GOOGLE_PLACES_API_KEY non configurata nelle variabili d\'ambiente di Vercel (o nel file .env). Aggiungi la tua chiave API Google Places per abilitare la ricerca.',
        code: 'MISSING_API_KEY',
      });
    }

    // Support both GET (query parameters) and POST (request body)
    const category = (req.query.category || req.body?.category || '') as string;
    const city = (req.query.city || req.body?.city || '') as string;
    let query = (req.query.query || req.body?.query || '') as string;

    if (!query) {
      if (category && city) {
        query = `${category} a ${city}`;
      } else if (category) {
        query = category;
      } else if (city) {
        query = `Attività commerciali a ${city}`;
      }
    }

    if (!query || !query.trim()) {
      return res.status(400).json({
        error: 'Parametri mancanti: indicare "category" e "city" oppure "query" (es. "Ristoranti a Bologna").',
      });
    }

    const endpoint = 'https://places.googleapis.com/v1/places:searchText';
    const fieldMask = [
      'places.displayName',
      'places.formattedAddress',
      'places.nationalPhoneNumber',
      'places.websiteUri',
      'places.rating',
      'places.userRatingCount',
      'places.regularOpeningHours',
      'places.photos'
    ].join(',');

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey.trim(),
        'X-Goog-FieldMask': fieldMask,
      },
      body: JSON.stringify({
        textQuery: query.trim(),
        languageCode: 'it',
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      let parsedError: any = null;
      try {
        parsedError = JSON.parse(errText);
      } catch {
        // ignore
      }

      const errorMessage =
        parsedError?.error?.message || errText || 'Errore restituito da Google Places API';
      console.error('Google Places API Error:', response.status, errorMessage);

      if (response.status === 403 || response.status === 401) {
        return res.status(500).json({
          error: `Autenticazione Google Places API fallita (${response.status}): ${errorMessage}. Verifica che la chiave GOOGLE_PLACES_API_KEY sia corretta e che "Places API (New)" sia abilitata in Google Cloud Console.`,
          code: 'API_AUTH_ERROR',
        });
      }

      if (response.status === 429) {
        return res.status(500).json({
          error: 'Quota Google Places API esaurita o limite di frequenza superato. Riprovare tra qualche istante.',
          code: 'QUOTA_EXCEEDED',
        });
      }

      return res.status(500).json({
        error: `Errore chiamata Google Places API (${response.status}): ${errorMessage}`,
        code: 'API_ERROR',
        details: parsedError,
      });
    }

    const data = await response.json();
    const places = data.places || [];

    const businesses: RawBusinessInput[] = places.map((place: any) => {
      const website = place.websiteUri || null;
      const sslActive = website ? website.toLowerCase().startsWith('https://') : false;
      const detectedCity = city.trim() || extractCityFromAddress(place.formattedAddress || '') || 'Italia';
      const detectedCategory = category.trim() || 'Attività locale';

      return {
        business_name: place.displayName?.text || 'Attività commerciale',
        category: detectedCategory,
        city: detectedCity,
        phone: place.nationalPhoneNumber || null,
        website: website,
        google_rating: typeof place.rating === 'number' ? place.rating : 0,
        reviews_count: typeof place.userRatingCount === 'number' ? place.userRatingCount : 0,
        unclaimed_profile: false,
        pagespeed_mobile_score: null,
        ssl_active: sslActive,
      };
    });

    return res.status(200).json(businesses);
  } catch (error: any) {
    console.error('Search Places Internal Error:', error);
    return res.status(500).json({
      error: `Errore interno durante la ricerca su Google Places: ${error.message || 'Errore del server'}`,
      code: 'INTERNAL_SERVER_ERROR',
    });
  }
}

function extractCityFromAddress(address: string): string {
  try {
    const parts = address.split(',').map((p) => p.trim());
    if (parts.length >= 2) {
      for (let i = parts.length - 1; i >= 0; i--) {
        const part = parts[i];
        if (part.toLowerCase() === 'italia') continue;
        const capMatch = part.match(/\d{5}\s+([A-Za-zÀ-ÿ\s]+)/);
        if (capMatch && capMatch[1]) {
          return capMatch[1].replace(/\s+[A-Z]{2}$/, '').trim();
        }
        return part;
      }
    }
  } catch {
    // fallback
  }
  return 'Italia';
}
