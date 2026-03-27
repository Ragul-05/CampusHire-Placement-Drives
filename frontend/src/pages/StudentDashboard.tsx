import { useEffect, useMemo, useState } from 'react';
import {
  Briefcase, FileText, Award, CheckCircle2, AlertCircle, X,
  Clock, TrendingUp, RefreshCw, ChevronRight, Sparkles,
  Bell, Building2, MapPin, Calendar, ExternalLink, Zap
} from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import '../styles/dashboard.css';
import { getJson, postJson } from '../utils/api';
import StudentLayout from '../components/StudentLayout';

/* ══════════════════════════════════
   TYPES — aligned with backend DTOs
══════════════════════════════════ */
/* GET /api/student/profile?email= */
type StudentProfile = {
  id: number;
  rollNo: string;
  batch: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  isEligibleForPlacements: boolean;
  isPlaced: boolean;
  numberOfOffers: number;
  highestPackageLpa: number | null;
  resumeUrl: string | null;
  personalDetails?: {
    firstName: string;
    lastName: string;
    bio?: string;
  };
  academicRecord?: {
    cgpa: number;
    standingArrears: number;
    historyOfArrears: number;
    ugYearOfPass: number;
  };
};

/* GET /api/student/drives?email= */
type Drive = {
  id: number;
  title: string;
  role: string;
  ctcLpa: number;
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED';
  companyName: string;
  companyIndustry?: string;
  companyWebsite?: string;
  isEligible: boolean;
  ineligibilityReason?: string;
};

/* GET /api/student/applications?email= */
type Application = {
  id: number;
  driveId: number;
  driveTitle: string;
  companyName: string;
  stage: 'APPLIED' | 'ASSESSMENT' | 'TECHNICAL' | 'HR' | 'SELECTED' | 'REJECTED';
  appliedAt: string;
  lastUpdatedAt: string;
};

/* GET /api/student/dashboard/stats */
type DashboardStats = {
  totalPlaced: number;
  ongoingDrives: number;
  totalCompanies: number;
  highestCtcLpa: number;
};

/* ══════════════════════════════════
   CONSTANTS
══════════════════════════════════ */
const STAGE_COLORS: Record<string, string> = {
  APPLIED:    '#3b82f6',
  ASSESSMENT: '#f59e0b',
  TECHNICAL:  '#8b5cf6',
  HR:         '#06b6d4',
  SELECTED:   '#10b981',
  REJECTED:   '#ef4444',
};

const STATUS_COLORS = ['#f59e0b', '#10b981', '#8b5cf6', '#06b6d4', '#ef4444'];

/* ══════════════════════════════════
   HELPERS
══════════════════════════════════ */
function getEmail() { return localStorage.getItem('email') || ''; }
function getName()  {
  const n = localStorage.getItem('name') || '';
  return n || getEmail().split('@')[0] || 'Student';
}

function fmtDate(dt: string | null | undefined) {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** Profile completion % based on filled sections */
function calcCompletion(p: StudentProfile | null): number {
  if (!p) return 0;
  let score = 0;
  if (p.rollNo)                        score += 20;
  if (p.personalDetails?.firstName)    score += 20;
  if (p.personalDetails?.bio)          score += 10;
  if (p.academicRecord?.cgpa)          score += 20;
  if (p.resumeUrl)                     score += 20;
  if (p.academicRecord?.ugYearOfPass)  score += 10;
  return score;
}

/* ══════════════════════════════════
   SUB-COMPONENTS
══════════════════════════════════ */

/* ── Verification Banner ── */
function VerificationBanner({ status, remarks }: { status: string; remarks?: string }) {
  if (status === 'VERIFIED') return (
    <div className="sd-banner success fade-in">
      <CheckCircle2 size={18} />
      <div>
        <strong>Profile Verified</strong>
        <p>Your profile has been verified by faculty. You can now apply for placement drives.</p>
      </div>
    </div>
  );
  if (status === 'PENDING') return (
    <div className="sd-banner pending fade-in">
      <Clock size={18} />
      <div>
        <strong>Profile Awaiting Faculty Verification</strong>
        <p>Your profile is under review. You'll be notified once verified.</p>
      </div>
    </div>
  );
  return (
    <div className="sd-banner rejected fade-in">
      <AlertCircle size={18} />
      <div>
        <strong>Profile Verification Rejected</strong>
        {remarks && <p>Remarks: {remarks}</p>}
        <p>Please update your profile and re-submit for verification.</p>
      </div>
    </div>
  );
}

/* ── Toast ── */
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

/* ── Animated counter ── */
function AnimCounter({ target, prefix = '', suffix = '' }: { target: number; prefix?: string; suffix?: string }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!target) return;
    const step = Math.ceil(target / 30);
    let cur = 0;
    const t = setInterval(() => {
      cur = Math.min(cur + step, target);
      setVal(cur);
      if (cur >= target) clearInterval(t);
    }, 30);
    return () => clearInterval(t);
  }, [target]);
  return <>{prefix}{val}{suffix}</>;
}

