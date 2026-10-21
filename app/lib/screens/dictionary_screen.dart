import 'package:flutter/material.dart';

import '../core/api_client.dart';
import '../core/progress_store.dart';
import '../core/speaker.dart';
import '../core/theme.dart';

class DictionaryScreen extends StatefulWidget {
  const DictionaryScreen({super.key, required this.store, required this.api});

  final ProgressStore store;
  final ApiClient api;

  @override
  State<DictionaryScreen> createState() => _DictionaryScreenState();
}

class _DictionaryScreenState extends State<DictionaryScreen> {
  final _controller = TextEditingController();
  WordExplanation? _result;
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _search() async {
    final q = _controller.text.trim();
    if (q.isEmpty || _loading) return;
    FocusScope.of(context).unfocus();
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final r = await widget.api.explain(q, widget.store.lang);
      if (mounted) setState(() => _result = r);
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final r = _result;
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
      children: [
        const Text('Tra cứu từ vựng', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900)),
        const SizedBox(height: 12),
        TextField(
          controller: _controller,
          textInputAction: TextInputAction.search,
          onSubmitted: (_) => _search(),
          decoration: InputDecoration(
            hintText: widget.store.lang == 'zh' ? 'Nhập chữ Hán, pinyin hoặc nghĩa tiếng Việt' : 'Nhập từ tiếng Anh',
            suffixIcon: IconButton(icon: const Icon(Icons.search), onPressed: _search),
          ),
        ),
        const SizedBox(height: 16),
        if (_loading)
          const Padding(padding: EdgeInsets.all(32), child: Center(child: CircularProgressIndicator()))
        else if (_error != null)
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(color: kRose.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(14)),
            child: Text(_error!),
          )
        else if (r == null)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 40),
            child: Column(children: [
              const Text('📖', style: TextStyle(fontSize: 52)),
              const SizedBox(height: 8),
              Text('AI sẽ giải nghĩa, cách nhớ và ví dụ cho bạn.',
                  textAlign: TextAlign.center, style: TextStyle(color: Colors.white.withValues(alpha: 0.6))),
            ]),
          )
        else
          _ResultView(result: r, lang: widget.store.lang),
      ],
    );
  }
}

class _ResultView extends StatelessWidget {
  const _ResultView({required this.result, required this.lang});
  final WordExplanation result;
  final String lang;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(18),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(result.title, style: const TextStyle(fontSize: 30, fontWeight: FontWeight.w900)),
                      if (result.phonetic.isNotEmpty)
                        Text(result.phonetic, style: const TextStyle(color: kSky, fontSize: 15)),
                      if (result.level.isNotEmpty)
                        Padding(
                          padding: const EdgeInsets.only(top: 6),
                          child: Text(result.level,
                              style: const TextStyle(color: kAmber, fontWeight: FontWeight.w800, fontSize: 12)),
                        ),
                    ],
                  ),
                ),
                IconButton.filledTonal(
                  onPressed: () => Speaker.instance.speak(result.title, lang),
                  icon: const Icon(Icons.volume_up),
                ),
              ],
            ),
          ),
        ),
        _Section(title: 'Nghĩa', body: result.meaning, color: kEmerald),
        _Section(title: lang == 'zh' ? 'Cấu tạo / Bộ thủ' : 'Nguồn gốc', body: result.origin, color: kAmber),
        _Section(title: 'Mẹo nhớ', body: result.memoryTrick, color: kEmerald),
        if (result.examples.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(top: 12),
            child: Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Ví dụ', style: TextStyle(fontWeight: FontWeight.w900, color: kSky)),
                    for (final e in result.examples) ...[
                      const SizedBox(height: 12),
                      Text((e['sentence'] ?? '').toString(),
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                      Text((e['phonetic'] ?? '').toString(), style: const TextStyle(color: kSky, fontSize: 12.5)),
                      Text((e['translation'] ?? '').toString(),
                          style: TextStyle(color: Colors.white.withValues(alpha: 0.7), fontSize: 13)),
                    ],
                  ],
                ),
              ),
            ),
          ),
        _Section(title: 'Lỗi người Việt hay mắc', body: result.commonMistakes, color: kRose),
        _Section(title: 'Lưu ý khi dùng', body: result.usageNotes, color: kSky),
      ],
    );
  }
}

class _Section extends StatelessWidget {
  const _Section({required this.title, required this.body, required this.color});
  final String title;
  final String body;
  final Color color;

  @override
  Widget build(BuildContext context) {
    if (body.trim().isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(top: 12),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: color.withValues(alpha: 0.3)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: TextStyle(fontWeight: FontWeight.w900, color: color)),
            const SizedBox(height: 6),
            Text(body, style: const TextStyle(height: 1.4)),
          ],
        ),
      ),
    );
  }
}
