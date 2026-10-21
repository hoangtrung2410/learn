import 'package:flutter/material.dart';

import '../core/config.dart';
import '../core/progress_store.dart';
import '../core/theme.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key, required this.store});

  final ProgressStore store;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
      children: [
        const Text('Hồ sơ học tập', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900)),
        const SizedBox(height: 14),
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: 1.7,
          children: [
            _Stat(icon: Icons.bolt, label: 'Tổng XP', value: '${store.xp}', color: kAmber),
            _Stat(icon: Icons.local_fire_department, label: 'Chuỗi ngày', value: '${store.streak}', color: Colors.orange),
            _Stat(icon: Icons.diamond_outlined, label: 'Kim cương', value: '${store.gems}', color: kSky),
            _Stat(icon: Icons.task_alt, label: 'Bài đã học', value: '${store.completed.length}', color: kEmerald),
          ],
        ),
        const SizedBox(height: 20),
        const Text('Ngôn ngữ đang học', style: TextStyle(fontWeight: FontWeight.w800)),
        const SizedBox(height: 8),
        SegmentedButton<String>(
          segments: const [
            ButtonSegment(value: 'zh', label: Text('🇨🇳 Tiếng Trung')),
            ButtonSegment(value: 'en', label: Text('🇬🇧 Tiếng Anh')),
          ],
          selected: {store.lang},
          onSelectionChanged: (s) => store.setLang(s.first),
        ),
        const SizedBox(height: 24),
        Card(
          child: ListTile(
            leading: const Icon(Icons.dns_outlined),
            title: const Text('Máy chủ API'),
            subtitle: Text(apiBase),
          ),
        ),
        const SizedBox(height: 12),
        OutlinedButton.icon(
          onPressed: () async {
            final ok = await showDialog<bool>(
              context: context,
              builder: (ctx) => AlertDialog(
                title: const Text('Đặt lại tiến độ?'),
                content: const Text('XP, chuỗi ngày và bài đã học sẽ về mặc định.'),
                actions: [
                  TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Hủy')),
                  TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Đặt lại')),
                ],
              ),
            );
            if (ok == true) store.reset();
          },
          icon: const Icon(Icons.restart_alt),
          label: const Text('Đặt lại tiến độ'),
        ),
      ],
    );
  }
}

class _Stat extends StatelessWidget {
  const _Stat({required this.icon, required this.label, required this.value, required this.color});
  final IconData icon;
  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, color: color, size: 22),
          const Spacer(),
          Text(value, style: TextStyle(color: color, fontSize: 22, fontWeight: FontWeight.w900)),
          Text(label, style: const TextStyle(fontSize: 12)),
        ],
      ),
    );
  }
}
