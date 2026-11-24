# Framely

Production tool that extracts a **complete published Framer template** into a zip (HTML + JS + CSS + fonts + media + data), then converts it into Next.js or React with a prompt.

Live product UI: marketing site + extract/convert workspace.

## What “complete” means

Framer does **not** expose editable canvas/source files for published sites. Framely captures **everything the published site loads in a real browser**:

1. Headless Chromium opens the URL
2. Every GET network response is saved (scripts, stylesheets, fonts, images, media, JSON, HTML)
3. Page is scrolled to trigger lazy-loaded assets
4. Nested URLs inside JS/CSS bundles are discovered and downloaded
5. Initial HTML + fully rendered DOM HTML are both saved
6. Offline path rewrites + `manifest.json` + `COMPLETENESS.json` are packaged into one zip

## Quick start

```bash
npm install
npx playwright install chromium
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Optional AI rewrite

Set `AI_GATEWAY_API_KEY` for semantic Next.js/React conversion.
Without it, convert still produces a structural framework project from the extract.

### Optional Blob storage

Set `BLOB_READ_WRITE_TOKEN` for production zip storage. Locally, files live under `.data/jobs/`.

## API

### `POST /api/extract`

```json
{ "url": "https://example.framer.website", "maxPages": 12 }
```

Poll `GET /api/jobs/:id` and download `GET /api/jobs/:id/download`.

### `POST /api/convert`

JSON with `sourceJobId` + `prompt` + `framework`, or multipart zip upload.

## Zip contents

```
index.html
pages/**            # initial + *.rendered.html
assets/js/**
assets/css/**
assets/fonts/**
assets/images/**
assets/video/**
assets/data/**
manifest.json
COMPLETENESS.json
README.md
```

## Security

- SSRF checks on the seed URL
- Private IP / metadata host blocking
- Rate limits on extract/convert
- Upload size/type checks
