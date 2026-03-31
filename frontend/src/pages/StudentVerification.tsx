import { useEffect, useRef, useState } from 'react';
import {
  Search, CheckCircle, XCircle, Eye, Clock, User, Mail, Phone,
  BookOpen, Award, Briefcase, FileText, AlertCircle, ChevronLeft,
  CheckCircle2, RefreshCw, GraduationCap, Link as LinkIcon, X
} from 'lucide-react';
import '../styles/dashboard.css';
import { getJson, postJson } from '../utils/api';
import FacultyLayout from '../components/FacultyLayout';

/* ════════════════ TYPES — aligned with FacultyStudentDTO ════════════════ */
type StudentProfile = {
  id: number;
  rollNo: string;            // backend field name
  name: string;              // backend: single name field
  email: string;
  batch?: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  isEligibleForPlacements: boolean;
  isLocked?: boolean;
  cgpa: number;
  standingArrears: number;
  historyOfArrears: number;
  skills?: string[];
  // extended fields (from /api/faculty/students/{id})
  phoneNumber?: string;
  department?: string;
  graduationYear?: number;
  profileCompletionPercentage?: number;
  linkedinUrl?: string;
  githubUrl?: string;
  xMarksPercentage?: number;
  xiiMarksPercentage?: number;
  latestVerificationRemarks?: string;
  personalDetails?: { dateOfBirth: string; gender: string; address: string };
  academicRecords?: Array<{ degree: string; institution: string; percentage: number; yearOfCompletion: number }>;
  certifications?: Array<{ name: string; issuingOrganization: string; issueDate: string }>;
};

type StatusFilter = 'ALL' | 'PENDING' | 'VERIFIED' | 'REJECTED';
type ActionType   = 'VERIFIED' | 'REJECTED';

/* ════════ HELPERS ════════ */
function StatusBadge({ status }: { status: StudentProfile['verificationStatus'] }) {
  const cfg = {
    PENDING:  { cls: 'warning', icon: <Clock size={11} />,       label: 'Pending'  },
    VERIFIED: { cls: 'success', icon: <CheckCircle size={11} />, label: 'Verified' },
    REJECTED: { cls: 'danger',  icon: <XCircle size={11} />,     label: 'Rejected' },
  } as const;
  const { cls, icon, label } = cfg[status];
  return <span className={`badge ${cls} sv-status-badge`}>{icon} {label}</span>;
}

function ProfileBar({ pct }: { pct: number }) {
  const color = pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <div className="sv-pct-wrap">
      <div className="sv-pct-bar"><div className="sv-pct-fill" style={{ width: `${pct}%`, background: color }} /></div>
      <span className="sv-pct-label" style={{ color }}>{pct}%</span>
    </div>
  );
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

