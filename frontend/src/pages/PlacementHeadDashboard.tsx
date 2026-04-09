import { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  Calendar,
  ChevronRight,
  CloudLightning,
  LineChart as LineIcon,
  Search,
  TrendingDown,
  TrendingUp,
  Users,
  Briefcase,
  Award,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import '../styles/dashboard.css';
import { getJson } from '../utils/api';
import AdminLayout from '../components/AdminLayout';

const accentPalette = ['#2563eb', '#7c3aed', '#f97316', '#10b981', '#06b6d4', '#f59e0b'];

type Kpi = { label: string; value: number; icon: JSX.Element; growth: number; color: string };
type DriveRow = { id: number; title: string; role: string; companyName: string; ctcLpa: number; status: 'UPCOMING' | 'ONGOING' | 'COMPLETED' };
type AlertRow = { title: string; severity: 'success' | 'warning' | 'danger' | 'info'; detail: string };

function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let frame: number;
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      setValue(Math.floor(target * progress));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);
  return value;
}

function KpiCardView({ kpi }: { kpi: Kpi }) {
  const animated = useCountUp(kpi.value);
  return (
    <div className="card kpi-card fade-in">
      <div className="icon-chip" style={{ background: kpi.color }}>{kpi.icon}</div>
      <div className="label">{kpi.label}</div>
      <div className="value">{animated.toLocaleString()}</div>
      <div className={`growth ${kpi.growth >= 0 ? 'up' : 'down'}`}>
        {kpi.growth >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
        <span>{Math.abs(kpi.growth).toFixed(1)}%</span>
      </div>
    </div>
  );
}

function statusBadge(status: DriveRow['status']) {
  const map = { UPCOMING: 'info', ONGOING: 'success', COMPLETED: 'warning' } as const;
  return <span className={`badge ${map[status] || 'info'}`}>{status}</span>;
}
function severityBadge(sev: AlertRow['severity']) {
  return <span className={`badge ${sev}`}>{sev.toUpperCase()}</span>;
}

export default function PlacementHeadDashboard({ onNavigate }: { onNavigate?: (view: any) => void }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Record<string, any>>({});
  const [analytics, setAnalytics] = useState<Record<string, any>>({});
  const [drives, setDrives] = useState<DriveRow[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const [s, a, d] = await Promise.all([
          getJson<any>('/api/admin/dashboard/stats'),
          getJson<any>('/api/admin/analytics/placements'),
          getJson<any>('/api/admin/drives')
        ]);
        if (!active) return;
        setStats(s.data || {});
        setAnalytics(a.data || {});
        setDrives((d.data || []).map((r: any) => ({ id: r.id, title: r.title, role: r.role, companyName: r.companyName, ctcLpa: r.ctcLpa ?? 0, status: r.status })));
      } catch (err: any) {
        if (active) setError(err?.message || 'Failed to load');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [refreshKey]);

  useEffect(() => {
    const timer = window.setInterval(() => setRefreshKey((key) => key + 1), 600000);
    return () => window.clearInterval(timer);
  }, []);

  const kpis: Kpi[] = useMemo(() => [
    { label: 'Total Students', value: stats.totalStudents ?? 0, icon: <Users size={18} />, growth: 0, color: 'linear-gradient(135deg,#2563eb,#1d4ed8)' },
    { label: 'Verified Profiles', value: stats.verifiedStudents ?? 0, icon: <CheckCircle2 size={18} />, growth: 0, color: 'linear-gradient(135deg,#10b981,#059669)' },
    { label: 'Total Offers', value: stats.totalOffers ?? 0, icon: <Award size={18} />, growth: 0, color: 'linear-gradient(135deg,#f97316,#ea580c)' },
    { label: 'Active Drives', value: stats.ongoingDrives ?? 0, icon: <Briefcase size={18} />, growth: 0, color: 'linear-gradient(135deg,#7c3aed,#6d28d9)' }
  ], [stats]);

  const deptData = useMemo(() => {
    const source = analytics.branchWiseOffers || analytics.branchWisePlacements;
    if (!source) return [];
    return Object.entries(source).map(([name, value]) => ({ name, value: value as number }));
  }, [analytics.branchWiseOffers, analytics.branchWisePlacements]);

  const recruitersData = useMemo(() => {
    if (!analytics.topRecruiters) return [];
    return Object.entries(analytics.topRecruiters).map(([name, value]) => ({ name, value: value as number }));
  }, [analytics.topRecruiters]);

  const offerTrendData = useMemo(() => {
    if (!analytics.monthlyOfferTrend) return [];
    return Object.entries(analytics.monthlyOfferTrend).map(([month, offers]) => ({ month, offers: offers as number }));
  }, [analytics.monthlyOfferTrend]);

  const upcomingDrives = useMemo(() => drives.filter(d => d.status === 'UPCOMING' || d.status === 'ONGOING').slice(0, 6), [drives]);
  const highOfferDrives = useMemo(() => [...drives].sort((a, b) => b.ctcLpa - a.ctcLpa).slice(0, 6), [drives]);
  const alerts: AlertRow[] = [];

  const sk = loading ? 'skeleton' : '';

  return (
    <AdminLayout activeNav="overview" onNavigate={onNavigate}>
      <section className="content">
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
          <button className="btn-secondary" onClick={() => setRefreshKey((key) => key + 1)} disabled={loading}>
            <RefreshCw size={15} style={loading ? { animation: 'spin 1s linear infinite' } : {}} /> Refresh
          </button>
        </div>
        {error && (
          <div className="card" style={{ padding: 16, color: '#b91c1c', fontWeight: 600 }}>
            {error}
          </div>
        )}

        {/* ── KPI ── */}
        <div>
          <div className="section-title">Key Metrics</div>
          <div className="kpi-row">
            {kpis.map(kpi => <KpiCardView key={kpi.label} kpi={kpi} />)}
          </div>
        </div>

        {/* ── Charts Row 1: pie + bar ── */}
        <div>
          <div className="section-title">Analytics</div>
          <div className="charts-row">
            <div className={`card chart-card fade-in ${sk}`}>
              <div className="chart-title">Offers by Department</div>
              <div className="chart-body">
                {!loading && deptData.length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>No department data yet</span>}
                {!loading && deptData.length > 0 && (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <defs><linearGradient id="pg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563eb" stopOpacity={.9}/><stop offset="95%" stopColor="#7c3aed" stopOpacity={.8}/></linearGradient></defs>
                      <Pie data={deptData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
                        {deptData.map((_, i) => <Cell key={i} fill="url(#pg)" opacity={.85 - i * .06} />)}
                      </Pie>
                      <Tooltip /><Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className={`card chart-card fade-in ${sk}`}>
              <div className="chart-title">Top Recruiters</div>
              <div className="chart-body">
                {!loading && recruitersData.length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>No recruiter data yet</span>}
                {!loading && recruitersData.length > 0 && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={recruitersData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tickLine={false} axisLine={false} />
                      <YAxis tickLine={false} axisLine={false} />
                      <Tooltip />
                      <Bar dataKey="value" radius={[8, 8, 4, 4]}>
                        {recruitersData.map((_, i) => <Cell key={i} fill={accentPalette[i % accentPalette.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Charts Row 2: trend full width ── */}
        <div className="charts-full">
          <div className={`card chart-card fade-in ${sk}`}>
            <div className="chart-title">Monthly Offer Trend</div>
            <div className="chart-body">
              {!loading && offerTrendData.length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>No offer trend data yet</span>}
              {!loading && offerTrendData.length > 0 && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={offerTrendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="offers" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* ── Tables Row 1: side by side ── */}
        <div>
          <div className="section-title">Operational</div>
          <div className="tables-row">
            <div className={`card table-card fade-in ${sk}`}>
              {!loading && <>
                <div className="table-header">Upcoming Drive Deadlines</div>
                <div className="table-wrapper">
                <table className="table">
                  <thead><tr><th>Drive</th><th>Role</th><th>Status</th><th>CTC</th></tr></thead>
                  <tbody>
                    {upcomingDrives.length === 0 && <tr><td colSpan={4} style={{ color: 'var(--text-muted)' }}>No upcoming drives</td></tr>}
                    {upcomingDrives.map(r => (
                      <tr key={r.id}><td>{r.title}</td><td>{r.role}</td><td>{statusBadge(r.status)}</td><td>{r.ctcLpa ? `${r.ctcLpa} LPA` : '–'}</td></tr>
                    ))}
                  </tbody>
                </table>
                </div>
                <div className="pagination">{upcomingDrives.length} items</div>
              </>}
            </div>

            <div className={`card table-card fade-in ${sk}`}>
              {!loading && <>
                <div className="table-header">High Offer Drives</div>
                <div className="table-wrapper">
                <table className="table">
                  <thead><tr><th>Company</th><th>CTC</th><th>Role</th><th>Status</th></tr></thead>
                  <tbody>
                    {highOfferDrives.length === 0 && <tr><td colSpan={4} style={{ color: 'var(--text-muted)' }}>No drives</td></tr>}
                    {highOfferDrives.map(r => (
                      <tr key={r.id}><td>{r.companyName}</td><td>{r.ctcLpa ? `${r.ctcLpa} LPA` : '–'}</td><td>{r.role}</td><td>{statusBadge(r.status)}</td></tr>
                    ))}
                  </tbody>
                </table>
                </div>
                <div className="pagination">{highOfferDrives.length} items</div>
              </>}
            </div>
          </div>
        </div>

        {/* ── Tables Row 2: full width alerts ── */}
        <div className="tables-full">
          <div className={`card table-card fade-in ${sk}`}>
            {!loading && <>
              <div className="table-header">AI Placement Alerts</div>
              <table className="table">
                <thead><tr><th>Alert</th><th>Detail</th><th>Severity</th></tr></thead>
                <tbody>
                  {alerts.length === 0 && <tr><td colSpan={3} style={{ color: 'var(--text-muted)' }}>No alerts yet</td></tr>}
                  {alerts.map((r, i) => (
                    <tr key={i}><td>{r.title}</td><td>{r.detail}</td><td>{severityBadge(r.severity)}</td></tr>
                  ))}
                </tbody>
              </table>
              <div className="pagination">{alerts.length} items</div>
            </>}
          </div>
        </div>
      </section>
    </AdminLayout>
  );
}
