export const downloadAsCSV = <T extends Record<string, unknown>>(data: T[], filename: string) => {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]!);
  const rows = data.map(item =>
    headers.map(h => {
      const val = item[h];
      if (val === null || val === undefined) return '';
      const str = String(val);
      return str.includes(',') || str.includes('"') || str.includes('\n')
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    }).join(',')
  );

  const csv = [headers.join(','), ...rows].join('\n');
  downloadBlob(csv, filename, 'text/csv');
};

export const downloadAsJSON = <T>(data: T[], filename: string) => {
  const json = JSON.stringify(data, null, 2);
  downloadBlob(json, filename, 'application/json');
};

const downloadBlob = (content: string, filename: string, mime: string) => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
