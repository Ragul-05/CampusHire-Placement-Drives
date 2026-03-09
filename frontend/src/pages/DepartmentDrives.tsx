import { useEffect, useMemo, useState } from 'react';
import {
  RefreshCw, ChevronLeft, Building2, Briefcase, Users, CheckCircle,
  Clock, XCircle, AlertCircle, CheckCircle2, X, Eye, Star,
  TrendingUp, Award, Search, Filter
} from 'lucide-react';
import '../styles/dashboard.css';
import { getJson, facultyUrl } from '../utils/api';
import FacultyLayout from '../components/FacultyLayout';
import ExportButton from '../components/ExportButton';

/* ══════════════════════════════════
   TYPES
══════════════════════════════════ */
type Drive = {
  id: number;
  title: string;
  companyName: string;
  role: string;
  ctcLpa: number;
  status: string;
  totalDepartmentApplicants: number;
  selectedDepartmentApplicants: number;
};

type EligibleStudent = {
  id: number;
  rollNo: string;
  name: string;
  email: string;
  batch?: string;
  cgpa: number;
  standingArrears: number;
  historyOfArrears: number;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  isEligibleForPlacements: boolean;
  skills: string[];
};

type FilterResult = {
  drive: any;
  totalVerified: number;
  eligibleStudents: EligibleStudent[];
  ineligibleReasons: Record<number, string[]>;
};

type Participant = {
  id: number;
  studentId: number;
  studentName: string;
  rollNo: string;
  stage: 'APPLIED' | 'ASSESSMENT' | 'TECHNICAL' | 'HR' | 'SELECTED';
};

type StatusKey = 'ALL' | 'UPCOMING' | 'ONGOING' | 'COMPLETED';

/* ══════════════════════════════════
   NORMALISE raw API object → Drive
   Handles both FacultyDriveDTO (title)
   and active-drives Map (jobTitle)
══════════════════════════════════ */
function normaliseDrive(raw: any): Drive {
  return {
    id:                          raw.id ?? 0,
    title:                       raw.title ?? raw.jobTitle ?? raw.driveName ?? 'Unnamed Drive',
    companyName:                 raw.companyName ?? raw.company ?? '—',
    role:                        raw.role ?? '—',
    ctcLpa:                      raw.ctcLpa ?? raw.ctc ?? 0,
    status:                      (raw.status ?? 'UPCOMING').toString().toUpperCase(),
    totalDepartmentApplicants:   raw.totalDepartmentApplicants ?? raw.applicants ?? 0,
    selectedDepartmentApplicants: raw.selectedDepartmentApplicants ?? raw.selected ?? 0,
  };
}

/* ══════════════════════════════════
   CONSTANTS
══════════════════════════════════ */
const STATUS_META: Record<string, { cls: string; icon: JSX.Element; color: string }> = {
  UPCOMING:  { cls: 'info',    icon: <Clock size={11} />,       color: '#3b82f6' },
  ONGOING:   { cls: 'success', icon: <CheckCircle size={11} />, color: '#10b981' },
  COMPLETED: { cls: 'warning', icon: <XCircle size={11} />,     color: '#94a3b8' },
};

const STAGE_COLORS: Record<string, string> = {
  APPLIED: '#3b82f6', ASSESSMENT: '#f59e0b', TECHNICAL: '#8b5cf6',
  HR: '#06b6d4', SELECTED: '#10b981',
};

/* ══════════════════════════════════
   HELPERS
══════════════════════════════════ */
function calcSkillMatch(studentSkills: string[], requiredSkills: string[]): number {
  if (!requiredSkills?.length) return 100;
  if (!studentSkills?.length) return 0;
  const req  = requiredSkills.map(s => s.toLowerCase());
  const have = studentSkills.map(s => s.toLowerCase());
  const hit  = req.filter(r => have.some(h => h.includes(r) || r.includes(h))).length;
  return Math.round((hit / req.length) * 100);
}

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

function SkillBar({ pct }: { pct: number }) {
  const color = pct === 100 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#ef4444';
  return (
    <div className="df-skill-bar-wrap" style={{ minWidth: 90 }}>
      <div className="df-skill-bar-track">
        <div className="df-skill-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="df-skill-bar-label" style={{ color }}>{pct}%</span>
    </div>
  );
}

