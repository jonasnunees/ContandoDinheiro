// Protege o conteúdo exportado para que a planilha o leia como texto, sem executar fórmulas.
export function escapeCSVCell(value: string | number): string {
  const text = String(value);
  // Também verifica espaços e caracteres invisíveis antes dos sinais que iniciam fórmulas.
  // eslint-disable-next-line no-control-regex
  const safeText = /^[\s\u0000-\u001f]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text)
    ? `'${text}`
    : text;
  return `"${safeText.replace(/"/g, '""')}"`;
}

// Junta células e linhas; o marcador inicial ajuda a planilha a reconhecer os acentos.
export function serializeCSV(rows: (string | number)[][]): string {
  return '\uFEFF' + rows.map(row => row.map(escapeCSVCell).join(',')).join('\r\n');
}
