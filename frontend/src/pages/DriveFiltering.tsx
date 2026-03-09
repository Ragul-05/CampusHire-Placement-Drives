import { useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft, ChevronDown, ChevronUp, Briefcase, Users, CheckCircle,
  XCircle, AlertCircle, RefreshCw, Filter, Building2, TrendingUp,
  Award, Star, ArrowUpDown, CheckCircle2, X
} from 'lucide-react';
import '../styles/dashboard.css';
import { getJson, postJson, facultyUrl } from '../utils/api';
import FacultyLayout from '../components/FacultyLayout';
import ExportButton from '../components/ExportButton';

/* ════════════════ TYPES — aligned with backend DTOs ════════════════ */
type EligibilityCriteria = {
  minCgpa: number;
  maxStandingArrears: number;
  maxHistoryOfArrears: number;
  allowedDepartments: string[];
  allowedGraduationYears: number[];
  requiredSkills: string[];
};

/* FacultyDriveDTO fields: id, companyName, title, role, ctcLpa, status */
type Drive = {
  id: number;
  title: string;          // ✅ backend field is "title", not "jobTitle"
  companyName: string;
  role?: string;
  ctcLpa: number;
  status: string;         // ✅ String (not enum) on DTO
  eligibilityCriteria: EligibilityCriteria;
};

/* FacultyStudentDTO fields: id, rollNo, name, email, verificationStatus, cgpa, standingArrears, historyOfArrears, skills */
type Student = {
  id: number;
  rollNo: string;         // ✅ backend: rollNo
  name: string;           // ✅ backend: name (single field)
  email: string;
  department?: string;
  batch?: string;
  graduationYear?: number;
  cgpa: number;
  standingArrears: number;
  historyOfArrears: number;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  isEligibleForPlacements: boolean;
  skills: string[];
  currentStage?: string;
};

type FilterResult = {
  drive: Drive;
  totalVerified: number;
  eligibleStudents: Student[];
  ineligibleReasons: Record<number, string[]>;
};

type SortKey = 'cgpa' | 'skillMatch' | 'name';
type SortDir = 'asc' | 'desc';

/* ════════════════ HELPERS ════════════════ */

/** Normalise raw active-drive object (Map<String,Object>) → Drive type.
 *  Active drives endpoint returns { id, jobTitle, companyName, ctcLpa, status, eligibilityCriteria:{...} }
 *  FacultyDriveDTO returns    { id, title, companyName, role, ctcLpa, status, eligibilityCriteria:{...} }
 */
function normaliseDrive(raw: any): Drive {
  const ec = raw.eligibilityCriteria ?? {};
  return {
    id:          raw.id ?? 0,
    title:       raw.title ?? raw.jobTitle ?? raw.driveName ?? 'Unnamed Drive',
    companyName: raw.companyName ?? raw.company ?? '—',
    role:        raw.role ?? '—',
    ctcLpa:      raw.ctcLpa ?? raw.ctc ?? 0,
    status:      (raw.status ?? 'UPCOMING').toString().toUpperCase(),
    eligibilityCriteria: {
      minCgpa:               ec.minCgpa               ?? 0,
      maxStandingArrears:    ec.maxStandingArrears     ?? 99,
      maxHistoryOfArrears:   ec.maxHistoryOfArrears    ?? 99,
      allowedDepartments:    ec.allowedDepartments     ?? [],
      allowedGraduationYears:ec.allowedGraduationYears ?? [],
      requiredSkills:        ec.requiredSkills         ?? [],
    },
  };
}

/** Compute skill match % vs drive required skills */
function calcSkillMatch(studentSkills: string[], requiredSkills: string[]): number {
  if (!requiredSkills.length) return 100;
  if (!studentSkills?.length) return 0;
  const req   = requiredSkills.map(s => s.toLowerCase());
  const have  = studentSkills.map(s => s.toLowerCase());
  const matched = req.filter(r => have.some(h => h.includes(r) || r.includes(h))).length;
  return Math.round((matched / req.length) * 100);
}

