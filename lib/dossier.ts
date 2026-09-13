import type { ReactNode } from "react";
import { fieldReports } from "./field-reports";

export type DossierPage = {
  id: string;
  title: string;
  image: string;
  width: number;
  height: number;
  alt: string;
};

export const dossierFileNumber = "773-19-042";
export type DossierSection = {
  id: string;
  label: string;
  record: string;
  /** Replace the pending state with approved report components here. */
  content?: ReactNode;
  /** Add ordered document images here; every section uses the same page navigation. */
  pages?: readonly DossierPage[];
};
export const dossierSections: DossierSection[] = [
  { id: "field-reports", label: "FIELD REPORTS", record: "FIELD REPORT 001", pages: fieldReports },
  { id: "known-movements", label: "KNOWN MOVEMENTS", record: "MOVEMENT RECORD 001" },
  { id: "weapon-systems", label: "WEAPON SYSTEMS", record: "WEAPON RECORD 001" },
  { id: "supply-origin", label: "SUPPLY / ORIGIN", record: "SOURCE RECORD 001" },
  { id: "known-personnel", label: "KNOWN PERSONNEL", record: "PERSONNEL RECORD 001" },
];
