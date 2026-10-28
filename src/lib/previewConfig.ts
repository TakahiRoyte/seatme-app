export function previewConfiguration(mode: string, origin: string) {
  if (mode !== 'apew-preview') return null;
  const url = new URL(origin);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/' || url.search || url.hash || (url.protocol === 'http:' && !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname))) throw new Error('Preview requires a clean HTTPS or local loopback origin.');
  return {
    firebase: { projectId: 'demo-apew-seatme', apiKey: 'synthetic-preview-only', appId: 'synthetic-preview-only' },
    firestore: { host: url.host, ssl: url.protocol === 'https:', experimentalForceLongPolling: true },
  };
}
