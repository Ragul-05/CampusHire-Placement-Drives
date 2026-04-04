/**
 * exportUtils.ts
 * Shared PDF + Excel export utilities for CampusHire Faculty Module.
 * Uses:  jspdf + jspdf-autotable  (PDF)
 *        xlsx                      (Excel)
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';

/* ─────────────────────────────────────────
   Types
───────────────────────────────────────── */
export interface ExportColumn {
  header: string;
  key: string;
}

export type ExportRow = Record<string, string | number | boolean | null | undefined>;

export interface ExportOptions {
  title: string;          // e.g. "Eligible Students — TCS Drive"
  subtitle?: string;      // e.g. "Drive: TCS Analyst · CGPA ≥ 7.0"
  filename: string;       // without extension
  columns: ExportColumn[];
  rows: ExportRow[];
  includePageSnapshot?: boolean;
}

/* ─────────────────────────────────────────
   BRAND COLOURS
───────────────────────────────────────── */
const PRIMARY   = [37,  99, 235] as [number, number, number];   // #2563eb
const HEADER_BG = [241, 245, 249] as [number, number, number];  // #f1f5f9
const TEXT_DARK = [15,  23,  42] as [number, number, number];   // #0f172a
const TEXT_MUTED= [100, 116, 139] as [number, number, number];  // #64748b
const SUCCESS   = [16, 185, 129] as [number, number, number];   // #10b981
const DANGER    = [239,  68,  68] as [number, number, number];  // #ef4444

/* ─────────────────────────────────────────
   PDF EXPORT
───────────────────────────────────────── */
export async function exportToPDF(opts: ExportOptions, sourceElement?: HTMLElement | null): Promise<void> {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

  const pageW  = doc.internal.pageSize.getWidth();
  const pageH  = doc.internal.pageSize.getHeight();
  const now    = new Date().toLocaleString('en-IN');

  /* ── Header banner ── */
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, pageW, 52, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('VCET CampusHire', 36, 22);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(opts.title, 36, 38);

  /* ── Sub-title / meta row ── */
  doc.setFillColor(...HEADER_BG);
  doc.rect(0, 52, pageW, 22, 'F');
  doc.setTextColor(...TEXT_MUTED);
  doc.setFontSize(8.5);
  if (opts.subtitle) doc.text(opts.subtitle, 36, 64);
  doc.text(`Generated: ${now}  ·  Records: ${opts.rows.length}`, pageW - 36, 64, { align: 'right' });

  /* ── Optional page snapshot (charts + current view) ── */
  const shouldCapture = opts.includePageSnapshot !== false;
  if (shouldCapture && sourceElement) {
    doc.setTextColor(...TEXT_DARK);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Visual Snapshot', 36, 92);

    const canvas = await html2canvas(sourceElement, {
      useCORS: true,
      backgroundColor: '#f8fafc',
      scale: 2,
      logging: false,
    });

    const targetWidth = pageW - 72;
    const headerAndFooter = 120;
    const availableHeight = pageH - headerAndFooter;
    const pxPerPt = canvas.width / targetWidth;
    const pageSlicePx = Math.floor(availableHeight * pxPerPt);

    let offsetY = 0;
    let isFirstSlice = true;

    while (offsetY < canvas.height) {
      const sliceHeightPx = Math.min(pageSlicePx, canvas.height - offsetY);
      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = sliceHeightPx;

      const sliceCtx = sliceCanvas.getContext('2d');
      if (!sliceCtx) break;

      sliceCtx.drawImage(
        canvas,
        0,
        offsetY,
        canvas.width,
        sliceHeightPx,
        0,
        0,
        canvas.width,
        sliceHeightPx
      );

      if (!isFirstSlice) {
        doc.addPage();
      }

      const sliceHeightPt = sliceHeightPx / pxPerPt;
      const imageY = isFirstSlice ? 102 : 72;
      doc.addImage(sliceCanvas.toDataURL('image/jpeg', 0.92), 'JPEG', 36, imageY, targetWidth, sliceHeightPt, undefined, 'FAST');

      offsetY += sliceHeightPx;
      isFirstSlice = false;
    }

    doc.addPage();
  }

  doc.setTextColor(...TEXT_DARK);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Tabular Data', 36, 92);

  /* ── Auto-table ── */
  autoTable(doc, {
    startY: 102,
    head:   [opts.columns.map(c => c.header)],
    body:   opts.rows.map(row => opts.columns.map(c => {
      const v = row[c.key];
      return v == null ? '—' : String(v);
    })),
    styles: {
      fontSize:   9,
      cellPadding: 5,
      textColor:  TEXT_DARK,
      lineColor:  [226, 232, 240],
      lineWidth:  0.3,
    },
    headStyles: {
      fillColor:  PRIMARY,
      textColor:  [255, 255, 255],
      fontStyle:  'bold',
      fontSize:   9.5,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 30, halign: 'center' },  // # column
    },
    /* Colour-code status / eligibility cells */
    didParseCell(data) {
      const val = String(data.cell.raw ?? '').toUpperCase();
      if (data.section === 'body') {
        if (['ELIGIBLE', 'VERIFIED', 'PLACED', 'SELECTED'].includes(val)) {
          data.cell.styles.textColor = SUCCESS;
          data.cell.styles.fontStyle = 'bold';
        }
        if (['INELIGIBLE', 'REJECTED', 'NOT PLACED', 'PENDING'].includes(val)) {
          data.cell.styles.textColor = DANGER;
        }
      }
    },
    margin: { left: 36, right: 36 },
  });

  /* ── Footer on each page ── */
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(...TEXT_MUTED);
    doc.text(
      `VCET CampusHire  ·  Confidential  ·  Page ${i} of ${totalPages}`,
      pageW / 2, doc.internal.pageSize.getHeight() - 12,
      { align: 'center' }
    );
  }

  doc.save(`${opts.filename}.pdf`);
}

/* ─────────────────────────────────────────
   EXCEL EXPORT
───────────────────────────────────────── */
export function exportToExcel(opts: ExportOptions): void {
  const wb = XLSX.utils.book_new();

  /* Build header row + data rows */
  const headerRow = opts.columns.map(c => c.header);
  const dataRows  = opts.rows.map(row =>
    opts.columns.map(c => {
      const v = row[c.key];
      return v == null ? '' : v;
    })
  );

  /* Meta rows at top */
  const metaRows = [
    [`VCET CampusHire — ${opts.title}`],
    [opts.subtitle ?? ''],
    [`Generated: ${new Date().toLocaleString('en-IN')}`, '', `Total Records: ${opts.rows.length}`],
    [],   // blank separator
    headerRow,
    ...dataRows,
  ];

  const ws = XLSX.utils.aoa_to_sheet(metaRows);

  /* Column widths — auto-fit to max content */
  const colWidths = opts.columns.map((col, ci) => {
    const maxLen = Math.max(
      col.header.length,
      ...dataRows.map(r => String(r[ci] ?? '').length)
    );
    return { wch: Math.min(maxLen + 4, 40) };
  });
  ws['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, opts.title.substring(0, 31));
  XLSX.writeFile(wb, `${opts.filename}.xlsx`);
}

/* ─────────────────────────────────────────
   Export Button component helper
   (Returns the JSX props to spread on a button)
───────────────────────────────────────── */
export type ExportFormat = 'pdf' | 'xlsx';

export async function runExport(format: ExportFormat, opts: ExportOptions, sourceElement?: HTMLElement | null): Promise<void> {
  if (format === 'pdf') {
    await exportToPDF(opts, sourceElement);
    return;
  }
  if (format === 'xlsx') {
    exportToExcel(opts);
  }
}
