import { useEffect, useState } from 'react';
import {
  Bell, Users, ClipboardCheck, CheckCircle2, TrendingUp, TrendingDown,
  UserCheck, XCircle, Clock, Eye, CheckCircle, AlertCircle, RefreshCw, GraduationCap
} from 'lucide-react';
import {
  PieChart, Pie, BarChart, Bar, LineChart, Line, Cell,
  ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, Legend
} from 'recharts';
import '../styles/dashboard.css';
import { getJson, facultyUrl } from '../utils/api';
import FacultyLayout from '../components/FacultyLayout';

/* ─── Types — aligned with FacultyStudentDTO & FacultyDashboardStatsDTO ─── */
type StudentVerification = {
  id: number;
  rollNo: string;           // backend: rollNo
  name: string;             // backend: name (single field)
  email: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  cgpa: number;
  standingArrears: number;
  isEligibleForPlacements: boolean;
};

type VerificationStats = {
  totalDepartmentStudents: number;
  pendingVerifications: number;
  verifiedStudents: number;
  totalOffers?: number;
  eligibleForDrives: number;
  statusDistribution: { pending: number; verified: number; rejected: number };
  monthlyTrend: Array<{ month: string; verified: number }>;
  driveEligibility: Array<{ driveName: string; eligibleCount: number }>;
};

/* ─── Animated count-up ─── */
function useCountUp(target: number, duration = 1000) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let frame: number;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      setValue(Math.floor(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);
  return value;
}

