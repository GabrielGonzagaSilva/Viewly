import { first, num } from './utils.js';

function videoMedia(item = {}) {
  return {
    image: first(
      item.video?.cover?.url_list?.[0],
      item.video?.origin_cover?.url_list?.[0],
      item.cover,
      item.thumbnail
    ),
    video: first(
      item.video?.download_no_watermark_addr?.url_list?.[0],
      item.video?.play_addr?.url_list?.[0],
      item.play
    )
  };
}

export function normalizeTikTokProfile(profileRaw = {}, videosRaw = {}) {
  const data = profileRaw?.data || profileRaw;
  const user = data?.user || data?.userInfo?.user || data?.user_info?.user || data;
  const stats = data?.stats || data?.userInfo?.stats || data?.user_info?.stats || {};
  const rawVideos = videosRaw?.aweme_list || videosRaw?.videos || videosRaw?.data?.videos || [];
  const videos = rawVideos.slice(0, 30).map((item) => ({
    id: String(first(item.aweme_id, item.id, item.video?.id) || ''),
    caption: first(item.desc, item.description),
    ...videoMedia(item),
    likes: num(first(item.statistics?.digg_count, item.stats?.diggCount, item.digg_count)),
    comments: num(first(item.statistics?.comment_count, item.stats?.commentCount, item.comment_count)),
    views: num(first(item.statistics?.play_count, item.stats?.playCount, item.play_count)),
    shares: num(first(item.statistics?.share_count, item.stats?.shareCount, item.share_count)),
    createdAt: first(item.create_time_utc, item.create_time ? new Date(Number(item.create_time) * 1000).toISOString() : null)
  }));

  return {
    platform: 'tiktok',
    type: 'profile',
    profile: {
      handle: first(user.uniqueId, user.unique_id, user.username),
      name: first(user.nickname, user.display_name, user.uniqueId),
      avatar: first(
        user.avatarLarger,
        user.avatar_larger?.url_list?.[0],
        user.avatarMedium,
        user.avatar_medium?.url_list?.[0],
        user.avatarThumb
      ),
      bio: first(user.signature, user.bio),
      verified: Boolean(first(user.verified, false)),
      followers: num(first(stats.followerCount, stats.follower_count, user.follower_count)),
      following: num(first(stats.followingCount, stats.following_count, user.following_count)),
      likes: num(first(stats.heartCount, stats.heart_count, user.total_favorited)),
      postsCount: num(first(stats.videoCount, stats.video_count, user.aweme_count))
    },
    videos
  };
}

export function normalizeTikTokPost(raw = {}) {
  const item = raw?.aweme_detail || raw?.itemInfo?.itemStruct || raw?.data || raw;
  return {
    platform: 'tiktok',
    type: 'post',
    post: {
      id: String(first(item.aweme_id, item.id) || ''),
      handle: first(item.author?.unique_id, item.author?.uniqueId),
      name: first(item.author?.nickname),
      avatar: first(item.author?.avatar_medium?.url_list?.[0], item.author?.avatarThumb),
      caption: first(item.desc, item.description),
      likes: num(first(item.statistics?.digg_count, item.stats?.diggCount)),
      comments: num(first(item.statistics?.comment_count, item.stats?.commentCount)),
      views: num(first(item.statistics?.play_count, item.stats?.playCount)),
      shares: num(first(item.statistics?.share_count, item.stats?.shareCount)),
      createdAt: first(item.create_time_utc, item.createTime ? new Date(Number(item.createTime) * 1000).toISOString() : null),
      media: [videoMedia(item)]
    }
  };
}
