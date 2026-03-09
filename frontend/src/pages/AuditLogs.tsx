import { useEffect, useState } from 'react';
import { Search, Download, ChevronDown, ChevronUp, Shield } from 'lucide-react';
import '../styles/dashboard.css';
import { getJson } from '../utils/api';
import AdminLayout from '../components/AdminLayout';
import FacultyLayout from '../components/FacultyLayout';

type AuditLog = {
  id: number;
  action: string;
  userEmail: string;
  targetEntity: string;
  targetId: number;
  ipAddress: string;
  timestamp: string;
  details?: string;
};

export default function AuditLogs({ onNavigate }: { onNavigate?: (view: any) => void }) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 20;

  useEffect(() => {
    loadLogs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [logs, searchTerm]);

  async function loadLogs() {
    try {
      setLoading(true);
      const response = await getJson<AuditLog[]>('/api/admin/audit?query=');
      setLogs(response.data || []);
    } catch (err: any) {
      console.error('Failed to load audit logs', err);
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    let filtered = [...logs];

    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.targetEntity.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredLogs(filtered);
    setCurrentPage(1);
  }

  function getActionBadgeClass(action: string): string {
    if (action.includes('CREATE') || action.includes('ADD')) return 'success';
    if (action.includes('DELETE') || action.includes('REMOVE')) return 'danger';
    if (action.includes('UPDATE') || action.includes('EDIT')) return 'warning';
    if (action.includes('LOCK')) return 'info';
    return 'info';
  }

  function exportLogs() {
    const csv = [
      ['Action', 'User', 'Entity', 'Target ID', 'IP Address', 'Timestamp'],
      ...filteredLogs.map(log => [
        log.action,
        log.userEmail,
        log.targetEntity,
        log.targetId,
        log.ipAddress,
        new Date(log.timestamp).toLocaleString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_logs_${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  // Pagination
  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog);
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);

  // Determine which layout to use based on user role
  const userRole = localStorage.getItem('role');
  const Layout = userRole === 'FACULTY' ? FacultyLayout : AdminLayout;
  const layoutActiveNav = userRole === 'FACULTY' ? 'reports' : 'reports';

  return (
    <Layout activeNav={layoutActiveNav} onNavigate={onNavigate}>
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1 className="page-title">Audit Logs</h1>
            <p className="page-subtitle">System activity and security logs</p>
          </div>
          <button className="btn-secondary" onClick={exportLogs} disabled={filteredLogs.length === 0}>
            <Download size={18} />
            <span>Export Logs</span>
          </button>
        </div>

        {loading && <div className="skeleton" style={{ minHeight: 400 }} />}

        {!loading && (
          <>
            {/* Search */}
            <div className="card filter-section">
              <div className="filter-row">
                <div className="input-group" style={{ flex: 1 }}>
                  <Search size={16} color="#94a3b8" />
                  <input
                    placeholder="Search by action, user, or entity..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="audit-count">
                  <Shield size={16} />
                  <span>{filteredLogs.length} logs found</span>
                </div>
              </div>
            </div>

            {/* Audit Table */}
            <div className="card table-card">
              <div className="table-wrapper">
                <table className="table audit-table">
                  <thead className="sticky-header">
                    <tr>
                      <th>Action</th>
                      <th>User</th>
                      <th>Target Entity</th>
                      <th>Target ID</th>
                      <th>IP Address</th>
                      <th>Timestamp</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentLogs.length === 0 && (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                          No audit logs found
                        </td>
                      </tr>
                    )}
                    {currentLogs.map(log => (
                      <>
                        <tr
                          key={log.id}
                          className={`audit-row ${expandedRow === log.id ? 'expanded' : ''}`}
                          onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}
                        >
                          <td>
                            <span className={`badge ${getActionBadgeClass(log.action)}`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="user-cell">{log.userEmail}</td>
                          <td>{log.targetEntity}</td>
                          <td><span className="id-badge">#{log.targetId}</span></td>
                          <td className="ip-cell">{log.ipAddress}</td>
                          <td className="timestamp-cell">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td>
                            <button className="icon-btn expand">
                              {expandedRow === log.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                          </td>
                        </tr>
                        {expandedRow === log.id && (
                          <tr className="expanded-details">
                            <td colSpan={7}>
                              <div className="audit-details">
                                <div className="detail-grid">
                                  <div className="detail-item">
                                    <span className="detail-label">Action</span>
                                    <span className="detail-value">{log.action}</span>
                                  </div>
                                  <div className="detail-item">
                                    <span className="detail-label">User Email</span>
                                    <span className="detail-value">{log.userEmail}</span>
                                  </div>
                                  <div className="detail-item">
                                    <span className="detail-label">Target Entity</span>
                                    <span className="detail-value">{log.targetEntity}</span>
                                  </div>
                                  <div className="detail-item">
                                    <span className="detail-label">Target ID</span>
                                    <span className="detail-value">#{log.targetId}</span>
                                  </div>
                                  <div className="detail-item">
                                    <span className="detail-label">IP Address</span>
                                    <span className="detail-value">{log.ipAddress}</span>
                                  </div>
                                  <div className="detail-item">
                                    <span className="detail-label">Timestamp</span>
                                    <span className="detail-value">{new Date(log.timestamp).toLocaleString()}</span>
                                  </div>
                                </div>
                                {log.details && (
                                  <div className="detail-notes">
                                    <span className="detail-label">Additional Details:</span>
                                    <p>{log.details}</p>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="pagination-btn"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                  <div className="pagination-info">
                    Page {currentPage} of {totalPages}
                  </div>
                  <button
                    className="pagination-btn"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
