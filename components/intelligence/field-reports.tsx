"use client";

import Image from "next/image";
import { useRef, useState, type KeyboardEvent } from "react";
import { fieldReports } from "@/lib/field-reports";

export function FieldReports() {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [enlarged, setEnlarged] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const report = fieldReports[index];

  function navigate(step: number) {
    setDirection(step);
    setIndex(current => Math.max(0, Math.min(fieldReports.length - 1, current + step)));
  }
  function handleKey(event: KeyboardEvent<HTMLElement>) {
    if ((event.target as HTMLElement).closest("dialog, input, textarea, select, [contenteditable]")) return;
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    navigate(event.key === "ArrowRight" ? 1 : -1);
  }

  return (
    <div className="field-reports" tabIndex={0} aria-label="Field reports. Use left and right arrow keys to browse." onKeyDown={handleKey}>
      <button className="report-arrow report-previous" aria-label="Previous field report" disabled={index === 0} onClick={() => navigate(-1)}><span aria-hidden="true">←</span></button>
      <figure className="report-sheet" key={report.id} data-direction={direction}>
        <button className="report-enlarge" aria-label={`Enlarge Field Report ${report.id} — ${report.title}`} aria-haspopup="dialog" onClick={() => { setEnlarged(false); dialogRef.current?.showModal(); }}>
          <Image src={report.image} alt={report.alt} width={report.width} height={report.height} unoptimized />
        </button>
      </figure>
      <button className="report-arrow report-next" aria-label="Next field report" disabled={index === fieldReports.length - 1} onClick={() => navigate(1)}><span aria-hidden="true">→</span></button>
      <div className="report-caption"><span role="status" aria-live="polite" aria-atomic="true"><span className="sr-only">{report.title}. Field report </span>{String(index + 1).padStart(2, "0")} / {String(fieldReports.length).padStart(2, "0")}</span><span>Tap document to enlarge</span></div>
      <dialog ref={dialogRef} className="report-dialog" aria-label={`Field Report ${report.id} — ${report.title}`} onKeyDown={event => event.stopPropagation()}>
        <div className="report-dialog-toolbar">
          <button onClick={() => setEnlarged(value => !value)}>{enlarged ? "Fit width" : "Original size"}</button>
          <button onClick={() => dialogRef.current?.close()} autoFocus>Close document ×</button>
        </div>
        <div className="report-dialog-scroll" tabIndex={0}>
          <Image className={enlarged ? "is-enlarged" : ""} src={report.image} alt={report.alt} width={report.width} height={report.height} unoptimized />
        </div>
      </dialog>
    </div>
  );
}
