export type AuthEmail = {
  to: string;
  subject: string;
  text: string;
};

export async function sendResendEmail(
  input: AuthEmail,
  config: { apiKey: string; from: string },
): Promise<void> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: config.from,
      to: [input.to],
      subject: input.subject,
      text: input.text,
    }),
  });
  if (!response.ok) {
    throw new Error("mail_send_failed");
  }
}
