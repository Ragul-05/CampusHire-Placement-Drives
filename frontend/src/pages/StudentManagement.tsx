import { useEffect, useState, Fragment } from 'react';
import { Search, Filter, Eye, Lock, Unlock, X, User } from 'lucide-react';
import '../styles/dashboard.css';
import { facultyUrl, getJson, patchJson } from '../utils/api';
import AdminLayout from '../components/AdminLayout';
import FacultyLayout from '../components/FacultyLayout';
import ExportButton from '../components/ExportButton';

type Student = {
  id: number;
  email: string;
  rollNo: string;
  batch: string;
  departmentName: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  isLocked: boolean;
  isPlaced: boolean;
  highestPackageLpa: number | null;
  resumeUrl: string | null;
  // Extended fields for display
  name?: string;
  cgpa?: number;
};

type FacultyStudent = {
  id: number;
  email: string;
  rollNo: string;
  batch?: string;
  department?: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  isLocked?: boolean;
  isPlaced?: boolean;
  highestPackageLpa?: number | null;
  name?: string;
  cgpa?: number | null;
};

type Department = {
  id: number;
  name: string;
  code: string;
};

export default function StudentManagement({ onNavigate }: { onNavigate?: (view: any) => void }) {
  const userRole = localStorage.getItem('role');
  const isFacultyView = userRole === 'FACULTY';
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [verificationFilter, setVerificationFilter] = useState('');
  const [placementFilter, setPlacementFilter] = useState('');

  // View modal
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Expanded row for mobile
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [students, searchTerm, selectedDept, verificationFilter, placementFilter]);

  async function loadData() {
    try {
      setLoading(true);
      if (isFacultyView) {
        const studentsRes = await getJson<FacultyStudent[]>(facultyUrl('/api/faculty/students/all'));
        const normalizedStudents: Student[] = (studentsRes.data || []).map(student => ({
          id: student.id,
          email: student.email,
          rollNo: student.rollNo || `ROLL${student.id}`,
          batch: student.batch || '',
          departmentName: student.department || 'UNASSIGNED',
          verificationStatus: student.verificationStatus,
          isLocked: !!student.isLocked,
          isPlaced: !!student.isPlaced,
          highestPackageLpa: student.highestPackageLpa ?? null,
          resumeUrl: null,
          name: student.name || student.email.split('@')[0],
          cgpa: student.cgpa ?? undefined,
        }));

        const derivedDepartments: Department[] = Array.from(
          new Set(
            normalizedStudents
              .map(student => student.departmentName)
              .filter(Boolean)
          )
        ).map((name, index) => ({
          id: index + 1,
          name,
          code: name,
        }));

        setStudents(normalizedStudents);
        setDepartments(derivedDepartments);
      } else {
        const [studentsRes, deptsRes] = await Promise.all([
          getJson<Student[]>('/api/admin/students/search?query='),
          getJson<Department[]>('/api/admin/departments')
        ]);
        setStudents(studentsRes.data || []);
        setDepartments(deptsRes.data || []);
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to load data', true);
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    let filtered = [...students];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.rollNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.name || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Department filter
    if (selectedDept) {
      filtered = filtered.filter(student => student.departmentName === selectedDept);
    }

    // Verification status filter
    if (verificationFilter) {
      filtered = filtered.filter(student => student.verificationStatus === verificationFilter);
    }

    // Placement filter
    if (placementFilter === 'placed') {
      filtered = filtered.filter(student => student.isPlaced);
    } else if (placementFilter === 'notplaced') {
      filtered = filtered.filter(student => !student.isPlaced);
    }

    setFilteredStudents(filtered);
  }

  async function handleToggleLock(studentId: number) {
    if (isFacultyView) {
      showToast('Profile locking is managed by Placement HQ.', true);
      return;
    }
    try {
      const response = await patchJson<Student>(`/api/admin/students/${studentId}/toggle-lock`);
      const updatedStudent = response.data;

      // Update students list
      setStudents(students.map(s => s.id === studentId ? updatedStudent : s));

      showToast(updatedStudent.isLocked ? 'Profile locked successfully' : 'Profile unlocked successfully');
    } catch (err: any) {
      showToast(err?.message || 'Failed to toggle lock', true);
    }
  }

  function handleViewStudent(student: Student) {
    setSelectedStudent(student);
    setShowViewModal(true);
  }

  function closeViewModal() {
    setShowViewModal(false);
    setSelectedStudent(null);
  }

  function showToast(msg: string, isError = false) {
    setToast({ msg, type: isError ? 'error' : 'success' });
    setTimeout(() => setToast(null), 3000);
  }

  function resetFilters() {
    setSearchTerm('');
    setSelectedDept('');
    setVerificationFilter('');
    setPlacementFilter('');
  }

  function getVerificationBadgeClass(status: string): string {
    switch (status) {
      case 'VERIFIED': return 'success';
      case 'PENDING': return 'info';
      case 'REJECTED': return 'danger';
      default: return 'info';
    }
  }

  // Determine which layout to use based on user role
  const Layout = userRole === 'FACULTY' ? FacultyLayout : AdminLayout;
  const layoutActiveNav = userRole === 'FACULTY' ? 'students' : 'students';

  return (
    <Layout activeNav={layoutActiveNav} onNavigate={onNavigate}>
      <div className="page-container">
        {toast && (
          <div className={`toast toast-notification ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>
            {toast.msg}
          </div>
        )}

        <div className="page-header">
          <div>
            <h1 className="page-title">Student Management</h1>
            <p className="page-subtitle">Manage student profiles and access controls</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <ExportButton
              disabled={filteredStudents.length === 0}
              opts={{
                title:    'Student Management Report',
                subtitle: `Department: ${selectedDept || 'All'} · Status: ${verificationFilter || 'All'} · Placement: ${placementFilter || 'All'}`,
                filename: 'student-management',
                columns: [
                  { header: '#',              key: '_idx'              },
                  { header: 'Email',          key: 'email'             },
                  { header: 'Roll No',        key: 'rollNo'            },
                  { header: 'Department',     key: 'departmentName'    },
                  { header: 'Batch',          key: 'batch'             },
                  { header: 'Verification',   key: 'verificationStatus'},
                  { header: 'Placement',      key: '_placed'           },
                  { header: 'Package (LPA)',  key: '_package'          },
                  { header: 'Profile Lock',   key: '_locked'           },
                ],
                rows: filteredStudents.map((s, i) => ({
                  _idx:             i + 1,
                  email:            s.email,
                  rollNo:           s.rollNo,
                  departmentName:   s.departmentName,
                  batch:            s.batch,
                  verificationStatus: s.verificationStatus,
                  _placed:          s.isPlaced ? 'PLACED' : 'NOT PLACED',
                  _package:         s.highestPackageLpa ?? '—',
                  _locked:          s.isLocked ? 'Locked' : 'Unlocked',
                })),
              }}
            />
            <div className="student-stats">
              <div className="stat-mini">
                <span className="stat-mini-value">{filteredStudents.length}</span>
                <span className="stat-mini-label">Total Students</span>
              </div>
              <div className="stat-mini">
                <span className="stat-mini-value">{filteredStudents.filter(s => s.isPlaced).length}</span>
                <span className="stat-mini-label">Placed</span>
              </div>
            </div>
          </div>
        </div>

        {loading && <div className="skeleton" style={{ minHeight: 400 }} />}

        {!loading && (
          <>
            {/* Filters Section */}
            <div className="card filter-section">
              <div className="filter-row">
                <div className="input-group">
                  <Search size={16} color="#94a3b8" />
                  <input
                    placeholder="Search by name, roll number, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)}>
                  <option value="">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.name}>{dept.name}</option>
                  ))}
                </select>

                <select value={verificationFilter} onChange={(e) => setVerificationFilter(e.target.value)}>
                  <option value="">All Status</option>
                  <option value="VERIFIED">Verified</option>
                  <option value="PENDING">Pending</option>
                  <option value="REJECTED">Rejected</option>
                </select>

                <select value={placementFilter} onChange={(e) => setPlacementFilter(e.target.value)}>
                  <option value="">All Students</option>
                  <option value="placed">Placed</option>
                  <option value="notplaced">Not Placed</option>
                </select>

                <button className="btn-secondary" onClick={resetFilters}>
                  <X size={16} />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            {/* Students Table */}
            <div className="card table-card">
              <div className="table-wrapper">
                <table className="table students-table">
                  <thead>
                    <tr>
                      <th>Student Details</th>
                      <th>Department</th>
                      <th>Roll No</th>
                      <th>Verification</th>
                      <th>Placement</th>
                      <th>Profile Lock</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.length === 0 && (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                          No students found matching the filters
                        </td>
                      </tr>
                    )}
                    {filteredStudents.map(student => (
                      <Fragment key={student.id}>
                        <tr
                          key={student.id}
                          className={`student-row ${expandedRow === student.id ? 'expanded' : ''}`}
                          onClick={() => setExpandedRow(expandedRow === student.id ? null : student.id)}
                        >
                          <td>
                            <div className="student-info">
                              <div className="student-avatar">
                                <User size={18} />
                              </div>
                              <div>
                                <div className="student-name">{student.name || student.email.split('@')[0]}</div>
                                <div className="student-email">{student.email}</div>
                              </div>
                            </div>
                          </td>
                          <td>{student.departmentName}</td>
                          <td><span className="roll-badge">{student.rollNo}</span></td>
                          <td>
                            <span className={`badge ${getVerificationBadgeClass(student.verificationStatus)}`}>
                              {student.verificationStatus}
                            </span>
                          </td>
                          <td>
                            {student.isPlaced ? (
                              <span className="badge success">
                                Placed {student.highestPackageLpa && `(₹${student.highestPackageLpa}L)`}
                              </span>
                            ) : (
                              <span className="badge info">Not Placed</span>
                            )}
                          </td>
                          <td>
                            {isFacultyView ? (
                              <span className={`badge ${student.isLocked ? 'warning' : 'success'}`}>
                                {student.isLocked ? 'Locked' : 'Unlocked'}
                              </span>
                            ) : (
                              <label className="toggle-switch" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={student.isLocked}
                                  onChange={() => handleToggleLock(student.id)}
                                />
                                <span className="toggle-slider"></span>
                              </label>
                            )}
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button
                                className="icon-btn view"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewStudent(student);
                                }}
                                title="View Details"
                              >
                                <Eye size={14} />
                              </button>
                              {!isFacultyView && (
                                <button
                                  className={`icon-btn ${student.isLocked ? 'unlock' : 'lock'}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleLock(student.id);
                                  }}
                                  title={student.isLocked ? 'Unlock Profile' : 'Lock Profile'}
                                >
                                  {student.isLocked ? <Unlock size={14} /> : <Lock size={14} />}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                        {/* Mobile Expanded Row */}
                        {expandedRow === student.id && (
                          <tr className="expanded-details">
                            <td colSpan={7}>
                              <div className="expanded-content">
                                <div className="detail-item">
                                  <span className="detail-label">Department:</span>
                                  <span className="detail-value">{student.departmentName}</span>
                                </div>
                                <div className="detail-item">
                                  <span className="detail-label">Roll No:</span>
                                  <span className="detail-value">{student.rollNo}</span>
                                </div>
                                <div className="detail-item">
                                  <span className="detail-label">Batch:</span>
                                  <span className="detail-value">{student.batch}</span>
                                </div>
                                <div className="detail-item">
                                  <span className="detail-label">Status:</span>
                                  <span className={`badge ${getVerificationBadgeClass(student.verificationStatus)}`}>
                                    {student.verificationStatus}
                                  </span>
                                </div>
                                <div className="detail-item">
                                  <span className="detail-label">Placement:</span>
                                  {student.isPlaced ? (
                                    <span className="badge success">Placed</span>
                                  ) : (
                                    <span className="badge info">Not Placed</span>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* View Student Modal */}
        {showViewModal && selectedStudent && (
          <div className="modal-overlay modal-fade-in" onClick={closeViewModal}>
            <div className="modal-content modal-scale-in" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Student Profile Details</h3>
                <button className="icon-btn" onClick={closeViewModal}>
                  <X size={18} />
                </button>
              </div>

              <div className="modal-body">
                <div className="profile-view">
                  <div className="profile-section">
                    <h4>Basic Information</h4>
                    <div className="profile-grid">
                      <div className="profile-item">
                        <span className="profile-label">Email</span>
                        <span className="profile-value">{selectedStudent.email}</span>
                      </div>
                      <div className="profile-item">
                        <span className="profile-label">Roll Number</span>
                        <span className="profile-value">{selectedStudent.rollNo}</span>
                      </div>
                      <div className="profile-item">
                        <span className="profile-label">Batch</span>
                        <span className="profile-value">{selectedStudent.batch}</span>
                      </div>
                      <div className="profile-item">
                        <span className="profile-label">Department</span>
                        <span className="profile-value">{selectedStudent.departmentName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="profile-section">
                    <h4>Status Information</h4>
                    <div className="profile-grid">
                      <div className="profile-item">
                        <span className="profile-label">Verification Status</span>
                        <span className={`badge ${getVerificationBadgeClass(selectedStudent.verificationStatus)}`}>
                          {selectedStudent.verificationStatus}
                        </span>
                      </div>
                      <div className="profile-item">
                        <span className="profile-label">Placement Status</span>
                        {selectedStudent.isPlaced ? (
                          <span className="badge success">Placed</span>
                        ) : (
                          <span className="badge info">Not Placed</span>
                        )}
                      </div>
                      <div className="profile-item">
                        <span className="profile-label">Profile Lock</span>
                        {selectedStudent.isLocked ? (
                          <span className="badge warning">Locked</span>
                        ) : (
                          <span className="badge success">Unlocked</span>
                        )}
                      </div>
                      {selectedStudent.highestPackageLpa && (
                        <div className="profile-item">
                          <span className="profile-label">Highest Package</span>
                          <span className="profile-value">₹{selectedStudent.highestPackageLpa} LPA</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedStudent.resumeUrl && (
                    <div className="profile-section">
                      <h4>Documents</h4>
                      <a
                        href={selectedStudent.resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-secondary"
                      >
                        View Resume
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn-secondary" onClick={closeViewModal}>
                  Close
                </button>
                {!isFacultyView && (
                  <button
                    className="btn-primary"
                    onClick={() => {
                      handleToggleLock(selectedStudent.id);
                      closeViewModal();
                    }}
                  >
                    {selectedStudent.isLocked ? (
                      <><Unlock size={16} /> Unlock Profile</>
                    ) : (
                      <><Lock size={16} /> Lock Profile</>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
