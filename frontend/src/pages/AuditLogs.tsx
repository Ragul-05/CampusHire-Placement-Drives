import { Fragment, useEffect, useMemo, useState } from 'react';
import { Search, Download, ChevronDown, ChevronUp, Shield } from 'lucide-react';
import '../styles/dashboard.css';
import { facultyUrl, getJson } from '../utils/api';
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

type AuditLogApi = {
  id: number;
  action: string;
  adminEmail?: string;
  userEmail?: string;
  targetEntity: string;
  targetEntityId?: string;
  targetId?: number;
  ipAddress: string;
  timestamp: string;
  details?: string;
};

export default function AuditLogs({ onNavigate }: { onNavigate?: (view: any) => void }) {
  const [logs, setLogs] = useState<AuditLog[]>([]);

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 20;

  useEffect(() => {
    loadLogs();
  }, []);

  async function loadLogs() {
    try {
      setLoading(true);
      const userRole = localStorage.getItem('role');
      const endpoint = userRole === 'FACULTY'
        ? facultyUrl('/api/faculty/audit')
        : '/api/admin/audit';
      const response = await getJson<AuditLogApi[]>(`${endpoint}${endpoint.includes('?') ? '&' : '?'}query=`);
      const normalized = (response.data || []).map((log) => ({
        id: log.id,
        action: log.action,
        userEmail: log.userEmail || log.adminEmail || 'System',
        targetEntity: log.targetEntity,
        targetId: log.targetId ?? Number(log.targetEntityId || 0),
        ipAddress: log.ipAddress,
        timestamp: log.timestamp,
        details: log.details,
      }));
      setLogs(normalized);
    } catch (err: any) {
      console.error('Failed to load audit logs', err);
    } finally {
      setLoading(false);
    }
  }

  const filteredLogs = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const fromDate = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
    const toDate = dateTo ? new Date(`${dateTo}T23:59:59.999`) : null;

    return logs.filter((log) => {
      const action = log.action.toLowerCase();
      const userEmail = log.userEmail.toLowerCase();
      const targetEntity = log.targetEntity.toLowerCase();
      const timestamp = new Date(log.timestamp);

      const matchesSearch = !normalizedSearch || (
        action.includes(normalizedSearch) ||
        userEmail.includes(normalizedSearch) ||
        targetEntity.includes(normalizedSearch)
      );
      const matchesAction = actionFilter === 'ALL' || action.includes(actionFilter.toLowerCase());
      const matchesFromDate = !fromDate || timestamp >= fromDate;
      const matchesToDate = !toDate || timestamp <= toDate;

      return matchesSearch && matchesAction && matchesFromDate && matchesToDate;
    });
  }, [logs, searchTerm, actionFilter, dateFrom, dateTo]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, actionFilter, dateFrom, dateTo]);

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

  function clearFilters() {
    setSearchTerm('');
    setActionFilter('ALL');
    setDateFrom('');
    setDateTo('');
  }

  const actionOptions = useMemo(() => {
    const options = new Set<string>();
    logs.forEach((log) => {
      const normalized = log.action.trim();
      if (normalized) {
        options.add(normalized);
      }
    });
    return ['ALL', ...Array.from(options).sort((a, b) => a.localeCompare(b))];
  }, [logs]);

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
                <div className="input-group" style={{ minWidth: 220 }}>
                  <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
                    {actionOptions.map((action) => (
                      <option key={action} value={action}>
                        {action === 'ALL' ? 'All Actions' : action}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="input-group" style={{ minWidth: 180 }}>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    aria-label="Filter logs from date"
                  />
                </div>
                <div className="input-group" style={{ minWidth: 180 }}>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    aria-label="Filter logs to date"
                  />
                </div>
                <button className="btn-secondary" type="button" onClick={clearFilters}>
                  Clear Filters
                </button>
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
                      <Fragment key={log.id}>
                        <tr
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
                      </Fragment>
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
