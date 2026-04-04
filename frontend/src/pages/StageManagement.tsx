import { useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft, RefreshCw, Briefcase, Search, Filter,
  CheckCircle2, AlertCircle, X, ArrowRight,
  Clock, BookOpen, Users, Star, Layers
} from 'lucide-react';
import '../styles/dashboard.css';
import { getJson, putJson, facultyUrl } from '../utils/api';
import FacultyLayout from '../components/FacultyLayout';
import { isFacultyEditableStage } from '../utils/stageOptions';
import StageDropdown from '../components/StageDropdown';

/* ══════════════════════════════
   TYPES — aligned with backend DTOs
══════════════════════════════ */
type Stage = 'ELIGIBLE' | 'APPLIED' | 'ASSESSMENT' | 'TECHNICAL' | 'HR' | 'SELECTED' | 'REJECTED';

/* FacultyApplicationDTO fields:
   id, studentId, studentName, rollNo, driveId,
   companyName, driveRole, stage, appliedAt, lastUpdatedAt */
type ApplicationRow = {
  id: number;
  studentId: number;
  studentName: string;     // ✅ FacultyApplicationDTO.studentName
  rollNo: string;          // ✅ FacultyApplicationDTO.rollNo
  department?: string;     // not in DTO — optional display-only
  driveId: number;
  driveRole: string;       // ✅ FacultyApplicationDTO.driveRole  (not driveTitle)
  companyName: string;     // ✅ FacultyApplicationDTO.companyName
  stage: Stage;            // ✅ FacultyApplicationDTO.stage (ApplicationStage enum)
  facultyApproved?: boolean;
  appliedAt: string;
  lastUpdatedAt: string;   // ✅ FacultyApplicationDTO.lastUpdatedAt
};

/* FacultyDriveDTO fields: id, companyName, title, role, ctcLpa, status */
type Drive = {
  id: number;
  title: string;           // ✅ FacultyDriveDTO.title  (not jobTitle)
  companyName: string;
  role?: string;
  ctcLpa?: number;
  status: string;
};

/* ══════════════════════════════
   CONSTANTS
══════════════════════════════ */
const STAGE_ORDER: Stage[] = ['ELIGIBLE', 'APPLIED', 'ASSESSMENT', 'TECHNICAL', 'HR', 'SELECTED', 'REJECTED'];

const STAGE_META: Record<Stage, { label: string; cls: string; icon: JSX.Element; color: string }> = {
  ELIGIBLE:   { label: 'Eligible',   cls: 'success', icon: <CheckCircle2 size={11} />, color: '#10b981' },
  APPLIED:    { label: 'Applied',    cls: 'info',    icon: <BookOpen size={11} />,      color: '#3b82f6' },
  ASSESSMENT: { label: 'Assessment', cls: 'warning', icon: <Clock size={11} />,     color: '#f59e0b' },
  TECHNICAL:  { label: 'Technical',  cls: 'warning', icon: <Layers size={11} />,    color: '#8b5cf6' },
  HR:         { label: 'HR Round',   cls: 'warning', icon: <Users size={11} />,     color: '#06b6d4' },
  SELECTED:   { label: 'Selected',   cls: 'success', icon: <Star size={11} />,      color: '#10b981' },
  REJECTED:   { label: 'Rejected',   cls: 'danger',  icon: <AlertCircle size={11} />, color: '#ef4444' },
};

/* ══════════════════════════════
   HELPERS
══════════════════════════════ */
function stageIndex(s: Stage) { return STAGE_ORDER.indexOf(s); }

function coerceStage(value: unknown): Stage {
  const s = (typeof value === 'string' ? value : '').toUpperCase();
  if (s === 'ELIGIBLE' || s === 'APPLIED' || s === 'ASSESSMENT' || s === 'TECHNICAL' || s === 'HR' || s === 'SELECTED' || s === 'REJECTED') {
    return s;
  }
  return 'ELIGIBLE';
}

/* ── Stage Badge ── */
function StageBadge({ stage }: { stage: Stage }) {
  const m = STAGE_META[stage];
  return (
    <span className={`badge ${m.cls} sm-stage-badge`}>{m.icon} {m.label}</span>
  );
}

