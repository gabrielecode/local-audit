import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { auditSingleBusiness, auditBusinessBatch } from './src/utils/auditorEngine';
import { RawBusinessInput, AuditResult } from './src/types/audit';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Init Google GenAI if key available
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// 1. Audit Endpoint (Deterministic Lead Intelligence Engine)
app.post('/api/audit', (req: Request, res: Response) => {
  try {
    const body = req.body;
    if (Array.isArray(body)) {
      const results = auditBusinessBatch(body as RawBusinessInput[]);
      return res.json({ success: true, count: results.length, data: results });
    } else if (body && typeof body === 'object') {
      const result = auditSingleBusiness(body as RawBusinessInput);
      return res.json({ success: true, count: 1, data: [result] });
    } else {
      return res.status(400).json({ error: 'Formato dati non valido. Inviare un oggetto o un array JSON di attività.' });
    }
  } catch (error) {
    console.error('Audit Error:', error);
    return res.status(500).json({ error: 'Errore interno durante l\'audit dei lead.' });
  }
});

// 2. AI Sales Hook & Pitch Generator Endpoint (Server-side Gemini 3.8 Flash)
app.post('/api/ai-pitch', async (req: Request, res: Response) => {
  try {
    const { audit, custom_notes } = req.body as {
      audit: AuditResult;
      custom_notes?: string;
    };

    if (!audit || !audit.business_name) {
      return res.status(400).json({ error: 'Dati audit mancanti o incompleti.' });
    }

    if (!ai) {
      return res.status(503).json({
        error: 'API Gemini non inizializzata. Configurare GEMINI_API_KEY nelle impostazioni.',
      });
    }

    const prompt = `Sei il miglior consulente commerciale e Local SEO auditor per agenzie digitali e web agency italiane.
Devi preparare il materiale di cold outreach e sales hook per questa attività locale:

Dati Attività:
- Nome: "${audit.business_name}"
- Categoria: "${audit.raw.category || 'Attività commerciale'}"
- Città: "${audit.raw.city || 'Italia'}"
- Telefono: "${audit.raw.phone || 'N/D'}"
- Sito attuale: "${audit.raw.website || 'Nessuno / Social'}"
- Rating Google: ${audit.raw.google_rating ?? 'N/D'} (${audit.raw.reviews_count ?? 0} recensioni)
- Profilo non rivendicato: ${audit.raw.unclaimed_profile ? 'SI (critico)' : 'No'}
- Punteggio PageSpeed Mobile: ${audit.raw.pagespeed_mobile_score ?? 'N/D'}/100
- Certificato SSL: ${audit.raw.ssl_active === false ? 'NON ATTIVO (insufficiente)' : 'Attivo/ND'}

Criticità commerciali identificate:
${audit.main_problems.map((p, i) => `${i + 1}. ${p}`).join('\n')}

Servizi suggeriti da proporre:
${audit.suggested_services.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Note opzionali dell'agenzia: "${custom_notes || 'Approccio consulenziale, non aggressivo, orientato a non perdere clienti a favore dei competitor locali.'}"

Compila un piano di contatto commerciale composto esattamente da:
1. "call_script": Script per telefonata a freddo (max 45 secondi di conversazione con il titolare, incentrato sul ROI e sulla perdita di clienti di zona verso i concorrenti diretti).
2. "email_icebreaker": Email a freddo di max 3-4 frasi, oggetto magnetico incluso, senza gergo tecnico incomprensibile, con chiaro invito all'azione leggero (es. "possiamo inviarvi un video-report gratuito di 2 minuti?").
3. "whatsapp_pitch": Messaggio WhatsApp diretto e cordiale per il titolare, leggibile in 15 secondi.
4. "value_proposition": Proposta di valore unica condensata in 1 frase d'impatto.
5. "objection_answer": Risposta rapida ed elegante all'obiezione più probabile ("Lavoriamo solo con il passaparola" oppure "Abbiamo già Facebook").

Restituisci solo un JSON rigoroso conforme allo schema.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
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
    return res.json({ success: true, pitch: parsed });
  } catch (error) {
    console.error('AI Pitch Error:', error);
    return res.status(500).json({
      error: 'Impossibile generare la strategia con AI. Riprovare.',
    });
  }
});

// Serve frontend
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`LocalAudit Pro server running on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
