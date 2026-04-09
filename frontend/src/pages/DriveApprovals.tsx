import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ChevronLeft, RefreshCw, Search, X } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import ExportButton from '../components/ExportButton';
import { getJson, putJson } from '../utils/api';
import StageDropdown from '../components/StageDropdown';

type Drive = {
  id: number;
  title: string;
  companyName: string;
  role?: string;
  status: string;
};

type DriveApprovalSummary = {
  driveId: number;
  driveTitle: string;
  companyName: string;
  totalApprovedStudents: number;
};

type ApprovedStudent = {
  id: number;
  studentId: number;
  studentName: string;
  rollNo?: string;
  rollNumber?: string;
  departmentName: string;
  cgpa: number;
  stage: string;
  facultyApproved: boolean;
  submittedToAdmin: boolean;
  role?: string;
  companyName?: string;
  skills?: string[];
};

function stageBadgeClass(stage: string): string {
  switch (stage) {
    case 'ELIGIBLE':
      return 'da-stage-badge da-stage-eligible';
    case 'APPLIED':
      return 'da-stage-badge da-stage-applied';
    case 'ASSESSMENT':
      return 'da-stage-badge da-stage-assessment';
    case 'TECHNICAL':
      return 'da-stage-badge da-stage-technical';
    case 'HR':
      return 'da-stage-badge da-stage-hr';
    case 'SELECTED':
      return 'da-stage-badge da-stage-selected';
    case 'REJECTED':
      return 'da-stage-badge da-stage-rejected';
    default:
      return 'da-stage-badge da-stage-default';
  }
}

function approvalBadgeClass(student: ApprovedStudent): string {
  if (student.stage === 'SELECTED') return 'da-approval-badge da-approval-selected';
  if (student.stage === 'REJECTED') return 'da-approval-badge da-approval-rejected';
  if (student.facultyApproved) return 'da-approval-badge da-approval-approved';
  return 'da-approval-badge da-approval-pending';
}

function approvalLabel(student: ApprovedStudent): string {
  if (student.stage === 'SELECTED') return 'SELECTED';
  if (student.stage === 'REJECTED') return 'REJECTED';
  return student.facultyApproved ? 'APPROVED' : 'PENDING';
}

