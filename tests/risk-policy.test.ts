import { describe, expect, it } from 'vitest';
import { classifyRisk, loadPolicy } from '../.factory/classify-risk.mjs';

const policy = loadPolicy();

describe('factory risk policy', () => {
  it('classifies ordinary presentation changes as low risk', () => {
    expect(classifyRisk(['src/components/Button.tsx'], policy)).toBe('low');
  });

  it('classifies API and dependency changes as medium risk', () => {
    expect(classifyRisk(['src/app/api/health/route.ts'], policy)).toBe('medium');
    expect(classifyRisk(['pnpm-lock.yaml'], policy)).toBe('medium');
  });

  it('classifies secret-handling surfaces as high risk', () => {
    expect(classifyRisk(['src/lib/share-link.ts'], policy)).toBe('high');
    expect(classifyRisk(['src/lib/encoding.ts'], policy)).toBe('high');
    expect(classifyRisk(['src/app/s/abc/page.tsx'], policy)).toBe('high');
    expect(classifyRisk(['src/app/api/secrets/abc/route.ts'], policy)).toBe('high');
  });

  it('classifies crypto, auth, database, and deployment changes as high risk', () => {
    expect(classifyRisk(['src/lib/crypto.ts'], policy)).toBe('high');
    expect(classifyRisk(['src/app/api/auth/[...all]/route.ts'], policy)).toBe('high');
    expect(classifyRisk(['drizzle/0001_change.sql'], policy)).toBe('high');
    expect(classifyRisk(['wrangler.jsonc'], policy)).toBe('high');
  });

  it('always treats factory and GitHub control-plane files as protected', () => {
    expect(classifyRisk(['.github/workflows/factory-pr.yml'], policy)).toBe('protected');
    expect(classifyRisk(['.factory/risk-policy.json'], policy)).toBe('protected');
  });

  it('returns the highest risk across all changed files', () => {
    expect(classifyRisk(['README.md', 'src/app/api/health/route.ts', 'src/lib/crypto.ts'], policy)).toBe('high');
    expect(classifyRisk(['src/lib/crypto.ts', '.github/workflows/ci.yml'], policy)).toBe('protected');
  });
});
