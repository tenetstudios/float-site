import type { Metadata } from "next";

export const siteUrl = "https://floatgame.io";
export const description = "Build your defense. Launch your balloons. Float is a frog-vs-lion strategy game with Campaign, Multiplayer, and Sandbox.";
export const navigation = [{ href: "/game", label: "Game" }, { href: "/campaign", label: "Campaign" }, { href: "/multiplayer", label: "Multiplayer" }, { href: "/sandbox", label: "Sandbox" }, { href: "/media", label: "Media" }];
export const routes = ["/", "/game", "/campaign", "/multiplayer", "/sandbox", "/media", "/about", "/privacy", "/terms", "/safety", "/contact"];

export function pageMetadata(title: string, path: string, summary = description): Metadata {
  return {
    title: path === "/" ? { absolute: title } : title,
    description: summary,
    alternates: { canonical: path },
    openGraph: { type: "website", siteName: "Float", locale: "en_US", title, description: summary, url: path, images: [{ url: "/images/hero/float-key-art.png", width: 1024, height: 1536, alt: "Float — frogs defend as Lion Balloons ascend beneath a cloud logo" }] },
    twitter: { card: "summary_large_image", title, description: summary, images: ["/images/hero/float-key-art.png"] },
  };
}

// Original supplied artwork. Unit-specific art can be added independently below.
export type Artwork = { src?: string; alt: string };
export const artwork: Record<string, Artwork> = {
  icon: { src: "/images/brand/float-icon.png", alt: "Float cloud F above a frog defender and Lion Balloons" },
  hero: { src: "/images/hero/float-key-art.png", alt: "FLOAT written in clouds above frog defenders, a stone wall, and approaching red Lion Balloons" },
  frogs: { src: "/images/frogs/float-frog-defense.png", alt: "Relaxed green frog soldiers defend a mossy stone wall beneath their purple faction flag" },
  lions: { src: "/images/lions/float-lion-base.png", alt: "A lion commander rallies navy-uniformed soldiers at a red-and-gold balloon launch base" },
  frogsKnownAssets: { src: "/images/frogs/float-frogs-known-assets.png", alt: "Frog defenders with rockets, binoculars and a cannon line a mossy wall beneath their purple flag" },
  lionsKnownAssets: { src: "/images/lions/float-lions-known-assets.png", alt: "A lion commander and aircrew oversee red and gold lion balloons from a wooden launch platform" },
  multiplayer: { src: "/images/modes/float-multiplayer.png", alt: "Frog soldiers defend floating islands with cannons as red and gold lion balloons approach" },
  sandbox: { src: "/images/modes/float-sandbox-portrait.png", alt: "A relaxed frog tinkers with a rocket in a wooden sandbox beneath floating sky islands" },
  campaign: { src: "/images/modes/float-campaign.png", alt: "A green frog soldier sits on a grassy floating island beside a red and gold lion balloon" },
};
export const frogUnits: Artwork[] = ["Basic Frog", "Rocket Frog", "Flak Frog", "Anti-Aircraft Frog"].map((alt) => ({ alt }));
export const lionUnits: Artwork[] = ["Lion Balloon", "Shield Balloon", "War Balloon", "Dread Balloon", "Royal Airship"].map((alt) => ({ alt }));
export const multiplayerCopy = {
  title: "Live exercises",
  description: "Build the defense. Launch the attack. Reverse roles.",
};
// Set either a local video source or an approved YouTube embed URL when ready.
export const trailer: { src?: string; embedUrl?: string; poster?: string } = {};