/* ── Stage Progress Track ── */
function StageTrack({ current }: { current: Stage }) {
  const idx = stageIndex(current);
  return (
    <div className="sm-track">
      {STAGE_ORDER.map((s, i) => (
        <div key={s} className="sm-track-step">
          <div className={`sm-track-dot ${i < idx ? 'done' : i === idx ? 'active' : 'future'}`} title={STAGE_META[s].label} />
          {i < STAGE_ORDER.length - 1 && (
            <div className={`sm-track-line ${i < idx ? 'done' : ''}`} />
          )}
        </div>
      ))}
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

/* ── Confirm Dialog ── */
function ConfirmStage({ studentName, from, to, onConfirm, onCancel, loading }: {
  studentName: string; from: Stage; to: Stage;
  onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
  return (
    <div className="sv-confirm-overlay" onClick={onCancel}>
      <div className="sv-confirm-dialog" onClick={e => e.stopPropagation()}>
        <div className="sv-confirm-icon approve"><ArrowRight size={28} /></div>
        <h3 className="sv-confirm-title">Advance Stage?</h3>
        <p className="sv-confirm-sub">
          Move <strong>{studentName}</strong> from{' '}
          <span className="sm-inline-badge" style={{ background: STAGE_META[from].color }}>{STAGE_META[from].label}</span>
          {' '}→{' '}
          <span className="sm-inline-badge" style={{ background: STAGE_META[to].color }}>{STAGE_META[to].label}</span>?
          <br /><small style={{ color: 'var(--text-muted)' }}>This action cannot be reversed.</small>
        </p>
        <div className="sv-confirm-actions">
          <button className="btn-secondary" onClick={onCancel} disabled={loading}>Cancel</button>
          <button className="btn-primary" onClick={onConfirm} disabled={loading}>
            {loading ? 'Updating…' : 'Yes, Advance'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════
   MAIN PAGE
══════════════════════════════ */
export default function StageManagement({ onNavigate }: { onNavigate?: (view: any) => void }) {
  const [loadingDrives, setLoadingDrives]   = useState(true);
  const [loadingApps, setLoadingApps]       = useState(false);
  const [drives, setDrives]                 = useState<Drive[]>([]);
  const [applications, setApplications]     = useState<ApplicationRow[]>([]);
  const [selectedDriveId, setSelectedDriveId] = useState<number | ''>('');
  const [stageFilter, setStageFilter]       = useState<Stage | 'ALL'>('ALL');
  const [search, setSearch]                 = useState('');
  const [toast, setToast]                   = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [refreshKey, setRefreshKey]         = useState(0);
  const [updating, setUpdating]             = useState<number | null>(null);
  const [pendingUpdate, setPendingUpdate]   = useState<{
    studentId: number; driveId: number; studentName: string; from: Stage; to: Stage;
  } | null>(null);

  /* ── Load drives ──
     ✅ GET /api/faculty/drives?statuses=ONGOING&facultyEmail=
     Falls back to all drives if ONGOING returns empty */
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoadingDrives(true);
        const res = await getJson<Drive[]>(
          facultyUrl('/api/faculty/drives', { statuses: 'ONGOING' })
        );
        if (!active) return;
        const data = res.data || [];
        // If no ongoing drives, load all drives so UI isn't empty
        if (data.length === 0) {
          const allRes = await getJson<Drive[]>(facultyUrl('/api/faculty/drives'));
          if (active) setDrives(allRes.data || []);
        } else {
          setDrives(data);
        }
      } catch (e: any) {
        if (active) setToast({ msg: e.message || 'Failed to load drives', type: 'error' });
      } finally {
        if (active) setLoadingDrives(false);
      }
    })();
    return () => { active = false; };
  }, [refreshKey]);

  /* ── Load applications when drive changes ──
     ✅ GET /api/faculty/drives/{driveId}/participants?facultyEmail= */
  useEffect(() => {
    if (!selectedDriveId) { setApplications([]); return; }
    let active = true;
    (async () => {
      try {
        setLoadingApps(true);
        const res = await getJson<ApplicationRow[]>(
          facultyUrl(`/api/faculty/drives/${selectedDriveId}/participants`)
        );
        if (active) {
          const normalized = (res.data || []).map((row: any) => ({
            ...row,
            stage: coerceStage(row?.stage),
          }));
          setApplications(normalized);
        }
      } catch (e: any) {
        if (active) setToast({ msg: e.message || 'Failed to load applications', type: 'error' });
      } finally {
        if (active) setLoadingApps(false);
      }
    })();
    return () => { active = false; };
  }, [selectedDriveId, refreshKey]);

  useEffect(() => {
    if (!selectedDriveId) return;
    const timer = setInterval(() => setRefreshKey(k => k + 1), 600000);
    return () => clearInterval(timer);
  }, [selectedDriveId]);

  /* ── Filtered + searched rows ── */
  const displayed = useMemo(() => {
    let list = applications;
    // ✅ FacultyApplicationDTO uses .stage (not .currentStage)
    if (stageFilter !== 'ALL') list = list.filter(a => a.stage === stageFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(a =>
        (a.studentName ?? '').toLowerCase().includes(q) ||
        (a.rollNo ?? '').toLowerCase().includes(q) ||                   // ✅ rollNo
        (a.department ?? '').toLowerCase().includes(q) ||
        (a.driveRole ?? '').toLowerCase().includes(q)                   // ✅ driveRole
      );
    }
    return list;
  }, [applications, stageFilter, search]);

  /* ── Stage counts (keyed on .stage) ── */
  const stageCounts = useMemo(() => {
    const c: Record<string, number> = { ALL: applications.length };
    STAGE_ORDER.forEach(s => { c[s] = applications.filter(a => a.stage === s).length; });
    return c;
  }, [applications]);

  /* ── Request stage change ── */
  const requestStageChange = (app: ApplicationRow, newStage: Stage) => {
    setPendingUpdate({
      studentId: app.studentId,
      driveId: app.driveId,
      studentName: app.studentName,
      from: app.stage,
      to: newStage,
    });
  };

  /* ── Confirm & submit ──
      ✅ PUT /api/stage/update?email=
     ✅ body: { studentId, driveId, stage } */
  const confirmStageChange = async () => {
    if (!pendingUpdate) return;
    const { studentId, driveId, to } = pendingUpdate;
    try {
      setUpdating(studentId);
      await putJson(
        facultyUrl('/api/stage/update'),
        { studentId, driveId, stage: to }
      );
      setApplications(prev =>
        prev.map(a => (a.studentId === studentId && a.driveId === driveId)
          ? { ...a, stage: to, lastUpdatedAt: new Date().toISOString() }
          : a
        )
      );
      setToast({ msg: `Stage advanced to ${STAGE_META[to].label}!`, type: 'success' });
    } catch (e: any) {
      setToast({ msg: e.message || 'Failed to update stage', type: 'error' });
    } finally {
      setUpdating(null);
      setPendingUpdate(null);
    }
  };

  const selectedDrive = drives.find(d => d.id === selectedDriveId);

  const stageTabs: { key: Stage | 'ALL'; label: string; color: string }[] = [
    { key: 'ALL',        label: 'All',        color: '#6366f1' },
    { key: 'ELIGIBLE',   label: 'Eligible',   color: '#10b981' },
    { key: 'APPLIED',    label: 'Applied',    color: '#3b82f6' },
    { key: 'ASSESSMENT', label: 'Assessment', color: '#f59e0b' },
    { key: 'TECHNICAL',  label: 'Technical',  color: '#8b5cf6' },
    { key: 'HR',         label: 'HR Round',   color: '#06b6d4' },
    { key: 'SELECTED',   label: 'Selected',   color: '#10b981' },
    { key: 'REJECTED',   label: 'Rejected',   color: '#ef4444' },
  ];

  /* ══ RENDER ══ */
  return (
    <FacultyLayout activeNav="stages" onNavigate={onNavigate}>
      <div className="content">

        {/* ── Page Header ── */}
        <div className="sm-page-header fade-in">
          <div>
            <h1 className="page-title">Application Stage Management</h1>
            <p className="page-subtitle">Advance department students through placement drive stages — forward-only</p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn-secondary" onClick={() => setRefreshKey(k => k + 1)} disabled={loadingDrives || loadingApps}>
              <RefreshCw size={15} style={(loadingDrives || loadingApps) ? { animation: 'spin 1s linear infinite' } : {}} />
              Refresh
            </button>
            <button className="btn-secondary" onClick={() => onNavigate?.('facultyDashboard')}>
              <ChevronLeft size={15} /> Dashboard
            </button>
          </div>
        </div>

        {/* ── Drive Selector ── */}
        <div className="sm-selector-card fade-in">
          <div className="sm-selector-label">
            <Briefcase size={17} color="#2563eb" />
            <span>Select Placement Drive</span>
          </div>
          <div className="sm-selector-row">
            {loadingDrives ? (
              <div className="sk-box" style={{ height: 44, width: 400, borderRadius: 12 }} />
            ) : (
              <select
                className="df-drive-select"
                value={selectedDriveId}
                onChange={e => {
                  setSelectedDriveId(e.target.value ? Number(e.target.value) : '');
                  setStageFilter('ALL');
                  setSearch('');
                }}
              >
                <option value="">— Choose a drive —</option>
                {drives.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.title} · {d.companyName}{d.ctcLpa ? ` · ₹${d.ctcLpa} LPA` : ''} [{d.status}]
                  </option>
                ))}
              </select>
            )}
            {selectedDrive && (
              <div className="sm-drive-badge">
                <span className={`badge ${selectedDrive.status === 'ONGOING' ? 'success' : 'info'}`}>
                  {selectedDrive.status}
                </span>
                <span className="sm-drive-company">{selectedDrive.companyName}</span>
              </div>
            )}
          </div>
          {!loadingDrives && drives.length === 0 && (
            <div className="faculty-empty-state" style={{ padding: '28px 0 4px' }}>
              <Briefcase size={32} color="#94a3b8" />
              <h4>No Drives Found</h4>
              <p>No placement drives are currently available</p>
            </div>
          )}
        </div>

        {/* ── Results ── */}
        {selectedDriveId && (
          <>
            {/* Stage summary chips */}
            {!loadingApps && (
              <div className="sm-summary-row fade-in">
                {STAGE_ORDER.map(s => {
                  const cnt = stageCounts[s] ?? 0;
                  const m   = STAGE_META[s];
                  return (
                    <div key={s} className="sm-summary-chip" style={{ borderColor: m.color }}>
                      <span className="sm-summary-icon" style={{ background: m.color }}>{m.icon}</span>
                      <div className="sm-summary-body">
                        <span className="sm-summary-label">{m.label}</span>
                        <span className="sm-summary-count">{cnt}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Filter bar */}
            <div className="sm-filter-card fade-in">
              <div className="sv-tabs" style={{ flexWrap: 'wrap' }}>
                {stageTabs.map(t => (
                  <button key={t.key}
                    className={`sv-tab ${stageFilter === t.key ? 'active' : ''}`}
                    style={stageFilter === t.key ? { borderColor: t.color, color: t.color } : {}}
                    onClick={() => setStageFilter(t.key)}>
                    {t.label}
                    <span className="sv-tab-count"
                      style={stageFilter === t.key ? { background: t.color, color: '#fff' } : {}}>
                      {stageCounts[t.key] ?? 0}
                    </span>
                  </button>
                ))}
              </div>
              <div className="sv-search-row">
                <div className="sv-search-box">
                  <Search size={15} color="#94a3b8" />
                  <input
                    placeholder="Search by name, roll number, role…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                  {search && (
                    <button className="sv-search-clear" onClick={() => setSearch('')}><X size={13} /></button>
                  )}
                </div>
                <span className="sv-result-count">
                  {loadingApps ? '…' : `${displayed.length} student${displayed.length !== 1 ? 's' : ''}`}
                </span>
              </div>
            </div>

            {/* Table */}
            <div className="sm-table-card fade-in" style={{ animationDelay: '0.1s' }}>
              {loadingApps ? (
                <div style={{ padding: '8px 0' }}>
                  {[...Array(7)].map((_, i) => (
                    <div key={i} className="sk-table-row">
                      {[14, 20, 14, 16, 14, 12, 10].map((w, j) => (
                        <div key={j} className="sk-box sk-text-sm" style={{ width: `${w}%` }} />
                      ))}
                    </div>
                  ))}
                </div>
              ) : displayed.length === 0 ? (
                <div className="faculty-empty-state" style={{ padding: '56px 24px' }}>
                  <Filter size={44} color="#94a3b8" />
                  <h4>No Applications Found</h4>
                  <p>Try changing the stage filter or clearing your search</p>
                </div>
              ) : (
                <div className="table-wrapper">
                  <table className="sm-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Student</th>
                        <th>Role Applied</th>
                        <th>Current Stage</th>
                        <th>Progress</th>
                        <th>Last Updated</th>
                        <th style={{ minWidth: 180 }}>Advance Stage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayed.map((app, idx) => {
                        const isUpdating  = updating === app.studentId;
                        const isSelected  = app.stage === 'SELECTED';
                        const isRejected  = app.stage === 'REJECTED';
                        const canEditStage = Boolean(app.facultyApproved) && !isSelected && !isRejected;
                        return (
                          <tr key={app.id} className={`sm-row ${isSelected ? 'sm-row-selected' : ''}`}>
                            <td className="sm-row-num">{idx + 1}</td>

                            {/* Student */}
                            <td>
                              <div className="faculty-user-cell">
                                <div className={`faculty-avatar ${isSelected ? 'verified' : ''}`}>
                                  {(app.studentName || '?').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 600, fontSize: 13 }}>{app.studentName}</div>
                                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{app.rollNo}</div>
                                </div>
                              </div>
                            </td>

                            {/* Drive role + company */}
                            <td>
                              <div style={{ fontSize: 13, fontWeight: 600 }}>{app.driveRole}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{app.companyName}</div>
                            </td>

                            {/* Current stage — using .stage */}
                            <td><StageBadge stage={app.stage} /></td>

                            {/* Progress track */}
                            <td><StageTrack current={app.stage} /></td>

                            {/* Last updated — using .lastUpdatedAt */}
                            <td style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                              {app.lastUpdatedAt
                                ? new Date(app.lastUpdatedAt).toLocaleDateString('en-IN', {
                                    day: '2-digit', month: 'short', year: 'numeric'
                                  })
                                : new Date(app.appliedAt).toLocaleDateString('en-IN', {
                                    day: '2-digit', month: 'short', year: 'numeric'
                                  })
                              }
                            </td>

                            {/* Advance dropdown */}
                            <td>
                              {isSelected ? (
                                <span className="sm-terminal-badge">
                                  <Star size={13} color="#f59e0b" /> Placement Confirmed
                                </span>
                              ) : isRejected ? (
                                <span className="sm-terminal-badge" style={{ background: '#fee2e2', color: '#b91c1c', borderColor: '#fecaca' }}>
                                  <AlertCircle size={13} color="#ef4444" /> Rejected
                                </span>
                              ) : (
                                <div className="sm-advance-wrap sm-advance-wrap-full">
                                  <StageDropdown
                                    value={app.stage}
                                    disableSelected
                                    disabled={!canEditStage || isUpdating}
                                    className="sm-stage-select-unified"
                                    onChange={(next) => {
                                      const target = next as Stage;
                                      if (!isFacultyEditableStage(target)) {
                                        setToast({ msg: 'Faculty can update stages only up to HR.', type: 'error' });
                                        return;
                                      }
                                      if (target === app.stage || (app.stage === 'APPLIED' && target === 'ELIGIBLE')) return;
                                      requestStageChange(app, target);
                                    }}
                                  />
                                  {isUpdating && <div className="sm-spinner" />}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* Placeholder */}
        {!selectedDriveId && !loadingDrives && drives.length > 0 && (
          <div className="df-placeholder fade-in">
            <div className="df-placeholder-icon"><Layers size={34} color="#2563eb" /></div>
            <h3>Select a Drive to Begin</h3>
            <p>Choose a placement drive above to manage stage progression for your department students.</p>
          </div>
        )}

      </div>

      {/* Confirm dialog */}
      {pendingUpdate && (
        <ConfirmStage
          studentName={pendingUpdate.studentName}
          from={pendingUpdate.from}
          to={pendingUpdate.to}
          onConfirm={confirmStageChange}
          onCancel={() => setPendingUpdate(null)}
          loading={updating !== null}
        />
      )}

      {/* Toast */}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </FacultyLayout>
  );
}
