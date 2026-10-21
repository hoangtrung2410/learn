import 'package:flutter/foundation.dart';

const _envApiUrl = String.fromEnvironment('API_URL');

/// Backend base URL. Override with `--dart-define=API_URL=http://<ip>:3000`
/// (needed on a physical phone: use your computer's LAN IP).
String get apiBase {
  if (_envApiUrl.isNotEmpty) return _envApiUrl;
  // The Android emulator reaches the host machine through 10.0.2.2.
  if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) {
    return 'http://10.0.2.2:3000';
  }
  return 'http://localhost:3000';
}
