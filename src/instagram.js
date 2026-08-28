import { first, num } from './utils.js';

function image(item = {}) {
  return first(
    item.image_versions2?.candidates?.[0]?.url,
    item.display_url,
    item.thumbnail_src,
    item.thumbnail_url,
    item.image_url,
    item.carousel_media?.[0]?.image_versions2?.candidates?.[0]?.url
  );
}

function video(item = {}) {
  return first(item.video_versions?.[0]?.url, item.video_url);
}

export function normalizeInstagramProfile(profileRaw = {}, postsRaw = {}) {
  const user = profileRaw?.data?.user || profileRaw?.user || postsRaw?.user || {};
  const rawItems = postsRaw?.items || postsRaw?.data?.items || profileRaw?.data?.user?.edge_owner_to_timeline_media?.edges?.map((edge) => edge.node) || [];
  const posts = rawItems.slice(0, 24).map((item) => ({
    id: String(first(item.id, item.pk, item.code, item.shortcode) || ''),
    type: item.media_type === 2 || item.is_video || item.__typename?.includes('Video') ? 'video' : item.media_type === 8 ? 'carousel' : 'image',
    image: image(item),
    video: video(item),
    caption: first(item.caption?.text, item.edge_media_to_caption?.edges?.[0]?.node?.text, item.caption),
    likes: num(first(item.like_count, item.edge_media_preview_like?.count, item.edge_liked_by?.count)),
    comments: num(first(item.comment_count, item.edge_media_to_comment?.count, item.edge_media_to_parent_comment?.count)),
    views: num(first(item.play_count, item.view_count, item.video_play_count)),
    createdAt: first(item.created_at, item.taken_at ? new Date(Number(item.taken_at) * 1000).toISOString() : null)
  }));

  return {
    platform: 'instagram',
    type: 'profile',
    profile: {
      handle: first(user.username, user.handle),
      name: first(user.full_name, user.fullName, user.username),
      avatar: first(user.profile_pic_url_hd, user.profile_pic_url, user.profilePictureUrl),
      bio: first(user.biography, user.bio),
      verified: Boolean(first(user.is_verified, user.isVerified, false)),
      private: Boolean(first(user.is_private, user.isPrivate, false)),
      followers: num(first(user.edge_followed_by?.count, user.follower_count, user.followers)),
      following: num(first(user.edge_follow?.count, user.following_count, user.following)),
      postsCount: num(first(user.edge_owner_to_timeline_media?.count, user.media_count, user.posts_count))
    },
    posts
  };
}

export function normalizeInstagramPost(raw = {}) {
  const item = raw?.data?.xdt_shortcode_media || raw?.xdt_shortcode_media || raw?.data || raw;
  const children = item?.edge_sidecar_to_children?.edges?.map((edge) => edge.node) || item?.carousel_media || [];
  const media = children.length
    ? children.map((child) => ({ image: image(child), video: video(child) }))
    : [{ image: image(item), video: video(item) }];

  return {
    platform: 'instagram',
    type: 'post',
    post: {
      id: String(first(item.id, item.pk, item.shortcode) || ''),
      handle: first(item.owner?.username, item.user?.username),
      name: first(item.owner?.full_name, item.user?.full_name),
      avatar: first(item.owner?.profile_pic_url, item.user?.profile_pic_url),
      caption: first(item.edge_media_to_caption?.edges?.[0]?.node?.text, item.caption?.text, item.caption),
      likes: num(first(item.edge_media_preview_like?.count, item.edge_liked_by?.count, item.like_count)),
      comments: num(first(item.edge_media_to_parent_comment?.count, item.edge_media_to_comment?.count, item.comment_count)),
      views: num(first(item.video_play_count, item.play_count, item.view_count)),
      createdAt: first(item.created_at, item.taken_at_timestamp ? new Date(Number(item.taken_at_timestamp) * 1000).toISOString() : null),
      media
    }
  };
}
