import 'package:flutter/material.dart';

import '../core/progress_store.dart';
import '../core/theme.dart';
import '../models/curriculum.dart';
import 'lesson_screen.dart';

class LearnScreen extends StatelessWidget {
  const LearnScreen({super.key, required this.store, required this.units});

  final ProgressStore store;
  final List<Unit> units;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
      children: [
        _Banner(lang: store.lang),
        for (final unit in units) ...[
          const SizedBox(height: 24),
          _UnitHeader(unit: unit),
          const SizedBox(height: 12),
          _LessonPath(unit: unit, store: store),
        ],
      ],
    );
  }
}

class _Banner extends StatelessWidget {
  const _Banner({required this.lang});
  final String lang;

  @override
  Widget build(BuildContext context) {
    final zh = lang == 'zh';
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: const LinearGradient(colors: [Color(0xFF064E3B), Color(0xFF0C4A6E)]),
        borderRadius: BorderRadius.circular(24),
      ),
      child: Row(
        children: [
          const Text('🐼', style: TextStyle(fontSize: 44)),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  zh ? 'Lộ trình Tiếng Trung HSK 3.0' : 'Lộ trình Tiếng Anh giao tiếp',
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900),
                ),
                const SizedBox(height: 4),
                Text(
                  zh
                      ? 'Chinh phục từng cửa ải, học phát âm và hội thoại cùng trợ lý AI.'
                      : 'Luyện từ vựng, nối âm và phản xạ nói 1-1 với trợ lý AI.',
                  style: TextStyle(fontSize: 12.5, color: Colors.white.withValues(alpha: 0.75)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _UnitHeader extends StatelessWidget {
  const _UnitHeader({required this.unit});
  final Unit unit;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: unit.color, borderRadius: BorderRadius.circular(22)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Wrap(
            spacing: 8,
            runSpacing: 4,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.22),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text('CỬA ẢI ${unit.number}',
                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w900)),
              ),
              Text(unit.badge, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
            ],
          ),
          const SizedBox(height: 6),
          Text(unit.title, style: const TextStyle(fontSize: 19, fontWeight: FontWeight.w900)),
          const SizedBox(height: 2),
          Text(unit.description,
              style: TextStyle(fontSize: 12.5, color: Colors.white.withValues(alpha: 0.85))),
        ],
      ),
    );
  }
}

class _LessonPath extends StatelessWidget {
  const _LessonPath({required this.unit, required this.store});
  final Unit unit;
  final ProgressStore store;

  // Winding path: centre -> right -> centre -> left.
  static const _offsets = [0.0, 40.0, 0.0, -40.0];

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        for (var i = 0; i < unit.lessons.length; i++)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 10),
            child: Transform.translate(
              offset: Offset(_offsets[i % _offsets.length], 0),
              child: _LessonNode(lesson: unit.lessons[i], store: store),
            ),
          ),
      ],
    );
  }
}

class _LessonNode extends StatelessWidget {
  const _LessonNode({required this.lesson, required this.store});
  final Lesson lesson;
  final ProgressStore store;

  @override
  Widget build(BuildContext context) {
    final done = store.isDone(lesson.id);
    final color = done ? kAmber : kEmerald;
    return GestureDetector(
      onTap: () => Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => LessonScreen(lesson: lesson, store: store)),
      ),
      child: SizedBox(
        width: 230,
        child: Column(
          children: [
            Stack(
              clipBehavior: Clip.none,
              children: [
                Container(
                  width: 78,
                  height: 78,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: color,
                    boxShadow: [BoxShadow(color: color.withValues(alpha: 0.35), blurRadius: 18, offset: const Offset(0, 6))],
                  ),
                  alignment: Alignment.center,
                  child: Text(lesson.icon, style: const TextStyle(fontSize: 34)),
                ),
                if (done)
                  const Positioned(
                    top: -2,
                    right: -2,
                    child: CircleAvatar(
                      radius: 12,
                      backgroundColor: kEmerald,
                      child: Icon(Icons.check, size: 15, color: Colors.white),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 8),
            Text(lesson.title,
                maxLines: 2,
                textAlign: TextAlign.center,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13.5)),
            const SizedBox(height: 2),
            Text('+${lesson.xp} XP',
                style: const TextStyle(color: kAmber, fontWeight: FontWeight.w800, fontSize: 11.5)),
          ],
        ),
      ),
    );
  }
}
