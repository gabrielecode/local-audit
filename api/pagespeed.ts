import type { Request, Response } from 'express';

export default async function handler(req: Request, res: Response) {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  res.setHeader('Access-Control-Allow-Origin', '*');

  const rawUrl = (req.query?.url || req.body?.url) as string | undefined;
  // Optional: PageSpeed API works with Google Cloud API key, or free tier without key
  const apiKey = (process.env.GOOGLE_PLACES_API_KEY || '').trim();

  if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
    return res.status(400).json({ error: 'Parametro url obbligatorio' });
  }

  try {
    let cleanUrl = rawUrl.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `https://${cleanUrl}`;
    }

    const apiUrl = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
    apiUrl.searchParams.set('url', cleanUrl);
    apiUrl.searchParams.set('strategy', 'mobile');
    apiUrl.searchParams.set('category', 'PERFORMANCE');
    apiUrl.searchParams.set('category', 'SEO');

    // Only append key if it's a real configured key (not placeholder)
    if (apiKey && apiKey !== 'la_tua_google_places_api_key') {
      apiUrl.searchParams.set('key', apiKey);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

    const response = await fetch(apiUrl.toString(), {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      }
    });
    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok) {
      console.warn('PageSpeed API returned non-OK status:', response.status, data.error?.message);
      return res.status(200).json({
        score: 45,
        seo_score: 60,
        is_slow: true,
        error: data.error?.message || 'Audit fallito, sito non raggiungibile o protetto da firewall',
      });
    }

    const perfScore = Math.round(
      (data.lighthouseResult?.categories?.performance?.score ?? 0.45) * 100
    );
    const seoScore = Math.round(
      (data.lighthouseResult?.categories?.seo?.score ?? 0.60) * 100
    );

    return res.status(200).json({
      score: perfScore,
      seo_score: seoScore,
      is_slow: perfScore < 50,
      url: cleanUrl,
    });
  } catch (error: any) {
    console.error('PageSpeed Audit Error:', error);
    // Graceful fallback for unreachable / timeout sites
    return res.status(200).json({
      score: 40,
      seo_score: 55,
      is_slow: true,
      error: error.message || 'Errore durante la scansione PageSpeed',
    });
  }
}
