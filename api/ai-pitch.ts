import type { Request, Response } from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import { AuditResult } from '../src/types/audit';

export default async function handler(req: Request, res: Response) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo non consentito. Utilizzare POST.' });
  }

  try {
    const { audit, custom_notes } = (req.body || {}) as {
      audit: AuditResult;
      custom_notes?: string;
    };

    if (!audit || !audit.business_name) {
      return res.status(400).json({ error: 'Dati audit mancanti o incompleti.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        error: 'API Gemini non inizializzata. Configurare GEMINI_API_KEY nelle impostazioni.',
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const prompt = `Sei il miglior consulente commerciale e Local SEO auditor per agenzie digitali e web agency italiane.
Devi preparare il materiale di cold outreach e sales hook per questa attività locale:

Dati Attività:
- Nome: "${audit.business_name}"
- Categoria: "${audit.raw?.category || 'Attività commerciale'}"
- Città: "${audit.raw?.city || 'Italia'}"
- Telefono: "${audit.raw?.phone || 'N/D'}"
- Sito attuale: "${audit.raw?.website || 'Nessuno / Social'}"
- Rating Google: ${audit.raw?.google_rating ?? 'N/D'} (${audit.raw?.reviews_count ?? 0} recensioni)
- Profilo non rivendicato: ${audit.raw?.unclaimed_profile ? 'SI (critico)' : 'No'}
- Punteggio PageSpeed Mobile: ${audit.raw?.pagespeed_mobile_score ?? 'N/D'}/100
- Certificato SSL: ${audit.raw?.ssl_active === false ? 'NON ATTIVO (insufficiente)' : 'Attivo/ND'}

Criticità commerciali identificate:
${audit.main_problems?.map((p, i) => `${i + 1}. ${p}`).join('\n') || 'Nessuna criticità grave'}

Servizi suggeriti da proporre:
${audit.suggested_services?.map((s, i) => `${i + 1}. ${s}`).join('\n') || 'Consulenza generale'}

Note opzionali dell'agenzia: "${custom_notes || 'Approccio consulenziale, non aggressivo, orientato a non perdere clienti a favore dei competitor locali.'}"

Compila un piano di contatto commerciale composto esattamente da:
1. "call_script": Script per telefonata a freddo (max 45 secondi di conversazione con il titolare, incentrato sul ROI e sulla perdita di clienti di zona verso i concorrenti diretti).
2. "email_icebreaker": Email a freddo di max 3-4 frasi, oggetto magnetico incluso, senza gergo tecnico incomprensibile, con chiaro invito all'azione leggero (es. "possiamo inviarvi un video-report gratuito di 2 minuti?").
3. "whatsapp_pitch": Messaggio WhatsApp diretto e cordiale per il titolare, leggibile in 15 secondi.
4. "value_proposition": Proposta di valore unica condensata in 1 frase d'impatto.
5. "objection_answer": Risposta rapida ed elegante all'obiezione più probabile ("Lavoriamo solo con il passaparola" oppure "Abbiamo già Facebook").

Restituisci solo un JSON rigoroso conforme allo schema.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction:
          'Sei un Local SEO Auditor & B2B Sales Strategist italiano orientato alla massima conversione, sintetico, pragmatico e persuasivo.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            call_script: {
              type: Type.STRING,
              description: 'Script telefonico sintetico e ad alta resa per il titolare',
            },
            email_icebreaker: {
              type: Type.STRING,
              description: 'Email a freddo con oggetto e corpo di 3-4 frasi orientate al valore',
            },
            whatsapp_pitch: {
              type: Type.STRING,
              description: 'Testo messaggio WhatsApp diretto e rispettoso',
            },
            value_proposition: {
              type: Type.STRING,
              description: 'Proposta di valore in 1 frase forte',
            },
            objection_answer: {
              type: Type.STRING,
              description: 'Risposta a obiezione frequente del titolare',
            },
          },
          required: [
            'call_script',
            'email_icebreaker',
            'whatsapp_pitch',
            'value_proposition',
            'objection_answer',
          ],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('Nessuna risposta generata da Gemini.');
    }

    const parsed = JSON.parse(text);
    return res.status(200).json({ success: true, pitch: parsed });
  } catch (error: any) {
    console.error('AI Pitch Error:', error);
    return res.status(500).json({
      error: 'Impossibile generare la strategia con AI. Riprovare.',
      details: error.message,
    });
  }
}
