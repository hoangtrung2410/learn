import 'package:flutter/material.dart';

import '../core/api_client.dart';
import '../core/progress_store.dart';
import '../core/theme.dart';
import '../models/curriculum.dart';
import 'chat_list_screen.dart';
import 'dictionary_screen.dart';
import 'learn_screen.dart';
import 'profile_screen.dart';

class HomeShell extends StatefulWidget {
  const HomeShell({
    super.key,
    required this.store,
    required this.curriculum,
    required this.api,
  });

  final ProgressStore store;
  final Curriculum curriculum;
  final ApiClient api;

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    final s = widget.store;
    return ListenableBuilder(
      listenable: s,
      builder: (context, _) {
        final lang = widget.curriculum.of(s.lang);
        final pages = <Widget>[
          LearnScreen(store: s, units: lang.units),
          ChatListScreen(store: s, api: widget.api, scenarios: lang.scenarios),
          DictionaryScreen(store: s, api: widget.api),
          ProfileScreen(store: s),
        ];
        return Scaffold(
          appBar: AppBar(
            titleSpacing: 16,
            title: const Row(
              children: [
                Text('🐼', style: TextStyle(fontSize: 26)),
                SizedBox(width: 8),
                Text('LinguaPulse', style: TextStyle(fontWeight: FontWeight.w900)),
              ],
            ),
            actions: [
              _Chip(icon: Icons.local_fire_department, color: Colors.orange, value: '${s.streak}'),
              const SizedBox(width: 6),
              _Chip(icon: Icons.diamond_outlined, color: kSky, value: '${s.gems}'),
              const SizedBox(width: 6),
              _Chip(icon: Icons.favorite, color: kRose, value: '${s.hearts}'),
              const SizedBox(width: 12),
            ],
          ),
          body: SafeArea(child: IndexedStack(index: _index, children: pages)),
          bottomNavigationBar: NavigationBar(
            selectedIndex: _index,
            onDestinationSelected: (i) => setState(() => _index = i),
            destinations: const [
              NavigationDestination(icon: Icon(Icons.route_outlined), selectedIcon: Icon(Icons.route), label: 'Lộ trình'),
              NavigationDestination(icon: Icon(Icons.forum_outlined), selectedIcon: Icon(Icons.forum), label: 'Hội thoại'),
              NavigationDestination(icon: Icon(Icons.search), selectedIcon: Icon(Icons.manage_search), label: 'Tra cứu'),
              NavigationDestination(icon: Icon(Icons.person_outline), selectedIcon: Icon(Icons.person), label: 'Hồ sơ'),
            ],
          ),
        );
      },
    );
  }
}

class _Chip extends StatelessWidget {
  const _Chip({required this.icon, required this.color, required this.value});
  final IconData icon;
  final Color color;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.14),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.35)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 15, color: color),
          const SizedBox(width: 3),
          Text(value, style: TextStyle(color: color, fontWeight: FontWeight.w800, fontSize: 12)),
        ],
      ),
    );
  }
}
