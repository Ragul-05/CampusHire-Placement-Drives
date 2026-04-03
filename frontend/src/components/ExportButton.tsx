/**
 * ExportButton.tsx
 * Drop-in export dropdown for PDF / Excel.
 * Place in the top-right of any page header.
 *
 * Usage:
 *   <ExportButton
 *     opts={{ title, subtitle, filename, columns, rows }}
 *     disabled={loading || rows.length === 0}
 *   />
 */
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Download, FileText, Table2, ChevronDown, Loader2 } from 'lucide-react';
import { runExport, ExportOptions } from '../utils/exportUtils';

interface Props {
  opts: ExportOptions;
  disabled?: boolean;
  label?: string;
}

export default function ExportButton({ opts, disabled = false, label = 'Export' }: Props) {
  const [open, setOpen]         = useState(false);
  const [loading, setLoading]   = useState<'pdf' | 'xlsx' | null>(null);
  const [menuStyle, setMenuStyle] = useState<{ top: number; left: number; minWidth: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  /* Close on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!open) return;

    const updateMenuPosition = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const minWidth = 240;
      const width = Math.max(rect.width, minWidth);
      const left = Math.min(
        rect.right - width,
        window.innerWidth - width - 12
      );

      setMenuStyle({
        top: rect.bottom + 8,
        left: Math.max(12, left),
        minWidth: width,
      });
    };

    updateMenuPosition();
    window.addEventListener('resize', updateMenuPosition);
    window.addEventListener('scroll', updateMenuPosition, true);
    return () => {
      window.removeEventListener('resize', updateMenuPosition);
      window.removeEventListener('scroll', updateMenuPosition, true);
    };
  }, [open]);

  const handleExport = async (fmt: 'pdf' | 'xlsx') => {
    setOpen(false);
    setLoading(fmt);
    /* Small tick so the UI updates before the heavy export runs */
    await new Promise(r => setTimeout(r, 60));
    try {
      runExport(fmt, opts);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div
      ref={ref}
      className={`export-button-wrap ${open ? 'open' : ''}`}
      style={{ position: 'relative', display: 'inline-block' }}
    >
      <button
        className="btn-export-trigger"
        onClick={() => !disabled && setOpen(o => !o)}
        disabled={disabled || !!loading}
        title={disabled ? 'No data to export' : 'Export data'}
      >
        {loading
          ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
          : <Download size={14} />}
        <span>{loading ? (loading === 'pdf' ? 'Generating PDF…' : 'Generating Excel…') : label}</span>
        <ChevronDown size={12} style={{ opacity: 0.6, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
      </button>

      {open && menuStyle && createPortal(
        <div
          className="export-dropdown export-dropdown-portal"
          style={{ top: menuStyle.top, left: menuStyle.left, minWidth: menuStyle.minWidth }}
        >
          <button className="export-option" onClick={() => handleExport('pdf')}>
            <div className="export-option-icon pdf"><FileText size={15} /></div>
            <div>
              <div className="export-option-label">Export as PDF</div>
              <div className="export-option-sub">Formatted report with branding</div>
            </div>
          </button>
          <div className="export-divider" />
          <button className="export-option" onClick={() => handleExport('xlsx')}>
            <div className="export-option-icon xlsx"><Table2 size={15} /></div>
            <div>
              <div className="export-option-label">Export as Excel</div>
              <div className="export-option-sub">Spreadsheet (.xlsx) with all data</div>
            </div>
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}
