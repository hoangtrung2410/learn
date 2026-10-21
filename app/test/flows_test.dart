import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:linguapulse_app/core/api_client.dart';
import 'package:linguapulse_app/core/progress_store.dart';
import 'package:linguapulse_app/core/theme.dart';
import 'package:linguapulse_app/models/curriculum.dart';
import 'package:linguapulse_app/screens/chat_screen.dart';
import 'package:linguapulse_app/screens/dictionary_screen.dart';
import 'package:linguapulse_app/screens/home_shell.dart';
import 'package:linguapulse_app/screens/lesson_screen.dart';
import 'package:shared_preferences/shared_preferences.dart';

Future<void> _bigScreen(WidgetTester t) async {
  t.view.physicalSize = const Size(800, 1800);
  t.view.devicePixelRatio = 1;
  addTearDown(t.view.reset);
}

Future<ProgressStore> _store() async {
  SharedPreferences.setMockInitialValues({});
  return ProgressStore.load();
}

Widget _wrap(Widget w) => MaterialApp(theme: buildTheme(), home: w);

/// Answers the current question correctly (or wrongly when [wrong] is set).
Future<void> _answer(WidgetTester t, Question q, {bool wrong = false}) async {
  if (q.type == 'speak-sentence') {
    await t.tap(find.text('Tôi đã đọc xong'));
  } else if (q.type == 'reorder-words') {
    // Chinese answers are a word list; English is one sentence: order chips by position in it.
    final ordered = q.correct.length > 1
        ? q.correct
        : ([...q.options]..sort((a, b) => q.correct.first.indexOf(a).compareTo(q.correct.first.indexOf(b))));
    final words = wrong ? ordered.reversed.toList() : ordered;
    for (final w in words) {
      await t.tap(find.widgetWithText(ActionChip, w).last);
      await t.pump();
    }
    await t.tap(find.text('Kiểm tra'));
  } else {
    final pick = wrong ? q.options.firstWhere((o) => o != q.correct.first) : q.correct.first;
    await t.tap(find.text(pick).last);
    await t.pump();
    await t.tap(find.text('Kiểm tra'));
  }
  await t.pump();
}

