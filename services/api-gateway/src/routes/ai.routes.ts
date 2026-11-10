import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { OllamaService, validateRequest } from '@hospital/common';

const router = Router();

const triageSchema = z.object({
  symptoms: z.string().min(3, 'Please describe symptoms in at least 3 characters')
});

const copilotSchema = z.object({
  patientAge: z.number().optional(),
  gender: z.string().optional(),
  symptoms: z.string().min(1, 'Symptoms are required'),
  history: z.string().optional(),
  vitalSigns: z.string().optional()
});

/**
 * GET /api/v1/ai/health
 * Checks connection status to Ollama container (alpine/ollama:latest)
 */
router.get('/health', async (req: Request, res: Response) => {
  const isHealthy = await OllamaService.isHealthy();
  res.status(200).json({
    success: true,
    engine: 'Ollama (alpine/ollama:latest)',
    status: isHealthy ? 'ONLINE' : 'FALLBACK_READY',
    message: isHealthy
      ? 'Ollama LLM engine is running and ready for inference.'
      : 'Ollama container is starting or offline; clinical rule-based AI engine active.'
  });
});

/**
 * POST /api/v1/ai/triage
 * Patient Symptom Checker & Specialist Recommender
 */
router.post(
  '/triage',
  validateRequest({ body: triageSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { symptoms } = req.body;
      const result = await OllamaService.triageSymptoms(symptoms);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/ai/copilot
 * Doctor Clinical Diagnostic Assistant & Prescription Helper
 */
router.post(
  '/copilot',
  validateRequest({ body: copilotSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { symptoms, history, vitalSigns, patientAge, gender } = req.body;
      const prompt = `You are a clinical physician assistant AI.
Patient profile: Age ${patientAge || 'Unknown'}, Gender ${gender || 'Unknown'}.
Chief complaint / symptoms: "${symptoms}".
Medical history: "${history || 'None reported'}".
Vitals: "${vitalSigns || 'Stable'}".

Provide a structured clinical diagnostic assessment:
1. Differential Diagnoses (top 3 potential causes)
2. Recommended Diagnostic Workup / Laboratory Tests
3. Suggested Clinical Treatment Strategy & Medication Considerations
4. Red Flags requiring immediate emergency escalation`;

      const responseText = await OllamaService.generate(prompt);
      res.status(200).json({
        success: true,
        data: {
          assessment: responseText,
          timestamp: new Date().toISOString()
        }
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
