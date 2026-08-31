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
  signedInNote:
    "Signed in: this share is attached to your account so you can revoke it later. The decryption key still stays in the link fragment. The server cannot recover it.",
  signIn: "Sign in",
  signUp: "Sign up",
  optionalAccount: "Accounts are optional. You can create and reveal a secret without signing in.",
  securityTitle: "How Secret Share protects secrets",
  securityEncrypt: "Plaintext is encrypted in this browser with AES-256-GCM.",
  securityServer: "Only ciphertext and operational metadata reach the server.",
  securityKey: "The decryption key stays in the URL fragment and is never sent to or stored by the server.",
  securityOnce: "A one-time secret is atomically consumed on the first successful reveal.",
  securityGone: "Expired, consumed, or revoked secrets cannot be retrieved.",
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
  shareNew: "Share a new secret",
  footer: "Decryption happens in this browser. The server never receives the key.",
} as const;

export const chromeCopy = {
  signIn: "Sign in",
  signUp: "Create account",
  account: "Account",
  signOut: "Sign out",
} as const;

export const siteCopy = {
  builtBy: "Built by iamjeevan.com",
  sourceCode: "Source code",
  builtByHref: "https://iamjeevan.com",
  sourceCodeHref: "https://github.com/jeevan-vj/secret-share",
  opensInNewTab: "Opens in a new tab",
} as const;

export const accountCopy = {
  eyebrow: "Optional account",
  title: "Your shares",
  lead:
    "This list is management metadata only. Secret Share never has the fragment decryption key and cannot recover or redisplay the full /s/<id>#k=… link. Copy that link when you create a share.",
  disabled:
    "Accounts are not enabled on this deployment. You can still create and reveal one-time secrets without signing in.",
  empty: "No owned shares yet. Create a secret while signed in to see it here.",
  loadMore: "Load more",
  revoke: "Revoke",
  revoking: "Revoking…",
  revoked: "Revoked",
  statusAvailable: "Available",
  statusConsumed: "Consumed",
  statusExpired: "Expired",
  statusRevoked: "Revoked",
  created: "Created",
  expires: "Expires",
  sessionsTitle: "Sessions",
  sessionsBody: "Sign out other devices if a browser might still be signed in.",
  revokeOtherSessions: "Sign out other devices",
  verifyTitle: "Verify your email",
  verifyBody: "Check your inbox for a verification link. Owned-share history stays unavailable until this email is verified.",
  resendVerification: "Resend verification email",
  genericAuthError: "Could not complete that request. Try again.",
  rateLimited: "Too many attempts. Wait and try again.",
  verifyRequired: "Verify your email before signing in.",
  loading: "Loading…",
} as const;

export const authCopy = {
  signInTitle: "Sign in",
  signInLead: "Signing in lets you revoke shares you created while signed in. It cannot recover a lost link or key.",
  signUpTitle: "Create an account",
  signUpLead:
    "Accounts are optional. Anonymous sharing still works. This account cannot decrypt secrets or rebuild the fragment key.",
  email: "Email",
  password: "Password",
  name: "Name",
  submitSignIn: "Sign in",
  socialLead: "Or continue with an identity provider",
  socialGoogle: "Continue with Google",
  socialGitHub: "Continue with GitHub",
  socialPrivacy: "Your identity provider helps sign you in. It never receives secret contents or decryption keys.",
  submitSignUp: "Create account",
  submitting: "Working…",
  forgot: "Forgot password",
  haveAccount: "Already have an account? Sign in",
  needAccount: "Need an account? Create one",
  checkEmail: "Check your email for a verification link. The server never sees your secret keys.",
  forgotTitle: "Reset password",
  forgotLead: "If an account exists for that email, we send a reset link. This does not reveal whether the email is registered.",
  forgotSubmit: "Send reset link",
  forgotSent: "If an account exists, a reset link is on its way.",
  resetTitle: "Choose a new password",
  resetSubmit: "Update password",
  resetDone: "Password updated. Sign in with your new password.",
  passwordHint: "At least 12 characters.",
  missingResetToken: "This reset link is missing its token. Use the link from the email.",
} as const;
