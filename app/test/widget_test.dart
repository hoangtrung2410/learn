import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:linguapulse_app/models/curriculum.dart';

void main() {
  test('curriculum asset parses for both languages', () async {
    TestWidgetsFlutterBinding.ensureInitialized();
    final c = await Curriculum.load();
    for (final lang in ['zh', 'en']) {
      final l = c.of(lang);
      expect(l.units, isNotEmpty);
      expect(l.scenarios, isNotEmpty);
      for (final u in l.units) {
        for (final lesson in u.lessons) {
          expect(lesson.questions, isNotEmpty, reason: lesson.id);
          for (final q in lesson.questions) {
            expect(q.correct, isNotEmpty, reason: q.id);
            if (q.type != 'speak-sentence' && q.type != 'reorder-words') {
              expect(q.options, contains(q.correct.first), reason: '${lesson.id}/${q.id}');
            }
          }
        }
      }
    }
  });

  test('asset file exists', () {
    expect(File('assets/data/curriculum.json').existsSync(), isTrue);
  });
}
