import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw, Users, UserCheck2, UserRound, Filter } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import FacultyLayout from '../components/FacultyLayout';
import ExportButton from '../components/ExportButton';
import { facultyUrl, getJson } from '../utils/api';
import { ExportColumn } from '../utils/exportUtils';

type OfferFilterSummary = {
  totalStudentsWithOffers: number;
  singleOfferStudents: number;
  multipleOfferStudents: number;
};

type OfferFilterRow = {
  studentId: number;
  studentName: string;
  departmentName: string;
  departmentId: number;
  offerCount: number;
  companyNames: string;
  packages: string;
};

type OfferFilterResponse = {
  summary: OfferFilterSummary;
  rows: OfferFilterRow[];
};

type OfferFilterKey = 'ALL' | 'SINGLE' | 'MULTIPLE';

const FILTER_OPTIONS: Array<{ value: OfferFilterKey; label: string }> = [
  { value: 'ALL', label: 'All Students with Offers' },
  { value: 'SINGLE', label: 'Students with 1 Offer' },
  { value: 'MULTIPLE', label: 'Students with Multiple Offers (>=2)' },
];

const PAGE_SIZE = 10;

function StatCard({ title, value, icon, tone }: { title: string; value: number; icon: JSX.Element; tone: string }) {
  return (
    <div className="pr-card" style={{ borderTopColor: tone }}>
      <div className="pr-card-icon" style={{ color: tone, background: `${tone}1a` }}>
        {icon}
      </div>
      <div>
        <div className="pr-card-title">{title}</div>
        <div className="pr-card-value">{value}</div>
        <div className="pr-card-hint">Live counts from offers data</div>
      </div>
    </div>
  );
}

export default function OfferFilterPage({ onNavigate }: { onNavigate?: (view: string) => void }) {
  const role = localStorage.getItem('role');
  const isFaculty = role === 'FACULTY';
  const Layout = isFaculty ? FacultyLayout : AdminLayout;
  const activeNav = 'offerFilters';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<OfferFilterResponse | null>(null);
  const [error, setError] = useState('');
  const [offerFilter, setOfferFilter] = useState<OfferFilterKey>('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  const loadData = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError('');

      const endpoint = isFaculty
        ? facultyUrl('/api/faculty/offer-filters', { offerFilter })
        : `/api/admin/offer-filters?offerFilter=${encodeURIComponent(offerFilter)}`;

      const response = await getJson<OfferFilterResponse>(endpoint);
      setData(response.data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load offer filters');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isFaculty, offerFilter]);

  useEffect(() => {
    loadData(false);
  }, [loadData]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      loadData(true);
    }, 30000);

    return () => window.clearInterval(timer);
  }, [loadData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [offerFilter]);

  const rows = data?.rows ?? [];
  const summary = data?.summary;
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentRows = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const exportColumns: ExportColumn[] = [
    { header: 'Student Name', key: 'studentName' },
    { header: 'Department', key: 'departmentName' },
    { header: 'Offer Count', key: 'offerCount' },
    { header: 'Companies', key: 'companyNames' },
    { header: 'Packages', key: 'packages' },
  ];

  const exportRows = useMemo(() => rows.map((row) => ({
    studentName: row.studentName,
    departmentName: row.departmentName,
    offerCount: row.offerCount,
    companyNames: row.companyNames,
    packages: row.packages,
  })), [rows]);

  const selectedFilterLabel = FILTER_OPTIONS.find((option) => option.value === offerFilter)?.label ?? 'All Students with Offers';

  return (
    <Layout activeNav={activeNav} onNavigate={onNavigate}>
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1 className="page-title">Offer Filter</h1>
            <p className="page-subtitle">Filter students by number of offers, companies, and packages</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ExportButton
              label="Export"
              disabled={!rows.length}
              opts={{
                title: 'Offer Filter Report',
                subtitle: `${selectedFilterLabel} · ${isFaculty ? 'Faculty' : 'Admin'} view`,
                filename: `offer_filter_${offerFilter.toLowerCase()}`,
                columns: exportColumns,
                rows: exportRows,
              }}
            />
            <button className="icon-btn" type="button" onClick={() => loadData(false)} disabled={loading || refreshing} title="Refresh offers">
              <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
            </button>
          </div>
        </div>

        {loading && <div className="skeleton" style={{ minHeight: 320 }} />}

        {!loading && (
          <>
            {error && (
              <div className="card" style={{ marginBottom: 16, borderLeft: '4px solid #ef4444', color: '#b91c1c' }}>
                {error}
              </div>
            )}

            <div className="card filter-section" style={{ marginBottom: 20 }}>
              <div className="filter-row">
                <div className="input-group" style={{ minWidth: 320, flex: 1 }}>
                  <Filter size={16} color="#94a3b8" />
                  <select value={offerFilter} onChange={(e) => setOfferFilter(e.target.value as OfferFilterKey)}>
                    {FILTER_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="audit-count">
                  <Users size={16} />
                  <span>{rows.length} students with offers</span>
                </div>
              </div>
            </div>

            <div className="stats-grid" style={{ marginBottom: 20 }}>
              <StatCard title="Total Students with Offers" value={summary?.totalStudentsWithOffers ?? 0} icon={<Users size={24} />} tone="#2563eb" />
              <StatCard title="Single Offer Students" value={summary?.singleOfferStudents ?? 0} icon={<UserCheck2 size={24} />} tone="#10b981" />
              <StatCard title="Multiple Offer Students" value={summary?.multipleOfferStudents ?? 0} icon={<UserRound size={24} />} tone="#7c3aed" />
            </div>

            <div className="card table-card">
              <div className="table-wrapper">
                <table className="table">
                  <thead className="sticky-header">
                    <tr>
                      <th>Student Name</th>
                      <th>Department</th>
                      <th>Number of Offers</th>
                      <th>Company Names</th>
                      <th>CTC Packages</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentRows.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                          No students match the selected offer filter
                        </td>
                      </tr>
                    ) : currentRows.map((row) => (
                      <tr key={row.studentId}>
                        <td style={{ fontWeight: 700 }}>{row.studentName}</td>
                        <td>{row.departmentName}</td>
                        <td>
                          <span className="badge success">{row.offerCount}</span>
                        </td>
                        <td style={{ whiteSpace: 'normal' }}>{row.companyNames || 'N/A'}</td>
                        <td style={{ whiteSpace: 'normal' }}>{row.packages || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="pagination-btn"
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                  <div className="pagination-info">
                    Page {currentPage} of {totalPages}
                  </div>
                  <button
                    className="pagination-btn"
                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
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
