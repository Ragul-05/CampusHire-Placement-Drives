import { useEffect, useState } from 'react';
import { Plus, Search, Filter, X, Edit2, Trash2, ExternalLink, RefreshCw } from 'lucide-react';
import '../styles/dashboard.css';
import { getJson, postJson, putJson, deleteJson } from '../utils/api';
import AdminLayout from '../components/AdminLayout';

type Company = {
  id: number;
  name: string;
  website: string;
  industry: string;
  visitHistory: string;
  hiringCount: number;
  createdAt: string;
};

type FormData = {
  name: string;
  website: string;
  industry: string;
  visitHistory: string;
};

export default function CompanyManagement({ onNavigate }: { onNavigate?: (view: any) => void }) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>({ name: '', website: '', industry: '', visitHistory: '' });
  const [submitting, setSubmitting] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');

  const industries = Array.from(new Set(companies.map(c => c.industry).filter(Boolean)));

  useEffect(() => {
    loadCompanies();
  }, []);

  useEffect(() => {
    let result = companies;
    if (searchTerm) result = result.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
    if (industryFilter) result = result.filter(c => c.industry === industryFilter);
    setFilteredCompanies(result);
  }, [companies, searchTerm, industryFilter]);

  async function loadCompanies() {
    try {
      setLoading(true);
      const res = await getJson<Company[]>('/api/admin/companies');
      setCompanies(res.data || []);
      setError('');
    } catch (err: any) {
      setError(err?.message || 'Failed to load companies');
    } finally {
      setLoading(false);
    }
  }

  function openModal(company?: Company) {
    if (company) {
      setEditingId(company.id);
      setFormData({ name: company.name, website: company.website, industry: company.industry, visitHistory: company.visitHistory });
    } else {
      setEditingId(null);
      setFormData({ name: '', website: '', industry: '', visitHistory: '' });
    }
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingId(null);
    setFormData({ name: '', website: '', industry: '', visitHistory: '' });
  }

  async function handleSave() {
    if (!formData.name.trim()) {
      showToast('Company name is required', true);
      return;
    }
    try {
      setSubmitting(true);
      if (editingId) {
        await putJson(`/api/admin/companies/${editingId}`, formData);
        showToast('Company updated successfully');
      } else {
        await postJson('/api/admin/companies', formData);
        showToast('Company added successfully');
      }
      closeModal();
      loadCompanies();
    } catch (err: any) {
      showToast(err?.message || 'Operation failed', true);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this company? This action cannot be undone.')) return;
    try {
      await deleteJson(`/api/admin/companies/${id}`);
      showToast('Company deleted successfully');
      loadCompanies();
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete company', true);
    }
  }

  function showToast(msg: string, isError = false) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  function resetFilters() {
    setSearchTerm('');
    setIndustryFilter('');
  }

  return (
    <AdminLayout activeNav="companies" onNavigate={onNavigate}>
      <div className="page-container">
        {/* Toast */}
        {toast && (
          <div className="toast fade-in" style={{ background: toast.includes('success') ? '#10b981' : '#ef4444' }}>
            {toast}
          </div>
        )}

        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Company Management</h1>
            <p className="page-subtitle">{companies.length} companies registered</p>
          </div>
          <button className="btn-primary" onClick={() => openModal()}>
            <Plus size={18} />
            <span>Add Company</span>
          </button>
        </div>

        {/* Filters */}
        <div className="card filter-section">
          <div className="filter-row">
            <div className="input-group">
              <Search size={16} color="#94a3b8" />
              <input
                placeholder="Search company name…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select value={industryFilter} onChange={(e) => setIndustryFilter(e.target.value)}>
              <option value="">All Industries</option>
              {industries.map(ind => <option key={ind} value={ind}>{ind}</option>)}
            </select>
            <button className="btn-secondary" onClick={resetFilters}>
              <RefreshCw size={16} />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="card table-card">
          {loading && <div className="skeleton" style={{ minHeight: 300 }} />}
          {error && <div style={{ padding: 20, color: '#b91c1c', fontWeight: 600 }}>{error}</div>}
          {!loading && !error && (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Company Name</th>
                    <th>Industry</th>
                    <th>Website</th>
                    <th>Visit History</th>
                    <th>Created Date</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCompanies.length === 0 && (
                    <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No companies found</td></tr>
                  )}
                  {filteredCompanies.map(company => (
                    <tr key={company.id}>
                      <td style={{ fontWeight: 600 }}>{company.name}</td>
                      <td>{company.industry || '–'}</td>
                      <td>
                        {company.website ? (
                          <a href={company.website} target="_blank" rel="noopener noreferrer" className="link-external">
                            {company.website.replace(/^https?:\/\//, '').slice(0, 30)}
                            <ExternalLink size={12} />
                          </a>
                        ) : '–'}
                      </td>
                      <td>{company.visitHistory || '–'}</td>
                      <td>{company.createdAt ? new Date(company.createdAt).toLocaleDateString() : '–'}</td>
                      <td>
                        <div className="action-buttons">
                          <button className="icon-btn edit" onClick={() => openModal(company)} title="Edit">
                            <Edit2 size={14} />
                          </button>
                          <button className="icon-btn delete" onClick={() => handleDelete(company.id)} title="Delete">
                            <Trash2 size={14} />
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

        {/* Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{editingId ? 'Edit Company' : 'Add Company'}</h3>
                <button className="icon-btn" onClick={closeModal}><X size={18} /></button>
              </div>
              <div className="modal-body">
                <label>
                  Company Name <span style={{ color: '#ef4444' }}>*</span>
                  <input
                    type="text"
                    placeholder="e.g. Google Inc."
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </label>
                <label>
                  Industry
                  <input
                    type="text"
                    placeholder="e.g. Technology, Finance"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  />
                </label>
                <label>
                  Website
                  <input
                    type="url"
                    placeholder="https://example.com"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  />
                </label>
                <label>
                  Visit History
                  <textarea
                    placeholder="Describe campus visit history…"
                    rows={3}
                    value={formData.visitHistory}
                    onChange={(e) => setFormData({ ...formData, visitHistory: e.target.value })}
                  />
                </label>
              </div>
              <div className="modal-footer">
                <button className="btn-secondary" onClick={closeModal} disabled={submitting}>Cancel</button>
                <button className="btn-primary" onClick={handleSave} disabled={submitting}>
                  {submitting ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
