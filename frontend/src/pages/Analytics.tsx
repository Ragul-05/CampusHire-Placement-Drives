import { useEffect, useMemo, useState } from 'react';
import {
  RefreshCw, Calendar, Briefcase, TrendingUp, Users,
  CheckCircle2, Award, Sparkles, ChevronLeft, AlertCircle, X,
  BarChart3, Activity, Target, Download
} from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import '../styles/dashboard.css';
import { getJson, facultyUrl } from '../utils/api';
import FacultyLayout from '../components/FacultyLayout';
import AdminLayout from '../components/AdminLayout';

/* ══════════════════════════════
   TYPES — aligned with backend DTOs
══════════════════════════════ */
/* GET /api/faculty/analytics */
type FacultyAnalyticsDTO = {
  averagePackageLpa: number;
  highestPackageLpa: number;
  totalPlaced: number;
  totalOffers?: number;
  totalEligible: number;
  placementPercentage: number;
  topRecruiters: Record<string, number>; // Company -> count
  monthlyOfferTrend?: Record<string, number>;
};

/* GET /api/faculty/dashboard/stats */
type DashboardStats = {
  totalDepartmentStudents: number;
  pendingVerifications: number;
  verifiedStudents: number;
  eligibleForDrives: number;
  statusDistribution: { pending: number; verified: number; rejected: number };
  monthlyTrend: Array<{ month: string; verified: number }>;
  driveEligibility: Array<{ driveName: string; eligibleCount: number }>;
};

/* GET /api/faculty/applications */
type FacultyApplicationDTO = {
  id: number;
  studentId: number;
  studentName: string;
  rollNo: string;
  driveId: number;
  companyName: string;
  driveRole: string;
  stage: 'APPLIED' | 'ASSESSMENT' | 'TECHNICAL' | 'HR' | 'SELECTED';
  appliedAt: string;
  lastUpdatedAt: string;
};

/* GET /api/faculty/drives */
type FacultyDriveDTO = {
  id: number;
  title: string;
  companyName: string;
  status: string;
  ctcLpa: number;
};

/* ══════════════════════════════
   CONSTANTS
══════════════════════════════ */
const STAGE_COLORS: Record<string, string> = {
  APPLIED:    '#3b82f6',
  ASSESSMENT: '#f59e0b',
  TECHNICAL:  '#8b5cf6',
  HR:         '#06b6d4',
  SELECTED:   '#10b981',
};

const PIE_COLORS    = ['#f59e0b', '#10b981', '#ef4444'];
const LINE_COLOR    = '#10b981';
const STAGE_ORDER   = ['APPLIED', 'ASSESSMENT', 'TECHNICAL', 'HR', 'SELECTED'];

/* ══════════════════════════════
   TINY HELPERS
══════════════════════════════ */
function Toast({ msg, type, onClose }: { msg: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, []);
  return (
    <div className={`sv-toast sv-toast-${type}`}>
      {type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
      <span>{msg}</span>
      <button className="sv-toast-close" onClick={onClose}><X size={14} /></button>
    </div>
  );
}

/* KPI summary card */
function KpiMini({ label, value, sub, icon, color }: {
  label: string; value: string | number; sub?: string; icon: JSX.Element; color: string;
}) {
  return (
    <div className="an-kpi-card fade-in" style={{ borderTop: `3px solid ${color}` }}>
      <div className="an-kpi-icon" style={{ background: `${color}18`, color }}>{icon}</div>
      <div className="an-kpi-body">
        <span className="an-kpi-label">{label}</span>
        <span className="an-kpi-value">{value}</span>
        {sub && <span className="an-kpi-sub">{sub}</span>}
      </div>
    </div>
  );
}

/* Chart card wrapper */
function ChartCard({ title, badge, badgeColor, onExport, children }: {
  title: string; badge?: string; badgeColor?: string;
  onExport?: () => void; children: React.ReactNode;
}) {
  return (
    <div className="an-chart-card fade-in">
      <div className="an-chart-header">
        <div className="an-chart-title-row">
          <h3 className="an-chart-title">{title}</h3>
          {badge && (
            <span className="badge" style={{
              background: `${badgeColor ?? '#6366f1'}18`,
              color: badgeColor ?? '#6366f1',
              fontSize: 11, fontWeight: 700,
              border: `1px solid ${badgeColor ?? '#6366f1'}30`
            }}>{badge}</span>
          )}
        </div>
        {onExport && (
          <button className="an-export-btn" onClick={onExport} title="Export as PNG">
            <Download size={14} />
          </button>
        )}
      </div>
      <div className="an-chart-body">{children}</div>
    </div>
  );
}

/* Skeleton */
function ChartSkeleton() {
  return (
    <div style={{ padding: 24 }}>
      <div className="sk-box" style={{ height: 260, borderRadius: 14 }} />
    </div>
  );
}

/* Custom pie label */
const PieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 0.06) return null;
  const R = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.55;
  return (
    <text
      x={cx + r * Math.cos(-midAngle * R)} y={cy + r * Math.sin(-midAngle * R)}
      fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={700}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

/* Custom tooltip */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="an-tooltip">
      {label && <div className="an-tooltip-label">{label}</div>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="an-tooltip-row">
          <span className="an-tooltip-dot" style={{ background: p.color || p.fill }} />
          <span>{p.name}: <strong>{p.value}</strong></span>
        </div>
      ))}
    </div>
  );
};

