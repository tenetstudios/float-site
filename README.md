# Float website

Independent official website for Float by Tenet Studios, targeting October 2026. This repository does not connect to or modify float-app.

## Development

```sh
npm install
npm run dev
```

Open http://localhost:3000. Production: `npm run build`, then `npm start`. Checks: `npm run lint` and `npm run build`.

Uses Next.js App Router, TypeScript, and Tailwind CSS 4. No additional dependencies or external font requests. Pages are server-rendered and statically generated; navigation and trailer anchors work without custom client JavaScript.

## Routes

- `/`: complete landing page
- `/game`: factions, defenses, and unit progression
- `/campaign`: free campaign, Hard Mode, mastery, and final boss teaser
- `/multiplayer`: competitive loop
- `/media`: cinematic and artwork slots
- `/privacy`, `/terms`: explicitly unpublished legal placeholders, excluded from indexing and sitemap until final text is approved
- `/contact`: contact publication status; no invented email address or inactive form

## Components and content

- `components/site-shell.tsx`: Header and Footer
- `components/game-sections.tsx`: Hero, SectionHeading, StorePlaceholders, GameSideSection, CampaignSection, MultiplayerSection, UnitShowcase, TrailerSection, ReleaseCTA, PageIntro
- `components/artwork-slot.tsx`: ArtworkSlot with optional Next Image and neutral fallback
- `components/information-page.tsx`: shared legal/contact page structure
- `lib/site.ts`: editable copy, navigation, metadata helper, artwork and trailer configuration
- `app/globals.css`: theme, layout, responsive breakpoints, focus states and reduced-motion support

## Adding approved artwork

Place real game assets in:

- `public/images/frogs/`: frog faction and defensive units
- `public/images/balloons/`: Lion Balloons and airships
- `public/images/campaign/`: campaign scenes
- `public/images/branding/`: hero key art, logo, final icons and social preview
- `public/video/`: local trailer and related video files

Add a `src` public URL (e.g. `/images/frogs/basic-frog.webp`) and descriptive `alt` in `lib/site.ts`, under `artwork`, `frogUnits`, or `lionUnits`. Slots retain their dimensions until images arrive. Hero and campaign use cover; unit and faction artwork uses contain. No game artwork has been generated. The text-only F favicon in `app/icon.svg` can be replaced by final branding.

## Trailer and store links

`TrailerSection` in `components/game-sections.tsx` is shared by home and media. In `lib/site.ts`, set `trailer.src` to a local video URL, optionally `poster`, or set `trailer.embedUrl` to an approved YouTube embed URL. The player replaces the placeholder inside the existing frame. Provide captions for spoken content with a track element when publishing the final video. No external video request occurs until configured.

Store labels are non-interactive availability placeholders. Replace them with verified store links in StorePlaceholders when published. The hero Watch trailer link currently leads to the clearly marked Coming Soon cinematic section.

Multiplayer role-reversal wording is provisional and centralized in `multiplayerCopy`; confirm it against the final game structure before release.

## SEO and launch preparation

Canonical origin: https://floatgame.io. Every page defines its canonical path, title, description, and Open Graph/Twitter text metadata. The root provides website identity and locale. `app/sitemap.ts` and `app/robots.ts` provide discovery. No social accounts are invented. Add an approved social preview image and switch Twitter to summary_large_image when art is available. Final legal text, verified contact channels, approved artwork, store URLs, and the trailer remain publication tasks.
