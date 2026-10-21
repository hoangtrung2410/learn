import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show rootBundle;

/// Learning language: 'zh' (Chinese) or 'en' (English).
typedef LangCode = String;

class Question {
  Question({
    required this.id,
    required this.type,
    required this.prompt,
    required this.promptVi,
    required this.audioText,
    required this.correct,
    this.promptPinyin,
    this.options = const [],
    this.explanation,
  });

  final String id;
  final String type; // multiple-choice | pinyin-match | listen-select | reorder-words | speak-sentence
  final String prompt;
  final String promptVi;
  final String audioText;
  final String? promptPinyin;
  final List<String> options;
  final List<String> correct; // single answer -> 1 item; reorder -> ordered items
  final String? explanation;

  factory Question.fromJson(Map<String, dynamic> j) {
    final c = j['correctAnswer'];
    return Question(
      id: j['id'] as String,
      type: j['type'] as String,
      prompt: j['prompt'] as String? ?? '',
      promptVi: j['promptVi'] as String? ?? '',
      audioText: j['audioText'] as String? ?? '',
      promptPinyin: j['promptPinyin'] as String?,
      options: (j['options'] as List? ?? const []).cast<String>(),
      correct: c is List ? c.cast<String>() : [c as String],
      explanation: j['explanation'] as String?,
    );
  }
}

class Lesson {
  Lesson({
    required this.id,
    required this.title,
    required this.description,
    required this.xp,
    required this.icon,
    required this.questions,
  });

  final String id;
  final String title;
  final String description;
  final int xp;
  final String icon;
  final List<Question> questions;

  factory Lesson.fromJson(Map<String, dynamic> j) => Lesson(
        id: j['id'] as String,
        title: j['title'] as String,
        description: j['description'] as String? ?? '',
        xp: (j['xp'] as num?)?.toInt() ?? 10,
        icon: j['icon'] as String? ?? '📘',
        questions: (j['questions'] as List)
            .map((q) => Question.fromJson(q as Map<String, dynamic>))
            .toList(),
      );
}

class Unit {
  Unit({
    required this.id,
    required this.number,
    required this.title,
    required this.description,
    required this.badge,
    required this.color,
    required this.lessons,
  });

  final String id;
  final int number;
  final String title;
  final String description;
  final String badge;
  final Color color;
  final List<Lesson> lessons;

  factory Unit.fromJson(Map<String, dynamic> j) => Unit(
        id: j['id'] as String,
        number: (j['unitNumber'] as num).toInt(),
        title: j['title'] as String,
        description: j['description'] as String? ?? '',
        badge: j['badge'] as String? ?? '',
        color: _parseHex(j['color'] as String?),
        lessons: (j['lessons'] as List)
            .map((l) => Lesson.fromJson(l as Map<String, dynamic>))
            .toList(),
      );
}

class Scenario {
  Scenario({
    required this.id,
    required this.title,
    required this.category,
    required this.description,
    required this.partnerRole,
    required this.difficulty,
    required this.icon,
    required this.initialPrompt,
    required this.initialPinyin,
    required this.initialVi,
    required this.starters,
  });

  final String id;
  final String title;
  final String category;
  final String description;
  final String partnerRole;
  final String difficulty;
  final String icon;
  final String initialPrompt;
  final String initialPinyin;
  final String initialVi;
  final List<String> starters;

  factory Scenario.fromJson(Map<String, dynamic> j) => Scenario(
        id: j['id'] as String,
        title: j['title'] as String,
        category: j['category'] as String? ?? '',
        description: j['description'] as String? ?? '',
        partnerRole: j['partnerRole'] as String? ?? '',
        difficulty: j['difficulty'] as String? ?? '',
        icon: j['icon'] as String? ?? '💬',
        initialPrompt: j['initialPrompt'] as String? ?? '',
        initialPinyin: j['initialPinyin'] as String? ?? '',
        initialVi: j['initialVi'] as String? ?? '',
        starters: _starters(j['suggestedStarters']),
      );

  // Starters may be plain strings or objects with a `text` field.
  static List<String> _starters(dynamic v) {
    if (v is! List) return const [];
    return v
        .map((e) => e is String ? e : (e is Map ? (e['text'] ?? '').toString() : ''))
        .where((s) => s.isNotEmpty)
        .toList();
  }
}

class LanguageCurriculum {
  LanguageCurriculum({required this.units, required this.scenarios});
  final List<Unit> units;
  final List<Scenario> scenarios;
}

class Curriculum {
  Curriculum(this._byLang);
  final Map<LangCode, LanguageCurriculum> _byLang;

  LanguageCurriculum of(LangCode lang) => _byLang[lang] ?? _byLang['zh']!;

  static Future<Curriculum> load() async {
    final raw = await rootBundle.loadString('assets/data/curriculum.json');
    final data = jsonDecode(raw) as Map<String, dynamic>;
    return Curriculum({
      for (final lang in const ['zh', 'en'])
        lang: LanguageCurriculum(
          units: ((data[lang] as Map)['units'] as List)
              .map((u) => Unit.fromJson(u as Map<String, dynamic>))
              .toList(),
          scenarios: ((data[lang] as Map)['scenarios'] as List)
              .map((s) => Scenario.fromJson(s as Map<String, dynamic>))
              .toList(),
        ),
    });
  }
}

Color _parseHex(String? hex) {
  if (hex == null) return const Color(0xFF10B981);
  final h = hex.replaceFirst('#', '');
  final v = int.tryParse(h.length == 6 ? 'FF$h' : h, radix: 16);
  return v == null ? const Color(0xFF10B981) : Color(v);
}
