import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Handlebars from 'handlebars';
import MarkdownIt from 'markdown-it';
import frontMatter from 'markdown-it-front-matter';
import { parse as parseYaml } from 'yaml';
import { iconNames } from '../src/icons.js';
import { parseVideoUrl } from './video.js';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const contentDirectory = path.join(projectRoot, 'content');
const publicDirectory = path.join(projectRoot, 'public');
const inlineMarkdown = new MarkdownIt({ html: false, breaks: true });
const blockMarkdown = new MarkdownIt({ html: false });
const inlineFields = new Set(['heading', 'title', 'tagline', 'intro', 'quote', 'placeholder_heading']);
const blockFields = new Set(['transcript']);
const imageFields = new Set(['image', 'poster']);
const linkPattern = /^(https?:\/\/|mailto:|#[\w-]+$|\/(?!\/))/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Cloudflare Workers static assets are limited to 25 MiB per file.
const maxAssetBytes = 25 * 1024 * 1024;
const virtualId = 'virtual:site-content';
const resolvedVirtualId = `\0${virtualId}`;

const linkedinSvg =
  '<svg class="brand-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z"/></svg>';

const templates = Handlebars.create();
templates.registerHelper('number', (index) => String(index + 1).padStart(2, '0'));
templates.registerHelper('mailto', (email) => `mailto:${encodeURIComponent(email)}`);
templates.registerHelper('linkedin_icon', () => new Handlebars.SafeString(linkedinSvg));

function isLinkField(key) {
  return key === 'href' || key.endsWith('_href') || key.endsWith('_url');
}

function assertPublicFile(publicPath, kind) {
  const filePath = path.resolve(publicDirectory, `.${decodeURI(publicPath.split(/[?#]/)[0])}`);
  if (!filePath.startsWith(publicDirectory + path.sep) || !existsSync(filePath)) {
    throw new Error(`${kind} not found: ${publicPath}. Put the file in the public folder (for example public${publicPath}).`);
  }
}

function enrich(value) {
  if (Array.isArray(value)) return value.map(enrich);
  if (!value || typeof value !== 'object') return value;
  const result = {};
  for (const [key, entry] of Object.entries(value)) {
    result[key] = enrich(entry);
    if (typeof entry !== 'string') continue;
    const text = entry.trim();
    if (inlineFields.has(key)) result[`${key}_html`] = inlineMarkdown.renderInline(text);
    if (blockFields.has(key)) result[`${key}_html`] = blockMarkdown.render(text);
    if (key === 'email' && text && !emailPattern.test(text)) {
      throw new Error('Invalid public email address. Use a valid address or leave email as "".');
    }
    if (key === 'icon' && !iconNames.includes(text)) {
      throw new Error(`Unknown icon "${entry}". Choose one of: ${iconNames.join(', ')}.`);
    }
    if (imageFields.has(key) && text) {
      if (!text.startsWith('/images/')) throw new Error(`"${key}" must point to a file in public/images, for example /images/photo.jpg.`);
      assertPublicFile(text, 'Image');
    }
    if (isLinkField(key) && text) {
      if (!linkPattern.test(text)) throw new Error(`Invalid link in "${key}": use https://, mailto:, /path, or #section.`);
      if (text.startsWith('/')) assertPublicFile(text, 'File');
    }
  }
  return result;
}

export function parseContent(source, filename = 'content.md') {
  try {
    let metadata;
    const markdown = new MarkdownIt({ html: false });
    markdown.use(frontMatter, (header) => {
      metadata = parseYaml(header);
    });
    const bodyHtml = markdown.render(source);
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
      throw new Error('Start the file with a YAML settings block between --- lines.');
    }
    const content = { ...enrich(metadata), body_html: bodyHtml };
    if ('video_url' in metadata) {
      content.player = parseVideoUrl(metadata.video_url);
      if (content.player.is_file && statSync(path.join(publicDirectory, content.player.src)).size > maxAssetBytes) {
        throw new Error('The video is larger than 25 MB, the most Cloudflare can host per file. Export it at 720p or use a Vimeo, Loom, or YouTube link.');
      }
    }
    return content;
  } catch (error) {
    throw new Error(`${filename}: ${error.message}`, { cause: error });
  }
}

function readContent(filename) {
  return parseContent(readFileSync(filename, 'utf8'), path.relative(projectRoot, filename));
}

export function loadContent(directory = contentDirectory) {
  const content = {};
  for (const entry of readdirSync(directory, { withFileTypes: true }).sort((first, second) => first.name.localeCompare(second.name))) {
    if (entry.isFile() && entry.name.endsWith('.md')) {
      content[path.basename(entry.name, '.md')] = readContent(path.join(directory, entry.name));
    } else if (entry.isDirectory()) {
      content[`${entry.name}_items`] = readdirSync(path.join(directory, entry.name))
        .filter((name) => name.endsWith('.md'))
        .sort()
        .map((name) => readContent(path.join(directory, entry.name, name)));
    }
  }
  return content;
}

export function renderPage(template, content = loadContent()) {
  return templates.compile(template, { strict: true })(content);
}

export function markdownContentPlugin() {
  return {
    name: 'markdown-site-content',
    transformIndexHtml: {
      order: 'pre',
      handler: (html) => renderPage(html),
    },
    resolveId(id) {
      if (id === virtualId) return resolvedVirtualId;
    },
    load(id) {
      if (id !== resolvedVirtualId) return;
      const { site } = loadContent();
      return `export default ${JSON.stringify({ site: { open_navigation_label: site.open_navigation_label, close_navigation_label: site.close_navigation_label } })};`;
    },
    configureServer(server) {
      server.watcher.add(contentDirectory);
      const reloadContent = (filename) => {
        const relativePath = path.relative(contentDirectory, path.resolve(filename));
        if (relativePath.startsWith(`..${path.sep}`) || path.isAbsolute(relativePath) || !filename.endsWith('.md')) return;
        const module = server.moduleGraph.getModuleById(resolvedVirtualId);
        if (module) server.moduleGraph.invalidateModule(module);
        server.ws.send({ type: 'full-reload', path: '*' });
      };
      server.watcher.on('add', reloadContent);
      server.watcher.on('change', reloadContent);
      server.watcher.on('unlink', reloadContent);
    },
  };
}
