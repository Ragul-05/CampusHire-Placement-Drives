import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { BarChart3, CheckCircle2, RefreshCw, Search, Users, UserX, X } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import FacultyLayout from '../components/FacultyLayout';
import { facultyUrl, getJson } from '../utils/api';
import { runExport } from '../utils/exportUtils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

type PlacementSummary = {
  totalStudents: number;
  placedStudents: number;
  unplacedStudents: number;
  placementPercentage: number;
};

type PlacementStatusRow = {
  studentId: number;
  studentName: string;
  department: string;
  placementStatus: 'PLACED' | 'UNPLACED';
  companyName: string | null;
  ctc: number | null;
};

type CompanyRoundAnalysis = {
  companyName: string;
  round1AssessmentCleared: number;
  round2TechnicalCleared: number;
  round3HrCleared: number;
};

type StudentRoundTracking = {
  studentId: number;
  studentName: string;
  companyName: string;
  currentStage: string;
  roundsCleared: number;
  placementStatus: 'PLACED' | 'UNPLACED';
};

type PlacementResultsResponse = {
  summary: PlacementSummary;
  placedVsUnplaced: PlacementStatusRow[];
  companyRoundAnalysis: CompanyRoundAnalysis[];
  studentRoundTracking: StudentRoundTracking[];
};

const PIE_COLORS = ['#10b981', '#ef4444'];
const ROUND_STAGE_COLORS = {
  ASSESSMENT: '#3b82f6',
  TECHNICAL: '#f59e0b',
  HR: '#7c3aed',
} as const;
const PAGE_SIZE = 20;

function toStageTone(stage: string): 'stage-eligible' | 'stage-assessment' | 'stage-technical' | 'stage-hr' | 'stage-selected' | 'stage-rejected' {
  const normalized = stage.toUpperCase();
  if (normalized === 'ASSESSMENT') return 'stage-assessment';
  if (normalized === 'TECHNICAL') return 'stage-technical';
  if (normalized === 'HR') return 'stage-hr';
  if (normalized === 'SELECTED') return 'stage-selected';
  if (normalized === 'REJECTED') return 'stage-rejected';
  return 'stage-eligible';
}

function KpiCard({ title, value, hint, icon, tone }: { title: string; value: string; hint: string; icon: JSX.Element; tone: 'green' | 'red' | 'blue' | 'purple' }) {
  const toneMap: Record<string, string> = {
    green: '#10b981',
    red: '#ef4444',
    blue: '#2563eb',
    purple: '#7c3aed',
  };

  return (
    <div className="pr-card" style={{ borderTopColor: toneMap[tone] }}>
      <div className="pr-card-icon" style={{ color: toneMap[tone], background: `${toneMap[tone]}1a` }}>
        {icon}
      </div>
      <div>
        <div className="pr-card-title">{title}</div>
        <div className="pr-card-value">{value}</div>
        <div className="pr-card-hint">{hint}</div>
      </div>
    </div>
  );
}

