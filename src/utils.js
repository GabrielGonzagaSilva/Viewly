export const jsonHeaders = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff'
};

export function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), { status, headers: { ...jsonHeaders, ...extra } });
}

export function first(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '') ?? null;
}

export function num(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function cleanHandle(value = '') {
  return String(value).trim().replace(/^@/, '').replace(/[^A-Za-z0-9_.-]/g, '').slice(0, 64);
}

export function classify(rawValue, requestedNetwork = '') {
  const raw = String(rawValue || '').trim();
  const requested = ['instagram', 'x', 'tiktok'].includes(requestedNetwork) ? requestedNetwork : '';
  if (!raw) return { ok: false, error: 'empty_query' };

  if (!/^https?:\/\//i.test(raw)) {
    const handle = cleanHandle(raw);
    return handle ? { ok: true, network: requested || 'instagram', type: 'profile', handle } : { ok: false, error: 'invalid_query' };
  }

  let url;
  try { url = new URL(raw); } catch { return { ok: false, error: 'invalid_url' }; }
  const host = url.hostname.toLowerCase().replace(/^www\./, '');
  const parts = url.pathname.split('/').filter(Boolean);

  if (host === 'instagram.com' || host.endsWith('.instagram.com')) {
    if (['p', 'reel', 'reels', 'tv'].includes((parts[0] || '').toLowerCase()) && parts[1]) {
      return { ok: true, network: 'instagram', type: 'post', url: url.href };
    }
    const handle = cleanHandle(parts[0]);
    return handle ? { ok: true, network: 'instagram', type: 'profile', handle, url: url.href } : { ok: false, error: 'invalid_instagram_url' };
  }

  if (host === 'x.com' || host.endsWith('.x.com') || host === 'twitter.com' || host.endsWith('.twitter.com')) {
    const handle = cleanHandle(parts[0]);
    if (handle && parts[1] === 'status' && parts[2]) return { ok: true, network: 'x', type: 'post', handle, url: url.href };
    return handle ? { ok: true, network: 'x', type: 'profile', handle, url: url.href } : { ok: false, error: 'invalid_x_url' };
  }

  if (host === 'tiktok.com' || host.endsWith('.tiktok.com')) {
    const userPart = parts.find((part) => part.startsWith('@')) || '';
    const handle = cleanHandle(userPart);
    const videoIndex = parts.findIndex((part) => part === 'video');
    if (handle && videoIndex >= 0 && parts[videoIndex + 1]) return { ok: true, network: 'tiktok', type: 'post', handle, url: url.href };
    return handle ? { ok: true, network: 'tiktok', type: 'profile', handle, url: url.href } : { ok: false, error: 'invalid_tiktok_url' };
  }

  return { ok: false, error: 'unsupported_url' };
}

export async function provider(env, path, params = {}) {
  if (!env.SCRAPECREATORS_API_KEY) throw new Error('API_KEY_MISSING');
  const url = new URL(path, env.API_BASE_URL || 'https://api.scrapecreators.com');
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
  }

  const response = await fetch(url, {
    headers: { 'x-api-key': env.SCRAPECREATORS_API_KEY, accept: 'application/json' }
  });
  const text = await response.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { message: text.slice(0, 500) }; }

  if (!response.ok) {
    const error = new Error(`PROVIDER_${response.status}`);
    error.status = response.status;
    error.payload = data;
    throw error;
  }
  return data;
}
