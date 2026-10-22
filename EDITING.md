# Editing the Website

Edit the Markdown files in [content](content) instead of the HTML. The design
lives in the shared template and stylesheet; Vite builds the finished page from
your text.

## Where to Edit

| Content | File |
| --- | --- |
| Name, "Consulting" label, browser title, search description, navigation, LinkedIn URL, location | [content/site.md](content/site.md) |
| Top of the page: tagline, introduction, photo, badge, buttons | [content/hero.md](content/hero.md) |
| Dark experience band (Seasoned / Proven / Adaptable) | [content/highlights.md](content/highlights.md) |
| Services introduction | [content/services.md](content/services.md) |
| Individual services | [content/services/](content/services) |
| Video cover letter | [content/video.md](content/video.md) |
| About, quote, education | [content/about.md](content/about.md) |
| How we'll work together (steps) | [content/approach.md](content/approach.md) |
| Contact text, email, downloadable PDF | [content/contact.md](content/contact.md) |

## The Two Parts of a File

Settings sit at the top, between `---` lines. Change the values but keep the
field names and indentation:

```yaml
heading: |
  A career built in
  *customer success.*
```

A `|` starts a multiline value. Headings, titles, taglines, and quotes support
Markdown emphasis: `*text*` becomes the coral italic accent.

After the second `---`, write normal Markdown paragraphs and lists. Separate
paragraphs with a blank line. Use spaces, not tabs. Put quotes around a value that
contains `: ` or `#`. Raw HTML is disabled.

## Adding the Video Cover Letter

Open [content/video.md](content/video.md) and set `video_url`. The video replaces
the "Video coming soon" card.

**Recommended: host the file with the website.** It plays in every browser with
no sign-in prompts, ads, or recommended videos afterwards.

1. Export the video as **MP4** (H.264). 720p keeps a two-minute video small.
2. Copy it into [public/videos](public/videos), for example
   `public/videos/cover-letter.mp4`.
3. Set `video_url: /videos/cover-letter.mp4`.
4. Optional: add a still image to `public/images` and set
   `poster: /images/video-poster.jpg`. That picture shows before playback starts.

Cloudflare hosts files up to **25 MB**. The build stops with a clear message if the
video is larger. Export at a lower resolution, or use a video service instead.

**Alternatively, paste a share link** from YouTube, Vimeo, or Loom:

```yaml
video_url: "https://www.loom.com/share/0123456789abcdef0123456789abcdef"
```

Vimeo and Loom work well for professional videos. YouTube sometimes shows
"Sign in to confirm you're not a bot" to visitors on VPNs, privacy browsers, or
company networks, which a website cannot turn off. A "Watch on …" link appears
below every embedded video as a fallback. For an unlisted Vimeo video, paste the
full share link including the privacy code after the number.

`duration`, `highlights`, and `transcript` describe the video. Leave
`transcript: ""` to hide it, or write it like this:

```yaml
transcript: |
  Hi, I'm Olivia.

  Second paragraph of the transcript.
```

## Services, Highlights, and Steps

Each service is its own file in [content/services](content/services). To add one,
copy a file and give it the next number, such as `04-training.md`. Files appear in
filename order. Delete a file to remove a service.

Available icons: `compass`, `rocket`, `target`, `heart-handshake`, `lightbulb`,
`users-round`, `sparkles`, `briefcase-business`, `graduation-cap`. The build lists
them if you choose an unknown name.

In [content/highlights.md](content/highlights.md), `value` can be a word or a
number. To feature years of experience, for example:

```yaml
  - value: "10+"
    label: Years in customer success
```

## Contact, Email, and PDF Download

In [content/contact.md](content/contact.md):

- `email`: a public address adds an **Email me** button. Leave `""` to hide it.
- `resume_url`: put a PDF in [public/files](public/files) and set, for example,
  `/files/olivia-jay.pdf` to add a download button. Leave `""` to hide it.

Never put passwords or private details in these files; everything is public.

## Photos

Put images in [public/images](public/images) and refer to them as
`/images/name.jpg`. A missing image or file stops the build with a clear error
instead of publishing a broken page.

## Preview, Build, and Publish

1. In VS Code, run **Terminal > Run Task > Edit website (live preview)**.
2. Open http://127.0.0.1:5173. The page refreshes each time you save.
3. Run **Terminal > Run Task > Build website** before publishing.
4. Commit and push your changes. Cloudflare rebuilds the site automatically if
   Workers Builds is connected (see [README.md](README.md)).
