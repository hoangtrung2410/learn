import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Learner progress (XP, streak, gems, hearts, completed lessons) persisted locally.
class ProgressStore extends ChangeNotifier {
  ProgressStore._(this._prefs);

  static const _key = 'linguapulse_progress_v1';
  static const maxHearts = 5;

  final SharedPreferences _prefs;

  String lang = 'zh';
  int xp = 250;
  int streak = 7;
  int gems = 850;
  int hearts = maxHearts;
  final Set<String> completed = {'zh-u1-l1'};

  static Future<ProgressStore> load() async {
    final store = ProgressStore._(await SharedPreferences.getInstance());
    final raw = store._prefs.getString(_key);
    if (raw != null) {
      try {
        final j = jsonDecode(raw) as Map<String, dynamic>;
        store
          ..lang = j['lang'] as String? ?? 'zh'
          ..xp = j['xp'] as int? ?? store.xp
          ..streak = j['streak'] as int? ?? store.streak
          ..gems = j['gems'] as int? ?? store.gems
          ..hearts = j['hearts'] as int? ?? maxHearts
          ..completed.addAll((j['completed'] as List? ?? const []).cast<String>());
      } catch (_) {
        // Corrupt data: keep defaults.
      }
    }
    return store;
  }

  void _save() {
    notifyListeners();
    _prefs.setString(
      _key,
      jsonEncode({
        'lang': lang,
        'xp': xp,
        'streak': streak,
        'gems': gems,
        'hearts': hearts,
        'completed': completed.toList(),
      }),
    );
  }

  bool isDone(String lessonId) => completed.contains(lessonId);

  void setLang(String value) {
    lang = value;
    _save();
  }

  void loseHeart() {
    if (hearts > 0) hearts--;
    _save();
  }

  void refillHearts() {
    hearts = maxHearts;
    _save();
  }

  void finishLesson(String lessonId, int earnedXp) {
    xp += earnedXp;
    gems += 15;
    if (completed.add(lessonId)) streak++;
    _save();
  }

  void reset() {
    lang = 'zh';
    xp = 250;
    streak = 7;
    gems = 850;
    hearts = maxHearts;
    completed
      ..clear()
      ..add('zh-u1-l1');
    _save();
  }
}
