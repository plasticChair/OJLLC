const emptyVideo = Object.freeze({ has_video: false, is_embed: false, is_file: false, src: '', mime: '', provider: '', provider_name: '', watch_url: '' });

const unsupportedMessage =
  'Unsupported video_url. Use a YouTube, Vimeo, or Loom link, or a local file such as /videos/cover-letter.mp4.';

function youTubeId(url, host) {
  if (host === 'youtu.be') return url.pathname.split('/')[1];
  if (host !== 'youtube.com' && host !== 'youtube-nocookie.com') return undefined;
  if (url.pathname === '/watch') return url.searchParams.get('v');
  return /^\/(?:embed|shorts|live)\/([^/]+)/.exec(url.pathname)?.[1];
}

/**
 * Converts the link pasted into content/video.md into a safe player description.
 * Share links become privacy-friendly embed URLs, so editors never write HTML.
 */
export function parseVideoUrl(value) {
  const input = typeof value === 'string' ? value.trim() : '';
  if (!input) return { ...emptyVideo };

  if (input.startsWith('/')) {
    const match = /^\/videos\/[\w.-]+\.(mp4|webm)$/i.exec(input);
    if (!match) {
      throw new Error('Local videos must be MP4 or WebM files in public/videos, for example /videos/cover-letter.mp4.');
    }
    return { ...emptyVideo, has_video: true, is_file: true, src: input, mime: `video/${match[1].toLowerCase()}`, provider: 'file' };
  }

  let url;
  try {
    url = new URL(input);
  } catch {
    throw new Error(unsupportedMessage);
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error(unsupportedMessage);
  const host = url.hostname.toLowerCase().replace(/^(?:www\.|m\.)/, '');

  const youTube = youTubeId(url, host);
  if (youTube !== undefined) {
    if (!/^[\w-]{11}$/.test(youTube ?? '')) throw new Error('That YouTube link is missing a valid video ID.');
    return { ...emptyVideo, has_video: true, is_embed: true, provider: 'youtube', provider_name: 'YouTube', src: `https://www.youtube-nocookie.com/embed/${youTube}?rel=0`, watch_url: `https://www.youtube.com/watch?v=${youTube}` };
  }

  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const match = host === 'vimeo.com'
      ? /^\/(\d+)(?:\/([\da-f]+))?\/?$/i.exec(url.pathname)
      : /^\/video\/(\d+)\/?$/.exec(url.pathname);
    if (!match) throw new Error('That Vimeo link is missing a valid video number.');
    const privacyHash = match[2] ?? url.searchParams.get('h') ?? '';
    if (privacyHash && !/^[\da-f]+$/i.test(privacyHash)) throw new Error('That Vimeo link has an invalid privacy code.');
    const hashParameter = privacyHash ? `&h=${privacyHash}` : '';
    return { ...emptyVideo, has_video: true, is_embed: true, provider: 'vimeo', provider_name: 'Vimeo', src: `https://player.vimeo.com/video/${match[1]}?dnt=1${hashParameter}`, watch_url: `https://vimeo.com/${match[1]}${privacyHash ? `/${privacyHash}` : ''}` };
  }

  if (host === 'loom.com') {
    const match = /^\/(?:share|embed)\/([\da-f]{32})\/?$/i.exec(url.pathname);
    if (!match) throw new Error('That Loom link is missing a valid video ID.');
    return { ...emptyVideo, has_video: true, is_embed: true, provider: 'loom', provider_name: 'Loom', src: `https://www.loom.com/embed/${match[1]}`, watch_url: `https://www.loom.com/share/${match[1]}` };
  }

  throw new Error(unsupportedMessage);
}