export default function PlacementResults({ onNavigate }: { onNavigate?: (view: string) => void }) {
  const role = localStorage.getItem('role');
  const isFaculty = role === 'FACULTY';
  const Layout = isFaculty ? FacultyLayout : AdminLayout;
  const activeNav = isFaculty ? 'placementResults' : 'placementResults';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<PlacementResultsResponse | null>(null);
  const [error, setError] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [placementFilter, setPlacementFilter] = useState<'ALL' | 'PLACED' | 'UNPLACED'>('ALL');
  const [companyFilter, setCompanyFilter] = useState<string>('ALL');
  const [exportingPdf, setExportingPdf] = useState(false);
  const [statusPage, setStatusPage] = useState(1);
  const [companyPage, setCompanyPage] = useState(1);
  const [trackingPage, setTrackingPage] = useState(1);

  const pieChartRef = useRef<HTMLDivElement | null>(null);
  const companyBarRef = useRef<HTMLDivElement | null>(null);
  const roundBarRef = useRef<HTMLDivElement | null>(null);

  const loadResults = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError('');

      const endpoint = isFaculty
        ? facultyUrl('/api/placement-results')
        : '/api/placement-results';

      const res = await getJson<PlacementResultsResponse>(endpoint);
      setData(res.data);
    } catch (e: any) {
      setError(e.message || 'Failed to load placement results');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isFaculty]);

  useEffect(() => {
    loadResults(false);
  }, [loadResults]);

  useEffect(() => {
    const timer = setInterval(() => {
      loadResults(true);
    }, 600000);
    return () => clearInterval(timer);
  }, [loadResults]);

  useEffect(() => { setStatusPage(1); }, [placementFilter, companyFilter]);
  useEffect(() => { setCompanyPage(1); }, [companyFilter]);
  useEffect(() => { setTrackingPage(1); }, [placementFilter, companyFilter, studentSearch, selectedStudentId]);

  const summary = data?.summary;
  const statusRows = data?.placedVsUnplaced || [];
  const companyRows = data?.companyRoundAnalysis || [];
  const trackingRows = data?.studentRoundTracking || [];

  const companyOptions = useMemo(() => {
    const set = new Set<string>();
    trackingRows.forEach((row) => {
      if (row.companyName && row.companyName.trim()) {
        set.add(row.companyName.trim());
      }
    });
    return ['ALL', ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [trackingRows]);

  const filteredStatusRows = useMemo(() => {
    return statusRows.filter((row) => {
      const matchesPlacement = placementFilter === 'ALL' || row.placementStatus === placementFilter;
      const normalizedCompany = row.companyName?.trim().toLowerCase() || '';
      const normalizedFilter = companyFilter.trim().toLowerCase();
      const matchesCompany = companyFilter === 'ALL' || normalizedCompany === normalizedFilter;
      return matchesPlacement && matchesCompany;
    });
  }, [statusRows, placementFilter, companyFilter]);

  const filteredCompanyRows = useMemo(() => {
    if (companyFilter === 'ALL') return companyRows;
    const normalizedFilter = companyFilter.trim().toLowerCase();
    return companyRows.filter((row) => row.companyName.trim().toLowerCase() === normalizedFilter);
  }, [companyRows, companyFilter]);

  const filteredTrackingRows = useMemo(() => {
    const query = studentSearch.trim().toLowerCase();
    return trackingRows.filter((row) => {
      const matchesSearch = !query
        || row.studentName.toLowerCase().includes(query)
        || row.companyName.toLowerCase().includes(query)
        || row.currentStage.toLowerCase().includes(query);

      const matchesPlacement = placementFilter === 'ALL' || row.placementStatus === placementFilter;
      const matchesCompany = companyFilter === 'ALL' || row.companyName === companyFilter;
      const matchesSelected = selectedStudentId == null || row.studentId === selectedStudentId;

      return matchesSearch && matchesPlacement && matchesCompany && matchesSelected;
    });
  }, [trackingRows, studentSearch, placementFilter, companyFilter, selectedStudentId]);

  const selectedStudentRows = useMemo(() => {
    if (!selectedStudentId) return [];
    return trackingRows.filter((row) => row.studentId === selectedStudentId);
  }, [trackingRows, selectedStudentId]);

  const selectedStudentRoundBreakdown = useMemo(() => {
    if (selectedStudentRows.length === 0) return [];

    const grouped = new Map<string, { round1: boolean; round2: boolean; round3: boolean; maxRounds: number }>();

    selectedStudentRows.forEach((row) => {
      const company = row.companyName?.trim() || 'Unknown';
      const stage = row.currentStage?.toUpperCase() || '';

      const current = grouped.get(company) || { round1: false, round2: false, round3: false, maxRounds: 0 };

      const reachedRound1 = ['ASSESSMENT', 'TECHNICAL', 'HR', 'SELECTED'].includes(stage);
      const reachedRound2 = ['TECHNICAL', 'HR', 'SELECTED'].includes(stage);
      const reachedRound3 = ['HR', 'SELECTED'].includes(stage);

      current.round1 = current.round1 || reachedRound1;
      current.round2 = current.round2 || reachedRound2;
      current.round3 = current.round3 || reachedRound3;
      current.maxRounds = Math.max(current.maxRounds, row.roundsCleared || 0);

      grouped.set(company, current);
    });

    return Array.from(grouped.entries())
      .map(([companyName, rounds]) => ({
        companyName,
        round1Cleared: rounds.round1,
        round2Cleared: rounds.round2,
        round3Cleared: rounds.round3,
        roundsCleared: rounds.maxRounds,
      }))
      .sort((a, b) => a.companyName.localeCompare(b.companyName));
  }, [selectedStudentRows]);

  const selectedStudentName = selectedStudentRows.length > 0 ? selectedStudentRows[0].studentName : '';

  const pieData = useMemo(() => ([
    { name: 'Placed', value: summary?.placedStudents || 0 },
    { name: 'Unplaced', value: summary?.unplacedStudents || 0 },
  ]), [summary]);

  const companyPlacementData = useMemo(() => {
    const counts: Record<string, number> = {};
    statusRows.filter((row) => row.placementStatus === 'PLACED').forEach((row) => {
      const key = row.companyName || 'Unknown';
      counts[key] = (counts[key] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([companyName, placedCount]) => ({ companyName, placedCount }))
      .sort((a, b) => b.placedCount - a.placedCount)
      .slice(0, 10);
  }, [statusRows]);

  const roundProgressionData = useMemo(() => {
    const totalRound1 = companyRows.reduce((sum, row) => sum + row.round1AssessmentCleared, 0);
    const totalRound2 = companyRows.reduce((sum, row) => sum + row.round2TechnicalCleared, 0);
    const totalRound3 = companyRows.reduce((sum, row) => sum + row.round3HrCleared, 0);

    return [
      { stageKey: 'ASSESSMENT', fullLabel: 'Round 1 (Assessment)', shortLabel: 'R1', cleared: totalRound1 },
      { stageKey: 'TECHNICAL', fullLabel: 'Round 2 (Technical)', shortLabel: 'R2', cleared: totalRound2 },
      { stageKey: 'HR', fullLabel: 'Round 3 (HR)', shortLabel: 'R3', cleared: totalRound3 },
    ];
  }, [companyRows]);

  const pagedStatusRows = useMemo(() => {
    const start = (statusPage - 1) * PAGE_SIZE;
    return filteredStatusRows.slice(start, start + PAGE_SIZE);
  }, [filteredStatusRows, statusPage]);

  const pagedCompanyRows = useMemo(() => {
    const start = (companyPage - 1) * PAGE_SIZE;
    return filteredCompanyRows.slice(start, start + PAGE_SIZE);
  }, [filteredCompanyRows, companyPage]);

  const pagedTrackingRows = useMemo(() => {
    const start = (trackingPage - 1) * PAGE_SIZE;
    return filteredTrackingRows.slice(start, start + PAGE_SIZE);
  }, [filteredTrackingRows, trackingPage]);

  const exportRows = [
    ...filteredStatusRows.map((row) => ({
      section: 'Placement Details',
      studentName: row.studentName,
      department: row.department,
      placementStatus: row.placementStatus,
      companyName: row.companyName || '',
      ctc: row.ctc != null ? row.ctc.toFixed(2) : '',
      currentStage: '',
      roundsCleared: '',
      round1AssessmentCleared: '',
      round2TechnicalCleared: '',
      round3HrCleared: '',
    })),
    ...filteredCompanyRows.map((row) => ({
      section: 'Company-wise Round Analysis',
      studentName: '',
      department: '',
      placementStatus: '',
      companyName: row.companyName,
      ctc: '',
      currentStage: '',
      roundsCleared: '',
      round1AssessmentCleared: row.round1AssessmentCleared,
      round2TechnicalCleared: row.round2TechnicalCleared,
      round3HrCleared: row.round3HrCleared,
    })),
    ...filteredTrackingRows.map((row) => ({
      section: 'Student Round Tracking',
      studentName: row.studentName,
      department: '',
      placementStatus: row.placementStatus,
      companyName: row.companyName,
      ctc: '',
      currentStage: row.currentStage,
      roundsCleared: row.roundsCleared,
      round1AssessmentCleared: '',
      round2TechnicalCleared: '',
      round3HrCleared: '',
    })),
  ];

  async function exportPlacementResultsPdf() {
    if (!summary) return;

    try {
      setExportingPdf(true);
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 28;
      const gap = 12;

      pdf.setFillColor(37, 99, 235);
      pdf.rect(0, 0, pageWidth, 54, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.text('VCET CampusHire - Placement Results', margin, 24);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.text(`Generated: ${new Date().toLocaleString('en-IN')}`, pageWidth - margin, 24, { align: 'right' });

      let y = 72;
      const cardWidth = (pageWidth - (margin * 2) - (gap * 3)) / 4;
      const cardHeight = 58;
      const cards = [
        ['Total Students', String(summary.totalStudents)],
        ['Placed Students', String(summary.placedStudents)],
        ['Unplaced Students', String(summary.unplacedStudents)],
        ['Placement %', `${summary.placementPercentage.toFixed(2)}%`],
      ];

      cards.forEach((card, i) => {
        const x = margin + i * (cardWidth + gap);
        pdf.setDrawColor(226, 232, 240);
        pdf.setFillColor(248, 250, 252);
        pdf.roundedRect(x, y, cardWidth, cardHeight, 8, 8, 'FD');
        pdf.setTextColor(100, 116, 139);
        pdf.setFontSize(10);
        pdf.text(card[0], x + 10, y + 20);
        pdf.setTextColor(15, 23, 42);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(18);
        pdf.text(card[1], x + 10, y + 44);
      });

      y += cardHeight + 18;
      const chartWidth = (pageWidth - (margin * 2) - (gap * 2)) / 3;
      const chartHeight = 145;

      const chartBlocks = [
        { title: 'Placed vs Unplaced', ref: pieChartRef },
        { title: 'Company-wise Placements', ref: companyBarRef },
        { title: 'Round-wise Progression', ref: roundBarRef },
      ];

      for (let i = 0; i < chartBlocks.length; i++) {
        const block = chartBlocks[i];
        const x = margin + i * (chartWidth + gap);

        pdf.setTextColor(15, 23, 42);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.text(block.title, x, y);

        if (block.ref.current) {
          const canvas = await html2canvas(block.ref.current, { scale: 2, backgroundColor: '#ffffff' });
          const img = canvas.toDataURL('image/png');
          pdf.setDrawColor(226, 232, 240);
          pdf.roundedRect(x, y + 6, chartWidth, chartHeight, 8, 8, 'S');
          pdf.addImage(img, 'PNG', x + 4, y + 10, chartWidth - 8, chartHeight - 8);
        }
      }

      pdf.addPage();
      pdf.setTextColor(15, 23, 42);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.text('Placement Details', margin, 26);

      autoTable(pdf, {
        startY: 36,
        margin: { left: margin, right: margin },
        head: [['Student Name', 'Department', 'Placement Status', 'Company', 'CTC (LPA)']],
        body: filteredStatusRows.map((row) => [
          row.studentName,
          row.department,
          row.placementStatus,
          row.companyName || '—',
          row.ctc != null ? row.ctc.toFixed(2) : '—',
        ]),
        styles: {
          fontSize: 9,
          cellPadding: 6,
          lineColor: [226, 232, 240],
          lineWidth: 0.3,
          textColor: [15, 23, 42],
        },
        headStyles: {
          fillColor: [37, 99, 235],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9.5,
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
      });

      pdf.addPage();
      pdf.setTextColor(15, 23, 42);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.text('Company-wise Round Analysis', margin, 26);

      autoTable(pdf, {
        startY: 36,
        margin: { left: margin, right: margin },
        head: [['Company', 'Round 1 (Assessment)', 'Round 2 (Technical)', 'Round 3 (HR)']],
        body: filteredCompanyRows.map((row) => [
          row.companyName,
          String(row.round1AssessmentCleared),
          String(row.round2TechnicalCleared),
          String(row.round3HrCleared),
        ]),
        styles: {
          fontSize: 9,
          cellPadding: 6,
          lineColor: [226, 232, 240],
          lineWidth: 0.3,
          textColor: [15, 23, 42],
        },
        headStyles: {
          fillColor: [37, 99, 235],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9.5,
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
      });

      pdf.addPage();
      pdf.setTextColor(15, 23, 42);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.text('Student Round Tracking', margin, 26);

      autoTable(pdf, {
        startY: 36,
        margin: { left: margin, right: margin },
        head: [['Student Name', 'Company', 'Stage', 'Placement Status', 'Rounds Cleared']],
        body: filteredTrackingRows.map((row) => [
          row.studentName,
          row.companyName,
          row.currentStage,
          row.placementStatus,
          String(row.roundsCleared),
        ]),
        styles: {
          fontSize: 9,
          cellPadding: 6,
          lineColor: [226, 232, 240],
          lineWidth: 0.3,
          textColor: [15, 23, 42],
        },
        headStyles: {
          fillColor: [37, 99, 235],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9.5,
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
      });

      pdf.save(isFaculty ? 'faculty-placement-results.pdf' : 'admin-placement-results.pdf');
    } finally {
      setExportingPdf(false);
    }
  }

  return (
    <Layout activeNav={activeNav} onNavigate={onNavigate}>
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1 className="page-title">Placement Results</h1>
            <p className="page-subtitle">Live placement analytics with round-wise and company-wise progress</p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn-secondary" onClick={exportPlacementResultsPdf} disabled={exportRows.length === 0 || exportingPdf}>
              <BarChart3 size={15} /> {exportingPdf ? 'Generating PDF...' : 'Export PDF'}
            </button>
            <button
              className="btn-secondary"
              onClick={() => runExport('xlsx', {
                title: 'Placement Results',
                subtitle: isFaculty ? 'Faculty Department Scope' : 'Admin Full Scope',
                filename: isFaculty ? 'faculty-placement-results' : 'admin-placement-results',
                columns: [
                  { header: 'Section', key: 'section' },
                  { header: 'Student Name', key: 'studentName' },
                  { header: 'Department', key: 'department' },
                  { header: 'Placement Status', key: 'placementStatus' },
                  { header: 'Company', key: 'companyName' },
                  { header: 'CTC (LPA)', key: 'ctc' },
                  { header: 'Stage', key: 'currentStage' },
                  { header: 'Rounds Cleared', key: 'roundsCleared' },
                  { header: 'Round 1 Cleared', key: 'round1AssessmentCleared' },
                  { header: 'Round 2 Cleared', key: 'round2TechnicalCleared' },
                  { header: 'Round 3 Cleared', key: 'round3HrCleared' },
                ],
                rows: exportRows,
              })}
              disabled={exportRows.length === 0}
            >
              Export Excel
            </button>
            <button className="btn-secondary" onClick={() => loadResults(false)} disabled={refreshing}>
              <RefreshCw size={15} style={refreshing ? { animation: 'spin 1s linear infinite' } : {}} /> Refresh
            </button>
          </div>
        </div>

        {error && <div className="toast toast-error" style={{ marginBottom: 12 }}>{error}</div>}
        {loading && <div className="skeleton" style={{ minHeight: 320 }} />}

        {!loading && summary && (
          <>
            <div className="pr-grid">
              <KpiCard title="Total Students" value={String(summary.totalStudents)} hint="Overall students in scope" icon={<Users size={18} />} tone="blue" />
              <KpiCard title="Placed Students" value={String(summary.placedStudents)} hint="Students with finalized placement" icon={<CheckCircle2 size={18} />} tone="green" />
              <KpiCard title="Unplaced Students" value={String(summary.unplacedStudents)} hint="Students still in pipeline" icon={<UserX size={18} />} tone="red" />
              <KpiCard title="Placement Percentage" value={`${summary.placementPercentage.toFixed(2)}%`} hint="(Placed / Total) * 100" icon={<BarChart3 size={18} />} tone="purple" />
            </div>

            <div className="pr-charts-grid">
              <div className="card pr-chart-card">
                <h3 className="pr-section-title">Placed vs Unplaced</h3>
                <div ref={pieChartRef} className="pr-chart-scroll">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={88} label>
                        {pieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="card pr-chart-card">
                <h3 className="pr-section-title">Company-wise Placements</h3>
                <div ref={companyBarRef} className="pr-chart-scroll">
                  <div style={{ minWidth: Math.max(420, companyPlacementData.length * 90), height: 300 }}>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={companyPlacementData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="companyName" angle={-35} textAnchor="end" interval={0} height={62} tickMargin={10} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="placedCount" fill="#2563eb" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="card pr-chart-card">
                <h3 className="pr-section-title">Round-wise Progression</h3>
                <div ref={roundBarRef} className="pr-chart-scroll">
                  <div style={{ minWidth: 420, height: 300 }}>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={roundProgressionData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="shortLabel" angle={-35} textAnchor="end" interval={0} height={64} tickMargin={8} />
                      <YAxis allowDecimals={false} />
                      <Tooltip
                        formatter={(value: any) => [value, 'Students Cleared']}
                        labelFormatter={(_, payload: any) => payload?.[0]?.payload?.fullLabel || 'Round'}
                      />
                      <Bar dataKey="cleared" radius={[6, 6, 0, 0]}>
                        {roundProgressionData.map((entry, idx) => (
                          <Cell
                            key={`${entry.stageKey}-${idx}`}
                            fill={ROUND_STAGE_COLORS[entry.stageKey as keyof typeof ROUND_STAGE_COLORS] || '#10b981'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>

            <div className="card table-card" style={{ marginTop: 18 }}>
              <div className="table-header-row" style={{ gap: 10, flexWrap: 'wrap' }}>
                <div className="table-info">Placed vs Unplaced ({filteredStatusRows.length})</div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <select
                    value={placementFilter}
                    onChange={(e) => setPlacementFilter(e.target.value as 'ALL' | 'PLACED' | 'UNPLACED')}
                    className="drive-select"
                    style={{ minWidth: 170 }}
                  >
                    <option value="ALL">All Students</option>
                    <option value="PLACED">Placed Students</option>
                    <option value="UNPLACED">Unplaced Students</option>
                  </select>
                  <select
                    value={companyFilter}
                    onChange={(e) => setCompanyFilter(e.target.value)}
                    className="drive-select"
                    style={{ minWidth: 190 }}
                  >
                    <option value="ALL">All Companies</option>
                    {companyOptions.filter((company) => company !== 'ALL').map((company) => (
                      <option key={company} value={company}>{company}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Student Name</th>
                      <th>Department</th>
                      <th>Placement Status</th>
                      <th>Company Name</th>
                      <th>CTC (LPA)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStatusRows.length === 0 && (
                      <tr><td colSpan={5} style={{ textAlign: 'center', padding: 30 }}>No records found</td></tr>
                    )}
                    {pagedStatusRows.map((row) => (
                      <tr key={row.studentId}>
                        <td>{row.studentName}</td>
                        <td>{row.department}</td>
                        <td>
                          <span className={`badge ${row.placementStatus === 'PLACED' ? 'success' : 'danger'}`}>
                            {row.placementStatus === 'PLACED' ? 'Placed' : 'Unplaced'}
                          </span>
                        </td>
                        <td>{row.companyName || '—'}</td>
                        <td>{row.ctc != null ? `₹${row.ctc.toFixed(2)}` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredStatusRows.length > PAGE_SIZE && (
                <div className="pagination">
                  <button className="btn-secondary" onClick={() => setStatusPage((p) => Math.max(1, p - 1))} disabled={statusPage === 1}>Prev</button>
                  <span>Page {statusPage} / {Math.ceil(filteredStatusRows.length / PAGE_SIZE)}</span>
                  <button className="btn-secondary" onClick={() => setStatusPage((p) => Math.min(Math.ceil(filteredStatusRows.length / PAGE_SIZE), p + 1))} disabled={statusPage >= Math.ceil(filteredStatusRows.length / PAGE_SIZE)}>Next</button>
                </div>
              )}
            </div>

            <div className="card table-card" style={{ marginTop: 18 }}>
              <div className="table-header-row">
                <div className="table-info">Company-wise Round Analysis ({filteredCompanyRows.length})</div>
              </div>
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Company</th>
                      <th>Round 1 (Assessment)</th>
                      <th>Round 2 (Technical)</th>
                      <th>Round 3 (HR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCompanyRows.length === 0 && (
                      <tr><td colSpan={4} style={{ textAlign: 'center', padding: 30 }}>No round data found</td></tr>
                    )}
                    {pagedCompanyRows.map((row) => (
                      <tr key={row.companyName}>
                        <td>{row.companyName}</td>
                        <td>{row.round1AssessmentCleared}</td>
                        <td>{row.round2TechnicalCleared}</td>
                        <td>{row.round3HrCleared}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredCompanyRows.length > PAGE_SIZE && (
                <div className="pagination">
                  <button className="btn-secondary" onClick={() => setCompanyPage((p) => Math.max(1, p - 1))} disabled={companyPage === 1}>Prev</button>
                  <span>Page {companyPage} / {Math.ceil(filteredCompanyRows.length / PAGE_SIZE)}</span>
                  <button className="btn-secondary" onClick={() => setCompanyPage((p) => Math.min(Math.ceil(filteredCompanyRows.length / PAGE_SIZE), p + 1))} disabled={companyPage >= Math.ceil(filteredCompanyRows.length / PAGE_SIZE)}>Next</button>
                </div>
              )}
            </div>

            <div className="card table-card" style={{ marginTop: 18 }}>
              <div className="table-header-row" style={{ gap: 10, flexWrap: 'wrap' }}>
                <div className="table-info">Student Round Tracking ({filteredTrackingRows.length})</div>
                <div className="sv-search-box" style={{ maxWidth: 320, marginLeft: 'auto' }}>
                  <Search size={14} color="#94a3b8" />
                  <input
                    placeholder="Search student, company, stage..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                  />
                  {studentSearch && (
                    <button className="sv-search-clear" onClick={() => setStudentSearch('')}>
                      <X size={12} />
                    </button>
                  )}
                </div>
                <select
                  value={placementFilter}
                  onChange={(e) => setPlacementFilter(e.target.value as 'ALL' | 'PLACED' | 'UNPLACED')}
                  className="drive-select"
                  style={{ minWidth: 170 }}
                >
                  <option value="ALL">All Students</option>
                  <option value="PLACED">Placed Students</option>
                  <option value="UNPLACED">Unplaced Students</option>
                </select>
                <select
                  value={companyFilter}
                  onChange={(e) => setCompanyFilter(e.target.value)}
                  className="drive-select"
                  style={{ minWidth: 190 }}
                >
                  <option value="ALL">All Companies</option>
                  {companyOptions.filter((company) => company !== 'ALL').map((company) => (
                    <option key={company} value={company}>{company}</option>
                  ))}
                </select>
              </div>

              {selectedStudentRows.length > 0 && (
                <div
                  style={{
                    margin: '10px 16px 2px',
                    padding: 12,
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    background: '#f8fafc'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                      Selected Student: {selectedStudentName}
                    </div>
                    <button
                      className="btn-secondary"
                      style={{ padding: '6px 10px', fontSize: 12 }}
                      onClick={() => setSelectedStudentId(null)}
                    >
                      Clear Selection
                    </button>
                  </div>
                  <div style={{ marginTop: 8, fontSize: 13, color: 'var(--text-muted)' }}>
                    {selectedStudentRows.length} application record{selectedStudentRows.length !== 1 ? 's' : ''} found
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
                      Company-wise Round Clearance
                    </div>
                    <div className="table-wrapper" style={{ border: '1px solid var(--border)', borderRadius: 8, background: '#fff' }}>
                      <table className="table" style={{ minWidth: 680 }}>
                        <thead>
                          <tr>
                            <th>Company</th>
                            <th>Round 1 (Assessment)</th>
                            <th>Round 2 (Technical)</th>
                            <th>Round 3 (HR)</th>
                            <th>Total Rounds Cleared</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedStudentRoundBreakdown.map((item) => (
                            <tr key={item.companyName}>
                              <td>{item.companyName}</td>
                              <td>
                                <span className={`badge ${item.round1Cleared ? 'success' : 'danger'}`}>
                                  {item.round1Cleared ? 'Cleared' : 'Not Cleared'}
                                </span>
                              </td>
                              <td>
                                <span className={`badge ${item.round2Cleared ? 'success' : 'danger'}`}>
                                  {item.round2Cleared ? 'Cleared' : 'Not Cleared'}
                                </span>
                              </td>
                              <td>
                                <span className={`badge ${item.round3Cleared ? 'success' : 'danger'}`}>
                                  {item.round3Cleared ? 'Cleared' : 'Not Cleared'}
                                </span>
                              </td>
                              <td>{item.roundsCleared}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Student Name</th>
                      <th>Company</th>
                      <th>Current Stage</th>
                      <th>Rounds Cleared</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTrackingRows.length === 0 && (
                      <tr><td colSpan={4} style={{ textAlign: 'center', padding: 30 }}>No tracking data found</td></tr>
                    )}
                    {pagedTrackingRows.map((row, index) => (
                      <tr
                        key={`${row.studentId}-${row.companyName}-${row.currentStage}-${index}`}
                        style={{
                          cursor: 'pointer',
                          background: selectedStudentId === row.studentId ? '#eff6ff' : undefined
                        }}
                        onClick={() => setSelectedStudentId(row.studentId)}
                      >
                        <td>{row.studentName}</td>
                        <td>{row.companyName}</td>
                        <td><span className={`badge ${toStageTone(row.currentStage)}`}>{row.currentStage}</span></td>
                        <td>{row.roundsCleared}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredTrackingRows.length > PAGE_SIZE && (
                <div className="pagination">
                  <button className="btn-secondary" onClick={() => setTrackingPage((p) => Math.max(1, p - 1))} disabled={trackingPage === 1}>Prev</button>
                  <span>Page {trackingPage} / {Math.ceil(filteredTrackingRows.length / PAGE_SIZE)}</span>
                  <button className="btn-secondary" onClick={() => setTrackingPage((p) => Math.min(Math.ceil(filteredTrackingRows.length / PAGE_SIZE), p + 1))} disabled={trackingPage >= Math.ceil(filteredTrackingRows.length / PAGE_SIZE)}>Next</button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
