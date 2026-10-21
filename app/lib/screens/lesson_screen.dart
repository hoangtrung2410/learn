import 'package:flutter/material.dart';

import '../core/progress_store.dart';
import '../core/speaker.dart';
import '../core/theme.dart';
import '../models/curriculum.dart';

class LessonScreen extends StatefulWidget {
  const LessonScreen({super.key, required this.lesson, required this.store});

  final Lesson lesson;
  final ProgressStore store;

  @override
  State<LessonScreen> createState() => _LessonScreenState();
}

class _LessonScreenState extends State<LessonScreen> {
  int _index = 0;
  int _correctCount = 0;
  String? _selected; // option questions
  final List<String> _built = []; // reorder questions
  bool _checked = false;
  bool _isCorrect = false;
  bool _finished = false;

  Question get _q => widget.lesson.questions[_index];
  String get _lang => widget.store.lang;
  bool get _isReorder => _q.type == 'reorder-words';
  bool get _isSpeak => _q.type == 'speak-sentence';

  bool get _canCheck {
    if (_checked) return false;
    if (_isSpeak) return true;
    if (_isReorder) return _built.isNotEmpty;
    return _selected != null;
  }

  void _check() {
    final q = _q;
    final bool ok;
    if (_isSpeak) {
      ok = true; // self-assessed speaking practice
    } else if (_isReorder) {
      // English answers are a whole sentence, Chinese a word list: ignore spaces.
      String norm(Iterable<String> parts) => parts.join().replaceAll(RegExp(r'\s+'), '');
      ok = norm(_built) == norm(q.correct);
    } else {
      ok = _selected == q.correct.first;
    }
    if (!ok) widget.store.loseHeart();
    setState(() {
      _checked = true;
      _isCorrect = ok;
      if (ok) _correctCount++;
    });
  }

  void _next() {
    if (widget.store.hearts == 0 && !_isCorrect) {
      _showOutOfHearts();
      return;
    }
    if (_index + 1 >= widget.lesson.questions.length) {
      widget.store.finishLesson(widget.lesson.id, widget.lesson.xp);
      setState(() => _finished = true);
      return;
    }
    setState(() {
      _index++;
      _selected = null;
      _built.clear();
      _checked = false;
      _isCorrect = false;
    });
  }

  Future<void> _showOutOfHearts() async {
    final refill = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Hết tim rồi 💔'),
        content: const Text('Bạn đã dùng hết tim. Nạp lại tim để tiếp tục học nhé.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Thoát')),
          FilledButton(
            style: FilledButton.styleFrom(minimumSize: const Size(110, 44)),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Nạp tim'),
          ),
        ],
      ),
    );
    if (!mounted) return;
    if (refill == true) {
      widget.store.refillHearts();
      setState(() {
        _selected = null;
        _built.clear();
        _checked = false;
      });
    } else {
      Navigator.of(context).pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_finished) return _ResultView(lesson: widget.lesson, correct: _correctCount);
    final total = widget.lesson.questions.length;
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context)),
        title: ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: LinearProgressIndicator(
            value: (_index + (_checked ? 1 : 0)) / total,
            minHeight: 12,
            color: kEmerald,
            backgroundColor: kSurfaceHigh,
          ),
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: Row(children: [
              const Icon(Icons.favorite, color: kRose, size: 18),
              const SizedBox(width: 4),
              Text('${widget.store.hearts}', style: const TextStyle(fontWeight: FontWeight.w800)),
            ]),
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: ListView(
                padding: const EdgeInsets.all(20),
                children: [
                  Text(_q.promptVi, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w800)),
                  const SizedBox(height: 16),
                  _PromptCard(question: _q, lang: _lang),
                  const SizedBox(height: 20),
                  if (_isSpeak)
                    const _SpeakHint()
                  else if (_isReorder)
                    _ReorderArea(
                      question: _q,
                      built: _built,
                      locked: _checked,
                      onChanged: () => setState(() {}),
                    )
                  else
                    for (final option in _q.options)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: _OptionTile(
                          text: option,
                          selected: _selected == option,
                          state: !_checked
                              ? null
                              : option == _q.correct.first
                                  ? true
                                  : (option == _selected ? false : null),
                          onTap: _checked ? null : () => setState(() => _selected = option),
                        ),
                      ),
                ],
              ),
            ),
            _BottomBar(
              checked: _checked,
              isCorrect: _isCorrect,
              explanation: _q.explanation,
              answer: _isReorder ? _q.correct.join(' ') : _q.correct.first,
              showAnswer: !_isSpeak,
              canCheck: _canCheck,
              isLast: _index + 1 >= total,
              onCheck: _check,
              onNext: _next,
              checkLabel: _isSpeak ? 'Tôi đã đọc xong' : 'Kiểm tra',
            ),
          ],
        ),
      ),
    );
  }
}

class _PromptCard extends StatelessWidget {
  const _PromptCard({required this.question, required this.lang});
  final Question question;
  final String lang;

