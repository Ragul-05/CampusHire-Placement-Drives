import { useEffect, useMemo, useState } from 'react';
import {
  RefreshCw, ChevronLeft, Building2, Briefcase, Users, CheckCircle,
  Clock, XCircle, AlertCircle, CheckCircle2, X, Eye, Award, Search, Filter
} from 'lucide-react';
import '../styles/dashboard.css';
import { getJson, postJson, putJson, facultyUrl } from '../utils/api';
import FacultyLayout from '../components/FacultyLayout';
import ExportButton from '../components/ExportButton';

type Drive = {
  id: number;
  title: string;
  companyName: string;
  role: string;
  ctcLpa: number;
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED';
  applicationDeadline?: string | null;
  totalDepartmentApplicants: number;
  selectedDepartmentApplicants: number;
  stageCounts: Record<string, number>;
};

type Participant = {
  id: number;
  studentId: number;
  studentName: string;
  rollNo: string;
  cgpa: number;
  stage: 'ELIGIBLE' | 'ASSESSMENT' | 'TECHNICAL' | 'HR' | 'SELECTED';
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  isEligibleForPlacements: boolean;
  facultyApproved: boolean;
  submittedToAdmin?: boolean;
  offerRole?: string | null;
  offerCtc?: number | null;
};

const FACULTY_STAGE_OPTIONS = ['ELIGIBLE', 'ASSESSMENT', 'TECHNICAL', 'HR'] as const;

type StatusKey = 'ALL' | 'UPCOMING' | 'ONGOING' | 'COMPLETED';

const STATUS_META: Record<Drive['status'], { cls: string; icon: JSX.Element; color: string }> = {
  UPCOMING: { cls: 'info', icon: <Clock size={11} />, color: '#3b82f6' },
  ONGOING: { cls: 'success', icon: <CheckCircle size={11} />, color: '#10b981' },
  COMPLETED: { cls: 'warning', icon: <XCircle size={11} />, color: '#94a3b8' },
};

const STAGE_COLORS: Record<string, string> = {
  ELIGIBLE: '#16a34a',
  ASSESSMENT: '#f59e0b',
  TECHNICAL: '#8b5cf6',
  HR: '#06b6d4',
  SELECTED: '#10b981',
};

function normaliseDrive(raw: any): Drive {
  return {
    id: raw.id ?? 0,
    title: raw.title ?? raw.jobTitle ?? raw.driveName ?? 'Unnamed Drive',
    companyName: raw.companyName ?? raw.company ?? '—',
    role: raw.role ?? '—',
    ctcLpa: raw.ctcLpa ?? raw.ctc ?? 0,
    status: (raw.status ?? 'UPCOMING').toString().toUpperCase(),
    applicationDeadline: raw.applicationDeadline ?? null,
    totalDepartmentApplicants: raw.totalDepartmentApplicants ?? raw.applicants ?? 0,
    selectedDepartmentApplicants: raw.selectedDepartmentApplicants ?? raw.selected ?? 0,
    stageCounts: raw.stageCounts ?? {},
  };
}

function formatDate(value?: string | null) {
  if (!value) return 'No deadline';
  try {
    return new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return value;
  }
}

function Toast({ msg, type, onClose }: { msg: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`sv-toast sv-toast-${type}`}>
      {type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
      <span>{msg}</span>
      <button className="sv-toast-close" onClick={onClose}><X size={14} /></button>
    </div>
  );
}

