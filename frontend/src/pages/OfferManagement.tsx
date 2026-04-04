import { useEffect, useState } from 'react';
import { Plus, Award, TrendingUp, Users, Lock, X, DollarSign } from 'lucide-react';
import '../styles/dashboard.css';
import { getJson, postJson } from '../utils/api';
import AdminLayout from '../components/AdminLayout';

type Drive = {
  id: number;
  title: string;
  companyName: string;
  status: string;
};

type Offer = {
  id: number;
  studentId: number;
  studentName?: string;
  studentEmail: string;
  driveId: number;
  driveTitle?: string;
  companyName?: string;
  ctc: number;
  role: string;
  issuedAt: string;
};

type Student = {
  id: number;
  email: string;
  name: string;
  rollNo: string;
  departmentName: string;
  isLocked: boolean;
};

type Applicant = {
  id: number;
  studentId: number;
  studentName: string;
  rollNo: string;
  departmentName: string;
  cgpa: number;
  stage: string;
};

type OfferFormData = {
  studentId: number;
  ctc: string;
  role: string;
};

export default function OfferManagement({ onNavigate }: { onNavigate?: (view: any) => void }) {
  const [drives, setDrives] = useState<Drive[]>([]);
  const [selectedDriveId, setSelectedDriveId] = useState<number>(0);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [allOffers, setAllOffers] = useState<Offer[]>([]);
  const [applicants, setApplicants] = useState<Applicant[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingOffers, setLoadingOffers] = useState(false);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<OfferFormData>({
    studentId: 0,
    ctc: '',
    role: ''
  });

  // Stats
  const [stats, setStats] = useState({
    totalOffers: 0,
    highestCTC: 0,
    averageCTC: 0,
    lockedProfiles: 0
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedDriveId > 0) {
      loadOffers();
      loadApplicants();
    }
  }, [selectedDriveId]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (selectedDriveId > 0) {
        loadOffers();
      }
      loadAllOffers();
    }, 10000);
    return () => clearInterval(timer);
  }, [selectedDriveId]);

  useEffect(() => {
    calculateStats();
  }, [offers]);

  async function loadInitialData() {
    try {
      setLoading(true);
      const drivesRes = await getJson<Drive[]>('/api/admin/drives');
      setDrives(drivesRes.data || []);
      await loadAllOffers();
    } catch (err: any) {
      showToast(err?.message || 'Failed to load data', true);
    } finally {
      setLoading(false);
    }
  }

  async function loadAllOffers() {
    try {
      const response = await getJson<Offer[]>('/api/admin/offers');
      setAllOffers(response.data || []);
    } catch {
      // Keep current UI data if summary refresh fails.
    }
  }

  async function loadApplicants() {
    try {
      setLoadingApplicants(true);
      const response = await getJson<Applicant[]>(`/api/admin/drives/${selectedDriveId}/shortlist/eligible`);
      setApplicants(response.data || []);
    } catch (err: any) {
      showToast(err?.message || 'Failed to load applicants', true);
      setApplicants([]);
    } finally {
      setLoadingApplicants(false);
    }
  }

  async function loadOffers() {
    try {
      setLoadingOffers(true);
      const response = await getJson<Offer[]>(`/api/admin/drives/${selectedDriveId}/placements/offers`);
      setOffers(response.data || []);
    } catch (err: any) {
      showToast(err?.message || 'Failed to load offers', true);
      setOffers([]);
    } finally {
      setLoadingOffers(false);
    }
  }

  function calculateStats() {
    const totalOffers = offers.length;
    const highestCTC = offers.length > 0 ? Math.max(...offers.map(o => o.ctc)) : 0;
    const averageCTC = offers.length > 0
      ? offers.reduce((sum, o) => sum + o.ctc, 0) / offers.length
      : 0;
    const lockedProfiles = offers.length; // Each offer locks a profile

    setStats({ totalOffers, highestCTC, averageCTC, lockedProfiles });
  }

  function openModal() {
    setShowModal(true);
    setFormData({ studentId: 0, ctc: '', role: '' });
  }

  function closeModal() {
    setShowModal(false);
    setFormData({ studentId: 0, ctc: '', role: '' });
  }

  async function handleRecordOffer() {
    if (!formData.studentId || !formData.ctc || !formData.role.trim()) {
      showToast('Please fill all fields', true);
      return;
    }

    try {
      setSubmitting(true);
      await postJson(`/api/admin/drives/${selectedDriveId}/placements/offers`, {
        studentId: formData.studentId,
        ctc: parseFloat(formData.ctc),
        role: formData.role
      });
      showToast('Offer recorded successfully');
      closeModal();
      loadOffers();
      loadAllOffers();
    } catch (err: any) {
      showToast(err?.message || 'Failed to record offer', true);
    } finally {
      setSubmitting(false);
    }
  }

  function showToast(msg: string, isError = false) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  function getCtcClass(ctc: number): string {
    if (ctc >= 15) return 'ctc-gold';
    if (ctc >= 10) return 'ctc-high';
    return 'ctc-normal';
  }

  const selectedDrive = drives.find(d => d.id === selectedDriveId);

  // Get student IDs who already have offers
  const studentsWithOffers = new Set(offers.map(o => o.studentId));

  // Filter applicants: only show those who haven't received offers yet
  const availableStudents = applicants.filter(app => !studentsWithOffers.has(app.studentId));

  const companyOfferCounts = allOffers.reduce<Record<string, number>>((acc, offer) => {
    const company = offer.companyName || 'Unknown';
    acc[company] = (acc[company] || 0) + 1;
    return acc;
  }, {});

  return (
    <AdminLayout activeNav="offers" onNavigate={onNavigate}>
      <div className="page-container">
        {toast && (
          <div className={`toast toast-notification ${toast.includes('success') ? 'toast-success' : 'toast-error'}`}>
            {toast}
          </div>
        )}

        <div className="page-header">
          <div>
            <h1 className="page-title">Offer Management</h1>
            <p className="page-subtitle">Record and manage placement offers</p>
          </div>
          <button
            className="btn-primary"
            onClick={openModal}
            disabled={!selectedDriveId || selectedDrive?.status === 'COMPLETED'}
          >
            <Plus size={18} />
            <span>Record Offer</span>
          </button>
        </div>

        {loading && <div className="skeleton" style={{ minHeight: 400 }} />}

        {!loading && (
          <>
            {/* Drive Selector */}
            <div className="card" style={{ padding: '20px 24px', marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-muted)' }}>
                Select Drive
              </label>
              <select
                value={selectedDriveId}
                onChange={(e) => setSelectedDriveId(parseInt(e.target.value))}
                className="drive-select"
              >
                <option value={0}>-- Select a Drive --</option>
                {drives.map(drive => (
                  <option key={drive.id} value={drive.id}>
                    {drive.title} - {drive.companyName} ({drive.status})
                  </option>
                ))}
              </select>
            </div>

            {/* Stats Cards */}
            {selectedDriveId > 0 && !loadingOffers && (
              <div className="stats-grid">
                <div className="stat-card stat-primary">
                  <div className="stat-icon">
                    <Award size={24} />
                  </div>
                  <div className="stat-content">
                    <div className="stat-label">Total Offers</div>
                    <div className="stat-value">{stats.totalOffers}</div>
                  </div>
                </div>

                <div className="stat-card stat-success">
                  <div className="stat-icon">
                    <TrendingUp size={24} />
                  </div>
                  <div className="stat-content">
                    <div className="stat-label">Highest CTC</div>
                    <div className="stat-value">₹{stats.highestCTC.toFixed(1)} LPA</div>
                  </div>
                </div>

                <div className="stat-card stat-info">
                  <div className="stat-icon">
                    <DollarSign size={24} />
                  </div>
                  <div className="stat-content">
                    <div className="stat-label">Average CTC</div>
                    <div className="stat-value">₹{stats.averageCTC.toFixed(1)} LPA</div>
                  </div>
                </div>

                <div className="stat-card stat-warning">
                  <div className="stat-icon">
                    <Lock size={24} />
                  </div>
                  <div className="stat-content">
                    <div className="stat-label">Locked Profiles</div>
                    <div className="stat-value">{stats.lockedProfiles}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Company-wise Offer Summary */}
            {allOffers.length > 0 && (
              <div className="card" style={{ padding: '18px 20px', marginBottom: '20px' }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--text-primary)' }}>
                  Company-wise Offers
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                  {Object.entries(companyOfferCounts).map(([company, count]) => (
                    <div key={company} style={{
                      border: '1px solid var(--border)',
                      borderRadius: 10,
                      padding: '10px 12px',
                      background: '#f8fafc'
                    }}>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{company}</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>{count}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Offers Table */}
            {selectedDriveId > 0 && (
              <>
                {loadingOffers ? (
                  <div className="skeleton" style={{ minHeight: 300 }} />
                ) : (
                  <div className="card table-card">
                    <div className="table-wrapper">
                      <table className="table offers-table">
                        <thead>
                          <tr>
                            <th>Student Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>CTC (LPA)</th>
                            <th>Issued Date</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {offers.length === 0 && (
                            <tr>
                              <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                No offers recorded for this drive yet
                              </td>
                            </tr>
                          )}
                          {offers.map(offer => {
                            const applicant = applicants.find(a => a.studentId === offer.studentId);
                            return (
                              <tr key={offer.id} className="offer-row">
                                <td style={{ fontWeight: 600 }}>
                                  {applicant?.studentName || 'Unknown'}
                                </td>
                                <td>{offer.studentEmail}</td>
                                <td>{offer.role}</td>
                                <td>
                                  <span className={`ctc-badge ${getCtcClass(offer.ctc)}`}>
                                    ₹{offer.ctc.toFixed(1)}
                                  </span>
                                </td>
                                <td>{new Date(offer.issuedAt).toLocaleDateString()}</td>
                                <td>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span className="badge success">Selected</span>
                                    <span className="badge warning" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <Lock size={12} />
                                      Locked
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Record Offer Modal */}
        {showModal && (
          <div className="modal-overlay modal-fade-in" onClick={closeModal}>
            <div className="modal-content modal-scale-in" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Record Placement Offer</h3>
                <button className="icon-btn" onClick={closeModal}>
                  <X size={18} />
                </button>
              </div>

              <div className="modal-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="info-banner">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Award size={16} />
                      <span style={{ fontSize: '13px' }}>
                        Recording an offer will mark the student as placed and lock their profile
                      </span>
                    </div>
                  </div>

                  <label>
                    <span style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>
                      Student <span style={{ color: '#ef4444' }}>*</span>
                    </span>
                    <select
                      value={formData.studentId}
                      onChange={(e) => setFormData({ ...formData, studentId: parseInt(e.target.value) })}
                      style={{ width: '100%' }}
                    >
                      <option value={0}>-- Select Student --</option>
                      {availableStudents.map(student => (
                        <option key={student.studentId} value={student.studentId}>
                          {student.rollNo} - {student.studentName} - {student.departmentName}
                        </option>
                      ))}
                    </select>
                    {availableStudents.length === 0 && !loadingApplicants && (
                      <p style={{ fontSize: '12px', color: '#f59e0b', marginTop: '6px' }}>
                        No students available. Either all students have received offers or no students applied to this drive.
                      </p>
                    )}
                  </label>

                  <label>
                    <span style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>
                      Role <span style={{ color: '#ef4444' }}>*</span>
                    </span>
                    <input
                      type="text"
                      placeholder="e.g. Software Engineer"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    />
                  </label>

                  <label>
                    <span style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>
                      CTC (LPA) <span style={{ color: '#ef4444' }}>*</span>
                    </span>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="e.g. 12.5"
                      value={formData.ctc}
                      onChange={(e) => setFormData({ ...formData, ctc: e.target.value })}
                    />
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button
                  className="btn-primary"
                  onClick={handleRecordOffer}
                  disabled={submitting}
                >
                  {submitting ? 'Recording...' : 'Confirm Offer'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
