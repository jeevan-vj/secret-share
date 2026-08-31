import { mailProvider, type AppAuthEnv } from "@/lib/env";

export type AuthEmailPurpose = "verify" | "reset";

export type AuthEmailRequest = {
  to: string;
  purpose: AuthEmailPurpose;
  actionUrl: string;
};

type MemoryMessage = {
  to: string;
  purpose: AuthEmailPurpose;
  actionUrl: string;
};

const memoryInbox: MemoryMessage[] = [];

export function resetMemoryInbox(): void {
  memoryInbox.length = 0;
}

export function readMemoryInbox(): readonly MemoryMessage[] {
  return memoryInbox;
}

function subjectFor(purpose: AuthEmailPurpose): string {
  return purpose === "verify" ? "Verify your Secret Share email" : "Reset your Secret Share password";
}

function textFor(purpose: AuthEmailPurpose, actionUrl: string): string {
  if (purpose === "verify") {
    return `Confirm your Secret Share account by opening this link:\n${actionUrl}\n`;
  }
  return `Reset your Secret Share password by opening this link:\n${actionUrl}\n`;
}

export async function sendAuthEmail(env: AppAuthEnv, input: AuthEmailRequest): Promise<void> {
  const provider = mailProvider(env);
  if (provider === "memory") {
    memoryInbox.push({ to: input.to, purpose: input.purpose, actionUrl: input.actionUrl });
    return;
  }

  if (provider === "none") {
    throw new Error("mail_unconfigured");
  }

  const from = env.MAIL_FROM;
  if (!from) throw new Error("mail_unconfigured");

  if (provider === "webhook") {
    const endpoint = env.MAIL_WEBHOOK_URL;
    if (!endpoint) throw new Error("mail_unconfigured");
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(env.MAIL_API_KEY ? { Authorization: `Bearer ${env.MAIL_API_KEY}` } : {}),
      },
      body: JSON.stringify({
        from,
        to: input.to,
        purpose: input.purpose,
        subject: subjectFor(input.purpose),
        text: textFor(input.purpose, input.actionUrl),
      }),
    });
    if (!response.ok) throw new Error("mail_delivery_failed");
    return;
  }

  const apiKey = env.MAIL_API_KEY;
  if (!apiKey) throw new Error("mail_unconfigured");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: subjectFor(input.purpose),
      text: textFor(input.purpose, input.actionUrl),
    }),
  });
  if (!response.ok) throw new Error("mail_delivery_failed");
}