/* ══════════════════════════════════
   ELIGIBLE STUDENTS MODAL
══════════════════════════════════ */
function EligibleModal({ drive, onClose }: { drive: Drive; onClose: () => void }) {
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [students, setStudents]               = useState<EligibleStudent[]>([]);
  const [participants, setParticipants]       = useState<Participant[]>([]);
  const [requiredSkills, setRequiredSkills]   = useState<string[]>([]);
  const [search, setSearch]                   = useState('');
  const [error, setError]                     = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoadingStudents(true);
        const [filterRes, partRes] = await Promise.all([
          // ✅ GET /api/faculty/drives/{driveId}/filter-eligible?facultyEmail=
          getJson<FilterResult>(facultyUrl(`/api/faculty/drives/${drive.id}/filter-eligible`)),
          // ✅ GET /api/faculty/drives/{driveId}/participants?facultyEmail=
          getJson<Participant[]>(facultyUrl(`/api/faculty/drives/${drive.id}/participants`)),
        ]);
        if (!active) return;
        const result = filterRes.data;
        setStudents(result?.eligibleStudents || []);
        // required skills may be in eligibilityCriteria of the drive map
        const driveData = result?.drive as any;
        setRequiredSkills(driveData?.eligibilityCriteria?.requiredSkills || []);
        setParticipants(partRes.data || []);
      } catch (e: any) {
        if (active) setError(e.message || 'Failed to load eligible students');
      } finally {
        if (active) setLoadingStudents(false);
      }
    })();
    return () => { active = false; };
  }, [drive.id]);

  const enriched = useMemo(() => {
    const stageMap = new Map(participants.map(p => [p.studentId, p.stage]));
    return students
      .filter(s => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return s.name.toLowerCase().includes(q) || s.rollNo.toLowerCase().includes(q);
      })
      .map(s => ({
        ...s,
        skillMatch: calcSkillMatch(s.skills || [], requiredSkills),
        currentStage: stageMap.get(s.id) ?? null,
      }));
  }, [students, participants, requiredSkills, search]);

  return (
    <div className="sv-modal-overlay" onClick={onClose}>
      <div className="sv-modal dd-eligible-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 760 }}>
        {/* Header */}
        <div className="sv-modal-header">
          <div className="sv-modal-title-block">
            <div className="dd-modal-drive-icon"><Building2 size={20} color="#2563eb" /></div>
            <div>
              <h3 className="sv-modal-name">{drive.title}</h3>
              <p className="sv-modal-meta">{drive.companyName} · {drive.role} · ₹{drive.ctcLpa} LPA</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className={`badge ${STATUS_META[drive.status]?.cls ?? 'info'}`}>
              {STATUS_META[drive.status]?.icon} {drive.status}
            </span>
            <button className="sv-modal-close" onClick={onClose}><X size={18} /></button>
          </div>
        </div>

        {/* Search */}
        <div style={{ padding: '12px 24px 0' }}>
          <div className="sv-search-box">
            <Search size={14} color="#94a3b8" />
            <input placeholder="Search by name or roll number…" value={search}
              onChange={e => setSearch(e.target.value)} />
            {search && <button className="sv-search-clear" onClick={() => setSearch('')}><X size={12} /></button>}
          </div>
        </div>

        {/* Body */}
        <div className="sv-modal-body" style={{ padding: '16px 24px 0', maxHeight: '60vh', overflowY: 'auto' }}>
          {error && (
            <div className="faculty-alert-banner"><AlertCircle size={16} /><span>{error}</span></div>
          )}
          {loadingStudents ? (
            <div style={{ padding: '8px 0' }}>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="sk-table-row">
                  {[14, 24, 10, 12, 18, 12].map((w, j) => (
                    <div key={j} className="sk-box sk-text-sm" style={{ width: `${w}%` }} />
                  ))}
                </div>
              ))}
            </div>
          ) : enriched.length === 0 ? (
            <div className="faculty-empty-state" style={{ padding: '40px 0' }}>
              <Users size={40} color="#94a3b8" />
              <h4>No Eligible Students</h4>
              <p>No verified students currently meet this drive's criteria</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="dd-modal-table">
                <thead>
                  <tr><th>#</th><th>Student</th><th>CGPA</th><th>Arrears</th><th>Skill Match</th><th>Stage</th></tr>
                </thead>
                <tbody>
                  {enriched.map((s, idx) => (
                    <tr key={s.id}>
                      <td className="sm-row-num">{idx + 1}</td>
                      <td>
                        <div className="faculty-user-cell">
                          <div className="faculty-avatar verified">{(s.name || '?').charAt(0).toUpperCase()}</div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{s.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.rollNo}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={s.cgpa >= 7 ? 'faculty-cgpa good' : 'faculty-cgpa low'}>
                          {s.cgpa?.toFixed(2) ?? '—'}
                        </span>
                      </td>
                      <td>
                        <span className={s.standingArrears > 0 ? 'faculty-arrears bad' : 'faculty-arrears ok'}>
                          {s.standingArrears}
                        </span>
                      </td>
                      <td><SkillBar pct={s.skillMatch} /></td>
                      <td>
                        {s.currentStage ? (
                          <span className="badge" style={{
                            background: `${STAGE_COLORS[s.currentStage]}18`,
                            color: STAGE_COLORS[s.currentStage],
                            border: `1px solid ${STAGE_COLORS[s.currentStage]}30`,
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            fontSize: 11, fontWeight: 700,
                          }}>
                            {s.currentStage === 'SELECTED' && <Star size={10} />}
                            {s.currentStage}
                          </span>
                        ) : (
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Not Applied</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sv-modal-footer" style={{ justifyContent: 'space-between' }}>
          <span className="sv-result-count">
            {loadingStudents ? '…' : `${enriched.length} eligible student${enriched.length !== 1 ? 's' : ''}`}
          </span>
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════
   DRIVE CARD
══════════════════════════════════ */
function DriveCard({ drive, onViewEligible }: { drive: Drive; onViewEligible: (d: Drive) => void }) {
  const meta = STATUS_META[drive.status] ?? STATUS_META['UPCOMING'];
  return (
    <div className={`dd-card fade-in dd-card-${drive.status.toLowerCase()}`}>
      <div className="dd-card-top">
        <div className="dd-company-icon"><Building2 size={22} color="#2563eb" /></div>
        <span className={`badge ${meta.cls} dd-status-badge`}>{meta.icon} {drive.status}</span>
      </div>
      <div className="dd-card-body">
        <h3 className="dd-drive-title">{drive.title}</h3>
        <p className="dd-company-name">{drive.companyName}</p>
        <div className="dd-role-row">
          <Briefcase size={13} color="#64748b" />
          <span className="dd-role">{drive.role || '—'}</span>
        </div>
      </div>
      <div className="dd-stats-row">
        <div className="dd-stat">
          <TrendingUp size={14} color="#10b981" />
          <div className="dd-stat-body">
            <span className="dd-stat-label">CTC</span>
            <span className="dd-stat-value ctc">₹{drive.ctcLpa ?? '—'} LPA</span>
          </div>
        </div>
        <div className="dd-stat">
          <Users size={14} color="#6366f1" />
          <div className="dd-stat-body">
            <span className="dd-stat-label">Dept. Applicants</span>
            <span className="dd-stat-value">{drive.totalDepartmentApplicants ?? 0}</span>
          </div>
        </div>
        <div className="dd-stat">
          <Award size={14} color="#f59e0b" />
          <div className="dd-stat-body">
            <span className="dd-stat-label">Selected</span>
            <span className="dd-stat-value selected">{drive.selectedDepartmentApplicants ?? 0}</span>
          </div>
        </div>
      </div>
      <button className="dd-eligible-btn" onClick={() => onViewEligible(drive)}>
        <Eye size={14} /> View Eligible Students
      </button>
    </div>
  );
}

function DriveCardSkeleton() {
  return (
    <div className="dd-card dd-card-skeleton">
      <div className="dd-card-top">
        <div className="sk-box sk-icon" style={{ borderRadius: 12 }} />
        <div className="sk-box" style={{ width: 72, height: 22, borderRadius: 8 }} />
      </div>
      <div className="dd-card-body" style={{ gap: 8 }}>
        <div className="sk-box sk-text-lg" style={{ width: '70%' }} />
        <div className="sk-box sk-text-sm" style={{ width: '50%' }} />
        <div className="sk-box sk-text-sm" style={{ width: '40%' }} />
      </div>
      <div className="dd-stats-row">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="dd-stat">
            <div className="sk-box" style={{ width: 28, height: 28, borderRadius: 8 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div className="sk-box sk-text-xs" style={{ width: 48 }} />
              <div className="sk-box sk-text-sm" style={{ width: 36 }} />
            </div>
          </div>
        ))}
      </div>
      <div className="sk-box" style={{ height: 40, borderRadius: 12 }} />
    </div>
  );
}

/* ══════════════════════════════════
   MAIN PAGE
══════════════════════════════════ */
export default function DepartmentDrives({ onNavigate }: { onNavigate?: (view: string) => void }) {
  const [loading, setLoading]             = useState(true);
  const [drives, setDrives]               = useState<Drive[]>([]);
  const [statusFilter, setStatusFilter]   = useState<StatusKey>('ALL');
  const [search, setSearch]               = useState('');
  const [selectedDrive, setSelectedDrive] = useState<Drive | null>(null);
  const [toast, setToast]                 = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [refreshKey, setRefreshKey]       = useState(0);
  const [dataSource, setDataSource]       = useState<string>('');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        setDrives([]);

        // ── Strategy 1: department-scoped drives ──
        // GET /api/faculty/drives?facultyEmail=
        // Returns FacultyDriveDTO[] with: id, title, companyName, role, ctcLpa, status,
        //         totalDepartmentApplicants, selectedDepartmentApplicants
        const res1 = await getJson<any[]>(facultyUrl('/api/faculty/drives'));
        if (!active) return;

        const raw1 = res1.data || [];
        if (raw1.length > 0) {
          setDrives(raw1.map(normaliseDrive));
          setDataSource('department');
          setLoading(false);
          return;
        }

        // ── Strategy 2: active drives (UPCOMING + ONGOING) ──
        // GET /api/faculty/drives/active?facultyEmail=
        // Returns List<Object> where each object is a Map with: id, jobTitle, companyName,
        //         ctcLpa, status, eligibilityCriteria
        try {
          const res2 = await getJson<any[]>(facultyUrl('/api/faculty/drives/active'));
          if (!active) return;
          const raw2 = res2.data || [];
          if (raw2.length > 0) {
            setDrives(raw2.map(normaliseDrive));
            setDataSource('active');
            setLoading(false);
            return;
          }
        } catch { /* fall through to strategy 3 */ }

        // ── Strategy 3: admin all-drives fallback ──
        // GET /api/admin/drives
        try {
          const res3 = await getJson<any[]>('/api/admin/drives');
          if (!active) return;
          const raw3 = res3.data || [];
          setDrives(raw3.map(normaliseDrive));
          setDataSource('admin');
        } catch {
          if (active) setDrives([]);
        }

      } catch (e: any) {
        if (active) setToast({ msg: e.message || 'Failed to load drives', type: 'error' });
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [refreshKey]);

  const displayed = useMemo(() => {
    let list = drives;
    if (statusFilter !== 'ALL') list = list.filter(d => d.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(d =>
        d.title.toLowerCase().includes(q) ||
        d.companyName.toLowerCase().includes(q) ||
        (d.role ?? '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [drives, statusFilter, search]);

  const counts: Record<StatusKey, number> = {
    ALL:       drives.length,
    UPCOMING:  drives.filter(d => d.status === 'UPCOMING').length,
    ONGOING:   drives.filter(d => d.status === 'ONGOING').length,
    COMPLETED: drives.filter(d => d.status === 'COMPLETED').length,
  };

  const tabs: { key: StatusKey; label: string; color: string }[] = [
    { key: 'ALL',       label: 'All Drives', color: '#6366f1' },
    { key: 'ONGOING',   label: 'Ongoing',    color: '#10b981' },
    { key: 'UPCOMING',  label: 'Upcoming',   color: '#3b82f6' },
    { key: 'COMPLETED', label: 'Completed',  color: '#94a3b8' },
  ];

  return (
    <FacultyLayout activeNav="drives" onNavigate={onNavigate}>
      <div className="content">

        {/* Header */}
        <div className="dd-page-header fade-in">
          <div>
            <h1 className="page-title">Department Drives</h1>
            <p className="page-subtitle">
              Placement drives for your department — view eligible students per drive
              {dataSource === 'active' && <span className="dd-source-note"> · Showing active drives</span>}
              {dataSource === 'admin'  && <span className="dd-source-note"> · Showing all available drives</span>}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <ExportButton
              disabled={drives.length === 0}
              opts={{
                title:    'Department Drives Report',
                subtitle: `Total drives: ${drives.length} · Generated by Faculty Portal`,
                filename: 'department-drives',
                columns: [
                  { header: '#',                  key: '_idx'                       },
                  { header: 'Drive Title',         key: 'title'                      },
                  { header: 'Company',             key: 'companyName'                },
                  { header: 'Role',                key: 'role'                       },
                  { header: 'CTC (LPA)',           key: 'ctcLpa'                     },
                  { header: 'Status',              key: 'status'                     },
                  { header: 'Dept. Applicants',    key: 'totalDepartmentApplicants'  },
                  { header: 'Selected',            key: 'selectedDepartmentApplicants'},
                ],
                rows: drives.map((d, i) => ({
                  _idx:                       i + 1,
                  title:                      d.title,
                  companyName:                d.companyName,
                  role:                       d.role ?? '—',
                  ctcLpa:                     d.ctcLpa,
                  status:                     d.status,
                  totalDepartmentApplicants:  d.totalDepartmentApplicants,
                  selectedDepartmentApplicants: d.selectedDepartmentApplicants,
                })),
              }}
            />
            <button className="btn-secondary" onClick={() => setRefreshKey(k => k + 1)} disabled={loading}>
              <RefreshCw size={15} style={loading ? { animation: 'spin 1s linear infinite' } : {}} />
              Refresh
            </button>
            <button className="btn-secondary" onClick={() => onNavigate?.('facultyDashboard')}>
              <ChevronLeft size={15} /> Dashboard
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="sv-filter-card fade-in">
          <div className="sv-tabs">
            {tabs.map(t => (
              <button key={t.key}
                className={`sv-tab ${statusFilter === t.key ? 'active' : ''}`}
                style={statusFilter === t.key ? { borderColor: t.color, color: t.color } : {}}
                onClick={() => setStatusFilter(t.key)}>
                {t.label}
                <span className="sv-tab-count"
                  style={statusFilter === t.key ? { background: t.color, color: '#fff' } : {}}>
                  {counts[t.key]}
                </span>
              </button>
            ))}
          </div>
          <div className="sv-search-row">
            <div className="sv-search-box">
              <Search size={15} color="#94a3b8" />
              <input placeholder="Search by title, company, or role…"
                value={search} onChange={e => setSearch(e.target.value)} />
              {search && (
                <button className="sv-search-clear" onClick={() => setSearch('')}><X size={13} /></button>
              )}
            </div>
            <span className="sv-result-count">
              {loading ? '…' : `${displayed.length} drive${displayed.length !== 1 ? 's' : ''}`}
            </span>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="dd-grid">
            {[...Array(6)].map((_, i) => <DriveCardSkeleton key={i} />)}
          </div>
        ) : displayed.length === 0 ? (
          <div className="faculty-empty-state dd-empty fade-in">
            {search || statusFilter !== 'ALL' ? (
              <>
                <Filter size={48} color="#94a3b8" />
                <h4>No Drives Match</h4>
                <p>Try clearing the search or selecting a different status</p>
                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                  {search && <button className="btn-secondary" onClick={() => setSearch('')}>Clear Search</button>}
                  {statusFilter !== 'ALL' && <button className="btn-secondary" onClick={() => setStatusFilter('ALL')}>Show All</button>}
                </div>
              </>
            ) : (
              <>
                <Briefcase size={48} color="#94a3b8" />
                <h4>No Drives Available</h4>
                <p>No placement drives are currently available for your department</p>
                <button className="btn-secondary" onClick={() => setRefreshKey(k => k + 1)} style={{ marginTop: 8 }}>
                  <RefreshCw size={14} /> Retry
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="dd-grid fade-in">
            {displayed.map(drive => (
              <DriveCard key={drive.id} drive={drive} onViewEligible={setSelectedDrive} />
            ))}
          </div>
        )}

      </div>

      {selectedDrive && (
        <EligibleModal drive={selectedDrive} onClose={() => setSelectedDrive(null)} />
      )}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </FacultyLayout>
  );
}
