import { classify, json, provider } from './utils.js';
import { normalizeInstagramPost, normalizeInstagramProfile } from './instagram.js';
import { normalizeXPost, normalizeXProfile } from './x.js';
import { normalizeTikTokPost, normalizeTikTokProfile } from './tiktok.js';

async function resolveSocial(env, parsed) {
  if (parsed.network === 'instagram') {
    if (parsed.type === 'post') {
      const raw = await provider(env, '/v1/instagram/post', {
        url: parsed.url,
        trim: true,
        cache_max_age: '1d'
      });
      return normalizeInstagramPost(raw);
    }

    const [profile, posts] = await Promise.all([
      provider(env, '/v1/instagram/profile', {
        handle: parsed.handle,
        trim: true,
        cache_max_age: '1d'
      }),
      provider(env, '/v2/instagram/user/posts', {
        handle: parsed.handle,
        trim: true
      })
    ]);
    return normalizeInstagramProfile(profile, posts);
  }

  if (parsed.network === 'x') {
    if (parsed.type === 'post') {
      const raw = await provider(env, '/v1/twitter/tweet', {
        url: parsed.url,
        trim: true,
        cache_max_age: '1d'
      });
      return normalizeXPost(raw);
    }

    const [profile, tweets] = await Promise.all([
      provider(env, '/v1/twitter/profile', {
        handle: parsed.handle,
        cache_max_age: '1d'
      }),
      provider(env, '/v1/twitter/user-tweets', {
        handle: parsed.handle,
        trim: true
      })
    ]);
    return normalizeXProfile(profile, tweets);
  }

  if (parsed.network === 'tiktok') {
    if (parsed.type === 'post') {
      const raw = await provider(env, '/v2/tiktok/video', {
        url: parsed.url,
        trim: true,
        cache_max_age: '1d'
      });
      return normalizeTikTokPost(raw);
    }

    const [profile, videos] = await Promise.all([
      provider(env, '/v1/tiktok/profile', {
        handle: parsed.handle,
        cache_max_age: '1d'
      }),
      provider(env, '/v3/tiktok/profile/videos', {
        handle: parsed.handle,
        trim: true
      })
    ]);
    return normalizeTikTokProfile(profile, videos);
  }

  throw new Error('UNSUPPORTED_NETWORK');
}

async function handleApi(request, env) {
  if (request.method !== 'GET') {
    return json({ success: false, error: 'method_not_allowed' }, 405, { allow: 'GET' });
  }

  const url = new URL(request.url);

  if (url.pathname === '/api/health') {
    return json({
      success: true,
      service: 'viewly',
      configured: Boolean(env.SCRAPECREATORS_API_KEY)
    });
  }

  if (url.pathname !== '/api/resolve') {
    return json({ success: false, error: 'not_found' }, 404);
  }

  const parsed = classify(
    url.searchParams.get('q') || '',
    url.searchParams.get('network') || ''
  );

  if (!parsed.ok) {
    return json({ success: false, error: parsed.error }, 400);
  }

  try {
    const data = await resolveSocial(env, parsed);
    return json({ success: true, query: parsed, data });
  } catch (error) {
    if (error?.message === 'API_KEY_MISSING') {
      return json({ success: false, error: 'service_not_configured' }, 503);
    }

    const status = error?.status === 404 ? 404 : error?.status === 403 ? 502 : 500;
    return json({
      success: false,
      error: 'provider_error',
      providerStatus: error?.status || null
    }, status);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/')) {
      return handleApi(request, env);
    }

    const response = await env.ASSETS.fetch(request);
    const headers = new Headers(response.headers);
    headers.set('x-frame-options', 'SAMEORIGIN');
    headers.set('referrer-policy', 'strict-origin-when-cross-origin');
    headers.set('permissions-policy', 'camera=(), microphone=(), geolocation=()');
    headers.set('x-content-type-options', 'nosniff');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  }
};

export { classify } from './utils.js';
