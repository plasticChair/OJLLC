import assert from 'node:assert/strict';
import { readFileSync, rmSync, truncateSync, writeFileSync } from 'node:fs';
import test from 'node:test';
import Handlebars from 'handlebars';
import { loadContent, parseContent, renderPage } from '../build/content.js';

const template = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('Markdown settings, emphasis, paragraphs, and lists render without HTML editing', () => {
  const content = parseContent('---\nheading: "Customer *success*"\n---\n\nA **strong** start.\n\n- Onboarding\n- Enablement\n');
  assert.equal(content.heading_html, 'Customer <em>success</em>');
  assert.ok(content.body_html.includes('<strong>strong</strong>'));
  assert.ok(content.body_html.includes('<li>Enablement</li>'));
});

test('raw HTML and unsafe Markdown links cannot introduce executable markup', () => {
  const content = parseContent('---\nheading: "<script>alert(1)</script>"\ntranscript: "<script>x</script>"\n---\n\n<script>alert(1)</script>\n\n[bad](javascript:alert(1))');
  assert.ok(!content.heading_html.includes('<script>'));
  assert.ok(!content.transcript_html.includes('<script>'));
  assert.ok(!content.body_html.includes('<script>'));
  assert.ok(!content.body_html.includes('href="javascript:'));
});

test('invalid YAML, unsafe links, missing files, emails, and icons fail clearly', () => {
  assert.throws(() => parseContent('---\nheading: [\n---\n', 'broken.md'), /broken\.md:/);
  assert.throws(() => parseContent('Just a paragraph.'), /YAML settings block/);
  assert.throws(() => parseContent('---\nprimary_href: "javascript:alert(1)"\n---\n'), /Invalid link/);
  assert.throws(() => parseContent('---\nimage: /images/missing-test-image.jpg\n---\n'), /Image not found/);
  assert.throws(() => parseContent('---\nimage: /photo.jpg\n---\n'), /public\/images/);
  assert.throws(() => parseContent('---\nresume_url: /files/missing-resume.pdf\n---\n'), /File not found/);
  assert.throws(() => parseContent('---\nresume_url: /../package.json\n---\n'), /File not found/);
  assert.throws(() => parseContent('---\nemail: not-an-email\n---\n'), /Invalid public email/);
  assert.throws(() => parseContent('---\nicon: not-a-real-icon\n---\n'), /Unknown icon/);
});

test('empty optional links are allowed', () => {
  const content = parseContent('---\nresume_url: ""\nposter: ""\nemail: ""\n---\n');
  assert.equal(content.resume_url, '');
});

test('page template renders the real Markdown content and escapes ordinary settings', () => {
  const content = loadContent();
  const html = renderPage(template, content);
  assert.ok(html.includes(Handlebars.escapeExpression(content.site.name)));
  assert.ok(html.includes(content.hero.tagline_html));
  assert.ok(html.includes('id="video"'));
  assert.ok(!html.includes('{{'));
  assert.equal(renderPage('{{hero.eyebrow}}', { hero: { eyebrow: '<b>Not HTML</b>' } }), '&lt;b&gt;Not HTML&lt;/b&gt;');
});

test('service files generate one card per Markdown file, and highlights and steps render', () => {
  const content = loadContent();
  content.services_items.push({ ...content.services_items[0], title_html: 'An additional service' });
  const html = renderPage(template, content);
  assert.equal(html.match(/class="service-card"/g).length, content.services_items.length);
  assert.ok(html.includes('An additional service'));
  assert.equal(html.match(/class="highlight"/g).length, content.highlights.highlights.length);
  assert.equal(html.match(/class="approach-step"/g).length, content.approach.steps.length);
});

test('the site no longer mentions a current employer', () => {
  const html = renderPage(template, loadContent());
  assert.ok(!/connecteam/i.test(html));
});

test('video section shows a placeholder, an embed, or a local file', () => {
  const content = loadContent();
  content.video.player = parseContent('---\nvideo_url: ""\n---\n').player;
  assert.ok(renderPage(template, content).includes('class="video-placeholder"'));

  content.video.player = parseContent('---\nvideo_url: "https://youtu.be/dQw4w9WgXcQ"\n---\n').player;
  let html = renderPage(template, content);
  assert.ok(html.includes(`<iframe src="${Handlebars.escapeExpression('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0')}"`));
  assert.ok(html.includes(`href="${Handlebars.escapeExpression('https://www.youtube.com/watch?v=dQw4w9WgXcQ')}"`));
  assert.ok(html.includes('class="video-fallback"'));
  assert.ok(!html.includes('class="video-placeholder"'));

  content.video.player = { has_video: true, is_embed: false, is_file: true, src: '/videos/cover-letter.mp4', mime: 'video/mp4', provider: 'file', provider_name: '', watch_url: '' };
  content.video.poster = '/images/olivia-jay.jpg';
  html = renderPage(template, content);
  assert.ok(html.includes('<source src="/videos/cover-letter.mp4" type="video/mp4" />'));
  assert.ok(html.includes('poster="/images/olivia-jay.jpg"'));
  assert.ok(!html.includes('class="video-fallback"'));
});

test('local videos over the Cloudflare 25 MB file limit fail with guidance', () => {
  const file = new URL('../public/videos/size-limit-test.mp4', import.meta.url);
  writeFileSync(file, '');
  truncateSync(file, 26 * 1024 * 1024);
  try {
    assert.throws(() => parseContent('---\nvideo_url: /videos/size-limit-test.mp4\n---\n'), /larger than 25 MB/);
  } finally {
    rmSync(file);
  }
});

test('optional transcript, email, and résumé appear only when set', () => {
  const content = loadContent();
  Object.assign(content.video, { transcript_html: '' });
  Object.assign(content.contact, { email: '', resume_url: '' });
  let html = renderPage(template, content);
  assert.ok(!html.includes('class="transcript"'));
  assert.ok(!html.includes('href="mailto:'));

  Object.assign(content.video, { transcript_html: '<p>Hello there.</p>' });
  Object.assign(content.contact, { email: 'olivia+site@example.com', resume_url: '/favicon.svg' });
  html = renderPage(template, content);
  assert.ok(html.includes('<p>Hello there.</p>'));
  assert.ok(html.includes('href="mailto:olivia%2Bsite%40example.com"'));
  assert.ok(html.includes('href="/favicon.svg"'));
});
