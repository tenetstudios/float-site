"use client";

import Image from "next/image";
import { useState, type KeyboardEvent } from "react";
import type { DossierPage } from "@/lib/dossier";

export function DossierPages({ pages, label }: { pages: readonly DossierPage[]; label: string }) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const report = pages[index];

  function navigate(step: number) {
    setDirection(step);
    setIndex(current => Math.max(0, Math.min(pages.length - 1, current + step)));
  }
  function handleKey(event: KeyboardEvent<HTMLElement>) {
    if ((event.target as HTMLElement).closest("input, textarea, select, [contenteditable]")) return;
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    navigate(event.key === "ArrowRight" ? 1 : -1);
  }

  if (!report) return null;

  return (
    <div className="field-reports" tabIndex={0} aria-label={`${label}. Tap the left half for the previous page or the right half for the next page. You can also use left and right arrow keys.`} onKeyDown={handleKey}>
      <button className="report-arrow report-previous" aria-label="Previous page" disabled={index === 0} onClick={() => navigate(-1)}><span aria-hidden="true">←</span></button>
      <figure className="report-sheet">
        <div className="report-image" key={report.id} data-direction={direction}>
          <Image src={report.image} alt={report.alt} width={report.width} height={report.height} unoptimized draggable={false} />
        </div>
        <button className="report-page-half report-page-previous" aria-label="Previous page" disabled={index === 0} onClick={() => navigate(-1)} />
        <button className="report-page-half report-page-next" aria-label="Next page" disabled={index === pages.length - 1} onClick={() => navigate(1)} />
      </figure>
      <button className="report-arrow report-next" aria-label="Next page" disabled={index === pages.length - 1} onClick={() => navigate(1)}><span aria-hidden="true">→</span></button>
      <div className="report-caption"><span role="status" aria-live="polite" aria-atomic="true"><span className="sr-only">{report.title}. Page </span>{String(index + 1).padStart(2, "0")} / {String(pages.length).padStart(2, "0")}</span><span>Tap left for previous · right for next</span></div>
    </div>
  );
}
