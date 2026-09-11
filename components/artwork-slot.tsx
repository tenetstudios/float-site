import Image from "next/image";
import type { Artwork } from "@/lib/site";

export function ArtworkSlot({ asset, label = "Artwork coming soon", className = "", contain = false, preload = false }: { asset: Artwork; label?: string; className?: string; contain?: boolean; preload?: boolean }) {
  return <div className={`artwork-slot ${className}`}>{asset.src ? <Image src={asset.src} alt={asset.alt} fill sizes="(max-width: 760px) 100vw, 60vw" style={{ objectFit: contain ? "contain" : "cover" }} preload={preload} /> : <div className="artwork-placeholder"><span className="slot-cross" aria-hidden="true">+</span><span>{label}</span><span className="slot-cross" aria-hidden="true">+</span></div>}</div>;
}
