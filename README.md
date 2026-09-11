# Float website

Independent official website for Float by Tenet Studios, targeting October 2026. This repository does not connect to or modify float-app.

## Development

```sh
npm install
npm run dev
```

Open http://localhost:3000. Production: `npm run build`, then `npm start`. Required checks: `npm run lint` and `npm run build`.

Next.js App Router, TypeScript, Tailwind CSS 4. No additional dependencies or external font requests. Pages are statically generated. Native links and horizontal scrolling work without custom client JavaScript.

## Routes

`/`, `/game`, `/campaign`, `/multiplayer`, `/media`, `/privacy`, `/terms`, `/contact`.

Privacy and terms are explicitly unpublished placeholders, excluded from indexing and sitemap until final text is approved. Contact has no invented address or inactive form.

## Components and content

- `components/site-shell.tsx`: Header and Footer
- `components/game-sections.tsx`: Hero, ThisIsFloat, SectionHeading, StorePlaceholders, GameSideSection, CampaignSection, MultiplayerSection, UnitShowcase, TrailerSection, ReleaseCTA, PageIntro
- `components/artwork-slot.tsx`: Next Image wrapper with configurable sizes, object position, contain/cover, preload, and neutral fallback
- `components/information-page.tsx`: legal/contact page structure
- `lib/site.ts`: copy, navigation, metadata helper, artwork, unit rosters, and trailer configuration
- `app/globals.css`: Float color tokens, typography, responsive layout, focus states, and reduced motion support

## Supplied artwork

Original PNG files are preserved without modification:

| File | Website use |
| --- | --- |
| `public/images/brand/float-icon.png` | Header, release section, favicon and Apple icon |
| `public/images/hero/float-key-art.png` | Main hero, soft hero background, This Is Float, campaign, social metadata |
| `public/images/frogs/float-frog-defense.png` | Frog faction, multiplayer left half, media gallery |
| `public/images/lions/float-lion-base.png` | Lion faction, multiplayer right half, cinematic placeholder, media gallery |

Images use Next.js responsive optimization; only the main hero uses preload (the Next.js 16 replacement for priority). No generated artwork or new image dependencies.

The hero foreground uses contain to preserve the cloud logo, balloons, and frog defenders. Desktop has a light edge mask and a tinted secondary backdrop; mobile displays the full 2:3 poster without masking, followed by the copy. The overview crops the key art at 50% 76%, campaign at 50% 65%, frog faction at 43% 52%, and lion faction at 42% 50%. Mobile factions use the source aspect ratios; desktop fills large artwork regions. Media displays complete original compositions.

## Unit artwork

Individual units still have neutral, clearly labeled poster slots. The supplied faction scenes are not presented as unit portraits. Add a public `src` and descriptive `alt` to `frogUnits` or `lionUnits` in `lib/site.ts` when approved individual assets arrive. Existing `public/images/balloons/` can hold offensive unit art. Both rosters scroll horizontally with touch, trackpad, or keyboard focus and arrow keys.

## Color tokens

`app/globals.css` defines `--float-sky`, `--float-sky-light`, `--float-cloud`, `--float-frog-green`, `--float-frog-purple`, `--float-lion-red`, `--float-lion-gold`, `--float-navy`, `--float-olive`, `--float-stone`, `--float-wood`, and `--float-ink`.

Default surfaces are sunny blue and warm cloud white, with strong purple and red faction sections. Deep navy is reserved for the cinematic and readable accents.

## Trailer and stores

Set `trailer.src` in `lib/site.ts` to a local video URL under `public/video/`, with optional `poster`, or set `trailer.embedUrl` to an approved YouTube embed URL. `TrailerSection` replaces the placeholder inside its existing 16:9 frame. Add captions for spoken content when publishing the video. No external video request occurs until configured.

Store labels are non-interactive Coming Soon placeholders. Replace them with verified URLs in StorePlaceholders when published. Hero Watch Trailer leads to the clearly labeled cinematic placeholder; Coming Soon leads to release availability.

Multiplayer role-reversal wording remains centralized in `multiplayerCopy`; confirm against the final game structure before release.

## SEO and publication

Canonical origin: https://floatgame.io. Page-specific canonical paths, titles, descriptions, Open Graph, and Twitter metadata are preserved. Supplied key art is the social image; platforms may crop its portrait composition. A dedicated landscape social export can replace it later. No social accounts are invented. `app/sitemap.ts` and `app/robots.ts` provide discovery.

Final legal text, verified contact channels, unit art, store URLs, and the trailer remain publication tasks.
