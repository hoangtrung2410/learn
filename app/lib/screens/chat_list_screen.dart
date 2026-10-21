import 'package:flutter/material.dart';

import '../core/api_client.dart';
import '../core/progress_store.dart';
import '../core/theme.dart';
import '../models/curriculum.dart';
import 'chat_screen.dart';

class ChatListScreen extends StatelessWidget {
  const ChatListScreen({
    super.key,
    required this.store,
    required this.api,
    required this.scenarios,
  });

  final ProgressStore store;
  final ApiClient api;
  final List<Scenario> scenarios;

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
      itemCount: scenarios.length + 1,
      separatorBuilder: (_, _) => const SizedBox(height: 10),
      itemBuilder: (context, i) {
        if (i == 0) {
          return const Padding(
            padding: EdgeInsets.only(bottom: 4),
            child: Text('Hội thoại cùng AI',
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900)),
          );
        }
        final s = scenarios[i - 1];
        return Card(
          child: InkWell(
            borderRadius: BorderRadius.circular(20),
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute(
                builder: (_) => ChatScreen(store: store, api: api, scenario: s),
              ),
            ),
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Row(
                children: [
                  Container(
                    width: 50,
                    height: 50,
                    decoration: BoxDecoration(
                      color: kEmerald.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    alignment: Alignment.center,
                    child: Text(s.icon, style: const TextStyle(fontSize: 26)),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(s.title,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14.5)),
                        const SizedBox(height: 3),
                        Text(s.partnerRole,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(fontSize: 12, color: Colors.white.withValues(alpha: 0.6))),
                      ],
                    ),
                  ),
                  if (s.difficulty.isNotEmpty)
                    Text(s.difficulty,
                        style: const TextStyle(fontSize: 11, color: kAmber, fontWeight: FontWeight.w700)),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}
