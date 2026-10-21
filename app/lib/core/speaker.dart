import 'package:flutter_tts/flutter_tts.dart';

/// Text-to-speech using the device voice (works offline, no API key).
class Speaker {
  Speaker._();
  static final Speaker instance = Speaker._();

  final FlutterTts _tts = FlutterTts();
  bool _ready = false;

  Future<void> speak(String text, String lang) async {
    if (text.trim().isEmpty) return;
    try {
      if (!_ready) {
        await _tts.setSpeechRate(0.45);
        _ready = true;
      }
      await _tts.setLanguage(lang == 'zh' ? 'zh-CN' : 'en-US');
      await _tts.stop();
      await _tts.speak(text);
    } catch (_) {
      // Missing voice on this device: stay silent instead of crashing.
    }
  }
}
