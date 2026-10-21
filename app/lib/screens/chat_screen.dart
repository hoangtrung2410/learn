import 'package:flutter/material.dart';

import '../core/api_client.dart';
import '../core/progress_store.dart';
import '../core/speaker.dart';
import '../core/theme.dart';
import '../models/curriculum.dart';

class _Message {
  _Message({required this.fromUser, required this.text, this.phonetic = '', this.translation = '', this.tip});
  final bool fromUser;
  final String text;
  final String phonetic;
  final String translation;
  final String? tip;
}

class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key, required this.store, required this.api, required this.scenario});

  final ProgressStore store;
  final ApiClient api;
  final Scenario scenario;

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final _input = TextEditingController();
  final _scroll = ScrollController();
  final List<_Message> _messages = [];
  List<String> _suggestions = [];
  bool _sending = false;
  String? _error;

  String get _lang => widget.store.lang;

  @override
  void initState() {
    super.initState();
    final s = widget.scenario;
    _messages.add(_Message(
      fromUser: false,
      text: s.initialPrompt,
      phonetic: s.initialPinyin,
      translation: s.initialVi,
    ));
    _suggestions = s.starters;
  }

  @override
  void dispose() {
    _input.dispose();
    _scroll.dispose();
    super.dispose();
  }

  void _scrollToEnd() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scroll.hasClients) {
        _scroll.animateTo(
          _scroll.position.maxScrollExtent,
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _send([String? preset]) async {
    final text = (preset ?? _input.text).trim();
    if (text.isEmpty || _sending) return;
    _input.clear();
    setState(() {
      _messages.add(_Message(fromUser: true, text: text));
      _sending = true;
      _error = null;
      _suggestions = [];
    });
    _scrollToEnd();

    try {
      final history = [
        for (final m in _messages) (role: m.fromUser ? 'user' : 'assistant', content: m.text),
      ];
      final reply = await widget.api.conversation(
        lang: _lang,
        scenarioTitle: widget.scenario.title,
        scenarioRole: widget.scenario.partnerRole,
        history: history,
        userMessage: text,
      );
      if (!mounted) return;
      setState(() {
        _messages.add(_Message(
          fromUser: false,
          text: reply.text,
          phonetic: reply.phonetic,
          translation: reply.translation,
          tip: reply.tip,
        ));
        _suggestions = reply.suggestions.map((e) => e.text).toList();
      });
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _sending = false);
      _scrollToEnd();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(widget.scenario.title,
                maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800)),
            Text(widget.scenario.partnerRole,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(fontSize: 11.5, color: Colors.white.withValues(alpha: 0.6))),
          ],
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: ListView(
                controller: _scroll,
                padding: const EdgeInsets.all(16),
                children: [
                  for (final m in _messages) _Bubble(message: m, lang: _lang),
                  if (_sending)
                    const Padding(
                      padding: EdgeInsets.all(8),
                      child: Align(
                        alignment: Alignment.centerLeft,
                        child: SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2.5)),
                      ),
                    ),
                  if (_error != null)
                    Container(
                      margin: const EdgeInsets.only(top: 8),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: kRose.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Text(_error!, style: const TextStyle(fontSize: 13)),
                    ),
                ],
              ),
            ),
            if (_suggestions.isNotEmpty)
              SizedBox(
                height: 46,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: _suggestions.length,
                  separatorBuilder: (_, _) => const SizedBox(width: 8),
                  itemBuilder: (_, i) => ActionChip(
                    label: ConstrainedBox(
                      constraints: const BoxConstraints(maxWidth: 240),
                      child: Text(_suggestions[i], maxLines: 1, overflow: TextOverflow.ellipsis),
                    ),
                    onPressed: () => _send(_suggestions[i]),
                  ),
                ),
              ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _input,
                      minLines: 1,
                      maxLines: 3,
                      textInputAction: TextInputAction.send,
                      onSubmitted: (_) => _send(),
                      decoration: InputDecoration(
                        hintText: _lang == 'zh' ? 'Nhập tiếng Trung hoặc tiếng Việt…' : 'Type English or Vietnamese…',
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton.filled(
                    onPressed: _sending ? null : _send,
                    icon: const Icon(Icons.send_rounded),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Bubble extends StatefulWidget {
  const _Bubble({required this.message, required this.lang});
  final _Message message;
  final String lang;

  @override
  State<_Bubble> createState() => _BubbleState();
}

class _BubbleState extends State<_Bubble> {
  bool _showTranslation = false;

  @override
  Widget build(BuildContext context) {
    final m = widget.message;
    final width = MediaQuery.sizeOf(context).width * 0.82;
    return Align(
      alignment: m.fromUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        constraints: BoxConstraints(maxWidth: width),
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: m.fromUser ? kEmerald.withValues(alpha: 0.85) : kSurfaceHigh,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(18),
            topRight: const Radius.circular(18),
            bottomLeft: Radius.circular(m.fromUser ? 18 : 4),
            bottomRight: Radius.circular(m.fromUser ? 4 : 18),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(m.text,
                style: TextStyle(
                  fontSize: 16,
                  height: 1.35,
                  fontWeight: FontWeight.w600,
                  color: m.fromUser ? const Color(0xFF04120C) : Colors.white,
                )),
            if (!m.fromUser && m.phonetic.isNotEmpty) ...[
              const SizedBox(height: 6),
              Text(m.phonetic, style: const TextStyle(fontSize: 12.5, color: kSky)),
            ],
            if (!m.fromUser) ...[
              const SizedBox(height: 6),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  InkWell(
                    onTap: () => Speaker.instance.speak(m.text, widget.lang),
                    child: const Padding(
                      padding: EdgeInsets.all(4),
                      child: Icon(Icons.volume_up, size: 20),
                    ),
                  ),
                  if (m.translation.isNotEmpty) ...[
                    const SizedBox(width: 6),
                    InkWell(
                      onTap: () => setState(() => _showTranslation = !_showTranslation),
                      child: Padding(
                        padding: const EdgeInsets.all(4),
                        child: Text(_showTranslation ? 'Ẩn nghĩa' : 'Xem nghĩa',
                            style: const TextStyle(fontSize: 12, color: kAmber, fontWeight: FontWeight.w700)),
                      ),
                    ),
                  ],
                ],
              ),
              if (_showTranslation)
                Text(m.translation, style: TextStyle(fontSize: 13, color: Colors.white.withValues(alpha: 0.85))),
              if (m.tip != null && m.tip!.isNotEmpty) ...[
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: kAmber.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text('💡 ${m.tip}', style: const TextStyle(fontSize: 12.5)),
                ),
              ],
            ],
          ],
        ),
      ),
    );
  }
}
