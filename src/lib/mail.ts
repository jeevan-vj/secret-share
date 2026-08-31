export type AuthMailKind = "verify" | "reset";

export type AuthMailInput = {
  to: string;
  kind: AuthMailKind;
  url: string;
};

export type AuthMailer = (input: AuthMailInput) => Promise<void>;

const subjects: Record<AuthMailKind, string> = {
  verify: "Verify your Secret Share email",
  reset: "Reset your Secret Share password",
};

const bodies: Record<AuthMailKind, (url: string) => string> = {
  verify: (url) =>
    `Confirm your Secret Share account by opening this link:\n\n${url}\n\nIf you did not create an account, ignore this email.`,
  reset: (url) =>
    `Reset your Secret Share password by opening this link:\n\n${url}\n\nIf you did not request a reset, ignore this email.`,
};

export function createResendMailer(config: {
  apiKey: string;
  from: string;
  endpoint?: string;
  fetchImpl?: typeof fetch;
}): AuthMailer {
  const endpoint = config.endpoint ?? "https://api.resend.com/emails";
  const fetchImpl = config.fetchImpl ?? fetch;

  return async (input) => {
    const response = await fetchImpl(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: config.from,
        to: [input.to],
        subject: subjects[input.kind],
        text: bodies[input.kind](input.url),
      }),
    });
    if (!response.ok) {
      throw new Error("mail_send_failed");
    }
  };
}

export function createMailerFromEnv(env: {
  AUTH_EMAIL_FROM?: string;
  AUTH_EMAIL_API_KEY?: string;
  AUTH_EMAIL_ENDPOINT?: string;
}): AuthMailer | null {
  if (!env.AUTH_EMAIL_FROM || !env.AUTH_EMAIL_API_KEY) return null;
  return createResendMailer({
    apiKey: env.AUTH_EMAIL_API_KEY,
    from: env.AUTH_EMAIL_FROM,
    endpoint: env.AUTH_EMAIL_ENDPOINT,
  });
}