/* ─── KPI Card ─── */
type KpiProps = { label: string; value: number; icon: JSX.Element; growth: number; gradient: string; delay: number };
function KpiCard({ label, value, icon, growth, gradient, delay }: KpiProps) {
  const animated = useCountUp(value);
  return (
    <div className="faculty-kpi-card fade-in" style={{ animationDelay: `${delay}s` }}>
      <div className="faculty-kpi-icon" style={{ background: gradient }}>{icon}</div>
      <div className="faculty-kpi-body">
        <span className="faculty-kpi-label">{label}</span>
        <span className="faculty-kpi-value">{animated.toLocaleString()}</span>
        <span className={`faculty-kpi-growth ${growth >= 0 ? 'up' : 'down'}`}>
          {growth >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {Math.abs(growth).toFixed(1)}% vs last month
        </span>
      </div>
    </div>
  );
}

/* ─── Skeletons ─── */
function KpiSkeleton() {
  return (
    <div className="faculty-kpi-card">
      <div className="sk-box sk-icon" />
      <div className="faculty-kpi-body">
        <div className="sk-box sk-text-sm" /><div className="sk-box sk-text-lg" /><div className="sk-box sk-text-xs" />
      </div>
    </div>
  );
}
function ChartSkeleton() { return <div className="sk-box sk-chart" />; }
function TableSkeleton() {
  return (
    <div style={{ padding: '0 0 8px' }}>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="sk-table-row">
          {[18, 22, 16, 10, 10, 14].map((w, j) => (
            <div key={j} className="sk-box sk-text-sm" style={{ width: `${w}%` }} />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ─── Status badge ─── */
function StatusBadge({ status }: { status: 'PENDING' | 'VERIFIED' | 'REJECTED' }) {
  const cfg = {
    PENDING:  { cls: 'warning', icon: <Clock size={11} /> },
    VERIFIED: { cls: 'success', icon: <CheckCircle size={11} /> },
    REJECTED: { cls: 'danger',  icon: <XCircle size={11} /> },
  } as const;
  const { cls, icon } = cfg[status];
  return <span className={`badge ${cls}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>{icon} {status}</span>;
}

/* ─── Pie label ─── */
const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, payload }: any) => {
  if (percent < 0.05) return null;
  const R = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + r * Math.cos(-midAngle * R);
  const y = cy + r * Math.sin(-midAngle * R);
  const label = payload?.percentage != null ? `${payload.percentage}%` : `${(percent * 100).toFixed(1)}%`;
  return <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={700}>{label}</text>;
};

const PIE_COLORS = ['#f59e0b', '#10b981', '#ef4444'];
const BAR_COLORS = ['#6366f1', '#3b82f6', '#0ea5e9', '#06b6d4', '#10b981', '#f59e0b'];

/* ════════════ MAIN ════════════ */
export default function FacultyDashboard({ onNavigate }: { onNavigate?: (view: any) => void }) {
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [stats, setStats]             = useState<VerificationStats | null>(null);
  const [pendingStudents, setPendingStudents] = useState<StudentVerification[]>([]);
  const [recentlyVerified, setRecentlyVerified] = useState<StudentVerification[]>([]);
  const [refreshKey, setRefreshKey]   = useState(0);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true); setError(null);
        const [statsRes, pendingRes, verifiedRes] = await Promise.all([
          // ✅ GET /api/faculty/dashboard/stats?facultyEmail=
          getJson<VerificationStats>(facultyUrl('/api/faculty/dashboard/stats')),
          // ✅ GET /api/faculty/dashboard/verifications/pending?facultyEmail=
          getJson<StudentVerification[]>(facultyUrl('/api/faculty/dashboard/verifications/pending')),
          // ✅ GET /api/faculty/dashboard/verifications/recent?facultyEmail=
          getJson<StudentVerification[]>(facultyUrl('/api/faculty/dashboard/verifications/recent')),
        ]);
        if (!active) return;
        setStats(statsRes.data);
        setPendingStudents(pendingRes.data || []);
        setRecentlyVerified(verifiedRes.data || []);
      } catch (err: any) {
        if (!active) return;
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [refreshKey]);

  useEffect(() => {
    const timer = window.setInterval(() => setRefreshKey(k => k + 1), 600000);
    return () => window.clearInterval(timer);
  }, []);

  const kpis: KpiProps[] = stats ? [
    { label: 'Total Students',        value: stats.totalDepartmentStudents, icon: <GraduationCap size={22} />, growth: 5.2,   gradient: 'linear-gradient(135deg,#667eea,#764ba2)', delay: 0    },
    { label: 'Pending Verifications', value: stats.pendingVerifications,    icon: <Clock size={22} />,         growth: -12.3, gradient: 'linear-gradient(135deg,#f59e0b,#d97706)', delay: 0.07 },
    { label: 'Verified Students',     value: stats.verifiedStudents,        icon: <CheckCircle2 size={22} />, growth: 18.5,  gradient: 'linear-gradient(135deg,#10b981,#059669)', delay: 0.14 },
    { label: 'Total Offers',          value: stats.totalOffers ?? 0,        icon: <UserCheck size={22} />,     growth: 22.1,  gradient: 'linear-gradient(135deg,#06b6d4,#0891b2)', delay: 0.21 },
  ] : [];

  const pieData = stats ? [
    {
      name: 'Pending',
      value: stats.statusDistribution.pending,
      percentage: stats.totalDepartmentStudents
        ? Number(((stats.statusDistribution.pending / stats.totalDepartmentStudents) * 100).toFixed(1))
        : 0,
    },
    {
      name: 'Verified',
      value: stats.statusDistribution.verified,
      percentage: stats.totalDepartmentStudents
        ? Number(((stats.statusDistribution.verified / stats.totalDepartmentStudents) * 100).toFixed(1))
        : 0,
    },
    {
      name: 'Rejected',
      value: stats.statusDistribution.rejected,
      percentage: stats.totalDepartmentStudents
        ? Number(((stats.statusDistribution.rejected / stats.totalDepartmentStudents) * 100).toFixed(1))
        : 0,
    },
  ] : [];

  return (
    <FacultyLayout activeNav="overview" onNavigate={onNavigate}>
      <div className="content">

        {/* Header */}
        <div className="faculty-dash-header fade-in">
          <div>
            <h1 className="page-title">Faculty Verification Dashboard</h1>
            <p className="page-subtitle">Review &amp; verify student profiles for placement eligibility — VCET CampusHire</p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn-secondary" onClick={() => setRefreshKey(k => k + 1)} disabled={loading}>
              <RefreshCw size={15} style={loading ? { animation: 'spin 1s linear infinite' } : {}} /> Refresh
            </button>
            <button className="btn-secondary" onClick={() => onNavigate?.('announcements')}><Bell size={15} /> Notifications</button>
            <button className="btn-primary" onClick={() => onNavigate?.('studentVerification')}><ClipboardCheck size={15} /> Verify Students</button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="faculty-alert-banner">
            <AlertCircle size={18} /><span>{error}</span>
            <button className="faculty-alert-retry" onClick={() => setRefreshKey(k => k + 1)}>Retry</button>
          </div>
        )}

        {/* KPI Grid */}
        <div className="faculty-kpi-grid">
          {loading ? [...Array(4)].map((_, i) => <KpiSkeleton key={i} />) : kpis.map((k, i) => <KpiCard key={i} {...k} />)}
        </div>

        {/* Charts */}
        <div className="faculty-charts-grid fade-in" style={{ animationDelay: '0.15s' }}>
          {/* Pie */}
          <div className="faculty-chart-card">
            <div className="faculty-card-header">
              <div><h3 className="faculty-card-title">Profile Status</h3><p className="faculty-card-sub">Pending / Verified / Rejected</p></div>
              <span className="badge info">Live</span>
            </div>
            <div className="faculty-chart-body">
              {loading ? <ChartSkeleton /> : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={100} dataKey="value" labelLine={false} label={renderPieLabel}>
                      {pieData.map((_, idx) => <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 10, fontSize: 13 }} />
                    <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Bar */}
          <div className="faculty-chart-card">
            <div className="faculty-card-header">
              <div><h3 className="faculty-card-title">Students Eligible per Drive</h3><p className="faculty-card-sub">Active placement drives</p></div>
              <span className="badge success">Active</span>
            </div>
            <div className="faculty-chart-body">
              {loading ? <ChartSkeleton /> : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={stats?.driveEligibility || []} barCategoryGap="30%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="driveName" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 10, fontSize: 13 }} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
                    <Bar dataKey="eligibleCount" name="Eligible Students" radius={[8, 8, 0, 0]}>
                      {(stats?.driveEligibility || []).map((_, idx) => <Cell key={idx} fill={BAR_COLORS[idx % BAR_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Line */}
          <div className="faculty-chart-card">
            <div className="faculty-card-header">
              <div><h3 className="faculty-card-title">Monthly Offer Trend</h3><p className="faculty-card-sub">Offers issued in last 6 months</p></div>
              <span className="badge info">Trend</span>
            </div>
            <div className="faculty-chart-body">
              {loading ? <ChartSkeleton /> : (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={stats?.monthlyTrend || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 10, fontSize: 13 }} />
                    <Line type="monotone" dataKey="verified" name="Offers" stroke="#10b981" strokeWidth={3}
                      dot={{ r: 5, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Pending Table */}
        <div className="faculty-table-card fade-in" style={{ animationDelay: '0.25s' }}>
          <div className="faculty-card-header">
            <div>
              <h3 className="faculty-card-title">Students Awaiting Verification</h3>
              <p className="faculty-card-sub">{loading ? '—' : `${pendingStudents.length} student${pendingStudents.length !== 1 ? 's' : ''} pending`}</p>
            </div>
            <button className="btn-primary" style={{ fontSize: 13, padding: '8px 14px' }}
              onClick={() => onNavigate?.('studentVerification')} disabled={loading || pendingStudents.length === 0}>
              <ClipboardCheck size={14} /> Review All
            </button>
          </div>
          {loading ? <TableSkeleton /> : pendingStudents.length === 0 ? (
            <div className="faculty-empty-state"><CheckCircle2 size={44} color="#10b981" /><h4>All Clear!</h4><p>No pending verifications right now</p></div>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Roll No.</th><th>Name</th><th>Email</th>
                    <th>CGPA</th><th>Arrears</th><th>Status</th>
                    <th style={{ textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingStudents.map(s => (
                    <tr key={s.id}>
                      <td><span className="faculty-roll">{s.rollNo}</span></td>
                      <td>
                        <div className="faculty-user-cell">
                          <div className="faculty-avatar">{(s.name || '?').charAt(0).toUpperCase()}</div>
                          <span>{s.name}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.email}</td>
                      <td><span className={s.cgpa >= 7 ? 'faculty-cgpa good' : 'faculty-cgpa low'}>{s.cgpa?.toFixed(2)}</span></td>
                      <td><span className={s.standingArrears > 0 ? 'faculty-arrears bad' : 'faculty-arrears ok'}>{s.standingArrears}</span></td>
                      <td><StatusBadge status={s.verificationStatus} /></td>
                      <td style={{ textAlign: 'center' }}>
                        <button className="icon-btn view" title="Review" onClick={() => onNavigate?.('studentVerification')}><Eye size={14} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recently Verified Table */}
        <div className="faculty-table-card fade-in" style={{ animationDelay: '0.33s' }}>
          <div className="faculty-card-header">
            <div>
              <h3 className="faculty-card-title">Recently Verified Students</h3>
              <p className="faculty-card-sub">{loading ? '—' : `Last ${recentlyVerified.length} verified profile${recentlyVerified.length !== 1 ? 's' : ''}`}</p>
            </div>
            <span className="badge success" style={{ fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <CheckCircle size={12} /> Completed
            </span>
          </div>
          {loading ? <TableSkeleton /> : recentlyVerified.length === 0 ? (
            <div className="faculty-empty-state"><Users size={44} color="#94a3b8" /><h4>No Recent Verifications</h4><p>Verified students will appear here</p></div>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Roll No.</th><th>Name</th><th>Email</th>
                    <th>CGPA</th><th>Arrears</th><th>Status</th>
                    <th style={{ textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentlyVerified.map(s => (
                    <tr key={s.id}>
                      <td><span className="faculty-roll">{s.rollNo}</span></td>
                      <td>
                        <div className="faculty-user-cell">
                          <div className="faculty-avatar verified">{(s.name || '?').charAt(0).toUpperCase()}</div>
                          <span>{s.name}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.email}</td>
                      <td><span className={s.cgpa >= 7 ? 'faculty-cgpa good' : 'faculty-cgpa low'}>{s.cgpa?.toFixed(2)}</span></td>
                      <td><span className={s.standingArrears > 0 ? 'faculty-arrears bad' : 'faculty-arrears ok'}>{s.standingArrears}</span></td>
                      <td><StatusBadge status={s.verificationStatus} /></td>
                      <td style={{ textAlign: 'center' }}>
                        <button className="icon-btn view" title="View" onClick={() => onNavigate?.('studentVerification')}><Eye size={14} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </FacultyLayout>
  );
}
