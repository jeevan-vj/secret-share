export const brand = {
  name: "Secret Share",
  skip: "Skip to content",
};

export const createCopy = {
  eyebrow: "End-to-end encrypted",
  title: "Share a secret without giving the server the key.",
  lead: "Encryption happens in this browser. The decryption key is stored only in the share link fragment.",
  oneTime: "One-time secrets become unavailable after the first successful reveal.",
  expires: "Expires in 24 hours",
  viewOnce: "Viewed once",
  label: "Secret",
  hint: "A password, API key, or private note. Encrypted on this device before it is stored.",
  submit: "Encrypt and create link",
  submitting: "Encrypting…",
  resultEyebrow: "Ready to share",
  resultTitle: "One-time link",
  resultBody:
    "This link is the only way to decrypt the secret. Copy it now — the server cannot recover it.",
  copyLink: "Copy one-time link",
  copied: "Copied",
  createAnother: "Create another secret",
  error: "Could not create the encrypted share link.",
};

export const revealCopy = {
  eyebrow: "One-time secret",
  title: "Reveal this secret",
  beforeReveal: "This secret can be viewed once. After you reveal it, the link stops working.",
  trust: "Decryption happens in this browser. The key stays in the link fragment and is never sent to the server.",
  reveal: "Reveal this secret",
  revealing: "Revealing…",
  secretLabel: "Secret",
  copySecret: "Copy secret",
  copied: "Copied",
  afterReveal: "This secret will not be shown again. Copy it now if you still need it.",
  missingKey: "This link is missing its decryption key.",
  missingKeyHint: "Open the complete share link, including the fragment after #.",
  unavailable: "This secret is unavailable. It may have expired or already been viewed.",
  unavailableTitle: "Secret unavailable",
  decryptFailed: "The secret could not be decrypted. The link may be invalid or modified.",
  decryptFailedTitle: "Could not decrypt",
};

export const chromeCopy = {
  footer: "Client-side AES-256-GCM · Keys stay in the link · Nothing to recover on the server",
};