void main() {
  late Curriculum curriculum;

  setUpAll(() async {
    TestWidgetsFlutterBinding.ensureInitialized();
    curriculum = await Curriculum.load();
  });

  for (final lang in ['zh', 'en']) {
    testWidgets('every $lang lesson can be completed with correct answers', (t) async {
      await _bigScreen(t);
      final store = await _store()..setLang(lang);
      for (final unit in curriculum.of(lang).units) {
        for (final lesson in unit.lessons) {
          await t.pumpWidget(_wrap(LessonScreen(key: ValueKey(lesson.id), lesson: lesson, store: store)));
          for (var i = 0; i < lesson.questions.length; i++) {
            final q = lesson.questions[i];
            await _answer(t, q);
            expect(find.textContaining('Chính xác'), findsOneWidget, reason: '${lesson.id}/${q.id}');
            final last = i == lesson.questions.length - 1;
            await t.tap(find.text(last ? 'Hoàn thành' : 'Tiếp tục'));
            await t.pump();
          }
          expect(find.text('Hoàn thành bài học!'), findsOneWidget, reason: lesson.id);
          expect(store.isDone(lesson.id), isTrue, reason: lesson.id);
        }
      }
    });
  }

  testWidgets('wrong answer loses a heart and shows the correct answer', (t) async {
    await _bigScreen(t);
    final store = await _store();
    final lesson = curriculum.of('zh').units.first.lessons.first;
    await t.pumpWidget(_wrap(LessonScreen(key: ValueKey(lesson.id), lesson: lesson, store: store)));
    final q = lesson.questions.first;
    await _answer(t, q, wrong: true);
    expect(find.text('Chưa đúng rồi'), findsOneWidget);
    expect(find.text('Đáp án: ${q.correct.first}'), findsOneWidget);
    expect(store.hearts, ProgressStore.maxHearts - 1);
  });

  testWidgets('running out of hearts offers a refill', (t) async {
    await _bigScreen(t);
    final store = await _store();
    store.hearts = 1;
    final lesson = curriculum.of('zh').units.first.lessons.first;
    await t.pumpWidget(_wrap(LessonScreen(key: ValueKey(lesson.id), lesson: lesson, store: store)));
    await _answer(t, lesson.questions.first, wrong: true);
    await t.tap(find.text('Tiếp tục'));
    await t.pumpAndSettle();
    expect(find.text('Hết tim rồi 💔'), findsOneWidget);
    await t.tap(find.text('Nạp tim'));
    await t.pumpAndSettle();
    expect(store.hearts, ProgressStore.maxHearts);
  });

  group('API client', () {
    test('parses conversation reply', () async {
      final api = ApiClient(
        client: MockClient((req) async {
          expect(req.url.path, '/api/ai/conversation');
          final body = jsonDecode(req.body) as Map<String, dynamic>;
          expect(body['userMessage'], '你好');
          return http.Response.bytes(
            utf8.encode(jsonEncode({
              'replyText': '你好！',
              'pinyinOrPhonetic': 'Nǐ hǎo',
              'vietnameseTranslation': 'Xin chào',
              'speechFeedback': {'tip': 'Mẹo', 'betterAlternative': 'x'},
              'suggestedResponses': [
                {'text': 'a', 'pinyin': 'b', 'meaning': 'c'}
              ],
            })),
            201,
          );
        }),
      );
      final r = await api.conversation(
        lang: 'zh',
        scenarioTitle: 't',
        scenarioRole: 'r',
        history: const [],
        userMessage: '你好',
      );
      expect(r.text, '你好！');
      expect(r.translation, 'Xin chào');
      expect(r.tip, 'Mẹo');
      expect(r.suggestions.single.text, 'a');
    });

    test('server error becomes a friendly ApiException', () async {
      final api = ApiClient(client: MockClient((_) async => http.Response('{}', 500)));
      expect(api.explain('x', 'zh'), throwsA(isA<ApiException>()));
    });
  });

  testWidgets('dictionary screen shows an AI explanation', (t) async {
    await _bigScreen(t);
    final store = await _store();
    final api = ApiClient(
      client: MockClient((req) async {
        expect(jsonDecode(req.body)['query'], '你好');
        return http.Response.bytes(
          utf8.encode(jsonEncode({
            'title': '你好',
            'phonetic': 'nǐ hǎo',
            'level': 'HSK 1',
            'vietnameseMeaning': 'Xin chào',
            'radicalsOrOrigin': 'Bộ Nhân',
            'memoryTrick': 'Mẹo nhớ',
            'examples': [
              {'sentence': '你好吗？', 'phonetic': 'Nǐ hǎo ma?', 'translation': 'Bạn khỏe không?'}
            ],
            'commonMistakes': 'Biến điệu',
            'usageNotes': 'Lịch sự',
          })),
          201,
        );
      }),
    );
    await t.pumpWidget(_wrap(Scaffold(body: DictionaryScreen(store: store, api: api))));
    await t.enterText(find.byType(TextField), '你好');
    await t.tap(find.byIcon(Icons.search));
    await t.pumpAndSettle();
    expect(find.text('Xin chào'), findsOneWidget);
    expect(find.text('Bạn khỏe không?'), findsOneWidget);
  });

  testWidgets('dictionary screen shows error when backend is down', (t) async {
    await _bigScreen(t);
    final store = await _store();
    final api = ApiClient(client: MockClient((_) async => throw Exception('offline')));
    await t.pumpWidget(_wrap(Scaffold(body: DictionaryScreen(store: store, api: api))));
    await t.enterText(find.byType(TextField), 'abc');
    await t.tap(find.byIcon(Icons.search));
    await t.pumpAndSettle();
    expect(find.textContaining('Không kết nối được máy chủ'), findsOneWidget);
  });

  testWidgets('chat screen sends a message and shows the AI reply', (t) async {
    await _bigScreen(t);
    final store = await _store();
    final scenario = curriculum.of('zh').scenarios.first;
    final api = ApiClient(
      client: MockClient((req) async {
        final body = jsonDecode(req.body) as Map<String, dynamic>;
        expect(body['scenarioTitle'], scenario.title);
        expect((body['history'] as List).last['content'], '我很好');
        return http.Response.bytes(
          utf8.encode(jsonEncode({
            'replyText': '太好了！',
            'pinyinOrPhonetic': 'Tài hǎo le!',
            'vietnameseTranslation': 'Tuyệt quá!',
            'speechFeedback': {'tip': 'Nói tự nhiên', 'betterAlternative': ''},
            'suggestedResponses': [
              {'text': '谢谢', 'pinyin': 'xièxie', 'meaning': 'Cảm ơn'}
            ],
          })),
          201,
        );
      }),
    );
    await t.pumpWidget(_wrap(ChatScreen(store: store, api: api, scenario: scenario)));
    expect(find.text(scenario.initialPrompt), findsOneWidget);
    await t.enterText(find.byType(TextField), '我很好');
    await t.tap(find.byIcon(Icons.send_rounded));
    await t.pumpAndSettle();
    expect(find.text('我很好'), findsOneWidget);
    expect(find.text('太好了！'), findsOneWidget);
    expect(find.text('谢谢'), findsOneWidget); // suggested reply chip
  });

  testWidgets('home shell switches tabs and language', (t) async {
    await _bigScreen(t);
    final store = await _store();
    await t.pumpWidget(_wrap(HomeShell(store: store, curriculum: curriculum, api: ApiClient())));
    expect(find.textContaining('CỬA ẢI 1'), findsOneWidget);
    await t.tap(find.text('Hội thoại'));
    await t.pumpAndSettle();
    expect(find.text('Hội thoại cùng AI'), findsOneWidget);
    await t.tap(find.text('Hồ sơ'));
    await t.pumpAndSettle();
    await t.tap(find.textContaining('Tiếng Anh'));
    await t.pumpAndSettle();
    expect(store.lang, 'en');
    await t.tap(find.text('Lộ trình'));
    await t.pumpAndSettle();
    expect(find.textContaining('Tiếng Anh giao tiếp'), findsOneWidget);
  });
}
