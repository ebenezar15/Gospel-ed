/** Thin wrapper over the artifact runtime's `sample` capability (ask Claude on the viewer's own account). */
type SampleFn = ((input: string | { role: 'user' | 'assistant'; content: string }[], opts?: Record<string, unknown>) => Promise<{ text: string; truncated: boolean }>) & {
  limits?: () => Promise<{ tools?: { maxCount: number } }>;
};
let p: Promise<SampleFn | null> | null = null;
export function getSample(): Promise<SampleFn | null> {
  p ??= (async () => {
    const c = (window as any).claude;
    if (!c?.use) return null;
    try { return (await c.use('sample')) as SampleFn | null; } catch { return null; }
  })();
  return p;
}
export const ERROR_COPY: Record<string, string> = {
  not_granted: 'Claude isn’t enabled for this page. You can allow it from the artifact’s Permissions menu.',
  sampling_disabled: 'Claude isn’t available on this account.',
  rate_limited: 'Too many questions in a short time. Wait a moment, then ask again.',
  session_expired: 'Your session expired. Sign in again to keep asking.',
  refused: 'Claude declined that question. Try rephrasing it.',
  empty_completion: 'No answer came back. Try a shorter or simpler question.',
  prompt_too_large: 'That conversation is too long. Clear it and start again.',
  upstream_error: 'The connection dropped. Ask again to retry.',
};
