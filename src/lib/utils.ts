import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Simple unique ID generator
export function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

// Convert data to CSV and trigger download
export function exportToCSV(data: any[], filename: string) {
  if (!data || !data.length) return;
  
  // Get headers from the first object
  const headers = Object.keys(data[0]);
  const csvRows = [];
  
  // Add header row (escaped)
  csvRows.push(headers.map(h => escapeCSV(h)).join(','));
  
  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header] === undefined || row[header] === null ? '' : row[header];
      return escapeCSV(String(val));
    });
    csvRows.push(values.join(','));
  }
  
  const csvString = csvRows.join('\r\n');
  // Add BOM for UTF-8 to handle special characters correctly in Excel
  const bom = '\uFEFF';
  const blob = new Blob([bom + csvString], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function escapeCSV(str: string) {
  let escaped = str.replace(/"/g, '""');
  if (escaped.search(/("|,|\n|\r)/g) >= 0) {
    escaped = `"${escaped}"`;
  }
  return escaped;
}
