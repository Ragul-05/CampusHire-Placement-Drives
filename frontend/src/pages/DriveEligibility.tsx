import { useEffect, useState } from 'react';
import { Save, AlertCircle, X, Plus, Settings } from 'lucide-react';
import '../styles/dashboard.css';
import { getJson, postJson } from '../utils/api';
import AdminLayout from '../components/AdminLayout';

type Drive = {
  id: number;
  title: string;
  companyName: string;
  status: string;
};

type Department = {
  id: number;
  name: string;
  code: string;
};

type EligibilityCriteria = {
  minCgpa?: number;
  minXMarks?: number;
  minXiiMarks?: number;
  maxStandingArrears?: number;
  maxHistoryOfArrears?: number;
  graduationYear?: number;
  requiredSkills?: string[];
  allowedDepartmentIds?: number[];
};

const COMMON_SKILLS = [
  'Java', 'Python', 'JavaScript', 'React', 'Node.js', 'Spring Boot',
  'SQL', 'MongoDB', 'AWS', 'Docker', 'Git', 'Angular', 'Vue.js',
  'C++', 'C#', '.NET', 'Django', 'Flask', 'Machine Learning',
  'Data Science', 'DevOps', 'Kubernetes', 'TypeScript', 'Go'
];

export default function DriveEligibility({ onNavigate }: { onNavigate?: (view: any) => void }) {
  const [drives, setDrives] = useState<Drive[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDriveId, setSelectedDriveId] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingCriteria, setLoadingCriteria] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const [formData, setFormData] = useState<EligibilityCriteria>({
    minCgpa: undefined,
    minXMarks: undefined,
    minXiiMarks: undefined,
    maxStandingArrears: undefined,
    maxHistoryOfArrears: undefined,
    graduationYear: undefined,
    requiredSkills: [],
    allowedDepartmentIds: []
  });

  const [skillInput, setSkillInput] = useState('');
  const [showSkillSuggestions, setShowSkillSuggestions] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedDriveId > 0) {
      loadEligibilityCriteria(selectedDriveId);
    }
  }, [selectedDriveId]);

  async function loadInitialData() {
    try {
      setLoading(true);
      const [drivesRes, departmentsRes] = await Promise.all([
        getJson<Drive[]>('/api/admin/drives'),
        getJson<Department[]>('/api/admin/departments')
      ]);
      setDrives(drivesRes.data || []);
      setDepartments(departmentsRes.data || []);
      setError('');
    } catch (err: any) {
      setError(err?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  async function loadEligibilityCriteria(driveId: number) {
    try {
      setLoadingCriteria(true);
      const response = await getJson<EligibilityCriteria>(`/api/admin/drives/${driveId}/eligibility`);
      const criteria = response.data || {};
      setFormData({
        minCgpa: criteria.minCgpa,
        minXMarks: criteria.minXMarks,
        minXiiMarks: criteria.minXiiMarks,
        maxStandingArrears: criteria.maxStandingArrears,
        maxHistoryOfArrears: criteria.maxHistoryOfArrears,
        graduationYear: criteria.graduationYear,
        requiredSkills: criteria.requiredSkills || [],
        allowedDepartmentIds: criteria.allowedDepartmentIds || []
      });
      setValidationErrors({});
    } catch (err: any) {
      // If no criteria found, reset form
      setFormData({
        minCgpa: undefined,
        minXMarks: undefined,
        minXiiMarks: undefined,
        maxStandingArrears: undefined,
        maxHistoryOfArrears: undefined,
        graduationYear: undefined,
        requiredSkills: [],
        allowedDepartmentIds: []
      });
    } finally {
      setLoadingCriteria(false);
    }
  }

  async function handleSave() {
    if (selectedDriveId === 0) {
      showToast('Please select a drive first', true);
      return;
    }

    // Validate
    const errors: Record<string, string> = {};
    if (formData.minCgpa !== undefined && (formData.minCgpa < 0 || formData.minCgpa > 10)) {
      errors.minCgpa = 'CGPA must be between 0 and 10';
    }
    if (formData.minXMarks !== undefined && (formData.minXMarks < 0 || formData.minXMarks > 100)) {
      errors.minXMarks = 'Marks must be between 0 and 100';
    }
    if (formData.minXiiMarks !== undefined && (formData.minXiiMarks < 0 || formData.minXiiMarks > 100)) {
      errors.minXiiMarks = 'Marks must be between 0 and 100';
    }
    if (formData.maxStandingArrears !== undefined && formData.maxStandingArrears < 0) {
      errors.maxStandingArrears = 'Cannot be negative';
    }
    if (formData.maxHistoryOfArrears !== undefined && formData.maxHistoryOfArrears < 0) {
      errors.maxHistoryOfArrears = 'Cannot be negative';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      showToast('Please fix validation errors', true);
      return;
    }

    try {
      setSaving(true);
      await postJson(`/api/admin/drives/${selectedDriveId}/eligibility`, formData);
      showToast('Eligibility criteria saved successfully');
      setValidationErrors({});
    } catch (err: any) {
      showToast(err?.message || 'Failed to save eligibility criteria', true);
    } finally {
      setSaving(false);
    }
  }

  function showToast(msg: string, isError = false) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  function handleNumberChange(field: keyof EligibilityCriteria, value: string) {
    const numValue = value === '' ? undefined : parseFloat(value);
    setFormData({ ...formData, [field]: numValue });
    // Clear validation error for this field
    if (validationErrors[field]) {
      const newErrors = { ...validationErrors };
      delete newErrors[field];
      setValidationErrors(newErrors);
    }
  }

  function addSkill(skill: string) {
    const trimmedSkill = skill.trim();
    if (trimmedSkill && !formData.requiredSkills?.includes(trimmedSkill)) {
      setFormData({
        ...formData,
        requiredSkills: [...(formData.requiredSkills || []), trimmedSkill]
      });
      setSkillInput('');
      setShowSkillSuggestions(false);
    }
  }

  function removeSkill(skill: string) {
    setFormData({
      ...formData,
      requiredSkills: formData.requiredSkills?.filter(s => s !== skill) || []
    });
  }

  function handleSkillInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && skillInput.trim()) {
      e.preventDefault();
      addSkill(skillInput);
    }
  }

  function toggleDepartment(deptId: number) {
    const current = formData.allowedDepartmentIds || [];
    if (current.includes(deptId)) {
      setFormData({
        ...formData,
        allowedDepartmentIds: current.filter(id => id !== deptId)
      });
    } else {
      setFormData({
        ...formData,
        allowedDepartmentIds: [...current, deptId]
      });
    }
  }

  const filteredSkills = COMMON_SKILLS.filter(
    skill => skill.toLowerCase().includes(skillInput.toLowerCase()) &&
      !formData.requiredSkills?.includes(skill)
  );

  const selectedDrive = drives.find(d => d.id === selectedDriveId);
  const canEdit = selectedDrive?.status === 'UPCOMING';
  const [showModal, setShowModal] = useState(false);

  function openModal(driveId: number) {
    setSelectedDriveId(driveId);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setSelectedDriveId(0);
    setFormData({
      minCgpa: undefined,
      minXMarks: undefined,
      minXiiMarks: undefined,
      maxStandingArrears: undefined,
      maxHistoryOfArrears: undefined,
      graduationYear: undefined,
      requiredSkills: [],
      allowedDepartmentIds: []
    });
  }

  async function handleSaveAndClose() {
    await handleSave();
    if (Object.keys(validationErrors).length === 0) {
      closeModal();
    }
  }

  return (
    <AdminLayout activeNav="eligibility" onNavigate={onNavigate}>
      <div className="page-container">
        {toast && (
          <div className={`toast toast-notification ${toast.includes('success') ? 'toast-success' : 'toast-error'}`}>
            {toast}
          </div>
        )}

        <div className="page-header">
          <div>
            <h1 className="page-title">Drive Eligibility Management</h1>
            <p className="page-subtitle">Configure eligibility criteria for placement drives</p>
          </div>
        </div>

        {loading && <div className="skeleton" style={{ minHeight: 400 }} />}

        {error && (
          <div className="card" style={{ padding: '20px', color: '#b91c1c', fontWeight: 600 }}>
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="card table-card">
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Drive Title</th>
                    <th>Company</th>
                    <th>Status</th>
                    <th>Created Date</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {drives.length === 0 && (
                    <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No drives found</td></tr>
                  )}
                  {drives.map(drive => (
                    <tr key={drive.id}>
                      <td style={{ fontWeight: 600 }}>{drive.title}</td>
                      <td>{drive.companyName}</td>
                      <td>
                        <span className={`badge ${
                          drive.status === 'UPCOMING' ? 'info' :
                          drive.status === 'ONGOING' ? 'success' : 'warning'
                        }`}>{drive.status}</span>
                      </td>
                      <td>{new Date().toLocaleDateString()}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-secondary btn-sm"
                            onClick={() => openModal(drive.id)}
                            title="Configure Eligibility"
                          >
                            <Settings size={14} />
                            <span>Configure</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Compact Eligibility Modal */}
        {showModal && selectedDriveId > 0 && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content eligibility-modal-compact" onClick={(e) => e.stopPropagation()}>
              {loadingCriteria ? (
                <div className="skeleton" style={{ minHeight: 300 }} />
              ) : (
                <>
                  <div className="modal-header">
                    <div>
                      <h3>Set Eligibility Criteria</h3>
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                        {selectedDrive?.title} - {selectedDrive?.companyName}
                      </p>
                    </div>
                    <button className="icon-btn" onClick={closeModal}><X size={18} /></button>
                  </div>

                  {!canEdit && (
                    <div className="warning-banner" style={{ margin: '0 0 16px 0' }}>
                      <div className="warning-content">
                        <AlertCircle size={16} />
                        <span style={{ fontSize: '13px' }}>Only UPCOMING drives can be modified</span>
                      </div>
                    </div>
                  )}

                  <div className="modal-body compact-form">
                    <div className="compact-form-grid">
                      {/* Academic Section */}
                      <div className="compact-section">
                        <h4 className="compact-section-title">Academic Criteria</h4>
                        <div className="compact-fields">
                          <label className="compact-field">
                            <span>Min CGPA</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max="10"
                              placeholder="7.5"
                              value={formData.minCgpa ?? ''}
                              onChange={(e) => handleNumberChange('minCgpa', e.target.value)}
                              disabled={!canEdit}
                            />
                          </label>
                          <label className="compact-field">
                            <span>Min 10th %</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              placeholder="75"
                              value={formData.minXMarks ?? ''}
                              onChange={(e) => handleNumberChange('minXMarks', e.target.value)}
                              disabled={!canEdit}
                            />
                          </label>
                          <label className="compact-field">
                            <span>Min 12th %</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              placeholder="75"
                              value={formData.minXiiMarks ?? ''}
                              onChange={(e) => handleNumberChange('minXiiMarks', e.target.value)}
                              disabled={!canEdit}
                            />
                          </label>
                        </div>
                      </div>

                      {/* Arrears Section */}
                      <div className="compact-section">
                        <h4 className="compact-section-title">Arrears & Year</h4>
                        <div className="compact-fields">
                          <label className="compact-field">
                            <span>Max Standing</span>
                            <input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={formData.maxStandingArrears ?? ''}
                              onChange={(e) => handleNumberChange('maxStandingArrears', e.target.value)}
                              disabled={!canEdit}
                            />
                          </label>
                          <label className="compact-field">
                            <span>Max History</span>
                            <input
                              type="number"
                              min="0"
                              placeholder="2"
                              value={formData.maxHistoryOfArrears ?? ''}
                              onChange={(e) => handleNumberChange('maxHistoryOfArrears', e.target.value)}
                              disabled={!canEdit}
                            />
                          </label>
                          <label className="compact-field">
                            <span>Grad Year</span>
                            <input
                              type="number"
                              min="2020"
                              max="2030"
                              placeholder="2024"
                              value={formData.graduationYear ?? ''}
                              onChange={(e) => handleNumberChange('graduationYear', e.target.value)}
                              disabled={!canEdit}
                            />
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Departments */}
                    <div className="compact-section full-width">
                      <h4 className="compact-section-title">Allowed Departments</h4>
                      <div className="department-chips-compact">
                        {departments.map(dept => (
                          <label key={dept.id} className="department-chip-compact">
                            <input
                              type="checkbox"
                              checked={formData.allowedDepartmentIds?.includes(dept.id)}
                              onChange={() => toggleDepartment(dept.id)}
                              disabled={!canEdit}
                            />
                            <span>{dept.code}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Skills */}
                    <div className="compact-section full-width">
                      <h4 className="compact-section-title">Required Skills</h4>
                      <div className="skill-input-compact">
                        <input
                          type="text"
                          placeholder="Type to add skills..."
                          value={skillInput}
                          onChange={(e) => {
                            setSkillInput(e.target.value);
                            setShowSkillSuggestions(e.target.value.length > 0);
                          }}
                          onKeyDown={handleSkillInputKeyDown}
                          onFocus={() => setShowSkillSuggestions(skillInput.length > 0)}
                          disabled={!canEdit}
                        />
                        {skillInput && canEdit && (
                          <button
                            className="add-skill-btn-compact"
                            onClick={() => addSkill(skillInput)}
                            type="button"
                          >
                            <Plus size={14} />
                          </button>
                        )}
                        {showSkillSuggestions && filteredSkills.length > 0 && canEdit && (
                          <div className="skill-suggestions-compact">
                            {filteredSkills.slice(0, 6).map(skill => (
                              <button
                                key={skill}
                                className="skill-suggestion-item"
                                onClick={() => addSkill(skill)}
                                type="button"
                              >
                                {skill}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="skill-tags-compact">
                        {formData.requiredSkills && formData.requiredSkills.length > 0 ? (
                          formData.requiredSkills.map(skill => (
                            <span key={skill} className="skill-tag-compact">
                              {skill}
                              {canEdit && (
                                <button
                                  onClick={() => removeSkill(skill)}
                                  className="remove-skill-btn"
                                  type="button"
                                >
                                  <X size={12} />
                                </button>
                              )}
                            </span>
                          ))
                        ) : (
                          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No skills added</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button className="btn-secondary" onClick={closeModal}>
                      Cancel
                    </button>
                    {canEdit && (
                      <button className="btn-primary" onClick={handleSaveAndClose} disabled={saving}>
                        {saving ? 'Saving...' : 'Save Criteria'}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
