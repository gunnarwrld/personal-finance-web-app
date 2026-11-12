/**
 * CSV building and download, shared by every export in the app.
 *
 * Output follows RFC 4180: fields containing a comma, double quote, CR or LF
 * are wrapped in double quotes, embedded quotes are doubled, and records end
 * with CRLF.
 *
 * Text cells are also protected against formula injection (CSV injection): a
 * spreadsheet treats a cell that starts with `=`, `+`, `-` or `@` (or a tab or
 * carriage return) as a formula, so such text gets a leading `'`. Numbers are
 * written as plain numbers and never prefixed, so a negative amount stays a
 * number a spreadsheet can sum.
 */

/** A cell value. Pass numbers as `number` so they stay numeric. */
export type CsvCell = string | number | null | undefined;

const FORMULA_TRIGGERS = new Set(['=', '+', '-', '@', '\t', '\r']);
const NEEDS_QUOTING = /[",\r\n]/;

export function escapeCsvCell(value: CsvCell): string {
  if (value === null || value === undefined) return '';

  let text: string;
  if (typeof value === 'number') {
    text = Number.isFinite(value) ? String(value) : '';
  } else {
    text = FORMULA_TRIGGERS.has(value.charAt(0)) ? `'${value}` : value;
  }

  return NEEDS_QUOTING.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Turns rows of cells into a CSV document (CRLF line endings, trailing CRLF). */
export function toCsv(rows: CsvCell[][]): string {
  return rows.map((row) => row.map(escapeCsvCell).join(',')).join('\r\n') + '\r\n';
}

/**
 * Saves a CSV document as a file in the user's browser. Nothing is uploaded:
 * the file is built from a local Blob. A UTF-8 byte order mark is prepended so
 * Excel reads accented characters and currency symbols correctly.
 */
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Revoke on the next tick so the browser has started the download.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
