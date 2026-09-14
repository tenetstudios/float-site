import { PatternDivider } from "@/components/pattern-divider";
import { PageIntro, TrailerSection } from "@/components/game-sections";
import { ArtworkSlot } from "@/components/artwork-slot";
import { artwork, pageMetadata } from "@/lib/site";
export const metadata = pageMetadata("Media", "/media", "Explore official Float artwork: frog defenders, Lion Balloon fleets, and a sunny fantasy battlefield. Cinematic coming soon.");
export default function MediaPage() {
  return <><PageIntro label="Media" title="Welcome to our kind of warfare."><p>Frog defenders. Lion fleets. Ridiculously good weather for a rivalry. Explore the world of Float.</p></PageIntro><PatternDivider /><section className="section media-gallery"><h2>From the battlefield</h2><div className="media-gallery-grid"><figure><ArtworkSlot asset={artwork.frogs} contain sizes="(max-width: 760px) 100vw, 45vw" /><figcaption>The Frogs / Defend the wall</figcaption></figure><figure><ArtworkSlot asset={artwork.lions} contain sizes="(max-width: 760px) 100vw, 45vw" /><figcaption>The Lions / Prepare for launch</figcaption></figure></div></section><PatternDivider /><TrailerSection /></>;
}
