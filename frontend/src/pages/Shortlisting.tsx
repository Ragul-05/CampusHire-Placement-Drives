import { useEffect, useState } from 'react';
import { Download, Filter, Search, CheckSquare, X, Users } from 'lucide-react';
import '../styles/dashboard.css';
import { getJson, postJson } from '../utils/api';
import AdminLayout from '../components/AdminLayout';

type Drive = {
  id: number;
  title: string;
  companyName: string;
  status: string;
};

type Applicant = {
  id: number;
  studentId: number;
  studentName: string;
  rollNo: string;
  departmentName: string;
  cgpa: number;
  stage: string;
  isEligible?: boolean;
  standingArrears?: number;
};

type Department = {
  id: number;
  name: string;
  code: string;
};

export default function Shortlisting({ onNavigate }: { onNavigate?: (view: any) => void }) {
  const [drives, setDrives] = useState<Drive[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDriveId, setSelectedDriveId] = useState<number>(0);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [filteredApplicants, setFilteredApplicants] = useState<Applicant[]>([]);
  const [selectedApplicants, setSelectedApplicants] = useState<Set<number>>(new Set());

  const [loading, setLoading] = useState(true);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [toast, setToast] = useState('');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [cgpaRange, setCgpaRange] = useState<[number, number]>([0, 10]);
  const [selectedDept, setSelectedDept] = useState('');
  const [showFilters, setShowFilters] = useState(true);
  const [sortField, setSortField] = useState<'name' | 'cgpa' | 'dept'>('cgpa');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedDriveId > 0) {
      loadApplicants();
    }
  }, [selectedDriveId]);

  useEffect(() => {
    applyFilters();
  }, [applicants, searchTerm, cgpaRange, selectedDept, sortField, sortOrder]);

  async function loadInitialData() {
    try {
      setLoading(true);
      const [drivesRes, deptRes] = await Promise.all([
        getJson<Drive[]>('/api/admin/drives'),
        getJson<Department[]>('/api/admin/departments')
      ]);
      setDrives(drivesRes.data || []);
      setDepartments(deptRes.data || []);
    } catch (err: any) {
      showToast(err?.message || 'Failed to load data', true);
    } finally {
      setLoading(false);
    }
  }

  async function loadApplicants() {
    try {
      setLoadingApplicants(true);
      const response = await getJson<Applicant[]>(`/api/admin/drives/${selectedDriveId}/shortlist/eligible`);
      const applicantsData = (response.data || []).map(app => ({
        ...app,
        isEligible: true, // Backend returns only eligible ones
        standingArrears: 0 // Mock data
      }));
      setApplicants(applicantsData);
      setSelectedApplicants(new Set());
    } catch (err: any) {
      showToast(err?.message || 'Failed to load applicants', true);
      setApplicants([]);
    } finally {
      setLoadingApplicants(false);
    }
  }

  function applyFilters() {
    let filtered = [...applicants];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(app =>
        app.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.rollNo.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // CGPA filter
    filtered = filtered.filter(app =>
      app.cgpa >= cgpaRange[0] && app.cgpa <= cgpaRange[1]
    );

    // Department filter
    if (selectedDept) {
      filtered = filtered.filter(app => app.departmentName === selectedDept);
    }

    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.studentName.localeCompare(b.studentName);
          break;
        case 'cgpa':
          comparison = a.cgpa - b.cgpa;
          break;
        case 'dept':
          comparison = a.departmentName.localeCompare(b.departmentName);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredApplicants(filtered);
  }

  function toggleSelection(applicantId: number) {
    const newSelection = new Set(selectedApplicants);
    if (newSelection.has(applicantId)) {
      newSelection.delete(applicantId);
    } else {
      newSelection.add(applicantId);
    }
    setSelectedApplicants(newSelection);
  }

  function toggleSelectAll() {
    if (selectedApplicants.size === filteredApplicants.length) {
      setSelectedApplicants(new Set());
    } else {
      setSelectedApplicants(new Set(filteredApplicants.map(a => a.id)));
    }
  }

  async function handleGenerateShortlist() {
    if (selectedApplicants.size === 0) {
      showToast('Please select at least one applicant', true);
      return;
    }

    try {
      setGenerating(true);
      const selectedIds = Array.from(selectedApplicants);
      await postJson(`/api/admin/drives/${selectedDriveId}/shortlist/generate`, {
        applicationIds: selectedIds
      });
      showToast(`Shortlist generated for ${selectedIds.length} applicants`);
      loadApplicants(); // Reload
    } catch (err: any) {
      showToast(err?.message || 'Failed to generate shortlist', true);
    } finally {
      setGenerating(false);
    }
  }

  function handleDownloadCSV() {
    if (filteredApplicants.length === 0) {
      showToast('No data to download', true);
      return;
    }

    const csv = [
      ['Name', 'Roll No', 'Department', 'CGPA', 'Arrears', 'Status'],
      ...filteredApplicants.map(app => [
        app.studentName,
        app.rollNo,
        app.departmentName,
        app.cgpa,
        app.standingArrears || 0,
        app.isEligible ? 'Eligible' : 'Not Eligible'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shortlist_${selectedDriveId}_${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    showToast('CSV downloaded successfully');
  }

  function showToast(msg: string, isError = false) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  function handleSort(field: 'name' | 'cgpa' | 'dept') {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  }

  const selectedDrive = drives.find(d => d.id === selectedDriveId);

  return (
    <AdminLayout activeNav="shortlisting" onNavigate={onNavigate}>
      <div className="page-container">
        {toast && (
          <div className={`toast toast-notification ${toast.includes('success') ? 'toast-success' : 'toast-error'}`}>
            {toast}
          </div>
        )}

        <div className="page-header">
          <div>
            <h1 className="page-title">Shortlisting & Selection</h1>
            <p className="page-subtitle">Review and shortlist eligible candidates</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn-secondary" onClick={handleDownloadCSV} disabled={!selectedDriveId}>
              <Download size={18} />
              <span>Download CSV</span>
            </button>
            <button
              className="btn-primary"
              onClick={handleGenerateShortlist}
              disabled={!selectedDriveId || selectedApplicants.size === 0 || generating}
            >
              <CheckSquare size={18} />
              <span>{generating ? 'Generating...' : 'Generate Shortlist'}</span>
            </button>
          </div>
        </div>

        {loading && <div className="skeleton" style={{ minHeight: 400 }} />}

        {!loading && (
          <>
            {/* Drive Selector */}
            <div className="card shortlist-controls">
              <div className="shortlist-header">
                <div style={{ flex: 1 }}>
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
                <button
                  className="filter-toggle-btn"
                  onClick={() => setShowFilters(!showFilters)}
                  title={showFilters ? 'Hide Filters' : 'Show Filters'}
                >
                  <Filter size={18} />
                  <span>{showFilters ? 'Hide' : 'Show'} Filters</span>
                </button>
              </div>

              {/* Filters Section */}
              {showFilters && selectedDriveId > 0 && (
                <div className="filters-panel">
                  <div className="filter-item">
                    <label>Search Student</label>
                    <div className="input-group">
                      <Search size={16} color="#94a3b8" />
                      <input
                        placeholder="Name or roll number..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="filter-item">
                    <label>CGPA Range: {cgpaRange[0].toFixed(1)} - {cgpaRange[1].toFixed(1)}</label>
                    <div className="range-slider-container">
                      <input
                        type="range"
                        min="0"
                        max="10"
                        step="0.1"
                        value={cgpaRange[0]}
                        onChange={(e) => setCgpaRange([parseFloat(e.target.value), cgpaRange[1]])}
                        className="range-slider"
                      />
                      <input
                        type="range"
                        min="0"
                        max="10"
                        step="0.1"
                        value={cgpaRange[1]}
                        onChange={(e) => setCgpaRange([cgpaRange[0], parseFloat(e.target.value)])}
                        className="range-slider"
                      />
                    </div>
                  </div>

                  <div className="filter-item">
                    <label>Department</label>
                    <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)}>
                      <option value="">All Departments</option>
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.name}>{dept.name}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    className="btn-secondary btn-sm"
                    onClick={() => {
                      setSearchTerm('');
                      setCgpaRange([0, 10]);
                      setSelectedDept('');
                    }}
                  >
                    Reset Filters
                  </button>
                </div>
              )}
            </div>

            {/* Applicants Table */}
            {selectedDriveId > 0 && (
              <>
                {loadingApplicants ? (
                  <div className="skeleton" style={{ minHeight: 300 }} />
                ) : (
                  <div className="card table-card">
                    {filteredApplicants.length > 0 && (
                      <div className="table-header-row">
                        <div className="table-info">
                          <Users size={16} />
                          <span>{filteredApplicants.length} eligible candidates</span>
                        </div>
                        <div className="sort-controls">
                          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Sort by:</span>
                          <button
                            className={`sort-btn ${sortField === 'name' ? 'active' : ''}`}
                            onClick={() => handleSort('name')}
                          >
                            Name {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                          </button>
                          <button
                            className={`sort-btn ${sortField === 'cgpa' ? 'active' : ''}`}
                            onClick={() => handleSort('cgpa')}
                          >
                            CGPA {sortField === 'cgpa' && (sortOrder === 'asc' ? '↑' : '↓')}
                          </button>
                          <button
                            className={`sort-btn ${sortField === 'dept' ? 'active' : ''}`}
                            onClick={() => handleSort('dept')}
                          >
                            Dept {sortField === 'dept' && (sortOrder === 'asc' ? '↑' : '↓')}
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="table-wrapper">
                      <table className="table shortlist-table">
                        <thead>
                          <tr>
                            <th style={{ width: '40px' }}>
                              <input
                                type="checkbox"
                                checked={selectedApplicants.size === filteredApplicants.length && filteredApplicants.length > 0}
                                onChange={toggleSelectAll}
                                className="checkbox-input"
                              />
                            </th>
                            <th>Student Name</th>
                            <th>Roll No</th>
                            <th>Department</th>
                            <th>CGPA</th>
                            <th>Arrears</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredApplicants.length === 0 && (
                            <tr>
                              <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                {applicants.length === 0 ? 'No applicants found for this drive' : 'No applicants match the selected filters'}
                              </td>
                            </tr>
                          )}
                          {filteredApplicants.map(applicant => (
                            <tr
                              key={applicant.id}
                              className={`applicant-row ${selectedApplicants.has(applicant.id) ? 'selected' : ''} ${applicant.isEligible ? 'eligible' : ''}`}
                              onClick={() => toggleSelection(applicant.id)}
                            >
                              <td>
                                <input
                                  type="checkbox"
                                  checked={selectedApplicants.has(applicant.id)}
                                  onChange={() => toggleSelection(applicant.id)}
                                  className="checkbox-input"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </td>
                              <td style={{ fontWeight: 600 }}>{applicant.studentName}</td>
                              <td>{applicant.rollNo}</td>
                              <td>{applicant.departmentName}</td>
                              <td>
                                <span className="cgpa-badge">{applicant.cgpa.toFixed(2)}</span>
                              </td>
                              <td>{applicant.standingArrears || 0}</td>
                              <td>
                                <span className={`badge ${applicant.isEligible ? 'success' : 'warning'}`}>
                                  {applicant.isEligible ? 'Eligible' : 'Not Eligible'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Bottom Action Bar */}
                    {filteredApplicants.length > 0 && (
                      <div className="shortlist-footer">
                        <div className="selected-count">
                          <CheckSquare size={18} />
                          <span><strong>{selectedApplicants.size}</strong> of {filteredApplicants.length} selected</span>
                        </div>
                        <button
                          className="btn-primary"
                          onClick={handleGenerateShortlist}
                          disabled={selectedApplicants.size === 0 || generating}
                        >
                          {generating ? 'Generating...' : `Confirm Shortlist (${selectedApplicants.size})`}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
