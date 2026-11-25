# 11 · Sharing and search basics

Status: **approved by owner, 25 Nov 2026** · Checklist item 11 · Blocks Stage 6

## Page metadata (Next.js `metadata` export per route)

| Route | `<title>` | `description` |
|---|---|---|
| `/` | Care Navigator — plan care for an older parent | Work out which care services fit, what they may cost after the 2026 subsidies, and who to call first. About 5 minutes. Nothing is saved. |
| `/plan` | Your care plan — Care Navigator | Same as above. |
| `/about` | About — Care Navigator | An independent student project. Not affiliated with MOH or AIC. |
| `/privacy` | Privacy — Care Navigator | What this site does and doesn't collect. |
| `/data-sources` | Data sources — Care Navigator | The open data and official pages behind every figure. |

Name and domain are from decision 5 (renamed Care Navigator, 25 Nov 2026). The address is `care-navigator-xi.vercel.app`, the one Vercel gave because `care-navigator` was taken. If it changes, update `web/src/app/layout.tsx` and `web/public/sitemap.xml`.

## Link preview card (WhatsApp, Telegram, LinkedIn)

On every route:

```html
<meta property="og:type" content="website">
<meta property="og:site_name" content="Care Navigator">
<meta property="og:title" content="Plan care for an older parent in 5 minutes">
<meta property="og:description" content="See what care may cost after 2026 subsidies, and who to call first. Nothing is saved.">
<meta property="og:image" content="https://care-navigator-xi.vercel.app/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="https://care-navigator-xi.vercel.app/">
<meta name="twitter:card" content="summary_large_image">
```

- **`og.png`:** 1200×630, under 300 KB, in the warm palette (deep clay background, cream text). It shows the name and the one-line promise, with no photos of people. WhatsApp crops to a square on some phones, so keep the text in the centre 630×630.
- **Privacy:** the plan lives in the hash (`#…`), and the hash is never sent to a server or read by link-preview bots. So every shared plan link shows the same generic card. That is deliberate: no answers appear in previews.
- **Icons:** `icon.svg` (scalable), `icon-32.png`, and a 180×180 `apple-touch-icon.png`. Next.js serves them from `web/src/app/` as `icon.svg`, `icon.png` and `apple-icon.png`; no `.ico` is needed. Source files and the 1200×630 `og.png` are in `docs/brand/`.

## Search engines

- `sitemap.xml`: the 5 routes from spec 06, generated at build time with `lastmod` = `dataVersion` date.
- `<link rel="canonical">` on every route.
- `lang="en-SG"` on `<html>`.
- **Prototype (decision 2):** every page carries `<meta name="robots" content="noindex, nofollow">`. `robots.txt` still allows everything, because a `Disallow` rule can stop WhatsApp's and Telegram's preview crawlers from reading the `og:` tags. The `noindex` tag keeps search engines from listing the site while previews still load. Before a public launch: remove the `noindex` tag and point `robots.txt` to the sitemap.

## Tests (Stage 6)

| Test | How | Pass when |
|---|---|---|
| WhatsApp card | Paste the production URL into WhatsApp on iOS and Android | The card shows the title, description and image |
| WhatsApp in-app browser | Open a shared plan link from a WhatsApp chat on iOS and Android | The plan opens on the action-plan step with all answers; print and share still work |
| Telegram card | Paste the URL into Telegram | The card shows |
| Card debugger | [opengraph.xyz](https://www.opengraph.xyz) or LinkedIn Post Inspector | No missing tags |
| iPhone print | Safari → Share → Print on the action plan | It fits one A4 page and no footer chrome overlaps |
| Android print | Chrome → Print → Save as PDF | Same |
| Lighthouse SEO | One manual run (checklist item 14) | SEO score 100 |