export default function DriveApprovals({ onNavigate }: { onNavigate?: (view: string) => void }) {
  const [drives, setDrives] = useState<Drive[]>([]);
  const [driveSummaries, setDriveSummaries] = useState<DriveApprovalSummary[]>([]);
  const [selectedDriveId, setSelectedDriveId] = useState<number | ''>('');
  const [students, setStudents] = useState<ApprovedStudent[]>([]);
  const [loadingDrives, setLoadingDrives] = useState(true);
  const [loadingSummaries, setLoadingSummaries] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [updatingStudentId, setUpdatingStudentId] = useState<number | null>(null);

  function normalizeRollNo(student: ApprovedStudent): string {
    const raw = student.rollNo ?? student.rollNumber;
    if (typeof raw === 'string' && raw.trim()) return raw.trim();
    return 'N/A';
  }

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoadingDrives(true);
        const res = await getJson<Drive[]>('/api/admin/drives');
        if (active) setDrives(res.data || []);
      } catch (e: any) {
        if (active) setToast({ msg: e.message || 'Failed to load drives', type: 'error' });
      } finally {
        if (active) setLoadingDrives(false);
      }
    })();
    return () => { active = false; };
  }, [refreshKey]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoadingSummaries(true);
        const res = await getJson<DriveApprovalSummary[]>('/api/admin/drive-approvals/summary');
        if (active) setDriveSummaries(res.data || []);
      } catch (e: any) {
        if (active) setToast({ msg: e.message || 'Failed to load approval summary', type: 'error' });
      } finally {
        if (active) setLoadingSummaries(false);
      }
    })();
    return () => { active = false; };
  }, [refreshKey]);

  useEffect(() => {
    if (!selectedDriveId) {
      setStudents([]);
      return;
    }

    let active = true;
    (async () => {
      try {
        setLoadingStudents(true);
        const res = await getJson<ApprovedStudent[]>(`/api/admin/approved-students/${selectedDriveId}`);
        if (active) {
          const normalized = (res.data || []).map((student) => ({
            ...student,
            rollNo: normalizeRollNo(student),
          }));
          setStudents(normalized);
        }
      } catch (e: any) {
        if (active) setToast({ msg: e.message || 'Failed to load approved students', type: 'error' });
      } finally {
        if (active) setLoadingStudents(false);
      }
    })();
    return () => { active = false; };
  }, [selectedDriveId, refreshKey]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter((student) =>
      student.studentName.toLowerCase().includes(q) ||
      (student.rollNo || '').toLowerCase().includes(q) ||
      student.departmentName.toLowerCase().includes(q)
    );
  }, [students, search]);

  const selectedDrive = drives.find((drive) => drive.id === selectedDriveId) ||
    (selectedDriveId
      ? (() => {
          const summary = driveSummaries.find((entry) => entry.driveId === selectedDriveId);
          return summary
            ? {
                id: summary.driveId,
                title: summary.driveTitle,
                companyName: summary.companyName,
                role: '',
                status: 'ACTIVE',
              }
            : undefined;
        })()
      : undefined);

  async function updateStage(studentId: number, stage: string) {
    if (!selectedDriveId) return;
    try {
      setUpdatingStudentId(studentId);
      const adminEmail = localStorage.getItem('email') || 'admin@campushire.com';
      await putJson<void>(`/api/stage/update?email=${encodeURIComponent(adminEmail)}`, {
        studentId,
        driveId: selectedDriveId,
        stage,
      });
      setStudents((current) =>
        current.map((student) => student.studentId === studentId
          ? { ...student, stage, submittedToAdmin: true }
          : student
        )
      );
      setToast({ msg: 'Stage updated successfully', type: 'success' });
    } catch (e: any) {
      setToast({ msg: e.message || 'Failed to update student stage', type: 'error' });
    } finally {
      setUpdatingStudentId(null);
    }
  }

  return (
    <AdminLayout activeNav="approvals" onNavigate={onNavigate}>
      <div className="page-container">
        {toast && (
          <div className={`sv-toast sv-toast-${toast.type}`}>
            <CheckCircle2 size={18} />
            <span>{toast.msg}</span>
            <button className="sv-toast-close" onClick={() => setToast(null)}><X size={14} /></button>
          </div>
        )}

        <div className="page-header">
          <div>
            <h1 className="page-title">Drive Approvals</h1>
            <p className="page-subtitle">Review faculty-approved students and finalize selections drive-wise</p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <ExportButton
              disabled={filteredStudents.length === 0}
              opts={{
                title: selectedDrive ? `${selectedDrive.title} - Approved Students` : 'Approved Students',
                subtitle: selectedDrive ? `${selectedDrive.companyName} · ${selectedDrive.role ?? ''}` : '',
                filename: selectedDrive ? `drive-approvals-${selectedDrive.id}` : 'drive-approvals',
                columns: [
                  { header: 'Student Name', key: 'studentName' },
                  { header: 'Roll No', key: 'rollNo' },
                  { header: 'Department', key: 'departmentName' },
                  { header: 'CGPA', key: 'cgpa' },
                  { header: 'Skills', key: 'skills' },
                  { header: 'Stage', key: 'stage' },
                  { header: 'Approval Status', key: 'approvalStatus' },
                ],
                rows: filteredStudents.map((student) => ({
                  studentName: student.studentName,
                  rollNo: student.rollNo || 'N/A',
                  departmentName: student.departmentName,
                  cgpa: student.cgpa?.toFixed?.(2) ?? student.cgpa,
                  skills: (student.skills || []).join(', '),
                  stage: student.stage,
                  approvalStatus: student.facultyApproved ? 'APPROVED' : 'PENDING',
                })),
              }}
            />
            <button className="btn-secondary" onClick={() => setRefreshKey((key) => key + 1)}>
              <RefreshCw size={15} style={(loadingDrives || loadingStudents) ? { animation: 'spin 1s linear infinite' } : {}} />
              Refresh
            </button>
            <button className="btn-secondary" onClick={() => onNavigate?.('placementDashboard')}>
              <ChevronLeft size={15} /> Dashboard
            </button>
          </div>
        </div>

        <div className="card shortlist-controls">
          <div className="shortlist-header">
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text-muted)' }}>
                Select Drive
              </label>
              {loadingDrives ? (
                <div className="sk-box" style={{ height: 44, width: 360, borderRadius: 12 }} />
              ) : (
                <select
                  value={selectedDriveId}
                  onChange={(e) => setSelectedDriveId(e.target.value ? Number(e.target.value) : '')}
                  className="drive-select"
                >
                  <option value="">-- Select a Drive --</option>
                  {driveSummaries.map((drive) => (
                    <option key={drive.driveId} value={drive.driveId}>
                      {drive.driveTitle} - {drive.companyName} ({drive.totalApprovedStudents} approved)
                    </option>
                  ))}
                  {driveSummaries.length === 0 && drives.map((drive) => (
                    <option key={drive.id} value={drive.id}>
                      {drive.title} - {drive.companyName} ({drive.status})
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="sv-search-box" style={{ maxWidth: 320 }}>
              <Search size={14} color="#94a3b8" />
              <input
                placeholder="Search student, roll, dept..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && <button className="sv-search-clear" onClick={() => setSearch('')}><X size={12} /></button>}
            </div>
          </div>

          <div className="table-header-row" style={{ marginBottom: 12 }}>
            <div className="table-info" style={{ fontWeight: 700 }}>
              {loadingSummaries
                ? 'Loading drive approval cards...'
                : `${driveSummaries.length} drive${driveSummaries.length !== 1 ? 's' : ''} available`}
            </div>
          </div>

          {!loadingSummaries && driveSummaries.length > 0 && (
            <div className="dd-grid" style={{ marginBottom: 16 }}>
              {driveSummaries.map((summary) => (
                <div key={summary.driveId} className={`dd-card fade-in ${selectedDriveId === summary.driveId ? 'drive-card selected' : ''}`}>
                  <div className="dd-card-body" style={{ gap: 6 }}>
                    <h3 className="dd-drive-title" style={{ marginBottom: 0 }}>{summary.driveTitle}</h3>
                    <p className="dd-company-name" style={{ marginBottom: 8 }}>{summary.companyName}</p>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
                      Total Approved Students
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>
                      {summary.totalApprovedStudents}
                    </div>
                  </div>
                  <button className="btn-secondary" onClick={() => setSelectedDriveId(summary.driveId)}>
                    View Students
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedDriveId && (
          <div className="card table-card">
            <div className="table-header-row">
              <div className="table-info">
                <span>{loadingStudents ? 'Loading…' : `${filteredStudents.length} approved student${filteredStudents.length !== 1 ? 's' : ''}`}</span>
              </div>
            </div>

            <div className="table-wrapper">
              <table className="table shortlist-table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Department</th>
                    <th>CGPA</th>
                    <th>Skills</th>
                    <th>Stage</th>
                    <th>Approval Status</th>
                    <th>Stage Control</th>
                  </tr>
                </thead>
                <tbody>
                  {!loadingStudents && filteredStudents.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        No faculty-approved students found for this drive
                      </td>
                    </tr>
                  )}
                  {filteredStudents.map((student) => (
                    <tr key={student.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{student.studentName}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{student.rollNo || 'N/A'}</div>
                      </td>
                      <td>{student.departmentName}</td>
                      <td><span className="cgpa-badge">{student.cgpa?.toFixed?.(2) ?? student.cgpa}</span></td>
                      <td style={{ maxWidth: 240 }}>{(student.skills || []).join(', ') || '—'}</td>
                      <td><span className={stageBadgeClass(student.stage)}>{student.stage}</span></td>
                      <td>
                        <span className={approvalBadgeClass(student)}>
                          {approvalLabel(student)}
                        </span>
                      </td>
                      <td>
                        <StageDropdown
                          value={student.stage}
                          className="sm-stage-select-unified"
                          disabled={updatingStudentId === student.studentId}
                          onChange={(next) => {
                            if (next === student.stage) return;
                            updateStage(student.studentId, next);
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