/* ── KPI Card ── */
function KpiCard({ label, value, sub, icon, color, prefix = '', suffix = '' }: {
  label: string; value: number; sub?: string;
  icon: JSX.Element; color: string; prefix?: string; suffix?: string;
}) {
  return (
    <div className="sd-kpi fade-in" style={{ borderTop: `3px solid ${color}` }}>
      <div className="sd-kpi-icon" style={{ background: `${color}18`, color }}>
        {icon}
      </div>
      <div className="sd-kpi-body">
        <span className="sd-kpi-label">{label}</span>
        <span className="sd-kpi-value">
          <AnimCounter target={value} prefix={prefix} suffix={suffix} />
        </span>
        {sub && <span className="sd-kpi-sub">{sub}</span>}
      </div>
    </div>
  );
}

/* ── Completion Ring ── */
function CompletionRing({ pct }: { pct: number }) {
  const r = 44, circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const color = pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <div className="sd-ring-wrap">
      <svg width="110" height="110">
        <circle cx="55" cy="55" r={r} fill="none" stroke="#f1f5f9" strokeWidth="8" />
        <circle cx="55" cy="55" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 55 55)" style={{ transition: 'stroke-dasharray 1s ease' }} />
        <text x="55" y="55" textAnchor="middle" dominantBaseline="central"
          fontSize="18" fontWeight="800" fill={color}>{pct}%</text>
        <text x="55" y="70" textAnchor="middle" fontSize="9" fill="#94a3b8">Complete</text>
      </svg>
    </div>
  );
}

/* ── Drive Card ── */
function DriveCard({ drive, onApply, applying }: {
  drive: Drive; onApply: (id: number) => void; applying: boolean;
}) {
  const statusColor: Record<string, string> = {
    UPCOMING: '#3b82f6', ONGOING: '#10b981', COMPLETED: '#94a3b8'
  };
  return (
    <div className="sd-drive-card fade-in">
      <div className="sd-drive-top">
        <div className="sd-drive-company-icon">
          {drive.companyName.charAt(0).toUpperCase()}
        </div>
        <span className="sd-drive-status badge"
          style={{ background: `${statusColor[drive.status]}18`, color: statusColor[drive.status] }}>
          {drive.status}
        </span>
      </div>
      <h3 className="sd-drive-title">{drive.title}</h3>
      <p className="sd-drive-company">{drive.companyName}</p>
      <div className="sd-drive-meta">
        <span><Briefcase size={12} /> {drive.role}</span>
        <span><TrendingUp size={12} /> ₹{drive.ctcLpa} LPA</span>
      </div>
      {!drive.isEligible && drive.ineligibilityReason && (
        <div className="sd-drive-ineligible">
          <AlertCircle size={12} /> {drive.ineligibilityReason}
        </div>
      )}
      <button
        className={`sd-apply-btn ${drive.isEligible ? 'eligible' : 'disabled'}`}
        disabled={!drive.isEligible || applying}
        onClick={() => drive.isEligible && onApply(drive.id)}
      >
        {applying ? 'Applying…' : drive.isEligible ? 'Apply Now' : 'Not Eligible'}
      </button>
    </div>
  );
}

/* ── Custom Tooltip ── */
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

