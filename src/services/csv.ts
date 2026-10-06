// Force exported text to remain text, including after leading whitespace/controls.
export function escapeCSVCell(value: string | number): string {
  const text = String(value);
  // Control characters are intentionally matched to prevent spreadsheet formula injection.
  // eslint-disable-next-line no-control-regex
  const safeText = /^[\s\u0000-\u001f]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text)
    ? `'${text}`
    : text;
  return `"${safeText.replace(/"/g, '""')}"`;
}

export function serializeCSV(rows: (string | number)[][]): string {
  return '\uFEFF' + rows.map(row => row.map(escapeCSVCell).join(',')).join('\r\n');
}