/** Compute eligibility for front-end highlight (mirrors backend logic) */
function isEligible(s: Student, c: EligibilityCriteria): boolean {
  if (s.verificationStatus !== 'VERIFIED' || !s.isEligibleForPlacements) return false;
  if (s.cgpa < c.minCgpa) return false;
  if (s.standingArrears > c.maxStandingArrears) return false;
  if (s.historyOfArrears > c.maxHistoryOfArrears) return false;
  if (c.allowedDepartments.length && !c.allowedDepartments.includes(s.department)) return false;
  if (c.allowedGraduationYears.length && !c.allowedGraduationYears.includes(s.graduationYear)) return false;
  return true;
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

/* ── Skill match bar ── */
function SkillBar({ pct }: { pct: number }) {
  const color = pct === 100 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#ef4444';
  return (
    <div className="df-skill-bar-wrap">
      <div className="df-skill-bar-track">
        <div className="df-skill-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="df-skill-bar-label" style={{ color }}>{pct}%</span>
    </div>
  );
}

/* ── Eligibility badge ── */
function EligiBadge({ eligible }: { eligible: boolean }) {
  return eligible
    ? <span className="badge success df-eligi-badge"><CheckCircle size={11} /> Eligible</span>
    : <span className="badge danger df-eligi-badge"><XCircle size={11} /> Ineligible</span>;
}

/* ── Criteria card ── */
function CriteriaCard({
  drive, collapsed, onToggle
}: { drive: Drive; collapsed: boolean; onToggle: () => void }) {
  const c = drive.eligibilityCriteria;
  return (
    <div className="df-criteria-card fade-in">
      <button className="df-criteria-header" onClick={onToggle}>
        <div className="df-criteria-title-row">
          <Award size={18} color="#7c3aed" />
          <span>Eligibility Criteria — {drive.title}</span>
          <span className="badge info" style={{ fontSize: 11 }}>{drive.companyName}</span>
        </div>
        {collapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
      </button>

      {!collapsed && (
        <div className="df-criteria-body">
          <div className="df-criteria-grid">
            <div className="df-crit-item">
              <span className="df-crit-label">Min. CGPA</span>
              <span className="df-crit-value cgpa">{c.minCgpa.toFixed(2)}</span>
            </div>
            <div className="df-crit-item">
              <span className="df-crit-label">Max Standing Arrears</span>
              <span className="df-crit-value arrears">{c.maxStandingArrears}</span>
            </div>
            <div className="df-crit-item">
              <span className="df-crit-label">Max History of Arrears</span>
              <span className="df-crit-value arrears">{c.maxHistoryOfArrears}</span>
            </div>
            <div className="df-crit-item">
              <span className="df-crit-label">Grad. Years</span>
              <span className="df-crit-value">
                {c.allowedGraduationYears.length ? c.allowedGraduationYears.join(', ') : 'Any'}
              </span>
            </div>
            <div className="df-crit-item" style={{ gridColumn: 'span 2' }}>
              <span className="df-crit-label">Allowed Departments</span>
              <div className="df-crit-tags">
                {c.allowedDepartments.length
                  ? c.allowedDepartments.map((d, i) => <span key={i} className="badge info df-dept-tag">{d}</span>)
                  : <span className="df-crit-value">All Departments</span>}
              </div>
            </div>
            <div className="df-crit-item" style={{ gridColumn: 'span 2' }}>
              <span className="df-crit-label">Required Skills</span>
              <div className="df-crit-tags">
                {c.requiredSkills.length
                  ? c.requiredSkills.map((sk, i) => <span key={i} className="sv-skill-tag">{sk}</span>)
                  : <span className="df-crit-value">No specific skills required</span>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ════════════════ MAIN PAGE ════════════════ */
export default function DriveFiltering({ onNavigate }: { onNavigate?: (view: any) => void }) {
  const [loadingDrives, setLoadingDrives] = useState(true);
  const [drives, setDrives]               = useState<Drive[]>([]);
  const [selectedDriveId, setSelectedDriveId] = useState<number | ''>('');
  const [filterResult, setFilterResult]   = useState<FilterResult | null>(null);
  const [filtering, setFiltering]         = useState(false);
  const [toast, setToast]                 = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [criteriaCollapsed, setCriteriaCollapsed] = useState(false);
  const [sortKey, setSortKey]             = useState<SortKey>('cgpa');
  const [sortDir, setSortDir]             = useState<SortDir>('desc');
  const [searchStudent, setSearchStudent] = useState('');
  const [showOnlyEligible, setShowOnlyEligible] = useState(true);
  const [refreshKey, setRefreshKey]       = useState(0);

  const selectedDrive = drives.find(d => d.id === selectedDriveId) ?? null;

  /* ── Load drives ── */
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoadingDrives(true);
        // Strategy 1: active drives (UPCOMING + ONGOING)
        // Returns List<Object> with jobTitle, companyName, ctcLpa, status, eligibilityCriteria
        const res = await getJson<any[]>(facultyUrl('/api/faculty/drives/active'));
        const raw1 = res.data || [];
        if (active && raw1.length > 0) {
          setDrives(raw1.map(normaliseDrive));
          setLoadingDrives(false);
          return;
        }
        // Strategy 2: dept-scoped drives (FacultyDriveDTO with title field)
        const res2 = await getJson<any[]>(facultyUrl('/api/faculty/drives'));
        if (active) setDrives((res2.data || []).map(normaliseDrive));
      } catch (e: any) {
        if (active) setToast({ msg: e.message || 'Failed to load drives', type: 'error' });
      } finally {
        if (active) setLoadingDrives(false);
      }
    })();
    return () => { active = false; };
  }, [refreshKey]);

  /* ── Auto-filter when drive changes ── */
  useEffect(() => {
    if (!selectedDriveId) { setFilterResult(null); return; }
    runFilter(selectedDriveId as number);
  }, [selectedDriveId]);

  const runFilter = async (driveId: number) => {
    try {
      setFiltering(true);
      setFilterResult(null);
      // ✅ GET /api/faculty/drives/{driveId}/filter-eligible?facultyEmail=
      const res = await getJson<FilterResult>(facultyUrl(`/api/faculty/drives/${driveId}/filter-eligible`));
      const raw = res.data;
      if (raw) {
        // Normalise nested drive object so eligibilityCriteria is always present
        raw.drive = normaliseDrive(raw.drive ?? {});
        // Ensure eligibleStudents have safe defaults
        raw.eligibleStudents = (raw.eligibleStudents ?? []).map(s => ({
          ...s,
          cgpa:             s.cgpa             ?? 0,
          standingArrears:  s.standingArrears  ?? 0,
          historyOfArrears: s.historyOfArrears ?? 0,
          skills:           s.skills           ?? [],
        }));
      }
      setFilterResult(raw);
    } catch (e: any) {
      setToast({ msg: e.message || 'Failed to filter students', type: 'error' });
    } finally {
      setFiltering(false);
    }
  };

  /* ── Stage update ── */
  const updateStage = async (studentId: number, stage: string) => {
    try {
      // ✅ POST /api/faculty/drives/{studentId}/stage?facultyEmail= body: {driveId, stage}
      await postJson(
        facultyUrl(`/api/faculty/drives/${studentId}/stage`),
        { driveId: selectedDriveId, stage }
      );
      setToast({ msg: 'Stage updated successfully!', type: 'success' });
      if (selectedDriveId) runFilter(selectedDriveId as number);
    } catch (e: any) {
      setToast({ msg: e.message || 'Failed to update stage', type: 'error' });
    }
  };

  /* ── Sorted + filtered student list ── */
  const displayStudents = useMemo(() => {
    if (!filterResult || !selectedDrive) return [];
    const criteria = selectedDrive.eligibilityCriteria;
    let list = filterResult.eligibleStudents.map(s => ({
      ...s,
      skillMatch: calcSkillMatch(s.skills, criteria.requiredSkills),
      eligible: isEligible(s, criteria),
    }));

    if (showOnlyEligible) list = list.filter(s => s.eligible);

    if (searchStudent.trim()) {
      const q = searchStudent.toLowerCase();
      list = list.filter(s =>
        s.name.toLowerCase().includes(q) ||
        (s.department ?? s.batch ?? '').toLowerCase().includes(q) ||
        s.rollNo.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'cgpa') cmp = a.cgpa - b.cgpa;
      else if (sortKey === 'skillMatch') cmp = a.skillMatch - b.skillMatch;
      else cmp = a.name.localeCompare(b.name);   // ✅ single name field
      return sortDir === 'desc' ? -cmp : cmp;
    });

    return list;
  }, [filterResult, selectedDrive, showOnlyEligible, searchStudent, sortKey, sortDir]);

  const eligibleCount   = filterResult ? filterResult.eligibleStudents.filter(s => selectedDrive && isEligible(s, selectedDrive.eligibilityCriteria)).length : 0;
  const eligibilityRate = filterResult?.totalVerified ? Math.round((eligibleCount / filterResult.totalVerified) * 100) : 0;

  /* ── Sort toggle ── */
  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k
      ? sortDir === 'desc' ? <ChevronDown size={13} /> : <ChevronUp size={13} />
      : <ArrowUpDown size={13} style={{ opacity: 0.4 }} />;

  /* ── Stage badge colour ── */
  const stageCls: Record<string, string> = {
    APPLIED: 'info', ASSESSMENT: 'warning', TECHNICAL: 'warning', HR: 'warning', SELECTED: 'success'
  };

  /* ════ RENDER ════ */
  return (
    <FacultyLayout activeNav="filtering" onNavigate={onNavigate}>
      <div className="content">

        {/* ── Header ── */}
        <div className="df-page-header fade-in">
          <div>
            <h1 className="page-title">Drive-Based Student Filtering</h1>
            <p className="page-subtitle">Filter verified students by drive eligibility criteria — real-time</p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <ExportButton
              disabled={!filterResult || displayStudents.length === 0}
              opts={{
                title:    selectedDrive ? `Eligible Students — ${selectedDrive.title}` : 'Drive Filtering',
                subtitle: selectedDrive
                  ? `${selectedDrive.companyName} · ${selectedDrive.role ?? ''} · ₹${selectedDrive.ctcLpa} LPA · CGPA ≥ ${selectedDrive.eligibilityCriteria?.minCgpa ?? '—'}`
                  : '',
                filename: selectedDrive
                  ? `eligible-students-${selectedDrive.title.replace(/\s+/g, '-').toLowerCase()}`
                  : 'eligible-students',
                columns: [
                  { header: '#',             key: '_idx'          },
                  { header: 'Name',          key: 'name'          },
                  { header: 'Roll No',       key: 'rollNo'        },
                  { header: 'Department',    key: 'department'    },
                  { header: 'CGPA',          key: 'cgpa'          },
                  { header: 'Arrears',       key: 'standingArrears'},
                  { header: 'Skill Match %', key: 'skillMatch'    },
                  { header: 'Eligibility',   key: '_eligible'     },
                  { header: 'Stage',         key: 'currentStage'  },
                ],
                rows: displayStudents.map((s, i) => ({
                  _idx:          i + 1,
                  name:          s.name,
                  rollNo:        s.rollNo,
                  department:    s.department ?? s.batch ?? '—',
                  cgpa:          s.cgpa?.toFixed(2),
                  standingArrears: s.standingArrears,
                  skillMatch:    s.skillMatch,
                  _eligible:     s.eligible ? 'ELIGIBLE' : 'INELIGIBLE',
                  currentStage:  s.currentStage ?? '—',
                })),
              }}
            />
            <button className="btn-secondary" onClick={() => setRefreshKey(k => k + 1)} disabled={loadingDrives || filtering}>
              <RefreshCw size={15} style={(loadingDrives || filtering) ? { animation: 'spin 1s linear infinite' } : {}} />
              Refresh
            </button>
            <button className="btn-secondary" onClick={() => onNavigate?.('facultyDashboard')}>
              <ChevronLeft size={15} /> Dashboard
            </button>
          </div>
        </div>

        {/* ── Drive Selector ── */}
        <div className="df-selector-card fade-in">
          <div className="df-selector-inner">
            <div className="df-selector-label">
              <Briefcase size={18} color="#2563eb" />
              <span>Select Placement Drive</span>
            </div>
            <div className="df-selector-row">
              {loadingDrives ? (
                <div className="sk-box" style={{ height: 44, width: 360, borderRadius: 12 }} />
              ) : (
                <select
                  className="df-drive-select"
                  value={selectedDriveId}
                  onChange={e => {
                    setSelectedDriveId(e.target.value ? Number(e.target.value) : '');
                    setSearchStudent('');
                    setShowOnlyEligible(true);
                  }}
                >
                  <option value="">— Choose a drive —</option>
                  {drives.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.title} · {d.companyName} · ₹{d.ctcLpa} LPA [{d.status}]
                    </option>
                  ))}
                </select>
              )}

              {selectedDriveId && (
                <button
                  className="btn-primary"
                  onClick={() => runFilter(selectedDriveId as number)}
                  disabled={filtering}
                >
                  <Filter size={15} />
                  {filtering ? 'Filtering…' : 'Re-Filter'}
                </button>
              )}
            </div>

            {!loadingDrives && drives.length === 0 && (
              <div className="faculty-empty-state" style={{ padding: '32px 0 8px' }}>
                <Briefcase size={36} color="#94a3b8" />
                <h4>No Active Drives</h4>
                <p>There are no active placement drives right now</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Filtering skeleton ── */}
        {filtering && (
          <div className="df-loading-bar fade-in">
            <div className="df-loading-fill" />
            <span>Applying eligibility filters…</span>
          </div>
        )}

        {/* ── Results section ── */}
        {filterResult && selectedDrive && !filtering && (
          <>
            {/* KPI row */}
            <div className="df-kpi-row fade-in">
              <div className="df-kpi-card purple">
                <div className="df-kpi-icon"><Users size={20} /></div>
                <div className="df-kpi-body">
                  <span className="df-kpi-label">Total Verified</span>
                  <span className="df-kpi-value">{filterResult.totalVerified}</span>
                </div>
              </div>
              <div className="df-kpi-card green">
                <div className="df-kpi-icon"><CheckCircle size={20} /></div>
                <div className="df-kpi-body">
                  <span className="df-kpi-label">Eligible Students</span>
                  <span className="df-kpi-value">{eligibleCount}</span>
                </div>
              </div>
              <div className="df-kpi-card orange">
                <div className="df-kpi-icon"><TrendingUp size={20} /></div>
                <div className="df-kpi-body">
                  <span className="df-kpi-label">Eligibility Rate</span>
                  <span className="df-kpi-value">{eligibilityRate}%</span>
                </div>
              </div>
              <div className="df-kpi-card blue">
                <div className="df-kpi-icon"><Building2 size={20} /></div>
                <div className="df-kpi-body">
                  <span className="df-kpi-label">CTC Offered</span>
                  <span className="df-kpi-value">₹{selectedDrive.ctcLpa} LPA</span>
                </div>
              </div>
            </div>

            {/* Eligibility criteria panel (collapsible) */}
            <CriteriaCard
              drive={selectedDrive}
              collapsed={criteriaCollapsed}
              onToggle={() => setCriteriaCollapsed(c => !c)}
            />

            {/* Controls: search + toggle + sort */}
            <div className="df-controls fade-in">
              <div className="sv-search-box" style={{ flex: 1, maxWidth: 360 }}>
                <Filter size={14} color="#94a3b8" />
                <input
                  placeholder="Search student name, roll, dept…"
                  value={searchStudent}
                  onChange={e => setSearchStudent(e.target.value)}
                />
                {searchStudent && (
                  <button className="sv-search-clear" onClick={() => setSearchStudent('')}><X size={12} /></button>
                )}
              </div>

              <label className="df-toggle-label">
                <input
                  type="checkbox"
                  className="df-toggle-check"
                  checked={showOnlyEligible}
                  onChange={e => setShowOnlyEligible(e.target.checked)}
                />
                <span className="df-toggle-knob" />
                Show eligible only
              </label>

              <div className="df-sort-group">
                <span className="df-sort-label">Sort:</span>
                {(['cgpa', 'skillMatch', 'name'] as SortKey[]).map(k => (
                  <button
                    key={k}
                    className={`df-sort-btn ${sortKey === k ? 'active' : ''}`}
                    onClick={() => toggleSort(k)}
                  >
                    {{ cgpa: 'CGPA', skillMatch: 'Skills', name: 'Name' }[k]}
                    <SortIcon k={k} />
                  </button>
                ))}
              </div>

              <span className="sv-result-count">{displayStudents.length} shown</span>
            </div>

            {/* Table */}
            <div className="df-table-card fade-in" style={{ animationDelay: '0.15s' }}>
              {displayStudents.length === 0 ? (
                <div className="faculty-empty-state" style={{ padding: '60px 24px' }}>
                  <XCircle size={48} color="#ef4444" />
                  <h4>No Students Match</h4>
                  <p>Try toggling "eligible only" or clearing the search</p>
                </div>
              ) : (
                <div className="table-wrapper">
                  <table className="df-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Student</th>
                        <th>Dept.</th>
                        <th
                          className="df-th-sort"
                          onClick={() => toggleSort('cgpa')}
                        >
                          CGPA <SortIcon k="cgpa" />
                        </th>
                        <th>Arrears</th>
                        <th
                          className="df-th-sort"
                          onClick={() => toggleSort('skillMatch')}
                        >
                          Skill Match <SortIcon k="skillMatch" />
                        </th>
                        <th>Eligibility</th>
                        <th>Stage</th>
                        <th style={{ textAlign: 'center' }}>Advance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayStudents.map((s, idx) => (
                        <tr
                          key={s.id}
                          className={`df-row ${s.eligible ? 'df-row-eligible' : 'df-row-ineligible'}`}
                        >
                          <td className="df-row-num">{idx + 1}</td>
                          <td>
                            <div className="faculty-user-cell">
                              <div className={`faculty-avatar ${s.eligible ? 'verified' : ''}`}>
                                {(s.name || '?').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: 13 }}>
                                  {s.name}
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.rollNo}</div>
                              </div>
                            </div>
                          </td>
                          <td><span className="badge info">{s.department ?? s.batch ?? '—'}</span></td>
                          <td>
                            <span className={s.cgpa >= selectedDrive.eligibilityCriteria.minCgpa ? 'faculty-cgpa good' : 'faculty-cgpa low'}>
                              {s.cgpa.toFixed(2)}
                            </span>
                          </td>
                          <td>
                            <span className={s.standingArrears > selectedDrive.eligibilityCriteria.maxStandingArrears ? 'faculty-arrears bad' : 'faculty-arrears ok'}>
                              {s.standingArrears}
                            </span>
                          </td>
                          <td><SkillBar pct={s.skillMatch} /></td>
                          <td><EligiBadge eligible={s.eligible} /></td>
                          <td>
                            {s.currentStage
                              ? <span className={`badge ${stageCls[s.currentStage] ?? 'info'}`}>{s.currentStage}</span>
                              : <span className="badge" style={{ background: '#f1f5f9', color: '#64748b' }}>—</span>}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {s.currentStage && s.currentStage !== 'SELECTED' ? (
                              <select
                                className="stage-select"
                                value={s.currentStage}
                                onChange={e => updateStage(s.id, e.target.value)}
                              >
                                <option value="APPLIED">Applied</option>
                                <option value="ASSESSMENT">Assessment</option>
                                <option value="TECHNICAL">Technical</option>
                                <option value="HR">HR Round</option>
                              </select>
                            ) : (
                              <Star size={14} color={s.currentStage === 'SELECTED' ? '#f59e0b' : '#d1d5db'} />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* Placeholder when no drive selected */}
        {!selectedDriveId && !loadingDrives && drives.length > 0 && (
          <div className="df-placeholder fade-in">
            <div className="df-placeholder-icon">
              <Filter size={36} color="#2563eb" />
            </div>
            <h3>Select a Drive to Begin</h3>
            <p>Choose a placement drive from the dropdown above to automatically filter eligible verified students.</p>
          </div>
        )}

      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </FacultyLayout>
  );
}
