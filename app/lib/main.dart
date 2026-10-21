import 'package:flutter/material.dart';

import 'core/api_client.dart';
import 'core/progress_store.dart';
import 'core/theme.dart';
import 'models/curriculum.dart';
import 'screens/home_shell.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final store = await ProgressStore.load();
  final curriculum = await Curriculum.load();
  runApp(LinguaPulseApp(store: store, curriculum: curriculum, api: ApiClient()));
}

class LinguaPulseApp extends StatelessWidget {
  const LinguaPulseApp({
    super.key,
    required this.store,
    required this.curriculum,
    required this.api,
  });

  final ProgressStore store;
  final Curriculum curriculum;
  final ApiClient api;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'LinguaPulse',
      debugShowCheckedModeBanner: false,
      theme: buildTheme(),
      home: HomeShell(store: store, curriculum: curriculum, api: api),
    );
  }
}