/* ══════════════════════════════════
   MAIN PAGE
══════════════════════════════════ */
export default function StudentDashboard() {
  const email = getEmail();
  const name  = getName();

  const [loading,      setLoading]      = useState(true);
  const [profile,      setProfile]      = useState<StudentProfile | null>(null);
  const [drives,       setDrives]       = useState<Drive[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [stats,        setStats]        = useState<DashboardStats | null>(null);
  const [applying,     setApplying]     = useState<number | null>(null);
  const [toast,        setToast]        = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [refreshKey,   setRefreshKey]   = useState(0);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => setToast({ msg, type });

  /* ── Load all data ── */
  useEffect(() => {
    if (!email) return;
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const [profRes, drivesRes, appsRes, statsRes] = await Promise.all([
          // GET /api/student/profile?email=
          getJson<StudentProfile>(`/api/student/profile?email=${encodeURIComponent(email)}`),
          // GET /api/student/drives?email=
          getJson<Drive[]>(`/api/student/drives?email=${encodeURIComponent(email)}`),
          // GET /api/student/applications?email=
          getJson<Application[]>(`/api/student/applications?email=${encodeURIComponent(email)}`),
          // GET /api/student/dashboard/stats?email=
          getJson<DashboardStats>(`/api/student/dashboard/stats?email=${encodeURIComponent(email)}`),
        ]);
        if (!active) return;
        setProfile(profRes.data);
        if (profRes.data?.verificationStatus) {
          localStorage.setItem('verificationStatus', profRes.data.verificationStatus);
        }
        setDrives(drivesRes.data   || []);
        setApplications(appsRes.data || []);
        setStats(statsRes.data);
      } catch (e: any) {
        if (active) showToast(e.message || 'Failed to load dashboard', 'error');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [email, refreshKey]);

  /* ── Apply for drive ── */
  const handleApply = async (driveId: number) => {
    if (profile?.verificationStatus !== 'VERIFIED') {
      showToast('Your profile must be verified before applying', 'error');
      return;
    }
    try {
      setApplying(driveId);
      // POST /api/student/applications/{driveId}/apply?email=
      await postJson(`/api/student/applications/${driveId}/apply?email=${encodeURIComponent(email)}`, {});
      showToast('Application submitted successfully!');
      setRefreshKey(k => k + 1);
    } catch (e: any) {
      showToast(e.message || 'Failed to apply', 'error');
    } finally {
      setApplying(null);
    }
  };

  /* ── Derived chart data ── */
  const completion = calcCompletion(profile);

  /* Applications by stage — pie chart */
  const stagePieData = useMemo(() => {
    const counts: Record<string, number> = {};
    applications.forEach(a => { counts[a.stage] = (counts[a.stage] ?? 0) + 1; });
    return Object.entries(counts).map(([stage, count]) => ({ name: stage, value: count }));
  }, [applications]);

  /* Skill match bar — skills from drives vs applications */
  const skillBarData = useMemo(() => {
    const eligible   = drives.filter(d => d.isEligible).length;
    const ineligible = drives.filter(d => !d.isEligible).length;
    return [
      { label: 'Eligible',   count: eligible   },
      { label: 'Ineligible', count: ineligible },
    ];
  }, [drives]);

  /* Stage progression line-like bar for "current stage" */
  const latestApp = applications[0] ?? null;
  const currentStage = latestApp?.stage ?? '—';

  /* Upcoming drives */
  const upcomingDrives = useMemo(() =>
    drives.filter(d => d.status === 'UPCOMING' || d.status === 'ONGOING').slice(0, 6),
    [drives]);

  /* Recent applications */
  const recentApps = applications.slice(0, 5);

  /* ── KPI numbers ── */
  const eligibleCount    = drives.filter(d => d.isEligible).length;
  const appliedCount     = applications.length;
  const offersCount      = profile?.numberOfOffers ?? 0;
  const selectedCount    = applications.filter(a => a.stage === 'SELECTED').length;

  /* ══ RENDER ══ */
  return (
    <StudentLayout>
      <div className="sd-page">

        {/* ── Verification banner ── */}
        {!loading && profile && (
          <VerificationBanner status={profile.verificationStatus} />
        )}

        {/* ── Welcome header ── */}
        <div className="sd-welcome fade-in">
          <div>
            <h1 className="sd-welcome-title">
              Welcome back, <span className="sd-welcome-name">{name}</span> 👋
            </h1>
            <p className="sd-welcome-sub">
              {profile?.verificationStatus === 'VERIFIED'
                ? `You're eligible for ${eligibleCount} drive${eligibleCount !== 1 ? 's' : ''} — start applying!`
                : 'Complete your profile to unlock placement drives.'}
            </p>
          </div>
          <button className="btn-secondary" onClick={() => setRefreshKey(k => k + 1)} disabled={loading}>
            <RefreshCw size={14} style={loading ? { animation: 'spin 1s linear infinite' } : {}} />
            Refresh
          </button>
        </div>

        {/* ── KPI Row ── */}
        {loading ? (
          <div className="sd-kpi-grid">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="sd-kpi"><div className="sk-box" style={{ height: 80, borderRadius: 12 }} /></div>
            ))}
          </div>
        ) : (
          <div className="sd-kpi-grid fade-in">
            <KpiCard
              label="Eligible Drives"
              value={eligibleCount}
              sub={`${drives.length} total drives`}
              icon={<Briefcase size={20} />}
              color="#6366f1"
            />
            <KpiCard
              label="Applications"
              value={appliedCount}
              sub={latestApp ? `Latest: ${latestApp.companyName}` : 'None yet'}
              icon={<FileText size={20} />}
              color="#3b82f6"
            />
            <KpiCard
              label="Selections"
              value={selectedCount}
              sub={offersCount ? `${offersCount} offer${offersCount > 1 ? 's' : ''} received` : 'Keep going!'}
              icon={<Award size={20} />}
              color="#10b981"
            />
            <KpiCard
              label="Offers Received"
              value={offersCount}
              sub={profile?.highestPackageLpa ? `Best: ₹${profile.highestPackageLpa} LPA` : 'No offers yet'}
              icon={<Zap size={20} />}
              color="#f59e0b"
              prefix=""
            />
          </div>
        )}

        {/* ── Middle section: Charts + Profile ring ── */}
        <div className="sd-middle-grid">

          {/* Chart 1 — Applications by Stage Pie */}
          <div className="sd-chart-card fade-in">
            <div className="sd-chart-title">
              <FileText size={16} color="#6366f1" />
              <span>Applications by Stage</span>
            </div>
            {loading ? (
              <div className="sk-box" style={{ height: 240, borderRadius: 12 }} />
            ) : stagePieData.length === 0 ? (
              <div className="sd-chart-empty">
                <FileText size={36} color="#cbd5e1" />
                <p>No applications yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={stagePieData} cx="50%" cy="50%" outerRadius={85}
                    dataKey="value" labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    animationBegin={0} animationDuration={700}>
                    {stagePieData.map((entry, i) => (
                      <Cell key={i} fill={STAGE_COLORS[entry.name] ?? STATUS_COLORS[i % STATUS_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Chart 2 — Drive Eligibility Bar */}
          <div className="sd-chart-card fade-in">
            <div className="sd-chart-title">
              <Briefcase size={16} color="#10b981" />
              <span>Drive Eligibility Overview</span>
            </div>
            {loading ? (
              <div className="sk-box" style={{ height: 240, borderRadius: 12 }} />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={skillBarData} barCategoryGap="40%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
                  <Bar dataKey="count" name="Drives" radius={[8, 8, 0, 0]} animationDuration={700}>
                    {skillBarData.map((_, i) => (
                      <Cell key={i} fill={i === 0 ? '#10b981' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Profile Completion Card */}
          <div className="sd-profile-card fade-in">
            <div className="sd-chart-title">
              <TrendingUp size={16} color="#8b5cf6" />
              <span>Profile Completion</span>
            </div>
            {loading ? (
              <div className="sk-box" style={{ height: 200, borderRadius: 12 }} />
            ) : (
              <>
                <CompletionRing pct={completion} />
                <div className="sd-completion-items">
                  {[
                    { label: 'Roll No',       done: !!profile?.rollNo },
                    { label: 'Personal Info', done: !!profile?.personalDetails?.firstName },
                    { label: 'Bio',           done: !!profile?.personalDetails?.bio },
                    { label: 'Academic Record', done: !!profile?.academicRecord?.cgpa },
                    { label: 'Resume',        done: !!profile?.resumeUrl },
                    { label: 'Year of Pass',  done: !!profile?.academicRecord?.ugYearOfPass },
                  ].map((item, i) => (
                    <div key={i} className="sd-completion-item">
                      <span className={`sd-completion-dot ${item.done ? 'done' : ''}`} />
                      <span className={item.done ? 'sd-item-done' : 'sd-item-pending'}>{item.label}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── AI Insight Banner ── */}
        {!loading && (
          <div className="sd-insight-card fade-in">
            <div className="sd-insight-icon"><Sparkles size={20} /></div>
            <div className="sd-insight-body">
              <div className="sd-insight-title">Smart Insights</div>
              <div className="sd-insight-text">
                {applications.length === 0
                  ? 'You have not applied to any drives yet. Browse open drives and start applying!'
                  : currentStage === 'SELECTED'
                  ? '🎉 Congratulations! You have been selected. Check your offer details.'
                  : `Your latest application is at stage: ${currentStage}. ${selectedCount > 0 ? `You have ${selectedCount} selection(s)!` : 'Keep pushing through the rounds.'}`}
                {profile?.verificationStatus === 'PENDING' && ' Complete your profile to get verified by your faculty.'}
              </div>
            </div>
            <span className="badge success" style={{ fontSize: 11, flexShrink: 0 }}>Live</span>
          </div>
        )}

        {/* ── Bottom section: Drives + Applications ── */}
        <div className="sd-bottom-grid">

          {/* Upcoming / Open Drives */}
          <div className="sd-section-card fade-in">
            <div className="sd-section-header">
              <h3 className="sd-section-title">
                <Briefcase size={16} color="#6366f1" /> Open Drives
              </h3>
              <span className="sd-section-count">{upcomingDrives.length}</span>
            </div>

            {loading ? (
              <div className="sd-drive-list">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="sd-drive-row-sk">
                    <div className="sk-box" style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0 }} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div className="sk-box sk-text-sm" style={{ width: '60%' }} />
                      <div className="sk-box sk-text-xs" style={{ width: '40%' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : upcomingDrives.length === 0 ? (
              <div className="sd-section-empty">
                <Briefcase size={32} color="#cbd5e1" />
                <p>No open drives right now</p>
              </div>
            ) : (
              <div className="sd-drive-list">
                {upcomingDrives.map(drive => (
                  <div key={drive.id} className="sd-drive-row">
                    <div className="sd-drive-row-icon">
                      {drive.companyName.charAt(0).toUpperCase()}
                    </div>
                    <div className="sd-drive-row-body">
                      <div className="sd-drive-row-title">{drive.title}</div>
                      <div className="sd-drive-row-meta">
                        <span><Building2 size={11} /> {drive.companyName}</span>
                        <span><TrendingUp size={11} /> ₹{drive.ctcLpa} LPA</span>
                      </div>
                    </div>
                    <div className="sd-drive-row-right">
                      <span className={`badge ${drive.isEligible ? 'success' : 'danger'}`} style={{ fontSize: 10 }}>
                        {drive.isEligible ? 'Eligible' : 'Ineligible'}
                      </span>
                      {drive.isEligible && (
                        <button
                          className="sd-apply-mini"
                          disabled={applying === drive.id}
                          onClick={() => handleApply(drive.id)}
                        >
                          {applying === drive.id ? '…' : 'Apply'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Applications */}
          <div className="sd-section-card fade-in">
            <div className="sd-section-header">
              <h3 className="sd-section-title">
                <FileText size={16} color="#3b82f6" /> My Applications
              </h3>
              <span className="sd-section-count">{applications.length}</span>
            </div>

            {loading ? (
              <div className="sd-drive-list">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="sd-drive-row-sk">
                    <div className="sk-box" style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0 }} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div className="sk-box sk-text-sm" style={{ width: '60%' }} />
                      <div className="sk-box sk-text-xs" style={{ width: '40%' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentApps.length === 0 ? (
              <div className="sd-section-empty">
                <FileText size={32} color="#cbd5e1" />
                <p>No applications submitted yet</p>
              </div>
            ) : (
              <div className="sd-drive-list">
                {recentApps.map(app => (
                  <div key={app.id} className="sd-drive-row">
                    <div className="sd-drive-row-icon" style={{ background: `${STAGE_COLORS[app.stage] ?? '#94a3b8'}18`, color: STAGE_COLORS[app.stage] }}>
                      {app.companyName.charAt(0).toUpperCase()}
                    </div>
                    <div className="sd-drive-row-body">
                      <div className="sd-drive-row-title">{app.driveTitle}</div>
                      <div className="sd-drive-row-meta">
                        <span><Building2 size={11} /> {app.companyName}</span>
                        <span><Calendar size={11} /> {fmtDate(app.appliedAt)}</span>
                      </div>
                    </div>
                    <div className="sd-drive-row-right">
                      <span className="badge" style={{
                        fontSize: 10,
                        background: `${STAGE_COLORS[app.stage] ?? '#94a3b8'}18`,
                        color: STAGE_COLORS[app.stage] ?? '#94a3b8',
                      }}>
                        {app.stage}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notifications / Alerts */}
          <div className="sd-section-card fade-in">
            <div className="sd-section-header">
              <h3 className="sd-section-title">
                <Bell size={16} color="#f59e0b" /> Notifications
              </h3>
            </div>
            <div className="sd-notif-list">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <div key={i} className="sd-notif-item">
                    <div className="sk-box" style={{ width: 32, height: 32, borderRadius: 10 }} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <div className="sk-box sk-text-sm" style={{ width: '70%' }} />
                      <div className="sk-box sk-text-xs" style={{ width: '45%' }} />
                    </div>
                  </div>
                ))
              ) : (
                <>
                  {profile?.verificationStatus === 'PENDING' && (
                    <div className="sd-notif-item warning">
                      <div className="sd-notif-icon warning"><Clock size={14} /></div>
                      <div>
                        <div className="sd-notif-text">Profile verification pending</div>
                        <div className="sd-notif-sub">Awaiting faculty review</div>
                      </div>
                    </div>
                  )}
                  {profile?.verificationStatus === 'VERIFIED' && (
                    <div className="sd-notif-item success">
                      <div className="sd-notif-icon success"><CheckCircle2 size={14} /></div>
                      <div>
                        <div className="sd-notif-text">Profile verified!</div>
                        <div className="sd-notif-sub">You can now apply to eligible drives</div>
                      </div>
                    </div>
                  )}
                  {profile?.verificationStatus === 'REJECTED' && (
                    <div className="sd-notif-item danger">
                      <div className="sd-notif-icon danger"><AlertCircle size={14} /></div>
                      <div>
                        <div className="sd-notif-text">Profile rejected</div>
                        <div className="sd-notif-sub">Update your profile and re-submit</div>
                      </div>
                    </div>
                  )}
                  {applications.filter(a => a.stage === 'SELECTED').map(a => (
                    <div key={a.id} className="sd-notif-item success">
                      <div className="sd-notif-icon success"><Award size={14} /></div>
                      <div>
                        <div className="sd-notif-text">Selected at {a.companyName}!</div>
                        <div className="sd-notif-sub">{a.driveTitle}</div>
                      </div>
                    </div>
                  ))}
                  {upcomingDrives.filter(d => d.status === 'UPCOMING' && d.isEligible).slice(0, 2).map(d => (
                    <div key={d.id} className="sd-notif-item info">
                      <div className="sd-notif-icon info"><Briefcase size={14} /></div>
                      <div>
                        <div className="sd-notif-text">New eligible drive: {d.title}</div>
                        <div className="sd-notif-sub">{d.companyName} · ₹{d.ctcLpa} LPA</div>
                      </div>
                    </div>
                  ))}
                  {completion < 80 && (
                    <div className="sd-notif-item warning">
                      <div className="sd-notif-icon warning"><TrendingUp size={14} /></div>
                      <div>
                        <div className="sd-notif-text">Complete your profile ({completion}%)</div>
                        <div className="sd-notif-sub">Higher completion improves eligibility</div>
                      </div>
                    </div>
                  )}
                  {!profile?.resumeUrl && (
                    <div className="sd-notif-item warning">
                      <div className="sd-notif-icon warning"><ExternalLink size={14} /></div>
                      <div>
                        <div className="sd-notif-text">Upload your resume</div>
                        <div className="sd-notif-sub">Required for most placement drives</div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </StudentLayout>
  );
}