  @override
  Widget build(BuildContext context) {
    final q = question;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Row(
          children: [
            IconButton.filledTonal(
              onPressed: () => Speaker.instance.speak(q.audioText, lang),
              icon: const Icon(Icons.volume_up),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(q.prompt, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
                  if (q.promptPinyin != null) ...[
                    const SizedBox(height: 4),
                    Text(q.promptPinyin!,
                        style: const TextStyle(color: kSky, fontWeight: FontWeight.w600)),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SpeakHint extends StatelessWidget {
  const _SpeakHint();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: kSurfaceHigh,
        borderRadius: BorderRadius.circular(16),
      ),
      child: const Row(
        children: [
          Icon(Icons.mic_none, color: kEmerald),
          SizedBox(width: 12),
          Expanded(
            child: Text(
              'Nhấn loa để nghe mẫu, đọc to câu trên vài lần rồi bấm "Tôi đã đọc xong".',
              style: TextStyle(fontSize: 13.5),
            ),
          ),
        ],
      ),
    );
  }
}

class _OptionTile extends StatelessWidget {
  const _OptionTile({required this.text, required this.selected, required this.state, required this.onTap});
  final String text;
  final bool selected;
  final bool? state; // true = correct answer, false = wrong pick, null = neutral
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final color = state == true
        ? kEmerald
        : state == false
            ? kRose
            : (selected ? kSky : Colors.white24);
    return Material(
      color: color.withValues(alpha: state != null || selected ? 0.14 : 0),
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: color, width: 1.6),
          ),
          child: Text(text, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
        ),
      ),
    );
  }
}

class _ReorderArea extends StatelessWidget {
  const _ReorderArea({
    required this.question,
    required this.built,
    required this.locked,
    required this.onChanged,
  });
  final Question question;
  final List<String> built;
  final bool locked;
  final VoidCallback onChanged;

  @override
  Widget build(BuildContext context) {
    // Remaining pool = options minus already placed (handles duplicates).
    final pool = [...question.options];
    for (final b in built) {
      pool.remove(b);
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: double.infinity,
          constraints: const BoxConstraints(minHeight: 72),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: kSurfaceHigh,
            borderRadius: BorderRadius.circular(16),
          ),
          child: Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (var i = 0; i < built.length; i++)
                ActionChip(
                  label: Text(built[i], style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                  onPressed: locked
                      ? null
                      : () {
                          built.removeAt(i);
                          onChanged();
                        },
                ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            for (final w in pool)
              ActionChip(
                backgroundColor: kEmerald.withValues(alpha: 0.18),
                label: Text(w, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                onPressed: locked
                    ? null
                    : () {
                        built.add(w);
                        onChanged();
                      },
              ),
          ],
        ),
      ],
    );
  }
}

class _BottomBar extends StatelessWidget {
  const _BottomBar({
    required this.checked,
    required this.isCorrect,
    required this.explanation,
    required this.answer,
    required this.showAnswer,
    required this.canCheck,
    required this.isLast,
    required this.onCheck,
    required this.onNext,
    required this.checkLabel,
  });

  final bool checked;
  final bool isCorrect;
  final String? explanation;
  final String answer;
  final bool showAnswer;
  final bool canCheck;
  final bool isLast;
  final VoidCallback onCheck;
  final VoidCallback onNext;
  final String checkLabel;

  @override
  Widget build(BuildContext context) {
    final color = isCorrect ? kEmerald : kRose;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(20, 14, 20, 16),
      decoration: BoxDecoration(
        color: checked ? color.withValues(alpha: 0.12) : const Color(0xFF0B1220),
        border: Border(top: BorderSide(color: Colors.white.withValues(alpha: 0.06))),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (checked) ...[
            Text(
              isCorrect ? 'Chính xác! 🎉' : 'Chưa đúng rồi',
              style: TextStyle(color: color, fontWeight: FontWeight.w900, fontSize: 17),
            ),
            if (!isCorrect && showAnswer)
              Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Text('Đáp án: $answer', style: const TextStyle(fontWeight: FontWeight.w700)),
              ),
            if (explanation != null && explanation!.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 6),
                child: Text(explanation!,
                    style: TextStyle(fontSize: 12.5, color: Colors.white.withValues(alpha: 0.8))),
              ),
            const SizedBox(height: 12),
          ],
          FilledButton(
            style: checked ? FilledButton.styleFrom(backgroundColor: color) : null,
            onPressed: checked ? onNext : (canCheck ? onCheck : null),
            child: Text(checked ? (isLast ? 'Hoàn thành' : 'Tiếp tục') : checkLabel),
          ),
        ],
      ),
    );
  }
}

class _ResultView extends StatelessWidget {
  const _ResultView({required this.lesson, required this.correct});
  final Lesson lesson;
  final int correct;

  @override
  Widget build(BuildContext context) {
    final total = lesson.questions.length;
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text('🏆', style: TextStyle(fontSize: 84)),
              const SizedBox(height: 12),
              const Text('Hoàn thành bài học!',
                  style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900)),
              const SizedBox(height: 6),
              Text(lesson.title, textAlign: TextAlign.center),
              const SizedBox(height: 24),
              Wrap(
                spacing: 12,
                runSpacing: 12,
                alignment: WrapAlignment.center,
                children: [
                  _Stat(label: 'XP', value: '+${lesson.xp}', color: kAmber),
                  _Stat(label: 'Kim cương', value: '+15', color: kSky),
                  _Stat(label: 'Đúng', value: '$correct/$total', color: kEmerald),
                ],
              ),
              const SizedBox(height: 32),
              FilledButton(onPressed: () => Navigator.pop(context), child: const Text('Về lộ trình')),
            ],
          ),
        ),
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  const _Stat({required this.label, required this.value, required this.color});
  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 100,
      padding: const EdgeInsets.symmetric(vertical: 14),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withValues(alpha: 0.4)),
      ),
      child: Column(children: [
        Text(value, style: TextStyle(color: color, fontSize: 20, fontWeight: FontWeight.w900)),
        const SizedBox(height: 2),
        Text(label, style: const TextStyle(fontSize: 11.5)),
      ]),
    );
  }
}