/* ══════════════════════════════
   AI INSIGHT CARD
══════════════════════════════ */
function AIInsightCard({ stats, analytics, stageData }: {
  stats: DashboardStats | null;
  analytics: FacultyAnalyticsDTO | null;
  stageData: Array<{ stage: string; count: number }>;
}) {
  const insights = useMemo(() => {
    const list: string[] = [];
    if (!stats && !analytics) return list;
    if (stats) {
      const pct = stats.totalDepartmentStudents > 0
        ? Math.round((stats.verifiedStudents / stats.totalDepartmentStudents) * 100) : 0;
      list.push(`${pct}% of department students are verified for placements.`);
      if (stats.pendingVerifications > 0)
        list.push(`${stats.pendingVerifications} student${stats.pendingVerifications > 1 ? 's are' : ' is'} awaiting verification — action needed.`);
      if (stats.eligibleForDrives > 0)
        list.push(`${stats.eligibleForDrives} student${stats.eligibleForDrives > 1 ? 's' : ''} became eligible this month.`);
      const trend = stats.monthlyTrend;
      if (trend?.length >= 2) {
        const last = trend[trend.length - 1]?.verified ?? 0;
        const prev = trend[trend.length - 2]?.verified ?? 0;
        if (last > prev)
          list.push(`Verification activity increased by ${last - prev} compared to last month.`);
      }
    }
    if (analytics) {
      if (analytics.placementPercentage > 0)
        list.push(`Placement rate stands at ${analytics.placementPercentage.toFixed(1)}% with avg package ₹${analytics.averagePackageLpa?.toFixed(1)} LPA.`);
      if ((analytics.totalOffers ?? 0) > 0)
        list.push(`${analytics.totalOffers} total offer${(analytics.totalOffers ?? 0) > 1 ? 's' : ''} issued so far.`);
    }
    const selected = stageData.find(s => s.stage === 'SELECTED');
    if (selected?.count) list.push(`${selected.count} student${selected.count > 1 ? 's' : ''} have been selected via placement drives.`);
    return list.length ? list : ['Load data to see insights for your department.'];
  }, [stats, analytics, stageData]);

  return (
    <div className="an-ai-card fade-in">
      <div className="an-ai-header">
        <div className="an-ai-icon"><Sparkles size={20} /></div>
        <div>
          <h3 className="an-ai-title">AI Insights</h3>
          <p className="an-ai-sub">Auto-generated from your department data</p>
        </div>
        <span className="badge success" style={{ fontSize: 11, marginLeft: 'auto' }}>Live</span>
      </div>
      <ul className="an-ai-list">
        {insights.map((ins, i) => (
          <li key={i} className="an-ai-item">
            <span className="an-ai-bullet" style={{ animationDelay: `${i * 0.15}s` }}>💡</span>
            <span>{ins}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ══════════════════════════════
   EXPORT HELPER
══════════════════════════════ */
function exportChartAsCSV(title: string, data: any[], keys: string[]) {
  const header = keys.join(',');
  const rows   = data.map(row => keys.map(k => row[k] ?? '').join(','));
  const csv    = [header, ...rows].join('\n');
  const blob   = new Blob([csv], { type: 'text/csv' });
  const url    = URL.createObjectURL(blob);
  const a      = document.createElement('a');
  a.href = url; a.download = `${title.replace(/\s+/g, '_')}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

/* ══════════════════════════════
   MAIN PAGE
══════════════════════════════ */
export default function Analytics({ onNavigate }: { onNavigate?: (view: any) => void }) {
  const [loading, setLoading]           = useState(true);
  const [analytics, setAnalytics]       = useState<FacultyAnalyticsDTO | null>(null);
  const [stats, setStats]               = useState<DashboardStats | null>(null);
  const [applications, setApplications] = useState<FacultyApplicationDTO[]>([]);
  const [drives, setDrives]             = useState<FacultyDriveDTO[]>([]);
  const [selectedDriveId, setSelectedDriveId] = useState<number | 'ALL'>('ALL');
  const [dateRange, setDateRange]       = useState<'3m' | '6m' | '1y' | 'all'>('6m');
  const [refreshKey, setRefreshKey]     = useState(0);
  const [toast, setToast]               = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const userRole = localStorage.getItem('role');
  const isFaculty = userRole === 'FACULTY';
  const isAdmin   = userRole === 'PLACEMENT_HEAD';
  const Layout    = isFaculty ? FacultyLayout : AdminLayout;
  const activeNav = isFaculty ? 'analytics' : 'reports';

  /* ── Load all data in parallel — branch by role ── */
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);

        if (isFaculty) {
          // ── Faculty: use faculty-scoped endpoints ──────────────────────────
          const [anaRes, statRes, appsRes, drivesRes] = await Promise.all([
            getJson<FacultyAnalyticsDTO>(facultyUrl('/api/faculty/analytics')),
            getJson<DashboardStats>(facultyUrl('/api/faculty/dashboard/stats')),
            getJson<FacultyApplicationDTO[]>(facultyUrl('/api/faculty/applications')),
            getJson<FacultyDriveDTO[]>(facultyUrl('/api/faculty/drives')),
          ]);
          if (!active) return;
          setAnalytics(anaRes.data);
          setStats(statRes.data);
          setApplications(appsRes.data || []);
          setDrives(drivesRes.data || []);

        } else {
          // ── Placement Head: use admin endpoints ────────────────────────────
          const [anaRes, statRes] = await Promise.all([
            getJson<{
              placementRate: number;
              totalPlaced: number;
              totalOffers?: number;
              totalVerified: number;
              topRecruiters: Record<string, number>;
              branchWisePlacements: Record<string, number>;
              branchWiseOffers?: Record<string, number>;
              monthlyOfferTrend?: Record<string, number>;
            }>('/api/admin/analytics/placements'),
            getJson<{
              totalStudents: number;
              verifiedStudents: number;
              placedStudents: number;
              totalOffers?: number;
              ongoingDrives: number;
              completedDrives: number;
              highestCtc: number;
              averageCtc: number;
              totalCompanies: number;
            }>('/api/admin/dashboard/stats'),
          ]);
          if (!active) return;

          // Map admin analytics DTO → FacultyAnalyticsDTO shape
          const adminAna = anaRes.data;
          const adminStat = statRes.data;
          setAnalytics({
            averagePackageLpa:    adminStat?.averageCtc         ?? 0,
            highestPackageLpa:    adminStat?.highestCtc         ?? 0,
            totalPlaced:          Number(adminAna?.totalPlaced  ?? 0),
            totalOffers:          Number(adminAna?.totalOffers  ?? adminStat?.totalOffers ?? 0),
            totalEligible:        Number(adminAna?.totalVerified ?? 0),
            placementPercentage:  adminAna?.placementRate        ?? 0,
            topRecruiters:        adminAna?.topRecruiters        ?? {},
            monthlyOfferTrend:    adminAna?.monthlyOfferTrend    ?? {},
          });

          // Map admin stats DTO → DashboardStats shape
          setStats({
            totalDepartmentStudents: Number(adminStat?.totalStudents     ?? 0),
            pendingVerifications:    0,
            verifiedStudents:        Number(adminStat?.verifiedStudents  ?? 0),
            eligibleForDrives:       Number(adminStat?.verifiedStudents  ?? 0),
            statusDistribution:      { pending: 0, verified: Number(adminStat?.verifiedStudents ?? 0), rejected: 0 },
            monthlyTrend:            adminAna?.monthlyOfferTrend
              ? Object.entries(adminAna.monthlyOfferTrend).map(([k, v]) => ({ month: k, verified: Number(v) }))
              : [],
            driveEligibility:        (adminAna?.branchWiseOffers || adminAna?.branchWisePlacements)
              ? Object.entries(adminAna.branchWiseOffers || adminAna.branchWisePlacements).map(([k, v]) => ({ driveName: k, eligibleCount: Number(v) }))
              : [],
          });
          setApplications([]);
          setDrives([]);
        }
      } catch (e: any) {
        if (active) setToast({ msg: e.message || 'Failed to load analytics', type: 'error' });
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [refreshKey, isFaculty]);

  /* ── Derived data ── */

  /* 1. Verification Pie */
  const pieData = stats ? [
    { name: 'Pending',  value: stats.statusDistribution?.pending  ?? 0 },
    { name: 'Verified', value: stats.statusDistribution?.verified ?? 0 },
    { name: 'Rejected', value: stats.statusDistribution?.rejected ?? 0 },
  ] : [];

  /* 2. Drive eligibility bar — filter by selected drive */
  const driveBarData = useMemo(() => {
    if (!stats?.driveEligibility) return [];
    let data = stats.driveEligibility;
    if (selectedDriveId !== 'ALL') {
      const dr = drives.find(d => d.id === selectedDriveId);
      if (dr) data = data.filter(d => d.driveName.toLowerCase().includes(dr.title.toLowerCase()));
    }
    return data.map(d => ({ name: d.driveName, eligible: d.eligibleCount }));
  }, [stats, selectedDriveId, drives]);

  /* 3. Monthly trend line — slice by dateRange */
  const trendData = useMemo(() => {
    if (!stats?.monthlyTrend) return [];
    const months = dateRange === '3m' ? 3 : dateRange === '6m' ? 6 : dateRange === '1y' ? 12 : 999;
    return stats.monthlyTrend.slice(-months).map(t => ({ month: t.month, verified: t.verified }));
  }, [stats, dateRange]);

  /* 4. Stage distribution bar — from applications */
  const stageData = useMemo(() => {
    const filteredApps = selectedDriveId === 'ALL'
      ? applications
      : applications.filter(a => a.driveId === selectedDriveId);
    return STAGE_ORDER.map(stage => ({
      stage,
      count: filteredApps.filter(a => a.stage === stage).length,
    }));
  }, [applications, selectedDriveId]);

  /* 5. Top recruiters bar */
  const recruiterData = useMemo(() => {
    if (!analytics?.topRecruiters) return [];
    return Object.entries(analytics.topRecruiters)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([company, count]) => ({ company: company.length > 16 ? company.slice(0, 14) + '…' : company, count }));
  }, [analytics]);

  /* ── KPI values ── */
  const kpis = [
    { label: 'Total Dept. Students', value: stats?.totalDepartmentStudents ?? '—', icon: <Users size={18} />,       color: '#6366f1', sub: 'Department scope'          },
    { label: 'Verified Students',    value: stats?.verifiedStudents ?? '—',        icon: <CheckCircle2 size={18} />, color: '#10b981', sub: `${stats?.pendingVerifications ?? 0} pending` },
    { label: 'Eligible for Drives',  value: stats?.eligibleForDrives ?? '—',       icon: <Target size={18} />,       color: '#06b6d4', sub: 'Placement ready'           },
    { label: 'Total Offers',         value: analytics?.totalOffers ?? analytics?.totalPlaced ?? '—', icon: <Award size={18} />, color: '#f59e0b', sub: analytics?.placementPercentage ? `${analytics.placementPercentage.toFixed(1)}% placement rate` : '—' },
    { label: 'Avg Package',          value: analytics?.averagePackageLpa ? `₹${analytics.averagePackageLpa.toFixed(1)}L` : '—', icon: <TrendingUp size={18} />, color: '#8b5cf6', sub: `Highest ₹${analytics?.highestPackageLpa?.toFixed(1) ?? '—'}L` },
    { label: 'Active Applications',  value: applications.length,                   icon: <Activity size={18} />,     color: '#ec4899', sub: 'Across all drives'         },
  ];

  /* ══ RENDER ══ */
  return (
    <Layout activeNav={activeNav} onNavigate={onNavigate}>
      <div className="content">

        {/* ── Header ── */}
        <div className="an-page-header fade-in">
          <div>
            <h1 className="page-title">Faculty Analytics</h1>
            <p className="page-subtitle">Department-level verification, eligibility &amp; placement insights</p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn-secondary" onClick={() => setRefreshKey(k => k + 1)} disabled={loading}>
              <RefreshCw size={15} style={loading ? { animation: 'spin 1s linear infinite' } : {}} />
              Refresh
            </button>
            {isFaculty && (
              <button className="btn-secondary" onClick={() => onNavigate?.('facultyDashboard')}>
                <ChevronLeft size={15} /> Dashboard
              </button>
            )}
          </div>
        </div>

        {/* ── Filters ── */}
        <div className="an-filter-card fade-in">
          <div className="an-filter-row">
            {/* Date range */}
            <div className="an-filter-group">
              <Calendar size={15} color="#64748b" />
              <span className="an-filter-label">Period</span>
              <div className="an-filter-pills">
                {(['3m', '6m', '1y', 'all'] as const).map(r => (
                  <button key={r} className={`an-pill ${dateRange === r ? 'active' : ''}`}
                    onClick={() => setDateRange(r)}>
                    {{ '3m': '3 Months', '6m': '6 Months', '1y': '1 Year', all: 'All Time' }[r]}
                  </button>
                ))}
              </div>
            </div>

            {/* Drive selector */}
            <div className="an-filter-group">
              <Briefcase size={15} color="#64748b" />
              <span className="an-filter-label">Drive</span>
              <select className="an-drive-select"
                value={selectedDriveId}
                onChange={e => setSelectedDriveId(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}>
                <option value="ALL">All Drives</option>
                {drives.map(d => (
                  <option key={d.id} value={d.id}>{d.title} — {d.companyName}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ── KPI Grid ── */}
        <div className="an-kpi-grid">
          {loading
            ? [...Array(6)].map((_, i) => <div key={i} className="an-kpi-card"><div className="sk-box" style={{ height: 72, borderRadius: 12 }} /></div>)
            : kpis.map((k, i) => <KpiMini key={i} {...k} />)
          }
        </div>

        {/* ── AI Insight Card ── */}
        {!loading && (
          <AIInsightCard stats={stats} analytics={analytics} stageData={stageData} />
        )}
        {loading && <div className="sk-box" style={{ height: 110, borderRadius: 18 }} />}

        {/* ── Charts Row 1: Pie + Bar Eligibility ── */}
        <div className="an-charts-2col">

          {/* Chart 1 — Verification Distribution Pie */}
          <ChartCard
            title="Verification Distribution"
            badge="Real-time"
            badgeColor="#10b981"
            onExport={() => exportChartAsCSV('Verification_Distribution', pieData, ['name', 'value'])}
          >
            {loading ? <ChartSkeleton /> : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={105}
                    dataKey="value" labelLine={false} label={PieLabel}
                    animationBegin={0} animationDuration={800}>
                    {pieData.map((_, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* Chart 2 — Eligible Students per Drive Bar */}
          <ChartCard
            title="Eligible Students per Drive"
            badge="Active drives"
            badgeColor="#6366f1"
            onExport={() => exportChartAsCSV('Drive_Eligibility', driveBarData, ['name', 'eligible'])}
          >
            {loading ? <ChartSkeleton /> : driveBarData.length === 0 ? (
              <div className="an-empty"><BarChart3 size={36} color="#94a3b8" /><p>No drive data available</p></div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={driveBarData} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
                  <Bar dataKey="eligible" name="Eligible" fill="#667eea"
                    radius={[8, 8, 0, 0]} animationDuration={800} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        {/* ── Charts Row 2: Line + Stage Bar ── */}
        <div className="an-charts-2col">

          {/* Chart 3 — Verification Trend Line */}
          <ChartCard
            title="Monthly Offer Trend"
            badge={`Last ${dateRange === 'all' ? 'all' : dateRange}`}
            badgeColor="#10b981"
            onExport={() => exportChartAsCSV('Verification_Trend', trendData, ['month', 'verified'])}
          >
            {loading ? <ChartSkeleton /> : trendData.length === 0 ? (
              <div className="an-empty"><Activity size={36} color="#94a3b8" /><p>No trend data available</p></div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="verified" name="Verified" stroke={LINE_COLOR}
                    strokeWidth={3} dot={{ r: 5, fill: LINE_COLOR, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 7 }} animationDuration={800} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* Chart 4 — Stage Distribution Bar */}
          <ChartCard
            title="Application Stage Distribution"
            badge="By drive"
            badgeColor="#8b5cf6"
            onExport={() => exportChartAsCSV('Stage_Distribution', stageData, ['stage', 'count'])}
          >
            {loading ? <ChartSkeleton /> : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={stageData} barCategoryGap="25%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="stage" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(139,92,246,0.06)' }} />
                  <Bar dataKey="count" name="Students" radius={[8, 8, 0, 0]} animationDuration={800}>
                    {stageData.map((s, i) => (
                      <Cell key={i} fill={STAGE_COLORS[s.stage] ?? '#94a3b8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        {/* ── Top Recruiters (only if data exists) ── */}
        {!loading && recruiterData.length > 0 && (
          <ChartCard
            title="Top Recruiters"
            badge="Placed students"
            badgeColor="#f59e0b"
            onExport={() => exportChartAsCSV('Top_Recruiters', recruiterData, ['company', 'count'])}
          >
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={recruiterData} layout="vertical" barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="company" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} width={100} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(245,158,11,0.06)' }} />
                <Bar dataKey="count" name="Students Placed" fill="#f59e0b" radius={[0, 8, 8, 0]} animationDuration={800} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </Layout>
  );
}
