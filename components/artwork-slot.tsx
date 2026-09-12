import Image from "next/image";
import type { Artwork } from "@/lib/site";

export function ArtworkSlot({ asset, label = "Unit artwork coming soon", className = "", contain = false, preload = false, sizes = "(max-width: 760px) 100vw, 60vw", position = "center" }: { asset: Artwork; label?: string; className?: string; contain?: boolean; preload?: boolean; sizes?: string; position?: string }) {
  return <div className={`artwork-slot ${asset.src ? "has-art" : "awaiting-art"} ${className}`}>{asset.src ? <Image src={asset.src} alt={asset.alt} fill sizes={sizes} style={{ objectFit: contain ? "contain" : "cover", objectPosition: position }} preload={preload} /> : <div className="artwork-placeholder"><span aria-hidden="true">+</span><span>{label}</span></div>}</div>;
}
