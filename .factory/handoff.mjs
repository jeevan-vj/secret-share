/**
 * Detect factory handoff mentions in issue/comment bodies.
 * Supports Cursor Cloud (`@cursor`) and Codex Cloud (`@codex`).
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function detectFactoryHandoff(text) {
  const body = String(text ?? '');
  const hasCursor = /(?:^|[\s([{])@cursor\b/i.test(body);
  const hasCodex = /(?:^|[\s([{])@codex\b/i.test(body);

  // Prefer Cursor when both are present — this factory is Cursor-first.
  if (hasCursor) {
    return { delegated: true, provider: 'cursor' };
  }
  if (hasCodex) {
    return { delegated: true, provider: 'codex' };
  }
  return { delegated: false, provider: null };
}

async function main() {
  const args = process.argv.slice(2);
  let input = args.join(' ');
  if (!input && !process.stdin.isTTY) {
    let buf = '';
    for await (const chunk of process.stdin) buf += chunk;
    input = buf;
  }
  process.stdout.write(`${JSON.stringify(detectFactoryHandoff(input))}\n`);
}

const self = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(self)) {
  await main();
}
