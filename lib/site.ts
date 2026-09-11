import type { Metadata } from "next";

export const siteUrl = "https://floatgame.io";
export const description = "Build your defense. Launch your balloons. Float is a frog-vs-lion strategy game featuring a free campaign and multiplayer.";
export const navigation = [{ href: "/game", label: "Game" }, { href: "/campaign", label: "Campaign" }, { href: "/multiplayer", label: "Multiplayer" }, { href: "/media", label: "Media" }];
export const routes = ["/", "/game", "/campaign", "/multiplayer", "/media", "/privacy", "/terms", "/contact"];

export function pageMetadata(title: string, path: string, summary = description): Metadata {
  return {
    title: path === "/" ? { absolute: title } : title,
    description: summary,
    alternates: { canonical: path },
    openGraph: { title, description: summary, url: path },
    twitter: { card: "summary", title, description: summary },
  };
}

// Set public asset paths here after approved game artwork is copied in.
export type Artwork = { src?: string; alt: string };
export const artwork: Record<string, Artwork> = {
  hero: { alt: "Frog defenders face a fleet of Lion Balloons" },
  frogs: { alt: "Frog units defending the wall" },
  lions: { alt: "Lion Balloon attack formation" },
  campaign: { alt: "The Float campaign battlefield" },
};
export const frogUnits: Artwork[] = ["Basic Frog", "Rocket Frog", "Flak Frog", "Anti-Aircraft Frog"].map((alt) => ({ alt }));
export const lionUnits: Artwork[] = ["Lion Balloon", "Shield Balloon", "War Balloon", "Dread Balloon", "Royal Airship"].map((alt) => ({ alt }));
export const multiplayerCopy = {
  title: "A rivalry with altitude.",
  description: "One side builds. One side attacks. Then roles reverse. Test your defense, launch your formations, and find the cracks in the other side’s plan.",
};
// Set either a local video source or an approved YouTube embed URL when ready.
export const trailer: { src?: string; embedUrl?: string; poster?: string } = {};
