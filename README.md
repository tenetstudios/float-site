# Float website

Independent official website for Float by Tenet Studios, targeting October 2026. This repository does not connect to or modify float-app.

## Development

```sh
npm install
npm run dev
```

Open http://localhost:3000. Production: `npm run build`, then `npm start`. Checks: `npm run lint` and `npm run build`.

Next.js App Router, TypeScript, Tailwind CSS 4. No additional dependencies or external fonts. Routes are statically generated; navigation, anchors, and inventory scrolling use native browser behavior.

## Routes

`/`, `/game`, `/campaign`, `/multiplayer`, `/media`, `/privacy`, `/terms`, `/contact`.

Privacy and terms remain unpublished placeholders, excluded from indexing and sitemap until approved. Contact has no invented address or inactive form. Existing metadata and canonical paths are preserved.

## Field-report homepage

The homepage is an editorial military briefing, using bright original artwork, cream paper surfaces, thin rules, small technical fields, and asymmetric image studies. Humor lives in secondary captions and labels.

Sequence:

1. Field Report 001: main artwork, release date, and a small observation caption
2. Current Situation: Lions / Frogs / Wall / Outcome status strip
3. Defensive Asset and Hostile Airframe: large images, margin records, tiny captions
4. Opposing Doctrines: open editorial split
5. Field Operations: campaign requirements as a dossier
6. Live Exercises: defender/attacker role diagram
7. Defensive Inventory and Known Lion Activity: designation records
8. Classified final campaign threat: text only, no invented boss art
9. Visual Record: cinematic screening status and future 16:9 player
10. Deployment: October 2026 and store availability

Campaign rows describe known features, not invented mission names. Unit costs/ranges and unconfirmed units are not fabricated. Role-reversal wording remains provisional and centralized in `multiplayerCopy` in `lib/site.ts`.

## Components

- `components/site-shell.tsx`: editorial Header and Footer
- `components/game-sections.tsx`: existing shared sections, plus SituationStrip, AssetReport, TechnicalFields, and ClassifiedThreat
- `components/artwork-slot.tsx`: responsive Next Image wrapper with configurable sizes, crop position, contain/cover, preload, and neutral fallback
- `components/information-page.tsx`: unchanged legal/contact page structure
- `lib/site.ts`: navigation, metadata, artwork, unit rosters, and trailer configuration
- `app/globals.css`: Float tokens and responsive editorial styling

## Artwork and crops

The supplied PNGs are preserved without modification:

| Asset | Use |
| --- | --- |
| `public/images/brand/float-icon.png` | Favicon and Apple icon |
| `public/images/hero/float-key-art.png` | Opening photograph, campaign file, social metadata |
| `public/images/frogs/float-frog-defense.png` | Defensive asset study, doctrine, media |
| `public/images/lions/float-lion-base.png` | Hostile airframe study, doctrine, media |

There are no image washes, duplicate tinted hero backgrounds, masks, or opaque text overlays. Captions and records sit outside the art. The desktop opening uses a full-width crop at 50% 43%; mobile shows the complete 2:3 composition. The frog study uses 35% 35% (35% 30% on mobile), preserving the relaxed frog. The lion study uses 60% 35%. Campaign crops at 50% 68%. Media preserves full original compositions.

Only the opening image is preloaded. Other art loads lazily using Next.js image optimization and responsive sizes.

## Inventory and classified art

Individual units retain neutral Visual record pending slots. Add public `src` paths and descriptive `alt` text in `frogUnits` or `lionUnits` in `lib/site.ts`. Faction scenes are not misrepresented as unit portraits. Inventory rows scroll horizontally when needed, including with keyboard focus and arrow keys. No final-boss image or silhouette has been invented.

## Color system

Retained tokens: `--float-sky`, `--float-sky-light`, `--float-cloud`, `--float-frog-green`, `--float-frog-purple`, `--float-lion-red`, `--float-lion-gold`, `--float-navy`, `--float-olive`, `--float-stone`, `--float-wood`, and `--float-ink`.

Cream dominates the editorial space. Purple and red identify faction records; pale sky supports tactical and deployment sections. Deep navy is reserved for the visual-record screening section. No glowing borders, rounded feature cards, or decorative motion.

## Trailer and stores

Set `trailer.src` in `lib/site.ts` to a local URL under `public/video/`, optionally with `poster`, or set `trailer.embedUrl` to an approved YouTube embed URL. TrailerSection replaces the Awaiting transmission placeholder within the existing 16:9 frame. Add captions for spoken content when publishing. No external video loads before configuration.

Store availability is non-interactive until real links exist. Replace StorePlaceholders entries with verified store URLs when published. The header links to existing content routes; the opening Continue link leads to Current Situation.

## SEO and publication

Canonical origin: https://floatgame.io. Page-specific titles, descriptions, canonicals, Open Graph, Twitter metadata, sitemap, and robots remain in place. The supplied key art is the social image; platforms may crop its portrait aspect ratio. No social accounts are invented.

Final legal text, contact details, individual unit artwork, store URLs, and trailer remain publication tasks.
