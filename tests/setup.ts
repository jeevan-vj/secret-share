import { vi } from "vitest";

vi.mock("cloudflare:workers", () => ({
  env: {
    BETTER_AUTH_SECRET: "test-secret-at-least-32-characters-long!!",
    BETTER_AUTH_URL: "https://example.test",
    BETTER_AUTH_TRUSTED_ORIGINS: "https://example.test",
    ACCOUNTS_ENABLED: "true",
    MAIL_PROVIDER: "memory",
    MAIL_FROM: "noreply@example.test",
  },
}));
