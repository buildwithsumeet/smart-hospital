import axios from 'axios';
import { createLogger } from './logger';

const logger = createLogger('AIService:Ollama');

export interface TriageResult {
  recommendedDepartment: string;
  urgency: 'ROUTINE' | 'URGENT' | 'EMERGENCY';
  summary: string;
  suggestedQuestions: string[];
}

export class OllamaService {
  private static baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  private static defaultModel = process.env.OLLAMA_MODEL || 'medllama2';

  public static async isHealthy(): Promise<boolean> {
    try {
      const res = await axios.get(`${this.baseUrl}/api/tags`, { timeout: 2000 });
      return res.status === 200;
    } catch {
      return false;
    }
  }

  public static async generate(prompt: string, model = this.defaultModel): Promise<string> {
    try {
      const res = await axios.post(
        `${this.baseUrl}/api/generate`,
        {
          model,
          prompt,
          stream: false
        },
        { timeout: 30000 }
      );
      return res.data.response;
    } catch (err: any) {
      logger.warn(`Ollama inference unavailable (${err.message}). Using clinical rule fallback.`);
      return this.fallbackClinicalResponse(prompt);
    }
  }

  public static async triageSymptoms(symptoms: string): Promise<TriageResult> {
    const prompt = `You are a clinical hospital triage AI. Analyze the patient symptoms: "${symptoms}".
Respond strictly in JSON format with fields:
- recommendedDepartment (Cardiology, Neurology, Pediatrics, Orthopedics, General Medicine, Dermatology)
- urgency (ROUTINE, URGENT, EMERGENCY)
- summary (brief 1-2 sentence medical summary)
- suggestedQuestions (array of 2-3 clinical follow-up questions)`;

    try {
      const isAvailable = await this.isHealthy();
      if (isAvailable) {
        const raw = await this.generate(prompt);
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }
    } catch {
      // Fallback
    }

    return this.ruleBasedTriage(symptoms);
  }

  private static ruleBasedTriage(symptoms: string): TriageResult {
    const lower = symptoms.toLowerCase();

    if (lower.includes('chest') || lower.includes('heart') || lower.includes('palpitation') || lower.includes('pressure')) {
      return {
        recommendedDepartment: 'Cardiology',
        urgency: lower.includes('severe') ? 'EMERGENCY' : 'URGENT',
        summary: 'Cardiac-related symptoms reported. Prompt evaluation by a cardiologist is advised.',
        suggestedQuestions: ['Do you feel radiating pain down your left arm?', 'Are you experiencing shortness of breath?']
      };
    }

    if (lower.includes('headache') || lower.includes('dizzy') || lower.includes('numb') || lower.includes('seizure')) {
      return {
        recommendedDepartment: 'Neurology',
        urgency: lower.includes('sudden') ? 'EMERGENCY' : 'URGENT',
        summary: 'Neurological symptoms detected. Consultation with neurology specialist recommended.',
        suggestedQuestions: ['Did the symptoms start suddenly?', 'Are you experiencing visual disturbances?']
      };
    }

    if (lower.includes('bone') || lower.includes('joint') || lower.includes('knee') || lower.includes('back') || lower.includes('fracture')) {
      return {
        recommendedDepartment: 'Orthopedics',
        urgency: 'ROUTINE',
        summary: 'Musculoskeletal pain or joint symptoms. Orthopedic evaluation recommended.',
        suggestedQuestions: ['Did this result from a recent fall or trauma?', 'Is swelling or stiffness present?']
      };
    }

    if (lower.includes('rash') || lower.includes('skin') || lower.includes('itch') || lower.includes('mole')) {
      return {
        recommendedDepartment: 'Dermatology',
        urgency: 'ROUTINE',
        summary: 'Dermatological symptoms present. Consultation with dermatologist suggested.',
        suggestedQuestions: ['How long has the rash been present?', 'Is there any bleeding or discharge?']
      };
    }

    return {
      recommendedDepartment: 'General Medicine',
      urgency: 'ROUTINE',
      summary: 'General clinical symptoms. Primary care examination recommended for preliminary diagnostics.',
      suggestedQuestions: ['Have you taken a temperature reading?', 'How many days have you had these symptoms?']
    };
  }

  private static fallbackClinicalResponse(prompt: string): string {
    return 'Clinical Assessment Summary: Patient symptoms documented. Medical specialist consultation scheduled for in-person diagnostic evaluation.';
  }
}
