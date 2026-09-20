# Float website

Independent website for Float by Tenet Studios. This repository does not modify the game.

## Development

Run `npm install` and `npm run dev`. Production: `npm run build`, then `npm start`.
Checks: `npm run lint`, `npx tsc --noEmit`, and `npm run build`.

Private acquisition reporting is available at `/admin`. See [setup, manual SQL, environment variables and validation](docs/acquisition.md).
The same page includes collapsible Retention, Engagement, Multiplayer, Monetization, Progression and Technical health sections. See [retention setup and planned metrics](docs/retention.md).
Engagement now reports campaign attempts, outcomes, measured durations and placements. See [Engagement reporting setup](docs/engagement.md).

Next.js App Router, TypeScript, Tailwind CSS 4. No new dependencies or external fonts.

## Homepage

The homepage is the Lion Intelligence Directorate archive: a single viewport composition with a large physical dossier, file 773-19-042. The header and footer are separate from the existing game/content layout. Styles live in `app/intelligence.css`; `app/globals.css` continues to style the retained pages.

- `components/intelligence/shell.tsx`: IntelligenceHeader and SiteFooter.
- `components/intelligence/dossier.tsx`: DossierHero, DossierCover, DossierViewer, DossierTabs and DossierDocument.
- `lib/dossier.ts`: five category definitions and optional approved report content.
- `public/images/intelligence/`: original folder source and corrected header insignia source. See its README for asset replacement details and the imagegen prompt.

The folder and access button open the viewer in place. CSS moves the cover away and reveals the papers. Tabs switch documents without navigation. Enter/Space open the file; arrows/Home/End navigate tabs; Close File or Escape close it. Focus enters the selected tab and returns to the folder on close. Reduced motion disables animations. On small screens, file tabs scroll horizontally and only the paper content scrolls vertically.

All five reports remain intentionally pending. Replace each section's optional `content` with approved report components; do not invent reconnaissance, personnel or weapon records.

## Routes

`/`, `/about`, `/game`, `/campaign`, `/multiplayer`, `/media`, `/privacy`, `/terms`, `/safety`, `/contact`.

Existing pages were moved unchanged into `app/(site)/` with their original shared header/footer. URLs are unchanged. About and Safety are new minimal pages. Privacy, Terms and Contact retain their existing publication placeholders. Safety also awaits approved copy. App Store and Google Play buttons are disabled Coming Soon placeholders.

## Browser verification

Start the server on port 3100, then run `node scripts/verify-intelligence.mjs`. Alternatively set `ARCHIVE_TEST_URL` to a running local server. Set `CHROME_PATH` if Chrome is installed elsewhere. This dependency-free script launches a temporary headless browser, checks 320, 375, 390, 430, 768, 1024, 1440 and 1920px widths, checks open/close, all five tabs, keyboard focus, reduced motion, overflow and route responses, and saves desktop/mobile screenshots to `artifacts/`.

## Retained content

`components/game-sections.tsx`, `components/site-shell.tsx`, `components/artwork-slot.tsx` and `components/information-page.tsx` continue to serve the existing game and information pages. Original game art remains under `public/images/brand`, `hero`, `frogs` and `lions`. Metadata, canonical routes, robots and sitemap remain available.

`lib/site.ts` retains game artwork, unit slots and trailer configuration. Set approved unit art and trailer URLs there when available. Legal text, safety guidance, verified contact details, store links and dossier reports remain publication tasks.
