import { first, num } from './utils.js';

function mediaFromLegacy(legacy = {}) {
  const media = legacy?.extended_entities?.media || legacy?.entities?.media || [];
  return media.map((item) => ({
    type: item.type,
    image: first(item.media_url_https, item.media_url),
    video: item.video_info?.variants
      ?.filter((variant) => variant.url)
      ?.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))?.[0]?.url || null
  }));
}

export function normalizeXProfile(profileRaw = {}, tweetsRaw = {}) {
  const user = profileRaw?.data?.user?.result || profileRaw?.result || profileRaw || {};
  const legacy = user?.legacy || profileRaw?.legacy || {};
  const tweets = (tweetsRaw?.tweets || tweetsRaw?.data?.tweets || []).slice(0, 30).map((tweet) => {
    const tweetLegacy = tweet?.legacy || tweet?.data?.legacy || tweet;
    return {
      id: String(first(tweet.rest_id, tweetLegacy.id_str, tweet.id) || ''),
      text: first(tweetLegacy.full_text, tweetLegacy.text),
      likes: num(tweetLegacy.favorite_count),
      replies: num(tweetLegacy.reply_count),
      reposts: num(tweetLegacy.retweet_count),
      views: num(first(tweet?.views?.count, tweetLegacy.view_count)),
      createdAt: first(tweetLegacy.created_at),
      media: mediaFromLegacy(tweetLegacy)
    };
  });

  return {
    platform: 'x',
    type: 'profile',
    profile: {
      handle: first(legacy.screen_name, user.screen_name),
      name: first(legacy.name, user.name),
      avatar: first(legacy.profile_image_url_https, user.profile_image_url_https)?.replace('_normal.', '_400x400.'),
      banner: first(legacy.profile_banner_url, user.profile_banner_url),
      bio: first(legacy.description, user.description),
      verified: Boolean(first(user.is_blue_verified, legacy.verified, false)),
      followers: num(legacy.followers_count),
      following: num(legacy.friends_count),
      postsCount: num(legacy.statuses_count)
    },
    tweets
  };
}

export function normalizeXPost(raw = {}) {
  const result = raw?.data?.tweetResult?.result || raw?.result || raw;
  const legacy = result?.legacy || raw?.legacy || raw?.data?.legacy || raw;
  const userResult = result?.core?.user_results?.result || raw?.core?.user_results?.result || {};
  const userLegacy = userResult?.legacy || {};

  return {
    platform: 'x',
    type: 'post',
    post: {
      id: String(first(result.rest_id, raw.rest_id, legacy.id_str, raw.id) || ''),
      handle: first(userLegacy.screen_name),
      name: first(userLegacy.name),
      avatar: first(userLegacy.profile_image_url_https),
      caption: first(legacy.full_text, legacy.text),
      likes: num(legacy.favorite_count),
      comments: num(legacy.reply_count),
      reposts: num(legacy.retweet_count),
      views: num(first(result?.views?.count, legacy.view_count)),
      createdAt: first(legacy.created_at),
      media: mediaFromLegacy(legacy)
    }
  };
}
