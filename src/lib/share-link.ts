export function buildShareLink(origin: string, secretId: string, key: string): string {
  const url = new URL(`/s/${encodeURIComponent(secretId)}`, origin);
  url.hash = `k=${encodeURIComponent(key)}`;
  return url.toString();
}

export function readKeyFromFragment(fragment: string): string | null {
  const value = fragment.startsWith("#") ? fragment.slice(1) : fragment;
  return new URLSearchParams(value).get("k");
}