function DriveStudentsModal({
  drive,
  onClose,
  onSubmitted,
}: {
  drive: Drive;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [students, setStudents] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [updatingStudentId, setUpdatingStudentId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const res = await getJson<Participant[]>(facultyUrl(`/api/faculty/drive/${drive.id}/applications`));
        if (!active) return;
        setStudents(res.data || []);
      } catch (e: any) {
        if (active) setError(e.message || 'Failed to load drive students');
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => { active = false; };
  }, [drive.id]);

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students.filter((student) => {
      if (!q) return true;
      return student.studentName.toLowerCase().includes(q) || student.rollNo.toLowerCase().includes(q);
    });
  }, [students, search]);

  async function handleSubmit() {
    try {
      setSubmitting(true);
      await postJson<number>(facultyUrl(`/api/faculty/drives/${drive.id}/submit-drive`), {});
      onSubmitted();
    } catch (e: any) {
      setError(e.message || 'Failed to submit drive to Placement HQ');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStageChange(studentId: number, stage: string) {
    try {
      setUpdatingStudentId(studentId);
      await putJson(facultyUrl('/api/stage/update'), { studentId, driveId: drive.id, stage });
      setStudents((current) =>
        current.map((student) =>
          student.studentId === studentId ? { ...student, stage: stage as Participant['stage'] } : student
        )
      );
    } catch (e: any) {
      setError(e.message || 'Failed to update student stage');
    } finally {
      setUpdatingStudentId(null);
    }
  }

  return (
    <div className="sv-modal-overlay" onClick={onClose}>
      <div className="sv-modal dd-eligible-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 900 }}>
        <div className="sv-modal-header">
          <div className="sv-modal-title-block">
            <div className="dd-modal-drive-icon"><Building2 size={20} color="#2563eb" /></div>
            <div>
              <h3 className="sv-modal-name">{drive.title}</h3>
              <p className="sv-modal-meta">{drive.companyName} · {drive.role} · ₹{drive.ctcLpa} LPA</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className={`badge ${STATUS_META[drive.status].cls}`}>
              {STATUS_META[drive.status].icon} {drive.status}
            </span>
            <button className="sv-modal-close" onClick={onClose}><X size={18} /></button>
          </div>
        </div>

        <div style={{ padding: '12px 24px 0' }}>
          <div className="sv-search-box">
            <Search size={14} color="#94a3b8" />
            <input
              placeholder="Search by name or roll number…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && <button className="sv-search-clear" onClick={() => setSearch('')}><X size={12} /></button>}
          </div>
        </div>

        <div className="sv-modal-body" style={{ padding: '16px 24px 0', maxHeight: '60vh', overflowY: 'auto' }}>
          {error && (
            <div className="faculty-alert-banner"><AlertCircle size={16} /><span>{error}</span></div>
          )}
          {loading ? (
            <div style={{ padding: '8px 0' }}>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="sk-table-row">
                  {[12, 22, 10, 10, 12, 12, 18].map((w, j) => (
                    <div key={j} className="sk-box sk-text-sm" style={{ width: `${w}%` }} />
                  ))}
                </div>
              ))}
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="faculty-empty-state" style={{ padding: '40px 0' }}>
              <Users size={40} color="#94a3b8" />
              <h4>No Students Found</h4>
              <p>No student applications match the current search</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="dd-modal-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Student</th>
                    <th>CGPA</th>
                    <th>Stage</th>
                    <th>Eligibility</th>
                    <th>Faculty Approval</th>
                    <th>Offer</th>
                    <th>Advance</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student, idx) => (
                    <tr key={student.id}>
                      <td className="sm-row-num">{idx + 1}</td>
                      <td>
                        <div className="faculty-user-cell">
                          <div className="faculty-avatar verified">{(student.studentName || '?').charAt(0).toUpperCase()}</div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{student.studentName}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{student.rollNo}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={student.cgpa >= 7 ? 'faculty-cgpa good' : 'faculty-cgpa low'}>
                          {student.cgpa?.toFixed(2) ?? '—'}
                        </span>
                      </td>
                      <td>
                        <span className="badge" style={{
                          background: `${STAGE_COLORS[student.stage]}18`,
                          color: STAGE_COLORS[student.stage],
                          border: `1px solid ${STAGE_COLORS[student.stage]}30`,
                        }}>
                          {student.stage}
                        </span>
                      </td>
                      <td>
                        <span className="badge" style={{
                          background: student.isEligibleForPlacements ? '#dcfce7' : '#fee2e2',
                          color: student.isEligibleForPlacements ? '#15803d' : '#b91c1c',
                          border: `1px solid ${student.isEligibleForPlacements ? '#86efac' : '#fca5a5'}`,
                        }}>
                          {student.isEligibleForPlacements ? 'Eligible' : 'Ineligible'}
                        </span>
                      </td>
                      <td>
                        <span className="badge" style={{
                          background: student.facultyApproved ? '#dbeafe' : '#f8fafc',
                          color: student.facultyApproved ? '#1d4ed8' : '#64748b',
                          border: `1px solid ${student.facultyApproved ? '#93c5fd' : '#cbd5e1'}`,
                        }}>
                          {student.facultyApproved ? (student.submittedToAdmin ? 'Submitted' : 'Approved') : 'Pending'}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>
                        {student.offerRole && student.offerCtc != null ? `${student.offerRole} · ₹${student.offerCtc} LPA` : '—'}
                      </td>
                      <td>
                        {student.stage === 'SELECTED' ? (
                          <span className="badge success">Selected</span>
                        ) : (
                          <select
                            className="stage-select"
                            value={student.stage}
                            disabled={!student.facultyApproved || updatingStudentId === student.studentId}
                            onChange={(e) => handleStageChange(student.studentId, e.target.value)}
                          >
                            {FACULTY_STAGE_OPTIONS.map((option) => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="sv-modal-footer" style={{ justifyContent: 'space-between' }}>
          <span className="sv-result-count">
            {loading ? '…' : `${filteredStudents.length} student${filteredStudents.length !== 1 ? 's' : ''}`}
          </span>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn-secondary" onClick={onClose}>Close</button>
            <button className="btn-primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit to Placement HQ'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StageMiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div style={{
      padding: '8px 10px',
      borderRadius: 10,
      background: '#f8fafc',
      border: '1px solid #e2e8f0',
      minWidth: 70,
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginTop: 2 }}>{value}</div>
    </div>
  );
}

function DriveCard({ drive, onViewStudents }: { drive: Drive; onViewStudents: (d: Drive) => void }) {
  const meta = STATUS_META[drive.status];
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
        <div style={{ marginTop: 8, fontSize: 12, color: '#64748b', fontWeight: 600 }}>
          Apply before: {formatDate(drive.applicationDeadline)}
        </div>
      </div>

      <div className="dd-stats-row">
        <div className="dd-stat">
          <Users size={14} color="#6366f1" />
          <div className="dd-stat-body">
            <span className="dd-stat-label">Applied</span>
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
        <div className="dd-stat">
          <Building2 size={14} color="#10b981" />
          <div className="dd-stat-body">
            <span className="dd-stat-label">CTC</span>
            <span className="dd-stat-value ctc">₹{drive.ctcLpa ?? '—'} LPA</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 8, marginBottom: 14 }}>
        <StageMiniStat label="Eligible" value={drive.stageCounts?.ELIGIBLE ?? 0} />
        <StageMiniStat label="Assess" value={drive.stageCounts?.ASSESSMENT ?? 0} />
        <StageMiniStat label="Tech" value={drive.stageCounts?.TECHNICAL ?? 0} />
        <StageMiniStat label="HR" value={drive.stageCounts?.HR ?? 0} />
        <StageMiniStat label="Selected" value={drive.stageCounts?.SELECTED ?? 0} />
      </div>

      <button className="dd-eligible-btn" onClick={() => onViewStudents(drive)}>
        <Eye size={14} /> View Students
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

export default function DepartmentDrives({ onNavigate }: { onNavigate?: (view: string) => void }) {
  const [loading, setLoading] = useState(true);
  const [drives, setDrives] = useState<Drive[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusKey>('ALL');
  const [search, setSearch] = useState('');
  const [selectedDrive, setSelectedDrive] = useState<Drive | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const primary = await getJson<any[]>(facultyUrl('/api/faculty/drives'));
        if (!active) return;
        setDrives((primary.data || []).map(normaliseDrive));
      } catch (e: any) {
        if (!active) return;
        try {
          const fallback = await getJson<any[]>('/api/admin/drives');
          if (!active) return;
          setDrives((fallback.data || []).map(normaliseDrive));
        } catch {
          setDrives([]);
          setToast({ msg: e.message || 'Failed to load department drives', type: 'error' });
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => { active = false; };
  }, [refreshKey]);

  const displayed = useMemo(() => {
    let list = drives;
    if (statusFilter !== 'ALL') list = list.filter((drive) => drive.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((drive) =>
        drive.title.toLowerCase().includes(q) ||
        drive.companyName.toLowerCase().includes(q) ||
        drive.role.toLowerCase().includes(q)
      );
    }
    return list;
  }, [drives, statusFilter, search]);

  const counts: Record<StatusKey, number> = {
    ALL: drives.length,
    UPCOMING: drives.filter((drive) => drive.status === 'UPCOMING').length,
    ONGOING: drives.filter((drive) => drive.status === 'ONGOING').length,
    COMPLETED: drives.filter((drive) => drive.status === 'COMPLETED').length,
  };

  const tabs: { key: StatusKey; label: string; color: string }[] = [
    { key: 'ALL', label: 'All Drives', color: '#6366f1' },
    { key: 'ONGOING', label: 'Ongoing', color: '#10b981' },
    { key: 'UPCOMING', label: 'Upcoming', color: '#3b82f6' },
    { key: 'COMPLETED', label: 'Completed', color: '#94a3b8' },
  ];

  return (
    <FacultyLayout activeNav="drives" onNavigate={onNavigate}>
      <div className="content">
        <div className="dd-page-header fade-in">
          <div>
            <h1 className="page-title">Department Drives</h1>
            <p className="page-subtitle">Track drive cards, stage-wise counts, and submitted student lists</p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <ExportButton
              disabled={drives.length === 0}
              opts={{
                title: 'Department Drives Report',
                subtitle: `Total drives: ${drives.length} · Generated by Faculty Portal`,
                filename: 'department-drives',
                columns: [
                  { header: '#', key: '_idx' },
                  { header: 'Drive Title', key: 'title' },
                  { header: 'Company', key: 'companyName' },
                  { header: 'Role', key: 'role' },
                  { header: 'CTC (LPA)', key: 'ctcLpa' },
                  { header: 'Status', key: 'status' },
                  { header: 'Applied', key: 'totalDepartmentApplicants' },
                  { header: 'Selected', key: 'selectedDepartmentApplicants' },
                ],
                rows: drives.map((drive, index) => ({
                  _idx: index + 1,
                  title: drive.title,
                  companyName: drive.companyName,
                  role: drive.role,
                  ctcLpa: drive.ctcLpa,
                  status: drive.status,
                  totalDepartmentApplicants: drive.totalDepartmentApplicants,
                  selectedDepartmentApplicants: drive.selectedDepartmentApplicants,
                })),
              }}
            />
            <button className="btn-secondary" onClick={() => setRefreshKey((current) => current + 1)} disabled={loading}>
              <RefreshCw size={15} style={loading ? { animation: 'spin 1s linear infinite' } : {}} />
              Refresh
            </button>
            <button className="btn-secondary" onClick={() => onNavigate?.('facultyDashboard')}>
              <ChevronLeft size={15} /> Dashboard
            </button>
          </div>
        </div>

        <div className="sv-filter-card fade-in">
          <div className="sv-tabs">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                className={`sv-tab ${statusFilter === tab.key ? 'active' : ''}`}
                style={statusFilter === tab.key ? { borderColor: tab.color, color: tab.color } : {}}
                onClick={() => setStatusFilter(tab.key)}
              >
                {tab.label}
                <span
                  className="sv-tab-count"
                  style={statusFilter === tab.key ? { background: tab.color, color: '#fff' } : {}}
                >
                  {counts[tab.key]}
                </span>
              </button>
            ))}
          </div>
          <div className="sv-search-row">
            <div className="sv-search-box">
              <Search size={15} color="#94a3b8" />
              <input
                placeholder="Search by title, company, or role…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && <button className="sv-search-clear" onClick={() => setSearch('')}><X size={13} /></button>}
            </div>
            <span className="sv-result-count">
              {loading ? '…' : `${displayed.length} drive${displayed.length !== 1 ? 's' : ''}`}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="dd-grid">
            {[...Array(6)].map((_, index) => <DriveCardSkeleton key={index} />)}
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
              </>
            )}
          </div>
        ) : (
          <div className="dd-grid fade-in">
            {displayed.map((drive) => (
              <DriveCard key={drive.id} drive={drive} onViewStudents={setSelectedDrive} />
            ))}
          </div>
        )}
      </div>

      {selectedDrive && (
        <DriveStudentsModal
          drive={selectedDrive}
          onClose={() => setSelectedDrive(null)}
          onSubmitted={() => {
            setToast({ msg: 'Drive submitted to Placement HQ', type: 'success' });
            setSelectedDrive(null);
            setRefreshKey((current) => current + 1);
          }}
        />
      )}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </FacultyLayout>
  );
}
