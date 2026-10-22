import assert from 'node:assert/strict';
import test from 'node:test';
import { parseVideoUrl } from '../build/video.js';

test('empty video settings show the placeholder', () => {
  for (const value of ['', '   ', undefined, null]) {
    assert.equal(parseVideoUrl(value).has_video, false);
  }
});

test('YouTube share, watch, Shorts, and embed links become privacy-enhanced embeds', () => {
  const expected = 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0';
  for (const link of [
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s',
    'https://youtu.be/dQw4w9WgXcQ?si=abc',
    'https://youtube.com/shorts/dQw4w9WgXcQ',
    'https://m.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://www.youtube.com/embed/dQw4w9WgXcQ',
  ]) {
    const video = parseVideoUrl(link);
    assert.equal(video.is_embed, true, link);
    assert.equal(video.src, expected, link);
  }
});

test('Vimeo public and unlisted links become do-not-track player embeds', () => {
  assert.equal(parseVideoUrl('https://vimeo.com/76979871').src, 'https://player.vimeo.com/video/76979871?dnt=1');
  const unlisted = parseVideoUrl('https://vimeo.com/76979871/a1b2c3d4e5');
  assert.equal(unlisted.src, 'https://player.vimeo.com/video/76979871?dnt=1&h=a1b2c3d4e5');
  assert.equal(unlisted.watch_url, 'https://vimeo.com/76979871/a1b2c3d4e5');
  assert.equal(unlisted.provider_name, 'Vimeo');
  assert.equal(parseVideoUrl('https://player.vimeo.com/video/76979871?h=abc123').src, 'https://player.vimeo.com/video/76979871?dnt=1&h=abc123');
});

test('Loom share links become Loom embeds', () => {
  const id = '0123456789abcdef0123456789abcdef';
  const video = parseVideoUrl(`https://www.loom.com/share/${id}?sid=x`);
  assert.equal(video.src, `https://www.loom.com/embed/${id}`);
  assert.equal(video.watch_url, `https://www.loom.com/share/${id}`);
});

test('embedded videos include a canonical link to watch on the provider site', () => {
  const video = parseVideoUrl('https://youtu.be/dQw4w9WgXcQ?si=tracking');
  assert.equal(video.watch_url, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  assert.equal(video.provider_name, 'YouTube');
});

test('local MP4 and WebM files in public/videos are played natively', () => {
  assert.deepEqual(parseVideoUrl('/videos/cover-letter.mp4'), {
    has_video: true, is_embed: false, is_file: true, src: '/videos/cover-letter.mp4', mime: 'video/mp4', provider: 'file', provider_name: '', watch_url: '',
  });
  assert.equal(parseVideoUrl('/videos/Hello.WEBM').mime, 'video/webm');
});

test('unsupported, malformed, or unsafe video links fail with guidance', () => {
  for (const link of [
    'javascript:alert(1)',
    'https://example.com/video.mp4',
    'https://www.youtube.com/watch?v=short',
    'https://www.youtube.com/watch',
    'https://vimeo.com/channels/staffpicks',
    'https://www.loom.com/share/not-an-id',
    '/images/cover-letter.mp4',
    '/videos/../secret.mp4',
    '/videos/cover-letter.mov',
    'not a url',
  ]) {
    assert.throws(() => parseVideoUrl(link), /video|YouTube|Vimeo|Loom/i, link);
  }
});
