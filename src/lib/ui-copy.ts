export const SECRET_MAX_LENGTH = 100_000;
export const SECRET_TTL_HOURS = 24;

export const createCopy = {
  brand: "Secret Share",
  eyebrow: "One-time encrypted sharing",
  title: "Share a secret. Keep the key in the link.",
  lead:
    "Encryption happens in this browser. The server stores ciphertext only. The decryption key stays in the URL fragment and is never sent to the server.",
  oneTime:
    "One-time secrets become unavailable after the first successful reveal. Anyone with the complete link can open it once.",
  expiry: `Unused links expire after ${SECRET_TTL_HOURS} hours.`,
  trustEncrypted: "Encrypted in your browser",
  trustKey: "Key stays in the URL fragment",
  trustOnce: "Viewed once, then gone",
  secretLabel: "Secret",
  secretHint: "Plaintext never leaves this browser. Maximum 100,000 characters.",
  submit: "Create one-time link",
  submitting: "Encrypting in this browser…",
  resultTitle: "Your one-time link is ready",
  resultLead:
    "This link includes the decryption key after #. Treat it like the secret. It works once, then the ciphertext is consumed.",
  resultReadyTitle: "Ready to share",
  resultReadyBody: "Copy the complete link. The key lives only in the fragment.",
  resultLinkLabel: "One-time link",
  copyLink: "Copy link",
  copied: "Copied",
  copyFailed: "Could not copy. Select the link and copy it manually.",
  shareAnother: "Share another secret",
  createError: "Could not create the encrypted share link.",
  howTitle: "How it works",
  howStep1Title: "Write the secret",
  howStep1Body: "Type the text in this browser. Nothing is uploaded until it is encrypted.",
  howStep2Title: "Encrypt locally",
  howStep2Body: "A fresh AES-256-GCM key is generated here. Only ciphertext and an IV go to the server.",
  howStep3Title: "Reveal once",
  howStep3Body: "The recipient opens the link, decrypts in their browser, and the secret cannot be claimed again.",
  footer: "Client-side encryption. Keys remain in the URL fragment. No recovery if the link is lost.",
} as const;

export const revealCopy = {
  brand: "Secret Share",
  eyebrow: "One-time secret",
  title: "Reveal this secret",
  lead:
    "This secret can be viewed once. Revealing it decrypts the contents in your browser and permanently consumes the link.",
  trust:
    "The decryption key is read from this page’s URL fragment. It is not sent to the server with the claim request.",
  reveal: "Reveal secret",
  revealing: "Revealing…",
  revealedTitle: "Secret revealed",
  revealedLead: "This link is now used. Copy the secret and close this tab when you are done.",
  copySecret: "Copy secret",
  copied: "Copied",
  copyFailed: "Could not copy. Select the secret and copy it manually.",
  missingKeyTitle: "This link is missing its decryption key",
  missingKeyBody:
    "Ask the sender for the complete share link, including the fragment after #. The key is never stored on the server.",
  unavailableTitle: "This secret is unavailable",
  unavailableBody: "It may have expired or already been viewed. Expired or consumed secrets cannot be retrieved.",
  decryptFailedTitle: "The secret could not be decrypted",
  decryptFailedBody: "The link may be invalid or modified. Ciphertext is authenticated and will not decrypt if altered.",
  footer: "Decryption happens in this browser. The server never receives the key.",
} as const;
