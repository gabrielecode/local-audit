import type { Request, Response } from 'express';
import { auditBusinessBatch, auditSingleBusiness } from '../src/utils/auditorEngine';
import { RawBusinessInput } from '../src/types/audit';

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
    const body = req.body;
    if (Array.isArray(body)) {
      const results = auditBusinessBatch(body as RawBusinessInput[]);
      return res.status(200).json({ success: true, count: results.length, data: results });
    } else if (body && typeof body === 'object') {
      const result = auditSingleBusiness(body as RawBusinessInput);
      return res.status(200).json({ success: true, count: 1, data: [result] });
    } else {
      return res.status(400).json({
        error: 'Formato dati non valido. Inviare un oggetto o un array JSON di attività.',
      });
    }
  } catch (error: any) {
    console.error('Audit Error:', error);
    return res.status(500).json({ error: 'Errore interno durante l\'audit dei lead.' });
  }
}
