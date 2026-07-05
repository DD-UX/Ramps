import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * Parse the canonical `--rui-*` values straight out of tokens.css so the
 * validation suite has ZERO hardcoded colours — tokens.css stays the single
 * source of truth. If a token value drifts, both the CSS and this parse move
 * together, and the assertions re-anchor automatically.
 *
 * FILENAME NOTE: this is `rui.fixture.ts` (not `tokens.fixture.ts`) on purpose —
 * graphify's secret-hygiene heuristic silently drops any file whose name reads
 * as a bare "token(s)" word from the knowledge graph. Do not rename it back.
 */
const TOKENS_CSS = fileURLToPath(new URL('../src/tokens/tokens.css', import.meta.url));

function parseRuiTokens(): Record<string, string> {
  const css = readFileSync(TOKENS_CSS, 'utf8');
  const out: Record<string, string> = {};
  const re = /(--rui-[a-z0-9-]+)\s*:\s*([^;]+);/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(css)) !== null) {
    // Strip trailing inline comments and whitespace from the value.
    out[m[1]] = m[2].replace(/\/\*.*?\*\//g, '').trim();
  }
  return out;
}

export const RUI = parseRuiTokens();

/** Normalise a CSS colour to a comparable `rgb(...)`/lowercased-hex-ish string. */
export function hexToRgb(hex: string): string {
  const h = hex.replace('#', '').trim();
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgb(${r}, ${g}, ${b})`;
}
