"use client";

import Image from "next/image";
import { DossierPages } from "./field-reports";
import { useLayoutEffect, useRef, useState, type KeyboardEvent, type RefObject } from "react";
import { dossierFileNumber, dossierSections, type DossierSection } from "@/lib/dossier";

function DossierCover({ open, onOpen, buttonRef }: { open: boolean; onOpen: () => void; buttonRef: RefObject<HTMLButtonElement | null> }) {
  return (
    <button ref={buttonRef} className="dossier-cover" onClick={onOpen} tabIndex={open ? -1 : 0} inert={open} aria-hidden={open} aria-label={`Open classified dossier ${dossierFileNumber}`} aria-expanded={open} aria-controls="dossier-viewer">
      <Image src="/images/intelligence/dossier-cover.png" alt="Weathered manila dossier bearing the Lion Up insignia and a red TOP SECRET stamp. File 773-19-042." width={1672} height={941} sizes="(max-width: 760px) 150vw, (max-width: 1200px) 135vw, 107vw" preload />
    </button>
  );
}

function DossierTabs({ active, onSelect, tabRefs }: { active: number; onSelect: (index: number) => void; tabRefs: RefObject<(HTMLButtonElement | null)[]> }) {
  function handleKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % dossierSections.length;
    else if (event.key === "ArrowLeft") next = (index - 1 + dossierSections.length) % dossierSections.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = dossierSections.length - 1;
    else return;
    event.preventDefault();
    onSelect(next);
    tabRefs.current[next]?.focus();
  }
  return (
    <div className="dossier-tabs" role="tablist" aria-label="Dossier categories">
      {dossierSections.map((section, index) => (
        <button key={section.id} ref={element => { tabRefs.current[index] = element; }} role="tab" id={`tab-${section.id}`} aria-controls={`document-${section.id}`} aria-selected={active === index} tabIndex={active === index ? 0 : -1} onClick={() => onSelect(index)} onKeyDown={event => handleKey(event, index)}>{section.label}</button>
      ))}
    </div>
  );
}

export function DossierDocument({ section, active }: { section: DossierSection; active: boolean }) {
  if (section.pages?.length) {
    return <section className="dossier-document dossier-field-reports" role="tabpanel" id={`document-${section.id}`} aria-labelledby={`tab-${section.id}`} hidden={!active}><DossierPages pages={section.pages} label={section.label} /></section>;
  }
  return (
    <section className="dossier-document" role="tabpanel" id={`document-${section.id}`} aria-labelledby={`tab-${section.id}`} tabIndex={0} hidden={!active}>
      <div className="document-heading"><span>Lion Intelligence Directorate</span><span>Top secret</span></div>
      <h2>{section.label}</h2>
      <div className="document-rule" />
      {section.content ?? <div className="document-pending"><p>{section.record}</p><h3>Classified material pending</h3><p>[ Record not yet declassified ]</p></div>}
      <div className="document-footnote"><span>FILE {dossierFileNumber}</span><span>{String(dossierSections.findIndex(item => item.id === section.id) + 1).padStart(2, "0")} / 05</span></div>
    </section>
  );
}

function DossierViewer({ open, active, onSelect, onClose, tabRefs }: { open: boolean; active: number; onSelect: (index: number) => void; onClose: () => void; tabRefs: RefObject<(HTMLButtonElement | null)[]> }) {
  return (
    <div id="dossier-viewer" className="dossier-viewer" inert={!open} aria-hidden={!open}>
      <div className="dossier-toolbar"><span>FILE NO. <strong>{dossierFileNumber}</strong></span><button onClick={onClose}>Close file <span aria-hidden="true">×</span></button></div>
      <DossierTabs active={active} onSelect={onSelect} tabRefs={tabRefs} />
      <div className="dossier-papers">{dossierSections.map((section, index) => <DossierDocument key={section.id} section={section} active={active === index} />)}</div>
    </div>
  );
}

export function DossierHero() {
  const [isDossierOpen, setIsDossierOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const coverRef = useRef<HTMLButtonElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const wasOpen = useRef(false);
  useLayoutEffect(() => {
    if (isDossierOpen) {
      tabRefs.current[activeSection]?.focus({ preventScroll: true });
      tabRefs.current[activeSection]?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" });
    } else if (wasOpen.current) {
      coverRef.current?.focus({ preventScroll: true });
    }
    wasOpen.current = isDossierOpen;
  }, [isDossierOpen, activeSection]);
  function openDossier() {
    setIsDossierOpen(true);
  }
  function closeDossier() {
    setIsDossierOpen(false);
  }
  return (
    <section className={`dossier-hero${isDossierOpen ? " is-open" : ""}${isDossierOpen && dossierSections[activeSection].pages?.length ? " is-field-reports" : ""}`} aria-label="Classified intelligence archive" onKeyDown={event => { if (event.key === "Escape" && isDossierOpen) { event.preventDefault(); closeDossier(); } }}>
      <aside className="dossier-index" aria-hidden="true"><span>Field reports</span><span>Known movements</span><span>Weapon systems</span><span>Source material</span></aside>
      <div className="dossier-stage">
        <DossierViewer open={isDossierOpen} active={activeSection} onSelect={setActiveSection} onClose={closeDossier} tabRefs={tabRefs} />
        <DossierCover open={isDossierOpen} onOpen={openDossier} buttonRef={coverRef} />
      </div>
      <div className="dossier-access-wrap" inert={isDossierOpen} aria-hidden={isDossierOpen}>
        <button className="dossier-access" onClick={openDossier} tabIndex={isDossierOpen ? -1 : 0} aria-expanded={isDossierOpen} aria-controls="dossier-viewer"><span>Access file {dossierFileNumber}</span><small>Click to open dossier</small></button>
      </div>
    </section>
  );
}
