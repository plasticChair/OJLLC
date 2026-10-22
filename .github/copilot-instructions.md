# Project Instructions

- Single-page consulting website for Olivia Jay, built with Vite, vanilla JavaScript, lucide icons, and Cloudflare Workers static assets.
- All copy lives in `content/*.md` and is rendered at build time by `build/content.js`; keep text out of `index.html`.
- Do not mention Olivia's current employer. Do not invent clients, testimonials, credentials, employment dates, or year counts.
- "Olivia Jay Consulting" is a working label, not a registered business name.
- The video section accepts local `/videos/*.mp4|webm` files (preferred; 25 MiB limit) or YouTube, Vimeo, and Loom links parsed by `build/video.js`. Keep `public/_headers` `frame-src` in sync with supported providers.
- Add new icons to `src/icons.js` before using them in Markdown.
- Write files as UTF-8 without a byte-order mark (Cloudflare `_headers` breaks with a BOM).
- Run `npm test` and `npm run build` after changes.
