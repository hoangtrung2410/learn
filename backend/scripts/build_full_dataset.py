#!/usr/bin/env python3
import json
import os
import sys

# Import all parts
sys.path.insert(0, os.path.dirname(__file__))
from topics_part1 import part1_words
from topics_part2 import part2_words
from topics_part3 import part3_words
from topics_part4 import part4_words
from topics_part5 import part5_words

all_raw = part1_words + part2_words + part3_words + part4_words + part5_words

print(f"Total raw items loaded: {len(all_raw)}")
assert len(all_raw) == 1000, f"Expected 1000 items, got {len(all_raw)}"

# Build structured EnglishVocabItem list
items = []
for idx, item in enumerate(all_raw, 1):
    word, ipa, pos, level, topic, meaning_vi, collocation, example_en, example_vi = item
    items.append({
        "id": f"en-{idx}",
        "word": word,
        "ipa": ipa,
        "partOfSpeech": pos,
        "level": level,
        "topic": topic,
        "meaningVi": meaning_vi,
        "collocation": collocation,
        "exampleEn": example_en,
        "exampleVi": example_vi
    })

target_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../frontend/src/data/englishVocab1000Data.ts'))

ts_content = """export interface EnglishVocabItem {
  id: string;
  word: string;
  ipa: string;
  partOfSpeech: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
  topic: string;
  meaningVi: string;
  collocation: string;
  exampleEn: string;
  exampleVi: string;
}

export const ENGLISH_VOCABULARY_1000: EnglishVocabItem[] = """ + json.dumps(items, ensure_ascii=False, indent=2) + ";\n"

with open(target_path, "w", encoding="utf-8") as f:
    f.write(ts_content)

print(f"Successfully wrote {len(items)} items to {target_path} (size: {os.path.getsize(target_path)} bytes)")
