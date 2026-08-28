import { describe, expect, it, vi } from 'vitest';
import { detectFactoryHandoff } from '../.factory/handoff.mjs';
import {
  factoryReviewLogins,
  isFactoryReviewBot,
  loadReviewBots,
  selectLatestFactoryReview,
} from '../.factory/review-bots.mjs';
import { buildAgentPayload, buildImplementPrompt, dispatchCursorAgent } from '../.factory/dispatch-cursor.mjs';
import { classifyRisk, loadPolicy } from '../.factory/classify-risk.mjs';

describe('factory handoff detection', () => {
  it('detects @cursor as cursor provider', () => {
    expect(detectFactoryHandoff('@cursor please implement this')).toEqual({
      delegated: true,
      provider: 'cursor',
    });
  });

  it('detects @codex as codex provider', () => {
    expect(detectFactoryHandoff('@codex please implement this')).toEqual({
      delegated: true,
      provider: 'codex',
    });
  });

  it('prefers cursor when both mentions are present', () => {
    expect(detectFactoryHandoff('Use @codex or @cursor for this task')).toEqual({
      delegated: true,
      provider: 'cursor',
    });
  });

  it('ignores bare words that are not mentions', () => {
    expect(detectFactoryHandoff('cursor and codex without mentions')).toEqual({
      delegated: false,
      provider: null,
    });
  });
});

describe('factory review bots', () => {
  const policy = loadReviewBots();

  it('allowlists Cursor and Codex review bots', () => {
    expect(isFactoryReviewBot('cursor[bot]', 'Bot', policy)).toBe(true);
    expect(isFactoryReviewBot('cursor', 'Bot', policy)).toBe(true);
    expect(isFactoryReviewBot('chatgpt-codex-connector[bot]', 'Bot', policy)).toBe(true);
    expect(isFactoryReviewBot('random-user', 'User', policy)).toBe(false);
  });

  it('selects the latest allowlisted review', () => {
    const latest = selectLatestFactoryReview(
      [
        {
          id: 1,
          submitted_at: '2026-01-01T00:00:00Z',
          user: { login: 'chatgpt-codex-connector[bot]', type: 'Bot' },
        },
        {
          id: 2,
          submitted_at: '2026-01-02T00:00:00Z',
          user: { login: 'human', type: 'User' },
        },
        {
          id: 3,
          submitted_at: '2026-01-03T00:00:00Z',
          user: { login: 'cursor[bot]', type: 'Bot' },
        },
      ],
      policy,
    );
    expect(latest?.id).toBe(3);
    expect(factoryReviewLogins(policy)).toContain('cursor[bot]');
  });
});

describe('cursor dispatch payload', () => {
  it('builds an implement prompt that closes the issue and preserves invariants', () => {
    const prompt = buildImplementPrompt({
      issueNumber: 7,
      title: 'factory test',
      body: 'Add expiry copy',
      repository: 'jeevan-vj/secret-share',
    });
    expect(prompt).toContain('Closes #7');
    expect(prompt).toContain('AGENTS.md');
    expect(prompt).toContain('.factory/agents/implementer.md');
    expect(prompt).toContain('Add expiry copy');
  });

  it('builds Agents API payload with autoCreatePR', () => {
    const payload = buildAgentPayload({
      repository: 'jeevan-vj/secret-share',
      issueNumber: 7,
      title: 'factory test',
      body: 'body',
      startingRef: 'main',
    });
    expect(payload.autoCreatePR).toBe(true);
    expect(payload.repos[0].url).toBe('https://github.com/jeevan-vj/secret-share');
    expect(payload.repos[0].startingRef).toBe('main');
    expect(payload.prompt.text).toContain('Closes #7');
  });

  it('posts to Cursor Agents API with bearer auth', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ agent: { id: 'bc-test', url: 'https://cursor.com/agents/bc-test' } }),
    }));

    const result = await dispatchCursorAgent(
      buildAgentPayload({
        repository: 'jeevan-vj/secret-share',
        issueNumber: 7,
        title: 'factory test',
        body: 'body',
      }),
      { apiKey: 'test-key', fetchImpl },
    );

    expect(result.agent.id).toBe('bc-test');
    expect(fetchImpl).toHaveBeenCalledOnce();
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://api.cursor.com/v1/agents');
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toBe('Bearer test-key');
  });
});

describe('factory risk policy still protects control plane', () => {
  const policy = loadPolicy();

  it('treats new factory cursor modules as protected', () => {
    expect(classifyRisk(['.factory/dispatch-cursor.mjs'], policy)).toBe('protected');
    expect(classifyRisk(['.factory/automations/implement.md'], policy)).toBe('protected');
    expect(classifyRisk(['.github/workflows/factory.yml'], policy)).toBe('protected');
  });
});
