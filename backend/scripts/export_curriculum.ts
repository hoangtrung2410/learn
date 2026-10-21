// Exports the curriculum used by the React frontend to JSON for the Flutter app.
// Usage (from backend/): node node_modules/tsx/dist/cli.mjs scripts/export_curriculum.ts <outFile>
import fs from 'node:fs';
import {
  CHINESE_UNITS,
  ENGLISH_UNITS,
  CHINESE_ROLEPLAY_SCENARIOS,
  ENGLISH_ROLEPLAY_SCENARIOS,
} from '../../frontend/src/data/curriculum.ts';

const out = process.argv[2] ?? 'curriculum.json';
fs.writeFileSync(
  out,
  JSON.stringify({
    zh: { units: CHINESE_UNITS, scenarios: CHINESE_ROLEPLAY_SCENARIOS },
    en: { units: ENGLISH_UNITS, scenarios: ENGLISH_ROLEPLAY_SCENARIOS },
  }),
);
console.log(`wrote ${out}`);
