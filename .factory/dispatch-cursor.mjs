/**
 * Build and optionally dispatch a Cursor Cloud Agent for a factory issue.
 *
 * Usage:
 *   node .factory/dispatch-cursor.mjs --dry-run \
 *     --repo jeevan-vj/secret-share --issue 7 \
 *     --title "..." --body-file /tmp/issue.md
 *
 * With CURSOR_API_KEY set (and without --dry-run), POSTs to
 * https://api.cursor.com/v1/agents with autoCreatePR=true.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const API_URL = process.env.CURSOR_AGENTS_URL || 'https://api.cursor.com/v1/agents';

export function buildImplementPrompt({ issueNumber, title, body, repository }) {
  return [
    `You are the Cursor factory implementer for ${repository}.`,
    `Take ownership of GitHub issue #${issueNumber}: ${title}`,
    '',
    'Follow the repository contract in AGENTS.md and the role prompt in .factory/agents/implementer.md.',
    'Also read SPEC.md, SECURITY.md, docs/THREAT_MODEL.md, relevant ADRs, and existing tests before changing code.',
    '',
    'Process:',
    '1. Produce a short plan and acceptance criteria (comment on the issue if useful).',
    '2. Implement with TDD where practical.',
    '3. Run: pnpm install --frozen-lockfile && pnpm test && pnpm typecheck && pnpm build.',
    '4. Open a pull request that includes `Closes #' + String(issueNumber) + '` in the body.',
    '5. Summarize plan, security impact, migrations/auth/crypto/deploy/control-plane impact, and verification results.',
    '',
    'Hard rules:',
    '- Never weaken security invariants, tests, validation, auth, CSP, or one-time-secret semantics.',
    '- Never edit AGENTS.md, .github/**, or .factory/** unless the issue explicitly requires protected control-plane work.',
    '- Never persist or log plaintext secrets, decryption keys, full share URLs, auth tokens, or sensitive bodies.',
    '- Keep decryption keys client-side / URL-fragment only.',
    '- Prefer the smallest coherent change that satisfies acceptance criteria.',
    '',
    'After opening the PR, subscribe to CI and review feedback on that PR and drive it to a merge-ready state',
    '(fix failures / address review). Do not attempt to merge protected control-plane changes.',
    '',
    '## Issue body',
    body?.trim() || '(empty)',
  ].join('\n');
}

export function buildAgentPayload({ repository, issueNumber, title, body, startingRef = 'main' }) {
  const repoUrl = repository.startsWith('http')
    ? repository
    : `https://github.com/${repository}`;

  return {
    name: `factory #${issueNumber}`.slice(0, 100),
    prompt: {
      text: buildImplementPrompt({ issueNumber, title, body, repository }),
    },
    repos: [
      {
        url: repoUrl,
        startingRef,
      },
    ],
    autoCreatePR: true,
    skipReviewerRequest: true,
  };
}

export async function dispatchCursorAgent(payload, { apiKey, apiUrl = API_URL, fetchImpl = fetch } = {}) {
  if (!apiKey) {
    throw new Error('CURSOR_API_KEY is required to dispatch a Cursor Cloud Agent');
  }

  const response = await fetchImpl(apiUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }

  if (!response.ok) {
    const detail = typeof json === 'object' ? JSON.stringify(json) : String(json);
    throw new Error(`Cursor Agents API ${response.status}: ${detail}`);
  }

  return json;
}

function parseArgs(argv) {
  const out = {
    dryRun: false,
    repo: '',
    issue: '',
    title: '',
    body: '',
    bodyFile: '',
    ref: 'main',
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];
    switch (arg) {
      case '--dry-run':
        out.dryRun = true;
        break;
      case '--repo':
        out.repo = next;
        i += 1;
        break;
      case '--issue':
        out.issue = next;
        i += 1;
        break;
      case '--title':
        out.title = next;
        i += 1;
        break;
      case '--body':
        out.body = next;
        i += 1;
        break;
      case '--body-file':
        out.bodyFile = next;
        i += 1;
        break;
      case '--ref':
        out.ref = next;
        i += 1;
        break;
      default:
        break;
    }
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.repo || !args.issue || !args.title) {
    console.error('Usage: node .factory/dispatch-cursor.mjs --repo owner/name --issue N --title "..." [--body-file path] [--dry-run]');
    process.exit(2);
  }

  const body = args.bodyFile ? fs.readFileSync(args.bodyFile, 'utf8') : args.body;
  const payload = buildAgentPayload({
    repository: args.repo,
    issueNumber: Number(args.issue),
    title: args.title,
    body,
    startingRef: args.ref,
  });

  if (args.dryRun) {
    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
    return;
  }

  const result = await dispatchCursorAgent(payload, { apiKey: process.env.CURSOR_API_KEY });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

const self = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(self)) {
  await main();
}
