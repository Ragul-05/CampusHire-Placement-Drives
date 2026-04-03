import { useEffect, useRef, useState } from 'react';
import { Plus, Search, X, Edit2, Eye, RefreshCw, ChevronDown } from 'lucide-react';
import '../styles/dashboard.css';
import { getJson, postJson, putJson, patchJson } from '../utils/api';
import AdminLayout from '../components/AdminLayout';
import FacultyLayout from '../components/FacultyLayout';

type Drive = {
  id: number;
  companyId: number;
  companyName: string;
  title: string;
  role: string;
  ctcLpa: number;
  description?: string;
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED';
  createdAt: string;
  applicationDeadline?: string | null;
  totalOpenings?: number | null;
};

type Company = {
  id: number;
  name: string;
};

type FormData = {
  companyId: number;
  title: string;
  role: string;
  ctcLpa: number | string;
  description: string;
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED';
  applicationDeadline: string;
  totalOpenings: number | string;
};

export default function DriveManagement({ onNavigate }: { onNavigate?: (view: any) => void }) {
  const [drives, setDrives] = useState<Drive[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredDrives, setFilteredDrives] = useState<Drive[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>({
    companyId: 0,
    title: '',
    role: '',
    ctcLpa: '',
    description: '',
    status: 'UPCOMING',
    applicationDeadline: '',
    totalOpenings: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [openStatusId, setOpenStatusId] = useState<number | null>(null);
  const statusMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let result = drives;
    if (searchTerm) result = result.filter(d => d.title.toLowerCase().includes(searchTerm.toLowerCase()));
    if (statusFilter) result = result.filter(d => d.status === statusFilter);
    if (companyFilter) result = result.filter(d => d.companyId === parseInt(companyFilter));
    setFilteredDrives(result);
  }, [drives, searchTerm, statusFilter, companyFilter]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (statusMenuRef.current && !statusMenuRef.current.contains(event.target as Node)) {
        setOpenStatusId(null);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpenStatusId(null);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [drivesRes, companiesRes] = await Promise.all([
        getJson<Drive[]>('/api/admin/drives'),
        getJson<Company[]>('/api/admin/companies')
      ]);
      setDrives(drivesRes.data || []);
      setCompanies(companiesRes.data || []);
      setError('');
    } catch (err: any) {
      setError(err?.message || 'Failed to load drives');
    } finally {
      setLoading(false);
    }
  }

  function openModal(drive?: Drive, viewOnly = false) {
    if (drive) {
      setEditingId(drive.id);
      setFormData({
        companyId: drive.companyId,
        title: drive.title,
        role: drive.role,
        ctcLpa: drive.ctcLpa,
        description: drive.description || '',
        status: drive.status,
        applicationDeadline: drive.applicationDeadline ? drive.applicationDeadline.slice(0, 16) : '',
        totalOpenings: drive.totalOpenings ?? ''
      });
      setViewMode(viewOnly);
    } else {
      setEditingId(null);
      setFormData({ companyId: 0, title: '', role: '', ctcLpa: '', description: '', status: 'UPCOMING', applicationDeadline: '', totalOpenings: '' });
      setViewMode(false);
    }
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingId(null);
    setViewMode(false);
    setFormData({ companyId: 0, title: '', role: '', ctcLpa: '', description: '', status: 'UPCOMING', applicationDeadline: '', totalOpenings: '' });
  }

  async function handleSave() {
    if (!formData.title.trim() || !formData.role.trim() || !formData.ctcLpa || formData.companyId === 0) {
      showToast('Please fill all required fields', true);
      return;
    }
    try {
      setSubmitting(true);
      const payload = {
        ...formData,
        ctcLpa: parseFloat(formData.ctcLpa.toString()),
        totalOpenings: formData.totalOpenings ? parseInt(formData.totalOpenings.toString(), 10) : null,
        applicationDeadline: formData.applicationDeadline || null
      };
      if (editingId) {
        await putJson(`/api/admin/drives/${editingId}`, payload);
        showToast('Drive updated successfully');
      } else {
        await postJson('/api/admin/drives', payload);
        showToast('Drive created successfully');
      }
      closeModal();
      loadData();
    } catch (err: any) {
      showToast(err?.message || 'Operation failed', true);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusChange(id: number, newStatus: string) {
    try {
      await patchJson(`/api/admin/drives/${id}/status?status=${newStatus}`);
      showToast('Drive status updated successfully');
      loadData();
    } catch (err: any) {
      showToast(err?.message || 'Failed to update status', true);
    }
  }

  function showToast(msg: string, isError = false) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  function resetFilters() {
    setSearchTerm('');
    setStatusFilter('');
    setCompanyFilter('');
    setOpenStatusId(null);
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'UPCOMING': return 'info';
      case 'ONGOING': return 'success';
      case 'COMPLETED': return 'warning';
      default: return 'info';
    }
  }

  // Determine which layout to use based on user role
  const userRole = localStorage.getItem('role');
  const Layout = userRole === 'FACULTY' ? FacultyLayout : AdminLayout;
  const layoutActiveNav = userRole === 'FACULTY' ? 'drives' : 'drives';

  return (
    <Layout activeNav={layoutActiveNav} onNavigate={onNavigate}>
      <div className="page-container">
        {toast && (
          <div className="toast fade-in" style={{ background: toast.includes('success') ? '#10b981' : '#ef4444' }}>
            {toast}
          </div>
        )}

        <div className="page-header">
          <div>
            <h1 className="page-title">Placement Drives</h1>
            <p className="page-subtitle">{drives.length} drives registered</p>
          </div>
          <button className="btn-primary" onClick={() => openModal()}>
            <Plus size={18} />
            <span>Create Drive</span>
          </button>
        </div>

        <div className="card filter-section">
          <div className="filter-row">
            <div className="input-group">
              <Search size={16} color="#94a3b8" />
              <input
                placeholder="Search drive title…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="UPCOMING">Upcoming</option>
              <option value="ONGOING">Ongoing</option>
              <option value="COMPLETED">Completed</option>
            </select>
            <select value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)}>
              <option value="">All Companies</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button className="btn-secondary" onClick={resetFilters}>
              <RefreshCw size={16} />
              <span>Reset</span>
            </button>
          </div>
        </div>

        <div className="card table-card drive-table-card">
          {loading && <div className="skeleton" style={{ minHeight: 300 }} />}
          {error && <div style={{ padding: 20, color: '#b91c1c', fontWeight: 600 }}>{error}</div>}
          {!loading && !error && (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Drive Title</th>
                    <th>Company</th>
                    <th>Role</th>
                    <th>CTC (LPA)</th>
                    <th>Status</th>
                    <th>Created Date</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDrives.length === 0 && (
                    <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No drives found</td></tr>
                  )}
                  {filteredDrives.map(drive => (
                    <tr key={drive.id}>
                      <td style={{ fontWeight: 600 }}>{drive.title}</td>
                      <td>{drive.companyName}</td>
                      <td>{drive.role}</td>
                      <td>{drive.ctcLpa} LPA</td>
                      <td>
                        <div
                          className="status-dropdown"
                          ref={openStatusId === drive.id ? statusMenuRef : null}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className={`badge ${getStatusColor(drive.status)}`}>{drive.status}</span>
                          {drive.status !== 'COMPLETED' && (
                            <div className="status-menu">
                              <button
                                type="button"
                                className="status-toggle"
                                aria-label={`Change status for ${drive.title}`}
                                aria-expanded={openStatusId === drive.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenStatusId((current) => current === drive.id ? null : drive.id);
                                }}
                              >
                                <ChevronDown size={14} />
                              </button>
                              <div className={`status-options ${openStatusId === drive.id ? 'open' : ''}`}>
                                {['UPCOMING', 'ONGOING', 'COMPLETED'].filter(s => s !== drive.status).map(s => (
                                  <button
                                    key={s}
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenStatusId(null);
                                      handleStatusChange(drive.id, s);
                                    }}
                                  >
                                    {s}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td>{drive.createdAt ? new Date(drive.createdAt).toLocaleDateString() : '–'}</td>
                      <td>
                        <div className="action-buttons" onClick={(e) => e.stopPropagation()}>
                          <button className="icon-btn view" type="button" onClick={() => openModal(drive, true)} title="View">
                            <Eye size={14} />
                          </button>
                          <button className="icon-btn edit" type="button" onClick={() => openModal(drive)} title="Edit">
                            <Edit2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{viewMode ? 'View Drive' : editingId ? 'Edit Drive' : 'Create Drive'}</h3>
                <button className="icon-btn" onClick={closeModal}><X size={18} /></button>
              </div>
              <div className="modal-body">
                <div className="form-grid">
                  <label className="form-col-2">
                    Company <span style={{ color: '#ef4444' }}>*</span>
                    <select
                      value={formData.companyId}
                      onChange={(e) => setFormData({ ...formData, companyId: parseInt(e.target.value) })}
                      disabled={viewMode}
                    >
                      <option value={0}>Select Company</option>
                      {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </label>
                  <label>
                    Drive Title <span style={{ color: '#ef4444' }}>*</span>
                    <input
                      type="text"
                      placeholder="e.g. Campus Drive 2024"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      disabled={viewMode}
                    />
                  </label>
                  <label>
                    Role <span style={{ color: '#ef4444' }}>*</span>
                    <input
                      type="text"
                      placeholder="e.g. Software Engineer"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      disabled={viewMode}
                    />
                  </label>
                  <label>
                    CTC (LPA) <span style={{ color: '#ef4444' }}>*</span>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 12.5"
                      value={formData.ctcLpa}
                      onChange={(e) => setFormData({ ...formData, ctcLpa: e.target.value })}
                      disabled={viewMode}
                    />
                  </label>
                  <label>
                    Status
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      disabled={viewMode}
                    >
                      <option value="UPCOMING">Upcoming</option>
                      <option value="ONGOING">Ongoing</option>
                      <option value="COMPLETED">Completed</option>
                    </select>
                  </label>
                  <label>
                    Application Deadline
                    <input
                      type="datetime-local"
                      value={formData.applicationDeadline}
                      onChange={(e) => setFormData({ ...formData, applicationDeadline: e.target.value })}
                      disabled={viewMode}
                    />
                  </label>
                  <label>
                    Total Openings
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 25"
                      value={formData.totalOpenings}
                      onChange={(e) => setFormData({ ...formData, totalOpenings: e.target.value })}
                      disabled={viewMode}
                    />
                  </label>
                  <label className="form-col-2">
                    Description
                    <textarea
                      placeholder="Describe the drive details…"
                      rows={4}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      disabled={viewMode}
                    />
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-secondary" onClick={closeModal}>
                  {viewMode ? 'Close' : 'Cancel'}
                </button>
                {!viewMode && (
                  <button className="btn-primary" onClick={handleSave} disabled={submitting}>
                    {submitting ? 'Saving…' : 'Save'}
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
