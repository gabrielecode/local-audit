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

  const category = (req.query?.category || req.body?.category || '') as string;
  const city = (req.query?.city || req.body?.city || '') as string;
  const apiKey = (process.env.GOOGLE_PLACES_API_KEY || '').trim();

  if (!apiKey || apiKey === 'la_tua_google_places_api_key') {
    return res.status(500).json({
      error: 'GOOGLE_PLACES_API_KEY non configurata nelle variabili d\'ambiente di Vercel o nel file .env',
      code: 'MISSING_API_KEY',
    });
  }

  if (!category || !city) {
    return res.status(400).json({
      error: 'Parametri category e city obbligatori (es. category=Ristoranti&city=Bologna)',
    });
  }

  try {
    const textQuery = `${category} a ${city}`.trim();
    const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask':
          'places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.regularOpeningHours',
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
        error: data.error?.message || 'Errore Google Places',
      });
    }

    const places: RawBusinessInput[] = (data.places || []).map((p: any) => {
      const websiteUri = p.websiteUri || null;
      return {
        business_name: p.displayName?.text || 'Attività senza nome',
        category: String(category),
        city: String(city),
        phone: p.nationalPhoneNumber || null,
        website: websiteUri,
        google_rating: typeof p.rating === 'number' ? p.rating : 0,
        reviews_count: typeof p.userRatingCount === 'number' ? p.userRatingCount : 0,
        unclaimed_profile: false,
        pagespeed_mobile_score: null, // Verificato su richiesta o asincronamente
        ssl_active: websiteUri ? websiteUri.startsWith('https://') : false,
      };
    });

    return res.status(200).json({ results: places });
  } catch (error: any) {
    console.error('Search Places Internal Error:', error);
    return res.status(500).json({ error: error.message || 'Errore interno del server' });
  }
}
