/**
 * Match independent factory review bots (Cursor and/or Codex).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function loadReviewBots(policyPath = new URL('./review-bots.json', import.meta.url)) {
  return JSON.parse(fs.readFileSync(policyPath, 'utf8'));
}

export function isFactoryReviewBot(login, userType, policy = loadReviewBots()) {
  const normalizedLogin = String(login ?? '').toLowerCase();
  return policy.bots.some((bot) => {
    if (bot.login.toLowerCase() !== normalizedLogin) return false;
    if (bot.type && userType && bot.type !== userType) return false;
    return true;
  });
}

export function factoryReviewLogins(policy = loadReviewBots()) {
  return policy.bots.map((bot) => bot.login.toLowerCase());
}

export function selectLatestFactoryReview(reviews, policy = loadReviewBots()) {
  const matches = (Array.isArray(reviews) ? reviews : [])
    .filter((review) => isFactoryReviewBot(review?.user?.login, review?.user?.type, policy))
    .sort((a, b) => String(a.submitted_at ?? '').localeCompare(String(b.submitted_at ?? '')));
  return matches.at(-1) ?? null;
}

async function main() {
  const [login, type = 'Bot'] = process.argv.slice(2);
  if (!login) {
    process.stdout.write(`${factoryReviewLogins().join('\n')}\n`);
    return;
  }
  process.stdout.write(`${isFactoryReviewBot(login, type) ? 'true' : 'false'}\n`);
}

const self = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(self)) {
  await main();
}
