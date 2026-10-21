export interface CodeFile {
  filename: string;
  language: string;
  description: string;
  content: string;
}

export interface TechStackDoc {
  title: string;
  tech: string;
  badge: string;
  color: string;
  description: string;
  folderStructure: string;
  keyFiles: CodeFile[];
}

export const ARCHITECTURE_DATA: {
  nestjs: TechStackDoc;
  nextjs: TechStackDoc;
  flutter: TechStackDoc;
} = {
  nestjs: {
    title: 'Backend API Enterprise',
    tech: 'NestJS 11 + TypeScript',
    badge: 'Microservices / REST / WebSocket',
    color: '#e0234e',
    description:
      'Backend chuẩn kiến trúc Module hóa (Modular Architecture), tích hợp NestJS Controller, Service, DTO validation, Swagger OpenAPI, Gemini AI SDK (@google/genai) và WebSocket Gateway xử lý stream giọng nói thời gian thực.',
    folderStructure: `backend-nestjs/
├── src/
│   ├── main.ts                       # Bootstrap, Swagger, CORS, ValidationPipe
│   ├── app.module.ts                 # Root Module import các module con
│   ├── common/
│   │   ├── filters/http-exception.ts # Global Exception Filter
│   │   ├── guards/jwt-auth.guard.ts  # Token Auth Guard
│   │   └── interceptors/transform.ts # Format Response chuẩn { success, data }
│   ├── modules/
│   │   ├── speech-coach/             # Module chấm phát âm ELSA Speak
│   │   │   ├── speech-coach.controller.ts
│   │   │   ├── speech-coach.service.ts
│   │   │   ├── speech-coach.module.ts
│   │   │   ├── speech-coach.gateway.ts # WebSocket cho Real-time Audio
│   │   │   └── dto/
│   │   │       ├── evaluate-speech.dto.ts
│   │   │       └── speech-result.dto.ts
│   │   ├── gemini-ai/                # Shared Gemini Service (@google/genai)
│   │   │   ├── gemini.service.ts
│   │   │   └── gemini.module.ts
│   │   ├── conversation/             # Module Hội thoại & Phản xạ AI
│   │   │   ├── conversation.controller.ts
│   │   │   └── conversation.service.ts
│   │   └── curriculum/               # Module Bài học, HSK & Duolingo Path
│   │       ├── curriculum.controller.ts
│   │       └── curriculum.service.ts
│   └── database/
│       ├── prisma.service.ts
│       └── schema.prisma             # PostgreSQL Schema (Users, XP, Streaks)
├── package.json
└── docker-compose.yml`,
    keyFiles: [
      {
        filename: 'src/main.ts',
        language: 'typescript',
        description: 'Entrypoint khởi động NestJS với Swagger UI, ValidationPipe và CORS',
        content: `import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Kích hoạt CORS cho Next.js Frontend & Flutter Mobile
  app.enableCors({
    origin: ['http://localhost:3000', 'https://app.linguapulse.com'],
    credentials: true,
  });

  // Tự động validate DTO bằng class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Cấu hình Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('LinguaPulse AI Language Platform API')
    .setDescription('NestJS Backend cung cấp API học tiếng Trung (HSK/Pinyin), Luyện phát âm AI chuẩn ELSA Speak và Hội thoại AI')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Speech Coach (ELSA Speak AI)')
    .addTag('AI Conversation Roleplay')
    .addTag('Curriculum & Gamification')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 8080;
  await app.listen(port);
  console.log(\`NestJS API Server is running on port \${port} -> Docs at /api/docs\`);
}
bootstrap();`,
      },
      {
        filename: 'src/modules/speech-coach/speech-coach.service.ts',
        language: 'typescript',
        description: 'Service chấm điểm phát âm tiếng Trung 4 thanh điệu & tiếng Anh bằng Gemini AI',
        content: `import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import { EvaluateSpeechDto } from './dto/evaluate-speech.dto';
import { SpeechEvaluationResult } from './dto/speech-result.dto';

@Injectable()
export class SpeechCoachService {
  private readonly ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: { 'User-Agent': 'aistudio-build' },
      },
    });
  }

  async evaluatePronunciation(dto: EvaluateSpeechDto): Promise<SpeechEvaluationResult> {
    const { targetLanguage, targetSentence, userSpokenText } = dto;

    const prompt = \`
Bạn là Chuyên gia Luyện Âm AI chuẩn ELSA Speak cho ngôn ngữ \${targetLanguage === 'zh' ? 'Tiếng Trung (Mandarin)' : 'Tiếng Anh'}.
Nhiệm vụ: Chấm điểm và phân tích cực kỳ chi tiết phát âm, thanh điệu (Tone 1, 2, 3, 4 nếu là tiếng Trung), ngữ điệu và độ trôi chảy.

Câu chuẩn: "\${targetSentence}"
Người học phát âm: "\${userSpokenText}"

Yêu cầu phân tích:
- Overall Score (0-100), Pronunciation (0-100), Fluency (0-100), Tone Score (0-100).
- Word Breakdown: Từng từ/chữ Hán kèm Pinyin/IPA, thang điểm, trạng thái (perfect | good | needs-work) và mẹo khẩu hình.
- Lời khuyên cụ thể bằng tiếng Việt dễ hiểu.

Trả về định dạng JSON thuần không bọc code block:
{
  "overallScore": 92,
  "pronunciationScore": 90,
  "fluencyScore": 94,
  "toneScore": 91,
  "cefrLevel": "B1",
  "pinyinOrIpa": "...",
  "nativeMeaningVi": "...",
  "feedbackSummary": "...",
  "wordsBreakdown": [
    { "word": "你好", "phonetic": "nǐ hǎo", "score": 95, "status": "perfect", "comment": "Thanh 3 biến điệu chuẩn" }
  ],
  "pronunciationTips": ["Mẹo 1", "Mẹo 2"]
}
\`;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });

      return JSON.parse(response.text || '{}') as SpeechEvaluationResult;
    } catch (err) {
      throw new InternalServerErrorException('Lỗi đánh giá âm thanh qua AI: ' + err.message);
    }
  }
}`,
      },
      {
        filename: 'src/modules/speech-coach/speech-coach.controller.ts',
        language: 'typescript',
        description: 'Controller tiếp nhận request chấm phát âm với Swagger decorator',
        content: `import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SpeechCoachService } from './speech-coach.service';
import { EvaluateSpeechDto } from './dto/evaluate-speech.dto';
import { SpeechEvaluationResult } from './dto/speech-result.dto';

@ApiTags('Speech Coach (ELSA Speak AI)')
@Controller('api/v1/speech-coach')
export class SpeechCoachController {
  constructor(private readonly speechCoachService: SpeechCoachService) {}

  @Post('evaluate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Chấm điểm phát âm chi tiết từng âm tiết & thanh điệu Pinyin' })
  @ApiResponse({ status: 200, description: 'Kết quả chấm điểm ELSA Speak', type: SpeechEvaluationResult })
  async evaluateSpeech(@Body() dto: EvaluateSpeechDto): Promise<SpeechEvaluationResult> {
    return this.speechCoachService.evaluatePronunciation(dto);
  }
}`,
      },
    ],
  },
  nextjs: {
    title: 'Frontend Web Next.js',
    tech: 'Next.js 15 (App Router) + React 19 + Tailwind CSS',
    badge: 'Server Components / SSR / PWA',
    color: '#06b6d4',
    description:
      'Giao diện Web học ngoại ngữ phong cách Duolingo (lộ trình cây kỹ năng gamified) kết hợp phòng luyện nói ELSA Speak AI, hỗ trợ Web Audio API, Web Speech API và Server Actions.',
    folderStructure: `frontend-nextjs/
├── src/
│   ├── app/
│   │   ├── (auth)/login/page.tsx
│   │   ├── (main)/
│   │   │   ├── layout.tsx            # App Layout: Sidebar + Top Stats Bar
│   │   │   ├── learn/page.tsx        # Cây bài học gamified Duolingo
│   │   │   ├── speaking-lab/page.tsx # Phòng luyện âm ELSA Speak
│   │   │   ├── roleplay/page.tsx     # Hội thoại phản xạ giọng nói với AI
│   │   │   ├── pinyin-chart/page.tsx # Bảng Pinyin & 4 Thanh điệu tương tác
│   │   │   └── leaderboard/page.tsx  # Bảng xếp hạng XP & League
│   │   └── api/                      # Next.js Server Proxy Routes
│   ├── components/
│   │   ├── duo/
│   │   │   ├── UnitSection.tsx       # Khối bài học 3D Duolingo
│   │   │   ├── LessonButton.tsx      # Nút tròn 3D nhấp nháy, vương miện
│   │   │   └── QuizEngine.tsx        # Trắc nghiệm, ghép chữ Hán, xếp câu
│   │   ├── elsa/
│   │   │   ├── WaveformVisualizer.tsx# Sóng âm thanh micro trực quan
│   │   │   ├── ScoreRing.tsx         # Vòng tròn điểm số ELSA 0-100%
│   │   │   └── SyllableFeedback.tsx  # Đánh dấu màu xanh/vàng/đỏ từng âm
│   │   └── common/
│   │       ├── LanguageDropdown.tsx  # Bộ chọn ngôn ngữ Trung/Anh/Nhật/Hàn
│   │       └── HeaderStats.tsx       # Chuỗi ngày Streak, Tim, Kim cương
│   ├── hooks/
│   │   ├── useSpeechRecognition.ts   # Micro Web Speech API chuẩn
│   │   ├── useAudioPlayer.ts         # Phát âm thanh chuẩn Bắc Kinh & slow 0.75x
│   │   └── useGamification.ts        # Quản lý XP, Streak, Hearts
│   └── lib/
│       ├── apiClient.ts              # Axios / Fetch client gọi NestJS
│       └── utils.ts
├── tailwind.config.ts
└── next.config.ts`,
    keyFiles: [
      {
        filename: 'src/app/(main)/learn/page.tsx',
        language: 'typescript',
        description: 'Trang chủ lộ trình học Duolingo với các Unit cuộn uốn lượn và mascot động viên',
        content: `import { Suspense } from 'react';
import UnitSection from '@/components/duo/UnitSection';
import HeaderStats from '@/components/common/HeaderStats';
import { getCurriculumData } from '@/lib/apiClient';

export default async function LearnPage({ searchParams }: { searchParams: { lang?: string } }) {
  const lang = searchParams.lang || 'zh'; // Mặc định Tiếng Trung
  const curriculum = await getCurriculumData(lang);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 pb-24">
      {/* Thanh trạng thái Duolingo trên cùng */}
      <HeaderStats />

      <main className="max-w-3xl mx-auto px-4 pt-6">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">
            Lộ trình học {lang === 'zh' ? 'Tiếng Trung HSK & Bính Âm' : 'Tiếng Anh Giao Tiếp'}
          </h1>
          <p className="text-slate-400 text-sm">
            Chinh phục từng mốc bài học, tích lũy XP và mở khóa hội thoại AI thực chiến
          </p>
        </div>

        {/* Danh sách các Unit nối uốn lượn */}
        <div className="space-y-12">
          {curriculum.units.map((unit, idx) => (
            <UnitSection key={unit.id} unit={unit} index={idx} />
          ))}
        </div>
      </main>
    </div>
  );
}`,
      },
      {
        filename: 'src/hooks/useSpeechRecognition.ts',
        language: 'typescript',
        description: 'Hook micro nhận diện giọng nói cho tính năng ELSA Speak trên Web',
        content: `import { useState, useRef, useEffect, useCallback } from 'react';

export function useSpeechRecognition(targetLang: 'zh' | 'en' = 'zh') {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setErrorMessage('Trình duyệt chưa hỗ trợ Web Speech API. Bạn có thể nhập text để test.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = targetLang === 'zh' ? 'zh-CN' : 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = (event: any) => {
      let currentText = '';
      for (let i = 0; i < event.results.length; i++) {
        currentText += event.results[i][0].transcript;
      }
      setTranscript(currentText);
    };

    recognition.onerror = (e: any) => {
      setIsRecording(false);
      setErrorMessage(\`Lỗi micro: \${e.error}\`);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
  }, [targetLang]);

  const startRecording = useCallback(() => {
    setTranscript('');
    setErrorMessage(null);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (e) {
        console.warn(e);
      }
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  }, []);

  return { isRecording, transcript, setTranscript, errorMessage, startRecording, stopRecording };
}`,
      },
    ],
  },
  flutter: {
    title: 'Mobile App Flutter',
    tech: 'Flutter 3.x + Dart + BLoC Pattern',
    badge: 'iOS & Android Native / Offline-first',
    color: '#0284c7',
    description:
      'Ứng dụng Mobile đa nền tảng viết bằng Flutter, tổ chức theo Clean Architecture (BLoC), tích hợp flutter_sound ghi âm phân tích tần số giọng nói, âm thanh Native và UI Duolingo tương thích hoàn hảo.',
    folderStructure: `mobile-flutter/
├── lib/
│   ├── main.dart                      # Khởi chạy App, Theme, MultiBlocProvider
│   ├── core/
│   │   ├── constants/app_colors.dart  # Mã màu Duolingo & ELSA Speak
│   │   ├── network/api_client.dart    # Dio client kết nối NestJS Backend
│   │   └── audio/
│   │       ├── audio_recorder.dart    # Ghi âm chất lượng cao (PCM / AAC)
│   │       └── audio_player.dart      # Phát âm giọng đọc bản xứ & 0.75x
│   ├── features/
│   │   ├── curriculum/                # Tính năng Học theo Lộ trình Duolingo
│   │   │   ├── domain/models/lesson.dart
│   │   │   ├── presentation/
│   │   │   │   ├── bloc/curriculum_bloc.dart
│   │   │   │   └── screens/learning_path_screen.dart # Cây bài học uốn lượn
│   │   ├── speaking_coach/            # Tính năng Chấm Âm ELSA Speak
│   │   │   ├── domain/models/speech_evaluation.dart
│   │   │   ├── presentation/
│   │   │   │   ├── bloc/speaking_bloc.dart
│   │   │   │   ├── screens/speaking_screen.dart      # Màn hình luyện nói
│   │   │   │   └── widgets/
│   │   │   │       ├── score_gauge.dart              # Đồng hồ đo điểm 0-100%
│   │   │   │       ├── sound_wave_widget.dart        # Sóng âm thanh nhảy sống động
│   │   │   │       └── pinyin_syllable_chip.dart     # Từng chữ Hán tô màu xanh/vàng/đỏ
│   │   └── ai_conversation/           # Phòng hội thoại AI Roleplay
│   │       ├── presentation/screens/roleplay_chat_screen.dart
│   └── app_router.dart
├── pubspec.yaml                       # Khai báo flutter_bloc, dio, record, audioplayers
└── assets/audio/                      # Âm thanh vui nhộn ding.mp3, error.mp3`,
    keyFiles: [
      {
        filename: 'lib/features/speaking_coach/presentation/screens/speaking_screen.dart',
        language: 'dart',
        description: 'Màn hình luyện phát âm tiếng Trung & tiếng Anh với đồng hồ điểm ELSA và sóng âm',
        content: `import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../bloc/speaking_bloc.dart';
import '../widgets/sound_wave_widget.dart';
import '../widgets/score_gauge.dart';

class SpeakingCoachScreen extends StatelessWidget {
  final String targetSentence;
  final String pinyinText;
  final String vietnameseMeaning;
  final String targetLanguage;

  const SpeakingCoachScreen({
    Key? key,
    required this.targetSentence,
    required this.pinyinText,
    required this.vietnameseMeaning,
    this.targetLanguage = 'zh',
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        title: const Text('ELSA AI Speaking Coach', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: const Color(0xFF1E293B),
        elevation: 0,
      ),
      body: BlocConsumer<SpeakingBloc, SpeakingState>(
        listener: (context, state) {
          if (state is SpeakingEvaluatedSuccess) {
            // Rung phản hồi haptic & phát âm thanh chúc mừng
          }
        },
        builder: (context, state) {
          return Padding(
            padding: const EdgeInsets.all(20.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Thẻ câu mẫu phát âm (Chữ Hán to bản + Bính âm + Dịch nghĩa)
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1E293B),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: const Color(0xFF334155)),
                  ),
                  child: Column(
                    children: [
                      Text(
                        targetSentence,
                        textAlign: TextAlign.center,
                        style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.white),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        pinyinText,
                        style: const TextStyle(fontSize: 18, color: Color(0xFF38BDF8), fontWeight: FontWeight.w600),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        vietnameseMeaning,
                        style: const TextStyle(fontSize: 14, color: Colors.grey),
                      ),
                    ],
                  ),
                ),

                const Spacer(),

                // Kết quả chấm điểm ELSA Speak nếu đã chấm xong
                if (state is SpeakingEvaluatedSuccess) ...[
                  ScoreGauge(score: state.result.overallScore),
                  const SizedBox(height: 12),
                  Text(
                    'Độ chuẩn thanh điệu: \${state.result.toneScore}% | Trôi chảy: \${state.result.fluencyScore}%',
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: Color(0xFF4ADE80), fontWeight: FontWeight.bold),
                  ),
                ],

                // Sóng âm thanh nhảy múa khi đang ghi âm
                if (state is SpeakingRecording) const SoundWaveWidget(),

                const Spacer(),

                // Nút bấm Micro giữ để nói
                Center(
                  child: GestureDetector(
                    onTapDown: (_) => context.read<SpeakingBloc>().add(StartRecordingEvent()),
                    onTapUp: (_) => context.read<SpeakingBloc>().add(StopAndEvaluateEvent(
                      targetSentence: targetSentence,
                      targetLang: targetLanguage,
                    )),
                    child: Container(
                      width: 80,
                      height: 80,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: const LinearGradient(
                          colors: [Color(0xFF10B981), Color(0xFF059669)],
                        ),
                        boxShadow: [
                          BoxShadow(color: const Color(0xFF10B981).withOpacity(0.4), blurRadius: 20, spreadRadius: 4),
                        ],
                      ),
                      child: const Icon(Icons.mic, size: 40, color: Colors.white),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                const Text(
                  'Chạm để nói - AI sẽ phân tích từng âm tiết & thanh điệu',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.grey, fontSize: 13),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}`,
      },
      {
        filename: 'pubspec.yaml',
        language: 'yaml',
        description: 'File cấu hình dependencies của Flutter Mobile App',
        content: `name: linguapulse_mobile
description: "Duolingo + ELSA Speak Language Learning Mobile App for Chinese & English"
publish_to: 'none'
version: 1.0.0+1

environment:
  sdk: '>=3.2.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter
  # Quản lý State chuẩn BLoC
  flutter_bloc: ^8.1.3
  equatable: ^2.0.5

  # Mạng & API NestJS
  dio: ^5.4.1
  retrofit: ^4.1.0

  # Xử lý Âm thanh & Micro Native
  record: ^5.1.0
  audioplayers: ^6.0.0
  permission_handler: ^11.3.1

  # Giao diện & Hiệu ứng Gamification Duolingo
  confetti: ^0.7.0
  percent_indicator: ^4.2.3
  flutter_animate: ^4.5.0
  cached_network_image: ^3.3.1

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0`,
      },
    ],
  },
};
