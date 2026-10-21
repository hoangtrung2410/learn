import { Injectable, BadRequestException, BadGatewayException, InternalServerErrorException } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';

@Injectable()
export class TtsService {
  private readonly ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  async generateSpeech(text: string, targetLanguage = 'zh', voice = 'Zephyr') {
    if (!text) {
      throw new BadRequestException('Text is required');
    }

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `Pronounce naturally in ${targetLanguage === 'zh' ? 'Mandarin Chinese' : targetLanguage === 'en' ? 'American English' : 'standard native dialect'}: ${text}`,
                speechMetadata: {
                  style: 'Clear, gentle language teacher with accurate native tones and phonetics',
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice || 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

      if (!base64Audio) {
        throw new BadGatewayException('TTS audio generation returned empty');
      }

      return {
        audioBase64: base64Audio,
        mimeType: 'audio/wav',
      };
    } catch (error: any) {
      console.warn('TTS NestJS fallback warning:', error.message);
      throw new InternalServerErrorException(error.message);
    }
  }
}
