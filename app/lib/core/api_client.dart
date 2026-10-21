import 'dart:convert';

import 'package:http/http.dart' as http;

import 'config.dart';

class ApiException implements Exception {
  ApiException(this.message);
  final String message;
  @override
  String toString() => message;
}

class SuggestedReply {
  SuggestedReply({required this.text, required this.pinyin, required this.meaning});
  final String text;
  final String pinyin;
  final String meaning;

  factory SuggestedReply.fromJson(Map<String, dynamic> j) => SuggestedReply(
        text: (j['text'] ?? '').toString(),
        pinyin: (j['pinyin'] ?? '').toString(),
        meaning: (j['meaning'] ?? '').toString(),
      );
}

class ChatReply {
  ChatReply({
    required this.text,
    required this.phonetic,
    required this.translation,
    this.tip,
    this.betterAlternative,
    this.suggestions = const [],
  });
  final String text;
  final String phonetic;
  final String translation;
  final String? tip;
  final String? betterAlternative;
  final List<SuggestedReply> suggestions;

  factory ChatReply.fromJson(Map<String, dynamic> j) {
    final fb = j['speechFeedback'] as Map<String, dynamic>?;
    return ChatReply(
      text: (j['replyText'] ?? '').toString(),
      phonetic: (j['pinyinOrPhonetic'] ?? '').toString(),
      translation: (j['vietnameseTranslation'] ?? '').toString(),
      tip: fb?['tip']?.toString(),
      betterAlternative: fb?['betterAlternative']?.toString(),
      suggestions: (j['suggestedResponses'] as List? ?? const [])
          .map((e) => SuggestedReply.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}

class WordExplanation {
  WordExplanation(this.json);
  final Map<String, dynamic> json;

  String get title => (json['title'] ?? '').toString();
  String get phonetic => (json['phonetic'] ?? '').toString();
  String get level => (json['level'] ?? '').toString();
  String get meaning => (json['vietnameseMeaning'] ?? '').toString();
  String get origin => (json['radicalsOrOrigin'] ?? '').toString();
  String get memoryTrick => (json['memoryTrick'] ?? '').toString();
  String get commonMistakes => (json['commonMistakes'] ?? '').toString();
  String get usageNotes => (json['usageNotes'] ?? '').toString();
  List<Map<String, dynamic>> get examples =>
      (json['examples'] as List? ?? const []).cast<Map<String, dynamic>>();
}

/// Thin client for the NestJS backend (`/api/ai/*`).
class ApiClient {
  ApiClient({http.Client? client}) : _client = client ?? http.Client();
  final http.Client _client;

  Future<Map<String, dynamic>> _post(String path, Map<String, dynamic> body) async {
    final http.Response res;
    try {
      res = await _client
          .post(
            Uri.parse('$apiBase$path'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode(body),
          )
          .timeout(const Duration(seconds: 60));
    } catch (_) {
      throw ApiException('Không kết nối được máy chủ ($apiBase). Hãy bật backend rồi thử lại.');
    }
    if (res.statusCode >= 200 && res.statusCode < 300) {
      return jsonDecode(utf8.decode(res.bodyBytes)) as Map<String, dynamic>;
    }
    throw ApiException('Máy chủ AI đang bận (mã ${res.statusCode}). Vui lòng thử lại sau ít phút.');
  }

  Future<ChatReply> conversation({
    required String lang,
    required String scenarioTitle,
    required String scenarioRole,
    required List<({String role, String content})> history,
    required String userMessage,
  }) async {
    final j = await _post('/api/ai/conversation', {
      'targetLanguage': lang,
      'languageName': lang == 'zh' ? 'Tiếng Trung' : 'Tiếng Anh',
      'scenarioTitle': scenarioTitle,
      'scenarioRole': scenarioRole,
      'history': [for (final m in history) {'role': m.role, 'content': m.content}],
      'userMessage': userMessage,
    });
    return ChatReply.fromJson(j);
  }

  Future<WordExplanation> explain(String query, String lang) async {
    final j = await _post('/api/ai/explain', {'query': query, 'targetLanguage': lang});
    return WordExplanation(j);
  }
}
