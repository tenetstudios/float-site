"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import { compareReportValues, type SortDirection, type SortValue } from "@/lib/report-sorting";
import styles from "./acquisition/dashboard.module.css";

export type ReportCell = { value: SortValue; content?: ReactNode; style?: CSSProperties };

export default function SortableTable({ labels, rows }: { labels: string[]; rows: ReportCell[][] }) {
  const [sort, setSort] = useState<{ column: number; direction: SortDirection } | null>(null);
  const ordered = rows.map((cells, index) => ({ cells, index }));
  if (sort) ordered.sort((a, b) => compareReportValues(a.cells[sort.column].value, b.cells[sort.column].value, sort.direction) || a.index - b.index);
  const nextDirection = (column: number): SortDirection => {
    if (sort?.column === column) return sort.direction === "ascending" ? "descending" : "ascending";
    return rows.some(row => typeof row[column].value === "number") ? "descending" : "ascending";
  };
  return <table>
    <caption className={styles.sortHelp}>Click any column to sort; click again to reverse. Sorting applies to the displayed rows. Missing values stay last.</caption>
    <thead><tr>{labels.map((label, column) => <th key={column} scope="col" aria-sort={sort?.column === column ? sort.direction : "none"}>
      <button type="button" className={styles.sortButton} onClick={() => setSort({ column, direction: nextDirection(column) })} title={`Sort ${label} ${nextDirection(column)}`}>
        {label} <span aria-hidden="true">{sort?.column === column ? sort.direction === "ascending" ? "↑" : "↓" : "↕"}</span>
      </button>
    </th>)}</tr></thead>
    <tbody>{ordered.map(({ cells, index }) => <tr key={index}>{cells.map((cell, column) => <td key={column} style={cell.style}>{cell.content !== undefined ? cell.content : cell.value ?? "Unknown"}</td>)}</tr>)}</tbody>
  </table>;
}
