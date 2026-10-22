# Olivia Jay Consulting

A modern, single-page consulting website for Olivia Jay, a Denver-based customer
success professional. Built with Vite, vanilla JavaScript, and lucide icons, and
deployed as static assets on Cloudflare Workers. All text is edited in Markdown
and rendered at build time; there is no database, form service, or tracking.
See [EDITING.md](EDITING.md) for the editing guide.

## Sections

1. **Hero**: name, consulting tagline, photo, and experience badge.
2. **Experience highlights**: a short band emphasizing depth of experience.
3. **Services**: one card per file in `content/services/`.
4. **Video cover letter**: self-hosted MP4/WebM, or a YouTube, Vimeo, or Loom link.
   It shows a "coming soon" card until a video is added.
5. **About**: background, quote, education, and location.
6. **Approach**: a three-step engagement process.
7. **Contact**: LinkedIn, plus optional email and PDF download buttons.

## Content Notes

The copy is based on Olivia's LinkedIn profile: her customer success, strategy,
and enablement headline; her About summary; Indiana University Bloomington; and
Denver, Colorado. The headshot comes from the same profile. Current-employer
details are intentionally omitted.

"Olivia Jay Consulting" is a working label, not a registered business name. The
service descriptions, approach steps, quote, and experience highlights are
proposed consulting positioning for Olivia's review. No clients, testimonials,
credentials, employment dates, or year counts have been invented. Add verified
numbers, such as years of experience, in `content/highlights.md`.

The LinkedIn PDF used as source material is excluded from Git by `.gitignore`
because it also contains other people's profiles.

## Local Development

Requires Node.js 20.19+ or 22.12+ and npm:

```sh
npm install
npm run dev        # live preview at http://127.0.0.1:5173
npm test           # content, video-link, and configuration tests
npm run build      # production files in dist/
npm run worker:dev # production preview on the Cloudflare runtime (port 8787)
```

On this machine Node is not installed system-wide. The VS Code tasks in
`.vscode/tasks.json` use a portable Node 22 downloaded from nodejs.org (checksum
verified) to `%TEMP%\olivia-website-tools`. If that folder is cleared, install
Node normally and change the task `command` values to `node`.

## Deploy to Cloudflare Workers

1. Sign in: `npx wrangler login`
2. Check the Worker name in `wrangler.jsonc`, then run `npm run deploy`.
3. Wrangler prints the `workers.dev` address. Add a custom domain under
   **Workers & Pages > olivia-jay-website > Settings > Domains & Routes**.

For Git-based deploys, connect the repository with Cloudflare Workers Builds and
use `npm run build` as the build command and `npx wrangler deploy` as the deploy
command. Commit `package.json` and `package-lock.json` together; a test checks that
the lockfile contains every Cloudflare runtime platform package that `npm ci` needs.

## Video Hosting

Local video files are served by Cloudflare with no third-party requests and no
sign-in prompts. Cloudflare limits static files to 25 MiB, and the build enforces
that limit. Embedded links are converted at build time to privacy-friendly players:
`youtube-nocookie.com`, Vimeo with do-not-track, and Loom. The Content Security
Policy in `public/_headers` only allows frames from those three providers.
YouTube can still ask some visitors to sign in (bot checks). The site can't
prevent that, so each embed shows a "Watch on …" fallback link.

## Project Structure

- `content/`: all editable text (Markdown with YAML settings).
- `public/images`, `public/videos`, `public/files`: photo, video, and downloads.
- `index.html`: Handlebars layout template; ordinary edits don't go here.
- `build/content.js`: Markdown rendering, validation, and live reload.
- `build/video.js`: converts video links into safe embed URLs.
- `src/style.css`: colors, typography, and responsive layout.
- `src/main.js`, `src/icons.js`: mobile navigation, active links, and icons.
- `public/_headers`: security headers and Content Security Policy.
- `wrangler.jsonc`: Cloudflare Worker static-asset configuration.

## Privacy

There are no analytics, cookies, or form submissions. Google Fonts serves the
typefaces, and Cloudflare hosts the site. Embedded video providers apply their
own policies when a visitor plays a video.