function ConfirmDialog({ action, studentName, remarks, onConfirm, onCancel, loading }: {
  action: ActionType; studentName: string; remarks: string;
  onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
  const isApprove = action === 'VERIFIED';
  return (
    <div className="sv-confirm-overlay" onClick={onCancel}>
      <div className="sv-confirm-dialog" onClick={e => e.stopPropagation()}>
        <div className={`sv-confirm-icon ${isApprove ? 'approve' : 'reject'}`}>
          {isApprove ? <CheckCircle2 size={28} /> : <XCircle size={28} />}
        </div>
        <h3 className="sv-confirm-title">{isApprove ? 'Approve Profile?' : 'Reject Profile?'}</h3>
        <p className="sv-confirm-sub">
          {isApprove
            ? <>You are about to <strong>approve</strong> <em>{studentName}</em>'s profile. They will become <strong>eligible for placements</strong>.</>
            : <>You are about to <strong>reject</strong> <em>{studentName}</em>'s profile. They will be marked <strong>ineligible</strong>.</>}
        </p>
        {remarks && (
          <div className="sv-confirm-remarks">
            <span className="sv-confirm-remarks-label">Remarks:</span><span>{remarks}</span>
          </div>
        )}
        <div className="sv-confirm-actions">
          <button className="btn-secondary" onClick={onCancel} disabled={loading}>Cancel</button>
          <button className={isApprove ? 'btn-primary' : 'btn-danger'} onClick={onConfirm} disabled={loading}>
            {loading ? (isApprove ? 'Approving…' : 'Rejecting…') : (isApprove ? 'Yes, Approve' : 'Yes, Reject')}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Profile Modal ─── */
function ProfileModal({ student, onClose, onAction, submitting }: {
  student: StudentProfile; onClose: () => void;
  onAction: (action: ActionType, remarks: string) => void; submitting: boolean;
}) {
  const [remarks, setRemarks]           = useState('');
  const [remarksErr, setRemarksErr]     = useState(false);
  const [pendingAction, setPendingAction] = useState<ActionType | null>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  // Fetch extended profile details
  const [detail, setDetail]             = useState<StudentProfile | null>(null);
  useEffect(() => {
    getJson<StudentProfile>(`/api/faculty/students/${student.id}`)
      .then(r => setDetail(r.data))
      .catch(() => setDetail(student)); // fallback to list data
  }, [student.id]);

  const merged = detail ?? student;
  const pct    = merged.profileCompletionPercentage ?? 0;

  const handleAction = (action: ActionType) => {
    if (action === 'REJECTED' && !remarks.trim()) { setRemarksErr(true); textRef.current?.focus(); return; }
    setRemarksErr(false); setPendingAction(action);
  };

  return (
    <>
      <div className="sv-modal-overlay" onClick={onClose}>
        <div className="sv-modal" onClick={e => e.stopPropagation()}>
          <div className="sv-modal-header">
            <div className="sv-modal-title-block">
              <div className="sv-modal-avatar">{(merged.name || '?').charAt(0).toUpperCase()}</div>
              <div>
                <h3 className="sv-modal-name">{merged.name}</h3>
                <p className="sv-modal-meta">{merged.rollNo} · {merged.department ?? merged.batch ?? ''} · {merged.graduationYear ?? ''}</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <StatusBadge status={merged.verificationStatus} />
              <button className="sv-modal-close" onClick={onClose}><X size={18} /></button>
            </div>
          </div>

          <div className="sv-modal-body">
            {/* Basic Info */}
            <section className="sv-section">
              <h4 className="sv-section-title"><User size={16} /> Basic Information</h4>
              <div className="sv-info-grid">
                <div className="sv-info-item">
                  <span className="sv-info-label"><Mail size={11} /> Email</span>
                  <span className="sv-info-value">{merged.email}</span>
                </div>
                <div className="sv-info-item">
                  <span className="sv-info-label"><Phone size={11} /> Phone</span>
                  <span className="sv-info-value">{merged.phoneNumber || '—'}</span>
                </div>
                {merged.personalDetails && (
                  <>
                    <div className="sv-info-item">
                      <span className="sv-info-label">Date of Birth</span>
                      <span className="sv-info-value">{new Date(merged.personalDetails.dateOfBirth).toLocaleDateString('en-IN')}</span>
                    </div>
                    <div className="sv-info-item">
                      <span className="sv-info-label">Gender</span>
                      <span className="sv-info-value">{merged.personalDetails.gender}</span>
                    </div>
                    <div className="sv-info-item" style={{ gridColumn: 'span 2' }}>
                      <span className="sv-info-label">Address</span>
                      <span className="sv-info-value">{merged.personalDetails.address}</span>
                    </div>
                  </>
                )}
                {(merged.linkedinUrl || merged.githubUrl) && (
                  <div className="sv-info-item" style={{ gridColumn: 'span 2' }}>
                    <span className="sv-info-label"><LinkIcon size={11} /> Professional Profiles</span>
                    <div style={{ display: 'flex', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
                      {merged.linkedinUrl && <a href={merged.linkedinUrl} target="_blank" rel="noreferrer" className="sv-link">LinkedIn ↗</a>}
                      {merged.githubUrl   && <a href={merged.githubUrl}   target="_blank" rel="noreferrer" className="sv-link github">GitHub ↗</a>}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Academic */}
            <section className="sv-section">
              <h4 className="sv-section-title"><BookOpen size={16} /> Academic Information</h4>
              <div className="sv-info-grid">
                <div className="sv-info-item">
                  <span className="sv-info-label">Department / Batch</span>
                  <span className="sv-info-value">{merged.department ?? merged.batch ?? '—'}</span>
                </div>
                <div className="sv-info-item">
                  <span className="sv-info-label">Graduation Year</span>
                  <span className="sv-info-value">{merged.graduationYear ?? '—'}</span>
                </div>
                <div className="sv-info-item">
                  <span className="sv-info-label">CGPA</span>
                  <span className="sv-info-value sv-cgpa" style={{ color: merged.cgpa >= 7 ? '#059669' : '#d97706' }}>{merged.cgpa?.toFixed(2)}</span>
                </div>
                <div className="sv-info-item">
                  <span className="sv-info-label">Standing Arrears</span>
                  <span className="sv-info-value" style={{ color: merged.standingArrears > 0 ? '#ef4444' : '#10b981', fontWeight: 700 }}>
                    {merged.standingArrears} {merged.standingArrears === 0 ? '✓' : '⚠'}
                  </span>
                </div>
                <div className="sv-info-item">
                  <span className="sv-info-label">History of Arrears</span>
                  <span className="sv-info-value">{merged.historyOfArrears}</span>
                </div>
                <div className="sv-info-item">
                  <span className="sv-info-label">10th Marks</span>
                  <span className="sv-info-value">{merged.xMarksPercentage != null ? `${merged.xMarksPercentage}%` : '—'}</span>
                </div>
                <div className="sv-info-item">
                  <span className="sv-info-label">12th Marks</span>
                  <span className="sv-info-value">{merged.xiiMarksPercentage != null ? `${merged.xiiMarksPercentage}%` : '—'}</span>
                </div>
                <div className="sv-info-item">
                  <span className="sv-info-label">Profile Completion</span>
                  <ProfileBar pct={pct} />
                </div>
              </div>
            </section>

            {/* Academic Records */}
            {(merged.academicRecords?.length ?? 0) > 0 && (
              <section className="sv-section">
                <h4 className="sv-section-title"><GraduationCap size={16} /> Academic Records</h4>
                <div className="sv-records">
                  {merged.academicRecords!.map((r, i) => (
                    <div key={i} className="sv-record-card">
                      <div className="sv-record-degree">{r.degree}</div>
                      <div className="sv-record-inst">{r.institution}</div>
                      <div className="sv-record-foot">
                        <span className="sv-record-pct">{r.percentage}%</span>
                        <span className="sv-record-year">{r.yearOfCompletion}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Certifications */}
            {(merged.certifications?.length ?? 0) > 0 && (
              <section className="sv-section">
                <h4 className="sv-section-title"><Award size={16} /> Certifications</h4>
                <div className="sv-cert-grid">
                  {merged.certifications!.map((c, i) => (
                    <div key={i} className="sv-cert-card">
                      <div className="sv-cert-name">{c.name}</div>
                      <div className="sv-cert-org">{c.issuingOrganization}</div>
                      <div className="sv-cert-date">
                        {c.issueDate && !Number.isNaN(new Date(c.issueDate).getTime())
                          ? new Date(c.issueDate).toLocaleDateString('en-IN')
                          : (c.issueDate || '—')}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Skills */}
            {(merged.skills?.length ?? 0) > 0 && (
              <section className="sv-section">
                <h4 className="sv-section-title"><Briefcase size={16} /> Skills</h4>
                <div className="sv-skills">
                  {merged.skills!.map((s, i) => <span key={i} className="sv-skill-tag">{s}</span>)}
                </div>
              </section>
            )}

            {/* Remarks */}
            <section className="sv-section" style={{ borderBottom: 'none' }}>
              <h4 className="sv-section-title">
                <FileText size={16} /> Verification Remarks
                <span className="sv-remarks-hint"> (required if rejecting)</span>
              </h4>
              {merged.latestVerificationRemarks && (
                <div className="sv-confirm-remarks" style={{ marginBottom: 10 }}>
                  <span className="sv-confirm-remarks-label">Latest Faculty Remark:</span>
                  <span>{merged.latestVerificationRemarks}</span>
                </div>
              )}
              <textarea
                ref={textRef}
                className={`sv-remarks${remarksErr ? ' sv-remarks-error' : ''}`}
                placeholder="Add feedback or remarks for the student…"
                value={remarks}
                onChange={e => { setRemarks(e.target.value); setRemarksErr(false); }}
                rows={3}
              />
              {remarksErr && <p className="sv-remarks-err-msg"><AlertCircle size={13} /> Remarks are required when rejecting a profile.</p>}
            </section>
          </div>

          <div className="sv-modal-footer">
            <button className="btn-secondary" onClick={onClose} disabled={submitting}>Cancel</button>
            <button className="btn-danger" onClick={() => handleAction('REJECTED')}
              disabled={submitting || merged.verificationStatus === 'REJECTED'}>
              <XCircle size={15} /> {submitting ? 'Rejecting…' : 'Reject'}
            </button>
            <button className="btn-primary" onClick={() => handleAction('VERIFIED')}
              disabled={submitting || merged.verificationStatus === 'VERIFIED'}>
              <CheckCircle size={15} /> {submitting ? 'Approving…' : 'Approve'}
            </button>
          </div>
        </div>
      </div>

      {pendingAction && (
        <ConfirmDialog
          action={pendingAction} studentName={merged.name} remarks={remarks}
          onConfirm={() => { onAction(pendingAction, remarks); setPendingAction(null); }}
          onCancel={() => setPendingAction(null)} loading={submitting}
        />
      )}
    </>
  );
}

/* ════════════════ MAIN PAGE ════════════════ */
export default function StudentVerification({ onNavigate }: { onNavigate?: (view: any) => void }) {
  const [loading, setLoading]       = useState(true);
  const [students, setStudents]     = useState<StudentProfile[]>([]);
  const [filtered, setFiltered]     = useState<StudentProfile[]>([]);
  const [selected, setSelected]     = useState<StudentProfile | null>(null);
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('PENDING');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast]           = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  /* ── Load faculty students from the authenticated faculty session ── */
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const [pendingRes, allRes] = await Promise.all([
          getJson<StudentProfile[]>('/api/faculty/students/pending'),
          getJson<StudentProfile[]>('/api/faculty/students/all'),
        ]);
        if (!active) return;
        const mergedMap = new Map<number, StudentProfile>();
        (pendingRes.data || []).forEach(student => mergedMap.set(student.id, student));
        (allRes.data || []).forEach(student => mergedMap.set(student.id, student));
        setStudents(Array.from(mergedMap.values()));
      } catch (e: any) {
        if (active) setToast({ msg: e.message || 'Failed to load students', type: 'error' });
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [refreshKey]);

  useEffect(() => {
    const intervalId = window.setInterval(() => setRefreshKey(k => k + 1), 30000);
    return () => window.clearInterval(intervalId);
  }, []);

  /* ── Filter ── */
  useEffect(() => {
    let list = students;
    if (statusFilter !== 'ALL') list = list.filter(s => s.verificationStatus === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(s =>
        s.rollNo.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        (s.department ?? s.batch ?? '').toLowerCase().includes(q)
      );
    }
    setFiltered(list);
  }, [students, search, statusFilter]);

  const counts = {
    ALL:      students.length,
    PENDING:  students.filter(s => s.verificationStatus === 'PENDING').length,
    VERIFIED: students.filter(s => s.verificationStatus === 'VERIFIED').length,
    REJECTED: students.filter(s => s.verificationStatus === 'REJECTED').length,
  };

  /* ── Submit verification using the authenticated faculty session ── */
  const handleAction = async (action: ActionType, remarks: string) => {
    if (!selected) return;
    try {
      setSubmitting(true);
      // body: ProfileVerificationRequestDTO { status: VerificationStatus, remarks: string }
      await postJson(
        `/api/faculty/students/${selected.id}/verify`,
        { status: action, remarks: remarks.trim() || (action === 'VERIFIED' ? 'Profile verified' : 'Profile rejected') }
      );
      setSelected(null);
      setToast({ msg: `Profile ${action === 'VERIFIED' ? 'approved' : 'rejected'} successfully!`, type: 'success' });
      setRefreshKey(k => k + 1);
    } catch (e: any) {
      setToast({ msg: e.message || 'Verification failed', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const tabs: { key: StatusFilter; label: string; color: string }[] = [
    { key: 'ALL',      label: 'All',      color: '#6366f1' },
    { key: 'PENDING',  label: 'Pending',  color: '#f59e0b' },
    { key: 'VERIFIED', label: 'Verified', color: '#10b981' },
    { key: 'REJECTED', label: 'Rejected', color: '#ef4444' },
  ];

  return (
    <FacultyLayout activeNav="verification" onNavigate={onNavigate}>
      <div className="content">
        {/* Header */}
        <div className="sv-page-header fade-in">
          <div>
            <h1 className="page-title">Student Profile Verification</h1>
            <p className="page-subtitle">Review and verify student profiles — department auto-scoped</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn-secondary" onClick={() => setRefreshKey(k => k + 1)} disabled={loading}>
              <RefreshCw size={15} style={loading ? { animation: 'spin 1s linear infinite' } : {}} /> Refresh
            </button>
            <button className="btn-secondary" onClick={() => onNavigate?.('facultyDashboard')}>
              <ChevronLeft size={15} /> Dashboard
            </button>
          </div>
        </div>

        {/* Filter card */}
        <div className="sv-filter-card fade-in">
          <div className="sv-tabs">
            {tabs.map(t => (
              <button key={t.key} className={`sv-tab ${statusFilter === t.key ? 'active' : ''}`}
                style={statusFilter === t.key ? { borderColor: t.color, color: t.color } : {}}
                onClick={() => setStatusFilter(t.key)}>
                {t.label}
                <span className="sv-tab-count" style={statusFilter === t.key ? { background: t.color, color: '#fff' } : {}}>
                  {counts[t.key]}
                </span>
              </button>
            ))}
          </div>
          <div className="sv-search-row">
            <div className="sv-search-box">
              <Search size={15} color="#94a3b8" />
              <input placeholder="Search by name, roll number, email, or department…"
                value={search} onChange={e => setSearch(e.target.value)} />
              {search && <button className="sv-search-clear" onClick={() => setSearch('')}><X size={13} /></button>}
            </div>
            <span className="sv-result-count">
              {loading ? '…' : `${filtered.length} result${filtered.length !== 1 ? 's' : ''}`}
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="sv-table-card fade-in" style={{ animationDelay: '0.1s' }}>
          {loading ? (
            <div className="sv-table-skeleton">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="sk-table-row">
                  {[12, 20, 20, 12, 8, 8, 10, 10].map((w, j) => (
                    <div key={j} className="sk-box sk-text-sm" style={{ width: `${w}%` }} />
                  ))}
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="faculty-empty-state" style={{ padding: '60px 24px' }}>
              <User size={48} color="#94a3b8" /><h4>No Students Found</h4>
              <p>Try adjusting your status filter or search query</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="sv-table">
                <thead>
                  <tr>
                    <th>Roll No.</th><th>Student Name</th><th>Dept. / Batch</th>
                    <th>CGPA</th><th>Arrears</th><th>Profile %</th><th>Status</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(s => (
                    <tr key={s.id} className={s.verificationStatus === 'PENDING' ? 'sv-row-pending' : ''}>
                      <td><span className="faculty-roll">{s.rollNo}</span></td>
                      <td>
                        <div className="faculty-user-cell">
                          <div className={`faculty-avatar ${s.verificationStatus === 'VERIFIED' ? 'verified' : ''}`}>
                            {(s.name || '?').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{s.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.email}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className="badge info">{s.department ?? s.batch ?? '—'}</span></td>
                      <td><span className={s.cgpa >= 7 ? 'faculty-cgpa good' : 'faculty-cgpa low'}>{s.cgpa?.toFixed(2)}</span></td>
                      <td><span className={s.standingArrears > 0 ? 'faculty-arrears bad' : 'faculty-arrears ok'}>{s.standingArrears}</span></td>
                      <td><ProfileBar pct={s.profileCompletionPercentage ?? 0} /></td>
                      <td><StatusBadge status={s.verificationStatus} /></td>
                      <td>
                        <div className="sv-action-btns">
                          <button className="icon-btn view" title="View & Verify" onClick={() => setSelected(s)}><Eye size={14} /></button>
                          {s.verificationStatus !== 'VERIFIED' && (
                            <button className="icon-btn sv-btn-approve" title="Open to Approve" onClick={() => setSelected(s)}><CheckCircle size={14} /></button>
                          )}
                          {s.verificationStatus !== 'REJECTED' && (
                            <button className="icon-btn sv-btn-reject" title="Open to Reject" onClick={() => setSelected(s)}><XCircle size={14} /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {selected && (
        <ProfileModal student={selected} onClose={() => setSelected(null)}
          onAction={handleAction} submitting={submitting} />
      )}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </FacultyLayout>
  );
}
